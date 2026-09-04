import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { sql } from "./db.server";

export interface CreateOrderParams {
  customerId?: string | number;
  customerName: string;
  items: {
    productId: string | number;
    name: string;
    quantity: number;
    price: number;
    unit: string;
  }[];
  total: number;
  paymentMethod: 'pix' | 'money' | 'card';
  status: 'pending' | 'completed';
  paymentStatus?: 'pago' | 'pendente';
}


export const createStoreOrder = createServerFn({ method: "POST" })
  .validator((data: CreateOrderParams) => data)
  .handler(async ({ data }) => {
    try {
      const purchaseDate = new Date().toISOString();
      
      // Attempt to find or create customer
      let customerId = data.customerId;
      
      if (!customerId) {
        const [existingCustomer] = await sql`
          SELECT id FROM crm_customers 
          WHERE full_name = ${data.customerName}
          LIMIT 1
        `;
        
        if (existingCustomer) {
          customerId = existingCustomer.id;
        } else {
          const [newCustomer] = await sql`
            INSERT INTO crm_customers (full_name, created_at)
            VALUES (${data.customerName}, NOW())
            RETURNING id
          `;
          customerId = newCustomer.id;
        }
      }
      
      // We'll record it in crm_purchases. 
      // If there are multiple items, we'll join them in product_name for now to match the existing schema
      const productDetails = data.items.map(item => `${item.name} (${item.quantity}${item.unit})`).join(', ');
      
      const [newPurchase] = await sql`
        INSERT INTO crm_purchases (
          customer_id,
          product_name,
          purchase_date,
          total_price,
          amount,
          payment_method,
          payment_status,
          created_at
        ) VALUES (
          ${customerId},
          ${productDetails},
          ${purchaseDate},
          ${data.total},
          ${data.total}, -- 'amount' seems to be used as total in some places
          ${data.paymentMethod},
          ${data.paymentStatus ?? 'pendente'},
          NOW()
        )
        RETURNING *
      `;
      
      return newPurchase;
    } catch (error) {
      console.error("Error creating store order:", error);
      throw error;
    }
  });

export const markStoreOrderPaid = createServerFn({ method: "POST" })
  .validator((data: { purchaseId: string | number }) => data)
  .handler(async ({ data }) => {
    const [updated] = await sql`
      UPDATE crm_purchases
      SET payment_status = 'pago'
      WHERE id = ${data.purchaseId}
      RETURNING id, payment_status
    `;
    return updated ?? null;
  });

