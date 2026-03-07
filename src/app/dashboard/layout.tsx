import { ReactNode } from "react";
import Sidebar from "./Sidebar";
import DashboardHeader from "./DashboardHeader";
import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import { LiveChatPopupProvider } from "@/components/providers/LiveChatPopupProvider";

export default async function DashboardLayout({ children }: { children: ReactNode }) {
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

  const { data: settings } = await supabase.from("settings").select("*").eq("id", 1).single();
  const isAdmin = profile?.is_admin || false;

  return (
    <LiveChatPopupProvider>
      <div className="font-sans antialiased text-gray-900 bg-gray-50 flex flex-col min-h-screen">
        <DashboardHeader user={user} profile={profile} settings={settings} />
        <div className="flex overflow-hidden bg-white pt-16 h-full flex-1">
          <Sidebar isAdmin={isAdmin} />
          <div id="main-content" className="h-full w-full bg-gray-50 relative overflow-y-auto lg:ml-64">
            <main>
              {children}
            </main>
          </div>
        </div>
      </div>
    </LiveChatPopupProvider>
  );
}
