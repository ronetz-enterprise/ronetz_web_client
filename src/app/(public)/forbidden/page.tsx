import type { Metadata } from "next";
import Link from "next/link";
import {
  StatusScreen,
  statusActionClass,
  statusSecondaryClass,
} from "@/features/organization-settings/components/status-screen";
import { routes } from "@/lib/routes";

export const metadata: Metadata = { title: "Accès refusé" };

export default function ForbiddenPage() {
  return (
    <StatusScreen
      code="403"
      title="Accès refusé"
      description="Votre compte n’a pas accès à cet espace."
      action={
        <div className="flex flex-wrap justify-center gap-3">
          <Link href={routes.home()} className={statusActionClass}>
            Retourner à l’accueil
          </Link>
          <Link href={routes.login()} className={statusSecondaryClass}>
            Changer de compte
          </Link>
        </div>
      }
    />
  );
}
