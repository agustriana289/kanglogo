// app/admin/payment/page.tsx
"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import { supabase } from "@/lib/supabase";
import { useAlert } from "@/components/providers/AlertProvider";
import LogoPathAnimation from "@/components/LogoPathAnimation";
import { PaymentMethod, PaymentMethodType } from "@/types/payment-method";
import {
  PlusIcon,
  PencilIcon,
  TrashIcon,
  CreditCardIcon,
  BuildingOfficeIcon,
  DevicePhoneMobileIcon,
  CheckCircleIcon,
  XCircleIcon,
  XMarkIcon,
  BanknotesIcon,
  MagnifyingGlassIcon,
  ChevronDownIcon,
} from "@heroicons/react/24/outline";

const paymentMethodTypes: PaymentMethodType[] = ["Bank", "E-Wallet", "Outlet"];

type FilterTab = "all" | "Bank" | "E-Wallet" | "Outlet";

export default function PaymentMethodManagementPage() {
  const [methods, setMethods] = useState<PaymentMethod[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { showAlert, showConfirm } = useAlert();

  const [showModal, setShowModal] = useState(false);
  const [editingMethod, setEditingMethod] = useState<PaymentMethod | null>(
    null
  );
  const [formData, setFormData] = useState({
    type: "Bank" as PaymentMethodType,
    name: "",
    account_number: "",
    holder_name: "",
    logo_url: "",
    is_active: true,
  });

  // Filters and pagination
  const [activeTab, setActiveTab] = useState<FilterTab>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // Dropdown states
  const [pageDropdownOpen, setPageDropdownOpen] = useState(false);
  const pageDropdownRef = useRef<HTMLDivElement>(null);

  // Stats
  const [stats, setStats] = useState({
    total: 0,
    bank: 0,
    ewallet: 0,
    outlet: 0,
  });

  // Close dropdowns when clicking outside
  useEffect(() => {
    if (!pageDropdownOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (pageDropdownOpen && pageDropdownRef.current && !pageDropdownRef.current.contains(event.target as Node)) {
        setPageDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [pageDropdownOpen]);

  // Filtered methods
  const filteredMethods = useMemo(() => {
    let filtered = methods;

    // Tab filter
    if (activeTab !== "all") {
      filtered = filtered.filter((m) => m.type === activeTab);
    }

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (m) =>
          m.name?.toLowerCase().includes(query) ||
          m.account_number?.toLowerCase().includes(query) ||
          m.holder_name?.toLowerCase().includes(query)
      );
    }

    return filtered;
  }, [methods, activeTab, searchQuery]);

  const totalPages = Math.ceil(filteredMethods.length / itemsPerPage);
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredMethods.slice(indexOfFirstItem, indexOfLastItem);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [activeTab, searchQuery, itemsPerPage]);

  useEffect(() => {
    fetchMethods();
  }, []);

  const fetchMethods = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("payment_methods")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;

      const all = data || [];
      setMethods(all);

      // Calculate stats
      setStats({
        total: all.length,
        bank: all.filter((m) => m.type === "Bank").length,
        ewallet: all.filter((m) => m.type === "E-Wallet").length,
        outlet: all.filter((m) => m.type === "Outlet").length,
      });
    } catch (error) {
      console.error("Error fetching payment methods:", error);
      showAlert("error", "Error", "Gagal memuat metode pembayaran");
    } finally {
      setLoading(false);
    }
  };

  const handleAddMethod = () => {
    setEditingMethod(null);
    setFormData({
      type: "Bank",
      name: "",
      account_number: "",
      holder_name: "",
      logo_url: "",
      is_active: true,
    });
    setShowModal(true);
  };

  const handleEditMethod = (method: PaymentMethod) => {
    setEditingMethod(method);
    setFormData({
      ...method,
      logo_url: method.logo_url ?? "",
    });
    setShowModal(true);
  };

  const handleDeleteMethod = async (id: number) => {
    const confirmed = await showConfirm(
      "Hapus Metode Pembayaran",
      "Apakah Anda yakin ingin menghapus metode pembayaran ini?",
      "error",
      "Ya, Hapus"
    );
    if (!confirmed) return;

    setSaving(true);
    try {
      const { error } = await supabase
        .from("payment_methods")
        .delete()
        .eq("id", id);
      if (error) throw error;
      await fetchMethods();
      showAlert("success", "Berhasil", "Metode pembayaran berhasil dihapus!");
    } catch (error) {
      console.error("Error deleting payment method:", error);
      showAlert("error", "Gagal", "Gagal menghapus metode pembayaran!");
    } finally {
      setSaving(false);
    }
  };

  const handleSaveMethod = async () => {
    if (!formData.name || !formData.account_number || !formData.holder_name) {
      showAlert("warning", "Validasi", "Nama, Nomor, dan Atas Nama tidak boleh kosong!");
      return;
    }
    setSaving(true);
    try {
      if (editingMethod) {
        const { error } = await supabase
          .from("payment_methods")
          .update(formData)
          .eq("id", editingMethod.id);
        if (error) throw error;
        await fetchMethods();
        setShowModal(false);
        showAlert("success", "Berhasil", "Metode pembayaran berhasil diperbarui!");
      } else {
        const { data, error } = await supabase
          .from("payment_methods")
          .insert([formData])
          .select();
        if (error) throw error;
        await fetchMethods();
        showAlert("success", "Berhasil", "Metode pembayaran berhasil ditambahkan!");
        setShowModal(false);
      }
    } catch (error) {
      console.error("Error saving payment method:", error);
      showAlert("error", "Gagal", "Gagal menyimpan metode pembayaran!");
    } finally {
      setSaving(false);
    }
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingMethod(null);
  };

  const getPaymentTypeIcon = (type: PaymentMethodType) => {
    switch (type) {
      case "Bank":
        return <BuildingOfficeIcon className="h-5 w-5" />;
      case "E-Wallet":
        return <DevicePhoneMobileIcon className="h-5 w-5" />;
      case "Outlet":
        return <CreditCardIcon className="h-5 w-5" />;
      default:
        return <BanknotesIcon className="h-5 w-5" />;
    }
  };

  const tabs: { key: FilterTab; label: string; count: number }[] = [
    { key: "all", label: "Semua", count: stats.total },
    { key: "Bank", label: "Bank", count: stats.bank },
    { key: "E-Wallet", label: "E-Wallet", count: stats.ewallet },
    { key: "Outlet", label: "Outlet", count: stats.outlet },
  ];

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
            {tabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`text-sm h-10 rounded-md px-3 py-2 font-medium transition-all ${activeTab === tab.key
                  ? "shadow-sm text-gray-900 dark:text-white bg-white dark:bg-gray-800"
                  : "text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
                  }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Right: Search and Add Button */}
          <div className="flex flex-col sm:flex-row gap-3">
            {/* Search */}
            <div className="relative">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Cari metode pembayaran..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 pr-4 py-3 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary w-full sm:w-48"
              />
            </div>

            {/* Add Button */}
            <button
              onClick={handleAddMethod}
              className="inline-flex items-center justify-center px-4 py-3 bg-primary text-white font-medium rounded-lg shadow-sm hover:bg-primary/90 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
            >
              <PlusIcon className="h-5 w-5 mr-2" />
              Tambah Metode
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      {currentItems.length === 0 ? (
        <div className="text-center py-12 bg-white dark:bg-slate-800 rounded-xl border border-dashed border-gray-300 dark:border-gray-700">
          <CreditCardIcon className="h-12 w-12 mx-auto text-gray-300 dark:text-gray-600 mb-3" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">
            Tidak ada metode pembayaran
          </h3>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            Belum ada metode pembayaran untuk filter ini.
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
                    <th className="px-6 py-4 rounded-tl-lg">Tipe</th>
                    <th className="px-6 py-4">Nama</th>
                    <th className="px-6 py-4">Nomor</th>
                    <th className="px-6 py-4">Atas Nama</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4 text-right rounded-tr-lg">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                  {currentItems.map((method) => (
                    <tr
                      key={method.id}
                      className="hover:bg-gray-50 dark:hover:bg-slate-800/50 transition"
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="text-primary">
                            {getPaymentTypeIcon(method.type)}
                          </div>
                          <span className="font-medium text-gray-900 dark:text-white">
                            {method.type}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <p className="font-medium text-gray-900 dark:text-white">
                          {method.name}
                        </p>
                      </td>
                      <td className="px-6 py-4 text-gray-500 dark:text-gray-400">
                        {method.account_number}
                      </td>
                      <td className="px-6 py-4 text-gray-500 dark:text-gray-400">
                        {method.holder_name}
                      </td>
                      <td className="px-6 py-4">
                        {method.is_active ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400">
                            <CheckCircleIcon className="h-4 w-4 mr-1" />
                            Aktif
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400">
                            <XCircleIcon className="h-4 w-4 mr-1" />
                            Non-aktif
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleEditMethod(method)}
                            className="p-2 text-gray-400 hover:text-blue-500 hover:bg-blue-50 rounded-lg transition"
                            title="Edit"
                          >
                            <PencilIcon className="w-5 h-5" />
                          </button>
                          <button
                            onClick={() => handleDeleteMethod(method.id)}
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
            {currentItems.map((method) => (
              <div
                key={method.id}
                className="bg-white rounded-xl shadow-sm border border-slate-100 p-4"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="text-primary">
                      {getPaymentTypeIcon(method.type)}
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">{method.name}</p>
                      <p className="text-xs text-gray-500">{method.type}</p>
                    </div>
                  </div>
                  {method.is_active ? (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      <CheckCircleIcon className="h-4 w-4 mr-1" />
                      Aktif
                    </span>
                  ) : (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                      <XCircleIcon className="h-4 w-4 mr-1" />
                      Non-aktif
                    </span>
                  )}
                </div>

                <div className="space-y-2 text-sm text-gray-600 mb-3">
                  <p>
                    <span className="font-medium">Nomor:</span> {method.account_number}
                  </p>
                  <p>
                    <span className="font-medium">Atas Nama:</span> {method.holder_name}
                  </p>
                </div>

                <div className="flex items-center justify-end pt-3 border-t border-gray-100">
                  <div className="flex gap-1">
                    <button
                      onClick={() => handleEditMethod(method)}
                      className="p-2 text-gray-400 hover:text-blue-500 hover:bg-blue-50 rounded-lg transition"
                    >
                      <PencilIcon className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => handleDeleteMethod(method.id)}
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
      )}

      {/* Pagination */}
      {filteredMethods.length > 0 && (
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

      {/* Modal for Add/Edit Payment Method */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-700 rounded-lg p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-start mb-4">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                {editingMethod
                  ? "Edit Metode Pembayaran"
                  : "Tambah Metode Pembayaran"}
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
                  Tipe
                </label>
                <div className="flex items-center space-x-4">
                  {paymentMethodTypes.map((type) => (
                    <label key={type} className="flex items-center">
                      <input
                        type="radio"
                        name="payment_type"
                        className="h-4 w-4 text-primary focus:ring-primary border-slate-300"
                        checked={formData.type === type}
                        onChange={() => setFormData({ ...formData, type })}
                      />
                      <span className="ml-2 flex items-center text-sm text-slate-700 dark:text-slate-300">
                        {getPaymentTypeIcon(type)}
                        <span className="ml-1">{type}</span>
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Nama (Bank/E-Wallet)
                </label>
                <input
                  type="text"
                  className="block w-full rounded-md border-slate-300 dark:border-slate-600 shadow-sm p-2 border dark:bg-slate-800 dark:text-white"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  placeholder="BCA, GoPay, dll."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Nomor Rekening/No. HP
                </label>
                <input
                  type="text"
                  className="block w-full rounded-md border-slate-300 dark:border-slate-600 shadow-sm p-2 border dark:bg-slate-800 dark:text-white"
                  value={formData.account_number}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      account_number: e.target.value,
                    })
                  }
                  placeholder="1234567890"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Atas Nama
                </label>
                <input
                  type="text"
                  className="block w-full rounded-md border-slate-300 dark:border-slate-600 shadow-sm p-2 border dark:bg-slate-800 dark:text-white"
                  value={formData.holder_name}
                  onChange={(e) =>
                    setFormData({ ...formData, holder_name: e.target.value })
                  }
                  placeholder="John Doe"
                />
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="is_active"
                  className="h-4 w-4 text-primary focus:ring-primary border-slate-300 rounded"
                  checked={formData.is_active}
                  onChange={(e) =>
                    setFormData({ ...formData, is_active: e.target.checked })
                  }
                />
                <label
                  htmlFor="is_active"
                  className="ml-2 block text-sm text-slate-900 dark:text-white"
                >
                  Aktif
                </label>
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
                onClick={handleSaveMethod}
                disabled={saving}
                className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/90 disabled:opacity-50"
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
