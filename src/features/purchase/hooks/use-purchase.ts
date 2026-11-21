import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { useHydrated } from "@/hooks/use-hydrated";
import { ApiError } from "@/lib/api-error";
import {
  claimCredential,
  createCheckout,
  initiatePayment,
  latestPayment,
  paymentChannels,
  publicSite,
  purchaseAccess,
  verifyPayment,
  type Payment,
  type PurchaseAccessStatus,
} from "../api/purchase-api";
import { toInternational, type PaymentFormValues } from "../model/mobile-money";
import { fallbackPaymentChannels, findChannel } from "../model/payment-channel";
import {
  createStageClock,
  pollInterval,
  purchaseStage,
} from "../model/purchase-progress";
import {
  readPurchaseSession,
  savePurchaseSession,
  updatePurchaseSession,
  type PurchaseSession,
} from "../model/purchase-session";
import { routes } from "@/lib/routes";

/**
 * Moyens de paiement proposés par l'application. Tant que la liste n'est pas arrivée, ou si elle
 * ne peut pas l'être, la liste de secours est affichée : le serveur reste juge au paiement.
 */
export function usePaymentChannels() {
  const query = useQuery({
    queryKey: ["payment-channels"],
    staleTime: 60_000,
    retry: 1,
    queryFn: ({ signal }) => paymentChannels(signal),
  });
  return query.data && query.data.length > 0
    ? query.data
    : fallbackPaymentChannels;
}

/** Nom et ville du lieu, pour l'en-tête du parcours. */
export function usePublicSite(siteId: string | undefined) {
  return useQuery({
    queryKey: ["public-site", siteId],
    enabled: !!siteId,
    staleTime: 5 * 60_000,
    retry: 1,
    queryFn: ({ signal }) => publicSite(siteId!, signal),
  });
}

/** Code opérateur gardé avec l'achat, pour l'affichage. */
function networkOf(channelId: string) {
  return findChannel(fallbackPaymentChannels, channelId)?.network ?? channelId;
}

/**
 * Lance un achat : crée l'achat (jeton gardé sur l'appareil), puis demande le paiement mobile
 * money. Si le paiement ne peut pas être lancé, l'achat existe quand même.
 */
export function useStartPurchase(siteId: string, offerId: string) {
  const router = useRouter();
  return useMutation({
    retry: false,
    mutationFn: async (values: PaymentFormValues) => {
      const phoneNumber = toInternational(values.phone);
      const checkout = await createCheckout(siteId, {
        offerId,
        phoneNumber,
        email: values.email === "" ? null : values.email,
      });
      const session: PurchaseSession = {
        purchaseId: checkout.purchase.id,
        siteId,
        offerId,
        token: checkout.checkoutToken,
        payableUntil: checkout.expiresAt,
        channelId: values.channelId,
        network: networkOf(values.channelId),
        phone: values.phone,
        paymentId: null,
        createdAt: new Date().toISOString(),
      };
      const stored = savePurchaseSession(session);
      try {
        const payment = await initiatePayment(checkout.checkoutToken, {
          purchaseId: session.purchaseId,
          channelId: values.channelId,
          phoneNumber,
          idempotencyKey: crypto.randomUUID(),
        });
        updatePurchaseSession(session.purchaseId, { paymentId: payment.id });
      } catch {
        // Le suivi montrera « Le paiement n'a pas pu être lancé » avec un bouton pour réessayer.
      }
      return { purchaseId: session.purchaseId, stored };
    },
    onSuccess: ({ purchaseId }) => {
      router.push(routes.connectPurchase(siteId, purchaseId));
    },
  });
}

/**
 * La page de suivi est d'abord rendue par le serveur, où le stockage du navigateur n'existe pas :
 * la session n'est lue qu'une fois la page hydratée (`ready`).
 */
export function usePurchaseSession(purchaseId: string) {
  const hydrated = useHydrated();
  const session = useMemo(
    () => (hydrated ? readPurchaseSession(purchaseId) : null),
    [hydrated, purchaseId],
  );
  return { session, ready: hydrated };
}

const keys = {
  payment: (purchaseId: string) => ["purchase", purchaseId, "payment"] as const,
  access: (purchaseId: string) => ["purchase", purchaseId, "access"] as const,
  credential: (grantId: string) => ["purchase", "credential", grantId] as const,
};

/**
 * Suit l'achat en interrogeant le paiement et l'achat, toutes les 4 s puis toutes les 10 s
 * après deux minutes dans la même étape.
 */
export function usePurchaseProgress(session: PurchaseSession) {
  const client = useQueryClient();
  const [waitedIn] = useState(() => createStageClock());

  const payment = useQuery({
    queryKey: keys.payment(session.purchaseId),
    retry: (count, error) =>
      !(error instanceof ApiError && error.status === 404) && count < 2,
    queryFn: async ({ signal }) => {
      try {
        return await latestPayment(session.purchaseId, session.token, signal);
      } catch (error) {
        if (error instanceof ApiError && error.status === 404) return null;
        throw error;
      }
    },
    refetchInterval: (query) => {
      const { kind } = purchaseStage({
        payment: query.state.data ?? null,
        access:
          client.getQueryData<PurchaseAccessStatus>(
            keys.access(session.purchaseId),
          ) ?? null,
        payableUntil: session.payableUntil,
      });
      return pollInterval(kind, waitedIn(kind));
    },
  });

  const access = useQuery({
    queryKey: keys.access(session.purchaseId),
    retry: 2,
    queryFn: ({ signal }) =>
      purchaseAccess(session.purchaseId, session.token, signal),
    refetchInterval: (query) => {
      const { kind } = purchaseStage({
        payment: payment.data ?? null,
        access: query.state.data ?? null,
        payableUntil: session.payableUntil,
      });
      return pollInterval(kind, waitedIn(kind));
    },
  });

  const stage = purchaseStage({
    payment: payment.data ?? null,
    access: access.data ?? null,
    payableUntil: session.payableUntil,
  });

  return {
    stage,
    payment: payment.data ?? null,
    access: access.data ?? null,
    loading: payment.isPending || access.isPending,
    error: payment.error ?? access.error,
    refetch: () => Promise.all([payment.refetch(), access.refetch()]),
  };
}

/** Nouvelle tentative de paiement sur le même achat (5 au plus, pendant 20 minutes). */
export function useRetryPayment(session: PurchaseSession) {
  const client = useQueryClient();
  return useMutation({
    retry: false,
    mutationFn: async (
      values: Pick<PaymentFormValues, "channelId" | "phone">,
    ) => {
      const payment = await initiatePayment(session.token, {
        purchaseId: session.purchaseId,
        channelId: values.channelId,
        phoneNumber: toInternational(values.phone),
        idempotencyKey: crypto.randomUUID(),
      });
      updatePurchaseSession(session.purchaseId, {
        paymentId: payment.id,
        channelId: values.channelId,
        network: networkOf(values.channelId),
        phone: values.phone,
      });
      return payment;
    },
    onSuccess: (payment) =>
      client.setQueryData(keys.payment(session.purchaseId), payment),
  });
}

/**
 * « J'ai validé » : demande au serveur de vérifier tout de suite auprès de l'opérateur.
 */
export function useVerifyPayment(session: PurchaseSession) {
  const client = useQueryClient();
  return useMutation({
    retry: false,
    mutationFn: async (payment: Payment) => {
      try {
        return await verifyPayment(payment.id, session.token);
      } catch (error) {
        if (error instanceof ApiError && error.status === 429) return null;
        throw error;
      }
    },
    onSuccess: (payment) => {
      if (payment)
        client.setQueryData(keys.payment(session.purchaseId), payment);
      void client.invalidateQueries({
        queryKey: keys.access(session.purchaseId),
      });
    },
  });
}

/**
 * Récupère le mot de passe une fois l'accès prêt. Gardé en mémoire, jamais dans sessionStorage.
 */
export function useDeliveredCredential(
  session: PurchaseSession,
  accessGrantId: string,
  deliverable: boolean,
) {
  const client = useQueryClient();
  const known =
    client.getQueryData(keys.credential(accessGrantId)) !== undefined;
  return useQuery({
    queryKey: keys.credential(accessGrantId),
    enabled: deliverable || known,
    retry: (count, error) =>
      error instanceof ApiError &&
      (error.kind === "network" ||
        error.kind === "timeout" ||
        error.status === 503) &&
      count < 3,
    retryDelay: 5_000,
    staleTime: Infinity,
    gcTime: Infinity,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    queryFn: () => claimCredential(accessGrantId, session.token),
  });
}
