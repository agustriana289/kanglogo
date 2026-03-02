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
    monthlyData: [],
    storeMonthlyData: [],
  });
  const [tasks, setTasks] = useState<Task[]>([]);
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
      const productCounts: Record<string, number> = {};
      if (allOrdersData) {
        allOrdersData.forEach((o: any) => {
          const name = o.package_details?.name || "Service";
          productCounts[name] = (productCounts[name] || 0) + 1;
        });
      }
      if (allStoreData) {
        allStoreData.forEach((s: any) => {
          const name =
            s.product_details?.name || s.product_details?.title || "Product";
          productCounts[name] = (productCounts[name] || 0) + 1;
        });
      }

      let bestSeller = "-";
      let maxSells = 0;
      Object.entries(productCounts).forEach(([name, count]) => {
        if (count > maxSells) {
          maxSells = count;
          bestSeller = name;
        }
      });

      // Calculate Total Clients
      const clients = new Set(
        allOrdersData?.map((o) => o.customer_name).filter(Boolean),
      );
      const totalClients = clients.size;

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
        .select("id, customer_name, status, created_at, package_details")
        .in("status", ["accepted", "in_progress", "completed"])
        .order("created_at", { ascending: false })
        .limit(20);

      if (error) throw error;
      setTasks(data || []);
    } catch (error) {
      console.error("Error fetching tasks:", error);
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

  // ApexCharts options for bar chart - using CSS variable for primary color
  const barChartOptions: any = {
    chart: {
      type: "bar",
      height: 350,
      stacked: true,
      toolbar: {
        show: false,
      },
      fontFamily: "inherit",
    },
    colors: ["var(--color-primary)", "var(--color-secondary)"],
    plotOptions: {
      bar: {
        horizontal: false,
        columnWidth: "55%",
        borderRadius: 4,
        borderRadiusApplication: "end",
        borderRadiusWhenStacked: "last",
      },
    },
    dataLabels: {
      enabled: false,
    },
    stroke: {
      show: true,
      width: 2,
      colors: ["transparent"],
    },
    legend: {
      position: "top",
      horizontalAlign: "left",
      labels: {
        colors: "#64748b",
      },
    },
    xaxis: {
      categories: orderStats.monthlyData.map((d) => d.month),
      axisBorder: {
        show: false,
      },
      axisTicks: {
        show: false,
      },
      labels: {
        style: {
          colors: "#64748b",
          fontSize: "12px",
        },
      },
    },
    yaxis: {
      labels: {
        style: {
          colors: "#64748b",
          fontSize: "12px",
        },
      },
    },
    fill: {
      opacity: 1,
    },
    tooltip: {
      shared: true,
      intersect: false,
      custom: function ({
        series,
        seriesIndex,
        dataPointIndex,
        w,
      }: {
        series: any;
        seriesIndex: number;
        dataPointIndex: number;
        w: any;
      }) {
        const ordersCount = orderStats.monthlyData[dataPointIndex]?.count || 0;
        const ordersRevenue =
          orderStats.monthlyData[dataPointIndex]?.revenue || 0;
        const storeCount =
          orderStats.storeMonthlyData[dataPointIndex]?.count || 0;
        const storeRevenue =
          orderStats.storeMonthlyData[dataPointIndex]?.revenue || 0;
        const month = orderStats.monthlyData[dataPointIndex]?.month || "";

        return `
          <div class="px-4 py-3 bg-white shadow-lg rounded-lg border border-slate-100">
            <p class="font-bold text-slate-800 mb-2">${month}</p>
            <div class="space-y-1 text-sm">
              <p><span style="color: var(--color-primary)">●</span> Orders: ${ordersCount} / ${formatRevenueString(
                ordersRevenue,
              )}</p>
              <p><span style="color: var(--color-secondary)">●</span> Store: ${storeCount} / ${formatRevenueString(
                storeRevenue,
              )}</p>
            </div>
          </div>
        `;
      },
    },
    grid: {
      borderColor: "#e2e8f0",
      strokeDashArray: 4,
    },
  };

  const barChartSeries = [
    {
      name: "Pesanan",
      data: orderStats.monthlyData.map((d) => d.count),
    },
    {
      name: "Toko",
      data: orderStats.storeMonthlyData.map((d) => d.count),
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
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5 flex flex-col justify-between">
          <div className="flex justify-between items-start mb-4">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
              <svg
                className="w-5 h-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
                />
              </svg>
            </div>
            <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded flex items-center gap-1">
              <svg
                className="w-3 h-3"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
                />
              </svg>
              {orderStats.allTime} ORDERS
            </span>
          </div>
          <div>
            <p className="text-slate-500 text-[11px] font-bold tracking-wider uppercase mb-1">
              Total Revenue
            </p>
            <p className="text-2xl font-bold text-slate-800">
              {formatRevenueString(orderStats.revenueAllTime)}
            </p>
          </div>
        </div>

        {/* Best Seller */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5 flex flex-col justify-between">
          <div className="flex justify-between items-start mb-4">
            <div className="w-10 h-10 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-500">
              <svg
                className="w-5 h-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
                />
              </svg>
            </div>
          </div>
          <div>
            <p className="text-slate-500 text-[11px] font-bold tracking-wider uppercase mb-1">
              Best Seller
            </p>
            <p
              className="text-xl font-bold text-slate-800 truncate"
              title={orderStats.bestSeller}
            >
              {orderStats.bestSeller}
            </p>
          </div>
        </div>

        {/* Total Clients */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5 flex flex-col justify-between">
          <div className="flex justify-between items-start mb-4">
            <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-500">
              <svg
                className="w-5 h-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
                />
              </svg>
            </div>
          </div>
          <div>
            <p className="text-slate-500 text-[11px] font-bold tracking-wider uppercase mb-1">
              Total Clients
            </p>
            <p className="text-2xl font-bold text-slate-800">
              {orderStats.totalClients}
            </p>
          </div>
        </div>

        {/* Testimonials */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5 flex flex-col justify-between">
          <div className="flex justify-between items-start mb-4">
            <div className="w-10 h-10 rounded-full bg-amber-50 flex items-center justify-center text-amber-500">
              <svg
                className="w-5 h-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"
                />
              </svg>
            </div>
          </div>
          <div>
            <p className="text-slate-500 text-[11px] font-bold tracking-wider uppercase mb-1">
              Testimonials
            </p>
            <p className="text-2xl font-bold text-slate-800">
              {orderStats.totalTestimonials}
            </p>
          </div>
        </div>
      </div>

      {/* Two Column Layout: Chart + Tasks */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (2/3) - Monthly Orders Chart */}
        <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-bold text-slate-800">
              Pesanan Bulanan
            </h2>
            <button className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path
                  fillRule="evenodd"
                  clipRule="evenodd"
                  d="M10.2441 6C10.2441 5.0335 11.0276 4.25 11.9941 4.25H12.0041C12.9706 4.25 13.7541 5.0335 13.7541 6C13.7541 6.9665 12.9706 7.75 12.0041 7.75H11.9941C11.0276 7.75 10.2441 6.9665 10.2441 6ZM10.2441 18C10.2441 17.0335 11.0276 16.25 11.9941 16.25H12.0041C12.9706 16.25 13.7541 17.0335 13.7541 18C13.7541 18.9665 12.9706 19.75 12.0041 19.75H11.9941C11.0276 19.75 10.2441 18.9665 10.2441 18ZM11.9941 10.25C11.0276 10.25 10.2441 11.0335 10.2441 12C10.2441 12.9665 11.0276 13.75 11.9941 13.75H12.0041C12.9706 13.75 13.7541 12.9665 13.7541 12C13.7541 11.0335 12.9706 10.25 12.0041 10.25H11.9941Z"
                />
              </svg>
            </button>
          </div>

          {/* ApexCharts Bar Chart */}
          <div className="-mx-2">
            {chartLoaded && (
              <Chart
                options={barChartOptions}
                series={barChartSeries}
                type="bar"
                height={300}
              />
            )}
          </div>
        </div>

        {/* Right Column (1/3) - Task List */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-slate-800">Daftar Tugas</h2>
            <a
              href="/admin/tasks"
              className="text-xs font-medium text-primary hover:text-primary/80"
            >
              Lihat Semua
            </a>
          </div>

          {/* Task Tabs */}
          <div className="flex gap-1 p-1 bg-slate-100 rounded-lg mb-4">
            <button
              onClick={() => setTaskTab("in_progress")}
              className={`flex-1 px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
                taskTab === "in_progress"
                  ? "bg-white text-slate-900 shadow-sm"
                  : "text-slate-500 hover:text-slate-700"
              }`}
            >
              Dikerjakan (
              {tasks.filter((t) => t.status === "in_progress").length})
            </button>
            <button
              onClick={() => setTaskTab("completed")}
              className={`flex-1 px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
                taskTab === "completed"
                  ? "bg-white text-slate-900 shadow-sm"
                  : "text-slate-500 hover:text-slate-700"
              }`}
            >
              Selesai ({tasks.filter((t) => t.status === "completed").length})
            </button>
          </div>

          <div className="space-y-3 max-h-[280px] overflow-y-auto">
            {tasks.filter((t) => t.status === taskTab).length === 0 ? (
              <p className="text-sm text-slate-500 text-center py-4">
                {taskTab === "in_progress"
                  ? "Tidak ada tugas dikerjakan"
                  : "Tidak ada tugas selesai"}
              </p>
            ) : (
              tasks
                .filter((t) => t.status === taskTab)
                .slice(0, 10)
                .map((task) => (
                  <div
                    key={task.id}
                    className="flex items-start gap-3 p-3 hover:bg-slate-50 rounded-xl transition-colors"
                  >
                    <div
                      className={`w-5 h-5 rounded border flex items-center justify-center flex-shrink-0 ${
                        task.status === "completed"
                          ? "bg-emerald-500 border-emerald-500"
                          : "border-slate-300 bg-white"
                      }`}
                    >
                      {task.status === "completed" && (
                        <div className="w-2.5 h-1.5 border-b-2 border-r-2 border-white rotate-45 mb-0.5" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p
                        className={`text-sm font-medium truncate ${
                          task.status === "completed"
                            ? "text-slate-500 line-through"
                            : "text-slate-800"
                        }`}
                      >
                        {task.package_details?.name || "Pesanan"}
                      </p>
                      <p className="text-xs text-slate-500 truncate">
                        {task.customer_name} • {formatDate(task.created_at)}
                      </p>
                    </div>
                  </div>
                ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
