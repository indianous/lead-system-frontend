import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useRouter } from "next/navigation";
import { ToastProvider, ToastViewport } from "base-ds";
import { UpdateLeadStatusForm } from "./UpdateLeadStatusForm";
import { useLead, useUpdateLeadStatus } from "@/lib/queries/leads";

vi.mock("next/navigation", () => ({
  useRouter: vi.fn(),
}));

vi.mock("@/lib/queries/leads", () => ({
  useLead: vi.fn(),
  useUpdateLeadStatus: vi.fn(),
}));

const push = vi.fn();
const mutateAsync = vi.fn();

beforeEach(() => {
  vi.mocked(useRouter).mockReturnValue({ push } as unknown as ReturnType<typeof useRouter>);
  vi.mocked(useLead).mockReturnValue({
    data: { funnelStatus: "NEW" },
    isLoading: false,
  } as unknown as ReturnType<typeof useLead>);
  vi.mocked(useUpdateLeadStatus).mockReturnValue({ mutateAsync } as unknown as ReturnType<typeof useUpdateLeadStatus>);
  push.mockReset();
  mutateAsync.mockReset();
});

function renderForm() {
  return render(
    <ToastProvider>
      <UpdateLeadStatusForm leadId="lead-1" />
      <ToastViewport />
    </ToastProvider>,
  );
}

describe("UpdateLeadStatusForm", () => {
  it("shows the current status", async () => {
    renderForm();

    expect(await screen.findByText(/etapa atual: novo/i)).toBeInTheDocument();
  });

  it("requires selecting a new status", async () => {
    const user = userEvent.setup();
    renderForm();

    await user.click(screen.getByRole("button", { name: /confirmar/i }));

    await waitFor(() => expect(document.getElementById("newStatus-error")).toHaveTextContent("Selecione a nova etapa"));
    expect(mutateAsync).not.toHaveBeenCalled();
  });

  it("only shows the reason field when LOST is selected, and requires it", async () => {
    const user = userEvent.setup();
    renderForm();

    expect(screen.queryByLabelText(/motivo da perda/i)).not.toBeInTheDocument();

    await user.selectOptions(screen.getByLabelText(/nova etapa/i), "LOST");
    expect(screen.getByLabelText(/motivo da perda/i)).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /confirmar/i }));
    expect(await screen.findByText("Informe o motivo da perda")).toBeInTheDocument();
    expect(mutateAsync).not.toHaveBeenCalled();
  });

  it("calls the mutation with the right payload and redirects to /leads/[id] on success", async () => {
    mutateAsync.mockResolvedValue({});
    const user = userEvent.setup();
    renderForm();

    await user.selectOptions(screen.getByLabelText(/nova etapa/i), "CONTACTED");
    await user.click(screen.getByRole("button", { name: /confirmar/i }));

    await waitFor(() =>
      expect(mutateAsync).toHaveBeenCalledWith({ id: "lead-1", newStatus: "CONTACTED", reason: null }),
    );
    expect(await screen.findByText("Etapa do lead atualizada")).toBeInTheDocument();
    await waitFor(() => expect(push).toHaveBeenCalledWith("/leads/lead-1"));
  });
});
