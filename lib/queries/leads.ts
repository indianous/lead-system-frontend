"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import { apiFetch } from "@/lib/api-client";
import type {
  Channel,
  CreateLeadRequest,
  FunnelStatus,
  LeadResponse,
  LeadType,
  UpdateLeadRequest,
} from "@/types/api";

export interface UpdateLeadStatusRequest {
  newStatus: FunnelStatus;
  reason?: string | null;
}

export interface LeadFilters {
  leadType?: LeadType;
  channel?: Channel;
}

function buildLeadsPath(filters?: LeadFilters): string {
  const params = new URLSearchParams();
  if (filters?.leadType) {
    params.set("leadType", filters.leadType);
  }
  if (filters?.channel) {
    params.set("channel", filters.channel);
  }
  const query = params.toString();
  return query ? `/api/leads?${query}` : "/api/leads";
}

export function useLeads(filters?: LeadFilters) {
  const { data: session } = useSession();
  const token = session?.accessToken;

  return useQuery({
    queryKey: ["leads", filters ?? {}],
    queryFn: () => apiFetch<LeadResponse[]>(buildLeadsPath(filters), { token }),
    enabled: Boolean(token),
  });
}

export function useLead(id: string) {
  const { data: session } = useSession();
  const token = session?.accessToken;

  return useQuery({
    queryKey: ["leads", "detail", id],
    queryFn: () => apiFetch<LeadResponse>(`/api/leads/${id}`, { token }),
    enabled: Boolean(token) && Boolean(id),
  });
}

export function useCreateLead() {
  const { data: session } = useSession();
  const token = session?.accessToken;
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (request: CreateLeadRequest) =>
      apiFetch<LeadResponse>("/api/leads", { method: "POST", body: request, token }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["leads"] });
    },
  });
}

export function useUpdateLead(id: string) {
  const { data: session } = useSession();
  const token = session?.accessToken;
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (request: UpdateLeadRequest) =>
      apiFetch<LeadResponse>(`/api/leads/${id}`, { method: "PUT", body: request, token }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["leads"] });
    },
  });
}

// Sem id fixo (diferente de useUpdateLead) porque o card arrastado no Kanban muda a cada evento —
// o id do lead só é conhecido no momento da chamada, não quando o hook é montado.
export function useUpdateLeadStatus() {
  const { data: session } = useSession();
  const token = session?.accessToken;
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, ...request }: UpdateLeadStatusRequest & { id: string }) =>
      apiFetch<LeadResponse>(`/api/leads/${id}/status`, { method: "PATCH", body: request, token }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["leads"] });
    },
  });
}
