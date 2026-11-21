import type { Metadata } from "next";
import { SiteScreen } from "@/features/site/components/site-detail";

export const metadata: Metadata = { title: "Réglages du site" };

export default async function SiteSettingsPage({
  params,
}: {
  params: Promise<{ siteId: string }>;
}) {
  const { siteId } = await params;
  return <SiteScreen siteId={siteId} tab="settings" />;
}
