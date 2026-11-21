"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { HugeiconsIcon } from "@hugeicons/react";
import { ArrowRight02Icon } from "@hugeicons/core-free-icons";
import {
  useMemberships,
  selectionTarget,
  isAccessible,
} from "@/features/memberships";
import { routes } from "@/lib/routes";
import { toUserMessage } from "@/lib/api-error";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { setStoredOrganizationId } from "../hooks/organization-context";

/** Teinte stable pour un identifiant UUID : même couleur à chaque rendu. */
const tints = [
  "bg-accent text-accent-foreground",
  "bg-secondary text-secondary-foreground",
  "bg-success text-success-foreground",
  "bg-info text-info-foreground",
  "bg-warning text-warning-foreground",
  "bg-danger text-danger-foreground",
];
function tintFor(id: string) {
  let hash = 0;
  for (const char of id) hash = (hash * 31 + char.charCodeAt(0)) | 0;
  return tints[Math.abs(hash) % tints.length];
}
function initials(name: string) {
  const words = name.trim().split(/\s+/).filter(Boolean);
  return (
    (words[0]?.[0] ?? "") + (words.length > 1 ? words[words.length - 1][0] : "")
  ).toUpperCase();
}

export function OrganizationSelection() {
  const query = useMemberships();
  const router = useRouter();

  if (query.isPending || query.isFetching)
    return (
      <div className="space-y-2">
        {Array.from({ length: 2 }, (_, i) => (
          <Skeleton key={i} className="h-16 w-full rounded-lg" />
        ))}
      </div>
    );

  if (query.isError)
    return (
      <div role="alert" className="space-y-3">
        <p className="text-sm text-destructive">{toUserMessage(query.error)}</p>
        <Button onClick={() => void query.refetch()}>Réessayer</Button>
      </div>
    );

  const target = selectionTarget(query.data);
  if (target === "create") {
    router.replace(routes.onboardingOrg());
    return null;
  }
  if (target !== "select") {
    router.replace(routes.dashboard());
    return null;
  }

  return (
    <ul className="space-y-2" aria-label="Mes organisations">
      {query.data.map((m) => {
        const accessible = isAccessible(m);
        const reason =
          m.membershipStatus !== "ACTIVE"
            ? membershipReasons[m.membershipStatus]
            : organizationReasons[m.organizationStatus];
        return (
          <li
            key={m.organizationId}
            className={cn(
              "group relative flex items-center gap-3 rounded-lg border p-3",
              accessible
                ? "transition-colors hover:bg-muted/50 has-focus-visible:ring-[3px] has-focus-visible:ring-ring/50"
                : "bg-muted/40",
            )}
          >
            <span
              aria-hidden="true"
              className={cn(
                "flex size-9 shrink-0 items-center justify-center rounded-lg font-heading text-sm font-semibold",
                tintFor(m.organizationId),
                !accessible && "opacity-50",
              )}
            >
              {initials(m.organizationName)}
            </span>
            <div className="min-w-0 flex-1">
              {accessible ? (
                <Link
                  className="font-medium break-words outline-none after:absolute after:inset-0"
                  href={routes.dashboard()}
                  onClick={() => setStoredOrganizationId(m.organizationId)}
                >
                  {m.organizationName}
                </Link>
              ) : (
                <span className="font-medium break-words text-muted-foreground">
                  {m.organizationName}
                </span>
              )}
              <p className="text-xs text-muted-foreground">
                {accessible
                  ? "Accès disponible"
                  : `Accès indisponible · ${reason}`}
              </p>
            </div>
            <Badge variant="secondary">
              {m.role === "OWNER" ? "Propriétaire" : m.role}
            </Badge>
            {accessible && (
              <HugeiconsIcon
                icon={ArrowRight02Icon}
                strokeWidth={1.75}
                aria-hidden="true"
                className="size-4 text-muted-foreground transition-transform duration-150 group-hover:translate-x-0.5"
              />
            )}
          </li>
        );
      })}
    </ul>
  );
}

const membershipReasons: Record<string, string> = {
  SUSPENDED: "appartenance suspendue",
  REVOKED: "appartenance révoquée",
};
const organizationReasons: Record<string, string> = {
  SUSPENDED: "organisation suspendue",
  CLOSED: "organisation fermée",
  ACTIVE: "droits insuffisants",
};
