import { createServerFn } from "@tanstack/react-start";
import { sql } from "./db.server";
import { z } from "zod";

const dateLike = z
  .union([z.string(), z.date()])
  .transform((value) => (typeof value === "string" ? value.slice(0, 10) : value.toISOString().slice(0, 10)));

const itemSchema = z.object({
  product_name: z.string(),
  quantity: z.number(),
  unit_price: z.number(),
  total_price: z.number()
});

export const registerPurchase = createServerFn({ method: "POST" })
  .validator((data: any) => z.object({
    customer_id: z.number(),
    purchase_date: dateLike,
    payment_method: z.string().nullable(),
    payment_status: z.string().nullable(),
    notes: z.string().nullable(),
    items: z.array(itemSchema)
  }).parse(data))
  .handler(async ({ data }) => {
    try {
      const ids: number[] = [];
      for (const item of data.items) {
        const rows = await sql<{ id: number }[]>`
          INSERT INTO crm_purchases (
            customer_id, product_name, quantity, unit_price, total_price, 
            purchase_date, payment_method, payment_status, notes
          ) VALUES (
            ${data.customer_id}, ${item.product_name}, ${item.quantity}, ${item.unit_price}, ${item.total_price},
            ${data.purchase_date}, ${data.payment_method}, ${data.payment_status}, ${data.notes}
          )
          RETURNING id
        `;
        if (rows[0]) ids.push(Number(rows[0].id));
      }
      return { success: true, ids };
    } catch (error) {
      console.error("Error registering purchase:", error);
      throw error;
    }
  });

export const updatePurchaseGroup = createServerFn({ method: "POST" })
  .validator((data: any) => z.object({
    customer_id: z.number(),
    original_date: dateLike,
    purchase_date: dateLike,
    payment_method: z.string().nullable(),
    payment_status: z.string().nullable(),
    notes: z.string().nullable(),
    items: z.array(itemSchema).min(1)
  }).parse(data))
  .handler(async ({ data }) => {
    try {
      // Remove os itens antigos do pedido (mesmo cliente e data) e reinsere com os novos valores
      await sql`
        DELETE FROM crm_purchases
        WHERE customer_id = ${data.customer_id}
          AND purchase_date::date = ${data.original_date}::date
      `;
      const ids: number[] = [];
      for (const item of data.items) {
        const rows = await sql<{ id: number }[]>`
          INSERT INTO crm_purchases (
            customer_id, product_name, quantity, unit_price, total_price,
            purchase_date, payment_method, payment_status, notes
          ) VALUES (
            ${data.customer_id}, ${item.product_name}, ${item.quantity}, ${item.unit_price}, ${item.total_price},
            ${data.purchase_date}, ${data.payment_method}, ${data.payment_status}, ${data.notes}
          )
          RETURNING id
        `;
        if (rows[0]) ids.push(Number(rows[0].id));
      }
      return { success: true, ids };
    } catch (error) {
      console.error("Error updating purchase group:", error);
      throw error;
    }
  });
