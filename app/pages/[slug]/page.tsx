// app/pages/[slug]/page.tsx
import { notFound } from "next/navigation";
import { Metadata } from "next";
import { supabase } from "@/lib/supabase";
import { Page } from "@/types/page";
import EnhancedPageContent from "@/components/EnhancedPageContent";

interface PageProps {
  params: Promise<{
    slug: string;
  }>;
}

// Revalidate setiap 60 detik (ISR - Incremental Static Regeneration)
export const revalidate = 60;

async function getPage(slug: string): Promise<Page | null> {
  const { data, error } = await supabase
    .from("pages")
    .select("*")
    .eq("slug", slug)
    .eq("is_published", true)
    .single();

  if (error || !data) {
    return null;
  }

  return data;
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const page = await getPage(slug);

  if (!page) {
    return {
      title: "Halaman Tidak Ditemukan",
    };
  }

  return {
    title: page.title,
    description:
      page.meta_description || `Baca halaman ${page.title} di website kami.`,
  };
}

export default async function StaticPage({ params }: PageProps) {
  const { slug } = await params;
  const page = await getPage(slug);

  if (!page) {
    notFound();
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
      <EnhancedPageContent page={page} />
    </div>
  );
}
