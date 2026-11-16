"use client";

import { useMutation, useQuery, useQueryClient, type QueryClient } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import { apiFetch } from "@/lib/api-client";
import type {
  ConversationResponse,
  CreateConversationRequest,
  CreateConversationResponse,
  CreateMessageRequest,
  MessageResponse,
} from "@/types/api";

export function useConversations(leadId: string) {
  const { data: session } = useSession();
  const token = session?.accessToken;

  return useQuery({
    queryKey: ["conversations", leadId],
    queryFn: () => apiFetch<ConversationResponse[]>(`/api/leads/${leadId}/conversations`, { token }),
    enabled: Boolean(token) && Boolean(leadId),
  });
}

export function useCreateConversation(leadId: string) {
  const { data: session } = useSession();
  const token = session?.accessToken;
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (request: CreateConversationRequest) =>
      apiFetch<CreateConversationResponse>(`/api/leads/${leadId}/conversations`, {
        method: "POST",
        body: request,
        token,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["conversations", leadId] });
    },
  });
}

export function useMessages(conversationId: string | undefined) {
  const { data: session } = useSession();
  const token = session?.accessToken;

  return useQuery({
    queryKey: ["messages", conversationId],
    queryFn: () => apiFetch<MessageResponse[]>(`/api/conversations/${conversationId}/messages`, { token }),
    enabled: Boolean(token) && Boolean(conversationId),
  });
}

export function useSendMessage(conversationId: string) {
  const { data: session } = useSession();
  const token = session?.accessToken;
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (request: CreateMessageRequest) =>
      apiFetch<MessageResponse>(`/api/conversations/${conversationId}/messages`, {
        method: "POST",
        body: request,
        token,
      }),
    onSuccess: (message) => {
      appendMessage(queryClient, conversationId, message);
    },
  });
}

// A mesma mensagem chega tanto na resposta do POST (envio pelo vendedor) quanto pelo WebSocket
// (broadcast do backend, para todo mundo inscrito na conversa — inclusive quem acabou de enviar).
// Deduplica por id para não desenhar a mesma bolha duas vezes, não importa qual dos dois chegue primeiro.
export function appendMessage(queryClient: QueryClient, conversationId: string, message: MessageResponse) {
  queryClient.setQueryData<MessageResponse[]>(["messages", conversationId], (current) => {
    if (!current) {
      return [message];
    }
    if (current.some((existing) => existing.id === message.id)) {
      return current;
    }
    return [...current, message];
  });
}
