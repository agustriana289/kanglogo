// types/marketplace.ts
export interface MarketplaceAsset {
  id: number;
  nama_aset: string;
  slug: string;
  kategori_aset: string;
  jenis: "premium" | "freebies";
  harga_aset: number;
  jenis_lisensi: string;
  tagline: string;
  deskripsi: string;
  image_url: string;
  is_sold: boolean;
  created_at?: string;
  updated_at?: string;
}
