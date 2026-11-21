import type { Metadata } from "next";
import Link from "next/link";

import { PageHeader } from "@/components/page-header";
import { ManualAccessForm } from "@/features/access";
import { routes } from "@/lib/routes";

export const metadata: Metadata = { title: "Créer un accès" };

export default function Page() {
  return (
    <main className="w-full">
      <PageHeader
        title="Créer un accès"
        description="Un identifiant et un mot de passe à remettre à un client."
        back={
          <Link
            href={routes.access()}
            className="text-muted-foreground hover:underline"
          >
            ← Accès
          </Link>
        }
      />
      <ManualAccessForm />
    </main>
  );
}
