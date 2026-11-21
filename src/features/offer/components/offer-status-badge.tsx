import { StateDot } from "@/components/patterns/row-card";
import { statusLabels, statusTones, type OfferStatus } from "../model/admin";

export function OfferStatusBadge({ status }: { status: OfferStatus }) {
  return <StateDot label={statusLabels[status]} tone={statusTones[status]} />;
}
