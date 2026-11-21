"use client";

import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { useEffect, type ReactNode } from "react";

import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { SessionRecovery } from "@/features/authentication/components/session-recovery";
import { useAuth } from "@/features/authentication/hooks/auth-provider";
import { ApiError } from "@/lib/api-error";
import { routes } from "@/lib/routes";
import { usePlatformSession } from "../api/platform";
import { AdminSessionProvider } from "./admin-session";
import { AdminShell } from "./admin-shell";

function Loading() {
  return (
    <div
      role="status"
      aria-label="Chargement"
      className="flex min-h-svh flex-col gap-4 p-8"
    >
      <Skeleton className="h-8 w-48" />
      <Skeleton className="h-4 w-80" />
      <Skeleton className="h-40 w-full max-w-3xl" />
    </div>
  );
}

/** Refus : message d'équipe, aucun contenu de la plateforme n'est affiché ni chargé. */
export function AdminForbidden({ retry }: { retry?: () => void }) {
  return (
    <main className="mx-auto flex min-h-svh max-w-md flex-col justify-center gap-4 p-6">
      <h1 className="text-2xl font-bold tracking-tight">Accès non autorisé</h1>
      <p role="alert" className="text-sm text-muted-foreground">
        Cette zone est réservée à l'équipe Ronetz.
      </p>
      <div className="flex flex-wrap gap-2">
        <Button
          nativeButton={false}
          render={<Link href={routes.dashboard()} />}
          className="h-11 md:h-9"
        >
          Retour à mon espace
        </Button>
        {retry ? (
          <Button variant="outline" className="h-11 md:h-9" onClick={retry}>
            Vérifier à nouveau
          </Button>
        ) : null}
      </div>
    </main>
  );
}

function AdminUnavailable({ retry }: { retry: () => void }) {
  return (
    <main className="mx-auto flex min-h-svh max-w-md flex-col justify-center gap-4 p-6">
      <h1 className="text-2xl font-bold tracking-tight">
        Administration indisponible
      </h1>
      <p role="alert" className="text-sm text-muted-foreground">
        Nous n'avons pas pu vérifier votre accès. Vérifiez votre connexion, puis
        réessayez.
      </p>
      <div>
        <Button className="h-11 md:h-9" onClick={retry}>
          Réessayer
        </Button>
      </div>
    </main>
  );
}

/** Décision pure, testable : que montrer selon la réponse de `/platform/session` ? */
export function gateOutcome(session: {
  isPending: boolean;
  isError: boolean;
  error: unknown;
}): "loading" | "forbidden" | "unavailable" | "granted" {
  if (session.isPending) return "loading";
  if (!session.isError) return "granted";
  const status = session.error instanceof ApiError ? session.error.status : 0;
  return status === 403 || status === 401 ? "forbidden" : "unavailable";
}

/**
 * Garde de l'administration : session ouverte, puis permission plateforme vérifiée par le
 * backend (`/api/platform/session`, 403 pour un compte ordinaire). L'administration n'a pas
 * d'organisation active. Les enfants ne sont montés qu'une fois la permission confirmée.
 */
export function AdminGate({ children }: { children: ReactNode }) {
  const auth = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const signedOut = auth.status === "anonymous" || auth.status === "expired";
  const session = usePlatformSession();

  useEffect(() => {
    if (signedOut)
      router.replace(
        routes.login() + "?returnTo=" + encodeURIComponent(pathname),
      );
  }, [signedOut, pathname, router]);

  if (auth.status === "unavailable") return <SessionRecovery />;
  if (auth.status === "initializing" || signedOut) return <Loading />;

  const outcome = gateOutcome(session);
  if (outcome === "loading") return <Loading />;
  if (outcome === "forbidden")
    return <AdminForbidden retry={() => void session.refetch()} />;
  if (outcome === "unavailable" || !session.data)
    return <AdminUnavailable retry={() => void session.refetch()} />;
  return (
    <AdminShell session={session.data}>
      <AdminSessionProvider session={session.data}>
        {children}
      </AdminSessionProvider>
    </AdminShell>
  );
}
