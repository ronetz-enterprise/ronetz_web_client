import type { Metadata } from "next";
import { RouterDetailScreen } from "@/features/router/components/router-detail";

export const metadata: Metadata = { title: "Routeur" };

export default async function RouterPage({
  params,
}: {
  params: Promise<{ routerId: string }>;
}) {
  const { routerId } = await params;
  return <RouterDetailScreen routerId={routerId} />;
}
