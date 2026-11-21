"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

import { PageHeader } from "@/components/page-header";
import {
  RowCardList,
  RowCardPagination,
  RowCardToolbar,
  type RowCardGroup,
} from "@/components/patterns/row-card-list";
import { SplitView } from "@/components/patterns/split-view";
import { Button } from "@/components/ui/button";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from "@/components/ui/empty";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDate, formatDateTime, formatNumber } from "@/lib/format";
import { routes } from "@/lib/routes";
import {
  useOrganizationAction,
  usePlatformOrganization,
  usePlatformOrganizations,
} from "../api/platform";
import {
  auditActionLabels,
  auditResultLabels,
  auditResultTones,
  label,
  organizationActionCopy,
  organizationActions,
  organizationStatusLabels,
  organizationStatusTones,
  platformCapabilities,
  siteStatusLabels,
  type OrganizationAction,
  type PlatformOrganization,
  type PlatformSession,
} from "../model/platform";
import { DecisionPanel } from "./decision-panel";
import { Facts, InlineError, NoPermission, Section, ToneBadge } from "./parts";
import { readChoice, readPage, useUrlState } from "./use-url-state";

const PAGE_SIZE = 20;
const STATUS_CHIPS = [
  { value: "ALL", label: "Toutes" },
  { value: "ACTIVE", label: "Actives" },
  { value: "SUSPENDED", label: "Suspendues" },
  { value: "CLOSED", label: "Fermées" },
];

/** Fiche d'une organisation dans le panneau, avec ses actions sensibles confirmées sur place. */
function OrganizationPanel({
  session,
  organizationId,
}: {
  session: PlatformSession;
  organizationId: string;
}) {
  const capabilities = platformCapabilities(session);
  const detail = usePlatformOrganization(session, organizationId);
  const mutation = useOrganizationAction();
  const [pending, setPending] = useState<OrganizationAction | null>(null);

  // Une fiche différente repart sans action en cours.
  const [shownId, setShownId] = useState(organizationId);
  if (shownId !== organizationId) {
    setShownId(organizationId);
    setPending(null);
  }
  const resetMutation = mutation.reset;
  useEffect(() => {
    resetMutation();
  }, [organizationId, resetMutation]);

  if (detail.isPending)
    return (
      <div
        role="status"
        aria-label="Chargement en cours"
        className="flex flex-col gap-3"
      >
        <Skeleton className="h-7 w-48" />
        <Skeleton className="h-5 w-24" />
        <Skeleton className="h-40 rounded-lg" />
      </div>
    );
  if (detail.isError)
    return (
      <InlineError
        error={detail.error}
        retry={() => void detail.refetch()}
        title="Cette fiche n'a pas pu être chargée"
      />
    );

  const org = detail.data;
  const actions = organizationActions(org, capabilities);
  const copy = pending ? organizationActionCopy[pending] : null;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <h2 className="text-xl font-semibold">{org.name}</h2>
        <div>
          <ToneBadge tone={organizationStatusTones[org.status]}>
            {organizationStatusLabels[org.status]}
          </ToneBadge>
        </div>
      </div>

      {org.suspensionReason ? (
        <p className="rounded-md border border-warning-border bg-warning p-3 text-sm text-warning-foreground">
          Motif de la suspension : {org.suspensionReason}
        </p>
      ) : null}

      {pending && copy ? (
        <DecisionPanel
          title={copy.title}
          consequences={copy.consequences}
          submitLabel={copy.submit}
          irreversible={copy.irreversible}
          busy={mutation.isPending}
          error={mutation.error}
          summary={
            <p className="text-sm">
              Organisation : <strong>{org.name}</strong>
            </p>
          }
          onCancel={() => {
            mutation.reset();
            setPending(null);
          }}
          onSubmit={(reason) =>
            mutation.mutate(
              { organizationId: org.id, action: pending, reason },
              {
                onSuccess: () => {
                  toast.success(
                    pending === "suspend"
                      ? "Organisation suspendue."
                      : pending === "reactivate"
                        ? "Organisation réactivée."
                        : "Organisation fermée.",
                  );
                  setPending(null);
                },
              },
            )
          }
        />
      ) : actions.length > 0 ? (
        <div className="flex flex-wrap gap-2">
          {actions.map((action) => (
            <Button
              key={action}
              variant={
                action === "close"
                  ? "outline"
                  : action === "suspend"
                    ? "outline"
                    : "default"
              }
              className="h-11 md:h-9"
              onClick={() => setPending(action)}
            >
              {organizationActionCopy[action].title}
            </Button>
          ))}
        </div>
      ) : org.status === "CLOSED" ? (
        <p className="text-sm text-muted-foreground">
          Cette organisation est fermée : plus aucune action n'est possible.
        </p>
      ) : null}

      <Facts
        rows={[
          [
            "Monnaie",
            org.currency === "XAF" || org.currency === "XOF"
              ? "FCFA"
              : org.currency,
          ],
          ["Créée le", formatDateTime(org.createdAt)],
          [
            "Suspendue le",
            org.suspendedAt ? formatDateTime(org.suspendedAt) : "Jamais",
          ],
          ...(org.closedAt
            ? ([["Fermée le", formatDateTime(org.closedAt)]] as [
                string,
                string,
              ][])
            : []),
          ["Sites", formatNumber(org.sites.length)],
          [
            "Routeurs en ligne",
            `${formatNumber(org.routers.online)} sur ${formatNumber(org.routers.total)}`,
          ],
          ["Routeurs hors ligne", formatNumber(org.routers.offline)],
        ]}
      />

      <div className="flex flex-wrap gap-2">
        {capabilities.canReadNetwork ? (
          <Button
            variant="outline"
            className="h-11 md:h-9"
            nativeButton={false}
            render={
              <Link href={`${routes.adminNetwork()}?organisation=${org.id}`} />
            }
          >
            Voir son réseau
          </Button>
        ) : null}
        {capabilities.canReadAudit ? (
          <Button
            variant="outline"
            className="h-11 md:h-9"
            nativeButton={false}
            render={
              <Link href={`${routes.adminAudit()}?organisation=${org.id}`} />
            }
          >
            Voir son journal
          </Button>
        ) : null}
      </div>

      <Section title="Sites">
        {org.sites.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Aucun site pour le moment.
          </p>
        ) : (
          <ul className="divide-y divide-border border-y border-border">
            {org.sites.map((site) => (
              <li
                key={site.id}
                className="flex items-center justify-between gap-3 py-2.5 text-sm"
              >
                <span className="min-w-0">
                  <span className="block truncate font-medium">
                    {site.name}
                  </span>
                  <span className="block truncate text-xs text-muted-foreground">
                    {site.city}
                  </span>
                </span>
                <ToneBadge tone={organizationStatusTones[site.status]}>
                  {siteStatusLabels[site.status]}
                </ToneBadge>
              </li>
            ))}
          </ul>
        )}
      </Section>

      <Section title="Derniers événements">
        {org.recentAuditEntries.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Rien n'a encore été enregistré.
          </p>
        ) : (
          <ul className="divide-y divide-border border-y border-border">
            {org.recentAuditEntries.map((entry) => (
              <li
                key={entry.id}
                className="flex flex-col gap-0.5 py-2.5 text-sm"
              >
                <span className="flex items-baseline justify-between gap-3">
                  <span className="min-w-0 truncate font-medium">
                    {label(auditActionLabels, entry.action)}
                  </span>
                  <span className="shrink-0 text-xs text-muted-foreground">
                    {formatDate(entry.occurredAt)}
                  </span>
                </span>
                <span className="text-xs">
                  <ToneBadge tone={auditResultTones[entry.result] ?? "neutral"}>
                    {label(auditResultLabels, entry.result)}
                  </ToneBadge>
                </span>
              </li>
            ))}
          </ul>
        )}
      </Section>
    </div>
  );
}

/**
 * Liste des organisations (cartes-lignes, recherche par nom, filtre d'état) et fiche dans le
 * panneau latéral. La fiche est portée par l'adresse `/admin/organizations/<id>` ; les filtres
 * et la page restent dans la chaîne de requête.
 */
export function OrganizationsPage({
  session,
  selectedId,
}: {
  session: PlatformSession;
  selectedId: string | null;
}) {
  const capabilities = platformCapabilities(session);
  const router = useRouter();
  const search = useSearchParams();
  const { update } = useUrlState();

  const status = readChoice(
    search.get("statut"),
    STATUS_CHIPS.map((c) => c.value),
    "ALL",
  );
  const query = search.get("q") ?? "";
  const page = readPage(search.get("page"));
  const [text, setText] = useState(query);

  // La recherche est envoyée après une courte pause : une requête par frappe serait inutile.
  useEffect(() => {
    if (text === query) return;
    const timer = setTimeout(() => update({ q: text.trim() || null }), 300);
    return () => clearTimeout(timer);
  }, [text, query, update]);

  const list = usePlatformOrganizations(
    session,
    { status, query, sort: "createdAt" },
    page,
    PAGE_SIZE,
  );

  const qs = search.toString();
  const withQuery = (path: string) => (qs ? `${path}?${qs}` : path);
  const open = useCallback(
    (org: PlatformOrganization) =>
      router.push(withQuery(routes.adminOrg(org.id))),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [qs, router],
  );
  const close = useCallback(
    () => router.push(withQuery(routes.adminOrgs())),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [qs, router],
  );

  if (!capabilities.canReadOrganizations)
    return (
      <>
        <PageHeader title="Organisations" />
        <NoPermission area="La liste des organisations" />
      </>
    );

  const groups: RowCardGroup<PlatformOrganization>[] = list.data
    ? [
        {
          key: "organisations",
          label: "Organisations",
          items: list.data.content,
        },
      ]
    : [];
  const filtering = status !== "ALL" || query !== "";

  return (
    <>
      <PageHeader
        title="Organisations"
        description="Toutes les organisations de la plateforme. Ouvrez-en une pour voir sa fiche et agir."
      />
      <SplitView
        open={selectedId !== null}
        onClose={close}
        detailLabel="Fiche de l'organisation"
        list={
          <div className="flex flex-col gap-4">
            <RowCardToolbar
              search={text}
              onSearchChange={setText}
              searchLabel="Rechercher une organisation par son nom"
              chips={STATUS_CHIPS}
              chip={status}
              onChipChange={(value) =>
                update({ statut: value === "ALL" ? null : value })
              }
            />
            {list.isError ? (
              <InlineError
                error={list.error}
                retry={() => void list.refetch()}
                title="La liste n'a pas pu être chargée"
              />
            ) : (
              <>
                <RowCardList
                  label="Organisations"
                  groups={groups}
                  loading={list.isPending}
                  getKey={(org) => org.id}
                  selectedKey={selectedId}
                  onSelect={open}
                  toRow={(org) => ({
                    title: org.name,
                    meta: `Créée le ${formatDate(org.createdAt)}${org.suspensionReason ? ` · ${org.suspensionReason}` : ""}`,
                    status: organizationStatusLabels[org.status],
                    tone: organizationStatusTones[org.status],
                  })}
                  empty={
                    <Empty className="border">
                      <EmptyHeader>
                        <EmptyTitle>
                          {filtering
                            ? "Aucune organisation trouvée"
                            : "Aucune organisation"}
                        </EmptyTitle>
                        <EmptyDescription>
                          {filtering
                            ? "Essayez un autre nom ou retirez le filtre."
                            : "Les organisations apparaîtront ici dès leur création."}
                        </EmptyDescription>
                      </EmptyHeader>
                      {filtering ? (
                        <Button
                          variant="outline"
                          className="h-11 md:h-9"
                          onClick={() => {
                            setText("");
                            update({ q: null, statut: null });
                          }}
                        >
                          Effacer les filtres
                        </Button>
                      ) : null}
                    </Empty>
                  }
                />
                {list.data ? (
                  <RowCardPagination
                    page={page + 1}
                    pageSize={PAGE_SIZE}
                    total={list.data.totalElements}
                    onPageChange={(next) =>
                      update(
                        { page: next > 1 ? String(next - 1) : null },
                        { keepPage: true },
                      )
                    }
                  />
                ) : null}
              </>
            )}
          </div>
        }
        detail={
          selectedId ? (
            <OrganizationPanel session={session} organizationId={selectedId} />
          ) : null
        }
      />
    </>
  );
}
