import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import AdminProjectsClient from "./AdminProjectsClient";
import UserProjectsClient from "./UserProjectsClient";

export const metadata = { title: "Projects | Kanglogo Dashboard" };

export default async function ProjectsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("users")
    .select("is_admin")
    .eq("id", user.id)
    .single();

  if (profile?.is_admin) {
    return <AdminProjectsClient />;
  }

  return <UserProjectsClient userId={user.id} />;
}
