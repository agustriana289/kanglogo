import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import FAQClient from "./FAQClient";

export default async function FAQPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const { data: profile } = await supabase.from("users").select("is_admin").eq("id", user.id).single();
  if (!profile?.is_admin) redirect("/dashboard");

  return <FAQClient />;
}
