// app/admin/testimonials/page.tsx
"use client";

import { useState, useEffect, useRef } from "react";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/useToast";
import Toast from "@/components/Toast";
import { Testimonial } from "@/types/testimonial";
import { uploadImageToImgBBTestimonial } from "@/lib/imgbb-testi";
import LogoLoading from "@/components/LogoLoading";
import {
  PlusIcon,
  PencilIcon,
  TrashIcon,
  PhotoIcon,
  XMarkIcon,
  ChatBubbleLeftEllipsisIcon,
} from "@heroicons/react/24/outline";

export default function TestimonialManagementPage() {
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const { toast, showToast, hideToast } = useToast();

  const [showModal, setShowModal] = useState(false);
  const [editingTestimonial, setEditingTestimonial] =
    useState<Testimonial | null>(null);
  const [formData, setFormData] = useState({
    image_url: "",
    alt_text: "",
  });
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  useEffect(() => {
    fetchTestimonials();
  }, []);

  const fetchTestimonials = async () => {
    try {
      const { data, error } = await supabase
        .from("testimonials")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching testimonials:", error);
        showToast("Gagal memuat testimoni", "error");
      } else {
        setTestimonials(data || []);
      }
    } catch (error) {
      console.error("Error fetching testimonials:", error);
      showToast("Terjadi kesalahan saat memuat testimoni", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleAddTestimonial = () => {
    setEditingTestimonial(null);
    setFormData({
      image_url: "",
      alt_text: "",
    });
    setImagePreview(null);
    setShowModal(true);
  };

  const handleEditTestimonial = (testimonial: Testimonial) => {
    setEditingTestimonial(testimonial);
    setFormData({
      image_url: testimonial.image_url,
      alt_text: testimonial.alt_text || "",
    });
    setImagePreview(testimonial.image_url || null);
    setShowModal(true);
  };

  const handleDeleteTestimonial = async (id: number) => {
    if (!confirm("Apakah Anda yakin ingin menghapus testimoni ini?")) return;

    setSaving(true);
    try {
      const { error } = await supabase
        .from("testimonials")
        .delete()
        .eq("id", id);
      if (error) throw error;

      setTestimonials(testimonials.filter((t) => t.id !== id));
      showToast("Testimoni berhasil dihapus!", "success");
    } catch (error) {
      console.error("Error deleting testimonial:", error);
      showToast("Gagal menghapus testimoni", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = e.dataTransfer.files;
    if (files && files[0]) {
      handleImageChange({ target: { files } } as any);
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith("image/")) {
        showToast("Silakan pilih file gambar!", "error");
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        showToast("Ukuran file terlalu besar! Maksimal 5MB", "error");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveTestimonial = async () => {
    if (!formData.alt_text.trim()) {
      showToast("Teks alternatif tidak boleh kosong!", "error");
      return;
    }

    setSaving(true);
    try {
      let imageUrl = formData.image_url;

      if (fileInputRef.current?.files?.[0]) {
        setUploadingImage(true);
        imageUrl = await uploadImageToImgBBTestimonial(
          fileInputRef.current.files[0]
        );
        setUploadingImage(false);
      }

      const updatedFormData = { ...formData, image_url: imageUrl };

      if (editingTestimonial) {
        const { error } = await supabase
          .from("testimonials")
          .update(updatedFormData)
          .eq("id", editingTestimonial.id);
        if (error) throw error;
        setTestimonials(
          testimonials.map((t) =>
            t.id === editingTestimonial.id ? { ...t, ...updatedFormData } : t
          )
        );
        showToast("Testimoni berhasil diperbarui!", "success");
      } else {
        const { data, error } = await supabase
          .from("testimonials")
          .insert([updatedFormData])
          .select();
        if (error) throw error;
        setTestimonials([...(data || []), ...testimonials]);
        showToast("Testimoni berhasil ditambahkan!", "success");
      }
      setShowModal(false);
    } catch (error) {
      console.error("Error saving testimonial:", error);
      showToast(
        `Gagal menyimpan testimoni: ${
          error instanceof Error ? error.message : "Terjadi kesalahan"
        }`,
        "error"
      );
      setUploadingImage(false);
    } finally {
      setSaving(false);
    }
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingTestimonial(null);
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
        {/* Header Section - Diperbaiki */}
        <div className="mb-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <button
              onClick={handleAddTestimonial}
              className="inline-flex items-center px-4 py-2 bg-primary text-white font-medium rounded-lg shadow-sm hover:bg-primary/90 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
            >
              <PlusIcon className="h-5 w-5 mr-2" />
              Tambah Testimoni
            </button>
          </div>
        </div>

        {/* Desktop Grid View */}
        <div className="hidden sm:grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {testimonials.map((testimonial) => (
            <div key={testimonial.id} className="relative group">
              <div className="bg-white dark:bg-slate-800 rounded-lg shadow-md overflow-hidden border border-slate-200 dark:border-slate-600 hover:shadow-lg transition-shadow">
                <div className="aspect-video relative">
                  <img
                    src={testimonial.image_url}
                    alt={testimonial.alt_text ?? ""}
                    className="w-full h-48 object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                </div>
                <div className="p-4">
                  <p className="text-sm text-slate-700 dark:text-slate-300 line-clamp-2">
                    {testimonial.alt_text || "Tidak ada teks alternatif"}
                  </p>
                </div>
                <div className="absolute top-2 right-2 flex space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => handleEditTestimonial(testimonial)}
                    className="p-1.5 bg-white dark:bg-slate-700 rounded-full shadow-sm"
                  >
                    <PencilIcon className="h-4 w-4 text-slate-600 dark:text-slate-300" />
                  </button>
                  <button
                    onClick={() => handleDeleteTestimonial(testimonial.id)}
                    className="p-1.5 bg-white dark:bg-slate-700 rounded-full shadow-sm"
                  >
                    <TrashIcon className="h-4 w-4 text-red-600 dark:text-red-400" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Mobile Card View */}
        <div className="sm:hidden space-y-4">
          {testimonials.map((testimonial) => (
            <div
              key={testimonial.id}
              className="bg-white dark:bg-slate-800 rounded-lg shadow-md p-4 border border-slate-200 dark:border-slate-600"
            >
              <div className="flex justify-between items-start mb-3">
                <div className="flex-1">
                  <h3 className="text-lg font-medium text-slate-900 dark:text-white">
                    Testimoni #{testimonial.id}
                  </h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                    {testimonial.alt_text || "Tidak ada teks alternatif"}
                  </p>
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => handleEditTestimonial(testimonial)}
                    className="p-1.5 bg-slate-100 dark:bg-slate-700 rounded-full"
                  >
                    <PencilIcon className="h-4 w-4 text-slate-600 dark:text-slate-300" />
                  </button>
                  <button
                    onClick={() => handleDeleteTestimonial(testimonial.id)}
                    className="p-1.5 bg-slate-100 dark:bg-slate-700 rounded-full"
                  >
                    <TrashIcon className="h-4 w-4 text-red-600 dark:text-red-400" />
                  </button>
                </div>
              </div>
              <div className="aspect-video relative">
                <img
                  src={testimonial.image_url}
                  alt={testimonial.alt_text ?? ""}
                  className="w-full h-48 object-cover rounded-lg"
                />
              </div>
            </div>
          ))}
        </div>

        {/* Empty State */}
        {testimonials.length === 0 && (
          <div className="text-center py-12">
            <ChatBubbleLeftEllipsisIcon className="mx-auto h-12 w-12 text-slate-400" />
            <h3 className="mt-2 text-sm font-medium text-slate-900 dark:text-white">
              Tidak ada testimoni
            </h3>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              Belum ada testimoni yang ditambahkan.
            </p>
            <div className="mt-6">
              <button
                onClick={handleAddTestimonial}
                className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary hover:bg-primary/80 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
              >
                <PlusIcon className="-ml-1 mr-2 h-5 w-5" />
                Tambah Testimoni Baru
              </button>
            </div>
          </div>
        )}

        {/* Modal for Add/Edit Testimonial - Diperbaiki */}
        {showModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-slate-700 rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-start mb-6">
                <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                  {editingTestimonial
                    ? "Edit Testimoni"
                    : "Tambah Testimoni Baru"}
                </h2>
                <button
                  onClick={closeModal}
                  className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                >
                  <XMarkIcon className="h-6 w-6" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Gambar Testimoni
                  </label>
                  <div
                    className={`flex flex-col items-center justify-center w-full h-64 border-2 border-dashed rounded-lg cursor-pointer ${
                      isDragging
                        ? "border-primary bg-primary/5"
                        : "border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-800"
                    }`}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    onClick={() => fileInputRef.current?.click()}
                  >
                    {imagePreview ? (
                      <div className="flex flex-col items-center justify-center">
                        <img
                          src={imagePreview}
                          alt="Preview"
                          className="h-48 w-auto object-contain mb-4 rounded"
                        />
                        <p className="text-sm text-slate-500 dark:text-slate-400">
                          Klik atau seret untuk mengganti gambar
                        </p>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center pt-5 pb-6">
                        <PhotoIcon className="h-12 w-12 text-slate-400 mb-4" />
                        <p className="mb-2 text-sm text-slate-700 dark:text-slate-300">
                          <span className="font-semibold">
                            Klik untuk mengunggah
                          </span>{" "}
                          atau seret dan lepas
                        </p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          WEBP, PNG, JPG, atau GIF (MAKS. 5MB)
                        </p>
                      </div>
                    )}
                    <input
                      ref={fileInputRef}
                      type="file"
                      className="hidden"
                      accept="image/*"
                      onChange={handleImageChange}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Teks Alternatif (Alt Text)
                  </label>
                  <textarea
                    rows={3}
                    className="block w-full rounded-md border-slate-300 dark:border-slate-600 shadow-sm p-2 border dark:bg-slate-800 dark:text-white"
                    value={formData.alt_text}
                    onChange={(e) =>
                      setFormData({ ...formData, alt_text: e.target.value })
                    }
                    placeholder="Deskripsi singkat untuk gambar testimoni"
                  />
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
                  onClick={handleSaveTestimonial}
                  disabled={saving || uploadingImage}
                  className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/90 disabled:opacity-50"
                >
                  {uploadingImage
                    ? "Mengunggah Gambar..."
                    : saving
                    ? "Menyimpan..."
                    : "Simpan"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Toast Notification */}
      <Toast
        show={toast.show}
        message={toast.message}
        type={toast.type}
        onClose={hideToast}
      />
    </div>
  );
}
