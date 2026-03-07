-- ============================================================
-- 000015_create_store_system.sql
-- Mendukung Toko Digital, Order, Workspace, Chat, Services
-- ============================================================

-- 1. Tabel Produk Digital
CREATE TABLE IF NOT EXISTS public.store_products (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    description TEXT,
    category TEXT,
    tags TEXT[] DEFAULT '{}',
    images TEXT[] DEFAULT '{}',
    packages JSONB DEFAULT '[]'::jsonb,
    form_fields JSONB DEFAULT '[]'::jsonb,
    is_published BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Tabel Layanan (Services)
CREATE TABLE IF NOT EXISTS public.store_services (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    description TEXT,
    category TEXT,
    icon TEXT DEFAULT 'Briefcase',
    thumbnail_url TEXT,
    packages JSONB DEFAULT '[]'::jsonb,
    form_fields JSONB DEFAULT '[]'::jsonb,
    is_published BOOLEAN DEFAULT false,
    is_featured BOOLEAN DEFAULT false,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Tabel Pesanan (Orders)
CREATE TABLE IF NOT EXISTS public.store_orders (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    order_number TEXT UNIQUE NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    product_id UUID REFERENCES public.store_products(id) ON DELETE SET NULL,
    service_id UUID REFERENCES public.store_services(id) ON DELETE SET NULL,
    selected_package JSONB NOT NULL,
    form_data JSONB,
    payment_method TEXT,
    total_amount DECIMAL(12,2) NOT NULL,
    status TEXT DEFAULT 'pending',
    paid_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Tabel Workspace
CREATE TABLE IF NOT EXISTS public.store_workspaces (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    order_id UUID REFERENCES public.store_orders(id) ON DELETE CASCADE UNIQUE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    status TEXT DEFAULT 'active',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Tabel Pesan Chat
CREATE TABLE IF NOT EXISTS public.store_messages (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    workspace_id UUID REFERENCES public.store_workspaces(id) ON DELETE CASCADE,
    sender_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    content TEXT NOT NULL,
    attachment_url TEXT,
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.store_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.store_services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.store_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.store_workspaces ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.store_messages ENABLE ROW LEVEL SECURITY;

-- Policies Store Products
DROP POLICY IF EXISTS "Public can view published products" ON public.store_products;
CREATE POLICY "Public can view published products" ON public.store_products FOR SELECT USING (is_published = true);

DROP POLICY IF EXISTS "Admins have full access to store_products" ON public.store_products;
CREATE POLICY "Admins have full access to store_products" ON public.store_products FOR ALL USING (
    EXISTS (SELECT 1 FROM public.users WHERE users.id = auth.uid() AND users.is_admin = true)
);

-- Policies Store Services
DROP POLICY IF EXISTS "Public can view published services" ON public.store_services;
CREATE POLICY "Public can view published services" ON public.store_services FOR SELECT USING (is_published = true);

DROP POLICY IF EXISTS "Admins have full access to store_services" ON public.store_services;
CREATE POLICY "Admins have full access to store_services" ON public.store_services FOR ALL USING (
    EXISTS (SELECT 1 FROM public.users WHERE users.id = auth.uid() AND users.is_admin = true)
);

-- Policies Store Orders
DROP POLICY IF EXISTS "Users can view own orders" ON public.store_orders;
CREATE POLICY "Users can view own orders" ON public.store_orders FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins have full access to store_orders" ON public.store_orders;
CREATE POLICY "Admins have full access to store_orders" ON public.store_orders FOR ALL USING (
    EXISTS (SELECT 1 FROM public.users WHERE users.id = auth.uid() AND users.is_admin = true)
);

-- Policies Store Workspaces
DROP POLICY IF EXISTS "Users can access own workspace" ON public.store_workspaces;
CREATE POLICY "Users can access own workspace" ON public.store_workspaces FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins have full access to store_workspaces" ON public.store_workspaces;
CREATE POLICY "Admins have full access to store_workspaces" ON public.store_workspaces FOR ALL USING (
    EXISTS (SELECT 1 FROM public.users WHERE users.id = auth.uid() AND users.is_admin = true)
);

-- Policies Store Messages
DROP POLICY IF EXISTS "Users can view workspace messages" ON public.store_messages;
CREATE POLICY "Users can view workspace messages" ON public.store_messages FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.store_workspaces WHERE id = workspace_id AND user_id = auth.uid())
);

DROP POLICY IF EXISTS "Admins have full access to store_messages" ON public.store_messages;
CREATE POLICY "Admins have full access to store_messages" ON public.store_messages FOR ALL USING (
    EXISTS (SELECT 1 FROM public.users WHERE users.id = auth.uid() AND users.is_admin = true)
);
