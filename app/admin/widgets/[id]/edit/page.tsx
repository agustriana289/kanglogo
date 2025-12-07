// app/admin/widgets/[id]/edit/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import Link from "next/link";
import { useAlert } from "@/components/providers/AlertProvider";
import LogoLoading from "@/components/LogoLoading";

interface Widget {
  id: number;
  title: string;
  content: string;
  position: string;
}

export default function EditWidgetPage() {
  const router = useRouter();
  const params = useParams();
  const { showAlert } = useAlert();
  const [widget, setWidget] = useState<Widget | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    content: "",
    position: "sidebar",
  });

  useEffect(() => {
    const widgetId = params.id as string;
    if (widgetId) {
      fetchWidget(widgetId);
    }
  }, [params.id]);

  const fetchWidget = async (id: string) => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("widgets")
        .select("*")
        .eq("id", id)
        .single();

      if (error) {
        console.error("Error fetching widget:", error);
        showAlert("error", "Gagal", "Gagal memuat data widget.");
        router.push("/admin/widgets");
      } else {
        setWidget(data);
        setFormData({
          title: data.title,
          content: data.content,
          position: data.position,
        });
      }
    } catch (error) {
      console.error("Error fetching widget:", error);
      showAlert("error", "Error", "Terjadi kesalahan tak terduga.");
      router.push("/admin/widgets");
    } finally {
      setLoading(false);
    }
  };

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
      const { error } = await supabase
        .from("widgets")
        .update(formData)
        .eq("id", params.id);

      if (error) {
        console.error("Error updating widget:", error);
        showAlert("error", "Gagal", "Gagal memperbarui widget. Silakan coba lagi.");
      } else {
        showAlert("success", "Berhasil", "Widget berhasil diperbarui!");
        router.push("/admin/widgets");
      }
    } catch (error) {
      console.error("Error updating widget:", error);
      showAlert("error", "Error", "Terjadi kesalahan tak terduga.");
    } finally {
      setSubmitting(false);
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

  if (!widget) {
    return null; // Akan redirect karena error di fetchWidget
  }

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-900 p-2 sm:p-4 md:p-6">
      <div className="bg-white dark:bg-slate-700 rounded-xl sm:rounded-2xl shadow-lg p-3 sm:p-4 md:p-6 max-w-2xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Edit Widget: {widget.title}
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
              placeholder="Anda bisa menggunakan tag HTML di sini."
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
              {submitting ? "Memperbarui..." : "Perbarui Widget"}
            </button>
          </div>
        </form>
      </div>


    </div>
  );
}
