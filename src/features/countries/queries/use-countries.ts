import { useQuery } from "@tanstack/react-query";
import { fetchCountries } from "../api/countries-api";

export const countryKeys = { all: ["countries"] as const };

export function useCountries() {
  return useQuery({
    queryKey: countryKeys.all,
    queryFn: ({ signal }) => fetchCountries(signal),
    staleTime: 60 * 60 * 1000,
  });
}
