import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import ProductsPage from "./page";
import { useProducts } from "@/lib/queries/products";
import { ApiError } from "@/lib/api-client";

vi.mock("@/lib/queries/products", () => ({
  useProducts: vi.fn(),
}));

beforeEach(() => {
  vi.mocked(useProducts).mockReset();
});

describe("ProductsPage", () => {
  it("shows a skeleton while loading", () => {
    vi.mocked(useProducts).mockReturnValue({
      data: undefined,
      isLoading: true,
      error: null,
    } as unknown as ReturnType<typeof useProducts>);

    const { container } = render(<ProductsPage />);

    expect(container.querySelector('[aria-hidden="true"]')).toBeInTheDocument();
  });

  it("renders the table with the returned products, type label, formatted price range and status", () => {
    vi.mocked(useProducts).mockReturnValue({
      data: [
        {
          id: "1",
          name: "Site institucional",
          type: "READY_MADE",
          description: "desc",
          minPriceCents: 50000,
          maxPriceCents: 150000,
          active: true,
          createdAt: "",
        },
        {
          id: "2",
          name: "Sistema sob medida",
          type: "CUSTOM",
          description: null,
          minPriceCents: null,
          maxPriceCents: null,
          active: false,
          createdAt: "",
        },
      ],
      isLoading: false,
      error: null,
    } as unknown as ReturnType<typeof useProducts>);

    render(<ProductsPage />);

    expect(screen.getByText("Site institucional")).toBeInTheDocument();
    expect(screen.getByText("Pronto")).toBeInTheDocument();
    expect(screen.getByText(/R\$\s*500,00.*R\$\s*1\.500,00/)).toBeInTheDocument();
    expect(screen.getByText("Sistema sob medida")).toBeInTheDocument();
    expect(screen.getByText("Personalizado")).toBeInTheDocument();
    expect(screen.getByText("A combinar")).toBeInTheDocument();
    expect(screen.getByText("Ativo")).toBeInTheDocument();
    expect(screen.getByText("Inativo")).toBeInTheDocument();
  });

  it("shows a permission message when the query fails with 403", () => {
    vi.mocked(useProducts).mockReturnValue({
      data: undefined,
      isLoading: false,
      error: new ApiError(403, "forbidden"),
    } as unknown as ReturnType<typeof useProducts>);

    render(<ProductsPage />);

    expect(screen.getByText("Você não tem permissão para ver esta página")).toBeInTheDocument();
  });
});
