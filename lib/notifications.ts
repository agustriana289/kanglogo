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

// Fungsi untuk membuat notifikasi pembelian store baru
export async function createStorePurchaseNotification(
  orderId: number,
  orderNumber: string,
  customerName: string,
  assetName: string
) {
  try {
    const { error: notificationError } = await supabase
      .from("notifications")
      .insert({
        type: "purchase",
        title: "Pembelian Toko Baru",
        message: `${customerName} membeli "${assetName}" (${orderNumber})`,
        link: `/admin/orders?tab=store`,
        related_id: orderId,
      });

    if (notificationError) {
      console.error(
        "Error creating store purchase notification:",
        notificationError
      );
    }
  } catch (error) {
    console.error("Error in createStorePurchaseNotification:", error);
  }
}

// Fungsi untuk membuat notifikasi batas pembayaran
export async function createPaymentDeadlineNotification(orderId: number) {
  try {
    const { data: order, error } = await supabase
      .from("orders")
      .select("invoice_number, customer_name")
      .eq("id", orderId)
      .single();

    if (error || !order) {
      console.error(
        "Error fetching order for payment deadline notification:",
        error
      );
      return;
    }

    const { error: notificationError } = await supabase
      .from("notifications")
      .insert({
        type: "order",
        title: "Batas Pembayaran Besok",
        message: `Batas pembayaran pesanan ${order.invoice_number} dari ${order.customer_name} adalah besok`,
        link: `/admin/orders`,
        related_id: orderId,
      });

    if (notificationError) {
      console.error(
        "Error creating payment deadline notification:",
        notificationError
      );
    }
  } catch (error) {
    console.error("Error in createPaymentDeadlineNotification:", error);
  }
}

// Fungsi untuk membuat notifikasi diskon mencapai batas penggunaan
export async function createDiscountUsageLimitNotification(discountId: number) {
  try {
    const { data: discount, error } = await supabase
      .from("discounts")
      .select("*")
      .eq("id", discountId)
      .single();

    if (error || !discount) {
      console.error(
        "Error fetching discount for usage limit notification:",
        error
      );
      return;
    }

    const { error: notificationError } = await supabase
      .from("notifications")
      .insert({
        type: "discount",
        title: "Batas Penggunaan Diskon Tercapai",
        message: `Diskon "${
          discount.code || "Otomatis"
        }" telah mencapai batas penggunaan`,
        link: `/admin/discounts`,
        related_id: discountId,
      });

    if (notificationError) {
      console.error(
        "Error creating discount usage limit notification:",
        notificationError
      );
    }
  } catch (error) {
    console.error("Error in createDiscountUsageLimitNotification:", error);
  }
}

// Fungsi untuk membuat notifikasi pesanan dihapus
export async function createOrderDeletedNotification(
  invoiceNumber: string,
  customerName: string
) {
  try {
    const { error: notificationError } = await supabase
      .from("notifications")
      .insert({
        type: "order",
        title: "Pesanan Dihapus",
        message: `Pesanan ${invoiceNumber} dari ${customerName} telah dihapus`,
        link: `/admin/orders`,
      });

    if (notificationError) {
      console.error(
        "Error creating order deleted notification:",
        notificationError
      );
    }
  } catch (error) {
    console.error("Error in createOrderDeletedNotification:", error);
  }
}

// Fungsi untuk membuat notifikasi perubahan detail pesanan
export async function createOrderDetailChangedNotification(
  orderId: number,
  invoiceNumber: string,
  changedFields: string[]
) {
  try {
    const { error: notificationError } = await supabase
      .from("notifications")
      .insert({
        type: "order",
        title: "Detail Pesanan Diubah",
        message: `Pesanan ${invoiceNumber} telah diubah: ${changedFields.join(
          ", "
        )}`,
        link: `/admin/orders`,
        related_id: orderId,
      });

    if (notificationError) {
      console.error(
        "Error creating order detail changed notification:",
        notificationError
      );
    }
  } catch (error) {
    console.error("Error in createOrderDetailChangedNotification:", error);
  }
}

// Fungsi untuk membuat notifikasi testimoni baru diterima
export async function createNewTestimonialNotification(testimonialId: number) {
  try {
    const { data: testimonial, error } = await supabase
      .from("testimonials")
      .select(
        "id, customer_name, rating_service, rating_design, rating_communication, service_name, product_name"
      )
      .eq("id", testimonialId)
      .single();

    if (error || !testimonial) {
      console.error("Error fetching testimonial for notification:", error);
      return;
    }

    // Hitung rata-rata rating
    const avgRating =
      (testimonial.rating_service +
        testimonial.rating_design +
        testimonial.rating_communication) /
      3;

    const { error: notificationError } = await supabase
      .from("notifications")
      .insert({
        type: "testimonial",
        title: "Testimoni Baru Diterima",
        message: `${testimonial.customer_name} memberikan testimoni untuk "${
          testimonial.service_name || testimonial.product_name || "Layanan"
        }" dengan rating ${avgRating.toFixed(1)}/5`,
        link: `/admin/testimonials#testimonial-${testimonialId}`,
        related_id: testimonialId,
      });

    if (notificationError) {
      console.error(
        "Error creating testimonial notification:",
        notificationError
      );
    }
  } catch (error) {
    console.error("Error in createNewTestimonialNotification:", error);
  }
}
