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
            <div className="pt-6 border-t border-slate-200">
                <button
                    onClick={() => setShowPurchaseModal(true)}
                    className={`w-full py-3 px-6 rounded-lg font-medium text-white ${asset.jenis === "premium"
                            ? "bg-primary hover:bg-primary/90"
                            : "bg-green-600 hover:bg-green-700"
                        } transition-colors`}
                >
                    {asset.jenis === "premium" ? "Beli Sekarang" : "Unduh Gratis"}
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
