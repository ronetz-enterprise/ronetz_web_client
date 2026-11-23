"use client";

import { HugeiconsIcon } from "@hugeicons/react";
import {
  Cancel01Icon,
  HelpCircleIcon,
  UnfoldMoreIcon,
} from "@hugeicons/core-free-icons";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  useEffect,
  useState,
  type CSSProperties,
  type ReactNode,
} from "react";

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
  useSidebar,
} from "@/components/ui/sidebar";
import { useOptionalOrganization } from "@/features/organizations/hooks/organization-context";

import { mainNav, settings, type NavItem } from "./nav-items";
import { sampleSetupSteps } from "./setup-steps";
import { useConsoleSetupSteps } from "./use-console-setup";
import { PlatformTour } from "./platform-tour";
import { PageHints } from "./page-hints";
import { useSeen } from "./onboarding-memory";
import type { ChecklistStep } from "@/components/start-checklist";


const activeStyle =
  "data-active:bg-transparent data-active:font-semibold data-active:text-signal data-active:[&_svg]:text-signal";

function NavLink({ item, pathname }: { item: NavItem; pathname: string }) {
  const active = pathname === item.href || pathname.startsWith(item.href + "/");
  return (
    <SidebarMenuItem>
      <SidebarMenuButton
        render={<Link href={item.href} />}
        data-tour={`nav-${item.href}`}
        isActive={active}
        className={activeStyle}
      >
        <HugeiconsIcon icon={item.icon} strokeWidth={1.8} />
        <span>{item.label}</span>
      </SidebarMenuButton>
    </SidebarMenuItem>
  );
}

/** « Visite guidée » dans le menu : sur téléphone, referme d'abord le menu pour laisser voir la page. */
function TourRelaunch({ onLaunch }: { onLaunch: () => void }) {
  const { setOpenMobile } = useSidebar();
  return (
    <SidebarMenuButton
      data-tour="tour-relaunch"
      onClick={() => {
        // Sur téléphone, la visite pointe le bouton du menu : on referme le menu d'abord.
        setOpenMobile(false);
        onLaunch();
      }}
    >
      <HugeiconsIcon icon={HelpCircleIcon} strokeWidth={1.8} />
      <span>Visite guidée</span>
    </SidebarMenuButton>
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
 * guide de démarrage. Les accès se vendent uniquement sur le portail client.
 */
type ShellProps = {
  children: ReactNode;
  organization?: string;
  manager?: string;
};

export function AppShell(props: ShellProps) {
  const context = useOptionalOrganization();
  // Dans la console, le guide suit l'état réel du compte ; les gabarits montrent un exemple.
  return context ? (
    <ConsoleShell {...props} />
  ) : (
    <ShellFrame {...props} steps={sampleSetupSteps} />
  );
}

function ConsoleShell(props: ShellProps) {
  const steps = useConsoleSetupSteps();
  return <ShellFrame {...props} steps={steps} />;
}

function ShellFrame({
  children,
  organization: organizationProp,
  manager,
  steps,
}: ShellProps & { steps: ChecklistStep[] | null }) {
  const pathname = usePathname();
  const context = useOptionalOrganization();
  // Dans la console, le nom vient de l'organisation active ; les gabarits passent leurs exemples.
  const organization =
    organizationProp ?? context?.organizationName ?? "Mon organisation";
  // Le guide ne s'ouvre que sur demande : ouvert d'office, il cachait le contenu de l'accueil.
  const [guideRequested, setGuideRequested] = useState(false);
  const total = steps?.length ?? 0;
  const done = steps?.filter((s) => s.done).length ?? 0;
  // Pendant le chargement, ou une fois tout fait, le guide n'a rien à dire : il disparaît.
  const guideAvailable = steps !== null && done < total;
  const guideOpen = guideAvailable && guideRequested;
  // Visite guidée : d'elle-même au premier lancement dans la console, puis depuis le menu.
  const organizationId = context?.organizationId ?? null;
  const tourSeen = useSeen(organizationId, "tour");
  const [tourRequested, setTourRequested] = useState(false);
  const [tourDismissed, setTourDismissed] = useState(false);
  const tourOpen = tourRequested || (!tourSeen && !tourDismissed);
  const setTourOpen = (next: boolean) => {
    setTourRequested(next);
    if (!next) setTourDismissed(true);
  };

  useEffect(() => {
    if (!guideOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setGuideRequested(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [guideOpen]);

  return (
    // Largeur Stripe : juste ce qu’il faut pour « Guide de démarrage » et les libellés courts.
    <SidebarProvider style={{ "--sidebar-width": "14rem" } as CSSProperties}>
      <Sidebar variant="sidebar">
        <SidebarHeader className="px-2 pt-3">
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton
                size="lg"
                data-tour="account"
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
              <SidebarMenu data-tour="nav">
                {mainNav.map((item) => (
                  <NavLink key={item.href} item={item} pathname={pathname} />
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>
        <SidebarFooter className="p-2">
          <SidebarMenu>
            {organizationId ? (
              <SidebarMenuItem>
                <TourRelaunch
                  onLaunch={() => {
                    setGuideRequested(false);
                    setTourOpen(true);
                  }}
                />
              </SidebarMenuItem>
            ) : null}
            <NavLink item={settings} pathname={pathname} />
          </SidebarMenu>
        </SidebarFooter>
      </Sidebar>

      {/* Comme Stripe : tout est blanc, la barre du haut est dans le contenu ; sur ordinateur, seul le contenu défile. */}
      <SidebarInset className="min-w-0 md:h-svh md:overflow-hidden">
        <header className="sticky top-0 z-20 bg-background px-3 sm:px-8 md:static">
          <div className="mx-auto flex h-16 w-full max-w-6xl items-center gap-2">
            <SidebarTrigger
              aria-label="Ouvrir le menu"
              data-tour="menu-trigger"
              className="md:hidden"
            />
            <Logo className="md:hidden [&_span]:text-base" />
            <div className="ml-auto flex items-center gap-1.5">
              {guideAvailable ? (
                <Button
                  variant="outline"
                  data-tour="guide"
                  onClick={() => setGuideRequested(!guideOpen)}
                  aria-expanded={guideOpen}
                  aria-controls="guide-demarrage"
                  aria-label={`Guide de démarrage, ${done} étapes faites sur ${total}`}
                  className="gap-2 px-2.5"
                >
                  <Ring done={done} total={total} />
                  <span className="hidden sm:inline">Guide de démarrage</span>
                  <span className="tabular-nums sm:hidden">
                    Démarrage {done}/{total}
                  </span>
                </Button>
              ) : null}
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
          id="guide-demarrage"
          aria-label="Guide de démarrage"
          className="fixed right-3 bottom-3 left-3 z-30 max-h-[70vh] overflow-y-auto rounded-xl border border-border bg-popover p-4 text-popover-foreground shadow-[var(--shadow-float)] sm:left-auto sm:w-96"
        >
          <StartChecklist
            title="Pour recevoir vos premiers achats"
            steps={steps ?? []}
            action={
              <Button
                variant="ghost"
                size="icon-sm"
                aria-label="Fermer le guide"
                onClick={() => setGuideRequested(false)}
              >
                <HugeiconsIcon icon={Cancel01Icon} strokeWidth={1.8} />
              </Button>
            }
          />
        </aside>
      ) : null}
      {organizationId && tourOpen ? (
        <PlatformTour
          organizationId={organizationId}
          guideAvailable={guideAvailable}
          onClose={(how) => {
            setTourOpen(false);
            // Au bout de la visite, le guide de démarrage prend le relais : un seul parcours.
            if (how === "finished" && guideAvailable) setGuideRequested(true);
          }}
        />
      ) : null}
      {organizationId ? (
        <PageHints
          organizationId={organizationId}
          paused={tourOpen || guideOpen}
        />
      ) : null}
    </SidebarProvider>
  );
}
