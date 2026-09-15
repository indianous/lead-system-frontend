"use client";

import Link from "next/link";
import { Badge, Button, Heading, Skeleton, Table, Text } from "base-ds";
import type { TableColumn } from "base-ds";
import { ApiError } from "@/lib/api-client";
import { useProducts } from "@/lib/queries/products";
import type { ProductResponse } from "@/types/api";

const TYPE_LABELS: Record<ProductResponse["type"], string> = {
  READY_MADE: "Pronto",
  CUSTOM: "Personalizado",
};

const currencyFormatter = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

function formatPriceRange(minCents: number | null, maxCents: number | null): string {
  if (minCents === null && maxCents === null) {
    return "A combinar";
  }
  if (minCents !== null && maxCents !== null) {
    return `${currencyFormatter.format(minCents / 100)} – ${currencyFormatter.format(maxCents / 100)}`;
  }
  return currencyFormatter.format((minCents ?? maxCents ?? 0) / 100);
}

const columns: TableColumn<ProductResponse>[] = [
  { key: "name", header: "Nome" },
  { key: "type", header: "Tipo", render: (row) => TYPE_LABELS[row.type] },
  {
    key: "price",
    header: "Faixa de preço",
    render: (row) => formatPriceRange(row.minPriceCents, row.maxPriceCents),
  },
  {
    key: "active",
    header: "Status",
    render: (row) => (
      <Badge variant={row.active ? "success" : "default"}>{row.active ? "Ativo" : "Inativo"}</Badge>
    ),
  },
  {
    key: "id",
    header: "Ações",
    render: (row) => (
      <Link href={`/products/${row.id}/edit`} className="text-sm text-primary">
        Editar
      </Link>
    ),
  },
];

export default function ProductsPage() {
  const { data: products, isLoading, error } = useProducts();
  const isForbidden = error instanceof ApiError && error.status === 403;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <Heading as="h1" size="xl">
          Produtos
        </Heading>
        <Button asChild>
          <Link href="/products/new">Novo produto</Link>
        </Button>
      </div>

      {isLoading && <Skeleton height={200} />}

      {isForbidden && (
        <Text color="destructive" role="alert">
          Você não tem permissão para ver esta página
        </Text>
      )}

      {products && <Table columns={columns} data={products} caption="Lista de produtos" />}
    </div>
  );
}
