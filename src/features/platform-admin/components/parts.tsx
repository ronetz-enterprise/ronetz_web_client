"use client";

import { HugeiconsIcon } from "@hugeicons/react";
import { AlertCircleIcon } from "@hugeicons/core-free-icons";
import type { ReactNode } from "react";

import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { StateDot } from "@/components/patterns/row-card";
import { ApiError, toUserMessage } from "@/lib/api-error";
import { cn } from "@/lib/utils";
import type { Tone } from "../model/platform";

export function ToneBadge({
  tone,
  children,
  className,
}: {
  tone: Tone;
  children: ReactNode;
  className?: string;
}) {
  return <StateDot label={children} tone={tone} className={className} />;
}

/** Mot d'équipe lisible ; le terme exact (celui du backend) se lit au survol ou au focus. */
export function Hint({
  term,
  children,
}: {
  term: string;
  children: ReactNode;
}) {
  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <span
            tabIndex={0}
            className="cursor-help underline decoration-dotted decoration-muted-foreground/60 underline-offset-4 outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
          />
        }
      >
        {children}
      </TooltipTrigger>
      <TooltipContent>{term}</TooltipContent>
    </Tooltip>
  );
}

/** Erreur locale, à l'endroit du contenu : jamais une page cassée. */
export function InlineError({
  error,
  retry,
  title = "Impossible d'afficher cette partie",
}: {
  error: unknown;
  retry?: () => void;
  title?: string;
}) {
  const offline = error instanceof ApiError && error.kind === "network";
  return (
    <div
      role="alert"
      className="flex items-start gap-3 rounded-lg border border-border bg-card p-4 text-sm"
    >
      <HugeiconsIcon
        icon={AlertCircleIcon}
        strokeWidth={1.8}
        aria-hidden
        className="mt-0.5 size-4 shrink-0 text-muted-foreground"
      />
      <div className="flex min-w-0 flex-col gap-2">
        <p className="font-medium">
          {offline ? "Vous êtes hors ligne" : title}
        </p>
        <p className="text-muted-foreground">{toUserMessage(error)}</p>
        {retry ? (
          <div>
            <Button variant="outline" className="h-11 md:h-8" onClick={retry}>
              Réessayer
            </Button>
          </div>
        ) : null}
      </div>
    </div>
  );
}

export function NoPermission({ area }: { area: string }) {
  return (
    <div
      role="note"
      className="rounded-lg border border-border bg-card p-4 text-sm"
    >
      <p className="font-medium">{area} : accès non accordé</p>
      <p className="mt-1 text-muted-foreground">
        Votre compte n'a pas la permission nécessaire pour cette partie.
        Demandez-la à l'équipe responsable des accès.
      </p>
    </div>
  );
}

export function PageSkeleton() {
  return (
    <div
      role="status"
      aria-label="Chargement en cours"
      className="flex flex-col gap-4"
    >
      <Skeleton className="h-9 w-64" />
      <Skeleton className="h-4 w-96 max-w-full" />
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }, (_, i) => (
          <Skeleton key={i} className="h-24 rounded-lg" />
        ))}
      </div>
      <Skeleton className="h-48 rounded-lg" />
    </div>
  );
}

/** Tuile de chiffre : dense, adaptée à un outil interne. */
export function Stat({
  label,
  value,
  context,
  tone,
}: {
  label: ReactNode;
  value: ReactNode;
  context?: ReactNode;
  tone?: Tone;
}) {
  return (
    <div
      className={cn(
        "flex min-w-0 flex-col gap-1 rounded-lg border border-border bg-card p-3.5",
        tone === "warning" && "border-warning-border",
        tone === "danger" && "border-danger-border",
      )}
    >
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="tnum text-xl font-semibold tracking-tight">{value}</p>
      {context ? (
        <p className="text-xs text-muted-foreground">{context}</p>
      ) : null}
    </div>
  );
}

export function Section({
  title,
  description,
  actions,
  children,
}: {
  title: string;
  description?: string;
  actions?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="flex flex-col gap-3" aria-label={title}>
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div className="min-w-0">
          <h2 className="text-base font-semibold">{title}</h2>
          {description ? (
            <p className="text-sm text-muted-foreground">{description}</p>
          ) : null}
        </div>
        {actions}
      </div>
      {children}
    </section>
  );
}

/** Liste de couples libellé / valeur du panneau latéral. */
export function Facts({ rows }: { rows: [string, ReactNode][] }) {
  return (
    <dl className="flex flex-col divide-y divide-border text-sm">
      {rows.map(([k, v]) => (
        <div
          key={k}
          className="flex items-baseline justify-between gap-4 py-2.5"
        >
          <dt className="shrink-0 text-muted-foreground">{k}</dt>
          <dd className="min-w-0 text-right font-medium break-words">{v}</dd>
        </div>
      ))}
    </dl>
  );
}

export function normalize(s: string) {
  return s.normalize("NFD").replace(/\p{M}/gu, "").toLowerCase();
}
