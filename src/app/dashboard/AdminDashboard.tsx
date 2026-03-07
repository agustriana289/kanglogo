import { Wallet, TrendingUp, Users, Ticket, Clock, Box } from "lucide-react";
import Link from "next/link";
import Avatar from "@/components/Avatar";
import { createClient } from "@/utils/supabase/server";
import { getTimeAgo } from "@/utils/dateFormatter";
import YearFilter from "./YearFilter";

export default async function AdminDashboard({
  name,
  yearParam,
}: {
  name: string;
  yearParam?: string;
}) {
  const supabase = await createClient();

  // Fetch count of all non-admin clients
  const { count: totalClientsCount } = await supabase
    .from("users")
    .select("*", { count: "exact", head: true })
    .eq("is_admin", false);

  // Fetch recent 5 clients
  const { data: recentClients } = await supabase
    .from("users")
    .select("id, full_name, email, avatar_url")
    .eq("is_admin", false)
    .order("created_at", { ascending: false })
    .limit(5);

  // Fetch all recent timeline activities across platform (Admin can see all)
  const { data: timelineData } = await supabase
    .from("user_activities")
    .select("*, users (full_name, email)")
    .order("created_at", { ascending: false })
    .limit(10);
  const adminActivities = timelineData || [];

  // Fetch real orders
  const { data: allOrders } = await supabase
    .from("store_orders")
    .select(
      `
      id,
      order_number,
      status,
      total_amount,
      form_data,
      selected_package,
      created_at,
      user_id,
      service_id,
      product_id,
      store_services ( title, category ),
      store_products ( title, category )
    `,
    )
    .order("created_at", { ascending: false });

  // Fetch all users for client name mapping
  const { data: allUsers } = await supabase
    .from("users")
    .select("id, full_name, email");
  const userMap: Record<string, { full_name?: string; email?: string }> = {};
  (allUsers || []).forEach((u: any) => {
    userMap[u.id] = u;
  });
  const orders = allOrders || [];
  const completedOrders = orders.filter((o) =>
    ["paid", "processing", "completed"].includes(o.status),
  );
  const totalRevenue = completedOrders.reduce(
    (sum, order) => sum + Number(order.total_amount || 0),
    0,
  );

  // Calculate Best Seller
  const serviceCounts: Record<string, number> = {};
  const productCounts: Record<string, number> = {};
  let bestSellerName = "None";
  let bestSellerCount = 0;

  orders.forEach((o) => {
    if (o.service_id) {
      serviceCounts[o.service_id] = (serviceCounts[o.service_id] || 0) + 1;
      if (serviceCounts[o.service_id] > bestSellerCount) {
        bestSellerCount = serviceCounts[o.service_id];
        bestSellerName = (o.store_services as any)?.title || "Agency Service";
      }
    }
    if (o.product_id) {
      productCounts[o.product_id] = (productCounts[o.product_id] || 0) + 1;
      if (productCounts[o.product_id] > bestSellerCount) {
        bestSellerCount = productCounts[o.product_id];
        bestSellerName = (o.store_products as any)?.title || "Shop Item";
      }
    }
  });
  const recentOrdersList = orders.slice(0, 5);

  // Fetch open tickets count
  const { data: latestTickets, count: openTicketsCount } = await supabase
    .from("support_tickets")
    .select("subject, users(full_name, email)", { count: "exact" })
    .eq("status", "open")
    .order("created_at", { ascending: false })
    .limit(1);

  let latestTicketText = "No open tickets";
  if (latestTickets && latestTickets.length > 0) {
    const t = latestTickets[0];
    const userRef = t.users as any;
    const authorName =
      userRef?.full_name ||
      (userRef?.email ? userRef.email.split("@")[0] : "Unknown");
    latestTicketText = `${t.subject} from ${authorName}`;
  }

  const latestClientText =
    recentClients && recentClients.length > 0
      ? `New Client: ${recentClients[0].full_name || recentClients[0].email.split("@")[0]}`
      : "No clients yet";

  // Fetch recent portfolios
  const { data: portfolios } = await supabase
    .from("store_portfolios")
    .select("id, title, images")
    .eq("is_published", true)
    .order("created_at", { ascending: false })
    .limit(4);

  // Fetch services with order counts
  const { data: services } = await supabase
    .from("store_services")
    .select("id, title, category");

  // Calculate service sales (this is simplified, ideally we'd join but let's count from memory for now)
  const serviceSales = ((services as Record<string, unknown>[]) || [])
    .map((s) => ({
      name: s.title as string,
      cat: s.category as string,
      sold: orders.filter((o) => o.store_services?.title === s.title).length,
    }))
    .sort((a, b) => b.sold - a.sold)
    .slice(0, 5);

  // Fetch products with sales
  const { data: products } = await supabase
    .from("store_products")
    .select("id, title, category");

  const productSales = ((products as Record<string, unknown>[]) || [])
    .map((p) => ({
      name: p.title as string,
      cat: p.category as string,
      sold: orders.filter((o) => o.store_products?.title === p.title).length,
    }))
    .sort((a, b) => b.sold - a.sold)
    .slice(0, 5);

  // Monthly Revenue Data (All time by Year)
  const currentYear = new Date().getFullYear();
  const availableYears = [];
  for (let y = currentYear; y >= 2023; y--) {
    availableYears.push(y);
  }

  // We'll calculate the stats for the first available year (latest)
  const displayYear = yearParam ? parseInt(yearParam) : currentYear;

  const monthlyRevenue = Array.from({ length: 12 }, (_, i) => {
    const month = i;
    const revenue = completedOrders
      .filter((o) => {
        const d = new Date(o.created_at);
        return d.getFullYear() === displayYear && d.getMonth() === month;
      })
      .reduce((sum, o) => sum + Number(o.total_amount || 0), 0);
    return {
      month: new Date(displayYear, month).toLocaleString("default", {
        month: "short",
      }),
      value: revenue,
    };
  });

  const maxRevenue = Math.max(...monthlyRevenue.map((m) => m.value), 1);
  const currentMonthRevenue =
    monthlyRevenue.find(
      (m) =>
        m.month === new Date().toLocaleString("default", { month: "short" }),
    )?.value || 0;

  const getFormData = (o: any) => {
    try {
      return typeof o.form_data === "string"
        ? JSON.parse(o.form_data)
        : o.form_data || {};
    } catch {
      return {};
    }
  };

  const getProjectTitle = (o: any) => {
    const fd = getFormData(o);
    const baseTitle = o.store_services?.title || o.store_products?.title;
    try {
      const pkg =
        typeof o.selected_package === "string"
          ? JSON.parse(o.selected_package)
          : o.selected_package || {};
      const pkgName = pkg?.name || "";
      const projectNote =
        fd["Project Title"] || fd["Nama Logo"] || fd["nama_logo"] || "";
      if (baseTitle && projectNote) return `${baseTitle} — ${projectNote}`;
      if (baseTitle && pkgName) return `${baseTitle} (${pkgName})`;
      if (baseTitle) return baseTitle;
      if (pkgName && projectNote) return `${pkgName} — ${projectNote}`;
      return pkgName || fd.customer_name || "Project";
    } catch {
      return baseTitle || "Project";
    }
  };

  const getClientName = (o: any) => {
    const u = userMap[o.user_id];
    if (u?.full_name) return u.full_name;
    if (u?.email) return u.email.split("@")[0];
    const fd = getFormData(o);
    return (
      fd.customer_name || fd["Client Name"] || fd["Nama"] || "Offline Client"
    );
  };

  return (
    <div className="pt-6 px-4">
      {/* Top Banner & Stats Area */}
      <div className="w-full bg-linear-to-r from-indigo-600 to-indigo-500 rounded-3xl p-6 sm:p-8 mb-6 text-white shadow-lg shadow-indigo-200">
        <div className="mb-8">
          <h1 className="text-2xl font-bold tracking-tight mb-2">
            Good morning, {name || "Admin"}
          </h1>
          <p className="text-sm font-medium text-indigo-100">
            Here&apos;s what&apos;s happening with your agency today.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
          {[
            {
              title: "Total Revenue",
              value: `Rp ${totalRevenue.toLocaleString("id-ID")}`,
              tag: `↗ ${completedOrders.length} orders`,
              icon: Wallet,
            },
            {
              title: "Best Seller",
              value: bestSellerName,
              tag: `↗ ${bestSellerCount} Sold`,
              icon: TrendingUp,
            },
            {
              title: "Total Clients",
              value: totalClientsCount?.toString() || "0",
              tag: latestClientText,
              icon: Users,
            },
            {
              title: "Support Tickets",
              value: openTicketsCount?.toString() || "0",
              tag: latestTicketText,
              icon: Ticket,
            },
          ].map((stat, i) => (
            <div
              key={i}
              className="bg-white/10 backdrop-blur-md rounded-2xl p-5 ring-1 ring-white/20 transition-all hover:bg-white/20"
            >
              <div className="flex items-center gap-2 mb-3 text-indigo-100">
                <stat.icon className="w-4 h-4" />
                <h3 className="text-sm font-medium">{stat.title}</h3>
              </div>
              <span className="text-2xl font-bold text-white block mb-2">
                {stat.value}
              </span>
              <p className="text-xs font-bold uppercase tracking-wider text-emerald-300">
                {stat.tag}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Main Graph & Right Panel */}
      <div className="w-full grid grid-cols-1 xl:grid-cols-2 2xl:grid-cols-3 gap-4 mt-4">
        <div className="bg-white shadow-sm ring-1 ring-slate-100 rounded-2xl p-4 sm:p-6 xl:p-8 2xl:col-span-2 flex flex-col">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-10 gap-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Revenue Report
            </h3>
            <div className="flex items-center gap-3">
              <YearFilter
                availableYears={availableYears}
                displayYear={displayYear}
              />
            </div>
          </div>

          <div className="flex flex-col md:flex-row gap-8 sm:gap-12 flex-1 pb-4">
            {/* Left Stats */}
            <div className="w-full md:w-1/3 xl:w-1/4 flex flex-col justify-center shrink-0">
              <div className="mb-8">
                <span className="text-2xl font-bold text-slate-900 block mb-1">
                  Rp {totalRevenue.toLocaleString("id-ID")}
                </span>
                <span className="text-sm font-medium text-slate-500">
                  Total earnings
                </span>
              </div>

              <div className="mb-6">
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-2.5 h-2.5 bg-indigo-300 rounded-[2px]"></div>
                  <span className="text-sm font-medium text-slate-500">
                    Earnings this month
                  </span>
                </div>
                <span className="text-lg font-bold text-slate-900 block">
                  Rp {currentMonthRevenue.toLocaleString("id-ID")}
                </span>
              </div>

              <div>
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-2.5 h-2.5 bg-indigo-700 rounded-[2px]"></div>
                  <span className="text-sm font-medium text-slate-500">
                    Expense tracked
                  </span>
                </div>
                <span className="text-lg font-bold text-slate-900 block">
                  Rp 0
                </span>
              </div>
            </div>

            {/* Right Chart (CSS Bars) */}
            <div className="w-full md:w-2/3 xl:w-3/4 flex items-end justify-between h-56 sm:h-[280px] relative mt-4 md:mt-0">
              {monthlyRevenue.map((data, idx) => {
                const percentage = (data.value / maxRevenue) * 100;
                return (
                  <div
                    key={idx}
                    className="flex flex-col items-center justify-end h-full w-full group relative cursor-crosshair"
                  >
                    <div className="absolute -top-10 opacity-0 group-hover:opacity-100 bg-slate-800 text-white text-[10px] font-bold uppercase tracking-wider py-1 px-2 rounded transition-opacity whitespace-nowrap z-10 pointer-events-none shadow-md">
                      {data.month}: Rp {data.value.toLocaleString("id-ID")}
                    </div>

                    <div className="w-1.5 sm:w-2 overflow-hidden flex flex-col h-[90%] bg-transparent justify-end">
                      <div
                        style={{ height: `${percentage}%` }}
                        className="w-full bg-indigo-600 transition-all duration-500 group-hover:bg-indigo-700 group-hover:scale-x-110 rounded-t-sm"
                      ></div>
                    </div>

                    <span className="absolute -bottom-7 text-[10px] font-bold uppercase tracking-wider text-slate-400 group-hover:text-slate-900 transition-colors">
                      {data.month}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div className="bg-white shadow-sm ring-1 ring-slate-100 rounded-2xl p-4 sm:p-6 xl:p-8 flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-slate-900 tracking-tight">
              Portfolio Gallery
            </h3>
            <span className="text-xs font-bold uppercase tracking-wider text-indigo-600 hover:bg-slate-50 rounded-lg px-3 py-2 cursor-pointer transition-colors">
              View all
            </span>
          </div>
          <div className="grid grid-cols-2 gap-3 mb-8">
            {portfolios?.length === 0 ? (
              <div className="col-span-2 h-40 bg-slate-50 border border-dashed border-slate-200 rounded-xl flex items-center justify-center text-xs font-bold text-slate-400">
                No published portfolios
              </div>
            ) : (
              portfolios?.map((p, idx) => (
                <div
                  key={p.id}
                  className={`bg-slate-100 rounded-xl overflow-hidden border border-slate-200 aspect-video ${idx === 2 ? "col-span-2 h-40" : ""} relative group`}
                >
                  <img
                    src={
                      p.images?.[0] ||
                      "https://images.unsplash.com/photo-1558655146-d09347e92766?w=400&q=80"
                    }
                    alt={p.title}
                    className="w-full h-full object-cover opacity-90 group-hover:scale-105 group-hover:opacity-100 transition-all duration-500"
                  />
                  <div className="absolute inset-0 bg-slate-900/10 group-hover:bg-transparent transition-colors duration-500"></div>
                </div>
              ))
            )}
          </div>
          <div className="mt-auto pt-4 border-t border-slate-100">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-slate-900">
                Recent Clients
              </h3>
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                {totalClientsCount || 0} Total
              </span>
            </div>
            <div className="flex -space-x-3">
              {recentClients?.map((client) => {
                return (
                  <Link
                    key={client.id}
                    href={`/dashboard/user/${client.id}`}
                    className="h-10 w-10 rounded-full border-[3px] border-white bg-indigo-100 flex items-center justify-center text-xs font-bold uppercase tracking-wider text-indigo-700 shadow-sm hover:z-10 hover:scale-110 transition-transform cursor-pointer overflow-hidden"
                    title={client.full_name || client.email}
                  >
                    <Avatar
                      url={client.avatar_url}
                      name={client.full_name || client.email || "U"}
                      imageClassName="w-full h-full object-cover"
                      fallbackClassName="w-full h-full flex items-center justify-center"
                    />
                  </Link>
                );
              })}
              <Link
                href="/dashboard/users"
                className="h-10 w-10 rounded-full border-[3px] border-white bg-slate-50 border-dashed flex items-center justify-center text-slate-400 hover:z-10 hover:text-indigo-600 hover:border-indigo-100 transition-colors cursor-pointer relative"
                title="View All Users"
              >
                <Users size={14} />
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 2xl:grid-cols-2 xl:gap-4 my-4">
        {/* Available Services */}
        <div className="bg-white shadow-sm ring-1 ring-slate-100 rounded-2xl mb-4 p-4 sm:p-6 h-full">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-bold text-slate-900 mb-1">
                Available Services
              </h3>
              <span className="text-sm font-medium text-slate-500">
                Agency core offerings
              </span>
            </div>
            <span className="text-xs font-bold uppercase tracking-wider text-indigo-600 hover:bg-slate-50 rounded-lg px-3 py-2 cursor-pointer transition-colors">
              View all
            </span>
          </div>
          <div className="flow-root mt-8">
            <ul role="list" className="divide-y divide-slate-100">
              {serviceSales.length === 0 ? (
                <li className="py-4 text-center text-xs font-bold text-slate-400 italic">
                  No services created yet.
                </li>
              ) : (
                serviceSales.map((s, i) => (
                  <li
                    key={i}
                    className="py-3 sm:py-4 hover:bg-slate-50 transition-colors -mx-4 px-4 rounded-xl text-left"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-slate-900 truncate">
                          {s.name}
                        </p>
                        <p className="text-sm font-medium text-slate-500 truncate mt-0.5">
                          {s.cat}
                        </p>
                      </div>
                      <div
                        className={`inline-flex items-center text-xs font-bold uppercase tracking-wider ${s.sold > 0 ? "text-amber-500" : "text-slate-400"}`}
                      >
                        {s.sold} Orders
                      </div>
                    </div>
                  </li>
                ))
              )}
            </ul>
          </div>
        </div>

        {/* Shop Products */}
        <div className="bg-white shadow-sm ring-1 ring-slate-100 rounded-2xl mb-4 p-4 sm:p-6 h-full">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-bold text-slate-900 mb-1">
                Shop Products
              </h3>
              <span className="text-sm font-medium text-slate-500">
                Asset & store inventory
              </span>
            </div>
            <span className="text-xs font-bold uppercase tracking-wider text-indigo-600 hover:bg-slate-50 rounded-lg px-3 py-2 cursor-pointer transition-colors">
              View all
            </span>
          </div>
          <div className="flow-root mt-8">
            <ul role="list" className="divide-y divide-slate-100">
              {productSales.length === 0 ? (
                <li className="py-4 text-center text-xs font-bold text-slate-400 italic">
                  No products created yet.
                </li>
              ) : (
                productSales.map((s, i) => (
                  <li
                    key={i}
                    className="py-3 sm:py-4 hover:bg-slate-50 transition-colors -mx-4 px-4 rounded-xl text-left"
                  >
                    <div className="flex items-center space-x-4">
                      <div className="shrink-0">
                        <div className="h-10 w-10 rounded-lg border border-slate-200 bg-slate-50 flex items-center justify-center p-2.5 shadow-sm text-slate-400">
                          <Box size={20} />
                        </div>
                      </div>
                      <div className="flex-1 min-w-0 text-left">
                        <p className="text-sm font-bold text-slate-900 truncate">
                          {s.name}
                        </p>
                        <p className="text-sm font-medium text-slate-500 truncate mt-0.5">
                          {s.cat}
                        </p>
                      </div>
                      <div className="inline-flex items-center text-xs font-bold uppercase tracking-wider text-slate-400">
                        {s.sold} Sold
                      </div>
                    </div>
                  </li>
                ))
              )}
            </ul>
          </div>
        </div>
      </div>

      {/* Bottom Section: Latest Projects & Timeline */}
      <div className="grid grid-cols-1 2xl:grid-cols-3 gap-4 my-4">
        {/* Latest projects */}
        <div className="bg-white shadow-sm ring-1 ring-slate-100 rounded-2xl p-4 sm:p-6 xl:p-8 2xl:col-span-2">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h3 className="text-lg font-bold text-slate-900 mb-1">
                Latest projects
              </h3>
              <span className="text-sm font-medium text-slate-500">
                List of all recent jobs
              </span>
            </div>
          </div>

          <div className="flex flex-col mt-4">
            <div className="overflow-x-auto rounded-xl ring-1 ring-slate-100">
              <div className="align-middle inline-block min-w-full">
                <div className="shadow-none overflow-hidden">
                  <table className="min-w-full divide-y divide-slate-200">
                    <thead className="bg-slate-50">
                      <tr>
                        <th
                          scope="col"
                          className="p-4 text-left text-xs font-bold uppercase tracking-wider text-slate-500"
                        >
                          Order Reference
                        </th>
                        <th
                          scope="col"
                          className="p-4 text-left text-xs font-bold uppercase tracking-wider text-slate-500"
                        >
                          Product / Service
                        </th>
                        <th
                          scope="col"
                          className="p-4 text-left text-xs font-bold uppercase tracking-wider text-slate-500"
                        >
                          Amount
                        </th>
                        <th
                          scope="col"
                          className="p-4 text-left text-xs font-bold uppercase tracking-wider text-slate-500"
                        >
                          Status
                        </th>
                        <th
                          scope="col"
                          className="p-4 text-right text-xs font-bold uppercase tracking-wider text-slate-500"
                        >
                          Date
                        </th>
                        <th
                          scope="col"
                          className="p-4 text-right text-xs font-bold uppercase tracking-wider text-slate-500"
                        >
                          Workspace
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-slate-100 border-t border-slate-200">
                      {recentOrdersList.length === 0 ? (
                        <tr>
                          <td
                            colSpan={5}
                            className="p-4 whitespace-nowrap text-sm font-medium text-slate-400 italic text-center py-12"
                          >
                            No orders found yet.
                          </td>
                        </tr>
                      ) : (
                        recentOrdersList.map((order: any, i: number) => {
                          const itemName = getProjectTitle(order);
                          const itemCat = getClientName(order);

                          const statusColors: Record<string, string> = {
                            pending:
                              "bg-amber-50 text-amber-700 border-amber-100",
                            waiting_payment:
                              "bg-yellow-50 text-yellow-700 border-yellow-100",
                            paid: "bg-indigo-50 text-indigo-700 border-indigo-100",
                            processing:
                              "bg-blue-50 text-blue-700 border-blue-100",
                            completed:
                              "bg-emerald-50 text-emerald-700 border-emerald-100",
                            cancelled: "bg-red-50 text-red-700 border-red-100",
                          };
                          const statusColor =
                            statusColors[order.status] ||
                            "bg-slate-50 text-slate-500 border-slate-100";

                          return (
                            <tr
                              key={order.id}
                              className="hover:bg-slate-50/80 transition-colors"
                            >
                              <td className="p-4 whitespace-nowrap text-sm font-bold text-slate-700 text-left">
                                #
                                {order.order_number ||
                                  order.id.split("-")[0].toUpperCase()}
                              </td>
                              <td className="p-4 whitespace-nowrap text-left">
                                <div className="text-sm font-bold text-slate-900">
                                  {itemName}
                                </div>
                                <div className="text-sm font-medium text-slate-500 mt-0.5">
                                  {itemCat}
                                </div>
                              </td>
                              <td className="p-4 whitespace-nowrap text-sm font-bold text-slate-900 text-left">
                                Rp{" "}
                                {Number(order.total_amount || 0).toLocaleString(
                                  "id-ID",
                                )}
                              </td>
                              <td className="p-4 whitespace-nowrap text-left">
                                <span
                                  className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded shadow-sm border ${statusColor}`}
                                >
                                  {order.status.replace("_", " ")}
                                </span>
                              </td>
                              <td className="p-4 whitespace-nowrap text-sm font-medium text-slate-400 text-right">
                                {new Date(order.created_at).toLocaleDateString(
                                  "id-ID",
                                  {
                                    day: "numeric",
                                    month: "short",
                                    year: "numeric",
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  },
                                )}
                              </td>
                              <td className="p-4 whitespace-nowrap text-right">
                                <Link
                                  href={`/workspace/${order.id}`}
                                  className="text-indigo-600 hover:text-indigo-800 bg-indigo-50 hover:bg-indigo-100 p-2 rounded-lg inline-flex items-center transition-colors shadow-sm"
                                  title="Open Workspace"
                                >
                                  <svg
                                    className="w-4 h-4"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                  >
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      strokeWidth={2}
                                      d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z"
                                    />
                                  </svg>
                                </Link>
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

        {/* Timeline */}
        <div className="bg-white shadow-sm ring-1 ring-slate-100 rounded-2xl p-4 sm:p-6 xl:p-8">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-8 border-b border-slate-100 pb-4">
            Timeline
          </h3>
          <div className="flow-root">
            <ul className="relative border-l border-slate-200 ml-3">
              {adminActivities.length > 0 ? (
                adminActivities.map((act) => (
                  <li key={act.id} className="mb-7 ml-6 relative last:mb-0">
                    <span className="absolute flex items-center justify-center w-6 h-6 bg-slate-50 border border-slate-200 rounded-full -left-[37px] ring-4 ring-white shadow-sm">
                      <Clock className="w-3 h-3 text-slate-400" />
                    </span>
                    <div className="flex justify-between items-start gap-4">
                      <p className="text-sm font-medium text-slate-600 leading-relaxed pt-0.5">
                        <span className="font-bold text-slate-900">
                          {act.users?.full_name || act.users?.email || "A user"}
                        </span>{" "}
                        {act.title}{" "}
                        {act.highlight && (
                          <span
                            className={`font-bold ${act.highlight_color || "text-slate-900"}`}
                          >
                            {act.highlight}
                          </span>
                        )}
                      </p>
                      <time className="text-xs font-medium whitespace-nowrap text-slate-400 pt-1 tracking-wide">
                        {getTimeAgo(act.created_at)}
                      </time>
                    </div>
                  </li>
                ))
              ) : (
                <li className="mb-7 ml-6 relative text-sm text-slate-500 font-medium">
                  No recent activities on the platform.
                </li>
              )}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
