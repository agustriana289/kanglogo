import { Rocket, LifeBuoy, CheckCircle2, DollarSign, Clock } from "lucide-react";
import { createClient } from "@/utils/supabase/server";
import { getTimeAgo } from "@/utils/dateFormatter";

export default async function UserDashboard({ name }: { name: string }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // Fetch only this specific user's activities
  const { data: userActivitiesList } = await supabase
    .from("user_activities")
    .select("*")
    .eq("user_id", user?.id)
    .order("created_at", { ascending: false })
    .limit(10);
  
  const activities = userActivitiesList || [];

  // Fetch all user orders for accurate stats
  const { data: allUserOrders } = await supabase
    .from("store_orders")
    .select("total_amount, status")
    .eq("user_id", user?.id);

  const totalInvestment = allUserOrders?.reduce((sum, order) => sum + Number(order.total_amount || 0), 0) || 0;
  const activeProjectsCount = allUserOrders?.filter(o => o.status !== "completed" && o.status !== "cancelled").length || 0;
  const completedProjectsCount = allUserOrders?.filter(o => o.status === "completed").length || 0;

  // Fetch open tickets count
  const { count: openTicketsCount } = await supabase
    .from("support_tickets")
    .select("*", { count: "exact", head: true })
    .eq("user_id", user?.id)
    .in("status", ["open", "in_progress"]);

  // Fetch latest active announcement
  const { data: latestAnnouncement } = await supabase
    .from("site_announcements")
    .select("*")
    .eq("is_active", true)
    .order("created_at", { ascending: false })
    .limit(1)
    .single();

  // Fetch recent orders for the table
  const { data: rawOrders } = await supabase
    .from("store_orders")
    .select(`
      id,
      payment_status,
      status,
      total_amount,
      created_at,
      store_services ( title, category ),
      store_products ( title, category )
    `)
    .eq("user_id", user?.id)
    .order("created_at", { ascending: false })
    .limit(5);

  const recentOrders = rawOrders || [];

  return (
    <div className="pt-6 px-4">


      {/* Top Banner & Stats Area */}
      <div className="w-full bg-linear-to-r from-indigo-600 to-indigo-500 rounded-3xl p-6 sm:p-8 mb-6 text-white shadow-lg shadow-indigo-200">
        <div className="mb-8">
          <h1 className="text-2xl font-bold tracking-tight mb-2">Good morning, {name || "User"}</h1>
          <p className="text-sm font-medium text-indigo-100">Here&apos;s what&apos;s happening with your projects today.</p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
          {[
            { title: "Active Projects", value: activeProjectsCount.toString(), tag: "↗ Track progress", icon: Rocket },
            { title: "Open Tickets", value: openTicketsCount?.toString() || "0", tag: "↗ Contact support", icon: LifeBuoy },
            { title: "Completed", value: completedProjectsCount.toString(), tag: "↗ View portfolio", icon: CheckCircle2 },
            { title: "Total Investment", value: `Rp ${totalInvestment.toLocaleString("id-ID")}`, tag: "↗ Thank you", icon: DollarSign },
          ].map((stat, i) => (
            <div key={i} className="bg-white/10 backdrop-blur-md rounded-2xl p-5 ring-1 ring-white/20 transition-all hover:bg-white/20">
              <div className="flex items-center gap-2 mb-3 text-indigo-100">
                <stat.icon className="w-4 h-4" />
                <h3 className="text-sm font-medium">{stat.title}</h3>
              </div>
              <span className="text-2xl font-bold text-white block mb-2">{stat.value}</span>
              <p className="text-xs font-bold uppercase tracking-wider text-emerald-300">{stat.tag}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Main Content Areas */}
      <div className="w-full grid grid-cols-1 xl:grid-cols-2 2xl:grid-cols-3 gap-4 mt-4">
        <div className="2xl:col-span-2 space-y-4">
          
          {/* Support Center */}
          <div className="bg-white shadow-sm ring-1 ring-slate-100 rounded-2xl p-4 sm:p-6 xl:p-8">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-bold text-slate-900 tracking-tight">Support Center</h3>
              </div>
              <div className="flex mt-4 sm:mt-0 flex-wrap gap-2">
                <button className="text-slate-900 bg-white hover:bg-slate-50 border border-slate-200 focus:ring-2 focus:ring-slate-100 rounded-lg text-xs font-bold uppercase tracking-wider px-4 py-2 shadow-sm transition-colors">
                  + CREATE TICKET
                </button>
                <button className="text-white bg-slate-900 hover:bg-slate-800 focus:ring-2 focus:ring-slate-300 rounded-lg text-xs font-bold uppercase tracking-wider px-4 py-2 flex items-center gap-2 shadow-sm transition-colors">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"><path fillRule="evenodd" d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z" clipRule="evenodd"></path></svg>
                  DIRECT CHAT
                </button>
                <button className="text-emerald-700 bg-emerald-100 hover:bg-emerald-200 border border-emerald-200 focus:ring-2 focus:ring-emerald-100 rounded-lg text-xs font-bold uppercase tracking-wider px-4 py-2 shadow-sm transition-colors">
                  WHATSAPP
                </button>
              </div>
            </div>
            <p className="text-sm font-medium text-slate-500 mb-6">
              You have {openTicketsCount || 0} active support request{Number(openTicketsCount) !== 1 ? 's' : ''}. Our team is processing your reports to ensure everything stays on track.
            </p>
            <a href="#" className="flex items-center text-xs font-bold uppercase tracking-wider text-indigo-600 hover:text-indigo-700 transition-colors inline-block hover:translate-x-1 transform duration-200">
              PROCEED TO TICKET MANAGEMENT &rarr;
            </a>
          </div>

          {/* Recent Orders */}
          <div className="bg-white shadow-sm ring-1 ring-slate-100 rounded-2xl p-4 sm:p-6 xl:p-8">
            <div className="mb-6 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-slate-900 mb-1">Recent Orders</h3>
                <span className="text-sm font-medium text-slate-500">Your latest transactions</span>
              </div>
              <div className="shrink-0">
                <a href="#" className="text-xs font-bold uppercase tracking-wider text-indigo-600 hover:bg-slate-50 rounded-lg px-3 py-2 transition-colors">View All</a>
              </div>
            </div>
            
            <div className="flex flex-col mt-4">
              <div className="overflow-x-auto rounded-xl ring-1 ring-slate-100">
                <div className="align-middle inline-block min-w-full">
                  <div className="shadow-none overflow-hidden">
                    <table className="min-w-full divide-y divide-slate-200">
                      <thead className="bg-slate-50">
                        <tr>
                          <th scope="col" className="p-4 text-left text-xs font-bold uppercase tracking-wider text-slate-500">Order Ref</th>
                          <th scope="col" className="p-4 text-left text-xs font-bold uppercase tracking-wider text-slate-500">Service/Product</th>
                          <th scope="col" className="p-4 text-center text-xs font-bold uppercase tracking-wider text-slate-500">Amount</th>
                          <th scope="col" className="p-4 text-center text-xs font-bold uppercase tracking-wider text-slate-500">Status</th>
                          <th scope="col" className="p-4 text-right text-xs font-bold uppercase tracking-wider text-slate-500">Date</th>
                          <th scope="col" className="p-4 text-right text-xs font-bold uppercase tracking-wider text-slate-500">Action</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-slate-100 border-t border-slate-200">
                        {recentOrders.length === 0 ? (
                          <tr>
                            <td colSpan={6} className="p-4 whitespace-nowrap text-sm font-medium text-slate-400 italic text-center py-12">
                              No orders found. Head to the Shop to browse products!
                            </td>
                          </tr>
                        ) : (
                          recentOrders.map((order: any, i: number) => {
                            const itemName = order.store_services?.title || order.store_products?.title || "Custom Order";
                            const itemCat = order.store_services?.category || order.store_products?.category || "Service";
                            
                            return (
                              <tr key={order.id} className="hover:bg-slate-50/80 transition-colors">
                                <td className="p-4 whitespace-nowrap text-xs font-bold text-slate-700 text-left">
                                  #{order.id.split('-')[0].toUpperCase()}
                                </td>
                                <td className="p-4 whitespace-nowrap text-left">
                                  <div className="text-sm font-bold text-slate-900">{itemName}</div>
                                  <div className="text-sm font-medium text-slate-500 mt-0.5">{itemCat}</div>
                                </td>
                                <td className="p-4 whitespace-nowrap text-sm font-bold text-slate-900 text-center">
                                  Rp {Number(order.total_amount || 0).toLocaleString("id-ID")}
                                </td>
                                <td className="p-4 whitespace-nowrap text-center">
                                  <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded shadow-sm border ${
                                    order.status === 'completed' ? 'bg-emerald-50 text-emerald-600 border-emerald-200' :
                                    order.status === 'cancelled' ? 'bg-red-50 text-red-600 border-red-200' :
                                    order.status === 'processing' ? 'bg-indigo-50 text-indigo-600 border-indigo-200' :
                                    'bg-amber-50 text-amber-600 border-amber-200'
                                  }`}>
                                    {order.status.replace('_', ' ')}
                                  </span>
                                </td>
                                <td className="p-4 whitespace-nowrap text-xs font-medium text-slate-400 text-right">
                                  {new Date(order.created_at).toLocaleDateString("id-ID", { day: 'numeric', month: 'short', year: 'numeric' })}
                                </td>
                                <td className="p-4 whitespace-nowrap text-right">
                                  <div className="flex justify-end">
                                    <a href={`/workspace/${order.id}`} className="text-white bg-indigo-600 hover:bg-indigo-700 px-3 py-1.5 rounded-lg inline-flex items-center gap-2 transition-colors shadow-sm text-xs font-bold uppercase tracking-wider" title="Open Workspace">
                                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z" />
                                      </svg>
                                      Workspace
                                    </a>
                                  </div>
                                </td>
                              </tr>
                            );
                          })
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
        </div>

        <div className="space-y-4 flex flex-col">
          {/* Announcements */}
          <div className="bg-white shadow-sm ring-1 ring-slate-100 rounded-2xl p-4 sm:p-6 xl:p-8">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-8 border-b border-slate-100 pb-4">Announcements</h3>
            
            <div className="flow-root">
              <ul className="relative border-l-2 border-slate-200 border-dashed ml-3">                  
                {latestAnnouncement ? (
                  <li className="mb-2 ml-6">
                    <span className="absolute flex items-center justify-center w-5 h-5 bg-indigo-100 rounded-full -left-2.5 ring-4 ring-white shadow-sm">
                      <div className="w-2.5 h-2.5 bg-indigo-600 rounded-full"></div>
                    </span>
                    <div className="flex justify-between items-start mb-1.5 mt-0.5">
                      <h3 className="flex items-center text-lg font-bold text-slate-900 tracking-tight">
                        {latestAnnouncement.title}
                      </h3>
                      <span className="bg-amber-100 text-amber-700 border border-amber-200 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded shadow-sm ml-3">
                        {latestAnnouncement.type || "INFO"}
                      </span>
                    </div>
                    <time className="block mb-4 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      {new Date(latestAnnouncement.created_at).toLocaleDateString("id-ID", { day: 'numeric', month: 'short', year: 'numeric' })}
                    </time>
                    <div className="text-sm font-medium text-slate-600 bg-slate-50 border border-slate-100 p-4 rounded-xl shadow-sm leading-relaxed relative">
                      <div className="absolute w-3 h-3 bg-slate-50 border-t border-l border-slate-100 top-[-7px] left-6 rotate-45"></div>
                      {latestAnnouncement.content}
                    </div>
                  </li>
                ) : (
                  <li className="mb-2 ml-6 text-sm text-slate-400 italic">No new announcements.</li>
                )}
              </ul>
            </div>
          </div>

          {/* Timeline */}
          <div className="bg-white shadow-sm ring-1 ring-slate-100 rounded-2xl p-4 sm:p-6 xl:p-8 flex-1">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-8 border-b border-slate-100 pb-4">Timeline</h3>
            <div className="flow-root">
              <ul className="relative border-l border-slate-200 ml-3 mt-4">
                {activities.length > 0 ? (
                  activities.map((act) => (
                    <li key={act.id} className="mb-7 ml-6 relative last:mb-0">
                      <span className="absolute flex items-center justify-center w-6 h-6 bg-slate-50 border border-slate-200 rounded-full -left-[37px] ring-4 ring-white shadow-sm">
                        <Clock className="w-3 h-3 text-slate-400" />
                      </span>
                      <div className="flex justify-between items-start gap-4">
                        <div className="flex flex-col gap-1 items-start pt-0.5">
                          <p className="text-sm font-medium text-slate-600 leading-relaxed">
                            {act.title}{" "}
                            {act.highlight && (
                              <span className={`font-bold ${act.highlight_color || 'text-slate-900'}`}>{act.highlight}</span>
                            )}
                          </p>
                        </div>
                        <time className="text-xs font-medium whitespace-nowrap text-slate-400 pt-1 tracking-wide">{getTimeAgo(act.created_at)}</time>
                      </div>
                    </li>
                  ))
                ) : (
                  <li className="mb-7 ml-6 relative text-sm text-slate-500 font-medium pt-2">No recent account activities.</li>
                )}
              </ul>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
