"use client";

import { useState, useEffect, useRef } from "react";
import { supabase } from "@/lib/supabase";
import { useAlert } from "@/components/providers/AlertProvider";
import LogoLoading from "@/components/LogoLoading";
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
  CheckCircleIcon,
  SparklesIcon,
  ChevronLeftIcon,
  ChevronRightIcon
} from "@heroicons/react/24/outline";

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

// Items per page
const ITEMS_PER_PAGE = 12;

export default function ServicesPage() {
  const [services, setServices] = useState<Service[]>([]);
  const [filteredServices, setFilteredServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const { showAlert, showConfirm } = useAlert();

  const [selectedServices, setSelectedServices] = useState<number[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  // Modal State
  const [showServiceModal, setShowServiceModal] = useState(false);
  const [editingService, setEditingService] = useState<Service | null>(null);

  // Package Modal State
  const [showPackageModal, setShowPackageModal] = useState(false);
  const [editingPackageIndex, setEditingPackageIndex] = useState<number | null>(null);

  const [formData, setFormData] = useState({
    title: "",
    slug: "",
    short_description: "",
    image_src: "",
    image_alt: "",
    is_featured: false,
    packages: [
      { name: "", description: "", features: [""], finalPrice: "", originalPrice: "", duration: "" },
      { name: "", description: "", features: [""], finalPrice: "", originalPrice: "", duration: "" },
      { name: "", description: "", features: [""], finalPrice: "", originalPrice: "", duration: "" },
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

  // Calculate pagination
  const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE);
  const indexOfLastItem = currentPage * ITEMS_PER_PAGE;
  const indexOfFirstItem = indexOfLastItem - ITEMS_PER_PAGE;
  const currentItems = filteredServices.slice(indexOfFirstItem, indexOfLastItem);

  useEffect(() => {
    fetchServices();
  }, []);

  useEffect(() => {
    // Filter services based on search query
    if (searchQuery.trim() === "") {
      setFilteredServices(services);
    } else {
      const filtered = services.filter(
        (service) =>
          service.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          service.slug.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredServices(filtered);
    }
    setCurrentPage(1);
  }, [searchQuery, services]);

  const fetchServices = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("services")
        .select("*")
        .order("is_featured", { ascending: false })
        .order("created_at", { ascending: false });

      if (error) throw error;
      setServices(data || []);
      setFilteredServices(data || []);
      setTotalItems(data?.length || 0);
    } catch (error) {
      console.error("Error fetching services:", error);
      showAlert("error", "Error", "Gagal memuat layanan!");
    } finally {
      setLoading(false);
    }
  };

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
        { name: "", description: "", features: [""], finalPrice: "", originalPrice: "", duration: "" },
        { name: "", description: "", features: [""], finalPrice: "", originalPrice: "", duration: "" },
        { name: "", description: "", features: [""], finalPrice: "", originalPrice: "", duration: "" },
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
      packages: service.packages && service.packages.length === 3 ? service.packages : [
        { name: "", description: "", features: [""], finalPrice: "", originalPrice: "", duration: "" },
        { name: "", description: "", features: [""], finalPrice: "", originalPrice: "", duration: "" },
        { name: "", description: "", features: [""], finalPrice: "", originalPrice: "", duration: "" },
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
      setFilteredServices(
        searchQuery ? updatedServices.filter(s => s.title.toLowerCase().includes(searchQuery.toLowerCase())) : updatedServices
      );
      setTotalItems(updatedServices.length);
      showAlert("success", "Berhasil", "Layanan berhasil dihapus!");

      // Remove from selection if selected
      if (selectedServices.includes(id)) {
        setSelectedServices(prev => prev.filter(sid => sid !== id));
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

      showAlert("success", "Berhasil", `${selectedServices.length} layanan berhasil dihapus!`);
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
        const { error } = await supabase
          .from("services")
          .insert([serviceData]);

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
        showAlert("warning", "Peringatan", "Ukuran file terlalu besar! Maksimal 5MB");
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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("id-ID", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  const inputStyle = "bg-white dark:bg-slate-900 shadow-sm focus:border-blue-300 focus:ring-blue-500/10 dark:focus:border-blue-800 w-full rounded-lg border border-gray-300 py-2.5 px-4 text-sm text-gray-800 placeholder:text-gray-400 focus:ring-3 focus:outline-none dark:border-gray-700 dark:text-white/90 dark:placeholder:text-white/30";

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
              Daftar Layanan
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              {totalItems} layanan ditemukan
            </p>
          </div>
          <button
            onClick={handleAddService}
            className="bg-primary hover:bg-primary/80 text-white px-4 py-2.5 rounded-lg flex items-center justify-center gap-2 text-sm font-medium transition shadow-sm"
          >
            <PlusIcon className="w-5 h-5" />
            Tambah Layanan
          </button>
        </div>

        {/* Filters & View Toggle */}
        <div className="mt-6 flex flex-row gap-4 items-center justify-between">
          <div className="relative w-full sm:max-w-md">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Cari layanan..."
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

      {/* Bulk Actions Bar */}
      {selectedServices.length > 0 && (
        <div className="mb-4 bg-blue-50 dark:bg-blue-900/20 px-5 py-3 flex items-center justify-between rounded-xl border border-blue-100 dark:border-blue-800 transition-all">
          <div className="flex items-center gap-2">
            <CheckCircleIcon className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            <span className="text-sm font-medium text-blue-800 dark:text-blue-200">
              {selectedServices.length} layanan dipilih
            </span>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSelectedServices([])}
              className="text-sm text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200 font-medium px-3 py-1.5 rounded-lg transition-colors"
            >
              Batal Pilih
            </button>
            <button
              onClick={handleBulkDelete}
              disabled={saving}
              className="text-sm text-red-600 hover:text-red-700 bg-white border border-red-200 hover:bg-red-50 font-medium px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1 disabled:opacity-50"
            >
              <TrashIcon className="w-4 h-4" /> Hapus
            </button>
          </div>
        </div>
      )}

      {/* Content Section */}
      {currentItems.length === 0 ? (
        <div className="text-center py-12 bg-white dark:bg-slate-800 rounded-xl border border-dashed border-gray-300 dark:border-gray-700">
          <DocumentTextIcon className="h-12 w-12 mx-auto text-gray-300 dark:text-gray-600 mb-3" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">Tidak ada layanan</h3>
          <p className="text-gray-500 dark:text-gray-400 mt-1">Belum ada layanan yang ditambahkan.</p>
        </div>
      ) : viewMode === "grid" ? (
        /* GRID VIEW */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {currentItems.map((service) => (
            <div key={service.id} className={`group bg-white dark:bg-slate-800 rounded-xl shadow-sm hover:shadow-md border transition overflow-hidden flex flex-col ${selectedServices.includes(service.id) ? 'border-blue-500 ring-2 ring-blue-500/20' : 'border-gray-200 dark:border-gray-700'}`}>
              <div className="relative aspect-[4/3] overflow-hidden bg-gray-100 dark:bg-slate-700">
                {service.image_src ? (
                  <img src={service.image_src} alt={service.title} className="w-full h-full object-cover transition duration-300 group-hover:scale-105" />
                ) : (
                  <div className="flex items-center justify-center h-full text-gray-300">
                    <PhotoIcon className="w-12 h-12" />
                  </div>
                )}

                {/* Checkbox */}
                <div className="absolute top-2 left-2">
                  <input
                    type="checkbox"
                    className="h-5 w-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500 dark:border-gray-600 dark:bg-slate-700 cursor-pointer"
                    checked={selectedServices.includes(service.id)}
                    onChange={() => {
                      if (selectedServices.includes(service.id)) {
                        setSelectedServices(selectedServices.filter((id) => id !== service.id));
                      } else {
                        setSelectedServices([...selectedServices, service.id]);
                      }
                    }}
                  />
                </div>

                {/* Overlay Actions */}
                <div className="absolute top-2 right-2 flex gap-1 transform translate-y-[-10px] opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition duration-200">
                  <button
                    onClick={() => handleEditService(service)}
                    className="p-1.5 bg-white dark:bg-slate-800 rounded-full shadow-sm text-gray-600 hover:text-blue-500 hover:bg-blue-50 dark:text-gray-300"
                  >
                    <PencilIcon className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDeleteService(service.id)}
                    className="p-1.5 bg-white dark:bg-slate-800 rounded-full shadow-sm text-gray-600 hover:text-red-500 hover:bg-red-50 dark:text-gray-300"
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
                  <h3 className="font-semibold text-gray-900 dark:text-white line-clamp-1">{service.title}</h3>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-2 line-clamp-1">{service.slug}</p>

                <div className="mt-auto flex items-center justify-between pt-3 border-t border-gray-100 dark:border-gray-700">
                  <div className="flex gap-1 flex-wrap">
                    <span className="px-2 py-0.5 text-[10px] rounded-full font-medium bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
                      3 Paket
                    </span>
                  </div>
                  <span className="text-[10px] text-gray-400">
                    {formatDate(service.created_at || new Date().toISOString())}
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
                  <th className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 dark:border-gray-600 dark:bg-slate-700"
                        checked={selectedServices.length === currentItems.length && currentItems.length > 0}
                        onChange={() => {
                          if (selectedServices.length === currentItems.length) {
                            setSelectedServices([]);
                          } else {
                            setSelectedServices(currentItems.map((s) => s.id));
                          }
                        }}
                      />
                      <span>Layanan</span>
                    </div>
                  </th>
                  <th className="px-6 py-4">Slug</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Tanggal</th>
                  <th className="px-6 py-4 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {currentItems.map((service) => (
                  <tr key={service.id} className={`hover:bg-gray-50 dark:hover:bg-slate-800/50 transition ${selectedServices.includes(service.id) ? 'bg-blue-50 dark:bg-blue-900/10' : ''}`}>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 dark:border-gray-600 dark:bg-slate-700"
                          checked={selectedServices.includes(service.id)}
                          onChange={() => {
                            if (selectedServices.includes(service.id)) {
                              setSelectedServices(selectedServices.filter((id) => id !== service.id));
                            } else {
                              setSelectedServices([...selectedServices, service.id]);
                            }
                          }}
                        />
                        <div className="h-10 w-10 shrink-0 overflow-hidden rounded-lg bg-gray-100 dark:bg-slate-700 border border-gray-200 dark:border-gray-600">
                          {service.image_src ? (
                            <img src={service.image_src} alt="" className="h-full w-full object-cover" />
                          ) : (
                            <PhotoIcon className="h-5 w-5 m-auto text-gray-400 mt-2.5" />
                          )}
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900 dark:text-white underline-offset-4 hover:underline cursor-pointer" onClick={() => handleEditService(service)}>
                            {service.title}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-gray-600 dark:text-gray-300">
                      {service.slug}
                    </td>
                    <td className="px-6 py-4">
                      {service.is_featured ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400">
                          Featured
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400">
                          Standard
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-gray-500 dark:text-gray-400">
                      {formatDate(service.created_at || new Date().toISOString())}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleEditService(service)}
                          className="text-gray-400 hover:text-blue-500 transition"
                          title="Edit"
                        >
                          <PencilIcon className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => handleDeleteService(service.id)}
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
            Menampilkan {indexOfFirstItem + 1} - {Math.min(indexOfLastItem, totalItems)} dari {totalItems} layanan
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

      {/* Service Modal */}
      {showServiceModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm overflow-y-auto w-full h-full">
          <div className="bg-white dark:bg-slate-800 rounded-2xl w-full max-w-4xl shadow-xl my-8 relative">
            <div className="p-6 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center sticky top-0 bg-white dark:bg-slate-800 rounded-t-2xl z-10">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                {editingService ? "Edit Layanan" : "Tambah Layanan Baru"}
              </h3>
              <button
                onClick={() => setShowServiceModal(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <XMarkIcon className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
              {/* Image Upload */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Gambar Layanan
                </label>
                <div
                  className={`border-2 border-dashed rounded-xl p-6 text-center transition-colors ${isDragging ? 'border-primary bg-primary/5' : 'border-gray-300 dark:border-gray-700 hover:border-primary'} cursor-pointer`}
                  onClick={() => fileInputRef.current?.click()}
                >
                  {formData.image_src ? (
                    <div className="relative aspect-video max-h-60 mx-auto rounded-lg overflow-hidden">
                      <img src={formData.image_src} alt="Preview" className="w-full h-full object-contain bg-gray-50 dark:bg-slate-900" />
                      <button
                        className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full shadow hover:bg-red-600"
                        onClick={(e) => {
                          e.stopPropagation();
                          setFormData(prev => ({ ...prev, image_src: "" }));
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
                        Klik untuk upload gambar
                      </p>
                      <p className="text-xs text-gray-400">JPG, PNG, WEBP (Max 5MB)</p>
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
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Judul Layanan
                  </label>
                  <input
                    type="text"
                    className={inputStyle}
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="Contoh: Jasa Desain Logo"
                  />
                </div>

                <div className="col-span-2 md:col-span-1">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Slug
                  </label>
                  <input
                    type="text"
                    className={inputStyle}
                    value={formData.slug}
                    onChange={(e) => setFormData({ ...formData, slug: e.target.value.toLowerCase().replace(/\s+/g, '-') })}
                    placeholder="Contoh: jasa-desain-logo"
                  />
                </div>

                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Deskripsi Singkat
                  </label>
                  <textarea
                    rows={3}
                    className={inputStyle}
                    value={formData.short_description}
                    onChange={(e) => setFormData({ ...formData, short_description: e.target.value })}
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
                      className="ml-2 block text-sm text-gray-700 dark:text-gray-300"
                    >
                      Jadikan sebagai layanan utama (Featured)
                    </label>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-gray-100 dark:border-gray-700">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4 flex items-center">
                  <SparklesIcon className="h-5 w-5 mr-2 text-primary" />
                  Paket Layanan
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {formData.packages.map((pkg, index) => (
                    <div
                      key={index}
                      className="border border-gray-200 dark:border-gray-700 rounded-xl p-5 hover:border-primary/50 transition-all bg-gray-50 dark:bg-slate-800/50"
                    >
                      <div className="flex justify-between items-start mb-3">
                        <h4 className="font-semibold text-gray-900 dark:text-white">
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
                        <p className="font-medium text-gray-700 dark:text-gray-300">
                          {pkg.name || (
                            <span className="text-gray-400 dark:text-gray-500 italic">
                              Belum diberi nama
                            </span>
                          )}
                        </p>
                        <p className="text-gray-500 dark:text-gray-400 flex items-center gap-2">
                          <span className="w-1.5 h-1.5 bg-gray-400 rounded-full"></span>
                          {pkg.duration ? `${pkg.duration} hari kerja` : "Durasi -"}
                        </p>
                        <p className="text-gray-900 dark:text-white font-bold text-lg">
                          {pkg.finalPrice || "Rp -"}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 bg-white dark:bg-slate-700 p-2 rounded-lg border border-gray-100 dark:border-gray-600">
                          {pkg.features.filter((f) => f).length} fitur
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

            </div>

            <div className="p-6 border-t border-gray-100 dark:border-gray-700 flex justify-end gap-3 bg-gray-50 dark:bg-slate-800/50 rounded-b-2xl sticky bottom-0">
              <button
                onClick={() => setShowServiceModal(false)}
                className="px-4 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 dark:bg-slate-700 dark:text-white dark:border-gray-600 transition"
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
          <div className="bg-white dark:bg-slate-800 rounded-xl w-full max-w-lg shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <div className="p-5 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                Edit Paket {editingPackageIndex + 1}
              </h3>
              <button onClick={() => setShowPackageModal(false)} className="text-gray-400 hover:text-gray-600">
                <XMarkIcon className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Nama Paket</label>
                <input type="text" className={inputStyle} value={packageFormData.name} onChange={e => setPackageFormData({ ...packageFormData, name: e.target.value })} placeholder="Basic / Premium" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Durasi (Hari)</label>
                  <input type="number" className={inputStyle} value={packageFormData.duration} onChange={e => setPackageFormData({ ...packageFormData, duration: e.target.value })} placeholder="7" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Harga</label>
                  <input type="text" className={inputStyle} value={packageFormData.finalPrice} onChange={e => setPackageFormData({ ...packageFormData, finalPrice: e.target.value })} placeholder="Rp 500.000" />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Deskripsi</label>
                <textarea rows={2} className={inputStyle} value={packageFormData.description} onChange={e => setPackageFormData({ ...packageFormData, description: e.target.value })} placeholder="Keterangan singkat..." />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Fitur ({packageFormData.features.length})</label>
                <div className="space-y-2">
                  {packageFormData.features.map((feature, i) => (
                    <div key={i} className="flex gap-2">
                      <input type="text" className={inputStyle} value={feature} onChange={e => updateFeature(i, e.target.value)} placeholder={`Fitur ${i + 1}`} />
                      <button onClick={() => removeFeatureFromPackage(i)} className="p-2 text-red-500 hover:bg-red-50 rounded-lg"><TrashIcon className="w-5 h-5" /></button>
                    </div>
                  ))}
                </div>
                <button onClick={addFeatureToPackage} className="mt-2 text-sm text-primary font-medium hover:underline flex items-center gap-1">
                  <PlusIcon className="w-4 h-4" /> Tambah Fitur
                </button>
              </div>
            </div>
            <div className="p-5 border-t border-gray-100 dark:border-gray-700 flex justify-end gap-2 bg-gray-50 dark:bg-slate-800/50 rounded-b-xl">
              <button onClick={() => setShowPackageModal(false)} className="px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-lg">Batal</button>
              <button onClick={handleSavePackage} className="px-4 py-2 text-sm font-medium text-white bg-primary hover:bg-primary/90 rounded-lg shadow-sm">Simpan</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
