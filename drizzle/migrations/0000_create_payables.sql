CREATE TABLE IF NOT EXISTS public.payables (
  id SERIAL PRIMARY KEY,
  description TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'Despesas',
  value NUMERIC(12,2) NOT NULL DEFAULT 0,
  due_date DATE NOT NULL,
  status TEXT NOT NULL DEFAULT 'pendente',
  paid_at TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.payables TO authenticated;
GRANT ALL ON public.payables TO service_role;
GRANT USAGE, SELECT ON SEQUENCE public.payables_id_seq TO authenticated;
GRANT ALL ON SEQUENCE public.payables_id_seq TO service_role;

ALTER TABLE public.payables ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated manage payables" ON public.payables
  FOR ALL TO authenticated USING (true) WITH CHECK (true);