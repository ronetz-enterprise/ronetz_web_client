"use client";

import Link from "next/link";
import {
  StatusScreen,
  statusActionClass,
  statusSecondaryClass,
} from "@/features/organization-settings/components/status-screen";
import { routes } from "@/lib/routes";

/** Erreur inattendue dans une page : message court, deux actions, référence à donner au support. */
export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <StatusScreen
      title="Un problème est survenu"
      description="Nous n’avons pas pu afficher cette page. Vos données n’ont pas été modifiées."
      reference={error.digest}
      action={
        <div className="flex flex-wrap justify-center gap-3">
          <button
            type="button"
            onClick={reset}
            className={statusSecondaryClass}
          >
            Réessayer
          </button>
          <Link href={routes.home()} className={statusActionClass}>
            Retourner à l’accueil
          </Link>
        </div>
      }
    />
  );
}
