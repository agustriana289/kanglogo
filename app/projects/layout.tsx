import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "Proyek Kami - Portfolio | Kanglogo",
    description: "Jelajahi portfolio karya-karya terbaik yang telah kami hasilkan untuk berbagai klien dan industri.",
};

export default function ProjectsLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return children;
}
