import type { ReactNode } from "react";
import { AppShell } from "@/components/app-shell/app-shell";
import { ConsoleGate } from "@/features/organizations/components/console-gate";

// La console dépend de la session de l'utilisateur : jamais de pré-rendu statique.
export const dynamic = "force-dynamic";

export default function ConsoleLayout({ children }: { children: ReactNode }) {
  return (
    <ConsoleGate>
      <AppShell>{children}</AppShell>
    </ConsoleGate>
  );
}
