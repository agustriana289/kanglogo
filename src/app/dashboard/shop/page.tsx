import type { Metadata } from "next";
import ShopClient from "./ShopClient";

export const metadata: Metadata = {
  title: "Shop Management",
};

export default function ShopManagementPage() {
  return <ShopClient />;
}
