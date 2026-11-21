import { HugeiconsIcon, type IconSvgElement } from "@hugeicons/react";
import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

/**
 * Fiche d'un objet, d'après la fiche produit de Stripe : une vignette, le titre et son état, une
 * ligne de résumé, les actions à droite ; dessous, la colonne principale en sections (tableaux,
 * cases vides en pointillés, listes horodatées) et une colonne de droite sans carte (données clés,
 * détails modifiables par un crayon). La page se lit ; on modifie dans une fenêtre.
 */
export function ObjectPage({
  header,
  hero,
  main,
  aside,
}: {
  /** En-tête de navigation (retour, fil d'Ariane) au-dessus de la fiche. */
  header?: ReactNode;
  hero: ReactNode;
  main: ReactNode;
  aside: ReactNode;
}) {
  return (
    <div className="flex flex-col">
      {header}
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 pt-2">
        {hero}
        <div className="grid items-start gap-12 lg:grid-cols-[minmax(0,1fr)_18rem]">
          <div className="flex min-w-0 flex-col gap-12">{main}</div>
          <aside className="flex min-w-0 flex-col gap-10">{aside}</aside>
        </div>
      </div>
    </div>
  );
}

/** Vignette, titre, état, résumé ; actions à droite. */
export function ObjectHero({
  icon,
  title,
  status,
  summary,
  actions,
}: {
  icon: IconSvgElement;
  title: ReactNode;
  status?: ReactNode;
  summary?: ReactNode;
  actions?: ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-4">
      <div className="flex min-w-0 items-center gap-4">
        <span className="grid size-14 shrink-0 place-items-center rounded-lg bg-muted text-muted-foreground">
          <HugeiconsIcon icon={icon} strokeWidth={1.6} className="size-6" />
        </span>
        <div className="flex min-w-0 flex-col gap-1">
          <div className="flex min-w-0 flex-wrap items-center gap-2.5">
            <h1 className="min-w-0 text-[28px] leading-9 font-bold break-words">
              {title}
            </h1>
            {status}
          </div>
          {summary ? (
            <div className="flex flex-wrap items-center gap-x-2 text-base text-muted-foreground">
              {summary}
            </div>
          ) : null}
        </div>
      </div>
      {actions ? (
        <div className="flex shrink-0 items-center gap-2">{actions}</div>
      ) : null}
    </div>
  );
}

/** Section : titre 20 px en gras, action à droite (souvent « + » ou un crayon). */
export function ObjectSection({
  title,
  action,
  children,
  className,
}: {
  title: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={cn("flex flex-col gap-4", className)}>
      <div className="flex min-h-8 items-center justify-between gap-3">
        <h2 className="text-xl font-bold">{title}</h2>
        {action}
      </div>
      {children}
    </section>
  );
}

/** Tableau : en-têtes 12 px en gras, lignes séparées d'un filet très clair. */
export function ObjectTable({
  columns,
  rows,
}: {
  columns: { label: string; align?: "end" }[];
  rows: ReactNode[][];
}) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border">
            {columns.map((c) => (
              <th
                key={c.label}
                className={cn(
                  "h-9 px-2 text-xs font-semibold first:pl-1.5",
                  c.align === "end" ? "text-right" : "text-left",
                )}
              >
                {c.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i} className="border-b border-border">
              {row.map((cell, j) => (
                <td
                  key={j}
                  className={cn(
                    "px-2 py-3 align-top first:pl-1.5",
                    columns[j]?.align === "end" && "text-right",
                  )}
                >
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/** Case vide en pointillés clairs, centrée. */
export function ObjectEmpty({ children }: { children: ReactNode }) {
  return (
    <div className="grid min-h-20 place-items-center rounded-lg border border-dashed border-border px-4 py-6 text-center text-sm text-muted-foreground">
      {children}
    </div>
  );
}

/** Liste horodatée (événements) : texte en gras à gauche, date à droite, filet très clair. */
export function ObjectEvents({
  items,
}: {
  items: { label: ReactNode; at: string }[];
}) {
  return (
    <ul className="flex flex-col">
      {items.map((e, i) => (
        <li
          key={i}
          className="flex items-start justify-between gap-6 border-b border-border px-1.5 py-3 text-sm"
        >
          <span className="font-semibold">{e.label}</span>
          <span className="shrink-0 tabular-nums text-muted-foreground">
            {e.at}
          </span>
        </li>
      ))}
    </ul>
  );
}

/** Colonne de droite : libellé en gras, valeur dessous. */
export function ObjectFacts({
  items,
}: {
  items: { label: string; value: ReactNode }[];
}) {
  return (
    <dl className="flex flex-col gap-4 text-sm">
      {items.map((i) => (
        <div key={i.label} className="flex flex-col gap-0.5">
          <dt className="font-semibold">{i.label}</dt>
          <dd className="break-words">{i.value}</dd>
        </div>
      ))}
    </dl>
  );
}
