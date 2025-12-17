// app/services/[slug]/page.tsx
import { notFound } from "next/navigation";
import { Metadata } from "next";
import SingleServicePricing from "@/components/SingleServicePricing";
import { supabase } from "@/lib/supabase";
import { Service } from "@/types/service";
import JsonLd from "@/components/JsonLd";

async function getService(slug: string): Promise<Service> {
  const { data, error } = await supabase
    .from("services")
    .select("*")
    .eq("slug", slug)
    .single();

  if (error || !data) {
    notFound();
  }

  return data;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const service = await getService(slug);

  return {
    title: `${service.title} | KangLogo.com`,
    description:
      service.short_description ||
      "Layanan desain profesional terpercaya di Indonesia.",
  };
}

export default async function ServicePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const service = await getService(slug);

  // Service Schema - untuk rich snippets dengan rating bintang
  const serviceSchema = {
    "@context": "https://schema.org",
    "@type": "Service",
    name: service.title,
    description: service.short_description,
    provider: {
      "@type": "Organization",
      name: "KangLogo.com",
    },
    image: service.image_src,
    offers: {
      "@type": "Offer",
      priceCurrency: "IDR",
      price: parseInt(
        service.packages?.[0]?.finalPrice?.replace(/\D/g, "") || "0"
      ),
      availability: "https://schema.org/InStock",
    },
    aggregateRating: {
      "@type": "AggregateRating",
      ratingValue: "5",
      bestRating: "5",
      worstRating: "1",
      ratingCount: "100",
    },
  };

  return (
    <>
      <JsonLd data={serviceSchema} />
      <SingleServicePricing service={service} />
    </>
  );
}
