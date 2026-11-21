"use client";

import { useTheme } from "next-themes";
import { useSyncExternalStore } from "react";

import { Button } from "@/components/ui/button";

const items = [
  { id: "system", label: "Système" },
  { id: "light", label: "Clair" },
  { id: "dark", label: "Sombre" },
] as const;

/** Force le thème de toute la page (fenêtres et messages s'affichent hors des cadres). */
export function ThemeSwitch() {
  const { theme, setTheme } = useTheme();
  const mounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );
  return (
    <div
      role="group"
      aria-label="Thème de la page"
      className="flex gap-1 rounded-lg border border-border p-1"
    >
      {items.map((i) => (
        <Button
          key={i.id}
          size="sm"
          variant={mounted && theme === i.id ? "default" : "ghost"}
          aria-pressed={mounted && theme === i.id}
          onClick={() => setTheme(i.id)}
        >
          {i.label}
        </Button>
      ))}
    </div>
  );
}
