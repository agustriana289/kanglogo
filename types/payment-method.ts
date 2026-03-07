// types/payment-method.ts
export type PaymentMethodType = 'Bank' | 'E-Wallet' | 'Outlet';

export interface PaymentMethod {
    id: number;
    type: PaymentMethodType;
    name: string;
    account_number: string;
    holder_name: string;
    logo_url: string | null;
    is_active: boolean;
    created_at: string;
}