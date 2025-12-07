"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useAlert } from "@/components/providers/AlertProvider";
import LogoLoading from "@/components/LogoLoading";
import {
  MagnifyingGlassIcon,
  Squares2X2Icon,
  ListBulletIcon,
  ClockIcon,
  UserIcon,
} from "@heroicons/react/24/outline";

// Type definition matching the query structure
type OrderWithService = {
  id: number;
  invoice_number: string;
  customer_name: string;
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

// Status Constants
const STATUS_TODO = "accepted";
const STATUS_IN_PROGRESS = "in_progress";
const STATUS_COMPLETED = "completed";

export default function TaskManagementPage() {
  const [tasks, setTasks] = useState<OrderWithService[]>([]);
  const [filteredTasks, setFilteredTasks] = useState<OrderWithService[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<"list" | "kanban">("list");
  const [selectedTaskGroup, setSelectedTaskGroup] = useState<"All" | "Todo" | "InProgress" | "Completed">("All");
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    fetchTasks();
  }, []);

  useEffect(() => {
    filterTasks();
  }, [tasks, selectedTaskGroup, searchQuery]);

  const fetchTasks = async () => {
    setLoading(true);
    try {
      // Fetch orders with relevant statuses
      const { data, error } = await supabase
        .from("orders")
        .select(`
          *,
          services ( title )
        `)
        .in("status", [STATUS_TODO, STATUS_IN_PROGRESS, STATUS_COMPLETED])
        .order("work_deadline", { ascending: true });

      if (error) throw error;
      setTasks((data as any) || []);
    } catch (error) {
      console.error("Error fetching tasks:", error);
    } finally {
      setLoading(false);
    }
  };

  const filterTasks = () => {
    let filtered = tasks;

    // Filter by Tab
    if (selectedTaskGroup === "Todo") {
      filtered = filtered.filter(t => t.status === STATUS_TODO);
    } else if (selectedTaskGroup === "InProgress") {
      filtered = filtered.filter(t => t.status === STATUS_IN_PROGRESS);
    } else if (selectedTaskGroup === "Completed") {
      filtered = filtered.filter(t => t.status === STATUS_COMPLETED);
    }

    // Filter by Search
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(t =>
        t.customer_name.toLowerCase().includes(query) ||
        (t.services?.title || t.package_details?.name || "Refinancing").toLowerCase().includes(query)
      );
    }

    setFilteredTasks(filtered);
  };

  // Helper to count tasks
  const getCount = (group: string) => {
    if (group === 'All') return tasks.length;
    if (group === 'Todo') return tasks.filter(t => t.status === STATUS_TODO).length;
    if (group === 'InProgress') return tasks.filter(t => t.status === STATUS_IN_PROGRESS).length;
    if (group === 'Completed') return tasks.filter(t => t.status === STATUS_COMPLETED).length;
    return 0;
  };

  const formatDate = (dateString?: string | null) => {
    if (!dateString) return "-";
    return new Date(dateString).toLocaleDateString("id-ID", {
      day: "numeric",
      month: "short",
      year: "numeric"
    });
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case STATUS_TODO: return "Diterima";
      case STATUS_IN_PROGRESS: return "Dikerjakan";
      case STATUS_COMPLETED: return "Selesai";
      default: return status;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case STATUS_TODO: return "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400";
      case STATUS_IN_PROGRESS: return "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400";
      case STATUS_COMPLETED: return "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400";
      default: return "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300";
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <LogoLoading />
      </div>
    );
  }

  // Grouped tasks for List View (when All is selected)
  const todoTasks = tasks.filter(t => t.status === STATUS_TODO);
  const inProgressTasks = tasks.filter(t => t.status === STATUS_IN_PROGRESS);
  const completedTasks = tasks.filter(t => t.status === STATUS_COMPLETED);

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-900 p-4 sm:p-6 lg:p-8 font-sans">

      {/* Header Section (White Card - Matches Store Page) */}
      <div className="mb-6 rounded-2xl border border-gray-200 bg-white p-4 sm:p-6 dark:border-gray-800 dark:bg-white/[0.03]">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-gray-800 dark:text-white/90">
              Daftar Tugas
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Kelola tugas yang sedang berjalan
            </p>
          </div>

          {/* Tabs inside the Header Card */}
          <div className="flex flex-wrap items-center gap-x-1 gap-y-2 rounded-lg bg-gray-50 p-1 dark:bg-gray-900 border border-gray-100 dark:border-gray-800">
            {['All', 'Todo', 'InProgress', 'Completed'].map((tab) => (
              <button
                key={tab}
                onClick={() => setSelectedTaskGroup(tab as any)}
                className={`inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium rounded-md transition-all ${selectedTaskGroup === tab
                  ? "bg-white text-gray-900 dark:bg-gray-800 dark:text-white shadow-sm ring-1 ring-gray-200 dark:ring-gray-700"
                  : "text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
                  }`}
              >
                {tab === 'All' ? 'Semua' : tab === 'Todo' ? 'Diterima' : tab === 'InProgress' ? 'Dikerjakan' : 'Selesai'}
                <span
                  className={`inline-flex rounded-full px-1.5 py-0.5 text-[10px] font-medium leading-normal ${selectedTaskGroup === tab
                    ? "bg-gray-100 text-gray-900 dark:bg-gray-900 dark:text-white"
                    : "bg-gray-200/50 text-gray-600 dark:bg-gray-800 dark:text-gray-400"
                    }`}
                >
                  {getCount(tab)}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Filters & View Toggle Row */}
        <div className="mt-6 flex flex-row gap-4 items-center justify-between">
          <div className="relative w-full sm:max-w-md">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Cari tugas..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition"
            />
          </div>

          <div className="flex items-center gap-2 w-auto">
            {/* View Toggle */}
            <div className="flex bg-gray-100 dark:bg-slate-800 p-1 rounded-lg ml-auto sm:ml-0">
              <button
                onClick={() => setViewMode("kanban")}
                className={`p-2 rounded-md transition ${viewMode === "kanban" ? "bg-white dark:bg-slate-700 shadow-sm text-primary" : "text-gray-500 dark:text-gray-400 hover:text-gray-700"}`}
                title="Kanban View"
              >
                <Squares2X2Icon className="w-5 h-5" />
              </button>
              <button
                onClick={() => setViewMode("list")}
                className={`p-2 rounded-md transition ${viewMode === "list" ? "bg-white dark:bg-slate-700 shadow-sm text-primary" : "text-gray-500 dark:text-gray-400 hover:text-gray-700"}`}
                title="List View"
              >
                <ListBulletIcon className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Content Wrapper */}
      <div className="space-y-6">
        {viewMode === "list" ? (
          /* LIST VIEW - Wrapped in white card like header */
          <div className="rounded-2xl border border-gray-200 bg-white p-4 sm:p-6 dark:border-gray-800 dark:bg-white/[0.03]">
            <div className="flex flex-col gap-6">
              {selectedTaskGroup === 'All' ? (
                <>
                  <TaskListSection
                    title="Diterima"
                    tasks={todoTasks}
                    badgeColor="bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
                    formatDate={formatDate}
                    getStatusLabel={getStatusLabel}
                    getStatusColor={getStatusColor}
                  />
                  <TaskListSection
                    title="Dikerjakan"
                    tasks={inProgressTasks}
                    badgeColor="bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400"
                    formatDate={formatDate}
                    getStatusLabel={getStatusLabel}
                    getStatusColor={getStatusColor}
                  />
                  <TaskListSection
                    title="Selesai"
                    tasks={completedTasks}
                    badgeColor="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                    formatDate={formatDate}
                    getStatusLabel={getStatusLabel}
                    getStatusColor={getStatusColor}
                  />
                </>
              ) : (
                <TaskListSection
                  title={selectedTaskGroup === 'Todo' ? 'Diterima' : selectedTaskGroup === 'InProgress' ? 'Dikerjakan' : 'Selesai'}
                  tasks={filteredTasks}
                  badgeColor="bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300"
                  formatDate={formatDate}
                  getStatusLabel={getStatusLabel}
                  getStatusColor={getStatusColor}
                />
              )}
            </div>
          </div>
        ) : (
          /* KANBAN VIEW */
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3">
            <KanbanColumn
              title="Diterima"
              count={getCount('Todo')}
              tasks={todoTasks}
              badgeColor="bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
              formatDate={formatDate}
              getStatusLabel={getStatusLabel}
              getStatusColor={getStatusColor}
            />
            <KanbanColumn
              title="Dikerjakan"
              count={getCount('InProgress')}
              tasks={inProgressTasks}
              badgeColor="bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400"
              formatDate={formatDate}
              getStatusLabel={getStatusLabel}
              getStatusColor={getStatusColor}
            />
            <KanbanColumn
              title="Selesai"
              count={getCount('Completed')}
              tasks={completedTasks}
              badgeColor="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
              formatDate={formatDate}
              getStatusLabel={getStatusLabel}
              getStatusColor={getStatusColor}
            />
          </div>
        )}
      </div>
    </div>
  );
}

// Reuseable Components

function KanbanColumn({ title, count, tasks, badgeColor, formatDate, getStatusLabel, getStatusColor }: any) {
  return (
    <div className="flex flex-col gap-5 h-full">
      <div className="flex items-center justify-between px-1">
        <h3 className="flex items-center gap-3 text-base font-semibold text-gray-700 dark:text-white/90">
          {title}
          <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-bold ${badgeColor}`}>
            {count}
          </span>
        </h3>
      </div>

      <div className="flex flex-col gap-4">
        {tasks.map((task: OrderWithService) => (
          <TaskCard key={task.id} task={task} formatDate={formatDate} getStatusLabel={getStatusLabel} getStatusColor={getStatusColor} />
        ))}
        {tasks.length === 0 && (
          <div className="flex flex-col items-center justify-center h-32 rounded-xl bg-white/40 border border-dashed border-gray-200 dark:bg-white/5 dark:border-gray-700 text-sm text-gray-400">
            <p>Tidak ada tugas</p>
          </div>
        )}
      </div>
    </div>
  );
}

function TaskListSection({ title, tasks, badgeColor, formatDate, getStatusLabel, getStatusColor }: any) {
  if (tasks.length === 0) return null;
  return (
    <div className="flex flex-col gap-4">
      {/* Title only for grouped view, can be hidden if 'All' not used, but good for separation */}
      <h3 className="flex items-center gap-3 text-base font-semibold text-gray-700 dark:text-white/90 px-1">
        {title}
        <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-bold ${badgeColor}`}>
          {tasks.length}
        </span>
      </h3>
      <div className="space-y-3">
        {tasks.map((task: OrderWithService) => (
          <TaskCard key={task.id} task={task} isList={true} formatDate={formatDate} getStatusLabel={getStatusLabel} getStatusColor={getStatusColor} />
        ))}
      </div>
    </div>
  );
}

function TaskCard({ task, isList, formatDate, getStatusLabel, getStatusColor }: any) {
  const displayTitle = task.services?.title || task.package_details?.name || "Pesanan Kustom";

  return (
    <div className="p-3 bg-slate-50 dark:bg-slate-700/30 border border-slate-100 dark:border-slate-700 rounded-lg group">
      <div className="flex items-start gap-3">
        {/* Checkbox */}
        <div className={`mt-0.5 flex-shrink-0 ${task.status === STATUS_COMPLETED ? 'text-green-500' : 'text-slate-400'}`}>
          <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${task.status === STATUS_COMPLETED ? 'bg-green-500 border-green-500' : 'border-gray-300 hover:border-blue-400 bg-white dark:bg-slate-900 dark:border-gray-600'}`}>
            {task.status === STATUS_COMPLETED && <div className="w-2.5 h-1.5 border-b-2 border-r-2 border-white rotate-45 mb-0.5" />}
          </div>
        </div>
        <div className="flex-1 min-w-0">
          <p className={`text-sm font-medium truncate ${task.status === STATUS_COMPLETED ? 'text-slate-500 line-through' : 'text-slate-800 dark:text-slate-200'}`}>
            {displayTitle}
          </p>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            {task.customer_name}
          </p>
          <div className="flex items-center gap-2 mt-2">
            <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${getStatusColor(task.status)}`}>
              {getStatusLabel(task.status)}
            </span>
            <span className="text-[10px] text-slate-400">
              {formatDate(task.created_at)}
            </span>
            {task.work_deadline && (
              <span className="text-[10px] text-slate-400 flex items-center gap-1">
                <ClockIcon className="w-3 h-3" />
                {formatDate(task.work_deadline)}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
