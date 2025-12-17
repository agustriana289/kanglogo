# Panduan Modul Logo Vector dengan Google Drive

## 📋 Deskripsi

Modul ini memungkinkan Anda untuk menampilkan dan mendistribusikan logo vector (SVG) dari Google Drive dengan sistem preview otomatis yang memiliki multiple fallback methods.

## 🔧 Cara Menggunakan

### 1. **Persiapan File di Google Drive**

#### a. Upload file SVG Anda ke Google Drive

1. Buka [Google Drive](https://drive.google.com)
2. Upload file SVG Anda
3. Klik kanan pada file → **Get link** / **Bagikan**
4. **PENTING**: Pastikan setting berbagi adalah:
   ```
   ✅ Anyone with the link can VIEW
   ```
5. Copy link yang muncul. Contoh format:
   ```
   https://drive.google.com/file/d/1ABC123xyz_EXAMPLE_FILE_ID/view?usp=sharing
   ```

#### b. Verifikasi File Public

- Test dengan membuka link di mode incognito browser
- Jika bisa dibuka tanpa login, berarti sudah benar
- Jika muncul "Request access", berarti file belum public

### 2. **Menambahkan Logo Vector via Admin Panel**

1. Login ke Admin Panel: `/admin/vectors`
2. Klik **"Tambah Vector Baru"**
3. Isi form:

   - **Nama Vector**: Nama deskriptif (contoh: "Logo WhatsApp Official")
   - **Slug**: Auto-generate dari nama (untuk URL)
   - **Google Drive Link**: Paste link lengkap dari Google Drive
   - **Kategori**: Pilih kategori yang sesuai
   - **Deskripsi**: Deskripsi singkat (opsional)
   - **Publikasikan**: Centang jika ingin langsung tampil

4. Klik **"Simpan"**

### 3. **Format Link Google Drive yang Didukung**

Sistem mendukung berbagai format link:

```javascript
// Format 1 (Paling umum):
https://drive.google.com/file/d/FILE_ID/view

// Format 2:
https://drive.google.com/open?id=FILE_ID

// Format 3 (Direct ID):
FILE_ID
```

**File ID** akan otomatis di-extract dari link yang Anda masukkan.

## 🎯 Sistem Preview Multi-Fallback

Modul ini menggunakan **4 metode fallback** untuk memastikan preview selalu tampil:

### Method 1: API Route (Server-Side Proxy)

- Menggunakan `/api/vector-preview?fileId=XXX`
- Fetch langsung dari Google Drive
- Mengembalikan SVG content

### Method 2: Direct Google Drive Preview

- URL: `https://lh3.googleusercontent.com/d/FILE_ID`
- Preview langsung dari CDN Google

### Method 3: Thumbnail API

- URL: `https://drive.google.com/thumbnail?id=FILE_ID&sz=w800`
- Menggunakan Google Drive thumbnail API
- Cocok untuk preview cepat

### Method 4: Alternative Preview

- URL: `https://drive.google.com/uc?export=view&id=FILE_ID`
- Metode alternatif jika semua metode gagal

## 🐛 Troubleshooting

### Problem: Preview Tidak Muncul / Blank

**Solusi:**

1. ✅ **Pastikan file sudah public**

   - Cek setting sharing: "Anyone with the link can view"
   - Test buka link di incognito mode

2. ✅ **Pastikan file adalah SVG**

   - Hanya file SVG yang didukung
   - Cek ekstensi file (.svg)

3. ✅ **Check console browser**

   - Buka Developer Tools (F12)
   - Lihat tab Console untuk error messages
   - Sistem akan log metode mana yang gagal

4. ✅ **Coba metode manual**
   - Ambil File ID dari link
   - Test langsung di browser:
     ```
     https://lh3.googleusercontent.com/d/YOUR_FILE_ID
     ```

### Problem: "Preview Failed" atau Error Message

**Kemungkinan Penyebab:**

- ❌ File tidak public/tidak bisa diakses
- ❌ File ID salah atau tidak valid
- ❌ File bukan format SVG
- ❌ Google Drive API rate limit (jarang terjadi)

**Solusi:**

1. Verifikasi ulang sharing settings
2. Re-upload file dan pastikan format SVG
3. Copy link baru dan update di admin panel

### Problem: Preview Lambat

**Solusi:**

- Sistem sudah menggunakan caching (1 jam)
- Preview akan lebih cepat setelah load pertama
- Pertimbangkan kompres SVG jika file terlalu besar

## 📝 Best Practices

### 1. **Optimasi File SVG**

```bash
# Gunakan SVGO untuk compress SVG
npm install -g svgo
svgo input.svg -o output.svg
```

### 2. **Naming Convention**

- Gunakan nama deskriptif: "Logo WhatsApp Official 2024"
- Slug akan auto-generate: "logo-whatsapp-official-2024"

### 3. **Kategori yang Tepat**

Pilih kategori yang sesuai untuk mempermudah pencarian:

- Teknologi (Hardware/Software)
- Media Sosial
- E-Commerce
- Bank/Pembayaran
- dll.

### 4. **Deskripsi yang Informatif**

Tulis deskripsi singkat yang menjelaskan:

- Untuk apa logo ini
- Kapan digunakan
- Variasi warna (jika ada)

## 🔐 Security Notes

1. **File Permissions**

   - File di-set public untuk "view only"
   - Tidak ada akses edit/delete dari publik
   - Download dilakukan melalui API proxy untuk keamanan

2. **Rate Limiting**
   - Google Drive API memiliki rate limit
   - Sistem menggunakan caching untuk mengurangi request
   - Preview di-cache selama 1 jam

## 📊 Fitur Sistem

### Di Halaman List (`/vector`)

- ✅ Search logo by name/description
- ✅ Filter by category
- ✅ Pagination
- ✅ Auto preview dengan fallback
- ✅ Download counter

### Di Halaman Detail (`/vector/[slug]`)

- ✅ Full preview dengan checker pattern background
- ✅ Download button
- ✅ Statistics (downloads, category, date added)
- ✅ Breadcrumb navigation

### Di Admin Panel (`/admin/vectors`)

- ✅ CRUD operations
- ✅ Auto slug generation
- ✅ Publish/unpublish
- ✅ Edit existing vectors
- ✅ Auto extract Google Drive File ID

## 🚀 Tips Performa

1. **Upload file SVG yang sudah dioptimasi**

   - Remove metadata yang tidak perlu
   - Compress dengan SVGO
   - Target size: < 100KB

2. **Gunakan nama file yang jelas**

   - Memudahkan management di Google Drive
   - Nama file tidak perlu sama dengan nama di database

3. **Organize di Google Drive**
   - Buat folder khusus untuk logo vectors
   - Gunakan naming convention yang konsisten

## 📞 Support

Jika ada masalah:

1. Check console browser untuk error details
2. Verifikasi sharing settings di Google Drive
3. Test link manual di browser
4. Re-upload file jika perlu

---

**Last Updated**: December 2025
**Version**: 1.0.0
