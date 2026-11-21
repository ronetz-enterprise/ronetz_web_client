import type { ReactNode } from "react";
import { PageHeader } from "@/components/page-header";
import { SettingsTabs } from "@/features/organization-settings/components/settings-tabs";

export default function SettingsLayout({ children }: { children: ReactNode }) {
  return (
    <div className="max-w-3xl">
      <PageHeader title="Réglages" className="pb-4" />
      <SettingsTabs />
      <div className="pt-6">{children}</div>
    </div>
  );
}
