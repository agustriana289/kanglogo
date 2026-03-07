import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import LatestPostsClient from "./LatestPostsClient";

export const metadata = { title: "Latest Posts | Kanglogo" };

export default async function LatestPostsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Fetch published blogs
  const { data: blogs } = await supabase
    .from("blogs")
    .select("id, title, slug, featured_image, created_at, category")
    .eq("is_published", true)
    .order("created_at", { ascending: false });

  return <LatestPostsClient blogs={blogs || []} />;
}
