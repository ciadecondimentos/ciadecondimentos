import { createServerFn } from "@tanstack/react-start";
import { sql } from "./db.server";
import { z } from "zod";

const itemSchema = z.object({
  product_name: z.string(),
  quantity: z.number(),
  unit_price: z.number(),
  total_price: z.number()
});

export const registerPurchase = createServerFn({ method: "POST" })
  .validator((data: any) => z.object({
    customer_id: z.number(),
    purchase_date: z.string(),
    payment_method: z.string().nullable(),
    payment_status: z.string().nullable(),
    notes: z.string().nullable(),
    items: z.array(itemSchema)
  }).parse(data))
  .handler(async ({ data }) => {
    try {
      const results = [];
      for (const item of data.items) {
        const [inserted] = await sql`
          INSERT INTO crm_purchases (
            customer_id, product_name, quantity, unit_price, total_price, 
            purchase_date, payment_method, payment_status, notes
          ) VALUES (
            ${data.customer_id}, ${item.product_name}, ${item.quantity}, ${item.unit_price}, ${item.total_price},
            ${data.purchase_date}, ${data.payment_method}, ${data.payment_status}, ${data.notes}
          )
          RETURNING *
        `;
        results.push(inserted);
      }
      return results;
    } catch (error) {
      console.error("Error registering purchase:", error);
      throw error;
    }
  });

export const updatePurchaseGroup = createServerFn({ method: "POST" })
  .validator((data: any) => z.object({
    customer_id: z.number(),
    original_date: z.string(),
    purchase_date: z.string(),
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
      const results = [];
      for (const item of data.items) {
        const [inserted] = await sql`
          INSERT INTO crm_purchases (
            customer_id, product_name, quantity, unit_price, total_price,
            purchase_date, payment_method, payment_status, notes
          ) VALUES (
            ${data.customer_id}, ${item.product_name}, ${item.quantity}, ${item.unit_price}, ${item.total_price},
            ${data.purchase_date}, ${data.payment_method}, ${data.payment_status}, ${data.notes}
          )
          RETURNING *
        `;
        results.push(inserted);
      }
      return results;
    } catch (error) {
      console.error("Error updating purchase group:", error);
      throw error;
    }
  });
