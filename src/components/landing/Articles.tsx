import { ArrowRight, Calendar, BookOpen } from "lucide-react";
import FadeIn from "./FadeIn";
import Link from "next/link";
import { createClient } from "@/utils/supabase/server";

export default async function Articles({ settings }: { settings?: any }) {
  const supabase = await createClient();
  const { data: blogs } = await supabase
    .from("blogs")
    .select("id, title, slug, excerpt, category, featured_image, published_at")
    .eq("is_published", true)
    .order("published_at", { ascending: false })
    .limit(3);

  return (
    <section className="bg-slate-50 py-24 sm:py-32" id="articles">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <FadeIn delay={100} className="mx-auto max-w-2xl text-center mb-16">
          <div className="inline-flex items-center gap-2 rounded-full border border-indigo-200 bg-indigo-50 px-3 py-1 text-sm font-medium text-indigo-700 mb-4">
            <span>{settings?.blog_badge || "Our Blog"}</span>
          </div>
          <h2 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
            {settings?.blog_title || "Latest insights"}
          </h2>
          <p className="mt-4 text-lg text-slate-600">
            {settings?.blog_description || "Expert advice, design principles, and strategies to help your brand stand out in a crowded market."}
          </p>
        </FadeIn>

        {!blogs || blogs.length === 0 ? (
          <FadeIn delay={200} className="text-center py-20 rounded-3xl bg-white ring-1 ring-slate-100">
            <BookOpen className="w-10 h-10 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-400 font-medium text-sm">No articles published yet.</p>
          </FadeIn>
        ) : (
          <div className="mx-auto mt-16 grid max-w-2xl grid-cols-1 gap-x-8 gap-y-12 lg:mx-0 lg:max-w-none lg:grid-cols-3">
            {blogs.map((blog, idx) => (
              <FadeIn key={blog.id} delay={150 + idx * 100}>
                <article className="group relative flex flex-col items-start justify-between rounded-3xl bg-white p-4 ring-1 ring-slate-100/80 shadow-sm transition-all duration-300 hover:shadow-xl hover:-translate-y-1 h-full">
                  <div className="relative w-full overflow-hidden rounded-2xl">
                    <div className="absolute inset-0 bg-slate-100 animate-pulse -z-10" />
                    {blog.featured_image ? (
                      /* eslint-disable-next-line @next/next/no-img-element */
                      <img
                        src={blog.featured_image}
                        alt={blog.title}
                        className="aspect-video w-full object-cover transition-transform duration-500 group-hover:scale-105"
                        loading="lazy"
                      />
                    ) : (
                      <div className="aspect-video w-full bg-slate-100 flex items-center justify-center text-slate-300">
                        <BookOpen className="w-8 h-8" />
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

                  <div className="flex flex-col flex-1 px-4 py-6">
                    <div className="flex items-center gap-x-2 text-xs text-slate-500 mb-4">
                      <Calendar size={14} />
                      <time>{new Date(blog.published_at).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })}</time>
                    </div>

                    <h3 className="mt-3 text-xl font-semibold leading-6 text-slate-900 group-hover:text-indigo-600 transition-colors line-clamp-2">
                      <Link href={`/blog/${blog.slug}`}>
                        <span className="absolute inset-0" />
                        {blog.title}
                      </Link>
                    </h3>

                    {blog.excerpt && (
                      <p className="mt-4 text-sm leading-6 text-slate-600 line-clamp-3 mb-6 flex-1">
                        {blog.excerpt}
                      </p>
                    )}

                    <div className="mt-auto flex items-center text-sm font-semibold text-indigo-600 group-hover:text-indigo-500 transition-colors">
                      Read article
                      <ArrowRight size={16} className="ml-1 transition-transform group-hover:translate-x-1" />
                    </div>
                  </div>
                </article>
              </FadeIn>
            ))}
          </div>
        )}

        <FadeIn delay={400} className="text-center mt-12">
          <Link
            href="/blog"
            className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-6 py-2.5 text-sm font-semibold text-slate-700 hover:border-indigo-200 hover:text-indigo-600 hover:bg-indigo-50 transition-all shadow-sm"
          >
            View all articles <ArrowRight size={15} />
          </Link>
        </FadeIn>
      </div>
    </section>
  );
}
