import * as React from "react";

import { Amount } from "@/components/amount";
import { cn } from "@/lib/utils";

/** Teinte de l'état : toujours doublée d'un libellé, jamais la couleur seule. */
export type RowCardTone = "success" | "warning" | "danger" | "neutral";

/** Couleur du point d'état (à la Linear) : la couleur ne sert qu'à dire l'état. */
export const STATE_DOT_CLASS: Record<RowCardTone, string> = {
  success: "bg-state-ok",
  warning: "bg-state-warn",
  danger: "bg-state-down",
  neutral: "bg-state-idle",
};

/** État : un point de couleur et le mot, sans fond. */
export function StateDot({
  label,
  tone = "neutral",
  className,
}: {
  label: React.ReactNode;
  tone?: RowCardTone;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 text-sm whitespace-nowrap",
        tone === "neutral" ? "text-muted-foreground" : "text-foreground",
        className,
      )}
    >
      <span
        aria-hidden
        className={cn("size-1.5 shrink-0 rounded-full", STATE_DOT_CLASS[tone])}
      />
      {label}
    </span>
  );
}

export type RowCardProps = {
  /** Ligne 1, à gauche. */
  title: React.ReactNode;
  /** Ligne 1, à droite : montant en FCFA (composant Amount) ou valeur déjà mise en forme. */
  amount?: number;
  value?: React.ReactNode;
  /** Ligne 2, à gauche : métadonnées discrètes. */
  meta?: React.ReactNode;
  /** Ligne 2, à droite : libellé de l'état (affiché avec un point de couleur). */
  status?: string;
  tone?: RowCardTone;
  selected?: boolean;
  onSelect?: () => void;
  className?: string;
};

/**
 * Carte-ligne à deux lignes, identique sur téléphone et ordinateur.
 * Bouton natif : Entrée/Espace l'ouvrent, cible tactile d'au moins 56 px de haut.
 */
export function RowCard({
  title,
  amount,
  value,
  meta,
  status,
  tone = "neutral",
  selected = false,
  onSelect,
  className,
}: RowCardProps) {
  return (
    <button
      type="button"
      data-slot="row-card"
      data-row-card=""
      aria-current={selected ? "true" : undefined}
      onClick={onSelect}
      className={cn(
        "flex min-h-14 w-full flex-col justify-center gap-1 rounded-md px-3 py-2.5 text-left transition-colors outline-none",
        "hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring/50",
        "aria-[current=true]:bg-muted",
        className,
      )}
    >
      <span className="flex items-baseline justify-between gap-3">
        <span className="min-w-0 truncate text-sm font-medium">{title}</span>
        {amount !== undefined ? (
          <Amount value={amount} className="shrink-0 text-sm font-medium" />
        ) : value !== undefined ? (
          <span className="tnum shrink-0 text-sm font-medium">{value}</span>
        ) : null}
      </span>
      <span className="flex items-center justify-between gap-3">
        <span className="min-w-0 truncate text-xs text-muted-foreground">
          {meta}
        </span>
        {status ? (
          <StateDot label={status} tone={tone} className="shrink-0 text-xs" />
        ) : null}
      </span>
    </button>
  );
}
