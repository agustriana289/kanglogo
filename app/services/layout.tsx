import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Jasa Desain Logo & Branding | KangLogo.com",
  description:
    "Layanan desain logo profesional, desain kemasan, branding, dan jasa desain grafis terpercaya di Indonesia dengan harga terjangkau.",
};

export default function ServicesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
