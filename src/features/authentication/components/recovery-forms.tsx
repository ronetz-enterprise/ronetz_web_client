"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@/lib/form-utils";
import { useHydrated } from "@/hooks/use-hydrated";
import { toUserMessage } from "@/lib/api-error";
import { routes } from "@/lib/routes";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { loginSchema, registerSchema } from "../schemas/authentication";
import {
  accountRecoveryApi,
  type LinkOutcome,
} from "../api/account-recovery-api";

const emailOnly = loginSchema.pick({ email: true });
const newPasswordSchema = z
  .object({ password: registerSchema.shape.password, confirm: z.string() })
  .refine((v) => v.password === v.confirm, {
    path: ["confirm"],
    message: "Les deux mots de passe ne sont pas identiques.",
  });

function recoveryError(error: unknown) {
  if (typeof navigator !== "undefined" && !navigator.onLine)
    return "Vous êtes hors ligne. Reconnectez-vous puis réessayez.";
  if (
    error &&
    typeof error === "object" &&
    "status" in error &&
    error.status === 429
  )
    return "Trop de demandes pour cette adresse. Patientez quelques minutes avant de réessayer.";
  return toUserMessage(error);
}

const linkClass = "font-medium text-signal hover:underline";

function Field({
  id,
  label,
  error,
  ...input
}: React.ComponentProps<typeof Input> & {
  id: string;
  label: string;
  error?: string;
}) {
  return (
    <div className="space-y-1.5">
      <label className="text-sm font-semibold" htmlFor={id}>
        {label}
      </label>
      <Input
        id={id}
        aria-invalid={!!error}
        className="h-11 bg-card px-3"
        {...input}
      />
      {error && (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}

/** « Mot de passe oublié ? » : la réponse ne dit jamais si l'adresse a un compte. */
export function ForgotPasswordForm({
  initialEmail = "",
}: {
  initialEmail?: string;
}) {
  const hydrated = useHydrated();
  const [sentTo, setSentTo] = useState<string>();
  const form = useForm<{ email: string }>({
    resolver: zodResolver(emailOnly),
    defaultValues: { email: initialEmail },
  });
  const root = form.formState.errors.root?.message;

  if (sentTo)
    return (
      <div className="space-y-4" role="status">
        <p className="text-sm">
          Si cette adresse a un compte, nous venons de vous envoyer un lien.
        </p>
        <p className="text-sm text-muted-foreground">
          Ouvrez l’e-mail envoyé à{" "}
          <strong className="text-foreground">{sentTo}</strong> et touchez «
          Choisir un nouveau mot de passe ». Pensez à regarder dans les
          courriers indésirables.
        </p>
        <Button
          variant="outline"
          className="h-11 w-full"
          onClick={() => setSentTo(undefined)}
        >
          Utiliser une autre adresse
        </Button>
      </div>
    );

  return (
    <form
      noValidate
      className="space-y-4"
      onSubmit={form.handleSubmit(async ({ email }) => {
        try {
          await accountRecoveryApi.requestPasswordReset(email);
          setSentTo(email.trim());
        } catch (error) {
          form.setError("root", { message: recoveryError(error) });
        }
      })}
    >
      <p className="text-sm text-muted-foreground">
        Saisissez l’adresse e-mail de votre compte. Nous vous enverrons un lien
        pour choisir un nouveau mot de passe.
      </p>
      <Field
        id="field-email"
        label="Adresse e-mail"
        type="email"
        autoComplete="email"
        error={form.formState.errors.email?.message}
        {...form.register("email")}
      />
      {root && (
        <Alert variant="destructive" role="alert">
          <AlertDescription>{root}</AlertDescription>
        </Alert>
      )}
      <Button
        type="submit"
        className="h-11 w-full"
        disabled={!hydrated || form.formState.isSubmitting}
      >
        {form.formState.isSubmitting ? "Envoi…" : "M’envoyer un lien"}
      </Button>
    </form>
  );
}

function ExpiredLink({ action }: { action: "reset" | "verify" }) {
  return (
    <div className="space-y-4" role="alert">
      <p className="text-sm font-semibold">Ce lien a expiré.</p>
      <p className="text-sm text-muted-foreground">
        Il a peut-être déjà servi. Demandez-en un nouveau : il arrive en
        quelques minutes.
      </p>
      <Link
        href={action === "reset" ? routes.forgotPassword() : routes.login()}
        className="inline-flex h-11 w-full items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground"
      >
        {action === "reset"
          ? "M’envoyer un nouveau lien"
          : "Me connecter pour recevoir un nouveau lien"}
      </Link>
    </div>
  );
}

/** Arrivée du lien de réinitialisation : « Choisissez un nouveau mot de passe ». */
export function ResetPasswordForm({ token }: { token: string | null }) {
  const hydrated = useHydrated();
  const [outcome, setOutcome] = useState<LinkOutcome>();
  const form = useForm<{ password: string; confirm: string }>({
    resolver: zodResolver(newPasswordSchema),
    defaultValues: { password: "", confirm: "" },
  });
  const root = form.formState.errors.root?.message;

  if (!token || outcome === "expired") return <ExpiredLink action="reset" />;
  if (outcome === "ok")
    return (
      <div className="space-y-4" role="status">
        <p className="text-sm">
          Votre mot de passe est changé. Pour votre sécurité, vous êtes
          déconnecté de tous vos appareils.
        </p>
        <Link
          href={routes.login()}
          className="inline-flex h-11 w-full items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground"
        >
          Se connecter
        </Link>
      </div>
    );

  return (
    <form
      noValidate
      className="space-y-4"
      onSubmit={form.handleSubmit(async ({ password }) => {
        try {
          setOutcome(
            await accountRecoveryApi.confirmPasswordReset(token, password),
          );
        } catch (error) {
          form.resetField("confirm");
          form.setError("root", { message: recoveryError(error) });
        }
      })}
    >
      <Field
        id="field-password"
        label="Nouveau mot de passe"
        type="password"
        autoComplete="new-password"
        error={form.formState.errors.password?.message}
        {...form.register("password")}
      />
      <p className="-mt-2 text-sm text-muted-foreground">
        8 caractères minimum.
      </p>
      <Field
        id="field-confirm"
        label="Saisissez-le à nouveau"
        type="password"
        autoComplete="new-password"
        error={form.formState.errors.confirm?.message}
        {...form.register("confirm")}
      />
      {root && (
        <Alert variant="destructive" role="alert">
          <AlertDescription>{root}</AlertDescription>
        </Alert>
      )}
      <Button
        type="submit"
        className="h-11 w-full"
        disabled={!hydrated || form.formState.isSubmitting}
      >
        {form.formState.isSubmitting
          ? "Enregistrement…"
          : "Enregistrer le mot de passe"}
      </Button>
    </form>
  );
}

/** Arrivée du lien « Confirmer mon adresse » : confirmation en un geste, automatique. */
export function EmailConfirmation({ token }: { token: string | null }) {
  const [state, setState] = useState<"pending" | LinkOutcome | "error">(
    token ? "pending" : "expired",
  );
  const [message, setMessage] = useState<string>();
  const started = useRef(false);

  const run = () => {
    if (!token) return;
    setState("pending");
    accountRecoveryApi.confirmEmail(token).then(setState, (error) => {
      setMessage(recoveryError(error));
      setState("error");
    });
  };
  useEffect(() => {
    if (started.current) return;
    started.current = true;
    run();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (state === "pending")
    return (
      <p role="status" className="text-sm text-muted-foreground">
        Confirmation de votre adresse…
      </p>
    );
  if (state === "expired") return <ExpiredLink action="verify" />;
  if (state === "error")
    return (
      <div className="space-y-4" role="alert">
        <p className="text-sm">{message}</p>
        <Button variant="outline" className="h-11 w-full" onClick={run}>
          Réessayer
        </Button>
      </div>
    );
  return (
    <div className="space-y-4" role="status">
      <p className="text-sm">Votre adresse e-mail est confirmée. Merci.</p>
      <Link
        href={routes.dashboard()}
        className="inline-flex h-11 w-full items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground"
      >
        Continuer
      </Link>
      <p className="text-center text-sm text-muted-foreground">
        Pas connecté sur cet appareil ?{" "}
        <Link href={routes.login()} className={linkClass}>
          Se connecter
        </Link>
      </p>
    </div>
  );
}
