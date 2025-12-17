import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "Artikel - Kanglogo",
    description: "Jelajahi artikel seputar desain logo, branding, dan tips kreatif dari Kanglogo.",
};

export default function ArticlesLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return children;
}
