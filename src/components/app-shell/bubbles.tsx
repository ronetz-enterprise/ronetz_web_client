"use client";

import { HugeiconsIcon } from "@hugeicons/react";
import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
} from "react";
import { createPortal } from "react-dom";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

import type { NavItem } from "./nav-items";

/**
 * Bulles d'explication : une carte avec une petite flèche vers l'élément présenté, qui reste
 * éclairé sous un voile. Sert à la visite guidée (plusieurs bulles) et aux bulles de première
 * visite d'une page (une seule bulle).
 */
export type BubbleStep = {
  title: string;
  body: string;
  /** Sélecteurs de l'élément visé : le premier visible gagne. */
  targets?: string[];
  /** Onglet présenté : son icône s'affiche dans la bulle. */
  item?: NavItem;
};

type Rect = { top: number; left: number; width: number; height: number };
type Side = "right" | "bottom" | "top";
const PAD = 4;
const GAP = 14;
const CARD_W = 320;
const ARROW = 8;

function visible(selectors: string[] | undefined): HTMLElement | null {
  for (const s of selectors ?? []) {
    for (const el of document.querySelectorAll<HTMLElement>(s)) {
      const r = el.getBoundingClientRect();
      if (r.width > 0 && r.height > 0) return el;
    }
  }
  return null;
}

function measure(el: HTMLElement): Rect {
  const r = el.getBoundingClientRect();
  return {
    top: r.top - PAD,
    left: r.left - PAD,
    width: r.width + PAD * 2,
    height: r.height + PAD * 2,
  };
}

/** À droite de l'élément s'il y a la place, sinon dessous, sinon dessus. */
function place(box: Rect, cardH: number) {
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const w = Math.min(CARD_W, vw - 24);
  const midY = box.top + box.height / 2;
  const midX = box.left + box.width / 2;

  if (box.left + box.width + GAP + w + 12 <= vw) {
    const top = Math.min(Math.max(midY - 28, 12), vh - cardH - 12);
    return {
      side: "right" as Side,
      card: { left: box.left + box.width + GAP, top, width: w },
      arrow: { left: -ARROW / 2 - 1, top: midY - top - ARROW / 2 },
    };
  }
  const left = Math.min(Math.max(midX - 32, 12), vw - w - 12);
  const arrowLeft = Math.min(Math.max(midX - left - ARROW / 2, 16), w - 24);
  if (box.top + box.height + GAP + cardH + 12 <= vh) {
    return {
      side: "bottom" as Side,
      card: { left, top: box.top + box.height + GAP, width: w },
      arrow: { top: -ARROW / 2 - 1, left: arrowLeft },
    };
  }
  return {
    side: "top" as Side,
    card: { left, top: Math.max(12, box.top - GAP - cardH), width: w },
    arrow: { bottom: -ARROW / 2 - 1, left: arrowLeft },
  };
}

export function Bubbles({
  steps,
  onDone,
  fallbackTargets,
  requireTarget = false,
  finishLabel = "Terminer",
}: {
  steps: BubbleStep[];
  /** `finished` : dernière bulle validée ; `skipped` : « Passer » ou Échap. */
  onDone: (how: "finished" | "skipped") => void;
  /** Élément à viser quand la cible n'est pas visible (menu replié sur téléphone). */
  fallbackTargets?: string[];
  /** Ne rien afficher tant que la cible n'est pas à l'écran (bulle de page). */
  requireTarget?: boolean;
  finishLabel?: string;
}) {
  const [index, setIndex] = useState(0);
  const [box, setBox] = useState<Rect | null>(null);
  const [cardH, setCardH] = useState(180);
  const cardRef = useRef<HTMLDivElement>(null);
  const step = steps[index];
  const single = steps.length === 1;
  const last = index === steps.length - 1;

  // Cadre l'élément et le suit : la mise en page bouge (données qui arrivent, menu, défilement).
  useLayoutEffect(() => {
    const update = () => {
      const el = step.targets
        ? (visible(step.targets) ?? visible(fallbackTargets))
        : null;
      setBox(el ? measure(el) : null);
      if (cardRef.current) setCardH(cardRef.current.offsetHeight);
    };
    update();
    const timer = window.setInterval(update, 300);
    window.addEventListener("resize", update);
    window.addEventListener("scroll", update, true);
    return () => {
      window.clearInterval(timer);
      window.removeEventListener("resize", update);
      window.removeEventListener("scroll", update, true);
    };
  }, [step, fallbackTargets]);

  const shown = !requireTarget || box !== null;

  useEffect(() => {
    if (shown) cardRef.current?.focus();
  }, [shown, index]);

  useEffect(() => {
    if (!shown) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onDone("skipped");
      else if (e.key === "ArrowRight")
        setIndex((i) => Math.min(i + 1, steps.length - 1));
      else if (e.key === "ArrowLeft") setIndex((i) => Math.max(i - 1, 0));
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [shown, onDone, steps.length]);

  if (!shown || typeof document === "undefined") return null;

  const placed = box ? place(box, cardH) : null;
  const cardStyle: CSSProperties = placed
    ? placed.card
    : {
        left: "50%",
        top: "50%",
        width: Math.min(CARD_W + 40, window.innerWidth - 24),
        transform: "translate(-50%, -50%)",
      };

  return createPortal(
    <div className="fixed inset-0 z-[60]">
      {/* Voile : bloque les clics le temps de la bulle ; l'élément présenté reste éclairé. */}
      {box ? (
        <div
          className="pointer-events-none fixed rounded-lg ring-2 ring-signal transition-all duration-200"
          style={{ ...box, boxShadow: "0 0 0 9999px rgb(13 13 20 / 0.45)" }}
        />
      ) : (
        <div className="fixed inset-0 bg-[rgb(13_13_20/0.45)]" />
      )}
      <div
        ref={cardRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="bubble-title"
        aria-describedby="bubble-body"
        tabIndex={-1}
        className="fixed flex flex-col gap-3 rounded-xl border border-border bg-popover p-4 text-popover-foreground shadow-[var(--shadow-float)] outline-none transition-[top,left] duration-200"
        style={cardStyle}
      >
        {/* Flèche de la bulle : un carré tourné, bordé sur ses deux côtés visibles. */}
        {placed ? (
          <span
            aria-hidden
            className={cn(
              "absolute size-2 rotate-45 border-border bg-popover",
              placed.side === "right" && "border-b border-l",
              placed.side === "bottom" && "border-t border-l",
              placed.side === "top" && "border-r border-b",
            )}
            style={placed.arrow}
          />
        ) : null}
        <div className="flex items-center gap-2">
          {step.item ? (
            <span className="grid size-7 shrink-0 place-items-center rounded-md bg-muted">
              <HugeiconsIcon
                icon={step.item.icon}
                strokeWidth={1.8}
                className="size-4"
              />
            </span>
          ) : null}
          <h2 id="bubble-title" className="flex-1 text-base font-semibold">
            {step.title}
          </h2>
          {single ? null : (
            <span className="text-xs text-muted-foreground tabular-nums">
              {index + 1}/{steps.length}
            </span>
          )}
        </div>
        <p id="bubble-body" className="text-sm text-muted-foreground">
          {step.body}
        </p>
        <div className="flex items-center gap-2 pt-1">
          {single ? null : (
            <button
              type="button"
              onClick={() => onDone("skipped")}
              className="mr-auto text-xs text-muted-foreground hover:text-foreground hover:underline"
            >
              Passer
            </button>
          )}
          {index > 0 ? (
            <Button
              variant="outline"
              className="h-11 sm:h-8"
              onClick={() => setIndex(index - 1)}
            >
              Précédent
            </Button>
          ) : null}
          <Button
            className={cn("h-11 sm:h-8", single && "ml-auto")}
            onClick={() => (last ? onDone("finished") : setIndex(index + 1))}
          >
            {single
              ? "Compris"
              : index === 0
                ? "Commencer"
                : last
                  ? finishLabel
                  : "Suivant"}
          </Button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
