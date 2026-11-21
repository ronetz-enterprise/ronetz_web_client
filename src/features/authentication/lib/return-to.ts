const fallback = "/dashboard";

// Only existing placeholders are accepted. Membership authorization is not inferred.
export function safeAuthDestination(value: unknown): string {
  if (typeof value !== "string" || /[%\\\s?#]/.test(value)) return fallback;
  if (
    [
      "/onboarding",
      "/onboarding/organization",
      "/dashboard",
      fallback,
      "/account",
      "/organizations/select",
      "/onboarding/status",
      "/admin",
    ].includes(value)
  )
    return value;
  // Console gérant : adresses internes connues, sans paramètres (l'organisation est en session).
  if (
    /^\/(dashboard|sites|routers|access|offers|finance|usage|organization|settings)(\/[A-Za-z0-9_-]+)*$/.test(
      value,
    )
  )
    return value;
  // Admin sub-routes.
  if (/^\/admin(\/organizations|\/network|\/audit|\/finance)?$/.test(value))
    return value;
  return fallback;
}
