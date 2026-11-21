"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import { usePathname } from "next/navigation";
import { useAuth } from "@/features/authentication/hooks/auth-provider";
import { usePrincipal } from "@/features/identity";
import { routes } from "@/lib/routes";
import { createAttempt, type CreationAttempt } from "../lib/creation-attempt";
import type { AuthenticatedRequest } from "../api/create-organization";

const OnboardingContext = createContext<CreationAttempt | null>(null);

function ActiveAttempt({
  request,
  userId,
  children,
}: {
  request: AuthenticatedRequest;
  userId: string;
  children: ReactNode;
}) {
  const [attempt] = useState(() => createAttempt(request, userId));
  const pathname = usePathname();
  const snapshot = useSyncExternalStore(
    attempt.subscribe,
    attempt.getSnapshot,
    attempt.getSnapshot,
  );

  useEffect(() => () => attempt.dispose(), [attempt]);

  useEffect(() => {
    // Once the manager navigates to the dashboard, the creation is considered complete.
    if (
      snapshot.status === "created" &&
      snapshot.organization &&
      pathname === routes.dashboard()
    )
      attempt.complete();
  }, [attempt, pathname, snapshot]);

  return (
    <OnboardingContext.Provider value={attempt}>
      {children}
    </OnboardingContext.Provider>
  );
}

export function OnboardingProvider({ children }: { children: ReactNode }) {
  const { status, request } = useAuth();
  const principal = usePrincipal();
  return principal.data &&
    (status === "authenticated" || status === "refreshing") ? (
    <ActiveAttempt
      key={principal.data.userId}
      userId={principal.data.userId}
      request={request}
    >
      {children}
    </ActiveAttempt>
  ) : (
    children
  );
}

export function useCreationAttempt() {
  const attempt = useContext(OnboardingContext);
  if (!attempt) throw new Error("Session authentifiée requise.");
  const snapshot = useSyncExternalStore(
    attempt.subscribe,
    attempt.getSnapshot,
    attempt.getSnapshot,
  );
  return {
    ...snapshot,
    submit: attempt.submit,
    recover: attempt.recover,
    complete: attempt.complete,
  };
}

/** Vrai dès que la session est établie et que la tentative de création est disponible. */
export function useCreationAttemptReady() {
  return useContext(OnboardingContext) !== null;
}
