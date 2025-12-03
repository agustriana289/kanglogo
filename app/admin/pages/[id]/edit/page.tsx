// app/admin/pages/[id]/edit/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { Page } from "@/types/page";
import LogoLoading from "@/components/LogoLoading";

export default function EditPageForm() {
  const params = useParams();
  const router = useRouter();

  const [formData, setFormData] = useState<Partial<Page> | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // --- STATE UNTUK NOTIFIKASI ---
  const [notification, setNotification] = useState({
    show: false,
    message: "",
    type: "", // 'success' atau 'error'
  });

  // --- FUNGSI UNTUK MENAMPILKAN NOTIFIKASI ---
  const showNotification = (message: string, type: "success" | "error") => {
    setNotification({ show: true, message, type });
    setTimeout(() => {
      setNotification({ show: false, message: "", type: "" });
    }, 3000);
  };

  useEffect(() => {
    fetchPage();
  }, [params.id]);

  const fetchPage = async () => {
    const { data, error } = await supabase
      .from("pages")
      .select("*")
      .eq("id", params.id)
      .single();
    if (error) {
      console.error("Error fetching page:", error);
      showNotification("Gagal memuat halaman.", "error"); // GANTI ALERT
      router.push("/admin/pages");
    } else {
      setFormData(data);
    }
    setLoading(false);
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    if (!formData) return;
    const { name, value, type } = e.target;
    setFormData((prev) => ({
      ...prev!,
      [name]:
        type === "checkbox" ? (e.target as HTMLInputElement).checked : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData) return;

    setSaving(true);
    try {
      const { error } = await supabase
        .from("pages")
        .update(formData)
        .eq("id", params.id);

      if (error) throw error;

      // GANTI ALERT DENGAN NOTIFIKASI
      showNotification("Halaman berhasil diperbarui!", "success");
      router.push("/admin/pages");
    } catch (error: any) {
      console.error("Error updating page:", error);
      // GANTI ALERT DENGAN NOTIFIKASI
      showNotification(`Gagal memperbarui halaman: ${error.message}`, "error");
    } finally {
      setSaving(false);
    }
  };

  if (loading || !formData) {
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
    <div className="min-h-screen bg-slate-100 p-6">
      {/* --- RENDER NOTIFIKASI --- */}
      {notification.show && (
        <div
          className={`fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg ${
            notification.type === "success"
              ? "bg-green-100 text-green-700 dark:bg-green-800 dark:text-green-300"
              : "bg-red-100 text-red-700 dark:bg-red-800 dark:text-red-300"
          }`}
        >
          {notification.message}
        </div>
      )}

      <div className="bg-white rounded-xl shadow-lg p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Edit Halaman</h1>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* ... (Form fields Anda tetap sama) ... */}
          <div>
            <label
              htmlFor="title"
              className="block text-sm font-medium text-gray-700"
            >
              Judul Halaman
            </label>
            <input
              type="text"
              name="title"
              id="title"
              required
              value={formData.title}
              onChange={handleInputChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 border"
            />
          </div>
          <div>
            <label
              htmlFor="slug"
              className="block text-sm font-medium text-gray-700"
            >
              Slug (URL)
            </label>
            <input
              type="text"
              name="slug"
              id="slug"
              required
              value={formData.slug}
              onChange={handleInputChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 border"
            />
          </div>
          <div>
            <label
              htmlFor="meta_description"
              className="block text-sm font-medium text-gray-700"
            >
              Meta Description (untuk SEO)
            </label>
            <textarea
              name="meta_description"
              id="meta_description"
              rows={3}
              value={formData.meta_description ?? ""}
              onChange={handleInputChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 border"
            ></textarea>
          </div>
          <div>
            <label
              htmlFor="content"
              className="block text-sm font-medium text-gray-700"
            >
              Konten (HTML)
            </label>
            <textarea
              name="content"
              id="content"
              rows={15}
              required
              value={formData.content}
              onChange={handleInputChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 border font-mono text-sm"
            ></textarea>
            <p className="text-xs text-gray-500 mt-1">
              Anda bisa menggunakan tag HTML di sini.
            </p>
          </div>
          <div className="flex items-center">
            <input
              type="checkbox"
              name="is_published"
              id="is_published"
              checked={formData.is_published}
              onChange={handleInputChange}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label
              htmlFor="is_published"
              className="ml-2 block text-sm text-gray-900"
            >
              Terbitkan halaman ini
            </label>
          </div>
          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={() => router.push("/admin/pages")}
              className="px-4 py-2 bg-gray-200 text-gray-900 rounded-md hover:bg-gray-300"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400"
            >
              {saving ? "Menyimpan..." : "Simpan Perubahan"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
