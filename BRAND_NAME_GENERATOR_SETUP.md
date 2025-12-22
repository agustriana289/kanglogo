// BRAND_NAME_GENERATOR_SETUP.md
# Brand Name Generator - Setup Documentation

## 📋 Overview
Modul generator nama brand memungkinkan user membuat kombinasi nama brand yang unik berdasarkan industri dan keyword yang sudah didefinisikan.

## 🗄️ Database Setup

### 1. Buat Tabel di Supabase
Buka Supabase Dashboard → SQL Editor dan jalankan script berikut:

```sql
-- Tabel Industri
CREATE TABLE IF NOT EXISTS brand_industries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL UNIQUE,
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabel Keywords
CREATE TABLE IF NOT EXISTS brand_keywords (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  industry_id UUID NOT NULL REFERENCES brand_industries(id) ON DELETE CASCADE,
  keyword VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(industry_id, keyword)
);

-- Tabel Generated Names (untuk tracking/history)
CREATE TABLE IF NOT EXISTS brand_generated_names (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  industry_id UUID NOT NULL REFERENCES brand_industries(id) ON DELETE CASCADE,
  generated_name VARCHAR(255) NOT NULL,
  input_text TEXT,
  prefix VARCHAR(50),
  word_length INTEGER,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create Indexes
CREATE INDEX IF NOT EXISTS idx_brand_keywords_industry_id ON brand_keywords(industry_id);
CREATE INDEX IF NOT EXISTS idx_brand_generated_names_industry_id ON brand_generated_names(industry_id);
```

### 2. Enable RLS (Row Level Security) - Optional
Jika ingin membatasi akses, enable RLS pada tabel:
```sql
ALTER TABLE brand_industries ENABLE ROW LEVEL SECURITY;
ALTER TABLE brand_keywords ENABLE ROW LEVEL SECURITY;
ALTER TABLE brand_generated_names ENABLE ROW LEVEL SECURITY;
```

## 📁 File Structure

```
app/
├── api/branding/
│   ├── industries/
│   │   ├── route.ts          # GET, POST industries
│   │   └── [id]/route.ts     # PUT, DELETE specific industry
│   ├── keywords/
│   │   ├── route.ts          # GET, POST keywords
│   │   └── [id]/route.ts     # DELETE specific keyword
│   └── generate/
│       └── route.ts          # POST generate names
├── generator/
│   └── page.tsx              # Public generator page
└── admin/generator/
    └── page.tsx              # Admin management page

components/
├── BrandNameGeneratorForm.tsx      # Form untuk generate nama
└── BrandIndustryManager.tsx        # Admin panel untuk manage

types/
└── brand-name-generator.ts         # TypeScript types
```

## 🚀 Features

### 1. **Public Generator** (`/generator`)
- Input text random (optional)
- Dropdown industri
- Opsi prefix: PT, CV, TOKO, STUDIO, AGENCY
- Opsi panjang kata: 2 atau 3
- Generate kombinasi nama
- Copy to clipboard

### 2. **Admin Panel** (`/admin/generator`)
- Tambah industri baru
- List industri dengan edit/delete
- Kelola keywords per industri
- Tambah keywords dalam jumlah banyak
- Delete keywords individual

## 📝 How to Use

### Admin:
1. Pergi ke `/admin/generator`
2. Klik "Tambah Industri Baru"
3. Isi nama dan deskripsi industri
4. Pilih industri dari list
5. Tambahkan keywords satu per satu atau copy-paste multiple keywords
6. Keywords dapat berjumlah ratusan atau ribuan

### User (Generator):
1. Pergi ke `/generator`
2. Pilih industri dari dropdown
3. (Optional) Masukkan teks input
4. Pilih prefix yang diinginkan
5. Pilih panjang kata (2 atau 3)
6. Klik "Generate Nama Brand"
7. Lihat hasil dan salin nama yang disukai

## 🔄 API Endpoints

### Industries
- `GET /api/branding/industries` - Ambil semua industri
- `POST /api/branding/industries` - Tambah industri baru
- `PUT /api/branding/industries/[id]` - Update industri
- `DELETE /api/branding/industries/[id]` - Hapus industri

### Keywords
- `GET /api/branding/keywords?industryId=[id]` - Ambil keywords industri
- `POST /api/branding/keywords` - Tambah keyword baru
- `DELETE /api/branding/keywords/[id]` - Hapus keyword

### Generate
- `POST /api/branding/generate` - Generate nama brand

## 📊 Example Data

### Sample Industries:
```
1. Teknologi - "Industri teknologi dan software"
2. Fashion - "Industri fashion dan pakaian"
3. Makanan - "Industri makanan dan minuman"
4. Kecantikan - "Industri beauty dan skincare"
5. Real Estate - "Industri properti dan perumahan"
```

### Sample Keywords untuk Teknologi:
```
Tech, Soft, Code, Data, Cloud, Smart, Digital, Net, Web, App,
Cyber, Logic, Frame, Script, Sync, Stream, Vision, Matrix, ...
```

## ⚙️ Configuration

### Prefix Options (dapat diubah di `components/BrandNameGeneratorForm.tsx`):
```typescript
const PREFIX_OPTIONS = ["", "PT", "CV", "TOKO", "STUDIO", "AGENCY"];
```

### Word Length Options:
- 2 kata: kombinasi 2 keyword
- 3 kata: kombinasi 3 keyword

### Generate Limit:
Default max hasil adalah 100 kombinasi untuk performa. Dapat diubah di `/api/branding/generate/route.ts`:
```typescript
const limitedCombinations = combinations.slice(0, 100); // Ubah angka sesuai kebutuhan
```

## 🎨 Styling
Menggunakan Tailwind CSS dengan theme primary color dari konfigurasi global.

## 🔐 Security Notes
- Untuk production, tambahkan autentikasi pada admin endpoints
- Implementasikan RLS policies untuk membatakan akses
- Validate input di backend untuk mencegah injection

## 📈 Future Enhancements
- [ ] Bulk upload keywords via CSV
- [ ] Availability check (domain, social media)
- [ ] Save favorite generated names
- [ ] Export hasil generate ke file
- [ ] Analytics untuk tracking popular names
- [ ] AI-powered name suggestions
