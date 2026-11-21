"use client";

import { useState } from "react";
import { httpClient } from "@/lib/http-client";
import { toUserMessage } from "@/lib/api-error";

export function SocleCheck() {
  const [state, setState] = useState<string>("Pas encore testé");
  async function check() {
    setState("Test en cours…");
    try {
      const csrf = await httpClient<{ headerName: string }>(
        "/api/auth/web/csrf",
        { credentials: "include" },
      );
      setState(`Relais /api opérationnel · en-tête ${csrf.headerName}`);
    } catch (error) {
      setState(toUserMessage(error));
    }
  }
  return (
    <section>
      <h2>Navigateur vers le backend, par le relais /api</h2>
      <button type="button" onClick={check}>
        Tester
      </button>
      <p data-testid="browser-status">{state}</p>
    </section>
  );
}
