import type { Metadata } from "next";
import ServicesClient from "./ServicesClient";

export const metadata: Metadata = {
  title: "Services Management",
};

export default function ServicesManagementPage() {
  return <ServicesClient />;
}
