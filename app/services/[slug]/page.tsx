// app/services/[slug]/page.tsx
import { notFound } from "next/navigation";
import SingleServicePricing from "@/components/SingleServicePricing";
import { supabase } from "@/lib/supabase";
import { Service } from "@/types/service";

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

export default async function ServicePage({
  params,
}: {
  params: { slug: string };
}) {
  const service = await getService(params.slug);

  return <SingleServicePricing service={service} />;
}
