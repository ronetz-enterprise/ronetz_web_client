import type { Metadata } from "next";
import { PublicOffers } from "@/features/purchase/components/public-offers";

export const metadata: Metadata = {
  title: "Offres Internet · ronetz",
  robots: { index: false, follow: false },
  referrer: "no-referrer",
};

export default async function PublicOffersPage({
  params,
}: {
  params: Promise<{ siteId: string }>;
}) {
  const { siteId } = await params;
  return <PublicOffers siteId={siteId} />;
}
