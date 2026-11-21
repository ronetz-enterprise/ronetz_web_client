"use client";

import { useId } from "react";

import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { usePlatformOrganizations } from "../api/platform";
import { platformCapabilities, type PlatformSession } from "../model/platform";

export function FilterSelect({
  label,
  value,
  options,
  onChange,
  className,
}: {
  label: string;
  value: string;
  options: { value: string; label: string }[];
  onChange: (value: string) => void;
  className?: string;
}) {
  const id = useId();
  return (
    <div className={className ?? "flex min-w-40 flex-1 flex-col gap-1.5"}>
      <Label htmlFor={id} className="text-xs text-muted-foreground">
        {label}
      </Label>
      <Select
        value={value}
        items={options}
        onValueChange={(next) => onChange(next ?? "ALL")}
      >
        <SelectTrigger id={id} className="h-11 w-full md:h-9">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {options.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

/**
 * Noms des organisations (jusqu'à 100, par ordre alphabétique) : sert à choisir une organisation
 * par son nom plutôt que par un identifiant, et à nommer les lignes des autres listes.
 */
export function useOrganizationNames(session: PlatformSession) {
  const enabled = platformCapabilities(session).canReadOrganizations;
  const query = usePlatformOrganizations(
    session,
    { status: "ALL", query: "", sort: "name" },
    0,
    100,
  );
  const names = new Map<string, string>(
    (query.data?.content ?? []).map((org) => [org.id, org.name]),
  );
  return { enabled, names, truncated: (query.data?.totalElements ?? 0) > 100 };
}

export function OrganizationFilter({
  session,
  value,
  onChange,
}: {
  session: PlatformSession;
  value: string | null;
  onChange: (id: string | null) => void;
}) {
  const { enabled, names } = useOrganizationNames(session);
  if (!enabled) return null;
  const options = [
    { value: "ALL", label: "Toutes les organisations" },
    ...[...names].map(([id, name]) => ({ value: id, label: name })),
  ];
  // Une organisation absente de la liste (au-delà de 100) reste choisie, sous un nom neutre.
  if (value && !names.has(value))
    options.push({ value, label: "Organisation choisie" });
  return (
    <FilterSelect
      label="Organisation"
      value={value ?? "ALL"}
      options={options}
      onChange={(next) => onChange(next === "ALL" ? null : next)}
    />
  );
}
