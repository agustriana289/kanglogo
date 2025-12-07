"use client";

import { useState, useEffect } from "react";
import { checkEmailConfig, sendTestEmailSimple } from "./actions";

export default function DebugEmailPage() {
    const [config, setConfig] = useState<any>(null);
    const [testEmail, setTestEmail] = useState("");
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<any>(null);

    useEffect(() => {
        checkEmailConfig().then(setConfig);
    }, []);

    const handleTestSend = async () => {
        if (!testEmail) return alert("Masukkan email tujuan");

        setLoading(true);
        setResult(null);
        try {
            const res = await sendTestEmailSimple(testEmail);
            setResult(res);
        } catch (e: any) {
            setResult({ success: false, error: { message: e.message } });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="p-8 max-w-2xl mx-auto">
            <h1 className="text-2xl font-bold mb-6">Email Debugger</h1>

            <div className="bg-white p-6 rounded-lg shadow mb-6 space-y-4">
                <h2 className="font-semibold text-lg border-b pb-2">Konfigurasi Server</h2>
                {config ? (
                    <dl className="grid grid-cols-2 gap-4">
                        <dt className="text-gray-600">Site URL:</dt>
                        <dd className="font-mono">{config.siteUrl}</dd>

                        <dt className="text-gray-600">Has API Key:</dt>
                        <dd className={config.hasApiKey ? "text-green-600 font-bold" : "text-red-600 font-bold"}>
                            {config.hasApiKey ? "YES" : "NO"}
                        </dd>

                        <dt className="text-gray-600">API Key Prefix:</dt>
                        <dd className="font-mono">{config.apiKeyPrefix}...</dd>
                    </dl>
                ) : (
                    <p>Loading config...</p>
                )}
            </div>

            <div className="bg-white p-6 rounded-lg shadow mb-6">
                <h2 className="font-semibold text-lg border-b pb-2 mb-4">Test Kirim Email</h2>
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium mb-1">Email Tujuan</label>
                        <input
                            type="email"
                            value={testEmail}
                            onChange={(e) => setTestEmail(e.target.value)}
                            className="w-full border p-2 rounded"
                            placeholder="contoh@email.com"
                        />
                    </div>
                    <button
                        onClick={handleTestSend}
                        disabled={loading}
                        className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
                    >
                        {loading ? "Mengirim..." : "Kirim Test Email"}
                    </button>
                </div>
            </div>

            {result && (
                <div className={`p-6 rounded-lg shadow ${result.success ? "bg-green-50" : "bg-red-50"}`}>
                    <h2 className={`font-bold mb-2 ${result.success ? "text-green-700" : "text-red-700"}`}>
                        {result.success ? "Berhasil Terkirim!" : "Gagal Mengirim"}
                    </h2>
                    <pre className="whitespace-pre-wrap text-sm font-mono overflow-auto max-h-60 bg-white/50 p-4 rounded">
                        {JSON.stringify(result, null, 2)}
                    </pre>

                    {!result.success && result.error?.name === "resend_error" && (
                        <div className="mt-4 text-sm text-red-800">
                            <strong>Analisis Kemungkinan Penyebab:</strong>
                            <ul className="list-disc pl-5 mt-1 space-y-1">
                                {result.error?.message?.includes("domain is not verified") && (
                                    <li>Domain <code>kanglogo.com</code> belum diverifikasi di dashboard Resend. Silahkan cek DNS records.</li>
                                )}
                                {result.error?.statusCode === 401 && (
                                    <li>API Key salah atau tidak valid.</li>
                                )}
                                {result.error?.statusCode === 429 && (
                                    <li>Limit pengiriman harian tercapai.</li>
                                )}
                            </ul>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
