import type { Metadata } from "next";
import { PageHeader } from "@/components/page-header";
import { OrganizationOverview } from "@/features/organization-settings/components/organization-overview";

export const metadata: Metadata = { title: "Organisation" };

export default function OrganizationPage() {
  return (
    <div className="max-w-3xl">
      <PageHeader
        title="Organisation"
        description="Les informations de votre organisation."
      />
      <OrganizationOverview />
    </div>
  );
}
