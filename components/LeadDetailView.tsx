"use client";

import Link from "next/link";
import { Badge, Button, Card, Heading, Skeleton, Text } from "base-ds";
import { ApiError } from "@/lib/api-client";
import { centsToReaisInput } from "@/lib/money";
import { useLead } from "@/lib/queries/leads";

const CHANNEL_LABELS: Record<string, string> = {
  META_WHATSAPP: "WhatsApp",
  META_INSTAGRAM: "Instagram",
  META_MESSENGER: "Messenger",
  TELEGRAM: "Telegram",
  WEBSITE: "Site",
};

const FUNNEL_STATUS_LABELS: Record<string, string> = {
  NEW: "Novo",
  CONTACTED: "Contatado",
  PROPOSAL: "Proposta",
  NEGOTIATION: "Negociação",
  CLOSED: "Fechado",
  LOST: "Perdido",
};

const QUALIFICATION_LABELS: Record<string, string> = {
  HIGH: "Alta",
  MEDIUM: "Média",
  LOW: "Baixa",
};

export function LeadDetailView({ leadId }: { leadId: string }) {
  const { data: lead, isLoading, error } = useLead(leadId);
  const isForbidden = error instanceof ApiError && error.status === 403;

  if (isLoading) {
    return <Skeleton height={300} />;
  }

  if (isForbidden) {
    return (
      <Text color="destructive" role="alert">
        Você não tem permissão para ver esta página
      </Text>
    );
  }

  if (!lead) {
    return null;
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <Heading as="h1" size="xl">
          {lead.name}
        </Heading>
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link href={`/leads/${lead.id}/status`}>Mudar etapa</Link>
          </Button>
          <Button asChild>
            <Link href={`/leads/${lead.id}/edit`}>Editar</Link>
          </Button>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <Badge variant="info">{FUNNEL_STATUS_LABELS[lead.funnelStatus]}</Badge>
        {lead.qualificationScore && <Badge variant="warning">{QUALIFICATION_LABELS[lead.qualificationScore]}</Badge>}
      </div>

      <Card header="Qualificação">
        <div className="flex flex-col gap-2">
          <Text size="sm">Telefone: {lead.phone ?? "—"}</Text>
          <Text size="sm">E-mail: {lead.email ?? "—"}</Text>
          <Text size="sm">Mensagem inicial: {lead.initialMessage ?? "—"}</Text>
          <Text size="sm">
            Orçamento estimado:{" "}
            {lead.estimatedBudgetCents !== null ? `R$ ${centsToReaisInput(lead.estimatedBudgetCents)}` : "—"}
          </Text>
          <Text size="sm">Prazo desejado: {lead.desiredTimeline ?? "—"}</Text>
          <Text size="sm">Responsável: {lead.assignedUserName}</Text>
          {lead.funnelStatus === "LOST" && <Text size="sm">Motivo da perda: {lead.lossReason ?? "—"}</Text>}
        </div>
      </Card>

      <Card header="Origem">
        <div className="flex flex-col gap-2">
          <Text size="sm">
            Tipo: {lead.leadType === "DIRECT_CONTACT" ? "Contato direto" : "Busca local"}
          </Text>
          {lead.origin.channel && <Text size="sm">Canal: {CHANNEL_LABELS[lead.origin.channel]}</Text>}
          {lead.origin.searchSource && <Text size="sm">Fonte: {lead.origin.searchSource}</Text>}
          {lead.origin.region && <Text size="sm">Região: {lead.origin.region}</Text>}
          {lead.origin.searchSegment && <Text size="sm">Segmento: {lead.origin.searchSegment}</Text>}
        </div>
      </Card>

      <Card header="Produtos de interesse">
        {lead.productsOfInterest.length === 0 ? (
          <Text size="sm" color="muted">
            Nenhum produto vinculado
          </Text>
        ) : (
          <div className="flex flex-wrap gap-2">
            {lead.productsOfInterest.map((product) => (
              <Badge key={product.id}>{product.name}</Badge>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
