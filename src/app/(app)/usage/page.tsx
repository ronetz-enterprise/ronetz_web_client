import type { Metadata } from "next";
import { UsagePage } from "@/features/network-usage/components/usage-page";

export const metadata: Metadata = { title: "Consommation" };

export default function Page() {
  return <UsagePage />;
}
