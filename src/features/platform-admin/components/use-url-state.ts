"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback } from "react";

/** Entier de page lu dans l'adresse (0 si absent ou incohérent). */
export function readPage(value: string | null) {
  return /^\d{1,6}$/.test(value ?? "") ? Number(value) : 0;
}

export function readChoice(
  value: string | null,
  allowed: readonly string[],
  fallback: string,
) {
  return value && allowed.includes(value) ? value : fallback;
}

/**
 * État de liste porté par l'adresse (filtres, page) : le lien se partage et survit au passage
 * liste ↔ détail. Un changement de filtre repart de la première page.
 */
export function useUrlState(basePath?: string) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();

  const update = useCallback(
    (next: Record<string, string | null>, options?: { keepPage?: boolean }) => {
      const search = new URLSearchParams(params.toString());
      for (const [key, value] of Object.entries(next)) {
        if (value) search.set(key, value);
        else search.delete(key);
      }
      if (!options?.keepPage && !("page" in next)) search.delete("page");
      const qs = search.toString();
      const path = basePath ?? pathname;
      router.replace(qs ? `${path}?${qs}` : path, { scroll: false });
    },
    [basePath, params, pathname, router],
  );

  return { params, update };
}
