import { createClient } from "@/utils/supabase/server";
import { notFound } from "next/navigation";
import { Metadata } from "next";
import PageContent from "./PageContent";

interface PageProps {
  params: Promise<{ slug: string }>;
}

async function getPage(slug: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("pages")
    .select("*")
    .eq("slug", slug)
    .eq("is_published", true)
    .single();
  return data;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const page = await getPage(slug);
  if (!page) return { title: "Page Not Found | Kanglogo" };
  return {
    title: `${page.title} | Kanglogo`,
    description: page.meta_description,
  };
}

export default async function StaticPage({ params }: PageProps) {
  const { slug } = await params;
  const page = await getPage(slug);
  if (!page) notFound();

  return <PageContent page={page} />;
}
