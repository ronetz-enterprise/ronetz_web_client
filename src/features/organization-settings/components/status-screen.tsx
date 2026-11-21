import type { ReactNode } from "react";
import { LogoMark } from "@/components/logo";

/**
 * Écran plein cadre pour les pages d'état (404, erreur, accès refusé, portail) : marque, message court,
 * une action claire, référence discrète. Aucune dépendance à la session ni aux fournisseurs de l'application,
 * pour fonctionner même quand le reste est cassé. Suit le thème clair ou sombre du système.
 */
export function StatusScreen({
  title,
  description,
  action,
  reference,
  code,
}: {
  title: string;
  description: string;
  action?: ReactNode;
  reference?: string;
  code?: string;
}) {
  return (
    <main className="flex min-h-svh flex-col items-center justify-center gap-6 bg-background px-6 py-12 text-center text-foreground">
      <LogoMark className="size-8 text-signal" />
      <div className="max-w-md space-y-2">
        {code ? (
          <p className="tnum text-sm font-medium text-muted-foreground">
            {code}
          </p>
        ) : null}
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
          {title}
        </h1>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
      {action}
      {reference ? (
        <p className="text-xs text-muted-foreground">
          Référence : <span className="select-all">{reference}</span>
        </p>
      ) : null}
    </main>
  );
}

/** Lien d'action au style d'un bouton plein, utilisable sans composant client. */
export const statusActionClass =
  "inline-flex h-11 items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground outline-none transition-colors hover:bg-primary/80 focus-visible:ring-3 focus-visible:ring-ring/50";
export const statusSecondaryClass =
  "inline-flex h-11 items-center justify-center rounded-md border border-border bg-background px-4 text-sm font-medium outline-none transition-colors hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring/50";
