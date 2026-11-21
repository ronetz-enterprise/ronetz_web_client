import type { Metadata } from "next";
import { RouterSettingsScreen } from "@/features/router/components/router-settings";

export const metadata: Metadata = { title: "Réglages du routeur" };

export default async function RouterSettingsPage({
  params,
}: {
  params: Promise<{ routerId: string }>;
}) {
  const { routerId } = await params;
  return <RouterSettingsScreen routerId={routerId} />;
}
