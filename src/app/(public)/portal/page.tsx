import type { Metadata } from "next";
import Link from "next/link";
import {
  StatusScreen,
  statusActionClass,
} from "@/features/organization-settings/components/status-screen";
import { routes } from "@/lib/routes";

export const metadata: Metadata = { title: "Portail Wi-Fi" };

/** Le parcours d'achat vit sous /connect/<site> : cette adresse sert de point d'atterrissage sans site. */
export default function PortalPage() {
  return (
    <StatusScreen
      title="Portail Wi-Fi"
      description="Pour acheter un accès, scannez le code ou ouvrez le lien affiché sur votre lieu Wi-Fi."
      action={
        <Link href={routes.home()} className={statusActionClass}>
          Retourner à l’accueil
        </Link>
      }
    />
  );
}
