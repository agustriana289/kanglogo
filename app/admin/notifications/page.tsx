"use client";

import { useState, useEffect, useRef } from "react";
import { supabase } from "@/lib/supabase";
import LogoPathAnimation from "@/components/LogoPathAnimation";
import {
  BellIcon,
  CheckCircleIcon,
  TrashIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  ChatBubbleLeftIcon,
  ReceiptPercentIcon,
  FolderIcon,
  MagnifyingGlassIcon,
  ChevronDownIcon,
  ShoppingBagIcon,
} from "@heroicons/react/24/outline";
import { CheckCircleIcon as CheckCircleSolid } from "@heroicons/react/24/solid";
import { useAlert } from "@/components/providers/AlertProvider";

// Tipe untuk notifikasi
interface Notification {
  id: number;
  type: "comment" | "discount" | "order" | "purchase" | "task" | "order_status";
  title: string;
  message: string;
  link: string;
  is_read: boolean;
  created_at: string;
  related_id?: number;
}

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [filteredNotifications, setFilteredNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"all" | "unread" | "read">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [typeDropdownOpen, setTypeDropdownOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [pageDropdownOpen, setPageDropdownOpen] = useState(false);
  const typeDropdownRef = useRef<HTMLDivElement>(null);
  const pageDropdownRef = useRef<HTMLDivElement>(null);
  const { showAlert, showConfirm } = useAlert();

  // Stats
  const stats = {
    total: notifications.length,
    unread: notifications.filter(n => !n.is_read).length,
    read: notifications.filter(n => n.is_read).length,
  };

  // Pagination
  const totalPages = Math.ceil(filteredNotifications.length / itemsPerPage);
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredNotifications.slice(indexOfFirstItem, indexOfLastItem);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (typeDropdownRef.current && !typeDropdownRef.current.contains(event.target as Node)) {
        setTypeDropdownOpen(false);
      }
      if (pageDropdownRef.current && !pageDropdownRef.current.contains(event.target as Node)) {
        setPageDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    fetchNotifications();
  }, []);

  useEffect(() => {
    // Filter notifications
    let filtered = notifications;

    // Filter by tab
    if (activeTab === "unread") {
      filtered = filtered.filter(n => !n.is_read);
    } else if (activeTab === "read") {
      filtered = filtered.filter(n => n.is_read);
    }

    // Filter by type
    if (typeFilter) {
      filtered = filtered.filter(n => n.type === typeFilter);
    }

    // Filter by search
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (n) =>
          n.title.toLowerCase().includes(query) ||
          n.message.toLowerCase().includes(query)
      );
    }

    setFilteredNotifications(filtered);
    setCurrentPage(1);
  }, [notifications, activeTab, typeFilter, searchQuery]);

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("notifications")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching notifications:", error);
      } else {
        setNotifications(data || []);
      }
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsRead = async (id: number) => {
    try {
      const { error } = await supabase
        .from("notifications")
        .update({ is_read: true })
        .eq("id", id);

      if (error) throw error;

      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
      );
      showAlert("success", "Berhasil", "Notifikasi ditandai sebagai dibaca");
    } catch (error) {
      console.error("Error marking as read:", error);
      showAlert("error", "Gagal", "Gagal menandai notifikasi sebagai dibaca");
    }
  };

  const handleDelete = async (id: number) => {
    const confirmed = await showConfirm(
      "Hapus Notifikasi",
      "Apakah Anda yakin ingin menghapus notifikasi ini?",
      "error",
      "Ya, Hapus"
    );
    if (!confirmed) return;

    try {
      const { error } = await supabase
        .from("notifications")
        .delete()
        .eq("id", id);

      if (error) throw error;

      setNotifications((prev) => prev.filter((n) => n.id !== id));
      showAlert("success", "Berhasil", "Notifikasi berhasil dihapus");
    } catch (error) {
      console.error("Error deleting notification:", error);
      showAlert("error", "Gagal", "Gagal menghapus notifikasi");
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "comment":
        return <ChatBubbleLeftIcon className="w-6 h-6 text-blue-500" />;
      case "discount":
        return <ReceiptPercentIcon className="w-6 h-6 text-green-500" />;
      case "order":
        return <FolderIcon className="w-6 h-6 text-purple-500" />;
      case "purchase":
        return <ShoppingBagIcon className="w-6 h-6 text-indigo-500" />;
      case "order_status":
        return <CheckCircleIcon className="w-6 h-6 text-teal-500" />;
      case "task":
        return <ExclamationTriangleIcon className="w-6 h-6 text-yellow-500" />;
      default:
        return <BellIcon className="w-6 h-6 text-gray-500" />;
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case "comment": return "Komentar";
      case "discount": return "Diskon";
      case "order": return "Pesanan";
      case "purchase": return "Pembelian";
      case "order_status": return "Status Pesanan";
      case "task": return "Tugas";
      default: return type;
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("id-ID", {
      day: "2-digit",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (loading) {
    return (
      <div className="fixed inset-0 z-50 flex justify-center items-center bg-white dark:bg-slate-900">
        <LogoPathAnimation />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 p-4 sm:p-6 lg:p-8 font-sans">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          {/* Left: Tabs */}
          <div className="hidden h-11 items-center gap-0.5 rounded-lg bg-gray-100 p-0.5 lg:inline-flex dark:bg-gray-900">
            <button
              onClick={() => setActiveTab("all")}
              className={`text-sm h-10 rounded-md px-3 py-2 font-medium transition-all ${activeTab === "all"
                ? "shadow-sm text-gray-900 dark:text-white bg-white dark:bg-gray-800"
                : "text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
                }`}
            >
              Semua ({stats.total})
            </button>
            <button
              onClick={() => setActiveTab("unread")}
              className={`text-sm h-10 rounded-md px-3 py-2 font-medium transition-all ${activeTab === "unread"
                ? "shadow-sm text-gray-900 dark:text-white bg-white dark:bg-gray-800"
                : "text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
                }`}
            >
              Belum Dibaca ({stats.unread})
            </button>
            <button
              onClick={() => setActiveTab("read")}
              className={`text-sm h-10 rounded-md px-3 py-2 font-medium transition-all ${activeTab === "read"
                ? "shadow-sm text-gray-900 dark:text-white bg-white dark:bg-gray-800"
                : "text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
                }`}
            >
              Dibaca ({stats.read})
            </button>
          </div>

          {/* Right: Search and Filters */}
          <div className="flex flex-col sm:flex-row gap-3">
            {/* Search */}
            <div className="relative">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Cari notifikasi..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 pr-4 py-3 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary w-full sm:w-48"
              />
            </div>

            {/* Type Filter Dropdown */}
            <div className="relative" ref={typeDropdownRef}>
              <button
                onClick={() => setTypeDropdownOpen(!typeDropdownOpen)}
                className="h-11 flex items-center gap-2 px-3 py-2 text-sm border border-gray-300 rounded-lg bg-white hover:bg-gray-50 focus:ring-2 focus:ring-primary focus:border-primary transition-all w-full sm:w-auto"
              >
                <BellIcon className="w-4 h-4 text-gray-400" />
                <span className="text-gray-700">
                  {typeFilter === "" ? "Semua Jenis" : getTypeLabel(typeFilter)}
                </span>
                <ChevronDownIcon className={`w-4 h-4 text-gray-400 transition-transform ${typeDropdownOpen ? "rotate-180" : ""}`} />
              </button>
              {typeDropdownOpen && (
                <div className="absolute top-full left-0 mt-1 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-20 animate-in fade-in slide-in-from-top-2 duration-150">
                  {[
                    { value: "", label: "Semua Jenis" },
                    { value: "comment", label: "Komentar" },
                    { value: "discount", label: "Diskon" },
                    { value: "order", label: "Pesanan" },
                    { value: "purchase", label: "Pembelian" },
                    { value: "order_status", label: "Status Pesanan" },
                    { value: "task", label: "Tugas" },
                  ].map((option) => (
                    <button
                      key={option.value}
                      onClick={() => {
                        setTypeFilter(option.value);
                        setTypeDropdownOpen(false);
                      }}
                      className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-100 first:rounded-t-lg last:rounded-b-lg transition-colors ${typeFilter === option.value
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
      </div>

      {/* Content */}
      {currentItems.length === 0 ? (
        <div className="text-center py-12 bg-white dark:bg-slate-800 rounded-xl border border-dashed border-gray-300 dark:border-gray-700">
          <BellIcon className="h-12 w-12 mx-auto text-gray-300 dark:text-gray-600 mb-3" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">
            {searchQuery
              ? "Tidak ada notifikasi yang ditemukan"
              : "Tidak ada notifikasi"}
          </h3>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            {searchQuery
              ? "Coba ubah kata kunci pencarian Anda."
              : "Belum ada notifikasi untuk ditampilkan."}
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {currentItems.map((notification) => (
            <div
              key={notification.id}
              className={`flex items-start gap-3 p-4 rounded-lg border transition-colors ${!notification.is_read
                  ? "bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800"
                  : "bg-white dark:bg-slate-700 border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-slate-600"
                }`}
            >
              {/* Icon */}
              <div className="flex-shrink-0 mt-0.5">
                {getNotificationIcon(notification.type)}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <p className="text-sm font-medium text-gray-900 dark:text-white flex items-center gap-2">
                    {notification.title}
                    {!notification.is_read && (
                      <span className="inline-block h-2 w-2 rounded-full bg-blue-600 flex-shrink-0"></span>
                    )}
                  </p>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                  {notification.message}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center mt-2">
                  <ClockIcon className="w-3 h-3 mr-1" />
                  {formatDate(notification.created_at)}
                </p>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-1 flex-shrink-0">
                {notification.link && (
                  <a
                    href={notification.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 text-gray-400 hover:text-blue-500 hover:bg-blue-50 rounded-lg transition"
                    title="Lihat Detail"
                  >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                  </a>
                )}
                {!notification.is_read && (
                  <button
                    onClick={() => handleMarkAsRead(notification.id)}
                    className="p-2 text-gray-400 hover:text-green-500 hover:bg-green-50 rounded-lg transition"
                    title="Tandai Dibaca"
                  >
                    <CheckCircleSolid className="w-5 h-5" />
                  </button>
                )}
                <button
                  onClick={() => handleDelete(notification.id)}
                  className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition"
                  title="Hapus"
                >
                  <TrashIcon className="w-5 h-5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {filteredNotifications.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4 p-4 mt-6">
          <nav aria-label="Page navigation" className="flex items-center space-x-4">
            <ul className="flex -space-x-px text-sm gap-2">
              <li>
                <button
                  onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                  className="flex items-center justify-center text-body bg-neutral-secondary-medium border border-default-medium hover:bg-neutral-tertiary-medium hover:text-heading shadow-xs font-medium leading-5 rounded-s-base text-sm px-3 h-9 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed rounded-lg"
                >
                  Sebelumnya
                </button>
              </li>
              {Array.from({ length: totalPages }, (_, i) => i + 1)
                .filter(
                  (p) =>
                    p === 1 ||
                    p === totalPages ||
                    (p >= currentPage - 1 && p <= currentPage + 1)
                )
                .map((page, idx) => (
                  <li key={idx}>
                    <button
                      onClick={() => setCurrentPage(page)}
                      className={`flex items-center justify-center border shadow-xs font-medium leading-5 text-sm w-9 h-9 focus:outline-none rounded-lg ${currentPage === page
                        ? "text-fg-brand bg-neutral-tertiary-medium border-default-medium"
                        : "text-body bg-neutral-secondary-medium border-default-medium hover:bg-neutral-tertiary-medium hover:text-heading"
                        }`}
                    >
                      {page}
                    </button>
                  </li>
                ))}
              <li>
                <button
                  onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages || totalPages === 0}
                  className="flex items-center justify-center text-body bg-neutral-secondary-medium border border-default-medium hover:bg-neutral-tertiary-medium hover:text-heading shadow-xs font-medium leading-5 rounded-e-base text-sm px-3 h-9 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed rounded-lg"
                >
                  Selanjutnya
                </button>
              </li>
            </ul>
          </nav>

          {/* Items Per Page */}
          <div className="hidden sm:inline relative" ref={pageDropdownRef}>
            <button
              onClick={() => setPageDropdownOpen(!pageDropdownOpen)}
              className="h-9 flex items-center gap-2 px-3 py-2 text-sm border border-gray-300 rounded-lg bg-white hover:bg-gray-50 focus:ring-2 focus:ring-primary focus:border-primary transition-all dark:bg-gray-800 dark:border-gray-700 dark:hover:bg-gray-700"
            >
              <span className="text-gray-700 dark:text-gray-300">{itemsPerPage} halaman</span>
              <ChevronDownIcon className={`w-4 h-4 text-gray-400 transition-transform ${pageDropdownOpen ? "rotate-180" : ""}`} />
            </button>
            {pageDropdownOpen && (
              <div className="absolute bottom-full left-0 mb-1 w-32 bg-white border border-gray-200 rounded-lg shadow-lg z-20 dark:bg-gray-800 dark:border-gray-700 animate-in fade-in slide-in-from-bottom-2 duration-150">
                {[10, 25, 50, 100].map((value) => (
                  <button
                    key={value}
                    onClick={() => {
                      setItemsPerPage(value);
                      setPageDropdownOpen(false);
                      setCurrentPage(1);
                    }}
                    className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 first:rounded-t-lg last:rounded-b-lg transition-colors ${itemsPerPage === value
                      ? "bg-primary/10 text-primary font-medium"
                      : "text-gray-700 dark:text-gray-300"
                      }`}
                  >
                    {value} halaman
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
