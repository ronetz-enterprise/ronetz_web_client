import type { Metadata } from "next";
import { OffersListView } from "@/features/offer/components/offers-list-view";

export const metadata: Metadata = { title: "Offres du site" };

export default async function SiteOffersPage({
  params,
}: {
  params: Promise<{ siteId: string }>;
}) {
  const { siteId } = await params;
  return <OffersListView siteId={siteId} />;
}
