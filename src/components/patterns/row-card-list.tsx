"use client";

import * as React from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  ArrowLeft01Icon,
  ArrowRight01Icon,
  Search01Icon,
} from "@hugeicons/core-free-icons";

import { Button } from "@/components/ui/button";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from "@/components/ui/empty";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { Amount } from "@/components/amount";
import {
  RowCard,
  StateDot,
  type RowCardProps,
  type RowCardTone,
} from "./row-card";

export type RowCardGroup<T> = {
  key: string;
  /** En-tête collant : « Aujourd'hui », « Hier »… */
  label: string;
  /** Total du groupe, déjà mis en forme (ex. <Amount />). */
  total?: React.ReactNode;
  items: T[];
};

/** Colonne de tableau, façon Stripe : en-tête 12 px gras, cellule libre. */
export type TableColumn<T> = {
  key: string;
  header: string;
  cell: (item: T) => React.ReactNode;
  align?: "start" | "end";
  /** Cache la colonne sous 1024 px (colonnes secondaires). */
  wide?: boolean;
  className?: string;
};

type ListProps<T> = {
  /** Colonnes du tableau (ordinateur). Sans elles : titre, détails, état, valeur, tirés de `toRow`. */
  columns?: TableColumn<T>[];
  groups: RowCardGroup<T>[];
  /** Transforme un élément en contenu de carte. */
  toRow: (item: T) => Omit<RowCardProps, "selected" | "onSelect">;
  getKey: (item: T) => string;
  selectedKey?: string | null;
  onSelect?: (item: T) => void;
  loading?: boolean;
  /** Contenu de l'état vide ; par défaut, une phrase neutre. */
  empty?: React.ReactNode;
  /** Libellé accessible de la liste. */
  label: string;
  className?: string;
};

/**
 * Liste de cartes-lignes : groupes à en-tête collant, état vide, chargement,
 * navigation aux flèches (↑ ↓, Début, Fin).
 */
export function RowCardList<T>({
  columns,
  groups,
  toRow,
  getKey,
  selectedKey,
  onSelect,
  loading,
  empty,
  label,
  className,
}: ListProps<T>) {
  const ref = React.useRef<HTMLDivElement>(null);

  function onKeyDown(e: React.KeyboardEvent<HTMLDivElement>) {
    if (!["ArrowDown", "ArrowUp", "Home", "End"].includes(e.key)) return;
    const rows = Array.from(
      ref.current?.querySelectorAll<HTMLElement>("[data-row-card]") ?? [],
    );
    if (rows.length === 0) return;
    const i = rows.indexOf(document.activeElement as HTMLElement);
    let next = i;
    if (e.key === "ArrowDown") next = Math.min(rows.length - 1, i + 1);
    if (e.key === "ArrowUp") next = Math.max(0, i - 1);
    if (e.key === "Home") next = 0;
    if (e.key === "End") next = rows.length - 1;
    e.preventDefault();
    rows[next]?.focus();
  }

  if (loading) {
    return (
      <div
        role="status"
        aria-label="Chargement en cours"
        className={cn("flex flex-col gap-1", className)}
      >
        {Array.from({ length: 6 }, (_, i) => (
          <Skeleton key={i} className="h-14 rounded-md" />
        ))}
      </div>
    );
  }

  const total = groups.reduce((n, g) => n + g.items.length, 0);
  if (total === 0) {
    return (
      <div className={className}>
        {empty ?? (
          <Empty className="border">
            <EmptyHeader>
              <EmptyTitle>Rien à afficher</EmptyTitle>
              <EmptyDescription>
                Aucun élément ne correspond à votre recherche.
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
        )}
      </div>
    );
  }

  const cols = columns ?? defaultColumns(toRow);
  // Stripe ne coupe jamais un tableau par des intertitres : une seule suite de lignes.
  const flat = true;

  return (
    <div ref={ref} onKeyDown={onKeyDown} className={className}>
      {/* Ordinateur : tableau Stripe. Lignes de 48 px, filet fin, aucun fond alterné. */}
      <table aria-label={label} className="hidden w-full text-sm md:table">
        <thead>
          <tr className="border-b border-border">
            {cols.map((c) => (
              <th
                key={c.key}
                scope="col"
                className={cn(
                  "h-9 px-2 text-xs font-semibold whitespace-nowrap text-foreground first:pl-0",
                  c.align === "end" ? "text-right" : "text-left",
                  c.wide && "hidden lg:table-cell",
                  c.className,
                )}
              >
                {c.header}
              </th>
            ))}
          </tr>
        </thead>
        {groups.map((g) => (
          <tbody key={g.key}>
            {flat ? null : (
              <tr>
                <th
                  colSpan={cols.length}
                  scope="colgroup"
                  className="pt-7 pb-2 text-left text-sm font-semibold text-foreground"
                >
                  <span className="flex items-baseline justify-between gap-3">
                    <span>{g.label}</span>
                    {g.total ? <span className="tnum">{g.total}</span> : null}
                  </span>
                </th>
              </tr>
            )}
            {g.items.map((item) => {
              const k = getKey(item);
              const selected = selectedKey === k;
              return (
                <tr
                  key={k}
                  data-row-card=""
                  tabIndex={0}
                  aria-selected={selected}
                  onClick={() => onSelect?.(item)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      onSelect?.(item);
                    }
                  }}
                  className="h-12 cursor-pointer border-b border-border transition-colors outline-none hover:bg-muted focus-visible:bg-muted focus-visible:shadow-[inset_2px_0_0_var(--ring)] aria-selected:bg-muted"
                >
                  {cols.map((c) => (
                    <td
                      key={c.key}
                      className={cn(
                        "max-w-72 truncate px-2 first:pl-0",
                        c.align === "end" && "tnum text-right font-medium",
                        c.wide && "hidden lg:table-cell",
                        c.className,
                      )}
                    >
                      {c.cell(item)}
                    </td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        ))}
      </table>

      {/* Téléphone : les lignes s'empilent, comme l'application Stripe. */}
      <div
        role="group"
        aria-label={label}
        className="flex flex-col gap-4 md:hidden"
      >
        {groups.map((g) => (
          <section key={g.key} aria-label={g.label} className="flex flex-col">
            {flat ? null : (
              <h3 className="sticky top-0 z-10 flex items-baseline justify-between gap-3 bg-page py-2 text-xs font-medium text-muted-foreground">
                <span>{g.label}</span>
                {g.total ? <span className="tnum">{g.total}</span> : null}
              </h3>
            )}
            <div className="flex flex-col divide-y divide-border border-y border-border">
              {g.items.map((item) => {
                const k = getKey(item);
                return (
                  <RowCard
                    key={k}
                    {...toRow(item)}
                    selected={selectedKey === k}
                    onSelect={() => onSelect?.(item)}
                  />
                );
              })}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}

/** Pastille d'état Stripe : petite, arrondie, teintée, toujours avec un libellé. */
/** État d'une ligne : point de couleur et libellé (voir StateDot). */
export function StatusPill({
  label,
  tone = "neutral",
}: {
  label: string;
  tone?: RowCardTone;
}) {
  return <StateDot label={label} tone={tone} />;
}

function defaultColumns<T>(toRow: ListProps<T>["toRow"]): TableColumn<T>[] {
  return [
    {
      key: "title",
      header: "Nom",
      cell: (i) => <span className="font-medium">{toRow(i).title}</span>,
    },
    {
      key: "status",
      header: "État",
      cell: (i) => {
        const r = toRow(i);
        return r.status ? <StatusPill label={r.status} tone={r.tone} /> : null;
      },
    },
    {
      key: "meta",
      header: "Détails",
      cell: (i) => (
        <span className="text-muted-foreground">{toRow(i).meta}</span>
      ),
    },
    {
      key: "value",
      header: "",
      align: "end",
      cell: (i) => {
        const r = toRow(i);
        return r.amount !== undefined ? (
          <Amount value={r.amount} className="font-medium" />
        ) : (
          r.value
        );
      },
    },
  ];
}

export type FilterChip = { value: string; label: string; count?: number };

/** Barre au-dessus de la liste : recherche + filtres en puces (un seul choix, « Tous » par défaut). */
export function RowCardToolbar({
  search,
  onSearchChange,
  searchLabel,
  chips,
  chip,
  onChipChange,
  className,
}: {
  search: string;
  onSearchChange: (v: string) => void;
  searchLabel: string;
  chips?: FilterChip[];
  chip?: string;
  onChipChange?: (v: string) => void;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col gap-3 md:flex-row-reverse md:items-center md:justify-between",
        className,
      )}
    >
      <div className="relative md:w-72">
        <HugeiconsIcon
          icon={Search01Icon}
          aria-hidden
          className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
        />
        <Input
          type="search"
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder={searchLabel}
          aria-label={searchLabel}
          className="h-11 border-transparent bg-muted pl-9 md:h-8"
        />
      </div>
      {chips ? (
        <div
          role="radiogroup"
          aria-label="Filtrer par état"
          // Filtres Ronetz : un rail gris où l'état choisi se soulève en carte blanche.
          className="flex max-w-full gap-0.5 overflow-x-auto rounded-lg bg-muted p-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          {chips.map((c) => {
            const on = c.value === chip;
            return (
              <button
                key={c.value}
                type="button"
                role="radio"
                aria-checked={on}
                onClick={() => onChipChange?.(c.value)}
                className={cn(
                  "inline-flex h-10 shrink-0 items-center gap-2 rounded-md px-3 text-[13px] font-medium transition-[background-color,color,box-shadow] duration-150 outline-none md:h-7",
                  "focus-visible:ring-2 focus-visible:ring-ring/60",
                  on
                    ? "bg-background text-foreground shadow-[0_1px_2px_rgb(0_0_0/0.08),0_0_0_1px_rgb(0_0_0/0.04)]"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                {c.label}
                {c.count !== undefined ? (
                  <span
                    className={cn(
                      "tnum min-w-4 rounded px-1 text-center text-[11px] font-semibold",
                      on
                        ? "bg-muted text-foreground"
                        : "text-muted-foreground/80",
                    )}
                  >
                    {c.count}
                  </span>
                ) : null}
              </button>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}

/** Pagination en bas de liste : « 1–8 sur 20 », Précédent / Suivant. */
export function RowCardPagination({
  page,
  pageSize,
  total,
  onPageChange,
  className,
}: {
  page: number;
  pageSize: number;
  total: number;
  onPageChange: (page: number) => void;
  className?: string;
}) {
  if (total === 0) return null;
  const pages = Math.max(1, Math.ceil(total / pageSize));
  const from = (page - 1) * pageSize + 1;
  const to = Math.min(total, page * pageSize);
  return (
    <nav
      aria-label="Pagination"
      className={cn("flex items-center justify-between gap-3 pt-3", className)}
    >
      <p className="tnum text-sm text-muted-foreground" aria-live="polite">
        {from}–{to} sur {total} résultat{total > 1 ? "s" : ""}
      </p>
      <div className="flex gap-2">
        <Button
          variant="outline"
          size="sm"
          className="h-11 px-2.5 md:h-7"
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
        >
          <HugeiconsIcon icon={ArrowLeft01Icon} aria-hidden />
          Précédent
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="h-11 px-2.5 md:h-7"
          disabled={page >= pages}
          onClick={() => onPageChange(page + 1)}
        >
          Suivant
          <HugeiconsIcon icon={ArrowRight01Icon} aria-hidden />
        </Button>
      </div>
    </nav>
  );
}
