import {
  Home01Icon,
  Location01Icon,
  Router01Icon,
  Settings01Icon,
  Tag01Icon,
  Ticket01Icon,
  Wallet01Icon,
} from "@hugeicons/core-free-icons";
import { routes } from "@/lib/routes";

export type NavItem = { label: string; href: string; icon: typeof Home01Icon };

/**
 * Une seule liste, dans l'ordre de ce que fait un gérant : où j'en suis, ce que je vends,
 * où je vends, ce qui diffuse, ce que je gagne. « Vendre un accès » n'est pas dans la liste :
 * c'est l'action principale, toujours visible à côté d'elle.
 */
export const mainNav: NavItem[] = [
  { label: "Accueil", href: routes.dashboard(), icon: Home01Icon },
  { label: "Accès", href: routes.access(), icon: Ticket01Icon },
  { label: "Offres", href: routes.offers(), icon: Tag01Icon },
  { label: "Sites", href: routes.sites(), icon: Location01Icon },
  { label: "Routeurs", href: routes.routers(), icon: Router01Icon },
  { label: "Finances", href: routes.finance(), icon: Wallet01Icon },
];

export const settings: NavItem = {
  label: "Réglages",
  href: routes.settingsGeneral(),
  icon: Settings01Icon,
};
