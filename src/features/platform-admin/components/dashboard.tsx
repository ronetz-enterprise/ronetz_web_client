"use client";

import Link from "next/link";

import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from "@/components/ui/empty";
import { Skeleton } from "@/components/ui/skeleton";
import {
  formatDateTime,
  formatNumber,
  formatPercent,
  formatRelative,
} from "@/lib/format";
import { routes } from "@/lib/routes";
import {
  usePaymentAnomalies,
  usePlatformDashboard,
  usePlatformWithdrawals,
} from "../api/platform";
import {
  actionStatusLabels,
  actionStatusTones,
  actionTypeLabels,
  currencyLabel,
  label,
  platformCapabilities,
  type AdministrativeAction,
  type PlatformSession,
} from "../model/platform";
import { Amount } from "@/components/amount";
import {
  Hint,
  InlineError,
  NoPermission,
  Section,
  Stat,
  ToneBadge,
} from "./parts";
import { consolidatedHint } from "../model/platform";

function Bar({
  title,
  segments,
}: {
  title: string;
  segments: { label: string; value: number; className: string }[];
}) {
  const total = segments.reduce((n, s) => n + s.value, 0);
  return (
    <div className="flex flex-col gap-2.5 rounded-lg border border-border bg-card p-3.5">
      <p className="flex items-baseline justify-between text-sm">
        <span className="font-medium">{title}</span>
        <span className="tnum text-muted-foreground">
          {formatNumber(total)}
        </span>
      </p>
      <div
        role="img"
        aria-label={`${title} : ${segments.map((s) => `${s.label} ${s.value}`).join(", ")}`}
        className="flex h-2 overflow-hidden rounded-full bg-muted"
      >
        {total > 0
          ? segments.map((s) => (
              <div
                key={s.label}
                className={s.className}
                style={{ width: `${(s.value / total) * 100}%` }}
              />
            ))
          : null}
      </div>
      <ul className="flex flex-wrap gap-x-4 gap-y-1 text-xs">
        {segments.map((s) => (
          <li key={s.label} className="flex items-center gap-1.5">
            <span
              aria-hidden
              className={`size-2 rounded-full ${s.className}`}
            />
            <span className="text-muted-foreground">{s.label}</span>
            <span className="tnum font-medium">{formatNumber(s.value)}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function ActionRow({ action }: { action: AdministrativeAction }) {
  return (
    <li className="flex flex-col gap-1 py-3">
      <div className="flex items-baseline justify-between gap-3">
        <span className="min-w-0 truncate text-sm font-medium">
          {label(actionTypeLabels, action.actionType)}
        </span>
        <span className="shrink-0 text-xs text-muted-foreground">
          {formatRelative(action.requestedAt)}
        </span>
      </div>
      <div className="flex items-center justify-between gap-3">
        <span className="min-w-0 truncate text-xs text-muted-foreground">
          {action.reason ?? "Sans motif"}
          {action.organizationId ? (
            <>
              {" · "}
              <Link
                className="underline underline-offset-4"
                href={routes.adminOrg(action.organizationId)}
              >
                Voir l'organisation
              </Link>
            </>
          ) : null}
        </span>
        <ToneBadge tone={actionStatusTones[action.status] ?? "neutral"}>
          {label(actionStatusLabels, action.status)}
        </ToneBadge>
      </div>
    </li>
  );
}

function ToDecide({ session }: { session: PlatformSession }) {
  const withdrawals = usePlatformWithdrawals(session, "PENDING_APPROVAL", 0);
  const anomalies = usePaymentAnomalies(session);
  const pending = withdrawals.data?.totalElements;
  const open = anomalies.data?.filter((a) => a.status !== "RESOLVED").length;
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <Link
        href={routes.adminFinance()}
        className="rounded-lg outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
      >
        <Stat
          label="Retraits à décider"
          value={pending === undefined ? "—" : formatNumber(pending)}
          context={
            withdrawals.isError
              ? "Lecture impossible pour le moment"
              : pending
                ? "En attente d'une décision"
                : "Aucune demande en attente"
          }
          tone={pending ? "warning" : undefined}
        />
      </Link>
      <Link
        href={routes.adminFinance() + "?onglet=anomalies"}
        className="rounded-lg outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
      >
        <Stat
          label="Paiements à vérifier"
          value={open === undefined ? "—" : formatNumber(open)}
          context={
            anomalies.isError
              ? "Lecture impossible pour le moment"
              : open
                ? "Anomalies non résolues"
                : "Aucune anomalie ouverte"
          }
          tone={open ? "danger" : undefined}
        />
      </Link>
    </div>
  );
}

export function PlatformDashboardPage({
  session,
}: {
  session: PlatformSession;
}) {
  const capabilities = platformCapabilities(session);
  const dashboard = usePlatformDashboard(session);

  if (!capabilities.canViewPlatform)
    return (
      <>
        <PageHeader title="Tableau de bord" />
        <NoPermission area="Le tableau de bord" />
      </>
    );

  const header = (
    <PageHeader
      title="Tableau de bord"
      description={
        dashboard.data
          ? `Vue d'ensemble de la plateforme, lue le ${formatDateTime(dashboard.data.generatedAt)}.`
          : "Vue d'ensemble de la plateforme."
      }
      actions={
        capabilities.canReadAudit ? (
          <Button
            variant="outline"
            className="h-11 md:h-9"
            nativeButton={false}
            render={<Link href={routes.adminAudit()} />}
          >
            Voir le journal
          </Button>
        ) : null
      }
    />
  );

  if (dashboard.isPending)
    return (
      <>
        {header}
        <div
          role="status"
          aria-label="Chargement en cours"
          className="flex flex-col gap-3"
        >
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {Array.from({ length: 4 }, (_, i) => (
              <Skeleton key={i} className="h-24 rounded-lg" />
            ))}
          </div>
          <Skeleton className="h-40 rounded-lg" />
        </div>
      </>
    );
  if (dashboard.isError)
    return (
      <>
        {header}
        <InlineError
          error={dashboard.error}
          retry={() => void dashboard.refetch()}
          title="Le tableau de bord n'a pas pu être chargé"
        />
      </>
    );

  const { live, projected, recentActions } = dashboard.data;
  const mixed = projected.mixedCurrencies ?? [];
  const comparable = projected.grossRevenue !== null;
  const consolidated = projected.dataLastUpdatedAt
    ? `Mis à jour le ${formatDateTime(projected.dataLastUpdatedAt)}`
    : "Pas encore calculé";

  return (
    <div className="flex flex-col gap-8">
      {header}

      <Section title="À décider">
        <ToDecide session={session} />
      </Section>

      <Section
        title="En ce moment"
        description="Compté à l'instant de la lecture."
      >
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <Stat
            label="Organisations actives"
            value={formatNumber(live.activeOrganizations)}
            context={`sur ${formatNumber(live.organizations)}`}
          />
          <Stat
            label="Sites actifs"
            value={formatNumber(live.activeSites)}
            context={`sur ${formatNumber(live.sites)}`}
          />
          <Stat
            label="Routeurs en ligne"
            value={formatNumber(live.routersOnline)}
            context={`sur ${formatNumber(live.routers)} installés`}
          />
          <Stat
            label="Routeurs hors ligne"
            value={formatNumber(live.routersOffline)}
            context="À surveiller"
            tone={live.routersOffline ? "warning" : undefined}
          />
        </div>
        <div className="grid gap-3 lg:grid-cols-2">
          <Bar
            title="Organisations"
            segments={[
              {
                label: "Actives",
                value: live.activeOrganizations,
                className: "bg-success-emphasized",
              },
              {
                label: "Suspendues",
                value: live.suspendedOrganizations,
                className: "bg-warning-emphasized",
              },
              {
                label: "Fermées",
                value: live.closedOrganizations,
                className: "bg-muted-foreground/40",
              },
            ]}
          />
          <Bar
            title="Routeurs"
            segments={[
              {
                label: "En ligne",
                value: live.routersOnline,
                className: "bg-success-emphasized",
              },
              {
                label: "Hors ligne",
                value: live.routersOffline,
                className: "bg-danger-emphasized",
              },
              {
                label: "Pas de nouvelles",
                value: live.routersUnknownConnectivity,
                className: "bg-muted-foreground/40",
              },
            ]}
          />
        </div>
      </Section>

      <Section
        title="Activité commerciale"
        description="Chiffres consolidés"
        actions={
          <span className="text-xs text-muted-foreground">
            <Hint term={consolidatedHint}>{consolidated}</Hint>
          </span>
        }
      >
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <Stat
            label="Ventes cumulées"
            value={
              comparable && projected.grossRevenue !== null ? (
                <Amount
                  value={projected.grossRevenue}
                  currency={currencyLabel(projected.currency ?? "XOF")}
                />
              ) : (
                "Non comparable"
              )
            }
            context={
              comparable
                ? `Devise : ${currencyLabel(projected.currency ?? "")}`
                : mixed.length > 0
                  ? `Plusieurs devises (${mixed.map(currencyLabel).join(", ")}) : le total n'est pas additionné`
                  : "Aucune vente consolidée"
            }
          />
          <Stat label="Achats" value={formatNumber(projected.purchases)} />
          <Stat
            label="Paiements confirmés"
            value={formatNumber(projected.confirmedPayments)}
            context={
              projected.purchases
                ? `${formatPercent(projected.confirmedPayments / projected.purchases)} des achats`
                : undefined
            }
          />
          <Stat
            label="Accès actifs"
            value={formatNumber(projected.activeAccesses)}
          />
        </div>
      </Section>

      <Section
        title="Dernières actions de l'équipe"
        description="Chaque action est inscrite au journal avec son motif."
      >
        {recentActions.length === 0 ? (
          <Empty className="border">
            <EmptyHeader>
              <EmptyTitle>Aucune action récente</EmptyTitle>
              <EmptyDescription>
                Les suspensions, réactivations et décisions apparaîtront ici.
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
        ) : (
          <ul
            aria-label="Dernières actions"
            className="divide-y divide-border border-y border-border"
          >
            {recentActions.map((action) => (
              <ActionRow key={action.id} action={action} />
            ))}
          </ul>
        )}
      </Section>
    </div>
  );
}
