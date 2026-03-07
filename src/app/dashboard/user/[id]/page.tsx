import { createClient } from "@/utils/supabase/server";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Clock, BriefcaseBusiness, Mail, Calendar, ShieldCheck, User as UserIcon, MapPin, Building, Settings } from "lucide-react";
import Avatar from "@/components/Avatar";

function getTimeAgo(dateString: string) {
  const date = new Date(dateString);
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) return "Just now";
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
  
  const diffInDays = Math.floor(diffInSeconds / 86400);
  if (diffInDays === 1) return "Yesterday";
  if (diffInDays < 7) return `${diffInDays}d ago`;

  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric'
  });
}

export default async function UserProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const supabase = await createClient();
  
  // Await params for Next.js 15+
  const { id } = await params;

  // Coba ambil data profil berdasarkan id
  const { data: profile, error } = await supabase
    .from("users")
    .select("*")
    .eq("id", id)
    .single();

  // Dapatkan user yang sedang login saat ini
  const { data: authData } = await supabase.auth.getUser();
  const isOwnProfile = authData.user?.id === id;

  if (!profile || error) {
    notFound();
  }

  // Ambil data timeline/aktivitas dari database
  const { data: activitiesData } = await supabase
    .from("user_activities")
    .select("*")
    .eq("user_id", id)
    .order("created_at", { ascending: false });

  const activities = activitiesData || [];

  // Ambil data order/project dari database
  const { data: ordersData } = await supabase
    .from("store_orders")
    .select(`
      id,
      status,
      created_at,
      product_id,
      service_id,
      store_products(title),
      store_services(title)
    `)
    .eq("user_id", id)
    .order("created_at", { ascending: false });

  const orders = ordersData || [];
  const completedProjects = orders.filter(o => o.status === 'completed').length;
  const ongoingProjects = orders.filter(o => o.status !== 'completed' && o.status !== 'cancelled' && o.status !== 'pending').length;

  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'completed': return { color: "text-emerald-600", bg: "bg-emerald-50", border: "border-emerald-100", label: "COMPLETED" };
      case 'cancelled': return { color: "text-red-600", bg: "bg-red-50", border: "border-red-100", label: "CANCELLED" };
      case 'pending': return { color: "text-slate-600", bg: "bg-slate-50", border: "border-slate-100", label: "PENDING" };
      default: return { color: "text-amber-600", bg: "bg-amber-50", border: "border-amber-100", label: "ON PROGRESS" };
    }
  };

  // Format tanggal bergabung
  const joinDate = new Date(profile.created_at).toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric'
  });

  return (
    <div className="pt-6 px-4 pb-10">
      
      {/* Profil Header Banner */}
      <div className="w-full bg-gradient-to-r from-indigo-600 to-indigo-500 rounded-3xl p-6 sm:p-10 mb-6 text-white shadow-lg shadow-indigo-200 relative overflow-hidden">
        {/* Dekorasi Background */}
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 rounded-full bg-white opacity-10 blur-3xl"></div>
        <div className="absolute bottom-0 left-0 -ml-16 -mb-16 w-48 h-48 rounded-full bg-indigo-300 opacity-20 blur-2xl"></div>

        <div className="relative z-10 flex flex-col sm:flex-row items-center sm:items-end gap-6">
          {/* Avatar Besar */}
          <div className="shrink-0 p-1 bg-white/20 rounded-2xl backdrop-blur-md shadow-sm">
            <Avatar 
              url={profile.avatar_url}
              name={profile.full_name || profile.email || "U"}
              imageClassName="w-24 h-24 sm:w-32 sm:h-32 rounded-xl object-cover"
              fallbackClassName="w-24 h-24 sm:w-32 sm:h-32 rounded-xl bg-indigo-100 flex items-center justify-center text-indigo-500 text-4xl sm:text-5xl font-bold"
            />
          </div>

          <div className="flex-1 text-center sm:text-left mb-2">
            <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-2">
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">{profile.full_name || "Unknown User"}</h1>
              {profile.is_admin ? (
                <span className="inline-flex items-center gap-1 bg-emerald-400/20 text-emerald-100 border border-emerald-400/30 text-xs font-bold uppercase tracking-wider px-2.5 py-1 rounded-lg">
                  <ShieldCheck className="w-3.5 h-3.5" /> Staff Admin
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 bg-white/20 text-white border border-white/30 text-xs font-bold uppercase tracking-wider px-2.5 py-1 rounded-lg">
                  <UserIcon className="w-3.5 h-3.5" /> Client
                </span>
              )}
            </div>
            
            <div className="flex flex-col sm:flex-row sm:items-center gap-4 text-indigo-100 text-sm font-medium">
              <div className="flex items-center justify-center sm:justify-start gap-1.5">
                <Mail className="w-4 h-4 opacity-70" /> {profile.email}
              </div>
              <div className="hidden sm:block w-1.5 h-1.5 rounded-full bg-indigo-300"></div>
              <div className="flex items-center justify-center sm:justify-start gap-1.5">
                <Calendar className="w-4 h-4 opacity-70" /> Joined {joinDate}
              </div>
            </div>
          </div>
          
          <div className="shrink-0 mt-4 sm:mt-0">
             {isOwnProfile ? (
               <Link href={`/dashboard/user/${id}/edit`} className="bg-white/10 text-white hover:bg-white/20 border border-white/20 text-sm font-bold uppercase tracking-wider px-6 py-3 rounded-xl transition-colors flex items-center gap-2">
                 <Settings className="w-4 h-4" /> Edit Profile
               </Link>
             ) : (
               <Link href="/dashboard/chat" className="bg-white/10 text-white hover:bg-white/20 border border-white/20 text-sm font-bold uppercase tracking-wider px-6 py-3 rounded-xl transition-colors flex items-center gap-2">
                 <Mail className="w-4 h-4" /> Message
               </Link>
             )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        
        {/* Kolom Kiri: Informasi Pribadi & Proyek */}
        <div className="xl:col-span-2 space-y-6">
          
          {/* Box Tentang Klien */}
          <div className="bg-white shadow-sm ring-1 ring-slate-100 rounded-2xl p-6">
            <h3 className="text-lg font-bold text-slate-900 mb-4 tracking-tight">Client Information</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-1">Company / Organization</span>
                  <div className="flex items-center gap-2 text-sm font-medium text-slate-900">
                    <Building className="w-4 h-4 text-slate-400" /> {profile.company || "-"}
                  </div>
                </div>
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-1">Location</span>
                  <div className="flex items-center gap-2 text-sm font-medium text-slate-900">
                    <MapPin className="w-4 h-4 text-slate-400" /> {profile.location || "-"}
                  </div>
                </div>
              </div>
              
              <div className="space-y-4">
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-1">Total Projects</span>
                  <div className="text-sm font-medium text-slate-900">
                    <span className="font-bold">{completedProjects}</span> Completed, <span className="font-bold text-indigo-600">{ongoingProjects}</span> Ongoing
                  </div>
                </div>
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-1">Client ID</span>
                  <div className="text-sm font-medium text-slate-500 font-mono truncate max-w-[200px]" title={profile.id}>
                    {profile.id.split('-')[0].toUpperCase()}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Tabel Latest Projects Khusus Klien Ini */}
          <div className="bg-white shadow-sm ring-1 ring-slate-100 rounded-2xl p-6">
            <div className="mb-6 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-slate-900 mb-1">Related Projects</h3>
                <span className="text-sm font-medium text-slate-500">History of jobs ordered by this user</span>
              </div>
            </div>
            
            <div className="overflow-x-auto rounded-xl ring-1 ring-slate-100 mt-4">
              <table className="min-w-full divide-y divide-slate-200">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="p-4 text-left text-xs font-bold uppercase tracking-wider text-slate-500">Service</th>
                    <th className="p-4 text-center text-xs font-bold uppercase tracking-wider text-slate-500">Status</th>
                    <th className="p-4 text-right text-xs font-bold uppercase tracking-wider text-slate-500">Date</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-slate-100 border-t border-slate-200">
                  {orders.length > 0 ? (
                    orders.map((order) => {
                      const style = getStatusStyle(order.status);
                      const product = (Array.isArray(order.store_products) ? order.store_products[0] : order.store_products) as { title?: string } | null;
                      const service = (Array.isArray(order.store_services) ? order.store_services[0] : order.store_services) as { title?: string } | null;
                      const productName = product?.title;
                      const serviceName = service?.title;
                      const title = serviceName || productName || "Unknown Service";
                      const date = new Date(order.created_at).toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
                      
                      return (
                        <tr key={order.id} className="hover:bg-slate-50/80 transition-colors">
                          <td className="p-4 whitespace-nowrap text-left">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600 shrink-0">
                                <BriefcaseBusiness className="w-4 h-4" />
                              </div>
                              <span className="text-sm font-bold text-slate-900">{title}</span>
                            </div>
                          </td>
                          <td className="p-4 whitespace-nowrap text-center">
                            <span className={`${style.bg} ${style.color} ${style.border} text-xs font-bold uppercase tracking-wider px-2.5 py-1 rounded border shadow-sm`}>
                              {style.label}
                            </span>
                          </td>
                          <td className="p-4 whitespace-nowrap text-sm font-medium text-slate-400 text-right">
                            {date}
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={3} className="p-8 text-center text-sm font-medium text-slate-400">
                        No projects found for this user.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Kolom Kanan: Timeline Aktivitas Klien */}
        <div className="space-y-6">
          <div className="bg-white shadow-sm ring-1 ring-slate-100 rounded-2xl p-6">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-6 border-b border-slate-100 pb-4">Activity Timeline</h3>
            <div className="flow-root">
              <ul className="relative border-l border-slate-200 ml-3 mt-2">
                {activities.map((act) => (
                  <li key={act.id} className="mb-7 ml-6 relative last:mb-0">
                    <span className="absolute flex items-center justify-center w-6 h-6 bg-slate-50 border border-slate-200 rounded-full -left-[37px] ring-4 ring-white shadow-sm">
                      <Clock className="w-3 h-3 text-slate-400" />
                    </span>
                    <div className="flex flex-col gap-1 items-start">
                      <p className="text-sm font-medium text-slate-600 leading-snug">
                        {act.title}{" "}
                        {act.highlight && (
                          <span className={`font-bold ${act.highlight_color || 'text-slate-900'}`}>{act.highlight}</span>
                        )}
                      </p>
                      <time className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{getTimeAgo(act.created_at)}</time>
                    </div>
                  </li>
                ))}
                
                {/* Entri Default / Terakhir: Pembuatan Akun */}
                <li className="mb-7 ml-6 relative last:mb-0">
                  <span className="absolute flex items-center justify-center w-6 h-6 bg-slate-50 border border-slate-200 rounded-full -left-[37px] ring-4 ring-white shadow-sm">
                    <Clock className="w-3 h-3 text-slate-400" />
                  </span>
                  <div className="flex flex-col gap-1 items-start">
                    <p className="text-sm font-medium text-slate-600 leading-snug">
                      Created account in Kanglogo Dashboard
                    </p>
                    <time className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{joinDate}</time>
                  </div>
                </li>
              </ul>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
