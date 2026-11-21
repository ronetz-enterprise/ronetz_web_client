"use client";

import { useState } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Alert02Icon,
  CheckmarkCircle02Icon,
  Calendar03Icon,
  Cancel01Icon,
  Clock01Icon,
  DashboardSpeed01Icon,
  Flag02Icon,
  Location01Icon,
  PauseIcon,
  PlayIcon,
  Store01Icon,
  Tag01Icon,
  UserIcon,
} from "@hugeicons/core-free-icons";

import { StatusPill } from "@/components/patterns/row-card-list";
import {
  CopyId,
  DetailJourney,
  DetailPage,
  DetailSection,
  type DetailProperty,
  type DetailStep,
} from "@/components/patterns/detail-page";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { routes } from "@/lib/routes";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { useOrganization } from "@/features/organizations/hooks/organization-context";
import { formatInstant, policyLines } from "../formatters/access";
import { accessErrorMessage } from "../formatters/errors";
import { useAccessChanges } from "../mutations/access-changes";
import {
  accessDisplayState,
  accessSourceLabels,
  accessSubjectLabels,
  accessGrantLabel,
  activationGuidance,
  validityUsage,
  type AccessGrant,
} from "../model/access-grant";
import { accessPermissions } from "../permissions/access-permissions";
import { useAccessGrant, useAccessSites } from "../queries/access-grants";
import { toneToRow } from "./tone";

type Confirm = "suspend" | "revoke" | null;

/** Détail d'un accès : état, consigne, conditions, actions avec confirmation dans le panneau. */
export function AccessDetailPanel({
  accessGrantId,
}: {
  accessGrantId: string;
}) {
  const grantQuery = useAccessGrant(accessGrantId);
  const sites = useAccessSites();
  if (grantQuery.isPending)
    return (
      <div
        role="status"
        aria-label="Chargement en cours"
        className="flex flex-col gap-4"
      >
        <Skeleton className="h-7 w-48" />
        <Skeleton className="h-20" />
        <Skeleton className="h-40" />
      </div>
    );
  if (grantQuery.isError || !grantQuery.data)
    return (
      <div role="alert" className="flex flex-col gap-3">
        <p className="text-sm">
          {accessErrorMessage(grantQuery.error, "read")}
        </p>
        <Button
          variant="outline"
          className="h-11 w-fit sm:h-9"
          onClick={() => void grantQuery.refetch()}
        >
          Réessayer
        </Button>
      </div>
    );
  const siteName =
    sites.data?.find((s) => s.id === grantQuery.data.siteId)?.name ?? null;
  return <Loaded grant={grantQuery.data} siteName={siteName} />;
}

function Loaded({
  grant,
  siteName,
}: {
  grant: AccessGrant;
  siteName: string | null;
}) {
  const { membership } = useOrganization();
  const permissions = accessPermissions(membership, grant);
  const changes = useAccessChanges();
  const [confirm, setConfirm] = useState<Confirm>(null);
  const [error, setError] = useState<string | null>(null);
  const display = accessDisplayState(grant);
  const guidance = activationGuidance(grant);
  const usage = validityUsage(grant);

  async function run(
    transition: "suspend" | "resume" | "revoke" | "retryProjection",
  ) {
    setError(null);
    try {
      await changes.change({ transition, accessGrantId: grant.accessGrantId });
      setConfirm(null);
    } catch (failure) {
      setConfirm(null);
      setError(accessErrorMessage(failure, "change"));
    }
  }

  const pct = usage ? Math.round((usage.elapsed / usage.total) * 100) : null;
  const ended =
    grant.status !== "ACTIVE" ||
    (grant.expiresAt !== null && new Date(grant.expiresAt) <= new Date());
  const policy = policyLines(grant.policy);
  const properties: DetailProperty[] = [
    {
      icon: Tag01Icon,
      label: "État",
      value: (
        <StatusPill label={display.label} tone={toneToRow(display.tone)} />
      ),
    },
    {
      icon: UserIcon,
      label: "Identifiant",
      value: grant.username ? (
        <CopyId value={grant.username} label="l’identifiant" />
      ) : (
        "En préparation"
      ),
    },
    { icon: Location01Icon, label: "Site", value: siteName ?? "—" },
    {
      icon: Clock01Icon,
      label: "Temps restant",
      value:
        usage && !ended ? (
          <span className="flex items-center gap-3">
            <Progress
              value={pct ?? 0}
              aria-label="Temps écoulé"
              className="w-24 [&_[data-slot=progress-indicator]]:bg-foreground"
            />
            <span className="tabular-nums">{100 - (pct ?? 0)} %</span>
          </span>
        ) : (
          "Terminé"
        ),
    },
    {
      icon: Calendar03Icon,
      label: "Période",
      value: `${formatInstant(grant.activatedAt ?? grant.issuedAt)} → ${formatInstant(grant.expiresAt)}`,
    },
    {
      icon: Store01Icon,
      label: "Origine",
      value: `${accessGrantLabel(accessSourceLabels, grant.sourceType)} · ${accessGrantLabel(accessSubjectLabels, grant.subjectType)}`,
    },
  ];
  const steps: DetailStep[] = [
    {
      icon: CheckmarkCircle02Icon,
      label: "Accès créé",
      at: formatInstant(grant.issuedAt),
      state: "done",
    },
    {
      icon: PlayIcon,
      label: "Début du temps",
      at: formatInstant(grant.activatedAt ?? grant.issuedAt),
      state: "done",
    },
    ...(grant.suspendedAt && grant.status === "SUSPENDED"
      ? [
          {
            icon: PauseIcon,
            label: "Accès suspendu",
            at: formatInstant(grant.suspendedAt),
            state: "now" as const,
          },
        ]
      : []),
    ...(grant.revokedAt
      ? [
          {
            icon: Cancel01Icon,
            label: "Accès annulé",
            at: formatInstant(grant.revokedAt),
            state: "done" as const,
          },
        ]
      : [
          {
            icon: Flag02Icon,
            label: ended ? "Temps écoulé" : "Fin prévue",
            at: formatInstant(grant.expiresAt),
            state: ended ? ("done" as const) : ("next" as const),
          },
        ]),
  ];

  return (
    <DetailPage
      back={{ href: routes.access(), label: "Accès" }}
      title={
        grant.username ? (
          <span className="font-mono tracking-tight">{grant.username}</span>
        ) : (
          `Accès ${policy[0]?.value ?? ""}`.trim()
        )
      }
      properties={properties}
      actions={
        <>
          {permissions.canRetryProvisioning ? (
            <Button
              size="sm"
              disabled={changes.pending}
              onClick={() => void run("retryProjection")}
            >
              Relancer l’activation
            </Button>
          ) : null}
          {permissions.canResumeAccess ? (
            <Button
              size="sm"
              disabled={changes.pending}
              onClick={() => void run("resume")}
            >
              Reprendre
            </Button>
          ) : null}
          {permissions.canSuspendAccess ? (
            <Button
              size="sm"
              variant="outline"
              disabled={changes.pending}
              onClick={() => setConfirm("suspend")}
            >
              Suspendre
            </Button>
          ) : null}
          {permissions.canRevokeAccess ? (
            <Button
              size="sm"
              variant="outline"
              className="text-destructive"
              disabled={changes.pending}
              onClick={() => setConfirm("revoke")}
            >
              Annuler l’accès
            </Button>
          ) : null}
        </>
      }
      banner={
        <>
          {error ? (
            <Alert variant="destructive" role="alert">
              <HugeiconsIcon icon={Alert02Icon} strokeWidth={2} aria-hidden />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          ) : null}
          {guidance ? (
            <Alert
              variant={guidance.tone === "danger" ? "destructive" : "default"}
              aria-live="polite"
            >
              <HugeiconsIcon
                icon={
                  guidance.tone === "success"
                    ? CheckmarkCircle02Icon
                    : guidance.tone === "danger"
                      ? Alert02Icon
                      : Clock01Icon
                }
                strokeWidth={2}
                aria-hidden
              />
              <AlertTitle>{guidance.title}</AlertTitle>
              <AlertDescription>{guidance.body}</AlertDescription>
            </Alert>
          ) : null}
        </>
      }
    >
      <DetailSection title="Parcours de l’accès" icon={Clock01Icon}>
        <DetailJourney steps={steps} />
        <p className="max-w-xl text-sm text-muted-foreground">
          Le temps compte depuis la création de l’accès, que le client soit
          connecté ou non. Le mot de passe n’est montré qu’une fois, à la
          création.
        </p>
      </DetailSection>

      <DetailSection title="Conditions" icon={DashboardSpeed01Icon}>
        <dl className="flex w-full flex-col">
          {policy.map((l) => (
            <div
              key={l.label}
              className="flex items-baseline justify-between gap-4 border-b border-border py-2.5 text-sm last:border-b-0"
            >
              <dt className="text-muted-foreground">{l.label}</dt>
              <dd className="font-medium">{l.value}</dd>
            </div>
          ))}
        </dl>
      </DetailSection>

      <AlertDialog
        open={confirm !== null}
        onOpenChange={(o) => {
          if (!o && !changes.pending) setConfirm(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {confirm === "revoke"
                ? `Annuler l’accès ${grant.username ?? ""} ?`
                : `Suspendre l’accès ${grant.username ?? ""} ?`}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {confirm === "revoke"
                ? "Le client est déconnecté et l’accès ne pourra plus jamais servir. Cette action ne peut pas être défaite."
                : "Le client est déconnecté et ne peut plus se connecter. Vous pourrez reprendre l’accès plus tard ; le temps continue de s’écouler pendant la suspension."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={changes.pending}>
              Non, garder
            </AlertDialogCancel>
            <Button
              variant={confirm === "revoke" ? "destructive" : "default"}
              disabled={changes.pending}
              onClick={() => confirm && void run(confirm)}
            >
              {changes.pending
                ? "En cours…"
                : confirm === "revoke"
                  ? "Oui, annuler l’accès"
                  : "Oui, suspendre"}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DetailPage>
  );
}
