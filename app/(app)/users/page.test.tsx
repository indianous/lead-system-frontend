import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import UsersPage from "./page";
import { useUsers } from "@/lib/queries/users";
import { ApiError } from "@/lib/api-client";

vi.mock("@/lib/queries/users", () => ({
  useUsers: vi.fn(),
}));

beforeEach(() => {
  vi.mocked(useUsers).mockReset();
});

describe("UsersPage", () => {
  it("shows a skeleton while loading", () => {
    vi.mocked(useUsers).mockReturnValue({
      data: undefined,
      isLoading: true,
      error: null,
    } as unknown as ReturnType<typeof useUsers>);

    const { container } = render(<UsersPage />);

    expect(container.querySelector('[aria-hidden="true"]')).toBeInTheDocument();
  });

  it("renders the table with the returned users", () => {
    vi.mocked(useUsers).mockReturnValue({
      data: [
        { id: "1", name: "Ana", email: "ana@empresa.com", roleName: "Salesperson", active: true, createdAt: "" },
        { id: "2", name: "Bruno", email: "bruno@empresa.com", roleName: "Manager/Administrator", active: false, createdAt: "" },
      ],
      isLoading: false,
      error: null,
    } as unknown as ReturnType<typeof useUsers>);

    render(<UsersPage />);

    expect(screen.getByText("Ana")).toBeInTheDocument();
    expect(screen.getByText("ana@empresa.com")).toBeInTheDocument();
    expect(screen.getByText("Bruno")).toBeInTheDocument();
    expect(screen.getByText("Ativo")).toBeInTheDocument();
    expect(screen.getByText("Inativo")).toBeInTheDocument();
  });

  it("shows a permission message when the query fails with 403", () => {
    vi.mocked(useUsers).mockReturnValue({
      data: undefined,
      isLoading: false,
      error: new ApiError(403, "forbidden"),
    } as unknown as ReturnType<typeof useUsers>);

    render(<UsersPage />);

    expect(screen.getByText("Você não tem permissão para ver esta página")).toBeInTheDocument();
  });
});
