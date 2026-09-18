import { createServerFn } from "@tanstack/react-start";
import { sql } from "./db.server";
import { z } from "zod";

export interface Payable {
  id: number;
  description: string;
  category: string;
  value: number;
  dueDate: string;
  dueDateLabel: string;
  status: string;
  notes: string | null;
  daysUntilDue: number;
}

function toRawDate(value: any): string {
  if (typeof value === "string") return value.slice(0, 10);
  return new Date(value).toISOString().slice(0, 10);
}

function mapRow(row: any): Payable {
  const rawDate = toRawDate(row.due_date);
  const [y, m, d] = rawDate.split("-");
  const today = new Date().toISOString().slice(0, 10);
  const diff = Math.round(
    (new Date(`${rawDate}T00:00:00Z`).getTime() - new Date(`${today}T00:00:00Z`).getTime()) /
      86400000,
  );

  return {
    id: Number(row.id),
    description: row.description,
    category: row.category,
    value: Number(row.value || 0),
    dueDate: rawDate,
    dueDateLabel: `${d}/${m}/${y}`,
    status: row.status,
    notes: row.notes ?? null,
    daysUntilDue: diff,
  };
}

export const getPayables = createServerFn({ method: "GET" }).handler(async () => {
  const rows = await sql<any[]>`
    SELECT id, description, category, value, due_date, status, notes
    FROM public.payables
    ORDER BY status ASC, due_date ASC
  `;
  return rows.map(mapRow);
});

export const createPayable = createServerFn({ method: "POST" })
  .inputValidator((data) =>
    z
      .object({
        description: z.string().min(1),
        category: z.string().min(1),
        value: z.number().finite().min(0),
        dueDate: z.string(),
        notes: z.string().optional(),
      })
      .parse(data),
  )
  .handler(async ({ data }) => {
    await sql`
      INSERT INTO public.payables (description, category, value, due_date, notes)
      VALUES (${data.description}, ${data.category}, ${data.value}, ${data.dueDate}::date, ${data.notes ?? null})
    `;
    return { success: true };
  });

export const updatePayable = createServerFn({ method: "POST" })
  .inputValidator((data) =>
    z
      .object({
        id: z.number().int().positive(),
        description: z.string().min(1),
        category: z.string().min(1),
        value: z.number().finite().min(0),
        dueDate: z.string(),
        notes: z.string().optional(),
      })
      .parse(data),
  )
  .handler(async ({ data }) => {
    await sql`
      UPDATE public.payables
      SET description = ${data.description},
          category = ${data.category},
          value = ${data.value},
          due_date = ${data.dueDate}::date,
          notes = ${data.notes ?? null}
      WHERE id = ${data.id}
    `;
    return { success: true };
  });

export const deletePayable = createServerFn({ method: "POST" })
  .inputValidator((data) => z.object({ id: z.number().int().positive() }).parse(data))
  .handler(async ({ data }) => {
    await sql`DELETE FROM public.payables WHERE id = ${data.id}`;
    return { success: true };
  });

// Registra a saída no fluxo de caixa usando a data de vencimento da conta
// e marca a conta como paga.
async function postPayable(row: any) {
  const rawDate = toRawDate(row.due_date);
  await sql`
    INSERT INTO public.finance_transactions (date, type, category, description, value)
    VALUES (${rawDate}::date, 'Saída', ${row.category}, ${row.description}, ${Number(row.value || 0)})
  `;
  await sql`
    UPDATE public.payables SET status = 'pago', paid_at = now() WHERE id = ${row.id}
  `;
}

export const payPayable = createServerFn({ method: "POST" })
  .inputValidator((data) => z.object({ id: z.number().int().positive() }).parse(data))
  .handler(async ({ data }) => {
    const rows = await sql<any[]>`
      SELECT id, description, category, value, due_date FROM public.payables
      WHERE id = ${data.id} AND status = 'pendente'
    `;
    const row = rows[0];
    if (!row) return { success: false };
    await postPayable(row);
    return { success: true };
  });

// Lança automaticamente todas as contas cujo vencimento já chegou.
export const processDuePayables = createServerFn({ method: "POST" }).handler(async () => {
  const today = new Date().toISOString().slice(0, 10);
  const due = await sql<any[]>`
    SELECT id, description, category, value, due_date
    FROM public.payables
    WHERE status = 'pendente' AND due_date <= ${today}::date
    ORDER BY due_date ASC
  `;

  const posted: Array<{ description: string; value: number; dueDate: string }> = [];
  for (const row of due) {
    await postPayable(row);
    posted.push({
      description: row.description,
      value: Number(row.value || 0),
      dueDate: toRawDate(row.due_date),
    });
  }
  return { posted };
});
