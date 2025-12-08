// app/admin/payment/page.tsx
"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useAlert } from "@/components/providers/AlertProvider";
import LogoLoading from "@/components/LogoLoading";
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
} from "@heroicons/react/24/outline";

const paymentMethodTypes: PaymentMethodType[] = ["Bank", "E-Wallet", "Outlet"];

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

  useEffect(() => {
    fetchMethods();
  }, []);

  const fetchMethods = async () => {
    try {
      const { data, error } = await supabase
        .from("payment_methods")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      setMethods(data || []);
    } catch (error) {
      console.error("Error fetching payment methods:", error);
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
      setMethods(methods.filter((m) => m.id !== id));
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
        setMethods(
          methods.map((m) =>
            m.id === editingMethod.id ? { ...m, ...formData } : m
          )
        );
        setShowModal(false);
        showAlert("success", "Berhasil", "Metode pembayaran berhasil diperbarui!");
      } else {
        const { data, error } = await supabase
          .from("payment_methods")
          .insert([formData])
          .select();
        if (error) throw error;
        setMethods([...(data || []), ...methods]);
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
              onClick={handleAddMethod}
              className="inline-flex items-center px-4 py-2 bg-primary text-white font-medium rounded-lg shadow-sm hover:bg-primary/90 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
            >
              <PlusIcon className="h-5 w-5 mr-2" />
              Tambah Metode
            </button>
          </div>
        </div>

        {/* Desktop Table View */}
        <div className="hidden md:block overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-600">
            <thead className="bg-slate-50 dark:bg-slate-800">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-300 uppercase tracking-wider">
                  Tipe
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-300 uppercase tracking-wider">
                  Nama
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-300 uppercase tracking-wider">
                  Nomor
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-300 uppercase tracking-wider">
                  Atas Nama
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
              {methods.map((method) => (
                <tr
                  key={method.id}
                  className="hover:bg-slate-50 dark:hover:bg-slate-800/50"
                >
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900 dark:text-white">
                    <div className="flex items-center">
                      {getPaymentTypeIcon(method.type)}
                      <span className="ml-3">{method.type}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 dark:text-slate-300">
                    {method.name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 dark:text-slate-300">
                    {method.account_number}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 dark:text-slate-300">
                    {method.holder_name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
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
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleEditMethod(method)}
                        className="px-3 py-2 text-sm font-medium text-white bg-primary rounded-lg hover:bg-primary/80 disabled:opacity-50 flex items-center gap-2"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDeleteMethod(method.id)}
                        className="px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center gap-2 transition-colors"
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
          {methods.map((method) => (
            <div
              key={method.id}
              className="bg-white dark:bg-slate-800 rounded-lg shadow p-4 border border-slate-200 dark:border-slate-600"
            >
              <div className="flex justify-between items-start mb-3">
                <div className="flex items-start">
                  <div className="flex-shrink-0 mr-3">
                    {getPaymentTypeIcon(method.type)}
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-medium text-slate-900 dark:text-white">
                      {method.name}
                    </h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                      {method.type}
                    </p>
                  </div>
                </div>
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
              </div>
              <div className="ml-8">
                <div className="space-y-2 text-sm text-slate-500 dark:text-slate-400 mb-3">
                  <p>
                    <span className="font-medium">Nomor:</span>{" "}
                    {method.account_number}
                  </p>
                  <p>
                    <span className="font-medium">Atas Nama:</span>{" "}
                    {method.holder_name}
                  </p>
                </div>
                <div className="flex justify-end space-x-2">
                  <button
                    onClick={() => handleEditMethod(method)}
                    className="px-3 py-2 text-sm font-medium text-white bg-primary rounded-lg hover:bg-primary/80 disabled:opacity-50 flex items-center gap-2"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDeleteMethod(method.id)}
                    className="px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center gap-2 transition-colors"
                  >
                    <TrashIcon className="h-4 w-4 mr-1" />
                    Hapus
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Empty State */}
        {methods.length === 0 && (
          <div className="text-center py-12">
            <CreditCardIcon className="mx-auto h-12 w-12 text-slate-400" />
            <h3 className="mt-2 text-sm font-medium text-slate-900 dark:text-white">
              Tidak ada metode pembayaran
            </h3>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              Belum ada metode pembayaran yang ditambahkan.
            </p>
            <div className="mt-6">
              <button
                onClick={handleAddMethod}
                className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary hover:bg-primary/80 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
              >
                <PlusIcon className="-ml-1 mr-2 h-5 w-5" />
                Tambah Metode Baru
              </button>
            </div>
          </div>
        )}

        {/* Modal for Add/Edit Payment Method - Diperbaiki */}
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

      {/* Toast Notification */}

    </div>
  );
}
