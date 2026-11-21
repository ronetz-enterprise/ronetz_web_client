import { ApiError } from "@/lib/api-error";
import { httpClient } from "@/lib/http-client";
import { countriesSchema, type Country } from "../model/country";

/** Liste publique des pays (ouverts d'abord), sans connexion. */
export async function fetchCountries(signal?: AbortSignal): Promise<Country[]> {
  const parsed = countriesSchema.safeParse(
    await httpClient("/api/public/countries", { signal }),
  );
  if (!parsed.success) throw new ApiError("invalid-response");
  return parsed.data;
}
