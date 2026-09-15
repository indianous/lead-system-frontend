"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button, FormField, Input, Select, Skeleton, Switch, Text, Textarea } from "base-ds";
import { centsToReaisInput, reaisInputToCents } from "@/lib/money";
import { useProduct, useUpdateProduct } from "@/lib/queries/products";
import type { ProductType } from "@/types/api";

const PRODUCT_TYPE_OPTIONS = [
  { value: "READY_MADE", label: "Pronto" },
  { value: "CUSTOM", label: "Personalizado" },
];

const editProductSchema = z
  .object({
    name: z.string().min(1, "Informe o nome"),
    type: z.string().min(1, "Selecione o tipo"),
    description: z.string().optional(),
    minPrice: z.string().optional(),
    maxPrice: z.string().optional(),
    active: z.boolean(),
  })
  .refine(
    (values) => {
      const min = reaisInputToCents(values.minPrice);
      const max = reaisInputToCents(values.maxPrice);
      return min === null || max === null || min <= max;
    },
    { message: "O preço mínimo não pode ser maior que o máximo", path: ["maxPrice"] },
  );

type EditProductFormValues = z.infer<typeof editProductSchema>;

export function EditProductForm({ productId }: { productId: string }) {
  const router = useRouter();
  const { data: product, isLoading } = useProduct(productId);
  const updateProduct = useUpdateProduct(productId);

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<EditProductFormValues>({
    resolver: zodResolver(editProductSchema),
    defaultValues: { name: "", type: "", description: "", minPrice: "", maxPrice: "", active: true },
  });

  useEffect(() => {
    if (!product) {
      return;
    }
    reset({
      name: product.name,
      type: product.type,
      description: product.description ?? "",
      minPrice: centsToReaisInput(product.minPriceCents),
      maxPrice: centsToReaisInput(product.maxPriceCents),
      active: product.active,
    });
  }, [product, reset]);

  async function onSubmit(values: EditProductFormValues) {
    try {
      await updateProduct.mutateAsync({
        name: values.name,
        type: values.type as ProductType,
        description: values.description || null,
        minPriceCents: reaisInputToCents(values.minPrice),
        maxPriceCents: reaisInputToCents(values.maxPrice),
        active: values.active,
      });
      router.push("/products");
    } catch {
      // erro exibido abaixo via updateProduct.error
    }
  }

  if (isLoading) {
    return <Skeleton height={200} />;
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-4">
      <FormField label="Nome" id="name" required error={errors.name?.message}>
        <Input id="name" state={errors.name ? "error" : "default"} {...register("name")} />
      </FormField>

      <FormField label="Tipo" id="type" required error={errors.type?.message}>
        <Select
          id="type"
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

      <Controller
        control={control}
        name="active"
        render={({ field }) => (
          <Switch id="active" label="Ativo" checked={field.value} onChange={field.onChange} />
        )}
      />

      {updateProduct.isError && (
        <Text color="destructive" role="alert">
          Não foi possível atualizar o produto
        </Text>
      )}

      <Button type="submit" isLoading={isSubmitting}>
        Salvar alterações
      </Button>
    </form>
  );
}
