// app/admin/pages/page.tsx
"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/useToast";
import Toast from "@/components/Toast";
import { Page } from "@/types/page";
import LogoLoading from "@/components/LogoLoading";
import {
  PlusIcon,
  PencilIcon,
  TrashIcon,
  EyeIcon,
  DocumentTextIcon,
  DocumentDuplicateIcon,
  CheckCircleIcon,
  ClockIcon,
  MagnifyingGlassIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
} from "@heroicons/react/24/outline";
import Link from "next/link";

// Items per page
const ITEMS_PER_PAGE = 20;

export default function PagesManagementPage() {
  const [pages, setPages] = useState<Page[]>([]);
  const [filteredPages, setFilteredPages] = useState<Page[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const { toast, showToast, hideToast } = useToast();

  // Calculate total pages
  const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE);

  // Calculate the range of items to display
  const indexOfLastItem = currentPage * ITEMS_PER_PAGE;
  const indexOfFirstItem = indexOfLastItem - ITEMS_PER_PAGE;
  const currentItems = filteredPages.slice(indexOfFirstItem, indexOfLastItem);

  useEffect(() => {
    fetchPages();
  }, []);

  useEffect(() => {
    // Filter pages based on search query
    if (searchQuery.trim() === "") {
      setFilteredPages(pages);
    } else {
      const filtered = pages.filter(
        (page) =>
          page.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          page.slug.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredPages(filtered);
    }
    // Reset to first page when search changes
    setCurrentPage(1);
  }, [searchQuery, pages]);

  const fetchPages = async () => {
    const { data, error } = await supabase
      .from("pages")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching pages:", error);
      showToast("Gagal memuat data halaman.", "error");
    } else {
      setPages(data || []);
      setFilteredPages(data || []);
      setTotalItems(data?.length || 0);
    }
    setLoading(false);
  };

  const handleDelete = async (id: number) => {
    const isConfirmed = window.confirm(
      "Apakah Anda yakin ingin menghapus halaman ini?"
    );
    if (!isConfirmed) return;

    setSaving(true);
    const { error } = await supabase.from("pages").delete().eq("id", id);

    if (error) {
      console.error("Error deleting page:", error);
      showToast("Gagal menghapus halaman.", "error");
    } else {
      const updatedPages = pages.filter((page) => page.id !== id);
      setPages(updatedPages);
      setTotalItems(updatedPages.length);

      // Update filtered pages if needed
      if (searchQuery.trim() === "") {
        setFilteredPages(updatedPages);
      } else {
        // Reapply filters
        const filtered = updatedPages.filter(
          (page) =>
            page.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            page.slug.toLowerCase().includes(searchQuery.toLowerCase())
        );
        setFilteredPages(filtered);
      }

      showToast("Halaman berhasil dihapus.", "success");
    }
    setSaving(false);
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
            <Link
              href="/admin/pages/new"
              className="inline-flex items-center px-4 py-2 bg-primary text-white font-medium rounded-lg shadow-sm hover:bg-primary/90 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
            >
              <PlusIcon className="h-5 w-5 mr-2" />
              Buat Halaman Baru
            </Link>

            <div className="relative w-full sm:w-auto">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <MagnifyingGlassIcon className="h-5 w-5 text-slate-400" />
              </div>
              <input
                type="text"
                className="block w-full sm:w-64 pl-10 pr-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-500 dark:placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                placeholder="Cari halaman..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* Items Count */}
        <div className="mb-4 text-sm text-slate-600 dark:text-slate-400">
          Menampilkan {indexOfFirstItem + 1}-
          {Math.min(indexOfLastItem, filteredPages.length)} dari{" "}
          {filteredPages.length} halaman
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
                  Slug
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-300 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-300 uppercase tracking-wider">
                  Diperbarui
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-300 uppercase tracking-wider">
                  Aksi
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-slate-700 divide-y divide-slate-200 dark:divide-slate-600">
              {currentItems.map((page) => (
                <tr
                  key={page.id}
                  className="hover:bg-slate-50 dark:hover:bg-slate-800/50"
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <DocumentTextIcon className="flex-shrink-0 h-5 w-5 text-slate-400 mr-3" />
                      <div className="text-sm font-medium text-slate-900 dark:text-white">
                        {page.title}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 dark:text-slate-300">
                    <code className="px-2 py-1 bg-slate-100 dark:bg-slate-800 rounded text-xs">
                      /{page.slug}
                    </code>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                        page.is_published
                          ? "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400"
                          : "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400"
                      }`}
                    >
                      {page.is_published ? (
                        <>
                          <CheckCircleIcon className="h-4 w-4 mr-1" />
                          Diterbitkan
                        </>
                      ) : (
                        <>
                          <ClockIcon className="h-4 w-4 mr-1" />
                          Draft
                        </>
                      )}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 dark:text-slate-300">
                    {new Date(page.updated_at).toLocaleDateString("id-ID")}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-2">
                      <Link
                        href={`/pages/${page.slug}`}
                        target="_blank"
                        className="inline-flex items-center px-3 py-1.5 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 rounded-md hover:bg-indigo-100 dark:hover:bg-indigo-900/30 transition-colors"
                      >
                        <EyeIcon className="h-4 w-4 mr-1" />
                        Lihat
                      </Link>
                      <Link
                        href={`/admin/pages/${page.id}/edit`}
                        className="inline-flex items-center px-3 py-1.5 bg-yellow-50 dark:bg-yellow-900/20 text-yellow-600 dark:text-yellow-400 rounded-md hover:bg-yellow-100 dark:hover:bg-yellow-900/30 transition-colors"
                      >
                        <PencilIcon className="h-4 w-4 mr-1" />
                        Edit
                      </Link>
                      <button
                        onClick={() => handleDelete(page.id)}
                        disabled={saving}
                        className="inline-flex items-center px-3 py-1.5 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-md hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors"
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
          {currentItems.map((page) => (
            <div
              key={page.id}
              className="bg-white dark:bg-slate-800 rounded-lg shadow p-4 border border-slate-200 dark:border-slate-600"
            >
              <div className="flex justify-between items-start mb-3">
                <div className="flex items-start">
                  <DocumentTextIcon className="flex-shrink-0 h-5 w-5 text-slate-400 mr-3 mt-0.5" />
                  <div className="flex-1">
                    <h3 className="text-lg font-medium text-slate-900 dark:text-white">
                      {page.title}
                    </h3>
                    <code className="px-2 py-1 bg-slate-100 dark:bg-slate-800 rounded text-xs text-slate-600 dark:text-slate-400 mt-1 inline-block">
                      /{page.slug}
                    </code>
                  </div>
                </div>
                <span
                  className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    page.is_published
                      ? "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400"
                      : "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400"
                  }`}
                >
                  {page.is_published ? (
                    <>
                      <CheckCircleIcon className="h-4 w-4 mr-1" />
                      Diterbitkan
                    </>
                  ) : (
                    <>
                      <ClockIcon className="h-4 w-4 mr-1" />
                      Draft
                    </>
                  )}
                </span>
              </div>
              <div className="ml-8">
                <p className="text-sm text-slate-500 dark:text-slate-400 mb-3">
                  <span className="font-medium">Diperbarui:</span>{" "}
                  {new Date(page.updated_at).toLocaleDateString("id-ID")}
                </p>
                <div className="flex justify-end space-x-2">
                  <Link
                    href={`/pages/${page.slug}`}
                    target="_blank"
                    className="inline-flex items-center px-3 py-1.5 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 rounded-md hover:bg-indigo-100 dark:hover:bg-indigo-900/30 transition-colors"
                  >
                    <EyeIcon className="h-4 w-4 mr-1" />
                    Lihat
                  </Link>
                  <Link
                    href={`/admin/pages/${page.id}/edit`}
                    className="inline-flex items-center px-3 py-1.5 bg-yellow-50 dark:bg-yellow-900/20 text-yellow-600 dark:text-yellow-400 rounded-md hover:bg-yellow-100 dark:hover:bg-yellow-900/30 transition-colors"
                  >
                    <PencilIcon className="h-4 w-4 mr-1" />
                    Edit
                  </Link>
                  <button
                    onClick={() => handleDelete(page.id)}
                    disabled={saving}
                    className="inline-flex items-center px-3 py-1.5 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-md hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors"
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
        {currentItems.length === 0 && (
          <div className="text-center py-12">
            <DocumentDuplicateIcon className="mx-auto h-12 w-12 text-slate-400" />
            <h3 className="mt-2 text-sm font-medium text-slate-900 dark:text-white">
              {searchQuery
                ? "Tidak ada halaman yang ditemukan"
                : "Tidak ada halaman"}
            </h3>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              {searchQuery
                ? "Coba ubah kata kunci pencarian Anda."
                : "Belum ada halaman statis yang dibuat."}
            </p>
            {!searchQuery && (
              <div className="mt-6">
                <Link
                  href="/admin/pages/new"
                  className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary hover:bg-primary/80 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
                >
                  <PlusIcon className="-ml-1 mr-2 h-5 w-5" />
                  Buat Halaman Baru
                </Link>
              </div>
            )}
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
                <ChevronLeftIcon className="h-5 w-5" />
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
                <ChevronRightIcon className="h-5 w-5" />
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
