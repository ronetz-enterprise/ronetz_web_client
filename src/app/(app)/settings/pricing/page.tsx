import type { Metadata } from "next";
import { PricingDetails } from "@/features/pricing";

export const metadata: Metadata = { title: "Tarifs" };

export default function PricingSettingsPage() {
  return <PricingDetails />;
}
