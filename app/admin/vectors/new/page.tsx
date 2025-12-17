// app/admin/vectors/new/page.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { LogoVector } from "@/types/logoVector";
import Link from "next/link";
import { extractGoogleDriveFileId } from "@/lib/googleDriveUtils";

export default function NewVectorPage() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState<Partial<LogoVector>>({
    name: "",
    slug: "",
    category: "",
    google_drive_link: "",
    description: "",
    is_published: true,
  });

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

  const handleSlugify = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9 -]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-");
  };

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newName = e.target.value;
    setFormData((prev) => ({
      ...prev,
      name: newName,
      slug: handleSlugify(newName),
    }));
  };

  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value, type } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]:
        type === "checkbox" ? (e.target as HTMLInputElement).checked : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      // Extract file ID from Google Drive link
      const fileId = extractGoogleDriveFileId(formData.google_drive_link || "");

      if (!fileId) {
        showNotification("Google Drive link tidak valid!", "error");
        setSaving(false);
        return;
      }

      const { error } = await supabase.from("logo_vectors").insert({
        ...formData,
        file_id: fileId,
        downloads: 0,
      });

      if (error) throw error;

      showNotification("Logo vector berhasil ditambahkan!", "success");
      setTimeout(() => router.push("/admin/vectors"), 1000);
    } catch (error: any) {
      console.error("Error saving vector:", error);
      showNotification(`Gagal menyimpan: ${error.message}`, "error");
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
            className={`fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg ${
              notification.type === "success"
                ? "bg-green-100 text-green-700"
                : "bg-red-100 text-red-700"
            }`}
          >
            {notification.message}
          </div>
        )}

        {/* Header */}
        <div className="mb-6">
          <Link
            href="/admin/vectors"
            className="inline-flex items-center gap-2 text-primary hover:underline mb-4"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
            Kembali ke Daftar Vector
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">
            Tambah Logo Vector Baru
          </h1>
          <p className="text-gray-600 mt-1">
            Upload logo vector baru ke koleksi
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* LEFT COLUMN */}
            <div className="lg:col-span-8 space-y-6">
              {/* Basic Info */}
              <div className="bg-white rounded-lg shadow-sm border border-slate-100 p-6">
                <h3 className="text-sm font-semibold text-gray-900 mb-4">
                  Informasi Dasar
                </h3>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Nama Vector *
                    </label>
                    <input
                      type="text"
                      name="name"
                      required
                      value={formData.name}
                      onChange={handleNameChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                      placeholder="Contoh: Logo Minimalis Modern"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Slug (URL) *
                    </label>
                    <input
                      type="text"
                      name="slug"
                      required
                      value={formData.slug}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                      placeholder="logo-minimalis-modern"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Google Drive Link *
                    </label>
                    <input
                      type="text"
                      name="google_drive_link"
                      required
                      value={formData.google_drive_link}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                      placeholder="https://drive.google.com/file/d/FILE_ID/view"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Pastikan file sudah di-set ke "Anyone with the link can
                      view"
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Deskripsi
                    </label>
                    <textarea
                      name="description"
                      rows={4}
                      value={formData.description || ""}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                      placeholder="Deskripsi singkat tentang logo vector ini..."
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* RIGHT COLUMN */}
            <div className="lg:col-span-4 space-y-6 flex flex-col">
              {/* Actions */}
              <div className="bg-white rounded-lg shadow-sm border border-slate-100 p-6 order-3 sm:order-1">
                <div className="flex justify-between items-center">
                  <button
                    type="button"
                    onClick={() => router.push("/admin/vectors")}
                    className="px-6 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 font-medium transition-colors"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 disabled:opacity-50 font-medium transition-colors"
                  >
                    {saving ? "Menyimpan..." : "Simpan"}
                  </button>
                </div>
              </div>

              {/* Category */}
              <div className="bg-white rounded-lg shadow-sm border border-slate-100 p-6 order-1 sm:order-2">
                <h3 className="text-sm font-semibold text-gray-900 mb-4">
                  Kategori
                </h3>

                <select
                  name="category"
                  required
                  value={formData.category}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                >
                  <option value="">Pilih Kategori</option>
                  <optgroup label="Teknologi & Internet">
                    <option value="teknologi">Teknologi (Hardware)</option>
                    <option value="software">Software & Aplikasi</option>
                    <option value="internet">Layanan Internet</option>
                    <option value="media-sosial">Media Sosial</option>
                    <option value="domain">Domain & Hosting</option>
                    <option value="game">Game</option>
                    <option value="telekomunikasi">
                      Telekomunikasi & Selular
                    </option>
                  </optgroup>
                  <optgroup label="Keuangan & Bisnis">
                    <option value="bank">Bank</option>
                    <option value="pembayaran">Pembayaran (FinTech)</option>
                    <option value="asuransi">Asuransi</option>
                    <option value="konsultan">Konsultan & Jasa</option>
                  </optgroup>
                  <optgroup label="Retail & Konsumen">
                    <option value="ritel">Ritel & Supermarket</option>
                    <option value="e-commerce">E-Commerce</option>
                    <option value="makanan-minuman">Makanan & Minuman</option>
                    <option value="fashion">Fashion & Pakaian</option>
                    <option value="kecantikan">Kecantikan & Kosmetik</option>
                    <option value="kesehatan">Kesehatan & Farmasi</option>
                  </optgroup>
                  <optgroup label="Hiburan & Media">
                    <option value="anime">Anime</option>
                    <option value="hiburan">Hiburan (Streaming)</option>
                    <option value="media">Media & Berita</option>
                    <option value="olahraga">Olahraga</option>
                  </optgroup>
                  <optgroup label="Transportasi & Otomotif">
                    <option value="otomotif">Otomotif (Mobil & Motor)</option>
                    <option value="penerbangan">Penerbangan</option>
                    <option value="logistik">Logistik & Pengiriman</option>
                  </optgroup>
                  <optgroup label="Lainnya">
                    <option value="energi">Energi & Sumber Daya</option>
                    <option value="pemerintah">Pemerintah & Organisasi</option>
                    <option value="pendidikan">Pendidikan</option>
                  </optgroup>
                </select>
              </div>

              {/* Publish */}
              <div className="bg-white rounded-lg shadow-sm border border-slate-100 p-6 order-2 sm:order-3">
                <h3 className="text-sm font-semibold text-gray-900 mb-4">
                  Publikasi
                </h3>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    name="is_published"
                    id="is_published"
                    checked={formData.is_published}
                    onChange={handleInputChange}
                    className="h-4 w-4 text-primary rounded focus:ring-primary"
                  />
                  <label
                    htmlFor="is_published"
                    className="ml-2 text-sm text-gray-700"
                  >
                    Publikasikan logo vector ini
                  </label>
                </div>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
