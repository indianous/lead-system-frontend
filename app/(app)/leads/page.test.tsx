import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, within } from "@testing-library/react";
import { ToastProvider, ToastViewport } from "base-ds";
import LeadsPage from "./page";
import { useLeads, useUpdateLeadStatus } from "@/lib/queries/leads";
import { ApiError } from "@/lib/api-client";

vi.mock("@/lib/queries/leads", () => ({
  useLeads: vi.fn(),
  useUpdateLeadStatus: vi.fn(),
}));

const mutate = vi.fn();

const leadNew = {
  id: "lead-1",
  name: "Ana Cliente",
  leadType: "DIRECT_CONTACT",
  phone: null,
  email: null,
  initialMessage: null,
  estimatedBudgetCents: null,
  desiredTimeline: null,
  qualificationScore: "HIGH",
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
  assignedUserName: "Vendedor",
  productsOfInterest: [],
  statusHistory: [],
  createdAt: "",
  updatedAt: "",
};

const leadContacted = { ...leadNew, id: "lead-2", name: "Bruno Cliente", funnelStatus: "CONTACTED", qualificationScore: null };

beforeEach(() => {
  vi.mocked(useLeads).mockReset();
  vi.mocked(useUpdateLeadStatus).mockReturnValue({ mutate } as unknown as ReturnType<typeof useUpdateLeadStatus>);
  mutate.mockReset();
});

function renderPage() {
  return render(
    <ToastProvider>
      <LeadsPage />
      <ToastViewport />
    </ToastProvider>,
  );
}

describe("LeadsPage", () => {
  it("shows a skeleton while loading", () => {
    vi.mocked(useLeads).mockReturnValue({ data: undefined, isLoading: true, error: null } as unknown as ReturnType<
      typeof useLeads
    >);

    const { container } = renderPage();

    expect(container.querySelector('[aria-hidden="true"]')).toBeInTheDocument();
  });

  it("renders the funnel columns with leads grouped by funnelStatus", () => {
    vi.mocked(useLeads).mockReturnValue({
      data: [leadNew, leadContacted],
      isLoading: false,
      error: null,
    } as unknown as ReturnType<typeof useLeads>);

    renderPage();

    expect(screen.getByText("Novo")).toBeInTheDocument();
    expect(screen.getByText("Perdido")).toBeInTheDocument();

    const newColumn = screen.getByTestId("kanban-column-NEW");
    expect(within(newColumn).getByText("Ana Cliente")).toBeInTheDocument();

    const contactedColumn = screen.getByTestId("kanban-column-CONTACTED");
    expect(within(contactedColumn).getByText("Bruno Cliente")).toBeInTheDocument();
    expect(within(newColumn).queryByText("Bruno Cliente")).not.toBeInTheDocument();
  });

  it("renders type and channel filter dropdowns", () => {
    vi.mocked(useLeads).mockReturnValue({ data: [], isLoading: false, error: null } as unknown as ReturnType<
      typeof useLeads
    >);

    renderPage();

    expect(screen.getByText("Tipo")).toBeInTheDocument();
    expect(screen.getByText("Canal")).toBeInTheDocument();
  });

  it("shows a permission message when the query fails with 403", () => {
    vi.mocked(useLeads).mockReturnValue({
      data: undefined,
      isLoading: false,
      error: new ApiError(403, "forbidden"),
    } as unknown as ReturnType<typeof useLeads>);

    renderPage();

    expect(screen.getByText("Você não tem permissão para ver esta página")).toBeInTheDocument();
  });
});
