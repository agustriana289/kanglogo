import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import SettingsClient from "./SettingsClient";

export const metadata = {
  title: "System Settings | Kanglogo Dashboard",
  description: "Configure global application settings",
};

export default async function SettingsPage() {
  const supabase = await createClient();
  const { data: authData } = await supabase.auth.getUser();

  if (!authData.user) {
    redirect("/login");
  }

  // Double-check Admin
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
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 mb-2">System Settings</h1>
        <p className="text-sm font-medium text-slate-500">Configure global website preferences, navigation, theme options, and third-party integrations.</p>
      </div>

      <SettingsClient />
    </div>
  );
}
