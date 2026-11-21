"use client";

import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { offerErrorMessage } from "../model/errors";

export function OfferFailure({
  error,
  retry,
}: {
  error: unknown;
  retry?: () => void;
}) {
  return (
    <div
      role="alert"
      className="flex flex-col items-start gap-3 rounded-xl border border-border p-4 text-sm"
    >
      <p>{offerErrorMessage(error)}</p>
      {retry ? (
        <Button variant="outline" className="h-11 sm:h-9" onClick={retry}>
          Réessayer
        </Button>
      ) : null}
    </div>
  );
}

export function OfferDenied() {
  return (
    <div role="alert" className="rounded-xl border border-border p-4 text-sm">
      Seul le propriétaire de l’organisation peut gérer les offres.
    </div>
  );
}

export function DetailSkeleton() {
  return (
    <div
      role="status"
      aria-label="Chargement en cours"
      className="flex flex-col gap-4"
    >
      <Skeleton className="h-9 w-64" />
      <Skeleton className="h-6 w-48" />
      <Skeleton className="h-40 w-full max-w-xl" />
    </div>
  );
}
