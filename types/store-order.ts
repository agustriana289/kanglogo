// types/store-order.ts
export interface StoreOrder {
    id: number;
    order_number: string;
    asset_id: number;
    asset_name: string;
    asset_image: string;
    customer_name: string;
    customer_email: string;
    customer_whatsapp: string;
    price: number;
    payment_method: string;
    payment_proof_url: string | null;
    status: "pending_payment" | "paid" | "completed" | "cancelled";
    download_link: string | null;
    created_at: string;
    updated_at: string;
}

export interface StoreOrderWithAsset extends StoreOrder {
    marketplace_assets?: {
        nama_aset: string;
        image_url: string;
        jenis: string;
    };
}
