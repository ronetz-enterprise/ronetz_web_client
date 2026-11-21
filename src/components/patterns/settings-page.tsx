import { HugeiconsIcon } from "@hugeicons/react";
import { ArrowLeft01Icon } from "@hugeicons/core-free-icons";
import Link from "next/link";

import { mainNav } from "@/components/app-shell/nav-items";
import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

/**
 * Gabarit des fiches, repris de la page Réglages : retour discret, titre et état, actions à
 * droite ; puis des lignes « libellé à gauche, valeur ou champ à droite » séparées d'un filet,
 * dans une colonne alignée à gauche.
 */
export function SettingsPage({
  back,
  title,
  status,
  actions,
  banner,
  children,
  footer,
  rail,
}: {
  back: { href: string; label: string };
  title: ReactNode;
  status?: ReactNode;
  actions?: ReactNode;
  banner?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
  /** Colonne de droite (comme Shopify) : état et informations de référence. */
  rail?: ReactNode;
}) {
  return (
    <div className={cn("flex flex-col", rail ? "max-w-6xl" : "max-w-3xl")}>
      <DetailHeader back={back} title={title} actions={actions} />
      <div className="flex min-w-0 flex-wrap items-center gap-3 pt-2 pb-6">
        <h1 className="min-w-0 text-xl font-semibold break-words">{title}</h1>
        {status}
      </div>
      {banner ? <div className="flex flex-col gap-3 pb-6">{banner}</div> : null}
      <div
        className={cn(
          "grid items-start gap-10",
          rail && "lg:grid-cols-[minmax(0,1fr)_17.5rem]",
        )}
      >
        <div className="flex min-w-0 flex-col gap-10">
          {children}
          {footer}
        </div>
        {rail ? (
          <aside className="flex min-w-0 flex-col gap-5 text-sm lg:sticky lg:top-20">
            {rail}
          </aside>
        ) : null}
      </div>
    </div>
  );
}

/** Groupe de lignes avec un intertitre, comme une section de réglages. */
export function SettingsSection({
  title,
  description,
  action,
  children,
}: {
  title?: string;
  description?: string;
  action?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="flex flex-col">
      {title ? (
        <div className="flex items-end justify-between gap-3 border-b pb-3">
          <div className="space-y-0.5">
            <h2 className="text-base font-semibold">{title}</h2>
            {description ? (
              <p className="text-sm text-muted-foreground">{description}</p>
            ) : null}
          </div>
          {action}
        </div>
      ) : null}
      <div className="flex flex-col">{children}</div>
    </section>
  );
}

/**
 * Ligne de réglage : libellé en gras à gauche (avec une courte aide), contrôle ou valeur à droite.
 * Les champs placés à droite cachent leur propre libellé et leur aide : la ligne les porte.
 */
export function SettingsRow({
  label,
  htmlFor,
  description,
  children,
  className,
}: {
  label: string;
  htmlFor?: string;
  description?: string;
  children: ReactNode;
  className?: string;
}) {
  const LabelTag = htmlFor ? "label" : "p";
  return (
    <div
      className={cn(
        "grid gap-2 border-b py-5 sm:grid-cols-[14rem_minmax(0,1fr)] sm:gap-8",
        className,
      )}
    >
      <div className="space-y-1">
        <LabelTag
          {...(htmlFor ? { htmlFor } : {})}
          className="block text-sm font-semibold"
        >
          {label}
        </LabelTag>
        {description ? (
          <p className="text-sm text-muted-foreground">{description}</p>
        ) : null}
      </div>
      <div className="min-w-0 text-sm [&_[data-slot=field-description]]:hidden [&_[data-slot=field-label]]:sr-only [&_[data-slot=field]]:max-w-sm">
        {children}
      </div>
    </div>
  );
}

/** Pied d'une fiche modifiable : « Annuler » et « Enregistrer » en bas à droite, comme Réglages. */
export function SettingsFooter({ children }: { children: ReactNode }) {
  return <div className="flex justify-end gap-2 pt-5">{children}</div>;
}

/** Bloc de la colonne de droite : petit intertitre, contenu, filet entre deux blocs. */
export function RailItem({
  label,
  children,
}: {
  label?: string;
  children: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1">
      {label ? <span className="text-muted-foreground">{label}</span> : null}
      <div className="font-medium break-words">{children}</div>
    </div>
  );
}

/**
 * En-tête d'une fiche, comme Shopify : il remplace la barre du haut de l'application. Bouton
 * retour, fil d'Ariane qui reprend le nom et l'icône de la rubrique du menu, actions à droite.
 */
export function DetailHeader({
  back,
  title,
  actions,
}: {
  back: { href: string; label: string };
  title: ReactNode;
  actions?: ReactNode;
}) {
  // Le fil d'Ariane suit le menu : même nom, même icône que la rubrique.
  const section = mainNav.find((n) => back.href.startsWith(n.href));
  const label = section?.label ?? back.label;
  return (
    <div className="sticky top-0 z-20 -mx-4 -mt-6 mb-2 flex min-h-14 flex-wrap items-center justify-between gap-3 bg-background px-4 py-2.5 sm:-mx-8 sm:px-8 max-md:static max-md:mt-0">
      <nav
        aria-label="Fil d’Ariane"
        className="flex min-w-0 items-center gap-2 text-sm"
      >
        <Link
          href={back.href}
          aria-label={`Retour : ${label}`}
          className="grid size-8 shrink-0 place-items-center rounded-lg border hover:bg-accent"
        >
          <HugeiconsIcon
            icon={ArrowLeft01Icon}
            strokeWidth={1.8}
            className="size-4"
          />
        </Link>
        <Link
          href={back.href}
          className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground"
        >
          {section ? (
            <HugeiconsIcon
              icon={section.icon}
              strokeWidth={1.8}
              className="size-4"
            />
          ) : null}
          {label}
        </Link>
        <span aria-hidden className="text-muted-foreground">
          /
        </span>
        <span className="truncate font-medium">{title}</span>
      </nav>
      {actions ? (
        <div className="flex flex-wrap items-center gap-2">{actions}</div>
      ) : null}
    </div>
  );
}
