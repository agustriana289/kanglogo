import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import HelpFaqClient from "./HelpFaqClient";

export const metadata = { title: "Help & FAQ | Kanglogo" };

export default async function HelpFaqPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Fetch published FAQs
  const { data: faqs } = await supabase
    .from("faqs")
    .select("*, store_services(title)")
    .eq("is_published", true)
    .order("sort_order", { ascending: true });

  return <HelpFaqClient faqs={faqs || []} />;
}
