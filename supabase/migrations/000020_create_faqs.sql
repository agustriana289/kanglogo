CREATE TABLE IF NOT EXISTS public.faqs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    question TEXT NOT NULL,
    answer TEXT NOT NULL,
    target TEXT NOT NULL DEFAULT 'landing',
    service_id UUID REFERENCES public.store_services(id) ON DELETE SET NULL,
    shop_category TEXT,
    sort_order INTEGER DEFAULT 0,
    is_published BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.faqs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view published faqs" ON public.faqs
    FOR SELECT USING (is_published = true);

CREATE POLICY "Admins can manage faqs" ON public.faqs
    FOR ALL USING (public.get_user_role(auth.uid()) = 'admin');
