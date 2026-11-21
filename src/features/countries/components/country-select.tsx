"use client";

import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Country } from "../model/country";
import { Flag } from "./flag";

/**
 * Liste des pays, avec drapeau et nom. Les pays ouverts d'abord (« Disponible »), les autres ensuite
 * (« Pas encore disponible ») : ils restent sélectionnables pour pouvoir demander d'être prévenu.
 */
export function CountrySelect({
  id,
  countries,
  value,
  onChange,
  disabled,
  invalid,
}: {
  id: string;
  countries: Country[];
  value: string;
  onChange: (code: string) => void;
  disabled?: boolean;
  invalid?: boolean;
}) {
  const open = countries.filter((c) => c.open);
  const closed = countries.filter((c) => !c.open);
  const selected = countries.find((c) => c.code === value);
  return (
    <Select
      value={value}
      onValueChange={(next) => next && onChange(next)}
      disabled={disabled}
    >
      <SelectTrigger
        id={id}
        aria-invalid={invalid}
        className="h-11 w-full sm:h-10"
      >
        {selected ? (
          <span className="flex min-w-0 items-center gap-2">
            <Flag code={selected.code} />
            <span className="truncate">{selected.name}</span>
          </span>
        ) : (
          <SelectValue placeholder="Choisissez votre pays" />
        )}
      </SelectTrigger>
      <SelectContent>
        {open.length > 0 && (
          <SelectGroup>
            <SelectLabel>Disponible</SelectLabel>
            {open.map((c) => (
              <SelectItem key={c.code} value={c.code}>
                <Flag code={c.code} />
                {c.name}
              </SelectItem>
            ))}
          </SelectGroup>
        )}
        {closed.length > 0 && (
          <SelectGroup>
            <SelectLabel>Pas encore disponible</SelectLabel>
            {closed.map((c) => (
              <SelectItem key={c.code} value={c.code}>
                <Flag code={c.code} />
                {c.name}
              </SelectItem>
            ))}
          </SelectGroup>
        )}
      </SelectContent>
    </Select>
  );
}
