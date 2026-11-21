"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, type ReactNode } from "react";
import { useAuth } from "@/features/authentication/hooks/auth-provider";
import { Skeleton } from "@/components/ui/skeleton";
import { routes } from "@/lib/routes";
import { useCreationAttemptReady } from "../hooks/onboarding-provider";

/** Sans session : retour à la connexion. Pendant le chargement : un squelette dans la carte. */
export function OnboardingGate({ children }: { children: ReactNode }) {
  const auth = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const ready = useCreationAttemptReady();
  const signedOut = auth.status === "anonymous" || auth.status === "expired";

  useEffect(() => {
    if (signedOut)
      router.replace(
        routes.login() + "?returnTo=" + encodeURIComponent(pathname),
      );
  }, [signedOut, pathname, router]);

  if (!ready)
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
