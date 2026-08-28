-- Create finance_transactions table for manual entry
CREATE TABLE IF NOT EXISTS public.finance_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  type VARCHAR(10) NOT NULL CHECK (type IN ('Entrada', 'Saída')),
  category VARCHAR(100),
  description TEXT,
  value DECIMAL(12, 2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Grant access
GRANT SELECT, INSERT, UPDATE, DELETE ON public.finance_transactions TO authenticated;
GRANT ALL ON public.finance_transactions TO service_role;

-- Enable RLS
ALTER TABLE public.finance_transactions ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Allow authenticated read" ON public.finance_transactions FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow authenticated insert" ON public.finance_transactions FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Allow authenticated update" ON public.finance_transactions FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Allow authenticated delete" ON public.finance_transactions FOR DELETE TO authenticated USING (true);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_finance_transactions_date ON public.finance_transactions(date);
CREATE INDEX IF NOT EXISTS idx_finance_transactions_type ON public.finance_transactions(type);
