// types/page.ts
export interface Page {
  id: number;
  title: string;
  slug: string;
  content: string | null;
  meta_description: string | null;
  is_published: boolean;
  created_at: string;
  updated_at: string;
}
