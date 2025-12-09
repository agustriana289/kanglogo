"use client";

import { useState, useEffect, useRef } from "react";
import { supabase } from "@/lib/supabase";
import { useAlert } from "@/components/providers/AlertProvider";
import { Project } from "@/types/project";
import LogoLoading from "@/components/LogoLoading";
import { uploadFile } from "@/lib/supabase-storage";
import Link from "next/link";
import {
  PlusIcon,
  PencilIcon,
  TrashIcon,
  PhotoIcon,
  CalendarIcon,
  UserIcon,
  XMarkIcon,
  DocumentTextIcon,
  MagnifyingGlassIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  Squares2X2Icon,
  ListBulletIcon,
  BriefcaseIcon,
  TagIcon,
  ComputerDesktopIcon,
  CloudArrowUpIcon,
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
const ITEMS_PER_PAGE = 12;

export default function ProjectManagementPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [filteredProjects, setFilteredProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const { showAlert, showConfirm } = useAlert();

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
  const currentItems = filteredProjects.slice(indexOfFirstItem, indexOfLastItem);

  useEffect(() => {
    fetchProjects();
  }, []);

  useEffect(() => {
    // Filter projects based on search query and type
    let filtered = projects;

    if (searchQuery.trim() !== "") {
      filtered = filtered.filter(
        (project) =>
          project.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          project.owner?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    if (filterType !== "") {
      filtered = filtered.filter((project) => project.type === filterType);
    }

    setFilteredProjects(filtered);
    setTotalItems(filtered.length);
    setCurrentPage(1);
  }, [searchQuery, filterType, projects]);

  // Auto generate slug
  useEffect(() => {
    if (formData.title && !editingProject) {
      const slug = formData.title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "");
      setFormData((prev) => ({ ...prev, slug }));
    }
  }, [formData.title, editingProject]);

  const fetchProjects = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("projects")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setProjects(data || []);
      setFilteredProjects(data || []);
      setTotalItems(data?.length || 0);
    } catch (error) {
      console.error("Error fetching projects:", error);
      showAlert("error", "Error", "Gagal memuat proyek!");
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

    // Parse aplikasi_yang_digunakan
    let apps: string[] = [];
    if (project.aplikasi_yang_digunakan) {
      try {
        if (typeof project.aplikasi_yang_digunakan === "string") {
          if (project.aplikasi_yang_digunakan.startsWith("[")) {
            apps = JSON.parse(project.aplikasi_yang_digunakan);
          } else {
            apps = project.aplikasi_yang_digunakan.split(",").map((app) => app.trim());
          }
        }
      } catch (e) {
        console.error("Error parsing apps:", e);
        apps = [];
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
    const confirmed = await showConfirm(
      "Hapus Proyek",
      "Apakah Anda yakin ingin menghapus proyek ini?",
      "error",
      "Ya, Hapus"
    );
    if (!confirmed) return;

    setSaving(true);
    try {
      const { error } = await supabase.from("projects").delete().eq("id", id);
      if (error) throw error;

      setProjects(projects.filter((p) => p.id !== id));
      showAlert("success", "Berhasil", "Proyek berhasil dihapus!");
    } catch (error) {
      console.error("Error deleting project:", error);
      showAlert("error", "Gagal", "Gagal menghapus proyek!");
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

  const handleApplicationChange = (app: string) => {
    setFormData((prev) => {
      const apps = [...prev.aplikasi_yang_digunakan];
      if (apps.includes(app)) {
        return { ...prev, aplikasi_yang_digunakan: apps.filter((a) => a !== app) };
      } else {
        return { ...prev, aplikasi_yang_digunakan: [...apps, app] };
      }
    });
  };

  const handleSaveProject = async () => {
    if (!formData.title.trim() || !formData.slug.trim()) {
      showAlert("warning", "Validasi", "Judul dan Slug tidak boleh kosong!");
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
        const filePath = `projects/${fileName}`;

        const { publicUrl, error: uploadError } = await uploadFile("assets", filePath, file);

        if (uploadError) {
          console.error("Upload error:", uploadError);
          throw new Error("Gagal mengupload gambar ke Supabase Storage");
        }
        imageUrl = publicUrl;
        setUploadingImage(false);
      }

      const projectData = {
        ...formData,
        image_url: imageUrl,
        aplikasi_yang_digunakan: JSON.stringify(formData.aplikasi_yang_digunakan),
      };

      if (editingProject) {
        const { error } = await supabase
          .from("projects")
          .update(projectData)
          .eq("id", editingProject.id);
        if (error) throw error;
        showAlert("success", "Berhasil", "Proyek berhasil diperbarui!");
      } else {
        const { error } = await supabase.from("projects").insert(projectData);
        if (error) throw error;
        showAlert("success", "Berhasil", "Proyek berhasil ditambahkan!");
      }

      fetchProjects();
      setShowModal(false);
    } catch (error: any) {
      console.error("Error saving project:", error);
      showAlert("error", "Gagal", error.message || "Gagal menyimpan proyek!");
    } finally {
      setSaving(false);
      setUploadingImage(false);
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "-";
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
              Daftar Proyek
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              {totalItems} proyek ditemukan
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href="/admin/projects/batch"
              className="border border-primary text-primary hover:bg-primary hover:text-white px-4 py-2.5 rounded-lg flex items-center justify-center gap-2 text-sm font-medium transition"
            >
              <CloudArrowUpIcon className="w-5 h-5" />
              Batch Upload
            </Link>
            <button
              onClick={handleAddProject}
              className="bg-primary hover:bg-primary/80 text-white px-4 py-2.5 rounded-lg flex items-center justify-center gap-2 text-sm font-medium transition shadow-sm"
            >
              <PlusIcon className="w-5 h-5" />
              Tambah Proyek
            </button>
          </div>
        </div>

        {/* Filters & View Toggle */}
        <div className="mt-6 flex flex-row gap-4 items-center justify-between">
          <div className="relative w-full sm:max-w-md">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Cari proyek atau klien..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition"
            />
          </div>

          <div className="flex items-center gap-2 w-auto">
            {/* Filter Type */}
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="hidden sm:block px-4 py-2.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition text-gray-600 dark:text-gray-300"
            >
              <option value="">Semua Tipe</option>
              {projectTypes.map((type) => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>

            {/* View Toggle */}
            <div className="flex bg-gray-100 dark:bg-slate-800 p-1 rounded-lg ml-auto sm:ml-0">
              <button
                onClick={() => setViewMode("grid")}
                className={`p-2 rounded-md transition ${viewMode === "grid" ? "bg-white dark:bg-slate-700 shadow-sm text-primary" : "text-gray-500 dark:text-gray-400 hover:text-gray-700"}`}
              >
                <Squares2X2Icon className="w-5 h-5" />
              </button>
              <button
                onClick={() => setViewMode("list")}
                className={`p-2 rounded-md transition ${viewMode === "list" ? "bg-white dark:bg-slate-700 shadow-sm text-primary" : "text-gray-500 dark:text-gray-400 hover:text-gray-700"}`}
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
          <BriefcaseIcon className="h-12 w-12 mx-auto text-gray-300 dark:text-gray-600 mb-3" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">Tidak ada proyek</h3>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            {searchQuery ? "Coba ubah kata kunci pencarian Anda." : "Belum ada proyek yang ditambahkan."}
          </p>
        </div>
      ) : viewMode === "grid" ? (
        /* GRID VIEW */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {currentItems.map((project) => (
            <div key={project.id} className="group bg-white dark:bg-slate-800 rounded-xl shadow-sm hover:shadow-md border border-gray-200 dark:border-gray-700 transition overflow-hidden flex flex-col">
              <div className="relative aspect-[4/3] overflow-hidden bg-gray-100 dark:bg-slate-700">
                {project.image_url ? (
                  <img src={project.image_url} alt={project.title} className="w-full h-full object-cover transition duration-300 group-hover:scale-105" />
                ) : (
                  <div className="flex items-center justify-center h-full text-gray-300">
                    <PhotoIcon className="w-12 h-12" />
                  </div>
                )}

                {/* Overlay Actions */}
                <div className="absolute top-2 right-2 flex gap-1 transform translate-y-[-10px] opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition duration-200">
                  <button
                    onClick={() => handleEditProject(project)}
                    className="p-1.5 bg-white dark:bg-slate-800 rounded-full shadow-sm text-gray-600 hover:text-blue-500 hover:bg-blue-50 dark:text-gray-300"
                  >
                    <PencilIcon className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDeleteProject(project.id)}
                    className="p-1.5 bg-white dark:bg-slate-800 rounded-full shadow-sm text-gray-600 hover:text-red-500 hover:bg-red-50 dark:text-gray-300"
                  >
                    <TrashIcon className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="p-4 flex-1 flex flex-col">
                <div className="flex items-start justify-between mb-2">
                  <h3 className="font-semibold text-gray-900 dark:text-white line-clamp-1">{project.title}</h3>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-2 flex items-center gap-1">
                  <UserIcon className="w-3 h-3" />
                  {project.owner || "-"}
                </p>

                <div className="mt-auto flex items-center justify-between pt-3 border-t border-gray-100 dark:border-gray-700">
                  <span className="px-2 py-0.5 text-[10px] rounded-full font-medium bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400">
                    {project.type}
                  </span>
                  <span className="text-[10px] text-gray-400">
                    {formatDate(project.created_at)}
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
                  <th className="px-6 py-4">Proyek</th>
                  <th className="px-6 py-4">Klien</th>
                  <th className="px-6 py-4">Tipe</th>
                  <th className="px-6 py-4">Tanggal Mulai</th>
                  <th className="px-6 py-4">Tanggal Selesai</th>
                  <th className="px-6 py-4 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {currentItems.map((project) => (
                  <tr key={project.id} className="hover:bg-gray-50 dark:hover:bg-slate-800/50 transition">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 shrink-0 overflow-hidden rounded-lg bg-gray-100 dark:bg-slate-700 border border-gray-200 dark:border-gray-600">
                          {project.image_url ? (
                            <img src={project.image_url} alt="" className="h-full w-full object-cover" />
                          ) : (
                            <PhotoIcon className="h-5 w-5 m-auto text-gray-400 mt-2.5" />
                          )}
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900 dark:text-white underline-offset-4 hover:underline cursor-pointer" onClick={() => handleEditProject(project)}>
                            {project.title}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400 truncate max-w-[150px]">
                            {project.slug}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-gray-600 dark:text-gray-300">
                      {project.owner || "-"}
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
                        {project.type}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-gray-500 dark:text-gray-400">
                      {formatDate(project.start_date)}
                    </td>
                    <td className="px-6 py-4 text-gray-500 dark:text-gray-400">
                      {formatDate(project.end_date)}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleEditProject(project)}
                          className="text-gray-400 hover:text-blue-500 transition"
                          title="Edit"
                        >
                          <PencilIcon className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => handleDeleteProject(project.id)}
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
            Menampilkan {indexOfFirstItem + 1} - {Math.min(indexOfLastItem, totalItems)} dari {totalItems} proyek
          </p>
          <div className="flex gap-1">
            <button
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
              className="p-2 rounded-lg border border-gray-300 dark:border-gray-700 disabled:opacity-50 hover:bg-gray-50 dark:hover:bg-slate-800 transition"
            >
              <ChevronLeftIcon className="w-5 h-5 text-gray-500" />
            </button>
            <button
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
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
          <div className="bg-white dark:bg-slate-800 rounded-2xl w-full max-w-4xl shadow-xl my-8">
            <div className="p-6 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center sticky top-0 bg-white dark:bg-slate-800 rounded-t-2xl z-10">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                {editingProject ? "Edit Proyek" : "Tambah Proyek Baru"}
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <XMarkIcon className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Left Column: Image & Basic Info */}
                <div className="space-y-4">
                  {/* Image Upload */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Gambar Sampul
                    </label>
                    <div
                      className={`border-2 border-dashed rounded-xl p-6 text-center transition-colors ${isDragging ? 'border-primary bg-primary/5' : 'border-gray-300 dark:border-gray-700 hover:border-primary'} cursor-pointer`}
                      onClick={() => fileInputRef.current?.click()}
                    >
                      {imagePreview ? (
                        <div className="relative aspect-video max-h-48 mx-auto rounded-lg overflow-hidden">
                          <img src={imagePreview} alt="Preview" className="w-full h-full object-contain bg-gray-50 dark:bg-slate-900" />
                          <button
                            className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full shadow hover:bg-red-600"
                            onClick={(e) => {
                              e.stopPropagation();
                              setImagePreview(null);
                              setFormData(prev => ({ ...prev, image_url: "" }));
                              if (fileInputRef.current) fileInputRef.current.value = "";
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
                            Klik untuk upload
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
                      Nama Proyek
                    </label>
                    <input
                      type="text"
                      className={inputStyle}
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      placeholder="Contoh: Rebranding KangLogo"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Klien / Pemilik
                    </label>
                    <input
                      type="text"
                      className={inputStyle}
                      value={formData.owner}
                      onChange={(e) => setFormData({ ...formData, owner: e.target.value })}
                      placeholder="Contoh: PT. Maju Mundur"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Kategori
                      </label>
                      <select
                        className={inputStyle}
                        value={formData.type}
                        onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                      >
                        <option value="">Pilih Kategori</option>
                        {projectTypes.map(t => <option key={t} value={t}>{t}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Slug
                      </label>
                      <input
                        type="text"
                        className={`${inputStyle} bg-gray-50 dark:bg-slate-800 text-gray-500`}
                        value={formData.slug}
                        readOnly
                      />
                    </div>
                  </div>
                </div>

                {/* Right Column: Details */}
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Tanggal Mulai
                      </label>
                      <input
                        type="date"
                        className={inputStyle}
                        value={formData.start_date}
                        onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Tanggal Selesai
                      </label>
                      <input
                        type="date"
                        className={inputStyle}
                        value={formData.end_date}
                        onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Aplikasi yang Digunakan
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      {applicationOptions.map((app) => (
                        <label key={app} className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-300 p-2 border border-gray-200 dark:border-gray-700 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-slate-800 transition">
                          <input
                            type="checkbox"
                            checked={formData.aplikasi_yang_digunakan.includes(app)}
                            onChange={() => handleApplicationChange(app)}
                            className="rounded border-gray-300 text-primary focus:ring-primary"
                          />
                          <span>{app}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Deskripsi Proyek
                    </label>
                    <textarea
                      rows={3}
                      className={inputStyle}
                      value={formData.deskripsi_proyek}
                      onChange={(e) => setFormData({ ...formData, deskripsi_proyek: e.target.value })}
                      placeholder="Ceritakan tentang proyek ini..."
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Filosofi / Konsep
                    </label>
                    <textarea
                      rows={3}
                      className={inputStyle}
                      value={formData.filosofi_proyek}
                      onChange={(e) => setFormData({ ...formData, filosofi_proyek: e.target.value })}
                      placeholder="Jelaskan makna dibalik desain..."
                    />
                  </div>
                </div>
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
                onClick={handleSaveProject}
                disabled={saving || uploadingImage}
                className="px-6 py-2.5 text-sm font-medium text-white bg-primary rounded-lg hover:bg-primary/80 disabled:opacity-70 disabled:cursor-not-allowed flex items-center gap-2 transition shadow-sm"
              >
                {saving || uploadingImage ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    {uploadingImage ? "Mengupload..." : "Menyimpan..."}
                  </>
                ) : (
                  "Simpan Proyek"
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
