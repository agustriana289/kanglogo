"use client";

import { useEffect, useState } from "react";
import { HeartIcon } from "@heroicons/react/24/solid";

interface Supporter {
    supporter_name: string;
    quantity: number;
    unit: string;
    message: string;
    created_at: string;
}

export default function TrakteerWidget() {
    const [supporters, setSupporters] = useState<Supporter[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchSupporters = async () => {
            try {
                const res = await fetch('/api/trakteer');
                const json = await res.json();
                if (json.success) {
                    setSupporters(json.data);
                }
            } catch (error) {
                console.error("Failed to load supporters", error);
            } finally {
                setLoading(false);
            }
        };

        fetchSupporters();
    }, []);

    return (
        <div className="bg-white rounded-2xl shadow-xl border border-red-100 overflow-hidden">
            <div className="bg-gradient-to-r from-red-600 to-red-500 p-4 flex items-center justify-between text-white">
                <div className="flex items-center gap-2">
                    <HeartIcon className="w-5 h-5 text-white animate-pulse" />
                    <span className="font-bold text-sm tracking-wide">Dukungan Kreator</span>
                </div>
                <a
                    href="https://trakteer.id/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="bg-white text-red-600 px-3 py-1 rounded-full text-xs font-bold hover:bg-red-50 transition shadow-sm"
                >
                    Traktir Cendol!
                </a>
            </div>

            <div className="p-4 bg-[url('https://transparenttextures.com/patterns/clean-gray-paper.png')]">
                <p className="text-xs text-slate-500 mb-3 text-center">
                    Bantu kami terus mengembangkan generator ini dengan memberikan dukungan.
                </p>

                {loading ? (
                    <div className="flex justify-center py-2">
                        <div className="w-4 h-4 border-2 border-red-200 border-t-red-600 rounded-full animate-spin"></div>
                    </div>
                ) : supporters.length > 0 ? (
                    <div className="space-y-3">
                        <div className="text-xs font-semibold text-slate-700 uppercase tracking-widest text-center mb-2">Terima Kasih Kepada:</div>
                        <div className="flex flex-col gap-2 max-h-40 overflow-y-auto px-1 custom-scrollbar">
                            {supporters.map((s, idx) => (
                                <div key={idx} className="flex gap-2 items-start bg-white p-2 rounded-lg border border-slate-100 shadow-sm">
                                    <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center text-red-600 font-bold text-xs shrink-0">
                                        {s.supporter_name.charAt(0).toUpperCase()}
                                    </div>
                                    <div>
                                        <div className="flex items-baseline gap-1">
                                            <span className="text-xs font-bold text-slate-800">{s.supporter_name}</span>
                                            <span className="text-[10px] text-slate-400">memberikan {s.quantity} {s.unit}</span>
                                        </div>
                                        {s.message && (
                                            <p className="text-[10px] text-slate-600 italic">"{s.message}"</p>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                ) : (
                    <div className="text-center py-4 border-2 border-dashed border-slate-200 rounded-lg">
                        <p className="text-xs text-slate-400">Belum ada dukungan terbaru.</p>
                        <p className="text-xs text-slate-400">Jadilah yang pertama!</p>
                    </div>
                )}
            </div>
            <style jsx global>{`
                .custom-scrollbar::-webkit-scrollbar {
                    width: 4px;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                    background: #f1f5f9; 
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background: #cbd5e1; 
                    border-radius: 2px;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                    background: #94a3b8; 
                }
            `}</style>
        </div>
    );
}
