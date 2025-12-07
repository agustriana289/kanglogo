"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import Link from "next/link";
import { useAlert } from "@/components/providers/AlertProvider";
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
  MagnifyingGlassIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
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

// Items per page
const ITEMS_PER_PAGE = 20;

export default function CommentsPage() {
  const [comments, setComments] = useState<Comment[]>([]);
  const [filteredComments, setFilteredComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const { showAlert, showConfirm } = useAlert();

  // Calculate total pages
  const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE);

  // Calculate the range of items to display
  const indexOfLastItem = currentPage * ITEMS_PER_PAGE;
  const indexOfFirstItem = indexOfLastItem - ITEMS_PER_PAGE;
  const currentItems = filteredComments.slice(
    indexOfFirstItem,
    indexOfLastItem
  );

  useEffect(() => {
    fetchComments();
  }, [filter]);

  useEffect(() => {
    // Filter comments based on search query
    if (searchQuery.trim() === "") {
      setFilteredComments(comments);
    } else {
      const filtered = comments.filter(
        (comment) =>
          comment.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          comment.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
          comment.content.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredComments(filtered);
    }
    // Reset to first page when search changes
    setCurrentPage(1);
  }, [searchQuery, comments]);

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
        showAlert("error", "Error", "Gagal memuat komentar");
      } else {
        setComments(data || []);
        setFilteredComments(data || []);
        setTotalItems(data?.length || 0);
      }
    } catch (error) {
      console.error("Error fetching comments:", error);
      showAlert("error", "Error", "Terjadi kesalahan saat memuat komentar");
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
        showAlert("error", "Gagal", "Gagal mengupdate status komentar");
      } else {
        showAlert("success", "Berhasil", "Status komentar berhasil diupdate");

        const updatedComments = comments.map((c) =>
          c.id === commentId ? { ...c, status } : c
        );
        setComments(updatedComments);

        // Update filtered comments if needed
        if (searchQuery.trim() === "" && filter === "all") {
          setFilteredComments(updatedComments);
        } else {
          // Reapply filters
          let filtered = updatedComments;

          if (filter !== "all") {
            filtered = filtered.filter((c) => c.status === filter);
          }

          if (searchQuery.trim() !== "") {
            filtered = filtered.filter(
              (comment) =>
                comment.name
                  .toLowerCase()
                  .includes(searchQuery.toLowerCase()) ||
                comment.email
                  .toLowerCase()
                  .includes(searchQuery.toLowerCase()) ||
                comment.content
                  .toLowerCase()
                  .includes(searchQuery.toLowerCase())
            );
          }

          setFilteredComments(filtered);
        }

        // INTEGRASI NOTIFIKASI: Buat notifikasi jika komentar disetujui
        if (status === "approved") {
          await createCommentNotification(commentId);
        }
      }
    } catch (error) {
      console.error("Error updating comment:", error);
      showAlert("error", "Gagal", "Terjadi kesalahan");
    }
  };

  const deleteComment = async (commentId: number) => {
    const isConfirmed = await showConfirm(
      "Hapus Komentar",
      "Apakah Anda yakin ingin menghapus komentar ini?",
      "error",
      "Ya, Hapus"
    );
    if (!isConfirmed) {
      return;
    }

    try {
      const { error } = await supabase
        .from("comments")
        .delete()
        .eq("id", commentId);

      if (error) {
        console.error("Error deleting comment:", error);
        showAlert("error", "Gagal", "Gagal menghapus komentar");
      } else {
        showAlert("success", "Berhasil", "Komentar berhasil dihapus");

        const updatedComments = comments.filter((c) => c.id !== commentId);
        setComments(updatedComments);
        setTotalItems(updatedComments.length);

        // Update filtered comments if needed
        if (searchQuery.trim() === "" && filter === "all") {
          setFilteredComments(updatedComments);
        } else {
          // Reapply filters
          let filtered = updatedComments;

          if (filter !== "all") {
            filtered = filtered.filter((c) => c.status === filter);
          }

          if (searchQuery.trim() !== "") {
            filtered = filtered.filter(
              (comment) =>
                comment.name
                  .toLowerCase()
                  .includes(searchQuery.toLowerCase()) ||
                comment.email
                  .toLowerCase()
                  .includes(searchQuery.toLowerCase()) ||
                comment.content
                  .toLowerCase()
                  .includes(searchQuery.toLowerCase())
            );
          }

          setFilteredComments(filtered);
        }
      }
    } catch (error) {
      console.error("Error deleting comment:", error);
      showAlert("error", "Gagal", "Terjadi kesalahan");
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
            <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
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

            <div className="relative w-full sm:w-auto">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <MagnifyingGlassIcon className="h-5 w-5 text-slate-400" />
              </div>
              <input
                type="text"
                className="block w-full sm:w-64 pl-10 pr-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-500 dark:placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                placeholder="Cari komentar..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* Filter Section - Diperbaiki */}
        <div className="flex flex-wrap gap-2 mb-6 p-1 bg-slate-100 dark:bg-slate-800 rounded-lg">
          <button
            onClick={() => setFilter("all")}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${filter === "all"
                ? "bg-white dark:bg-slate-700 text-primary shadow-sm"
                : "text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white"
              }`}
          >
            Semua ({comments.length})
          </button>
          <button
            onClick={() => setFilter("approved")}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${filter === "approved"
                ? "bg-white dark:bg-slate-700 text-primary shadow-sm"
                : "text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white"
              }`}
          >
            Disetujui ({comments.filter((c) => c.status === "approved").length})
          </button>
          <button
            onClick={() => setFilter("pending")}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${filter === "pending"
                ? "bg-white dark:bg-slate-700 text-primary shadow-sm"
                : "text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white"
              }`}
          >
            Menunggu ({comments.filter((c) => c.status === "pending").length})
          </button>
          <button
            onClick={() => setFilter("rejected")}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${filter === "rejected"
                ? "bg-white dark:bg-slate-700 text-primary shadow-sm"
                : "text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white"
              }`}
          >
            Ditolak ({comments.filter((c) => c.status === "rejected").length})
          </button>
        </div>

        {/* Items Count */}
        <div className="mb-4 text-sm text-slate-600 dark:text-slate-400">
          Menampilkan {indexOfFirstItem + 1}-
          {Math.min(indexOfLastItem, filteredComments.length)} dari{" "}
          {filteredComments.length} komentar
        </div>

        {currentItems.length === 0 ? (
          <div className="text-center py-12">
            <ChatBubbleLeftIcon className="mx-auto h-12 w-12 text-slate-400" />
            <h3 className="mt-2 text-sm font-medium text-slate-900 dark:text-white">
              {searchQuery
                ? "Tidak ada komentar yang ditemukan"
                : "Tidak ada komentar"}
            </h3>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              {searchQuery
                ? "Coba ubah kata kunci pencarian Anda."
                : filter === "all"
                  ? "Belum ada komentar yang dibuat."
                  : `Tidak ada komentar dengan status "${filter === "approved"
                    ? "Disetujui"
                    : filter === "pending"
                      ? "Menunggu"
                      : "Ditolak"
                  }".`}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {currentItems.map((comment) => (
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
                    className={`px-3 py-2 rounded-md border ${currentPage === page
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

    </div>
  );
}
