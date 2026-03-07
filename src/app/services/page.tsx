import { createClient } from "@/utils/supabase/server";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import FadeIn from "@/components/landing/FadeIn";
import Link from "next/link";
import { ArrowRight, BriefcaseBusiness, CheckCircle2 } from "lucide-react";

export const metadata = {
  title: "Services | Kanglogo",
  description: "Explore our professional design and branding services tailored exactly for your needs.",
};

async function getServices() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("store_services")
    .select("id, title, slug, description, category, thumbnail_url, packages")
    .eq("is_published", true)
    .order("sort_order", { ascending: true });
  return data || [];
}

export default async function ServicesPage() {
  const services = await getServices();

  return (
    <div className="min-h-screen bg-white text-slate-900 font-sans">
      <Header />

      <div className="pt-8 pb-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <FadeIn delay={100} className="max-w-2xl mb-16">
            <div className="inline-flex items-center gap-2 rounded-full border border-indigo-200 bg-indigo-50 px-3 py-1 text-sm font-medium text-indigo-700 mb-6">
              <BriefcaseBusiness size={14} />
              <span>Our Services</span>
            </div>
            <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 sm:text-5xl mb-4">
              Premium Solutions
            </h1>
            <p className="text-lg text-slate-600">
              Transform your brand with our dedicated design, strategy, and development services carefully crafted for modern businesses.
            </p>
          </FadeIn>

          {services.length === 0 ? (
            <FadeIn delay={200} className="text-center py-32 rounded-3xl bg-slate-50 ring-1 ring-slate-100">
              <BriefcaseBusiness className="w-12 h-12 text-slate-300 mx-auto mb-4" />
              <p className="text-slate-500 font-medium">No services currently published.</p>
              <p className="text-slate-400 text-sm mt-1">Check back later or contact us directly.</p>
            </FadeIn>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {services.map((service, idx) => (
                <FadeIn key={service.id} delay={150 + idx * 80}>
                  <article className="group relative flex flex-col bg-white rounded-3xl ring-1 ring-slate-100/80 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 overflow-hidden h-full">
                    <div className="relative aspect-video overflow-hidden">
                      {service.thumbnail_url ? (
                        <img
                          src={service.thumbnail_url}
                          alt={service.title}
                          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                        />
                      ) : (
                        <div className="w-full h-full bg-slate-100 flex items-center justify-center text-slate-300">
                          <BriefcaseBusiness className="w-10 h-10" />
                        </div>
                      )}
                      {service.category && (
                        <div className="absolute top-4 left-4 flex flex-wrap gap-1">
                          <span className="rounded-full bg-white/90 backdrop-blur-sm px-3 py-1 text-xs font-semibold text-indigo-900 shadow-sm">
                            {service.category.trim()}
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="flex flex-col flex-1 p-6">
                      <h2 className="text-xl font-bold text-slate-900 leading-snug mb-3 group-hover:text-indigo-600 transition-colors line-clamp-2">
                        {service.title}
                      </h2>
                      {service.description && (
                        <p className="text-sm text-slate-500 leading-relaxed line-clamp-3 mb-6 flex-1">
                          {service.description}
                        </p>
                      )}

                      {service.packages && Array.isArray(service.packages) && service.packages.length > 0 && (
                        <div className="mb-6 space-y-2">
                          <div className="text-xs font-bold uppercase tracking-wider text-slate-400">Includes:</div>
                          <ul className="space-y-1.5">
                            {service.packages[Math.floor(service.packages.length / 2)]?.features?.slice(0, 3).map((feat: string, i: number) => (
                              <li key={i} className="flex items-start text-sm text-slate-600">
                                <CheckCircle2 className="w-4 h-4 text-emerald-500 mr-2 mt-0.5 shrink-0" />
                                <span className="line-clamp-1">{feat}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      <div className="mt-auto flex items-center justify-between pt-4 border-t border-slate-100">
                        <div className="flex flex-col">
                          <span className="text-xs font-semibold text-slate-400">Starting at</span>
                          <span className="text-lg font-bold tracking-tight text-slate-900">
                            Rp {Number(service.packages?.[0]?.price || 0).toLocaleString('id-ID')}
                          </span>
                        </div>
                        <Link
                          href={`/services/${service.slug}`}
                          className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-slate-50 text-slate-600 group-hover:bg-indigo-600 group-hover:text-white transition-all shadow-sm group-hover:shadow-md"
                        >
                          <ArrowRight size={18} className="transition-transform group-hover:translate-x-0.5" />
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
