"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import Link from "next/link";
import { useAlert } from "@/components/providers/AlertProvider";
import LogoPathAnimation from "@/components/LogoPathAnimation";
import {
  ArrowLeftIcon,
  PlusIcon,
  PencilIcon,
  TrashIcon,
  FolderIcon,
  MagnifyingGlassIcon,
  ChevronDownIcon,
} from "@heroicons/react/24/outline";

interface Category {
  id: number;
  name: string;
  slug: string;
  description: string;
  created_at: string;
}

export default function CategoriesManagementPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [filteredCategories, setFilteredCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [pageDropdownOpen, setPageDropdownOpen] = useState(false);
  const pageDropdownRef = useRef<HTMLDivElement>(null);
  const { showAlert, showConfirm } = useAlert();

  // Pagination
  const totalPages = Math.ceil(filteredCategories.length / itemsPerPage);
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredCategories.slice(indexOfFirstItem, indexOfLastItem);

  useEffect(() => {
    // Filter categories based on search query
    if (searchQuery.trim() === "") {
      setFilteredCategories(categories);
    } else {
      const filtered = categories.filter(
        (category) =>
          category.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          category.slug.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (category.description &&
            category.description
              .toLowerCase()
              .includes(searchQuery.toLowerCase()))
      );
      setFilteredCategories(filtered);
    }
    setCurrentPage(1);
  }, [searchQuery, categories]);


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

  // Define fetchCategories with useCallback
  const fetchCategories = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("categories")
        .select("*")
        .order("name");

      if (error) {
        console.error("Error fetching categories:", error);
        showAlert("error", "Error", "Gagal memuat kategori");
      } else {
        setCategories(data || []);
        setFilteredCategories(data || []);
      }

      setLoading(false);
    } catch (error) {
      console.error("Error fetching categories:", error);
      showAlert("error", "Error", "Terjadi kesalahan saat memuat kategori");
      setLoading(false);
    }
  }, [showAlert]);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  useEffect(() => {
    // Filter categories based on search query
    // ... rest of useEffect
    if (searchQuery.trim() === "") {
      setFilteredCategories(categories);
    } else {
      const filtered = categories.filter(
        (category) =>
          category.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          category.slug.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (category.description &&
            category.description
              .toLowerCase()
              .includes(searchQuery.toLowerCase()))
      );
      setFilteredCategories(filtered);
    }
    setCurrentPage(1);
  }, [searchQuery, categories]);

  const handleDelete = async (category: Category) => {
    const isConfirmed = await showConfirm(
      "Hapus Kategori",
      `Apakah Anda yakin ingin menghapus kategori "${category.name}"? Tindakan ini tidak dapat dibatalkan.`,
      "error",
      "Hapus"
    );

    if (!isConfirmed) return;

    try {
      const { error } = await supabase
        .from("categories")
        .delete()
        .eq("id", category.id);

      if (error) {
        console.error("Error deleting category:", error);
        showAlert("error", "Gagal", "Gagal menghapus kategori");
      } else {
        showAlert("success", "Berhasil", "Kategori berhasil dihapus");
        fetchCategories();
      }
    } catch (error) {
      console.error("Error deleting category:", error);
      showAlert("error", "Error", "Terjadi kesalahan saat menghapus kategori");
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
          {/* Left: Navigation */}
          <div className="flex flex-col sm:flex-row gap-2">
            <Link
              href="/admin/blog"
              className="inline-flex items-center justify-center px-4 py-3 bg-slate-100 dark:bg-slate-600 text-slate-700 dark:text-slate-200 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-500 transition-colors text-sm font-medium"
            >
              <ArrowLeftIcon className="w-4 h-4 mr-2" />
              Blogs
            </Link>
          </div>

          {/* Right: Search and Add Button */}
          <div className="flex flex-col sm:flex-row gap-3">
            {/* Search */}
            <div className="relative">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Cari kategori..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 pr-4 py-3 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary w-full sm:w-48"
              />
            </div>

            {/* Add Button */}
            <Link
              href="/admin/categories/new"
              className="inline-flex items-center justify-center px-4 py-3 bg-primary text-white font-medium rounded-lg shadow-sm hover:bg-primary/90 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
            >
              <PlusIcon className="w-5 h-5 mr-2" />
              Tambah Kategori
            </Link>
          </div>
        </div>
      </div>

      {/* Content */}
      {currentItems.length === 0 ? (
        <div className="text-center py-12 bg-white dark:bg-slate-800 rounded-xl border border-dashed border-gray-300 dark:border-gray-700">
          <FolderIcon className="h-12 w-12 mx-auto text-gray-300 dark:text-gray-600 mb-3" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">
            {searchQuery
              ? "Tidak ada kategori yang ditemukan"
              : "Tidak ada kategori"}
          </h3>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            {searchQuery
              ? "Coba ubah kata kunci pencarian Anda."
              : "Belum ada kategori yang dibuat."}
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
                    <th className="px-6 py-4 rounded-tl-lg">Nama Kategori</th>
                    <th className="px-6 py-4">Slug</th>
                    <th className="px-6 py-4">Deskripsi</th>
                    <th className="px-6 py-4">Tanggal Dibuat</th>
                    <th className="px-6 py-4 text-right rounded-tr-lg">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                  {currentItems.map((category) => (
                    <tr
                      key={category.id}
                      className="hover:bg-gray-50 dark:hover:bg-slate-800/50 transition"
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center">
                          <FolderIcon className="h-5 w-5 text-gray-400 mr-3 flex-shrink-0" />
                          <span className="font-medium text-gray-900 dark:text-white">
                            {category.name}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <code className="px-2 py-1 bg-slate-100 dark:bg-slate-800 rounded text-xs text-slate-600 dark:text-slate-400">
                          {category.slug}
                        </code>
                      </td>
                      <td className="px-6 py-4 text-gray-500 dark:text-gray-300">
                        <div className="max-w-xs truncate">
                          {category.description || "-"}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-gray-500 dark:text-gray-300">
                        {formatDate(category.created_at)}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-end gap-2">
                          <Link
                            href={`/admin/categories/edit/${category.id}`}
                            className="p-2 text-gray-400 hover:text-blue-500 hover:bg-blue-50 rounded-lg transition"
                            title="Edit"
                          >
                            <PencilIcon className="w-5 h-5" />
                          </Link>
                          <button
                            onClick={() => handleDelete(category)}
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
            {currentItems.map((category) => (
              <div
                key={category.id}
                className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden"
              >
                <div className="p-4">
                  <div className="flex items-start mb-3">
                    <FolderIcon className="h-5 w-5 text-gray-400 mr-3 mt-0.5 flex-shrink-0" />
                    <div className="flex-1">
                      <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                        {category.name}
                      </h3>
                      <code className="px-2 py-1 bg-slate-100 dark:bg-slate-800 rounded text-xs text-slate-600 dark:text-slate-400 mt-1 inline-block">
                        {category.slug}
                      </code>
                    </div>
                  </div>
                  <div className="text-sm text-gray-500 dark:text-gray-400 mb-3">
                    <p className="mb-2">
                      <span className="font-medium">Deskripsi:</span>{" "}
                      {category.description || "-"}
                    </p>
                    <p>
                      <span className="font-medium">Dibuat:</span>{" "}
                      {formatDate(category.created_at)}
                    </p>
                  </div>
                  <div className="flex justify-end gap-2 pt-3 border-t border-gray-100 dark:border-gray-700">
                    <Link
                      href={`/admin/categories/edit/${category.id}`}
                      className="p-2 text-gray-400 hover:text-blue-500 hover:bg-blue-50 rounded-lg transition"
                      title="Edit"
                    >
                      <PencilIcon className="w-5 h-5" />
                    </Link>
                    <button
                      onClick={() => handleDelete(category)}
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
      {filteredCategories.length > 0 && (
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
