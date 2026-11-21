"use client";

import { createContext, useContext, type ReactNode } from "react";
import type { PlatformSession } from "../model/platform";

const Ctx = createContext<PlatformSession | null>(null);

export function AdminSessionProvider({
  session,
  children,
}: {
  session: PlatformSession;
  children: ReactNode;
}) {
  return <Ctx.Provider value={session}>{children}</Ctx.Provider>;
}

/** Permissions plateforme confirmées par la garde ; les pages ne se montent qu'après elle. */
export function useAdminSession() {
  const session = useContext(Ctx);
  if (!session) throw new Error("AdminGate requis.");
  return session;
}
