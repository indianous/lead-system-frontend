import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import RolesPage from "./page";
import { useRoles } from "@/lib/queries/roles";
import { ApiError } from "@/lib/api-client";

vi.mock("@/lib/queries/roles", () => ({
  useRoles: vi.fn(),
}));

beforeEach(() => {
  vi.mocked(useRoles).mockReset();
});

describe("RolesPage", () => {
  it("shows a skeleton while loading", () => {
    vi.mocked(useRoles).mockReturnValue({
      data: undefined,
      isLoading: true,
      error: null,
    } as unknown as ReturnType<typeof useRoles>);

    const { container } = render(<RolesPage />);

    expect(container.querySelector('[aria-hidden="true"]')).toBeInTheDocument();
  });

  it("renders the roles returned by GET /api/roles with their permissions", () => {
    vi.mocked(useRoles).mockReturnValue({
      data: [
        {
          id: "role-1",
          name: "Salesperson",
          description: "Vendedor",
          permissions: ["VIEW_OWN_LEADS", "TRIGGER_PROSPECTING"],
        },
        {
          id: "role-2",
          name: "Manager/Administrator",
          description: "Gestor",
          permissions: ["CREATE_USER", "EDIT_CATALOG"],
        },
      ],
      isLoading: false,
      error: null,
    } as unknown as ReturnType<typeof useRoles>);

    render(<RolesPage />);

    expect(screen.getByText("Salesperson")).toBeInTheDocument();
    expect(screen.getByText("Manager/Administrator")).toBeInTheDocument();
    expect(screen.getByText("VIEW_OWN_LEADS")).toBeInTheDocument();
    expect(screen.getByText("TRIGGER_PROSPECTING")).toBeInTheDocument();
    expect(screen.getByText("CREATE_USER")).toBeInTheDocument();
    expect(screen.getByText("EDIT_CATALOG")).toBeInTheDocument();
  });

  it("shows a permission message when the query fails with 403", () => {
    vi.mocked(useRoles).mockReturnValue({
      data: undefined,
      isLoading: false,
      error: new ApiError(403, "forbidden"),
    } as unknown as ReturnType<typeof useRoles>);

    render(<RolesPage />);

    expect(screen.getByText("Você não tem permissão para ver esta página")).toBeInTheDocument();
  });
});
