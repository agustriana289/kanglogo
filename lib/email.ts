// lib/email.ts
import { Resend } from "resend";

// Lazy initialization to avoid build-time errors
let resendInstance: Resend | null = null;

function getResend(): Resend {
  if (!resendInstance) {
    if (!process.env.RESEND_API_KEY) {
      throw new Error("RESEND_API_KEY environment variable is not set");
    }
    resendInstance = new Resend(process.env.RESEND_API_KEY);
  }
  return resendInstance;
}

const ADMIN_EMAIL = "halo@kanglogo.com";
const FROM_EMAIL = "halo@kanglogo.com";
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://kanglogo.com";

interface OrderEmailData {
  type: "service" | "store";
  invoiceNumber: string;
  customerName: string;
  customerEmail: string;
  customerWhatsapp: string;
  productName: string;
  price: number;
  discountAmount: number;
}

// Kirim email notifikasi ke pelanggan
export async function sendCustomerOrderEmail(data: OrderEmailData) {
  const { type, invoiceNumber, customerEmail, productName, customerName } = data;

  const isStore = type === "store";
  const orderType = isStore ? "Pembelian" : "Pemesanan";
  const productType = isStore ? "Aset Digital" : "Jasa Layanan";
  const invoicePath = isStore ? `/store/invoice/${invoiceNumber}` : `/order/${invoiceNumber}`;
  const invoiceUrl = `${SITE_URL}${invoicePath}`;

  const subject = `${orderType} ${productType} (${productName}) di Kanglogo.com`;

  const htmlContent = `
    <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f8fafc;">
      <div style="background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%); color: white; padding: 30px; border-radius: 12px 12px 0 0; text-align: center;">
        <h1 style="margin: 0; font-size: 24px;">Kanglogo.com</h1>
        <p style="margin: 10px 0 0; opacity: 0.9;">Notifikasi ${orderType}</p>
      </div>
      
      <div style="background: white; padding: 30px; border-radius: 0 0 12px 12px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
        <p style="font-size: 16px; color: #334155; line-height: 1.6;">
          Halo <strong>${customerName}</strong>,
        </p>
        
        <p style="font-size: 16px; color: #334155; line-height: 1.6;">
          Terima kasih telah melakukan ${orderType.toLowerCase()} <strong>${productName}</strong> di kanglogo.com
        </p>
        
        <div style="background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0; border-radius: 0 8px 8px 0;">
          <p style="margin: 0; color: #92400e; font-weight: 500;">
            Silahkan lanjutkan pembayaran untuk melanjutkan ${orderType.toLowerCase()}.
          </p>
        </div>
        
        <p style="font-size: 16px; color: #334155; line-height: 1.6;">
          Dan berikut adalah link pesanan anda:
        </p>
        
        <div style="text-align: center; margin: 25px 0;">
          <a href="${invoiceUrl}" style="display: inline-block; background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%); color: white; padding: 14px 30px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px;">
            Lihat Invoice
          </a>
        </div>
        
        <p style="font-size: 14px; color: #64748b; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e2e8f0;">
          Jika Anda memiliki pertanyaan, silakan hubungi kami melalui email ini atau WhatsApp.
        </p>
      </div>
      
      <div style="text-align: center; padding: 20px; color: #94a3b8; font-size: 12px;">
        <p>&copy; ${new Date().getFullYear()} Kanglogo.com. All rights reserved.</p>
      </div>
    </div>
  `;

  try {
    const { data: result, error } = await getResend().emails.send({
      from: `Kanglogo <${FROM_EMAIL}>`,
      to: customerEmail,
      subject,
      html: htmlContent,
    });

    if (error) {
      console.error("Error sending customer email:", error);
      return { success: false, error };
    }

    return { success: true, data: result };
  } catch (error) {
    console.error("Error sending customer email:", error);
    return { success: false, error };
  }
}

// Kirim email notifikasi ke admin
export async function sendAdminOrderEmail(data: OrderEmailData) {
  const { type, invoiceNumber, customerName, customerEmail, customerWhatsapp, productName, price, discountAmount } = data;

  const isStore = type === "store";
  const orderType = isStore ? "Pembelian" : "Pesanan";

  const subject = `${orderType} Baru [${invoiceNumber}] telah dibuat`;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const htmlContent = `
    <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f8fafc;">
      <div style="background: linear-gradient(135deg, #059669 0%, #047857 100%); color: white; padding: 30px; border-radius: 12px 12px 0 0; text-align: center;">
        <h1 style="margin: 0; font-size: 24px;">📦 ${orderType} Baru!</h1>
        <p style="margin: 10px 0 0; opacity: 0.9;">${invoiceNumber}</p>
      </div>
      
      <div style="background: white; padding: 30px; border-radius: 0 0 12px 12px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
        <p style="font-size: 16px; color: #334155; line-height: 1.6;">
          Halo kanglogo.com,
        </p>
        
        <p style="font-size: 16px; color: #334155; line-height: 1.6;">
          ${orderType} Baru untuk <strong>${invoiceNumber}</strong> telah dibuat dengan detail:
        </p>
        
        <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
          <tr>
            <td style="padding: 12px; border-bottom: 1px solid #e2e8f0; color: #64748b; width: 40%;">Nama Pemesan/Pembeli</td>
            <td style="padding: 12px; border-bottom: 1px solid #e2e8f0; color: #334155; font-weight: 500;">${customerName}</td>
          </tr>
          <tr>
            <td style="padding: 12px; border-bottom: 1px solid #e2e8f0; color: #64748b;">No WhatsApp</td>
            <td style="padding: 12px; border-bottom: 1px solid #e2e8f0; color: #334155; font-weight: 500;">${customerWhatsapp || "-"}</td>
          </tr>
          <tr>
            <td style="padding: 12px; border-bottom: 1px solid #e2e8f0; color: #64748b;">Alamat Email</td>
            <td style="padding: 12px; border-bottom: 1px solid #e2e8f0; color: #334155; font-weight: 500;">${customerEmail}</td>
          </tr>
          <tr>
            <td style="padding: 12px; border-bottom: 1px solid #e2e8f0; color: #64748b;">Nama ${isStore ? "Produk" : "Layanan"}</td>
            <td style="padding: 12px; border-bottom: 1px solid #e2e8f0; color: #334155; font-weight: 500;">${productName}</td>
          </tr>
          <tr>
            <td style="padding: 12px; border-bottom: 1px solid #e2e8f0; color: #64748b;">Harga ${isStore ? "Produk" : "Layanan"}</td>
            <td style="padding: 12px; border-bottom: 1px solid #e2e8f0; color: #334155; font-weight: 500;">${formatCurrency(price + discountAmount)}</td>
          </tr>
          <tr>
            <td style="padding: 12px; border-bottom: 1px solid #e2e8f0; color: #64748b;">Diskon</td>
            <td style="padding: 12px; border-bottom: 1px solid #e2e8f0; color: ${discountAmount > 0 ? '#16a34a' : '#64748b'}; font-weight: 500;">
              ${discountAmount > 0 ? `- ${formatCurrency(discountAmount)}` : "-"}
            </td>
          </tr>
          <tr style="background-color: #f8fafc;">
            <td style="padding: 12px; color: #334155; font-weight: 600;">Total Pembayaran</td>
            <td style="padding: 12px; color: #1d4ed8; font-weight: 700; font-size: 18px;">${formatCurrency(price)}</td>
          </tr>
        </table>
        
        <div style="background: linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%); padding: 20px; border-radius: 8px; text-align: center; margin-top: 20px;">
          <p style="margin: 0; color: #047857; font-size: 18px; font-weight: 500;">
            Alhamdulillah, semoga terus lancar pesanannya. 🤲
          </p>
        </div>
      </div>
      
      <div style="text-align: center; padding: 20px; color: #94a3b8; font-size: 12px;">
        <p>&copy; ${new Date().getFullYear()} Kanglogo.com Admin Notification</p>
      </div>
    </div>
  `;

  try {
    const { data: result, error } = await getResend().emails.send({
      from: `Kanglogo Admin <${FROM_EMAIL}>`,
      to: ADMIN_EMAIL,
      subject,
      html: htmlContent,
    });

    if (error) {
      console.error("Error sending admin email:", error);
      return { success: false, error };
    }

    return { success: true, data: result };
  } catch (error) {
    console.error("Error sending admin email:", error);
    return { success: false, error };
  }
}

// Fungsi utama untuk mengirim kedua email sekaligus
export async function sendOrderNotificationEmails(data: OrderEmailData) {
  const [customerResult, adminResult] = await Promise.all([
    sendCustomerOrderEmail(data),
    sendAdminOrderEmail(data),
  ]);

  return {
    customer: customerResult,
    admin: adminResult,
  };
}
