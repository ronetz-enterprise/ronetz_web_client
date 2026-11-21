import type { Metadata } from "next";
import { OffersListView } from "@/features/offer/components/offers-list-view";

export const metadata: Metadata = { title: "Créer une offre" };

export default async function NewSiteOfferPage({
  params,
}: {
  params: Promise<{ siteId: string }>;
}) {
  const { siteId } = await params;
  return <OffersListView siteId={siteId} createOpen />;
}
