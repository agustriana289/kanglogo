// app/admin/pages/new/page.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { Page } from "@/types/page";
import Link from "next/link";
import dynamic from "next/dynamic";

// Import ReactQuill dynamically
const ReactQuill = dynamic(() => import("react-quill-new"), { ssr: false });
import "react-quill-new/dist/quill.snow.css";

export default function NewPageForm() {
  const router = useRouter();

  const [formData, setFormData] = useState<Partial<Page>>({
    title: "",
    slug: "",
    content: "",
    meta_description: "",
    is_published: false,
  });
  const [saving, setSaving] = useState(false);

  // State untuk notifikasi
  const [notification, setNotification] = useState({
    show: false,
    message: "",
    type: "",
  });

  const showNotification = (message: string, type: "success" | "error") => {
    setNotification({ show: true, message, type });
    setTimeout(() => {
      setNotification({ show: false, message: "", type: "" });
    }, 3000);
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value, type } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]:
        type === "checkbox" ? (e.target as HTMLInputElement).checked : value,
    }));
  };

  const handleSlugify = (title: string) => {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9 -]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-");
  };

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTitle = e.target.value;
    setFormData((prev) => ({
      ...prev,
      title: newTitle,
      slug: handleSlugify(newTitle),
    }));
  };

  const handleContentChange = (content: string) => {
    setFormData((prev) => ({ ...prev, content }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const { error } = await supabase.from("pages").insert({
        ...formData,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });

      if (error) throw error;

      showNotification("Halaman berhas berhasil dibuat!", "success");
      setTimeout(() => router.push("/admin/pages"), 1000);
    } catch (error: any) {
      console.error("Error saving page:", error);
      showNotification(`Gagal membuat halaman: ${error.message}`, "error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen py-8">
      <div className="px-4 sm:px-6 lg:px-8">
        {/* Notification */}
        {notification.show && (
          <div
            className={`fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg ${notification.type === "success"
                ? "bg-green-100 text-green-700"
                : "bg-red-100 text-red-700"
              }`}
          >
            {notification.message}
          </div>
        )}

        {/* Header with Back Link */}
        <div className="mb-6">
          <Link
            href="/admin/pages"
            className="inline-flex items-center gap-2 text-primary hover:underline mb-4"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Kembali ke Halaman
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">
            Buat Halaman Baru
          </h1>
          <p className="text-gray-600 mt-1">
            Buat halaman statis baru untuk website Anda
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          {/* 2 Column Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* LEFT COLUMN - Title & Content */}
            <div className="lg:col-span-8 space-y-6">
              {/* Title */}
              <div className="bg-white rounded-lg shadow-sm border border-slate-100 p-6">
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  Judul Halaman
                </label>
                <input
                  type="text"
                  name="title"
                  required
                  value={formData.title}
                  onChange={handleTitleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  placeholder="Masukkan judul halaman..."
                />
              </div>

              {/* Content Editor */}
              <div className="bg-white rounded-lg shadow-sm border border-slate-100 p-6">
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  Konten
                </label>
                <div className="border border-gray-300 rounded-lg overflow-hidden">
                  <ReactQuill
                    theme="snow"
                    value={formData.content || ""}
                    onChange={handleContentChange}
                    style={{ minHeight: "400px" }}
                    modules={{
                      toolbar: [
                        [{ header: [1, 2, 3, false] }],
                        ["bold", "italic", "underline", "strike"],
                        [{ list: "ordered" }, { list: "bullet" }],
                        ["link", "image"],
                        ["clean"],
                      ],
                    }}
                  />
                </div>
              </div>
            </div>

            {/* RIGHT COLUMN - Settings */}
            <div className="lg:col-span-4 space-y-6 flex flex-col">
              {/* Action Buttons */}
              <div className="bg-white rounded-lg shadow-sm border border-slate-100 p-6 order-1">
                <div className="flex justify-between items-center">
                  <button
                    type="button"
                    onClick={() => router.push("/admin/pages")}
                    className="px-6 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 font-medium transition-colors"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 disabled:opacity-50 font-medium transition-colors"
                  >
                    {saving ? "Menyimpan..." : "Publikasikan"}
                  </button>
                </div>
              </div>

              {/* Publish Settings */}
              <div className="bg-white rounded-lg shadow-sm border border-slate-100 p-6 order-2">
                <h3 className="text-sm font-semibold text-gray-900 mb-4">Publikasi</h3>

                <div className="space-y-4">
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      name="is_published"
                      id="is_published"
                      checked={formData.is_published}
                      onChange={handleInputChange}
                      className="h-4 w-4 text-primary rounded focus:ring-primary"
                    />
                    <label htmlFor="is_published" className="ml-2 text-sm text-gray-700">
                      Terbitkan halaman ini
                    </label>
                  </div>
                </div>
              </div>

              {/* SEO Settings */}
              <div className="bg-white rounded-lg shadow-sm border border-slate-100 p-6 order-3">
                <h3 className="text-sm font-semibold text-gray-900 mb-4">SEO</h3>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Slug (URL)
                    </label>
                    <input
                      type="text"
                      name="slug"
                      required
                      value={formData.slug}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary focus:border-transparent"
                      placeholder="url-halaman"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Meta Description
                    </label>
                    <textarea
                      name="meta_description"
                      rows={3}
                      value={formData.meta_description ?? ""}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary focus:border-transparent"
                      placeholder="Deskripsi untuk mesin pencari..."
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
