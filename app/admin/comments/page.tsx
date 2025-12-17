"use client";

import { useState, useEffect, useRef } from "react";
import { supabase } from "@/lib/supabase";
import Link from "next/link";
import { useAlert } from "@/components/providers/AlertProvider";
import { createCommentNotification } from "@/lib/notifications";
import LogoPathAnimation from "@/components/LogoPathAnimation";
import {
  ArrowLeftIcon,
  CheckIcon,
  XMarkIcon,
  ClockIcon,
  TrashIcon,
  ChatBubbleLeftIcon,
  FolderIcon,
  MagnifyingGlassIcon,
  ChevronDownIcon,
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
  const [filteredComments, setFilteredComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"all" | "approved" | "pending" | "rejected">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [pageDropdownOpen, setPageDropdownOpen] = useState(false);
  const pageDropdownRef = useRef<HTMLDivElement>(null);
  const { showAlert, showConfirm } = useAlert();

  // Stats
  const stats = {
    total: comments.length,
    approved: comments.filter(c => c.status === "approved").length,
    pending: comments.filter(c => c.status === "pending").length,
    rejected: comments.filter(c => c.status === "rejected").length,
  };

  // Pagination
  const totalPages = Math.ceil(filteredComments.length / itemsPerPage);
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredComments.slice(indexOfFirstItem, indexOfLastItem);

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
    fetchComments();
  }, []);

  useEffect(() => {
    // Filter comments based on search query and tab
    let filtered = comments;

    // Filter by status tab
    if (activeTab !== "all") {
      filtered = filtered.filter(c => c.status === activeTab);
    }

    // Filter by search query
    if (searchQuery.trim() !== "") {
      filtered = filtered.filter(
        (comment) =>
          comment.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          comment.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
          comment.content.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    setFilteredComments(filtered);
    setCurrentPage(1);
  }, [searchQuery, comments, activeTab]);

  const fetchComments = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("comments")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching comments:", error);
        showAlert("error", "Error", "Gagal memuat komentar");
      } else {
        setComments(data || []);
        setFilteredComments(data || []);
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
        fetchComments();

        // Create notification if comment is approved
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
        fetchComments();
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
              onClick={() => setActiveTab("approved")}
              className={`text-sm h-10 rounded-md px-3 py-2 font-medium transition-all ${activeTab === "approved"
                  ? "shadow-sm text-gray-900 dark:text-white bg-white dark:bg-gray-800"
                  : "text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
                }`}
            >
              Disetujui ({stats.approved})
            </button>
            <button
              onClick={() => setActiveTab("pending")}
              className={`text-sm h-10 rounded-md px-3 py-2 font-medium transition-all ${activeTab === "pending"
                  ? "shadow-sm text-gray-900 dark:text-white bg-white dark:bg-gray-800"
                  : "text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
                }`}
            >
              Menunggu ({stats.pending})
            </button>
            <button
              onClick={() => setActiveTab("rejected")}
              className={`text-sm h-10 rounded-md px-3 py-2 font-medium transition-all ${activeTab === "rejected"
                  ? "shadow-sm text-gray-900 dark:text-white bg-white dark:bg-gray-800"
                  : "text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
                }`}
            >
              Ditolak ({stats.rejected})
            </button>
          </div>

          {/* Right: Search and Navigation */}
          <div className="flex flex-col sm:flex-row gap-3">
            {/* Search */}
            <div className="relative">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Cari komentar..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 pr-4 py-3 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary w-full sm:w-48"
              />
            </div>

            {/* Navigation Links */}
            <Link
              href="/admin/blog"
              className="inline-flex items-center justify-center px-4 py-3 bg-slate-100 dark:bg-slate-600 text-slate-700 dark:text-slate-200 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-500 transition-colors text-sm font-medium"
            >
              <ArrowLeftIcon className="w-4 h-4 mr-2" />
              Blogs
            </Link>
            <Link
              href="/admin/categories"
              className="inline-flex items-center justify-center px-4 py-3 bg-slate-100 dark:bg-slate-600 text-slate-700 dark:text-slate-200 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-500 transition-colors text-sm font-medium"
            >
              <FolderIcon className="w-4 h-4 mr-2" />
              Kategori
            </Link>
          </div>
        </div>
      </div>

      {/* Content */}
      {currentItems.length === 0 ? (
        <div className="text-center py-12 bg-white dark:bg-slate-800 rounded-xl border border-dashed border-gray-300 dark:border-gray-700">
          <ChatBubbleLeftIcon className="h-12 w-12 mx-auto text-gray-300 dark:text-gray-600 mb-3" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">
            {searchQuery
              ? "Tidak ada komentar yang ditemukan"
              : "Tidak ada komentar"}
          </h3>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            {searchQuery
              ? "Coba ubah kata kunci pencarian Anda."
              : activeTab === "all"
                ? "Belum ada komentar yang dibuat."
                : `Tidak ada komentar dengan status "${activeTab === "approved"
                  ? "Disetujui"
                  : activeTab === "pending"
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
              className="border border-gray-200 dark:border-gray-700 rounded-xl p-4 bg-white dark:bg-slate-800 shadow-sm"
            >
              <div className="flex justify-between items-start mb-2">
                <div className="flex items-start flex-1">
                  <div className="flex-shrink-0 mr-3">
                    <div className="h-10 w-10 rounded-full bg-slate-200 dark:bg-slate-600 flex items-center justify-center">
                      <span className="text-sm font-medium text-slate-600 dark:text-slate-300">
                        {comment.name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                  </div>
                  <div className="flex-1">
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
                        className="text-sm text-blue-500 hover:underline"
                      >
                        {comment.website}
                      </a>
                    )}
                  </div>
                </div>
                <div className="flex items-center ml-2">
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
      {filteredComments.length > 0 && (
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
