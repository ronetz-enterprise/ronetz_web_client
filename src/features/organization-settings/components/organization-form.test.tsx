import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import type { ReactNode } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { OrganizationFields } from "./organization-form";

vi.mock("@/features/authentication/hooks/auth-provider", () => ({
  useAuth: () => ({ request: vi.fn().mockResolvedValue([]) }),
}));
vi.mock("@/features/organizations/hooks/organization-context", () => ({
  useOrganization: () => ({
    organizationId: "1e8f48a9-cc92-447c-9fae-50a0415fb566",
    orgApi: (p = "") => `/api/organizations/x${p}`,
  }),
}));

const organization = {
  id: "1e8f48a9-cc92-447c-9fae-50a0415fb566",
  name: "Cyber Akwa",
  country: "CM",
  currency: "XAF",
  status: "ACTIVE" as const,
  suspensionReason: null,
  suspendedAt: null,
  closedAt: null,
  createdAt: "2026-11-16T21:32:32.744064Z",
  updatedAt: "2026-11-16T21:32:32.744064Z",
};

function wrap(children: ReactNode) {
  return (
    <QueryClientProvider client={new QueryClient()}>
      {children}
    </QueryClientProvider>
  );
}

afterEach(cleanup);

describe("OrganizationFields", () => {
  it("affiche le pays, la devise déduite et le statut, sans champ de devise", () => {
    render(
      wrap(<OrganizationFields organization={organization} editable={false} />),
    );
    expect(screen.getByText("Cyber Akwa")).toBeInTheDocument();
    expect(screen.getByText(/XAF/)).toBeInTheDocument();
    expect(screen.getByText("Active")).toBeInTheDocument();
    expect(screen.getByText(/bientôt disponible/)).toBeInTheDocument();
    expect(screen.queryByRole("textbox")).toBeNull();
    expect(screen.queryByRole("button", { name: "Enregistrer" })).toBeNull();
  });

  it("garde Enregistrer désactivé tant que le nom n’a pas changé", async () => {
    render(wrap(<OrganizationFields organization={organization} editable />));
    const save = screen.getByRole("button", { name: "Enregistrer" });
    const cancel = screen.getByRole("button", { name: "Annuler" });
    expect(save).toBeDisabled();
    const input = screen.getByLabelText("Nom de l’organisation");
    fireEvent.change(input, { target: { value: "Cyber Akwa 2" } });
    await waitFor(() => expect(save).toBeEnabled());
    fireEvent.click(cancel);
    await waitFor(() => expect(input).toHaveValue("Cyber Akwa"));
    expect(save).toBeDisabled();
  });
});
