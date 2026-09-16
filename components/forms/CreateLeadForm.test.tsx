import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useRouter } from "next/navigation";
import { ToastProvider, ToastViewport } from "base-ds";
import { CreateLeadForm } from "./CreateLeadForm";
import { useCreateLead } from "@/lib/queries/leads";
import { useProducts } from "@/lib/queries/products";
import { useUsers } from "@/lib/queries/users";

vi.mock("next/navigation", () => ({
  useRouter: vi.fn(),
}));

vi.mock("@/lib/queries/leads", () => ({
  useCreateLead: vi.fn(),
}));

vi.mock("@/lib/queries/users", () => ({
  useUsers: vi.fn(),
}));

vi.mock("@/lib/queries/products", () => ({
  useProducts: vi.fn(),
}));

const push = vi.fn();
const mutateAsync = vi.fn();

beforeEach(() => {
  vi.mocked(useRouter).mockReturnValue({ push } as unknown as ReturnType<typeof useRouter>);
  vi.mocked(useUsers).mockReturnValue({
    data: [{ id: "user-1", name: "Ana", email: "ana@empresa.com", roleName: "Salesperson", active: true, createdAt: "" }],
  } as unknown as ReturnType<typeof useUsers>);
  vi.mocked(useProducts).mockReturnValue({
    data: [
      {
        id: "product-1",
        name: "Site institucional",
        type: "READY_MADE",
        description: "",
        minPriceCents: null,
        maxPriceCents: null,
        active: true,
        createdAt: "",
      },
    ],
  } as unknown as ReturnType<typeof useProducts>);
  vi.mocked(useCreateLead).mockReturnValue({ mutateAsync } as unknown as ReturnType<typeof useCreateLead>);
  push.mockReset();
  mutateAsync.mockReset();
});

function renderForm() {
  return render(
    <ToastProvider>
      <CreateLeadForm />
      <ToastViewport />
    </ToastProvider>,
  );
}

describe("CreateLeadForm", () => {
  it("renders name/channel/responsible fields and the submit button", () => {
    renderForm();

    expect(screen.getByLabelText(/nome/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/canal/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/responsável/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /cadastrar lead/i })).toBeInTheDocument();
  });

  it("shows validation errors on empty submit and does not call the mutation", async () => {
    const user = userEvent.setup();
    renderForm();

    await user.click(screen.getByRole("button", { name: /cadastrar lead/i }));

    expect(await screen.findByText("Informe o nome")).toBeInTheDocument();
    expect(document.getElementById("channel-error")).toHaveTextContent("Selecione o canal");
    expect(document.getElementById("assignedUserId-error")).toHaveTextContent("Selecione um responsável");
    expect(mutateAsync).not.toHaveBeenCalled();
  });

  it("fixes leadType to DIRECT_CONTACT, converts the budget to cents, and redirects to /leads on success", async () => {
    mutateAsync.mockResolvedValue({});
    const user = userEvent.setup();
    renderForm();

    await user.type(screen.getByLabelText(/nome/i), "Cliente novo");
    await user.selectOptions(screen.getByLabelText(/canal/i), "TELEGRAM");
    await user.selectOptions(screen.getByLabelText(/responsável/i), "user-1");
    await user.type(screen.getByLabelText(/orçamento estimado/i), "1500");
    await user.click(screen.getByRole("button", { name: /cadastrar lead/i }));

    await waitFor(() =>
      expect(mutateAsync).toHaveBeenCalledWith(
        expect.objectContaining({
          name: "Cliente novo",
          leadType: "DIRECT_CONTACT",
          channel: "TELEGRAM",
          assignedUserId: "user-1",
          estimatedBudgetCents: 150000,
        }),
      ),
    );
    expect(await screen.findByText("Lead cadastrado com sucesso")).toBeInTheDocument();
    await waitFor(() => expect(push).toHaveBeenCalledWith("/leads"));
  });

  it("shows an error toast when the mutation fails", async () => {
    mutateAsync.mockRejectedValue(new Error("falhou"));
    const user = userEvent.setup();
    renderForm();

    await user.type(screen.getByLabelText(/nome/i), "Cliente novo");
    await user.selectOptions(screen.getByLabelText(/canal/i), "TELEGRAM");
    await user.selectOptions(screen.getByLabelText(/responsável/i), "user-1");
    await user.click(screen.getByRole("button", { name: /cadastrar lead/i }));

    expect(await screen.findByText("Não foi possível cadastrar o lead")).toBeInTheDocument();
    expect(push).not.toHaveBeenCalled();
  });
});
