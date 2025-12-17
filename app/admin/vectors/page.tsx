// app/admin/vectors/page.tsx
"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { LogoVector } from "@/types/logoVector";
import Link from "next/link";
import { PlusIcon, PencilIcon, TrashIcon } from "@heroicons/react/24/outline";
import LogoPathAnimation from "@/components/LogoPathAnimation";

export default function AdminVectorsPage() {
    const [vectors, setVectors] = useState<LogoVector[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchVectors();
    }, []);

    const fetchVectors = async () => {
        try {
            const { data, error } = await supabase
                .from("logo_vectors")
                .select("*")
                .order("created_at", { ascending: false });

            if (error) throw error;
            setVectors(data || []);
        } catch (error) {
            console.error("Error fetching vectors:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id: number) => {
        if (!confirm("Yakin ingin menghapus logo vector ini?")) return;

        try {
            const { error } = await supabase
                .from("logo_vectors")
                .delete()
                .eq("id", id);

            if (error) throw error;

            setVectors(vectors.filter(v => v.id !== id));
            alert("Logo vector berhasil dihapus!");
        } catch (error: any) {
            console.error("Error deleting vector:", error);
            alert(`Gagal menghapus: ${error.message}`);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <LogoPathAnimation />
            </div>
        );
    }

    return (
        <div className="p-6">
            {/* Header */}
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Logo Vector</h1>
                    <p className="text-gray-600 mt-1">Kelola koleksi logo vector Anda</p>
                </div>
                <Link
                    href="/admin/vectors/new"
                    className="inline-flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary/90 transition-colors"
                >
                    <PlusIcon className="h-5 w-5" />
                    Tambah Vector
                </Link>
            </div>

            {/* Table */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Nama
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Kategori
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Downloads
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Status
                            </th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Aksi
                            </th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {vectors.map((vector) => (
                            <tr key={vector.id} className="hover:bg-gray-50">
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="text-sm font-medium text-gray-900">{vector.name}</div>
                                    <div className="text-sm text-gray-500">{vector.slug}</div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800">
                                        {vector.category}
                                    </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                    {vector.downloads}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${vector.is_published
                                            ? 'bg-green-100 text-green-800'
                                            : 'bg-gray-100 text-gray-800'
                                        }`}>
                                        {vector.is_published ? 'Published' : 'Draft'}
                                    </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                    <Link
                                        href={`/admin/vectors/${vector.id}/edit`}
                                        className="text-primary hover:text-primary/80 mr-4"
                                    >
                                        <PencilIcon className="h-5 w-5 inline" />
                                    </Link>
                                    <button
                                        onClick={() => handleDelete(vector.id)}
                                        className="text-red-600 hover:text-red-800"
                                    >
                                        <TrashIcon className="h-5 w-5 inline" />
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>

                {vectors.length === 0 && (
                    <div className="text-center py-12">
                        <p className="text-gray-500">Belum ada logo vector</p>
                    </div>
                )}
            </div>
        </div>
    );
}
