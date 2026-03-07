import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import AdminTicketChatClient from "./AdminTicketChatClient";
import TicketChatClient from "./TicketChatClient";

export default async function TicketChatPage({ params }: { params: Promise<{ id: string }> }) {
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

  const { data: ticket } = await supabase
    .from("support_tickets")
    .select("*")
    .eq("id", id)
    .single();

  if (!ticket) {
    redirect("/dashboard/tickets");
  }

  // Ensure user can access
  if (!profile?.is_admin && ticket.user_id !== user.id) {
    redirect("/dashboard/tickets");
  }

  if (profile?.is_admin) {
    return <AdminTicketChatClient ticket={ticket} user={user} />;
  }

  return <TicketChatClient ticket={ticket} user={user} />;
}
