import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import VouchersClient from "./VouchersClient";

export const metadata = { title: "Discounts & Vouchers | Kanglogo" };

export default async function UserVouchersPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Fetch active discounts
  const { data: discounts } = await supabase
    .from("store_discounts")
    .select("*, store_products(title), store_services(title)")
    .eq("is_active", true)
    .order("created_at", { ascending: false });

  // Optional: Filter out expired ones here or let client do it
  const activeDiscounts = (discounts || []).filter(d => {
    if (d.end_date && new Date(d.end_date) < new Date()) return false;
    if (d.usage_limit && d.used_count >= d.usage_limit) return false;
    return true;
  });

  return <VouchersClient discounts={activeDiscounts} />;
}
