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
}

export const getOrders = createServerFn({ method: "GET" })
  .handler(async () => {
    try {
      // Agrupamos itens da mesma compra (mesmo cliente e data) para mostrar como um "pedido"
      // ou se houver um ID único de pedido no futuro, usaremos ele.
      // Atualmente, crm_purchases parece tratar cada linha como um item de venda.
      
      const orders = await sql`
        SELECT 
          p.id,
          c.full_name as client,
          p.purchase_date as date,
          p.total_price as total,
          p.payment_method as payment,
          p.payment_status as payment_status,
          p.payment_status as order_status -- Usando status de pagamento como status de pedido por enquanto
        FROM crm_purchases p
        JOIN crm_customers c ON p.customer_id = c.id
        ORDER BY p.purchase_date DESC, p.created_at DESC
      `;
      
      return orders.map((o: any) => ({
        id: o.id,
        client: o.client,
        date: o.date ? new Date(o.date).toISOString() : new Date().toISOString(),
        total: Number(o.total || 0),
        payment: o.payment || "Não informado",
        payment_status: o.payment_status === 'pago' ? 'Aprovado' : (o.payment_status === 'cancelado' ? 'Cancelado' : 'Pendente'),
        order_status: o.payment_status === 'pago' ? 'Pago' : (o.payment_status === 'cancelado' ? 'Cancelado' : 'Pendente')
      })) as Order[];
    } catch (error) {
      console.error("Error fetching orders:", error);
      throw error;
    }
  });
