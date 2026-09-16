"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button, FormField, Input, MultiSelect, Select, Skeleton, Textarea, useToast } from "base-ds";
import { centsToReaisInput, reaisInputToCents } from "@/lib/money";
import { useLead, useUpdateLead } from "@/lib/queries/leads";
import { useProducts } from "@/lib/queries/products";
import { useUsers } from "@/lib/queries/users";
import type { QualificationScore } from "@/types/api";

const QUALIFICATION_SCORE_OPTIONS = [
  { value: "", label: "Nenhuma" },
  { value: "HIGH", label: "Alta" },
  { value: "MEDIUM", label: "Média" },
  { value: "LOW", label: "Baixa" },
];

const editLeadSchema = z.object({
  name: z.string().min(1, "Informe o nome"),
  phone: z.string().optional(),
  email: z.union([z.literal(""), z.string().email("E-mail inválido")]).optional(),
  initialMessage: z.string().optional(),
  estimatedBudget: z.string().optional(),
  desiredTimeline: z.string().optional(),
  qualificationScore: z.string().optional(),
  assignedUserId: z.string().min(1, "Selecione um responsável"),
  productIds: z.array(z.string()).optional(),
});

type EditLeadFormValues = z.infer<typeof editLeadSchema>;

export function EditLeadForm({ leadId }: { leadId: string }) {
  const router = useRouter();
  const { toast } = useToast();
  const { data: lead, isLoading } = useLead(leadId);
  const { data: users } = useUsers();
  const { data: products } = useProducts();
  const updateLead = useUpdateLead(leadId);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<EditLeadFormValues>({
    resolver: zodResolver(editLeadSchema),
    defaultValues: { productIds: [] },
  });

  useEffect(() => {
    if (!lead) {
      return;
    }
    reset({
      name: lead.name,
      phone: lead.phone ?? "",
      email: lead.email ?? "",
      initialMessage: lead.initialMessage ?? "",
      estimatedBudget: centsToReaisInput(lead.estimatedBudgetCents),
      desiredTimeline: lead.desiredTimeline ?? "",
      qualificationScore: lead.qualificationScore ?? "",
      assignedUserId: lead.assignedUserId,
      productIds: lead.productsOfInterest.map((product) => product.id),
    });
  }, [lead, reset]);

  const userOptions = (users ?? []).map((user) => ({ value: user.id, label: user.name }));
  const productOptions = (products ?? []).map((product) => ({ value: product.id, label: product.name }));
  const selectedProductIds = watch("productIds") ?? [];

  async function onSubmit(values: EditLeadFormValues) {
    try {
      await updateLead.mutateAsync({
        name: values.name,
        phone: values.phone || null,
        email: values.email || null,
        initialMessage: values.initialMessage || null,
        estimatedBudgetCents: reaisInputToCents(values.estimatedBudget),
        desiredTimeline: values.desiredTimeline || null,
        qualificationScore: (values.qualificationScore || null) as QualificationScore | null,
        assignedUserId: values.assignedUserId,
        productIds: values.productIds ?? [],
      });
      toast({ variant: "success", title: "Lead atualizado com sucesso" });
      router.push(`/leads/${leadId}`);
    } catch {
      toast({ variant: "destructive", title: "Não foi possível atualizar o lead" });
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

      <FormField label="Telefone" id="phone" error={errors.phone?.message}>
        <Input id="phone" state={errors.phone ? "error" : "default"} {...register("phone")} />
      </FormField>

      <FormField label="E-mail" id="email" error={errors.email?.message}>
        <Input id="email" type="email" state={errors.email ? "error" : "default"} {...register("email")} />
      </FormField>

      <FormField label="Mensagem inicial" id="initialMessage" error={errors.initialMessage?.message}>
        <Textarea id="initialMessage" state={errors.initialMessage ? "error" : "default"} {...register("initialMessage")} />
      </FormField>

      <FormField label="Orçamento estimado (R$)" id="estimatedBudget" error={errors.estimatedBudget?.message}>
        <Input
          id="estimatedBudget"
          type="number"
          step="0.01"
          min="0"
          state={errors.estimatedBudget ? "error" : "default"}
          {...register("estimatedBudget")}
        />
      </FormField>

      <FormField label="Prazo desejado" id="desiredTimeline" error={errors.desiredTimeline?.message}>
        <Input id="desiredTimeline" state={errors.desiredTimeline ? "error" : "default"} {...register("desiredTimeline")} />
      </FormField>

      <FormField label="Qualificação" id="qualificationScore" error={errors.qualificationScore?.message}>
        <Select
          id="qualificationScore"
          options={QUALIFICATION_SCORE_OPTIONS}
          state={errors.qualificationScore ? "error" : "default"}
          {...register("qualificationScore")}
        />
      </FormField>

      <FormField label="Responsável" id="assignedUserId" required error={errors.assignedUserId?.message}>
        <Select
          id="assignedUserId"
          options={userOptions}
          state={errors.assignedUserId ? "error" : "default"}
          {...register("assignedUserId")}
        />
      </FormField>

      <FormField label="Produtos de interesse" id="productIds" error={errors.productIds?.message}>
        <MultiSelect
          id="productIds"
          options={productOptions}
          value={selectedProductIds}
          onChange={(next) => setValue("productIds", next)}
          placeholder="Selecione os produtos"
        />
      </FormField>

      <Button type="submit" isLoading={isSubmitting}>
        Salvar alterações
      </Button>
    </form>
  );
}
