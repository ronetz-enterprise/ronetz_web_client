import { cn } from "@/lib/utils";

/**
 * Drapeau d'un pays, en image vectorielle servie par l'application (`public/flags/<CODE>.svg`).
 * Jamais d'émoji : ils s'affichent mal sur beaucoup de téléphones.
 */
export function Flag({
  code,
  className,
}: {
  code: string;
  className?: string;
}) {
  return (
    // eslint-disable-next-line @next/next/no-img-element -- petit SVG statique
    <img
      src={`/flags/${code.toUpperCase()}.svg`}
      alt=""
      width={24}
      height={16}
      className={cn(
        "h-4 w-6 shrink-0 rounded-[2px] object-cover ring-1 ring-border",
        className,
      )}
    />
  );
}
