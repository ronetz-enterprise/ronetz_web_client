"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { routes } from "@/lib/routes";
import { ApiError, toUserMessage } from "@/lib/api-error";

const labels: Record<string, string> = {
  MEMBERSHIP_SUSPENDED: "Votre accès est suspendu.",
  MEMBERSHIP_REVOKED: "Votre accès a été retiré.",
  ORGANIZATION_SUSPENDED: "Cette organisation est suspendue.",
  ORGANIZATION_CLOSED: "Cette organisation est fermée.",
};

export function OrganizationAccessNotice({
  error,
  retry,
}: {
  error?: unknown;
  retry?: () => void;
}) {
  const denied = error instanceof ApiError && [403, 404].includes(error.status);
  const code = error instanceof ApiError ? error.problem?.code : undefined;
  return (
    <section className="space-y-4">
      <h1 className="text-2xl font-semibold">
        {denied ? "Accès non autorisé" : "Accès non vérifié"}
      </h1>
      <p role="alert">
        {denied
          ? (code && labels[code]) ||
            "Cet espace n'est pas accessible avec votre compte."
          : toUserMessage(error)}
      </p>
      {retry && <Button onClick={retry}>Vérifier à nouveau</Button>}
      {error instanceof ApiError && error.correlationId && (
        <p className="text-xs text-muted-foreground">
          Référence : <code className="select-all">{error.correlationId}</code>
        </p>
      )}
      <Link className="block underline" href={routes.selectOrg()}>
        Mes organisations
      </Link>
      <Link className="block underline" href={routes.account()}>
        Mon compte
      </Link>
    </section>
  );
}
