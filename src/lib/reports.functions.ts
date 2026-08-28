import { createServerFn } from "@tanstack/react-start";
import { sql } from "./db.server";

export const getReportsSummary = createServerFn({ method: "GET" })
  .handler(async () => {
    const [stats] = await sql<any>`
      SELECT 
        (SELECT COUNT(DISTINCT purchase_date) FROM crm_purchases)::text as total_orders,
        (SELECT SUM(COALESCE(total_price, 0)) FROM crm_purchases WHERE payment_status = 'pago')::text as total_revenue,
        (SELECT COUNT(*) FROM crm_customers)::text as total_customers,
        (SELECT COUNT(*) FROM products)::text as total_products
    `;

    return {
      totalOrders: Number(stats?.total_orders || 0),
      totalRevenue: Number(stats?.total_revenue || 0),
      totalCustomers: Number(stats?.total_customers || 0),
      totalProducts: Number(stats?.total_products || 0),
    };
  });

export const getOrdersSummaryTable = createServerFn({ method: "GET" })
  .handler(async () => {
    const orders = await sql<any>`
      SELECT 
        p.purchase_date as date,
        COUNT(p.id) as item_count,
        SUM(p.total_price) as total_amount,
        c.full_name as customer_name,
        p.payment_status
      FROM crm_purchases p
      JOIN crm_customers c ON p.customer_id = c.id
      GROUP BY p.purchase_date, c.full_name, p.payment_status
      ORDER BY p.purchase_date DESC
      LIMIT 10
    `;

    return orders.map((o: any) => ({
      date: new Date(o.date).toLocaleDateString('pt-BR'),
      customer: o.customer_name,
      items: Number(o.item_count),
      total: Number(o.total_amount),
      status: o.payment_status || 'Pendente'
    }));
  });
