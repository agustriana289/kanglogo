-- Dokumentasi SQL Setup untuk Brand Name Generator
-- Jalankan query ini di Supabase SQL Editor untuk membuat tabel yang diperlukan

-- 1. Tabel untuk menyimpan industri
CREATE TABLE IF NOT EXISTS brand_industries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL UNIQUE,
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Tabel untuk menyimpan keywords per industri
CREATE TABLE IF NOT EXISTS brand_keywords (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  industry_id UUID NOT NULL REFERENCES brand_industries(id) ON DELETE CASCADE,
  keyword VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(industry_id, keyword)
);

-- 3. Tabel untuk menyimpan nama yang di-generate (optional, untuk tracking)
CREATE TABLE IF NOT EXISTS brand_generated_names (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  industry_id UUID NOT NULL REFERENCES brand_industries(id) ON DELETE CASCADE,
  generated_name VARCHAR(255) NOT NULL,
  input_text TEXT,
  prefix VARCHAR(50),
  word_length INTEGER,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Membuat index untuk performa query
CREATE INDEX IF NOT EXISTS idx_brand_keywords_industry_id ON brand_keywords(industry_id);
CREATE INDEX IF NOT EXISTS idx_brand_generated_names_industry_id ON brand_generated_names(industry_id);
CREATE INDEX IF NOT EXISTS idx_brand_generated_names_created_at ON brand_generated_names(created_at DESC);

-- Contoh data dummy (opsional - gunakan untuk testing)
-- INSERT INTO brand_industries (name, description) VALUES
-- ('Teknologi', 'Industri teknologi dan software'),
-- ('Fashion', 'Industri fashion dan pakaian'),
-- ('Makanan', 'Industri makanan dan minuman');

-- INSERT INTO brand_keywords (industry_id, keyword) VALUES
-- ((SELECT id FROM brand_industries WHERE name = 'Teknologi'), 'Tech'),
-- ((SELECT id FROM brand_industries WHERE name = 'Teknologi'), 'Soft'),
-- ((SELECT id FROM brand_industries WHERE name = 'Teknologi'), 'Code'),
-- ((SELECT id FROM brand_industries WHERE name = 'Fashion'), 'Style'),
-- ((SELECT id FROM brand_industries WHERE name = 'Fashion'), 'Trend'),
-- ((SELECT id FROM brand_industries WHERE name = 'Fashion'), 'Mode'),
-- ((SELECT id FROM brand_industries WHERE name = 'Makanan'), 'Taste'),
-- ((SELECT id FROM brand_industries WHERE name = 'Makanan'), 'Flavor'),
-- ((SELECT id FROM brand_industries WHERE name = 'Makanan'), 'Fresh');
