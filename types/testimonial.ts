// types/testimonial.ts
export interface Testimonial {
  id: number;

  // Legacy support (untuk testimoni lama berbasis gambar)
  image_url: string | null;
  alt_text: string | null;

  // Integrasi dengan orders
  order_id: number | null;
  store_order_id: number | null;

  // Data customer
  customer_name: string | null;
  customer_email: string | null;

  // Rating per kategori (1-5)
  rating_service: number;
  rating_design: number;
  rating_communication: number;

  // Review dan info
  review_text: string | null;
  service_name: string | null;
  product_name: string | null;
  package_name: string | null;
  package_details?: {
    name: string;
  } | null;

  // Management
  token: string | null;
  is_featured: boolean;

  // Review link expiration tracking
  review_link_generated_at: string | null;
  review_link_expires_at: string | null;

  // Timestamps
  submitted_at: string | null;
  created_at: string;
  updated_at: string;
}

// Helper untuk hitung rata-rata rating
export function getAverageRating(t: Testimonial): number {
  return (
    Math.round(
      ((t.rating_service + t.rating_design + t.rating_communication) / 3) * 10
    ) / 10
  );
}
