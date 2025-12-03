// app/order/[invoice_number]/confirm/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Order } from "@/types/order";
import { supabase } from "@/lib/supabase";
import { uploadToImgBB } from "@/lib/imgbb-upload";
import { Upload, Link as LinkIcon, X } from "lucide-react";
import LogoLoading from "@/components/LogoLoading";

export default function ConfirmPaymentPage({
  params,
}: {
  params: { invoice_number: string };
}) {
  const router = useRouter();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Method selection
  const [proofMethod, setProofMethod] = useState<"file" | "url">("file");

  // File upload states
  const [proofFile, setProofFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string>("");
  const [uploadProgress, setUploadProgress] = useState(0);

  // URL input state
  const [proofUrl, setProofUrl] = useState("");

  // Message
  const [message, setMessage] = useState("");

  useEffect(() => {
    const fetchOrder = async () => {
      const { data, error } = await supabase
        .from("orders")
        .select("*")
        .eq("invoice_number", params.invoice_number)
        .single();

      if (error || !data || data.status !== "pending_payment") {
        router.push(`/order/${params.invoice_number}`); // Redirect jika bukan status pending
        return;
      }
      setOrder(data);
      setLoading(false);
    };

    fetchOrder();
  }, [params.invoice_number, router]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert("Ukuran file maksimal 5MB");
      return;
    }

    // Validate file type
    const allowedTypes = [
      "image/jpeg",
      "image/png",
      "image/jpg",
      "application/pdf",
    ];
    if (!allowedTypes.includes(file.type)) {
      alert("Format file harus JPG, PNG, atau PDF");
      return;
    }

    setProofFile(file);

    // Create preview for images only
    if (file.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFilePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    } else {
      setFilePreview("");
    }
  };

  const removeFile = () => {
    setProofFile(null);
    setFilePreview("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (proofMethod === "file" && !proofFile) {
      alert("Silakan pilih file bukti pembayaran.");
      return;
    }
    if (proofMethod === "url" && !proofUrl) {
      alert("Silakan masukkan URL bukti pembayaran.");
      return;
    }

    setSubmitting(true);
    setUploadProgress(0);

    try {
      let finalProofUrl = "";

      // Upload file to ImgBB if method is file
      if (proofMethod === "file" && proofFile) {
        setUploadProgress(30);

        const { url: uploadedUrl, error: uploadError } = await uploadToImgBB(
          proofFile
        );

        if (uploadError) {
          throw new Error("Gagal mengupload file: " + uploadError);
        }

        finalProofUrl = uploadedUrl;
        setUploadProgress(80);
      } else {
        // Use URL directly
        finalProofUrl = proofUrl;
      }

      // Update order status and proof URL
      const updateData: any = {
        status: "paid",
        proof_of_payment_url: finalProofUrl,
      };

      const { error: updateError } = await supabase
        .from("orders")
        .update(updateData)
        .eq("id", order!.id);

      if (updateError) throw updateError;

      // Create log "paid"
      await supabase.from("order_logs").insert({
        order_id: order!.id,
        status: "paid",
        notes: message || `Bukti pembayaran: ${finalProofUrl}`,
      });

      setUploadProgress(100);

      alert("Konfirmasi pembayaran berhasil! Kami akan segera memeriksanya.");
      router.push(`/order/${params.invoice_number}`);
    } catch (error: any) {
      console.error("Error confirming payment:", error);
      alert(error.message || "Gagal mengirim konfirmasi. Silakan coba lagi.");
    } finally {
      setSubmitting(false);
      setUploadProgress(0);
    }
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-slate-100 dark:bg-slate-900 flex items-center justify-center z-50">
        <div className="flex flex-col items-center justify-center">
          <LogoLoading size="xl" />
          <p className="mt-8 text-xl text-slate-600 dark:text-slate-400">
            Konfirmasi Pembayaran anda.
          </p>
        </div>
      </div>
    );
  }

  return (
    <section className="py-16 bg-white">
      <div className="container mx-auto max-w-2xl px-4">
        <h1 className="text-3xl font-bold text-center mb-8">
          Konfirmasi Pembayaran
        </h1>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Method Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Metode Konfirmasi
            </label>
            <div className="grid grid-cols-2 gap-4">
              <button
                type="button"
                onClick={() => setProofMethod("file")}
                className={`p-4 border-2 rounded-lg flex items-center justify-center gap-2 transition-colors ${
                  proofMethod === "file"
                    ? "border-blue-600 bg-blue-50 text-blue-700"
                    : "border-gray-300 hover:border-gray-400"
                }`}
              >
                <Upload size={20} />
                Upload File
              </button>
              <button
                type="button"
                onClick={() => setProofMethod("url")}
                className={`p-4 border-2 rounded-lg flex items-center justify-center gap-2 transition-colors ${
                  proofMethod === "url"
                    ? "border-blue-600 bg-blue-50 text-blue-700"
                    : "border-gray-300 hover:border-gray-400"
                }`}
              >
                <LinkIcon size={20} />
                Input URL
              </button>
            </div>
          </div>

          {/* File Upload */}
          {proofMethod === "file" && (
            <div>
              <label
                htmlFor="proofFile"
                className="block text-sm font-medium text-gray-700"
              >
                Upload Bukti Pembayaran
              </label>
              <p className="text-sm text-gray-500 mb-2">
                Format: JPG, PNG, atau PDF. Maksimal 5MB. File akan diupload ke
                ImgBB.
              </p>

              {!proofFile ? (
                <div className="mt-1">
                  <label
                    htmlFor="proofFile"
                    className="flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md cursor-pointer hover:border-gray-400 transition-colors"
                  >
                    <div className="space-y-1 text-center">
                      <Upload className="mx-auto h-12 w-12 text-gray-400" />
                      <div className="flex text-sm text-gray-600">
                        <span className="relative font-medium text-blue-600 hover:text-blue-500">
                          Klik untuk upload file
                        </span>
                        <p className="pl-1">atau drag and drop</p>
                      </div>
                      <p className="text-xs text-gray-500">
                        JPG, PNG, PDF maksimal 5MB
                      </p>
                    </div>
                  </label>
                  <input
                    id="proofFile"
                    name="proofFile"
                    type="file"
                    className="sr-only"
                    accept="image/jpeg,image/png,image/jpg,application/pdf"
                    onChange={handleFileChange}
                  />
                </div>
              ) : (
                <div className="mt-2 border rounded-lg p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">
                        {proofFile.name}
                      </p>
                      <p className="text-xs text-gray-500">
                        {(proofFile.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={removeFile}
                      className="text-red-600 hover:text-red-800"
                    >
                      <X size={20} />
                    </button>
                  </div>

                  {/* Preview for images */}
                  {filePreview && (
                    <div className="mt-3">
                      <img
                        src={filePreview}
                        alt="Preview"
                        className="max-h-48 rounded border"
                      />
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* URL Input */}
          {proofMethod === "url" && (
            <div>
              <label
                htmlFor="proofUrl"
                className="block text-sm font-medium text-gray-700"
              >
                URL Bukti Pembayaran
              </label>
              <p className="text-sm text-gray-500 mb-2">
                Upload screenshot ke hosting gambar (Imgur, Google Drive, dll)
                lalu masukkan URL-nya.
              </p>
              <input
                type="url"
                id="proofUrl"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-3 border focus:border-blue-500 focus:ring-blue-500"
                value={proofUrl}
                onChange={(e) => setProofUrl(e.target.value)}
                placeholder="https://example.com/bukti-transfer.jpg"
              />
            </div>
          )}

          {/* Message (Optional) */}
          <div>
            <label
              htmlFor="message"
              className="block text-sm font-medium text-gray-700"
            >
              Catatan (Opsional)
            </label>
            <textarea
              id="message"
              rows={4}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-3 border focus:border-blue-500 focus:ring-blue-500"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Tambahkan catatan jika diperlukan..."
            />
          </div>

          {/* Progress Bar */}
          {uploadProgress > 0 && uploadProgress < 100 && (
            <div className="w-full bg-gray-200 rounded-full h-2.5">
              <div
                className="bg-blue-600 h-2.5 rounded-full transition-all duration-300"
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={submitting}
            className="w-full bg-blue-600 text-white py-3 px-4 rounded-md font-semibold hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
          >
            {submitting ? "Mengirim..." : "Kirim Konfirmasi"}
          </button>
        </form>
      </div>
    </section>
  );
}
