"use client";

import { useState, useEffect, useRef } from "react";
import { supabase } from "@/lib/supabase";
import Link from "next/link";
import { useAlert } from "@/components/providers/AlertProvider";
import LogoPathAnimation from "@/components/LogoPathAnimation";
import {
  MagnifyingGlassIcon,
  ChevronDownIcon,
  PlusIcon,
  PencilIcon,
  TrashIcon,
  DocumentTextIcon,
  FolderIcon,
  ChatBubbleLeftIcon,
} from "@heroicons/react/24/outline";

interface Article {
  id: number;
  title: string;
  slug: string;
  status: string;
  published_at: string;
  created_at: string;
}

export default function BlogManagementPage() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [filteredArticles, setFilteredArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"all" | "published" | "draft">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [pageDropdownOpen, setPageDropdownOpen] = useState(false);
  const pageDropdownRef = useRef<HTMLDivElement>(null);
  const { showAlert, showConfirm } = useAlert();

  // Stats
  const stats = {
    total: articles.length,
    published: articles.filter(a => a.status === "published").length,
    draft: articles.filter(a => a.status === "draft").length,
  };

  // Pagination
  const totalPages = Math.ceil(filteredArticles.length / itemsPerPage);
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredArticles.slice(indexOfFirstItem, indexOfLastItem);

  // Close dropdown when clicking outside
  useEffect(() => {
    if (!pageDropdownOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (pageDropdownRef.current && !pageDropdownRef.current.contains(event.target as Node)) {
        setPageDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [pageDropdownOpen]);

  useEffect(() => {
    fetchArticles();
  }, []);

  useEffect(() => {
    // Filter articles based on search query and tab
    let filtered = articles;

    // Filter by status tab
    if (activeTab !== "all") {
      filtered = filtered.filter(a => a.status === activeTab);
    }

    // Filter by search query
    if (searchQuery.trim() !== "") {
      filtered = filtered.filter(
        (article) =>
          article.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          article.slug.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    setFilteredArticles(filtered);
    setCurrentPage(1);
  }, [searchQuery, articles, activeTab]);

  const fetchArticles = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("articles")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching articles:", error);
        showAlert("error", "Error", "Gagal memuat artikel");
      } else {
        setArticles(data || []);
        setFilteredArticles(data || []);
      }

      setLoading(false);
    } catch (error) {
      console.error("Error fetching articles:", error);
      showAlert("error", "Error", "Terjadi kesalahan saat memuat artikel");
      setLoading(false);
    }
  };

  const handleDelete = async (article: Article) => {
    const isConfirmed = await showConfirm(
      "Hapus Artikel",
      `Apakah Anda yakin ingin menghapus artikel "${article.title}"? Tindakan ini tidak dapat dibatalkan.`,
      "error",
      "Hapus"
    );

    if (!isConfirmed) return;

    try {
      const { error } = await supabase
        .from("articles")
        .delete()
        .eq("id", article.id);

      if (error) {
        console.error("Error deleting article:", error);
        showAlert("error", "Gagal", "Gagal menghapus artikel");
      } else {
        showAlert("success", "Berhasil", "Artikel berhasil dihapus");
        fetchArticles();
      }
    } catch (error) {
      console.error("Error deleting article:", error);
      showAlert("error", "Error", "Terjadi kesalahan saat menghapus artikel");
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("id-ID", {
      year: "numeric",
      month: "long",
      day: "numeric",
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
              onClick={() => setActiveTab("published")}
              className={`text-sm h-10 rounded-md px-3 py-2 font-medium transition-all ${activeTab === "published"
                  ? "shadow-sm text-gray-900 dark:text-white bg-white dark:bg-gray-800"
                  : "text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
                }`}
            >
              Dipublikasikan ({stats.published})
            </button>
            <button
              onClick={() => setActiveTab("draft")}
              className={`text-sm h-10 rounded-md px-3 py-2 font-medium transition-all ${activeTab === "draft"
                  ? "shadow-sm text-gray-900 dark:text-white bg-white dark:bg-gray-800"
                  : "text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
                }`}
            >
              Draft ({stats.draft})
            </button>
          </div>

          {/* Right: Search, Navigation, and Add Button */}
          <div className="flex flex-col sm:flex-row gap-3">
            {/* Search */}
            <div className="relative">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Cari artikel..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 pr-4 py-3 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary w-full sm:w-48"
              />
            </div>

            {/* Navigation Links */}
            <Link
              href="/admin/categories"
              className="inline-flex items-center justify-center px-4 py-3 bg-slate-100 dark:bg-slate-600 text-slate-700 dark:text-slate-200 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-500 transition-colors text-sm font-medium"
            >
              <FolderIcon className="w-4 h-4 mr-2" />
              Kategori
            </Link>
            <Link
              href="/admin/comments"
              className="inline-flex items-center justify-center px-4 py-3 bg-slate-100 dark:bg-slate-600 text-slate-700 dark:text-slate-200 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-500 transition-colors text-sm font-medium"
            >
              <ChatBubbleLeftIcon className="w-4 h-4 mr-2" />
              Komentar
            </Link>

            {/* Add Button */}
            <Link
              href="/admin/blog/new"
              className="inline-flex items-center justify-center px-4 py-3 bg-primary text-white font-medium rounded-lg shadow-sm hover:bg-primary/90 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
            >
              <PlusIcon className="w-5 h-5 mr-2" />
              Tulis Artikel
            </Link>
          </div>
        </div>
      </div>

      {/* Content */}
      {currentItems.length === 0 ? (
        <div className="text-center py-12 bg-white dark:bg-slate-800 rounded-xl border border-dashed border-gray-300 dark:border-gray-700">
          <DocumentTextIcon className="h-12 w-12 mx-auto text-gray-300 dark:text-gray-600 mb-3" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">
            {searchQuery
              ? "Tidak ada artikel yang ditemukan"
              : "Tidak ada artikel"}
          </h3>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            {searchQuery
              ? "Coba ubah kata kunci pencarian Anda."
              : activeTab === "all"
                ? "Belum ada artikel yang dibuat."
                : `Tidak ada artikel dengan status "${activeTab === "published" ? "Dipublikasikan" : "Draft"}".`}
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
                    <th className="px-6 py-4 rounded-tl-lg">Judul</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4">Tanggal Dibuat</th>
                    <th className="px-6 py-4">Tanggal Dipublikasikan</th>
                    <th className="px-6 py-4 text-right rounded-tr-lg">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                  {currentItems.map((article) => (
                    <tr
                      key={article.id}
                      className="hover:bg-gray-50 dark:hover:bg-slate-800/50 transition"
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center">
                          <DocumentTextIcon className="h-5 w-5 text-gray-400 mr-3 flex-shrink-0" />
                          <span className="font-medium text-gray-900 dark:text-white">
                            {article.title}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`px-2.5 py-0.5 inline-flex text-xs leading-5 font-semibold rounded-full ${article.status === "published"
                              ? "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400"
                              : "bg-slate-100 text-slate-800 dark:bg-slate-900/20 dark:text-slate-400"
                            }`}
                        >
                          {article.status === "published"
                            ? "Dipublikasikan"
                            : "Draft"}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-gray-500 dark:text-gray-300">
                        {formatDate(article.created_at)}
                      </td>
                      <td className="px-6 py-4 text-gray-500 dark:text-gray-300">
                        {article.published_at
                          ? formatDate(article.published_at)
                          : "-"}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-end gap-2">
                          <Link
                            href={`/admin/blog/edit/${article.id}`}
                            className="p-2 text-gray-400 hover:text-blue-500 hover:bg-blue-50 rounded-lg transition"
                            title="Edit"
                          >
                            <PencilIcon className="w-5 h-5" />
                          </Link>
                          <button
                            onClick={() => handleDelete(article)}
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
          <div className="md:hidden space-y-4">
            {currentItems.map((article) => (
              <div
                key={article.id}
                className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden"
              >
                <div className="p-4">
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex items-start flex-1">
                      <DocumentTextIcon className="h-5 w-5 text-gray-400 mr-3 mt-0.5 flex-shrink-0" />
                      <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                        {article.title}
                      </h3>
                    </div>
                    <span
                      className={`px-2.5 py-0.5 inline-flex text-xs leading-5 font-semibold rounded-full ml-2 flex-shrink-0 ${article.status === "published"
                          ? "bg-green-100 text-green-800"
                          : "bg-slate-100 text-slate-800"
                        }`}
                    >
                      {article.status === "published" ? "Dipublikasikan" : "Draft"}
                    </span>
                  </div>
                  <div className="text-sm text-gray-500 dark:text-gray-400 mb-3 ml-8">
                    <p className="mb-1">
                      <span className="font-medium">Dibuat:</span> {formatDate(article.created_at)}
                    </p>
                    <p>
                      <span className="font-medium">Dipublikasikan:</span>{" "}
                      {article.published_at
                        ? formatDate(article.published_at)
                        : "-"}
                    </p>
                  </div>
                  <div className="flex justify-end gap-2 pt-3 border-t border-gray-100 dark:border-gray-700">
                    <Link
                      href={`/admin/blog/edit/${article.id}`}
                      className="p-2 text-gray-400 hover:text-blue-500 hover:bg-blue-50 rounded-lg transition"
                      title="Edit"
                    >
                      <PencilIcon className="w-5 h-5" />
                    </Link>
                    <button
                      onClick={() => handleDelete(article)}
                      className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition"
                      title="Hapus"
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
      {filteredArticles.length > 0 && (
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
