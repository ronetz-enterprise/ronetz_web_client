import type { Metadata } from "next";
import Link from "next/link";
import {
  StatusScreen,
  statusActionClass,
} from "@/features/organization-settings/components/status-screen";
import { routes } from "@/lib/routes";

export const metadata: Metadata = { title: "Page introuvable" };

export default function NotFound() {
  return (
    <StatusScreen
      code="404"
      title="Cette page n’existe pas"
      description="L’adresse est peut-être incorrecte, ou la page a été déplacée."
      action={
        <Link href={routes.home()} className={statusActionClass}>
          Retourner à l’accueil
        </Link>
      }
    />
  );
}
