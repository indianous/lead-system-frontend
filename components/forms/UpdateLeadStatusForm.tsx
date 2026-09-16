"use client";

import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button, FormField, Select, Skeleton, Text, Textarea, useToast } from "base-ds";
import { useLead, useUpdateLeadStatus } from "@/lib/queries/leads";
import type { FunnelStatus } from "@/types/api";

const FUNNEL_STATUS_OPTIONS = [
  { value: "NEW", label: "Novo" },
  { value: "CONTACTED", label: "Contatado" },
  { value: "PROPOSAL", label: "Proposta" },
  { value: "NEGOTIATION", label: "Negociação" },
  { value: "CLOSED", label: "Fechado" },
  { value: "LOST", label: "Perdido" },
];

const FUNNEL_STATUS_LABELS: Record<string, string> = Object.fromEntries(
  FUNNEL_STATUS_OPTIONS.map((option) => [option.value, option.label]),
);

const updateStatusSchema = z
  .object({
    newStatus: z.string().min(1, "Selecione a nova etapa"),
    reason: z.string().optional(),
  })
  .refine((values) => values.newStatus !== "LOST" || Boolean(values.reason?.trim()), {
    message: "Informe o motivo da perda",
    path: ["reason"],
  });

type UpdateLeadStatusFormValues = z.infer<typeof updateStatusSchema>;

export function UpdateLeadStatusForm({ leadId }: { leadId: string }) {
  const router = useRouter();
  const { toast } = useToast();
  const { data: lead, isLoading } = useLead(leadId);
  const updateLeadStatus = useUpdateLeadStatus();

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<UpdateLeadStatusFormValues>({
    resolver: zodResolver(updateStatusSchema),
    defaultValues: { newStatus: "", reason: "" },
  });

  const selectedStatus = watch("newStatus");

  async function onSubmit(values: UpdateLeadStatusFormValues) {
    try {
      await updateLeadStatus.mutateAsync({
        id: leadId,
        newStatus: values.newStatus as FunnelStatus,
        reason: values.reason || null,
      });
      toast({ variant: "success", title: "Etapa do lead atualizada" });
      router.push(`/leads/${leadId}`);
    } catch {
      toast({ variant: "destructive", title: "Não foi possível mudar a etapa do lead" });
    }
  }

  if (isLoading) {
    return <Skeleton height={150} />;
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-4">
      {lead && (
        <Text size="sm" color="muted">
          Etapa atual: {FUNNEL_STATUS_LABELS[lead.funnelStatus]}
        </Text>
      )}

      <FormField label="Nova etapa" id="newStatus" required error={errors.newStatus?.message}>
        <Select
          id="newStatus"
          placeholder="Selecione a nova etapa"
          options={FUNNEL_STATUS_OPTIONS}
          state={errors.newStatus ? "error" : "default"}
          {...register("newStatus")}
        />
      </FormField>

      {selectedStatus === "LOST" && (
        <FormField label="Motivo da perda" id="reason" required error={errors.reason?.message}>
          <Textarea id="reason" state={errors.reason ? "error" : "default"} {...register("reason")} />
        </FormField>
      )}

      <Button type="submit" isLoading={isSubmitting}>
        Confirmar
      </Button>
    </form>
  );
}
