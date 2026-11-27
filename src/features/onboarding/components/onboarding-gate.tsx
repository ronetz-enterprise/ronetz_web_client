"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, type ReactNode } from "react";
import { useAuth } from "@/features/authentication/hooks/auth-provider";
import { Skeleton } from "@/components/ui/skeleton";
import { routes } from "@/lib/routes";
import { usePrincipal } from "@/features/identity";
import { useCreationAttemptReady } from "../hooks/onboarding-provider";

/** Sans session : retour à la connexion. Pendant le chargement : un squelette dans la carte. */
export function OnboardingGate({ children }: { children: ReactNode }) {
  const auth = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const ready = useCreationAttemptReady();
  const signedOut = auth.status === "anonymous" || auth.status === "expired";
  // Adresse non confirmée : l'API refuse tout le reste, on mène à l'écran de confirmation.
  const principal = usePrincipal();
  const unverified = principal.data?.emailVerified === false;
  useEffect(() => {
    if (unverified) router.replace(routes.verifyEmail());
  }, [unverified, router]);

  useEffect(() => {
    if (signedOut)
      router.replace(
        routes.login() + "?returnTo=" + encodeURIComponent(pathname),
      );
  }, [signedOut, pathname, router]);

  if (!ready || unverified)
    return (
      <div
        role="status"
        aria-label="Chargement"
        className="mx-auto my-auto w-full max-w-md space-y-4 px-6 py-12"
      >
        <Skeleton className="h-8 w-3/4" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
      </div>
    );
  return <>{children}</>;
}
