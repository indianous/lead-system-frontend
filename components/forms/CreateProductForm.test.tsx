import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useRouter } from "next/navigation";
import { CreateProductForm } from "./CreateProductForm";
import { useCreateProduct } from "@/lib/queries/products";
import { ApiError } from "@/lib/api-client";

vi.mock("next/navigation", () => ({
  useRouter: vi.fn(),
}));

vi.mock("@/lib/queries/products", () => ({
  useCreateProduct: vi.fn(),
}));

const push = vi.fn();
const mutateAsync = vi.fn();

function mockUseCreateProduct(error: unknown = null) {
  vi.mocked(useCreateProduct).mockReturnValue({
    mutateAsync,
    error,
  } as unknown as ReturnType<typeof useCreateProduct>);
}

beforeEach(() => {
  vi.mocked(useRouter).mockReturnValue({ push } as unknown as ReturnType<typeof useRouter>);
  mockUseCreateProduct();
  push.mockReset();
  mutateAsync.mockReset();
});

function renderForm() {
  return render(<CreateProductForm />);
}

describe("CreateProductForm", () => {
  it("renders name/type/description/price fields and the submit button", () => {
    renderForm();

    expect(screen.getByLabelText(/nome/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^tipo/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/descrição/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/preço mínimo/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/preço máximo/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /criar produto/i })).toBeInTheDocument();
  });

  it("shows validation errors on empty submit and does not call the mutation", async () => {
    const user = userEvent.setup();
    renderForm();

    await user.click(screen.getByRole("button", { name: /criar produto/i }));

    expect(await screen.findByText("Informe o nome")).toBeInTheDocument();
    expect(document.getElementById("type-error")).toHaveTextContent("Selecione o tipo");
    expect(mutateAsync).not.toHaveBeenCalled();
  });

  it("shows an error when minPrice is greater than maxPrice", async () => {
    const user = userEvent.setup();
    renderForm();

    await user.type(screen.getByLabelText(/nome/i), "Produto X");
    await user.selectOptions(screen.getByLabelText(/^tipo/i), "READY_MADE");
    await user.type(screen.getByLabelText(/preço mínimo/i), "1000");
    await user.type(screen.getByLabelText(/preço máximo/i), "500");
    await user.click(screen.getByRole("button", { name: /criar produto/i }));

    expect(await screen.findByText("O preço mínimo não pode ser maior que o máximo")).toBeInTheDocument();
    expect(mutateAsync).not.toHaveBeenCalled();
  });

  it("converts reais to cents and calls the create mutation, redirecting to /products on success", async () => {
    mutateAsync.mockResolvedValue({});
    const user = userEvent.setup();
    renderForm();

    await user.type(screen.getByLabelText(/nome/i), "Site institucional");
    await user.selectOptions(screen.getByLabelText(/^tipo/i), "READY_MADE");
    await user.type(screen.getByLabelText(/descrição/i), "Site pronto");
    await user.type(screen.getByLabelText(/preço mínimo/i), "500");
    await user.type(screen.getByLabelText(/preço máximo/i), "1500");
    await user.click(screen.getByRole("button", { name: /criar produto/i }));

    await waitFor(() =>
      expect(mutateAsync).toHaveBeenCalledWith({
        name: "Site institucional",
        type: "READY_MADE",
        description: "Site pronto",
        minPriceCents: 50000,
        maxPriceCents: 150000,
      }),
    );
    await waitFor(() => expect(push).toHaveBeenCalledWith("/products"));
  });

  it("shows a permission error (403) coming from the API", async () => {
    mutateAsync.mockRejectedValue(new ApiError(403, "forbidden"));
    mockUseCreateProduct(new ApiError(403, "forbidden"));
    const user = userEvent.setup();
    renderForm();

    await user.type(screen.getByLabelText(/nome/i), "Produto X");
    await user.selectOptions(screen.getByLabelText(/^tipo/i), "CUSTOM");
    await user.click(screen.getByRole("button", { name: /criar produto/i }));

    expect(await screen.findByText("Você não tem permissão para cadastrar produtos")).toBeInTheDocument();
    expect(push).not.toHaveBeenCalled();
  });
});
