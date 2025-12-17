// app/vector/[slug]/page.tsx
import { notFound } from "next/navigation";
import { Metadata } from "next";
import { supabase } from "@/lib/supabase";
import { LogoVector } from "@/types/logoVector";
import VectorDetail from "@/components/VectorDetail";

interface PageProps {
    params: Promise<{
        slug: string;
    }>;
}

export const revalidate = 60;

async function getVector(slug: string): Promise<LogoVector | null> {
    const { data, error } = await supabase
        .from("logo_vectors")
        .select("*")
        .eq("slug", slug)
        .eq("is_published", true)
        .single();

    if (error || !data) {
        return null;
    }

    return data;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
    const { slug } = await params;
    const vector = await getVector(slug);

    if (!vector) {
        return {
            title: "Logo Vector Tidak Ditemukan",
        };
    }

    return {
        title: `${vector.name} - Logo Vector`,
        description: vector.description || `Download ${vector.name} gratis`,
    };
}

export default async function VectorDetailPage({ params }: PageProps) {
    const { slug } = await params;
    const vector = await getVector(slug);

    if (!vector) {
        notFound();
    }

    return <VectorDetail vector={vector} />;
}
