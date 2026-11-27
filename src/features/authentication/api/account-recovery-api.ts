import { httpClient } from "@/lib/http-client";
import { ApiError } from "@/lib/api-error";
import { normalizeEmail } from "../schemas/authentication";

/**
 * Mot de passe oublié et confirmation d'adresse (fiche 009).
 *
 * CONTRAT SUPPOSÉ : la fiche 009 ne contenait pas encore le contrat de backend-argent
 * le 2026-11-26. Tout l'écart avec le backend réel se règle dans ce seul fichier.
 *   POST /api/auth/password-reset/request  { email }               → 202 (adresse connue ou non)
 *   POST /api/auth/password-reset/confirm  { token, newPassword }  → 204
 *   POST /api/auth/email-verification/confirm { token }            → 204
 *   POST /api/auth/email-verification/resend  { email }            → 202
 *   Lien expiré, déjà utilisé ou inconnu : 410, ou 400 avec code TOKEN_EXPIRED / TOKEN_INVALID.
 *   Trop de demandes : 429.
 */
export type LinkOutcome = "ok" | "expired";

function isDeadLink(error: unknown) {
  if (!(error instanceof ApiError)) return false;
  const code = error.problem?.code;
  return (
    error.status === 410 ||
    code === "TOKEN_EXPIRED" ||
    code === "TOKEN_INVALID" ||
    (error.status === 400 && !error.problem?.errors?.length)
  );
}

async function consume(path: string, body: unknown): Promise<LinkOutcome> {
  try {
    await httpClient(path, { method: "POST", body });
    return "ok";
  } catch (error) {
    if (isDeadLink(error)) return "expired";
    throw error;
  }
}

export const accountRecoveryApi = {
  requestPasswordReset: async (email: string) => {
    await httpClient("/api/auth/password-reset/request", {
      method: "POST",
      body: { email: normalizeEmail(email) },
    });
  },
  confirmPasswordReset: (token: string, newPassword: string) =>
    consume("/api/auth/password-reset/confirm", { token, newPassword }),
  confirmEmail: (token: string) =>
    consume("/api/auth/email-verification/confirm", { token }),
  resendEmailConfirmation: async (email: string) => {
    await httpClient("/api/auth/email-verification/resend", {
      method: "POST",
      body: { email: normalizeEmail(email) },
    });
  },
};
