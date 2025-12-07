"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useAlert } from "@/components/providers/AlertProvider";
import LogoLoading from "@/components/LogoLoading";
import {
    UserCircleIcon,
    EnvelopeIcon,
    KeyIcon,
    CheckCircleIcon,
} from "@heroicons/react/24/outline";

export default function ProfilePage() {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [user, setUser] = useState<any>(null);
    const { showAlert } = useAlert();

    // Form states
    const [email, setEmail] = useState("");
    const [currentPassword, setCurrentPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");

    useEffect(() => {
        fetchUser();
    }, []);

    const fetchUser = async () => {
        setLoading(true);
        try {
            const { data: { user }, error } = await supabase.auth.getUser();
            if (error) throw error;
            if (user) {
                setUser(user);
                setEmail(user.email || "");
            }
        } catch (error) {
            console.error("Error fetching user:", error);
            showAlert("error", "Error", "Gagal memuat data pengguna");
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateEmail = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!email) {
            showAlert("error", "Validasi", "Email tidak boleh kosong");
            return;
        }

        setSaving(true);
        try {
            const { error } = await supabase.auth.updateUser({ email });
            if (error) throw error;
            showAlert("success", "Berhasil", "Email berhasil diperbarui. Silakan cek email Anda untuk konfirmasi.");
        } catch (error: any) {
            console.error("Error updating email:", error);
            showAlert("error", "Gagal", error.message || "Gagal memperbarui email");
        } finally {
            setSaving(false);
        }
    };

    const handleUpdatePassword = async (e: React.FormEvent) => {
        e.preventDefault();

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
            setCurrentPassword("");
            setNewPassword("");
            setConfirmPassword("");
        } catch (error: any) {
            console.error("Error updating password:", error);
            showAlert("error", "Gagal", error.message || "Gagal memperbarui password");
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="p-8 flex justify-center">
                <LogoLoading />
            </div>
        );
    }

    const inputStyle =
        "bg-white dark:bg-slate-900 shadow-sm focus:border-blue-300 focus:ring-blue-500/10 dark:focus:border-blue-800 w-full rounded-lg border border-gray-300 py-2.5 px-4 text-sm text-gray-800 placeholder:text-gray-400 focus:ring-3 focus:outline-none dark:border-gray-700 dark:text-white/90 dark:placeholder:text-white/30";

    return (
        <div className="min-h-screen bg-slate-100 dark:bg-slate-900 p-4 sm:p-6 lg:p-8 font-sans">
            <div className="max-w-3xl mx-auto space-y-6">
                {/* Header */}
                <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]">
                    <div className="flex items-center gap-4">
                        <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                            <UserCircleIcon className="w-10 h-10 text-primary" />
                        </div>
                        <div>
                            <h1 className="text-xl font-bold text-gray-900 dark:text-white">Profile Admin</h1>
                            <p className="text-sm text-gray-500 dark:text-gray-400">{user?.email}</p>
                        </div>
                    </div>
                </div>

                {/* Update Email */}
                <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]">
                    <div className="flex items-center gap-3 mb-6">
                        <EnvelopeIcon className="w-5 h-5 text-primary" />
                        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Ubah Email</h2>
                    </div>
                    <form onSubmit={handleUpdateEmail} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                Email Baru
                            </label>
                            <input
                                type="email"
                                className={inputStyle}
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="admin@example.com"
                            />
                        </div>
                        <div className="flex justify-end">
                            <button
                                type="submit"
                                disabled={saving}
                                className="px-4 py-2.5 text-sm font-medium text-white bg-primary rounded-lg hover:bg-primary/80 disabled:opacity-50 flex items-center gap-2"
                            >
                                {saving ? "Menyimpan..." : (
                                    <>
                                        <CheckCircleIcon className="w-4 h-4" />
                                        Simpan Email
                                    </>
                                )}
                            </button>
                        </div>
                    </form>
                </div>

                {/* Update Password */}
                <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]">
                    <div className="flex items-center gap-3 mb-6">
                        <KeyIcon className="w-5 h-5 text-primary" />
                        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Ubah Password</h2>
                    </div>
                    <form onSubmit={handleUpdatePassword} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                Password Baru
                            </label>
                            <input
                                type="password"
                                className={inputStyle}
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                placeholder="••••••••"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                Konfirmasi Password Baru
                            </label>
                            <input
                                type="password"
                                className={inputStyle}
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                placeholder="••••••••"
                            />
                        </div>
                        <div className="flex justify-end">
                            <button
                                type="submit"
                                disabled={saving}
                                className="px-4 py-2.5 text-sm font-medium text-white bg-primary rounded-lg hover:bg-primary/80 disabled:opacity-50 flex items-center gap-2"
                            >
                                {saving ? "Menyimpan..." : (
                                    <>
                                        <CheckCircleIcon className="w-4 h-4" />
                                        Ubah Password
                                    </>
                                )}
                            </button>
                        </div>
                    </form>
                </div>

                {/* Account Info */}
                <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]">
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Informasi Akun</h2>
                    <div className="space-y-3 text-sm">
                        <div className="flex justify-between py-2 border-b border-gray-100 dark:border-gray-800">
                            <span className="text-gray-500 dark:text-gray-400">ID Pengguna</span>
                            <span className="text-gray-900 dark:text-white font-mono text-xs">{user?.id}</span>
                        </div>
                        <div className="flex justify-between py-2 border-b border-gray-100 dark:border-gray-800">
                            <span className="text-gray-500 dark:text-gray-400">Terakhir Login</span>
                            <span className="text-gray-900 dark:text-white">
                                {user?.last_sign_in_at ? new Date(user.last_sign_in_at).toLocaleString("id-ID") : "-"}
                            </span>
                        </div>
                        <div className="flex justify-between py-2">
                            <span className="text-gray-500 dark:text-gray-400">Akun Dibuat</span>
                            <span className="text-gray-900 dark:text-white">
                                {user?.created_at ? new Date(user.created_at).toLocaleString("id-ID") : "-"}
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
