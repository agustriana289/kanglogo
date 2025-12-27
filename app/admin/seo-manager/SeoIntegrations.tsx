"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import {
    CloudArrowUpIcon,
    KeyIcon,
    CheckCircleIcon,
    XCircleIcon,
    QuestionMarkCircleIcon,
    ArrowTopRightOnSquareIcon
} from "@heroicons/react/24/outline";

export default function SeoIntegrations() {
    const [settings, setSettings] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    // UI State for Modals
    const [showGoogleModal, setShowGoogleModal] = useState(false);
    const [showBingModal, setShowBingModal] = useState(false);
    const [jsonFile, setJsonFile] = useState<File | null>(null);
    const [bingKey, setBingKey] = useState("");

    useEffect(() => {
        fetchSettings();
    }, []);

    const fetchSettings = async () => {
        setLoading(true);
        const { data, error } = await supabase.from("website_settings").select("*").single();
        if (data) setSettings(data);
        setLoading(false);
    };

    const handleSaveGoogle = async () => {
        if (!jsonFile) return alert("Pilih file JSON terlebih dahulu");
        setSaving(true);

        const reader = new FileReader();
        reader.onload = async (e) => {
            const jsonContent = e.target?.result as string;

            // Validate JSON a bit
            try {
                const parsed = JSON.parse(jsonContent);
                if (!parsed.type || !parsed.project_id) {
                    throw new Error("Invalid Service Account JSON");
                }

                // Update DB
                const { error } = await supabase
                    .from("website_settings")
                    .update({ google_search_console_key: jsonContent })
                    .eq("id", settings.id);

                if (error) throw error;

                setSettings({ ...settings, google_search_console_key: jsonContent });
                setShowGoogleModal(false);
                alert("Google Integration Saved!");
            } catch (err) {
                alert("File JSON tidak valid atau gagal upload.");
                console.error(err);
            } finally {
                setSaving(false);
            }
        };
        reader.readAsText(jsonFile);
    };

    const handleSaveBing = async () => {
        if (!bingKey) return alert("Masukkan API Key");
        setSaving(true);

        try {
            const { error } = await supabase
                .from("website_settings")
                .update({ bing_webmaster_key: bingKey })
                .eq("id", settings.id);

            if (error) throw error;

            setSettings({ ...settings, bing_webmaster_key: bingKey });
            setShowBingModal(false);
            alert("Bing Integration Saved!");
        } catch (err) {
            console.error(err);
            alert("Gagal menyimpan key.");
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <div className="p-10 text-center">Loading integration status...</div>;

    const isGoogleConnected = !!settings?.google_search_console_key;
    const isBingConnected = !!settings?.bing_webmaster_key;

    return (
        <div className="space-y-6">
            <div className="bg-blue-50 border border-blue-100 p-6 rounded-2xl">
                <h3 className="text-lg font-bold text-blue-900 flex items-center gap-2">
                    <QuestionMarkCircleIcon className="w-6 h-6" />
                    Mengapa Perlu Integrasi?
                </h3>
                <p className="text-sm text-blue-800 mt-2 leading-relaxed">
                    Menghubungkan API <strong>Google Search Console</strong> dan <strong>Bing Webmaster Tools</strong> memungkinkan Anda melihat data ranking asli (posisi website di pencarian), kata kunci yang sering dicari, dan status index halaman secara langsung di dashboard ini.
                    <br />
                    Layanan ini <strong>GRATIS</strong> dari Google dan Microsoft.
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Google Card */}
                <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm relative overflow-hidden group hover:shadow-md transition-shadow">
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                        <img src="https://upload.wikimedia.org/wikipedia/commons/2/2d/Google-favicon-2015.png" alt="Google" className="w-24 h-24" />
                    </div>
                    <div className="flex justify-between items-start mb-4">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-white border border-gray-100 rounded-full flex items-center justify-center p-2 shadow-sm">
                                <img src="https://upload.wikimedia.org/wikipedia/commons/2/2d/Google-favicon-2015.png" alt="Google" className="w-full h-full object-contain" />
                            </div>
                            <div>
                                <h4 className="font-bold text-gray-900">Google Search Console</h4>
                                <p className="text-xs text-gray-500">Data Ranking & Klik Organik</p>
                            </div>
                        </div>
                        {isGoogleConnected ? (
                            <span className="bg-green-100 text-green-700 text-xs px-2 py-1 rounded-full flex items-center gap-1 font-medium">
                                <CheckCircleIcon className="w-3 h-3" /> Terhubung
                            </span>
                        ) : (
                            <span className="bg-gray-100 text-gray-500 text-xs px-2 py-1 rounded-full flex items-center gap-1 font-medium">
                                <XCircleIcon className="w-3 h-3" /> Belum Terhubung
                            </span>
                        )}
                    </div>

                    <p className="text-sm text-gray-600 mb-6 min-h-[40px]">
                        Lihat berapa kali website muncul di Google, posisi rata-rata, dan kata kunci teratas.
                    </p>

                    <button
                        onClick={() => setShowGoogleModal(true)}
                        className="w-full py-2.5 rounded-lg border border-gray-200 hover:border-blue-500 hover:text-blue-600 hover:bg-blue-50 transition-all text-sm font-semibold text-gray-700 flex justify-center items-center gap-2"
                    >
                        {isGoogleConnected ? "Update Konfigurasi" : "Hubungkan Sekarang"}
                    </button>
                </div>

                {/* Bing Card */}
                <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm relative overflow-hidden group hover:shadow-md transition-shadow">
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                        {/* Bing Icon Placeholder */}
                        <div className="w-24 h-24 bg-blue-500 rounded-full"></div>
                    </div>
                    <div className="flex justify-between items-start mb-4">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-white border border-gray-100 rounded-full flex items-center justify-center p-2 shadow-sm">
                                {/* Simple Bing Icon SVG */}
                                <svg viewBox="0 0 24 24" fill="none" className="w-6 h-6 text-blue-600" xmlns="http://www.w3.org/2000/svg"><path d="M5.4 2L4 3.4V20.6L14 22L19.4 15.6L10.6 13.8V7.8L5.4 2Z" fill="currentColor" /></svg>
                            </div>
                            <div>
                                <h4 className="font-bold text-gray-900">Bing Webmaster Tools</h4>
                                <p className="text-xs text-gray-500">Data Index & Pencarian Microsoft</p>
                            </div>
                        </div>
                        {isBingConnected ? (
                            <span className="bg-green-100 text-green-700 text-xs px-2 py-1 rounded-full flex items-center gap-1 font-medium">
                                <CheckCircleIcon className="w-3 h-3" /> Terhubung
                            </span>
                        ) : (
                            <span className="bg-gray-100 text-gray-500 text-xs px-2 py-1 rounded-full flex items-center gap-1 font-medium">
                                <XCircleIcon className="w-3 h-3" /> Belum Terhubung
                            </span>
                        )}
                    </div>

                    <p className="text-sm text-gray-600 mb-6 min-h-[40px]">
                        Lacak performa di mesin pencari Bing, Yahoo, dan partner Microsoft lainnya.
                    </p>

                    <button
                        onClick={() => setShowBingModal(true)}
                        className="w-full py-2.5 rounded-lg border border-gray-200 hover:border-blue-500 hover:text-blue-600 hover:bg-blue-50 transition-all text-sm font-semibold text-gray-700 flex justify-center items-center gap-2"
                    >
                        {isBingConnected ? "Update API Key" : "Hubungkan Sekarang"}
                    </button>
                </div>
            </div>

            {/* Google Setup Modal */}
            {showGoogleModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={() => setShowGoogleModal(false)}>
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden" onClick={e => e.stopPropagation()}>
                        <div className="p-6 border-b border-gray-100">
                            <h3 className="text-lg font-bold text-gray-900">Setup Google Search Console</h3>
                        </div>
                        <div className="p-6 space-y-4">
                            <div className="text-sm text-gray-600 space-y-2 bg-slate-50 p-4 rounded-lg">
                                <p className="font-semibold text-gray-800">Cara mendapatkan Credential:</p>
                                <ol className="list-decimal list-inside space-y-1 ml-1 text-xs">
                                    <li>Buka <strong>Google Cloud Console</strong> & Enable <strong>Google Search Console API</strong>.</li>
                                    <li>Masuk ke menu <strong>IAM & Admin</strong> &rarr; <strong>Service Accounts</strong>.</li>
                                    <li>Klik <strong>Email</strong> service account yang baru Anda buat.</li>
                                    <li>Pilih tab <strong>KEYS</strong> di bagian atas.</li>
                                    <li>Klik tombol <strong>ADD KEY</strong> &rarr; <strong>Create new key</strong>.</li>
                                    <li>Pilih tipe <strong>JSON</strong> lalu klik Create. File akan terdownload.</li>
                                    <li>Buka file JSON tersebut dengan Notepad.</li>
                                    <li>Cari tulisan <code>&quot;client_email&quot;</code>, copy alamat email disebelahnya (contoh: <em>nama@project.iam...</em>).</li>
                                    <li>Buka <strong>Google Search Console</strong> website Anda.</li>
                                    <li>Masuk menu <strong>Settings</strong> &rarr; <strong>Users and permissions</strong> &rarr; <strong>Add User</strong>.</li>
                                    <li>Paste email tadi, pilih izin <strong>Owner</strong>, lalu klik Add.</li>
                                </ol>
                                <a href="https://developers.google.com/webmaster-tools/v1/how-tos/authorizing" target="_blank" className="text-blue-500 hover:underline text-xs flex items-center gap-1 mt-2">
                                    Lihat Dokumentasi Resmi <ArrowTopRightOnSquareIcon className="w-3 h-3" />
                                </a>
                            </div>

                            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 hover:border-blue-500 transition-colors bg-gray-50 flex flex-col items-center justify-center text-center cursor-pointer" onClick={() => document.getElementById('json-upload')?.click()}>
                                <CloudArrowUpIcon className="w-10 h-10 text-gray-400 mb-2" />
                                {jsonFile ? (
                                    <p className="text-sm font-medium text-green-600">{jsonFile.name}</p>
                                ) : (
                                    <>
                                        <p className="text-sm font-medium text-gray-700">Upload File JSON</p>
                                        <p className="text-xs text-gray-500 mt-1">drag & drop atau klik disini</p>
                                    </>
                                )}
                                <input id="json-upload" type="file" accept=".json" className="hidden" onChange={e => setJsonFile(e.target.files?.[0] || null)} />
                            </div>
                        </div>
                        <div className="p-6 border-t border-gray-100 flex justify-end gap-3 bg-gray-50">
                            <button onClick={() => setShowGoogleModal(false)} className="px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-lg">Batal</button>
                            <button
                                onClick={handleSaveGoogle}
                                disabled={saving}
                                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm disabled:opacity-50"
                            >
                                {saving ? "Menyimpan..." : "Simpan Konfigurasi"}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Bing Setup Modal */}
            {showBingModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={() => setShowBingModal(false)}>
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden" onClick={e => e.stopPropagation()}>
                        <div className="p-6 border-b border-gray-100">
                            <h3 className="text-lg font-bold text-gray-900">Setup Bing Webmaster Tools</h3>
                        </div>
                        <div className="p-6 space-y-4">
                            <div className="text-sm text-gray-600 space-y-2 bg-slate-50 p-4 rounded-lg">
                                <p className="font-semibold text-gray-800">Cara mendapatkan API Key:</p>
                                <ol className="list-decimal list-inside space-y-1 ml-1 text-xs">
                                    <li>Login ke <strong>Bing Webmaster Tools</strong>.</li>
                                    <li>Klik ikon Gear (Settings) di pojok kanan atas.</li>
                                    <li>Pilih menu <strong>API Access</strong>.</li>
                                    <li>Klik &quot;Generate API Key&quot;.</li>
                                    <li>Copy Key tersebut.</li>
                                </ol>
                                <a href="https://www.bing.com/webmasters/help/webmaster-api-getting-started-598d417e" target="_blank" className="text-blue-500 hover:underline text-xs flex items-center gap-1 mt-2">
                                    Buka Bing Webmaster Tools <ArrowTopRightOnSquareIcon className="w-3 h-3" />
                                </a>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">API Key</label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <KeyIcon className="h-5 w-5 text-gray-400" />
                                    </div>
                                    <input
                                        type="text"
                                        className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                                        placeholder="Masukkan API Key Bing..."
                                        value={bingKey}
                                        onChange={(e) => setBingKey(e.target.value)}
                                    />
                                </div>
                            </div>
                        </div>
                        <div className="p-6 border-t border-gray-100 flex justify-end gap-3 bg-gray-50">
                            <button onClick={() => setShowBingModal(false)} className="px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-lg">Batal</button>
                            <button
                                onClick={handleSaveBing}
                                disabled={saving}
                                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm disabled:opacity-50"
                            >
                                {saving ? "Menyimpan..." : "Simpan Key"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
