"use client";

import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { useAlert } from "@/components/providers/AlertProvider";
import LogoPathAnimation from "@/components/LogoPathAnimation";
import {
    UserCircleIcon,
    EnvelopeIcon,
    KeyIcon,
    PencilIcon,
    CheckIcon,
    XMarkIcon,
} from "@heroicons/react/24/outline";

export default function ProfilePage() {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [user, setUser] = useState<any>(null);
    const [editingField, setEditingField] = useState<string | null>(null);
    const { showAlert } = useAlert();

    // Form states
    const [email, setEmail] = useState("");
    const [tempEmail, setTempEmail] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [showPasswordFields, setShowPasswordFields] = useState(false);

    const fetchUser = useCallback(async () => {
        setLoading(true);
        try {
            const {
                data: { user },
                error,
            } = await supabase.auth.getUser();
            if (error) throw error;
            if (user) {
                setUser(user);
                setEmail(user.email || "");
                setTempEmail(user.email || "");
            }
        } catch (error) {
            console.error("Error fetching user:", error);
            showAlert("error", "Error", "Gagal memuat data pengguna");
        } finally {
            setLoading(false);
        }
    }, [showAlert]);

    useEffect(() => {
        fetchUser();
    }, [fetchUser]);

    const handleEditField = (field: string) => {
        setEditingField(field);
        if (field === "email") {
            setTempEmail(email);
        }
    };

    const handleCancelEdit = () => {
        setEditingField(null);
        setTempEmail(email);
    };

    const handleSaveEmail = async () => {
        if (!tempEmail) {
            showAlert("error", "Validasi", "Email tidak boleh kosong");
            return;
        }

        setSaving(true);
        try {
            const { error } = await supabase.auth.updateUser({ email: tempEmail });
            if (error) throw error;

            setEmail(tempEmail);
            setEditingField(null);
            showAlert(
                "success",
                "Berhasil",
                "Email berhasil diperbarui. Silakan cek email Anda untuk konfirmasi."
            );
        } catch (error: any) {
            console.error("Error updating email:", error);
            showAlert("error", "Gagal", error.message || "Gagal memperbarui email");
        } finally {
            setSaving(false);
        }
    };

    const handleUpdatePassword = async () => {
        if (!newPassword || !confirmPassword) {
            showAlert("error", "Validasi", "Semua field password harus diisi");
            return;
        }

        if (newPassword !== confirmPassword) {
            showAlert("error", "Validasi", "Password baru dan konfirmasi tidak cocok");
            return;
        }

        if (newPassword.length < 6) {
            showAlert("error", "Validasi", "Password minimal 6 karakter");
            return;
        }

        setSaving(true);
        try {
            const { error } = await supabase.auth.updateUser({ password: newPassword });
            if (error) throw error;

            showAlert("success", "Berhasil", "Password berhasil diperbarui");
            setNewPassword("");
            setConfirmPassword("");
            setShowPasswordFields(false);
        } catch (error: any) {
            console.error("Error updating password:", error);
            showAlert("error", "Gagal", error.message || "Gagal memperbarui password");
        } finally {
            setSaving(false);
        }
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

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Contact Details / Profile Info */}
                <div className="bg-white rounded-lg shadow-sm border border-slate-100">
                    {/* Header */}
                    <div className="p-6 border-b border-gray-200">
                        <div className="flex items-center justify-between">
                            <div>
                                <h2 className="text-lg font-semibold text-gray-900">Informasi Profil</h2>
                                <p className="text-sm text-gray-500 mt-1">
                                    Informasi akun Anda disediakan di bawah ini.
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Body - Details List */}
                    <div className="p-6 space-y-4">
                        {/* Email */}
                        <div className="flex items-center justify-between py-3 border-b border-gray-100">
                            <div className="flex-1">
                                <p className="text-sm font-medium text-gray-500">Email</p>
                                {editingField === "email" ? (
                                    <div className="mt-2 flex items-center gap-2">
                                        <input
                                            type="email"
                                            value={tempEmail}
                                            onChange={(e) => setTempEmail(e.target.value)}
                                            className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
                                            autoFocus
                                        />
                                        <button
                                            onClick={handleSaveEmail}
                                            disabled={saving}
                                            className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition"
                                            title="Simpan"
                                        >
                                            <CheckIcon className="w-5 h-5" />
                                        </button>
                                        <button
                                            onClick={handleCancelEdit}
                                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition"
                                            title="Batal"
                                        >
                                            <XMarkIcon className="w-5 h-5" />
                                        </button>
                                    </div>
                                ) : (
                                    <p className="text-sm text-gray-900 mt-1">{email}</p>
                                )}
                            </div>
                            {editingField !== "email" && (
                                <button
                                    onClick={() => handleEditField("email")}
                                    className="p-2 text-gray-400 hover:text-blue-500 hover:bg-blue-50 rounded-lg transition ml-2"
                                    title="Edit Email"
                                >
                                    <PencilIcon className="w-5 h-5" />
                                </button>
                            )}
                        </div>

                        {/* User ID */}
                        <div className="flex items-center justify-between py-3 border-b border-gray-100">
                            <div className="flex-1">
                                <p className="text-sm font-medium text-gray-500">ID Pengguna</p>
                                <p className="text-sm text-gray-900 mt-1 font-mono truncate">
                                    {user?.id}
                                </p>
                            </div>
                        </div>

                        {/* Created At */}
                        <div className="flex items-center justify-between py-3 border-b border-gray-100">
                            <div className="flex-1">
                                <p className="text-sm font-medium text-gray-500">Akun Dibuat</p>
                                <p className="text-sm text-gray-900 mt-1">
                                    {user?.created_at
                                        ? new Date(user.created_at).toLocaleDateString("id-ID", {
                                            day: "numeric",
                                            month: "long",
                                            year: "numeric",
                                        })
                                        : "-"}
                                </p>
                            </div>
                        </div>

                        {/* Last Sign In */}
                        <div className="flex items-center justify-between py-3">
                            <div className="flex-1">
                                <p className="text-sm font-medium text-gray-500">Terakhir Login</p>
                                <p className="text-sm text-gray-900 mt-1">
                                    {user?.last_sign_in_at
                                        ? new Date(user.last_sign_in_at).toLocaleDateString("id-ID", {
                                            day: "numeric",
                                            month: "long",
                                            year: "numeric",
                                            hour: "2-digit",
                                            minute: "2-digit",
                                        })
                                        : "-"}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Security Settings */}
                <div className="bg-white rounded-lg shadow-sm border border-slate-100">
                    {/* Header */}
                    <div className="p-6 border-b border-gray-200">
                        <div className="flex items-center justify-between">
                            <div>
                                <h2 className="text-lg font-semibold text-gray-900">Keamanan</h2>
                                <p className="text-sm text-gray-500 mt-1">
                                    Kelola password dan keamanan akun Anda.
                                </p>
                            </div>
                            {!showPasswordFields && (
                                <button
                                    onClick={() => setShowPasswordFields(true)}
                                    className="px-4 py-2 text-sm font-medium text-primary hover:bg-primary/10 rounded-lg transition"
                                >
                                    Ubah Password
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Body */}
                    <div className="p-6">
                        {showPasswordFields ? (
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Password Baru
                                    </label>
                                    <input
                                        type="password"
                                        value={newPassword}
                                        onChange={(e) => setNewPassword(e.target.value)}
                                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
                                        placeholder="Minimal 6 karakter"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Konfirmasi Password Baru
                                    </label>
                                    <input
                                        type="password"
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
                                        placeholder="Ketik ulang password baru"
                                    />
                                </div>
                                <div className="flex items-center gap-3 pt-2">
                                    <button
                                        onClick={handleUpdatePassword}
                                        disabled={saving}
                                        className="px-4 py-2 text-sm font-medium text-white bg-primary rounded-lg hover:bg-primary/90 disabled:opacity-50 transition flex items-center gap-2"
                                    >
                                        {saving ? (
                                            "Menyimpan..."
                                        ) : (
                                            <>
                                                <CheckIcon className="w-4 h-4" />
                                                Simpan Password
                                            </>
                                        )}
                                    </button>
                                    <button
                                        onClick={() => {
                                            setShowPasswordFields(false);
                                            setNewPassword("");
                                            setConfirmPassword("");
                                        }}
                                        className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition"
                                    >
                                        Batal
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div className="text-center py-12">
                                <KeyIcon className="w-12 h-12 mx-auto text-gray-300 mb-3" />
                                <p className="text-sm text-gray-500">
                                    Klik tombol &quot;Ubah Password&quot; untuk mengubah password Anda.
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

        </div>
    );
}
