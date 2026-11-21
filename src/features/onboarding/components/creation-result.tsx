"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useQueryClient } from "@tanstack/react-query";
import { useMembershipAccess, membershipKeys } from "@/features/memberships";
import { OrganizationAccessNotice } from "@/features/organizations";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { routes } from "@/lib/routes";
import { ApiError } from "@/lib/api-error";
import { useCreationAttempt } from "../hooks/onboarding-provider";

function SuccessMoment({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section
      role="status"
      className="flex flex-col items-start gap-4 rounded-xl border bg-background p-5 sm:flex-row sm:items-center"
    >
      <span
        aria-hidden="true"
        className="flex size-10 shrink-0 items-center justify-center rounded-full bg-success text-success-foreground motion-safe:animate-in motion-safe:zoom-in-75 motion-safe:duration-300"
      >
        ✓
      </span>
      <div className="min-w-0 flex-1 space-y-0.5">
        <p className="font-heading text-base font-semibold">{title}</p>
        <div className="text-sm text-muted-foreground">{children}</div>
      </div>
    </section>
  );
}

export function CreationResult() {
  const attempt = useCreationAttempt();
  if (attempt.status === "created" && attempt.organization)
    return (
      <ConfirmOwner
        id={attempt.organization.id}
        name={attempt.organization.name}
      />
    );
  if (attempt.status === "creating")
    return (
      <div className="space-y-4">
        <h1 className="font-heading text-xl font-semibold">
          Vérification de la création en cours
        </h1>
        <Skeleton className="h-24 w-full" />
      </div>
    );
  const code =
    attempt.error instanceof ApiError ? attempt.error.problem?.code : undefined;
  const terminal =
    code === "IDEMPOTENCY_CONFLICT" ||
    code === "IDEMPOTENCY_KEY_EXPIRED" ||
    !attempt.intention;
  return (
    <section className="space-y-4">
      <h1 className="font-heading text-xl font-semibold">
        Résultat de création inconnu
      </h1>
      <p role="alert">
        {terminal
          ? "La création nécessite une vérification auprès de votre administrateur. Ne créez pas de nouvelle demande pour la même organisation."
          : "La demande a peut-être abouti. Vérifiez son résultat sans créer de doublon."}
      </p>
      {!terminal && (
        <Button onClick={() => void attempt.recover()}>
          Réessayer la vérification
        </Button>
      )}
      {attempt.storageUnavailable && (
        <p role="alert">
          La reprise après fermeture du navigateur n'a pas pu être enregistrée.
          Gardez cette page ouverte et contactez votre administrateur si
          nécessaire.
        </p>
      )}
      {attempt.error instanceof ApiError && attempt.error.correlationId && (
        <p className="text-xs text-muted-foreground">
          Référence :{" "}
          <code className="select-all">{attempt.error.correlationId}</code>
        </p>
      )}
    </section>
  );
}

function ConfirmOwner({ id, name }: { id: string; name?: string }) {
  const query = useMembershipAccess(id);
  const client = useQueryClient();

  useEffect(() => {
    if (query.isSuccess && !query.isFetching)
      void client.invalidateQueries({ queryKey: membershipKeys.mine });
  }, [query.isSuccess, query.isFetching, client]);

  if (query.isPending || query.isFetching)
    return <Skeleton className="h-24 w-full" />;

  if (query.isError)
    return (
      <OrganizationAccessNotice
        error={query.error}
        retry={() => void query.refetch()}
      />
    );

  if (query.data.role !== "OWNER") return <OrganizationAccessNotice />;

  return (
    <div className="space-y-6">
      <SuccessMoment title="Organisation créée">
        {name ? (
          <>
            <strong className="font-medium">{name}</strong> est prête.
          </>
        ) : (
          "Votre organisation est prête."
        )}{" "}
        Prochaine étape : ajouter votre premier site.
      </SuccessMoment>
      <Button
        className="h-11 w-full sm:h-10"
        render={<Link href={routes.dashboard()} />}
      >
        Continuer
      </Button>
    </div>
  );
}
