import type { RowCardTone } from "@/components/patterns/row-card";
import type { AccessTone } from "../model/access-grant";

/** La carte-ligne n'a pas de teinte « en cours » : elle se lit comme un avertissement. */
export function toneToRow(tone: AccessTone): RowCardTone {
  return tone === "pending" ? "warning" : tone;
}
