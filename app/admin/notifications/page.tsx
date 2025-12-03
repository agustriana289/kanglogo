"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import LogoLoading from "@/components/LogoLoading";
import {
  BellIcon,
  CheckCircleIcon,
  TrashIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  ChatBubbleLeftIcon,
  ReceiptPercentIcon,
  FolderIcon,
} from "@heroicons/react/24/outline";
import { CheckCircleIcon as CheckCircleSolid } from "@heroicons/react/24/solid";

// Tipe untuk notifikasi
interface Notification {
  id: number;
  type: "comment" | "discount" | "order" | "task" | "order_status";
  title: string;
  message: string;
  link: string;
  is_read: boolean;
  created_at: string;
  related_id?: number;
}

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedNotifications, setSelectedNotifications] = useState<number[]>(
    []
  );
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    fetchNotifications();
  }, []);

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

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedNotifications(notifications.map((n) => n.id));
    } else {
      setSelectedNotifications([]);
    }
  };

  const handleSelectOne = (id: number) => {
    setSelectedNotifications((prev) =>
      prev.includes(id) ? prev.filter((nId) => nId !== id) : [...prev, id]
    );
  };

  const handleMarkAsRead = async (ids: number[]) => {
    setActionLoading(true);
    try {
      const { error } = await supabase
        .from("notifications")
        .update({ is_read: true })
        .in("id", ids);

      if (error) throw error;

      setNotifications((prev) =>
        prev.map((n) => (ids.includes(n.id) ? { ...n, is_read: true } : n))
      );
      setSelectedNotifications([]);
    } catch (error) {
      console.error("Error marking as read:", error);
      alert("Gagal menandai notifikasi sebagai dibaca.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async (ids: number[]) => {
    if (
      !confirm(`Apakah Anda yakin ingin menghapus ${ids.length} notifikasi?`)
    ) {
      return;
    }

    setActionLoading(true);
    try {
      const { error } = await supabase
        .from("notifications")
        .delete()
        .in("id", ids);

      if (error) throw error;

      setNotifications((prev) => prev.filter((n) => !ids.includes(n.id)));
      setSelectedNotifications([]);
    } catch (error) {
      console.error("Error deleting notifications:", error);
      alert("Gagal menghapus notifikasi.");
    } finally {
      setActionLoading(false);
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
      case "order_status":
        return <CheckCircleIcon className="w-6 h-6 text-indigo-500" />;
      case "task":
        return <ExclamationTriangleIcon className="w-6 h-6 text-yellow-500" />;
      default:
        return <BellIcon className="w-6 h-6 text-gray-500" />;
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
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Semua Notifikasi
          </h1>
          {selectedNotifications.length > 0 && (
            <div className="flex gap-2">
              <button
                onClick={() => handleMarkAsRead(selectedNotifications)}
                disabled={actionLoading}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 transition-colors"
              >
                Tandai Dibaca ({selectedNotifications.length})
              </button>
              <button
                onClick={() => handleDelete(selectedNotifications)}
                disabled={actionLoading}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:bg-gray-400 transition-colors"
              >
                Hapus ({selectedNotifications.length})
              </button>
            </div>
          )}
        </div>

        {notifications.length === 0 ? (
          <p className="text-center text-gray-500 dark:text-gray-400 py-12">
            Tidak ada notifikasi.
          </p>
        ) : (
          <div className="space-y-2">
            <div className="flex items-center p-2 border-b border-gray-200 dark:border-gray-600">
              <input
                type="checkbox"
                className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                checked={
                  selectedNotifications.length === notifications.length &&
                  notifications.length > 0
                }
                onChange={handleSelectAll}
              />
              <span className="ml-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                Pilih Semua
              </span>
            </div>
            {notifications.map((notification) => (
              <div
                key={notification.id}
                className={`flex items-start p-4 rounded-lg border transition-colors ${
                  !notification.is_read
                    ? "bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800"
                    : "bg-white dark:bg-slate-700 border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-slate-600"
                }`}
              >
                <input
                  type="checkbox"
                  className="mt-1 h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  checked={selectedNotifications.includes(notification.id)}
                  onChange={() => handleSelectOne(notification.id)}
                />
                <div className="ml-3 flex-shrink-0">
                  {getNotificationIcon(notification.type)}
                </div>
                <div className="ml-3 flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                      {notification.title}
                    </p>
                    {!notification.is_read && (
                      <span className="inline-block ml-2 h-2 w-2 rounded-full bg-blue-600"></span>
                    )}
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                    {notification.message}
                  </p>
                  <div className="flex items-center justify-between mt-2">
                    <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center">
                      <ClockIcon className="w-3 h-3 mr-1" />
                      {formatDate(notification.created_at)}
                    </p>
                    <a
                      href={notification.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 font-medium"
                    >
                      Lihat Detail
                    </a>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
