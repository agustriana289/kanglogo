import type { Metadata } from "next";
import PagesClient from "./PagesClient";

export const metadata: Metadata = {
  title: "Pages",
};

export default function PagesManagementPage() {
  return <PagesClient />;
}
