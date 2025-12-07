"use client";

import { useState, useEffect, useCallback } from "react";
import { usePathname } from "next/navigation";
import { supabase } from "@/lib/supabase";

interface RecentPurchase {
    id: number;
    type: "service" | "store";
    customerName: string;
    productName: string;
    packageName?: string;
    price: number;
    createdAt: string;
}

export default function PublicNotificationPopup() {
    const pathname = usePathname();
    const [purchases, setPurchases] = useState<RecentPurchase[]>([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isVisible, setIsVisible] = useState(false);

    // Only show on public pages
    const isPublicPage = !pathname.startsWith("/admin") && !pathname.startsWith("/login");

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat("id-ID", {
            style: "currency",
            currency: "IDR",
            minimumFractionDigits: 0,
        }).format(amount);
    };

    const formatRelativeTime = (dateString: string) => {
        const now = new Date();
        const date = new Date(dateString);
        const diffMs = now.getTime() - date.getTime();
        const diffSeconds = Math.floor(diffMs / 1000);
        const diffMinutes = Math.floor(diffSeconds / 60);
        const diffHours = Math.floor(diffMinutes / 60);
        const diffDays = Math.floor(diffHours / 24);

        if (diffSeconds < 60) {
            return "Baru saja";
        } else if (diffMinutes < 60) {
            return `${diffMinutes} menit yang lalu`;
        } else if (diffHours < 24) {
            return `${diffHours} jam yang lalu`;
        } else if (diffDays === 1) {
            return "Kemarin";
        } else if (diffDays < 7) {
            return `${diffDays} hari yang lalu`;
        } else if (diffDays < 30) {
            const weeks = Math.floor(diffDays / 7);
            return `${weeks} minggu yang lalu`;
        } else {
            const months = Math.floor(diffDays / 30);
            return `${months} bulan yang lalu`;
        }
    };

    const fetchRecentPurchases = useCallback(async () => {
        try {
            // Fetch service orders (no time filter - show all valid orders)
            const { data: serviceOrders, error: serviceError } = await supabase
                .from("orders")
                .select(`
          id,
          customer_name,
          package_details,
          final_price,
          discount_amount,
          created_at,
          services (
            title
          )
        `)
                .in("status", ["paid", "accepted", "in_progress", "completed"])
                .order("created_at", { ascending: false })
                .limit(20);

            // Fetch store orders (no time filter - show all valid orders)
            const { data: storeOrders, error: storeError } = await supabase
                .from("store_orders")
                .select(`
          id,
          customer_name,
          price,
          discount_amount,
          created_at,
          marketplace_assets (
            nama_aset
          )
        `)
                .in("status", ["paid", "accepted", "in_progress", "completed"])
                .order("created_at", { ascending: false })
                .limit(20);

            if (serviceError) console.error("Service orders error:", serviceError);
            if (storeError) console.error("Store orders error:", storeError);

            const allPurchases: RecentPurchase[] = [];

            // Process service orders
            if (serviceOrders) {
                serviceOrders.forEach((order: any) => {
                    allPurchases.push({
                        id: order.id,
                        type: "service",
                        customerName: order.customer_name,
                        productName: order.services?.title || "Jasa Desain",
                        packageName: order.package_details?.name,
                        price: (order.final_price || 0) + (order.discount_amount || 0),
                        createdAt: order.created_at,
                    });
                });
            }

            // Process store orders
            if (storeOrders) {
                storeOrders.forEach((order: any) => {
                    allPurchases.push({
                        id: order.id,
                        type: "store",
                        customerName: order.customer_name,
                        productName: order.marketplace_assets?.nama_aset || "Produk Digital",
                        price: (order.price || 0) + (order.discount_amount || 0),
                        createdAt: order.created_at,
                    });
                });
            }

            // Sort by created_at descending
            allPurchases.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

            console.log("Fetched purchases:", allPurchases.length); // Debug log

            if (allPurchases.length >= 1) {
                setPurchases(allPurchases);
            }
        } catch (error) {
            console.error("Error fetching purchases:", error);
        }
    }, []);

    useEffect(() => {
        if (!isPublicPage) return;
        fetchRecentPurchases();
    }, [fetchRecentPurchases, isPublicPage]);

    // Auto-show/hide cycle: show for 4s, hide for 2s, then show next
    useEffect(() => {
        if (!isPublicPage || purchases.length === 0) return;

        // Initial delay before first popup
        const initialDelay = setTimeout(() => {
            setIsVisible(true);
        }, 2000);

        return () => clearTimeout(initialDelay);
    }, [isPublicPage, purchases.length]);

    // Cycle through purchases: show for 4s, hide for 2s
    useEffect(() => {
        if (!isPublicPage || purchases.length === 0) return;

        const cycleInterval = setInterval(() => {
            // Hide current
            setIsVisible(false);

            // After 2s, show next
            setTimeout(() => {
                setCurrentIndex((prev) => (prev + 1) % purchases.length);
                setIsVisible(true);
            }, 2000);
        }, 6000); // Total cycle: 4s visible + 2s hidden

        return () => clearInterval(cycleInterval);
    }, [isPublicPage, purchases.length]);

    const anonymizeName = (name: string) => {
        if (!name) return "Seseorang";
        const parts = name.trim().split(" ");
        const firstName = parts[0];
        // Show first name with partial mask
        if (firstName.length <= 3) return firstName + "***";
        return firstName.substring(0, Math.min(firstName.length - 1, 4)) + "***";
    };

    // Debug: log when component renders
    console.log("PublicNotificationPopup render:", { isPublicPage, purchasesCount: purchases.length, isVisible });

    if (!isPublicPage || purchases.length === 0) return null;

    const currentPurchase = purchases[currentIndex];

    return (
        <div
            className={`fixed z-50 transition-all duration-500 ease-in-out 
                /* Mobile: Top centered, full width with padding */
                top-6 left-4 right-4 sm:left-auto sm:right-auto sm:top-auto 
                
                /* Desktop: Bottom left with proper spacing */
                sm:bottom-10 sm:left-8 
                
                ${isVisible
                    ? "opacity-100 translate-y-0"
                    : "opacity-0 -translate-y-4 sm:translate-y-4 pointer-events-none"
                }`}
        >
            <div className="bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden w-full sm:max-w-xs">
                <div className="p-3 flex items-start gap-3">
                    {/* Avatar */}
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center flex-shrink-0">
                        <span className="text-white font-bold text-sm">
                            {currentPurchase.customerName?.charAt(0)?.toUpperCase() || "?"}
                        </span>
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                        <p className="text-sm text-gray-800 leading-snug">
                            <span className="font-semibold">{anonymizeName(currentPurchase.customerName)}</span>
                            {" baru saja membeli"}
                        </p>
                        <p className="text-sm text-blue-600 font-medium truncate">
                            {currentPurchase.type === "service" ? (
                                <>
                                    {currentPurchase.productName}
                                    {currentPurchase.packageName && ` - ${currentPurchase.packageName}`}
                                </>
                            ) : (
                                currentPurchase.productName
                            )}
                        </p>
                        <div className="flex items-center justify-between mt-1">
                            <span className="text-xs text-gray-400">{formatRelativeTime(currentPurchase.createdAt)}</span>
                            <span className="text-xs font-semibold text-primary">
                                {formatCurrency(currentPurchase.price)}
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
