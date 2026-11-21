"use client";

import { useRouter } from "next/navigation";
import { useState, type ReactNode } from "react";
import { useAuth } from "@/features/authentication";
import { routes } from "@/lib/routes";

/** Question en tête : la première phrase en gras, la suite en gris (comme Stripe). */
export function OnboardingQuestion({
  title,
  children,
}: {
  title: string;
  children?: ReactNode;
}) {
  return (
    <h1 className="text-xl leading-8 font-normal text-pretty text-muted-foreground [text-wrap:pretty]">
      <span className="font-bold text-foreground">{title}</span>
      {children ? <> {children}</> : null}
    </h1>
  );
}

/** Corps centré de la carte : colonne étroite au milieu de l'espace disponible. */
export function OnboardingBody({ children }: { children: ReactNode }) {
  return (
    <div className="mx-auto my-auto w-full max-w-md space-y-6 px-6 py-12">
      {children}
    </div>
  );
}

/** Pied de la carte : un lien de retour à gauche, les boutons à droite. */
export function OnboardingFooter({
  back,
  children,
}: {
  back?: ReactNode;
  children?: ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-3 px-6 pb-6 sm:px-8 sm:pb-8">
      <div>{back}</div>
      <div className="flex items-center gap-3">{children}</div>
    </div>
  );
}

/** « ← Se déconnecter » : le seul retour possible depuis la première question. */
export function SignOutBack() {
  const auth = useAuth();
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  return (
    <button
      type="button"
      disabled={busy}
      className="text-sm font-medium text-primary hover:underline disabled:opacity-50"
      onClick={() => {
        setBusy(true);
        void auth
          .logout()
          .then((r) => router.replace(routes.login() + "?logout=" + r.server));
      }}
    >
      ← Se déconnecter
    </button>
  );
}
