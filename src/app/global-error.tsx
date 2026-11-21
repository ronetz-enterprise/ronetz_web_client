"use client";

import "./globals.css";
import {
  StatusScreen,
  statusActionClass,
  statusSecondaryClass,
} from "@/features/organization-settings/components/status-screen";

/** Dernier recours : l'erreur a touché la mise en page racine, donc aucun fournisseur n'est disponible. */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="fr" data-theme="system">
      <body>
        <StatusScreen
          title="Un problème est survenu"
          description="Ronetz n’a pas pu démarrer correctement. Vos données n’ont pas été modifiées."
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
              {/* Lien natif : le routeur de l'application peut être en panne. */}
              {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
              <a href="/" className={statusActionClass}>
                Retourner à l’accueil
              </a>
            </div>
          }
        />
      </body>
    </html>
  );
}
