import { z } from "zod";
import type { Membership } from "@/features/memberships";

/** Référence opaque du plan de contrôle, sûre comme segment d'adresse. */
export const opaqueReference = z.string().regex(/^[A-Za-z0-9_-]{1,150}$/);
const reference = opaqueReference.nullable();

export const routerSchema = z.object({
  id: z.uuid(),
  organizationId: z.uuid(),
  siteId: z.uuid().nullable(),
  name: z.string(),
  vendor: z.string(),
  model: z.string(),
  lifecycleStatus: z.enum(["ACTIVE", "SUSPENDED", "REVOKED"]),
  provisioningStatus: z.enum([
    "NOT_REQUESTED",
    "PROVISIONING",
    "PENDING_ENROLLMENT",
    "REGISTERED",
    "REVOKING",
    "FAILED",
  ]),
  connectivityStatus: z.enum(["UNKNOWN", "ONLINE", "OFFLINE"]),
  provisioningOperationId: reference,
  configurationArtifactId: reference,
  failureCode: z.string().nullable(),
  // Une seule action technique attend la confirmation ; toute autre répond 409.
  pendingAction: z
    .enum(["PROVISION", "ARTIFACT", "SUSPEND", "RESUME", "REVOKE"])
    .nullable(),
  lastSeenAt: z.iso.datetime({ offset: true }).nullable(),
  createdAt: z.iso.datetime({ offset: true }),
  updatedAt: z.iso.datetime({ offset: true }),
});
export type Router = z.infer<typeof routerSchema>;

export const routerPageSchema = z.object({
  content: z.array(routerSchema),
  page: z.number().int().nonnegative(),
  size: z.number().int().min(1).max(100),
  totalElements: z.number().int().nonnegative(),
});

const publicText = (max: number, required = "Ce champ est obligatoire.") =>
  z
    .string()
    .trim()
    .min(1, required)
    .max(max, `${max} caractères maximum.`)
    .refine(
      (value) =>
        !Array.from(value).some((char) => {
          const code = char.charCodeAt(0);
          return code < 32 || (code >= 127 && code <= 159);
        }),
      "Les caractères spéciaux ne sont pas autorisés.",
    );
export const routerNameSchema = z.object({
  name: publicText(150, "Donnez un nom à votre routeur."),
});
export const routerCreateSchema = routerNameSchema.extend({
  vendor: publicText(100),
  model: publicText(150, "Choisissez le modèle de votre routeur."),
  siteId: z.uuid("Choisissez le site de ce routeur."),
});
export type RouterCreateValues = z.infer<typeof routerCreateSchema>;

/** Seul MikroTik est qualifié. */
export const supportedVendor = "MikroTik";
export const routerOsMinimum = "7.13";
export const routerModels = [
  "hAP ax²",
  "hAP ax³",
  "hAP ac²",
  "hAP ac³",
  "hAP lite",
  "hEX (RB750Gr3)",
  "hEX S",
  "cAP ax",
  "wAP ac",
  "RB4011",
] as const;
export const OTHER_MODEL = "other";

/** Les quatre étapes de la mise en service, du formulaire au premier signal. */
export const setupSteps = [
  "Identifier",
  "Préparer",
  "Installer",
  "Connecter",
] as const;
export type SetupStage =
  { step: 1; state: "todo" | "running" | "failed" } | { step: 2 } | { step: 3 };

/** Étape courante d'un routeur actif, ou null une fois connecté (ou hors parcours). */
export function setupStage(router: Router): SetupStage | null {
  if (router.lifecycleStatus !== "ACTIVE") return null;
  switch (router.provisioningStatus) {
    case "NOT_REQUESTED":
      return {
        step: 1,
        state: router.pendingAction === "PROVISION" ? "running" : "todo",
      };
    case "FAILED":
      return {
        step: 1,
        state: router.pendingAction === "PROVISION" ? "running" : "failed",
      };
    case "PROVISIONING":
      return { step: 1, state: "running" };
    case "PENDING_ENROLLMENT":
      return { step: 2 };
    case "REGISTERED":
      // Un routeur déjà vu puis hors ligne relève de la supervision, plus de l'installation.
      return router.connectivityStatus === "ONLINE" || router.lastSeenAt
        ? null
        : { step: 3 };
    default:
      return null;
  }
}

export type RouterAction =
  "provision" | "artifact" | "suspend" | "resume" | "revoke";

/**
 * Nom du script à déposer sur le routeur : lisible par le gérant (tiré du nom du routeur),
 * en ASCII sans espace pour RouterOS ; la fin de l'identifiant départage deux homonymes.
 */
export const artifactFileName = (router: Pick<Router, "id" | "name">) => {
  const slug = router.name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 32);
  const tail = router.id.replace(/-/g, "").slice(-4);
  return `ronetz-${slug ? `${slug}-` : ""}${tail}.rsc`;
};
export const importCommand = (router: Pick<Router, "id" | "name">) =>
  `/import file-name=${artifactFileName(router)}`;

export function routerCapabilities(
  active: Membership,
  router?: Router,
  site?: { id: string; organizationId: string; status: string } | null,
) {
  const ready =
    active.membershipStatus === "ACTIVE" &&
    active.organizationStatus === "ACTIVE";
  const owner = ready && active.role === "OWNER";
  const target =
    owner &&
    router?.organizationId === active.organizationId &&
    router.lifecycleStatus !== "REVOKED";
  const siteReady =
    router?.siteId === null ||
    (!!site &&
      site.id === router?.siteId &&
      site.organizationId === active.organizationId &&
      site.status === "ACTIVE");
  const moving =
    router?.provisioningStatus === "PROVISIONING" ||
    router?.provisioningStatus === "REVOKING";
  // Le backend refuse (409) toute commande tant qu'une autre attend confirmation.
  const command = !!target && router.pendingAction === null;
  const enrolling =
    !!target &&
    router.lifecycleStatus === "ACTIVE" &&
    ["PENDING_ENROLLMENT", "REGISTERED"].includes(router.provisioningStatus);
  return {
    canViewRouters: ready,
    canCreateRouter: owner,
    canEditRouter: !!target,
    download: enrolling && router.configurationArtifactId !== null,
    provision:
      command &&
      siteReady &&
      router.lifecycleStatus === "ACTIVE" &&
      ["NOT_REQUESTED", "FAILED"].includes(router.provisioningStatus),
    artifact: command && siteReady && enrolling,
    suspend:
      command &&
      !moving &&
      (router.lifecycleStatus === "ACTIVE" || router.failureCode !== null),
    resume:
      command && siteReady && !moving && router.lifecycleStatus === "SUSPENDED",
    revoke: command && router.provisioningStatus !== "REVOKING",
  };
}

export const isTrackingState = (router?: Router) =>
  !!router &&
  (router.pendingAction !== null ||
    (router.lifecycleStatus !== "REVOKED" &&
      ["PROVISIONING", "PENDING_ENROLLMENT", "REVOKING"].includes(
        router.provisioningStatus,
      )));

/* ───────── État affiché au gérant ───────── */

export type RouterTone = "success" | "warning" | "danger" | "neutral";
export type RouterStateKind =
  "online" | "offline" | "setup" | "suspended" | "revoked" | "failed";

const timeFormat = (iso: string, timeZone?: string) => {
  try {
    const parts = new Intl.DateTimeFormat("fr-FR", {
      hour: "2-digit",
      minute: "2-digit",
      hourCycle: "h23",
      timeZone,
    }).formatToParts(new Date(iso));
    const get = (t: string) => parts.find((p) => p.type === t)?.value ?? "";
    return `${get("hour")} h ${get("minute")}`;
  } catch {
    return "";
  }
};
const dayFormat = (iso: string, timeZone?: string) => {
  try {
    return new Intl.DateTimeFormat("fr-FR", {
      day: "numeric",
      month: "long",
      timeZone,
    }).format(new Date(iso));
  } catch {
    return "";
  }
};

/** « 14 h 05 » aujourd'hui, « 12 novembre à 14 h 05 » sinon. */
export function formatSince(
  iso: string,
  now: Date = new Date(),
  timeZone?: string,
) {
  const time = timeFormat(iso, timeZone);
  const day = dayFormat(iso, timeZone);
  return day === dayFormat(now.toISOString(), timeZone)
    ? time
    : `${day} à ${time}`;
}

/** Phrase d'état unique, sans terme technique, avec sa teinte et sa famille de filtre. */
export function routerState(
  router: Router,
  now: Date = new Date(),
  timeZone?: string,
): { kind: RouterStateKind; label: string; tone: RouterTone } {
  if (router.lifecycleStatus === "REVOKED")
    return { kind: "revoked", label: "Retiré", tone: "neutral" };
  if (router.lifecycleStatus === "SUSPENDED")
    return { kind: "suspended", label: "Suspendu", tone: "warning" };
  const stage = setupStage(router);
  if (stage) {
    if (stage.step === 1 && stage.state === "failed")
      return { kind: "failed", label: "Préparation à refaire", tone: "danger" };
    if (stage.step === 3)
      return {
        kind: "setup",
        label: "En attente du premier signal",
        tone: "warning",
      };
    return {
      kind: "setup",
      label:
        stage.step === 2
          ? "À installer"
          : stage.state === "running"
            ? "Préparation en cours"
            : "À préparer",
      tone: "warning",
    };
  }
  if (router.connectivityStatus === "ONLINE")
    return { kind: "online", label: "En ligne", tone: "success" };
  return {
    kind: "offline",
    label: router.lastSeenAt
      ? `Hors ligne depuis ${formatSince(router.lastSeenAt, now, timeZone)}`
      : "Hors ligne",
    tone: "danger",
  };
}

/**
 * Consigne qui termine toujours un état en cours : le gérant sait quoi faire ou quoi attendre.
 */
export function routerInstruction(router: Router): string | null {
  if (router.pendingAction === "SUSPEND")
    return "Suspension en cours. Rien à faire : cette page se met à jour toute seule.";
  if (router.pendingAction === "RESUME")
    return "Réactivation en cours. Rien à faire : cette page se met à jour toute seule.";
  if (router.pendingAction === "REVOKE")
    return "Retrait en cours. Rien à faire : cette page se met à jour toute seule.";
  const stage = setupStage(router);
  if (!stage) {
    if (
      router.lifecycleStatus === "ACTIVE" &&
      router.connectivityStatus === "OFFLINE"
    )
      return "Vérifiez que le routeur est sous tension et relié à Internet : il reviendra en ligne tout seul.";
    return null;
  }
  if (stage.step === 1)
    return stage.state === "running"
      ? "Patientez un instant : votre script est en préparation."
      : stage.state === "failed"
        ? "Appuyez sur « Réessayer » pour préparer à nouveau votre script."
        : "Appuyez sur « Préparer mon script » pour continuer.";
  if (stage.step === 2)
    return "Installez le script sur votre routeur en suivant les étapes ci-dessous.";
  return "Vérifiez que le routeur est branché à Internet : il passera « En ligne » dès son premier signal.";
}
