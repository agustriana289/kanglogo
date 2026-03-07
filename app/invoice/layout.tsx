import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Invoice | Kanglogo",
  description: "Lihat dan konfirmasi pembayaran invoice Anda",
};

export default function InvoiceLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
