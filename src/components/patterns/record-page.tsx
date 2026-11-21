import Link from "next/link";
import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

/**
 * Fiche d'un élément, d'après la page de détail de Stripe (captures 31 et 39) :
 * lien vers la liste au-dessus du titre, titre en grand avec son état, une ligne de contexte,
 * les actions à droite ; un bandeau d'information facultatif ; puis les sections à gauche
 * et la colonne « Détails » à droite.
 */
export function RecordPage({
  back,
  title,
  status,
  subtitle,
  actions,
  notice,
  details,
  detailsAction,
  children,
}: {
  back: { href: string; label: string };
  title: ReactNode;
  status?: ReactNode;
  subtitle?: ReactNode;
  actions?: ReactNode;
  notice?: ReactNode;
  details: { label: string; value: ReactNode }[];
  detailsAction?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="flex w-full flex-col gap-8">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex min-w-0 flex-col gap-1">
          <Link
            href={back.href}
            className="w-fit text-sm font-medium text-signal hover:underline"
          >
            {back.label}
          </Link>
          <div className="flex min-w-0 flex-wrap items-center gap-3">
            <h1 className="min-w-0 text-[28px] leading-9 font-bold break-words">
              {title}
            </h1>
            {status}
          </div>
          {subtitle ? (
            <div className="text-sm text-muted-foreground">{subtitle}</div>
          ) : null}
        </div>
        {actions ? (
          <div className="flex shrink-0 flex-wrap items-center gap-2">
            {actions}
          </div>
        ) : null}
      </header>
      {notice}
      <div className="grid items-start gap-10 lg:grid-cols-[minmax(0,1fr)_17rem] lg:gap-12">
        <div className="flex min-w-0 flex-col gap-10">{children}</div>
        <aside aria-labelledby="record-details" className="flex flex-col gap-4">
          <div className="flex items-center justify-between gap-2 border-b border-border pb-2">
            <h2 id="record-details" className="text-xl font-bold">
              Détails
            </h2>
            {detailsAction}
          </div>
          <dl className="flex flex-col gap-4 text-sm">
            {details.map((d) => (
              <div key={d.label} className="flex flex-col gap-0.5">
                <dt className="font-semibold">{d.label}</dt>
                <dd className="text-muted-foreground">{d.value}</dd>
              </div>
            ))}
          </dl>
        </aside>
      </div>
    </div>
  );
}

/** Section de la colonne principale : titre 20 px gras, action à droite, filet dessous. */
export function RecordSection({
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
      <div className="flex items-center justify-between gap-2 border-b border-border pb-2">
        <h2 className="text-xl font-bold">{title}</h2>
        {action}
      </div>
      {children}
    </section>
  );
}

/** Bandeau d'information gris, comme ceux de Stripe sous le titre. */
export function RecordNotice({
  tone = "info",
  title,
  children,
  action,
}: {
  tone?: "info" | "danger";
  title?: string;
  children: ReactNode;
  action?: ReactNode;
}) {
  return (
    <div
      role={tone === "danger" ? "alert" : "status"}
      className={cn(
        "flex flex-wrap items-center gap-x-4 gap-y-2 rounded-lg px-4 py-3 text-sm",
        tone === "danger" ? "bg-destructive/8" : "bg-muted",
      )}
    >
      <span
        aria-hidden
        className={cn(
          "size-2 shrink-0 rounded-full",
          tone === "danger" ? "bg-state-down" : "bg-state-idle",
        )}
      />
      <p className="min-w-0 flex-1">
        {title ? <span className="font-semibold">{title}. </span> : null}
        {children}
      </p>
      {action}
    </div>
  );
}
