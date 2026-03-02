"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import dynamic from "next/dynamic";
import LogoPathAnimation from "@/components/LogoPathAnimation";

// Dynamic import for ApexCharts (client-side only)
const Chart = dynamic(() => import("react-apexcharts"), { ssr: false });

interface MonthlyDataItem {
  month: string;
  count: number;
  revenue: number;
}

interface Task {
  id: number;
  customer_name: string;
  status: string;
  created_at: string;
  package_details: { name: string } | null;
  final_price?: string;
}

export default function AdminDashboard() {
  const router = useRouter();
  const [orderStats, setOrderStats] = useState<{
    thisWeek: number;
    thisMonth: number;
    thisYear: number;
    allTime: number;
    percentChange: number;
    lastMonth?: number;
    revenueThisWeek: number;
    revenueThisMonth: number;
    revenueThisYear: number;
    revenueAllTime: number;
    bestSeller: string;
    totalClients: number;
    totalTestimonials: number;
    recentClients: string[];
    topServices: {name: string, count: number}[];
    topProducts: {name: string, count: number, image?: string}[];
    monthlyData: MonthlyDataItem[];
    storeMonthlyData: MonthlyDataItem[];
  }>({
    thisWeek: 0,
    thisMonth: 0,
    thisYear: 0,
    allTime: 0,
    percentChange: 0,
    revenueThisWeek: 0,
    revenueThisMonth: 0,
    revenueThisYear: 0,
    revenueAllTime: 0,
    bestSeller: "-",
    totalClients: 0,
    totalTestimonials: 0,
    recentClients: [],
    topServices: [],
    topProducts: [],
    monthlyData: [],
    storeMonthlyData: [],
  });
  const [tasks, setTasks] = useState<Task[]>([]);
  const [recentProjects, setRecentProjects] = useState<any[]>([]);
  const [taskTab, setTaskTab] = useState<"in_progress" | "completed">(
    "in_progress",
  );
  const [loading, setLoading] = useState(true);
  const [chartLoaded, setChartLoaded] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      const {
        data: { session },
        error,
      } = await supabase.auth.getSession();
      if (error || !session) {
        router.push("/login");
      } else {
        setAuthChecked(true);
      }
    };
    checkAuth();
  }, [router]);

  useEffect(() => {
    if (authChecked) {
      fetchOrderStats();
      fetchTasks();
      fetchRecentProjects();
      setChartLoaded(true);
    }
  }, [authChecked]);

  const fetchOrderStats = async () => {
    setLoading(true);
    const now = new Date();

    try {
      // This Week
      const weekStart = new Date(now);
      weekStart.setDate(now.getDate() - now.getDay());
      weekStart.setHours(0, 0, 0, 0);
      const { data: weekOrdersData } = await supabase
        .from("orders")
        .select("final_price")
        .gte("created_at", weekStart.toISOString())
        .in("status", ["paid", "accepted", "in_progress", "completed"]);
      const { data: weekStoreData } = await supabase
        .from("store_orders")
        .select("price")
        .gte("created_at", weekStart.toISOString());

      const weekCount =
        (weekOrdersData?.length || 0) + (weekStoreData?.length || 0);
      const revenueThisWeek =
        (weekOrdersData?.reduce(
          (sum, o) => sum + (parseFloat(o.final_price) || 0),
          0,
        ) || 0) +
        (weekStoreData?.reduce(
          (sum, s) => sum + (parseFloat(s.price) || 0),
          0,
        ) || 0);

      // This Month
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      const { data: monthOrdersData } = await supabase
        .from("orders")
        .select("final_price")
        .gte("created_at", monthStart.toISOString())
        .in("status", ["paid", "accepted", "in_progress", "completed"]);
      const { data: monthStoreData } = await supabase
        .from("store_orders")
        .select("price")
        .gte("created_at", monthStart.toISOString());

      const monthCount =
        (monthOrdersData?.length || 0) + (monthStoreData?.length || 0);
      const revenueThisMonth =
        (monthOrdersData?.reduce(
          (sum, o) => sum + (parseFloat(o.final_price) || 0),
          0,
        ) || 0) +
        (monthStoreData?.reduce(
          (sum, s) => sum + (parseFloat(s.price) || 0),
          0,
        ) || 0);

      // Last Month (for comparison)
      const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const lastMonthEnd = new Date(
        now.getFullYear(),
        now.getMonth(),
        0,
        23,
        59,
        59,
      );
      const { count: lastMonthCountRaw } = await supabase
        .from("orders")
        .select("*", { count: "exact", head: true })
        .gte("created_at", lastMonthStart.toISOString())
        .lte("created_at", lastMonthEnd.toISOString());
      const lastMonthCount = lastMonthCountRaw ?? 0;

      // This Year
      const yearStart = new Date(now.getFullYear(), 0, 1);
      const { data: yearOrdersData } = await supabase
        .from("orders")
        .select("final_price")
        .gte("created_at", yearStart.toISOString())
        .in("status", ["paid", "accepted", "in_progress", "completed"]);
      const { data: yearStoreData } = await supabase
        .from("store_orders")
        .select("price")
        .gte("created_at", yearStart.toISOString());

      const yearCount =
        (yearOrdersData?.length || 0) + (yearStoreData?.length || 0);
      const revenueThisYear =
        (yearOrdersData?.reduce(
          (sum, o) => sum + (parseFloat(o.final_price) || 0),
          0,
        ) || 0) +
        (yearStoreData?.reduce(
          (sum, s) => sum + (parseFloat(s.price) || 0),
          0,
        ) || 0);

      // All Time
      const { data: allOrdersData } = await supabase
        .from("orders")
        .select("final_price, customer_name, package_details")
        .in("status", ["paid", "accepted", "in_progress", "completed"]);
      const { data: allStoreData } = await supabase
        .from("store_orders")
        .select("price, product_details");

      const { count: totalTestimonials } = await supabase
        .from("testimonials")
        .select("*", { count: "exact", head: true });

      const allCount =
        (allOrdersData?.length || 0) + (allStoreData?.length || 0);
      const revenueAllTime =
        (allOrdersData?.reduce(
          (sum, o) => sum + (parseFloat(o.final_price) || 0),
          0,
        ) || 0) +
        (allStoreData?.reduce(
          (sum, s) => sum + (parseFloat(s.price) || 0),
          0,
        ) || 0);

      // Calculate Best Seller
      const servicesCounts: Record<string, number> = {};
      const productsCounts: Record<string, {count: number, image?: string}> = {};
      
      if (allOrdersData) {
        allOrdersData.forEach((o: any) => {
          const name = o.package_details?.name || "Layanan Custom";
          servicesCounts[name] = (servicesCounts[name] || 0) + 1;
        });
      }
      if (allStoreData) {
        allStoreData.forEach((s: any) => {
          const name = s.product_details?.name || s.product_details?.title || "Produk Toko";
          const image = s.product_details?.image_src || s.product_details?.image || undefined;
          if (!productsCounts[name]) productsCounts[name] = { count: 0, image };
          productsCounts[name].count += 1;
        });
      }

      let bestSeller = "-";
      let maxSells = 0;
      Object.entries(servicesCounts).forEach(([name, count]) => {
        if (count > maxSells) {
          maxSells = count;
          bestSeller = name;
        }
      });
      Object.entries(productsCounts).forEach(([name, data]) => {
        if (data.count > maxSells) {
          maxSells = data.count;
          bestSeller = name;
        }
      });

      // Calculate Total Clients & Recent Clients
      const clients = new Set(
        allOrdersData?.map((o) => o.customer_name).filter(Boolean),
      );
      const totalClients = clients.size;

      // Extract unique recent clients from latest projects
      const { data: latestProjectsRes } = await supabase
        .from("projects")
        .select("owner")
        .order("created_at", { ascending: false })
        .limit(20);
      const recentClients = Array.from(new Set((latestProjectsRes || []).map(p => p.owner).filter(Boolean))).slice(0, 5);

      // Top Services & Products arrays
      const topServices = Object.entries(servicesCounts)
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);
        
      // Fetch latest products from marketplace_assets to ensure the list is never empty if products exist
      const { data: latestAssets } = await supabase
        .from("marketplace_assets")
        .select("nama_aset, image_url")
        .order("created_at", { ascending: false })
        .limit(5);

      const topProducts = (latestAssets || []).map(asset => {
        const countData = Object.entries(productsCounts).find(([name]) => name === asset.nama_aset);
        return {
          name: asset.nama_aset,
          count: countData ? countData[1].count : 0,
          image: asset.image_url
        };
      }).sort((a, b) => b.count - a.count);

      // Monthly data for chart (last 12 months) - Orders with real revenue
      const monthlyData = [];
      const storeMonthlyData = [];

      for (let i = 11; i >= 0; i--) {
        const monthDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const monthEnd = new Date(
          now.getFullYear(),
          now.getMonth() - i + 1,
          0,
          23,
          59,
          59,
        );

        // Fetch orders with price (Kanglogo uses final_price)
        const { data: ordersData } = await supabase
          .from("orders")
          .select("final_price")
          .gte("created_at", monthDate.toISOString())
          .lte("created_at", monthEnd.toISOString());

        const ordersCount = ordersData?.length || 0;
        const ordersRevenue =
          ordersData?.reduce(
            (sum, o) => sum + (parseFloat(o.final_price) || 0),
            0,
          ) || 0;

        // Fetch store purchases with price (Kanglogo uses store_orders and price)
        const { data: storeData } = await supabase
          .from("store_orders")
          .select("price")
          .gte("created_at", monthDate.toISOString())
          .lte("created_at", monthEnd.toISOString());

        const storeCount = storeData?.length || 0;
        const storeRevenue =
          storeData?.reduce((sum, s) => sum + (parseFloat(s.price) || 0), 0) ||
          0;

        monthlyData.push({
          month: monthDate.toLocaleDateString("en-US", { month: "short" }),
          count: ordersCount,
          revenue: ordersRevenue,
        });

        storeMonthlyData.push({
          month: monthDate.toLocaleDateString("en-US", { month: "short" }),
          count: storeCount,
          revenue: storeRevenue,
        });
      }

      // Calculate percentage change
      const percentChange =
        lastMonthCount > 0
          ? Math.round(((monthCount - lastMonthCount) / lastMonthCount) * 100)
          : monthCount > 0
            ? 100
            : 0;

      setOrderStats({
        thisWeek: weekCount,
        thisMonth: monthCount,
        thisYear: yearCount,
        allTime: allCount,
        lastMonth: lastMonthCount || 0,
        percentChange,
        revenueThisWeek,
        revenueThisMonth,
        revenueThisYear,
        revenueAllTime,
        bestSeller,
        totalClients,
        totalTestimonials: totalTestimonials || 0,
        recentClients,
        topServices,
        topProducts,
        monthlyData,
        storeMonthlyData,
      });
    } catch (error) {
      console.error("Error fetching order stats:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchTasks = async () => {
    try {
      const { data, error } = await supabase
        .from("orders")
        .select("id, customer_name, status, created_at, package_details, final_price")
        .in("status", ["accepted", "in_progress", "completed", "paid"])
        .order("created_at", { ascending: false })
        .limit(20);

      if (error) throw error;
      setTasks(data || []);
    } catch (error) {
      console.error("Error fetching tasks:", error);
    }
  };

  const fetchRecentProjects = async () => {
    try {
      const { data, error } = await supabase
        .from("projects")
        .select("id, title, image_url")
        .order("created_at", { ascending: false })
        .limit(6);

      if (error) throw error;
      setRecentProjects(data || []);
    } catch (error) {
      console.error("Error fetching recent projects:", error);
    }
  };

  const formatDate = (date: string) => {
    return new Intl.DateTimeFormat("id-ID", {
      day: "numeric",
      month: "short",
    }).format(new Date(date));
  };

  // Helper to format price
  const formatRevenueString = (amount: number) => {
    if (amount >= 1000000) {
      return `Rp ${(amount / 1000000).toFixed(1)} jt`;
    } else if (amount >= 1000) {
      return `Rp ${Math.round(amount / 1000)} rb`;
    } else {
      return `Rp ${amount}`;
    }
  };

  // Area chart options for modern curved look
  const areaChartOptions: any = {
    chart: {
      type: "area",
      height: 350,
      zoom: { enabled: false },
      toolbar: { show: false },
      fontFamily: "inherit",
    },
    colors: ["#02cfb6", "#818cf8"],
    dataLabels: { enabled: false },
    stroke: {
      curve: "smooth",
      width: 3,
    },
    fill: {
      type: "gradient",
      gradient: {
        shadeIntensity: 1,
        opacityFrom: 0.4,
        opacityTo: 0.05,
        stops: [0, 90, 100],
      },
    },
    xaxis: {
      categories: orderStats.monthlyData.map((d) => d.month),
      axisBorder: { show: false },
      axisTicks: { show: false },
      labels: {
        style: {
          colors: "#94a3b8",
          fontSize: "12px",
          fontWeight: 500,
        },
      },
      tooltip: { enabled: false },
    },
    yaxis: {
      labels: {
        formatter: (value: number) => {
          if (value >= 1000) return `Rp ${Math.round(value/1000)}k`;
          return value;
        },
        style: {
          colors: "#94a3b8",
          fontSize: "12px",
          fontWeight: 500,
        },
      },
    },
    grid: {
      borderColor: "#f1f5f9",
      strokeDashArray: 0,
      xaxis: { lines: { show: false } },
    },
    legend: { show: false },
    tooltip: {
      theme: "light",
      y: {
        formatter: function (val: number) {
          return formatRevenueString(val);
        },
      },
    },
  };

  const areaChartSeries = [
    {
      name: "Revenue",
      data: orderStats.monthlyData.map((d, i) => d.revenue + orderStats.storeMonthlyData[i].revenue),
    },
  ];

  // Fullscreen loading
  if (!authChecked || loading) {
    return (
      <div className="fixed inset-0 z-50 flex justify-center items-center bg-white">
        <LogoPathAnimation />
      </div>
    );
  }

  return (
    <div className="p-4 lg:p-6 space-y-6">
      {/* Stats Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Revenue */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5">
          <p className="text-slate-500 text-sm font-medium">Total Revenue</p>
          <div className="flex items-end justify-between mt-3">
            <p className="text-3xl font-bold text-slate-800">
              {formatRevenueString(orderStats.revenueAllTime)}
            </p>
            <span className="text-xs font-medium text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full">
              {orderStats.allTime} Orders
            </span>
          </div>
        </div>

        {/* Best Seller */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5">
          <p className="text-slate-500 text-sm font-medium">Best Seller</p>
          <div className="flex items-end justify-between mt-3">
            <p className="text-2xl font-bold text-slate-800 truncate" title={orderStats.bestSeller}>
              {orderStats.bestSeller}
            </p>
            <span className="text-xs font-medium text-primary bg-primary/10 px-2 py-1 rounded-full">
              Top
            </span>
          </div>
        </div>

        {/* Total Clients */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5">
          <p className="text-slate-500 text-sm font-medium">Total Clients</p>
          <div className="flex items-end justify-between mt-3">
            <p className="text-3xl font-bold text-slate-800">
              {orderStats.totalClients}
            </p>
            <span className="text-xs font-medium text-blue-600 bg-blue-50 px-2 py-1 rounded-full">
              Active
            </span>
          </div>
        </div>

        {/* Testimonials */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5">
          <p className="text-slate-500 text-sm font-medium">Testimonials</p>
          <div className="flex items-end justify-between mt-3">
            <p className="text-3xl font-bold text-slate-800">
              {orderStats.totalTestimonials}
            </p>
            <span className="text-xs font-medium text-amber-600 bg-amber-50 px-2 py-1 rounded-full">
              Total
            </span>
          </div>
        </div>
      </div>

      {/* Middle Grid: Chart + Portfolios & Clients */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (2/3) - Chart */}
        <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-lg font-bold text-slate-800">Revenue Performance</h2>
            </div>
            <button className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path fillRule="evenodd" clipRule="evenodd" d="M10.2441 6C10.2441 5.0335 11.0276 4.25 11.9941 4.25H12.0041C12.9706 4.25 13.7541 5.0335 13.7541 6C13.7541 6.9665 12.9706 7.75 12.0041 7.75H11.9941C11.0276 7.75 10.2441 6.9665 10.2441 6ZM10.2441 18C10.2441 17.0335 11.0276 16.25 11.9941 16.25H12.0041C12.9706 16.25 13.7541 17.0335 13.7541 18C13.7541 18.9665 12.9706 19.75 12.0041 19.75H11.9941C11.0276 19.75 10.2441 18.9665 10.2441 18ZM11.9941 10.25C11.0276 10.25 10.2441 11.0335 10.2441 12C10.2441 12.9665 11.0276 13.75 11.9941 13.75H12.0041C12.9706 13.75 13.7541 12.9665 13.7541 12C13.7541 11.0335 12.9706 10.25 12.0041 10.25H11.9941Z" />
              </svg>
            </button>
          </div>

          <div className="-mx-2 mt-auto">
            {chartLoaded && (
              <Chart
                options={areaChartOptions}
                series={areaChartSeries}
                type="area"
                height={300}
              />
            )}
          </div>
        </div>

        {/* Right Column (1/3) */}
        <div className="space-y-6 flex flex-col">
          {/* Portfolio Gallery */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 flex flex-col justify-center">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-slate-800">Portfolio Gallery</h2>
              <a href="/admin/projects" className="text-xs font-medium text-blue-600 hover:text-blue-700">
                Lihat Semua
              </a>
            </div>
            {/* Gallery Images Grid */}
            <div className="grid grid-cols-3 gap-3 flex-1 items-start">
              {recentProjects.length > 0 ? recentProjects.map((project) => (
                <div key={project.id} className="aspect-square rounded-xl bg-slate-50 border border-slate-100 overflow-hidden flex items-center justify-center">
                  {project.image_url ? (
                    <img src={project.image_url} alt={project.title} className="w-full h-full object-cover" />
                  ) : (
                    <svg className="w-6 h-6 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0V17a2 2 0 01-2 2H6a2 2 0 01-2-2v-5z" /></svg>
                  )}
                </div>
              )) : (
                <p className="text-sm text-slate-400 col-span-3 text-center py-6">Belum ada portofolio</p>
              )}
            </div>
          </div>

          {/* Recent Clients */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 flex-1">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-lg font-bold text-slate-800">Recent Clients</h2>
              <span className="text-xs font-medium text-slate-600 bg-slate-100 flex items-center justify-center px-2 py-1 rounded">
                {orderStats.totalClients} Klien
              </span>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              {orderStats.recentClients.length > 0 ? orderStats.recentClients.map((client, idx) => (
                <div key={idx} className="flex items-center justify-center text-center p-3 rounded-xl border border-slate-100 bg-slate-50 text-sm font-medium text-slate-700">
                  {client}
                </div>
              )) : (
                <p className="text-sm text-slate-400 col-span-2 text-center">Belum ada klien</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Grid: Available Services & Shop Products */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Available Services */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
          <div className="flex items-center justify-between mb-4">
             <h2 className="text-lg font-bold text-slate-800">Available Services</h2>
             <a href="/admin/services" className="text-xs font-medium text-primary hover:text-primary/80">
               Lihat Semua
             </a>
          </div>
          
          <div className="space-y-3">
            {orderStats.topServices.length > 0 ? orderStats.topServices.map((svc, i) => (
              <div key={i} className="flex items-start gap-3 p-3 hover:bg-slate-50 rounded-xl transition-colors">
                <div className="w-10 h-10 rounded bg-slate-100 flex items-center justify-center flex-shrink-0 text-slate-400">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" /></svg>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-800 truncate">{svc.name}</p>
                  <p className="text-xs text-slate-500">Service</p>
                </div>
                <span className="text-xs font-medium text-emerald-600">{svc.count} Orders</span>
              </div>
            )) : (
              <p className="text-sm text-slate-400 text-center py-4">Belum ada pesanan layanan</p>
            )}
          </div>
        </div>

        {/* Shop Products */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
          <div className="flex items-center justify-between mb-4">
             <h2 className="text-lg font-bold text-slate-800">Shop Products</h2>
             <a href="/admin/store" className="text-xs font-medium text-primary hover:text-primary/80">
               Lihat Semua
             </a>
          </div>
          
          <div className="space-y-3">
            {orderStats.topProducts.length > 0 ? orderStats.topProducts.map((prod, i) => (
              <div key={i} className="flex items-start gap-3 p-3 hover:bg-slate-50 rounded-xl transition-colors">
                <div className="w-10 h-10 rounded bg-slate-100 flex items-center justify-center overflow-hidden flex-shrink-0">
                  {prod.image ? (
                    <img src={prod.image} alt={prod.name} className="w-full h-full object-cover" />
                  ) : (
                    <svg className="w-5 h-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" /></svg>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-800 truncate">{prod.name}</p>
                  <p className="text-xs text-slate-500">Product</p>
                </div>
                <span className="text-xs font-medium text-emerald-600 whitespace-nowrap">{prod.count} Sold</span>
              </div>
            )) : (
              <p className="text-sm text-slate-400 text-center py-4">Belum ada pembelian produk</p>
            )}
          </div>
        </div>
      </div>

      {/* Latest Projects Table Section */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-slate-800">Latest Projects</h2>
          <a href="/admin/orders" className="text-xs font-medium text-primary hover:text-primary/80">
            Lihat Semua
          </a>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100">
                <th className="py-3 px-2 text-xs font-medium text-slate-500">Order Reference</th>
                <th className="py-3 px-2 text-xs font-medium text-slate-500">Product / Service</th>
                <th className="py-3 px-2 text-xs font-medium text-slate-500">Amount</th>
                <th className="py-3 px-2 text-xs font-medium text-slate-500">Status</th>
                <th className="py-3 px-2 text-xs font-medium text-slate-500">Entry Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {tasks.length > 0 ? tasks.map((task) => (
                <tr key={task.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="py-3 px-2">
                    <span className="text-sm font-medium text-slate-800">#{task.id}</span>
                  </td>
                  <td className="py-3 px-2">
                    <p className="text-sm font-medium text-slate-800">{task.package_details?.name || "Order"}</p>
                    <p className="text-xs text-slate-500 mt-0.5">{task.customer_name}</p>
                  </td>
                  <td className="py-3 px-2">
                    <span className="text-sm font-medium text-slate-800">{task.final_price ? formatRevenueString(parseFloat(task.final_price)) : "Rp 0"}</span>
                  </td>
                  <td className="py-3 px-2">
                    <span className={`inline-flex items-center px-2 py-1 rounded-md text-xs font-medium
                      ${task.status === "completed" ? "bg-emerald-50 text-emerald-600" : 
                        task.status === "in_progress" ? "bg-amber-50 text-amber-600" : 
                        "bg-blue-50 text-blue-600"}
                    `}>
                      {task.status}
                    </span>
                  </td>
                  <td className="py-3 px-2">
                    <span className="text-sm text-slate-500 whitespace-nowrap">
                       {new Intl.DateTimeFormat("en-GB", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }).format(new Date(task.created_at))}
                    </span>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-sm text-slate-500">
                    Belum ada proyek terbaru.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
