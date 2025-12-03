// app/pages/[slug]/page.tsx
import { notFound } from "next/navigation";
import { Metadata } from "next";
import { supabase } from "@/lib/supabase";
import { Page } from "@/types/page";
import EnhancedPageContent from "@/components/EnhancedPageContent";
import Sidebar from "@/components/Sidebar";

interface PageProps {
  params: {
    slug: string;
  };
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
  const page = await getPage(params.slug);

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
  const page = await getPage(params.slug);

  if (!page) {
    notFound();
  }

  return (
    // <-- 2. Gunakan layout yang sama dengan artikel
    <div className="py-8 bg-slate-100">
      <div className="container mx-auto px-4 max-w-7xl">
        <div className="flex flex-col lg:flex-row gap-8">
          <EnhancedPageContent page={page} />
          <Sidebar />
        </div>
      </div>
    </div>
  );
}
