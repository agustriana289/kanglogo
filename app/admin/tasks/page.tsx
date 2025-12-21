"use client";

import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { useAlert } from "@/components/providers/AlertProvider";
import LogoPathAnimation from "@/components/LogoPathAnimation";
import {
  MagnifyingGlassIcon,
  ClockIcon,
  UserIcon,
  ChevronDownIcon,
  CalendarIcon,
  ArrowPathIcon,
  LinkIcon,
} from "@heroicons/react/24/outline";
import Link from "next/link";

// Type definition matching the query structure
type OrderWithService = {
  id: number;
  invoice_number: string;
  customer_name: string;
  status: string;
  work_deadline: string | null;
  payment_deadline: string | null;
  created_at: string;
  package_details: {
    name: string;
  };
  services: {
    title: string;
  } | null;
};

// Status Constants
const STATUS_TODO = "accepted";
const STATUS_IN_PROGRESS = "in_progress";
const STATUS_COMPLETED = "completed";

export default function TaskManagementPage() {
  const [tasks, setTasks] = useState<OrderWithService[]>([]);
  const [filteredTasks, setFilteredTasks] = useState<OrderWithService[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTaskGroup, setSelectedTaskGroup] = useState<
    "InProgress" | "Completed"
  >("InProgress");
  const [searchQuery, setSearchQuery] = useState("");
  const [displayLimit, setDisplayLimit] = useState(10);
  const [dateFilter, setDateFilter] = useState("");
  const [dateDropdownOpen, setDateDropdownOpen] = useState(false);
  const [isGoogleConnected, setIsGoogleConnected] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const { showAlert } = useAlert();

  // Check Google Connection
  useEffect(() => {
    const checkConnection = async () => {
      const { data } = await supabase
        .from("integrations")
        .select("id")
        .eq("service_name", "google_tasks")
        .single();
      if (data) setIsGoogleConnected(true);
    };
    checkConnection();
  }, []);

  const handleSync = async () => {
    setIsSyncing(true);
    try {
      const res = await fetch("/api/tasks/sync");
      const data = await res.json();
      if (res.ok) {
        showAlert("success", "Sinkronisasi Berhasil", `Berhasil sinkronisasi ${data.operations_count || 0} tugas!`);
        fetchTasks(); // Refresh list to catch any status updates from Google
      } else {
        throw new Error(data.error || "Gagal sinkronisasi");
      }
    } catch (error: any) {
      showAlert("error", "Gagal Sinkronisasi", error.message);
    } finally {
      setIsSyncing(false);
    }
  };



  const fetchTasks = useCallback(async () => {
    setLoading(true);
    try {
      // Fetch orders with relevant statuses
      const { data, error } = await supabase
        .from("orders")
        .select(
          `
  *,
  services(title)
    `
        )
        .in("status", [STATUS_TODO, STATUS_IN_PROGRESS, STATUS_COMPLETED])
        .order("created_at", { ascending: false });

      if (error) throw error;
      setTasks((data as any) || []);
    } catch (error) {
      console.error("Error fetching tasks:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  const filterTasks = useCallback(() => {
    let filtered = tasks;

    // Filter by Tab
    if (selectedTaskGroup === "InProgress") {
      filtered = filtered.filter((t) => t.status === STATUS_IN_PROGRESS || t.status === STATUS_TODO);
    } else if (selectedTaskGroup === "Completed") {
      filtered = filtered.filter((t) => t.status === STATUS_COMPLETED);
    }

    // Filter by Search
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (t) =>
          t.customer_name.toLowerCase().includes(query) ||
          (t.services?.title || t.package_details?.name || "Refinancing")
            .toLowerCase()
            .includes(query)
      );
    }

    // Date filter
    if (dateFilter) {
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

      filtered = filtered.filter((t) => {
        const taskDate = new Date(t.created_at);

        switch (dateFilter) {
          case "today":
            return taskDate >= today;
          case "7days":
            const sevenDaysAgo = new Date(today);
            sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
            return taskDate >= sevenDaysAgo;
          case "30days":
            const thirtyDaysAgo = new Date(today);
            thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
            return taskDate >= thirtyDaysAgo;
          case "thisMonth":
            return taskDate.getMonth() === now.getMonth() && taskDate.getFullYear() === now.getFullYear();
          default:
            return true;
        }
      });
    }

    setFilteredTasks(filtered);
  }, [tasks, selectedTaskGroup, searchQuery, dateFilter]);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  useEffect(() => {
    filterTasks();
    setDisplayLimit(10); // Reset display limit when filters change
  }, [filterTasks]);


  // Group tasks for "InProgress" tab based on deadline urgency
  const groupTasksByUrgency = (tasks: OrderWithService[]) => {
    const now = new Date();
    now.setHours(0, 0, 0, 0); // Reset to start of day for accurate comparison

    const overdue: OrderWithService[] = [];
    const urgent: OrderWithService[] = [];
    const normal: OrderWithService[] = [];
    const noDeadline: OrderWithService[] = [];

    tasks.forEach((task) => {
      // Use payment_deadline or work_deadline, whichever is available
      const deadlineStr = (task as any).payment_deadline || task.work_deadline;

      if (!deadlineStr) {
        noDeadline.push(task);
        return;
      }

      const deadline = new Date(deadlineStr);
      deadline.setHours(0, 0, 0, 0); // Reset to start of day

      const diffTime = deadline.getTime() - now.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      if (diffDays < 0) {
        overdue.push(task);
      } else if (diffDays <= 3) {
        urgent.push(task);
      } else {
        normal.push(task);
      }
    });

    return { overdue, urgent, normal, noDeadline };
  };

  // Get countdown text for deadline (for InProgress tasks)
  const getDeadlineCountdown = (deadlineString: string) => {
    const now = new Date();
    const deadline = new Date(deadlineString);
    const diffTime = deadline.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
      const absDays = Math.abs(diffDays);
      if (absDays === 1) return "terlambat 1 hari";
      if (absDays < 7) return `terlambat ${absDays} hari`;
      if (absDays < 30) {
        const weeks = Math.floor(absDays / 7);
        return `terlambat ${weeks} minggu`;
      }
      if (absDays < 365) {
        const months = Math.floor(absDays / 30);
        return `terlambat ${months} bulan`;
      }
      const years = Math.floor(absDays / 365);
      return `terlambat ${years} tahun`;
    } else if (diffDays === 0) {
      return "hari ini";
    } else if (diffDays === 1) {
      return "besok";
    } else if (diffDays <= 7) {
      return `${diffDays} hari lagi`;
    } else if (diffDays <= 30) {
      const weeks = Math.floor(diffDays / 7);
      return `${weeks} minggu lagi`;
    } else if (diffDays <= 365) {
      const months = Math.floor(diffDays / 30);
      return `${months} bulan lagi`;
    } else {
      const years = Math.floor(diffDays / 365);
      return `${years} tahun lagi`;
    }
  };

  // Get completion text for completed tasks (based on created_at)
  const getCompletionText = (createdAtString: string) => {
    const now = new Date();
    const createdAt = new Date(createdAtString);
    const diffTime = now.getTime() - createdAt.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return "selesai hari ini";
    if (diffDays === 1) return "selesai kemarin";
    if (diffDays < 7) return `selesai ${diffDays} hari lalu`;
    if (diffDays < 30) {
      const weeks = Math.floor(diffDays / 7);
      return `selesai ${weeks} minggu lalu`;
    }
    if (diffDays < 365) {
      const months = Math.floor(diffDays / 30);
      return `selesai ${months} bulan lalu`;
    }
    const years = Math.floor(diffDays / 365);
    return `selesai ${years} tahun lalu`;
  };

  const toggleTaskStatus = async (taskId: number, currentStatus: string) => {
    try {
      // Determine next status
      let newStatus = currentStatus;
      if (currentStatus === STATUS_TODO) {
        newStatus = STATUS_IN_PROGRESS;
      } else if (currentStatus === STATUS_IN_PROGRESS) {
        newStatus = STATUS_COMPLETED;
      } else if (currentStatus === STATUS_COMPLETED) {
        newStatus = STATUS_IN_PROGRESS;
      }

      const { error } = await supabase
        .from("orders")
        .update({ status: newStatus })
        .eq("id", taskId);

      if (error) throw error;

      // Update local state
      setTasks(
        tasks.map((t) => (t.id === taskId ? { ...t, status: newStatus } : t))
      );
      showAlert("success", "Berhasil", "Status tugas berhasil diperbarui!");
    } catch (error) {
      console.error("Error updating task status:", error);
      showAlert("error", "Gagal", "Gagal memperbarui status tugas!");
    }
  };

  // Helper to count tasks
  const getCount = (group: string) => {
    if (group === "InProgress")
      return tasks.filter((t) => t.status === STATUS_IN_PROGRESS || t.status === STATUS_TODO).length;
    if (group === "Completed")
      return tasks.filter((t) => t.status === STATUS_COMPLETED).length;
    return 0;
  };

  const formatDate = (dateString?: string | null) => {
    if (!dateString) return "-";
    return new Date(dateString).toLocaleDateString("id-ID", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case STATUS_TODO:
        return "Diterima";
      case STATUS_IN_PROGRESS:
        return "Dikerjakan";
      case STATUS_COMPLETED:
        return "Selesai";
      default:
        return status;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case STATUS_TODO:
        return "bg-blue-100 text-blue-700";
      case STATUS_IN_PROGRESS:
        return "bg-orange-100 text-orange-700";
      case STATUS_COMPLETED:
        return "bg-green-100 text-green-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  if (loading) {
    return (
      <div className="fixed inset-0 z-50 flex justify-center items-center bg-white">
        <LogoPathAnimation />
      </div>
    );
  }

  // Grouped tasks for Kanban View
  const inProgressTasks = tasks.filter((t) => t.status === STATUS_IN_PROGRESS || t.status === STATUS_TODO);
  const completedTasks = tasks.filter((t) => t.status === STATUS_COMPLETED);

  return (
    <div className="min-h-screen bg-slate-100 p-4 sm:p-6 lg:p-8 font-sans">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          {/* Left: Tabs - Desktop Only */}
          <div className="hidden h-11 items-center gap-0.5 rounded-lg bg-gray-100 p-0.5 lg:inline-flex">
            {[
              { key: "InProgress", label: "Dikerjakan" },
              { key: "Completed", label: "Selesai" },
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setSelectedTaskGroup(tab.key as any)}
                className={`text-sm h-10 rounded-md px-3 py-2 font-medium transition-all ${selectedTaskGroup === tab.key
                  ? "shadow-sm text-gray-900 bg-white"
                  : "text-gray-500 hover:text-gray-900"
                  }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Right: Filters & Actions */}
          <div className="flex flex-col sm:flex-row gap-3">
            {/* Google Tasks Actions */}
            <div className="flex items-center gap-2">
              {!isGoogleConnected ? (
                <Link
                  href="/api/auth/google"
                  className="h-11 flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-all"
                >
                  <LinkIcon className="w-4 h-4" />
                  Connect Google Tasks
                </Link>
              ) : (
                <button
                  onClick={handleSync}
                  disabled={isSyncing}
                  className={`h-11 flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-all shadow-sm disabled:opacity-70 ${isSyncing ? "animate-pulse" : ""}`}
                >
                  <ArrowPathIcon className={`w-4 h-4 ${isSyncing ? "animate-spin" : ""}`} />
                  {isSyncing ? "Syncing..." : "Sync Now"}
                </button>
              )}
            </div>

            {/* Search */}
            <div className="relative">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Cari tugas..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 pr-4 py-3 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary w-full sm:w-48"
              />
            </div>

            {/* Date Filter Dropdown */}
            <div className="relative">
              <button
                onClick={() => setDateDropdownOpen(!dateDropdownOpen)}
                className="h-11 flex items-center gap-2 px-3 py-2 text-sm border border-gray-300 rounded-lg bg-white hover:bg-gray-50 focus:ring-2 focus:ring-primary focus:border-primary transition-all w-full sm:w-auto"
              >
                <CalendarIcon className="w-4 h-4 text-gray-400" />
                <span className="text-gray-700">
                  {dateFilter === "" ? "Semua Tanggal" :
                    dateFilter === "today" ? "Hari ini" :
                      dateFilter === "7days" ? "7 hari terakhir" :
                        dateFilter === "30days" ? "30 hari terakhir" :
                          dateFilter === "thisMonth" ? "Bulan ini" : dateFilter}
                </span>
                <ChevronDownIcon className={`w-4 h-4 text-gray-400 transition-transform ${dateDropdownOpen ? "rotate-180" : ""}`} />
              </button>
              {dateDropdownOpen && (
                <div className="absolute top-full left-0 mt-1 w-44 bg-white border border-gray-200 rounded-lg shadow-lg z-20 animate-in fade-in slide-in-from-top-2 duration-150">
                  {[
                    { value: "", label: "Semua Tanggal" },
                    { value: "today", label: "Hari ini" },
                    { value: "7days", label: "7 hari terakhir" },
                    { value: "30days", label: "30 hari terakhir" },
                    { value: "thisMonth", label: "Bulan ini" },
                  ].map((option) => (
                    <button
                      key={option.value}
                      onClick={() => {
                        setDateFilter(option.value);
                        setDateDropdownOpen(false);
                      }}
                      className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-100 first:rounded-t-lg last:rounded-b-lg transition-colors ${dateFilter === option.value
                        ? "bg-primary/10 text-primary font-medium"
                        : "text-gray-700"
                        }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Mobile Tabs - Below Filters */}
        <div className="flex items-center gap-1 bg-gray-100 p-0.5 rounded-lg mt-4 lg:hidden">
          {[
            { key: "InProgress", label: "Dikerjakan" },
            { key: "Completed", label: "Selesai" },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setSelectedTaskGroup(tab.key as any)}
              className={`flex-1 text-sm py-2.5 px-3 rounded-md font-medium transition-all ${selectedTaskGroup === tab.key
                ? "shadow-sm text-white bg-primary"
                : "text-gray-500 hover:text-gray-900"
                }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      {filteredTasks.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl border border-dashed border-gray-300">
          <ClockIcon className="h-12 w-12 mx-auto text-gray-300 mb-3" />
          <h3 className="text-lg font-medium text-gray-900">
            Tidak ada tugas
          </h3>
          <p className="text-gray-500 mt-1">
            Belum ada tugas untuk filter ini.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {/* List View - Task Cards */}
          {selectedTaskGroup === "InProgress" ? (
            /* Grouped view for InProgress */
            (() => {
              const groups = groupTasksByUrgency(filteredTasks);

              // Calculate how many tasks to show from each group
              let remainingLimit = displayLimit;
              const overdueToShow = Math.min(groups.overdue.length, remainingLimit);
              remainingLimit -= overdueToShow;

              const urgentToShow = Math.min(groups.urgent.length, remainingLimit);
              remainingLimit -= urgentToShow;

              const normalToShow = Math.min(groups.normal.length, remainingLimit);
              remainingLimit -= normalToShow;

              const noDeadlineToShow = Math.min(groups.noDeadline.length, remainingLimit);

              return (
                <>
                  {/* Overdue Group */}
                  {groups.overdue.length > 0 && overdueToShow > 0 && (
                    <div className="rounded-2xl border border-red-200 bg-white p-4 sm:p-6">
                      <h3 className="flex items-center gap-2 text-sm font-semibold text-red-700 mb-3">
                        <ClockIcon className="w-4 h-4" />
                        Terlambat ({groups.overdue.length})
                      </h3>
                      <div className="space-y-3">
                        {groups.overdue.slice(0, overdueToShow).map((task) => (
                          <TaskListCard key={task.id} task={task} toggleTaskStatus={toggleTaskStatus} formatDate={formatDate} getDeadlineCountdown={getDeadlineCountdown} getCompletionText={getCompletionText} isCompleted={false} />
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Urgent Group (3 days or less) */}
                  {groups.urgent.length > 0 && urgentToShow > 0 && (
                    <div className="rounded-2xl border border-orange-200 bg-white p-4 sm:p-6">
                      <h3 className="flex items-center gap-2 text-sm font-semibold text-orange-700 mb-3">
                        <ClockIcon className="w-4 h-4" />
                        Segera ({groups.urgent.length})
                      </h3>
                      <div className="space-y-3">
                        {groups.urgent.slice(0, urgentToShow).map((task) => (
                          <TaskListCard key={task.id} task={task} toggleTaskStatus={toggleTaskStatus} formatDate={formatDate} getDeadlineCountdown={getDeadlineCountdown} getCompletionText={getCompletionText} isCompleted={false} />
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Normal Group */}
                  {groups.normal.length > 0 && normalToShow > 0 && (
                    <div className="rounded-2xl border border-gray-200 bg-white p-4 sm:p-6">
                      <h3 className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-3">
                        <ClockIcon className="w-4 h-4" />
                        Normal ({groups.normal.length})
                      </h3>
                      <div className="space-y-3">
                        {groups.normal.slice(0, normalToShow).map((task) => (
                          <TaskListCard key={task.id} task={task} toggleTaskStatus={toggleTaskStatus} formatDate={formatDate} getDeadlineCountdown={getDeadlineCountdown} getCompletionText={getCompletionText} isCompleted={false} />
                        ))}
                      </div>
                    </div>
                  )}

                  {/* No Deadline Group */}
                  {groups.noDeadline.length > 0 && noDeadlineToShow > 0 && (
                    <div className="rounded-2xl border border-gray-200 bg-white p-4 sm:p-6">
                      <h3 className="flex items-center gap-2 text-sm font-semibold text-gray-500 mb-3">
                        <ClockIcon className="w-4 h-4" />
                        Tanpa Deadline ({groups.noDeadline.length})
                      </h3>
                      <div className="space-y-3">
                        {groups.noDeadline.slice(0, noDeadlineToShow).map((task) => (
                          <TaskListCard key={task.id} task={task} toggleTaskStatus={toggleTaskStatus} formatDate={formatDate} getDeadlineCountdown={getDeadlineCountdown} getCompletionText={getCompletionText} isCompleted={false} />
                        ))}
                      </div>
                    </div>
                  )}
                </>
              );
            })()
          ) : (
            /* Simple list for Completed */
            <div className="rounded-2xl border border-gray-200 bg-white p-4 sm:p-6">
              <div className="space-y-3">
                {filteredTasks.slice(0, displayLimit).map((task) => (
                  <TaskListCard key={task.id} task={task} toggleTaskStatus={toggleTaskStatus} formatDate={formatDate} getDeadlineCountdown={getDeadlineCountdown} getCompletionText={getCompletionText} isCompleted={true} />
                ))}
              </div>
            </div>
          )}

          {/* Load More Button */}
          {filteredTasks.length > displayLimit && (
            <div className="flex justify-center">
              <button
                onClick={() => setDisplayLimit((prev) => prev + 10)}
                className="px-6 py-2.5 text-sm font-medium text-primary bg-white border border-primary rounded-lg hover:bg-primary hover:text-white transition-all shadow-sm"
              >
                Muat Lebih Banyak ({filteredTasks.length - displayLimit} tugas tersisa)
              </button>
            </div>
          )}

          {/* Show Less Button */}
          {displayLimit >= filteredTasks.length && filteredTasks.length > 10 && (
            <div className="flex justify-center">
              <button
                onClick={() => setDisplayLimit(10)}
                className="px-6 py-2.5 text-sm font-medium text-gray-600 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-all shadow-sm"
              >
                Tampilkan Lebih Sedikit
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// Reusable Components

function TaskListCard({
  task,
  toggleTaskStatus,
  formatDate,
  getDeadlineCountdown,
  getCompletionText,
  isCompleted,
}: {
  task: OrderWithService;
  toggleTaskStatus: (id: number, status: string) => void;
  formatDate: (date?: string | null) => string;
  getDeadlineCountdown: (deadline: string) => string;
  getCompletionText: (createdAt: string) => string;
  isCompleted: boolean;
}) {
  const displayTitle =
    task.services?.title || task.package_details?.name || "Pesanan Kustom";

  // Use payment_deadline or work_deadline, whichever is available
  const deadlineStr = (task as any).payment_deadline || task.work_deadline;

  return (
    <div className="p-3 bg-slate-50 border border-slate-100 rounded-lg group hover:border-primary/30 transition-all">
      <div className="flex items-start gap-3">
        {/* Functional Checkbox */}
        <button
          onClick={() => toggleTaskStatus(task.id, task.status)}
          className={`mt-0.5 flex-shrink-0 ${task.status === STATUS_COMPLETED
            ? "text-green-500"
            : "text-slate-400 hover:text-primary"
            }`}
        >
          <div
            className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${task.status === STATUS_COMPLETED
              ? "bg-green-500 border-green-500"
              : "border-gray-300 hover:border-primary bg-white"
              }`}
          >
            {task.status === STATUS_COMPLETED && (
              <div className="w-2.5 h-1.5 border-b-2 border-r-2 border-white rotate-45 mb-0.5" />
            )}
          </div>
        </button>

        <div className="flex-1 min-w-0">
          <p
            className={`text-sm font-medium ${task.status === STATUS_COMPLETED
              ? "text-slate-500 line-through"
              : "text-slate-800"
              }`}
          >
            {displayTitle}
          </p>
          <p className="text-xs text-slate-500 mt-1 flex items-center gap-1">
            <UserIcon className="w-3 h-3" />
            {task.customer_name}
          </p>
          <div className="flex items-center gap-2 mt-2 flex-wrap">
            {isCompleted ? (
              <>
                <span className="text-[10px] text-slate-400">
                  {formatDate(task.created_at)}
                </span>
                <span className="text-[10px] text-green-600 flex items-center gap-1 font-medium">
                  <ClockIcon className="w-3 h-3" />
                  {getCompletionText(task.created_at)}
                </span>
              </>
            ) : (
              <>
                <span className="text-[10px] text-slate-400">
                  Dibuat {formatDate(task.created_at)}
                </span>
                {deadlineStr && (
                  <span className="text-[10px] text-slate-600 flex items-center gap-1 font-medium">
                    <ClockIcon className="w-3 h-3" />
                    {formatDate(deadlineStr)} • {getDeadlineCountdown(deadlineStr)}
                  </span>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
