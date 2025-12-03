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
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingFAQ, setEditingFAQ] = useState<FAQ | null>(null);
  const [formData, setFormData] = useState({
    question: "",
    answer: "",
    category: "Umum",
    featured: false,
  });
  const { toast, showToast, hideToast } = useToast();

  useEffect(() => {
    fetchFAQs();
  }, []);

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

      setFaqs(faqs.filter((faq) => faq.id !== id));
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

        setFaqs(
          faqs.map((faq) =>
            faq.id === editingFAQ.id ? { ...faq, ...formData } : faq
          )
        );

        showToast("FAQ berhasil diperbarui!", "success");
      } else {
        const { data, error } = await supabase
          .from("faqs")
          .insert([formData])
          .select();

        if (error) {
          throw error;
        }

        setFaqs([...faqs, ...(data || [])]);
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
        <div className="mb-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <button
              onClick={handleAddFAQ}
              className="inline-flex items-center px-4 py-2 bg-primary text-white font-medium rounded-lg shadow-sm hover:bg-primary/90 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
            >
              <PlusIcon className="h-5 w-5 mr-2" />
              Tambah FAQ
            </button>
          </div>
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
              {faqs.map((faq) => (
                <tr
                  key={faq.id}
                  className="hover:bg-slate-50 dark:hover:bg-slate-800/50"
                >
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900 dark:text-white">
                    <div className="flex items-center">
                      <ChatBubbleLeftIcon className="h-5 w-5 text-slate-400 mr-3" />{" "}
                      {/* DIPERBAIKI */}
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
                      <TagIcon className="h-4 w-4 mr-1" /> {/* DIPERBAIKI */}
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
                        <XMarkIcon className="h-4 w-4 mr-1" />{" "}
                        {/* DIPERBAIKI */}
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
                        <PencilIcon className="h-4 w-4 mr-1" />{" "}
                        {/* DIPERBAIKI */}
                        Edit
                      </button>
                      <button
                        onClick={() => handleDeleteFAQ(faq.id)}
                        className="inline-flex items-center px-3 py-1.5 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-md hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors"
                      >
                        <TrashIcon className="h-4 w-4 mr-1" />{" "}
                        {/* DIPERBAIKI */}
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
          {faqs.map((faq) => (
            <div
              key={faq.id}
              className="bg-white dark:bg-slate-800 rounded-lg shadow p-4 border border-slate-200 dark:border-slate-600"
            >
              <div className="flex justify-between items-start mb-3">
                <div className="flex items-start">
                  <ChatBubbleLeftIcon className="h-5 w-5 text-slate-400 mr-3 mt-0.5" />{" "}
                  {/* DIPERBAIKI */}
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
                    <XMarkIcon className="h-4 w-4 mr-1" /> {/* DIPERBAIKI */}
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
                    <TagIcon className="h-4 w-4 mr-1" /> {/* DIPERBAIKI */}
                    {faq.category || "Umum"}
                  </span>
                </div>
                <div className="flex justify-end space-x-2">
                  <button
                    onClick={() => handleEditFAQ(faq)}
                    className="inline-flex items-center px-3 py-1.5 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 rounded-md hover:bg-indigo-100 dark:hover:bg-indigo-900/30 transition-colors"
                  >
                    <PencilIcon className="h-4 w-4 mr-1" /> {/* DIPERBAIKI */}
                    Edit
                  </button>
                  <button
                    onClick={() => handleDeleteFAQ(faq.id)}
                    className="inline-flex items-center px-3 py-1.5 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-md hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors"
                  >
                    <TrashIcon className="h-4 w-4 mr-1" /> {/* DIPERBAIKI */}
                    Hapus
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {faqs.length === 0 && (
          <div className="text-center py-12">
            <ChatBubbleLeftIcon className="mx-auto h-12 w-12 text-slate-400" />{" "}
            {/* DIPERBAIKI */}
            <h3 className="mt-2 text-sm font-medium text-slate-900 dark:text-white">
              Tidak ada FAQ
            </h3>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              Belum ada FAQ yang dibuat.
            </p>
            <div className="mt-6">
              <button
                onClick={handleAddFAQ}
                className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary hover:bg-primary/80 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
              >
                <PlusIcon className="-ml-1 mr-2 h-5 w-5" /> {/* DIPERBAIKI */}
                Tambah FAQ Baru
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
