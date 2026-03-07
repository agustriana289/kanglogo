import { createClient } from "@/utils/supabase/server";
import { notFound, redirect } from "next/navigation";
import WorkspaceClient from "./WorkspaceClient";

async function getOrder(id: string, supabase: any) {
  // 1. Ambil data order
  const { data: order, error: orderError } = await supabase
    .from("store_orders")
    .select("*, store_products(*), store_services(*)")
    .eq("id", id)
    .single();
  
  if (!order || orderError) return null;

  // 2. Ambil User dengan teknik 'Select All'
  const { data: users } = await supabase.from("users").select("*");

  const client = users?.find((p: any) => p.id === order.user_id);
  const admin = users?.find((p: any) => p.is_admin === true);

  return { ...order, client: client || null, admin: admin || null };
}


export default async function WorkspacePage({ params }: { params: { id: string } | Promise<{ id: string }> }) {
  const { id } = await (params instanceof Promise ? params : Promise.resolve(params));
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
    redirect(`/login?redirect=/workspace/${id}`);
  }

  const order = await getOrder(id, supabase);
  if (!order) notFound();

  // Cek Role Admin
  const { data: myProfile } = await supabase.from('users').select('is_admin').eq('id', user.id).single();
  const isAdmin = myProfile?.is_admin === true;

  if (order.user_id !== user.id && !isAdmin) {
    redirect('/');
  }
  // Gabungkan Nama dengan Fallback Email atau Form Data untuk Offline Client
  let fd: any = {};
  try {
    fd = typeof order.form_data === 'string' ? JSON.parse(order.form_data) : (order.form_data || {});
  } catch (e) {}
  
  const clientName = order.client?.full_name 
    || (order.client?.email ? order.client.email.split('@')[0] : null)
    || fd.customer_name 
    || fd["Client Name"] 
    || (order.user_id ? order.user_id.slice(0, 8) + "..." : "Offline Client");
    
  const adminName = isAdmin ? "Administrator" : (order.admin?.full_name || "Admin");

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="w-full">
        <WorkspaceClient 
          order={order} 
          user={user} 
          isAdmin={isAdmin}
          clientName={clientName}
          adminName={adminName}
        />
      </div>
    </div>
  );
}
