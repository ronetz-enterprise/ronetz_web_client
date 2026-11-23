import type { ChecklistStep } from "@/components/start-checklist";
import { routes } from "@/lib/routes";

/** Ce que l'on sait du compte pour dire où en est le gérant. */
export type SetupState = {
  hasSite: boolean;
  firstSiteId: string | null;
  hasRouter: boolean;
  hasOffer: boolean;
  hasAccess: boolean;
};

/** Les étapes du guide, calculées d'après l'état réel du compte. */
export function buildSetupSteps(state: SetupState): ChecklistStep[] {
  return [
    { label: "Créer votre compte", done: true },
    {
      label: "Créer un site",
      done: state.hasSite,
      hint: "Le lieu où vos clients se connectent : votre boutique, votre cybercafé.",
      href: routes.siteNew(),
    },
    {
      label: "Ajouter un routeur",
      done: state.hasRouter,
      hint: "L'installation se fait pas à pas, en quelques minutes.",
      href: routes.routerNew(),
    },
    {
      label: "Créer une offre",
      done: state.hasOffer,
      hint: "Une durée et un prix : ce que vos clients pourront acheter.",
      href: state.firstSiteId
        ? routes.siteOfferNew(state.firstSiteId)
        : routes.offers(),
    },
    {
      label: "Premier achat sur le portail",
      done: state.hasAccess,
      hint: "Vos clients achètent un accès depuis la page de connexion de votre Wi-Fi.",
    },
  ];
}

/** Exemple pour les gabarits (hors console) : un compte à mi-parcours. */
export const sampleSetupSteps = buildSetupSteps({
  hasSite: true,
  firstSiteId: null,
  hasRouter: false,
  hasOffer: false,
  hasAccess: false,
});
