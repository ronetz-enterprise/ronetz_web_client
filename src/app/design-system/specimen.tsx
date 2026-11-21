import * as React from "react";

import { cn } from "@/lib/utils";

/** Montre le même contenu en thème clair puis en thème sombre. */
export function Specimen({
  title,
  description,
  children,
  stack = false,
  id,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
  /** Un cadre sous l'autre (pour les contenus larges comme les tableaux). */
  stack?: boolean;
  id?: string;
}) {
  return (
    <section id={id} className="flex flex-col gap-4 scroll-mt-6">
      <div className="flex flex-col gap-1">
        <h2 className="text-xl font-semibold tracking-tight">{title}</h2>
        {description ? (
          <p className="max-w-prose text-sm text-muted-foreground">
            {description}
          </p>
        ) : null}
      </div>
      <div className={cn("grid gap-4", !stack && "lg:grid-cols-2")}>
        {(["light", "dark"] as const).map((theme) => (
          <div
            key={theme}
            data-theme={theme}
            className="min-w-0 rounded-xl border border-border bg-background p-4 text-foreground sm:p-5"
          >
            <p className="mb-4 font-mono text-xs tracking-wide text-muted-foreground uppercase">
              {theme === "light" ? "Clair" : "Sombre"}
            </p>
            {children}
          </div>
        ))}
      </div>
    </section>
  );
}

export function Row({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-wrap items-center gap-3", className)}>
      {children}
    </div>
  );
}

export function Caption({ children }: { children: React.ReactNode }) {
  return (
    <p className="mb-2 text-xs font-medium text-muted-foreground">{children}</p>
  );
}
