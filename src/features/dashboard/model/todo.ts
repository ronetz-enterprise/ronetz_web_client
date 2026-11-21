import { z } from "zod";
import { formatDateTime } from "@/lib/format";

const instant = z.iso.datetime({ offset: true });

export const routerSchema = z.looseObject({
  id: z.uuid(),
  name: z.string().nullable(),
  lifecycleStatus: z.string(),
  connectivityStatus: z.string(),
  lastSeenAt: instant.nullable(),
});
export type RouterRow = z.infer<typeof routerSchema>;

export const routersPageSchema = z.object({
  content: z.array(routerSchema),
  totalElements: z.number().int(),
});

export const accessRowSchema = z.looseObject({
  accessGrantId: z.uuid(),
  status: z.string(),
  projectionStatus: z.string().nullable().optional(),
  expiresAt: instant.nullable(),
});
export type AccessRow = z.infer<typeof accessRowSchema>;

export const accessPageSchema = z.object({
  content: z.array(accessRowSchema),
  totalElements: z.number().int(),
});

export type TodoItem = {
  key: string;
  text: string;
  cta: string;
  target: "router" | "routers" | "access";
  id?: string;
};

/** « 14 h 05 ». */
export function clock(date: Date) {
  return `${date.getHours()} h ${String(date.getMinutes()).padStart(2, "0")}`;
}

/** Routeurs actifs qui ne répondent plus. Un routeur suspendu ou retiré ne compte pas. */
export function offlineRouters(routers: RouterRow[]) {
  return routers.filter(
    (r) =>
      r.connectivityStatus === "OFFLINE" &&
      !["SUSPENDED", "REVOKED"].includes(r.lifecycleStatus),
  );
}

export function routerTodos(routers: RouterRow[], now: Date): TodoItem[] {
  return offlineRouters(routers).map((r) => {
    const name = r.name?.trim() || "Un routeur";
    let since = "";
    if (r.lastSeenAt) {
      const seen = new Date(r.lastSeenAt);
      since = ` depuis ${
        seen.toDateString() === now.toDateString()
          ? clock(seen)
          : formatDateTime(seen)
      }`;
    }
    return {
      key: `router-${r.id}`,
      text: `${name} ne répond plus${since}.`,
      cta: "Voir le routeur",
      target: "router" as const,
      id: r.id,
    };
  });
}

/** Accès en cours dont la fin tombe avant minuit : les clients devront en racheter un. */
export function expiringToday(accesses: AccessRow[], now: Date) {
  const end = new Date(now);
  end.setHours(24, 0, 0, 0);
  return accesses.filter((a) => {
    if (a.status !== "ACTIVE" || !a.expiresAt) return false;
    const at = new Date(a.expiresAt).getTime();
    return at > now.getTime() && at <= end.getTime();
  });
}

/** Accès vendus mais jamais activés sur le réseau : à relancer. */
export function failedActivation(accesses: AccessRow[]) {
  return accesses.filter(
    (a) => a.projectionStatus === "FAILED" && a.status === "ACTIVE",
  );
}

export function accessTodos(
  accesses: AccessRow[],
  now: Date,
  partial: boolean,
): TodoItem[] {
  const items: TodoItem[] = [];
  const more = partial ? "au moins " : "";
  const expiring = expiringToday(accesses, now).length;
  if (expiring)
    items.push({
      key: "access-expiring",
      text:
        expiring === 1
          ? "1 accès expire ce soir : votre client devra en racheter un."
          : `${more}${expiring} accès expirent ce soir : vos clients devront en racheter un.`,
      cta: "Voir les accès",
      target: "access",
    });
  const failed = failedActivation(accesses).length;
  if (failed)
    items.push({
      key: "access-failed",
      text:
        failed === 1
          ? "1 accès vendu n’a pas pu être activé : relancez-le."
          : `${more}${failed} accès vendus n’ont pas pu être activés : relancez-les.`,
      cta: "Voir les accès",
      target: "access",
    });
  return items;
}
