import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import BrowseShopClient from "./BrowseShopClient";

export const metadata = { title: "Browse Shop | Kanglogo" };

export default async function BrowseShopPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Fetch published products
  const { data: products } = await supabase
    .from("store_products")
    .select("*")
    .eq("is_published", true)
    .order("created_at", { ascending: false });

  return <BrowseShopClient products={products || []} />;
}
