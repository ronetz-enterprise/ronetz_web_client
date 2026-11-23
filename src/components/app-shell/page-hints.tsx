"use client";

import { usePathname } from "next/navigation";
import { useCallback } from "react";

import { routes } from "@/lib/routes";

import { Bubbles, type BubbleStep } from "./bubbles";
import { markSeen, useSeen } from "./onboarding-memory";

/**
 * Une bulle à la première ouverture d'une page : elle pointe la zone utile de la page elle-même,
 * au moment où le gérant en a besoin. Une seule fois par page. Elle attend que la zone soit à
 * l'écran (données chargées) ; si la zone n'apparaît pas (page vide, droits), rien ne s'affiche.
 */
const HINTS: Record<string, BubbleStep> = {
  [routes.access()]: {
    title: "Retrouver un client",
    body: "Filtrez par état ou cherchez un identifiant. Ouvrez une ligne pour voir le détail, ou suspendre l'accès.",
    targets: ['[data-slot="list-toolbar"]'],
  },
  [routes.offers()]: {
    title: "Vos offres",
    body: "Chaque offre est une durée et un prix, pour un site. Ouvrez-en une pour la mettre en vente ou en pause.",
    targets: ['[data-slot="page-header"]'],
  },
  [routes.sites()]: {
    title: "Vos sites",
    body: "Ouvrez un site pour voir ses routeurs, ses offres et sa page de connexion.",
    targets: ['[data-slot="list-toolbar"]', '[data-slot="page-header"]'],
  },
  [routes.routers()]: {
    title: "L'état de vos routeurs",
    body: "Filtrez par état : un routeur hors ligne ne vend plus. Ouvrez-le pour savoir quoi faire.",
    targets: ['[data-slot="list-toolbar"]'],
  },
  [routes.finance()]: {
    title: "Retirer votre argent",
    body: "Votre solde disponible part sur votre compte Mobile Money, en une demande.",
    targets: ['aside[aria-labelledby="withdraw-panel"]'],
  },
};

const topicFor = (path: string) => `page${path.replaceAll("/", ".")}`;

export function PageHints({
  organizationId,
  paused,
}: {
  organizationId: string;
  /** Rien pendant la visite guidée ou le guide de démarrage : une bulle à la fois. */
  paused: boolean;
}) {
  const pathname = usePathname();
  const hint = HINTS[pathname];
  const topic = topicFor(pathname);
  const seen = useSeen(hint ? organizationId : null, topic);
  const done = useCallback(
    () => markSeen(organizationId, topic),
    [organizationId, topic],
  );
  if (!hint || seen || paused) return null;
  // `key` : en changeant de page, la bulle repart de zéro.
  return <Bubbles key={pathname} steps={[hint]} onDone={done} requireTarget />;
}
