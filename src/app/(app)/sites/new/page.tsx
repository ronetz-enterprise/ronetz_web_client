import type { Metadata } from "next";
import { PageHeader } from "@/components/page-header";
import { CreateSiteScreen } from "@/features/site/components/site-form";

export const metadata: Metadata = { title: "Créer un site" };

export default function NewSitePage() {
  return (
    <>
      <PageHeader
        title="Créez votre site"
        description="Un site est l'endroit où se trouve votre Wi-Fi : un cybercafé, une boutique, un hôtel."
      />
      <CreateSiteScreen />
    </>
  );
}
