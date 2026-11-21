"use client";

import { StateDot } from "@/components/patterns/row-card";
import { Facts, LinkButton } from "@/features/site/components/feedback";
import type { Site } from "@/features/site/model/site";
import { formatDateTime } from "@/lib/format";
import { routes } from "@/lib/routes";
import { routerInstruction, routerState, type Router } from "../model/router";

export function RouterStateBadge({
  router,
  timeZone,
}: {
  router: Router;
  timeZone?: string;
}) {
  const s = routerState(router, new Date(), timeZone);
  return <StateDot label={s.label} tone={s.tone} className="shrink-0" />;
}

/** Détail rapide d'un routeur, dans le panneau poussé de la liste. */
export function RouterPanel({ router, site }: { router: Router; site?: Site }) {
  const instruction = routerInstruction(router);
  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-2">
        <h2 className="text-lg font-semibold break-words">{router.name}</h2>
        <div>
          <RouterStateBadge router={router} timeZone={site?.timezone} />
        </div>
        {instruction ? (
          <p className="text-sm text-muted-foreground">{instruction}</p>
        ) : null}
      </div>
      <Facts
        items={[
          { label: "Site", value: site?.name ?? "—" },
          { label: "Modèle", value: `${router.vendor} ${router.model}` },
          {
            label: "Dernier signal",
            value: router.lastSeenAt
              ? formatDateTime(router.lastSeenAt)
              : "Aucun signal reçu",
          },
        ]}
      />
      <div className="flex flex-col gap-2 sm:flex-row">
        <LinkButton href={routes.router(router.id)}>
          Ouvrir le routeur
        </LinkButton>
        <LinkButton href={routes.routerSettings(router.id)} variant="outline">
          Réglages
        </LinkButton>
      </div>
    </div>
  );
}
