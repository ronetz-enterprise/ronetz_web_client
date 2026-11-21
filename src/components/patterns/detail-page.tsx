"use client";

import { HugeiconsIcon, type IconSvgElement } from "@hugeicons/react";
import { ArrowLeft01Icon } from "@hugeicons/core-free-icons";
import Link from "next/link";
import { createContext, useContext, useState, type ReactNode } from "react";

import { cn } from "@/lib/utils";
import { RailItem, SettingsPage } from "./settings-page";

export type DetailProperty = {
  icon: IconSvgElement;
  label: string;
  value: ReactNode;
  /** Occupe deux colonnes (texte long). */
  wide?: boolean;
};

/**
 * Page de détail, d'après le modèle « Project Detail View » (catalogue 21st) : fil d'Ariane discret
 * et actions sur la même ligne, grand titre, puis une grille de propriétés (icône, libellé, valeur)
 * qui dit tout l'essentiel d'un coup d'œil ; les sections viennent dessous, pleine largeur.
 * Base Stripe gardée pour la sobriété : aucun fond teinté, émeraude réservé aux actions.
 */
/** Fiche affichée dans un tiroir : une seule colonne, sans en-tête de page. */
export const DetailCompactContext = createContext(false);

export function DetailPage({
  back,
  title,
  actions,
  banner,
  properties,
  children,
}: {
  back: { href: string; label: string };
  title: ReactNode;
  actions?: ReactNode;
  banner?: ReactNode;
  properties?: DetailProperty[];
  children?: ReactNode;
}) {
  // Deux colonnes comme Shopify : le contenu à gauche (lignes de Réglages), les propriétés à droite.
  const compact = useContext(DetailCompactContext);
  const state = properties?.find((p) => p.label === "État");
  const rest = properties?.filter((p) => p !== state) ?? [];
  if (compact)
    return (
      <div className="flex flex-col gap-6 px-6 pt-12 pb-6">
        <div className="flex flex-col gap-3">
          <div className="flex min-w-0 flex-wrap items-center gap-2.5">
            <h2 className="min-w-0 text-xl font-semibold break-words">
              {title}
            </h2>
            {state?.value}
          </div>
          {actions ? (
            <div className="flex flex-wrap items-center gap-2">{actions}</div>
          ) : null}
        </div>
        {banner}
        {rest.length ? (
          <dl className="grid grid-cols-2 gap-x-6 gap-y-4 text-sm">
            {rest.map((p) => (
              <div key={p.label} className="flex min-w-0 flex-col gap-1">
                <dt className="text-muted-foreground">{p.label}</dt>
                <dd className="min-w-0 font-medium break-words">{p.value}</dd>
              </div>
            ))}
          </dl>
        ) : null}
        <div className="flex flex-col border-t border-border">{children}</div>
      </div>
    );
  return (
    <SettingsPage
      back={back}
      title={title}
      status={state?.value}
      actions={actions}
      banner={banner}
      rail={
        rest.length ? (
          <>
            {rest.map((p) => (
              <RailItem key={p.label} label={p.label}>
                {p.value}
              </RailItem>
            ))}
          </>
        ) : undefined
      }
    >
      <div className="flex flex-col">{children}</div>
    </SettingsPage>
  );
}

/** Section d'une fiche, en deux colonnes comme Réglages : titre à gauche, contenu à droite. */
export function DetailSection({
  title,
  action,
  children,
  className,
}: {
  title: string;
  icon?: IconSvgElement;
  count?: number;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  const compact = useContext(DetailCompactContext);
  return (
    <div
      className={cn(
        "grid gap-3 border-b py-5",
        !compact && "sm:grid-cols-[14rem_minmax(0,1fr)] sm:gap-8",
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <h2 className="text-sm font-semibold">{title}</h2>
        {action}
      </div>
      <div className={cn("flex min-w-0 flex-col gap-4 text-sm", className)}>
        {children}
      </div>
    </div>
  );
}

/** Vide : une case en pointillés, comme l'emplacement « + » du modèle. */
export function DetailEmpty({ children }: { children: ReactNode }) {
  return (
    <div className="grid min-h-16 place-items-center rounded-lg border border-dashed border-border px-4 py-5 text-center text-sm text-muted-foreground">
      {children}
    </div>
  );
}

export type DetailStep = {
  icon: IconSvgElement;
  label: string;
  at: string;
  /** done : passé (encre) ; now : en cours (halo) ; next : à venir (gris). */
  state: "done" | "now" | "next";
};

/** Parcours vertical à icônes (modèle « Order History ») : passé en encre, à venir en gris. */
export function DetailJourney({ steps }: { steps: DetailStep[] }) {
  return (
    <ol className="flex max-w-xl flex-col">
      {steps.map((s, n) => (
        <li key={s.label + n} className="relative flex gap-3 pb-5 last:pb-0">
          {n < steps.length - 1 ? (
            <span
              aria-hidden
              className="absolute top-8 bottom-1 left-[13px] w-px bg-border"
            />
          ) : null}
          <span
            aria-hidden
            className={cn(
              // Fil d'activité léger : des repères cerclés, jamais des pastilles pleines.
              "relative grid size-7 shrink-0 place-items-center rounded-full border bg-background",
              s.state === "done" && "border-border text-foreground",
              s.state === "now" &&
                "border-foreground text-foreground ring-4 ring-muted",
              s.state === "next" &&
                "border-dashed border-input text-muted-foreground",
            )}
          >
            <HugeiconsIcon
              icon={s.icon}
              strokeWidth={1.8}
              className="size-3.5"
            />
          </span>
          <span className="flex flex-col gap-0.5 pt-0.5">
            <span
              className={cn(
                "text-sm font-medium",
                s.state === "next" && "text-muted-foreground",
              )}
            >
              {s.label}
            </span>
            <span className="text-sm text-muted-foreground tabular-nums">
              {s.at}
            </span>
          </span>
        </li>
      ))}
    </ol>
  );
}

/** Identifiant copiable : chasse fixe, un clic copie. */
export function CopyId({ value, label }: { value: string; label: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      aria-label={`Copier ${label}`}
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(value);
          setCopied(true);
          setTimeout(() => setCopied(false), 1500);
        } catch {
          setCopied(false);
        }
      }}
      className="inline-flex max-w-full items-center gap-2 rounded-md border border-border px-2 py-0.5 font-mono text-xs hover:bg-accent"
    >
      <span className="truncate">{value}</span>
      <span className="shrink-0 font-sans text-muted-foreground">
        {copied ? "Copié" : "Copier"}
      </span>
    </button>
  );
}

/**
 * Gabarit d'édition façon Shopify (fiche produit) : en haut, flèche retour + fil d'Ariane et actions ;
 * au centre une colonne de cartes (un sujet par carte) ; à droite une colonne sans carte : état,
 * où c'est vendu, puis lignes libellé → valeur séparées d'un filet.
 */
export function EditorPage({
  back,
  title,
  actions,
  banner,
  header,
  rail,
  children,
}: {
  back: { href: string; label: string };
  title: string;
  actions?: ReactNode;
  banner?: ReactNode;
  /** En-tête de l'objet, au-dessus des cartes : petit libellé, grand titre, puces. */
  header?: ReactNode;
  rail?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-6">
      {/* En-tête de la fiche : il remplace la barre du haut de l'application (comme Shopify). */}
      <div className="sticky top-0 z-20 -mx-4 -mt-6 flex min-h-14 flex-wrap items-center justify-between gap-3 bg-page px-4 py-2.5 sm:-mx-8 sm:px-8 max-md:static max-md:mt-0">
        <nav
          aria-label="Fil d’Ariane"
          className="flex min-w-0 items-center gap-2 text-[13px]"
        >
          <Link
            href={back.href}
            aria-label={`Retour : ${back.label}`}
            className="grid size-8 shrink-0 place-items-center rounded-lg shadow-card hover:bg-accent"
          >
            <HugeiconsIcon
              icon={ArrowLeft01Icon}
              strokeWidth={1.8}
              className="size-4"
            />
          </Link>
          <Link href={back.href} className="font-medium hover:underline">
            {back.label}
          </Link>
          <span aria-hidden className="text-muted-foreground">
            /
          </span>
          <span className="truncate font-medium">{title}</span>
        </nav>
        {actions ? (
          <div className="flex flex-wrap items-center gap-1.5">{actions}</div>
        ) : null}
      </div>
      {/* Largeurs Shopify : colonne centrale ~760 px, colonne de droite ~280 px, centrées. */}
      <div
        className={cn(
          "mx-auto grid w-full max-w-[66rem] items-start gap-5 lg:grid-cols-[minmax(0,1fr)_17.5rem]",
          EDITOR_FIELDS,
        )}
      >
        <div className="flex min-w-0 flex-col gap-4">
          {header}
          {banner}
          {children}
        </div>
        {rail ? (
          <aside className="flex min-w-0 flex-col gap-4 text-[13px] lg:pt-1">
            {rail}
          </aside>
        ) : null}
      </div>
    </div>
  );
}

/** Champs façon Shopify : libellé encre, pas d'aide sous chaque champ, contours bien visibles. */
const EDITOR_FIELDS = cn(
  "[&_[data-slot=field]]:gap-1.5 [&_[data-slot=field-label]]:text-[13px] [&_[data-slot=field-label]]:font-normal [&_[data-slot=field-label]]:text-foreground",
  "[&_[data-slot=field-description]]:hidden",
  // Comme Shopify : un champ court ne s'étire pas sur toute la carte.
  "[&_[data-slot=input-group]]:max-w-80 [&_[data-slot=field]]:w-auto",
  "[&_[data-slot=input]]:h-8 [&_[data-slot=input]]:rounded-lg [&_[data-slot=input-group]]:h-8 [&_[data-slot=input-group]]:rounded-lg [&_[data-slot=textarea]]:rounded-lg",
  "[&_[data-slot=input]]:border-muted-foreground/50 [&_[data-slot=input-group]]:border-muted-foreground/50 [&_[data-slot=textarea]]:border-muted-foreground/50 [&_[data-slot=select-trigger]]:border-muted-foreground/50",
  "[&_[data-slot=switch][data-checked]]:bg-foreground [&_[data-slot=switch-thumb][data-checked]]:bg-background",
);

/** En-tête de l'objet : petit libellé, grand titre (modifiable), puces d'information. */
export function EditorHeader({
  label,
  title,
  chips,
}: {
  label: string;
  title: ReactNode;
  chips?: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1 pb-1">
      <span className="text-xs font-medium text-muted-foreground">{label}</span>
      {title}
      {chips ? (
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[13px]">
          {chips}
        </div>
      ) : null}
    </div>
  );
}

/** Petit bouton « + Ajouter … » des réglages facultatifs. */
export function AddPill({
  children,
  onClick,
  disabled,
}: {
  children: ReactNode;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="inline-flex h-7 items-center gap-1.5 rounded-lg bg-muted px-2.5 text-[13px] font-medium hover:bg-accent disabled:opacity-50"
    >
      <span aria-hidden>+</span>
      {children}
    </button>
  );
}

/**
 * Carte d'un sujet, calquée sur Shopify : blanche, contour d'un pixel porté par l'ombre, rayon 12,
 * marge 16. À l'intérieur : libellés 13 px non gras, aide sous le champ, champs de 32 px rayon 8.
 */
export function EditorCard({
  title,
  description,
  children,
}: {
  title?: string;
  description?: string;
  children: ReactNode;
}) {
  return (
    <section className="flex flex-col gap-4 rounded-xl bg-background p-4 shadow-card">
      {title ? (
        <div className="flex flex-col gap-0.5">
          <h2 className="text-sm font-semibold">{title}</h2>
          {description ? (
            <p className="text-[13px] text-muted-foreground">{description}</p>
          ) : null}
        </div>
      ) : null}
      {children}
    </section>
  );
}

/** Bloc de la colonne de droite : filet au-dessus, intertitre gris, contenu. */
export function RailBlock({
  title,
  children,
}: {
  title?: string;
  children: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-2 border-t border-border pt-4 first:border-t-0 first:pt-0">
      {title ? <h2 className="text-[13px] font-semibold">{title}</h2> : null}
      {children}
    </div>
  );
}

/** Ligne libellé → valeur de la colonne de droite. */
export function RailRow({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <div className="flex items-baseline justify-between gap-3">
      <span className="text-muted-foreground">{label}</span>
      <span className="text-right font-medium">{children}</span>
    </div>
  );
}

/** État façon Shopify : un point de couleur et le libellé, sans pastille. */
export function StatusDot({
  label,
  tone,
}: {
  label: string;
  tone: "success" | "warning" | "danger" | "neutral";
}) {
  const dot = {
    success: "bg-success-emphasized",
    warning: "bg-warning-foreground",
    danger: "bg-destructive",
    neutral: "bg-muted-foreground",
  }[tone];
  return (
    <span className="inline-flex items-center gap-2 font-medium">
      <span aria-hidden className={cn("size-2 rounded-full", dot)} />
      {label}
    </span>
  );
}
