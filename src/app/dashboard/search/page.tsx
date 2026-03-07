import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import SearchClient from "./SearchClient";

export default async function SearchPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("users")
    .select("is_admin")
    .eq("id", user.id)
    .single();

  return <SearchClient isAdmin={profile?.is_admin || false} userId={user.id} />;
}
