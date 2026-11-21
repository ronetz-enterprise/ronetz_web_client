import type { ReactNode } from "react";
import { AdminGate } from "@/features/platform-admin/components/admin-gate";

// L'administration dépend de la session : jamais de pré-rendu statique.
export const dynamic = "force-dynamic";

export default function AdminLayout({ children }: { children: ReactNode }) {
  return <AdminGate>{children}</AdminGate>;
}
