import { createClient } from "@/utils/supabase/server";
import AdminDashboard from "./AdminDashboard";
import UserDashboard from "./UserDashboard";
import { redirect } from "next/navigation";

export default async function DashboardPage(props: { searchParams?: Promise<{ [key: string]: string | string[] | undefined }> }) {
  const searchParams = props.searchParams ? await props.searchParams : {};
  const yearParam = searchParams?.year as string | undefined;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/");
  }

  const { data: profile } = await supabase
    .from("users")
    .select("is_admin, full_name")
    .eq("id", user.id)
    .single();

  const isAdmin = profile?.is_admin || false;
  const fullName = profile?.full_name || user.email || "User";

  if (isAdmin) {
    return <AdminDashboard name={fullName} yearParam={yearParam} />;
  }
  
  return <UserDashboard name={fullName} />;
}
