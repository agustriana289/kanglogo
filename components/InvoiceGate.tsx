"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { Lock, ArrowRight } from "lucide-react";

interface InvoiceGateProps {
    children: React.ReactNode;
    customerEmail: string;
    invoiceNumber: string;
}

export default function InvoiceGate({
    children,
    customerEmail,
    invoiceNumber,
}: InvoiceGateProps) {
    const [isVerified, setIsVerified] = useState(false);
    const [loading, setLoading] = useState(true);
    const [emailInput, setEmailInput] = useState("");
    const [error, setError] = useState("");

    useEffect(() => {
        checkAccess();
    }, []);

    const checkAccess = async () => {
        // 1. Check if Admin (Supabase Session)
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
            setIsVerified(true);
            setLoading(false);
            return;
        }

        // 2. Check Session Storage for this specific invoice
        const storedAccess = sessionStorage.getItem(`invoice_access_${invoiceNumber}`);
        if (storedAccess === "true") {
            setIsVerified(true);
        }

        setLoading(false);
    };

    const handleVerify = (e: React.FormEvent) => {
        e.preventDefault();
        setError("");

        if (!emailInput) {
            setError("Email wajib diisi");
            return;
        }

        // Compare email case-insensitive
        if (emailInput.toLowerCase().trim() === customerEmail.toLowerCase().trim()) {
            sessionStorage.setItem(`invoice_access_${invoiceNumber}`, "true");
            setIsVerified(true);
        } else {
            setError("Email tidak cocok dengan data pesanan.");
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
        );
    }

    if (isVerified) {
        return <>{children}</>;
    }

    return (
        <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-lg max-w-md w-full p-8">
                <div className="text-center mb-6">
                    <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Lock className="text-primary w-8 h-8" />
                    </div>
                    <h1 className="text-2xl font-bold text-slate-800">Proteksi Invoice</h1>
                    <p className="text-slate-500 mt-2">
                        Demi keamanan, silakan masukkan email yang digunakan saat pemesanan untuk melihat invoice ini.
                    </p>
                </div>

                <form onSubmit={handleVerify} className="space-y-4">
                    <div>
                        <label htmlFor="email" className="block text-sm font-medium text-slate-700 mb-1">
                            Alamat Email
                        </label>
                        <input
                            type="email"
                            id="email"
                            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all"
                            placeholder="nama@email.com"
                            value={emailInput}
                            onChange={(e) => setEmailInput(e.target.value)}
                        />
                        {error && <p className="text-red-500 text-sm mt-1">{error}</p>}
                    </div>

                    <button
                        type="submit"
                        className="w-full bg-primary text-white py-2.5 rounded-lg font-semibold hover:bg-primary/90 transition-all flex items-center justify-center gap-2"
                    >
                        Buka Invoice <ArrowRight size={18} />
                    </button>
                </form>
            </div>
        </div>
    );
}
