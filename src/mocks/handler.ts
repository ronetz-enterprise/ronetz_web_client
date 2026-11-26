/**
 * Serveur simulé, dans le navigateur. Activé par NEXT_PUBLIC_ENABLE_MOCKS=true (interdit en
 * staging et production par la configuration). Il répond aux mêmes adresses que le backend,
 * avec les mêmes formats, et garde les modifications dans le stockage local du navigateur.
 */
import { id, seed, type Db } from "./data";

const KEY = "ronetz-mock-db-v1";
const MAX_AGE = 6 * 60 * 60 * 1000;
let db: Db | null = null;

function load(): Db {
  if (db) return db;
  try {
    const raw = localStorage.getItem(KEY);
    const saved = raw ? (JSON.parse(raw) as Db) : null;
    if (saved && Date.now() - saved.seededAt < MAX_AGE) db = saved;
  } catch {
    // Stockage indisponible : on repart des données d'exemple.
  }
  db ??= seed();
  return db;
}
function save() {
  try {
    localStorage.setItem(KEY, JSON.stringify(db));
  } catch {
    // Sans stockage, les modifications vivent jusqu'au rechargement.
  }
}
/** Remet les données d'exemple à zéro (utile pendant une démonstration). */
export function resetMockData() {
  db = seed();
  save();
}

const now = () => new Date().toISOString();
const newId = () => id(load().nextId++);

const json = (status: number, body?: unknown) =>
  new Response(body === undefined ? null : JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json",
      "X-Correlation-Id": "mock",
    },
  });
const problem = (status: number, title: string, code?: string) =>
  new Response(JSON.stringify({ title, status, ...(code ? { code } : {}) }), {
    status,
    headers: { "Content-Type": "application/problem+json" },
  });
const page = <T>(all: T[], q: URLSearchParams, defSize = 20) => {
  const p = Number(q.get("page") ?? 0);
  const size = Number(q.get("size") ?? defSize);
  return {
    content: all.slice(p * size, p * size + size),
    page: p,
    size,
    totalElements: all.length,
    totalPages: Math.max(1, Math.ceil(all.length / size)),
  };
};

// Champs internes des données d'exemple, jamais renvoyés.
const cleanGrant = (g: Db["grants"][number]) => {
  const copy: Record<string, unknown> = { ...g };
  delete copy.offerPrice;
  return copy;
};

const words = "abcdefghjkmnpqrstuvwxyz23456789";
const short = (n: number) =>
  Array.from({ length: n }, () => words[Math.floor(Math.random() * words.length)]).join("");

function balance(d: Db) {
  const sales = d.ledger.filter((t) => t.type === "SALE");
  const net = sales.reduce((s, t) => s + t.netAmount, 0);
  return {
    organizationId: d.organization.id,
    availableAmount: Math.max(0, net - d.paidOut + 83500 - 3200),
    reservedAmount: 0,
    paidOutAmount: d.paidOut,
    pendingAmount: 0,
    currency: "XAF",
  };
}

function salesReport(d: Db, q: URLSearchParams) {
  const from = q.get("from") ?? "";
  const to = q.get("to") ?? "9999";
  const sales = d.ledger.filter(
    (t) => t.type === "SALE" && t.createdAt.slice(0, 10) >= from && t.createdAt.slice(0, 10) <= to,
  );
  const byDay = new Map<string, { count: number; gross: number; com: number; net: number }>();
  for (const t of sales) {
    const day = t.createdAt.slice(0, 10);
    const e = byDay.get(day) ?? { count: 0, gross: 0, com: 0, net: 0 };
    e.count += 1;
    e.gross += t.grossAmount;
    e.com += t.commissionAmount;
    e.net += t.netAmount;
    byDay.set(day, e);
  }
  const sum = (k: "grossAmount" | "commissionAmount" | "netAmount") =>
    sales.reduce((s, t) => s + t[k], 0);
  return {
    organizationId: d.organization.id,
    currency: "XAF",
    salesCount: sales.length,
    confirmedPayments: sales.length,
    failedPayments: Math.round(sales.length / 12),
    grossRevenue: sum("grossAmount"),
    commissionAmount: sum("commissionAmount"),
    netRevenue: sum("netAmount"),
    series: [...byDay.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([periodStart, e]) => ({
        periodStart,
        count: e.count,
        grossAmount: e.gross,
        commissionAmount: e.com,
        netAmount: e.net,
      })),
  };
}

type Ctx = { method: string; path: string; q: URLSearchParams; body: unknown; auth: boolean };
type Route = [string, RegExp, (ctx: Ctx, m: RegExpMatchArray, d: Db) => Response];

const UUID = "([0-9a-f-]{36})";
const ORG = `/api/organizations/${UUID}`;

const routes: Route[] = [
  // ── Session ──────────────────────────────────────────────────────────────
  ["GET", /^\/api\/auth\/web\/csrf$/, () => json(200, { headerName: "X-XSRF-TOKEN", token: "mock-csrf" })],
  ["POST", /^\/api\/auth\/web\/login$/, (_c, _m, d) => {
    d.signedIn = true;
    return json(200, { accessToken: "mock-token", tokenType: "Bearer", expiresIn: 3600 });
  }],
  ["POST", /^\/api\/auth\/web\/refresh$/, (_c, _m, d) =>
    d.signedIn
      ? json(200, { accessToken: "mock-token", tokenType: "Bearer", expiresIn: 3600 })
      : problem(401, "Session expirée")],
  ["POST", /^\/api\/auth\/web\/logout$/, (_c, _m, d) => {
    d.signedIn = false;
    return json(204);
  }],
  ["POST", /^\/api\/auth\/register$/, () => json(201, {})],

  // ── Compte et organisation ──────────────────────────────────────────────
  ["GET", /^\/api\/me$/, (_c, _m, d) => json(200, d.principal)],
  ["GET", /^\/api\/me\/memberships$/, (_c, _m, d) => json(200, { items: [d.membership] })],
  ["GET", /^\/api\/me\/country-waitlist$/, (_c, _m, d) => json(200, d.waitlist)],
  ["POST", /^\/api\/me\/country-waitlist$/, (c, _m, d) => {
    const b = c.body as { country?: string };
    d.waitlist.push({ country: b?.country ?? "", createdAt: now() });
    return json(201, { country: b?.country, createdAt: now() });
  }],
  ["GET", /^\/api\/public\/countries$/, (_c, _m, d) => json(200, d.countries)],
  ["POST", /^\/api\/organizations$/, () =>
    problem(409, "Vous avez déjà une organisation.", "ORGANIZATION_LIMIT_REACHED")],
  ["GET", new RegExp(`^${ORG}$`), (_c, _m, d) => json(200, d.organization)],
  ["PATCH", new RegExp(`^${ORG}$`), () => problem(405, "Modification pas encore disponible.")],
  ["GET", new RegExp(`^${ORG}/memberships$`), (_c, _m, d) => json(200, [d.member])],

  // ── Sites ───────────────────────────────────────────────────────────────
  ["GET", new RegExp(`^${ORG}/sites$`), (_c, _m, d) => json(200, d.sites)],
  ["POST", new RegExp(`^${ORG}/sites$`), (c, _m, d) => {
    const b = c.body as { name: string; city: string; district?: string; addressDetails?: string };
    const site = {
      id: newId(),
      organizationId: d.organization.id,
      name: b.name,
      description: null,
      city: b.city,
      district: b.district ?? null,
      addressDetails: b.addressDetails ?? null,
      timezone: "Africa/Douala",
      status: "ACTIVE",
      createdAt: now(),
      updatedAt: now(),
    };
    d.sites.push(site);
    return json(201, site);
  }],
  ["GET", new RegExp(`^${ORG}/sites/${UUID}$`), (_c, m, d) => {
    const s = d.sites.find((x) => x.id === m[2]);
    return s ? json(200, s) : problem(404, "Site introuvable");
  }],
  ["PATCH", new RegExp(`^${ORG}/sites/${UUID}$`), (c, m, d) => {
    const s = d.sites.find((x) => x.id === m[2]);
    if (!s) return problem(404, "Site introuvable");
    Object.assign(s, c.body, { updatedAt: now() });
    return json(200, s);
  }],
  ["POST", new RegExp(`^${ORG}/sites/${UUID}/(suspension|reactivation)$`), (_c, m, d) => {
    const s = d.sites.find((x) => x.id === m[2]);
    if (!s) return problem(404, "Site introuvable");
    s.status = m[3] === "suspension" ? "SUSPENDED" : "ACTIVE";
    s.updatedAt = now();
    return json(200, s);
  }],
  ["DELETE", new RegExp(`^${ORG}/sites/${UUID}$`), (_c, m, d) => {
    const s = d.sites.find((x) => x.id === m[2]);
    if (!s) return problem(404, "Site introuvable");
    s.status = "CLOSED";
    return json(204);
  }],

  // ── Routeurs ────────────────────────────────────────────────────────────
  ["GET", new RegExp(`^${ORG}/routers$`), (c, _m, d) => json(200, page(d.routers, c.q))],
  ["POST", /^\/api\/routers$/, (c, _m, d) => {
    const b = c.body as { name: string; vendor: string; model: string; siteId: string };
    const r = {
      id: newId(),
      organizationId: d.organization.id,
      siteId: b.siteId,
      name: b.name,
      vendor: b.vendor,
      model: b.model,
      lifecycleStatus: "ACTIVE",
      provisioningStatus: "NOT_REQUESTED",
      connectivityStatus: "UNKNOWN",
      provisioningOperationId: null,
      configurationArtifactId: null,
      failureCode: null,
      pendingAction: null,
      lastSeenAt: null,
      createdAt: now(),
      updatedAt: now(),
    };
    d.routers.push(r);
    return json(201, r);
  }],
  ["GET", new RegExp(`^/api/routers/${UUID}(/provisioning)?$`), (_c, m, d) => {
    const r = d.routers.find((x) => x.id === m[1]);
    return r ? json(200, r) : problem(404, "Routeur introuvable");
  }],
  ["PATCH", new RegExp(`^/api/routers/${UUID}/name$`), (c, m, d) => {
    const r = d.routers.find((x) => x.id === m[1]);
    if (!r) return problem(404, "Routeur introuvable");
    r.name = (c.body as { name: string }).name;
    r.updatedAt = now();
    return json(200, r);
  }],
  ["GET", new RegExp(`^/api/routers/${UUID}/configuration-artifacts/([A-Za-z0-9_-]+)$`), (_c, m) =>
    new Response(
      `# Script de configuration simulé pour le routeur ${m[1]}\n# (mode démonstration : aucun effet réel)\n`,
      { status: 200, headers: { "Content-Type": "text/plain" } },
    )],
  ["*", new RegExp(`^/api/routers/${UUID}/(provisioning|configuration-artifacts|suspension|revocation)$`), (c, m, d) => {
    const r = d.routers.find((x) => x.id === m[1]);
    if (!r) return problem(404, "Routeur introuvable");
    const action = m[2];
    if (action === "provisioning") {
      r.provisioningStatus = "PENDING_ENROLLMENT";
      r.provisioningOperationId = `op_${short(6)}`;
    } else if (action === "configuration-artifacts") {
      r.configurationArtifactId = `art_${short(8)}`;
    } else if (action === "suspension") {
      r.lifecycleStatus = c.method === "DELETE" ? "ACTIVE" : "SUSPENDED";
    } else if (action === "revocation") {
      r.lifecycleStatus = "REVOKED";
      r.connectivityStatus = "UNKNOWN";
    }
    r.updatedAt = now();
    return json(200, r);
  }],

  // ── Offres ──────────────────────────────────────────────────────────────
  ["GET", new RegExp(`^${ORG}/sites/${UUID}/offers$`), (c, m, d) =>
    json(200, page(d.offers.filter((o) => o.siteId === m[2]).sort((a, b) => a.displayOrder - b.displayOrder), c.q))],
  ["POST", new RegExp(`^${ORG}/sites/${UUID}/offers$`), (c, m, d) => {
    const b = c.body as Record<string, unknown>;
    const o = {
      offerId: newId(),
      organizationId: d.organization.id,
      siteId: m[2],
      name: String(b.name),
      description: (b.description as string | null) ?? null,
      price: { amount: Number(b.amount), currencyCode: "XAF" },
      accessPolicy: {
        validitySeconds: Number(b.validitySeconds),
        dataAllowanceBytes: b.dataAllowanceBytes == null ? null : Number(b.dataAllowanceBytes),
        downloadLimitBps: b.downloadLimitBps == null ? null : Number(b.downloadLimitBps),
        uploadLimitBps: b.uploadLimitBps == null ? null : Number(b.uploadLimitBps),
        maxConcurrentSessions: Number(b.maxConcurrentSessions),
      },
      status: "DRAFT",
      displayOrder: Number(b.displayOrder ?? 0),
      createdAt: now(),
      updatedAt: now(),
    };
    d.offers.push(o);
    return json(201, o);
  }],
  ["*", new RegExp(`^/api/offers/${UUID}(/[a-z-]+)?$`), (c, m, d) => {
    const o = d.offers.find((x) => x.offerId === m[1]);
    if (!o) return problem(404, "Offre introuvable");
    const b = (c.body ?? {}) as Record<string, unknown>;
    const sub = m[2] ?? "";
    if (c.method === "GET" && !sub) return json(200, o);
    if (c.method === "PATCH" && !sub) {
      if (b.name !== undefined) o.name = String(b.name);
      if (b.description !== undefined) o.description = (b.description as string) || null;
    } else if (sub === "/price") {
      o.price.amount = Number(b.amount);
    } else if (sub === "/access-policy") {
      const n = (v: unknown) => (v == null ? null : Number(v));
      o.accessPolicy = {
        validitySeconds: Number(b.validitySeconds),
        dataAllowanceBytes: n(b.dataAllowanceBytes),
        downloadLimitBps: n(b.downloadLimitBps),
        uploadLimitBps: n(b.uploadLimitBps),
        maxConcurrentSessions: Number(b.maxConcurrentSessions),
      };
    } else if (sub === "/display-order") {
      o.displayOrder = Number(b.displayOrder);
    } else if (sub === "/publication") {
      o.status = "PUBLISHED";
    } else if (sub === "/suspension") {
      o.status = c.method === "DELETE" ? "PUBLISHED" : "SUSPENDED";
    } else if (sub === "/archival") {
      o.status = "ARCHIVED";
    } else return problem(404, "Action inconnue");
    o.updatedAt = now();
    return json(200, o);
  }],

  // ── Accès ───────────────────────────────────────────────────────────────
  ["GET", new RegExp(`^${ORG}/access-grants$`), (c, _m, d) =>
    json(200, page(d.grants.map(cleanGrant), c.q))],
  ["GET", new RegExp(`^${ORG}/sites/${UUID}/access-grants$`), (c, m, d) =>
    json(200, page(d.grants.filter((g) => g.siteId === m[2]).map(cleanGrant), c.q))],
  ["POST", new RegExp(`^${ORG}/sites/${UUID}/access-grants/manual$`), (c, m, d) => {
    const b = c.body as { policy: Db["grants"][number]["policy"]; subjectType: string };
    const t = Date.now();
    const site = d.sites.find((s) => s.id === m[2]);
    const prefix = (site?.district ?? "rz").slice(0, 4).toLowerCase().normalize("NFD").replace(/[^a-z]/g, "");
    const expires = new Date(t + b.policy.validitySeconds * 1000).toISOString();
    const g = {
      accessGrantId: newId(),
      organizationId: d.organization.id,
      siteId: m[2],
      subjectType: b.subjectType ?? "ANONYMOUS",
      subjectId: null,
      sourceType: "MANUAL_GRANT",
      sourceId: null,
      policy: b.policy,
      activationMode: "IMMEDIATE",
      status: "ACTIVE",
      projectionStatus: "APPLIED",
      issuedByIdentityId: d.principal.userId,
      issuedAt: new Date(t).toISOString(),
      activatedAt: new Date(t).toISOString(),
      expiresAt: expires,
      suspendedAt: null,
      revokedAt: null,
      updatedAt: new Date(t).toISOString(),
      username: `${prefix || "rz"}-${short(4)}`,
      offerPrice: 0,
    };
    d.grants.unshift(g);
    return json(201, {
      created: true,
      grant: cleanGrant(g),
      credentialDelivery: {
        credentialId: newId(),
        username: g.username,
        clearTextPassword: short(6),
        expiresAt: expires,
      },
      retrievalToken: null,
    });
  }],
  ["*", new RegExp(`^/api/access-grants/${UUID}(/suspension|/revocation|/projection-retries)?$`), (c, m, d) => {
    const g = d.grants.find((x) => x.accessGrantId === m[1]);
    if (!g) return problem(404, "Accès introuvable");
    const sub = m[2];
    if (sub === "/suspension") {
      g.status = c.method === "DELETE" ? "ACTIVE" : "SUSPENDED";
      g.suspendedAt = c.method === "DELETE" ? null : now();
    } else if (sub === "/revocation") {
      g.status = "REVOKED";
      g.revokedAt = now();
      g.projectionStatus = "REMOVED";
    } else if (sub === "/projection-retries") {
      g.status = "ACTIVE";
      g.projectionStatus = "APPLIED";
    }
    if (sub) g.updatedAt = now();
    return json(200, cleanGrant(g));
  }],

  // ── Argent ──────────────────────────────────────────────────────────────
  ["GET", new RegExp(`^${ORG}/accounting/balance$`), (_c, _m, d) => json(200, balance(d))],
  ["GET", new RegExp(`^${ORG}/accounting/ledger$`), (c, _m, d) => {
    const type = c.q.get("type");
    const from = c.q.get("from");
    const to = c.q.get("to");
    const rows = d.ledger.filter(
      (t) =>
        (!type || t.type === type) &&
        (!from || t.createdAt >= from) &&
        (!to || t.createdAt <= to),
    );
    return json(200, page(rows, c.q));
  }],
  ["GET", new RegExp(`^${ORG}/withdrawals$`), (c) => json(200, page([], c.q))],
  ["POST", new RegExp(`^${ORG}/withdrawals$`), () =>
    problem(409, "Les retraits seront bientôt disponibles.", "WITHDRAWALS_DISABLED")],
  ["POST", /^\/api\/auth\/password-reset\/request$/, () => json(202)],
  ["POST", /^\/api\/auth\/email-verification\/resend$/, () => json(202)],
  ["POST", /^\/api\/auth\/(password-reset\/confirm|email-verification\/confirm)$/, ({ body }) =>
    (body as { token?: string })?.token === "expire"
      ? problem(410, "Lien expiré", "TOKEN_EXPIRED")
      : json(204)],
  ["GET", /^\/api\/public\/pricing$/, () => json(200, { commissionRate: 0.1, currency: "XAF", effectiveFrom: "2026-11-26", withdrawal: { enabled: false, minimumAmount: 1000, approvalThreshold: 100000 } })],
  ["GET", /^\/api\/accounting\/pricing$/, () => json(200, { commissionRate: 0.1, currency: "XAF" })],

  // ── Rapports ────────────────────────────────────────────────────────────
  ["GET", new RegExp(`^${ORG}/reports/sales$`), (c, _m, d) => json(200, salesReport(d, c.q))],
  ["GET", new RegExp(`^${ORG}/reports/access$`), (c, _m, d) => {
    const siteId = c.q.get("siteId");
    const gs = d.grants.filter((g) => !siteId || g.siteId === siteId);
    const by = (s: string) => gs.filter((g) => g.status === s).length;
    return json(200, {
      organizationId: d.organization.id,
      period: {
        from: c.q.get("from"),
        to: c.q.get("to"),
        timeZone: c.q.get("timeZone") ?? "Africa/Douala",
        granularity: "DAY",
      },
      created: gs.length,
      provisioned: gs.length - by("PENDING_PROVISIONING"),
      active: by("ACTIVE"),
      expired: by("EXPIRED"),
      suspended: by("SUSPENDED"),
      revoked: by("REVOKED"),
      authenticationSuccesses: gs.length * 3,
      authenticationFailures: Math.round(gs.length / 5),
      sessions: gs.length * 2,
      inputBytes: gs.length * 180_000_000,
      outputBytes: gs.length * 1_350_000_000,
    });
  }],
  ["GET", new RegExp(`^${ORG}/reports/routers$`), (_c, _m, d) =>
    json(200, d.routers.map((r, i) => ({
      organizationId: d.organization.id,
      siteId: r.siteId,
      routerId: r.id,
      routerName: r.name,
      status: r.connectivityStatus,
      lastSeenAt: r.lastSeenAt,
      accessCount: r.lastSeenAt ? 30 - i * 4 : 0,
      authenticationSuccessCount: r.lastSeenAt ? 90 - i * 10 : 0,
      authenticationFailureCount: r.lastSeenAt ? 4 : 0,
      totalSessionCount: r.lastSeenAt ? 60 - i * 6 : 0,
      totalInputBytes: r.lastSeenAt ? 4_200_000_000 - i * 500_000_000 : 0,
      totalOutputBytes: r.lastSeenAt ? 31_000_000_000 - i * 4_000_000_000 : 0,
    })))],
  ["GET", new RegExp(`^${ORG}/reports/sites$`), (_c, _m, d) =>
    json(200, d.sites.map((s) => {
      const rs = d.routers.filter((r) => r.siteId === s.id);
      return {
        organizationId: d.organization.id,
        siteId: s.id,
        siteName: s.name,
        routerCount: rs.length,
        onlineRouterCount: rs.filter((r) => r.connectivityStatus === "ONLINE").length,
        activeOfferCount: d.offers.filter((o) => o.siteId === s.id && o.status === "PUBLISHED").length,
        purchaseCount: d.grants.filter((g) => g.siteId === s.id && g.sourceType === "PAID_ORDER").length,
        successfulPaymentCount: d.grants.filter((g) => g.siteId === s.id && g.sourceType === "PAID_ORDER").length,
        accessCount: d.grants.filter((g) => g.siteId === s.id).length,
      };
    }))],
];

const PUBLIC = /^\/api\/(auth\/|public\/)/;

/** Répond comme le backend à une requête de l'application. */
export async function mockFetch(url: string, init: RequestInit): Promise<Response> {
  const parsed = new URL(url, "http://mock.local");
  const path = parsed.pathname;
  const method = (init.method ?? "GET").toUpperCase();
  const headers = new Headers(init.headers);
  let body: unknown;
  if (typeof init.body === "string" && init.body) {
    try {
      body = JSON.parse(init.body);
    } catch {
      body = init.body;
    }
  }
  // Un peu d'attente, pour voir les chargements comme en vrai.
  await new Promise((r) => setTimeout(r, 120 + Math.random() * 180));
  if (init.signal?.aborted) throw new DOMException("Aborted", "AbortError");

  const d = load();
  const auth = headers.get("Authorization") === "Bearer mock-token";
  if (!PUBLIC.test(path) && path.startsWith("/api/") && !auth)
    return problem(401, "Authentification requise");
  if (path.startsWith("/api/platform") || path.startsWith("/api/admin"))
    return problem(403, "Réservé à l'équipe Ronetz");

  for (const [m, re, handle] of routes) {
    if (m !== "*" && m !== method) continue;
    const match = path.match(re);
    if (!match) continue;
    const response = handle({ method, path, q: parsed.searchParams, body, auth }, match, d);
    if (method !== "GET") save();
    else if (path.startsWith("/api/auth/")) save();
    return response;
  }
  return problem(404, `Adresse non simulée : ${method} ${path}`);
}
