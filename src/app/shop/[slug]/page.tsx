import { createClient } from "@/utils/supabase/server";
import { notFound } from "next/navigation";
import { Metadata } from "next";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import FadeIn from "@/components/landing/FadeIn";
import { ShoppingBag, ChevronRight, Home, Check, Tag } from "lucide-react";
import DynamicIcon from "@/components/DynamicIcon";
import Link from "next/link";
import { calculateDiscountedPrice } from "@/utils/discounts";
import FAQSection from "@/components/landing/FAQSection";

interface ProductProps {
  params: Promise<{ slug: string }>;
}

async function getProduct(slug: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("store_products")
    .select("*")
    .eq("slug", slug)
    .eq("is_published", true)
    .single();
  return data;
}

export async function generateMetadata({ params }: ProductProps): Promise<Metadata> {
  const { slug } = await params;
  const prod = await getProduct(slug);
  if (!prod) return { title: "Product Not Found | Kanglogo" };
  return {
    title: `${prod.title} | Kanglogo Shop`,
    description: prod.description,
  };
}

export default async function ProductDetail({ params }: ProductProps) {
  const { slug } = await params;
  const prod = await getProduct(slug);
  if (!prod) notFound();

  // Fetch active automated discounts
  const supabase = await createClient();
  const { data: discounts } = await supabase
    .from("store_discounts")
    .select("*")
    .eq("is_active", true)
    .is("code", null);

  const activeDiscounts = discounts || [];

  const { data: shopFaqs } = await supabase
    .from("faqs")
    .select("*")
    .eq("target", "shop")
    .eq("shop_category", prod.category)
    .eq("is_published", true)
    .order("sort_order", { ascending: true });

  return (
    <div className="min-h-screen font-sans text-slate-900">
      <Header />
      
      {/* Breadcrumbs */}
      <div className="py-4 pt-4">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <nav className="flex" aria-label="Breadcrumb">
            <ol className="flex items-center space-x-2 text-sm text-slate-500 font-medium">
              <li>
                <Link href="/" className="hover:text-indigo-600 transition-colors">
                  <Home className="h-4 w-4" />
                  <span className="sr-only">Home</span>
                </Link>
              </li>
              <li>
                <div className="flex items-center">
                  <ChevronRight className="h-4 w-4 shrink-0 text-slate-300" />
                  <Link href="/shop" className="ml-2 hover:text-indigo-600 transition-colors">
                    Shop
                  </Link>
                </div>
              </li>
              <li>
                <div className="flex items-center">
                  <ChevronRight className="h-4 w-4 shrink-0 text-slate-300" />
                  <span className="ml-2 text-slate-800" aria-current="page">
                    {prod.title}
                  </span>
                </div>
              </li>
            </ol>
          </nav>
        </div>
      </div>

      <main className="py-4 mb-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="lg:grid lg:grid-cols-2 lg:gap-16">
            
            {/* Left Image & Auto Mockup (Shop typically shows img on left) */}
            <FadeIn delay={100} className="mb-12 lg:mb-0">
              <div className="sticky top-24 space-y-6">
                <div className="overflow-hidden rounded-3xl bg-slate-100 ring-1 ring-slate-200 shadow-2xl">
                  {prod.images && prod.images.length > 0 ? (
                    <img
                      src={prod.images[0]}
                      alt={prod.title}
                      className="w-full h-full object-cover aspect-[4/3] bg-white"
                    />
                  ) : (
                    <div className="flex items-center justify-center w-full aspect-[4/3] bg-slate-100 text-slate-400">
                      <ShoppingBag size={48} />
                    </div>
                  )}
                </div>

                {/* Key Features below thumbnail */}
                {prod.key_features && prod.key_features.length > 0 && (
                  <div className="space-y-3 pt-2">
                    {prod.key_features.map((kf: { title: string; description: string; icon?: string }, idx: number) => (
                      <div key={idx} className="bg-white rounded-2xl p-4 ring-1 ring-slate-100 shadow-sm flex items-center gap-4">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 shrink-0">
                          <DynamicIcon name={kf.icon || "Download"} size={20} />
                        </div>
                        <div>
                           <h3 className="font-bold text-slate-900 text-sm leading-tight">{kf.title}</h3>
                           <p className="text-xs text-slate-500 mt-0.5">{kf.description}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </FadeIn>

            {/* Right Content */}
            <FadeIn delay={200} className="flex flex-col">
              <div className="inline-flex items-center gap-2 rounded-full border border-indigo-200 bg-indigo-50 px-3 py-1 text-sm font-medium text-indigo-700 mb-6 w-max">
                <ShoppingBag size={14} />
                <span>{prod.category || "Digital Asset"}</span>
              </div>
              <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 sm:text-5xl mb-6">
                {prod.title}
              </h1>
              
              <div className="flex items-end gap-2 mb-8 border-b border-slate-100 pb-8">
                 {(() => {
                   const startPrice = prod.packages?.[0]?.price || 0;
                   const { originalPrice, discountedPrice, appliedDiscount } = calculateDiscountedPrice(startPrice, activeDiscounts, prod.id, 'product');
                   if (appliedDiscount) {
                     return (
                       <div className="flex items-end gap-2">
                         <span className="text-3xl font-bold tracking-tight text-indigo-600">
                           Rp {Number(discountedPrice).toLocaleString('id-ID')}
                         </span>
                         <span className="text-slate-400 font-medium pb-1 line-through text-lg">Rp {Number(originalPrice).toLocaleString('id-ID')}</span>
                         <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md mb-1 ml-2 flex items-center gap-1"><Tag size={12}/> {appliedDiscount.name}</span>
                       </div>
                     )
                   }
                   return (
                     <span className="text-3xl font-bold tracking-tight text-slate-900">
                       Rp {Number(startPrice).toLocaleString('id-ID')}
                     </span>
                   )
                 })()}
                 <span className="text-slate-500 font-medium pb-1.5 ml-2">starting price</span>
              </div>
              
              {/* Description */}
              <div 
                className="prose prose-slate prose-lg max-w-none prose-headings:font-bold prose-headings:tracking-tight prose-a:text-indigo-600 hover:prose-a:text-indigo-500 mb-12 whitespace-pre-wrap"
              >
                {prod.description}
              </div>

              {/* Purchase Options */}
              <div className="mt-8 pt-8 border-t border-slate-100">
                 {prod.packages && prod.packages.length > 0 ? (
                    <div className="space-y-4">
                      <h3 className="text-lg font-bold text-slate-900 mb-4">Choose License</h3>
                      {prod.packages.map((pkg: any, idx: number) => {
                         const { originalPrice, discountedPrice, appliedDiscount } = calculateDiscountedPrice(pkg.price, activeDiscounts, prod.id, 'product');
                         
                         return (
                           <div key={idx} className={`relative flex flex-col sm:flex-row sm:items-center justify-between p-5 rounded-2xl border ${appliedDiscount ? 'border-indigo-200 bg-indigo-50/30' : 'border-slate-200 bg-white'} shadow-sm hover:shadow-md transition-shadow gap-4`}>
                              {appliedDiscount && (
                                <div className="absolute -top-3 left-6 bg-indigo-600 text-white text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-full shadow-sm flex items-center gap-1">
                                  <Tag size={12} /> Discount Applied
                                </div>
                              )}
                              <div className={appliedDiscount ? "pt-2" : ""}>
                                 <h4 className="font-bold text-slate-900 text-lg">{pkg.name}</h4>
                                 {pkg.desc && <p className="text-sm text-slate-500 mt-1">{pkg.desc}</p>}
                                 {pkg.features && pkg.features.length > 0 && (
                                   <ul className="mt-3 space-y-1.5">
                                     {pkg.features.map((feat: string, i: number) => (
                                       <li key={i} className="flex items-start text-xs text-slate-600">
                                         <Check className="w-3.5 h-3.5 text-emerald-500 mr-2 shrink-0 mt-0.5" />
                                         {feat}
                                       </li>
                                     ))}
                                   </ul>
                                 )}
                              </div>
                              <div className="flex flex-row sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-4 sm:gap-2">
                                 <div className="text-left sm:text-right">
                                    {appliedDiscount ? (
                                      <div className="flex flex-col items-end">
                                        <span className="text-sm text-slate-400 line-through font-medium mb-0.5">Rp {Number(originalPrice).toLocaleString('id-ID')}</span>
                                        <span className="block text-xl font-extrabold text-indigo-600">Rp {Number(discountedPrice).toLocaleString('id-ID')}</span>
                                      </div>
                                    ) : (
                                      <span className="block text-xl font-extrabold text-indigo-600">Rp {Number(originalPrice).toLocaleString('id-ID')}</span>
                                    )}
                                 </div>
                                 <Link href={`/checkout?type=product&slug=${prod.slug}&plan=${encodeURIComponent(pkg.name)}`} className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2.5 px-6 rounded-xl shadow-sm transition-all focus:ring-2 focus:ring-indigo-500/50 whitespace-nowrap">
                                    Buy Now
                                 </Link>
                              </div>
                           </div>
                         )
                      })}
                    </div>
                 ) : (
                    <Link href={`/checkout?type=product&slug=${prod.slug}&plan=${encodeURIComponent(prod.packages?.[0]?.name || "Standard")}`} className="flex items-center justify-center w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-4 px-6 rounded-xl shadow-sm shadow-indigo-200 transition-all focus:ring-2 focus:ring-indigo-500/50 text-lg">
                       <ShoppingBag className="w-5 h-5 mr-3" /> Purchase Item — Rp {Number(prod.packages?.[0]?.price || 0).toLocaleString('id-ID')}
                    </Link>
                 )}
              </div>
            </FadeIn>

          </div>
        </div>
      </main>

      <FAQSection 
        faqs={shopFaqs || []} 
        title={`Questions about our ${prod.category} designs`}
        badge="Shop FAQ"
      />

      <Footer />
    </div>
  );
}
