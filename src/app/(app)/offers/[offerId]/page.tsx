import type { Metadata } from "next";
import { OfferDetail } from "@/features/offer/components/offer-detail";

export const metadata: Metadata = { title: "Offre" };

export default async function OfferPage({
  params,
}: {
  params: Promise<{ offerId: string }>;
}) {
  const { offerId } = await params;
  return <OfferDetail offerId={offerId} tab="overview" />;
}
