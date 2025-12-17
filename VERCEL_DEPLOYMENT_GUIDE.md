# Vercel Deploy Troubleshooting Checklist

## 🔧 Masalah yang sudah diperbaiki:

### 1. ✅ Build Configuration

- Created `vercel.json` dengan konfigurasi Next.js yang benar
- Updated `next.config.js` dengan optimasi performance:
  - `compress: true` - kompresi output
  - `productionBrowserSourceMaps: false` - kurangi ukuran build
  - `maximumFileSizeToCacheInBytes: 5000000` - atur PWA cache limit
  - `experimental.optimizeCss: true` - optimasi CSS

### 2. ✅ Environment Configuration

- Created `.vercelignore` untuk skip unnecessary files saat build
- Build script sudah ada: `cross-env ESLINT_NO_DEV_ERRORS=true next build`

## 📋 Step-by-Step untuk Deploy ke Vercel:

### Step 1: Push ke Git

```bash
git add .
git commit -m "fix: optimize build config for Vercel deployment"
git push origin main
```

### Step 2: Di Vercel Dashboard

1. Buka https://vercel.com/dashboard
2. Klik "New Project" → select repository
3. Di Build & Development Settings:
   - Build Command: `npm run build` ✓
   - Output Directory: `.next` ✓
   - Install Command: `npm install` ✓

### Step 3: Environment Variables (PENTING!)

Di Vercel Dashboard → Project Settings → Environment Variables, tambahkan:

- `NEXT_PUBLIC_SUPABASE_URL` - your supabase URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - your supabase anon key
- Semua env var dari `.env.local` Anda

### Step 4: Deploy

Klik "Deploy" dan pantau build logs.

## 🚨 Jika Still Error:

Jika masih error "Client network socket disconnected", coba:

1. **Reduce memory usage** - tambah di Vercel env:

   ```
   NODE_OPTIONS = --max-old-space-size=4096
   ```

2. **Disable analytics** - tambah di Vercel env:

   ```
   NEXT_TELEMETRY_DISABLED = 1
   ```

3. **Check Node version** - pastikan Vercel menggunakan Node 20.x

4. **Clean cache**:
   - Di Vercel Dashboard → Deployments → click menu → "Redeploy" (with cache cleared)

## 📊 CSS Bundle Size Issue:

- Current: 5.82 MB (terlalu besar!)
- Solution: Sudah dikonfigurasi di next.config.js
- Verifikasi: Jalankan `npm run analyze` untuk lihat size breakdown

## ✅ Next Steps:

1. Push changes ke git
2. Deploy ke Vercel
3. Monitor build logs
4. Jika masih error, screenshot error message dan share dengan saya
