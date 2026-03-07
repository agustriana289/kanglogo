import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import TicketsClient from "./TicketsClient";
import AdminTicketsClient from "./AdminTicketsClient";

export default async function TicketsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("users")
    .select("*")
    .eq("id", user.id)
    .single();

  if (profile?.is_admin) {
    return <AdminTicketsClient />;
  }

  return <TicketsClient initialUser={user} />;
}
