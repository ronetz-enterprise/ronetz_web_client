"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@/lib/form-utils";
import { useHydrated } from "@/hooks/use-hydrated";
import { ApiError } from "@/lib/api-error";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from "@/components/ui/input-group";
import { HugeiconsIcon } from "@hugeicons/react";
import { ViewIcon, ViewOffIcon } from "@hugeicons/core-free-icons";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  loginSchema,
  registerSchema,
  type LoginInput,
  type RegisterInput,
} from "../schemas/authentication";
import { authenticationApi } from "../api/authentication-api";
import { useAuth } from "../hooks/auth-provider";
import { authErrorMessage } from "../lib/auth-errors";

function applyApiFieldErrors(
  error: unknown,
  form:
    | ReturnType<typeof useForm<LoginInput>>
    | ReturnType<typeof useForm<RegisterInput>>,
  fields: string[],
) {
  if (!(error instanceof ApiError) || !error.problem?.errors) return;
  for (const { field, message } of error.problem.errors) {
    if (fields.includes(field))
      (form as ReturnType<typeof useForm<LoginInput>>).setError(
        field as keyof LoginInput,
        { message },
      );
  }
}

function PasswordField({
  form,
  name = "password",
  label = "Mot de passe",
  autoComplete = "current-password",
}: {
  form: ReturnType<typeof useForm<LoginInput>>;
  name?: string;
  label?: string;
  autoComplete?: string;
}) {
  const [visible, setVisible] = useState(false);
  const error = (form.formState.errors as Record<string, { message?: string }>)[
    name
  ]?.message;
  return (
    <div className="space-y-1.5">
      <label className="text-sm font-semibold" htmlFor={`field-${name}`}>
        {label}
      </label>
      {/* L'œil est dans le champ, comme partout ailleurs : pas de bouton à côté. */}
      <InputGroup className="h-11 bg-card sm:h-9">
        <InputGroupInput
          id={`field-${name}`}
          type={visible ? "text" : "password"}
          autoComplete={autoComplete}
          aria-invalid={!!error}
          className="px-3"
          {...form.register(name as never)}
        />
        <InputGroupAddon align="inline-end">
          <InputGroupButton
            size="icon-xs"
            aria-label={
              visible ? "Masquer le mot de passe" : "Afficher le mot de passe"
            }
            aria-pressed={visible}
            onClick={() => setVisible((v) => !v)}
          >
            <HugeiconsIcon
              icon={visible ? ViewOffIcon : ViewIcon}
              strokeWidth={1.8}
            />
          </InputGroupButton>
        </InputGroupAddon>
      </InputGroup>
      {error && (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}

function FormField({
  form,
  name,
  label,
  type = "text",
  autoComplete,
  description,
}: {
  form: ReturnType<typeof useForm<RegisterInput>>;
  name: keyof RegisterInput;
  label: string;
  type?: string;
  autoComplete?: string;
  description?: string;
}) {
  const error = form.formState.errors[name]?.message;
  return (
    <div className="space-y-1.5">
      <label className="text-sm font-semibold" htmlFor={`field-${name}`}>
        {label}
      </label>
      {description && (
        <p className="text-sm text-muted-foreground">{description}</p>
      )}
      <Input
        id={`field-${name}`}
        type={type}
        autoComplete={autoComplete}
        aria-invalid={!!error}
        className="h-11 bg-card px-3"
        {...form.register(name)}
      />
      {error && (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}

export function LoginForm({ onSuccess }: { onSuccess: () => void }) {
  const auth = useAuth();
  const hydrated = useHydrated();
  const [error, setError] = useState<unknown>();
  const form = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });
  const rootError = form.formState.errors.root?.message;
  const disabled = !hydrated || auth.status === "initializing";

  return (
    <form
      noValidate
      className="space-y-4"
      onSubmit={form.handleSubmit(async (input) => {
        setError(undefined);
        try {
          await auth.login(input);
          form.reset();
          onSuccess();
        } catch (failure) {
          setError(failure);
          form.resetField("password");
          applyApiFieldErrors(failure, form, ["email", "password"]);
          form.setError("root", {
            message: authErrorMessage(failure, "login"),
          });
        }
      })}
    >
      <div className="space-y-1.5">
        <label className="text-sm font-semibold" htmlFor="field-email">
          Adresse e-mail
        </label>
        <Input
          id="field-email"
          type="email"
          autoComplete="username"
          aria-invalid={!!form.formState.errors.email}
          className="h-11 bg-card px-3"
          {...form.register("email")}
        />
        {form.formState.errors.email?.message && (
          <p className="text-sm text-destructive" role="alert">
            {form.formState.errors.email.message}
          </p>
        )}
      </div>
      <PasswordField form={form} />
      {rootError && (
        <Alert variant="destructive" role="alert">
          <AlertDescription>{rootError}</AlertDescription>
        </Alert>
      )}
      {error instanceof ApiError &&
        error.correlationId &&
        (error.status >= 500 || error.kind !== "http") && (
          <p className="text-xs text-muted-foreground">
            Référence :{" "}
            <code className="select-all">{error.correlationId}</code>
          </p>
        )}
      <Button type="submit" className="h-11 w-full" disabled={disabled}>
        {auth.status === "initializing" ? "Chargement…" : "Se connecter"}
      </Button>
    </form>
  );
}

export function RegisterForm({ onSuccess }: { onSuccess: () => void }) {
  const hydrated = useHydrated();
  const [error, setError] = useState<unknown>();
  const form = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
    defaultValues: { firstName: "", lastName: "", email: "", password: "" },
  });
  const rootError = form.formState.errors.root?.message;

  return (
    <form
      noValidate
      className="space-y-4"
      onSubmit={form.handleSubmit(async (input) => {
        setError(undefined);
        try {
          await authenticationApi.register(input);
          form.reset();
          onSuccess();
        } catch (failure) {
          setError(failure);
          form.resetField("password");
          applyApiFieldErrors(failure, form, [
            "email",
            "firstName",
            "lastName",
            "password",
          ]);
          if (
            failure instanceof ApiError &&
            failure.problem?.errors?.some(
              (item) => item.field === "passwordWithinHashingLimit",
            )
          )
            form.setError("password", {
              message: "Le mot de passe dépasse 72 octets UTF-8.",
            });
          form.setError("root", {
            message: authErrorMessage(failure, "register"),
          });
        }
      })}
    >
      <FormField
        form={form}
        name="firstName"
        label="Prénom"
        autoComplete="given-name"
      />
      <FormField
        form={form}
        name="lastName"
        label="Nom"
        autoComplete="family-name"
      />
      <FormField
        form={form}
        name="email"
        label="Adresse e-mail"
        type="email"
        autoComplete="email"
      />
      <PasswordField
        form={form as unknown as ReturnType<typeof useForm<LoginInput>>}
        autoComplete="new-password"
        label="Mot de passe"
      />
      {rootError && (
        <Alert variant="destructive" role="alert">
          <AlertDescription>{rootError}</AlertDescription>
        </Alert>
      )}
      {error instanceof ApiError &&
        error.correlationId &&
        (error.status >= 500 || error.kind !== "http") && (
          <p className="text-xs text-muted-foreground">
            Référence :{" "}
            <code className="select-all">{error.correlationId}</code>
          </p>
        )}
      <Button type="submit" className="h-11 w-full" disabled={!hydrated}>
        Créer mon compte
      </Button>
    </form>
  );
}
