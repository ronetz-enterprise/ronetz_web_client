"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { routes } from "@/lib/routes";

const tabs = [
  { label: "Général", href: routes.settingsGeneral() },
  { label: "Membres", href: routes.settingsMembers() },
  { label: "Tarifs", href: routes.settingsPricing() },
] as const;

/**
 * Onglets Ronetz : texte seul, et sous la section courante un trait court et arrondi,
 * de la largeur du mot (pas une ligne pleine comme les filtres ou Stripe).
 */
export const TAB_CLASS =
  "relative flex h-11 items-center px-1 text-sm font-medium text-muted-foreground outline-none transition-colors hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring/60 after:absolute after:inset-x-1 after:bottom-0 after:h-[3px] after:rounded-full after:bg-transparent after:transition-colors";
export const TAB_CURRENT = "text-foreground after:bg-foreground";

export function SettingsTabs() {
  const pathname = usePathname();
  return (
    <nav aria-label="Sections des réglages" className="border-b">
      <ul className="-mb-px flex gap-5">
        {tabs.map((tab) => {
          const current = pathname === tab.href;
          return (
            <li key={tab.href}>
              <Link
                href={tab.href}
                aria-current={current ? "page" : undefined}
                className={cn(TAB_CLASS, current && TAB_CURRENT)}
              >
                {tab.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
