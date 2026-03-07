import { createClient } from "@/utils/supabase/server";
import { notFound } from "next/navigation";
import { Metadata } from "next";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import FadeIn from "@/components/landing/FadeIn";
import Pricing from "@/components/landing/Pricing";
import { BriefcaseBusiness, ChevronRight, Home } from "lucide-react";
import DynamicIcon from "@/components/DynamicIcon";
import Link from "next/link";
import FAQSection from "@/components/landing/FAQSection";

interface ServiceProps {
  params: Promise<{ slug: string }>;
}

async function getService(slug: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("store_services")
    .select("*")
    .eq("slug", slug)
    .eq("is_published", true)
    .single();
  return data;
}

export async function generateMetadata({ params }: ServiceProps): Promise<Metadata> {
  const { slug } = await params;
  const service = await getService(slug);
  if (!service) return { title: "Service Not Found | Kanglogo" };
  return {
    title: `${service.title} | Kanglogo Services`,
    description: service.description,
  };
}

export default async function ServiceDetail({ params }: ServiceProps) {
  const { slug } = await params;
  const service = await getService(slug);
  if (!service) notFound();

  // Create a minimal settings object for the Pricing component
  const mockSettings = {
    pricing_badge: service.category || "Pricing Plans",
    pricing_title: `Choose your ${service.title} plan`,
    pricing_description: "Select the package that best fits your requirements. All packages come with guaranteed quality and support.",
  };

  // Fetch active automated discounts
  const supabase = await createClient();
  const { data: discounts } = await supabase
    .from("store_discounts")
    .select("*")
    .eq("is_active", true)
    .is("code", null);

  const activeDiscounts = discounts || [];

  const { data: serviceFaqs } = await supabase
    .from("faqs")
    .select("*")
    .eq("target", "service")
    .eq("service_id", service.id)
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
                  <Link href="/services" className="ml-2 hover:text-indigo-600 transition-colors">
                    Services
                  </Link>
                </div>
              </li>
              <li>
                <div className="flex items-center">
                  <ChevronRight className="h-4 w-4 shrink-0 text-slate-300" />
                  <span className="ml-2 text-slate-800" aria-current="page">
                    {service.title}
                  </span>
                </div>
              </li>
            </ol>
          </nav>
        </div>
      </div>

      <main className="py-4">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="lg:grid lg:grid-cols-2 lg:gap-16">
            
            {/* Left Content */}
            <FadeIn delay={100} className="flex flex-col">
              <div className="inline-flex items-center gap-2 rounded-full border border-indigo-200 bg-indigo-50 px-3 py-1 text-sm font-medium text-indigo-700 mb-6 w-max">
                <BriefcaseBusiness size={14} />
                <span>{service.category || "Service"}</span>
              </div>
              <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 sm:text-5xl mb-6">
                {service.title}
              </h1>
              
              {/* Description */}
              <div 
                className="prose prose-slate prose-lg max-w-none prose-headings:font-bold prose-headings:tracking-tight prose-a:text-indigo-600 hover:prose-a:text-indigo-500 mb-12 whitespace-pre-wrap"
              >
                {service.description}
              </div>
              {/* Dynamic Highlights / Features */}
              {service.key_features && service.key_features.length > 0 && (
                <div className="mt-auto space-y-4">
                  {service.key_features.map((kf: any, idx: number) => (
                    <div key={idx} className="bg-slate-50 rounded-2xl p-6 ring-1 ring-slate-100/80 shadow-sm border border-slate-100 flex items-center gap-4">
                      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-100 text-indigo-600 shadow-sm shrink-0">
                        <DynamicIcon name={kf.icon || "CheckCircle2"} size={24} />
                      </div>
                      <div>
                        <h3 className="font-bold text-slate-900 leading-tight">{kf.title}</h3>
                        <p className="text-sm text-slate-500">{kf.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </FadeIn>

            {/* Right Image */}
            <FadeIn delay={200} className="mt-12 lg:mt-0">
              <div className="overflow-hidden rounded-3xl bg-slate-100 ring-1 ring-slate-200 shadow-2xl sticky top-24">
                {service.thumbnail_url ? (
                  <img
                    src={service.thumbnail_url}
                    alt={service.title}
                    className="w-full h-full object-cover aspect-[4/3]"
                  />
                ) : (
                  <div className="flex items-center justify-center w-full aspect-[4/3] bg-slate-100 text-slate-400">
                    <BriefcaseBusiness size={48} />
                  </div>
                )}
              </div>
            </FadeIn>

          </div>
        </div>
      </main>

      <Pricing settings={mockSettings} featuredService={service} activeDiscounts={activeDiscounts} />

      <FAQSection 
        faqs={serviceFaqs || []} 
        title={`Questions about ${service.title}`}
        badge="Service FAQ"
      />

      <Footer />
    </div>
  );
}
