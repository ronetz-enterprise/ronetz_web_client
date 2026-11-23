"use client";

import Link from "next/link";
import { CheckmarkCircle02Icon, SignalIcon } from "@hugeicons/core-free-icons";
import { useQueryClient } from "@tanstack/react-query";
import { PageHeader } from "@/components/page-header";
import { StatusPill } from "@/components/patterns/row-card-list";
import { DetailJourney } from "@/components/patterns/detail-page";
import {
  RecordNotice,
  RecordPage,
  RecordSection,
} from "@/components/patterns/record-page";
import { buttonVariants } from "@/components/ui/button";
import { useOrganization } from "@/features/organizations/hooks/organization-context";
import {
  InlineError,
  LinkButton,
  PageSkeleton,
} from "@/features/site/components/feedback";
import { formatDateTime } from "@/lib/format";
import { routes } from "@/lib/routes";
import { cn } from "@/lib/utils";
import {
  routerCapabilities,
  routerInstruction,
  routerState,
  setupStage,
} from "../model/router";
import { routerKeys, useRouter, useRouterSite } from "../queries/routers";
import { RouterSetupGuide, SetupProgressBadge } from "./router-setup";

export function BackLink({
  href,
  children,
}: {
  href: string;
  children: string;
}) {
  return (
    <Link
      href={href}
      className={cn(buttonVariants({ variant: "link" }), "h-auto p-0")}
    >
      ← {children}
    </Link>
  );
}

export function RouterDetailScreen({ routerId }: { routerId: string }) {
  const query = useRouter(routerId);
  const site = useRouterSite(query.data);
  const client = useQueryClient();
  const { organizationId, membership } = useOrganization();

  if (query.isPending) return <PageSkeleton />;
  if (query.isError)
    return (
      <>
        <PageHeader
          title="Routeur"
          back={<BackLink href={routes.routers()}>Mes routeurs</BackLink>}
        />
        <InlineError error={query.error} retry={() => void query.refetch()} />
      </>
    );

  const router = query.data;
  const siteData = site.data ?? null;
  const state = routerState(router, new Date(), siteData?.timezone);
  const stage = setupStage(router);
  const instruction = routerInstruction(router);
  const caps = routerCapabilities(membership, router, siteData);

  return (
    <RecordPage
      back={{ href: routes.routers(), label: "Routeurs" }}
      title={router.name}
      status={<StatusPill label={state.label} tone={state.tone} />}
      subtitle={
        <>
          {router.siteId ? (
            <Link
              href={routes.site(router.siteId)}
              className="font-medium text-signal hover:underline"
            >
              {siteData?.name ?? "Voir le site"}
            </Link>
          ) : (
            "Aucun site"
          )}
          {" · "}
          {router.vendor} {router.model}
        </>
      }
      actions={
        caps.canEditRouter ? (
          <LinkButton href={routes.routerSettings(router.id)} variant="outline">
            Réglages
          </LinkButton>
        ) : null
      }
      notice={
        site.isError && router.siteId ? (
          <InlineError
            error={site.error}
            retry={() => void site.refetch()}
            title="Le site n'a pas pu être chargé"
          />
        ) : !stage && instruction ? (
          <RecordNotice
            tone={state.kind === "offline" ? "danger" : "info"}
            title={state.label}
          >
            {instruction}
          </RecordNotice>
        ) : !stage && state.kind === "online" ? (
          <RecordNotice title="Votre routeur est en ligne">
            Vos clients peuvent se connecter et acheter un accès sur le portail.
          </RecordNotice>
        ) : null
      }
      details={[
        {
          label: "Site",
          value: router.siteId ? (
            <Link
              href={routes.site(router.siteId)}
              className="text-signal hover:underline"
            >
              {siteData?.name ?? "Voir le site"}
            </Link>
          ) : (
            "Aucun site"
          ),
        },
        { label: "Modèle", value: `${router.vendor} ${router.model}` },
        {
          label: "Dernier signal",
          value: router.lastSeenAt
            ? formatDateTime(router.lastSeenAt)
            : "Jamais reçu",
        },
        { label: "Ajouté le", value: formatDateTime(router.createdAt) },
      ]}
    >
      {stage && caps.canCreateRouter ? (
        <RecordSection
          title="Mise en service"
          action={<SetupProgressBadge current={stage.step} />}
        >
          <RouterSetupGuide
            router={router}
            stage={stage}
            site={siteData}
            refreshing={query.isFetching}
            onRefresh={() =>
              void client.invalidateQueries({
                queryKey: routerKeys.all(organizationId),
              })
            }
          />
        </RecordSection>
      ) : null}

      <RecordSection title="Activité récente">
        <DetailJourney
          steps={[
            {
              icon: CheckmarkCircle02Icon,
              label: "Routeur ajouté",
              at: formatDateTime(router.createdAt),
              state: "done",
            },
            {
              icon: SignalIcon,
              label: router.lastSeenAt
                ? "Dernier signal reçu"
                : "Premier signal attendu",
              at: router.lastSeenAt
                ? formatDateTime(router.lastSeenAt)
                : "Pas encore reçu",
              state: router.lastSeenAt ? "done" : "next",
            },
          ]}
        />
      </RecordSection>
    </RecordPage>
  );
}
