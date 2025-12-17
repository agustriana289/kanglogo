import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "FAQ - Pertanyaan Yang Sering Diajukan | Kanglogo",
    description: "Temukan jawaban untuk pertanyaan yang sering diajukan tentang layanan desain logo dan aset digital Kanglogo.",
};

export default function FAQLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return children;
}
