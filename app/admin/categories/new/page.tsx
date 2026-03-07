"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { useAlert } from "@/components/providers/AlertProvider";
import LogoPathAnimation from "@/components/LogoPathAnimation";

export default function NewCategoryPage() {
  const router = useRouter();
  const { showAlert } = useAlert();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    slug: "",
    description: "",
  });

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9 -]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .trim();
  };

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const name = e.target.value;
    setFormData({
      ...formData,
      name,
      slug: generateSlug(name),
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      showAlert("warning", "Validasi", "Nama kategori harus diisi");
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.from("categories").insert([formData]);

      if (error) {
        if (error.code === "23505") {
          showAlert(
            "error",
            "Gagal",
            "Kategori dengan nama atau slug yang sama sudah ada"
          );
        } else {
          throw error;
        }
      } else {
        showAlert("success", "Berhasil", "Kategori berhasil ditambahkan!");
        setTimeout(() => {
          router.push("/admin/categories");
        }, 1000);
      }
    } catch (error) {
      console.error("Error creating category:", error);
      showAlert("error", "Gagal", "Gagal menambahkan kategori");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="fixed inset-0 z-50 flex justify-center items-center bg-white">
        <LogoPathAnimation />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-900 p-2 sm:p-4 md:p-6">
      <div className="bg-white dark:bg-slate-700 rounded-xl sm:rounded-2xl shadow-lg p-3 sm:p-4 md:p-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
          Tambah Kategori Baru
        </h1>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Nama Kategori
            </label>
            <input
              type="text"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-600 dark:border-gray-500 dark:text-white"
              value={formData.name}
              onChange={handleNameChange}
              placeholder="Contoh: Desain Logo"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              URL Slug
            </label>
            <input
              type="text"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-600 dark:border-gray-500 dark:text-white"
              value={formData.slug}
              onChange={(e) =>
                setFormData({ ...formData, slug: e.target.value })
              }
              placeholder="contoh: desain-logo"
              required
            />
            <p className="mt-1 text-sm text-gray-500">
              Slug akan digunakan dalam URL. Gunakan huruf kecil dan hubungkan
              dengan tanda hubung.
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Deskripsi
            </label>
            <textarea
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-600 dark:border-gray-500 dark:text-white"
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              placeholder="Deskripsi singkat tentang kategori ini..."
            />
          </div>

          <div className="flex justify-end space-x-2">
            <button
              type="button"
              onClick={() => router.push("/admin/categories")}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/80 disabled:opacity-50"
            >
              {loading ? "Menyimpan..." : "Simpan Kategori"}
            </button>
          </div>
        </form>
      </div>


    </div>
  );
}
