-- Table untuk Logo Vector
CREATE TABLE IF NOT EXISTS logo_vectors (
  id BIGSERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(255) UNIQUE NOT NULL,
  category VARCHAR(100) NOT NULL,
  google_drive_link TEXT NOT NULL,
  file_id VARCHAR(255), -- Extracted Google Drive file ID untuk kemudahan
  description TEXT,
  downloads INTEGER DEFAULT 0,
  is_published BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index untuk performance
CREATE INDEX IF NOT EXISTS idx_logo_vectors_slug ON logo_vectors(slug);
CREATE INDEX IF NOT EXISTS idx_logo_vectors_category ON logo_vectors(category);
CREATE INDEX IF NOT EXISTS idx_logo_vectors_published ON logo_vectors(is_published);

-- Trigger untuk auto update updated_at
CREATE OR REPLACE FUNCTION update_logo_vectors_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER logo_vectors_updated_at
  BEFORE UPDATE ON logo_vectors
  FOR EACH ROW
  EXECUTE FUNCTION update_logo_vectors_updated_at();

-- Sample data (optional)
INSERT INTO logo_vectors (name, slug, category, google_drive_link, file_id, description) VALUES
('Logo Minimalis Modern', 'logo-minimalis-modern', 'Minimalis', 'https://drive.google.com/file/d/SAMPLE_ID/view', 'SAMPLE_ID', 'Logo minimalis dengan desain modern dan clean'),
('Logo Abstract Colorful', 'logo-abstract-colorful', 'Abstract', 'https://drive.google.com/file/d/SAMPLE_ID_2/view', 'SAMPLE_ID_2', 'Logo abstract dengan warna-warna cerah yang eye-catching');
