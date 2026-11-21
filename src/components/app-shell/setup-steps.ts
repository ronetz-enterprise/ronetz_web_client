import type { ChecklistStep } from "@/components/start-checklist";
import { routes } from "@/lib/routes";

// Données d'exemple : elles viendront de l'API (état du compte du gérant).
export const setupSteps: ChecklistStep[] = [
  { label: "Créer votre compte", done: true },
  { label: "Créer un site", done: true },
  {
    label: "Ajouter un routeur",
    hint: "Le technicien peut le faire pour vous : envoyez-lui le lien.",
    href: routes.routerNew(),
  },
  { label: "Créer une offre" },
  { label: "Vendre un premier accès" },
];
