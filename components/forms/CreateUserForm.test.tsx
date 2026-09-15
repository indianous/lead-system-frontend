import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useRouter } from "next/navigation";
import { CreateUserForm } from "./CreateUserForm";
import { useRoles } from "@/lib/queries/roles";
import { useCreateUser } from "@/lib/queries/users";
import { ApiError } from "@/lib/api-client";

vi.mock("next/navigation", () => ({
  useRouter: vi.fn(),
}));

vi.mock("@/lib/queries/roles", () => ({
  useRoles: vi.fn(),
}));

vi.mock("@/lib/queries/users", () => ({
  useCreateUser: vi.fn(),
}));

const push = vi.fn();
const mutateAsync = vi.fn();

function mockUseCreateUser(error: unknown = null) {
  vi.mocked(useCreateUser).mockReturnValue({
    mutateAsync,
    error,
  } as unknown as ReturnType<typeof useCreateUser>);
}

beforeEach(() => {
  vi.mocked(useRouter).mockReturnValue({ push } as unknown as ReturnType<typeof useRouter>);
  vi.mocked(useRoles).mockReturnValue({
    data: [
      { id: "role-1", name: "Salesperson", description: "", permissions: [] },
      { id: "role-2", name: "Manager/Administrator", description: "", permissions: [] },
    ],
  } as unknown as ReturnType<typeof useRoles>);
  mockUseCreateUser();
  push.mockReset();
  mutateAsync.mockReset();
});

function renderForm() {
  return render(<CreateUserForm />);
}

describe("CreateUserForm", () => {
  it("renders name/email/password/role fields and the submit button", () => {
    renderForm();

    expect(screen.getByLabelText(/nome/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/e-mail/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/senha/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/papel/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /criar usuário/i })).toBeInTheDocument();
  });

  it("shows validation errors on empty submit and does not call the mutation", async () => {
    const user = userEvent.setup();
    renderForm();

    await user.click(screen.getByRole("button", { name: /criar usuário/i }));

    expect(await screen.findByText("Informe o nome")).toBeInTheDocument();
    expect(screen.getByText("Informe o e-mail")).toBeInTheDocument();
    expect(screen.getByText("A senha deve ter pelo menos 8 caracteres")).toBeInTheDocument();
    expect(document.getElementById("roleId-error")).toHaveTextContent("Selecione um papel");
    expect(mutateAsync).not.toHaveBeenCalled();
  });

  it("calls the create mutation with the typed payload and redirects to /users on success", async () => {
    mutateAsync.mockResolvedValue({});
    const user = userEvent.setup();
    renderForm();

    await user.type(screen.getByLabelText(/nome/i), "Novo Vendedor");
    await user.type(screen.getByLabelText(/e-mail/i), "novo@empresa.com");
    await user.type(screen.getByLabelText(/senha/i), "somepassword1");
    await user.selectOptions(screen.getByLabelText(/papel/i), "role-1");
    await user.click(screen.getByRole("button", { name: /criar usuário/i }));

    await waitFor(() =>
      expect(mutateAsync).toHaveBeenCalledWith({
        name: "Novo Vendedor",
        email: "novo@empresa.com",
        password: "somepassword1",
        roleId: "role-1",
      }),
    );
    await waitFor(() => expect(push).toHaveBeenCalledWith("/users"));
  });

  it("shows a duplicate e-mail error (409) coming from the API", async () => {
    mutateAsync.mockRejectedValue(new ApiError(409, "Já existe um usuário com esse e-mail"));
    mockUseCreateUser(new ApiError(409, "Já existe um usuário com esse e-mail"));
    const user = userEvent.setup();
    renderForm();

    await user.type(screen.getByLabelText(/nome/i), "Novo Vendedor");
    await user.type(screen.getByLabelText(/e-mail/i), "duplicado@empresa.com");
    await user.type(screen.getByLabelText(/senha/i), "somepassword1");
    await user.selectOptions(screen.getByLabelText(/papel/i), "role-1");
    await user.click(screen.getByRole("button", { name: /criar usuário/i }));

    expect(await screen.findByText("Já existe um usuário com esse e-mail")).toBeInTheDocument();
    expect(push).not.toHaveBeenCalled();
  });
});
