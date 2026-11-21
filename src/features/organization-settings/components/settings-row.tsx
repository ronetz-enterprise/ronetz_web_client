import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * Une ligne de réglage, comme dans la référence : libellé en gras à gauche, contrôle à droite,
 * filet entre deux lignes. Sur téléphone, le contrôle passe sous le libellé.
 */
export function SettingsRow({
  label,
  htmlFor,
  description,
  children,
  className,
}: {
  label: string;
  htmlFor?: string;
  description?: string;
  children: ReactNode;
  className?: string;
}) {
  const LabelTag = htmlFor ? "label" : "p";
  return (
    <div
      className={cn(
        "grid gap-2 border-b py-5 first:pt-0 sm:grid-cols-[14rem_minmax(0,1fr)] sm:gap-8",
        className,
      )}
    >
      <div className="space-y-1">
        <LabelTag
          {...(htmlFor ? { htmlFor } : {})}
          className="block text-sm font-semibold"
        >
          {label}
        </LabelTag>
        {description ? (
          <p className="text-sm text-muted-foreground">{description}</p>
        ) : null}
      </div>
      <div className="min-w-0 text-sm">{children}</div>
    </div>
  );
}
