import Header from "@/components/Header";
import Footer from "@/components/Footer";
import Link from "next/link";
import { ArrowLeft, ArrowRight, Calendar, ChevronRight, BookOpen } from "lucide-react";
import ShareButtons from "./ShareButton";

interface RecentBlog {
  id: string;
  title: string;
  slug: string;
  category: string | null;
  featured_image: string | null;
  published_at: string;
}

interface NextArticle {
  title: string;
  slug: string;
}

interface BlogContentProps {
  blog: {
    title: string;
    slug: string;
    content: string | null;
    published_at: string;
    featured_image: string | null;
    category: string | null;
    excerpt: string | null;
  };
  recentBlogs: RecentBlog[];
  nextArticle: NextArticle | null;
  ads: Record<string, string>;
}

function splitContent(html: string): [string, string, string] {
  if (!html) return [html, "", ""];
  const cut1 = html.indexOf("</p>", Math.floor(html.length * 0.33));
  if (cut1 === -1) return [html, "", ""];
  const part1 = html.slice(0, cut1 + 4);
  const rest = html.slice(cut1 + 4);
  const cut2 = rest.indexOf("</p>", Math.floor(rest.length * 0.5));
  if (cut2 === -1) return [part1, rest, ""];
  return [part1, rest.slice(0, cut2 + 4), rest.slice(cut2 + 4)];
}

export default function BlogContent({ blog, recentBlogs, nextArticle, ads }: BlogContentProps) {
  const categories = blog.category
    ? blog.category.split(",").map((c) => c.trim()).filter(Boolean)
    : [];

  const [part1, part2, part3] = splitContent(blog.content || "");
  const showReadAlso = recentBlogs.length >= 2;

  return (
    <div className="min-h-screen bg-white font-sans">
      <Header />

      <div className="pt-28 pb-24 mx-auto max-w-4xl px-4 sm:px-6">

        <nav className="flex items-center gap-1.5 text-xs font-medium text-slate-400 mb-10">
          <Link href="/" className="hover:text-slate-700 transition-colors">Home</Link>
          <ChevronRight className="w-3 h-3" />
          <Link href="/blog" className="hover:text-slate-700 transition-colors">Blog</Link>
          <ChevronRight className="w-3 h-3" />
          <span className="text-slate-600 truncate max-w-[200px]">{blog.title}</span>
        </nav>

        {categories.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-5">
            {categories.map((cat) => (
              <span key={cat} className="inline-flex items-center rounded-full border border-indigo-200 bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-700">
                {cat}
              </span>
            ))}
          </div>
        )}

        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900 leading-tight mb-4">
          {blog.title}
        </h1>

        {blog.excerpt && (
          <p className="text-lg text-slate-500 leading-relaxed mb-6">
            {blog.excerpt}
          </p>
        )}

        <div className="flex items-center gap-2 text-sm text-slate-400 mb-8 pb-8 border-b border-slate-100">
          <Calendar className="w-4 h-4" />
          <time>
            {new Date(blog.published_at).toLocaleDateString("id-ID", {
              weekday: "long",
              day: "numeric",
              month: "long",
              year: "numeric",
            })}
          </time>
        </div>

        {ads.above_date && (
          <div className="mb-8" dangerouslySetInnerHTML={{ __html: ads.above_date }} />
        )}

        {blog.featured_image && (
          <div className="mb-10 rounded-3xl overflow-hidden aspect-video shadow-sm ring-1 ring-slate-100">
            <img
              src={blog.featured_image}
              alt={blog.title}
              className="w-full h-full object-cover"
            />
          </div>
        )}

        <div className="blog-content" dangerouslySetInnerHTML={{ __html: part1 || blog.content || "" }} />

        {showReadAlso && recentBlogs[0] && (
          <div className="my-8 p-4 rounded-2xl bg-indigo-50/70 border border-indigo-100">
            <p className="text-sm text-slate-700">
              <span className="font-bold text-indigo-700">Baca juga: </span>
              <Link href={`/blog/${recentBlogs[0].slug}`} className="text-indigo-600 hover:text-indigo-800 underline underline-offset-2 font-medium transition-colors">
                {recentBlogs[0].title}
              </Link>
            </p>
          </div>
        )}

        {part2 && <div className="blog-content" dangerouslySetInnerHTML={{ __html: part2 }} />}

        {ads.article_middle && (
          <div className="my-6" dangerouslySetInnerHTML={{ __html: ads.article_middle }} />
        )}

        {showReadAlso && recentBlogs[1] && (
          <div className="my-8 p-4 rounded-2xl bg-indigo-50/70 border border-indigo-100">
            <p className="text-sm text-slate-700">
              <span className="font-bold text-indigo-700">Baca juga: </span>
              <Link href={`/blog/${recentBlogs[1].slug}`} className="text-indigo-600 hover:text-indigo-800 underline underline-offset-2 font-medium transition-colors">
                {recentBlogs[1].title}
              </Link>
            </p>
          </div>
        )}

        {part3 && <div className="blog-content" dangerouslySetInnerHTML={{ __html: part3 }} />}

        {ads.article_end && (
          <div className="my-6" dangerouslySetInnerHTML={{ __html: ads.article_end }} />
        )}

        <div className="mt-12 pt-8 border-t border-slate-100 mb-6">
          <ShareButtons title={blog.title} slug={blog.slug} />
        </div>

        <div className="flex items-center justify-between gap-4 py-4 border-t border-slate-100">
          <Link
            href="/blog"
            className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-indigo-600 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" /> All Articles
          </Link>
          {nextArticle && (
            <Link
              href={`/blog/${nextArticle.slug}`}
              className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-indigo-600 transition-colors text-right"
            >
              <span className="line-clamp-1 max-w-[180px] sm:max-w-xs">{nextArticle.title}</span>
              <ArrowRight className="w-4 h-4 shrink-0" />
            </Link>
          )}
        </div>

        {recentBlogs.length > 0 && (
          <div className="mt-16 pt-10 border-t border-slate-100">
            <div className="flex items-center gap-2 mb-6">
              <div className="inline-flex items-center gap-2 rounded-full border border-indigo-200 bg-indigo-50 px-3 py-1 text-sm font-medium text-indigo-700">
                <BookOpen size={14} />
                <span>Other Articles</span>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {recentBlogs.slice(0, 4).map((article) => (
                <Link
                  key={article.id}
                  href={`/blog/${article.slug}`}
                  className="group flex flex-col bg-white rounded-3xl ring-1 ring-slate-100 shadow-sm hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300 overflow-hidden"
                >
                  <div className="relative aspect-video overflow-hidden">
                    {article.featured_image ? (
                      <img
                        src={article.featured_image}
                        alt={article.title}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                    ) : (
                      <div className="w-full h-full bg-slate-100 flex items-center justify-center text-slate-300">
                        <BookOpen className="w-8 h-8" />
                      </div>
                    )}
                    {article.category && (
                      <div className="absolute top-3 left-3">
                        <span className="rounded-full bg-white/90 backdrop-blur-sm px-3 py-1 text-xs font-semibold text-slate-900 shadow-sm">
                          {article.category.split(",")[0].trim()}
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="p-5">
                    <div className="flex items-center gap-1.5 text-xs text-slate-400 mb-2">
                      <Calendar size={12} />
                      <time>{new Date(article.published_at).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}</time>
                    </div>
                    <p className="text-md font-bold text-slate-900 group-hover:text-indigo-600 transition-colors line-clamp-2 leading-snug">
                      {article.title}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {ads.after_recent && (
          <div className="mt-8" dangerouslySetInnerHTML={{ __html: ads.after_recent }} />
        )}

      </div>

      <Footer />

      <style>{`
        .blog-content { color: #475569; font-size: 1.0625rem; line-height: 1.9; }
        .blog-content h1 { font-size: 1.875rem; font-weight: 800; color: #0f172a; margin: 2.5rem 0 1rem; line-height: 1.2; }
        .blog-content h2 { font-size: 1.5rem; font-weight: 700; color: #1e293b; margin: 2.25rem 0 0.875rem; line-height: 1.3; }
        .blog-content h3 { font-size: 1.2rem; font-weight: 700; color: #1e293b; margin: 1.75rem 0 0.75rem; }
        .blog-content p { margin-bottom: 1.5rem; }
        .blog-content ul { list-style-type: disc; margin-left: 1.5rem; margin-bottom: 1.5rem; }
        .blog-content ol { list-style-type: decimal; margin-left: 1.5rem; margin-bottom: 1.5rem; }
        .blog-content li { margin-bottom: 0.5rem; }
        .blog-content a { color: #4f46e5; font-weight: 600; text-decoration: underline; text-underline-offset: 3px; }
        .blog-content a:hover { color: #4338ca; }
        .blog-content strong { color: #0f172a; font-weight: 700; }
        .blog-content em { font-style: italic; }
        .blog-content code { background: #f1f5f9; color: #4f46e5; padding: 0.15rem 0.45rem; border-radius: 0.375rem; font-size: 0.875em; font-family: monospace; border: 1px solid #e2e8f0; }
        .blog-content pre { background: #1e293b; color: #e2e8f0; padding: 1.5rem; border-radius: 1rem; overflow-x: auto; margin: 1.75rem 0; font-size: 0.875rem; }
        .blog-content pre code { background: none; color: inherit; padding: 0; border: none; }
        .blog-content blockquote { border-left: 3px solid #6366f1; background: #f5f3ff; padding: 1rem 1.5rem; border-radius: 0 1rem 1rem 0; margin: 1.75rem 0; color: #4b5563; font-style: italic; }
        .blog-content hr { border: none; border-top: 1px solid #e2e8f0; margin: 2.5rem 0; }
        .blog-content img { border-radius: 1.25rem; max-width: 100%; margin: 2rem auto; display: block; box-shadow: 0 20px 40px -12px rgb(0 0 0 / 0.15); }
        .blog-content table { width: 100%; border-collapse: collapse; margin: 1.75rem 0; font-size: 0.9rem; }
        .blog-content th { background: #f8fafc; font-weight: 700; color: #1e293b; padding: 0.75rem 1rem; border: 1px solid #e2e8f0; text-align: left; }
        .blog-content td { padding: 0.75rem 1rem; border: 1px solid #e2e8f0; }
      `}</style>
    </div>
  );
}
