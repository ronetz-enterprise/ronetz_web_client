"use client";

import { isAccidentalDismiss } from "@/lib/form-utils";
import { useId, useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { ApiError, toUserMessage } from "@/lib/api-error";
import { WITHDRAWALS_UNAVAILABLE_MESSAGE } from "../config";

/** Les retraits coupés par le serveur se disent en clair ; le reste suit le message commun. */
function withdrawalError(error: unknown) {
  if (
    error instanceof ApiError &&
    error.problem?.code === "WITHDRAWALS_DISABLED"
  )
    return WITHDRAWALS_UNAVAILABLE_MESSAGE;
  return toUserMessage(error);
}
import { newIdempotencyKey, type Balance } from "../model/finance";
import {
  needsApproval,
  validateWithdrawal,
  withdrawalMsisdn,
  type WithdrawalErrors,
} from "../model/withdrawal-form";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group";
import { usePaymentChannels } from "@/features/purchase/hooks/use-purchase";
import { guessChannel } from "@/features/purchase/model/payment-channel";
import { formatLocalNumber } from "@/features/purchase/model/mobile-money";
import { useRequestWithdrawal } from "../queries/finance";

/**
 * Demande de retrait vers Mobile Money. Rendue uniquement quand `WITHDRAWALS_ENABLED` est vrai
 * (voir `config.ts`) : aujourd'hui, la page affiche à la place « Les retraits seront bientôt
 * disponibles. ».
 */
export function WithdrawalDialog({ balance }: { balance: Balance }) {
  const id = useId();
  const mutation = useRequestWithdrawal();
  const [open, setOpen] = useState(false);
  const [key, setKey] = useState(newIdempotencyKey);
  const [amount, setAmount] = useState("");
  // Seul le Cameroun est ouvert : indicatif fixe, opérateurs du pays seulement.
  const channels = usePaymentChannels().filter((c) => c.country === "CM");
  const [network, setNetwork] = useState("MTN");
  const [msisdn, setMsisdn] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [errors, setErrors] = useState<WithdrawalErrors>({});

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    const found = validateWithdrawal(
      { amount, msisdn, network, firstName, lastName },
      balance.availableAmount,
      channels,
    );
    setErrors(found);
    if (Object.keys(found).length) return;
    try {
      await mutation.mutateAsync({
        amount: Number(amount),
        currency: balance.currency,
        network,
        country: "CM",
        msisdn: withdrawalMsisdn(msisdn),
        recipientFirstName: firstName.trim(),
        recipientLastName: lastName.trim(),
        idempotencyKey: key,
      });
      setOpen(false);
      setAmount("");
      setKey(newIdempotencyKey());
    } catch {
      /* affiché dans la fenêtre */
    }
  }

  const field = (
    name: keyof WithdrawalErrors,
    label: string,
    value: string,
    set: (v: string) => void,
    props: React.ComponentProps<typeof Input> = {},
  ) => (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={`${id}-${name}`} className="text-sm font-medium">
        {label}
      </label>
      <Input
        id={`${id}-${name}`}
        className="h-11 sm:h-9"
        value={value}
        onChange={(e) => set(e.target.value)}
        aria-invalid={!!errors[name]}
        aria-describedby={errors[name] ? `${id}-${name}-error` : undefined}
        {...props}
      />
      {errors[name] ? (
        <p id={`${id}-${name}-error`} className="text-sm text-destructive">
          {errors[name]}
        </p>
      ) : null}
    </div>
  );

  return (
    <Dialog
      open={open}
      onOpenChange={(next, details) => {
        if (mutation.isPending) return;
        // Une demande commencée ne se perd pas sur un clic à côté ou sur Échap.
        const dirty = Boolean(amount || msisdn || firstName || lastName);
        if (!next && dirty && isAccidentalDismiss(details)) return;
        setOpen(next);
      }}
    >
      <DialogTrigger
        render={<Button variant="outline" className="h-11 sm:h-9" />}
      >
        Effectuer un retrait
      </DialogTrigger>
      <DialogContent>
        <form onSubmit={submit} noValidate className="flex flex-col gap-4">
          <DialogHeader>
            <DialogTitle>Effectuer un retrait</DialogTitle>
            <DialogDescription>
              Le montant sera envoyé sur votre compte Mobile Money.
            </DialogDescription>
          </DialogHeader>
          {field(
            "amount",
            "Montant (FCFA)",
            amount,
            (v) => setAmount(v.replace(/[^0-9]/g, "")),
            { inputMode: "numeric" },
          )}
          <div className="flex flex-col gap-1.5">
            <label htmlFor={`${id}-msisdn`} className="text-sm font-medium">
              Numéro Mobile Money
            </label>
            <InputGroup className="h-11 sm:h-9">
              <InputGroupAddon>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/flags/CM.svg"
                  alt=""
                  className="h-3.5 w-5 rounded-[2px]"
                />
                <span className="text-foreground tabular-nums">+237</span>
              </InputGroupAddon>
              <InputGroupInput
                id={`${id}-msisdn`}
                inputMode="tel"
                autoComplete="tel-national"
                placeholder="6 77 11 22 33"
                value={msisdn}
                aria-invalid={!!errors.msisdn}
                aria-describedby={
                  errors.msisdn ? `${id}-msisdn-error` : undefined
                }
                onChange={(e) => {
                  const next = formatLocalNumber(e.target.value);
                  setMsisdn(next);
                  // Le numéro choisit l'opérateur ; le gérant peut encore le changer.
                  const guess = channels.find(
                    (c) => c.id === guessChannel(channels, next),
                  );
                  if (guess) setNetwork(guess.network);
                }}
              />
            </InputGroup>
            {errors.msisdn ? (
              <p id={`${id}-msisdn-error`} className="text-sm text-destructive">
                {errors.msisdn}
              </p>
            ) : (
              <p className="text-xs text-muted-foreground">
                Cameroun uniquement. L’opérateur se choisit d’après le numéro.
              </p>
            )}
          </div>
          <fieldset className="flex flex-col gap-1.5">
            <legend className="text-sm font-medium">Opérateur</legend>
            <div className="flex gap-2">
              {channels.map(({ network: code, label }) => (
                <Button
                  key={code}
                  type="button"
                  variant="outline"
                  aria-pressed={network === code}
                  className={cn(
                    "h-11 flex-1 sm:h-9",
                    network === code &&
                      "border-foreground font-semibold ring-1 ring-foreground",
                  )}
                  onClick={() => setNetwork(code)}
                >
                  {label}
                </Button>
              ))}
            </div>
          </fieldset>
          {field("firstName", "Prénom du titulaire", firstName, setFirstName)}
          {field("lastName", "Nom du titulaire", lastName, setLastName)}
          {needsApproval(Number(amount)) ? (
            <p className="rounded-lg bg-muted px-3 py-2 text-sm">
              Ce montant doit être accepté par Ronetz avant d’être envoyé.
            </p>
          ) : null}
          {mutation.isError ? (
            <p role="alert" className="text-sm text-destructive">
              {withdrawalError(mutation.error)}
            </p>
          ) : null}
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              className="h-11 sm:h-9"
              disabled={mutation.isPending}
              onClick={() => setOpen(false)}
            >
              Annuler
            </Button>
            <Button
              type="submit"
              className="h-11 sm:h-9"
              disabled={mutation.isPending}
            >
              {mutation.isPending ? "Envoi…" : "Demander le retrait"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
