import { redirect } from "next/navigation";

import { routes } from "@/lib/routes";

// La vente au comptoir est retirée : les accès s'achètent uniquement sur le portail client.
export default function Page() {
  redirect(routes.access());
}
