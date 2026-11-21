import type { LedgerTransaction } from "./finance";

/** Date locale `AAAA-MM-JJ`. */
export function isoDay(date: Date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function startOfDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

export function addDays(date: Date, days: number) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

/** « Aujourd'hui », « Hier » ou « lundi 3 novembre » pour un jour `AAAA-MM-JJ`. */
export function dayLabel(day: string, now = new Date()) {
  if (day === isoDay(now)) return "Aujourd’hui";
  if (day === isoDay(addDays(now, -1))) return "Hier";
  const date = new Date(`${day}T00:00:00`);
  if (Number.isNaN(date.getTime())) return day;
  return new Intl.DateTimeFormat("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
  }).format(date);
}

export type DayGroup<T> = { day: string; items: T[] };

/** Regroupe par jour local, du plus récent au plus ancien (l'ordre d'entrée est conservé). */
export function groupByDay<T extends { createdAt: string }>(
  items: T[],
): DayGroup<T>[] {
  const groups = new Map<string, T[]>();
  for (const item of items) {
    const date = new Date(item.createdAt);
    if (Number.isNaN(date.getTime())) continue;
    const key = isoDay(date);
    const list = groups.get(key);
    if (list) list.push(item);
    else groups.set(key, [item]);
  }
  return [...groups.entries()]
    .sort(([a], [b]) => (a < b ? 1 : a > b ? -1 : 0))
    .map(([day, list]) => ({ day, items: list }));
}

/** Total encaissé par les ventes : montant net (après commission) de chaque vente. */
export function salesNet(transactions: LedgerTransaction[]) {
  return transactions
    .filter((tx) => tx.type === "SALE")
    .reduce((total, tx) => total + tx.netAmount, 0);
}

/** Effet total des mouvements d'un jour sur le solde (ventes, retraits, remboursements…). */
export function dayBalanceEffect(
  transactions: LedgerTransaction[],
  effect: (tx: LedgerTransaction) => number | null,
) {
  return transactions.reduce((total, tx) => total + (effect(tx) ?? 0), 0);
}

/**
 * Recettes cumulées heure par heure pour la journée de `now` : une valeur par heure de 0 h
 * jusqu'à l'heure en cours incluse. Seules les ventes comptent, au montant net. L'heure vient de
 * la date d'enregistrement de chaque vente dans le grand livre (fuseau de l'appareil).
 */
export function cumulativeByHour(
  transactions: LedgerTransaction[],
  now: Date,
): number[] {
  const today = isoDay(now);
  const perHour = Array.from({ length: now.getHours() + 1 }, () => 0);
  for (const tx of transactions) {
    if (tx.type !== "SALE") continue;
    const date = new Date(tx.createdAt);
    if (Number.isNaN(date.getTime()) || isoDay(date) !== today) continue;
    const hour = Math.min(date.getHours(), perHour.length - 1);
    perHour[hour] += tx.netAmount;
  }
  let running = 0;
  return perHour.map((value) => (running += value));
}
