"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button, buttonVariants } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ApiError, toUserMessage } from "@/lib/api-error";
import { cn } from "@/lib/utils";

/** Erreur locale : une phrase à l'endroit du contenu, avec « Réessayer ». */
export function InlineError({
  error,
  retry,
  title = "Impossible d'afficher ces informations",
}: {
  error: unknown;
  retry?: () => void;
  title?: string;
}) {
  const denied = error instanceof ApiError && error.status === 403;
  const missing = error instanceof ApiError && error.status === 404;
  return (
    <Alert variant="destructive" role="alert">
      <AlertTitle>
        {denied ? "Accès refusé" : missing ? "Introuvable" : title}
      </AlertTitle>
      <AlertDescription>
        <p>
          {denied
            ? "Seul le propriétaire de l'organisation peut faire cela."
            : missing
              ? "Cet élément n'existe plus ou ne vous appartient pas."
              : toUserMessage(error)}
        </p>
        {retry && !denied && !missing ? (
          <Button
            variant="outline"
            className="mt-3 h-11 md:h-9"
            onClick={retry}
          >
            Réessayer
          </Button>
        ) : null}
      </AlertDescription>
    </Alert>
  );
}

export function PageSkeleton() {
  return (
    <div
      role="status"
      aria-label="Chargement en cours"
      className="flex flex-col gap-4"
    >
      <Skeleton className="h-8 w-56" />
      <Skeleton className="h-4 w-80 max-w-full" />
      <Skeleton className="h-32 w-full rounded-xl" />
      <Skeleton className="h-32 w-full rounded-xl" />
    </div>
  );
}

/** Lien qui a l'apparence d'un bouton. */
export function LinkButton({
  href,
  children,
  variant = "default",
  className,
}: {
  href: string;
  children: ReactNode;
  variant?: "default" | "outline" | "secondary" | "ghost";
  className?: string;
}) {
  return (
    <Link
      href={href}
      className={cn(
        buttonVariants({ variant }),
        "h-11 px-4 md:h-9 md:px-3",
        className,
      )}
    >
      {children}
    </Link>
  );
}

/** Définition « libellé / valeur » en liste simple. */
export function Facts({
  items,
}: {
  items: { label: string; value: ReactNode }[];
}) {
  return (
    <dl className="divide-y divide-border rounded-xl border border-border">
      {items.map((it) => (
        <div
          key={it.label}
          className="flex flex-col gap-0.5 px-4 py-3 sm:flex-row sm:items-baseline sm:justify-between sm:gap-6"
        >
          <dt className="text-sm text-muted-foreground">{it.label}</dt>
          <dd className="min-w-0 text-sm font-medium break-words sm:text-right">
            {it.value}
          </dd>
        </div>
      ))}
    </dl>
  );
}
