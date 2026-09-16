"use client";

import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button, FormField, Input, MultiSelect, Select, Textarea, useToast } from "base-ds";
import { reaisInputToCents } from "@/lib/money";
import { useCreateLead } from "@/lib/queries/leads";
import { useProducts } from "@/lib/queries/products";
import { useUsers } from "@/lib/queries/users";
import type { Channel } from "@/types/api";

// /leads/new é só para contato direto via Meta/Telegram (04-rotas-e-telas.md) — leads do site
// entram por POST /api/public/leads e busca local por /prospecting/manual-entry (fora de escopo).
const CHANNEL_OPTIONS = [
  { value: "META_WHATSAPP", label: "WhatsApp (Meta)" },
  { value: "META_INSTAGRAM", label: "Instagram (Meta)" },
  { value: "META_MESSENGER", label: "Messenger (Meta)" },
  { value: "TELEGRAM", label: "Telegram" },
];

const createLeadSchema = z.object({
  name: z.string().min(1, "Informe o nome"),
  channel: z.string().min(1, "Selecione o canal"),
  phone: z.string().optional(),
  email: z.union([z.literal(""), z.string().email("E-mail inválido")]).optional(),
  initialMessage: z.string().optional(),
  estimatedBudget: z.string().optional(),
  desiredTimeline: z.string().optional(),
  assignedUserId: z.string().min(1, "Selecione um responsável"),
  productIds: z.array(z.string()).optional(),
});

type CreateLeadFormValues = z.infer<typeof createLeadSchema>;

export function CreateLeadForm() {
  const router = useRouter();
  const { toast } = useToast();
  const { data: users } = useUsers();
  const { data: products } = useProducts();
  const createLead = useCreateLead();

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<CreateLeadFormValues>({
    resolver: zodResolver(createLeadSchema),
    defaultValues: { productIds: [] },
  });

  const userOptions = (users ?? []).map((user) => ({ value: user.id, label: user.name }));
  const productOptions = (products ?? []).map((product) => ({ value: product.id, label: product.name }));
  const selectedProductIds = watch("productIds") ?? [];

  async function onSubmit(values: CreateLeadFormValues) {
    try {
      await createLead.mutateAsync({
        name: values.name,
        leadType: "DIRECT_CONTACT",
        phone: values.phone || null,
        email: values.email || null,
        initialMessage: values.initialMessage || null,
        estimatedBudgetCents: reaisInputToCents(values.estimatedBudget),
        desiredTimeline: values.desiredTimeline || null,
        qualificationScore: null,
        assignedUserId: values.assignedUserId,
        productIds: values.productIds ?? [],
        channel: values.channel as Channel,
        searchSource: null,
        region: null,
        searchSegment: null,
      });
      toast({ variant: "success", title: "Lead cadastrado com sucesso" });
      router.push("/leads");
    } catch {
      toast({ variant: "destructive", title: "Não foi possível cadastrar o lead" });
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-4">
      <FormField label="Nome" id="name" required error={errors.name?.message}>
        <Input id="name" state={errors.name ? "error" : "default"} {...register("name")} />
      </FormField>

      <FormField label="Canal" id="channel" required error={errors.channel?.message}>
        <Select
          id="channel"
          placeholder="Selecione o canal"
          options={CHANNEL_OPTIONS}
          state={errors.channel ? "error" : "default"}
          {...register("channel")}
        />
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

      <FormField label="Responsável" id="assignedUserId" required error={errors.assignedUserId?.message}>
        <Select
          id="assignedUserId"
          placeholder="Selecione um responsável"
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
        Cadastrar lead
      </Button>
    </form>
  );
}
