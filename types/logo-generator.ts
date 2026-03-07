export interface LogoAsset {
    id: number;
    nama_aset: string;
    slug: string;
    kategori_aset: string;
    jenis_lisensi: string;
    svg_content: string;
    created_at?: string;
    updated_at?: string;
}

export interface LogoFont {
    id: number;
    font_name: string;
    google_font_family: string;
    created_at: string;
}
