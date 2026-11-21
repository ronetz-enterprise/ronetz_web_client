/** DONNÉES D'EXEMPLE — inventées pour la démonstration des gabarits, rien de réel. */

export type AccessStatus =
  "active" | "expiring" | "expired" | "suspended" | "cancelled";

export type Access = {
  id: string;
  code: string;
  offer: string;
  site: string;
  /** Minutes restantes (0 = terminé). */
  minutesLeft: number;
  status: AccessStatus;
  price: number;
  /** Jour de vente, déjà libellé. */
  day: string;
};

const OFFERS: Record<string, { name: string; price: number }> = {
  h1: { name: "1 heure", price: 200 },
  d1: { name: "1 jour", price: 500 },
  w1: { name: "1 semaine", price: 2500 },
  m1: { name: "1 mois", price: 7500 },
};

function a(
  id: string,
  code: string,
  offer: keyof typeof OFFERS,
  site: string,
  minutesLeft: number,
  status: AccessStatus,
  day: string,
): Access {
  const o = OFFERS[offer]!;
  return {
    id,
    code,
    offer: o.name,
    site,
    minutesLeft,
    status,
    price: o.price,
    day,
  };
}

export const SAMPLE_ACCESSES: Access[] = [
  a("a01", "K7M-2QX", "d1", "Marché central", 1260, "active", "Aujourd'hui"),
  a("a02", "P4T-9HB", "h1", "Marché central", 12, "expiring", "Aujourd'hui"),
  a("a03", "R2V-6NC", "w1", "Cybercafé Akwa", 8400, "active", "Aujourd'hui"),
  a("a04", "X8D-3LF", "h1", "Gare routière", 38, "expiring", "Aujourd'hui"),
  a("a05", "B5J-7WA", "d1", "Gare routière", 0, "suspended", "Aujourd'hui"),
  a("a06", "T9E-1ZK", "m1", "Cybercafé Akwa", 40320, "active", "Aujourd'hui"),
  a("a07", "M3S-8YP", "h1", "Marché central", 0, "expired", "Hier"),
  a("a08", "G6U-4RD", "d1", "Marché central", 0, "expired", "Hier"),
  a("a09", "C1N-5QH", "w1", "Gare routière", 5100, "active", "Hier"),
  a("a10", "Z7F-2TM", "h1", "Cybercafé Akwa", 0, "expired", "Hier"),
  a("a11", "L4W-9VX", "d1", "Gare routière", 0, "cancelled", "Hier"),
  a("a12", "H8Y-6BE", "h1", "Marché central", 0, "expired", "Hier"),
  a("a13", "D2K-3PJ", "w1", "Marché central", 0, "expired", "Lundi 9 novembre"),
  a("a14", "N6A-7SG", "d1", "Cybercafé Akwa", 0, "expired", "Lundi 9 novembre"),
  a(
    "a15",
    "Q9C-1UL",
    "h1",
    "Gare routière",
    0,
    "suspended",
    "Lundi 9 novembre",
  ),
  a("a16", "F3X-4MR", "d1", "Marché central", 0, "expired", "Lundi 9 novembre"),
  a(
    "a17",
    "V5B-8TD",
    "m1",
    "Gare routière",
    0,
    "expired",
    "Dimanche 8 novembre",
  ),
  a(
    "a18",
    "J1H-2NW",
    "h1",
    "Cybercafé Akwa",
    0,
    "expired",
    "Dimanche 8 novembre",
  ),
  a(
    "a19",
    "S7P-6KE",
    "d1",
    "Marché central",
    0,
    "expired",
    "Dimanche 8 novembre",
  ),
  a(
    "a20",
    "W4G-9ZA",
    "w1",
    "Cybercafé Akwa",
    0,
    "expired",
    "Dimanche 8 novembre",
  ),
];

export const STATUS_LABEL: Record<AccessStatus, string> = {
  active: "Actif",
  expiring: "Expire bientôt",
  expired: "Expiré",
  suspended: "Suspendu",
  cancelled: "Annulé",
};

export const STATUS_TONE: Record<
  AccessStatus,
  "success" | "warning" | "danger" | "neutral"
> = {
  active: "success",
  expiring: "warning",
  expired: "neutral",
  suspended: "danger",
  cancelled: "neutral",
};

/** « 2 h 15 », « 12 min », « 3 j 4 h ». */
export function formatLeft(minutes: number): string {
  if (minutes <= 0) return "Terminé";
  const d = Math.floor(minutes / 1440);
  const h = Math.floor((minutes % 1440) / 60);
  const m = minutes % 60;
  if (d > 0) return `${d} j${h ? ` ${h} h` : ""} restant`;
  if (h > 0)
    return `${h} h${m ? ` ${String(m).padStart(2, "0")}` : ""} restant`;
  return `${m} min restantes`;
}
