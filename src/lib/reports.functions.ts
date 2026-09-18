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

const MONTHS_PT = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

export const getReportsCharts = createServerFn({ method: "GET" })
  .handler(async () => {
    // Faturamento diário (últimos 30 dias) para semanal e mensal
    const daily = await sql<any>`
      SELECT purchase_date::text as day, SUM(COALESCE(total_price, 0))::text as total
      FROM crm_purchases
      WHERE payment_status = 'pago'
        AND purchase_date >= (CURRENT_DATE - INTERVAL '29 days')
      GROUP BY purchase_date
      ORDER BY purchase_date
    `;

    const dailyMap = new Map<string, number>();
    for (const row of daily) {
      dailyMap.set(String(row.day).slice(0, 10), Number(row.total || 0));
    }

    const buildDays = (count: number) => {
      const out: { label: string; total: number }[] = [];
      const today = new Date();
      for (let i = count - 1; i >= 0; i--) {
        const d = new Date(today.getFullYear(), today.getMonth(), today.getDate() - i);
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
        out.push({
          label: `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}`,
          total: dailyMap.get(key) || 0,
        });
      }
      return out;
    };

    // Faturamento por mês desde o primeiro registro
    const monthly = await sql<any>`
      SELECT
        EXTRACT(YEAR FROM purchase_date)::int as year,
        EXTRACT(MONTH FROM purchase_date)::int as month,
        SUM(COALESCE(total_price, 0))::text as total
      FROM crm_purchases
      WHERE payment_status = 'pago'
      GROUP BY 1, 2
      ORDER BY 1, 2
    `;

    const monthMap = new Map<string, number>();
    for (const row of monthly) {
      monthMap.set(`${row.year}-${row.month}`, Number(row.total || 0));
    }

    const yearly: { label: string; total: number }[] = [];
    if (monthly.length > 0) {
      const first = monthly[0];
      const last = monthly[monthly.length - 1];
      let y = Number(first.year);
      let m = Number(first.month);
      const endY = Number(last.year);
      const endM = Number(last.month);
      while (y < endY || (y === endY && m <= endM)) {
        yearly.push({
          label: `${MONTHS_PT[m - 1]}/${String(y).slice(2)}`,
          total: monthMap.get(`${y}-${m}`) || 0,
        });
        m++;
        if (m > 12) { m = 1; y++; }
      }
    }

    return {
      weekly: buildDays(7),
      monthly: buildDays(30),
      yearly,
    };
  });
