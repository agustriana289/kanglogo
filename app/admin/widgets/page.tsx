// app/admin/widgets/page.tsx
"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import Link from "next/link";
import Toast from "@/components/Toast";
import { useToast } from "@/hooks/useToast";
import LogoLoading from "@/components/LogoLoading";
import {
  PlusIcon,
  PencilIcon,
  TrashIcon,
  RectangleGroupIcon,
  MapPinIcon,
  CalendarIcon,
} from "@heroicons/react/24/outline";

interface Widget {
  id: number;
  title: string;
  content: string;
  position: string;
  created_at: string;
}

export default function WidgetsManagementPage() {
  const [widgets, setWidgets] = useState<Widget[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const { toast, showToast, hideToast } = useToast();

  useEffect(() => {
    fetchWidgets();
  }, []);

  const fetchWidgets = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("widgets")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching widgets:", error);
        showToast("Gagal memuat widget", "error");
      } else {
        setWidgets(data || []);
      }
    } catch (error) {
      console.error("Error fetching widgets:", error);
      showToast("Terjadi kesalahan saat memuat widget", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteWidget = async (id: number, title: string) => {
    if (!confirm(`Apakah Anda yakin ingin menghapus widget "${title}"?`))
      return;

    setDeleting(true);
    try {
      const { error } = await supabase.from("widgets").delete().eq("id", id);

      if (error) {
        throw error;
      }

      setWidgets(widgets.filter((widget) => widget.id !== id));
      showToast("Widget berhasil dihapus!", "success");
    } catch (error) {
      console.error("Error deleting widget:", error);
      showToast("Gagal menghapus widget!", "error");
    } finally {
      setDeleting(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("id-ID", {
      year: "numeric",
      month: "long",
      day: "numeric",
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
        {/* Header Section */}
        <div className="mb-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <Link
              href="/admin/widgets/new"
              className="inline-flex items-center px-4 py-2 bg-primary text-white font-medium rounded-lg shadow-sm hover:bg-primary/90 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
            >
              <PlusIcon className="h-5 w-5 mr-2" />
              Tambah Widget
            </Link>
          </div>
        </div>

        {/* Desktop Table View */}
        <div className="hidden md:block overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-600">
            <thead className="bg-slate-50 dark:bg-slate-800">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-300 uppercase tracking-wider">
                  Judul
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-300 uppercase tracking-wider">
                  Posisi
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-300 uppercase tracking-wider">
                  Dibuat
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-300 uppercase tracking-wider">
                  Aksi
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-slate-700 divide-y divide-slate-200 dark:divide-slate-600">
              {widgets.map((widget) => (
                <tr
                  key={widget.id}
                  className="hover:bg-slate-50 dark:hover:bg-slate-800/50"
                >
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900 dark:text-white">
                    <div className="flex items-center">
                      <RectangleGroupIcon className="h-5 w-5 text-slate-400 mr-3" />
                      {widget.title}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 dark:text-slate-300">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400">
                      <MapPinIcon className="h-4 w-4 mr-1" />
                      {widget.position}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 dark:text-slate-300">
                    <div className="flex items-center">
                      <CalendarIcon className="h-4 w-4 mr-2 text-slate-400" />
                      {formatDate(widget.created_at)}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-2">
                      <Link
                        href={`/admin/widgets/${widget.id}/edit`}
                        className="inline-flex items-center px-3 py-1.5 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 rounded-md hover:bg-indigo-100 dark:hover:bg-indigo-900/30 transition-colors"
                      >
                        <PencilIcon className="h-4 w-4 mr-1" />
                        Edit
                      </Link>
                      <button
                        onClick={() =>
                          handleDeleteWidget(widget.id, widget.title)
                        }
                        className="inline-flex items-center px-3 py-1.5 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-md hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors"
                        disabled={deleting}
                      >
                        <TrashIcon className="h-4 w-4 mr-1" />
                        Hapus
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile Card View */}
        <div className="md:hidden space-y-4">
          {widgets.map((widget) => (
            <div
              key={widget.id}
              className="bg-white dark:bg-slate-800 rounded-lg shadow p-4 border border-slate-200 dark:border-slate-600"
            >
              <div className="flex justify-between items-start mb-3">
                <div className="flex items-start">
                  <RectangleGroupIcon className="h-5 w-5 text-slate-400 mr-3 mt-0.5" />
                  <div className="flex-1">
                    <h3 className="text-lg font-medium text-slate-900 dark:text-white">
                      {widget.title}
                    </h3>
                  </div>
                </div>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400">
                  <MapPinIcon className="h-4 w-4 mr-1" />
                  {widget.position}
                </span>
              </div>
              <div className="ml-8">
                <p className="text-sm text-slate-500 dark:text-slate-400 mb-3">
                  {widget.content.length > 100
                    ? `${widget.content.substring(0, 100)}...`
                    : widget.content}
                </p>
                <div className="flex items-center text-xs text-slate-500 dark:text-slate-400 mb-3">
                  <CalendarIcon className="h-4 w-4 mr-1" />
                  {formatDate(widget.created_at)}
                </div>
                <div className="flex justify-end space-x-2">
                  <Link
                    href={`/admin/widgets/${widget.id}/edit`}
                    className="inline-flex items-center px-3 py-1.5 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 rounded-md hover:bg-indigo-100 dark:hover:bg-indigo-900/30 transition-colors"
                  >
                    <PencilIcon className="h-4 w-4 mr-1" />
                    Edit
                  </Link>
                  <button
                    onClick={() => handleDeleteWidget(widget.id, widget.title)}
                    className="inline-flex items-center px-3 py-1.5 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-md hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors"
                    disabled={deleting}
                  >
                    <TrashIcon className="h-4 w-4 mr-1" />
                    Hapus
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Empty State */}
        {widgets.length === 0 && (
          <div className="text-center py-12">
            <RectangleGroupIcon className="mx-auto h-12 w-12 text-slate-400" />
            <h3 className="mt-2 text-sm font-medium text-slate-900 dark:text-white">
              Tidak ada widget
            </h3>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              Belum ada widget yang dibuat.
            </p>
            <div className="mt-6">
              <Link
                href="/admin/widgets/new"
                className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary hover:bg-primary/80 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
              >
                <PlusIcon className="-ml-1 mr-2 h-5 w-5" />
                Tambah Widget Baru
              </Link>
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
