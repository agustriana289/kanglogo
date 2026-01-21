-- Migration untuk menambahkan field sync Notion
-- Jalankan script ini di Supabase SQL Editor

-- Tambah field untuk tracking sync status
ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS notion_last_synced_from TIMESTAMP,
ADD COLUMN IF NOT EXISTS sync_status VARCHAR(20) DEFAULT 'pending',
ADD COLUMN IF NOT EXISTS sync_error TEXT;

-- Update existing records
UPDATE orders 
SET sync_status = CASE 
  WHEN notion_page_id IS NOT NULL THEN 'synced'
  ELSE 'pending'
END
WHERE sync_status IS NULL OR sync_status = 'pending';

-- Buat index untuk performa
CREATE INDEX IF NOT EXISTS idx_orders_notion_page_id ON orders(notion_page_id);
CREATE INDEX IF NOT EXISTS idx_orders_sync_status ON orders(sync_status);

-- Buat tabel untuk sync logs (opsional, untuk monitoring)
CREATE TABLE IF NOT EXISTS notion_sync_logs (
  id SERIAL PRIMARY KEY,
  order_id INTEGER REFERENCES orders(id) ON DELETE CASCADE,
  sync_direction VARCHAR(20) NOT NULL CHECK (sync_direction IN ('admin_to_notion', 'notion_to_admin')),
  sync_status VARCHAR(20) NOT NULL CHECK (sync_status IN ('success', 'error', 'skipped')),
  sync_error TEXT,
  synced_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sync_logs_order_id ON notion_sync_logs(order_id);
CREATE INDEX IF NOT EXISTS idx_sync_logs_synced_at ON notion_sync_logs(synced_at DESC);

-- Buat tabel untuk Notion settings (opsional, untuk konfigurasi)
CREATE TABLE IF NOT EXISTS notion_settings (
  id SERIAL PRIMARY KEY,
  auto_sync_enabled BOOLEAN DEFAULT true,
  webhook_url TEXT,
  webhook_secret VARCHAR(255),
  last_webhook_received TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Insert default settings jika belum ada
INSERT INTO notion_settings (auto_sync_enabled)
SELECT true
WHERE NOT EXISTS (SELECT 1 FROM notion_settings);

-- Tambah trigger untuk update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_notion_settings_updated_at ON notion_settings;
CREATE TRIGGER update_notion_settings_updated_at
    BEFORE UPDATE ON notion_settings
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
