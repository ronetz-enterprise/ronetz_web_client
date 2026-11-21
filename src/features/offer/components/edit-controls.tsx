"use client";

import { HugeiconsIcon } from "@hugeicons/react";
import { Cancel01Icon, Tick02Icon } from "@hugeicons/core-free-icons";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
} from "react";
import { Button } from "@/components/ui/button";

/**
 * Brouillon d'un champ édité sur place : ✓ enregistre cette valeur seule, ✗ revient à la valeur
 * enregistrée. Rien n'apparaît tant que le champ est inchangé.
 */
export function useFieldDraft<T>(initial: T, start: T = initial) {
  // `start` permet d'ouvrir un champ déjà modifié (ex. « + Ajouter une limite ») : ✓ / ✗ s'affichent.
  const [draft, setDraft] = useState<T>(start);
  const [error, setError] = useState<string | null>(null);
  const dirty = JSON.stringify(draft) !== JSON.stringify(initial);
  return {
    draft,
    setDraft: (v: T) => {
      setError(null);
      setDraft(v);
    },
    dirty,
    error,
    setError,
    reset: () => {
      setError(null);
      setDraft(initial);
    },
  };
}

type Entry = {
  dirty: boolean;
  onSave: () => void | Promise<void>;
  onCancel: () => void;
};

/** Registre des champs modifiés d'une fiche : une seule barre enregistre ou annule tout. */
export const FormRegistryContext = createContext<{
  set: (id: string, entry: Entry | null) => void;
} | null>(null);

export function useFormRegistry() {
  const entries = useRef(new Map<string, Entry>());
  const [dirtyCount, setDirtyCount] = useState(0);
  const set = useCallback((id: string, entry: Entry | null) => {
    if (entry) entries.current.set(id, entry);
    else entries.current.delete(id);
    setDirtyCount([...entries.current.values()].filter((e) => e.dirty).length);
  }, []);
  const dirty = () => [...entries.current.values()].filter((e) => e.dirty);
  return {
    context: useMemo(() => ({ set }), [set]),
    dirtyCount,
    saveAll: async () => {
      for (const e of dirty()) await e.onSave();
    },
    cancelAll: () => dirty().forEach((e) => e.onCancel()),
  };
}

/**
 * Inscrit le champ dans la barre d'enregistrement commune (plus de ✓ / ✗ par champ).
 * Hors d'une fiche munie de la barre, affiche encore les boutons du champ.
 */
export function EditControls({
  label,
  dirty,
  pending,
  onSave,
  onCancel,
}: {
  label: string;
  dirty: boolean;
  pending: boolean;
  onSave: () => void;
  onCancel: () => void;
}) {
  const registry = useContext(FormRegistryContext);
  const id = useId();
  const latest = useRef({ onSave, onCancel });
  useEffect(() => {
    latest.current = { onSave, onCancel };
  });
  useEffect(() => {
    if (!registry) return;
    registry.set(id, {
      dirty,
      onSave: () => latest.current.onSave(),
      onCancel: () => latest.current.onCancel(),
    });
  }, [registry, id, dirty]);
  useEffect(() => () => registry?.set(id, null), [registry, id]);
  if (registry || !dirty) return null;
  return (
    <div className="flex shrink-0 items-center gap-1">
      <Button
        type="button"
        size="icon"
        className="size-11 sm:size-9"
        aria-label={`Enregistrer : ${label}`}
        disabled={pending}
        onClick={onSave}
      >
        <HugeiconsIcon icon={Tick02Icon} strokeWidth={2} aria-hidden />
      </Button>
      <Button
        type="button"
        size="icon"
        variant="outline"
        className="size-11 sm:size-9"
        aria-label={`Annuler : ${label}`}
        disabled={pending}
        onClick={onCancel}
      >
        <HugeiconsIcon icon={Cancel01Icon} strokeWidth={2} aria-hidden />
      </Button>
    </div>
  );
}
