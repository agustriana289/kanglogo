// app/admin/widgets/new/page.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import Link from "next/link";
import { useAlert } from "@/components/providers/AlertProvider";

export default function NewWidgetPage() {
  const router = useRouter();
  const { showAlert } = useAlert();
  const [formData, setFormData] = useState({
    title: "",
    content: "",
    position: "sidebar",
  });
  const [submitting, setSubmitting] = useState(false);

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.content) {
      showAlert("error", "Validasi", "Judul dan konten widget harus diisi.");
      return;
    }

    setSubmitting(true);
    try {
      const { error } = await supabase.from("widgets").insert([formData]);

      if (error) {
        console.error("Error creating widget:", error);
        showAlert("error", "Gagal", "Gagal membuat widget. Silakan coba lagi.");
      } else {
        showAlert("success", "Berhasil", "Widget berhasil dibuat!");
        router.push("/admin/widgets"); // Arahkan kembali ke halaman kelola widget
      }
    } catch (error) {
      console.error("Error creating widget:", error);
      showAlert("error", "Error", "Terjadi kesalahan tak terduga.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-900 p-2 sm:p-4 md:p-6">
      <div className="bg-white dark:bg-slate-700 rounded-xl sm:rounded-2xl shadow-lg p-3 sm:p-4 md:p-6 max-w-2xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Tambah Widget Baru
          </h1>
          <Link
            href="/admin/widgets"
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors"
          >
            Batal
          </Link>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label
              htmlFor="title"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
            >
              Judul Widget
            </label>
            <input
              type="text"
              id="title"
              name="title"
              value={formData.title}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary dark:bg-gray-800 dark:text-white"
              required
            />
          </div>

          <div>
            <label
              htmlFor="position"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
            >
              Posisi
            </label>
            <select
              id="position"
              name="position"
              value={formData.position}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary dark:bg-gray-800 dark:text-white"
            >
              <option value="header">Header</option>
              <option value="footer">Footer</option>
              <option value="sidebar">Sidebar Blog/Halaman</option>
              <option value="Blog_header">Blog Header</option>
              <option value="Blog_footer">Blog Footer</option>
              <option value="marketplace_sidebar">Marketplace Sidebar</option>
              <option value="marketplace_header">Marketplace Header</option>
              <option value="marketplace_footer">Marketplace Footer</option>
              <option value="proyek_sidebar">Proyek Sidebar</option>
              <option value="proyek_header">Proyek Header</option>
              <option value="proyek_footer">Proyek Footer</option>
            </select>
          </div>

          <div>
            <label
              htmlFor="content"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
            >
              Konten (HTML)
            </label>
            <textarea
              id="content"
              name="content"
              rows={10}
              value={formData.content}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary dark:bg-gray-800 dark:text-white"
              placeholder="Anda bisa menggunakan tag HTML di sini. Contoh: &lt;p&gt;Teks paragraf&lt;/p&gt; atau &lt;ul&gt;&lt;li&gt;Daftar&lt;/li&gt;&lt;/ul&gt;"
              required
            />
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Anda dapat menggunakan tag HTML untuk memformat konten.
            </p>
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={submitting}
              className="px-6 py-2 bg-primary text-white rounded-md hover:bg-primary/80 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {submitting ? "Menyimpan..." : "Simpan Widget"}
            </button>
          </div>
        </form>
      </div>


    </div>
  );
}
