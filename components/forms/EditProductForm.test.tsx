import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useRouter } from "next/navigation";
import { EditProductForm } from "./EditProductForm";
import { useProduct, useUpdateProduct } from "@/lib/queries/products";

vi.mock("next/navigation", () => ({
  useRouter: vi.fn(),
}));

vi.mock("@/lib/queries/products", () => ({
  useProduct: vi.fn(),
  useUpdateProduct: vi.fn(),
}));

const push = vi.fn();
const mutateAsync = vi.fn();

beforeEach(() => {
  vi.mocked(useRouter).mockReturnValue({ push } as unknown as ReturnType<typeof useRouter>);
  vi.mocked(useProduct).mockReturnValue({
    data: {
      id: "product-1",
      name: "Site institucional",
      type: "READY_MADE",
      description: "Site pronto",
      minPriceCents: 50000,
      maxPriceCents: 150000,
      active: true,
      createdAt: "2026-01-01T00:00:00Z",
    },
    isLoading: false,
  } as unknown as ReturnType<typeof useProduct>);
  vi.mocked(useUpdateProduct).mockReturnValue({
    mutateAsync,
    isError: false,
  } as unknown as ReturnType<typeof useUpdateProduct>);
  push.mockReset();
  mutateAsync.mockReset();
});

function renderForm() {
  return render(<EditProductForm productId="product-1" />);
}

describe("EditProductForm", () => {
  it("shows a skeleton while the product is loading", () => {
    vi.mocked(useProduct).mockReturnValue({ data: undefined, isLoading: true } as unknown as ReturnType<
      typeof useProduct
    >);
    const { container } = renderForm();

    expect(container.querySelector('[aria-hidden="true"]')).toBeInTheDocument();
    expect(screen.queryByLabelText(/nome/i)).not.toBeInTheDocument();
  });

  it("loads the current product's data into the form, prices converted to reais", async () => {
    renderForm();

    expect(await screen.findByDisplayValue("Site institucional")).toBeInTheDocument();
    expect(screen.getByLabelText(/^tipo/i)).toHaveValue("READY_MADE");
    expect(screen.getByLabelText(/preço mínimo/i)).toHaveValue(500);
    expect(screen.getByLabelText(/preço máximo/i)).toHaveValue(1500);
    expect(screen.getByRole("switch")).toHaveAttribute("aria-checked", "true");
  });

  it("toggles active and calls the update mutation with cents payload", async () => {
    mutateAsync.mockResolvedValue({});
    const user = userEvent.setup();
    renderForm();

    await screen.findByDisplayValue("Site institucional");
    await user.click(screen.getByRole("switch"));
    await user.click(screen.getByRole("button", { name: /salvar alterações/i }));

    await waitFor(() =>
      expect(mutateAsync).toHaveBeenCalledWith({
        name: "Site institucional",
        type: "READY_MADE",
        description: "Site pronto",
        minPriceCents: 50000,
        maxPriceCents: 150000,
        active: false,
      }),
    );
  });

  it("redirects to /products on successful update", async () => {
    mutateAsync.mockResolvedValue({});
    const user = userEvent.setup();
    renderForm();

    await screen.findByDisplayValue("Site institucional");
    await user.click(screen.getByRole("button", { name: /salvar alterações/i }));

    await waitFor(() => expect(push).toHaveBeenCalledWith("/products"));
  });
});
