"use client";

import { Button } from "@/components/ui/button";
import { toUserMessage } from "@/lib/api-error";

/** Erreur locale d'un bloc : une phrase à l'endroit du contenu, jamais une page cassée. */
export function BlockError({
  error,
  retry,
  className,
}: {
  error: unknown;
  retry?: () => void;
  className?: string;
}) {
  return (
    <div
      role="alert"
      className={
        className ??
        "flex flex-wrap items-center justify-between gap-3 rounded-xl bg-muted px-4 py-3 text-sm"
      }
    >
      <p>{toUserMessage(error)}</p>
      {retry ? (
        <Button variant="outline" size="sm" onClick={retry}>
          Réessayer
        </Button>
      ) : null}
    </div>
  );
}

/** Pas de droit d'accès aux chiffres : une phrase, pas une erreur. */
export function NoAccess({ what }: { what: string }) {
  return (
    <p role="status" className="rounded-xl bg-muted px-4 py-3 text-sm">
      {what} est réservé au propriétaire de l’organisation.
    </p>
  );
}
