// app/admin/faq/page.tsx
"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/useToast";
import Toast from "@/components/Toast";
import LogoLoading from "@/components/LogoLoading";
// --- PERBAIKAN IMPORT IKON ---
import {
  PlusIcon, // DIPERBAIKI
  PencilIcon, // DIPERBAIKI
  TrashIcon, // DIPERBAIKI
  StarIcon, // DIPERBAIKI
  XMarkIcon, // DIPERBAIKI (sebagai pengganti StarOff)
  ChatBubbleLeftIcon, // DIPERBAIKI
  TagIcon, // DIPERBAIKI
  CheckCircleIcon, // DIPERBAIKI
  XCircleIcon, // DIPERBAIKI
  MagnifyingGlassIcon, // DITAMBAHKAN
  ChevronLeftIcon, // DITAMBAHKAN
  ChevronRightIcon, // DITAMBAHKAN
} from "@heroicons/react/24/outline";
import { StarIcon as StarSolid } from "@heroicons/react/24/solid";

interface FAQ {
  id: number;
  question: string;
  answer: string;
  category: string;
  featured: boolean;
  created_at: string;
  updated_at: string;
}

// Items per page
const ITEMS_PER_PAGE = 20;

export default function FAQManagementPage() {
  const [faqs, setFaqs] = useState<FAQ[]>([]);
  const [filteredFaqs, setFilteredFaqs] = useState<FAQ[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingFAQ, setEditingFAQ] = useState<FAQ | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [formData, setFormData] = useState({
    question: "",
    answer: "",
    category: "Umum",
    featured: false,
  });
  const { toast, showToast, hideToast } = useToast();

  // Calculate total pages
  const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE);

  // Calculate the range of items to display
  const indexOfLastItem = currentPage * ITEMS_PER_PAGE;
  const indexOfFirstItem = indexOfLastItem - ITEMS_PER_PAGE;
  const currentItems = filteredFaqs.slice(indexOfFirstItem, indexOfLastItem);

  useEffect(() => {
    fetchFAQs();
  }, []);

  useEffect(() => {
    // Filter FAQs based on search query
    if (searchQuery.trim() === "") {
      setFilteredFaqs(faqs);
    } else {
      const filtered = faqs.filter(
        (faq) =>
          faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
          faq.answer.toLowerCase().includes(searchQuery.toLowerCase()) ||
          faq.category.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredFaqs(filtered);
    }
    // Reset to first page when search changes
    setCurrentPage(1);
  }, [searchQuery, faqs]);

  const fetchFAQs = async () => {
    try {
      const { data, error } = await supabase
        .from("faqs")
        .select("*")
        .order("featured", { ascending: false })
        .order("created_at", { ascending: true });

      if (error) {
        console.error("Error fetching FAQs:", error);
        showToast("Gagal memuat FAQ", "error");
      } else {
        setFaqs(data || []);
        setFilteredFaqs(data || []);
        setTotalItems(data?.length || 0);
      }

      setLoading(false);
    } catch (error) {
      console.error("Error fetching FAQs:", error);
      showToast("Terjadi kesalahan saat memuat FAQ", "error");
      setLoading(false);
    }
  };

  const handleAddFAQ = () => {
    setEditingFAQ(null);
    setFormData({
      question: "",
      answer: "",
      category: "Umum",
      featured: false,
    });
    setShowModal(true);
  };

  const handleEditFAQ = (faq: FAQ) => {
    setEditingFAQ(faq);
    setFormData({
      question: faq.question,
      answer: faq.answer,
      category: faq.category || "Umum",
      featured: faq.featured,
    });
    setShowModal(true);
  };

  const handleDeleteFAQ = async (id: number) => {
    if (!confirm("Apakah Anda yakin ingin menghapus FAQ ini?")) return;

    setSaving(true);
    try {
      const { error } = await supabase.from("faqs").delete().eq("id", id);

      if (error) {
        throw error;
      }

      const updatedFaqs = faqs.filter((faq) => faq.id !== id);
      setFaqs(updatedFaqs);
      setTotalItems(updatedFaqs.length);

      // Update filtered FAQs if needed
      if (searchQuery.trim() === "") {
        setFilteredFaqs(updatedFaqs);
      } else {
        // Reapply filters
        const filtered = updatedFaqs.filter(
          (faq) =>
            faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
            faq.answer.toLowerCase().includes(searchQuery.toLowerCase()) ||
            faq.category.toLowerCase().includes(searchQuery.toLowerCase())
        );
        setFilteredFaqs(filtered);
      }

      showToast("FAQ berhasil dihapus!", "success");
    } catch (error) {
      console.error("Error deleting FAQ:", error);
      showToast("Gagal menghapus FAQ!", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleSaveFAQ = async () => {
    if (!formData.question.trim() || !formData.answer.trim()) {
      showToast("Pertanyaan dan jawaban tidak boleh kosong!", "error");
      return;
    }

    setSaving(true);
    try {
      if (editingFAQ) {
        const { error } = await supabase
          .from("faqs")
          .update({
            question: formData.question,
            answer: formData.answer,
            category: formData.category,
            featured: formData.featured,
          })
          .eq("id", editingFAQ.id);

        if (error) {
          throw error;
        }

        const updatedFaqs = faqs.map((faq) =>
          faq.id === editingFAQ.id ? { ...faq, ...formData } : faq
        );
        setFaqs(updatedFaqs);

        // Update filtered FAQs if needed
        if (searchQuery.trim() === "") {
          setFilteredFaqs(updatedFaqs);
        } else {
          // Reapply filters
          const filtered = updatedFaqs.filter(
            (faq) =>
              faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
              faq.answer.toLowerCase().includes(searchQuery.toLowerCase()) ||
              faq.category.toLowerCase().includes(searchQuery.toLowerCase())
          );
          setFilteredFaqs(filtered);
        }

        showToast("FAQ berhasil diperbarui!", "success");
      } else {
        const { data, error } = await supabase
          .from("faqs")
          .insert([formData])
          .select();

        if (error) {
          throw error;
        }

        const newFaqs = [...faqs, ...(data || [])];
        setFaqs(newFaqs);

        // Update filtered FAQs if needed
        if (searchQuery.trim() === "") {
          setFilteredFaqs(newFaqs);
        } else {
          // Reapply filters
          const filtered = newFaqs.filter(
            (faq) =>
              faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
              faq.answer.toLowerCase().includes(searchQuery.toLowerCase()) ||
              faq.category.toLowerCase().includes(searchQuery.toLowerCase())
          );
          setFilteredFaqs(filtered);
        }

        setTotalItems(newFaqs.length);
        showToast("FAQ berhasil ditambahkan!", "success");
      }

      setShowModal(false);
    } catch (error) {
      console.error("Error saving FAQ:", error);
      showToast("Gagal menyimpan FAQ!", "error");
    } finally {
      setSaving(false);
    }
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingFAQ(null);
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
            <button
              onClick={handleAddFAQ}
              className="inline-flex items-center px-4 py-2 bg-primary text-white font-medium rounded-lg shadow-sm hover:bg-primary/90 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
            >
              <PlusIcon className="h-5 w-5 mr-2" />
              Tambah FAQ
            </button>

            <div className="relative w-full sm:w-auto">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <MagnifyingGlassIcon className="h-5 w-5 text-slate-400" />
              </div>
              <input
                type="text"
                className="block w-full sm:w-64 pl-10 pr-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-500 dark:placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                placeholder="Cari FAQ..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* Items Count */}
        <div className="mb-4 text-sm text-slate-600 dark:text-slate-400">
          Menampilkan {indexOfFirstItem + 1}-
          {Math.min(indexOfLastItem, filteredFaqs.length)} dari{" "}
          {filteredFaqs.length} FAQ
        </div>

        <div className="hidden md:block overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-600">
            <thead className="bg-slate-50 dark:bg-slate-800">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-300 uppercase tracking-wider">
                  Pertanyaan
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-300 uppercase tracking-wider">
                  Jawaban
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-300 uppercase tracking-wider">
                  Kategori
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-300 uppercase tracking-wider">
                  Featured
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-300 uppercase tracking-wider">
                  Aksi
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-slate-700 divide-y divide-slate-200 dark:divide-slate-600">
              {currentItems.map((faq) => (
                <tr
                  key={faq.id}
                  className="hover:bg-slate-50 dark:hover:bg-slate-800/50"
                >
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900 dark:text-white">
                    <div className="flex items-center">
                      <ChatBubbleLeftIcon className="h-5 w-5 text-slate-400 mr-3" />
                      {faq.question}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-500 dark:text-slate-300">
                    <div className="max-w-xs truncate">
                      {faq.answer.length > 100
                        ? `${faq.answer.substring(0, 100)}...`
                        : faq.answer}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 dark:text-slate-300">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400">
                      <TagIcon className="h-4 w-4 mr-1" />
                      {faq.category || "Umum"}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 dark:text-slate-300">
                    {faq.featured ? (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400">
                        <StarSolid className="h-4 w-4 mr-1" />
                        Ya
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-800 dark:bg-slate-900/20 dark:text-slate-400">
                        <XMarkIcon className="h-4 w-4 mr-1" />
                        Tidak
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleEditFAQ(faq)}
                        className="inline-flex items-center px-3 py-1.5 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 rounded-md hover:bg-indigo-100 dark:hover:bg-indigo-900/30 transition-colors"
                      >
                        <PencilIcon className="h-4 w-4 mr-1" />
                        Edit
                      </button>
                      <button
                        onClick={() => handleDeleteFAQ(faq.id)}
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

        <div className="md:hidden space-y-4">
          {currentItems.map((faq) => (
            <div
              key={faq.id}
              className="bg-white dark:bg-slate-800 rounded-lg shadow p-4 border border-slate-200 dark:border-slate-600"
            >
              <div className="flex justify-between items-start mb-3">
                <div className="flex items-start">
                  <ChatBubbleLeftIcon className="h-5 w-5 text-slate-400 mr-3 mt-0.5" />
                  <div className="flex-1">
                    <h3 className="text-lg font-medium text-slate-900 dark:text-white">
                      {faq.question}
                    </h3>
                  </div>
                </div>
                {faq.featured ? (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400">
                    <StarSolid className="h-4 w-4 mr-1" />
                    Ya
                  </span>
                ) : (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-800 dark:bg-slate-900/20 dark:text-slate-400">
                    <XMarkIcon className="h-4 w-4 mr-1" />
                    Tidak
                  </span>
                )}
              </div>
              <div className="ml-8">
                <p className="text-sm text-slate-500 dark:text-slate-400 mb-3">
                  {faq.answer.length > 100
                    ? `${faq.answer.substring(0, 100)}...`
                    : faq.answer}
                </p>
                <div className="flex items-center justify-between mb-3">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400">
                    <TagIcon className="h-4 w-4 mr-1" />
                    {faq.category || "Umum"}
                  </span>
                </div>
                <div className="flex justify-end space-x-2">
                  <button
                    onClick={() => handleEditFAQ(faq)}
                    className="inline-flex items-center px-3 py-1.5 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 rounded-md hover:bg-indigo-100 dark:hover:bg-indigo-900/30 transition-colors"
                  >
                    <PencilIcon className="h-4 w-4 mr-1" />
                    Edit
                  </button>
                  <button
                    onClick={() => handleDeleteFAQ(faq.id)}
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
            <ChatBubbleLeftIcon className="mx-auto h-12 w-12 text-slate-400" />
            <h3 className="mt-2 text-sm font-medium text-slate-900 dark:text-white">
              {searchQuery ? "Tidak ada FAQ yang ditemukan" : "Tidak ada FAQ"}
            </h3>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              {searchQuery
                ? "Coba ubah kata kunci pencarian Anda."
                : "Belum ada FAQ yang dibuat."}
            </p>
            {!searchQuery && (
              <div className="mt-6">
                <button
                  onClick={handleAddFAQ}
                  className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary hover:bg-primary/80 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
                >
                  <PlusIcon className="-ml-1 mr-2 h-5 w-5" />
                  Tambah FAQ Baru
                </button>
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

        {showModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-slate-700 rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-4">
                {editingFAQ ? "Edit FAQ" : "Tambah FAQ Baru"}
              </h2>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Pertanyaan
                  </label>
                  <input
                    type="text"
                    className="block w-full rounded-md border-slate-300 dark:border-slate-600 shadow-sm p-2 border dark:bg-slate-800 dark:text-white"
                    value={formData.question}
                    onChange={(e) =>
                      setFormData({ ...formData, question: e.target.value })
                    }
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Jawaban
                  </label>
                  <textarea
                    rows={6}
                    className="block w-full rounded-md border-slate-300 dark:border-slate-600 shadow-sm p-2 border dark:bg-slate-800 dark:text-white"
                    value={formData.answer}
                    onChange={(e) =>
                      setFormData({ ...formData, answer: e.target.value })
                    }
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Kategori
                  </label>
                  <select
                    className="block w-full rounded-md border-slate-300 dark:border-slate-600 shadow-sm p-2 border dark:bg-slate-800 dark:text-white"
                    value={formData.category}
                    onChange={(e) =>
                      setFormData({ ...formData, category: e.target.value })
                    }
                  >
                    <option value="Umum">Umum</option>
                    <option value="Desain Logo">Desain Logo</option>
                    <option value="Desain Banner">Desain Banner</option>
                    <option value="Desain Grafis">Desain Grafis</option>
                    <option value="Desain Website">Desain Website</option>
                  </select>
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="featured"
                    className="h-4 w-4 text-primary focus:ring-primary border-slate-300 rounded"
                    checked={formData.featured}
                    onChange={(e) =>
                      setFormData({ ...formData, featured: e.target.checked })
                    }
                  />
                  <label
                    htmlFor="featured"
                    className="ml-2 block text-sm text-slate-900 dark:text-white"
                  >
                    Tampilkan di beranda (featured)
                  </label>
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-6 pt-6 border-t border-slate-200 dark:border-slate-600">
                <button
                  onClick={closeModal}
                  className="px-4 py-2 bg-slate-200 dark:bg-slate-600 text-slate-700 dark:text-slate-200 rounded-md hover:bg-slate-300 dark:hover:bg-slate-500"
                  disabled={saving}
                >
                  Batal
                </button>
                <button
                  onClick={handleSaveFAQ}
                  disabled={saving}
                  className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/90 disabled:opacity-50"
                >
                  {saving ? "Menyimpan..." : "Simpan"}
                </button>
              </div>
            </div>
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
