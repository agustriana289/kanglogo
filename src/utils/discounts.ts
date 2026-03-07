export interface Discount {
    id: string;
    code: string | null;
    name: string;
    type: 'percentage' | 'fixed_amount';
    value: number;
    min_purchase: number;
    max_discount: number | null;
    product_id: string | null;
    service_id: string | null;
}

export function calculateDiscountedPrice(price: number, discounts: Discount[], targetId?: string, type?: 'product' | 'service') {
    // Find matching automated discounts
    const activeDiscounts = discounts.filter(d => {
        // Global automatic discount (no code, no specific product/service)
        if (!d.code && !d.product_id && !d.service_id) return true;
        
        // Product specific automatic discount
        if (type === 'product' && d.product_id === targetId && !d.code) return true;
        
        // Service specific automatic discount
        if (type === 'service' && d.service_id === targetId && !d.code) return true;
        
        return false;
    });

    if (activeDiscounts.length === 0) return { originalPrice: price, discountedPrice: price, appliedDiscount: null };

    // Use the most beneficial discount
    let bestDiscount = activeDiscounts[0];
    let bestPrice = price;

    activeDiscounts.forEach(d => {
        if (price < d.min_purchase) return;

        let currentPrice = price;
        if (d.type === 'percentage') {
            let savings = (price * d.value) / 100;
            if (d.max_discount) savings = Math.min(savings, d.max_discount);
            currentPrice = price - savings;
        } else {
            currentPrice = price - d.value;
        }

        if (currentPrice < bestPrice) {
            bestPrice = Math.max(0, currentPrice);
            bestDiscount = d;
        }
    });

    return {
        originalPrice: price,
        discountedPrice: bestPrice,
        appliedDiscount: bestPrice < price ? bestDiscount : null
    };
}
