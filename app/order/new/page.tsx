// app/order/new/page.tsx
"use client";

import { Suspense } from "react";
import NewOrderPageContent from "./NewOrderPageContent";

export default function NewOrderPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-gray-600">Loading order form...</div>
        </div>
      }
    >
      <NewOrderPageContent />
    </Suspense>
  );
}
