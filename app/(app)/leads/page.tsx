"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  Badge,
  Button,
  Dialog,
  FilterDropdown,
  Heading,
  Input,
  KanbanBoard,
  Skeleton,
  Text,
  useToast,
} from "base-ds";
import type { KanbanColumn } from "base-ds";
import { ApiError } from "@/lib/api-client";
import { useLeads, useUpdateLeadStatus } from "@/lib/queries/leads";
import type { Channel, FunnelStatus, LeadResponse, LeadType } from "@/types/api";

const FUNNEL_COLUMNS: { id: FunnelStatus; title: string }[] = [
  { id: "NEW", title: "Novo" },
  { id: "CONTACTED", title: "Contatado" },
  { id: "PROPOSAL", title: "Proposta" },
  { id: "NEGOTIATION", title: "Negociação" },
  { id: "CLOSED", title: "Fechado" },
  { id: "LOST", title: "Perdido" },
];

const LEAD_TYPE_OPTIONS = [
  { value: "DIRECT_CONTACT", label: "Contato direto" },
  { value: "LOCAL_SEARCH", label: "Busca local" },
];

const CHANNEL_OPTIONS = [
  { value: "META_WHATSAPP", label: "WhatsApp (Meta)" },
  { value: "META_INSTAGRAM", label: "Instagram (Meta)" },
  { value: "META_MESSENGER", label: "Messenger (Meta)" },
  { value: "TELEGRAM", label: "Telegram" },
  { value: "WEBSITE", label: "Site" },
];

const CHANNEL_LABELS: Record<Channel, string> = {
  META_WHATSAPP: "WhatsApp",
  META_INSTAGRAM: "Instagram",
  META_MESSENGER: "Messenger",
  TELEGRAM: "Telegram",
  WEBSITE: "Site",
};

const QUALIFICATION_LABELS: Record<string, string> = {
  HIGH: "Alta",
  MEDIUM: "Média",
  LOW: "Baixa",
};

function describeOrigin(lead: LeadResponse): string {
  if (lead.origin.channel) {
    return CHANNEL_LABELS[lead.origin.channel];
  }
  return "Busca local";
}

export default function LeadsPage() {
  const [leadTypeFilter, setLeadTypeFilter] = useState<LeadType | undefined>();
  const [channelFilter, setChannelFilter] = useState<Channel | undefined>();
  const [pendingLostMove, setPendingLostMove] = useState<{ leadId: string; leadName: string } | null>(null);
  const [lossReason, setLossReason] = useState("");

  const { toast } = useToast();
  const { data: leads, isLoading, error } = useLeads({ leadType: leadTypeFilter, channel: channelFilter });
  const updateLeadStatus = useUpdateLeadStatus();
  const isForbidden = error instanceof ApiError && error.status === 403;

  const columns: KanbanColumn<LeadResponse>[] = useMemo(
    () =>
      FUNNEL_COLUMNS.map((column) => ({
        id: column.id,
        title: column.title,
        cards: (leads ?? []).filter((lead) => lead.funnelStatus === column.id),
      })),
    [leads],
  );

  function moveLeadToStatus(leadId: string, newStatus: FunnelStatus, reason?: string) {
    updateLeadStatus.mutate(
      { id: leadId, newStatus, reason },
      {
        onSuccess: () => toast({ variant: "success", title: "Etapa do lead atualizada" }),
        onError: () => toast({ variant: "destructive", title: "Não foi possível mudar a etapa do lead" }),
      },
    );
  }

  function handleCardMove(cardId: string, fromColumnId: string, toColumnId: string) {
    if (fromColumnId === toColumnId) {
      return;
    }
    const lead = (leads ?? []).find((candidate) => candidate.id === cardId);
    if (!lead) {
      return;
    }
    if (toColumnId === "LOST") {
      setLossReason("");
      setPendingLostMove({ leadId: cardId, leadName: lead.name });
      return;
    }
    moveLeadToStatus(cardId, toColumnId as FunnelStatus);
  }

  function confirmLostMove() {
    if (!pendingLostMove || !lossReason.trim()) {
      return;
    }
    moveLeadToStatus(pendingLostMove.leadId, "LOST", lossReason.trim());
    setPendingLostMove(null);
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <Heading as="h1" size="xl">
          Funil de leads
        </Heading>
        <Button asChild>
          <Link href="/leads/new">Novo lead</Link>
        </Button>
      </div>

      <div className="flex gap-2">
        <FilterDropdown
          label="Tipo"
          options={LEAD_TYPE_OPTIONS}
          value={leadTypeFilter ? [leadTypeFilter] : []}
          onApply={(next) => setLeadTypeFilter((next[0] as LeadType) ?? undefined)}
        />
        <FilterDropdown
          label="Canal"
          options={CHANNEL_OPTIONS}
          value={channelFilter ? [channelFilter] : []}
          onApply={(next) => setChannelFilter((next[0] as Channel) ?? undefined)}
        />
      </div>

      {isLoading && <Skeleton height={300} />}

      {isForbidden && (
        <Text color="destructive" role="alert">
          Você não tem permissão para ver esta página
        </Text>
      )}

      {leads && (
        <KanbanBoard
          columns={columns}
          onCardMove={handleCardMove}
          getCardAriaLabel={(lead) => `Lead ${lead.name}`}
          renderCard={(lead) => (
            <Link href={`/leads/${lead.id}`} className="flex flex-col gap-1">
              <Text as="span" size="sm" weight="medium">
                {lead.name}
              </Text>
              <div className="flex flex-wrap gap-1">
                <Badge size="sm">{describeOrigin(lead)}</Badge>
                {lead.qualificationScore && (
                  <Badge size="sm" variant="info">
                    {QUALIFICATION_LABELS[lead.qualificationScore]}
                  </Badge>
                )}
              </div>
            </Link>
          )}
        />
      )}

      <Dialog
        open={pendingLostMove !== null}
        onClose={() => setPendingLostMove(null)}
        title="Marcar lead como perdido"
        description={pendingLostMove ? `Informe o motivo da perda de "${pendingLostMove.leadName}".` : undefined}
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setPendingLostMove(null)}>
              Cancelar
            </Button>
            <Button variant="danger" onClick={confirmLostMove} disabled={!lossReason.trim()}>
              Confirmar
            </Button>
          </div>
        }
      >
        <Input
          id="lossReason"
          value={lossReason}
          onChange={(event) => setLossReason(event.target.value)}
          placeholder="Motivo da perda"
        />
      </Dialog>
    </div>
  );
}
