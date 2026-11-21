import type { Metadata } from "next";
import { OffersListView } from "@/features/offer/components/offers-list-view";

export const metadata: Metadata = { title: "Offres" };

export default function OffersPage() {
  return <OffersListView />;
}
