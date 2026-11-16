"use client";

import { useQueryClient } from "@tanstack/react-query";
import { ConversationThread, Skeleton, useToast } from "base-ds";
import { appendMessage, useMessages, useSendMessage } from "@/lib/queries/conversations";
import { useConversationSocket } from "@/lib/realtime";

export function ConversationThreadPane({ conversationId }: { conversationId: string }) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { data: messages, isLoading } = useMessages(conversationId);
  const sendMessage = useSendMessage(conversationId);

  useConversationSocket(conversationId, (message) => {
    appendMessage(queryClient, conversationId, message);
  });

  async function handleSend(content: string) {
    try {
      await sendMessage.mutateAsync({ content });
    } catch {
      toast({ variant: "destructive", title: "Não foi possível enviar a mensagem" });
    }
  }

  if (isLoading) {
    return <Skeleton height={300} />;
  }

  return (
    <ConversationThread
      messages={(messages ?? []).map((message) => ({
        id: message.id,
        direction: message.direction,
        content: message.content,
        timestamp: new Date(message.sentAt),
        status: message.direction === "OUTBOUND" ? message.status : undefined,
      }))}
      onSend={handleSend}
      composerPlaceholder="Digite uma mensagem"
      className="h-[60vh]"
    />
  );
}
