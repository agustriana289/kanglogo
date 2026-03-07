import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import UserChatClient from "./UserChatClient";
import AdminChatListClient from "./AdminChatListClient";

export default async function ChatPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("users")
    .select("*")
    .eq("id", user.id)
    .single();

  if (profile?.is_admin) {
    return <AdminChatListClient />;
  }

  return <UserChatClient user={user} profile={profile} />;
}
