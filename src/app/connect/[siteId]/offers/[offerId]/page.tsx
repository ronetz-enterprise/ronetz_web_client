import type { Metadata } from "next";
import { PurchaseReview } from "@/features/purchase/components/purchase-review";

export const metadata: Metadata = {
  title: "Votre offre · ronetz",
  robots: { index: false, follow: false },
  referrer: "no-referrer",
};

export default async function PurchaseReviewPage({
  params,
}: {
  params: Promise<{ siteId: string; offerId: string }>;
}) {
  const { siteId, offerId } = await params;
  return <PurchaseReview siteId={siteId} offerId={offerId} />;
}
