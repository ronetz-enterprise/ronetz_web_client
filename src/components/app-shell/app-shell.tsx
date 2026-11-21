"use client";

import { HugeiconsIcon } from "@hugeicons/react";
import {
  Cancel01Icon,
  PlusSignIcon,
  UnfoldMoreIcon,
} from "@hugeicons/core-free-icons";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, type CSSProperties, type ReactNode } from "react";

import { Logo } from "@/components/logo";
import { StartChecklist } from "@/components/start-checklist";
import { Button } from "@/components/ui/button";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { useOptionalOrganization } from "@/features/organizations/hooks/organization-context";
import { useIsMobile } from "@/hooks/use-mobile";

import { mainNav, settings, type NavItem } from "./nav-items";
import { SellAccessDrawer } from "@/features/access";
import { SellDrawer } from "./sell-drawer";
import { setupSteps } from "./setup-steps";

const activeStyle =
  "data-active:bg-transparent data-active:font-semibold data-active:text-signal data-active:[&_svg]:text-signal";

function NavLink({ item, pathname }: { item: NavItem; pathname: string }) {
  const active = pathname === item.href || pathname.startsWith(item.href + "/");
  return (
    <SidebarMenuItem>
      <SidebarMenuButton
        render={<Link href={item.href} />}
        isActive={active}
        className={activeStyle}
      >
        <HugeiconsIcon icon={item.icon} strokeWidth={1.8} />
        <span>{item.label}</span>
      </SidebarMenuButton>
    </SidebarMenuItem>
  );
}

/** Anneau de progression du guide : petit, dans le bouton, il dit « où j'en suis » sans mot. */
function Ring({ done, total }: { done: number; total: number }) {
  const r = 7;
  const c = 2 * Math.PI * r;
  return (
    <svg viewBox="0 0 20 20" className="size-5 -rotate-90" aria-hidden>
      <circle
        cx="10"
        cy="10"
        r={r}
        fill="none"
        strokeWidth="2.5"
        className="stroke-border"
      />
      <circle
        cx="10"
        cy="10"
        r={r}
        fill="none"
        strokeWidth="2.5"
        strokeLinecap="round"
        className="stroke-signal"
        strokeDasharray={c}
        strokeDashoffset={c * (1 - done / total)}
      />
    </svg>
  );
}

/**
 * L'ossature, d'après la référence : un fond de coque teinté, la barre latérale posée dessus sans
 * bordure, et un grand panneau arrondi pour le contenu. En haut du panneau : recherche, alertes,
 * guide de démarrage, et l'action principale « Vendre un accès ».
 */
export function AppShell({
  children,
  organization: organizationProp,
  manager,
}: {
  children: ReactNode;
  organization?: string;
  manager?: string;
}) {
  const pathname = usePathname();
  const context = useOptionalOrganization();
  // Dans la console, le nom vient de l'organisation active ; les gabarits passent leurs exemples.
  const organization =
    organizationProp ?? context?.organizationName ?? "Mon organisation";
  const isMobile = useIsMobile();
  const [sellOpen, setSellOpen] = useState(false);
  const [guideOverride, setGuideOverride] = useState<boolean | null>(null);
  // Le guide s'ouvre de lui-même sur l'accueil seulement : ailleurs, il gênerait le travail en cours.
  const guideOpen =
    guideOverride ?? (!isMobile && pathname === mainNav[0].href);
  const done = setupSteps.filter((s) => s.done).length;

  return (
    // Largeur Stripe : juste ce qu’il faut pour « Guide de démarrage » et les libellés courts.
    <SidebarProvider style={{ "--sidebar-width": "14rem" } as CSSProperties}>
      <Sidebar variant="sidebar">
        <SidebarHeader className="px-2 pt-3">
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton
                size="lg"
                className="h-auto py-1.5"
                aria-label={`Compte : ${organization}`}
              >
                <span className="grid size-7 shrink-0 place-items-center rounded-md bg-muted text-xs font-semibold text-foreground ring-1 ring-border">
                  {organization.slice(0, 1)}
                </span>
                <span className="grid min-w-0 flex-1 text-left leading-tight">
                  <span className="truncate text-sm font-semibold">
                    {organization}
                  </span>
                  {manager ? (
                    <span className="truncate text-xs text-sidebar-muted-foreground">
                      {manager}
                    </span>
                  ) : null}
                </span>
                <HugeiconsIcon
                  icon={UnfoldMoreIcon}
                  strokeWidth={1.8}
                  className="size-4 text-sidebar-muted-foreground"
                />
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarHeader>
        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupContent>
              <SidebarMenu>
                {mainNav.map((item) => (
                  <NavLink key={item.href} item={item} pathname={pathname} />
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>
        <SidebarFooter className="p-2">
          <SidebarMenu>
            <NavLink item={settings} pathname={pathname} />
          </SidebarMenu>
        </SidebarFooter>
      </Sidebar>

      {/* Comme Stripe : tout est blanc, la barre du haut est dans le contenu ; sur ordinateur, seul le contenu défile. */}
      <SidebarInset className="min-w-0 md:h-svh md:overflow-hidden">
        <header className="sticky top-0 z-20 bg-background px-3 sm:px-8 md:static">
          <div className="mx-auto flex h-16 w-full max-w-6xl items-center gap-2">
            <SidebarTrigger aria-label="Ouvrir le menu" className="md:hidden" />
            <Logo className="md:hidden [&_span]:text-base" />
            <div className="ml-auto flex items-center gap-1.5">
              <Button
                variant="outline"
                onClick={() => setGuideOverride(!guideOpen)}
                aria-expanded={guideOpen}
                className="gap-2 px-2.5"
              >
                <Ring done={done} total={setupSteps.length} />
                <span className="hidden sm:inline">Guide de démarrage</span>
                <span className="tabular-nums sm:hidden">
                  {done}/{setupSteps.length}
                </span>
              </Button>
              <Button onClick={() => setSellOpen(true)} aria-haspopup="dialog">
                <HugeiconsIcon
                  icon={PlusSignIcon}
                  strokeWidth={2}
                  data-icon="inline-start"
                />
                <span className="hidden sm:inline">Vendre un accès</span>
                <span className="sm:hidden">Vendre</span>
              </Button>
            </div>
          </div>
        </header>
        <div
          data-scroll-area
          className="w-full min-w-0 flex-1 px-4 pt-4 pb-16 sm:px-8 md:min-h-0 md:overflow-y-auto md:overscroll-contain [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          <div className="mx-auto w-full max-w-6xl">{children}</div>
        </div>
      </SidebarInset>

      {guideOpen ? (
        <aside
          aria-label="Guide de démarrage"
          className="fixed right-3 bottom-3 left-3 z-30 max-h-[70vh] overflow-y-auto rounded-xl border border-border bg-popover p-4 text-popover-foreground shadow-[var(--shadow-float)] sm:left-auto sm:w-96"
        >
          <StartChecklist
            title="Pour vendre votre premier accès"
            steps={setupSteps}
            action={
              <Button
                variant="ghost"
                size="icon-sm"
                aria-label="Fermer le guide"
                onClick={() => setGuideOverride(false)}
              >
                <HugeiconsIcon icon={Cancel01Icon} strokeWidth={1.8} />
              </Button>
            }
          />
        </aside>
      ) : null}
      {/* Console : le vrai tiroir de vente. Gabarits (hors console) : la maquette. */}
      {context ? (
        <SellAccessDrawer open={sellOpen} onOpenChange={setSellOpen} />
      ) : (
        <SellDrawer open={sellOpen} onOpenChange={setSellOpen} />
      )}
    </SidebarProvider>
  );
}
