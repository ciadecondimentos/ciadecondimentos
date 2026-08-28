import { createServerFn } from "@tanstack/react-start";
import { sql } from "./db.server";

export interface DashboardStats {
  totalVendas: number;
  receitaTotal: number;
  produtosEstoque: number;
  novosClientes: number;
  vendasTrend: string;
  receitaTrend: string;
  clientesTrend: string;
  estoqueCategorias: { label: string; value: number; color: string }[];
  ultimosPedidos: { id: string; client: string; total: number; status: string }[];
  vendasPorPeriodo: { date: string; value: number }[];
}

export interface DashboardParams {
  period: string;
  dateRange?: {
    from?: string;
    to?: string;
  };
}

export const getDashboardStats = createServerFn({ method: "GET" })
  .validator((params: DashboardParams | string) => {
    if (typeof params === 'string') return { period: params } as DashboardParams;
    return params as DashboardParams;
  })
  .handler(async ({ data: params }) => {
    try {
      const period = params.period;
      const dateRange = params.dateRange;

      // Datas resolvidas em JS: fragmentos SQL aninhados nao funcionam com o
      // cliente de conexao curta (uma conexao por query).
      const toISO = (d: Date) => d.toISOString().slice(0, 10);
      let days = 7;
      let fromStr: string;
      let toStr: string;

      if (dateRange?.from && dateRange?.to) {
        fromStr = dateRange.from;
        toStr = dateRange.to;
        const fromDate = new Date(`${fromStr}T00:00:00Z`);
        const toDate = new Date(`${toStr}T00:00:00Z`);
        days = Math.max(1, Math.ceil((toDate.getTime() - fromDate.getTime()) / (1000 * 60 * 60 * 24)));
      } else {
        days = period === '24h' ? 1 : period === '30d' ? 30 : 7;
        const today = new Date();
        toStr = toISO(today);
        fromStr = toISO(new Date(today.getTime() - days * 24 * 60 * 60 * 1000));
      }

      const prevFromStr = toISO(new Date(new Date(`${fromStr}T00:00:00Z`).getTime() - days * 24 * 60 * 60 * 1000));

      const [
        vendasResult,
        prevVendasResult,
        receitaResult,
        prevReceitaResult,
        produtosResult,
        clientesResult,
        prevClientesResult,
        ultimosPedidos,
        categorias
      ] = await Promise.all([
        sql<[{ count: string }]>`
          SELECT COUNT(DISTINCT (customer_id, purchase_date))::text as count 
          FROM crm_purchases
          WHERE purchase_date >= ${fromStr}::date AND purchase_date <= ${toStr}::date
        `,
        sql<[{ count: string }]>`
          SELECT COUNT(DISTINCT (customer_id, purchase_date))::text as count 
          FROM crm_purchases
          WHERE purchase_date >= ${prevFromStr}::date AND purchase_date < ${fromStr}::date
        `,
        sql<[{ sum: string | null }]>`
          SELECT SUM(COALESCE(total_price, 0))::text as sum 
          FROM crm_purchases
          WHERE purchase_date >= ${fromStr}::date AND purchase_date <= ${toStr}::date AND payment_status = 'pago'
        `,
        sql<[{ sum: string | null }]>`
          SELECT SUM(COALESCE(total_price, 0))::text as sum 
          FROM crm_purchases
          WHERE purchase_date >= ${prevFromStr}::date AND purchase_date < ${fromStr}::date AND payment_status = 'pago'
        `,
        sql<[{ sum: string | null }]>`SELECT SUM(COALESCE(stock, 0))::text as sum FROM products`,
        sql<[{ count: string }]>`SELECT COUNT(*)::text as count FROM crm_customers`,
        sql<[{ count: string }]>`
          SELECT COUNT(*)::text as count 
          FROM crm_customers 
          WHERE created_at < ${fromStr}::date
        `,
        sql`
          SELECT 
            p.id,
            c.full_name as client,
            p.total_price as total,
            p.payment_status as status
          FROM crm_purchases p
          JOIN crm_customers c ON p.customer_id = c.id
          ORDER BY p.purchase_date DESC, p.created_at DESC
          LIMIT 5
        `,
        sql`
          SELECT 
            category as label,
            SUM(COALESCE(stock, 0)) as total_stock
          FROM products
          WHERE category IS NOT NULL
          GROUP BY category
          ORDER BY total_stock DESC
          LIMIT 4
        `
      ]);

      const vendasCount = vendasResult[0];
      const prevVendasCount = Number(prevVendasResult[0]?.count || 0);
      const currentVendasCount = Number(vendasCount?.count || 0);
      const vendasTrend = prevVendasCount > 0 
        ? `${Math.round(((currentVendasCount - prevVendasCount) / prevVendasCount) * 100)}%`
        : "+100%";
      
      const receitaSum = receitaResult[0];
      const prevReceitaSum = Number(prevReceitaResult[0]?.sum || 0);
      const currentReceitaSum = Number(receitaSum?.sum || 0);
      const receitaTrend = prevReceitaSum > 0 
        ? `${Math.round(((currentReceitaSum - prevReceitaSum) / prevReceitaSum) * 100)}%`
        : "+100%";
      
      const produtosSum = produtosResult[0];
      const clientesCount = clientesResult[0];

      const prevClientesCount = Number(prevClientesResult[0]?.count || 0);
      const currentClientesCount = Number(clientesCount?.count || 0);
      const clientesTrend = prevClientesCount > 0
        ? `${Math.round(((currentClientesCount - prevClientesCount) / prevClientesCount) * 100)}%`
        : "+100%";

      const totalStock = Number(produtosSum?.sum || 0);
      const estoqueCategorias = categorias.map((c: any, i: number) => ({
        label: c.label,
        value: totalStock > 0 ? Math.round((Number(c.total_stock) / totalStock) * 100) : 0,
        color: ['bg-primary', 'bg-success', 'bg-secondary', 'bg-red-dark'][i] || 'bg-primary'
      }));

      let vendasPeriodoRaw;
      if (period === '24h' && !dateRange) {
        vendasPeriodoRaw = await sql`
          WITH hour_series AS (
            SELECT generate_series(
              date_trunc('hour', NOW() - '23 hours'::interval),
              date_trunc('hour', NOW()),
              '1 hour'::interval
            ) as hour
          )
          SELECT 
            TO_CHAR(hs.hour, 'HH24:MI') as date_label,
            COALESCE(SUM(p.total_price), 0)::text as value,
            hs.hour as full_date
          FROM hour_series hs
          LEFT JOIN crm_purchases p ON date_trunc('hour', p.purchase_date) = hs.hour AND p.payment_status = 'pago'
          GROUP BY hs.hour
          ORDER BY hs.hour ASC
        `;
      } else {
        const startDay = fromStr;
        const endDay = toStr;


        vendasPeriodoRaw = await sql`
          WITH date_series AS (
            SELECT generate_series(
              ${startDay}::date,
              ${endDay}::date,
              '1 day'::interval
            )::date as day
          )
          SELECT 
            TO_CHAR(ds.day, 'DD/MM') as date_label,
            COALESCE(SUM(p.total_price), 0)::text as value,
            ds.day as full_date
          FROM date_series ds
          LEFT JOIN crm_purchases p ON ds.day = p.purchase_date::date AND p.payment_status = 'pago'
          GROUP BY ds.day
          ORDER BY ds.day ASC
        `;
      }

      const vendasPorPeriodo = vendasPeriodoRaw.map((v: any) => ({
        date: v.date_label,
        value: Number(v.value || 0)
      }));

      return {
        totalVendas: currentVendasCount,
        receitaTotal: currentReceitaSum,
        produtosEstoque: totalStock,
        novosClientes: currentClientesCount,
        vendasTrend: (vendasTrend.startsWith('-') ? '' : '+') + vendasTrend, 
        receitaTrend: (receitaTrend.startsWith('-') ? '' : '+') + receitaTrend,
        clientesTrend: (clientesTrend.startsWith('-') ? '' : '+') + clientesTrend,
        estoqueCategorias,
        ultimosPedidos: ultimosPedidos.map((p: any) => ({
          id: `#${p.id}`,
          client: p.client,
          total: Number(p.total || 0),
          status: p.status === 'pago' ? 'Pago' : 'Pendente'
        })),
        vendasPorPeriodo
      } as DashboardStats;
    } catch (error) {
      console.error("Error fetching dashboard stats:", error);
      throw error;
    }
  });
