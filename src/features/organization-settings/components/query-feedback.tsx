"use client";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ApiError, toUserMessage } from "@/lib/api-error";

export function SettingsSkeleton({ rows = 4 }: { rows?: number }) {
  return (
    <div role="status" aria-label="Chargement" className="space-y-5">
      {Array.from({ length: rows }, (_, i) => (
        <div
          key={i}
          className="grid gap-2 border-b py-5 sm:grid-cols-[14rem_1fr] sm:gap-8"
        >
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-9 w-full max-w-sm" />
        </div>
      ))}
    </div>
  );
}

/** Erreur locale, à l'endroit du contenu : une phrase, une action, la référence en discret. */
export function LocalFailure({
  error,
  retry,
}: {
  error: unknown;
  retry?: () => void;
}) {
  const denied = error instanceof ApiError && error.status === 403;
  return (
    <Alert variant="destructive">
      <AlertTitle>
        {denied ? "Accès non autorisé" : "Chargement impossible"}
      </AlertTitle>
      <AlertDescription className="space-y-3">
        <p>{toUserMessage(error)}</p>
        {retry && !denied ? (
          <Button variant="outline" size="sm" onClick={retry}>
            Réessayer
          </Button>
        ) : null}
        {error instanceof ApiError && error.correlationId ? (
          <p className="text-xs text-muted-foreground">
            Référence :{" "}
            <span className="select-all">{error.correlationId}</span>
          </p>
        ) : null}
      </AlertDescription>
    </Alert>
  );
}
