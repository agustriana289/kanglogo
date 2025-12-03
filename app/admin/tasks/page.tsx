"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/useToast";
import Toast from "@/components/Toast";
import LogoLoading from "@/components/LogoLoading";
import {
  CheckSquare,
  Square,
  Calendar,
  LayoutGrid,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  User,
  FileText,
  DollarSign,
  MagnifyingGlass,
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

// Items per page
const ITEMS_PER_PAGE = 20;

export default function TaskManagementPage() {
  const [tasks, setTasks] = useState<OrderWithService[]>([]);
  const [filteredTasks, setFilteredTasks] = useState<OrderWithService[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"proses" | "selesai">("proses");
  const [activeView, setActiveView] = useState<"table" | "calendar">("table");
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [updatingTaskId, setUpdatingTaskId] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const { toast, showToast, hideToast } = useToast();

  // Calculate total pages
  const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE);

  // Calculate the range of items to display
  const indexOfLastItem = currentPage * ITEMS_PER_PAGE;
  const indexOfFirstItem = indexOfLastItem - ITEMS_PER_PAGE;
  const currentItems = filteredTasks.slice(indexOfFirstItem, indexOfLastItem);

  useEffect(() => {
    fetchTasks();
  }, []);

  useEffect(() => {
    filterTasks();
  }, [tasks, activeTab, searchQuery]);

  const fetchTasks = async () => {
    setLoading(true);
    // Mengambil data orders dan menggabungkannya dengan tabel services untuk mendapatkan judul layanan
    const { data, error } = await supabase
      .from("orders")
      .select(
        `
                *,
                services ( title )
            `
      )
      .in("status", ["in_progress", "completed"]) // Hanya mengambil status yang relevan untuk task
      .order("work_deadline", { ascending: true });

    if (error) {
      console.error("Error fetching tasks:", error);
      showToast("Gagal memuat task", "error");
    } else {
      setTasks((data as OrderWithService[]) || []);
      setTotalItems((data as OrderWithService[])?.length || 0);
    }
    setLoading(false);
  };

  const filterTasks = () => {
    let filtered = tasks.filter((task) => {
      if (activeTab === "proses") {
        return task.status === "in_progress";
      }
      return task.status === "completed";
    });

    // Apply search filter
    if (searchQuery.trim() !== "") {
      const searchLower = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (task) =>
          task.invoice_number.toLowerCase().includes(searchLower) ||
          task.customer_name.toLowerCase().includes(searchLower) ||
          task.package_details.name.toLowerCase().includes(searchLower) ||
          (task.services?.title &&
            task.services.title.toLowerCase().includes(searchLower))
      );
    }

    setFilteredTasks(filtered);
    // Reset to first page when search changes
    setCurrentPage(1);
  };

  const handleStatusChange = async (taskId: number, newStatus: string) => {
    setUpdatingTaskId(taskId);
    const { error } = await supabase
      .from("orders")
      .update({ status: newStatus })
      .eq("id", taskId);

    if (error) {
      console.error("Error updating task status:", error);
      showToast("Gagal memperbarui status task.", "error");
    } else {
      showToast(
        `Task berhasil dipindahkan ke ${
          newStatus === "in_progress" ? "proses" : "selesai"
        }!`,
        "success"
      );
      // Refresh data untuk memindahkan task ke tab yang benar
      fetchTasks();
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

  // Fungsi untuk Kalender
  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDayOfMonth = new Date(year, month, 1);
    const lastDayOfMonth = new Date(year, month + 1, 0);
    const startDate = new Date(firstDayOfMonth);
    startDate.setDate(startDate.getDate() - firstDayOfMonth.getDay());

    const days = [];
    let current = new Date(startDate);

    while (current <= lastDayOfMonth || current.getDay() !== 0) {
      days.push(new Date(current));
      current.setDate(current.getDate() + 1);
    }
    return days;
  };

  const renderCalendar = () => {
    const days = getDaysInMonth(currentMonth);
    const today = new Date();

    const tasksForCalendar = filteredTasks.reduce((acc, task) => {
      if (task.work_deadline) {
        const date = new Date(task.work_deadline).toDateString();
        if (!acc[date]) {
          acc[date] = [];
        }
        acc[date].push(task);
      }
      return acc;
    }, {} as Record<string, OrderWithService[]>);

    return (
      <div className="bg-white dark:bg-slate-700 rounded-xl shadow-lg p-4 md:p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
            {currentMonth.toLocaleDateString("id-ID", {
              month: "long",
              year: "numeric",
            })}
          </h2>
          <div className="flex gap-2">
            <button
              onClick={() =>
                setCurrentMonth(
                  new Date(
                    currentMonth.getFullYear(),
                    currentMonth.getMonth() - 1
                  )
                )
              }
              className="p-1 rounded-md hover:bg-slate-100 dark:hover:bg-slate-600 transition-colors"
            >
              <ChevronLeft
                size={20}
                className="text-slate-500 dark:text-slate-400"
              />
            </button>
            <button
              onClick={() =>
                setCurrentMonth(
                  new Date(
                    currentMonth.getFullYear(),
                    currentMonth.getMonth() + 1
                  )
                )
              }
              className="p-1 rounded-md hover:bg-slate-100 dark:hover:bg-slate-600 transition-colors"
            >
              <ChevronRight
                size={20}
                className="text-slate-500 dark:text-slate-400"
              />
            </button>
          </div>
        </div>
        <div className="grid grid-cols-7 gap-1 text-center text-xs font-semibold text-slate-600 dark:text-slate-400 mb-2">
          {["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"].map((day) => (
            <div key={day} className="p-2">
              {day}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-1">
          {days.map((day, index) => {
            const dateKey = day.toDateString();
            const dayTasks = tasksForCalendar[dateKey] || [];
            const isCurrentMonth = day.getMonth() === currentMonth.getMonth();
            const isToday = day.toDateString() === today.toDateString();

            return (
              <div
                key={index}
                className={`min-h-[80px] p-1 border rounded ${
                  !isCurrentMonth
                    ? "bg-slate-50 dark:bg-slate-800 text-slate-400 dark:text-slate-500"
                    : ""
                } ${
                  isToday
                    ? "bg-blue-50 dark:bg-blue-900/20 border-blue-300 dark:border-blue-400"
                    : "border-slate-200 dark:border-slate-600"
                }`}
              >
                <div
                  className={`text-sm font-medium ${
                    isToday ? "text-blue-600 dark:text-blue-400" : ""
                  }`}
                >
                  {day.getDate()}
                </div>
                <div className="space-y-1 mt-1">
                  {dayTasks.slice(0, 2).map((task) => (
                    <a
                      key={task.id}
                      href={`/order/${task.invoice_number}`}
                      target="_blank"
                      className={`block text-xs p-1 rounded truncate ${
                        task.status === "completed"
                          ? "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400"
                          : "bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400"
                      } hover:opacity-80`}
                      title={task.package_details.name}
                    >
                      {task.package_details.name}
                    </a>
                  ))}
                  {dayTasks.length > 2 && (
                    <div className="text-xs text-slate-500 dark:text-slate-400 p-1">
                      +{dayTasks.length - 2} lagi
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  // Generate page numbers
  const getPageNumbers = () => {
    const pages = [];
    const maxVisiblePages = 5;

    if (totalPages <= maxVisiblePages) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      const startPage = Math.max(1, currentPage - 2);
      const endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

      if (startPage > 1) {
        pages.push(1);
        if (startPage > 2) {
          pages.push("...");
        }
      }

      for (let i = startPage; i <= endPage; i++) {
        pages.push(i);
      }

      if (endPage < totalPages) {
        if (endPage < totalPages - 1) {
          pages.push("...");
        }
        pages.push(totalPages);
      }
    }

    return pages;
  };

  if (loading) {
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

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-900 p-2 sm:p-4 md:p-6">
      <div className="bg-white dark:bg-slate-700 rounded-xl sm:rounded-2xl shadow-lg p-3 sm:p-4 md:p-6">
        {/* Header Section - Diperbaiki dengan Search */}
        <div className="mb-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
              {/* View Switcher - Diperbaiki */}
              <div className="flex bg-slate-100 dark:bg-slate-800 rounded-lg p-1">
                <button
                  onClick={() => setActiveView("table")}
                  className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                    activeView === "table"
                      ? "bg-white dark:bg-slate-700 text-primary shadow-sm"
                      : "text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white"
                  }`}
                >
                  <LayoutGrid size={18} className="inline mr-1" /> Tabel
                </button>
                <button
                  onClick={() => setActiveView("calendar")}
                  className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                    activeView === "calendar"
                      ? "bg-white dark:bg-slate-700 text-primary shadow-sm"
                      : "text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white"
                  }`}
                >
                  <Calendar size={18} className="inline mr-1" /> Kalender
                </button>
              </div>
            </div>

            <div className="relative w-full sm:w-auto">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <MagnifyingGlass className="h-5 w-5 text-slate-400" />
              </div>
              <input
                type="text"
                className="block w-full sm:w-64 pl-10 pr-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-500 dark:placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                placeholder="Cari task..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* Tabs - Diperbaiki */}
        <div className="flex space-x-1 mb-6 p-1 bg-slate-100 dark:bg-slate-800 rounded-lg">
          <button
            onClick={() => setActiveTab("proses")}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              activeTab === "proses"
                ? "bg-white dark:bg-slate-700 text-orange-600 dark:text-orange-400 shadow-sm"
                : "text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white"
            }`}
          >
            Proses ({tasks.filter((t) => t.status === "in_progress").length})
          </button>
          <button
            onClick={() => setActiveTab("selesai")}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              activeTab === "selesai"
                ? "bg-white dark:bg-slate-700 text-green-600 dark:text-green-400 shadow-sm"
                : "text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white"
            }`}
          >
            Selesai ({tasks.filter((t) => t.status === "completed").length})
          </button>
        </div>

        {/* Items Count */}
        <div className="mb-4 text-sm text-slate-600 dark:text-slate-400">
          Menampilkan {indexOfFirstItem + 1}-
          {Math.min(indexOfLastItem, filteredTasks.length)} dari{" "}
          {filteredTasks.length} task
        </div>

        {/* Content based on activeView */}
        {activeView === "table" ? (
          <div className="hidden md:block overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-600">
              <thead className="bg-slate-50 dark:bg-slate-800">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-300 uppercase tracking-wider">
                    <span className="sr-only">Check</span>
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-300 uppercase tracking-wider">
                    Tanggal
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-300 uppercase tracking-wider">
                    Nama Proyek
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-300 uppercase tracking-wider">
                    Klien
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-300 uppercase tracking-wider">
                    Budget
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-300 uppercase tracking-wider">
                    Layanan
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-300 uppercase tracking-wider">
                    Aksi
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-slate-700 divide-y divide-slate-200 dark:divide-slate-600">
                {currentItems.map((task) => (
                  <tr
                    key={task.id}
                    className={`hover:bg-slate-50 dark:hover:bg-slate-800/50 ${
                      task.status === "completed" ? "opacity-60" : ""
                    }`}
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <button
                        onClick={() =>
                          handleStatusChange(
                            task.id,
                            task.status === "in_progress"
                              ? "completed"
                              : "in_progress"
                          )
                        }
                        disabled={updatingTaskId === task.id}
                        className="text-slate-400 hover:text-blue-600 dark:text-slate-500 dark:hover:text-blue-400 disabled:opacity-50"
                      >
                        {task.status === "completed" ? (
                          <CheckSquare
                            size={20}
                            className="text-green-600 dark:text-green-400"
                          />
                        ) : (
                          <Square
                            size={20}
                            className="text-slate-400 dark:text-slate-500"
                          />
                        )}
                      </button>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 dark:text-slate-300">
                      {formatDate(task.work_deadline)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900 dark:text-white">
                      <div className="flex items-center">
                        <FileText size={16} className="text-slate-400 mr-3" />
                        {task.package_details.name}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 dark:text-slate-300">
                      <div className="flex items-center">
                        <User size={16} className="text-slate-400 mr-1" />
                        {task.customer_name}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 dark:text-slate-300">
                      <div className="flex items-center">
                        <DollarSign size={16} className="text-slate-400 mr-1" />
                        Rp {task.final_price.toLocaleString("id-ID")}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 dark:text-slate-300">
                      {task.services?.title || "-"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <a
                        href={`/order/${task.invoice_number}`}
                        target="_blank"
                        className="text-indigo-600 hover:text-indigo-900 flex items-center gap-1"
                      >
                        <ExternalLink size={16} /> Detail
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {currentItems.length === 0 && (
              <div className="text-center py-12 text-slate-500 dark:text-slate-400">
                Tidak ada task ditemukan pada tab ini.
              </div>
            )}
          </div>
        ) : (
          renderCalendar()
        )}

        {/* Mobile Card View */}
        <div className="md:hidden space-y-4">
          {currentItems.map((task) => (
            <div
              key={task.id}
              className={`bg-white dark:bg-slate-800 rounded-lg shadow p-4 border border-slate-200 dark:border-slate-600 ${
                task.status === "completed" ? "opacity-60" : ""
              }`}
            >
              <div className="flex justify-between items-start mb-3">
                <div className="flex items-start">
                  <FileText size={20} className="text-slate-400 mr-3 mt-0.5" />
                  <div className="flex-1">
                    <h3 className="text-lg font-medium text-slate-900 dark:text-white">
                      {task.package_details.name}
                    </h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                      <span className="font-medium">Klien:</span>{" "}
                      {task.customer_name}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() =>
                    handleStatusChange(
                      task.id,
                      task.status === "in_progress"
                        ? "completed"
                        : "in_progress"
                    )
                  }
                  disabled={updatingTaskId === task.id}
                  className="text-slate-400 hover:text-blue-600 dark:text-slate-500 dark:hover:text-blue-400 disabled:opacity-50"
                >
                  {task.status === "completed" ? (
                    <CheckSquare
                      size={20}
                      className="text-green-600 dark:text-green-400"
                    />
                  ) : (
                    <Square
                      size={20}
                      className="text-slate-400 dark:text-slate-500"
                    />
                  )}
                </button>
              </div>
              <div className="ml-8">
                <div className="space-y-2 text-sm text-slate-500 dark:text-slate-400 mb-3">
                  <p>
                    <span className="font-medium">Deadline:</span>{" "}
                    {formatDate(task.work_deadline)}
                  </p>
                  <p>
                    <span className="font-medium">Budget:</span> Rp{" "}
                    {task.final_price.toLocaleString("id-ID")}
                  </p>
                  <p>
                    <span className="font-medium">Layanan:</span>{" "}
                    {task.services?.title || "-"}
                  </p>
                </div>
                <div className="flex justify-end">
                  <a
                    href={`/order/${task.invoice_number}`}
                    target="_blank"
                    className="inline-flex items-center px-3 py-1.5 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 rounded-md hover:bg-indigo-100 dark:hover:bg-indigo-900/30 transition-colors"
                  >
                    <ExternalLink size={16} className="mr-1" />
                    Detail
                  </a>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Empty State */}
        {currentItems.length === 0 && (
          <div className="text-center py-12">
            <CheckSquare className="mx-auto h-12 w-12 text-slate-400" />
            <h3 className="mt-2 text-sm font-medium text-slate-900 dark:text-white">
              {searchQuery ? "Tidak ada task yang ditemukan" : "Tidak ada task"}
            </h3>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              {searchQuery
                ? "Coba ubah kata kunci pencarian Anda."
                : activeTab === "proses"
                ? "Belum ada task yang sedang dikerjakan."
                : "Belum ada task yang telah selesai."}
            </p>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="mt-6 flex items-center justify-between">
            <div className="text-sm text-slate-700 dark:text-slate-300">
              Halaman {currentPage} dari {totalPages}
            </div>
            <div className="flex items-center space-x-1">
              <button
                onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="p-2 rounded-md border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>

              {getPageNumbers().map((page, index) =>
                page === "..." ? (
                  <span
                    key={`ellipsis-${index}`}
                    className="px-3 py-2 text-slate-500 dark:text-slate-400"
                  >
                    ...
                  </span>
                ) : (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page as number)}
                    className={`px-3 py-2 rounded-md border ${
                      currentPage === page
                        ? "bg-primary text-white border-primary"
                        : "border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700"
                    }`}
                  >
                    {page}
                  </button>
                )
              )}

              <button
                onClick={() =>
                  setCurrentPage((prev) => Math.min(prev + 1, totalPages))
                }
                disabled={currentPage === totalPages}
                className="p-2 rounded-md border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Toast Notification */}
      <Toast
        show={toast.show}
        message={toast.message}
        type={toast.type}
        onClose={hideToast}
      />
    </div>
  );
}
