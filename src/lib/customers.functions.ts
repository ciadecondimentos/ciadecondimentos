import { createServerFn } from "@tanstack/react-start";
import { sql } from "./db.server";

export interface Customer {
  id: number;
  full_name: string;
  phone: string | null;
  whatsapp: string | null;
  address: string | null;
  neighborhood: string | null;
  city: string | null;
  observations: string | null;
  is_vip: boolean;
  birthday: string | null;
  credit_limit: number;
  is_inactive: boolean;
  created_at: string;
  updated_at: string;
  total_billing?: number;
  open_balance?: number;
  purchase_count?: number;
}

export interface CustomerPurchase {
  id: number;
  customer_id: number;
  product_name: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  purchase_date: string;
  payment_method: string | null;
  payment_status: string | null;
  notes: string | null;
}

export const getCustomers = createServerFn({ method: "GET" })
  .handler(async () => {
    try {
      const customers = await sql<any[]>`
        SELECT 
          c.*,
          COALESCE(p.purchase_count, 0)::text as purchase_count,
          COALESCE(p.total_billing, 0)::text as total_billing,
          COALESCE(p.open_balance, 0)::text as open_balance
        FROM crm_customers c
        LEFT JOIN (
          SELECT 
            customer_id,
            COUNT(DISTINCT purchase_date) as purchase_count,
            SUM(CASE WHEN payment_status = 'pago' THEN COALESCE(total_price, 0) ELSE 0 END) as total_billing,
            SUM(CASE WHEN payment_status != 'pago' THEN COALESCE(total_price, 0) ELSE 0 END) as open_balance
          FROM crm_purchases
          GROUP BY customer_id
        ) p ON c.id = p.customer_id
        ORDER BY c.full_name ASC
      `;
      return customers.map(c => ({
        ...c,
        purchase_count: Number(c.purchase_count || 0),
        total_billing: Number(c.total_billing || 0),
        open_balance: Number(c.open_balance || 0)
      })) as Customer[];
    } catch (error) {
      console.error("Error fetching customers:", error);
      throw error;
    }
  });

export const getCustomerStats = createServerFn({ method: "GET" })
  .handler(async () => {
    try {
      const [stats] = await sql<[{ total: string; vips: string; total_billing: string | null; open_balance: string | null }]>`
        SELECT 
          (SELECT COUNT(*) FROM crm_customers)::text as total,
          (SELECT COUNT(*) FROM crm_customers WHERE is_vip = true)::text as vips,
          (SELECT SUM(COALESCE(total_price, 0)) FROM crm_purchases WHERE payment_status = 'pago')::text as total_billing,
          (SELECT SUM(COALESCE(total_price, 0)) FROM crm_purchases WHERE payment_status != 'pago')::text as open_balance
      `;

      return {
        total: Number(stats?.total || 0),
        vips: Number(stats?.vips || 0),
        total_billing: Number(stats?.total_billing || 0),
        open_balance: Number(stats?.open_balance || 0)
      };
    } catch (error) {
      console.error("Error fetching customer stats:", error);
      throw error;
    }
  });

export const getCustomerPurchases = createServerFn({ method: "GET" })
  .validator((customerId: number) => customerId)
  .handler(async ({ data: customerId }) => {
    try {
      const purchases = await sql<CustomerPurchase[]>`
        SELECT * FROM crm_purchases 
        WHERE customer_id = ${customerId}
        ORDER BY purchase_date DESC
      `;
      return purchases;
    } catch (error) {
      console.error("Error fetching customer purchases:", error);
      throw error;
    }
  });

export const createCustomer = createServerFn({ method: "POST" })
  .validator((data: any) => data)
  .handler(async ({ data }) => {
    try {
      const result = await sql`
        INSERT INTO crm_customers (
          full_name, phone, whatsapp, address, neighborhood, city, birthday, observations, is_vip, is_inactive
        ) VALUES (
          ${data.full_name}, ${data.phone || null}, ${data.whatsapp || null}, ${data.address || null}, 
          ${data.neighborhood || null}, ${data.city || null}, ${data.birthday || null}, 
          ${data.observations || null}, ${data.is_vip || false}, false
        )
        RETURNING *
      `;
      return result[0];
    } catch (error) {
      console.error("Error creating customer:", error);
      throw error;
    }
  });

export const getSalesByPeriod = createServerFn({ method: "GET" })
  .validator((period: string) => period || 'Semana')
  .handler(async ({ data: period }) => {
    try {
      let interval = "7 days";
      let seriesInterval = "1 day";
      
      if (period === 'Mês') {
        interval = "30 days";
      } else if (period === 'Ano') {
        interval = "1 year";
        seriesInterval = "1 month";
      }

      let query;
      if (period === 'Ano') {
        query = sql`
          WITH month_series AS (
            SELECT generate_series(
              date_trunc('month', CURRENT_DATE - '11 months'::interval),
              date_trunc('month', CURRENT_DATE),
              '1 month'::interval
            )::date as month
          )
          SELECT 
            TO_CHAR(ms.month, 'Month') as date_label,
            COALESCE(SUM(p.total_price), 0)::text as value,
            EXTRACT(MONTH FROM ms.month) as sort_key
          FROM month_series ms
          LEFT JOIN crm_purchases p ON date_trunc('month', p.purchase_date) = ms.month AND p.payment_status = 'pago'
          GROUP BY ms.month
          ORDER BY ms.month ASC
        `;
      } else {
        query = sql`
          WITH date_series AS (
            SELECT generate_series(
              CURRENT_DATE - ${interval}::interval,
              CURRENT_DATE,
              '1 day'::interval
            )::date as day
          )
          SELECT 
            TO_CHAR(ds.day, 'DD') as date_label,
            COALESCE(SUM(p.total_price), 0)::text as value,
            ds.day as sort_key
          FROM date_series ds
          LEFT JOIN crm_purchases p ON p.purchase_date::date = ds.day AND p.payment_status = 'pago'
          GROUP BY ds.day
          ORDER BY ds.day ASC
        `;
      }

      const sales = await query;

      const monthNames: Record<string, string> = {
        'January': 'JANEIRO', 'February': 'FEVEREIRO', 'March': 'MARÇO',
        'April': 'ABRIL', 'May': 'MAIO', 'June': 'JUNHO',
        'July': 'JULHO', 'August': 'AGOSTO', 'September': 'SETEMBRO',
        'October': 'OUTUBRO', 'November': 'NOVEMBRO', 'December': 'DEZEMBRO'
      };

      return sales.map((s: any) => {
        let label = s.date_label.trim();
        if (period === 'Ano') {
          label = monthNames[label] || label.toUpperCase();
        }
        
        return {
          date: label,
          value: Number(s.value || 0)
        };
      });
    } catch (error) {
      console.error("Error fetching sales by period:", error);
      throw error;
    }
  });
