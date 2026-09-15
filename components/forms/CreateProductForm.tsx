"use client";

import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button, FormField, Input, Select, Text, Textarea } from "base-ds";
import { ApiError } from "@/lib/api-client";
import { reaisInputToCents } from "@/lib/money";
import { useCreateProduct } from "@/lib/queries/products";
import type { ProductType } from "@/types/api";

const PRODUCT_TYPE_OPTIONS = [
  { value: "READY_MADE", label: "Pronto" },
  { value: "CUSTOM", label: "Personalizado" },
];

const createProductSchema = z
  .object({
    name: z.string().min(1, "Informe o nome"),
    type: z.string().min(1, "Selecione o tipo"),
    description: z.string().optional(),
    minPrice: z.string().optional(),
    maxPrice: z.string().optional(),
  })
  .refine(
    (values) => {
      const min = reaisInputToCents(values.minPrice);
      const max = reaisInputToCents(values.maxPrice);
      return min === null || max === null || min <= max;
    },
    { message: "O preço mínimo não pode ser maior que o máximo", path: ["maxPrice"] },
  );

type CreateProductFormValues = z.infer<typeof createProductSchema>;

export function CreateProductForm() {
  const router = useRouter();
  const createProduct = useCreateProduct();
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<CreateProductFormValues>({ resolver: zodResolver(createProductSchema) });

  async function onSubmit(values: CreateProductFormValues) {
    try {
      await createProduct.mutateAsync({
        name: values.name,
        type: values.type as ProductType,
        description: values.description || null,
        minPriceCents: reaisInputToCents(values.minPrice),
        maxPriceCents: reaisInputToCents(values.maxPrice),
      });
      router.push("/products");
    } catch {
      // erro exibido abaixo via createProduct.error
    }
  }

  const submitError =
    createProduct.error instanceof ApiError && createProduct.error.status === 403
      ? "Você não tem permissão para cadastrar produtos"
      : createProduct.error
        ? "Não foi possível criar o produto"
        : null;

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-4">
      <FormField label="Nome" id="name" required error={errors.name?.message}>
        <Input id="name" state={errors.name ? "error" : "default"} {...register("name")} />
      </FormField>

      <FormField label="Tipo" id="type" required error={errors.type?.message}>
        <Select
          id="type"
          placeholder="Selecione o tipo"
          options={PRODUCT_TYPE_OPTIONS}
          state={errors.type ? "error" : "default"}
          {...register("type")}
        />
      </FormField>

      <FormField label="Descrição" id="description" error={errors.description?.message}>
        <Textarea id="description" state={errors.description ? "error" : "default"} {...register("description")} />
      </FormField>

      <FormField label="Preço mínimo (R$)" id="minPrice" error={errors.minPrice?.message}>
        <Input
          id="minPrice"
          type="number"
          step="0.01"
          min="0"
          state={errors.minPrice ? "error" : "default"}
          {...register("minPrice")}
        />
      </FormField>

      <FormField label="Preço máximo (R$)" id="maxPrice" error={errors.maxPrice?.message}>
        <Input
          id="maxPrice"
          type="number"
          step="0.01"
          min="0"
          state={errors.maxPrice ? "error" : "default"}
          {...register("maxPrice")}
        />
      </FormField>

      {submitError && (
        <Text color="destructive" role="alert">
          {submitError}
        </Text>
      )}

      <Button type="submit" isLoading={isSubmitting}>
        Criar produto
      </Button>
    </form>
  );
}
