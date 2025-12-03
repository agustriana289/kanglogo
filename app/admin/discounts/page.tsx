"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { Discount, DiscountType } from "@/types/discount";
import LogoLoading from "@/components/LogoLoading";
import {
  Plus,
  Edit,
  Trash2,
  Tag,
  Calendar,
  Percent,
  DollarSign,
  CheckCircle,
  XCircle,
  Clock,
} from "lucide-react";

// Interface untuk layanan
interface Service {
  id: number;
  title: string;
}

// Opsi untuk tipe diskon
const discountTypeOptions: {
  value: DiscountType;
  label: string;
  icon: React.ReactNode;
}[] = [
  { value: "percentage", label: "Persentase (%)", icon: <Percent size={16} /> },
  {
    value: "fixed_amount",
    label: "Nominal Tetap (Rp)",
    icon: <DollarSign size={16} />,
  },
];

export default function DiscountManagementPage() {
  const [discounts, setDiscounts] = useState<Discount[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingDiscount, setEditingDiscount] = useState<Discount | null>(null);
  const [saving, setSaving] = useState(false);
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

  useEffect(() => {
    fetchDiscounts();
    fetchServices();
  }, []);

  const fetchDiscounts = async () => {
    const { data, error } = await supabase
      .from("discounts")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) console.error("Error fetching discounts:", error);
    else setDiscounts(data || []);
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

      alert("Diskon berhasil disimpan!");
      fetchDiscounts();
      closeModal();
    } catch (error: any) {
      console.error("Error saving discount:", error);
      alert(`Gagal menyimpan diskon: ${error.message}`);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Apakah Anda yakin ingin menonaktifkan diskon ini?")) return;

    const { error } = await supabase
      .from("discounts")
      .update({ is_active: false })
      .eq("id", id);
    if (error) {
      console.error("Error deleting discount:", error);
      alert("Gagal menonaktifkan diskon.");
    } else {
      alert("Diskon berhasil dinonaktifkan.");
      fetchDiscounts();
    }
  };

  const getDiscountStatus = (discount: Discount) => {
    const now = new Date();
    const startDate = discount.starts_at ? new Date(discount.starts_at) : null;
    const endDate = discount.expires_at ? new Date(discount.expires_at) : null;

    if (!discount.is_active)
      return {
        label: "Non-aktif",
        color:
          "bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400",
        icon: <XCircle size={14} />,
      };
    if (startDate && now < startDate)
      return {
        label: "Terjadwal",
        color:
          "bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400",
        icon: <Clock size={14} />,
      };
    if (endDate && now > endDate)
      return {
        label: "Kadaluarsa",
        color: "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400",
        icon: <XCircle size={14} />,
      };
    return {
      label: "Aktif",
      color:
        "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400",
      icon: <CheckCircle size={14} />,
    };
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
              onClick={() => openModal()}
              className="inline-flex items-center px-4 py-2 bg-primary text-white font-medium rounded-lg shadow-sm hover:bg-primary/90 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
            >
              <Plus size={20} className="mr-2" />
              Tambah Diskon
            </button>
          </div>
        </div>

        {/* Desktop Table View */}
        <div className="hidden md:block overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-600">
            <thead className="bg-slate-50 dark:bg-slate-800">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-300 uppercase tracking-wider">
                  Kode
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-300 uppercase tracking-wider">
                  Deskripsi
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-300 uppercase tracking-wider">
                  Nilai
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-300 uppercase tracking-wider">
                  Berlaku Untuk
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-300 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-300 uppercase tracking-wider">
                  Aksi
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-slate-700 divide-y divide-slate-200 dark:divide-slate-600">
              {discounts.map((discount) => {
                const status = getDiscountStatus(discount);
                return (
                  <tr
                    key={discount.id}
                    className="hover:bg-slate-50 dark:hover:bg-slate-800/50"
                  >
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900 dark:text-white">
                      {discount.code ? (
                        <span className="flex items-center gap-1">
                          <Tag size={16} /> {discount.code}
                        </span>
                      ) : (
                        <span className="text-slate-500 dark:text-slate-400 italic">
                          Otomatis
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 dark:text-slate-300">
                      {discount.description || "-"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 dark:text-slate-300">
                      {discount.type === "percentage"
                        ? `${discount.value}%`
                        : `Rp ${discount.value.toLocaleString("id-ID")}`}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 dark:text-slate-300">
                      {discount.service_id
                        ? services.find((s) => s.id === discount.service_id)
                            ?.title
                        : "Semua Layanan"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex gap-1 items-center px-2 py-1 rounded-full text-xs font-medium ${status.color}`}
                      >
                        {status.icon} {status.label}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => openModal(discount)}
                          className="inline-flex items-center px-3 py-1.5 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 rounded-md hover:bg-indigo-100 dark:hover:bg-indigo-900/30 transition-colors"
                        >
                          <Edit size={16} className="mr-1" />
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(discount.id)}
                          className="inline-flex items-center px-3 py-1.5 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-md hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors"
                        >
                          <Trash2 size={16} className="mr-1" />
                          Nonaktifkan
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Mobile Card View */}
        <div className="md:hidden space-y-4">
          {discounts.map((discount) => {
            const status = getDiscountStatus(discount);
            return (
              <div
                key={discount.id}
                className="bg-white dark:bg-slate-800 rounded-lg shadow p-4 border border-slate-200 dark:border-slate-600"
              >
                <div className="flex justify-between items-start mb-3">
                  <div>
                    {discount.code ? (
                      <h3 className="text-lg font-medium text-slate-900 dark:text-white flex items-center">
                        <Tag size={16} className="mr-2" />
                        {discount.code}
                      </h3>
                    ) : (
                      <h3 className="text-lg font-medium text-slate-900 dark:text-white italic">
                        Otomatis
                      </h3>
                    )}
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                      {discount.description || "-"}
                    </p>
                  </div>
                  <span
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${status.color}`}
                  >
                    {status.icon} {status.label}
                  </span>
                </div>
                <div className="space-y-2 text-sm text-slate-500 dark:text-slate-400 mb-3">
                  <p>
                    <span className="font-medium">Nilai:</span>{" "}
                    {discount.type === "percentage"
                      ? `${discount.value}%`
                      : `Rp ${discount.value.toLocaleString("id-ID")}`}
                  </p>
                  <p>
                    <span className="font-medium">Berlaku Untuk:</span>{" "}
                    {discount.service_id
                      ? services.find((s) => s.id === discount.service_id)
                          ?.title
                      : "Semua Layanan"}
                  </p>
                </div>
                <div className="flex justify-end space-x-2">
                  <button
                    onClick={() => openModal(discount)}
                    className="inline-flex items-center px-3 py-1.5 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 rounded-md hover:bg-indigo-100 dark:hover:bg-indigo-900/30 transition-colors"
                  >
                    <Edit size={16} className="mr-1" />
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(discount.id)}
                    className="inline-flex items-center px-3 py-1.5 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-md hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors"
                  >
                    <Trash2 size={16} className="mr-1" />
                    Nonaktifkan
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Empty State */}
        {discounts.length === 0 && (
          <div className="text-center py-12">
            <Tag className="mx-auto h-12 w-12 text-slate-400" />
            <h3 className="mt-2 text-sm font-medium text-slate-900 dark:text-white">
              Tidak ada diskon
            </h3>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              Belum ada diskon yang dibuat.
            </p>
            <div className="mt-6">
              <button
                onClick={() => openModal()}
                className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary hover:bg-primary/80 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
              >
                <Plus className="-ml-1 mr-2 h-5 w-5" />
                Tambah Diskon Baru
              </button>
            </div>
          </div>
        )}

        {/* Modal for Create/Edit Discount - Diperbaiki */}
        {showModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-slate-700 rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-4">
                {editingDiscount ? "Edit Diskon" : "Tambah Diskon Baru"}
              </h2>
              <div className="space-y-4">
                {/* Tipe Diskon */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
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
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                      Kode Diskon
                    </label>
                    <input
                      type="text"
                      className="block w-full rounded-md border-slate-300 dark:border-slate-600 shadow-sm p-2 border dark:bg-slate-800 dark:text-white"
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
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Deskripsi (Opsional)
                  </label>
                  <input
                    type="text"
                    className="block w-full rounded-md border-slate-300 dark:border-slate-600 shadow-sm p-2 border dark:bg-slate-800 dark:text-white"
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
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                      Tipe Nilai
                    </label>
                    <select
                      className="block w-full rounded-md border-slate-300 dark:border-slate-600 shadow-sm p-2 border dark:bg-slate-800 dark:text-white"
                      value={formData.type}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          type: e.target.value as DiscountType,
                        })
                      }
                    >
                      {discountTypeOptions.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                      Nilai
                    </label>
                    <input
                      type="number"
                      className="block w-full rounded-md border-slate-300 dark:border-slate-600 shadow-sm p-2 border dark:bg-slate-800 dark:text-white"
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
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Berlaku Untuk
                  </label>
                  <select
                    className="block w-full rounded-md border-slate-300 dark:border-slate-600 shadow-sm p-2 border dark:bg-slate-800 dark:text-white"
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
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                      Tanggal Mulai
                    </label>
                    <input
                      type="datetime-local"
                      className="block w-full rounded-md border-slate-300 dark:border-slate-600 shadow-sm p-2 border dark:bg-slate-800 dark:text-white"
                      value={formData.starts_at || ""}
                      onChange={(e) =>
                        setFormData({ ...formData, starts_at: e.target.value })
                      }
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                      Tanggal Berakhir
                    </label>
                    <input
                      type="datetime-local"
                      className="block w-full rounded-md border-slate-300 dark:border-slate-600 shadow-sm p-2 border dark:bg-slate-800 dark:text-white"
                      value={formData.expires_at || ""}
                      onChange={(e) =>
                        setFormData({ ...formData, expires_at: e.target.value })
                      }
                    />
                  </div>
                </div>

                {/* Batas Pemakaian */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Batas Pemakaian (Opsional)
                  </label>
                  <input
                    type="number"
                    className="block w-full rounded-md border-slate-300 dark:border-slate-600 shadow-sm p-2 border dark:bg-slate-800 dark:text-white"
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

              <div className="flex justify-end gap-3 mt-6 pt-6 border-t border-slate-200 dark:border-slate-600">
                <button
                  onClick={closeModal}
                  className="px-4 py-2 bg-slate-200 dark:bg-slate-600 text-slate-700 dark:text-slate-200 rounded-md hover:bg-slate-300 dark:hover:bg-slate-500"
                  disabled={saving}
                >
                  Batal
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/90 disabled:bg-slate-400"
                >
                  {saving ? "Menyimpan..." : "Simpan"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
