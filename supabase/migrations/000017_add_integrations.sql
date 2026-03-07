-- ============================================================
-- 000017_add_integrations.sql
-- Portfolios, Testimonials, Discounts — Terintegrasi dengan Order
-- ============================================================

-- 1. Tabel Diskon
CREATE TABLE IF NOT EXISTS public.store_discounts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    code TEXT UNIQUE,
    name TEXT NOT NULL,
    description TEXT,
    type TEXT NOT NULL CHECK (type IN ('percentage', 'fixed_amount')),
    value DECIMAL(12,2) NOT NULL,
    min_purchase DECIMAL(12,2) DEFAULT 0,
    max_discount DECIMAL(12,2),
    start_date TIMESTAMPTZ DEFAULT NOW(),
    end_date TIMESTAMPTZ,
    usage_limit INTEGER,
    used_count INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    product_id UUID REFERENCES public.store_products(id) ON DELETE CASCADE,
    service_id UUID REFERENCES public.store_services(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Tabel Portofolio
CREATE TABLE IF NOT EXISTS public.store_portfolios (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    order_id UUID REFERENCES public.store_orders(id) ON DELETE SET NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    title TEXT NOT NULL,
    description TEXT,
    category TEXT,
    images TEXT[] DEFAULT '{}',
    tags TEXT[] DEFAULT '{}',
    is_published BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Tabel Testimoni
CREATE TABLE IF NOT EXISTS public.store_testimonials (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    order_id UUID REFERENCES public.store_orders(id) ON DELETE CASCADE UNIQUE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    client_name TEXT,
    rating_quality INTEGER CHECK (rating_quality >= 1 AND rating_quality <= 5),
    rating_communication INTEGER CHECK (rating_communication >= 1 AND rating_communication <= 5),
    rating_speed INTEGER CHECK (rating_speed >= 1 AND rating_speed <= 5),
    comment TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Tambahkan kolom ke store_orders
ALTER TABLE public.store_orders ADD COLUMN IF NOT EXISTS discount_id UUID REFERENCES public.store_discounts(id);
ALTER TABLE public.store_orders ADD COLUMN IF NOT EXISTS progress INTEGER DEFAULT 0;
ALTER TABLE public.store_orders ADD COLUMN IF NOT EXISTS payment_proof_url TEXT;
ALTER TABLE public.store_orders ADD COLUMN IF NOT EXISTS payment_status TEXT DEFAULT 'unpaid';

-- Enable RLS
ALTER TABLE public.store_discounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.store_portfolios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.store_testimonials ENABLE ROW LEVEL SECURITY;

-- Policies: store_discounts
DROP POLICY IF EXISTS "Public can view active discounts" ON public.store_discounts;
CREATE POLICY "Public can view active discounts" ON public.store_discounts
    FOR SELECT USING (is_active = true AND (end_date IS NULL OR end_date > NOW()));

DROP POLICY IF EXISTS "Admins have full access to store_discounts" ON public.store_discounts;
CREATE POLICY "Admins have full access to store_discounts" ON public.store_discounts
    FOR ALL USING (
        EXISTS (SELECT 1 FROM public.users WHERE users.id = auth.uid() AND users.is_admin = true)
    );

-- Policies: store_portfolios
DROP POLICY IF EXISTS "Anyone can view portfolios" ON public.store_portfolios;
CREATE POLICY "Anyone can view portfolios" ON public.store_portfolios
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admins have full access to portfolios" ON public.store_portfolios;
CREATE POLICY "Admins have full access to portfolios" ON public.store_portfolios
    FOR ALL USING (
        EXISTS (SELECT 1 FROM public.users WHERE users.id = auth.uid() AND users.is_admin = true)
    );

-- Policies: store_testimonials
DROP POLICY IF EXISTS "Anyone can view testimonials" ON public.store_testimonials;
CREATE POLICY "Anyone can view testimonials" ON public.store_testimonials
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can create own testimonials" ON public.store_testimonials;
CREATE POLICY "Users can create own testimonials" ON public.store_testimonials
    FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins have full access to testimonials" ON public.store_testimonials;
CREATE POLICY "Admins have full access to testimonials" ON public.store_testimonials
    FOR ALL USING (
        EXISTS (SELECT 1 FROM public.users WHERE users.id = auth.uid() AND users.is_admin = true)
    );

-- Function: safe increment for discount usage
CREATE OR REPLACE FUNCTION increment_discount_usage(discount_id UUID)
RETURNS VOID AS $$
BEGIN
    UPDATE public.store_discounts
    SET used_count = used_count + 1
    WHERE id = discount_id;
END;
$$ LANGUAGE plpgsql;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_portfolios_order_id ON public.store_portfolios(order_id);
CREATE INDEX IF NOT EXISTS idx_portfolios_category ON public.store_portfolios(category);
CREATE INDEX IF NOT EXISTS idx_testimonials_order_id ON public.store_testimonials(order_id);
CREATE INDEX IF NOT EXISTS idx_orders_discount_id ON public.store_orders(discount_id);
