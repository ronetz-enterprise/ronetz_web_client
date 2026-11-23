"use client";

import { useSyncExternalStore } from "react";

/**
 * Ce que le gérant a déjà vu (visite guidée, bulles de première visite d'une page).
 *
 * Un seul endroit lit et écrit cette mémoire : aujourd'hui le navigateur, demain le serveur.
 * Le serveur n'a pas encore d'API de préférences (`/api/me` ne les porte pas) ; quand elle
 * existera, seules `read` et `write` changeront, et la visite ne reviendra plus sur un autre
 * téléphone.
 */
const PREFIX = "ronetz.visite.v1";
const listeners = new Set<() => void>();

function storageKey(organizationId: string, topic: string) {
  return topic === "tour"
    ? `${PREFIX}.${organizationId}`
    : `${PREFIX}.${organizationId}.${topic}`;
}

function read(organizationId: string, topic: string): boolean {
  try {
    return (
      window.localStorage.getItem(storageKey(organizationId, topic)) === "1"
    );
  } catch {
    // Stockage indisponible : on fait comme si c'était vu, pour ne pas gêner à chaque page.
    return true;
  }
}

function write(organizationId: string, topic: string) {
  try {
    window.localStorage.setItem(storageKey(organizationId, topic), "1");
  } catch {
    /* stockage indisponible : sans conséquence */
  }
}

export function markSeen(organizationId: string, topic: string) {
  write(organizationId, topic);
  listeners.forEach((l) => l());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

/** Vrai si déjà vu. Côté serveur (rendu initial), on répond « vu » pour ne rien afficher. */
export function useSeen(organizationId: string | null, topic: string) {
  return useSyncExternalStore(
    subscribe,
    () => (organizationId ? read(organizationId, topic) : true),
    () => true,
  );
}
