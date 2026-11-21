import type { Metadata } from "next";

import { AccessDetailPanel } from "@/features/access";

export const metadata: Metadata = { title: "Détail d’un accès" };

export default async function Page({
  params,
}: {
  params: Promise<{ accessGrantId: string }>;
}) {
  const { accessGrantId } = await params;
  return <AccessDetailPanel accessGrantId={accessGrantId} />;
}
