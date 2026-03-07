-- Tambahkan kolom custom_project_title pada tabel store_testimonials
ALTER TABLE public.store_testimonials ADD COLUMN IF NOT EXISTS custom_project_title TEXT;
