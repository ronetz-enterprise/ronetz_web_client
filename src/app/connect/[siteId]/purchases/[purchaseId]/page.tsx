import type { Metadata } from "next";
import { PurchaseTracking } from "@/features/purchase/components/purchase-tracking";

export const metadata: Metadata = {
  title: "Votre achat · ronetz",
  robots: { index: false, follow: false },
  referrer: "no-referrer",
};

export default async function PurchaseTrackingPage({
  params,
}: {
  params: Promise<{ siteId: string; purchaseId: string }>;
}) {
  const { siteId, purchaseId } = await params;
  return <PurchaseTracking siteId={siteId} purchaseId={purchaseId} />;
}
