"use client";

import { useRef, useState } from "react";
import {
  useMutation,
  useQuery,
  useQueryClient,
  type QueryClient,
} from "@tanstack/react-query";
import { z } from "zod";
import { useAuth } from "@/features/authentication/hooks/auth-provider";
import { useOrganization } from "@/features/organizations/hooks/organization-context";
import { ApiError } from "@/lib/api-error";
import { parseSite } from "@/features/site/queries/sites";
import {
  artifactFileName,
  isTrackingState,
  opaqueReference,
  routerCapabilities,
  routerCreateSchema,
  routerNameSchema,
  routerPageSchema,
  routerSchema,
  type Router,
  type RouterAction,
  type RouterCreateValues,
} from "../model/router";

export const routerKeys = {
  all: (org: string) => ["org", org, "routers"] as const,
  list: (org: string, page: number, size: number) =>
    ["org", org, "routers", "list", { page, size }] as const,
  detail: (org: string, id: string) =>
    ["org", org, "routers", "detail", id] as const,
};

const path = (id: string) => `/api/routers/${z.uuid().parse(id)}`;

export function parseRouter(value: unknown, org: string, id?: string) {
  const result = routerSchema.safeParse(value);
  if (!result.success) throw new ApiError("invalid-response");
  if (result.data.organizationId !== org || (id && result.data.id !== id))
    throw new ApiError("http", 404);
  return result.data;
}

export const PAGE_SIZE = 100;

export function useRouterList(page = 0) {
  const { request } = useAuth();
  const { organizationId, orgApi, membership } = useOrganization();
  return useQuery({
    queryKey: routerKeys.list(organizationId, page, PAGE_SIZE),
    enabled: routerCapabilities(membership).canViewRouters,
    staleTime: 0,
    refetchOnWindowFocus: true,
    // Les états (en ligne, hors ligne) évoluent : on rafraîchit doucement la liste.
    refetchInterval: 30_000,
    queryFn: async ({ signal }) => {
      const result = routerPageSchema.safeParse(
        await request(orgApi("/routers"), {
          signal,
          query: { page: String(page), size: String(PAGE_SIZE) },
        }),
      );
      if (
        !result.success ||
        result.data.content.some((r) => r.organizationId !== organizationId) ||
        new Set(result.data.content.map((r) => r.id)).size !==
          result.data.content.length
      )
        throw new ApiError("invalid-response");
      return result.data;
    },
  });
}

/**
 * Détail d'un routeur. Tant qu'une étape est en cours (préparation, installation,
 * attente du premier signal), on interroge l'état de mise en service toutes les 5 s.
 */
export function useRouter(id: string) {
  const { request } = useAuth();
  const client = useQueryClient();
  const { organizationId, membership } = useOrganization();
  const key = routerKeys.detail(organizationId, id);
  return useQuery<Router>({
    queryKey: key,
    enabled: routerCapabilities(membership).canViewRouters,
    staleTime: 0,
    refetchOnWindowFocus: true,
    refetchIntervalInBackground: false,
    refetchInterval: (q) => {
      if (
        q.state.error instanceof ApiError &&
        [401, 403, 404].includes(q.state.error.status)
      )
        return false;
      if (!isTrackingState(q.state.data)) return false;
      return q.state.error ? 15_000 : 5_000;
    },
    queryFn: async ({ signal }) => {
      if (!z.uuid().safeParse(id).success) throw new ApiError("http", 404);
      const previous = client.getQueryData<Router>(key);
      const live = isTrackingState(previous);
      return parseRouter(
        await request(path(id) + (live ? "/provisioning" : ""), { signal }),
        organizationId,
        id,
      );
    },
  });
}

export type RouterChange =
  | { action: "create"; values: RouterCreateValues }
  | { action: "rename"; router: Router; name: string }
  | { action: RouterAction; router: Router; key: string };

const actionRoutes: Record<RouterAction, [string, string]> = {
  provision: ["POST", "/provisioning"],
  artifact: ["POST", "/configuration-artifacts"],
  suspend: ["POST", "/suspension"],
  resume: ["DELETE", "/suspension"],
  revoke: ["POST", "/revocation"],
};

export async function sendRouterAction(
  request: ReturnType<typeof useAuth>["request"],
  organizationId: string,
  router: Router,
  action: RouterAction,
  key: string,
) {
  const [method, suffix] = actionRoutes[action];
  return parseRouter(
    await request(path(router.id) + suffix, {
      method,
      headers: { "Idempotency-Key": z.uuid().parse(key) },
    }),
    organizationId,
    router.id,
  );
}

function invalidate(client: QueryClient, org: string) {
  return client.invalidateQueries({ queryKey: routerKeys.all(org) });
}

export function useRouterChange() {
  const { request } = useAuth();
  const client = useQueryClient();
  const { organizationId, membership } = useOrganization();
  return useMutation({
    retry: false,
    mutationFn: async (change: RouterChange) => {
      const caps = routerCapabilities(
        membership,
        change.action === "create" ? undefined : change.router,
      );
      if (change.action === "create") {
        if (!caps.canCreateRouter) throw new ApiError("http", 403);
        const values = routerCreateSchema.parse(change.values);
        const router = parseRouter(
          await request("/api/routers", {
            method: "POST",
            body: { ...values, organizationId },
          }),
          organizationId,
        );
        return router;
      }
      if (change.action === "rename") {
        if (!caps.canEditRouter) throw new ApiError("http", 403);
        return parseRouter(
          await request(path(change.router.id) + "/name", {
            method: "PATCH",
            body: routerNameSchema.parse({ name: change.name }),
          }),
          organizationId,
          change.router.id,
        );
      }
      if (!caps.canCreateRouter) throw new ApiError("http", 403);
      return sendRouterAction(
        request,
        organizationId,
        change.router,
        change.action,
        change.key,
      );
    },
    onSuccess: (router) =>
      client.setQueryData(routerKeys.detail(organizationId, router.id), router),
    onSettled: () => invalidate(client, organizationId),
  });
}

const scriptSchema = z.custom<Blob>(
  (value) =>
    typeof value === "object" &&
    value !== null &&
    "size" in value &&
    "type" in value &&
    typeof value.size === "number" &&
    value.size > 0 &&
    value.size <= 65_536 &&
    typeof value.type === "string" &&
    (value.type === "" || value.type.toLowerCase().startsWith("text/plain")),
);

/**
 * Script d'installation courant. Il contient la clé du routeur : il n'est jamais gardé dans
 * le cache, jamais journalisé, seulement remis au téléchargement du navigateur.
 */
export function useRouterScriptDownload(router: Router) {
  const { request } = useAuth();
  const client = useQueryClient();
  const { organizationId, membership } = useOrganization();
  const [state, setState] = useState<{ pending: boolean; error: unknown }>({
    pending: false,
    error: null,
  });
  const running = useRef(false);
  async function download() {
    const artifactId = router.configurationArtifactId;
    if (running.current || !artifactId) return false;
    running.current = true;
    setState({ pending: true, error: null });
    try {
      if (!routerCapabilities(membership, router).download)
        throw new ApiError("http", 403);
      const result = scriptSchema.safeParse(
        await request(
          `${path(router.id)}/configuration-artifacts/${opaqueReference.parse(artifactId)}`,
          {
            headers: { Accept: "text/plain, application/problem+json" },
            responseType: "blob",
          },
        ),
      );
      if (!result.success) throw new ApiError("invalid-response");
      saveFile(result.data, artifactFileName(router));
      setState({ pending: false, error: null });
      return true;
    } catch (error) {
      setState({ pending: false, error });
      if (error instanceof ApiError && [404, 409, 410].includes(error.status))
        void invalidate(client, organizationId);
      return false;
    } finally {
      running.current = false;
    }
  }
  return {
    ...state,
    expired: state.error instanceof ApiError && state.error.status === 410,
    download,
    reset: () => setState({ pending: false, error: null }),
  };
}

function saveFile(blob: Blob, name: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = name;
  link.rel = "noopener";
  link.style.display = "none";
  document.body.append(link);
  try {
    link.click();
  } finally {
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 0);
  }
}

/** Site d'un routeur (lecture seule), pour vérifier qu'il est actif avant une action. */
export function useRouterSite(router: Router | undefined) {
  const { request } = useAuth();
  const { organizationId, orgApi } = useOrganization();
  return useQuery({
    queryKey: [
      "org",
      organizationId,
      "sites",
      "detail",
      router?.siteId ?? "none",
    ],
    enabled: !!router?.siteId,
    staleTime: 15_000,
    queryFn: async ({ signal }) =>
      parseSite(
        await request(orgApi(`/sites/${router!.siteId}`), { signal }),
        organizationId,
        router!.siteId!,
      ),
  });
}
