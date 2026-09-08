import { createServerFn } from "@tanstack/react-start";
import { sql } from "./db.server";

export interface Order {
  id: number;
  client: string;
  date: string;
  total: number;
  payment: string | null;
  payment_status: string | null;
  order_status: string | null;
  items: string | null;
  address: string | null;
  location: string | null;
}

export const getOrders = createServerFn({ method: "GET" })
  .handler(async () => {
    try {
      const orders = await sql`
        SELECT 
          p.id,
          c.full_name as client,
          p.purchase_date as date,
          p.total_price as total,
          p.payment_method as payment,
          p.payment_status as payment_status,
          p.product_name as items,
          p.delivery_address as address,
          p.delivery_location as location
        FROM crm_purchases p
        JOIN crm_customers c ON p.customer_id = c.id
        WHERE p.source = 'loja'
        ORDER BY p.created_at DESC, p.id DESC
      `;
      
      return orders.map((o: any) => ({
        id: o.id,
        client: o.client,
        date: o.date ? new Date(o.date).toISOString() : new Date().toISOString(),
        total: Number(o.total || 0),
        payment: o.payment || "Não informado",
        payment_status: o.payment_status === 'pago' ? 'Aprovado' : (o.payment_status === 'cancelado' ? 'Cancelado' : 'Pendente'),
        order_status: o.payment_status === 'pago' ? 'Pago' : (o.payment_status === 'cancelado' ? 'Cancelado' : 'Pendente'),
        items: o.items || null,
        address: o.address || null,
        location: o.location || null,
      })) as Order[];
    } catch (error) {
      console.error("Error fetching orders:", error);
      throw error;
    }
  });

