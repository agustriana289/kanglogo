import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import jsPDF from "jspdf";
import "jspdf-autotable";

interface AutoTableOptions {
  head: string[][];
  body: string[][];
  startY: number;
}

// Extend jsPDF to include autotable
declare module "jspdf" {
  interface jsPDF {
    autoTable: (options: AutoTableOptions) => void;
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: { invoice_number: string } }
) {
  const { invoice_number } = params;

  try {
    // Ambil data pesanan dan join dengan tabel services dan payment_methods
    const { data: order, error } = await supabase
      .from("orders")
      .select(
        `
        *,
        services ( title )
      `
      )
      .eq("invoice_number", invoice_number)
      .single();

    if (error || !order) {
      return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
    }

    const doc = new jsPDF();

    // Header
    doc.setFontSize(20);
    doc.text("INVOICE", 105, 20, { align: "center" });
    doc.setFontSize(12);
    doc.text(`No. ${order.invoice_number}`, 105, 30, { align: "center" });
    doc.text(
      `Tanggal: ${new Date(order.created_at).toLocaleDateString("id-ID")}`,
      105,
      37,
      { align: "center" }
    );

    // Info Penjual dan Pembeli
    doc.setFontSize(10);
    doc.text("Dari:", 14, 55);
    doc.setFont("helvetica", "bold");
    doc.text("Kanglogo", 14, 62);
    doc.setFont("helvetica", "normal");
    doc.text("Jl. Contoh No. 123, Kota", 14, 69);
    doc.text("email@kanglogo.com", 14, 76);

    doc.text("Kepada:", 105, 55);
    doc.setFont("helvetica", "bold");
    doc.text(order.customer_name, 105, 62);
    doc.setFont("helvetica", "normal");
    doc.text(order.customer_email, 105, 69);
    doc.text(order.customer_whatsapp, 105, 76);

    // Tabel Detail Pesanan
    const tableData = [
      ["Layanan", (order.services as any)?.title || "N/A"],
      ["Paket", order.package_details.name],
      ["Durasi", order.package_details.duration],
      ["Metode Pembayaran", order.payment_method],
    ];

    (doc as any).autoTable({
      head: [["Deskripsi", "Detail"]],
      body: tableData,
      startY: 90,
    });

    // Total Harga
    const finalY = (doc as any).lastAutoTable.finalY || 90;
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text(
      `Total: Rp ${order.final_price.toLocaleString("id-ID")}`,
      14,
      finalY + 20
    );

    // Footer
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text("Terima kasih atas kepercayaan Anda.", 105, 280, {
      align: "center",
    });

    const pdfBytes = Buffer.from(doc.output("arraybuffer"));

    return new NextResponse(pdfBytes, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="invoice-${invoice_number}.pdf"`,
      },
    });
  } catch (error) {
    console.error("Error generating invoice:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
