"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { useAlert } from "@/components/providers/AlertProvider";
import LogoPathAnimation from "@/components/LogoPathAnimation";
import {
  PlusIcon,
  PencilIcon,
  TrashIcon,
  PhotoIcon,
  StarIcon,
  XMarkIcon,
  DocumentTextIcon,
  MagnifyingGlassIcon,
  Squares2X2Icon,
  ListBulletIcon,
  SparklesIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ChevronDownIcon,
  CalendarIcon,
} from "@heroicons/react/24/outline";
import { CheckCircleIcon } from "@heroicons/react/24/solid";

// Interfaces
interface ServicePackage {
  name: string;
  description: string;
  features: string[];
  finalPrice: string;
  originalPrice?: string;
  duration: string;
}

interface Service {
  id: number;
  title: string;
  slug: string;
  short_description?: string;
  image_src?: string;
  image_alt?: string;
  is_featured: boolean;
  packages: ServicePackage[];
  created_at?: string;
}

type FilterTab = "all" | "featured" | "standard";

export default function ServicesPage() {
  const [services, setServices] = useState<Service[]>([]);
  const [filteredServices, setFilteredServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [activeTab, setActiveTab] = useState<FilterTab>("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [dateFilter, setDateFilter] = useState("");
  const [sortOrder, setSortOrder] = useState<"desc" | "asc">("desc"); // Default newest
  const { showAlert, showConfirm } = useAlert();

  const [selectedServices, setSelectedServices] = useState<number[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  // Stats
  const [stats, setStats] = useState({
    total: 0,
    featured: 0,
    standard: 0,
    withPackages: 0,
  });

  // Dropdown states
  const [dateDropdownOpen, setDateDropdownOpen] = useState(false);
  const [sortDropdownOpen, setSortDropdownOpen] = useState(false);
  const [pageDropdownOpen, setPageDropdownOpen] = useState(false);

  // Refs for click outside detection
  const dateDropdownRef = useRef<HTMLDivElement>(null);
  const sortDropdownRef = useRef<HTMLDivElement>(null);
  const pageDropdownRef = useRef<HTMLDivElement>(null);

  // Modal State
  const [showServiceModal, setShowServiceModal] = useState(false);
  const [editingService, setEditingService] = useState<Service | null>(null);

  // Package Modal State
  const [showPackageModal, setShowPackageModal] = useState(false);
  const [editingPackageIndex, setEditingPackageIndex] = useState<number | null>(
    null
  );

  const [formData, setFormData] = useState({
    title: "",
    slug: "",
    short_description: "",
    image_src: "",
    image_alt: "",
    is_featured: false,
    packages: [
      {
        name: "",
        description: "",
        features: [""],
        finalPrice: "",
        originalPrice: "",
        duration: "",
      },
      {
        name: "",
        description: "",
        features: [""],
        finalPrice: "",
        originalPrice: "",
        duration: "",
      },
      {
        name: "",
        description: "",
        features: [""],
        finalPrice: "",
        originalPrice: "",
        duration: "",
      },
    ] as ServicePackage[],
  });

  const [packageFormData, setPackageFormData] = useState<ServicePackage>({
    name: "",
    description: "",
    features: [""],
    finalPrice: "",
    originalPrice: "",
    duration: "",
  });

  // Close dropdowns when clicking outside
  useEffect(() => {
    if (!dateDropdownOpen && !pageDropdownOpen && !sortDropdownOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (dateDropdownOpen && dateDropdownRef.current && !dateDropdownRef.current.contains(event.target as Node)) {
        setDateDropdownOpen(false);
      }
      if (sortDropdownOpen && sortDropdownRef.current && !sortDropdownRef.current.contains(event.target as Node)) {
        setSortDropdownOpen(false);
      }
      if (pageDropdownOpen && pageDropdownRef.current && !pageDropdownRef.current.contains(event.target as Node)) {
        setPageDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [dateDropdownOpen, pageDropdownOpen, sortDropdownOpen]);

  // Filter services
  useEffect(() => {
    let filtered = services;

    // Tab filter
    if (activeTab === "featured") {
      filtered = filtered.filter((s) => s.is_featured);
    } else if (activeTab === "standard") {
      filtered = filtered.filter((s) => !s.is_featured);
    }

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (service) =>
          service.title.toLowerCase().includes(query) ||
          service.slug.toLowerCase().includes(query) ||
          service.short_description?.toLowerCase().includes(query)
      );
    }

    // Date filter
    if (dateFilter) {
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

      filtered = filtered.filter((s) => {
        const serviceDate = s.created_at;
        if (!serviceDate) return false;
        const sDate = new Date(serviceDate);

        switch (dateFilter) {
          case "today":
            return sDate >= today;
          case "7days":
            const sevenDaysAgo = new Date(today);
            sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
            return sDate >= sevenDaysAgo;
          case "30days":
            const thirtyDaysAgo = new Date(today);
            thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
            return sDate >= thirtyDaysAgo;
          case "thisMonth":
            return sDate.getMonth() === now.getMonth() && sDate.getFullYear() === now.getFullYear();
          default:
            return true;
        }
      });
    }

    setFilteredServices(filtered);
    setCurrentPage(1);
    setSelectedServices([]);
  }, [activeTab, searchQuery, dateFilter, services]);

  // Calculate pagination
  const totalPages = Math.ceil(filteredServices.length / itemsPerPage);
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredServices.slice(
    indexOfFirstItem,
    indexOfLastItem
  );



  const fetchServices = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("services")
        .select("*")
        .order("created_at", { ascending: sortOrder === "asc" });

      if (error) throw error;
      const all = data || [];
      setServices(all);

      // Calculate stats
      setStats({
        total: all.length,
        featured: all.filter((s) => s.is_featured).length,
        standard: all.filter((s) => !s.is_featured).length,
        withPackages: all.filter((s) => s.packages && s.packages.length > 0).length,
      });
    } catch (error) {
      console.error("Error fetching services:", error);
      showAlert("error", "Error", "Gagal memuat layanan!");
    } finally {
      setLoading(false);
    }
  }, [showAlert, sortOrder]);

  useEffect(() => {
    fetchServices();
  }, [fetchServices]);

  const handleAddService = () => {
    setEditingService(null);
    setFormData({
      title: "",
      slug: "",
      short_description: "",
      image_src: "",
      image_alt: "",
      is_featured: false,
      packages: [
        {
          name: "",
          description: "",
          features: [""],
          finalPrice: "",
          originalPrice: "",
          duration: "",
        },
        {
          name: "",
          description: "",
          features: [""],
          finalPrice: "",
          originalPrice: "",
          duration: "",
        },
        {
          name: "",
          description: "",
          features: [""],
          finalPrice: "",
          originalPrice: "",
          duration: "",
        },
      ],
    });
    setShowServiceModal(true);
  };

  const handleEditService = (service: Service) => {
    setEditingService(service);
    setFormData({
      title: service.title,
      slug: service.slug,
      short_description: service.short_description || "",
      image_src: service.image_src || "",
      image_alt: service.image_alt || "",
      is_featured: service.is_featured,
      packages:
        service.packages && service.packages.length === 3
          ? service.packages
          : [
            {
              name: "",
              description: "",
              features: [""],
              finalPrice: "",
              originalPrice: "",
              duration: "",
            },
            {
              name: "",
              description: "",
              features: [""],
              finalPrice: "",
              originalPrice: "",
              duration: "",
            },
            {
              name: "",
              description: "",
              features: [""],
              finalPrice: "",
              originalPrice: "",
              duration: "",
            },
          ],
    });
    setShowServiceModal(true);
  };

  const handleDeleteService = async (id: number) => {
    const confirmed = await showConfirm(
      "Hapus Layanan",
      "Apakah Anda yakin ingin menghapus layanan ini?",
      "error",
      "Ya, Hapus"
    );
    if (!confirmed) return;

    setSaving(true);
    try {
      const { error } = await supabase.from("services").delete().eq("id", id);
      if (error) throw error;

      const updatedServices = services.filter((s) => s.id !== id);
      setServices(updatedServices);
      showAlert("success", "Berhasil", "Layanan berhasil dihapus!");

      // Remove from selection if selected
      if (selectedServices.includes(id)) {
        setSelectedServices((prev) => prev.filter((sid) => sid !== id));
      }
    } catch (error) {
      console.error("Error deleting service:", error);
      showAlert("error", "Gagal", "Gagal menghapus layanan!");
    } finally {
      setSaving(false);
    }
  };

  const handleBulkDelete = async () => {
    if (selectedServices.length === 0) return;

    const confirmed = await showConfirm(
      "Hapus Layanan",
      `Apakah Anda yakin ingin menghapus ${selectedServices.length} layanan terpilih?`,
      "error",
      "Ya, Hapus"
    );
    if (!confirmed) return;

    setSaving(true);
    try {
      const { error } = await supabase
        .from("services")
        .delete()
        .in("id", selectedServices);

      if (error) throw error;

      showAlert(
        "success",
        "Berhasil",
        `${selectedServices.length} layanan berhasil dihapus!`
      );
      setSelectedServices([]);
      fetchServices();
    } catch (error) {
      console.error("Error bulk deleting services:", error);
      showAlert("error", "Gagal", "Gagal menghapus layanan!");
    } finally {
      setSaving(false);
    }
  };

  const handleSaveService = async () => {
    if (!formData.title.trim() || !formData.slug.trim()) {
      showAlert("warning", "Validasi", "Judul dan Slug tidak boleh kosong!");
      return;
    }

    setSaving(true);
    try {
      const serviceData = {
        title: formData.title,
        slug: formData.slug,
        short_description: formData.short_description,
        image_src: formData.image_src,
        image_alt: formData.image_alt,
        is_featured: formData.is_featured,
        packages: formData.packages,
      };

      if (editingService) {
        const { error } = await supabase
          .from("services")
          .update(serviceData)
          .eq("id", editingService.id);

        if (error) throw error;

        fetchServices();
        showAlert("success", "Berhasil", "Layanan berhasil diperbarui!");
      } else {
        const { error } = await supabase.from("services").insert([serviceData]);

        if (error) throw error;

        fetchServices();
        showAlert("success", "Berhasil", "Layanan berhasil ditambahkan!");
      }

      setShowServiceModal(false);
    } catch (error: any) {
      console.error("Error saving service:", error);
      showAlert("error", "Gagal", error.message || "Gagal menyimpan layanan!");
    } finally {
      setSaving(false);
    }
  };

  // Image Handling
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith("image/")) {
        showAlert("warning", "Peringatan", "Silakan pilih file gambar!");
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        showAlert(
          "warning",
          "Peringatan",
          "Ukuran file terlalu besar! Maksimal 5MB"
        );
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData({ ...formData, image_src: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  // Package Management
  const handleEditPackage = (index: number) => {
    setEditingPackageIndex(index);
    setPackageFormData({ ...formData.packages[index] });
    setShowPackageModal(true);
  };

  const handleSavePackage = () => {
    if (!packageFormData.name.trim()) {
      showAlert("warning", "Validasi", "Nama paket tidak boleh kosong!");
      return;
    }
    const newPackages = [...formData.packages];
    if (editingPackageIndex !== null) {
      newPackages[editingPackageIndex] = packageFormData;
    }
    setFormData({ ...formData, packages: newPackages });
    setShowPackageModal(false);
    setEditingPackageIndex(null);
  };

  const addFeatureToPackage = () => {
    setPackageFormData({
      ...packageFormData,
      features: [...packageFormData.features, ""],
    });
  };

  const removeFeatureFromPackage = (index: number) => {
    const newFeatures = packageFormData.features.filter((_, i) => i !== index);
    setPackageFormData({ ...packageFormData, features: newFeatures });
  };

  const updateFeature = (index: number, value: string) => {
    const newFeatures = [...packageFormData.features];
    newFeatures[index] = value;
    setPackageFormData({ ...packageFormData, features: newFeatures });
  };

  const formatDate = (dateString: string | undefined) => {
    if (!dateString) return "-";
    return new Date(dateString).toLocaleDateString("id-ID", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  const toggleSelectAll = () => {
    if (selectedServices.length === currentItems.length) {
      setSelectedServices([]);
    } else {
      setSelectedServices(currentItems.map((s) => s.id));
    }
  };

  const toggleSelect = (id: number) => {
    if (selectedServices.includes(id)) {
      setSelectedServices(selectedServices.filter((sid) => sid !== id));
    } else {
      setSelectedServices([...selectedServices, id]);
    }
  };

  // Custom checkbox component
  const CustomCheckbox = ({ checked, onChange, variant = "default" }: { checked: boolean; onChange: () => void; variant?: "default" | "header" }) => (
    <button
      onClick={onChange}
      className={`flex items-center justify-center w-5 h-5 rounded transition-colors ${checked
        ? variant === "header"
          ? "text-white"
          : "text-primary"
        : variant === "header"
          ? "text-white/50 hover:text-white/80"
          : "text-gray-300 hover:text-gray-400"
        }`}
    >
      {checked ? (
        <CheckCircleIcon className="w-5 h-5" />
      ) : (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <circle cx="12" cy="12" r="9" />
        </svg>
      )}
    </button>
  );

  // Generate page numbers
  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    const maxVisible = 5;

    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      if (currentPage <= 3) {
        for (let i = 1; i <= 4; i++) pages.push(i);
        pages.push("...");
        pages.push(totalPages);
      } else if (currentPage >= totalPages - 2) {
        pages.push(1);
        pages.push("...");
        for (let i = totalPages - 3; i <= totalPages; i++) pages.push(i);
      } else {
        pages.push(1);
        pages.push("...");
        for (let i = currentPage - 1; i <= currentPage + 1; i++) pages.push(i);
        pages.push("...");
        pages.push(totalPages);
      }
    }

    return pages;
  };

  const tabs: { key: FilterTab; label: string; count: number }[] = [
    { key: "all", label: "Semua", count: stats.total },
    { key: "featured", label: "Unggulan", count: stats.featured },
    { key: "standard", label: "Standard", count: stats.standard },
  ];

  const inputStyle =
    "bg-white shadow-sm focus:border-primary focus:ring-primary/10 w-full rounded-lg border border-gray-300 py-2.5 px-4 text-sm text-gray-800 placeholder:text-gray-400 focus:ring-2 focus:outline-none";

  if (loading) {
    return (
      <div className="fixed inset-0 z-50 flex justify-center items-center bg-white">
        <LogoPathAnimation />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 p-3 sm:p-6 lg:p-8 font-sans">

      {/* Header */}
      <div className="bg-white rounded-2xl shadow-sm p-4 mb-6 border border-slate-100">
        <div className="flex flex-col gap-4">
          {/* Mobile Tabs */}
          <div className="flex h-11 items-center gap-0.5 rounded-lg bg-gray-100 p-0.5 lg:hidden">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`text-sm h-10 rounded-md px-3 py-2 font-medium transition-all flex-1 ${activeTab === tab.key
                  ? "shadow-sm text-gray-900 bg-white"
                  : "text-gray-500 hover:text-gray-900"
                  }`}
              >
                {tab.label} ({tab.count})
              </button>
            ))}
          </div>

          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            {/* Left: Tabs (Desktop) */}
            <div className="hidden h-11 items-center gap-0.5 rounded-lg bg-gray-100 p-0.5 lg:inline-flex">
              {tabs.map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`text-sm h-10 rounded-md px-3 py-2 font-medium transition-all ${activeTab === tab.key
                    ? "shadow-sm text-gray-900 bg-white"
                    : "text-gray-500 hover:text-gray-900"
                    }`}
                >
                  {tab.label} ({tab.count})
                </button>
              ))}
            </div>

            {/* Right: Filters */}
            <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto">
              {/* Search */}
              <div className="relative w-full">
                <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Cari layanan..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 pr-4 py-2.5 sm:py-3 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary w-full sm:w-64"
                />
              </div>

              {/* Filter Controls Grid */}
              <div className="grid grid-cols-2 sm:flex sm:flex-row gap-2 sm:gap-3">
                {/* Date Filter */}
                <div className="relative col-span-1" ref={dateDropdownRef}>
                  <button
                    onClick={() => setDateDropdownOpen(!dateDropdownOpen)}
                    className="h-10 sm:h-11 w-full flex items-center justify-between gap-2 px-3 py-2 text-xs sm:text-sm border border-gray-300 rounded-lg bg-white hover:bg-gray-50 focus:ring-2 focus:ring-primary focus:border-primary transition-all"
                  >
                    <div className="flex items-center gap-2 truncate">
                      <CalendarIcon className="w-4 h-4 text-gray-400 shrink-0" />
                      <span className="text-gray-700 truncate">
                        {dateFilter === "" ? "Semua Tanggal" :
                          dateFilter === "today" ? "Hari ini" :
                            dateFilter === "7days" ? "7 hari terakhir" :
                              dateFilter === "30days" ? "30 hari terakhir" :
                                dateFilter === "thisMonth" ? "Bulan ini" : dateFilter}
                      </span>
                    </div>
                    <ChevronDownIcon className={`w-4 h-4 text-gray-400 shrink-0 transition-transform ${dateDropdownOpen ? "rotate-180" : ""}`} />
                  </button>
                  {dateDropdownOpen && (
                    <div className="absolute top-full left-0 mt-1 w-44 bg-white border border-gray-200 rounded-lg shadow-lg z-20 animate-in fade-in slide-in-from-top-2 duration-150">
                      {[
                        { value: "", label: "Semua Tanggal" },
                        { value: "today", label: "Hari ini" },
                        { value: "7days", label: "7 hari terakhir" },
                        { value: "30days", label: "30 hari terakhir" },
                        { value: "thisMonth", label: "Bulan ini" },
                      ].map((option) => (
                        <button
                          key={option.value}
                          onClick={() => {
                            setDateFilter(option.value);
                            setDateDropdownOpen(false);
                          }}
                          className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-100 first:rounded-t-lg last:rounded-b-lg transition-colors ${dateFilter === option.value
                            ? "bg-primary/10 text-primary font-medium"
                            : "text-gray-700"
                            }`}
                        >
                          {option.label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Sort Dropdown */}
                <div className="relative col-span-1" ref={sortDropdownRef}>
                  <button
                    onClick={() => setSortDropdownOpen(!sortDropdownOpen)}
                    className="h-10 sm:h-11 w-full flex items-center justify-between gap-2 px-3 py-2 text-xs sm:text-sm border border-gray-300 rounded-lg bg-white hover:bg-gray-50 focus:ring-2 focus:ring-primary focus:border-primary transition-all"
                  >
                    <div className="flex items-center gap-2">
                      <Squares2X2Icon className="w-4 h-4 text-gray-400 shrink-0" />
                      <span className="text-gray-700">
                        {sortOrder === "desc" ? "Terbaru" : "Terdahulu"}
                      </span>
                    </div>
                    <ChevronDownIcon className={`w-4 h-4 text-gray-400 shrink-0 transition-transform ${sortDropdownOpen ? "rotate-180" : ""}`} />
                  </button>
                  {sortDropdownOpen && (
                    <div className="absolute top-full left-0 mt-1 w-40 bg-white border border-gray-200 rounded-lg shadow-lg z-20 animate-in fade-in slide-in-from-top-2 duration-150">
                      <button
                        onClick={() => {
                          setSortOrder("desc");
                          setSortDropdownOpen(false);
                        }}
                        className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-100 first:rounded-t-lg transition-colors ${sortOrder === "desc" ? "bg-primary/10 text-primary font-medium" : "text-gray-700"}`}
                      >
                        Terbaru
                      </button>
                      <button
                        onClick={() => {
                          setSortOrder("asc");
                          setSortDropdownOpen(false);
                        }}
                        className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-100 last:rounded-b-lg transition-colors ${sortOrder === "asc" ? "bg-primary/10 text-primary font-medium" : "text-gray-700"}`}
                      >
                        Terdahulu
                      </button>
                    </div>
                  )}
                </div>

                <div className="flex bg-gray-100 p-1 rounded-lg col-span-1 justify-center sm:justify-start">
                  <button
                    onClick={() => setViewMode("grid")}
                    className={`p-2 rounded-md transition flex-1 sm:flex-none flex justify-center ${viewMode === "grid"
                      ? "bg-white shadow-sm text-primary"
                      : "text-gray-500 hover:text-gray-700"
                      }`}
                  >
                    <Squares2X2Icon className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => setViewMode("list")}
                    className={`p-2 rounded-md transition flex-1 sm:flex-none flex justify-center ${viewMode === "list"
                      ? "bg-white shadow-sm text-primary"
                      : "text-gray-500 hover:text-gray-700"
                      }`}
                  >
                    <ListBulletIcon className="w-5 h-5" />
                  </button>
                </div>

                {/* Add Button */}
                <button
                  onClick={handleAddService}
                  className="col-span-1 h-10 sm:h-auto px-3 sm:px-4 py-2.5 bg-primary text-white rounded-lg hover:bg-primary/90 transition shadow-sm flex items-center justify-center gap-2 text-sm font-medium whitespace-nowrap"
                >
                  <PlusIcon className="w-5 h-5" />
                  <span className="inline sm:hidden">Baru</span>
                  <span className="hidden sm:inline">Buat Layanan</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Batch Action Toolbar */}
      {selectedServices.length > 0 && (
        <div className="bg-white shadow-sm rounded-lg p-3 mb-4 flex items-center justify-between">
          <span className="hidden sm:inline font-medium text-primary">
            {selectedServices.length} layanan dipilih
          </span>
          <div className="flex gap-2">
            <button
              onClick={handleBulkDelete}
              className="px-3 py-1.5 text-sm font-medium bg-red-500 text-white rounded-lg hover:bg-red-600 transition flex items-center gap-1"
            >
              <TrashIcon className="w-4 h-4" />
              Hapus Terpilih
            </button>
          </div>
        </div>
      )}

      {/* Content */}
      {currentItems.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl border border-dashed border-gray-300">
          <DocumentTextIcon className="h-12 w-12 mx-auto text-gray-300 mb-3" />
          <h3 className="text-lg font-medium text-gray-900">
            Tidak ada layanan
          </h3>
          <p className="text-gray-500 mt-1">
            Belum ada layanan untuk filter ini.
          </p>
        </div>
      ) : (
        viewMode === "grid" ? (
          /* GRID VIEW */
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-6">
            {currentItems.map((service) => (
              <div
                key={service.id}
                className={`group bg-white rounded-xl shadow-sm hover:shadow-md border transition overflow-hidden flex flex-col ${selectedServices.includes(service.id)
                  ? "border-primary ring-2 ring-primary/20"
                  : "border-gray-200"
                  }`}
              >
                <div className="relative aspect-[4/3] overflow-hidden bg-gray-100">
                  {service.image_src ? (
                    <img
                      src={service.image_src}
                      alt={service.title}
                      className="w-full h-full object-cover transition duration-300 group-hover:scale-105"
                    />
                  ) : (
                    <div className="flex items-center justify-center h-full text-gray-300">
                      <PhotoIcon className="w-12 h-12" />
                    </div>
                  )}

                  {/* Checkbox */}
                  <div className="absolute top-2 left-2">
                    <CustomCheckbox
                      checked={selectedServices.includes(service.id)}
                      onChange={() => toggleSelect(service.id)}
                    />
                  </div>

                  {/* Overlay Actions */}
                  <div className="absolute top-2 right-2 flex gap-1 transform translate-y-[-10px] opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition duration-200">
                    <button
                      onClick={() => handleEditService(service)}
                      className="p-1.5 bg-white rounded-full shadow-sm text-gray-600 hover:text-blue-500 hover:bg-blue-50"
                    >
                      <PencilIcon className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteService(service.id)}
                      className="p-1.5 bg-white rounded-full shadow-sm text-gray-600 hover:text-red-500 hover:bg-red-50"
                    >
                      <TrashIcon className="w-4 h-4" />
                    </button>
                  </div>

                  {service.is_featured && (
                    <span className="absolute bottom-2 left-2 px-2 py-1 bg-amber-500/90 backdrop-blur-sm text-white text-xs font-medium rounded-md flex items-center gap-1">
                      <StarIcon className="w-3 h-3" /> Featured
                    </span>
                  )}
                </div>

                <div className="p-4 flex-1 flex flex-col">
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="font-semibold text-gray-900 line-clamp-1">
                      {service.title}
                    </h3>
                  </div>
                  <p className="text-xs text-gray-500 mb-2 line-clamp-1">
                    {service.slug}
                  </p>

                  <div className="mt-auto flex items-center justify-between pt-3 border-t border-gray-100">
                    <div className="flex gap-1 flex-wrap">
                      <span className="px-2 py-0.5 text-[10px] rounded-full font-medium bg-blue-100 text-blue-700">
                        {service.packages?.length || 0} Paket
                      </span>
                    </div>
                    <span className="text-[10px] text-gray-400">
                      {formatDate(service.created_at)}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <>
            {/* Desktop Table */}
            <div className="hidden md:block bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-primary text-white font-medium">
                    <tr>
                      <th className="px-6 py-4 rounded-tl-lg">
                        <CustomCheckbox
                          checked={selectedServices.length === currentItems.length && currentItems.length > 0}
                          onChange={toggleSelectAll}
                          variant="header"
                        />
                      </th>
                      <th className="px-6 py-4">Layanan</th>
                      <th className="px-6 py-4">Slug</th>
                      <th className="px-6 py-4">Status</th>
                      <th className="px-6 py-4">Tanggal</th>
                      <th className="px-6 py-4 text-right rounded-tr-lg">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {currentItems.map((service) => (
                      <tr
                        key={service.id}
                        className={`hover:bg-gray-50 transition ${selectedServices.includes(service.id) ? "bg-primary/5" : ""}`}
                      >
                        <td className="px-6 py-4">
                          <CustomCheckbox
                            checked={selectedServices.includes(service.id)}
                            onChange={() => toggleSelect(service.id)}
                          />
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="h-10 w-10 shrink-0 overflow-hidden rounded-lg bg-gray-100 border border-gray-200">
                              {service.image_src ? (
                                <img
                                  src={service.image_src}
                                  alt=""
                                  className="h-full w-full object-cover"
                                />
                              ) : (
                                <PhotoIcon className="h-5 w-5 m-auto text-gray-400 mt-2.5" />
                              )}
                            </div>
                            <div>
                              <p className="font-medium text-gray-900">
                                {service.title}
                              </p>
                              {service.short_description && (
                                <p className="text-xs text-gray-500 line-clamp-1">
                                  {service.short_description}
                                </p>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-gray-600">
                          {service.slug}
                        </td>
                        <td className="px-6 py-4">
                          {service.is_featured ? (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800">
                              <StarIcon className="w-3 h-3 mr-1" />
                              Featured
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                              Standard
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-gray-500">
                          {formatDate(service.created_at)}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => handleEditService(service)}
                              className="p-2 text-gray-400 hover:text-blue-500 hover:bg-blue-50 rounded-lg transition"
                              title="Edit"
                            >
                              <PencilIcon className="w-5 h-5" />
                            </button>
                            <button
                              onClick={() => handleDeleteService(service.id)}
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

            {/* Mobile Cards */}
            <div className="md:hidden space-y-3">
              {currentItems.map((service) => (
                <div
                  key={service.id}
                  className={`bg-white rounded-xl shadow-sm border p-4 ${selectedServices.includes(service.id)
                    ? "border-primary bg-primary/5"
                    : "border-slate-100"
                    }`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className="h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-gray-100 border border-gray-200">
                        {service.image_src ? (
                          <img
                            src={service.image_src}
                            alt=""
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <PhotoIcon className="h-6 w-6 m-auto text-gray-400 mt-3" />
                        )}
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900">
                          {service.title}
                        </p>
                        <p className="text-xs text-gray-500">
                          {service.slug}
                        </p>
                      </div>
                    </div>
                    <CustomCheckbox
                      checked={selectedServices.includes(service.id)}
                      onChange={() => toggleSelect(service.id)}
                    />
                  </div>

                  <div className="flex items-center gap-2 mb-2">
                    {service.is_featured ? (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800">
                        <StarIcon className="w-3 h-3 mr-1" />
                        Featured
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                        Standard
                      </span>
                    )}
                  </div>

                  <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                    <div>
                      <p className="text-xs text-gray-400 uppercase">Tanggal</p>
                      <p className="text-sm text-gray-700">
                        {formatDate(service.created_at)}
                      </p>
                    </div>
                    <div className="flex gap-1">
                      <button
                        onClick={() => handleEditService(service)}
                        className="p-2 text-gray-400 hover:text-blue-500 hover:bg-blue-50 rounded-lg transition"
                      >
                        <PencilIcon className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => handleDeleteService(service.id)}
                        className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition"
                      >
                        <TrashIcon className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )
      )}

      {/* Pagination */}
      {filteredServices.length > 0 && (
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
                {[10, 25, 50, 100].map((value) => (
                  <button
                    key={value}
                    onClick={() => {
                      setItemsPerPage(value);
                      setPageDropdownOpen(false);
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

      {/* Service Modal */}
      {showServiceModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm overflow-y-auto w-full h-full">
          <div className="bg-white rounded-2xl w-full max-w-4xl shadow-xl my-8 relative">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center sticky top-0 bg-white rounded-t-2xl z-10">
              <h3 className="text-xl font-bold text-gray-900 ">
                {editingService ? "Edit Layanan" : "Tambah Layanan Baru"}
              </h3>
              <button
                onClick={() => setShowServiceModal(false)}
                className="text-gray-400 hover:text-gray-600 "
              >
                <XMarkIcon className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
              {/* Image Upload */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Gambar Layanan
                </label>
                <div
                  className={`border-2 border-dashed rounded-xl p-6 text-center transition-colors ${isDragging
                    ? "border-primary bg-primary/5"
                    : "border-gray-300 hover:border-primary"
                    } cursor-pointer`}
                  onClick={() => fileInputRef.current?.click()}
                >
                  {formData.image_src ? (
                    <div className="relative aspect-video max-h-60 mx-auto rounded-lg overflow-hidden">
                      <img
                        src={formData.image_src}
                        alt="Preview"
                        className="w-full h-full object-contain bg-gray-50 "
                      />
                      <button
                        className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full shadow hover:bg-red-600"
                        onClick={(e) => {
                          e.stopPropagation();
                          setFormData((prev) => ({ ...prev, image_src: "" }));
                          if (fileInputRef.current)
                            fileInputRef.current.value = "";
                        }}
                      >
                        <XMarkIcon className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto text-gray-400">
                        <PhotoIcon className="w-6 h-6" />
                      </div>
                      <p className="text-sm text-gray-600 ">
                        Klik untuk upload gambar
                      </p>
                      <p className="text-xs text-gray-400">
                        JPG, PNG, WEBP (Max 5MB)
                      </p>
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

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="col-span-2 md:col-span-1">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Judul Layanan
                  </label>
                  <input
                    type="text"
                    className={inputStyle}
                    value={formData.title}
                    onChange={(e) =>
                      setFormData({ ...formData, title: e.target.value })
                    }
                    placeholder="Contoh: Jasa Desain Logo"
                  />
                </div>

                <div className="col-span-2 md:col-span-1">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Slug
                  </label>
                  <input
                    type="text"
                    className={inputStyle}
                    value={formData.slug}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        slug: e.target.value.toLowerCase().replace(/\s+/g, "-"),
                      })
                    }
                    placeholder="Contoh: jasa-desain-logo"
                  />
                </div>

                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Deskripsi Singkat
                  </label>
                  <textarea
                    rows={3}
                    className={inputStyle}
                    value={formData.short_description}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        short_description: e.target.value,
                      })
                    }
                    placeholder="Deskripsi singkat layanan..."
                  />
                </div>

                <div className="col-span-2">
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="is_featured"
                      className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
                      checked={formData.is_featured}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          is_featured: e.target.checked,
                        })
                      }
                    />
                    <label
                      htmlFor="is_featured"
                      className="ml-2 block text-sm text-gray-700 "
                    >
                      Jadikan sebagai layanan utama (Featured)
                    </label>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-gray-100 ">
                <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                  <SparklesIcon className="h-5 w-5 mr-2 text-primary" />
                  Paket Layanan
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {formData.packages.map((pkg, index) => (
                    <div
                      key={index}
                      className="border border-gray-200 rounded-xl p-5 hover:border-primary/50 transition-all bg-gray-50 "
                    >
                      <div className="flex justify-between items-start mb-3">
                        <h4 className="font-semibold text-gray-900 ">
                          Paket {index + 1}
                        </h4>
                        <button
                          type="button"
                          onClick={() => handleEditPackage(index)}
                          className="text-primary hover:text-primary/80 flex items-center gap-1 text-sm font-medium"
                        >
                          <PencilIcon className="h-4 w-4" />
                          Edit
                        </button>
                      </div>
                      <div className="space-y-2 text-sm">
                        <p className="font-medium text-gray-700 ">
                          {pkg.name || (
                            <span className="text-gray-400 italic">
                              Belum diberi nama
                            </span>
                          )}
                        </p>
                        <p className="text-gray-500 flex items-center gap-2">
                          <span className="w-1.5 h-1.5 bg-gray-400 rounded-full"></span>
                          {pkg.duration
                            ? `${pkg.duration} hari kerja`
                            : "Durasi -"}
                        </p>
                        <p className="text-gray-900 font-bold text-lg">
                          {pkg.finalPrice || "Rp -"}
                        </p>
                        <p className="text-xs text-gray-500 bg-white p-2 rounded-lg border border-gray-100 ">
                          {pkg.features.filter((f) => f).length} fitur
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-gray-100 flex justify-end gap-3 bg-gray-50 rounded-b-2xl sticky bottom-0">
              <button
                onClick={() => setShowServiceModal(false)}
                className="px-4 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition"
              >
                Batal
              </button>
              <button
                onClick={handleSaveService}
                disabled={saving}
                className="px-6 py-2.5 text-sm font-medium text-white bg-primary rounded-lg hover:bg-primary/80 disabled:opacity-70 disabled:cursor-not-allowed flex items-center gap-2 transition shadow-sm"
              >
                {saving ? "Menyimpan..." : "Simpan Layanan"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Package Edit Modal (Nested) */}
      {showPackageModal && editingPackageIndex !== null && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-xl w-full max-w-lg shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <div className="p-5 border-b border-gray-100 flex justify-between items-center">
              <h3 className="text-lg font-bold text-gray-900 ">
                Edit Paket {editingPackageIndex + 1}
              </h3>
              <button
                onClick={() => setShowPackageModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <XMarkIcon className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nama Paket
                </label>
                <input
                  type="text"
                  className={inputStyle}
                  value={packageFormData.name}
                  onChange={(e) =>
                    setPackageFormData({
                      ...packageFormData,
                      name: e.target.value,
                    })
                  }
                  placeholder="Basic / Premium"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Durasi (Hari)
                  </label>
                  <input
                    type="number"
                    className={inputStyle}
                    value={packageFormData.duration}
                    onChange={(e) =>
                      setPackageFormData({
                        ...packageFormData,
                        duration: e.target.value,
                      })
                    }
                    placeholder="7"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Harga
                  </label>
                  <input
                    type="text"
                    className={inputStyle}
                    value={packageFormData.finalPrice}
                    onChange={(e) =>
                      setPackageFormData({
                        ...packageFormData,
                        finalPrice: e.target.value,
                      })
                    }
                    placeholder="Rp 500.000"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Deskripsi
                </label>
                <textarea
                  rows={2}
                  className={inputStyle}
                  value={packageFormData.description}
                  onChange={(e) =>
                    setPackageFormData({
                      ...packageFormData,
                      description: e.target.value,
                    })
                  }
                  placeholder="Keterangan singkat..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Fitur ({packageFormData.features.length})
                </label>
                <div className="space-y-2">
                  {packageFormData.features.map((feature, i) => (
                    <div key={i} className="flex gap-2">
                      <input
                        type="text"
                        className={inputStyle}
                        value={feature}
                        onChange={(e) => updateFeature(i, e.target.value)}
                        placeholder={`Fitur ${i + 1}`}
                      />
                      <button
                        onClick={() => removeFeatureFromPackage(i)}
                        className="p-2 text-red-500 hover:bg-red-50 rounded-lg"
                      >
                        <TrashIcon className="w-5 h-5" />
                      </button>
                    </div>
                  ))}
                </div>
                <button
                  onClick={addFeatureToPackage}
                  className="mt-2 text-sm text-primary font-medium hover:underline flex items-center gap-1"
                >
                  <PlusIcon className="w-4 h-4" /> Tambah Fitur
                </button>
              </div>
            </div>
            <div className="p-5 border-t border-gray-100 flex justify-end gap-2 bg-gray-50 rounded-b-xl">
              <button
                onClick={() => setShowPackageModal(false)}
                className="px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-lg"
              >
                Batal
              </button>
              <button
                onClick={handleSavePackage}
                className="px-4 py-2 text-sm font-medium text-white bg-primary hover:bg-primary/90 rounded-lg shadow-sm"
              >
                Simpan
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

