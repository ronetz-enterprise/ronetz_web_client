import { StateDot, type RowCardTone } from "@/components/patterns/row-card";

/** État : point de couleur et libellé ; la couleur ne porte jamais l'information seule. */
export function StatusPill({
  label,
  tone,
}: {
  label: string;
  tone: RowCardTone;
}) {
  return <StateDot label={label} tone={tone} />;
}
