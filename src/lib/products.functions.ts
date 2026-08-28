import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { sql } from "./db.server";

export interface Product {
  id: string | number;
  name: string;
  category: string | null;
  price: number;
  stock: number;
  description: string | null;
  image: string | null;
  barcode: string | null;
  cod: string | null;
  weight: string | null;
  origin: string | null;
  brand: string | null;
  expiry: string | null;
  active: boolean | null;
  sale_unit: string | null;
  created_at: string | null;
  updated_at: string | null;
}

export const getProducts = createServerFn({ method: "GET" })
  .handler(async () => {
    try {
      const products = await sql<Product[]>`
        SELECT * FROM products 
        ORDER BY created_at DESC
      `;
      return products;
    } catch (error) {
      console.error("Error fetching products:", error);
      throw error;
    }
  });

export const upsertProduct = createServerFn({ method: "POST" })
  .validator((data: Partial<Product>) => data)
  .handler(async ({ data }) => {
    try {
      if (data.id) {
        // Update
        const [updated] = await sql<Product[]>`
          UPDATE products SET
            name = ${data.name || null},
            category = ${data.category || null},
            price = ${data.price || 0},
            stock = ${data.stock || 0},
            description = ${data.description || null},
            image = ${data.image || null},
            barcode = ${data.barcode || null},
            cod = ${data.cod || null},
            weight = ${data.weight || null},
            origin = ${data.origin || null},
            brand = ${data.brand || null},
            expiry = ${data.expiry || null},
            active = ${data.active ?? true},
            sale_unit = ${data.sale_unit || null},
            updated_at = NOW()
          WHERE id = ${data.id}::integer
          RETURNING *
        `;
        return updated;
      } else {
        // Create
        const [created] = await sql<Product[]>`
          INSERT INTO products (
            name, category, price, stock, description, image, barcode, cod, weight, origin, brand, expiry, active, sale_unit
          ) VALUES (
            ${data.name || null}, ${data.category || null}, ${data.price || 0}, ${data.stock || 0}, ${data.description || null}, ${data.image || null}, ${data.barcode || null}, ${data.cod || null}, ${data.weight || null}, ${data.origin || null}, ${data.brand || null}, ${data.expiry || null}, ${data.active ?? true}, ${data.sale_unit || null}
          )
          RETURNING *
        `;
        return created;
      }
    } catch (error) {
      console.error("Error upserting product:", error);
      throw error;
    }
  });

export const deleteProduct = createServerFn({ method: "POST" })
  .validator((id: string | number) => id)
  .handler(async ({ data: id }) => {
    try {
      await sql`DELETE FROM products WHERE id = ${id}::integer`;
      return { success: true };
    } catch (error) {
      console.error("Error deleting product:", error);
      throw error;
    }
  });

