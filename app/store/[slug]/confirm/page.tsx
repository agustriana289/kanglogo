import { notFound } from "next/navigation";
import PaymentConfirmView from "@/components/store/PaymentConfirmView";

export default async function ConfirmPage({
    params,
}: {
    params: Promise<{ slug: string }>;
}) {
    const { slug } = await params;

    // Hanya izinkan akses jika slug berupa format Invoice (STR-...)
    // Produk biasa tidak memiliki halaman confirm manual di path ini
    if (!slug.startsWith("STR-")) {
        notFound();
    }

    return <PaymentConfirmView invoiceNumber={slug} />;
}
