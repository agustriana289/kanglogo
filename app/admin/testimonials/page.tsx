"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import { supabase } from "@/lib/supabase";
import { useAlert } from "@/components/providers/AlertProvider";
import { Testimonial, getAverageRating } from "@/types/testimonial";
import LogoPathAnimation from "@/components/LogoPathAnimation";
import {
  TrashIcon,
  ClipboardDocumentIcon,
  CheckIcon,
  SparklesIcon,
  MagnifyingGlassIcon,
  ChatBubbleLeftEllipsisIcon,
  ChevronDownIcon,
  CalendarIcon,
} from "@heroicons/react/24/outline";
import { StarIcon as StarIconSolid, CheckCircleIcon } from "@heroicons/react/24/solid";

type FilterTab = "all" | "service" | "store";

export default function TestimonialManagementPage() {
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<FilterTab>("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [copiedId, setCopiedId] = useState<number | null>(null);
  const { showAlert, showConfirm } = useAlert();

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [starFilter, setStarFilter] = useState<number | "all">("all");
  const [dateFilter, setDateFilter] = useState("");

  // Selection
  const [selectedIds, setSelectedIds] = useState<number[]>([]);

  // Dropdown states
  const [starDropdownOpen, setStarDropdownOpen] = useState(false);
  const [pageDropdownOpen, setPageDropdownOpen] = useState(false);
  const [dateDropdownOpen, setDateDropdownOpen] = useState(false);

  // Refs for click outside detection
  const starDropdownRef = useRef<HTMLDivElement>(null);
  const dateDropdownRef = useRef<HTMLDivElement>(null);
  const pageDropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdowns when clicking outside - only active when a dropdown is open
  useEffect(() => {
    if (!starDropdownOpen && !dateDropdownOpen && !pageDropdownOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (starDropdownOpen && starDropdownRef.current && !starDropdownRef.current.contains(event.target as Node)) {
        setStarDropdownOpen(false);
      }
      if (dateDropdownOpen && dateDropdownRef.current && !dateDropdownRef.current.contains(event.target as Node)) {
        setDateDropdownOpen(false);
      }
      if (pageDropdownOpen && pageDropdownRef.current && !pageDropdownRef.current.contains(event.target as Node)) {
        setPageDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [starDropdownOpen, dateDropdownOpen, pageDropdownOpen]);

  // Stats
  const [stats, setStats] = useState({
    total: 0,
    fromService: 0,
    fromStore: 0,
  });

  // Filtered testimonials
  const filteredTestimonials = useMemo(() => {
    let filtered = testimonials;

    // Tab filter
    if (activeTab === "service") {
      filtered = filtered.filter((t) => t.order_id !== null);
    } else if (activeTab === "store") {
      filtered = filtered.filter((t) => t.store_order_id !== null);
    }

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (t) =>
          t.customer_name?.toLowerCase().includes(query) ||
          t.customer_email?.toLowerCase().includes(query) ||
          t.review_text?.toLowerCase().includes(query)
      );
    }

    // Star filter
    if (starFilter !== "all") {
      filtered = filtered.filter((t) => {
        const avg = Math.round(getAverageRating(t));
        return avg === starFilter;
      });
    }

    // Date filter
    if (dateFilter) {
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

      filtered = filtered.filter((t) => {
        const testimonialDate = t.submitted_at || t.created_at;
        if (!testimonialDate) return false;
        const tDate = new Date(testimonialDate);

        switch (dateFilter) {
          case "today":
            return tDate >= today;
          case "7days":
            const sevenDaysAgo = new Date(today);
            sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
            return tDate >= sevenDaysAgo;
          case "30days":
            const thirtyDaysAgo = new Date(today);
            thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
            return tDate >= thirtyDaysAgo;
          case "thisMonth":
            return tDate.getMonth() === now.getMonth() && tDate.getFullYear() === now.getFullYear();
          default:
            return true;
        }
      });
    }

    return filtered;
  }, [testimonials, activeTab, searchQuery, starFilter, dateFilter]);

  const totalPages = Math.ceil(filteredTestimonials.length / itemsPerPage);
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredTestimonials.slice(indexOfFirstItem, indexOfLastItem);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
    setSelectedIds([]);
  }, [activeTab, searchQuery, starFilter, dateFilter, itemsPerPage]);

  useEffect(() => {
    fetchTestimonials();
  }, []);

  const fetchTestimonials = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("testimonials")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;

      const all = data || [];
      setTestimonials(all);

      // Calculate stats
      setStats({
        total: all.length,
        fromService: all.filter((t) => t.order_id !== null).length,
        fromStore: all.filter((t) => t.store_order_id !== null).length,
      });
    } catch (error) {
      console.error("Error fetching testimonials:", error);
      showAlert("error", "Error", "Gagal memuat testimoni!");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    const confirmed = await showConfirm(
      "Hapus Testimoni",
      "Apakah Anda yakin ingin menghapus testimoni ini?",
      "error",
      "Ya, Hapus"
    );
    if (!confirmed) return;

    try {
      const { error } = await supabase.from("testimonials").delete().eq("id", id);
      if (error) throw error;

      setTestimonials(testimonials.filter((t) => t.id !== id));
      setSelectedIds(selectedIds.filter((sid) => sid !== id));
      showAlert("success", "Berhasil", "Testimoni berhasil dihapus!");
    } catch (error) {
      console.error("Error deleting testimonial:", error);
      showAlert("error", "Gagal", "Gagal menghapus testimoni!");
    }
  };

  const handleBatchDelete = async () => {
    if (selectedIds.length === 0) return;

    const confirmed = await showConfirm(
      "Hapus Testimoni",
      `Apakah Anda yakin ingin menghapus ${selectedIds.length} testimoni?`,
      "error",
      "Ya, Hapus Semua"
    );
    if (!confirmed) return;

    try {
      const { error } = await supabase
        .from("testimonials")
        .delete()
        .in("id", selectedIds);

      if (error) throw error;

      setTestimonials(testimonials.filter((t) => !selectedIds.includes(t.id)));
      setSelectedIds([]);
      showAlert("success", "Berhasil", `${selectedIds.length} testimoni berhasil dihapus!`);
    } catch (error) {
      console.error("Error batch deleting:", error);
      showAlert("error", "Gagal", "Gagal menghapus testimoni!");
    }
  };

  const handleBatchFeatured = async () => {
    if (selectedIds.length === 0) return;

    try {
      const { error } = await supabase
        .from("testimonials")
        .update({ is_featured: true })
        .in("id", selectedIds);

      if (error) throw error;

      setTestimonials(
        testimonials.map((t) =>
          selectedIds.includes(t.id) ? { ...t, is_featured: true } : t
        )
      );
      setSelectedIds([]);
      showAlert("success", "Berhasil", `${selectedIds.length} testimoni dijadikan unggulan!`);
    } catch (error) {
      console.error("Error batch featuring:", error);
      showAlert("error", "Gagal", "Gagal mengubah status unggulan!");
    }
  };

  const toggleFeatured = async (id: number, currentValue: boolean) => {
    try {
      const { error } = await supabase
        .from("testimonials")
        .update({ is_featured: !currentValue })
        .eq("id", id);

      if (error) throw error;

      setTestimonials(
        testimonials.map((t) =>
          t.id === id ? { ...t, is_featured: !currentValue } : t
        )
      );
      showAlert(
        "success",
        "Berhasil",
        !currentValue ? "Testimoni dijadikan unggulan!" : "Testimoni tidak lagi unggulan."
      );
    } catch (error) {
      console.error("Error toggling featured:", error);
      showAlert("error", "Gagal", "Gagal mengubah status unggulan!");
    }
  };

  const copyTestimonialLink = async (token: string, id: number) => {
    const link = `${window.location.origin}/testimoni/${token}`;
    try {
      await navigator.clipboard.writeText(link);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch (err) {
      showAlert("error", "Gagal", "Gagal menyalin link!");
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "-";
    return new Date(dateString).toLocaleDateString("id-ID", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === currentItems.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(currentItems.map((t) => t.id));
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

  // Star display component
  const StarDisplay = ({ rating }: { rating: number }) => (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <StarIconSolid
          key={star}
          className={`w-4 h-4 ${star <= rating ? "text-yellow-400" : "text-gray-200"}`}
        />
      ))}
    </div>
  );

  const tabs: { key: FilterTab; label: string; count: number }[] = [
    { key: "all", label: "Semua", count: stats.total },
    { key: "service", label: "Layanan", count: stats.fromService },
    { key: "store", label: "Toko", count: stats.fromStore },
  ];

  // Generate page numbers
  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    const maxVisible = 5;

    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      if (currentPage <= 3) {
        for (let i = 1; i <= 4; i++) pages.push(i);
        pages.push("...");
        pages.push(totalPages);
      } else if (currentPage >= totalPages - 2) {
        pages.push(1);
        pages.push("...");
        for (let i = totalPages - 3; i <= totalPages; i++) pages.push(i);
      } else {
        pages.push(1);
        pages.push("...");
        for (let i = currentPage - 1; i <= currentPage + 1; i++) pages.push(i);
        pages.push("...");
        pages.push(totalPages);
      }
    }

    return pages;
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
            {tabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`text-sm h-10 rounded-md px-3 py-2 font-medium transition-all ${activeTab === tab.key
                  ? "shadow-sm text-gray-900 dark:text-white bg-white dark:bg-gray-800"
                  : "text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
                  }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Right: Filters */}
          <div className="flex flex-col sm:flex-row gap-3">
            {/* Search */}
            <div className="relative">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Cari testimoni..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 pr-4 py-3 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary w-full sm:w-48"
              />
            </div>
            <div className="flex flex-row gap-3">
              {/* Star Filter - Custom Dropdown */}
              <div className="relative" ref={starDropdownRef}>
                <button
                  onClick={() => setStarDropdownOpen(!starDropdownOpen)}
                  className="h-11 flex items-center gap-2 px-3 py-2 text-sm border border-gray-300 rounded-lg bg-white hover:bg-gray-50 focus:ring-2 focus:ring-primary focus:border-primary transition-all dark:bg-gray-800 dark:border-gray-700 dark:hover:bg-gray-700"
                >
                  <StarIconSolid className="w-4 h-4 text-yellow-400" />
                  <span className="text-gray-700 dark:text-gray-300">
                    {starFilter === "all" ? "Semua Bintang" : `${starFilter} Bintang`}
                  </span>
                  <ChevronDownIcon className={`w-4 h-4 text-gray-400 transition-transform ${starDropdownOpen ? "rotate-180" : ""}`} />
                </button>
                {starDropdownOpen && (
                  <div className="absolute top-full left-0 mt-1 w-40 bg-white border border-gray-200 rounded-lg shadow-lg z-20 dark:bg-gray-800 dark:border-gray-700 animate-in fade-in slide-in-from-top-2 duration-150">
                    {[
                      { value: "all", label: "Semua Bintang" },
                      { value: 5, label: "5 Bintang" },
                      { value: 4, label: "4 Bintang" },
                      { value: 3, label: "3 Bintang" },
                      { value: 2, label: "2 Bintang" },
                      { value: 1, label: "1 Bintang" },
                    ].map((option) => (
                      <button
                        key={option.value}
                        onClick={() => {
                          setStarFilter(option.value as number | "all");
                          setStarDropdownOpen(false);
                        }}
                        className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2 first:rounded-t-lg last:rounded-b-lg transition-colors ${starFilter === option.value
                          ? "bg-primary/10 text-primary font-medium"
                          : "text-gray-700 dark:text-gray-300"
                          }`}
                      >
                        {option.value !== "all" && (
                          <div className="flex gap-0.5">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <StarIconSolid
                                key={star}
                                className={`w-5 h-5 ${star <= (option.value as number) ? "text-yellow-400" : "text-gray-200"}`}
                              />
                            ))}
                          </div>
                        )}
                        {option.value === "all" && <span>{option.label}</span>}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Date Filter - Custom Dropdown */}
              <div className="relative" ref={dateDropdownRef}>
                <button
                  onClick={() => setDateDropdownOpen(!dateDropdownOpen)}
                  className="h-11 flex items-center gap-2 px-3 py-2 text-sm border border-gray-300 rounded-lg bg-white hover:bg-gray-50 focus:ring-2 focus:ring-primary focus:border-primary transition-all dark:bg-gray-800 dark:border-gray-700 dark:hover:bg-gray-700"
                >
                  <CalendarIcon className="w-4 h-4 text-gray-400" />
                  <span className="text-gray-700 dark:text-gray-300">
                    {dateFilter === "" ? "Semua Tanggal" :
                      dateFilter === "today" ? "Hari ini" :
                        dateFilter === "7days" ? "7 hari terakhir" :
                          dateFilter === "30days" ? "30 hari terakhir" :
                            dateFilter === "thisMonth" ? "Bulan ini" : dateFilter}
                  </span>
                  <ChevronDownIcon className={`w-4 h-4 text-gray-400 transition-transform ${dateDropdownOpen ? "rotate-180" : ""}`} />
                </button>
                {dateDropdownOpen && (
                  <div className="absolute top-full left-0 mt-1 w-44 bg-white border border-gray-200 rounded-lg shadow-lg z-20 dark:bg-gray-800 dark:border-gray-700 animate-in fade-in slide-in-from-top-2 duration-150">
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
                        className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 first:rounded-t-lg last:rounded-b-lg transition-colors ${dateFilter === option.value
                          ? "bg-primary/10 text-primary font-medium"
                          : "text-gray-700 dark:text-gray-300"
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
      </div>

      {/* Batch Action Toolbar */}
      {selectedIds.length > 0 && (
        <div className="bg-white shadow-sm rounded-lg p-3 mb-4 flex items-center justify-between">
          <span className="hidden sm:inline font-medium text-primary">
            {selectedIds.length} testimoni dipilih
          </span>
          <div className="flex gap-2">
            <button
              onClick={handleBatchFeatured}
              className="px-3 py-1.5 text-sm font-medium bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition flex items-center gap-1"
            >
              <SparklesIcon className="w-4 h-4" />
              Jadikan Unggulan
            </button>
            <button
              onClick={handleBatchDelete}
              className="px-3 py-1.5 text-sm font-medium bg-red-500 text-white rounded-lg hover:bg-red-600 transition flex items-center gap-1"
            >
              <TrashIcon className="w-4 h-4" />
              Hapus Terpilih
            </button>
          </div>
        </div>
      )}

      {/* Content */}
      {currentItems.length === 0 ? (
        <div className="text-center py-12 bg-white dark:bg-slate-800 rounded-xl border border-dashed border-gray-300 dark:border-gray-700">
          <ChatBubbleLeftEllipsisIcon className="h-12 w-12 mx-auto text-gray-300 dark:text-gray-600 mb-3" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">
            Tidak ada testimoni
          </h3>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            Belum ada testimoni untuk filter ini.
          </p>
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
                        checked={selectedIds.length === currentItems.length && currentItems.length > 0}
                        onChange={toggleSelectAll}
                        variant="header"
                      />
                    </th>
                    <th className="px-6 py-4">Pelanggan</th>
                    <th className="px-6 py-4">Layanan/Produk</th>
                    <th className="px-6 py-4">Rating</th>
                    <th className="px-6 py-4 max-w-xs">Ulasan</th>
                    <th className="px-6 py-4">Tanggal</th>
                    <th className="px-6 py-4 text-right rounded-tr-lg">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                  {currentItems.map((testimonial) => (
                    <tr
                      key={testimonial.id}
                      className={`hover:bg-gray-50 dark:hover:bg-slate-800/50 transition ${selectedIds.includes(testimonial.id) ? "bg-primary/5" : ""
                        }`}
                    >
                      <td className="px-6 py-4">
                        <CustomCheckbox
                          checked={selectedIds.includes(testimonial.id)}
                          onChange={() => toggleSelect(testimonial.id)}
                        />
                      </td>
                      <td className="px-6 py-4">
                        <div>
                          <p className="font-medium text-gray-900 dark:text-white">
                            {testimonial.customer_name || "-"}
                          </p>
                          <p className="text-xs text-gray-500">
                            {testimonial.customer_email || "-"}
                          </p>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <span
                            className={`px-2 py-0.5 text-xs rounded-full ${testimonial.order_id
                              ? "bg-blue-100 text-blue-700"
                              : "bg-green-100 text-green-700"
                              }`}
                          >
                            {testimonial.order_id ? "Layanan" : "Toko"}
                          </span>
                          <span className="text-gray-800 dark:text-gray-200">
                            {testimonial.service_name || testimonial.product_name || "-"}
                          </span>
                        </div>
                        {testimonial.is_featured && (
                          <span className="inline-flex items-center gap-1 mt-1 text-xs text-yellow-600">
                            <SparklesIcon className="w-5 h-5" />
                            Unggulan
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        {testimonial.submitted_at ? (
                          <div className="space-y-1">
                            <StarDisplay rating={Math.round(getAverageRating(testimonial))} />
                            <p className="text-xs text-gray-500">
                              Rata-rata: {getAverageRating(testimonial)}/5
                            </p>
                          </div>
                        ) : (
                          <span className="text-xs text-amber-600 bg-amber-50 px-2 py-1 rounded-full">
                            Menunggu
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 max-w-xs">
                        <p className="text-gray-700 dark:text-gray-300 line-clamp-2">
                          {testimonial.review_text || (
                            <span className="text-gray-400 italic">Belum ada ulasan</span>
                          )}
                        </p>
                      </td>
                      <td className="px-6 py-4 text-gray-500 dark:text-gray-400">
                        {formatDate(testimonial.submitted_at || testimonial.created_at)}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-end gap-2">
                          {testimonial.token && (
                            <button
                              onClick={() => copyTestimonialLink(testimonial.token!, testimonial.id)}
                              className="p-2 text-gray-400 hover:text-blue-500 hover:bg-blue-50 rounded-lg transition"
                              title="Salin link testimoni"
                            >
                              {copiedId === testimonial.id ? (
                                <CheckIcon className="w-5 h-5 text-green-500" />
                              ) : (
                                <ClipboardDocumentIcon className="w-5 h-5" />
                              )}
                            </button>
                          )}
                          <button
                            onClick={() => toggleFeatured(testimonial.id, testimonial.is_featured)}
                            className={`p-2 rounded-lg transition ${testimonial.is_featured
                              ? "text-yellow-500 bg-yellow-50"
                              : "text-gray-400 hover:text-yellow-500 hover:bg-yellow-50"
                              }`}
                            title={testimonial.is_featured ? "Hapus dari unggulan" : "Jadikan unggulan"}
                          >
                            <SparklesIcon className="w-5 h-5" />
                          </button>
                          <button
                            onClick={() => handleDelete(testimonial.id)}
                            className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition"
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
            {currentItems.map((testimonial) => (
              <div
                key={testimonial.id}
                className={`bg-white rounded-xl shadow-sm border p-4 ${selectedIds.includes(testimonial.id)
                  ? "border-primary bg-primary/5"
                  : "border-slate-100"
                  }`}
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    {testimonial.submitted_at ? (
                      <StarDisplay rating={Math.round(getAverageRating(testimonial))} />
                    ) : (
                      <span className="text-xs text-amber-600 bg-amber-50 px-2 py-1 rounded-full">
                        Menunggu
                      </span>
                    )}
                    {testimonial.submitted_at && (
                      <span className="text-xs text-gray-500">
                        {getAverageRating(testimonial)}/5
                      </span>
                    )}
                  </div>
                  <CustomCheckbox
                    checked={selectedIds.includes(testimonial.id)}
                    onChange={() => toggleSelect(testimonial.id)}
                  />
                </div>

                <p className="font-semibold text-gray-900">
                  {testimonial.customer_name || "-"}
                </p>
                <p className="text-xs text-gray-500 mb-2">
                  {testimonial.customer_email || "-"}
                </p>

                <div className="flex items-center gap-2 mb-2">
                  <span
                    className={`px-2 py-0.5 text-xs rounded-full ${testimonial.order_id
                      ? "bg-blue-100 text-blue-700"
                      : "bg-green-100 text-green-700"
                      }`}
                  >
                    {testimonial.order_id ? "Layanan" : "Toko"}
                  </span>
                  <span className="text-sm text-gray-700">
                    {testimonial.service_name || testimonial.product_name || "-"}
                  </span>
                  {testimonial.is_featured && (
                    <span className="inline-flex items-center gap-1 text-xs text-yellow-600">
                      <SparklesIcon className="w-5 h-5" />
                      Unggulan
                    </span>
                  )}
                </div>

                {testimonial.review_text && (
                  <p className="text-sm text-gray-600 italic line-clamp-2 mb-3">
                    "{testimonial.review_text}"
                  </p>
                )}

                <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                  <div>
                    <p className="text-xs text-gray-400 uppercase">Tanggal</p>
                    <p className="text-sm text-gray-700">
                      {formatDate(testimonial.submitted_at || testimonial.created_at)}
                    </p>
                  </div>
                  <div className="flex gap-1">
                    {testimonial.token && (
                      <button
                        onClick={() => copyTestimonialLink(testimonial.token!, testimonial.id)}
                        className="p-2 text-gray-400 hover:text-blue-500 hover:bg-blue-50 rounded-lg transition"
                      >
                        {copiedId === testimonial.id ? (
                          <CheckIcon className="w-5 h-5 text-green-500" />
                        ) : (
                          <ClipboardDocumentIcon className="w-5 h-5" />
                        )}
                      </button>
                    )}
                    <button
                      onClick={() => toggleFeatured(testimonial.id, testimonial.is_featured)}
                      className={`p-2 rounded-lg transition ${testimonial.is_featured
                        ? "text-yellow-500 bg-yellow-50"
                        : "text-gray-400 hover:text-yellow-500 hover:bg-yellow-50"
                        }`}
                    >
                      <SparklesIcon className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => handleDelete(testimonial.id)}
                      className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition"
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

      {/* Pagination */}
      {filteredTestimonials.length > 0 && (
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
              {getPageNumbers().map((page, idx) => (
                <li key={idx}>
                  {page === "..." ? (
                    <span className="flex items-center justify-center text-body bg-neutral-secondary-medium border border-default-medium shadow-xs font-medium leading-5 text-sm w-9 h-9 rounded-lg">
                      ...
                    </span>
                  ) : (
                    <button
                      onClick={() => setCurrentPage(page as number)}
                      className={`flex items-center justify-center border shadow-xs font-medium leading-5 text-sm w-9 h-9 focus:outline-none rounded-lg ${currentPage === page
                        ? "text-fg-brand bg-neutral-tertiary-medium border-default-medium"
                        : "text-body bg-neutral-secondary-medium border-default-medium hover:bg-neutral-tertiary-medium hover:text-heading"
                        }`}
                    >
                      {page}
                    </button>
                  )}
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

          {/* Items Per Page - Custom Dropdown */}
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
