"use client";

import { Button } from "@/components/ui/button";

export function Pager({
  page,
  totalPages,
  busy,
  onChange,
}: {
  page: number;
  totalPages: number;
  busy: boolean;
  onChange: (page: number) => void;
}) {
  if (totalPages <= 1) return null;
  return (
    <nav
      aria-label="Pages"
      className="flex items-center justify-between gap-2 pt-4"
    >
      <Button
        variant="outline"
        className="h-11 sm:h-9"
        disabled={page === 0 || busy}
        onClick={() => onChange(page - 1)}
      >
        Précédent
      </Button>
      <span className="text-sm text-muted-foreground" aria-live="polite">
        Page {page + 1} sur {totalPages}
      </span>
      <Button
        variant="outline"
        className="h-11 sm:h-9"
        disabled={page + 1 >= totalPages || busy}
        onClick={() => onChange(page + 1)}
      >
        Suivant
      </Button>
    </nav>
  );
}
