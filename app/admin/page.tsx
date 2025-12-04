// app/admin/dashboard/page.tsx
"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import LogoLoading from "@/components/LogoLoading";
import { useRouter } from "next/navigation";
import {
  format,
  startOfMonth,
  endOfMonth,
  subMonths,
  subDays,
  eachDayOfInterval,
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
}

// --- Komponen Utama Dashboard ---
export default function AdminDashboard() {
  const [loading, setLoading] = useState(true);
  const [authChecked, setAuthChecked] = useState(false);
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
  const [updatingTaskId, setUpdatingTaskId] = useState<number | null>(null);
  const [serviceStats, setServiceStats] = useState<
    { service_name: string; count: number; percentage: number }[]
  >([]);

  useEffect(() => {
    // Fungsi untuk memeriksa autentikasi
    const checkAuth = async () => {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (!session) {
          // Redirect ke halaman login jika tidak ada session
          router.push("/login");
          return;
        }

        setAuthChecked(true);
      } catch (error) {
        console.error("Error checking authentication:", error);
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

        try {
          // --- Statistik Utama ---
          const [
            ordersThisWeekRes,
            ordersLastWeekRes,
            ordersThisMonthRes,
            ordersLastMonthRes,
            ordersThisYearRes,
            ordersLastYearRes,
            ordersTotalRes,
            pendingTasksRes,
            completedTasksRes,
          ] = await Promise.all([
            // This Week
            supabase
              .from("orders")
              .select("final_price")
              .gte("created_at", thisWeekStart.toISOString()),
            // Last Week
            supabase
              .from("orders")
              .select("final_price")
              .gte("created_at", lastWeekStart.toISOString())
              .lte("created_at", lastWeekEnd.toISOString()),
            // This Month
            supabase
              .from("orders")
              .select("final_price")
              .gte("created_at", thisMonthStart.toISOString())
              .lte("created_at", thisMonthEnd.toISOString()),
            // Last Month
            supabase
              .from("orders")
              .select("final_price")
              .gte("created_at", lastMonthStart.toISOString())
              .lte("created_at", lastMonthEnd.toISOString()),
            // This Year
            supabase
              .from("orders")
              .select("final_price")
              .gte("created_at", thisYearStart.toISOString()),
            // Last Year
            supabase
              .from("orders")
              .select("final_price")
              .gte("created_at", lastYearStart.toISOString())
              .lte("created_at", lastYearEnd.toISOString()),
            // Total All Time
            supabase.from("orders").select("final_price"),
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
          const [chartDataRes, tasksRes, recentProjectsRes, serviceStatsRes] =
            await Promise.all([
              supabase
                .from("orders")
                .select("created_at, final_price, status")
                .gte("created_at", fourteenDaysAgo.toISOString()),
              // Mengambil data orders dan menggabungkannya dengan tabel services
              supabase
                .from("orders")
                .select(
                  `
                *,
                services ( title )
              `
                )
                .in("status", ["in_progress", "completed"]) // Hanya mengambil status yang relevan untuk task
                .order("work_deadline", { ascending: true }),
              supabase
                .from("projects")
                .select("id, title, created_at")
                .order("created_at", { ascending: false })
                .limit(5),
              // Service statistics
              supabase.from("orders").select("service_id, services(title)"),
            ]);

          // --- Proses Data Statistik ---
          const calculateStats = (res: any) => ({
            count: res.data?.length || 0,
            income:
              res.data?.reduce(
                (sum: number, order: any) => sum + (order.final_price || 0),
                0
              ) || 0,
          });

          const thisWeek = calculateStats(ordersThisWeekRes);
          const lastWeek = calculateStats(ordersLastWeekRes);
          const thisMonth = calculateStats(ordersThisMonthRes);
          const lastMonth = calculateStats(ordersLastMonthRes);
          const thisYear = calculateStats(ordersThisYearRes);
          const lastYear = calculateStats(ordersLastYearRes);
          const total = calculateStats(ordersTotalRes);

          setStats({
            ordersThisWeek: thisWeek.count,
            ordersThisWeekIncome: thisWeek.income,
            ordersThisMonth: thisMonth.count,
            ordersThisMonthIncome: thisMonth.income,
            ordersThisYear: thisYear.count,
            ordersThisYearIncome: thisYear.income,
            ordersTotal: total.count,
            ordersTotalIncome: total.income,
            ordersLastWeek: lastWeek.count,
            ordersLastMonth: lastMonth.count,
            ordersLastYear: lastYear.count,
            pendingTasks: pendingTasksRes.count || 0,
            completedTasks: completedTasksRes.count || 0,
          });

          // --- Proses Data Grafik ---
          const ordersByDay =
            chartDataRes.data?.reduce((acc: any, order: any) => {
              const day = format(new Date(order.created_at), "dd MMM", {
                locale: id,
              });
              if (!acc[day]) {
                acc[day] = { orders: 0, income: 0 };
              }
              acc[day].orders += 1;
              // Hitung income untuk semua status, bukan hanya completed
              acc[day].income += order.final_price || 0;
              return acc;
            }, {}) || {};

          const chart = eachDayOfInterval({
            start: fourteenDaysAgo,
            end: now,
          }).map((day) => {
            const dayString = format(day, "dd MMM", { locale: id });
            return {
              date: dayString,
              orders: ordersByDay[dayString]?.orders || 0,
              income: ordersByDay[dayString]?.income || 0,
            };
          });
          setChartData(chart);

          // --- Proses Service Statistics ---
          const serviceCounts: Record<string, number> = {};
          serviceStatsRes.data?.forEach((order: any) => {
            const serviceName = order.services?.title || "Unknown";
            serviceCounts[serviceName] = (serviceCounts[serviceName] || 0) + 1;
          });

          const totalServices = Object.values(serviceCounts).reduce(
            (a: number, b: number) => a + b,
            0
          );
          const serviceStatsArray = Object.entries(serviceCounts)
            .map(([name, count]) => ({
              service_name: name,
              count: count as number,
              percentage: ((count as number) / totalServices) * 100,
            }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 3);

          setServiceStats(serviceStatsArray);

          // --- Set Data Lainnya ---
          setTasks((tasksRes.data as OrderWithService[]) || []);
          setRecentProjects(recentProjectsRes.data || []);
        } catch (error) {
          console.error("Error fetching dashboard data:", error);
        } finally {
          setLoading(false);
        }
      };

      fetchDashboardData();
    }
  }, [authChecked]);

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
    const { error } = await supabase
      .from("orders")
      .update({ status: newStatus })
      .eq("id", taskId);

    if (error) {
      console.error("Error updating task status:", error);
    } else {
      // Update local state
      setTasks((prevTasks) =>
        prevTasks.map((task) =>
          task.id === taskId ? { ...task, status: newStatus } : task
        )
      );
    }
    setUpdatingTaskId(null);
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "-";
    return new Date(dateString).toLocaleDateString("id-ID", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const StatCard = ({
    title,
    value,
    icon: Icon,
    change,
    changeType,
  }: {
    title: string;
    value: string | number;
    icon: any;
    change: number;
    changeType: "increase" | "decrease";
  }) => (
    <div className="bg-white dark:bg-slate-800 rounded-xl shadow-md p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="p-3 bg-blue-100 dark:bg-blue-900 rounded-full">
          <Icon className="w-6 h-6 text-blue-600 dark:text-blue-300" />
        </div>
        <span
          className={`flex items-center text-sm font-semibold ${
            changeType === "increase" ? "text-green-500" : "text-red-500"
          }`}
        >
          {changeType === "increase" ? (
            <TrendingUp className="w-4 h-4 mr-1" />
          ) : (
            <TrendingDown className="w-4 h-4 mr-1" />
          )}
          {change.toFixed(2)}%
        </span>
      </div>
      <h3 className="text-2xl font-bold text-slate-900 dark:text-white">
        {value}
      </h3>
      <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{title}</p>
    </div>
  );

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

  // Helper function untuk menghitung tinggi bar dalam PX - FIXED VALUES
  // Mapping FIXED: 50k=40px, 100k=80px, 250k=110px, 500k=150px, 1jt=180px, 2.5jt=215px
  const getBarHeight = (income: number) => {
    if (income >= 2500000) return 215;
    if (income >= 1000000) {
      // Interpolasi antara 1jt (180px) dan 2.5jt (215px)
      return 180 + ((income - 1000000) / 1500000) * 35;
    }
    if (income >= 500000) {
      // Interpolasi antara 500k (150px) dan 1jt (180px)
      return 170 + ((income - 500000) / 500000) * 30;
    }
    if (income >= 250000) {
      // Interpolasi antara 250k (110px) dan 500k (150px)
      return 120 + ((income - 250000) / 250000) * 40;
    }
    if (income >= 100000) {
      // Interpolasi antara 100k (80px) dan 250k (110px)
      return 80 + ((income - 100000) / 150000) * 30;
    }
    if (income >= 50000) {
      // Interpolasi antara 50k (40px) dan 100k (80px)
      return 40 + ((income - 50000) / 50000) * 40;
    }
    // Di bawah 50k, proporsional dari 0 ke 40px
    return (income / 50000) * 40;
  };

  // Filter tasks by status
  const pendingTasks = tasks
    .filter((task) => task.status === "in_progress")
    .slice(0, 5);
  const completedTasks = tasks
    .filter((task) => task.status === "completed")
    .slice(0, 5);

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-900">
      <div className="px-4 sm:px-6 lg:px-8 py-4">
        {/* Tombol Logout */}
        <div className="flex justify-end mb-4">
          <button
            onClick={async () => {
              await supabase.auth.signOut();
              router.push("/login");
            }}
            className="bg-red-500 hover:bg-red-600 text-white font-semibold py-2 px-4 rounded-lg transition-colors"
          >
            Logout
          </button>
        </div>

        {/* Statistik Cards */}
        <div className="grid rounded-2xl border border-gray-200 bg-white sm:grid-cols-2 xl:grid-cols-4 dark:border-gray-800 dark:bg-gray-900 mb-8 shadow-md">
          {/* Pesanan Minggu Ini */}
          <div className="border-b border-gray-200 px-6 py-5 sm:border-r xl:border-b-0 dark:border-gray-800">
            <span className="text-sm text-gray-500 dark:text-gray-400">
              Pesanan Minggu Ini
            </span>
            <div className="mt-2 flex items-end gap-3">
              <h4 className="text-title-xs sm:text-title-sm font-bold text-gray-800 dark:text-white/90">
                {stats.ordersThisWeek} /{" "}
                {formatCurrency(stats.ordersThisWeekIncome)}
              </h4>
              <div>
                <span
                  className={`flex items-center gap-1 rounded-full py-0.5 pr-2.5 pl-2 text-sm font-medium ${
                    stats.ordersThisWeek >= stats.ordersLastWeek
                      ? "bg-success-50 text-success-600 dark:bg-success-500/15 dark:text-success-500"
                      : "bg-error-50 text-error-600 dark:bg-error-500/15 dark:text-error-500"
                  }`}
                >
                  {stats.ordersThisWeek >= stats.ordersLastWeek ? "+" : ""}
                  {calculatePercentageChange(
                    stats.ordersThisWeek,
                    stats.ordersLastWeek
                  ).toFixed(1)}
                  %
                </span>
              </div>
            </div>
          </div>

          {/* Pesanan Bulan Ini */}
          <div className="border-b border-gray-200 px-6 py-5 xl:border-r xl:border-b-0 dark:border-gray-800">
            <span className="text-sm text-gray-500 dark:text-gray-400">
              Pesanan Bulan Ini
            </span>
            <div className="mt-2 flex items-end gap-3">
              <h4 className="text-title-xs sm:text-title-sm font-bold text-gray-800 dark:text-white/90">
                {stats.ordersThisMonth} /{" "}
                {formatCurrency(stats.ordersThisMonthIncome)}
              </h4>
              <div>
                <span
                  className={`flex items-center gap-1 rounded-full py-0.5 pr-2.5 pl-2 text-sm font-medium ${
                    stats.ordersThisMonth >= stats.ordersLastMonth
                      ? "bg-success-50 text-success-600 dark:bg-success-500/15 dark:text-success-500"
                      : "bg-error-50 text-error-600 dark:bg-error-500/15 dark:text-error-500"
                  }`}
                >
                  {stats.ordersThisMonth >= stats.ordersLastMonth ? "+" : ""}
                  {calculatePercentageChange(
                    stats.ordersThisMonth,
                    stats.ordersLastMonth
                  ).toFixed(1)}
                  %
                </span>
              </div>
            </div>
          </div>

          {/* Pesanan Tahun Ini */}
          <div className="border-b border-gray-200 px-6 py-5 sm:border-r sm:border-b-0 dark:border-gray-800">
            <span className="text-sm text-gray-500 dark:text-gray-400">
              Pesanan Tahun Ini
            </span>
            <div className="mt-2 flex items-end gap-3">
              <h4 className="text-title-xs sm:text-title-sm font-bold text-gray-800 dark:text-white/90">
                {stats.ordersThisYear} /{" "}
                {formatCurrency(stats.ordersThisYearIncome)}
              </h4>
              <div>
                <span
                  className={`flex items-center gap-1 rounded-full py-0.5 pr-2.5 pl-2 text-sm font-medium ${
                    stats.ordersThisYear >= stats.ordersLastYear
                      ? "bg-success-50 text-success-600 dark:bg-success-500/15 dark:text-success-500"
                      : "bg-error-50 text-error-600 dark:bg-error-500/15 dark:text-error-500"
                  }`}
                >
                  {stats.ordersThisYear >= stats.ordersLastYear ? "+" : ""}
                  {calculatePercentageChange(
                    stats.ordersThisYear,
                    stats.ordersLastYear
                  ).toFixed(1)}
                  %
                </span>
              </div>
            </div>
          </div>

          {/* Total Semua Pesanan */}
          <div className="px-6 py-5">
            <span className="text-sm text-gray-500 dark:text-gray-400">
              Total Semua Pesanan
            </span>
            <div className="mt-2 flex items-end gap-3">
              <h4 className="text-title-xs sm:text-title-sm font-bold text-gray-800 dark:text-white/90">
                {stats.ordersTotal} / {formatCurrency(stats.ordersTotalIncome)}
              </h4>
            </div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-6">
          <div className="w-full lg:w-8/12">
            {/* Grafik Penghasilan */}
            <div className="lg:col-span-2 bg-white dark:bg-slate-800 rounded-xl shadow-md p-6 mb-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
                  Penghasilan 14 Hari Terakhir
                </h3>
              </div>

              <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white px-5 pt-5 sm:px-6 sm:pt-6 dark:border-gray-800 dark:bg-white/[0.03]">
                <div className="max-w-full overflow-x-auto custom-scrollbar">
                  <div className="relative w-full" style={{ height: "280px" }}>
                    {/* Y-axis labels */}
                    <div className="absolute left-0 top-0 h-full w-12 flex flex-col justify-between text-xs text-gray-500 dark:text-gray-400 pb-8">
                      <span>2.5jt</span>
                      <span>1jt</span>
                      <span>500k</span>
                      <span>250k</span>
                      <span>100k</span>
                      <span>50k</span>
                      <span>0</span>
                    </div>

                    {/* Grid lines */}
                    <div className="absolute left-14 right-0 top-0 h-full flex flex-col justify-between pb-8">
                      <div className="w-full border-t border-gray-200 dark:border-gray-700"></div>
                      <div className="w-full border-t border-gray-200 dark:border-gray-700"></div>
                      <div className="w-full border-t border-gray-200 dark:border-gray-700"></div>
                      <div className="w-full border-t border-gray-200 dark:border-gray-700"></div>
                      <div className="w-full border-t border-gray-200 dark:border-gray-700"></div>
                      <div className="w-full border-t border-gray-200 dark:border-gray-700"></div>
                      <div className="w-full border-t-2 border-gray-400 dark:border-gray-600"></div>
                    </div>

                    {/* Bars */}
                    <div
                      className="absolute left-14 right-0 bottom-8 flex items-end justify-between gap-2"
                      style={{ height: "215px" }}
                    >
                      {chartData.map((item, index) => (
                        <div
                          key={index}
                          className="flex-1 flex flex-col items-center justify-end"
                        >
                          {/* Income value */}
                          {item.income > 0 && (
                            <div className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1 whitespace-nowrap">
                              {formatCurrency(item.income)}
                            </div>
                          )}

                          {/* Bar */}
                          <div
                            className="w-full bg-blue-600 dark:bg-blue-500 rounded-t relative"
                            style={{
                              height: `${getBarHeight(item.income)}px`,
                              minHeight: item.income > 0 ? "8px" : "0",
                            }}
                          >
                            {/* Order count */}
                            {item.orders > 0 && (
                              <div className="absolute inset-0 flex items-center justify-center">
                                <span className="text-white text-xs font-semibold">
                                  {item.orders}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* X-axis labels */}
                    <div className="absolute left-14 right-0 bottom-0 h-8 flex items-start justify-between gap-2">
                      {chartData.map((item, index) => (
                        <div
                          key={index}
                          className="flex-1 text-center text-xs text-gray-500 dark:text-gray-400"
                        >
                          {item.date}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Total income */}
                <div className="mt-4 mb-4 pt-4 border-t border-gray-200 dark:border-gray-700 flex justify-between items-center">
                  <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    Total Penghasilan 14 Hari Terakhir:
                  </span>
                  <span className="text-lg font-semibold text-gray-900 dark:text-white">
                    {formatCurrency(totalIncomeInChart)}
                  </span>
                </div>
              </div>
            </div>

            {/* Statistik Layanan */}
            <div className="lg:col-span-2 bg-white dark:bg-slate-800 rounded-xl shadow-md p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
                  Statistik Layanan
                </h3>
              </div>

              <div className="flex flex-col items-center gap-8 xl:flex-row">
                {/* Pie chart */}
                <div
                  className="relative flex items-center justify-center"
                  style={{ width: "240px", height: "240px" }}
                >
                  <svg
                    viewBox="0 0 240 240"
                    className="w-full h-full -rotate-90"
                  >
                    {serviceStats.length > 0 ? (
                      serviceStats.map((service, index) => {
                        const colors = ["#3641F5", "#7592FF", "#DDE9FF"];
                        const radius = 70;
                        const circumference = 2 * Math.PI * radius;
                        const prevPercentages = serviceStats
                          .slice(0, index)
                          .reduce((sum, s) => sum + s.percentage, 0);
                        const offset = (prevPercentages / 100) * circumference;
                        const strokeLength =
                          (service.percentage / 100) * circumference;

                        return (
                          <circle
                            key={index}
                            cx="120"
                            cy="120"
                            r={radius}
                            fill="transparent"
                            stroke={colors[index]}
                            strokeWidth="42"
                            strokeDasharray={`${strokeLength} ${circumference}`}
                            strokeDashoffset={-offset}
                            className="transition-all duration-300"
                          />
                        );
                      })
                    ) : (
                      <circle
                        cx="120"
                        cy="120"
                        r="70"
                        fill="transparent"
                        stroke="#E5E7EB"
                        strokeWidth="42"
                      />
                    )}
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-xl font-bold text-gray-800 dark:text-white">
                      Total
                    </span>
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                      {serviceStats.reduce((sum, s) => sum + s.count, 0)}{" "}
                      Pesanan
                    </span>
                  </div>
                </div>

                {/* Legend */}
                <div className="flex flex-col items-start gap-6 sm:flex-row xl:flex-col">
                  {serviceStats.map((service, index) => {
                    const colors = [
                      "bg-blue-600",
                      "bg-blue-400",
                      "bg-blue-200",
                    ];
                    return (
                      <div key={index} className="flex items-start gap-2.5">
                        <div
                          className={`${colors[index]} mt-1.5 h-2 w-2 rounded-full`}
                        ></div>
                        <div>
                          <h5 className="mb-1 font-medium text-gray-800 text-sm dark:text-white/90">
                            {service.service_name}
                          </h5>
                          <div className="flex items-center gap-2">
                            <p className="font-medium text-gray-700 text-sm dark:text-gray-400">
                              {service.percentage.toFixed(1)}%
                            </p>
                            <div className="w-1 h-1 bg-gray-400 rounded-full"></div>
                            <p className="text-gray-500 text-sm dark:text-gray-400">
                              {service.count} Pesanan
                            </p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* Task List dan Proyek Terbaru */}
          <div className="space-y-6 w-full lg:w-4/12">
            {/* Task List */}
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-md p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
                  Task List
                </h2>
                <div className="flex gap-4 text-sm">
                  <span className="text-blue-600 font-medium">
                    {stats.pendingTasks} Aktif
                  </span>
                  <span className="text-green-600 font-medium">
                    {stats.completedTasks} Selesai
                  </span>
                </div>
              </div>

              {/* Tugas Aktif */}
              <div className="mb-4">
                <h3 className="text-sm font-medium text-slate-600 dark:text-slate-400 mb-2">
                  Tugas Aktif
                </h3>
                <ul className="space-y-2">
                  {pendingTasks.map((task) => (
                    <li
                      key={task.id}
                      className="flex items-start gap-2 p-2 rounded hover:bg-slate-50 dark:hover:bg-slate-700"
                    >
                      <button
                        onClick={() => handleStatusChange(task.id, "completed")}
                        disabled={updatingTaskId === task.id}
                        className="mt-0.5 text-slate-400 hover:text-blue-600 disabled:opacity-50"
                      >
                        <Square size={18} />
                      </button>
                      <div className="flex-1">
                        <p className="text-sm text-slate-700 dark:text-slate-300 font-medium">
                          {task.package_details.name}
                        </p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          {task.customer_name} •{" "}
                          {formatCurrency(task.final_price)}
                        </p>
                      </div>
                    </li>
                  ))}
                  {pendingTasks.length === 0 && (
                    <p className="text-sm text-slate-500 dark:text-slate-400 italic">
                      Tidak ada tugas aktif
                    </p>
                  )}
                </ul>
              </div>

              {/* Tugas Selesai */}
              <div>
                <h3 className="text-sm font-medium text-slate-600 dark:text-slate-400 mb-2">
                  Selesai
                </h3>
                <ul className="space-y-2">
                  {completedTasks.map((task) => (
                    <li
                      key={task.id}
                      className="flex items-start gap-2 p-2 rounded hover:bg-slate-50 dark:hover:bg-slate-700 opacity-75"
                    >
                      <button
                        onClick={() =>
                          handleStatusChange(task.id, "in_progress")
                        }
                        disabled={updatingTaskId === task.id}
                        className="mt-0.5 text-green-600 hover:text-green-700 disabled:opacity-50"
                      >
                        <CheckSquare size={18} />
                      </button>
                      <div className="flex-1">
                        <p className="text-sm text-slate-700 dark:text-slate-300 font-medium line-through">
                          {task.package_details.name}
                        </p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          {task.customer_name} •{" "}
                          {formatCurrency(task.final_price)}
                        </p>
                      </div>
                    </li>
                  ))}
                  {completedTasks.length === 0 && (
                    <p className="text-sm text-slate-500 dark:text-slate-400 italic">
                      Tidak ada tugas yang selesai
                    </p>
                  )}
                </ul>
              </div>
            </div>

            {/* Proyek Terbaru */}
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-md p-6">
              <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
                Proyek Terbaru
              </h2>
              <ul className="space-y-3">
                {recentProjects.map((project) => (
                  <li
                    key={project.id}
                    className="text-sm text-slate-700 dark:text-slate-300 truncate"
                  >
                    - {project.title}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
