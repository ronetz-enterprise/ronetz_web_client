"use client";

import { QueryClientProvider } from "@tanstack/react-query";
import { useEffect, useState, type ReactNode } from "react";
import { createQueryClient } from "@/lib/query-client";

/**
 * QueryClient isolé pour le parcours d'achat : son cache est séparé du cache de la console
 * gérant et est vidé à la fermeture de la page (unmount).
 */
export function QueryClientWrapper({ children }: { children: ReactNode }) {
  const [client] = useState(createQueryClient);
  useEffect(
    () => () => {
      void client.cancelQueries();
      client.clear();
    },
    [client],
  );
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}
