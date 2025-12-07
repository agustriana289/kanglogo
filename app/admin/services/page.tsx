"use client";

import { useState, useEffect, useRef } from "react";
import { supabase } from "@/lib/supabase";
import { useAlert } from "@/components/providers/AlertProvider";
import LogoLoading from "@/components/LogoLoading";
import { uploadToImgBB } from "@/lib/imgbb";
import {
  PlusIcon,
  PencilIcon,
  TrashIcon,
  PhotoIcon,
  StarIcon,
  XMarkIcon,
  DocumentTextIcon,
  CurrencyDollarIcon,
  ClockIcon,
  CheckCircleIcon,
  TagIcon,
  SparklesIcon,
} from "@heroicons/react/24/outline";

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

export default function ServicesPage() {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [imageUploading, setImageUploading] = useState(false);
  const { showAlert, showConfirm } = useAlert();

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  // State untuk modal service
  const [showServiceModal, setShowServiceModal] = useState(false);
  const [editingService, setEditingService] = useState<Service | null>(null);
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

  // State untuk modal package
  const [showPackageModal, setShowPackageModal] = useState(false);
  const [editingPackageIndex, setEditingPackageIndex] = useState<number | null>(
    null
  );
  const [packageFormData, setPackageFormData] = useState<ServicePackage>({
    name: "",
    description: "",
    features: [""],
    finalPrice: "",
    originalPrice: "",
    duration: "",
  });

  useEffect(() => {
    fetchServices();
  }, []);

  const fetchServices = async () => {
    try {
      const { data, error } = await supabase
        .from("services")
        .select("*")
        .order("is_featured", { ascending: false })
        .order("created_at", { ascending: true });

      if (error) throw error;
      setServices(data || []);
    } catch (error) {
      console.error("Error fetching services:", error);
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
      packages: service.packages,
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

      setServices(services.filter((s) => s.id !== id));
      showAlert("success", "Berhasil", "Layanan berhasil dihapus!");
    } catch (error) {
      console.error("Error deleting service:", error);
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
        setServices(
          services.map((s) =>
            s.id === editingService.id ? { ...s, ...serviceData } : s
          )
        );
        setServices(
          services.map((s) =>
            s.id === editingService.id ? { ...s, ...serviceData } : s
          )
        );
        showAlert("success", "Berhasil", "Layanan berhasil diperbarui!");
      } else {
        const { data, error } = await supabase
          .from("services")
          .insert([serviceData])
          .select();

        if (error) throw error;
        setServices([...services, ...(data || [])]);
        showAlert("success", "Berhasil", "Layanan berhasil ditambahkan!");
      }

      setShowServiceModal(false);
    } catch (error) {
      console.error("Error saving service:", error);
      showAlert("error", "Gagal", "Gagal menyimpan layanan!");
    } finally {
      setSaving(false);
    }
  };

  // Package editing functions
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
        showAlert("warning", "Peringatan", "Silakan pilih file gambar!");
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        showAlert("warning", "Peringatan", "Ukuran file terlalu besar! Maksimal 5MB");
        return;
      }

      // Here you would typically upload the image to a service like ImgBB
      // For now, we'll just show a preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData({ ...formData, image_src: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  const closeServiceModal = () => {
    setShowServiceModal(false);
    setEditingService(null);
  };

  const closePackageModal = () => {
    setShowPackageModal(false);
    setEditingPackageIndex(null);
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
              onClick={handleAddService}
              className="inline-flex items-center px-4 py-2 bg-primary text-white font-medium rounded-lg shadow-sm hover:bg-primary/90 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
            >
              <PlusIcon className="h-5 w-5 mr-2" />
              Tambah Layanan
            </button>
          </div>
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
                  Slug
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-300 uppercase tracking-wider">
                  Featured
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-300 uppercase tracking-wider">
                  Aksi
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-slate-700 divide-y divide-slate-200 dark:divide-slate-600">
              {services.map((service) => (
                <tr
                  key={service.id}
                  className="hover:bg-slate-50 dark:hover:bg-slate-800/50"
                >
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900 dark:text-white">
                    <div className="flex items-center">
                      <DocumentTextIcon className="h-5 w-5 text-slate-400 mr-3" />
                      {service.title}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 dark:text-slate-300">
                    <code className="px-2 py-1 bg-slate-100 dark:bg-slate-800 rounded text-xs">
                      {service.slug}
                    </code>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 dark:text-slate-300">
                    {service.is_featured ? (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400">
                        <StarIcon className="h-4 w-4 mr-1" />
                        Ya
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-800 dark:bg-slate-900/20 dark:text-slate-400">
                        Tidak
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleEditService(service)}
                        className="inline-flex items-center px-3 py-1.5 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 rounded-md hover:bg-indigo-100 dark:hover:bg-indigo-900/30 transition-colors"
                      >
                        <PencilIcon className="h-4 w-4 mr-1" />
                        Edit
                      </button>
                      <button
                        onClick={() => handleDeleteService(service.id)}
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
          {services.map((service) => (
            <div
              key={service.id}
              className="bg-white dark:bg-slate-800 rounded-lg shadow p-4 border border-slate-200 dark:border-slate-600"
            >
              <div className="flex justify-between items-start mb-3">
                <div className="flex items-start">
                  <DocumentTextIcon className="h-5 w-5 text-slate-400 mr-3 mt-0.5" />
                  <div className="flex-1">
                    <h3 className="text-lg font-medium text-slate-900 dark:text-white">
                      {service.title}
                    </h3>
                    <code className="px-2 py-1 bg-slate-100 dark:bg-slate-800 rounded text-xs text-slate-600 dark:text-slate-400 mt-1 inline-block">
                      {service.slug}
                    </code>
                  </div>
                </div>
                {service.is_featured ? (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400">
                    <StarIcon className="h-4 w-4 mr-1" />
                    Ya
                  </span>
                ) : (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-800 dark:bg-slate-900/20 dark:text-slate-400">
                    Tidak
                  </span>
                )}
              </div>
              <div className="flex justify-end space-x-2">
                <button
                  onClick={() => handleEditService(service)}
                  className="inline-flex items-center px-3 py-1.5 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 rounded-md hover:bg-indigo-100 dark:hover:bg-indigo-900/30 transition-colors"
                >
                  <PencilIcon className="h-4 w-4 mr-1" />
                  Edit
                </button>
                <button
                  onClick={() => handleDeleteService(service.id)}
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
        {services.length === 0 && (
          <div className="text-center py-12">
            <DocumentTextIcon className="mx-auto h-12 w-12 text-slate-400" />
            <h3 className="mt-2 text-sm font-medium text-slate-900 dark:text-white">
              Tidak ada layanan
            </h3>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              Belum ada layanan yang dibuat.
            </p>
            <div className="mt-6">
              <button
                onClick={handleAddService}
                className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary hover:bg-primary/80 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
              >
                <PlusIcon className="-ml-1 mr-2 h-5 w-5" />
                Tambah Layanan Baru
              </button>
            </div>
          </div>
        )}

        {/* Service Modal - Diperbaiki */}
        {showServiceModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-slate-700 rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-start mb-6">
                <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                  {editingService ? "Edit Layanan" : "Tambah Layanan Baru"}
                </h2>
                <button
                  onClick={closeServiceModal}
                  className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                >
                  <XMarkIcon className="h-6 w-6" />
                </button>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                      Judul Layanan
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
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Deskripsi Singkat
                  </label>
                  <textarea
                    rows={3}
                    className="block w-full rounded-md border-slate-300 dark:border-slate-600 shadow-sm p-2 border dark:bg-slate-800 dark:text-white"
                    value={formData.short_description}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        short_description: e.target.value,
                      })
                    }
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                      URL Gambar
                    </label>
                    <input
                      type="text"
                      className="block w-full rounded-md border-slate-300 dark:border-slate-600 shadow-sm p-2 border dark:bg-slate-800 dark:text-white"
                      value={formData.image_src}
                      onChange={(e) =>
                        setFormData({ ...formData, image_src: e.target.value })
                      }
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                      Alt Text Gambar
                    </label>
                    <input
                      type="text"
                      className="block w-full rounded-md border-slate-300 dark:border-slate-600 shadow-sm p-2 border dark:bg-slate-800 dark:text-white"
                      value={formData.image_alt}
                      onChange={(e) =>
                        setFormData({ ...formData, image_alt: e.target.value })
                      }
                    />
                  </div>
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="is_featured"
                    className="h-4 w-4 text-primary focus:ring-primary border-slate-300 rounded"
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
                    className="ml-2 block text-sm text-slate-900 dark:text-white"
                  >
                    Jadikan sebagai layanan utama (featured)
                  </label>
                </div>

                <div className="pt-4 border-t border-slate-200 dark:border-slate-600">
                  <h3 className="text-lg font-medium text-slate-900 dark:text-white mb-4 flex items-center">
                    <SparklesIcon className="h-5 w-5 mr-2" />
                    Paket Layanan
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {formData.packages.map((pkg, index) => (
                      <div
                        key={index}
                        className="border border-slate-200 dark:border-slate-600 rounded-lg p-4 hover:border-primary/50 transition-colors"
                      >
                        <div className="flex justify-between items-start mb-2">
                          <h4 className="font-medium text-slate-900 dark:text-white">
                            Paket {index + 1}
                          </h4>
                          <button
                            type="button"
                            onClick={() => handleEditPackage(index)}
                            className="text-primary hover:text-primary/80 flex items-center gap-1"
                          >
                            <PencilIcon className="h-4 w-4" />
                            Edit
                          </button>
                        </div>
                        <div className="space-y-2 text-sm">
                          <p className="font-medium text-slate-700 dark:text-slate-300">
                            {pkg.name || (
                              <span className="text-slate-400 dark:text-slate-500">
                                Belum diisi
                              </span>
                            )}
                          </p>
                          <p className="text-slate-500 dark:text-slate-400">
                            {pkg.duration ? `${pkg.duration} hari kerja` : "-"}
                          </p>
                          <p className="text-slate-900 dark:text-white font-semibold">
                            {pkg.finalPrice || "-"}
                          </p>
                          <p className="text-xs text-slate-500 dark:text-slate-400">
                            {pkg.features.filter((f) => f).length} fitur
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-6 pt-6 border-t border-slate-200 dark:border-slate-600">
                <button
                  onClick={closeServiceModal}
                  className="px-4 py-2 bg-slate-200 dark:bg-slate-600 text-slate-700 dark:text-slate-200 rounded-md hover:bg-slate-300 dark:hover:bg-slate-500"
                  disabled={saving}
                >
                  Batal
                </button>
                <button
                  onClick={handleSaveService}
                  disabled={saving}
                  className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/90 disabled:opacity-50"
                >
                  {saving ? "Menyimpan..." : "Simpan"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Package Edit Modal - Diperbaiki */}
        {showPackageModal && editingPackageIndex !== null && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-slate-700 rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-start mb-6">
                <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                  Edit Paket {editingPackageIndex + 1}
                </h2>
                <button
                  onClick={closePackageModal}
                  className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                >
                  <XMarkIcon className="h-6 w-6" />
                </button>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                      Nama Paket
                    </label>
                    <input
                      type="text"
                      className="block w-full rounded-md border-slate-300 dark:border-slate-600 shadow-sm p-2 border dark:bg-slate-800 dark:text-white"
                      value={packageFormData.name}
                      onChange={(e) =>
                        setPackageFormData({
                          ...packageFormData,
                          name: e.target.value,
                        })
                      }
                      placeholder="Paket Basic"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                      Durasi (hari kerja)
                    </label>
                    <input
                      type="number"
                      className="block w-full rounded-md border-slate-300 dark:border-slate-600 shadow-sm p-2 border dark:bg-slate-800 dark:text-white"
                      value={packageFormData.duration}
                      onChange={(e) =>
                        setPackageFormData({
                          ...packageFormData,
                          duration: e.target.value,
                        })
                      }
                      min="1"
                      max="365"
                      placeholder="7"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Deskripsi
                  </label>
                  <textarea
                    rows={3}
                    className="block w-full rounded-md border-slate-300 dark:border-slate-600 shadow-sm p-2 border dark:bg-slate-800 dark:text-white"
                    value={packageFormData.description}
                    onChange={(e) =>
                      setPackageFormData({
                        ...packageFormData,
                        description: e.target.value,
                      })
                    }
                    placeholder="Deskripsi paket..."
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                      Harga Akhir
                    </label>
                    <input
                      type="text"
                      className="block w-full rounded-md border-slate-300 dark:border-slate-600 shadow-sm p-2 border dark:bg-slate-800 dark:text-white"
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
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                      Harga Normal (opsional)
                    </label>
                    <input
                      type="text"
                      className="block w-full rounded-md border-slate-300 dark:border-slate-600 shadow-sm p-2 border dark:bg-slate-800 dark:text-white"
                      value={packageFormData.originalPrice || ""}
                      onChange={(e) =>
                        setPackageFormData({
                          ...packageFormData,
                          originalPrice: e.target.value,
                        })
                      }
                      placeholder="Rp 750.000"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Fitur-fitur
                  </label>
                  {packageFormData.features.map((feature, fIndex) => (
                    <div key={fIndex} className="flex gap-2 mb-2">
                      <input
                        type="text"
                        className="flex-1 rounded-md border-slate-300 dark:border-slate-600 shadow-sm p-2 border dark:bg-slate-800 dark:text-white"
                        value={feature}
                        onChange={(e) => updateFeature(fIndex, e.target.value)}
                        placeholder={`Fitur ${fIndex + 1}`}
                      />
                      {packageFormData.features.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeFeatureFromPackage(fIndex)}
                          className="px-3 py-2 bg-red-500 text-white rounded-md hover:bg-red-600"
                        >
                          <TrashIcon className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={addFeatureToPackage}
                    className="flex items-center gap-1 px-3 py-2 bg-primary text-white rounded-md hover:bg-primary/80"
                  >
                    <PlusIcon className="h-4 w-4" />
                    Tambah Fitur
                  </button>
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-6 pt-6 border-t border-slate-200 dark:border-slate-600">
                <button
                  onClick={closePackageModal}
                  className="px-4 py-2 bg-slate-200 dark:bg-slate-600 text-slate-700 dark:text-slate-200 rounded-md hover:bg-slate-300 dark:hover:bg-slate-500"
                >
                  Batal
                </button>
                <button
                  onClick={handleSavePackage}
                  className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/90"
                >
                  Simpan Paket
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Toast Notification */}

    </div>
  );
}
