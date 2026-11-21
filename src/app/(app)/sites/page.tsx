import type { Metadata } from "next";
import { PageHeader } from "@/components/page-header";
import { SitesView } from "@/features/site/components/site-list";
import { SitesHeaderAction } from "@/features/site/components/site-actions";

export const metadata: Metadata = { title: "Sites" };

export default function SitesPage() {
  return (
    <>
      <PageHeader
        title="Sites"
        description="Les endroits où se trouve votre Wi-Fi."
        actions={<SitesHeaderAction />}
      />
      <SitesView />
    </>
  );
}
