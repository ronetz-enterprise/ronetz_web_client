/**
 * Données simulées (NEXT_PUBLIC_ENABLE_MOCKS=true) : une organisation de Douala, quatre sites,
 * six routeurs, des offres et une semaine d'activité. Uniquement pour développer et montrer
 * l'interface : rien ici ne part vers un serveur.
 */

/** Identifiant stable et valide (UUID v4) : les adresses des fiches restent les mêmes d'un chargement à l'autre. */
export const id = (n: number) =>
  `00000000-0000-4000-8000-${n.toString(16).padStart(12, "0")}`;

const MIN = 60_000;
const HOUR = 60 * MIN;
const DAY = 24 * HOUR;
const iso = (t: number) => new Date(t).toISOString();

export type Db = ReturnType<typeof seed>;

export function seed(now = Date.now()) {
  const org = id(1);
  const user = id(2);

  const organization = {
    id: org,
    name: "Cyber Akwa",
    country: "CM",
    currency: "XAF",
    status: "ACTIVE",
    suspensionReason: null,
    suspendedAt: null,
    closedAt: null,
    createdAt: iso(now - 40 * DAY),
    updatedAt: iso(now - 40 * DAY),
  };

  const principal = {
    userId: user,
    email: "demo@ronetz.test",
    firstName: "Serge",
    lastName: "Mbarga",
    status: "ACTIVE",
    platformAdmin: false,
    emailVerified: true,
  };

  const membership = {
    membershipId: id(3),
    organizationId: org,
    organizationName: organization.name,
    organizationStatus: "ACTIVE",
    role: "OWNER",
    membershipStatus: "ACTIVE",
    permissions: [
      "ORGANIZATION_READ",
      "ORGANIZATION_UPDATE",
      "FINANCE_READ",
      "MEMBERSHIP_READ",
      "MEMBERSHIP_MANAGE",
    ],
  };

  const site = (
    n: number,
    name: string,
    district: string,
    status = "ACTIVE",
    ageDays = 30,
  ) => ({
    id: id(100 + n),
    organizationId: org,
    name,
    description: null as string | null,
    city: "Douala",
    district: district as string | null,
    addressDetails: null as string | null,
    timezone: "Africa/Douala",
    status,
    createdAt: iso(now - ageDays * DAY),
    updatedAt: iso(now - ageDays * DAY),
  });
  const sites = [
    site(1, "Cyber Akwa", "Akwa", "ACTIVE", 38),
    site(2, "Kiosque Bonamoussadi", "Bonamoussadi", "ACTIVE", 25),
    site(3, "Wi-Fi Makepe", "Makepe", "ACTIVE", 6),
    site(4, "Bonabéri Gare", "Bonabéri", "SUSPENDED", 20),
  ];

  const router = (
    n: number,
    siteIdx: number,
    name: string,
    model: string,
    state: "online" | "offline" | "enroll" | "new",
  ) => ({
    id: id(200 + n),
    organizationId: org,
    siteId: sites[siteIdx].id,
    name,
    vendor: "MikroTik",
    model,
    lifecycleStatus: "ACTIVE",
    provisioningStatus:
      state === "enroll"
        ? "PENDING_ENROLLMENT"
        : state === "new"
          ? "NOT_REQUESTED"
          : "REGISTERED",
    connectivityStatus:
      state === "online" ? "ONLINE" : state === "offline" ? "OFFLINE" : "UNKNOWN",
    provisioningOperationId: state === "new" ? null : `op_${n}`,
    configurationArtifactId: state === "enroll" ? `art_${n}` : null,
    failureCode: null as string | null,
    pendingAction: null as string | null,
    lastSeenAt:
      state === "online"
        ? iso(now - (n + 1) * MIN)
        : state === "offline"
          ? iso(now - 3 * HOUR)
          : null,
    createdAt: iso(now - (state === "new" ? 1 : 20) * DAY),
    updatedAt: iso(now - HOUR),
  });
  const routers = [
    router(1, 0, "Comptoir principal", "hAP ax²", "online"),
    router(2, 0, "Salle du fond", "cAP ax", "online"),
    router(3, 1, "Kiosque", "hAP ac²", "online"),
    router(4, 1, "Terrasse", "hEX S", "offline"),
    router(5, 2, "Entrée Makepe", "hAP lite", "enroll"),
    router(6, 2, "Étage Makepe", "RB4011", "new"),
  ];

  let offerN = 0;
  const offer = (
    siteIdx: number,
    name: string,
    minutes: number,
    price: number,
    devices: number,
    status = "PUBLISHED",
    dataGb: number | null = null,
    mbps: number | null = null,
  ) => {
    offerN += 1;
    return {
      offerId: id(300 + offerN),
      organizationId: org,
      siteId: sites[siteIdx].id,
      name,
      description: null as string | null,
      price: { amount: price, currencyCode: "XAF" },
      accessPolicy: {
        validitySeconds: minutes * 60,
        dataAllowanceBytes: dataGb === null ? null : dataGb * 1_000_000_000,
        downloadLimitBps: mbps === null ? null : mbps * 1_000_000,
        uploadLimitBps: mbps === null ? null : Math.round(mbps / 2) * 1_000_000,
        maxConcurrentSessions: devices,
      },
      status,
      displayOrder: offerN,
      createdAt: iso(now - 30 * DAY),
      updatedAt: iso(now - 2 * DAY),
    };
  };
  const offers = [
    offer(0, "30 minutes", 30, 100, 1),
    offer(0, "1 heure", 60, 200, 1),
    offer(0, "3 heures", 180, 500, 2),
    offer(0, "1 jour", 1440, 1000, 2, "PUBLISHED", null, 10),
    offer(0, "1 semaine", 10080, 5000, 3, "PUBLISHED", 20, 10),
    offer(0, "1 mois", 43200, 15000, 3, "SUSPENDED", 60, 10),
    offer(1, "1 heure", 60, 200, 1),
    offer(1, "1 jour", 1440, 1000, 2),
    offer(1, "1 semaine", 10080, 5000, 3, "PUBLISHED", 20, null),
    offer(2, "1 heure", 60, 150, 1),
    offer(2, "1 jour", 1440, 800, 2, "DRAFT"),
    offer(3, "1 jour", 1440, 1000, 2),
  ];

  // Une semaine de ventes : surtout des heures et des journées, l'après-midi et le soir.
  const letters = "abcdefghjkmnpqrstuvwxyz23456789";
  let rnd = 7;
  const rand = () => {
    rnd = (rnd * 16807) % 2147483647;
    return rnd / 2147483647;
  };
  const code = (prefix: string) =>
    prefix +
    "-" +
    Array.from({ length: 4 }, () => letters[Math.floor(rand() * letters.length)]).join("");

  type Grant = ReturnType<typeof grantOf>;
  const grantOf = (
    n: number,
    o: (typeof offers)[number],
    issuedAt: number,
    source: string,
  ) => {
    const ends = issuedAt + o.accessPolicy.validitySeconds * 1000;
    const active = ends > now;
    return {
      accessGrantId: id(1000 + n),
      organizationId: org,
      siteId: o.siteId,
      subjectType: "ANONYMOUS",
      subjectId: null as string | null,
      sourceType: source,
      sourceId: source === "PAID_ORDER" ? id(5000 + n) : null,
      policy: { ...o.accessPolicy },
      activationMode: "IMMEDIATE",
      status: active ? "ACTIVE" : "EXPIRED",
      projectionStatus: active ? "APPLIED" : "REMOVED",
      issuedByIdentityId: source === "MANUAL_GRANT" ? user : null,
      issuedAt: iso(issuedAt),
      activatedAt: iso(issuedAt),
      expiresAt: iso(ends),
      suspendedAt: null as string | null,
      revokedAt: null as string | null,
      updatedAt: iso(Math.min(ends, now)),
      username: code(o.siteId === sites[0].id ? "akwa" : o.siteId === sites[1].id ? "bona" : "mkp"),
      offerPrice: o.price.amount,
    };
  };
  const sellable = offers.filter((o) => o.status === "PUBLISHED" && o.siteId !== sites[3].id);
  const weights = sellable.map((o) =>
    o.accessPolicy.validitySeconds <= 3600 ? 5 : o.accessPolicy.validitySeconds <= 86400 ? 3 : 1,
  );
  const pick = () => {
    let r = rand() * weights.reduce((a, b) => a + b, 0);
    for (let i = 0; i < sellable.length; i++) {
      r -= weights[i];
      if (r <= 0) return sellable[i];
    }
    return sellable[0];
  };
  const grants: Grant[] = [];
  for (let n = 0; n < 46; n++) {
    const daysAgo = Math.floor(rand() * 7);
    const hour = 9 + Math.floor(rand() * 13);
    const start = new Date(now - daysAgo * DAY);
    start.setHours(hour, Math.floor(rand() * 60), 0, 0);
    const t = Math.min(start.getTime(), now - 5 * MIN - n * MIN);
    grants.push(grantOf(n, pick(), t, rand() < 0.15 ? "MANUAL_GRANT" : "PAID_ORDER"));
  }
  // Quelques cas particuliers pour voir tous les états.
  const live = grants.filter((g) => g.status === "ACTIVE");
  if (live[0]) {
    live[0].status = "SUSPENDED";
    live[0].suspendedAt = iso(now - 20 * MIN);
  }
  if (live[1]) {
    live[1].status = "REVOKED";
    live[1].projectionStatus = "REMOVED";
    live[1].revokedAt = iso(now - 40 * MIN);
  }
  const fresh = grantOf(99, offers[1], now - 2 * MIN, "PAID_ORDER");
  fresh.status = "PENDING_PROVISIONING";
  fresh.projectionStatus = "PENDING";
  grants.push(fresh);
  grants.sort((a, b) => b.issuedAt.localeCompare(a.issuedAt));

  // Grand livre : une vente payée par accès payé (commission de 10 %), plus deux versements passés.
  const ledger = grants
    .filter((g) => g.sourceType === "PAID_ORDER" && g.status !== "PENDING_PROVISIONING")
    .map((g, i) => {
      const gross = g.offerPrice;
      const commission = Math.round(gross * 0.1);
      return {
        id: id(2000 + i),
        reference: `VTE-${String(1200 + i)}`,
        type: "SALE",
        status: "POSTED",
        grossAmount: gross,
        commissionAmount: commission,
        netAmount: gross - commission,
        currency: "XAF",
        externalReference: `MP${String(880000 + i)}` as string | null,
        createdAt: g.issuedAt,
      };
    });
  ledger.push(
    {
      id: id(2900),
      reference: "VRS-0042",
      type: "PAYOUT",
      status: "POSTED",
      grossAmount: 45000,
      commissionAmount: 0,
      netAmount: 45000,
      currency: "XAF",
      externalReference: null,
      createdAt: iso(now - 9 * DAY),
    },
    {
      id: id(2901),
      reference: "VRS-0039",
      type: "PAYOUT",
      status: "POSTED",
      grossAmount: 38500,
      commissionAmount: 0,
      netAmount: 38500,
      currency: "XAF",
      externalReference: null,
      createdAt: iso(now - 23 * DAY),
    },
  );
  ledger.sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  const countries = [
    { code: "CM", name: "Cameroun", currency: "XAF", timeZone: "Africa/Douala", open: true },
    { code: "CI", name: "Côte d’Ivoire", currency: "XOF", timeZone: "Africa/Abidjan", open: false },
    { code: "SN", name: "Sénégal", currency: "XOF", timeZone: "Africa/Dakar", open: false },
    { code: "GA", name: "Gabon", currency: "XAF", timeZone: "Africa/Libreville", open: false },
    { code: "TD", name: "Tchad", currency: "XAF", timeZone: "Africa/Ndjamena", open: false },
    { code: "BF", name: "Burkina Faso", currency: "XOF", timeZone: "Africa/Ouagadougou", open: false },
  ];

  return {
    seededAt: now,
    nextId: 9000,
    signedIn: false,
    organization,
    principal,
    membership,
    member: {
      id: id(4),
      userId: user,
      organizationId: org,
      role: "OWNER",
      status: "ACTIVE",
      createdAt: organization.createdAt,
      updatedAt: organization.createdAt,
    },
    sites,
    routers,
    offers,
    grants,
    ledger,
    countries,
    waitlist: [] as { country: string; createdAt: string }[],
    paidOut: 83500,
  };
}
