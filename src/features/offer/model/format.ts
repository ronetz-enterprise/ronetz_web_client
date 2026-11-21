/** XAF/XOF s'écrivent « FCFA » à l'écran ; les autres devises gardent leur code. */
export function currencyLabel(code: string) {
  return code === "XAF" || code === "XOF" ? "FCFA" : code;
}
