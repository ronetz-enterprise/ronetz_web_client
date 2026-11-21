import { z } from "zod";
import { ApiError } from "@/lib/api-error";
import type { AuthenticatedRequest } from "./create-organization";

/**
 * Version du texte de consentement de la case « Me prévenir à l'ouverture ». À changer chaque fois que
 * le texte change : le backend conserve la version acceptée avec le pays et le compte.
 */
export const WAITLIST_CONSENT_VERSION = "2026-11-16";

const waitlistSchema = z.object({ countries: z.array(z.string()) });

export async function joinCountryWaitlist(
  request: AuthenticatedRequest,
  country: string,
) {
  const parsed = waitlistSchema.safeParse(
    await request("/api/me/country-waitlist", {
      method: "POST",
      body: {
        country,
        consent: true,
        consentTextVersion: WAITLIST_CONSENT_VERSION,
      },
    }),
  );
  if (!parsed.success) throw new ApiError("invalid-response");
  return parsed.data.countries;
}
