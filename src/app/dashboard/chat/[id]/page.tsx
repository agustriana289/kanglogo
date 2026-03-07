import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import AdminChatRoomClient from "./AdminChatRoomClient";

export default async function AdminChatRoomPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("users")
    .select("is_admin")
    .eq("id", user.id)
    .single();

  if (!profile?.is_admin) {
    redirect("/dashboard/chat");
  }

  return <AdminChatRoomClient roomId={id} user={user} />;
}
