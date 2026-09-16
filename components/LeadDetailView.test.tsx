import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { LeadDetailView } from "./LeadDetailView";
import { useLead } from "@/lib/queries/leads";
import { ApiError } from "@/lib/api-client";

vi.mock("@/lib/queries/leads", () => ({
  useLead: vi.fn(),
}));

beforeEach(() => {
  vi.mocked(useLead).mockReset();
});

const baseLead = {
  id: "lead-1",
  name: "Cliente Existente",
  leadType: "DIRECT_CONTACT",
  phone: "11999999999",
  email: "cliente@empresa.com",
  initialMessage: "Quero um site",
  estimatedBudgetCents: 150000,
  desiredTimeline: "1 mês",
  qualificationScore: "HIGH",
  funnelStatus: "CONTACTED",
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
  productsOfInterest: [{ id: "product-1", name: "Site institucional" }],
  statusHistory: [],
  createdAt: "",
  updatedAt: "",
};

describe("LeadDetailView", () => {
  it("shows a skeleton while loading", () => {
    vi.mocked(useLead).mockReturnValue({ data: undefined, isLoading: true, error: null } as unknown as ReturnType<
      typeof useLead
    >);

    const { container } = render(<LeadDetailView leadId="lead-1" />);

    expect(container.querySelector('[aria-hidden="true"]')).toBeInTheDocument();
  });

  it("renders qualification, origin and products of interest", () => {
    vi.mocked(useLead).mockReturnValue({
      data: baseLead,
      isLoading: false,
      error: null,
    } as unknown as ReturnType<typeof useLead>);

    render(<LeadDetailView leadId="lead-1" />);

    expect(screen.getByText("Cliente Existente")).toBeInTheDocument();
    expect(screen.getByText(/11999999999/)).toBeInTheDocument();
    expect(screen.getByText(/Telegram/)).toBeInTheDocument();
    expect(screen.getByText("Site institucional")).toBeInTheDocument();
    expect(screen.getByText("Alta")).toBeInTheDocument();
  });

  it("shows a permission message when the query fails with 403", () => {
    vi.mocked(useLead).mockReturnValue({
      data: undefined,
      isLoading: false,
      error: new ApiError(403, "forbidden"),
    } as unknown as ReturnType<typeof useLead>);

    render(<LeadDetailView leadId="lead-1" />);

    expect(screen.getByText("Você não tem permissão para ver esta página")).toBeInTheDocument();
  });
});
