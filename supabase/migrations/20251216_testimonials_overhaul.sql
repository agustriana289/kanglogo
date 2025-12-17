-- =====================================================
-- MIGRATION: Testimonials System Overhaul
-- Tanggal: 2025-12-16
-- Deskripsi: Mengubah sistem testimoni menjadi terintegrasi dengan orders/store
-- =====================================================

-- 0. Ubah image_url menjadi nullable (PENTING!)
ALTER TABLE testimonials ALTER COLUMN image_url DROP NOT NULL;

-- 1. Tambah kolom baru ke tabel testimonials
ALTER TABLE testimonials 
ADD COLUMN IF NOT EXISTS order_id INTEGER REFERENCES orders(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS store_order_id INTEGER REFERENCES store_orders(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS customer_name VARCHAR(255),
ADD COLUMN IF NOT EXISTS customer_email VARCHAR(255),
ADD COLUMN IF NOT EXISTS rating_service INTEGER DEFAULT 5 CHECK (rating_service >= 1 AND rating_service <= 5),
ADD COLUMN IF NOT EXISTS rating_design INTEGER DEFAULT 5 CHECK (rating_design >= 1 AND rating_design <= 5),
ADD COLUMN IF NOT EXISTS rating_communication INTEGER DEFAULT 5 CHECK (rating_communication >= 1 AND rating_communication <= 5),
ADD COLUMN IF NOT EXISTS review_text TEXT,
ADD COLUMN IF NOT EXISTS service_name VARCHAR(255),
ADD COLUMN IF NOT EXISTS product_name VARCHAR(255),
ADD COLUMN IF NOT EXISTS token VARCHAR(64) UNIQUE,
ADD COLUMN IF NOT EXISTS submitted_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS is_featured BOOLEAN DEFAULT FALSE;

-- 2. Buat index untuk performa
CREATE INDEX IF NOT EXISTS idx_testimonials_order_id ON testimonials(order_id);
CREATE INDEX IF NOT EXISTS idx_testimonials_store_order_id ON testimonials(store_order_id);
CREATE INDEX IF NOT EXISTS idx_testimonials_token ON testimonials(token);

-- 3. Function untuk generate unique token
CREATE OR REPLACE FUNCTION generate_testimonial_token()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.token IS NULL THEN
    NEW.token := encode(gen_random_bytes(32), 'hex');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 4. Trigger untuk auto-generate token
DROP TRIGGER IF EXISTS set_testimonial_token ON testimonials;
CREATE TRIGGER set_testimonial_token
  BEFORE INSERT ON testimonials
  FOR EACH ROW
  EXECUTE FUNCTION generate_testimonial_token();
