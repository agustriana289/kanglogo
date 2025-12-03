// app/admin/projects/page.tsx
"use client";

import { useState, useEffect, useRef } from "react";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/useToast";
import Toast from "@/components/Toast";
import { Project } from "@/types/project";
import LogoLoading from "@/components/LogoLoading";
import { uploadImageToImgBB } from "@/lib/imgbb-project";
import {
  PlusIcon,
  PencilIcon,
  TrashIcon,
  PhotoIcon,
  CalendarIcon,
  TagIcon,
  UserIcon,
  XMarkIcon,
  DocumentTextIcon,
  ComputerDesktopIcon,
  LightBulbIcon,
  ChatBubbleLeftIcon,
  MagnifyingGlassIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
} from "@heroicons/react/24/outline";

// Opsi untuk jenis proyek
const projectTypes = [
  "Logo",
  "Branding",
  "Banner",
  "Brosur",
  "Compro",
  "Kemasan",
  "Template",
  "Icon",
  "Custom",
  "Lainnya",
];

// Opsi untuk aplikasi yang digunakan
const applicationOptions = [
  "Adobe Illustrator",
  "Adobe Photoshop",
  "Adobe AfterEffect",
  "CorelDraw",
  "Affinity Designer",
  "Inkscape",
  "Blender",
  "Canva",
];

// Items per page
const ITEMS_PER_PAGE = 20;

export default function ProjectManagementPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [filteredProjects, setFilteredProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const { toast, showToast, hideToast } = useToast();

  const [showModal, setShowModal] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);

  const [formData, setFormData] = useState({
    title: "",
    slug: "",
    type: "",
    owner: "",
    start_date: "",
    end_date: "",
    image_url: "",
    deskripsi_proyek: "",
    komentar_proyek: "",
    aplikasi_yang_digunakan: [] as string[],
    filosofi_proyek: "",
  });

  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  // Calculate total pages
  const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE);

  // Calculate the range of items to display
  const indexOfLastItem = currentPage * ITEMS_PER_PAGE;
  const indexOfFirstItem = indexOfLastItem - ITEMS_PER_PAGE;
  const currentItems = filteredProjects.slice(
    indexOfFirstItem,
    indexOfLastItem
  );

  useEffect(() => {
    fetchProjects();
  }, []);

  useEffect(() => {
    // Filter projects based on search query
    if (searchQuery.trim() === "") {
      setFilteredProjects(projects);
    } else {
      const filtered = projects.filter(
        (project) =>
          project.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          project.type?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          project.owner?.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredProjects(filtered);
    }
    // Reset to first page when search changes
    setCurrentPage(1);
  }, [searchQuery, projects]);

  const fetchProjects = async () => {
    try {
      // Get total count first
      const { count, error: countError } = await supabase
        .from("projects")
        .select("*", { count: "exact", head: true });

      if (countError) throw countError;
      setTotalItems(count || 0);

      // Then get the data with pagination
      const { data, error } = await supabase
        .from("projects")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setProjects(data || []);
      setFilteredProjects(data || []);
    } catch (error) {
      console.error("Error fetching projects:", error);
      showToast("Gagal memuat proyek!", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleAddProject = () => {
    setEditingProject(null);
    setFormData({
      title: "",
      slug: "",
      type: "",
      owner: "",
      start_date: "",
      end_date: "",
      image_url: "",
      deskripsi_proyek: "",
      komentar_proyek: "",
      aplikasi_yang_digunakan: [],
      filosofi_proyek: "",
    });
    setImagePreview(null);
    setShowModal(true);
  };

  const handleEditProject = (project: Project) => {
    setEditingProject(project);

    // Parse aplikasi_yang_digunakan jika berupa string JSON
    let apps: string[] = [];
    if (project.aplikasi_yang_digunakan) {
      try {
        if (typeof project.aplikasi_yang_digunakan === "string") {
          // Coba parse sebagai JSON array
          if (project.aplikasi_yang_digunakan.startsWith("[")) {
            apps = JSON.parse(project.aplikasi_yang_digunakan);
          } else {
            // Jika bukan JSON, pecah berdasarkan koma
            apps = project.aplikasi_yang_digunakan
              .split(",")
              .map((app) => app.trim());
          }
        } else if (Array.isArray(project.aplikasi_yang_digunakan)) {
          apps = project.aplikasi_yang_digunakan;
        }
      } catch (e) {
        console.error("Error parsing aplikasi_yang_digunakan:", e);
        apps = [project.aplikasi_yang_digunakan as string];
      }
    }

    setFormData({
      title: project.title,
      slug: project.slug,
      type: project.type || "",
      owner: project.owner || "",
      start_date: project.start_date || "",
      end_date: project.end_date || "",
      image_url: project.image_url || "",
      deskripsi_proyek: project.deskripsi_proyek || "",
      komentar_proyek: project.komentar_proyek || "",
      aplikasi_yang_digunakan: apps,
      filosofi_proyek: project.filosofi_proyek || "",
    });
    setImagePreview(project.image_url || null);
    setShowModal(true);
  };

  const handleDeleteProject = async (id: number) => {
    if (!confirm("Apakah Anda yakin ingin menghapus proyek ini?")) return;

    setSaving(true);
    try {
      const { error } = await supabase.from("projects").delete().eq("id", id);
      if (error) throw error;

      setProjects(projects.filter((p) => p.id !== id));
      showToast("Proyek berhasil dihapus!", "success");
    } catch (error) {
      console.error("Error deleting project:", error);
      showToast("Gagal menghapus proyek!", "error");
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

  const handleApplicationChange = (app: string) => {
    setFormData((prev) => {
      const apps = [...prev.aplikasi_yang_digunakan];
      if (apps.includes(app)) {
        // Hapus jika sudah ada
        return {
          ...prev,
          aplikasi_yang_digunakan: apps.filter((a) => a !== app),
        };
      } else {
        // Tambahkan jika belum ada
        return {
          ...prev,
          aplikasi_yang_digunakan: [...apps, app],
        };
      }
    });
  };

  const handleSaveProject = async () => {
    if (!formData.title.trim() || !formData.slug.trim()) {
      showToast("Judul dan Slug tidak boleh kosong!", "error");
      return;
    }

    setSaving(true);
    try {
      let imageUrl = formData.image_url;

      if (fileInputRef.current?.files?.[0]) {
        setUploadingImage(true);
        imageUrl = await uploadImageToImgBB(fileInputRef.current.files[0]);
        setUploadingImage(false);
      }

      // Konversi array aplikasi ke string untuk disimpan di database
      const updatedFormData = {
        ...formData,
        image_url: imageUrl,
        aplikasi_yang_digunakan: JSON.stringify(
          formData.aplikasi_yang_digunakan
        ),
      };

      if (editingProject) {
        const { error } = await supabase
          .from("projects")
          .update(updatedFormData)
          .eq("id", editingProject.id);
        if (error) throw error;
        setProjects(
          projects.map((p) =>
            p.id === editingProject.id ? { ...p, ...updatedFormData } : p
          )
        );
        showToast("Proyek berhasil diperbarui!", "success");
      } else {
        const { data, error } = await supabase
          .from("projects")
          .insert([updatedFormData])
          .select();
        if (error) throw error;
        setProjects([...(data || []), ...projects]);
        showToast("Proyek berhasil ditambahkan!", "success");
      }
      setShowModal(false);
    } catch (error) {
      console.error("Error saving project:", error);
      showToast(
        `Gagal menyimpan proyek: ${
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
    setEditingProject(null);
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return "-";
    return new Date(dateString).toLocaleDateString("id-ID", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    });
  };

  // Generate page numbers
  const getPageNumbers = () => {
    const pages = [];
    const maxVisiblePages = 5;

    if (totalPages <= maxVisiblePages) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      const startPage = Math.max(1, currentPage - 2);
      const endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

      if (startPage > 1) {
        pages.push(1);
        if (startPage > 2) {
          pages.push("...");
        }
      }

      for (let i = startPage; i <= endPage; i++) {
        pages.push(i);
      }

      if (endPage < totalPages) {
        if (endPage < totalPages - 1) {
          pages.push("...");
        }
        pages.push(totalPages);
      }
    }

    return pages;
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
        {/* Header Section - Diperbaiki dengan Search */}
        <div className="mb-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <button
              onClick={handleAddProject}
              className="inline-flex items-center px-4 py-2 bg-primary text-white font-medium rounded-lg shadow-sm hover:bg-primary/90 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
            >
              <PlusIcon className="h-5 w-5 mr-2" />
              Tambah Proyek
            </button>

            <div className="relative w-full sm:w-auto">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <MagnifyingGlassIcon className="h-5 w-5 text-slate-400" />
              </div>
              <input
                type="text"
                className="block w-full sm:w-64 pl-10 pr-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-500 dark:placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                placeholder="Cari proyek..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* Items Count */}
        <div className="mb-4 text-sm text-slate-600 dark:text-slate-400">
          Menampilkan {indexOfFirstItem + 1}-
          {Math.min(indexOfLastItem, filteredProjects.length)} dari{" "}
          {filteredProjects.length} proyek
        </div>

        {/* Desktop Table View */}
        <div className="hidden md:block overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-600">
            <thead className="bg-slate-50 dark:bg-slate-800">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-300 uppercase tracking-wider">
                  Judul
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-300 uppercase tracking-wider">
                  Tipe
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-300 uppercase tracking-wider">
                  Owner
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-300 uppercase tracking-wider">
                  Aksi
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-slate-700 divide-y divide-slate-200 dark:divide-slate-600">
              {currentItems.map((project) => (
                <tr
                  key={project.id}
                  className="hover:bg-slate-50 dark:hover:bg-slate-800/50"
                >
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900 dark:text-white">
                    <div className="flex items-center">
                      <PhotoIcon className="h-5 w-5 text-slate-400 mr-3" />
                      {project.title}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 dark:text-slate-300">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400">
                      <TagIcon className="h-4 w-4 mr-1" />
                      {project.type}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 dark:text-slate-300">
                    <div className="flex items-center">
                      <UserIcon className="h-4 w-4 text-slate-400 mr-1" />
                      {project.owner}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleEditProject(project)}
                        className="inline-flex items-center px-3 py-1.5 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 rounded-md hover:bg-indigo-100 dark:hover:bg-indigo-900/30 transition-colors"
                      >
                        <PencilIcon className="h-4 w-4 mr-1" />
                        Edit
                      </button>
                      <button
                        onClick={() => handleDeleteProject(project.id)}
                        className="inline-flex items-center px-3 py-1.5 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-md hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors"
                      >
                        <TrashIcon className="h-4 w-4 mr-1" />
                        Hapus
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile Card View */}
        <div className="md:hidden space-y-4">
          {currentItems.map((project) => (
            <div
              key={project.id}
              className="bg-white dark:bg-slate-800 rounded-lg shadow p-4 border border-slate-200 dark:border-slate-600"
            >
              <div className="flex justify-between items-start mb-3">
                <div className="flex items-start">
                  <PhotoIcon className="h-5 w-5 text-slate-400 mr-3 mt-0.5" />
                  <div className="flex-1">
                    <h3 className="text-lg font-medium text-slate-900 dark:text-white">
                      {project.title}
                    </h3>
                    <div className="flex items-center mt-1">
                      <UserIcon className="h-4 w-4 text-slate-400 mr-1" />
                      <span className="text-sm text-slate-500 dark:text-slate-400">
                        {project.owner}
                      </span>
                    </div>
                  </div>
                </div>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400">
                  <TagIcon className="h-4 w-4 mr-1" />
                  {project.type}
                </span>
              </div>
              <div className="flex justify-end space-x-2">
                <button
                  onClick={() => handleEditProject(project)}
                  className="inline-flex items-center px-3 py-1.5 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 rounded-md hover:bg-indigo-100 dark:hover:bg-indigo-900/30 transition-colors"
                >
                  <PencilIcon className="h-4 w-4 mr-1" />
                  Edit
                </button>
                <button
                  onClick={() => handleDeleteProject(project.id)}
                  className="inline-flex items-center px-3 py-1.5 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-md hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors"
                >
                  <TrashIcon className="h-4 w-4 mr-1" />
                  Hapus
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Empty State */}
        {currentItems.length === 0 && (
          <div className="text-center py-12">
            <PhotoIcon className="mx-auto h-12 w-12 text-slate-400" />
            <h3 className="mt-2 text-sm font-medium text-slate-900 dark:text-white">
              {searchQuery
                ? "Tidak ada proyek yang ditemukan"
                : "Tidak ada proyek"}
            </h3>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              {searchQuery
                ? "Coba ubah kata kunci pencarian Anda."
                : "Belum ada proyek yang dibuat."}
            </p>
            {!searchQuery && (
              <div className="mt-6">
                <button
                  onClick={handleAddProject}
                  className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary hover:bg-primary/80 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
                >
                  <PlusIcon className="-ml-1 mr-2 h-5 w-5" />
                  Tambah Proyek Baru
                </button>
              </div>
            )}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="mt-6 flex items-center justify-between">
            <div className="text-sm text-slate-700 dark:text-slate-300">
              Halaman {currentPage} dari {totalPages}
            </div>
            <div className="flex items-center space-x-1">
              <button
                onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="p-2 rounded-md border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronLeftIcon className="h-5 w-5" />
              </button>

              {getPageNumbers().map((page, index) =>
                page === "..." ? (
                  <span
                    key={`ellipsis-${index}`}
                    className="px-3 py-2 text-slate-500 dark:text-slate-400"
                  >
                    ...
                  </span>
                ) : (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page as number)}
                    className={`px-3 py-2 rounded-md border ${
                      currentPage === page
                        ? "bg-primary text-white border-primary"
                        : "border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700"
                    }`}
                  >
                    {page}
                  </button>
                )
              )}

              <button
                onClick={() =>
                  setCurrentPage((prev) => Math.min(prev + 1, totalPages))
                }
                disabled={currentPage === totalPages}
                className="p-2 rounded-md border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronRightIcon className="h-5 w-5" />
              </button>
            </div>
          </div>
        )}

        {/* Modal for Add/Edit Project - Diperbaiki */}
        {showModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-slate-700 rounded-lg p-6 w-full max-w-6xl max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-start mb-6">
                <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                  {editingProject ? "Edit Proyek" : "Tambah Proyek Baru"}
                </h2>
                <button
                  onClick={closeModal}
                  className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                >
                  <XMarkIcon className="h-6 w-6" />
                </button>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Left Column - Image Upload & Basic Info */}
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                      Judul Proyek
                    </label>
                    <input
                      type="text"
                      className="block w-full rounded-md border-slate-300 dark:border-slate-600 shadow-sm p-2 border dark:bg-slate-800 dark:text-white"
                      value={formData.title}
                      onChange={(e) =>
                        setFormData({ ...formData, title: e.target.value })
                      }
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                      Slug (URL-friendly)
                    </label>
                    <input
                      type="text"
                      className="block w-full rounded-md border-slate-300 dark:border-slate-600 shadow-sm p-2 border dark:bg-slate-800 dark:text-white"
                      value={formData.slug}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          slug: e.target.value
                            .toLowerCase()
                            .replace(/\s+/g, "-"),
                        })
                      }
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                      Gambar Proyek
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
                            className="h-48 w-auto object-contain mb-4"
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

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                        Tanggal Mulai
                      </label>
                      <input
                        type="date"
                        className="block w-full rounded-md border-slate-300 dark:border-slate-600 shadow-sm p-2 border dark:bg-slate-800 dark:text-white"
                        value={formData.start_date}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            start_date: e.target.value,
                          })
                        }
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                        Tanggal Selesai
                      </label>
                      <input
                        type="date"
                        className="block w-full rounded-md border-slate-300 dark:border-slate-600 shadow-sm p-2 border dark:bg-slate-800 dark:text-white"
                        value={formData.end_date}
                        onChange={(e) =>
                          setFormData({ ...formData, end_date: e.target.value })
                        }
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                      Jenis Proyek
                    </label>
                    <select
                      className="block w-full rounded-md border-slate-300 dark:border-slate-600 shadow-sm p-2 border dark:bg-slate-800 dark:text-white"
                      value={formData.type}
                      onChange={(e) =>
                        setFormData({ ...formData, type: e.target.value })
                      }
                    >
                      <option value="">Pilih Jenis Proyek</option>
                      {projectTypes.map((type) => (
                        <option key={type} value={type}>
                          {type}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Right Column - Project Details */}
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                      Owner Proyek
                    </label>
                    <input
                      type="text"
                      className="block w-full rounded-md border-slate-300 dark:border-slate-600 shadow-sm p-2 border dark:bg-slate-800 dark:text-white"
                      value={formData.owner}
                      onChange={(e) =>
                        setFormData({ ...formData, owner: e.target.value })
                      }
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                      Aplikasi yang Digunakan
                    </label>
                    <div className="border border-slate-300 dark:border-slate-600 rounded-md p-3 dark:bg-slate-800">
                      <div className="grid grid-cols-2 gap-3">
                        {applicationOptions.map((app) => (
                          <div key={app} className="flex items-center">
                            <input
                              type="checkbox"
                              id={`app-${app}`}
                              className="h-4 w-4 rounded border-slate-300 text-primary focus:ring-primary dark:border-slate-600 dark:bg-slate-700"
                              checked={formData.aplikasi_yang_digunakan.includes(
                                app
                              )}
                              onChange={() => handleApplicationChange(app)}
                            />
                            <label
                              htmlFor={`app-${app}`}
                              className="ml-2 text-sm text-slate-700 dark:text-slate-300"
                            >
                              {app}
                            </label>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2 flex items-center">
                      <DocumentTextIcon className="h-4 w-4 mr-1" />
                      Deskripsi Proyek
                    </label>
                    <textarea
                      rows={4}
                      className="block w-full rounded-md border-slate-300 dark:border-slate-600 shadow-sm p-2 border dark:bg-slate-800 dark:text-white"
                      value={formData.deskripsi_proyek}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          deskripsi_proyek: e.target.value,
                        })
                      }
                    ></textarea>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2 flex items-center">
                      <ChatBubbleLeftIcon className="h-4 w-4 mr-1" />
                      Komentar Proyek (Pandangan Desainer)
                    </label>
                    <textarea
                      rows={4}
                      className="block w-full rounded-md border-slate-300 dark:border-slate-600 shadow-sm p-2 border dark:bg-slate-800 dark:text-white"
                      value={formData.komentar_proyek}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          komentar_proyek: e.target.value,
                        })
                      }
                    ></textarea>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2 flex items-center">
                      <LightBulbIcon className="h-4 w-4 mr-1" />
                      Filosofi Proyek
                    </label>
                    <textarea
                      rows={4}
                      className="block w-full rounded-md border-slate-300 dark:border-slate-600 shadow-sm p-2 border dark:bg-slate-800 dark:text-white"
                      value={formData.filosofi_proyek}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          filosofi_proyek: e.target.value,
                        })
                      }
                    ></textarea>
                  </div>
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
                  onClick={handleSaveProject}
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
