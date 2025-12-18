// types/logoVector.ts
export interface LogoVector {
    id: number;
    name: string;
    slug: string;
    category: string;
    google_drive_link: string;
    file_id: string | null;
    description: string | null;
    downloads: number;
    is_published: boolean;
    created_at: string;
    updated_at: string;
    svg_content?: string;
}
