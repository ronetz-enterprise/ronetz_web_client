import { QueryClient } from "@tanstack/react-query";
import { ApiError } from "@/lib/api-error";

export function retryQuery(failureCount: number, error: unknown) {
  return (
    failureCount < 2 &&
    error instanceof ApiError &&
    (error.kind === "network" ||
      error.kind === "timeout" ||
      (error.kind === "http" && [500, 502, 503, 504].includes(error.status)))
  );
}

export function createQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 30_000,
        gcTime: 300_000,
        retry: retryQuery,
        retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 8000),
        refetchOnWindowFocus: false,
      },
      mutations: { retry: false, gcTime: 0 },
    },
  });
}
