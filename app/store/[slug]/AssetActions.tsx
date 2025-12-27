"use client";

import { useState } from "react";
import { MarketplaceAsset } from "@/types/marketplace";
import PurchaseModal from "./PurchaseModal";

interface AssetActionsProps {
    asset: MarketplaceAsset;
}

export default function AssetActions({ asset }: AssetActionsProps) {
    const [showPurchaseModal, setShowPurchaseModal] = useState(false);

    return (
        <>
            {/* SOLD OUT Badge */}
            {asset.is_sold && (
                <div className="bg-red-100 border border-red-200 rounded-lg p-4 mb-4">
                    <div className="flex items-center gap-2">
                        <span className="text-2xl">🔴</span>
                        <div>
                            <h3 className="font-bold text-red-900">SOLD OUT</h3>
                            <p className="text-sm text-red-700">
                                Item ini sudah terjual dan tidak tersedia lagi
                            </p>
                        </div>
                    </div>
                </div>
            )}

            <div className="pt-6 border-t border-slate-200">
                <button
                    onClick={() => setShowPurchaseModal(true)}
                    disabled={asset.is_sold}
                    className={`w-full py-3 px-6 rounded-lg font-medium transition-colors ${asset.is_sold
                            ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                            : asset.jenis === "premium"
                                ? "bg-primary hover:bg-primary/90 text-white"
                                : "bg-green-600 hover:bg-green-700 text-white"
                        }`}
                >
                    {asset.is_sold
                        ? "SOLD OUT"
                        : asset.jenis === "premium"
                            ? "Beli Sekarang"
                            : "Unduh Gratis"}
                </button>
            </div>

            <PurchaseModal
                asset={asset}
                isOpen={showPurchaseModal}
                onClose={() => setShowPurchaseModal(false)}
            />
        </>
    );
}
