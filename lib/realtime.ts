"use client";

import { useEffect, useRef } from "react";
import { Client } from "@stomp/stompjs";
import { useSession } from "next-auth/react";
import type { MessageResponse } from "@/types/api";

// https:// -> wss://, http:// -> ws:// — deriva da mesma URL usada pro REST em vez de uma env var
// nova, pra não ter duas URLs de configurar/dessincronizar.
function deriveWebSocketUrl(apiBaseUrl: string): string {
  return apiBaseUrl.replace(/^http/, "ws") + "/ws";
}

// O handshake HTTP do WebSocket nativo não permite header Authorization customizado — o JWT viaja
// no frame STOMP CONNECT em vez disso (mesmo mecanismo do StompAuthChannelInterceptor no backend).
export function useConversationSocket(
  conversationId: string | undefined,
  onMessage: (message: MessageResponse) => void,
) {
  const { data: session } = useSession();
  const token = session?.accessToken;
  const onMessageRef = useRef(onMessage);

  useEffect(() => {
    onMessageRef.current = onMessage;
  }, [onMessage]);

  useEffect(() => {
    if (!token || !conversationId) {
      return;
    }

    const client = new Client({
      brokerURL: deriveWebSocketUrl(process.env.NEXT_PUBLIC_BACKEND_API_URL ?? ""),
      connectHeaders: { Authorization: `Bearer ${token}` },
      reconnectDelay: 5000,
      onConnect: () => {
        client.subscribe(`/topic/conversations/${conversationId}`, (frame) => {
          onMessageRef.current(JSON.parse(frame.body) as MessageResponse);
        });
      },
    });

    client.activate();

    return () => {
      void client.deactivate();
    };
  }, [conversationId, token]);
}
