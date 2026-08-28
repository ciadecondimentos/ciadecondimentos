-- Create products table
CREATE TABLE IF NOT EXISTS public.products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  category VARCHAR(100),
  price DECIMAL(10, 2) NOT NULL,
  stock INT NOT NULL DEFAULT 0,
  description TEXT,
  image TEXT,
  barcode VARCHAR(50),
  cod VARCHAR(100),
  weight VARCHAR(100),
  origin VARCHAR(100),
  brand VARCHAR(255),
  expiry VARCHAR(50),
  active BOOLEAN DEFAULT true,
  sale_unit VARCHAR(10) DEFAULT 'un',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Grant access to authenticated and service_role
GRANT SELECT, INSERT, UPDATE, DELETE ON public.products TO authenticated;
GRANT ALL ON public.products TO service_role;
GRANT SELECT ON public.products TO anon;

-- Enable RLS
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

-- Create policies (allowing read for all, write for authenticated)
CREATE POLICY "Allow public read access" ON public.products FOR SELECT USING (true);
CREATE POLICY "Allow authenticated insert" ON public.products FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Allow authenticated update" ON public.products FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Allow authenticated delete" ON public.products FOR DELETE TO authenticated USING (true);

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_products_active ON public.products(active);
CREATE INDEX IF NOT EXISTS idx_products_category ON public.products(category);
