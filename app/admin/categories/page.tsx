"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import Link from "next/link";
import Modal from "@/components/Modal";
import Toast from "@/components/Toast";
import { useToast } from "@/hooks/useToast";
import LogoLoading from "@/components/LogoLoading";
import {
  ArrowLeftIcon,
  PlusIcon,
  PencilIcon,
  TrashIcon,
  FolderIcon,
  ExclamationTriangleIcon,
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
  const [loading, setLoading] = useState(true);
  const [deleteModal, setDeleteModal] = useState<{
    isOpen: boolean;
    categoryId: number;
    categoryName: string;
  }>({
    isOpen: false,
    categoryId: 0,
    categoryName: "",
  });
  const [deleting, setDeleting] = useState(false);
  const { toast, showToast, hideToast } = useToast();

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("categories")
        .select("*")
        .order("name");

      if (error) {
        console.error("Error fetching categories:", error);
        showToast("Gagal memuat kategori", "error");
      } else {
        setCategories(data || []);
      }

      setLoading(false);
    } catch (error) {
      console.error("Error fetching categories:", error);
      showToast("Terjadi kesalahan saat memuat kategori", "error");
      setLoading(false);
    }
  };

  const handleDeleteClick = (category: Category) => {
    setDeleteModal({
      isOpen: true,
      categoryId: category.id,
      categoryName: category.name,
    });
  };

  const confirmDelete = async () => {
    setDeleting(true);
    try {
      const { error } = await supabase
        .from("categories")
        .delete()
        .eq("id", deleteModal.categoryId);

      if (error) {
        console.error("Error deleting category:", error);
        showToast("Gagal menghapus kategori", "error");
      } else {
        setCategories(
          categories.filter(
            (category) => category.id !== deleteModal.categoryId
          )
        );
        showToast("Kategori berhasil dihapus", "success");
        setDeleteModal({ isOpen: false, categoryId: 0, categoryName: "" });
      }
    } catch (error) {
      console.error("Error deleting category:", error);
      showToast("Terjadi kesalahan saat menghapus kategori", "error");
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
        {/* Header Section - Diperbaiki */}
        <div className="mb-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <Link
              href="/admin/blog"
              className="inline-flex items-center px-4 py-2 bg-slate-100 dark:bg-slate-600 text-slate-700 dark:text-slate-200 rounded-md hover:bg-slate-200 dark:hover:bg-slate-500 transition-colors"
            >
              <ArrowLeftIcon className="w-4 h-4 mr-2" />
              Kembali Ke Blogs
            </Link>
            <Link
              href="/admin/categories/new"
              className="inline-flex items-center px-4 py-2 bg-primary text-white font-medium rounded-lg shadow-sm hover:bg-primary/90 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
            >
              <PlusIcon className="w-5 h-5 mr-2" />
              Tambah Kategori
            </Link>
          </div>
        </div>

        {/* Categories List - Desktop Table View */}
        <div className="hidden md:block overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-600">
            <thead className="bg-slate-50 dark:bg-slate-800">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-300 uppercase tracking-wider">
                  Nama Kategori
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-300 uppercase tracking-wider">
                  Slug
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-300 uppercase tracking-wider">
                  Deskripsi
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-300 uppercase tracking-wider">
                  Tanggal Dibuat
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-300 uppercase tracking-wider">
                  Aksi
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-slate-700 divide-y divide-slate-200 dark:divide-slate-600">
              {categories.map((category) => (
                <tr key={category.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <FolderIcon className="h-5 w-5 text-slate-400 mr-3" />
                      <div className="text-sm font-medium text-slate-900 dark:text-white">
                        {category.name}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 dark:text-slate-300">
                    <code className="px-2 py-1 bg-slate-100 dark:bg-slate-800 rounded text-xs">
                      {category.slug}
                    </code>
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-500 dark:text-slate-300">
                    <div className="max-w-xs truncate">
                      {category.description || "-"}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 dark:text-slate-300">
                    {formatDate(category.created_at)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-2">
                      <Link
                        href={`/admin/categories/edit/${category.id}`}
                        className="inline-flex items-center px-3 py-1.5 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 rounded-md hover:bg-indigo-100 dark:hover:bg-indigo-900/30 transition-colors"
                      >
                        <PencilIcon className="h-4 w-4 mr-1" />
                        Edit
                      </Link>
                      <button
                        onClick={() => handleDeleteClick(category)}
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

        {/* Categories List - Mobile Card View */}
        <div className="md:hidden space-y-4">
          {categories.map((category) => (
            <div
              key={category.id}
              className="bg-white dark:bg-slate-800 rounded-lg shadow p-4 border border-slate-200 dark:border-slate-600"
            >
              <div className="flex items-start mb-3">
                <FolderIcon className="h-5 w-5 text-slate-400 mr-3 mt-0.5" />
                <div className="flex-1">
                  <h3 className="text-lg font-medium text-slate-900 dark:text-white">
                    {category.name}
                  </h3>
                  <code className="px-2 py-1 bg-slate-100 dark:bg-slate-800 rounded text-xs text-slate-600 dark:text-slate-400 mt-1 inline-block">
                    {category.slug}
                  </code>
                </div>
              </div>
              <div className="text-sm text-slate-500 dark:text-slate-400 mb-3">
                <p className="mb-2">
                  <span className="font-medium">Deskripsi:</span>{" "}
                  {category.description || "-"}
                </p>
                <p>
                  <span className="font-medium">Dibuat:</span>{" "}
                  {formatDate(category.created_at)}
                </p>
              </div>
              <div className="flex justify-end space-x-2">
                <Link
                  href={`/admin/categories/edit/${category.id}`}
                  className="inline-flex items-center px-3 py-1.5 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 rounded-md hover:bg-indigo-100 dark:hover:bg-indigo-900/30 transition-colors"
                >
                  <PencilIcon className="h-4 w-4 mr-1" />
                  Edit
                </Link>
                <button
                  onClick={() => handleDeleteClick(category)}
                  className="inline-flex items-center px-3 py-1.5 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-md hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors"
                >
                  <TrashIcon className="h-4 w-4 mr-1" />
                  Hapus
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Empty State */}
        {categories.length === 0 && (
          <div className="text-center py-12">
            <FolderIcon className="mx-auto h-12 w-12 text-slate-400" />
            <h3 className="mt-2 text-sm font-medium text-slate-900 dark:text-white">
              Tidak ada kategori
            </h3>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              Belum ada kategori yang dibuat.
            </p>
            <div className="mt-6">
              <Link
                href="/admin/categories/new"
                className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary hover:bg-primary/80 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
              >
                <PlusIcon className="-ml-1 mr-2 h-4 w-4" />
                Tambah Kategori Baru
              </Link>
            </div>
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={deleteModal.isOpen}
        onClose={() =>
          setDeleteModal({ isOpen: false, categoryId: 0, categoryName: "" })
        }
        title="Konfirmasi Hapus Kategori"
        size="sm"
      >
        <div className="text-center">
          <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 dark:bg-red-900/20 mb-4">
            <ExclamationTriangleIcon className="h-6 w-6 text-red-600 dark:text-red-400" />
          </div>
          <h3 className="text-lg font-medium text-slate-900 dark:text-white mb-2">
            Hapus Kategori?
          </h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
            Apakah Anda yakin ingin menghapus kategori "
            <strong>{deleteModal.categoryName}</strong>"? Tindakan ini tidak
            dapat dibatalkan.
          </p>
          <div className="flex justify-center space-x-3">
            <button
              type="button"
              className="px-4 py-2 bg-slate-200 dark:bg-slate-600 text-slate-700 dark:text-slate-200 rounded-md hover:bg-slate-300 dark:hover:bg-slate-500 focus:outline-none focus:ring-2 focus:ring-slate-500"
              onClick={() =>
                setDeleteModal({
                  isOpen: false,
                  categoryId: 0,
                  categoryName: "",
                })
              }
              disabled={deleting}
            >
              Batal
            </button>
            <button
              type="button"
              className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 disabled:opacity-50"
              onClick={confirmDelete}
              disabled={deleting}
            >
              {deleting ? "Menghapus..." : "Hapus"}
            </button>
          </div>
        </div>
      </Modal>

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
