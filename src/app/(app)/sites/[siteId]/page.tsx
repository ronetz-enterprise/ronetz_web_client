import type { Metadata } from "next";
import { SiteScreen } from "@/features/site/components/site-detail";

export const metadata: Metadata = { title: "Site" };

export default async function SitePage({
  params,
}: {
  params: Promise<{ siteId: string }>;
}) {
  const { siteId } = await params;
  return <SiteScreen siteId={siteId} tab="overview" />;
}
