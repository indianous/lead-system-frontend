import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { LoginForm } from "./LoginForm";

vi.mock("next-auth/react", () => ({
  signIn: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  useRouter: vi.fn(),
}));

const push = vi.fn();

beforeEach(() => {
  vi.mocked(useRouter).mockReturnValue({ push } as unknown as ReturnType<typeof useRouter>);
  vi.mocked(signIn).mockReset();
  push.mockReset();
});

function renderForm() {
  return render(<LoginForm />);
}

describe("LoginForm", () => {
  it("renders the email/password fields and the submit button", () => {
    renderForm();

    expect(screen.getByLabelText(/e-mail/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/senha/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /entrar/i })).toBeInTheDocument();
  });

  it("shows validation errors on empty submit and does not call signIn", async () => {
    const user = userEvent.setup();
    renderForm();

    await user.click(screen.getByRole("button", { name: /entrar/i }));

    expect(await screen.findByText("Informe o e-mail")).toBeInTheDocument();
    expect(screen.getByText("Informe a senha")).toBeInTheDocument();
    expect(signIn).not.toHaveBeenCalled();
  });

  it("shows a validation error for an invalid e-mail and does not call signIn", async () => {
    const user = userEvent.setup();
    renderForm();

    await user.type(screen.getByLabelText(/e-mail/i), "not-an-email");
    await user.type(screen.getByLabelText(/senha/i), "somepassword1");
    await user.click(screen.getByRole("button", { name: /entrar/i }));

    expect(await screen.findByText("E-mail inválido")).toBeInTheDocument();
    expect(signIn).not.toHaveBeenCalled();
  });

  it("calls signIn with the typed credentials on valid submit", async () => {
    vi.mocked(signIn).mockResolvedValue({ error: undefined, ok: true } as never);
    const user = userEvent.setup();
    renderForm();

    await user.type(screen.getByLabelText(/e-mail/i), "ana@empresa.com");
    await user.type(screen.getByLabelText(/senha/i), "somepassword1");
    await user.click(screen.getByRole("button", { name: /entrar/i }));

    await waitFor(() =>
      expect(signIn).toHaveBeenCalledWith("credentials", {
        email: "ana@empresa.com",
        password: "somepassword1",
        redirect: false,
      }),
    );
  });

  it("shows an error message when signIn rejects the credentials", async () => {
    vi.mocked(signIn).mockResolvedValue({ error: "CredentialsSignin", ok: false } as never);
    const user = userEvent.setup();
    renderForm();

    await user.type(screen.getByLabelText(/e-mail/i), "ana@empresa.com");
    await user.type(screen.getByLabelText(/senha/i), "wrong-password");
    await user.click(screen.getByRole("button", { name: /entrar/i }));

    expect(await screen.findByText("E-mail ou senha inválidos")).toBeInTheDocument();
    expect(push).not.toHaveBeenCalled();
  });

  it("redirects to / when signIn succeeds", async () => {
    vi.mocked(signIn).mockResolvedValue({ error: undefined, ok: true } as never);
    const user = userEvent.setup();
    renderForm();

    await user.type(screen.getByLabelText(/e-mail/i), "ana@empresa.com");
    await user.type(screen.getByLabelText(/senha/i), "somepassword1");
    await user.click(screen.getByRole("button", { name: /entrar/i }));

    await waitFor(() => expect(push).toHaveBeenCalledWith("/"));
  });
});
