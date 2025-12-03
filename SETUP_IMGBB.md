# Setup ImgBB API Key

## Langkah-langkah:

1. **Buka**: https://api.imgbb.com/
2. **Klik**: "Get API Key"
3. **Sign up** (gratis)
4. **Copy API key** yang didapat

## Tambahkan ke Environment Variable:

Buat file `.env.local` di root project (jika belum ada):

```env
NEXT_PUBLIC_IMGBB_API_KEY=your_api_key_here
```

Ganti `your_api_key_here` dengan API key yang didapat dari ImgBB.

## Atau langsung di file:

Edit `lib/imgbb-upload.ts` line 7, ganti:
```ts
const apiKey = process.env.NEXT_PUBLIC_IMGBB_API_KEY || 'YOUR_IMGBB_API_KEY_HERE';
```

Dengan:
```ts
const apiKey = 'api_key_anda_disini';
```

## Selesai!
Tidak perlu setup bucket, tidak perlu SQL, langsung bisa upload! 🎉
