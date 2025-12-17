"use client";

import { useState, useEffect, useRef } from "react";
import { supabase } from "@/lib/supabase";
import { Discount, DiscountType } from "@/types/discount";
import LogoPathAnimation from "@/components/LogoPathAnimation";
import { useAlert } from "@/components/providers/AlertProvider";
import {
  PlusIcon,
  PencilIcon,
  TrashIcon,
  TagIcon,
  MagnifyingGlassIcon,
  ChevronDownIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";

// Interface untuk layanan
interface Service {
  id: number;
  title: string;
}

export default function DiscountManagementPage() {
  const [discounts, setDiscounts] = useState<Discount[]>([]);
  const [filteredDiscounts, setFilteredDiscounts] = useState<Discount[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingDiscount, setEditingDiscount] = useState<Discount | null>(null);
  const [saving, setSaving] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [pageDropdownOpen, setPageDropdownOpen] = useState(false);
  const pageDropdownRef = useRef<HTMLDivElement>(null);
  const [activeTab, setActiveTab] = useState<"all" | "active" | "inactive" | "scheduled" | "expired">("all");

  const { showAlert, showConfirm } = useAlert();

  const [formData, setFormData] = useState<Partial<Discount>>({
    code: "",
    description: "",
    type: "percentage",
    value: 0,
    is_automatic: false,
    service_id: null,
    usage_limit: null,
    starts_at: "",
    expires_at: "",
    is_active: true,
  });

  // Stats
  const stats = {
    total: discounts.length,
    active: discounts.filter(d => getDiscountStatus(d).key === "active").length,
    inactive: discounts.filter(d => !d.is_active).length,
    scheduled: discounts.filter(d => getDiscountStatus(d).key === "scheduled").length,
    expired: discounts.filter(d => getDiscountStatus(d).key === "expired").length,
  };

  // Pagination
  const totalPages = Math.ceil(filteredDiscounts.length / itemsPerPage);
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredDiscounts.slice(indexOfFirstItem, indexOfLastItem);

  // Close dropdown when clicking outside
  useEffect(() => {
    if (!pageDropdownOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (pageDropdownRef.current && !pageDropdownRef.current.contains(event.target as Node)) {
        setPageDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [pageDropdownOpen]);

  useEffect(() => {
    fetchDiscounts();
    fetchServices();
  }, []);

  useEffect(() => {
    // Filter discounts based on search query and tab
    let filtered = discounts;

    // Filter by status tab
    if (activeTab === "active") {
      filtered = filtered.filter(d => getDiscountStatus(d).key === "active");
    } else if (activeTab === "inactive") {
      filtered = filtered.filter(d => !d.is_active);
    } else if (activeTab === "scheduled") {
      filtered = filtered.filter(d => getDiscountStatus(d).key === "scheduled");
    } else if (activeTab === "expired") {
      filtered = filtered.filter(d => getDiscountStatus(d).key === "expired");
    }

    // Filter by search query
    if (searchQuery.trim() !== "") {
      filtered = filtered.filter(
        (discount) =>
          (discount.code && discount.code.toLowerCase().includes(searchQuery.toLowerCase())) ||
          (discount.description && discount.description.toLowerCase().includes(searchQuery.toLowerCase())) ||
          (discount.type && discount.type.toLowerCase().includes(searchQuery.toLowerCase()))
      );
    }

    setFilteredDiscounts(filtered);
    setCurrentPage(1);
  }, [searchQuery, discounts, activeTab]);

  const fetchDiscounts = async () => {
    const { data, error } = await supabase
      .from("discounts")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) console.error("Error fetching discounts:", error);
    else {
      setDiscounts(data || []);
      setFilteredDiscounts(data || []);
    }
    setLoading(false);
  };

  const fetchServices = async () => {
    const { data, error } = await supabase.from("services").select("id, title");
    if (error) console.error("Error fetching services:", error);
    else setServices(data || []);
  };

  const openModal = (discount?: Discount) => {
    if (discount) {
      setEditingDiscount(discount);
      setFormData({
        ...discount,
        starts_at: discount.starts_at
          ? new Date(discount.starts_at).toISOString().slice(0, 16)
          : "",
        expires_at: discount.expires_at
          ? new Date(discount.expires_at).toISOString().slice(0, 16)
          : "",
      });
    } else {
      setEditingDiscount(null);
      setFormData({
        code: "",
        description: "",
        type: "percentage",
        value: 0,
        is_automatic: false,
        service_id: null,
        usage_limit: null,
        starts_at: "",
        expires_at: "",
        is_active: true,
      });
    }
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingDiscount(null);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const payload = {
        ...formData,
        code: formData.is_automatic ? null : formData.code,
        starts_at: formData.starts_at
          ? new Date(formData.starts_at).toISOString()
          : null,
        expires_at: formData.expires_at
          ? new Date(formData.expires_at).toISOString()
          : null,
      };

      let error;
      if (editingDiscount) {
        const { error: updateError } = await supabase
          .from("discounts")
          .update(payload)
          .eq("id", editingDiscount.id);
        error = updateError;
      } else {
        const { error: insertError } = await supabase
          .from("discounts")
          .insert(payload);
        error = insertError;
      }

      if (error) throw error;

      showAlert("success", "Berhasil", "Diskon berhasil disimpan!");
      fetchDiscounts();
      closeModal();
    } catch (error: any) {
      console.error("Error saving discount:", error);
      showAlert("error", "Gagal", `Gagal menyimpan diskon: ${error.message}`);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    const isConfirmed = await showConfirm(
      "Nonaktifkan Diskon",
      "Apakah Anda yakin ingin menonaktifkan diskon ini?",
      "warning",
      "Ya, Nonaktifkan"
    );
    if (!isConfirmed) return;

    const { error } = await supabase
      .from("discounts")
      .update({ is_active: false })
      .eq("id", id);
    if (error) {
      console.error("Error deleting discount:", error);
      showAlert("error", "Gagal", "Gagal menonaktifkan diskon.");
    } else {
      showAlert("success", "Berhasil", "Diskon berhasil dinonaktifkan.");
      fetchDiscounts();
    }
  };

  function getDiscountStatus(discount: Discount) {
    const now = new Date();
    const startDate = discount.starts_at ? new Date(discount.starts_at) : null;
    const endDate = discount.expires_at ? new Date(discount.expires_at) : null;

    if (!discount.is_active)
      return {
        key: "inactive" as const,
        label: "Non-aktif",
        color: "bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400",
        icon: <XCircleIcon className="w-4 h-4" />,
      };
    if (startDate && now < startDate)
      return {
        key: "scheduled" as const,
        label: "Terjadwal",
        color: "bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400",
        icon: <ClockIcon className="w-4 h-4" />,
      };
    if (endDate && now > endDate)
      return {
        key: "expired" as const,
        label: "Kadaluarsa",
        color: "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400",
        icon: <XCircleIcon className="w-4 h-4" />,
      };
    return {
      key: "active" as const,
      label: "Aktif",
      color: "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400",
      icon: <CheckCircleIcon className="w-4 h-4" />,
    };
  }

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
      <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          {/* Left: Tabs */}
          <div className="hidden h-11 items-center gap-0.5 rounded-lg bg-gray-100 p-0.5 lg:inline-flex dark:bg-gray-900">
            <button
              onClick={() => setActiveTab("all")}
              className={`text-sm h-10 rounded-md px-3 py-2 font-medium transition-all ${activeTab === "all"
                  ? "shadow-sm text-gray-900 dark:text-white bg-white dark:bg-gray-800"
                  : "text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
                }`}
            >
              Semua ({stats.total})
            </button>
            <button
              onClick={() => setActiveTab("active")}
              className={`text-sm h-10 rounded-md px-3 py-2 font-medium transition-all ${activeTab === "active"
                  ? "shadow-sm text-gray-900 dark:text-white bg-white dark:bg-gray-800"
                  : "text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
                }`}
            >
              Aktif ({stats.active})
            </button>
            <button
              onClick={() => setActiveTab("scheduled")}
              className={`text-sm h-10 rounded-md px-3 py-2 font-medium transition-all ${activeTab === "scheduled"
                  ? "shadow-sm text-gray-900 dark:text-white bg-white dark:bg-gray-800"
                  : "text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
                }`}
            >
              Terjadwal ({stats.scheduled})
            </button>
            <button
              onClick={() => setActiveTab("expired")}
              className={`text-sm h-10 rounded-md px-3 py-2 font-medium transition-all ${activeTab === "expired"
                  ? "shadow-sm text-gray-900 dark:text-white bg-white dark:bg-gray-800"
                  : "text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
                }`}
            >
              Kadaluarsa ({stats.expired})
            </button>
            <button
              onClick={() => setActiveTab("inactive")}
              className={`text-sm h-10 rounded-md px-3 py-2 font-medium transition-all ${activeTab === "inactive"
                  ? "shadow-sm text-gray-900 dark:text-white bg-white dark:bg-gray-800"
                  : "text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
                }`}
            >
              Non-aktif ({stats.inactive})
            </button>
          </div>

          {/* Right: Search and Add Button */}
          <div className="flex flex-col sm:flex-row gap-3">
            {/* Search */}
            <div className="relative">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Cari diskon..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 pr-4 py-3 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary w-full sm:w-48"
              />
            </div>

            {/* Add Button */}
            <button
              onClick={() => openModal()}
              className="inline-flex items-center justify-center px-4 py-3 bg-primary text-white font-medium rounded-lg shadow-sm hover:bg-primary/90 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
            >
              <PlusIcon className="h-5 w-5 mr-2" />
              Tambah Diskon
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      {currentItems.length === 0 ? (
        <div className="text-center py-12 bg-white dark:bg-slate-800 rounded-xl border border-dashed border-gray-300 dark:border-gray-700">
          <TagIcon className="h-12 w-12 mx-auto text-gray-300 dark:text-gray-600 mb-3" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">
            {searchQuery ? "Tidak ada diskon yang ditemukan" : "Tidak ada diskon"}
          </h3>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            {searchQuery
              ? "Coba ubah kata kunci pencarian Anda."
              : "Belum ada diskon yang dibuat."}
          </p>
        </div>
      ) : (
        <>
          {/* Desktop Table */}
          <div className="hidden md:block bg-white rounded-lg shadow-sm border border-slate-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-primary text-white font-medium">
                  <tr>
                    <th className="px-6 py-4 rounded-tl-lg">Kode</th>
                    <th className="px-6 py-4">Deskripsi</th>
                    <th className="px-6 py-4">Nilai</th>
                    <th className="px-6 py-4">Berlaku Untuk</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4 text-right rounded-tr-lg">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                  {currentItems.map((discount) => {
                    const status = getDiscountStatus(discount);
                    return (
                      <tr
                        key={discount.id}
                        className="hover:bg-gray-50 dark:hover:bg-slate-800/50 transition"
                      >
                        <td className="px-6 py-4">
                          {discount.code ? (
                            <span className="flex items-center gap-2 font-medium text-gray-900 dark:text-white">
                              <TagIcon className="w-4 h-4 text-gray-400" />
                              {discount.code}
                            </span>
                          ) : (
                            <span className="text-gray-500 dark:text-gray-400 italic">
                              Otomatis
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-gray-500 dark:text-gray-300">
                          {discount.description || "-"}
                        </td>
                        <td className="px-6 py-4 text-gray-500 dark:text-gray-300">
                          {discount.type === "percentage"
                            ? `${discount.value}%`
                            : `Rp ${discount.value.toLocaleString("id-ID")}`}
                        </td>
                        <td className="px-6 py-4 text-gray-500 dark:text-gray-300">
                          {discount.service_id
                            ? services.find((s) => s.id === discount.service_id)?.title
                            : "Semua Layanan"}
                        </td>
                        <td className="px-6 py-4">
                          <span
                            className={`inline-flex gap-1 items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${status.color}`}
                          >
                            {status.icon} {status.label}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => openModal(discount)}
                              className="p-2 text-gray-400 hover:text-blue-500 hover:bg-blue-50 rounded-lg transition"
                              title="Edit"
                            >
                              <PencilIcon className="w-5 h-5" />
                            </button>
                            <button
                              onClick={() => handleDelete(discount.id)}
                              className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition"
                              title="Nonaktifkan"
                            >
                              <TrashIcon className="w-5 h-5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Mobile Cards */}
          <div className="md:hidden space-y-4">
            {currentItems.map((discount) => {
              const status = getDiscountStatus(discount);
              return (
                <div
                  key={discount.id}
                  className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden"
                >
                  <div className="p-4">
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex-1">
                        {discount.code ? (
                          <h3 className="text-lg font-medium text-gray-900 dark:text-white flex items-center gap-2">
                            <TagIcon className="w-5 h-5 text-gray-400" />
                            {discount.code}
                          </h3>
                        ) : (
                          <h3 className="text-lg font-medium text-gray-900 dark:text-white italic">
                            Otomatis
                          </h3>
                        )}
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                          {discount.description || "-"}
                        </p>
                      </div>
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${status.color} ml-2`}
                      >
                        {status.icon} {status.label}
                      </span>
                    </div>

                    <div className="space-y-2 text-sm text-gray-500 dark:text-gray-400 mb-3">
                      <p>
                        <span className="font-medium">Nilai:</span>{" "}
                        {discount.type === "percentage"
                          ? `${discount.value}%`
                          : `Rp ${discount.value.toLocaleString("id-ID")}`}
                      </p>
                      <p>
                        <span className="font-medium">Berlaku Untuk:</span>{" "}
                        {discount.service_id
                          ? services.find((s) => s.id === discount.service_id)?.title
                          : "Semua Layanan"}
                      </p>
                    </div>

                    <div className="flex justify-end gap-2 pt-3 border-t border-gray-100 dark:border-gray-700">
                      <button
                        onClick={() => openModal(discount)}
                        className="p-2 text-gray-400 hover:text-blue-500 hover:bg-blue-50 rounded-lg transition"
                        title="Edit"
                      >
                        <PencilIcon className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => handleDelete(discount.id)}
                        className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition"
                        title="Nonaktifkan"
                      >
                        <TrashIcon className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}

      {/* Pagination */}
      {filteredDiscounts.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4 p-4 mt-6">
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
              {Array.from({ length: totalPages }, (_, i) => i + 1)
                .filter(
                  (p) =>
                    p === 1 ||
                    p === totalPages ||
                    (p >= currentPage - 1 && p <= currentPage + 1)
                )
                .map((page, idx) => (
                  <li key={idx}>
                    <button
                      onClick={() => setCurrentPage(page)}
                      className={`flex items-center justify-center border shadow-xs font-medium leading-5 text-sm w-9 h-9 focus:outline-none rounded-lg ${currentPage === page
                          ? "text-fg-brand bg-neutral-tertiary-medium border-default-medium"
                          : "text-body bg-neutral-secondary-medium border-default-medium hover:bg-neutral-tertiary-medium hover:text-heading"
                        }`}
                    >
                      {page}
                    </button>
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
              className="h-9 flex items-center gap-2 px-3 py-2 text-sm border border-gray-300 rounded-lg bg-white hover:bg-gray-50 focus:ring-2 focus:ring-primary focus:border-primary transition-all dark:bg-gray-800 dark:border-gray-700 dark:hover:bg-gray-700"
            >
              <span className="text-gray-700 dark:text-gray-300">{itemsPerPage} halaman</span>
              <ChevronDownIcon className={`w-4 h-4 text-gray-400 transition-transform ${pageDropdownOpen ? "rotate-180" : ""}`} />
            </button>
            {pageDropdownOpen && (
              <div className="absolute bottom-full left-0 mb-1 w-32 bg-white border border-gray-200 rounded-lg shadow-lg z-20 dark:bg-gray-800 dark:border-gray-700 animate-in fade-in slide-in-from-bottom-2 duration-150">
                {[10, 25, 50, 100].map((value) => (
                  <button
                    key={value}
                    onClick={() => {
                      setItemsPerPage(value);
                      setPageDropdownOpen(false);
                      setCurrentPage(1);
                    }}
                    className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 first:rounded-t-lg last:rounded-b-lg transition-colors ${itemsPerPage === value
                        ? "bg-primary/10 text-primary font-medium"
                        : "text-gray-700 dark:text-gray-300"
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

      {/* Modal for Create/Edit Discount */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white dark:bg-slate-800 rounded-2xl w-full max-w-2xl shadow-xl my-8">
            <div className="p-6 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                {editingDiscount ? "Edit Diskon" : "Tambah Diskon Baru"}
              </h3>
              <button
                onClick={closeModal}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <XMarkIcon className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6 space-y-4 max-h-[calc(90vh-200px)] overflow-y-auto">
              {/* Tipe Diskon */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Tipe Diskon
                </label>
                <div className="flex gap-4">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="discount_type"
                      className="mr-2"
                      checked={!formData.is_automatic}
                      onChange={() =>
                        setFormData({ ...formData, is_automatic: false })
                      }
                    />
                    Manual (Masukkan Kode)
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="discount_type"
                      className="mr-2"
                      checked={!!formData.is_automatic}
                      onChange={() =>
                        setFormData({ ...formData, is_automatic: true })
                      }
                    />
                    Otomatis
                  </label>
                </div>
              </div>

              {/* Kode Diskon */}
              {!formData.is_automatic && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Kode Diskon
                  </label>
                  <input
                    type="text"
                    className="w-full rounded-lg border-gray-300 dark:border-gray-600 focus:ring-primary focus:border-primary text-sm dark:bg-slate-900 dark:text-white p-2.5"
                    value={formData.code || ""}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        code: e.target.value.toUpperCase(),
                      })
                    }
                    placeholder="contoh: PROMOHEMAT"
                  />
                </div>
              )}

              {/* Deskripsi */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Deskripsi (Opsional)
                </label>
                <input
                  type="text"
                  className="w-full rounded-lg border-gray-300 dark:border-gray-600 focus:ring-primary focus:border-primary text-sm dark:bg-slate-900 dark:text-white p-2.5"
                  value={formData.description || ""}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  placeholder="Diskon untuk promo akhir tahun"
                />
              </div>

              {/* Nilai & Tipe Nilai */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Tipe Nilai
                  </label>
                  <select
                    className="w-full rounded-lg border-gray-300 dark:border-gray-600 focus:ring-primary focus:border-primary text-sm dark:bg-slate-900 dark:text-white p-2.5"
                    value={formData.type}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        type: e.target.value as DiscountType,
                      })
                    }
                  >
                    <option value="percentage">Persentase (%)</option>
                    <option value="fixed_amount">Nominal Tetap (Rp)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Nilai
                  </label>
                  <input
                    type="number"
                    className="w-full rounded-lg border-gray-300 dark:border-gray-600 focus:ring-primary focus:border-primary text-sm dark:bg-slate-900 dark:text-white p-2.5"
                    value={formData.value || ""}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        value: parseFloat(e.target.value) || 0,
                      })
                    }
                  />
                </div>
              </div>

              {/* Berlaku Untuk */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Berlaku Untuk
                </label>
                <select
                  className="w-full rounded-lg border-gray-300 dark:border-gray-600 focus:ring-primary focus:border-primary text-sm dark:bg-slate-900 dark:text-white p-2.5"
                  value={formData.service_id || "all"}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      service_id:
                        e.target.value === "all"
                          ? null
                          : parseInt(e.target.value),
                    })
                  }
                >
                  <option value="all">Semua Layanan</option>
                  {services.map((service) => (
                    <option key={service.id} value={service.id}>
                      {service.title}
                    </option>
                  ))}
                </select>
              </div>

              {/* Durasi */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Tanggal Mulai
                  </label>
                  <input
                    type="datetime-local"
                    className="w-full rounded-lg border-gray-300 dark:border-gray-600 focus:ring-primary focus:border-primary text-sm dark:bg-slate-900 dark:text-white p-2.5"
                    value={formData.starts_at || ""}
                    onChange={(e) =>
                      setFormData({ ...formData, starts_at: e.target.value })
                    }
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Tanggal Berakhir
                  </label>
                  <input
                    type="datetime-local"
                    className="w-full rounded-lg border-gray-300 dark:border-gray-600 focus:ring-primary focus:border-primary text-sm dark:bg-slate-900 dark:text-white p-2.5"
                    value={formData.expires_at || ""}
                    onChange={(e) =>
                      setFormData({ ...formData, expires_at: e.target.value })
                    }
                  />
                </div>
              </div>

              {/* Batas Pemakaian */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Batas Pemakaian (Opsional)
                </label>
                <input
                  type="number"
                  className="w-full rounded-lg border-gray-300 dark:border-gray-600 focus:ring-primary focus:border-primary text-sm dark:bg-slate-900 dark:text-white p-2.5"
                  value={formData.usage_limit || ""}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      usage_limit: parseInt(e.target.value) || null,
                    })
                  }
                  placeholder="Kosongkan untuk tidak terbatas"
                />
              </div>
            </div>

            <div className="p-6 border-t border-gray-100 dark:border-gray-700 flex justify-end gap-3 bg-gray-50 dark:bg-slate-800/50 rounded-b-2xl">
              <button
                onClick={closeModal}
                className="px-4 py-2 bg-slate-200 dark:bg-slate-600 text-slate-700 dark:text-slate-200 rounded-lg hover:bg-slate-300 dark:hover:bg-slate-500"
                disabled={saving}
              >
                Batal
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 disabled:opacity-50"
              >
                {saving ? "Menyimpan..." : "Simpan"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
