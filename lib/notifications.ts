import { supabase } from "./supabase";

// Fungsi untuk membuat notifikasi komentar baru
export async function createCommentNotification(commentId: number) {
  try {
    const { data: comment, error } = await supabase
      .from("comments")
      .select("*, articles(title)")
      .eq("id", commentId)
      .single();

    if (error || !comment) {
      console.error("Error fetching comment for notification:", error);
      return;
    }

    const { error: notificationError } = await supabase
      .from("notifications")
      .insert({
        type: "comment",
        title: "Komentar Baru",
        message: `${comment.name} mengomentari artikel "${
          comment.articles?.title || "tanpa judul"
        }"`,
        link: `/admin/blog#comment-${commentId}`,
        related_id: commentId,
      });

    if (notificationError) {
      console.error("Error creating comment notification:", notificationError);
    }
  } catch (error) {
    console.error("Error in createCommentNotification:", error);
  }
}

// Fungsi untuk membuat notifikasi diskon akan kadaluarsa
export async function createDiscountExpiryNotification(discountId: number) {
  try {
    const { data: discount, error } = await supabase
      .from("discounts")
      .select("*")
      .eq("id", discountId)
      .single();

    if (error || !discount) {
      console.error("Error fetching discount for notification:", error);
      return;
    }

    const { error: notificationError } = await supabase
      .from("notifications")
      .insert({
        type: "discount",
        title: "Diskon Akan Kadaluarsa",
        message: `Diskon "${
          discount.code || "Otomatis"
        }" akan kadaluarsa dalam 3 hari`,
        link: `/admin/discounts#discount-${discountId}`,
        related_id: discountId,
      });

    if (notificationError) {
      console.error("Error creating discount notification:", notificationError);
    }
  } catch (error) {
    console.error("Error in createDiscountExpiryNotification:", error);
  }
}

// Fungsi untuk membuat notifikasi pesanan baru
export async function createNewOrderNotification(orderId: number) {
  try {
    const { data: order, error } = await supabase
      .from("orders")
      .select("invoice_number, customer_name")
      .eq("id", orderId)
      .single();

    if (error || !order) {
      console.error("Error fetching order for notification:", error);
      return;
    }

    const { error: notificationError } = await supabase
      .from("notifications")
      .insert({
        type: "order",
        title: "Pesanan Baru",
        message: `Pesanan baru dari ${order.customer_name} dengan invoice ${order.invoice_number}`,
        link: `/admin/orders#order-${orderId}`,
        related_id: orderId,
      });

    if (notificationError) {
      console.error("Error creating order notification:", notificationError);
    }
  } catch (error) {
    console.error("Error in createNewOrderNotification:", error);
  }
}

// Fungsi untuk membuat notifikasi perubahan status pesanan
export async function createOrderStatusNotification(
  orderId: number,
  newStatus: string
) {
  try {
    const { data: order, error } = await supabase
      .from("orders")
      .select("invoice_number")
      .eq("id", orderId)
      .single();

    if (error || !order) {
      console.error("Error fetching order for status notification:", error);
      return;
    }

    const statusLabels: { [key: string]: string } = {
      pending_payment: "Menunggu Pembayaran",
      paid: "Dibayar",
      accepted: "Diterima",
      in_progress: "Dikerjakan",
      completed: "Selesai",
      cancelled: "Dibatalkan",
    };

    const { error: notificationError } = await supabase
      .from("notifications")
      .insert({
        type: "order_status",
        title: "Status Pesanan Diubah",
        message: `Status pesanan ${order.invoice_number} berubah menjadi "${
          statusLabels[newStatus] || newStatus
        }"`,
        link: `/admin/orders#order-${orderId}`,
        related_id: orderId,
      });

    if (notificationError) {
      console.error(
        "Error creating order status notification:",
        notificationError
      );
    }
  } catch (error) {
    console.error("Error in createOrderStatusNotification:", error);
  }
}

// Fungsi untuk membuat notifikasi task yang akan deadline
export async function createTaskDeadlineNotification(taskId: number) {
  try {
    const { data: task, error } = await supabase
      .from("orders")
      .select("package_details")
      .eq("id", taskId)
      .single();

    if (error || !task) {
      console.error("Error fetching task for notification:", error);
      return;
    }

    const { error: notificationError } = await supabase
      .from("notifications")
      .insert({
        type: "task",
        title: "Deadline Task Mendekat",
        message: `Task "${
          (task.package_details as any)?.name || "Tanpa Nama"
        }" akan deadline dalam 3 hari`,
        link: `/admin/tasks#task-${taskId}`,
        related_id: taskId,
      });

    if (notificationError) {
      console.error(
        "Error creating task deadline notification:",
        notificationError
      );
    }
  } catch (error) {
    console.error("Error in createTaskDeadlineNotification:", error);
  }
}
