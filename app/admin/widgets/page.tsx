// app/admin/widgets/page.tsx
"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import { supabase } from "@/lib/supabase";
import Link from "next/link";
import { useAlert } from "@/components/providers/AlertProvider";
import LogoPathAnimation from "@/components/LogoPathAnimation";
import {
  PlusIcon,
  PencilIcon,
  TrashIcon,
  RectangleGroupIcon,
  MapPinIcon,
  CalendarIcon,
  MagnifyingGlassIcon,
  ChevronDownIcon,
} from "@heroicons/react/24/outline";
import { CheckCircleIcon } from "@heroicons/react/24/solid";

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
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const { showAlert, showConfirm } = useAlert();

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [positionFilter, setPositionFilter] = useState("all");
  const [positionDropdownOpen, setPositionDropdownOpen] = useState(false);
  const positionDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    document.title = "Widget - Kanglogo";
    fetchWidgets();
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    if (!positionDropdownOpen) return;
    const handleClickOutside = (event: MouseEvent) => {
      if (positionDropdownRef.current && !positionDropdownRef.current.contains(event.target as Node)) {
        setPositionDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [positionDropdownOpen]);

  const fetchWidgets = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("widgets")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching widgets:", error);
        showAlert("error", "Error", "Gagal memuat widget");
      } else {
        setWidgets(data || []);
      }
    } catch (error) {
      console.error("Error fetching widgets:", error);
      showAlert("error", "Error", "Terjadi kesalahan saat memuat widget");
    } finally {
      setLoading(false);
    }
  };

  const formatPosition = (pos: string) => {
    if (!pos) return "-";
    // Example: Blog_footer -> Footer Blog
    const parts = pos.split('_');
    if (parts.length === 2) {
      // Capitalize each part and swap
      const p1 = parts[0].charAt(0).toUpperCase() + parts[0].slice(1);
      const p2 = parts[1].charAt(0).toUpperCase() + parts[1].slice(1);
      return `${p2} ${p1}`; // Generic swap: Footer Blog
    }
    // Fallback: replace underscores with spaces and capitalize
    return pos.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  // Get unique positions for filter
  const uniquePositions = useMemo(() => {
    const positions = new Set(widgets.map(w => w.position));
    return Array.from(positions).sort();
  }, [widgets]);

  const filteredWidgets = useMemo(() => {
    let result = widgets;

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (w) =>
          w.title.toLowerCase().includes(query) ||
          w.content.toLowerCase().includes(query) ||
          w.position.toLowerCase().includes(query)
      );
    }

    // Position filter
    if (positionFilter !== "all") {
      result = result.filter((w) => w.position === positionFilter);
    }

    return result;
  }, [widgets, searchQuery, positionFilter]);

  const handleDeleteWidget = async (id: number, title: string) => {
    const confirmed = await showConfirm(
      "Hapus Widget",
      `Apakah Anda yakin ingin menghapus widget "${title}"?`,
      "error",
      "Ya, Hapus"
    );

    if (!confirmed) return;

    setDeleting(true);
    try {
      const { error } = await supabase.from("widgets").delete().eq("id", id);

      if (error) {
        throw error;
      }

      setWidgets(widgets.filter((widget) => widget.id !== id));
      setSelectedIds(selectedIds.filter((sid) => sid !== id));
      showAlert("success", "Berhasil", "Widget berhasil dihapus!");
    } catch (error) {
      console.error("Error deleting widget:", error);
      showAlert("error", "Gagal", "Gagal menghapus widget!");
    } finally {
      setDeleting(false);
    }
  };

  const handleBatchDelete = async () => {
    if (selectedIds.length === 0) return;

    const confirmed = await showConfirm(
      "Hapus Widget",
      `Apakah Anda yakin ingin menghapus ${selectedIds.length} widget?`,
      "error",
      "Ya, Hapus Semua"
    );
    if (!confirmed) return;

    setDeleting(true);
    try {
      const { error } = await supabase
        .from("widgets")
        .delete()
        .in("id", selectedIds);

      if (error) throw error;

      setWidgets(widgets.filter((w) => !selectedIds.includes(w.id)));
      setSelectedIds([]);
      showAlert("success", "Berhasil", `${selectedIds.length} widget berhasil dihapus!`);
    } catch (error) {
      console.error("Error batch deleting:", error);
      showAlert("error", "Gagal", "Gagal menghapus widget!");
    } finally {
      setDeleting(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("id-ID", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === filteredWidgets.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredWidgets.map((w) => w.id));
    }
  };

  const toggleSelect = (id: number) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter((sid) => sid !== id));
    } else {
      setSelectedIds([...selectedIds, id]);
    }
  };

  // Custom checkbox component with Heroicons
  const CustomCheckbox = ({ checked, onChange, variant = "default" }: { checked: boolean; onChange: () => void; variant?: "default" | "header" }) => (
    <button
      onClick={onChange}
      className={`flex items-center justify-center w-5 h-5 rounded transition-colors ${checked
        ? variant === "header"
          ? "text-white"
          : "text-primary"
        : variant === "header"
          ? "text-white/50 hover:text-white/80"
          : "text-gray-300 hover:text-gray-400"
        }`}
    >
      {checked ? (
        <CheckCircleIcon className="w-5 h-5" />
      ) : (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <circle cx="12" cy="12" r="9" />
        </svg>
      )}
    </button>
  );

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
          {/* Search */}
          <div className="relative">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Cari widget..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary w-full sm:w-64"
            />
          </div>

          <div className="flex flex-col sm:flex-row gap-3">

            {/* Position Filter */}
            <div className="relative" ref={positionDropdownRef}>
              <button
                onClick={() => setPositionDropdownOpen(!positionDropdownOpen)}
                className="h-full w-full sm:w-auto flex items-center justify-between gap-2 px-3 py-2 text-sm border border-gray-300 rounded-lg bg-white hover:bg-gray-50 focus:ring-2 focus:ring-primary focus:border-primary transition-all dark:bg-gray-800 dark:border-gray-700 dark:hover:bg-gray-700"
              >
                <MapPinIcon className="w-4 h-4 text-gray-400" />
                <span className="text-gray-700 dark:text-gray-300 whitespace-nowrap">
                  {positionFilter === "all" ? "Semua Posisi" : formatPosition(positionFilter)}
                </span>
                <ChevronDownIcon className={`w-4 h-4 text-gray-400 transition-transform ${positionDropdownOpen ? "rotate-180" : ""}`} />
              </button>

              {positionDropdownOpen && (
                <div className="absolute right-0 top-full mt-1 w-56 bg-white border border-gray-200 rounded-lg shadow-lg z-20 dark:bg-gray-800 dark:border-gray-700 animate-in fade-in slide-in-from-top-2 duration-150">
                  <button
                    onClick={() => {
                      setPositionFilter("all");
                      setPositionDropdownOpen(false);
                    }}
                    className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 first:rounded-t-lg transition-colors ${positionFilter === "all"
                      ? "bg-primary/10 text-primary font-medium"
                      : "text-gray-700 dark:text-gray-300"
                      }`}
                  >
                    Semua Posisi
                  </button>
                  {uniquePositions.map((pos) => (
                    <button
                      key={pos}
                      onClick={() => {
                        setPositionFilter(pos);
                        setPositionDropdownOpen(false);
                      }}
                      className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 last:rounded-b-lg transition-colors ${positionFilter === pos
                        ? "bg-primary/10 text-primary font-medium"
                        : "text-gray-700 dark:text-gray-300"
                        }`}
                    >
                      {formatPosition(pos)}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <Link
              href="/admin/widgets/new"
              className="inline-flex items-center justify-center px-4 py-2 bg-primary text-white font-medium rounded-lg shadow-sm hover:bg-primary/90 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary whitespace-nowrap"
            >
              <PlusIcon className="h-5 w-5 mr-2" />
              Tambah
            </Link>
          </div>
        </div>
      </div>

      {/* Batch Action Toolbar */}
      {selectedIds.length > 0 && (
        <div className="bg-white shadow-sm rounded-lg p-3 mb-4 flex items-center justify-between">
          <span className="hidden sm:inline font-medium text-primary">
            {selectedIds.length} widget dipilih
          </span>
          <div className="flex gap-2">
            <button
              onClick={handleBatchDelete}
              disabled={deleting}
              className="px-3 py-1.5 text-sm font-medium bg-red-500 text-white rounded-lg hover:bg-red-600 transition flex items-center gap-1 disabled:opacity-50"
            >
              <TrashIcon className="w-4 h-4" />
              Hapus Terpilih
            </button>
          </div>
        </div>
      )}

      {/* Content */}
      {filteredWidgets.length === 0 ? (
        <div className="text-center py-12 bg-white dark:bg-slate-800 rounded-xl border border-dashed border-gray-300 dark:border-gray-700">
          <RectangleGroupIcon className="h-12 w-12 mx-auto text-gray-300 dark:text-gray-600 mb-3" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">
            Tidak ada widget ditemukan
          </h3>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            {widgets.length === 0 ? "Belum ada widget yang dibuat." : "Coba ubah filter pencarian Anda."}
          </p>
          {widgets.length === 0 && (
            <div className="mt-6">
              <Link
                href="/admin/widgets/new"
                className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary hover:bg-primary/80 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
              >
                <PlusIcon className="-ml-1 mr-2 h-5 w-5" />
                Tambah Widget Baru
              </Link>
            </div>
          )}
        </div>
      ) : (
        <>
          {/* Desktop Table */}
          <div className="hidden md:block bg-white rounded-lg shadow-sm border border-slate-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-primary text-white font-medium">
                  <tr>
                    <th className="px-6 py-4 rounded-tl-lg">
                      <CustomCheckbox
                        checked={selectedIds.length === filteredWidgets.length && filteredWidgets.length > 0}
                        onChange={toggleSelectAll}
                        variant="header"
                      />
                    </th>
                    <th className="px-6 py-4">Judul</th>
                    <th className="px-6 py-4">Posisi</th>
                    <th className="px-6 py-4">Dibuat</th>
                    <th className="px-6 py-4 text-right rounded-tr-lg">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                  {filteredWidgets.map((widget) => (
                    <tr
                      key={widget.id}
                      className={`hover:bg-gray-50 dark:hover:bg-slate-800/50 transition ${selectedIds.includes(widget.id) ? "bg-primary/5" : ""
                        }`}
                    >
                      <td className="px-6 py-4">
                        <CustomCheckbox
                          checked={selectedIds.includes(widget.id)}
                          onChange={() => toggleSelect(widget.id)}
                        />
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center">
                          <RectangleGroupIcon className="h-5 w-5 text-slate-400 mr-3" />
                          <span className="font-medium text-gray-900 dark:text-white">{widget.title}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400">
                          <MapPinIcon className="h-4 w-4 mr-1" />
                          {formatPosition(widget.position)}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-gray-500 dark:text-gray-400">
                        <div className="flex items-center">
                          <CalendarIcon className="h-4 w-4 mr-2 text-slate-400" />
                          {formatDate(widget.created_at)}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-end gap-2">
                          <Link
                            href={`/admin/widgets/${widget.id}/edit`}
                            className="p-2 text-gray-400 hover:text-primary hover:bg-primary/10 rounded-lg transition"
                            title="Edit"
                          >
                            <PencilIcon className="w-5 h-5" />
                          </Link>
                          <button
                            onClick={() => handleDeleteWidget(widget.id, widget.title)}
                            className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition"
                            disabled={deleting}
                            title="Hapus"
                          >
                            <TrashIcon className="w-5 h-5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Mobile Cards */}
          <div className="md:hidden space-y-3">
            {filteredWidgets.map((widget) => (
              <div
                key={widget.id}
                className={`bg-white rounded-xl shadow-sm border p-4 ${selectedIds.includes(widget.id)
                  ? "border-primary bg-primary/5"
                  : "border-slate-100"
                  }`}
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <RectangleGroupIcon className="h-5 w-5 text-slate-400" />
                    <span className="font-semibold text-gray-900">{widget.title}</span>
                  </div>
                  <CustomCheckbox
                    checked={selectedIds.includes(widget.id)}
                    onChange={() => toggleSelect(widget.id)}
                  />
                </div>

                <div className="mb-3">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    <MapPinIcon className="h-4 w-4 mr-1" />
                    {formatPosition(widget.position)}
                  </span>
                </div>

                <p className="text-sm text-gray-600 line-clamp-2 mb-3">
                  {widget.content.length > 100
                    ? `${widget.content.substring(0, 100)}...`
                    : widget.content}
                </p>

                <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                  <div>
                    <p className="text-xs text-gray-400 uppercase">Dibuat</p>
                    <p className="text-sm text-gray-700 flex items-center">
                      <CalendarIcon className="h-4 w-4 mr-1 text-slate-400" />
                      {formatDate(widget.created_at)}
                    </p>
                  </div>
                  <div className="flex gap-1">
                    <Link
                      href={`/admin/widgets/${widget.id}/edit`}
                      className="p-2 text-gray-400 hover:text-primary hover:bg-primary/10 rounded-lg transition"
                    >
                      <PencilIcon className="w-5 h-5" />
                    </Link>
                    <button
                      onClick={() => handleDeleteWidget(widget.id, widget.title)}
                      className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition"
                      disabled={deleting}
                    >
                      <TrashIcon className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
