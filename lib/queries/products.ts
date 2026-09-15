"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import { ApiError, apiFetch } from "@/lib/api-client";
import type { CreateProductRequest, ProductResponse, UpdateProductRequest } from "@/types/api";

export function useProducts() {
  const { data: session } = useSession();
  const token = session?.accessToken;

  return useQuery({
    queryKey: ["products"],
    queryFn: () => apiFetch<ProductResponse[]>("/api/products", { token }),
    enabled: Boolean(token),
  });
}

// O backend não expõe GET /api/products/{id} (só a listagem) — deriva o produto a partir dela.
export function useProduct(id: string) {
  const { data: session } = useSession();
  const token = session?.accessToken;

  return useQuery({
    queryKey: ["products", id],
    queryFn: async () => {
      const products = await apiFetch<ProductResponse[]>("/api/products", { token });
      const product = products.find((candidate) => candidate.id === id);
      if (!product) {
        throw new ApiError(404, "Produto não encontrado");
      }
      return product;
    },
    enabled: Boolean(token) && Boolean(id),
  });
}

export function useCreateProduct() {
  const { data: session } = useSession();
  const token = session?.accessToken;
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (request: CreateProductRequest) =>
      apiFetch<ProductResponse>("/api/products", { method: "POST", body: request, token }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
    },
  });
}

export function useUpdateProduct(id: string) {
  const { data: session } = useSession();
  const token = session?.accessToken;
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (request: UpdateProductRequest) =>
      apiFetch<ProductResponse>(`/api/products/${id}`, { method: "PUT", body: request, token }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      queryClient.invalidateQueries({ queryKey: ["products", id] });
    },
  });
}
