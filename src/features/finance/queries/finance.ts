"use client";

import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { toast } from "sonner";
import type { z } from "zod";
import { useAuth } from "@/features/authentication/hooks/auth-provider";
import { useOrganization } from "@/features/organizations/hooks/organization-context";
import { ApiError } from "@/lib/api-error";
import {
  balanceSchema,
  canViewFinance,
  ledgerPageSchema,
  withdrawalPageSchema,
  withdrawalSchema,
  type LedgerTransaction,
} from "../model/finance";

export const PAGE_SIZE = 20;
/** Plafond serveur de la taille de page du grand livre. */
const RANGE_PAGE_SIZE = 100;
const RANGE_MAX_PAGES = 5;

export const financeKeys = {
  all: (org: string) => ["org", org, "finance"] as const,
  balance: (org: string) => ["org", org, "finance", "balance"] as const,
  ledger: (org: string, page: number) =>
    ["org", org, "finance", "ledger", { page }] as const,
  sales: (org: string, from: string, to: string) =>
    ["org", org, "finance", "sales", { from, to }] as const,
  withdrawals: (org: string, page: number) =>
    ["org", org, "finance", "withdrawals", { page }] as const,
};

export function useBalance() {
  const { request } = useAuth();
  const { organizationId, orgApi, can } = useOrganization();
  return useQuery({
    queryKey: financeKeys.balance(organizationId),
    enabled: canViewFinance(can),
    staleTime: 15_000,
    queryFn: async ({ signal }) => {
      const result = balanceSchema.safeParse(
        await request(orgApi("/accounting/balance"), { signal }),
      );
      if (!result.success || result.data.organizationId !== organizationId)
        throw new ApiError("invalid-response");
      return result.data;
    },
  });
}

/** Mouvements du grand livre, du plus récent au plus ancien. */
export function useLedger(page: number) {
  const { request } = useAuth();
  const { organizationId, orgApi, can } = useOrganization();
  return useQuery({
    queryKey: financeKeys.ledger(organizationId, page),
    enabled: canViewFinance(can),
    placeholderData: keepPreviousData,
    queryFn: async ({ signal }) => {
      const result = ledgerPageSchema.safeParse(
        await request(orgApi("/accounting/ledger"), {
          signal,
          query: { page: String(page), size: String(PAGE_SIZE) },
        }),
      );
      if (!result.success) throw new ApiError("invalid-response");
      return result.data;
    },
  });
}

export type SalesInRange = {
  sales: LedgerTransaction[];
  /** Vrai quand la période compte plus de ventes que ce que l'on a lu : le total est alors un minimum. */
  partial: boolean;
};

/**
 * Ventes du grand livre entre deux instants (bornes incluses). Le grand livre fait foi pour
 * l'argent : c'est lui qui alimente « Aujourd'hui », jamais un rapport recalculé.
 */
export function useSalesInRange(from: Date, to: Date, enabled = true) {
  const { request } = useAuth();
  const { organizationId, orgApi, can } = useOrganization();
  const fromIso = from.toISOString();
  const toIso = to.toISOString();
  return useQuery({
    queryKey: financeKeys.sales(organizationId, fromIso, toIso),
    enabled: enabled && canViewFinance(can),
    staleTime: 30_000,
    refetchInterval: 60_000,
    queryFn: async ({ signal }): Promise<SalesInRange> => {
      const sales: LedgerTransaction[] = [];
      let partial = false;
      for (let page = 0; page < RANGE_MAX_PAGES; page += 1) {
        const result = ledgerPageSchema.safeParse(
          await request(orgApi("/accounting/ledger"), {
            signal,
            query: {
              type: "SALE",
              from: fromIso,
              to: toIso,
              page: String(page),
              size: String(RANGE_PAGE_SIZE),
            },
          }),
        );
        if (!result.success) throw new ApiError("invalid-response");
        sales.push(...result.data.content);
        if (page + 1 >= result.data.totalPages) break;
        if (page + 1 === RANGE_MAX_PAGES) partial = true;
      }
      return { sales, partial };
    },
  });
}

export function useWithdrawals(page: number) {
  const { request } = useAuth();
  const { organizationId, orgApi, can } = useOrganization();
  return useQuery<z.infer<typeof withdrawalPageSchema>>({
    queryKey: financeKeys.withdrawals(organizationId, page),
    enabled: canViewFinance(can),
    placeholderData: keepPreviousData,
    refetchInterval: (query) =>
      query.state.data?.content.some((w) => w.status === "PROCESSING")
        ? 15_000
        : false,
    refetchIntervalInBackground: false,
    queryFn: async ({ signal }) => {
      const result = withdrawalPageSchema.safeParse(
        await request(orgApi("/withdrawals"), {
          signal,
          query: { page: String(page), size: String(PAGE_SIZE) },
        }),
      );
      if (
        !result.success ||
        result.data.content.some((w) => w.organizationId !== organizationId)
      )
        throw new ApiError("invalid-response");
      return result.data;
    },
  });
}

export type WithdrawalRequest = {
  amount: number;
  currency: string;
  network: string;
  country: string;
  msisdn: string;
  recipientFirstName: string;
  recipientLastName: string;
  idempotencyKey: string;
};

/** Demande de retrait. Aucun écran ne l'appelle tant que `WITHDRAWALS_ENABLED` est faux. */
export function useRequestWithdrawal() {
  const { request } = useAuth();
  const { organizationId, orgApi } = useOrganization();
  const client = useQueryClient();
  return useMutation({
    retry: false,
    mutationFn: async (body: WithdrawalRequest) => {
      const result = withdrawalSchema.safeParse(
        await request(orgApi("/withdrawals"), { method: "POST", body }),
      );
      if (!result.success) throw new ApiError("invalid-response");
      return result.data;
    },
    onSuccess: async () => {
      toast.success("Demande de retrait envoyée.");
      await client.invalidateQueries({
        queryKey: financeKeys.all(organizationId),
      });
    },
  });
}

export function useCancelWithdrawal() {
  const { request } = useAuth();
  const { organizationId, orgApi } = useOrganization();
  const client = useQueryClient();
  return useMutation({
    retry: false,
    mutationFn: async (withdrawalId: string) =>
      request(orgApi(`/withdrawals/${withdrawalId}/cancellation`), {
        method: "POST",
      }),
    onSuccess: async () => {
      toast.success("Retrait annulé : le montant est de nouveau disponible.");
      await client.invalidateQueries({
        queryKey: financeKeys.all(organizationId),
      });
    },
  });
}
