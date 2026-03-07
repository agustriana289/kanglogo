import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import UserPagesClient from "./UserPagesClient";

export const metadata = { title: "Explore Pages | Kanglogo" };

export default async function ExplorePages() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Fetch available pages
  const { data: pages } = await supabase
    .from("pages")
    .select("id, title, slug, created_at")
    .order("created_at", { ascending: false });

  const validPages = pages || [];

  return <UserPagesClient pages={validPages} />;
}
