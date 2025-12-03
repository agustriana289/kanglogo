// types/order.ts
export interface Order {
  id: number;
  invoice_number: string;
  service_id: number | null;
  package_details: {
    name: string;
    finalPrice: string;
    duration: string;
    features: string[];
  };
  customer_name: string;
  customer_email: string;
  customer_whatsapp: string;
  discount_code: string | null;
  discount_amount: number;
  final_price: number;
  payment_method: string;
  status:
    | "pending_payment"
    | "paid"
    | "accepted"
    | "in_progress"
    | "cancelled"
    | "completed";
  payment_deadline: string | null;
  work_duration_days: number | null;
  work_deadline: string | null;
  final_file_link: string | null;
  proof_of_payment_url?: string;
  created_at: string;
  updated_at: string;
}
