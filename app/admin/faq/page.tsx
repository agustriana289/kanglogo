// app/admin/faq/page.tsx
"use client";

import { useState, useEffect, useRef } from "react";
import { supabase } from "@/lib/supabase";
import { useAlert } from "@/components/providers/AlertProvider";
import LogoPathAnimation from "@/components/LogoPathAnimation";
import {
  PlusIcon,
  PencilIcon,
  TrashIcon,
  StarIcon,
  XMarkIcon,
  ChatBubbleLeftIcon,
  TagIcon,
  MagnifyingGlassIcon,
  ChevronDownIcon,
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

export default function FAQManagementPage() {
  const [faqs, setFaqs] = useState<FAQ[]>([]);
  const [filteredFaqs, setFilteredFaqs] = useState<FAQ[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingFAQ, setEditingFAQ] = useState<FAQ | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [pageDropdownOpen, setPageDropdownOpen] = useState(false);
  const pageDropdownRef = useRef<HTMLDivElement>(null);
  const [activeTab, setActiveTab] = useState<"all" | "featured" | "not-featured">("all");
  const [selectedCategory, setSelectedCategory] = useState<string>("");

  const [formData, setFormData] = useState({
    question: "",
    answer: "",
    category: "Umum",
    featured: false,
  });

  const { showAlert, showConfirm } = useAlert();

  // Stats
  const stats = {
    total: faqs.length,
    featured: faqs.filter(f => f.featured).length,
    notFeatured: faqs.filter(f => !f.featured).length,
  };

  // Get unique categories
  const categories = Array.from(new Set(faqs.map(f => f.category).filter(Boolean)));

  // Pagination
  const totalPages = Math.ceil(filteredFaqs.length / itemsPerPage);
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredFaqs.slice(indexOfFirstItem, indexOfLastItem);

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
    fetchFAQs();
  }, []);

  useEffect(() => {
    // Filter FAQs based on search query, tab, and category
    let filtered = faqs;

    // Filter by featured tab
    if (activeTab === "featured") {
      filtered = filtered.filter(faq => faq.featured);
    } else if (activeTab === "not-featured") {
      filtered = filtered.filter(faq => !faq.featured);
    }

    // Filter by category
    if (selectedCategory) {
      filtered = filtered.filter(faq => faq.category === selectedCategory);
    }

    // Filter by search query
    if (searchQuery.trim() !== "") {
      filtered = filtered.filter(
        (faq) =>
          faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
          faq.answer.toLowerCase().includes(searchQuery.toLowerCase()) ||
          faq.category.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    setFilteredFaqs(filtered);
    setCurrentPage(1);
  }, [searchQuery, faqs, activeTab, selectedCategory]);

  const fetchFAQs = async () => {
    try {
      const { data, error } = await supabase
        .from("faqs")
        .select("*")
        .order("featured", { ascending: false })
        .order("created_at", { ascending: true });

      if (error) {
        console.error("Error fetching FAQs:", error);
        showAlert("error", "Error", "Gagal memuat FAQ");
      } else {
        setFaqs(data || []);
        setFilteredFaqs(data || []);
      }

      setLoading(false);
    } catch (error) {
      console.error("Error fetching FAQs:", error);
      showAlert("error", "Error", "Terjadi kesalahan saat memuat FAQ");
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
    const confirmed = await showConfirm(
      "Hapus FAQ",
      "Apakah Anda yakin ingin menghapus FAQ ini?",
      "error",
      "Ya, Hapus"
    );
    if (!confirmed) return;

    setSaving(true);
    try {
      const { error } = await supabase.from("faqs").delete().eq("id", id);

      if (error) {
        throw error;
      }

      fetchFAQs();
      showAlert("success", "Berhasil", "FAQ berhasil dihapus!");
    } catch (error) {
      console.error("Error deleting FAQ:", error);
      showAlert("error", "Gagal", "Gagal menghapus FAQ!");
    } finally {
      setSaving(false);
    }
  };

  const handleSaveFAQ = async () => {
    if (!formData.question.trim() || !formData.answer.trim()) {
      showAlert("warning", "Validasi", "Pertanyaan dan jawaban tidak boleh kosong!");
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

        showAlert("success", "Berhasil", "FAQ berhasil diperbarui!");
      } else {
        const { error } = await supabase
          .from("faqs")
          .insert([formData]);

        if (error) {
          throw error;
        }

        showAlert("success", "Berhasil", "FAQ berhasil ditambahkan!");
      }

      fetchFAQs();
      setShowModal(false);
    } catch (error) {
      console.error("Error saving FAQ:", error);
      showAlert("error", "Gagal", "Gagal menyimpan FAQ!");
    } finally {
      setSaving(false);
    }
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingFAQ(null);
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
              onClick={() => setActiveTab("featured")}
              className={`text-sm h-10 rounded-md px-3 py-2 font-medium transition-all ${activeTab === "featured"
                  ? "shadow-sm text-gray-900 dark:text-white bg-white dark:bg-gray-800"
                  : "text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
                }`}
            >
              Featured ({stats.featured})
            </button>
            <button
              onClick={() => setActiveTab("not-featured")}
              className={`text-sm h-10 rounded-md px-3 py-2 font-medium transition-all ${activeTab === "not-featured"
                  ? "shadow-sm text-gray-900 dark:text-white bg-white dark:bg-gray-800"
                  : "text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
                }`}
            >
              Tidak Featured ({stats.notFeatured})
            </button>
          </div>

          {/* Right: Search, Category Filter, and Add Button */}
          <div className="flex flex-col sm:flex-row gap-3">
            {/* Search */}
            <div className="relative">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Cari FAQ..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 pr-4 py-3 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary w-full sm:w-48"
              />
            </div>

            {/* Category Filter */}
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="h-11 px-4 py-2 text-sm border border-gray-300 rounded-lg bg-white hover:bg-gray-50 focus:ring-2 focus:ring-primary focus:border-primary transition-all text-gray-700"
            >
              <option value="">Semua Kategori</option>
              {categories.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>

            {/* Add Button */}
            <button
              onClick={handleAddFAQ}
              className="inline-flex items-center justify-center px-4 py-3 bg-primary text-white font-medium rounded-lg shadow-sm hover:bg-primary/90 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
            >
              <PlusIcon className="h-5 w-5 mr-2" />
              Tambah FAQ
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      {currentItems.length === 0 ? (
        <div className="text-center py-12 bg-white dark:bg-slate-800 rounded-xl border border-dashed border-gray-300 dark:border-gray-700">
          <ChatBubbleLeftIcon className="h-12 w-12 mx-auto text-gray-300 dark:text-gray-600 mb-3" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">
            {searchQuery ? "Tidak ada FAQ yang ditemukan" : "Tidak ada FAQ"}
          </h3>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            {searchQuery
              ? "Coba ubah kata kunci pencarian Anda."
              : "Belum ada FAQ yang dibuat."}
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
                    <th className="px-6 py-4 rounded-tl-lg">Pertanyaan</th>
                    <th className="px-6 py-4">Jawaban</th>
                    <th className="px-6 py-4">Kategori</th>
                    <th className="px-6 py-4">Featured</th>
                    <th className="px-6 py-4 text-right rounded-tr-lg">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                  {currentItems.map((faq) => (
                    <tr
                      key={faq.id}
                      className="hover:bg-gray-50 dark:hover:bg-slate-800/50 transition"
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center">
                          <ChatBubbleLeftIcon className="h-5 w-5 text-gray-400 mr-3 flex-shrink-0" />
                          <span className="font-medium text-gray-900 dark:text-white">
                            {faq.question}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="max-w-xs text-gray-500 dark:text-gray-300 truncate">
                          {faq.answer.length > 100
                            ? `${faq.answer.substring(0, 100)}...`
                            : faq.answer}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400">
                          <TagIcon className="h-4 w-4 mr-1" />
                          {faq.category || "Umum"}
                        </span>
                      </td>
                      <td className="px-6 py-4">
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
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleEditFAQ(faq)}
                            className="p-2 text-gray-400 hover:text-blue-500 hover:bg-blue-50 rounded-lg transition"
                            title="Edit"
                          >
                            <PencilIcon className="w-5 h-5" />
                          </button>
                          <button
                            onClick={() => handleDeleteFAQ(faq.id)}
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
            {currentItems.map((faq) => (
              <div
                key={faq.id}
                className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden"
              >
                <div className="p-4">
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex items-start flex-1">
                      <ChatBubbleLeftIcon className="h-5 w-5 text-gray-400 mr-3 mt-0.5 flex-shrink-0" />
                      <h3 className="font-medium text-gray-900 dark:text-white">
                        {faq.question}
                      </h3>
                    </div>
                    {faq.featured && (
                      <StarSolid className="h-5 w-5 text-green-500 flex-shrink-0 ml-2" />
                    )}
                  </div>

                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-3 ml-8">
                    {faq.answer.length > 100
                      ? `${faq.answer.substring(0, 100)}...`
                      : faq.answer}
                  </p>

                  <div className="flex items-center justify-between pt-3 border-t border-gray-100 dark:border-gray-700">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400">
                      <TagIcon className="h-4 w-4 mr-1" />
                      {faq.category || "Umum"}
                    </span>

                    <div className="flex gap-2">
                      <button
                        onClick={() => handleEditFAQ(faq)}
                        className="p-2 text-gray-400 hover:text-blue-500 hover:bg-blue-50 rounded-lg transition"
                        title="Edit"
                      >
                        <PencilIcon className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => handleDeleteFAQ(faq.id)}
                        className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition"
                        title="Hapus"
                      >
                        <TrashIcon className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Pagination */}
      {filteredFaqs.length > 0 && (
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

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-800 rounded-2xl w-full max-w-2xl shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                {editingFAQ ? "Edit FAQ" : "Tambah FAQ Baru"}
              </h3>
              <button
                onClick={closeModal}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <XMarkIcon className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Pertanyaan
                </label>
                <input
                  type="text"
                  className="w-full rounded-lg border-gray-300 dark:border-gray-600 focus:ring-primary focus:border-primary text-sm dark:bg-slate-900 dark:text-white p-2.5"
                  value={formData.question}
                  onChange={(e) =>
                    setFormData({ ...formData, question: e.target.value })
                  }
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Jawaban
                </label>
                <textarea
                  rows={6}
                  className="w-full rounded-lg border-gray-300 dark:border-gray-600 focus:ring-primary focus:border-primary text-sm dark:bg-slate-900 dark:text-white p-2.5"
                  value={formData.answer}
                  onChange={(e) =>
                    setFormData({ ...formData, answer: e.target.value })
                  }
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Kategori
                </label>
                <select
                  className="w-full rounded-lg border-gray-300 dark:border-gray-600 focus:ring-primary focus:border-primary text-sm dark:bg-slate-900 dark:text-white p-2.5"
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
                  className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
                  checked={formData.featured}
                  onChange={(e) =>
                    setFormData({ ...formData, featured: e.target.checked })
                  }
                />
                <label
                  htmlFor="featured"
                  className="ml-2 block text-sm text-gray-900 dark:text-white"
                >
                  Tampilkan di beranda (featured)
                </label>
              </div>
            </div>

            <div className="p-6 border-t border-gray-100 dark:border-gray-700 flex justify-end gap-3 bg-gray-50 dark:bg-slate-800/50 rounded-b-2xl">
              <button
                onClick={closeModal}
                className="px-4 py-2 bg-slate-200 dark:bg-slate-600 text-slate-700 dark:text-slate-200 rounded-lg hover:bg-slate-300 dark:hover:bg-slate-500"
                disabled={saving}
              >
                Batal
              </button>
              <button
                onClick={handleSaveFAQ}
                disabled={saving}
                className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 disabled:opacity-50"
              >
                {saving ? "Menyimpan..." : "Simpan"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
