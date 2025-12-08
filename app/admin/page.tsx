// app/admin/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import LogoLoading from "@/components/LogoLoading";
import dynamic from "next/dynamic";

const Chart = dynamic(() => import("react-apexcharts"), { ssr: false });
import {
  format,
  startOfMonth,
  endOfMonth,
  subMonths,
  subDays,
  subHours,
  eachDayOfInterval,
  eachHourOfInterval,
  eachMonthOfInterval,
} from "date-fns";
import { id } from "date-fns/locale";
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Briefcase,
  FileText,
  ListTodo,
  CheckSquare,
  Square,
  ChevronUp,
  ChevronDown,
} from "lucide-react";

// Tipe untuk data order yang sudah di-join dengan tabel services
type OrderWithService = {
  id: number;
  invoice_number: string;
  customer_name: string;
  final_price: number;
  status: string;
  work_deadline: string | null;
  created_at: string;
  package_details: {
    name: string;
  };
  services: {
    title: string;
  } | null;
};

interface Project {
  id: number;
  title: string;
  created_at: string;
  image_url: string | null;
  slug: string;
}

// Type for store orders
interface StoreOrderWithAsset {
  id: number;
  order_number: string;
  customer_name: string;
  price: number;
  status: string;
  created_at: string;
  marketplace_assets: {
    nama_aset: string;
  } | null;
}

// Status Mapping
const STATUS_MAPPING: Record<string, string> = {
  pending_payment: "Belum Dibayar",
  paid: "Dibayar",
  accepted: "Diterima",
  in_progress: "Dikerjakan",
  completed: "Selesai",
  cancelled: "Dibatalkan",
};

// --- Komponen Utama Dashboard ---
export default function AdminDashboard() {
  const [loading, setLoading] = useState(true);
  const [authChecked, setAuthChecked] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const [stats, setStats] = useState({
    ordersThisWeek: 0,
    ordersThisWeekIncome: 0,
    ordersThisMonth: 0,
    ordersThisMonthIncome: 0,
    ordersThisYear: 0,
    ordersThisYearIncome: 0,
    ordersTotal: 0,
    ordersTotalIncome: 0,
    purchasesThisMonth: 0,
    purchasesThisMonthIncome: 0,
    purchasesTotal: 0,
    purchasesTotalIncome: 0,
    ordersLastWeek: 0,
    ordersLastMonth: 0,
    ordersLastYear: 0,
    pendingTasks: 0,
    completedTasks: 0,
  });
  const [chartData, setChartData] = useState<
    { date: string; orders: number; income: number }[]
  >([]);
  const [tasks, setTasks] = useState<OrderWithService[]>([]);
  const [recentProjects, setRecentProjects] = useState<Project[]>([]);
  const [recentStorePurchases, setRecentStorePurchases] = useState<StoreOrderWithAsset[]>([]);
  const [updatingTaskId, setUpdatingTaskId] = useState<number | null>(null);

  const [showMobileStats, setShowMobileStats] = useState(false);
  const [incomeTimeRange, setIncomeTimeRange] = useState("12 Bulan"); // 12 Bulan, 30 Hari, 7 Hari, 24 Jam
  const [recentOrders, setRecentOrders] = useState<OrderWithService[]>([]);
  const [selectedTaskGroup, setSelectedTaskGroup] = useState("Semua");

  useEffect(() => {
    // Check authentication
    const checkAuth = async () => {
      try {
        const {
          data: { session },
          error,
        } = await supabase.auth.getSession();

        if (error) {
          console.error("Error getting session:", error);
          setError("Error getting session: " + error.message);
          router.push("/login");
          return;
        }

        if (!session) {
          console.log("No session found, redirecting to login");
          router.push("/login");
          return;
        }

        console.log("Session found, user authenticated");
        setAuthChecked(true);
      } catch (error) {
        console.error("Error checking authentication:", error);
        setError("Error checking authentication");
        router.push("/login");
      }
    };

    checkAuth();

    // Set up listener untuk perubahan auth
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_OUT" || !session) {
        router.push("/login");
      }
    });

    return () => subscription.unsubscribe();
  }, [router]);

  useEffect(() => {
    // Hanya jalankan fetchDashboardData jika user sudah terautentikasi
    if (authChecked) {
      const fetchDashboardData = async () => {
        setLoading(true);
        setError(null);

        try {
          const now = new Date();
          const thisMonthStart = startOfMonth(now);
          const thisMonthEnd = endOfMonth(now);
          const lastMonthStart = startOfMonth(subMonths(now, 1));
          const lastMonthEnd = endOfMonth(subMonths(now, 1));
          const fourteenDaysAgo = subDays(now, 13); // 14 hari terakhir

          // Periode untuk statistik baru
          const thisWeekStart = subDays(now, 6); // 7 hari terakhir
          const lastWeekStart = subDays(now, 13);
          const lastWeekEnd = subDays(now, 7);
          const thisYearStart = new Date(now.getFullYear(), 0, 1);
          const lastYearStart = new Date(now.getFullYear() - 1, 0, 1);
          const lastYearEnd = new Date(now.getFullYear() - 1, 11, 31);

          // --- Statistik Utama ---
          const [
            ordersThisMonthRes,
            ordersTotalRes,
            storePurchasesThisMonthRes,
            storePurchasesTotalRes,
            pendingTasksRes,
            completedTasksRes,
          ] = await Promise.all([
            // Orders (Services) This Month
            supabase
              .from("orders")
              .select("id", { count: "exact" }) // Just count is enough for "Pesanan" (Orders count), or did user mean Income? Cards show "1 / Rp 100.000". So Count AND Income.
              // So I need to fetch data to sum it.
              .select("final_price")
              .gte("created_at", thisMonthStart.toISOString())
              .lte("created_at", thisMonthEnd.toISOString()),
            // Orders Total
            supabase.from("orders").select("final_price"),
            // Store Purchases This Month
            supabase
              .from("store_orders")
              .select("price") // Assuming 'price' is the field
              .gte("created_at", thisMonthStart.toISOString())
              .lte("created_at", thisMonthEnd.toISOString()),
            // Store Purchases Total
            supabase.from("store_orders").select("price"),

            // Pending Tasks
            supabase
              .from("orders")
              .select("id", { count: "exact" })
              .eq("status", "in_progress"),
            // Completed Tasks
            supabase
              .from("orders")
              .select("id", { count: "exact" })
              .eq("status", "completed"),
          ]);

          // --- Data untuk Grafik dan Daftar ---
          const [
            chartDataRes,
            tasksRes,
            recentProjectsRes,
            serviceStatsRes,
            storePurchasesRes,
          ] = await Promise.all([
            // Dummy for chart if needed, or keeping it for structure
            supabase
              .from("orders")
              .select("created_at, final_price, status")
              .gte("created_at", fourteenDaysAgo.toISOString())
              .limit(1),
            // Tasks (Only pending tasks - accepted and in_progress)
            supabase
              .from("orders")
              .select(`*, services ( title )`)
              .in("status", ["accepted", "in_progress"])
              .order("work_deadline", { ascending: true }),
            // Recent Projects
            supabase
              .from("projects")
              .select("id, title, created_at, image_url, slug")
              .order("created_at", { ascending: false })
              .limit(4),
            // Recent Orders
            supabase
              .from("orders")
              .select(`*, services ( title ), package_details`)
              .order("created_at", { ascending: false })
              .limit(5),
            // Recent Store Purchases
            supabase
              .from("store_orders")
              .select(`*, marketplace_assets ( nama_aset )`)
              .order("created_at", { ascending: false })
              .limit(5),
          ]);

          // --- Proses Data Statistik ---
          const calculateStats = (res: any) => ({
            count: res.data?.length || 0,
            income:
              res.data?.reduce(
                (sum: number, item: any) => sum + (item.final_price || item.price || 0),
                0
              ) || 0,
          });

          const ordersThisMonth = calculateStats(ordersThisMonthRes);
          const ordersTotal = calculateStats(ordersTotalRes);
          const purchasesThisMonth = calculateStats(storePurchasesThisMonthRes);
          const purchasesTotal = calculateStats(storePurchasesTotalRes);

          setStats({
            ordersThisMonth: ordersThisMonth.count,
            ordersThisMonthIncome: ordersThisMonth.income,
            ordersTotal: ordersTotal.count,
            ordersTotalIncome: ordersTotal.income,
            purchasesThisMonth: purchasesThisMonth.count,
            purchasesThisMonthIncome: purchasesThisMonth.income,
            purchasesTotal: purchasesTotal.count,
            purchasesTotalIncome: purchasesTotal.income,

            // Keep others to avoid type errors for now or update type
            ordersThisWeek: 0,
            ordersThisWeekIncome: 0,
            ordersThisYear: 0,
            ordersThisYearIncome: 0,
            ordersLastWeek: 0,
            ordersLastMonth: 0,
            ordersLastYear: 0,
            pendingTasks: pendingTasksRes.count || 0,
            completedTasks: completedTasksRes.count || 0,
          });


          // --- Chart Data Initial Load (Default 12 Bulan or logic below handles it) ---
          // Removing initial chart logic here as it will be handled by the useEffect dependent on incomeTimeRange
          // But to prevent empty chart on first render if specific logic is preferred:

          // Initial fetch handles statistics mostly. Chart data is better handled separately or we call fetchChartData here.
          // For simplicity, we trigger the effect by setting authChecked, but let's just leave the fetchChartData to handle it.





          // --- Set Data Lainnya ---
          setTasks((tasksRes.data as OrderWithService[]) || []);
          setRecentProjects(recentProjectsRes.data || []);
          setRecentOrders((serviceStatsRes.data as any) || []);
          setRecentStorePurchases((storePurchasesRes.data as StoreOrderWithAsset[]) || []);
        } catch (error) {
          console.error("Error fetching dashboard data:", error);
          setError(
            "Error fetching dashboard data: " + (error as Error).message
          );
        } finally {
          setLoading(false);
        }
      };

      fetchDashboardData();
    }
  }, [authChecked]);

  // --- Effect for Income Chart Filter ---
  useEffect(() => {
    if (authChecked) {
      const fetchChartData = async () => {
        const now = new Date();
        let startDate: Date;
        let intervalType: "hour" | "day" | "month";
        let dateFormat: string;

        switch (incomeTimeRange) {
          case "24 Jam":
            startDate = subHours(now, 24);
            intervalType = "hour";
            dateFormat = "HH:00";
            break;
          case "7 Hari":
            startDate = subDays(now, 7);
            intervalType = "day";
            dateFormat = "dd MMM";
            break;
          case "30 Hari":
            startDate = subDays(now, 30);
            intervalType = "day";
            dateFormat = "dd MMM";
            break;
          case "12 Bulan":
          default:
            startDate = subMonths(now, 12);
            intervalType = "month";
            dateFormat = "MMM yyyy";
            break;
        }

        try {
          const { data, error } = await supabase
            .from("orders")
            .select("created_at, final_price")
            .gte("created_at", startDate.toISOString())
            .order("created_at", { ascending: true });

          if (error) throw error;

          const ordersByDate = (data || []).reduce((acc: any, order: any) => {
            const dateStr = format(new Date(order.created_at), dateFormat, {
              locale: id,
            });
            if (!acc[dateStr]) {
              acc[dateStr] = 0;
            }
            acc[dateStr] += order.final_price || 0;
            return acc;
          }, {});

          let chartIntervals;
          if (intervalType === "hour") {
            chartIntervals = eachHourOfInterval({ start: startDate, end: now });
          } else if (intervalType === "day") {
            chartIntervals = eachDayOfInterval({ start: startDate, end: now });
          } else {
            chartIntervals = eachMonthOfInterval({ start: startDate, end: now });
          }

          const chart = chartIntervals.map((date) => {
            const dateStr = format(date, dateFormat, { locale: id });
            return {
              date: dateStr,
              orders: 0, // Not used in current chart view, but kept for type structure
              income: ordersByDate[dateStr] || 0,
            };
          });

          setChartData(chart);
        } catch (err) {
          console.error("Error fetching chart data:", err);
          // Optional: handle silent error for chart
        }
      };

      fetchChartData();
    }
  }, [incomeTimeRange, authChecked]);

  // --- Helper Functions ---
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const calculatePercentageChange = (current: number, previous: number) => {
    if (previous === 0) return current > 0 ? 100 : 0;
    return ((current - previous) / previous) * 100;
  };

  const handleStatusChange = async (taskId: number, newStatus: string) => {
    setUpdatingTaskId(taskId);
    try {
      const { error } = await supabase
        .from("orders")
        .update({ status: newStatus })
        .eq("id", taskId);

      if (error) {
        console.error("Error updating task status:", error);
        setError("Error updating task status: " + error.message);
      } else {
        // Update local state
        setTasks((prevTasks) =>
          prevTasks.map((task) =>
            task.id === taskId ? { ...task, status: newStatus } : task
          )
        );
      }
    } catch (error) {
      console.error("Unexpected error updating task status:", error);
      setError(
        "Unexpected error updating task status: " + (error as Error).message
      );
    } finally {
      setUpdatingTaskId(null);
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "-";
    return new Date(dateString).toLocaleDateString("id-ID", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  // Tampilkan error jika ada
  if (error) {
    return (
      <div className="min-h-screen bg-slate-100 dark:bg-slate-900 p-6">
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg p-8">
          <div className="flex flex-col items-center justify-center py-12">
            <div className="text-red-500 text-xl mb-4">Error</div>
            <p className="text-slate-600 dark:text-slate-400 mb-4">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 px-4 rounded-lg"
            >
              Refresh
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Tampilkan loading selama pengecekan auth atau pengambilan data
  if (!authChecked || loading) {
    return (
      <div className="min-h-screen bg-slate-100 dark:bg-slate-900 p-6">
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg p-8">
          <div className="flex flex-col items-center justify-center py-12">
            <LogoLoading size="lg" />
            <p className="mt-4 text-slate-600 dark:text-slate-400">
              Sedang memuat...
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Calculate total income for the chart
  const totalIncomeInChart = chartData.reduce(
    (sum, day) => sum + day.income,
    0
  );

  // Chart Options for Income (Bar Chart)
  const incomeChartOptions = {
    chart: {
      type: "bar" as const,
      toolbar: { show: false },
      fontFamily: "inherit",
    },
    plotOptions: {
      bar: {
        borderRadius: 4,
        columnWidth: "60%",
        dataLabels: { position: "top" },
      },
    },
    dataLabels: {
      enabled: false,
    },
    xaxis: {
      categories: chartData.map((d) => d.date),
      axisBorder: { show: false },
      axisTicks: { show: false },
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
        formatter: (value: number) => {
          if (value >= 1000000) return `${(value / 1000000).toFixed(1)}jt`;
          if (value >= 1000) return `${(value / 1000).toFixed(0)}k`;
          return value.toString();
        },
      },
    },
    grid: {
      borderColor: "#e2e8f0",
      strokeDashArray: 4,
      yaxis: { lines: { show: true } },
    },
    colors: ["#3b82f6"], // Blue-500
    tooltip: {
      y: {
        formatter: (value: number) => formatCurrency(value),
      },
    },
    theme: {
      mode: "light" as const, // Can be dynamic if needed, simplistic for now
    },
  };

  const incomeChartSeries = [
    {
      name: "Pendapatan",
      data: chartData.map((d) => d.income),
    },
  ];



  // Filter tasks by status


  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-900">
      <div className="px-4 sm:px-6 lg:px-8 py-4">
        {/* Statistik Cards */}
        {/* Statistik Cards */}
        <div className="mb-6 rounded-2xl border border-gray-200 bg-white p-4 sm:p-6 dark:border-gray-800 dark:bg-white/[0.03]">
          <div className="sm:mb-6 flex items-center justify-between">
            <h2 className="font-semibold text-gray-800 dark:text-white/90">
              Ringkasan
            </h2>
            <button
              onClick={() => setShowMobileStats(!showMobileStats)}
              className="sm:hidden p-1 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            >
              {showMobileStats ? (
                <ChevronUp className="w-5 h-5" />
              ) : (
                <ChevronDown className="w-5 h-5" />
              )}
            </button>
          </div>

          <div
            className={`${showMobileStats ? "grid" : "hidden"
              } mb-6 sm:mb-4 grid-cols-1 rounded-xl border border-gray-200 sm:grid sm:grid-cols-2 lg:grid-cols-4 lg:divide-x lg:divide-y-0 dark:divide-gray-800 dark:border-gray-800`}
          >
            {/* Pesanan Bulan Ini */}
            <div className="border-b p-5 sm:border-r lg:border-b-0">
              <span className="mb-1.5 block text-sm text-gray-400 dark:text-gray-500">
                Pesanan Bulan Ini
              </span>
              <h4 className="text-xl font-bold text-gray-800 dark:text-white/90">
                {stats.ordersThisMonth} / {formatCurrency(stats.ordersThisMonthIncome)}
              </h4>
            </div>

            {/* Total Pesanan */}
            <div className="border-b p-5 lg:border-b-0">
              <span className="mb-1.5 block text-sm text-gray-400 dark:text-gray-500">
                Total Pesanan
              </span>
              <h4 className="text-xl font-bold text-gray-800 dark:text-white/90">
                {stats.ordersTotal} / {formatCurrency(stats.ordersTotalIncome)}
              </h4>
            </div>

            {/* Pembelian Bulan Ini */}
            <div className="border-b p-5 sm:border-r sm:border-b-0">
              <span className="mb-1.5 block text-sm text-gray-400 dark:text-gray-500">
                Pembelian Bulan Ini
              </span>
              <h4 className="text-xl font-bold text-gray-800 dark:text-white/90">
                {stats.purchasesThisMonth} / {formatCurrency(stats.purchasesThisMonthIncome)}
              </h4>
            </div>

            {/* Total Pembelian */}
            <div className="p-5">
              <span className="mb-1.5 block text-sm text-gray-400 dark:text-gray-500">
                Total Pembelian
              </span>
              <h4 className="text-xl font-bold text-gray-800 dark:text-white/90">
                {stats.purchasesTotal} / {formatCurrency(stats.purchasesTotalIncome)}
              </h4>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-6">
            <div className="w-full lg:w-8/12">
              {/* Grafik Penghasilan */}
              <div className="lg:col-span-2 bg-white dark:bg-slate-800 rounded-xl shadow-md p-6 mb-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="hidden sm:flex text-lg font-semibold text-gray-800 dark:text-white/90">
                    Penghasilan
                  </h3>
                  <div className="flex items-center gap-1 bg-gray-100 dark:bg-gray-700/50 p-1 rounded-lg">
                    {["12 Bulan", "30 Hari", "7 Hari", "24 Jam"].map((range) => (
                      <button
                        key={range}
                        onClick={() => setIncomeTimeRange(range)}
                        className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${incomeTimeRange === range
                          ? "bg-white dark:bg-slate-600 text-slate-800 dark:text-white shadow-sm"
                          : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200" // Fixed closing quote
                          }`}
                      >
                        {range}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white px-5 pt-5 sm:px-6 sm:pt-6 dark:border-gray-800 dark:bg-white/[0.03]">
                  <div className="w-full" style={{ minHeight: "350px" }}>
                    {typeof window !== "undefined" && (
                      <Chart
                        options={incomeChartOptions}
                        series={incomeChartSeries}
                        type="bar"
                        height={320}
                      />
                    )}
                  </div>

                  {/* Total income footer is optional now as it can be in the chart, but keeping it for consistency if needed */}
                  <div className="mt-2 mb-4 pt-4 border-t border-gray-200 dark:border-gray-700 flex justify-between items-center">
                    <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                      Total Penghasilan 14 Hari Terakhir:
                    </span>
                    <span className="text-lg font-semibold text-gray-900 dark:text-white">
                      {formatCurrency(totalIncomeInChart)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Pesanan Terbaru (Previously Service Stats) */}
              <div className="lg:col-span-2 bg-white dark:bg-slate-800 rounded-xl shadow-md p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
                    Pesanan Terbaru
                  </h3>
                </div>

                <div className="overflow-x-auto hidden md:block">
                  <table className="min-w-full">
                    <thead>
                      <tr className="border-b border-gray-100 dark:border-gray-700">
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider pl-0">
                          Pelanggan
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Paket
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Harga
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Status
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                      {recentOrders.map((order) => (
                        <tr key={order.id}>
                          <td className="px-6 py-4 whitespace-nowrap pl-0">
                            <div className="flex items-center">
                              <div>
                                <p className="text-sm font-medium text-gray-900 dark:text-white">
                                  {order.customer_name}
                                </p>
                                <p className="text-xs text-gray-500 dark:text-gray-400">
                                  {order.invoice_number}
                                </p>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="text-sm text-gray-500 dark:text-gray-400">
                              {order.package_details?.name || "-"}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="text-sm text-gray-500 dark:text-gray-400">
                              {formatCurrency(order.final_price)}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span
                              className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${order.status === "completed"
                                ? "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400"
                                : order.status === "pending_payment"
                                  ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400"
                                  : "bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400"
                                }`}
                            >
                              {STATUS_MAPPING[order.status] || order.status.replace("_", " ")}
                            </span>
                          </td>
                        </tr>
                      ))}
                      {recentOrders.length === 0 && (
                        <tr>
                          <td colSpan={4} className="px-6 py-4 text-center text-sm text-gray-500 dark:text-gray-400">
                            Belum ada pesanan terbaru.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Mobile Card View (For Small Screens) */}
                <div className="md:hidden space-y-4">
                  {recentOrders.map((order) => (
                    <div key={order.id} className="bg-slate-50 dark:bg-slate-700/50 p-4 rounded-lg border border-slate-100 dark:border-slate-700">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <p className="text-sm font-medium text-gray-900 dark:text-white">
                            {order.customer_name}
                          </p>
                          <p className="text-xs text-slate-500 dark:text-slate-400">
                            {order.invoice_number}
                          </p>
                        </div>
                        <span
                          className={`px-2 py-0.5 inline-flex text-xs font-semibold rounded-full ${order.status === "completed"
                            ? "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400"
                            : order.status === "pending_payment"
                              ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400"
                              : "bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400"
                            }`}
                        >
                          {STATUS_MAPPING[order.status] || order.status.replace("_", " ")}
                        </span>
                      </div>
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-slate-500 dark:text-slate-400">
                          {order.package_details?.name || "-"}
                        </span>
                        <span className="font-semibold text-gray-900 dark:text-white">
                          {formatCurrency(order.final_price)}
                        </span>
                      </div>
                    </div>
                  ))}
                  {recentOrders.length === 0 && (
                    <p className="text-center text-sm text-slate-500 py-4">Belum ada pesanan terbaru.</p>
                  )}
                </div>
              </div>
            </div>

            {/* Task List dan Proyek Terbaru */}
            <div className="space-y-6 w-full lg:w-4/12">
              {/* Task List (Kanban Style) */}
              <div className="bg-white dark:bg-slate-800 rounded-xl shadow-md overflow-hidden">
                {/* Header */}
                <div className="p-4 border-b border-gray-100 dark:border-gray-700">
                  <div className="flex flex-wrap gap-2">
                    {["Semua", "Todo", "Dikerjakan"].map((group) => (
                      <button
                        key={group}
                        onClick={() => setSelectedTaskGroup(group)}
                        className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${selectedTaskGroup === group
                          ? "bg-slate-100 dark:bg-slate-700 text-slate-900 dark:text-white"
                          : "text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700/50"
                          }`}
                      >
                        {group}
                        <span className="ml-2 bg-white dark:bg-slate-600 px-1.5 py-0.5 rounded-full text-[10px] text-slate-600 dark:text-slate-300 shadow-sm">
                          {group === "Semua"
                            ? tasks.length
                            : tasks.filter((t) => {
                              if (group === "Todo") return t.status === "accepted";
                              if (group === "Dikerjakan") return t.status === "in_progress";
                              return false;
                            }).length}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* List */}
                <div className="p-4 space-y-3 max-h-[500px] overflow-y-auto">
                  {tasks
                    .filter((t) => {
                      if (selectedTaskGroup === "Semua") return true;
                      if (selectedTaskGroup === "Todo") return t.status === "accepted";
                      if (selectedTaskGroup === "Dikerjakan") return t.status === "in_progress";
                      return false;
                    })
                    .map((task) => (
                      <div
                        key={task.id}
                        className="p-3 bg-slate-50 dark:bg-slate-700/30 border border-slate-100 dark:border-slate-700 rounded-lg group"
                      >
                        <div className="flex items-start gap-3">
                          <button
                            onClick={() => {
                              const nextStatus = task.status === "completed" ? "in_progress" : "completed";
                              handleStatusChange(task.id, nextStatus);
                            }}
                            disabled={updatingTaskId === task.id}
                            className={`mt-0.5 flex-shrink-0 ${task.status === "completed"
                              ? "text-green-500"
                              : "text-slate-400 hover:text-blue-500"
                              } disabled:opacity-50`}
                          >
                            {task.status === "completed" ? <CheckSquare size={18} /> : <Square size={18} />}
                          </button>
                          <div className="flex-1 min-w-0">
                            <p className={`text-sm font-medium truncate ${task.status === "completed" ? "text-slate-500 line-through" : "text-slate-800 dark:text-slate-200"}`}>
                              {task.package_details.name}
                            </p>
                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                              {task.customer_name}
                            </p>
                            <div className="flex items-center gap-2 mt-2">
                              <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${task.status === "in_progress" ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400" :
                                task.status === "completed" ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" :
                                  "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400"
                                }`}>
                                {STATUS_MAPPING[task.status] || task.status.replace("_", " ")}
                              </span>
                              <span className="text-[10px] text-slate-400">
                                {formatDate(task.created_at)}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  {tasks.length === 0 && (
                    <p className="text-center text-sm text-slate-500 py-4">Tidak ada tugas.</p>
                  )}
                </div>
              </div>

              {/* Pembelian Terbaru (List Style) */}
              <div className="bg-white dark:bg-slate-800 rounded-xl shadow-md p-6">
                <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
                  Pembelian Terbaru
                </h2>
                <div className="space-y-3">
                  {recentStorePurchases.map((purchase) => (
                    <div
                      key={purchase.id}
                      className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg border border-slate-100 dark:border-slate-700"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-slate-900 dark:text-white truncate">
                          {purchase.marketplace_assets?.nama_aset || `Produk #${purchase.id}`}
                        </p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          {purchase.customer_name}
                        </p>
                      </div>
                      <div className="text-right ml-3">
                        <p className="text-sm font-semibold text-slate-900 dark:text-white">
                          {formatCurrency(purchase.price)}
                        </p>
                        <span
                          className={`inline-flex text-[10px] px-2 py-0.5 rounded-full font-medium ${purchase.status === "completed"
                            ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                            : purchase.status === "pending_payment"
                              ? "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400"
                              : "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
                            }`}
                        >
                          {STATUS_MAPPING[purchase.status] || purchase.status}
                        </span>
                      </div>
                    </div>
                  ))}
                  {recentStorePurchases.length === 0 && (
                    <p className="text-sm text-slate-500 text-center py-4">Belum ada pembelian.</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
