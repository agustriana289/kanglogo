import { createClient } from "@/utils/supabase/server";
import { notFound } from "next/navigation";
import { Metadata } from "next";
import BlogContent from "./BlogContent";

interface PageProps {
  params: Promise<{ slug: string }>;
}

async function getBlog(slug: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("blogs")
    .select("*")
    .eq("slug", slug)
    .eq("is_published", true)
    .single();
  return data;
}

async function getRecentBlogs(currentSlug: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("blogs")
    .select("id, title, slug, category, featured_image, published_at")
    .eq("is_published", true)
    .neq("slug", currentSlug)
    .order("published_at", { ascending: false })
    .limit(4);
  return data || [];
}

async function getNextArticle(publishedAt: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("blogs")
    .select("title, slug")
    .eq("is_published", true)
    .gt("published_at", publishedAt)
    .order("published_at", { ascending: true })
    .limit(1)
    .single();
  return data || null;
}

async function getAds() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("ads")
    .select("position, html_code")
    .eq("is_active", true);
  const map: Record<string, string> = {};
  for (const ad of data || []) {
    map[ad.position] = ad.html_code;
  }
  return map;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const blog = await getBlog(slug);
  if (!blog) return { title: "Blog Not Found | Kanglogo" };
  return {
    title: blog.meta_title || `${blog.title} | Kanglogo`,
    description: blog.meta_description || blog.excerpt,
    keywords: blog.meta_keywords,
    openGraph: {
      title: blog.title,
      description: blog.meta_description || blog.excerpt,
      images: blog.featured_image ? [{ url: blog.featured_image }] : [],
    },
  };
}

export default async function BlogDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const blog = await getBlog(slug);
  if (!blog) notFound();
  const [recentBlogs, nextArticle, ads] = await Promise.all([
    getRecentBlogs(slug),
    getNextArticle(blog.published_at),
    getAds(),
  ]);
  return <BlogContent blog={blog} recentBlogs={recentBlogs} nextArticle={nextArticle} ads={ads} />;
}
