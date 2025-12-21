"use server";

import {
    createOrderStatusNotification,
    createDiscountExpiryNotification,
    createNewOrderNotification,
    createTaskDeadlineNotification,
    createStorePurchaseNotification,
    createPaymentDeadlineNotification,
    createDiscountUsageLimitNotification,
    createOrderDeletedNotification,
    createOrderDetailChangedNotification,
    createNewTestimonialNotification,
} from "@/lib/notifications";

export async function notifyOrderStatusChange(orderId: number, newStatus: string) {
    await createOrderStatusNotification(orderId, newStatus);
}

export async function notifyNewOrder(orderId: number) {
    await createNewOrderNotification(orderId);
}

export async function notifyOrderDeleted(invoiceNumber: string, customerName: string) {
    await createOrderDeletedNotification(invoiceNumber, customerName);
}

export async function notifyOrderDetailChanged(orderId: number, invoiceNumber: string, changedFields: string[]) {
    await createOrderDetailChangedNotification(orderId, invoiceNumber, changedFields);
}

export async function notifyNewTestimonial(testimonialId: number) {
    await createNewTestimonialNotification(testimonialId);
}
