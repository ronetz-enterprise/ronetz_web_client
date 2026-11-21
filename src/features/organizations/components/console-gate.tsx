"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, type ReactNode } from "react";
import { SessionRecovery } from "@/features/authentication/components/session-recovery";
import { useAuth } from "@/features/authentication/hooks/auth-provider";
import { isAccessible, useMemberships } from "@/features/memberships";
import { Skeleton } from "@/components/ui/skeleton";
import { routes } from "@/lib/routes";
import { OrganizationAccessNotice } from "./access-notice";
import {
  getStoredOrganizationId,
  OrganizationProvider,
} from "../hooks/organization-context";

function Loading() {
  return (
    <div
      role="status"
      aria-label="Chargement"
      className="flex min-h-svh flex-col gap-4 p-8"
    >
      <Skeleton className="h-8 w-48" />
      <Skeleton className="h-4 w-80" />
      <Skeleton className="h-40 w-full max-w-3xl" />
    </div>
  );
}

/**
 * Garde de la console : session ouverte, puis organisation active.
 * - pas de session → connexion, avec retour à la page demandée ;
 * - aucune organisation → onboarding ;
 * - une organisation accessible → console ;
 * - plusieurs (anciens comptes) → celle déjà choisie, sinon écran de choix.
 */
export function ConsoleGate({ children }: { children: ReactNode }) {
  const auth = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const signedOut = auth.status === "anonymous" || auth.status === "expired";
  const memberships = useMemberships();

  useEffect(() => {
    if (signedOut) {
      router.replace(
        routes.login() + "?returnTo=" + encodeURIComponent(pathname),
      );
    }
  }, [signedOut, pathname, router]);

  const items = memberships.data;
  const accessible = items?.filter(isAccessible) ?? [];
  const stored =
    typeof window === "undefined" ? null : getStoredOrganizationId();
  const chosen =
    accessible.length === 1
      ? accessible[0]
      : accessible.find((m) => m.organizationId === stored);
  const needsOnboarding = items !== undefined && items.length === 0;
  const needsChoice = accessible.length > 1 && !chosen;

  useEffect(() => {
    if (needsOnboarding) router.replace(routes.onboardingOrg());
    else if (needsChoice) router.replace(routes.selectOrg());
  }, [needsOnboarding, needsChoice, router]);

  if (auth.status === "unavailable") return <SessionRecovery />;
  if (auth.status === "initializing" || signedOut) return <Loading />;
  if (memberships.isError)
    return (
      <div className="p-6">
        <OrganizationAccessNotice
          error={memberships.error}
          retry={() => void memberships.refetch()}
        />
      </div>
    );
  if (!items || needsOnboarding || needsChoice) return <Loading />;
  if (!chosen)
    return (
      <div className="p-6">
        <OrganizationAccessNotice />
      </div>
    );
  return (
    <OrganizationProvider membership={chosen}>{children}</OrganizationProvider>
  );
}
