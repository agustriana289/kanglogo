import { createClient } from "@/utils/supabase/server";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import FadeIn from "@/components/landing/FadeIn";
import Link from "next/link";
import { ArrowRight, ShoppingBag, Eye } from "lucide-react";

export const metadata = {
  title: "Shop | Kanglogo",
  description: "Browse premium design assets, templates, and digital resources.",
};

async function getProducts() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("store_products")
    .select("id, title, slug, description, category, images, packages")
    .eq("is_published", true)
    .order("created_at", { ascending: false });
  return data || [];
}

export default async function ShopPage() {
  const products = await getProducts();

  return (
    <div className="min-h-screen bg-white text-slate-900 font-sans">
      <Header />

      <div className="pt-8 pb-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <FadeIn delay={100} className="max-w-2xl mb-16">
            <div className="inline-flex items-center gap-2 rounded-full border border-indigo-200 bg-indigo-50 px-3 py-1 text-sm font-medium text-indigo-700 mb-6">
              <ShoppingBag size={14} />
              <span>Digital Products</span>
            </div>
            <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 sm:text-5xl mb-4">
              Premium Assets
            </h1>
            <p className="text-lg text-slate-600">
              Download high-quality templates, UI kits, icon sets, and themes to accelerate your workflow.
            </p>
          </FadeIn>

          {products.length === 0 ? (
            <FadeIn delay={200} className="text-center py-32 rounded-3xl bg-slate-50 ring-1 ring-slate-100">
              <ShoppingBag className="w-12 h-12 text-slate-300 mx-auto mb-4" />
              <p className="text-slate-500 font-medium">No products currently available.</p>
              <p className="text-slate-400 text-sm mt-1">Check back later for exciting new releases.</p>
            </FadeIn>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
              {products.map((prod, idx) => (
                <FadeIn key={prod.id} delay={150 + idx * 80}>
                  <article className="group relative flex flex-col bg-white rounded-3xl ring-1 ring-slate-100/80 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 overflow-hidden h-full">
                    <Link href={`/shop/${prod.slug}`} className="block relative aspect-[4/3] overflow-hidden bg-slate-100">
                      {prod.images && prod.images.length > 0 ? (
                        <img
                          src={prod.images[0]}
                          alt={prod.title}
                          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-slate-300">
                          <ShoppingBag className="w-10 h-10" />
                        </div>
                      )}
                      {/* Overlay */}
                      <div className="absolute inset-0 bg-slate-900/10 group-hover:bg-transparent transition-colors duration-500" />
                      
                      {/* Category Badge */}
                      {prod.category && (
                        <div className="absolute top-4 left-4 flex flex-wrap gap-1">
                          <span className="rounded-full bg-white/95 backdrop-blur-md px-3 py-1 text-xs font-semibold text-slate-900 shadow-sm border border-slate-100">
                            {prod.category.trim()}
                          </span>
                        </div>
                      )}

                      {/* View Action */}
                      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                         <div className="flex items-center justify-center h-12 w-12 rounded-full bg-white text-indigo-600 shadow-lg scale-90 group-hover:scale-100 transition-transform duration-300">
                           <Eye size={20} />
                         </div>
                      </div>
                    </Link>

                    <div className="flex flex-col flex-1 p-6">
                      <h2 className="text-xl font-bold text-slate-900 leading-snug mb-3 group-hover:text-indigo-600 transition-colors line-clamp-2">
                        <Link href={`/shop/${prod.slug}`}>
                          <span className="absolute inset-0 z-10" />
                          {prod.title}
                        </Link>
                      </h2>
                      {prod.description && (
                        <p className="text-sm text-slate-500 leading-relaxed line-clamp-2 mb-6 flex-1">
                          {prod.description}
                        </p>
                      )}

                      <div className="mt-auto flex items-center justify-between pt-5 border-t border-slate-100">
                        <div className="flex flex-col">
                          <span className="text-lg font-bold tracking-tight text-slate-900">
                            Rp {Number(prod.packages?.[0]?.price || 0).toLocaleString('id-ID')}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-indigo-600 z-20 relative">
                           View Details <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                        </div>
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
