import { z } from "zod";
import { ApiError } from "@/lib/api-error";
import type { useAuth } from "@/features/authentication/hooks/auth-provider";
import { offerJsonCodec, ExactNumber } from "./exact-json";
import {
  adminOfferPageSchema,
  adminOfferSchema,
  createSchema,
  detailsSchema,
  orderSchema,
  policySchema,
  priceSchema,
  type AdminOffer,
  type CreateValues,
  type OfferAction,
  type SiteLite,
} from "../model/admin";

type Request = ReturnType<typeof useAuth>["request"];

const uuid = (value: string) => {
  if (!z.uuid().safeParse(value).success) throw new ApiError("http", 404);
  return value;
};
const collection = (org: string, site: string) =>
  `/api/organizations/${uuid(org)}/sites/${uuid(site)}/offers`;
const detail = (id: string) => `/api/offers/${uuid(id)}`;

export function parseOffer(
  value: unknown,
  org: string,
  site?: string,
  id?: string,
): AdminOffer {
  const parsed = adminOfferSchema.safeParse(value);
  if (!parsed.success) throw new ApiError("invalid-response");
  if (
    parsed.data.organizationId !== org ||
    (site && parsed.data.siteId !== site) ||
    (id && parsed.data.offerId !== id)
  )
    throw new ApiError("http", 404);
  return parsed.data;
}

const siteSchema = z.object({
  id: z.uuid(),
  organizationId: z.uuid(),
  name: z.string(),
  status: z.enum(["ACTIVE", "SUSPENDED", "CLOSED"]),
});

export async function fetchSites(
  request: Request,
  org: string,
  signal?: AbortSignal,
): Promise<SiteLite[]> {
  const parsed = z
    .array(siteSchema.loose())
    .safeParse(await request(`/api/organizations/${org}/sites`, { signal }));
  if (!parsed.success || parsed.data.some((s) => s.organizationId !== org))
    throw new ApiError("invalid-response");
  return parsed.data.map(({ id, organizationId, name, status }) => ({
    id,
    organizationId,
    name,
    status,
  }));
}

export async function fetchCurrency(
  request: Request,
  org: string,
  signal?: AbortSignal,
) {
  const parsed = z
    .object({ id: z.uuid(), currency: z.string().regex(/^[A-Z]{3}$/) })
    .loose()
    .safeParse(await request(`/api/organizations/${org}`, { signal }));
  if (!parsed.success || parsed.data.id !== org)
    throw new ApiError("invalid-response");
  return parsed.data.currency;
}

export async function fetchOffer(
  request: Request,
  org: string,
  id: string,
  signal?: AbortSignal,
) {
  return parseOffer(
    await request(detail(id), { signal, jsonCodec: offerJsonCodec }),
    org,
    undefined,
    id,
  );
}

export async function fetchSiteOffers(
  request: Request,
  org: string,
  site: string,
  page: number,
  size: number,
  signal?: AbortSignal,
) {
  const parsed = adminOfferPageSchema.safeParse(
    await request(collection(org, site), {
      signal,
      jsonCodec: offerJsonCodec,
      query: { page: String(page), size: String(size) },
    }),
  );
  if (
    !parsed.success ||
    parsed.data.content.length > size ||
    new Set(parsed.data.content.map((o) => o.offerId)).size !==
      parsed.data.content.length ||
    parsed.data.content.some(
      (o) => o.organizationId !== org || o.siteId !== site,
    )
  )
    throw new ApiError("invalid-response");
  return parsed.data;
}

const policyBody = (values: z.infer<typeof policySchema>) =>
  Object.fromEntries(
    Object.entries(values).map(([key, v]) => [
      key,
      v === "" ? null : new ExactNumber(v),
    ]),
  );

export type Change =
  | { action: "create"; siteId: string; values: CreateValues; currency: string }
  | {
      action: "details" | "price" | "policy" | "order";
      offer: AdminOffer;
      values: Partial<CreateValues>;
      currency: string;
    }
  | { action: OfferAction; offer: AdminOffer };

const actionRoutes: Record<OfferAction, [string, string]> = {
  publish: ["POST", "/publication"],
  suspend: ["POST", "/suspension"],
  resume: ["DELETE", "/suspension"],
  archive: ["POST", "/archival"],
};

/** Construit l'appel d'une modification (adresse, méthode, corps) : pur, donc testable. */
export function buildCommand(
  change: Change,
  org: string,
): { url: string; method: string; body?: unknown } {
  if (change.action === "create") {
    const v = createSchema(change.currency).parse(change.values);
    return {
      url: collection(org, change.siteId),
      method: "POST",
      body: {
        name: v.name,
        description: v.description || null,
        amount: new ExactNumber(v.amount),
        currencyCode: change.currency,
        ...policyBody(policySchema.parse(v)),
        displayOrder: new ExactNumber(v.displayOrder),
      },
    };
  }
  const url = detail(change.offer.offerId);
  switch (change.action) {
    case "details":
      return {
        url,
        method: "PATCH",
        body: detailsSchema.partial().parse(change.values),
      };
    case "price":
      return {
        url: url + "/price",
        method: "PATCH",
        body: {
          amount: new ExactNumber(
            priceSchema(change.currency).parse(change.values).amount,
          ),
          currencyCode: change.currency,
        },
      };
    case "policy":
      return {
        url: url + "/access-policy",
        method: "PATCH",
        body: policyBody(policySchema.parse(change.values)),
      };
    case "order":
      return {
        url: url + "/display-order",
        method: "PATCH",
        body: {
          displayOrder: new ExactNumber(
            orderSchema.parse(change.values).displayOrder,
          ),
        },
      };
    default: {
      const [method, suffix] = actionRoutes[change.action];
      return { url: url + suffix, method };
    }
  }
}

export async function sendCommand(
  request: Request,
  cmd: ReturnType<typeof buildCommand>,
  org: string,
  site: string,
  id?: string,
  signal?: AbortSignal,
) {
  return parseOffer(
    await request(cmd.url, {
      method: cmd.method,
      body: cmd.body,
      signal,
      jsonCodec: offerJsonCodec,
    }),
    org,
    site,
    id,
  );
}
