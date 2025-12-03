// types/project.ts
export interface Project {
  id: number;
  slug: string;
  title: string;
  type: string | null;
  owner: string | null;
  start_date: string | null; // Akan berformat 'YYYY-MM-DD'
  end_date: string | null; // Akan berformat 'YYYY-MM-DD'
  image_url: string | null;
  created_at: string;
  updated_at: string;
  deskripsi_proyek?: string;
  komentar_proyek?: string;
  aplikasi_yang_digunakan?: string;
  filosofi_proyek?: string;
  created_at?: string;
}
