"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import Link from "next/link";
import { useToast } from "@/hooks/useToast";
import Toast from "@/components/Toast";
import { createCommentNotification } from "@/lib/notifications";
import LogoLoading from "@/components/LogoLoading";
import {
  ArrowLeftIcon,
  CheckIcon,
  XMarkIcon,
  ClockIcon,
  TrashIcon,
  ChatBubbleLeftIcon,
  FolderIcon,
  ExclamationTriangleIcon,
} from "@heroicons/react/24/outline";
import { CheckIcon as CheckSolidIcon } from "@heroicons/react/24/solid";

interface Comment {
  id: number;
  article_id: number;
  parent_id: number | null;
  name: string;
  email: string;
  website: string;
  content: string;
  status: string;
  created_at: string;
}

export default function CommentsPage() {
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const { toast, showToast, hideToast } = useToast();

  useEffect(() => {
    fetchComments();
  }, [filter]);

  const fetchComments = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from("comments")
        .select("*")
        .order("created_at", { ascending: false });

      if (filter !== "all") {
        query = query.eq("status", filter);
      }

      const { data, error } = await query;

      if (error) {
        console.error("Error fetching comments:", error);
        showToast("Gagal memuat komentar", "error");
      } else {
        setComments(data || []);
      }
    } catch (error) {
      console.error("Error fetching comments:", error);
      showToast("Terjadi kesalahan saat memuat komentar", "error");
    } finally {
      setLoading(false);
    }
  };

  const updateCommentStatus = async (commentId: number, status: string) => {
    try {
      const { error } = await supabase
        .from("comments")
        .update({ status })
        .eq("id", commentId);

      if (error) {
        console.error("Error updating comment:", error);
        showToast("Gagal mengupdate status komentar", "error");
      } else {
        showToast("Status komentar berhasil diupdate", "success");
        setComments(
          comments.map((c) => (c.id === commentId ? { ...c, status } : c))
        );

        // INTEGRASI NOTIFIKASI: Buat notifikasi jika komentar disetujui
        if (status === "approved") {
          await createCommentNotification(commentId);
        }
      }
    } catch (error) {
      console.error("Error updating comment:", error);
      showToast("Terjadi kesalahan", "error");
    }
  };

  const deleteComment = async (commentId: number) => {
    if (!confirm("Apakah Anda yakin ingin menghapus komentar ini?")) {
      return;
    }

    try {
      const { error } = await supabase
        .from("comments")
        .delete()
        .eq("id", commentId);

      if (error) {
        console.error("Error deleting comment:", error);
        showToast("Gagal menghapus komentar", "error");
      } else {
        showToast("Komentar berhasil dihapus", "success");
        setComments(comments.filter((c) => c.id !== commentId));
      }
    } catch (error) {
      console.error("Error deleting comment:", error);
      showToast("Terjadi kesalahan", "error");
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

  const getStatusBadge = (status: string) => {
    const styles = {
      pending:
        "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400",
      approved:
        "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400",
      rejected: "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400",
    };
    return (
      styles[status as keyof typeof styles] ||
      "bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400"
    );
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "approved":
        return <CheckSolidIcon className="h-4 w-4" />;
      case "rejected":
        return <XMarkIcon className="h-4 w-4" />;
      case "pending":
      default:
        return <ClockIcon className="h-4 w-4" />;
    }
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
              href="/admin/categories"
              className="inline-flex items-center px-4 py-2 bg-slate-100 dark:bg-slate-600 text-slate-700 dark:text-slate-200 rounded-md hover:bg-slate-200 dark:hover:bg-slate-500 transition-colors"
            >
              <FolderIcon className="w-4 h-4 mr-2" />
              Kategori
            </Link>
          </div>
        </div>

        {/* Filter Section - Diperbaiki */}
        <div className="flex flex-wrap gap-2 mb-6 p-1 bg-slate-100 dark:bg-slate-800 rounded-lg">
          <button
            onClick={() => setFilter("all")}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              filter === "all"
                ? "bg-white dark:bg-slate-700 text-primary shadow-sm"
                : "text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white"
            }`}
          >
            Semua ({comments.length})
          </button>
          <button
            onClick={() => setFilter("approved")}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              filter === "approved"
                ? "bg-white dark:bg-slate-700 text-primary shadow-sm"
                : "text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white"
            }`}
          >
            Disetujui ({comments.filter((c) => c.status === "approved").length})
          </button>
          <button
            onClick={() => setFilter("pending")}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              filter === "pending"
                ? "bg-white dark:bg-slate-700 text-primary shadow-sm"
                : "text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white"
            }`}
          >
            Menunggu ({comments.filter((c) => c.status === "pending").length})
          </button>
          <button
            onClick={() => setFilter("rejected")}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              filter === "rejected"
                ? "bg-white dark:bg-slate-700 text-primary shadow-sm"
                : "text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white"
            }`}
          >
            Ditolak ({comments.filter((c) => c.status === "rejected").length})
          </button>
        </div>

        {comments.length === 0 ? (
          <div className="text-center py-12">
            <ChatBubbleLeftIcon className="mx-auto h-12 w-12 text-slate-400" />
            <h3 className="mt-2 text-sm font-medium text-slate-900 dark:text-white">
              Tidak ada komentar
            </h3>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              {filter === "all"
                ? "Belum ada komentar yang dibuat."
                : `Tidak ada komentar dengan status "${
                    filter === "approved"
                      ? "Disetujui"
                      : filter === "pending"
                      ? "Menunggu"
                      : "Ditolak"
                  }".`}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {comments.map((comment) => (
              <div
                key={comment.id}
                className="border border-slate-200 dark:border-slate-600 rounded-lg p-4 bg-white dark:bg-slate-800 shadow-sm"
              >
                <div className="flex justify-between items-start mb-2">
                  <div className="flex items-start">
                    <div className="flex-shrink-0 mr-3">
                      <div className="h-10 w-10 rounded-full bg-slate-200 dark:bg-slate-600 flex items-center justify-center">
                        <span className="text-sm font-medium text-slate-600 dark:text-slate-300">
                          {comment.name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                    </div>
                    <div>
                      <h3 className="font-semibold text-slate-900 dark:text-white">
                        {comment.name}
                      </h3>
                      <p className="text-sm text-slate-500 dark:text-slate-400">
                        {comment.email}
                      </p>
                      {comment.website && (
                        <a
                          href={comment.website}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-blue-500 hover:underline flex items-center"
                        >
                          {comment.website}
                        </a>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center">
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBadge(
                        comment.status
                      )}`}
                    >
                      <span className="mr-1">
                        {getStatusIcon(comment.status)}
                      </span>
                      {comment.status === "approved"
                        ? "Disetujui"
                        : comment.status === "rejected"
                        ? "Ditolak"
                        : "Menunggu"}
                    </span>
                  </div>
                </div>

                <div className="ml-13">
                  <p className="text-slate-700 dark:text-slate-300 mb-3">
                    {comment.content}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mb-3 flex items-center">
                    <ClockIcon className="h-3 w-3 mr-1" />
                    {formatDate(comment.created_at)}
                  </p>

                  <div className="flex flex-wrap gap-2">
                    {comment.status !== "approved" && (
                      <button
                        onClick={() =>
                          updateCommentStatus(comment.id, "approved")
                        }
                        className="inline-flex items-center px-3 py-1.5 bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 rounded-md hover:bg-green-100 dark:hover:bg-green-900/30 transition-colors text-sm"
                      >
                        <CheckIcon className="h-4 w-4 mr-1" />
                        Setujui
                      </button>
                    )}
                    {comment.status !== "rejected" && (
                      <button
                        onClick={() =>
                          updateCommentStatus(comment.id, "rejected")
                        }
                        className="inline-flex items-center px-3 py-1.5 bg-yellow-50 dark:bg-yellow-900/20 text-yellow-600 dark:text-yellow-400 rounded-md hover:bg-yellow-100 dark:hover:bg-yellow-900/30 transition-colors text-sm"
                      >
                        <XMarkIcon className="h-4 w-4 mr-1" />
                        Tolak
                      </button>
                    )}
                    {comment.status !== "pending" && (
                      <button
                        onClick={() =>
                          updateCommentStatus(comment.id, "pending")
                        }
                        className="inline-flex items-center px-3 py-1.5 bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-md hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors text-sm"
                      >
                        <ClockIcon className="h-4 w-4 mr-1" />
                        Pending
                      </button>
                    )}
                    <button
                      onClick={() => deleteComment(comment.id)}
                      className="inline-flex items-center px-3 py-1.5 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-md hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors text-sm"
                    >
                      <TrashIcon className="h-4 w-4 mr-1" />
                      Hapus
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      <Toast
        show={toast.show}
        message={toast.message}
        type={toast.type}
        onClose={hideToast}
      />
    </div>
  );
}
