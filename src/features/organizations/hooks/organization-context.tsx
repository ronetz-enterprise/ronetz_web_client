"use client";

import { createContext, useContext, useMemo, type ReactNode } from "react";
import type { Membership } from "@/features/memberships";

/**
 * L'organisation active de la console. Une seule organisation par compte pour l'instant :
 * elle est déduite des adhésions de l'utilisateur (`/api/me/memberships`), jamais lue dans l'adresse.
 */
export type OrganizationContextValue = {
  organizationId: string;
  organizationName: string;
  membership: Membership;
  permissions: readonly string[];
  /** Vrai si l'adhésion porte cette permission (ex. `ORGANIZATION_READ`). */
  can: (permission: string) => boolean;
  /** Chemin d'API d'une ressource de l'organisation : `orgApi("/sites")` → `/api/organizations/<id>/sites`. */
  orgApi: (path?: string) => string;
};

const OrganizationContext = createContext<OrganizationContextValue | null>(
  null,
);

export function OrganizationProvider({
  membership,
  children,
}: {
  membership: Membership;
  children: ReactNode;
}) {
  const value = useMemo<OrganizationContextValue>(
    () => ({
      organizationId: membership.organizationId,
      organizationName: membership.organizationName,
      membership,
      permissions: membership.permissions,
      can: (permission) => membership.permissions.includes(permission),
      orgApi: (path = "") =>
        `/api/organizations/${membership.organizationId}${path}`,
    }),
    [membership],
  );
  return (
    <OrganizationContext.Provider value={value}>
      {children}
    </OrganizationContext.Provider>
  );
}

/** À utiliser dans toute page de la console. Lève une erreur hors de la console. */
export function useOrganization(): OrganizationContextValue {
  const value = useContext(OrganizationContext);
  if (!value)
    throw new Error("useOrganization doit être utilisé dans la console.");
  return value;
}

/** Variante qui renvoie null hors de la console (mise en page partagée avec les gabarits). */
export function useOptionalOrganization(): OrganizationContextValue | null {
  return useContext(OrganizationContext);
}

const STORAGE_KEY = "ronetz.activeOrganization";

/** Mémorise l'organisation choisie quand un ancien compte en possède plusieurs. */
export function getStoredOrganizationId(): string | null {
  try {
    return window.localStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
}

export function setStoredOrganizationId(id: string) {
  try {
    window.localStorage.setItem(STORAGE_KEY, id);
  } catch {
    /* stockage indisponible : le choix sera redemandé */
  }
}
