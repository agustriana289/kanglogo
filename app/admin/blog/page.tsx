"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import Link from "next/link";
import Modal from "@/components/Modal";
import Toast from "@/components/Toast";
import { useToast } from "@/hooks/useToast";
import LogoLoading from "@/components/LogoLoading";

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
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [deleteModal, setDeleteModal] = useState<{
    isOpen: boolean;
    articleId: number;
    articleTitle: string;
  }>({
    isOpen: false,
    articleId: 0,
    articleTitle: "",
  });
  const [deleting, setDeleting] = useState(false);
  const { toast, showToast, hideToast } = useToast();

  useEffect(() => {
    fetchArticles();
  }, [filter]);

  const fetchArticles = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from("articles")
        .select("*")
        .order("created_at", { ascending: false });

      if (filter !== "all") {
        query = query.eq("status", filter);
      }

      const { data, error } = await query;

      if (error) {
        console.error("Error fetching articles:", error);
        showToast("Gagal memuat artikel", "error");
      } else {
        setArticles(data || []);
      }

      setLoading(false);
    } catch (error) {
      console.error("Error fetching articles:", error);
      showToast("Terjadi kesalahan saat memuat artikel", "error");
      setLoading(false);
    }
  };

  const handleDeleteClick = (article: Article) => {
    setDeleteModal({
      isOpen: true,
      articleId: article.id,
      articleTitle: article.title,
    });
  };

  const confirmDelete = async () => {
    setDeleting(true);
    try {
      const { error } = await supabase
        .from("articles")
        .delete()
        .eq("id", deleteModal.articleId);

      if (error) {
        console.error("Error deleting article:", error);
        showToast("Gagal menghapus artikel", "error");
      } else {
        setArticles(
          articles.filter((article) => article.id !== deleteModal.articleId)
        );
        showToast("Artikel berhasil dihapus", "success");
        setDeleteModal({ isOpen: false, articleId: 0, articleTitle: "" });
      }
    } catch (error) {
      console.error("Error deleting article:", error);
      showToast("Terjadi kesalahan saat menghapus artikel", "error");
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
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
          <Link
            href="/admin/blog/new"
            className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/80 transition-colors w-full sm:w-auto text-center"
          >
            Tulis Artikel Baru
          </Link>
          <div className="flex flex-cols sm:flex-wrap gap-2 w-full sm:w-auto">
            <Link
              href="/admin/categories"
              className="px-4 py-2 bg-slate-200 text-slate-700 rounded-md hover:bg-slate-300/80 transition-colors w-full sm:w-auto text-center"
            >
              Categories
            </Link>

            <Link
              href="/admin/comments"
              className="px-4 py-2 bg-slate-200 text-slate-700 rounded-md hover:bg-slate-300/80 transition-colors w-full sm:w-auto text-center"
            >
              Comments
            </Link>
          </div>
        </div>

        {/* Filter Section - Diperbaiki */}
        <div className="flex flex-wrap gap-2 mb-6 p-2 bg-slate-100 dark:bg-slate-800 rounded-lg">
          <button
            onClick={() => setFilter("all")}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              filter === "all"
                ? "bg-white dark:bg-slate-700 text-primary shadow-sm"
                : "text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white"
            }`}
          >
            Semua ({articles.length})
          </button>
          <button
            onClick={() => setFilter("published")}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              filter === "published"
                ? "bg-white dark:bg-slate-700 text-primary shadow-sm"
                : "text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white"
            }`}
          >
            Dipublikasikan (
            {articles.filter((a) => a.status === "published").length})
          </button>
          <button
            onClick={() => setFilter("draft")}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              filter === "draft"
                ? "bg-white dark:bg-slate-700 text-primary shadow-sm"
                : "text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white"
            }`}
          >
            Draft ({articles.filter((a) => a.status === "draft").length})
          </button>
        </div>

        {/* Articles List - Desktop Table View */}
        <div className="hidden md:block overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-600">
            <thead className="bg-slate-50 dark:bg-slate-800">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-300 uppercase tracking-wider">
                  Judul
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-300 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-300 uppercase tracking-wider">
                  Tanggal Dibuat
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-300 uppercase tracking-wider">
                  Tanggal Dipublikasikan
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-300 uppercase tracking-wider">
                  Aksi
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-slate-700 divide-y divide-slate-200 dark:divide-slate-600">
              {articles.map((article) => (
                <tr key={article.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-slate-900 dark:text-white">
                      {article.title}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        article.status === "published"
                          ? "bg-green-100 text-green-800"
                          : "bg-slate-100 text-slate-800"
                      }`}
                    >
                      {article.status === "published"
                        ? "Dipublikasikan"
                        : "Draft"}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 dark:text-slate-300">
                    {formatDate(article.created_at)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 dark:text-slate-300">
                    {article.published_at
                      ? formatDate(article.published_at)
                      : "-"}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <Link
                      href={`/admin/blog/edit/${article.id}`}
                      className="text-indigo-600 hover:text-indigo-900 mr-4"
                    >
                      Edit
                    </Link>
                    <button
                      onClick={() => handleDeleteClick(article)}
                      className="text-red-600 hover:text-red-900"
                    >
                      Hapus
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Articles List - Mobile Card View */}
        <div className="md:hidden space-y-4">
          {articles.map((article) => (
            <div
              key={article.id}
              className="bg-white dark:bg-slate-800 rounded-lg shadow p-4 border border-slate-200 dark:border-slate-600"
            >
              <div className="flex justify-between items-start mb-2">
                <h3 className="text-lg font-medium text-slate-900 dark:text-white truncate flex-1 mr-2">
                  {article.title}
                </h3>
                <span
                  className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full flex-shrink-0 ${
                    article.status === "published"
                      ? "bg-green-100 text-green-800"
                      : "bg-slate-100 text-slate-800"
                  }`}
                >
                  {article.status === "published" ? "Dipublikasikan" : "Draft"}
                </span>
              </div>
              <div className="text-sm text-slate-500 dark:text-slate-400 mb-3">
                <p>Dibuat: {formatDate(article.created_at)}</p>
                <p>
                  Dipublikasikan:{" "}
                  {article.published_at
                    ? formatDate(article.published_at)
                    : "-"}
                </p>
              </div>
              <div className="flex justify-end space-x-2">
                <Link
                  href={`/admin/blog/edit/${article.id}`}
                  className="px-3 py-1 bg-indigo-600 text-white rounded hover:bg-indigo-700 text-sm"
                >
                  Edit
                </Link>
                <button
                  onClick={() => handleDeleteClick(article)}
                  className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700 text-sm"
                >
                  Hapus
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Empty State */}
        {articles.length === 0 && (
          <div className="text-center py-12">
            <svg
              className="mx-auto h-12 w-12 text-slate-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-slate-900 dark:text-white">
              Tidak ada artikel
            </h3>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              {filter === "all"
                ? "Belum ada artikel yang dibuat."
                : `Tidak ada artikel dengan status "${
                    filter === "published" ? "Dipublikasikan" : "Draft"
                  }".`}
            </p>
            <div className="mt-6">
              <Link
                href="/admin/blog/new"
                className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary hover:bg-primary/80 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
              >
                <svg
                  className="-ml-1 mr-2 h-5 w-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 4v16m8-8H4"
                  />
                </svg>
                Tulis Artikel Baru
              </Link>
            </div>
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={deleteModal.isOpen}
        onClose={() =>
          setDeleteModal({ isOpen: false, articleId: 0, articleTitle: "" })
        }
        title="Konfirmasi Hapus Artikel"
        size="sm"
      >
        <div className="text-center">
          <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
            <svg
              className="h-6 w-6 text-red-600"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.314 16.5c-.77.833.192 2.5 1.732 2.5z"
              />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-slate-900 mb-2">
            Hapus Artikel?
          </h3>
          <p className="text-sm text-slate-500 mb-4">
            Apakah Anda yakin ingin menghapus artikel "
            <strong>{deleteModal.articleTitle}</strong>"? Tindakan ini tidak
            dapat dibatalkan.
          </p>
          <div className="flex justify-center space-x-3">
            <button
              type="button"
              className="px-4 py-2 bg-slate-200 text-slate-700 rounded-md hover:bg-slate-300 focus:outline-none focus:ring-2 focus:ring-slate-500"
              onClick={() =>
                setDeleteModal({
                  isOpen: false,
                  articleId: 0,
                  articleTitle: "",
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
