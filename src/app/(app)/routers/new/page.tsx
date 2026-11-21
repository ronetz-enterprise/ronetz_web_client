import type { Metadata } from "next";
import { Suspense } from "react";
import { PageHeader } from "@/components/page-header";
import { RouterCreateScreen } from "@/features/router/components/router-create";

export const metadata: Metadata = { title: "Ajouter un routeur" };

export default function NewRouterPage() {
  return (
    <>
      <PageHeader
        title="Ajouter un routeur"
        description="Indiquez où il se trouve et de quel modèle il s'agit. L'installation se fait ensuite pas à pas, sans technicien."
      />
      <Suspense>
        <RouterCreateScreen />
      </Suspense>
    </>
  );
}
