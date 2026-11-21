import type { ReactNode } from "react";

/**
 * Carte de connexion : 420 px, ombre douce et contour très léger, titre 24 px, champs pleine largeur ;
 * le pied (« Nouveau sur Ronetz ? Créer un compte ») est séparé par un simple filet.
 */
export function AuthCard({
  title,
  children,
  footer,
}: {
  title: string;
  children: ReactNode;
  footer?: ReactNode;
}) {
  return (
    <div className="w-full max-w-[420px] overflow-hidden rounded-xl bg-background shadow-[0_1px_2px_rgb(0_0_0/0.04),0_16px_40px_-16px_rgb(0_0_0/0.22)] ring-1 ring-black/5 dark:ring-white/10">
      <div className="flex flex-col gap-5 px-6 py-8 sm:px-9 sm:py-9 [&_[data-slot=input]]:h-11 sm:[&_[data-slot=input]]:h-9 [&_button[type=submit]]:h-11 [&_button[type=submit]]:w-full sm:[&_button[type=submit]]:h-9">
        <h1 className="text-2xl leading-8 font-semibold tracking-tight">
          {title}
        </h1>
        {children}
      </div>
      {footer ? (
        <div className="border-t border-border px-6 py-4 text-center text-sm text-muted-foreground">
          {footer}
        </div>
      ) : null}
    </div>
  );
}
