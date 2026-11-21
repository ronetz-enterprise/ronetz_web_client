import type { ReactNode } from "react";

import { AppShell } from "@/components/app-shell/app-shell";

// Gabarits de l'application : ossature commune (barre latérale ou barre du bas).
export default function GabaritsLayout({ children }: { children: ReactNode }) {
  return (
    <AppShell organization="Cyber Akwa" manager="Serge">
      {children}
    </AppShell>
  );
}
