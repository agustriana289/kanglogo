"use client";

import { useState, useEffect, useRef } from "react";
import { supabase } from "@/lib/supabase";
import { useAlert } from "@/components/providers/AlertProvider";
import { Project } from "@/types/project";
import LogoPathAnimation from "@/components/LogoPathAnimation";
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
  ChevronDownIcon,
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

  const [itemsPerPage, setItemsPerPage] = useState(12);
  const [pageDropdownOpen, setPageDropdownOpen] = useState(false);
  const pageDropdownRef = useRef<HTMLDivElement>(null);

  // Calculate total pages
  const totalPages = Math.ceil(totalItems / itemsPerPage);

  // Calculate the range of items to display
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredProjects.slice(indexOfFirstItem, indexOfLastItem);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (pageDropdownRef.current && !pageDropdownRef.current.contains(event.target as Node)) {
        setPageDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

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

  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    const maxPagesToShow = 5;

    if (totalPages <= maxPagesToShow) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      if (currentPage <= 3) {
        for (let i = 1; i <= 4; i++) {
          pages.push(i);
        }
        pages.push("...");
        pages.push(totalPages);
      } else if (currentPage >= totalPages - 2) {
        pages.push(1);
        pages.push("...");
        for (let i = totalPages - 3; i <= totalPages; i++) {
          pages.push(i);
        }
      } else {
        pages.push(1);
        pages.push("...");
        pages.push(currentPage - 1);
        pages.push(currentPage);
        pages.push(currentPage + 1);
        pages.push("...");
        pages.push(totalPages);
      }
    }
    return pages;
  };

  const inputStyle =
    "bg-white dark:bg-slate-900 shadow-sm focus:border-blue-300 focus:ring-blue-500/10 dark:focus:border-blue-800 w-full rounded-lg border border-gray-300 py-2.5 px-4 text-sm text-gray-800 placeholder:text-gray-400 focus:ring-3 focus:outline-none dark:border-gray-700 dark:text-white/90 dark:placeholder:text-white/30";

  if (loading) {
    return (
      <div className="fixed inset-0 z-50 flex justify-center items-center bg-white dark:bg-slate-900">
        <LogoPathAnimation />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 p-4 sm:p-6 lg:p-8 font-sans">

      {/* Header */}
      <div className="bg-white rounded-2xl shadow-sm p-4 mb-6 border border-slate-100">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          {/* Left: Action Buttons */}
          <div className="flex items-center gap-2">
            <Link
              href="/admin/projects/batch"
              className="border border-primary text-primary hover:bg-primary hover:text-white px-4 py-2.5 rounded-lg flex items-center justify-center gap-2 text-sm font-medium transition"
            >
              <CloudArrowUpIcon className="w-5 h-5" />
              <span className="hidden sm:inline">Batch Upload</span>
            </Link>
            <button
              onClick={handleAddProject}
              className="bg-primary hover:bg-primary/80 text-white px-4 py-2.5 rounded-lg flex items-center justify-center gap-2 text-sm font-medium transition shadow-sm"
            >
              <PlusIcon className="w-5 h-5" />
              Tambah Proyek
            </button>
          </div>

          {/* Right: Filters */}
          <div className="flex flex-col sm:flex-row gap-3">
            {/* Search */}
            <div className="relative">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Cari proyek..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 pr-4 py-3 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary w-full sm:w-48"
              />
            </div>
            <div className="flex flex-row gap-3">
              {/* Filter Type */}
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="h-11 px-4 py-2 text-sm border border-gray-300 rounded-lg bg-white hover:bg-gray-50 focus:ring-2 focus:ring-primary focus:border-primary transition-all text-gray-700"
              >
                <option value="">Semua Tipe</option>
                {projectTypes.map((type) => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>

              {/* View Toggle */}
              <div className="flex bg-gray-100 p-1 rounded-lg">
                <button
                  onClick={() => setViewMode("grid")}
                  className={`p-2 rounded-md transition ${viewMode === "grid"
                    ? "bg-white shadow-sm text-primary"
                    : "text-gray-500 hover:text-gray-700"
                    }`}
                >
                  <Squares2X2Icon className="w-5 h-5" />
                </button>
                <button
                  onClick={() => setViewMode("list")}
                  className={`p-2 rounded-md transition ${viewMode === "list"
                    ? "bg-white shadow-sm text-primary"
                    : "text-gray-500 hover:text-gray-700"
                    }`}
                >
                  <ListBulletIcon className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content Section */}
      {currentItems.length === 0 ? (
        <div className="text-center py-12 bg-white dark:bg-slate-800 rounded-2xl border border-dashed border-slate-300 dark:border-gray-700">
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
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-primary text-white font-medium">
                <tr>
                  <th className="px-6 py-4 rounded-tl-lg">Proyek</th>
                  <th className="px-6 py-4">Klien</th>
                  <th className="px-6 py-4">Tipe</th>
                  <th className="px-6 py-4">Tanggal Mulai</th>
                  <th className="px-6 py-4">Tanggal Selesai</th>
                  <th className="px-6 py-4 text-right rounded-tr-lg">Aksi</th>
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
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleEditProject(project)}
                          className="p-2 text-gray-400 hover:text-blue-500 hover:bg-blue-50 rounded-lg transition"
                          title="Edit"
                        >
                          <PencilIcon className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => handleDeleteProject(project.id)}
                          className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition"
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
      {filteredProjects.length > 0 && (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4 p-4 mt-6">
          <nav aria-label="Page navigation" className="flex items-center space-x-4">
            <ul className="flex -space-x-px text-sm gap-2">
              <li>
                <button
                  onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                  className="flex items-center justify-center text-body bg-neutral-secondary-medium border border-default-medium hover:bg-neutral-tertiary-medium hover:text-heading shadow-xs font-medium leading-5 rounded-s-base text-sm px-3 h-9 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed rounded-lg"
                >
                  Sebelumnya
                </button>
              </li>
              {getPageNumbers().map((page, idx) => (
                <li key={idx}>
                  {page === "..." ? (
                    <span className="flex items-center justify-center text-body bg-neutral-secondary-medium border border-default-medium shadow-xs font-medium leading-5 text-sm w-9 h-9 rounded-lg">
                      ...
                    </span>
                  ) : (
                    <button
                      onClick={() => setCurrentPage(page as number)}
                      className={`flex items-center justify-center border shadow-xs font-medium leading-5 text-sm w-9 h-9 focus:outline-none rounded-lg ${currentPage === page
                        ? "text-fg-brand bg-neutral-tertiary-medium border-default-medium"
                        : "text-body bg-neutral-secondary-medium border-default-medium hover:bg-neutral-tertiary-medium hover:text-heading"
                        }`}
                    >
                      {page}
                    </button>
                  )}
                </li>
              ))}
              <li>
                <button
                  onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages || totalPages === 0}
                  className="flex items-center justify-center text-body bg-neutral-secondary-medium border border-default-medium hover:bg-neutral-tertiary-medium hover:text-heading shadow-xs font-medium leading-5 rounded-e-base text-sm px-3 h-9 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed rounded-lg"
                >
                  Selanjutnya
                </button>
              </li>
            </ul>
          </nav>

          {/* Items Per Page - Custom Dropdown */}
          <div className="hidden sm:inline relative" ref={pageDropdownRef}>
            <button
              onClick={() => setPageDropdownOpen(!pageDropdownOpen)}
              className="h-9 flex items-center gap-2 px-3 py-2 text-sm border border-gray-300 rounded-lg bg-white hover:bg-gray-50 focus:ring-2 focus:ring-primary focus:border-primary transition-all"
            >
              <span className="text-gray-700">{itemsPerPage} halaman</span>
              <ChevronDownIcon className={`w-4 h-4 text-gray-400 transition-transform ${pageDropdownOpen ? "rotate-180" : ""}`} />
            </button>
            {pageDropdownOpen && (
              <div className="absolute bottom-full left-0 mb-1 w-32 bg-white border border-gray-200 rounded-lg shadow-lg z-20 animate-in fade-in slide-in-from-bottom-2 duration-150">
                {[12, 24, 48, 96].map((value) => (
                  <button
                    key={value}
                    onClick={() => {
                      setItemsPerPage(value);
                      setPageDropdownOpen(false);
                      setCurrentPage(1);
                    }}
                    className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-100 first:rounded-t-lg last:rounded-b-lg transition-colors ${itemsPerPage === value
                      ? "bg-primary/10 text-primary font-medium"
                      : "text-gray-700"
                      }`}
                  >
                    {value} halaman
                  </button>
                ))}
              </div>
            )}
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
