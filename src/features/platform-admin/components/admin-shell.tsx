"use client";

import {
  Building03Icon,
  File01Icon,
  Home01Icon,
  Router01Icon,
  Wallet01Icon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, type ReactNode } from "react";

import { Logo } from "@/components/logo";
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
import { useAuth } from "@/features/authentication/hooks/auth-provider";
import { routes } from "@/lib/routes";
import { platformCapabilities, type PlatformSession } from "../model/platform";

type Item = {
  label: string;
  href: string;
  icon: typeof Home01Icon;
  visible: (c: ReturnType<typeof platformCapabilities>) => boolean;
};

/** Barre réduite : uniquement l'administration, aucun élément de la console des gérants. */
const NAV: Item[] = [
  {
    label: "Tableau de bord",
    href: routes.admin(),
    icon: Home01Icon,
    visible: (c) => c.canViewPlatform,
  },
  {
    label: "Organisations",
    href: routes.adminOrgs(),
    icon: Building03Icon,
    visible: (c) => c.canReadOrganizations,
  },
  {
    label: "Réseau",
    href: routes.adminNetwork(),
    icon: Router01Icon,
    visible: (c) => c.canReadNetwork,
  },
  {
    label: "Finances",
    href: routes.adminFinance(),
    icon: Wallet01Icon,
    visible: (c) => c.canViewPlatform,
  },
  {
    label: "Audit",
    href: routes.adminAudit(),
    icon: File01Icon,
    visible: (c) => c.canReadAudit,
  },
];

const activeStyle =
  "data-active:bg-transparent data-active:font-medium data-active:text-signal";

export function isActivePath(pathname: string, href: string) {
  return href === routes.admin()
    ? pathname === href
    : pathname === href || pathname.startsWith(href + "/");
}

export function AdminShell({
  session,
  children,
}: {
  session: PlatformSession;
  children: ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const auth = useAuth();
  const [busy, setBusy] = useState(false);
  const capabilities = platformCapabilities(session);
  const items = NAV.filter((item) => item.visible(capabilities));

  return (
    <SidebarProvider>
      <Sidebar variant="inset">
        <SidebarHeader className="px-3 pt-4">
          <Logo />
          <p className="pt-1 text-xs text-muted-foreground">
            Administration · équipe Ronetz
          </p>
        </SidebarHeader>
        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupContent>
              <SidebarMenu aria-label="Administration">
                {items.map((item) => (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton
                      render={<Link href={item.href} />}
                      isActive={isActivePath(pathname, item.href)}
                      className={activeStyle}
                    >
                      <HugeiconsIcon icon={item.icon} strokeWidth={1.8} />
                      <span>{item.label}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>
        <SidebarFooter className="p-2">
          <Button
            variant="outline"
            className="h-11 w-full md:h-9"
            disabled={busy}
            onClick={() => {
              setBusy(true);
              void auth
                .logout()
                .then((result) =>
                  router.replace(routes.login() + "?logout=" + result.server),
                );
            }}
          >
            Se déconnecter
          </Button>
        </SidebarFooter>
      </Sidebar>
      <SidebarInset className="min-w-0">
        <header className="sticky top-0 z-20 flex h-14 items-center gap-2 rounded-t-xl bg-background px-3 md:hidden">
          <SidebarTrigger aria-label="Ouvrir le menu" />
          <Logo className="[&_span]:text-base" />
        </header>
        <div className="w-full min-w-0 flex-1 px-4 pt-6 pb-16 sm:px-8">
          {children}
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
