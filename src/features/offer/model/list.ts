import type { AdminOffer, OfferStatus, SiteLite } from "./admin";

export type Row = { offer: AdminOffer; site: SiteLite };
export type StatusFilter = "ALL" | OfferStatus;

export function filterRows(rows: Row[], status: StatusFilter, search: string) {
  const q = search.trim().toLocaleLowerCase("fr");
  return rows.filter(
    (r) =>
      (status === "ALL" || r.offer.status === status) &&
      (!q || r.offer.name.toLocaleLowerCase("fr").includes(q)),
  );
}

export function countByStatus(rows: Row[]) {
  const counts: Record<StatusFilter, number> = {
    ALL: rows.length,
    PUBLISHED: 0,
    SUSPENDED: 0,
    DRAFT: 0,
    ARCHIVED: 0,
  };
  for (const r of rows) counts[r.offer.status]++;
  return counts;
}

/** Une section par site (dans l'ordre des sites), les offres par place puis par nom. */
export function groupBySite(rows: Row[]) {
  const groups = new Map<string, { site: SiteLite; items: Row[] }>();
  for (const r of rows) {
    const g = groups.get(r.site.id) ?? { site: r.site, items: [] };
    g.items.push(r);
    groups.set(r.site.id, g);
  }
  for (const g of groups.values())
    g.items.sort(
      (a, b) =>
        Number(BigInt(a.offer.displayOrder) - BigInt(b.offer.displayOrder)) ||
        a.offer.name.localeCompare(b.offer.name, "fr"),
    );
  return [...groups.values()];
}
