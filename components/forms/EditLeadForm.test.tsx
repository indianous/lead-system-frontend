import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useRouter } from "next/navigation";
import { ToastProvider, ToastViewport } from "base-ds";
import { EditLeadForm } from "./EditLeadForm";
import { useLead, useUpdateLead } from "@/lib/queries/leads";
import { useProducts } from "@/lib/queries/products";
import { useUsers } from "@/lib/queries/users";

vi.mock("next/navigation", () => ({
  useRouter: vi.fn(),
}));

vi.mock("@/lib/queries/leads", () => ({
  useLead: vi.fn(),
  useUpdateLead: vi.fn(),
}));

vi.mock("@/lib/queries/users", () => ({
  useUsers: vi.fn(),
}));

vi.mock("@/lib/queries/products", () => ({
  useProducts: vi.fn(),
}));

const push = vi.fn();
const mutateAsync = vi.fn();

const baseLead = {
  id: "lead-1",
  name: "Cliente Existente",
  leadType: "DIRECT_CONTACT",
  phone: "11999999999",
  email: "cliente@empresa.com",
  initialMessage: "Quero um site",
  estimatedBudgetCents: 150000,
  desiredTimeline: "1 mês",
  qualificationScore: null,
  funnelStatus: "NEW",
  lossReason: null,
  origin: {
    id: "origin-1",
    originType: "DIRECT_CONTACT",
    channel: "TELEGRAM",
    searchSource: null,
    region: null,
    searchSegment: null,
    captureMethod: "MANUAL",
  },
  assignedUserId: "user-1",
  assignedUserName: "Ana",
  productsOfInterest: [],
  statusHistory: [],
  createdAt: "",
  updatedAt: "",
};

beforeEach(() => {
  vi.mocked(useRouter).mockReturnValue({ push } as unknown as ReturnType<typeof useRouter>);
  vi.mocked(useLead).mockReturnValue({ data: baseLead, isLoading: false } as unknown as ReturnType<typeof useLead>);
  vi.mocked(useUsers).mockReturnValue({
    data: [
      { id: "user-1", name: "Ana", email: "ana@empresa.com", roleName: "Salesperson", active: true, createdAt: "" },
      { id: "user-2", name: "Bruno", email: "bruno@empresa.com", roleName: "Salesperson", active: true, createdAt: "" },
    ],
  } as unknown as ReturnType<typeof useUsers>);
  vi.mocked(useProducts).mockReturnValue({ data: [] } as unknown as ReturnType<typeof useProducts>);
  vi.mocked(useUpdateLead).mockReturnValue({ mutateAsync } as unknown as ReturnType<typeof useUpdateLead>);
  push.mockReset();
  mutateAsync.mockReset();
});

function renderForm() {
  return render(
    <ToastProvider>
      <EditLeadForm leadId="lead-1" />
      <ToastViewport />
    </ToastProvider>,
  );
}

describe("EditLeadForm", () => {
  it("shows a skeleton while the lead is loading", () => {
    vi.mocked(useLead).mockReturnValue({ data: undefined, isLoading: true } as unknown as ReturnType<typeof useLead>);
    const { container } = renderForm();

    expect(container.querySelector('[aria-hidden="true"]')).toBeInTheDocument();
    expect(screen.queryByLabelText(/^nome/i)).not.toBeInTheDocument();
  });

  it("loads the current lead's data into the form", async () => {
    renderForm();

    expect(await screen.findByDisplayValue("Cliente Existente")).toBeInTheDocument();
    expect(screen.getByLabelText(/responsável/i)).toHaveValue("user-1");
  });

  it("reassigns the responsible user and calls the update mutation with the right payload", async () => {
    mutateAsync.mockResolvedValue({});
    const user = userEvent.setup();
    renderForm();

    await screen.findByDisplayValue("Cliente Existente");
    await user.selectOptions(screen.getByLabelText(/responsável/i), "user-2");
    await user.click(screen.getByRole("button", { name: /salvar alterações/i }));

    await waitFor(() =>
      expect(mutateAsync).toHaveBeenCalledWith(
        expect.objectContaining({ name: "Cliente Existente", assignedUserId: "user-2" }),
      ),
    );
  });

  it("redirects to /leads/[id] on successful update", async () => {
    mutateAsync.mockResolvedValue({});
    const user = userEvent.setup();
    renderForm();

    await screen.findByDisplayValue("Cliente Existente");
    await user.click(screen.getByRole("button", { name: /salvar alterações/i }));

    expect(await screen.findByText("Lead atualizado com sucesso")).toBeInTheDocument();
    await waitFor(() => expect(push).toHaveBeenCalledWith("/leads/lead-1"));
  });
});
