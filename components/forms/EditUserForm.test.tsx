import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useRouter } from "next/navigation";
import { EditUserForm } from "./EditUserForm";
import { useRoles } from "@/lib/queries/roles";
import { useUpdateUser, useUser } from "@/lib/queries/users";

vi.mock("next/navigation", () => ({
  useRouter: vi.fn(),
}));

vi.mock("@/lib/queries/roles", () => ({
  useRoles: vi.fn(),
}));

vi.mock("@/lib/queries/users", () => ({
  useUser: vi.fn(),
  useUpdateUser: vi.fn(),
}));

const push = vi.fn();
const mutateAsync = vi.fn();

beforeEach(() => {
  vi.mocked(useRouter).mockReturnValue({ push } as unknown as ReturnType<typeof useRouter>);
  vi.mocked(useRoles).mockReturnValue({
    data: [
      { id: "role-1", name: "Salesperson", description: "", permissions: [] },
      { id: "role-2", name: "Manager/Administrator", description: "", permissions: [] },
    ],
  } as unknown as ReturnType<typeof useRoles>);
  vi.mocked(useUser).mockReturnValue({
    data: {
      id: "user-1",
      name: "Ana Vendedora",
      email: "ana@empresa.com",
      roleName: "Salesperson",
      active: true,
      createdAt: "2026-01-01T00:00:00Z",
    },
    isLoading: false,
  } as unknown as ReturnType<typeof useUser>);
  vi.mocked(useUpdateUser).mockReturnValue({
    mutateAsync,
    isError: false,
  } as unknown as ReturnType<typeof useUpdateUser>);
  push.mockReset();
  mutateAsync.mockReset();
});

function renderForm() {
  return render(<EditUserForm userId="user-1" />);
}

describe("EditUserForm", () => {
  it("shows a skeleton while the user is loading", () => {
    vi.mocked(useUser).mockReturnValue({ data: undefined, isLoading: true } as unknown as ReturnType<
      typeof useUser
    >);
    const { container } = renderForm();

    expect(container.querySelector('[aria-hidden="true"]')).toBeInTheDocument();
    expect(screen.queryByLabelText(/nome/i)).not.toBeInTheDocument();
  });

  it("loads the current user's data into the form", async () => {
    renderForm();

    expect(await screen.findByDisplayValue("Ana Vendedora")).toBeInTheDocument();
    expect(screen.getByLabelText(/papel/i)).toHaveValue("role-1");
    expect(screen.getByRole("switch")).toHaveAttribute("aria-checked", "true");
  });

  it("changes the role and toggles active, then calls the update mutation with the right payload", async () => {
    mutateAsync.mockResolvedValue({});
    const user = userEvent.setup();
    renderForm();

    await screen.findByDisplayValue("Ana Vendedora");
    await user.selectOptions(screen.getByLabelText(/papel/i), "role-2");
    await user.click(screen.getByRole("switch"));
    await user.click(screen.getByRole("button", { name: /salvar alterações/i }));

    await waitFor(() =>
      expect(mutateAsync).toHaveBeenCalledWith({
        name: "Ana Vendedora",
        roleId: "role-2",
        active: false,
      }),
    );
  });

  it("redirects to /users on successful update", async () => {
    mutateAsync.mockResolvedValue({});
    const user = userEvent.setup();
    renderForm();

    await screen.findByDisplayValue("Ana Vendedora");
    await user.click(screen.getByRole("button", { name: /salvar alterações/i }));

    await waitFor(() => expect(push).toHaveBeenCalledWith("/users"));
  });
});
