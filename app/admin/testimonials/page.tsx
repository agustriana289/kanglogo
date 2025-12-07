"use client";

import { useState, useEffect, useRef } from "react";
import { supabase } from "@/lib/supabase";
import { useAlert } from "@/components/providers/AlertProvider";
import { Testimonial } from "@/types/testimonial";
import LogoLoading from "@/components/LogoLoading";
import { uploadFile } from "@/lib/supabase-storage";
import {
  PlusIcon,
  PencilIcon,
  TrashIcon,
  PhotoIcon,
  XMarkIcon,
  MagnifyingGlassIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  Squares2X2Icon,
  ListBulletIcon,
  ChatBubbleLeftEllipsisIcon,
} from "@heroicons/react/24/outline";

// Items per page
const ITEMS_PER_PAGE = 12;

export default function TestimonialManagementPage() {
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [filteredTestimonials, setFilteredTestimonials] = useState<Testimonial[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const { showAlert, showConfirm } = useAlert();

  const [showModal, setShowModal] = useState(false);
  const [editingTestimonial, setEditingTestimonial] = useState<Testimonial | null>(null);

  const [formData, setFormData] = useState({
    image_url: "",
    alt_text: "",
  });

  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  // Calculate total pages
  const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE);

  // Calculate the range of items to display
  const indexOfLastItem = currentPage * ITEMS_PER_PAGE;
  const indexOfFirstItem = indexOfLastItem - ITEMS_PER_PAGE;
  const currentItems = filteredTestimonials.slice(indexOfFirstItem, indexOfLastItem);

  useEffect(() => {
    fetchTestimonials();
  }, []);

  useEffect(() => {
    // Filter based on search query
    if (searchQuery.trim() === "") {
      setFilteredTestimonials(testimonials);
    } else {
      const filtered = testimonials.filter((t) =>
        t.alt_text?.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredTestimonials(filtered);
    }
    setTotalItems(filteredTestimonials.length);
    setCurrentPage(1);
  }, [searchQuery, testimonials]);

  const fetchTestimonials = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("testimonials")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setTestimonials(data || []);
      setFilteredTestimonials(data || []);
      setTotalItems(data?.length || 0);
    } catch (error) {
      console.error("Error fetching testimonials:", error);
      showAlert("error", "Error", "Gagal memuat testimoni!");
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
    const confirmed = await showConfirm(
      "Hapus Testimoni",
      "Apakah Anda yakin ingin menghapus testimoni ini?",
      "error",
      "Ya, Hapus"
    );
    if (!confirmed) return;

    setSaving(true);
    try {
      const { error } = await supabase.from("testimonials").delete().eq("id", id);
      if (error) throw error;

      setTestimonials(testimonials.filter((t) => t.id !== id));
      showAlert("success", "Berhasil", "Testimoni berhasil dihapus!");
    } catch (error) {
      console.error("Error deleting testimonial:", error);
      showAlert("error", "Gagal", "Gagal menghapus testimoni!");
    } finally {
      setSaving(false);
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith("image/")) {
        showAlert("warning", "Peringatan", "Silakan pilih file gambar!");
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        showAlert("warning", "Peringatan", "Ukuran file terlalu besar! Maksimal 5MB");
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
      showAlert("warning", "Validasi", "Teks alternatif tidak boleh kosong!");
      return;
    }

    setSaving(true);
    try {
      let imageUrl = formData.image_url;

      // Supabase Storage Upload
      if (fileInputRef.current?.files?.[0]) {
        setUploadingImage(true);
        const file = fileInputRef.current.files[0];
        const fileName = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.]/g, "")}`;
        const filePath = `testimonials/${fileName}`;

        const { publicUrl, error: uploadError } = await uploadFile("testimonials", filePath, file);

        if (uploadError) {
          // Fallback to 'marketplace' bucket if 'testimonials' bucket issues exist, aiming for robustness
          const { publicUrl: fallbackUrl, error: fallbackError } = await uploadFile("marketplace", `testimonials/${fileName}`, file);
          if (fallbackError) throw new Error("Gagal mengupload gambar ke Supabase Storage");
          imageUrl = fallbackUrl;
        } else {
          imageUrl = publicUrl;
        }
        setUploadingImage(false);
      }

      const testimonialData = {
        ...formData,
        image_url: imageUrl,
      };

      if (editingTestimonial) {
        const { error } = await supabase
          .from("testimonials")
          .update(testimonialData)
          .eq("id", editingTestimonial.id);
        if (error) throw error;
        showAlert("success", "Berhasil", "Testimoni berhasil diperbarui!");
      } else {
        const { error } = await supabase.from("testimonials").insert(testimonialData);
        if (error) throw error;
        showAlert("success", "Berhasil", "Testimoni berhasil ditambahkan!");
      }

      fetchTestimonials();
      setShowModal(false);
    } catch (error: any) {
      console.error("Error saving testimonial:", error);
      showAlert("error", "Gagal", error.message || "Gagal menyimpan testimoni!");
    } finally {
      setSaving(false);
      setUploadingImage(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("id-ID", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  const inputStyle =
    "bg-white dark:bg-slate-900 shadow-sm focus:border-blue-300 focus:ring-blue-500/10 dark:focus:border-blue-800 w-full rounded-lg border border-gray-300 py-2.5 px-4 text-sm text-gray-800 placeholder:text-gray-400 focus:ring-3 focus:outline-none dark:border-gray-700 dark:text-white/90 dark:placeholder:text-white/30";

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <LogoLoading />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-900 p-4 sm:p-6 lg:p-8 font-sans">
      {/* Header Section */}
      <div className="mb-6 rounded-2xl border border-gray-200 bg-white p-4 sm:p-6 dark:border-gray-800 dark:bg-white/[0.03]">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-gray-800 dark:text-white/90">
              Daftar Testimoni
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              {totalItems} testimoni ditemukan
            </p>
          </div>
          <button
            onClick={handleAddTestimonial}
            className="bg-primary hover:bg-primary/80 text-white px-4 py-2.5 rounded-lg flex items-center justify-center gap-2 text-sm font-medium transition shadow-sm"
          >
            <PlusIcon className="w-5 h-5" />
            Tambah Testimoni
          </button>
        </div>

        {/* Filters & View Toggle */}
        <div className="mt-6 flex flex-row gap-4 items-center justify-between">
          <div className="relative w-full sm:max-w-md">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Cari teks alternatif..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition"
            />
          </div>

          <div className="flex items-center gap-2 w-auto">
            {/* View Toggle */}
            <div className="flex bg-gray-100 dark:bg-slate-800 p-1 rounded-lg ml-auto sm:ml-0">
              <button
                onClick={() => setViewMode("grid")}
                className={`p-2 rounded-md transition ${viewMode === "grid"
                  ? "bg-white dark:bg-slate-700 shadow-sm text-primary"
                  : "text-gray-500 dark:text-gray-400 hover:text-gray-700"
                  }`}
              >
                <Squares2X2Icon className="w-5 h-5" />
              </button>
              <button
                onClick={() => setViewMode("list")}
                className={`p-2 rounded-md transition ${viewMode === "list"
                  ? "bg-white dark:bg-slate-700 shadow-sm text-primary"
                  : "text-gray-500 dark:text-gray-400 hover:text-gray-700"
                  }`}
              >
                <ListBulletIcon className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Content Section */}
      {currentItems.length === 0 ? (
        <div className="text-center py-12 bg-white dark:bg-slate-800 rounded-xl border border-dashed border-gray-300 dark:border-gray-700">
          <ChatBubbleLeftEllipsisIcon className="h-12 w-12 mx-auto text-gray-300 dark:text-gray-600 mb-3" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">
            Tidak ada testimoni
          </h3>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            {searchQuery
              ? "Coba ubah kata kunci pencarian Anda."
              : "Belum ada testimoni yang ditambahkan."}
          </p>
        </div>
      ) : viewMode === "grid" ? (
        /* GRID VIEW */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {currentItems.map((testimonial) => (
            <div
              key={testimonial.id}
              className="group bg-white dark:bg-slate-800 rounded-xl shadow-sm hover:shadow-md border border-gray-200 dark:border-gray-700 transition overflow-hidden flex flex-col"
            >
              <div className="relative aspect-video overflow-hidden bg-gray-100 dark:bg-slate-700">
                {testimonial.image_url ? (
                  <img
                    src={testimonial.image_url}
                    alt={testimonial.alt_text || ""}
                    className="w-full h-full object-cover transition duration-300 group-hover:scale-105"
                  />
                ) : (
                  <div className="flex items-center justify-center h-full text-gray-300">
                    <PhotoIcon className="w-12 h-12" />
                  </div>
                )}

                {/* Overlay Actions */}
                <div className="absolute top-2 right-2 flex gap-1 transform translate-y-[-10px] opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition duration-200">
                  <button
                    onClick={() => handleEditTestimonial(testimonial)}
                    className="p-1.5 bg-white dark:bg-slate-800 rounded-full shadow-sm text-gray-600 hover:text-blue-500 hover:bg-blue-50 dark:text-gray-300"
                  >
                    <PencilIcon className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDeleteTestimonial(testimonial.id)}
                    className="p-1.5 bg-white dark:bg-slate-800 rounded-full shadow-sm text-gray-600 hover:text-red-500 hover:bg-red-50 dark:text-gray-300"
                  >
                    <TrashIcon className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="p-4 flex-1 flex flex-col">
                <p className="text-sm font-medium text-gray-900 dark:text-white line-clamp-2">
                  {testimonial.alt_text || "Tidak ada teks"}
                </p>

                <div className="mt-auto pt-3 border-t border-gray-100 dark:border-gray-700">
                  <span className="text-[10px] text-gray-400">
                    {formatDate(testimonial.created_at)}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* LIST VIEW */
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 dark:bg-slate-800 text-gray-500 dark:text-gray-400 font-medium border-b border-gray-200 dark:border-gray-700">
                <tr>
                  <th className="px-6 py-4">Gambar</th>
                  <th className="px-6 py-4">Teks Alternatif</th>
                  <th className="px-6 py-4">Tanggal Dibuat</th>
                  <th className="px-6 py-4 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {currentItems.map((testimonial) => (
                  <tr
                    key={testimonial.id}
                    className="hover:bg-gray-50 dark:hover:bg-slate-800/50 transition"
                  >
                    <td className="px-6 py-4">
                      <div className="h-12 w-20 shrink-0 overflow-hidden rounded-lg bg-gray-100 dark:bg-slate-700 border border-gray-200 dark:border-gray-600">
                        {testimonial.image_url ? (
                          <img
                            src={testimonial.image_url}
                            alt=""
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <PhotoIcon className="h-5 w-5 m-auto text-gray-400 mt-3.5" />
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-gray-900 dark:text-white font-medium">
                      {testimonial.alt_text || "-"}
                    </td>
                    <td className="px-6 py-4 text-gray-500 dark:text-gray-400">
                      {formatDate(testimonial.created_at)}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleEditTestimonial(testimonial)}
                          className="text-gray-400 hover:text-blue-500 transition"
                          title="Edit"
                        >
                          <PencilIcon className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => handleDeleteTestimonial(testimonial.id)}
                          className="text-gray-400 hover:text-red-500 transition"
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
      )}

      {/* Pagination */}
      {totalItems > 0 && (
        <div className="flex items-center justify-between border-t border-gray-200 dark:border-gray-800 px-0 py-4 mt-6">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Menampilkan {indexOfFirstItem + 1} -{" "}
            {Math.min(indexOfLastItem, totalItems)} dari {totalItems} testimoni
          </p>
          <div className="flex gap-1">
            <button
              onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
              className="p-2 rounded-lg border border-gray-300 dark:border-gray-700 disabled:opacity-50 hover:bg-gray-50 dark:hover:bg-slate-800 transition"
            >
              <ChevronLeftIcon className="w-5 h-5 text-gray-500" />
            </button>
            <button
              onClick={() =>
                setCurrentPage((prev) => Math.min(totalPages, prev + 1))
              }
              disabled={currentPage === totalPages}
              className="p-2 rounded-lg border border-gray-300 dark:border-gray-700 disabled:opacity-50 hover:bg-gray-50 dark:hover:bg-slate-800 transition"
            >
              <ChevronRightIcon className="w-5 h-5 text-gray-500" />
            </button>
          </div>
        </div>
      )}

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white dark:bg-slate-800 rounded-2xl w-full max-w-lg shadow-xl my-8">
            <div className="p-6 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center sticky top-0 bg-white dark:bg-slate-800 rounded-t-2xl z-10">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                {editingTestimonial ? "Edit Testimoni" : "Tambah Testimoni"}
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <XMarkIcon className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Image Upload */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Gambar Testimoni
                </label>
                <div
                  className={`border-2 border-dashed rounded-xl p-6 text-center transition-colors ${isDragging
                    ? "border-primary bg-primary/5"
                    : "border-gray-300 dark:border-gray-700 hover:border-primary"
                    } cursor-pointer`}
                  onClick={() => fileInputRef.current?.click()}
                >
                  {imagePreview ? (
                    <div className="relative aspect-video max-h-48 mx-auto rounded-lg overflow-hidden">
                      <img
                        src={imagePreview}
                        alt="Preview"
                        className="w-full h-full object-contain bg-gray-50 dark:bg-slate-900"
                      />
                      <button
                        className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full shadow hover:bg-red-600"
                        onClick={(e) => {
                          e.stopPropagation();
                          setImagePreview(null);
                          setFormData((prev) => ({ ...prev, image_url: "" }));
                          if (fileInputRef.current)
                            fileInputRef.current.value = "";
                        }}
                      >
                        <XMarkIcon className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <div className="w-12 h-12 bg-gray-100 dark:bg-slate-700 rounded-full flex items-center justify-center mx-auto text-gray-400">
                        <PhotoIcon className="w-6 h-6" />
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Klik untuk upload atau drag & drop gambar
                      </p>
                      <p className="text-xs text-gray-400">Max 5MB</p>
                    </div>
                  )}
                </div>
                <input
                  type="file"
                  ref={fileInputRef}
                  className="hidden"
                  accept="image/*"
                  onChange={handleImageChange}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Teks Alternatif
                </label>
                <input
                  type="text"
                  className={inputStyle}
                  value={formData.alt_text}
                  onChange={(e) =>
                    setFormData({ ...formData, alt_text: e.target.value })
                  }
                  placeholder="Contoh: Testimoni dari Client A"
                />
              </div>
            </div>

            <div className="p-6 border-t border-gray-100 dark:border-gray-700 flex justify-end gap-3 bg-gray-50 dark:bg-slate-800/50 rounded-b-2xl sticky bottom-0">
              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 dark:bg-slate-700 dark:text-white dark:border-gray-600 transition"
              >
                Batal
              </button>
              <button
                onClick={handleSaveTestimonial}
                disabled={saving || uploadingImage}
                className="px-6 py-2.5 text-sm font-medium text-white bg-primary rounded-lg hover:bg-primary/80 disabled:opacity-70 disabled:cursor-not-allowed flex items-center gap-2 transition shadow-sm"
              >
                {saving || uploadingImage ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    {uploadingImage ? "Mengupload..." : "Menyimpan..."}
                  </>
                ) : (
                  "Simpan"
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
