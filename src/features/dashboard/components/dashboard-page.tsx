"use client";

import { ActivitySection } from "./activity-section";
import { TodaySection } from "./today-section";
import { useNow } from "../queries/dashboard";

/** Accueil du gérant, sur données réelles : le jour, ce qui demande une action, l'activité. */
export function DashboardPage() {
  const now = useNow();
  return (
    <div className="flex w-full flex-col gap-10">
      <TodaySection now={now} />
      <ActivitySection now={now} />
    </div>
  );
}
