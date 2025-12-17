import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "Store - Aset Digital | Kanglogo",
    description: "Jelajahi koleksi logo, ikon, dan aset grafis berkualitas tinggi untuk proyek Anda di marketplace Kanglogo.",
};

export default function StoreLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return children;
}
