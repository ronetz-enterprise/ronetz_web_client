"use client";

import { useCallback, useMemo } from "react";

import { routes } from "@/lib/routes";

import { Bubbles, type BubbleStep } from "./bubbles";
import { mainNav, type NavItem } from "./nav-items";
import { markSeen } from "./onboarding-memory";

/**
 * Visite guidée, courte : bienvenue, les trois pages du quotidien (Accueil, Accès, Finances),
 * le reste du menu en une bulle, puis le relais au guide de démarrage. Le détail de chaque page
 * vient d'une bulle à sa première ouverture (voir `page-hints.tsx`).
 */
const navTarget = (href: string) => `[data-tour="nav-${href}"]`;
const navItem = (href: string) =>
  mainNav.find((i) => i.href === href) as NavItem;

const STEPS: BubbleStep[] = [
  {
    title: "Bienvenue sur Ronetz",
    body: "En quatre bulles, voici où se trouve l'essentiel. Vous pourrez revoir cette visite à tout moment depuis le menu.",
  },
  {
    title: "Accueil",
    body: "Votre journée en un coup d'œil : recettes du jour, solde, et ce qui demande votre attention.",
    targets: [navTarget(routes.dashboard())],
    item: navItem(routes.dashboard()),
  },
  {
    title: "Accès",
    body: "Les identifiants que vos clients ont achetés sur le portail : retrouvez un client, voyez le temps qui lui reste.",
    targets: [navTarget(routes.access())],
    item: navItem(routes.access()),
  },
  {
    title: "Finances",
    body: "Votre solde et vos retraits vers Mobile Money.",
    targets: [navTarget(routes.finance())],
    item: navItem(routes.finance()),
  },
  {
    title: "Le reste du menu",
    body: "Offres, Sites et Routeurs servent à installer votre Wi-Fi.",
    targets: ['[data-tour="nav"]'],
  },
];

/** Sur téléphone, le menu est replié : on pointe son bouton. */
const FALLBACK = ['[data-tour="menu-trigger"]'];

export function PlatformTour({
  organizationId,
  guideAvailable,
  onClose,
}: {
  organizationId: string;
  /** Guide de démarrage encore utile : la dernière bulle l'ouvre. */
  guideAvailable: boolean;
  /** `finished` : le gérant est allé au bout ; la coque ouvre alors le guide de démarrage. */
  onClose: (how: "finished" | "skipped") => void;
}) {
  const done = useCallback(
    (how: "finished" | "skipped") => {
      markSeen(organizationId, "tour");
      onClose(how);
    },
    [organizationId, onClose],
  );
  // Tant que le guide de démarrage a des étapes à faire, la dernière bulle y renvoie.
  const steps = useMemo(
    () =>
      guideAvailable
        ? STEPS.map((s, i) =>
            i === STEPS.length - 1
              ? {
                  ...s,
                  body: `${s.body} Le guide de démarrage vous y emmène, étape par étape.`,
                }
              : s,
          )
        : STEPS,
    [guideAvailable],
  );
  return (
    <Bubbles
      steps={steps}
      onDone={done}
      fallbackTargets={FALLBACK}
      finishLabel={guideAvailable ? "Ouvrir le guide" : "Terminer"}
    />
  );
}
