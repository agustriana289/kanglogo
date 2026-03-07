import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import { Metadata } from "next";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import CheckoutClient from "./CheckoutClient";

export const metadata: Metadata = {
  title: "Checkout | Kanglogo",
};

interface CheckoutPageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function CheckoutPage({ searchParams }: CheckoutPageProps) {
  const params = await searchParams;
  const type = params.type as string;
  const slug = params.slug as string;
  const plan = params.plan as string;

  if (!type || !slug || !plan) {
    redirect("/");
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/login?next=/checkout?type=${type}&slug=${slug}&plan=${encodeURIComponent(plan)}`);
  }

  // Fetch the item based on type
  let item = null;
  if (type === "service") {
    const { data } = await supabase.from("store_services").select("*").eq("slug", slug).single();
    item = data;
  } else if (type === "product") {
    const { data } = await supabase.from("store_products").select("*").eq("slug", slug).single();
    item = data;
  }

  if (!item) {
    redirect("/");
  }

  // Find the selected package to get the price
  const packages = item.packages || [];
  const selectedPackage = packages.find((p: any) => p.name === plan);

  if (!selectedPackage) {
    redirect(`/${type === "product" ? "shop" : "services"}?error=invalid_plan`);
  }

  // Fetch active automated discounts
  const { data: discounts } = await supabase
    .from("store_discounts")
    .select("*")
    .eq("is_active", true)
    .is("code", null)
    // also could filter by end_date > now(), but let's do simple is_active and we can validate on checkout

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 flex flex-col">
      <Header />
      
      <main className="flex-1 py-6 pt-8">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <div className="mb-8 text-center">
            <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">Secure Checkout</h1>
            <p className="mt-2 text-slate-500">Review your order details below and complete the purchase.</p>
          </div>
          
          <CheckoutClient 
            user={user} 
            item={item} 
            type={type} 
            selectedPlan={selectedPackage} 
            initialDiscounts={discounts || []}
          />
        </div>
      </main>

      <Footer />
    </div>
  );
}
