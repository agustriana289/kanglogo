import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import {
  createDiscountExpiryNotification,
  createTaskDeadlineNotification,
} from "@/lib/notifications";

// Fungsi ini akan dipanggil oleh cron job Anda
export async function GET(request: Request) {
  // VERIFIKASI KEAMANAN (Sangat penting!)
  // Gunakan secret key yang Anda simpan di environment variables
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET_KEY}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const now = new Date();
    const threeDaysFromNow = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);

    // 1. Periksa diskon yang akan kadaluarsa
    const { data: expiringDiscounts, error: discountError } = await supabase
      .from("discounts")
      .select("id")
      .eq("is_active", true)
      .lte("expires_at", threeDaysFromNow.toISOString())
      .gt("expires_at", now.toISOString());

    if (discountError) {
      console.error("Error checking expiring discounts:", discountError);
    } else if (expiringDiscounts) {
      for (const discount of expiringDiscounts) {
        // Cek agar tidak spam notifikasi
        const { data: existingNotif } = await supabase
          .from("notifications")
          .select("id")
          .eq("type", "discount")
          .eq("related_id", discount.id)
          .gte(
            "created_at",
            new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString()
          )
          .single();

        if (!existingNotif) {
          await createDiscountExpiryNotification(discount.id);
        }
      }
    }

    // 2. Periksa task yang akan deadline
    const { data: deadlineTasks, error: taskError } = await supabase
      .from("orders")
      .select("id")
      .eq("status", "in_progress")
      .lte("work_deadline", threeDaysFromNow.toISOString())
      .gt("work_deadline", now.toISOString());

    if (taskError) {
      console.error("Error checking task deadlines:", taskError);
    } else if (deadlineTasks) {
      for (const task of deadlineTasks) {
        // Cek agar tidak spam notifikasi
        const { data: existingNotif } = await supabase
          .from("notifications")
          .select("id")
          .eq("type", "task")
          .eq("related_id", task.id)
          .gte(
            "created_at",
            new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString()
          )
          .single();

        if (!existingNotif) {
          await createTaskDeadlineNotification(task.id);
        }
      }
    }

    return NextResponse.json({
      message: "Notifications checked successfully.",
    });
  } catch (error) {
    console.error("Cron job error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
