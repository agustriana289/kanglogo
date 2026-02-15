-- Migration untuk menambahkan field project_name
-- Jalankan script ini di Supabase SQL Editor

-- Tambah kolom project_name ke tabel orders
ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS project_name TEXT;

-- Buat index untuk performa pencarian
CREATE INDEX IF NOT EXISTS idx_orders_project_name ON orders(project_name);

-- Opsional: Update existing records dengan nilai default dari package_details
-- UPDATE orders 
-- SET project_name = package_details->>'name'
-- WHERE project_name IS NULL;
