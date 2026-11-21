"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { usePrincipal } from "@/features/identity";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { routes } from "@/lib/routes";
import { ApiError, toUserMessage } from "@/lib/api-error";
import { useAuth } from "../hooks/auth-provider";

function StatusDot({
  label,
  tone,
}: {
  label: string;
  tone: "success" | "neutral";
}) {
  const color =
    tone === "success" ? "bg-success-emphasized" : "bg-muted-foreground";
  return (
    <span className="flex items-center gap-1.5 text-sm">
      <span aria-hidden="true" className={`size-2 rounded-full ${color}`} />
      {label}
    </span>
  );
}

/**
 * Compte : identité vérifiée par le serveur et session courante.
 */
export function AccountOverview() {
  const auth = useAuth();
  const principal = usePrincipal();
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  function logout() {
    if (busy) return;
    setBusy(true);
    void auth
      .logout()
      .then((result) =>
        router.replace(routes.login() + "?logout=" + result.server),
      );
  }

  if (principal.isPending) return <Skeleton className="h-40 w-full" />;
  if (principal.isError)
    return (
      <Alert variant="destructive">
        <AlertDescription>
          {toUserMessage(principal.error)}{" "}
          <button
            type="button"
            className="underline underline-offset-4"
            onClick={() => void principal.refetch()}
          >
            Réessayer
          </button>
          {principal.error instanceof ApiError &&
            principal.error.correlationId && (
              <p className="mt-1 text-xs">
                Référence :{" "}
                <code className="select-all">
                  {principal.error.correlationId}
                </code>
              </p>
            )}
        </AlertDescription>
      </Alert>
    );

  const me = principal.data;
  const name = `${me.firstName} ${me.lastName}`.trim();

  return (
    <div className="space-y-6">
      <section aria-labelledby="account-identity" className="space-y-3">
        <div className="flex items-center gap-3">
          <Avatar className="size-12" aria-hidden="true">
            <AvatarFallback className="bg-muted font-medium text-foreground">
              {`${me.firstName.charAt(0)}${me.lastName.charAt(0)}`.toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <h2
              id="account-identity"
              className="font-heading text-base font-semibold break-words"
            >
              {name || me.email}
            </h2>
            <p className="text-sm break-all text-muted-foreground">
              {me.email}
            </p>
          </div>
        </div>
        <dl className="divide-y text-sm">
          <div className="flex justify-between gap-4 py-2.5">
            <dt className="text-muted-foreground">Statut</dt>
            <dd>
              <StatusDot label="Compte actif" tone="success" />
            </dd>
          </div>
          {me.platformAdmin && (
            <div className="flex justify-between gap-4 py-2.5">
              <dt className="text-muted-foreground">Rôle</dt>
              <dd>Administration Ronetz</dd>
            </div>
          )}
          <div className="flex flex-wrap justify-between gap-4 py-2.5">
            <dt className="text-muted-foreground">Identifiant</dt>
            <dd className="break-all font-mono text-xs select-all">
              {me.userId}
            </dd>
          </div>
        </dl>
      </section>
      <section aria-labelledby="account-sessions" className="space-y-3">
        <h2
          id="account-sessions"
          className="font-heading text-sm font-semibold"
        >
          Sessions
        </h2>
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border p-3">
          <div className="space-y-0.5">
            <StatusDot label="Cet appareil" tone="success" />
            <p className="text-xs text-muted-foreground">
              Session en cours, vérifiée auprès du serveur.
            </p>
          </div>
          <Button variant="outline" size="sm" disabled={busy} onClick={logout}>
            {busy ? "Déconnexion…" : "Se déconnecter"}
          </Button>
        </div>
        <Alert>
          <AlertTitle>Autres appareils</AlertTitle>
          <AlertDescription>
            La liste des sessions ouvertes et la déconnexion des autres
            appareils ne sont pas encore disponibles.
          </AlertDescription>
        </Alert>
      </section>
      <Link
        className="inline-block text-sm underline underline-offset-4"
        href={routes.selectOrg()}
      >
        Mes organisations
      </Link>
    </div>
  );
}
