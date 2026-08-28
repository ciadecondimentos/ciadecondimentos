import { createServerFn } from "@tanstack/react-start";
import { sql } from "./db.server";
import { z } from "zod";


export type FinanceParams = {
  dateFrom?: string;
  dateTo?: string;
  type?: string;
  category?: string;
};

export type FinanceChartData = {
  date: string;
  entradas: number;
  saidas: number;
  lucro: number;
};

export const getFinanceChartData = createServerFn({ method: "GET" })
  .inputValidator((data: unknown) =>
    z.object({
      dateFrom: z.string().optional(),
      dateTo: z.string().optional(),
    }).parse(data ?? {}),
  )
  .handler(async ({ data: params }) => {
    const fromStr = params.dateFrom || '2026-08-18';
    const toStr = params.dateTo || new Date().toISOString().split('T')[0];

    // Buscar entradas (compras pagas)
    const entries = await sql<any[]>`
      SELECT 
        CAST(purchase_date AS DATE) as date,
        SUM(total_price) as value
      FROM public.crm_purchases
      WHERE purchase_date >= ${fromStr}::date AND purchase_date <= ${toStr}::date AND payment_status = 'pago'
      GROUP BY CAST(purchase_date AS DATE)
    `;

    // Buscar entradas manuais
    const manualEntries = await sql<any[]>`
      SELECT 
        CAST(date AS DATE) as date,
        SUM(value) as value
      FROM public.finance_transactions
      WHERE date >= ${fromStr}::date AND date <= ${toStr}::date AND type = 'Entrada'
      GROUP BY CAST(date AS DATE)
    `;

    // Buscar saídas manuais
    const manualExits = await sql<any[]>`
      SELECT 
        CAST(date AS DATE) as date,
        SUM(value) as value
      FROM public.finance_transactions
      WHERE date >= ${fromStr}::date AND date <= ${toStr}::date AND type = 'Saída'
      GROUP BY CAST(date AS DATE)
    `;

    // Buscar custos de entrega (saídas)
    const deliveryExits = await sql<any[]>`
      WITH daily_delivery AS (
        SELECT 
          CAST(purchase_date AS DATE) as date,
          customer_id,
          MAX(delivery_cost) as delivery_cost
        FROM public.crm_purchases
        WHERE purchase_date >= ${fromStr}::date AND purchase_date <= ${toStr}::date AND delivery_cost > 0
        GROUP BY CAST(purchase_date AS DATE), customer_id
      )
      SELECT 
        date,
        SUM(delivery_cost) as value
      FROM daily_delivery
      GROUP BY date
    `;

    // Combinar tudo por data
    const chartMap = new Map<string, { entries: number; exits: number }>();

    const allDates = new Set([
      ...entries.map(e => e.date.toISOString().split('T')[0]),
      ...manualEntries.map(e => e.date.toISOString().split('T')[0]),
      ...manualExits.map(e => e.date.toISOString().split('T')[0]),
      ...deliveryExits.map(e => e.date.toISOString().split('T')[0]),
    ]);

    allDates.forEach(date => {
      chartMap.set(date, { entries: 0, exits: 0 });
    });

    entries.forEach(e => {
      const d = e.date.toISOString().split('T')[0];
      const val = chartMap.get(d)!;
      val.entries += Number(e.value || 0);
    });

    manualEntries.forEach(e => {
      const d = e.date.toISOString().split('T')[0];
      const val = chartMap.get(d)!;
      val.entries += Number(e.value || 0);
    });

    manualExits.forEach(e => {
      const d = e.date.toISOString().split('T')[0];
      const val = chartMap.get(d)!;
      val.exits += Number(e.value || 0);
    });

    deliveryExits.forEach(e => {
      const d = e.date.toISOString().split('T')[0];
      const val = chartMap.get(d)!;
      val.exits += Number(e.value || 0);
    });

    return Array.from(chartMap.entries())
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([date, val]) => {
        const [y, m, d] = date.split('-');
        return {
          date: `${d}/${m}`,
          entradas: val.entries,
          saidas: val.exits,
          lucro: val.entries - val.exits
        };
      });
  });


export const getFinanceStats = createServerFn({ method: "GET" })
  .inputValidator((data: unknown) =>
    z.object({
      dateFrom: z.string().optional(),
      dateTo: z.string().optional(),
      type: z.string().optional(),
      category: z.string().optional(),
    }).parse(data ?? {}),
  )
  .handler(async ({ data: params }) => {
    const fromStr = params.dateFrom || '2026-08-18';
    const toStr = params.dateTo || new Date().toISOString().split('T')[0];

    const manualStats = await sql<any>`
      SELECT
        COALESCE(SUM(CASE WHEN type = 'Entrada' THEN value ELSE 0 END), 0) as total_entries,
        COALESCE(SUM(CASE WHEN type = 'Saída' THEN value ELSE 0 END), 0) as total_exits
      FROM public.finance_transactions
      WHERE date >= ${fromStr}::date AND date <= ${toStr}::date
    `;

    const purchaseStats = await sql<any>`
      WITH daily_purchases AS (
        SELECT 
          purchase_date,
          customer_id,
          SUM(total_price) as total_price,
          MAX(delivery_cost) as delivery_cost
        FROM public.crm_purchases
        WHERE purchase_date >= ${fromStr}::date AND purchase_date <= ${toStr}::date
        GROUP BY purchase_date, customer_id
      )
      SELECT
        COALESCE(SUM(total_price), 0) as total_entries,
        COALESCE(SUM(delivery_cost), 0) as total_delivery
      FROM daily_purchases
    `;

    const totalEntries = Number(manualStats[0]?.total_entries || 0) + Number(purchaseStats[0]?.total_entries || 0);
    const totalExits = Number(manualStats[0]?.total_exits || 0) + Number(purchaseStats[0]?.total_delivery || 0);

    return {
      totalEntries,
      totalExits,
      netBalance: totalEntries - totalExits,
    };
  });

export const getFinanceTransactions = createServerFn({ method: "GET" })
  .inputValidator((data: unknown) =>
    z.object({
      dateFrom: z.string().optional(),
      dateTo: z.string().optional(),
      type: z.string().optional(),
      category: z.string().optional(),
    }).parse(data ?? {}),
  )
  .handler(async ({ data: params }) => {
    const fromStr = params.dateFrom || '2026-08-18';
    const toStr = params.dateTo || new Date().toISOString().split('T')[0];

    // Buscar transações manuais
    const manualTransactions = await sql<any>`
      SELECT id, date, type, category, description, value, 'manual' as source, NULL as delivery_cost
      FROM public.finance_transactions
      WHERE date >= ${fromStr}::date AND date <= ${toStr}::date
    `;

    // Buscar compras de clientes que representam entradas
    // Agrupamos por data e cliente para evitar duplicidade de frete se houver vários itens
    // Mas somamos o valor total dos itens. O delivery_cost é por compra.
    const purchaseTransactions = await sql<any>`
      SELECT 
        MIN(p.id) as id, 
        ARRAY_AGG(p.id) as purchase_ids,
        p.purchase_date as date, 
        'Entrada' as type, 
        'Vendas' as category, 
        c.full_name as description, 
        SUM(p.total_price) as value,
        'purchase' as source,
        MAX(COALESCE(p.delivery_cost, 0)) as delivery_cost
      FROM public.crm_purchases p
      JOIN public.crm_customers c ON p.customer_id = c.id
      WHERE p.purchase_date >= ${fromStr}::date AND p.purchase_date <= ${toStr}::date
      GROUP BY p.purchase_date, c.full_name
    `;

    const allTransactions = [...manualTransactions, ...purchaseTransactions];

    return allTransactions
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .map((t: any) => {
        const rawDate = typeof t.date === "string"
          ? t.date.slice(0, 10)
          : new Date(t.date).toISOString().slice(0, 10);
        const [year, month, day] = rawDate.split("-");

        return {
          id: `${t.source}-${t.id}-${rawDate}`,
          realId: t.id,
          purchaseIds: Array.isArray(t.purchase_ids) ? t.purchase_ids.map((v: any) => Number(v)) : [],
          date: day && month && year ? `${day}/${month}/${year}` : rawDate,
          type: t.type,
          category: t.category,
          description: t.description,
          value: Number(t.value || 0),
          delivery_cost: Number(t.delivery_cost || 0),
          rawDate,
          source: t.source
        };
      })
      .slice(0, 300);
  });

export const updateDeliveryCost = createServerFn({ method: "POST" })
  .inputValidator((data) => z.object({
    purchaseIds: z.array(z.number().int().positive()).min(1),
    deliveryCost: z.number().finite().min(0)
  }).parse(data))
  .handler(async ({ data }) => {
    const uniquePurchaseIds = [...new Set(data.purchaseIds)];
    let updatedCount = 0;

    // Each sale item has its own integer ID. Updating them individually avoids
    // PostgreSQL interpreting a single ID (for example, 3295) as an array literal.
    for (const purchaseId of uniquePurchaseIds) {
      const updatedRows = await sql<Array<{ id: number }>>`
        UPDATE public.crm_purchases
        SET delivery_cost = ${data.deliveryCost}
        WHERE id = ${purchaseId}
        RETURNING id
      `;
      updatedCount += updatedRows.length;
    }

    return { success: updatedCount > 0, count: updatedCount };
  });

export const createFinanceTransaction = createServerFn({ method: "POST" })
  .inputValidator((data) =>
    z
      .object({
        date: z.string(),
        type: z.enum(["Entrada", "Saída"]),
        category: z.string(),
        description: z.string(),
        value: z.number(),
      })
      .parse(data),
  )
  .handler(async ({ data }) => {
    await sql`
      INSERT INTO public.finance_transactions (date, type, category, description, value)
      VALUES (${data.date}, ${data.type}, ${data.category}, ${data.description}, ${data.value})
    `;
    return { success: true };
  });

export const deleteFinanceTransaction = createServerFn({ method: "POST" })
  .inputValidator((data) => z.object({ id: z.string() }).parse(data))
  .handler(async ({ data }) => {
    await sql`DELETE FROM public.finance_transactions WHERE id = ${data.id.replace('manual-', '').split('-')[0]}::int`;
    return { success: true };
  });
