import { createClient } from "@/utils/supabase/server";
import { notFound, redirect } from "next/navigation";
import UserListClient from "./UserListClient";

export const metadata = {
  title: "User Management | Kanglogo Dashboard",
  description: "Manage clients and administrators",
};

export default async function UsersPage() {
  const supabase = await createClient();
  const { data: authData } = await supabase.auth.getUser();

  if (!authData.user) {
    redirect("/login");
  }

  // Check if current user is admin, if not redirect them away
  const { data: currentUser } = await supabase
    .from("users")
    .select("is_admin")
    .eq("id", authData.user.id)
    .single();

  if (!currentUser?.is_admin) {
    redirect("/dashboard");
  }

  return (
    <div className="pt-6 px-4 pb-12 h-full flex flex-col">
      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 mb-2">User Management</h1>
        <p className="text-sm font-medium text-slate-500">Monitor and manage all clients and administrative staff accounts directly from this panel.</p>
      </div>

      {/* Main Client Component for Data Fetching & Interactivity */}
      <UserListClient />
    </div>
  );
}
