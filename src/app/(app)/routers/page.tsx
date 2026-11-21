import type { Metadata } from "next";
import { PageHeader } from "@/components/page-header";
import { RoutersView } from "@/features/router/components/router-list";
import { RoutersHeaderAction } from "@/features/router/components/router-actions";

export const metadata: Metadata = { title: "Routeurs" };

export default function RoutersPage() {
  return (
    <>
      <PageHeader
        title="Routeurs"
        description="Les routeurs qui diffusent votre Wi-Fi, avec leur état."
        actions={<RoutersHeaderAction />}
      />
      <RoutersView />
    </>
  );
}
