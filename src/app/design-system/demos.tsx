"use client";

import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";

export function ToastDemo() {
  return (
    <div className="flex flex-wrap gap-2">
      <Button
        variant="outline"
        onClick={() =>
          toast.success("Accès créé", {
            description: "Le code K7M4-92QX est prêt à être remis.",
          })
        }
      >
        Réussite
      </Button>
      <Button
        variant="outline"
        onClick={() =>
          toast.error("Paiement non reçu", {
            description: "Vérifiez le numéro et réessayez.",
          })
        }
      >
        Erreur
      </Button>
      <Button
        variant="outline"
        onClick={() => toast("Routeur Terrasse hors ligne depuis 14 h 05")}
      >
        Information
      </Button>
    </div>
  );
}

export function DialogDemo() {
  const [name, setName] = useState("");
  const invalid = name.trim() === "";
  return (
    <Dialog>
      <DialogTrigger render={<Button />}>Ajouter un routeur</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Ajouter un routeur</DialogTitle>
          <DialogDescription>
            Donnez-lui un nom que vous reconnaîtrez sur votre liste.
          </DialogDescription>
        </DialogHeader>
        <Field data-invalid={invalid && name !== "" ? true : undefined}>
          <FieldLabel htmlFor="ds-router-name">Nom du routeur</FieldLabel>
          <Input
            id="ds-router-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Ex. : Cyber Akwa, salle 1"
            aria-invalid={invalid && name !== ""}
          />
          <FieldDescription>Vos clients ne le voient pas.</FieldDescription>
          {invalid && name !== "" ? (
            <FieldError>Saisissez un nom.</FieldError>
          ) : null}
        </Field>
        <DialogFooter>
          <DialogClose render={<Button variant="outline" />}>
            Annuler
          </DialogClose>
          <Button disabled={invalid}>Ajouter</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function MenuDemo() {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger render={<Button variant="outline" />}>
        Actions
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start">
        <DropdownMenuLabel>Accès K7M4-92QX</DropdownMenuLabel>
        <DropdownMenuItem>Voir le détail</DropdownMenuItem>
        <DropdownMenuItem>Copier le code</DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem variant="destructive">
          Annuler l’accès
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
