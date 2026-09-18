import { createServerFn } from "@tanstack/react-start";
import { sql } from "./db.server";

export interface Supplier {
  id: number;
  company_name: string;
  contact_name: string | null;
  phone: string | null;
  whatsapp: string | null;
  email: string | null;
  address: string | null;
  neighborhood: string | null;
  city: string | null;
  cnpj: string | null;
  observations: string | null;
  is_active: boolean;
  total_purchased: number;
  open_balance: number;
  purchase_count: number;
}

export interface SupplierPurchase {
  id: number;
  supplier_id: number;
  product_name: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  purchase_date: string;
  payment_method: string | null;
  payment_status: string | null;
  notes: string | null;
}

const PAID = "pago";

export const getSuppliers = createServerFn({ method: "GET" })
  .validator((data: { from?: string | null; to?: string | null } | undefined) => data ?? {})
  .handler(async ({ data }) => {
  const from = data?.from || null;
  const to = data?.to || null;
  const rows = await sql<any[]>`
    SELECT
      s.*,
      COALESCE(p.purchase_count, 0)::text AS purchase_count,
      COALESCE(p.total_purchased, 0)::text AS total_purchased,
      COALESCE(p.open_balance, 0)::text AS open_balance
    FROM suppliers s
    LEFT JOIN (
      SELECT
        supplier_id,
        COUNT(*) AS purchase_count,
        SUM(COALESCE(total_price, 0)) AS total_purchased,
        SUM(CASE WHEN COALESCE(payment_status, '') <> ${PAID} THEN COALESCE(total_price, 0) ELSE 0 END) AS open_balance
      FROM supplier_purchases
      WHERE (${from}::date IS NULL OR purchase_date >= ${from}::date)
        AND (${to}::date IS NULL OR purchase_date <= ${to}::date)
      GROUP BY supplier_id
    ) p ON p.supplier_id = s.id
    ORDER BY s.company_name ASC
  `;

  return rows.map((r) => ({
    ...r,
    purchase_count: Number(r.purchase_count || 0),
    total_purchased: Number(r.total_purchased || 0),
    open_balance: Number(r.open_balance || 0),
  })) as Supplier[];
});

export const getSupplierStats = createServerFn({ method: "GET" }).handler(async () => {
  const [stats] = await sql<any[]>`
    SELECT
      (SELECT COUNT(*) FROM suppliers)::text AS total,
      (SELECT COALESCE(SUM(total_price), 0) FROM supplier_purchases)::text AS total_purchased,
      (SELECT COALESCE(SUM(total_price), 0) FROM supplier_purchases WHERE COALESCE(payment_status, '') <> ${PAID})::text AS open_balance,
      (SELECT COUNT(DISTINCT supplier_id) FROM supplier_purchases WHERE COALESCE(payment_status, '') <> ${PAID})::text AS in_debt
  `;
  return {
    total: Number(stats?.total || 0),
    total_purchased: Number(stats?.total_purchased || 0),
    open_balance: Number(stats?.open_balance || 0),
    in_debt: Number(stats?.in_debt || 0),
  };
});

export const getSupplierPurchases = createServerFn({ method: "GET" })
  .validator((supplierId: number) => supplierId)
  .handler(async ({ data: supplierId }) => {
    const rows = await sql<any[]>`
      SELECT * FROM supplier_purchases
      WHERE supplier_id = ${supplierId}
      ORDER BY purchase_date DESC, id DESC
    `;
    return rows.map((r) => ({
      ...r,
      quantity: Number(r.quantity || 0),
      unit_price: Number(r.unit_price || 0),
      total_price: Number(r.total_price || 0),
      purchase_date: typeof r.purchase_date === "string" ? r.purchase_date : new Date(r.purchase_date).toISOString().slice(0, 10),
    })) as SupplierPurchase[];
  });

export const createSupplier = createServerFn({ method: "POST" })
  .validator((data: any) => data)
  .handler(async ({ data }) => {
    const rows = await sql<any[]>`
      INSERT INTO suppliers (company_name, contact_name, phone, whatsapp, email, address, neighborhood, city, cnpj, observations, is_active)
      VALUES (
        ${data.company_name}, ${data.contact_name || null}, ${data.phone || null}, ${data.whatsapp || null},
        ${data.email || null}, ${data.address || null}, ${data.neighborhood || null}, ${data.city || null},
        ${data.cnpj || null}, ${data.observations || null}, ${data.is_active ?? true}
      )
      RETURNING *
    `;
    return rows[0];
  });

export const updateSupplier = createServerFn({ method: "POST" })
  .validator((data: any) => data)
  .handler(async ({ data }) => {
    const rows = await sql<any[]>`
      UPDATE suppliers SET
        company_name = ${data.company_name},
        contact_name = ${data.contact_name || null},
        phone = ${data.phone || null},
        whatsapp = ${data.whatsapp || null},
        email = ${data.email || null},
        address = ${data.address || null},
        neighborhood = ${data.neighborhood || null},
        city = ${data.city || null},
        cnpj = ${data.cnpj || null},
        observations = ${data.observations || null},
        is_active = ${data.is_active ?? true},
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ${data.id}
      RETURNING *
    `;
    return rows[0];
  });

export const deleteSupplier = createServerFn({ method: "POST" })
  .validator((id: number) => id)
  .handler(async ({ data: id }) => {
    await sql`DELETE FROM supplier_purchases WHERE supplier_id = ${id}`;
    await sql`DELETE FROM suppliers WHERE id = ${id}`;
    return { success: true };
  });

export const createSupplierPurchase = createServerFn({ method: "POST" })
  .validator((data: any) => data)
  .handler(async ({ data }) => {
    const quantity = Number(data.quantity) || 1;
    const unitPrice = Number(data.unit_price) || 0;
    const total = Number(data.total_price) || quantity * unitPrice;
    const rows = await sql<any[]>`
      INSERT INTO supplier_purchases (supplier_id, product_name, quantity, unit_price, total_price, purchase_date, payment_method, payment_status, notes)
      VALUES (
        ${data.supplier_id}, ${data.product_name}, ${quantity}, ${unitPrice}, ${total},
        ${data.purchase_date || new Date().toISOString().slice(0, 10)},
        ${data.payment_method || null}, ${data.payment_status || "pendente"}, ${data.notes || null}
      )
      RETURNING *
    `;
    return rows[0];
  });

export const setSupplierPurchasePaid = createServerFn({ method: "POST" })
  .validator((id: number) => id)
  .handler(async ({ data: id }) => {
    await sql`UPDATE supplier_purchases SET payment_status = ${PAID}, updated_at = CURRENT_TIMESTAMP WHERE id = ${id}`;
    return { success: true };
  });

export const deleteSupplierPurchase = createServerFn({ method: "POST" })
  .validator((id: number) => id)
  .handler(async ({ data: id }) => {
    await sql`DELETE FROM supplier_purchases WHERE id = ${id}`;
    return { success: true };
  });
