// types/service.ts

export interface ServicePackage {
    name: string;
    bgColor: string;
    titleColor: string;
    bodyColor: string;
    borderColor: string;
    beforeoriginalPrice: string;
    originalPrice: string | null;
    finalPrice: string;
    duration: string;
    description: string;
    features: string[];
    buttonBg: string;
    buttonTextColor: string;
}

export interface Service {
    id: number;
    slug: string;
    title: string;
    short_description: string | null;
    image_src: string | null;
    image_alt: string | null;
    is_featured: boolean;
    packages: ServicePackage[];
    created_at: string;
    updated_at: string;
}