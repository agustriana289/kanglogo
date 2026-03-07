// types/discount.ts
export type DiscountType = "percentage" | "fixed_amount";

export interface Discount {
  id: number;
  code: string | null;
  description: string | null;
  type: DiscountType;
  value: number;
  is_automatic: boolean;
  service_id: number | null;
  usage_limit: number | null;
  used_count: number;
  starts_at: string | null;
  expires_at: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}
