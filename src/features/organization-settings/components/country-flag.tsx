import { cn } from "@/lib/utils";

/**
 * Drapeau en image vectorielle (jamais d'emoji : leur rendu varie selon l'appareil).
 * Le Cameroun est dessiné ; les autres pays du catalogue retombent sur une pastille avec le code.
 */
export function CountryFlag({
  code,
  className,
}: {
  code: string;
  className?: string;
}) {
  const frame = cn(
    "h-4 w-6 shrink-0 rounded-[3px] ring-1 ring-foreground/15",
    className,
  );
  if (code === "CM") {
    return (
      <svg viewBox="0 0 3 2" aria-hidden="true" className={frame}>
        <rect width="1" height="2" fill="#007a5e" />
        <rect x="1" width="1" height="2" fill="#ce1126" />
        <rect x="2" width="1" height="2" fill="#fcd116" />
        <path
          fill="#fcd116"
          d="M1.5 0.72l0.105 0.32h0.337l-0.272 0.198 0.104 0.32-0.274-0.198-0.274 0.198 0.104-0.32-0.272-0.198h0.337z"
        />
      </svg>
    );
  }
  if (code === "FR") {
    return (
      <svg viewBox="0 0 3 2" aria-hidden="true" className={frame}>
        <rect width="1" height="2" fill="#0055a4" />
        <rect x="1" width="1" height="2" fill="#ffffff" />
        <rect x="2" width="1" height="2" fill="#ef4135" />
      </svg>
    );
  }
  return (
    <span
      aria-hidden="true"
      className={cn(
        frame,
        "grid place-items-center bg-muted text-[0.5rem] font-semibold text-muted-foreground",
      )}
    >
      {code}
    </span>
  );
}
