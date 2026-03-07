import { createClient } from "@/utils/supabase/server";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import FadeIn from "@/components/landing/FadeIn";
import Link from "next/link";
import { Calendar, ArrowRight, BookOpen } from "lucide-react";

export const metadata = {
  title: "Blog | Kanglogo",
  description: "Read the latest tips, trends, and insights on logo design, branding, and visual identity.",
};

async function getBlogs() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("blogs")
    .select("id, title, slug, excerpt, category, featured_image, published_at")
    .eq("is_published", true)
    .order("published_at", { ascending: false });
  return data || [];
}

export default async function BlogPage() {
  const blogs = await getBlogs();

  return (
    <div className="min-h-screen bg-white text-slate-900 font-sans">
      <Header />

      <div className="pt-8 pb-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <FadeIn delay={100} className="max-w-2xl mb-16">
            <div className="inline-flex items-center gap-2 rounded-full border border-indigo-200 bg-indigo-50 px-3 py-1 text-sm font-medium text-indigo-700 mb-6">
              <BookOpen size={14} />
              <span>Our Blog</span>
            </div>
            <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 sm:text-5xl mb-4">
              Latest Insights
            </h1>
            <p className="text-lg text-slate-600">
              Expert advice, design principles, and strategies to help your brand stand out in a crowded market.
            </p>
          </FadeIn>

          {blogs.length === 0 ? (
            <FadeIn delay={200} className="text-center py-32 rounded-3xl bg-slate-50 ring-1 ring-slate-100">
              <BookOpen className="w-12 h-12 text-slate-300 mx-auto mb-4" />
              <p className="text-slate-500 font-medium">No blog posts published yet.</p>
              <p className="text-slate-400 text-sm mt-1">Check back soon for new articles.</p>
            </FadeIn>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {blogs.map((blog, idx) => (
                <FadeIn key={blog.id} delay={150 + idx * 80}>
                  <article className="group relative flex flex-col bg-white rounded-3xl ring-1 ring-slate-100/80 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 overflow-hidden h-full">
                    <div className="relative aspect-video overflow-hidden">
                      {blog.featured_image ? (
                        <img
                          src={blog.featured_image}
                          alt={blog.title}
                          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                        />
                      ) : (
                        <div className="w-full h-full bg-slate-100 flex items-center justify-center text-slate-300">
                          <BookOpen className="w-10 h-10" />
                        </div>
                      )}
                      {blog.category && (
                        <div className="absolute top-4 left-4 flex flex-wrap gap-1">
                          {blog.category.split(",").slice(0, 2).map((cat: string) => (
                            <span key={cat.trim()} className="rounded-full bg-white/90 backdrop-blur-sm px-3 py-1 text-xs font-semibold text-slate-900 shadow-sm">
                              {cat.trim()}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="flex flex-col flex-1 p-6">
                      <div className="flex items-center gap-2 text-xs text-slate-400 mb-3">
                        <Calendar size={13} />
                        <time>{new Date(blog.published_at).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}</time>
                      </div>
                      <h2 className="text-lg font-bold text-slate-900 leading-snug mb-3 group-hover:text-indigo-600 transition-colors line-clamp-2">
                        {blog.title}
                      </h2>
                      {blog.excerpt && (
                        <p className="text-sm text-slate-500 leading-relaxed line-clamp-3 mb-6 flex-1">
                          {blog.excerpt}
                        </p>
                      )}
                      <div className="mt-auto">
                        <Link
                          href={`/blog/${blog.slug}`}
                          className="inline-flex items-center gap-1.5 text-sm font-semibold text-indigo-600 hover:text-indigo-500 transition-colors"
                        >
                          Read article <ArrowRight size={15} className="transition-transform group-hover:translate-x-1" />
                        </Link>
                      </div>
                    </div>
                  </article>
                </FadeIn>
              ))}
            </div>
          )}
        </div>
      </div>

      <Footer />
    </div>
  );
}
