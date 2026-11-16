"use client";

import { useState } from "react";
import { Button, Card, Heading, Skeleton, Tabs, Text, useToast } from "base-ds";
import { ApiError } from "@/lib/api-client";
import { useConversations, useCreateConversation } from "@/lib/queries/conversations";
import { useLead } from "@/lib/queries/leads";
import { isDeepLinkResult } from "@/types/api";
import { ConversationThreadPane } from "@/components/ConversationThreadPane";

const CHANNEL_LABELS: Record<string, string> = {
  META_WHATSAPP: "WhatsApp",
  TELEGRAM: "Telegram",
};

export function ConversationChatView({ leadId }: { leadId: string }) {
  const { toast } = useToast();
  const { data: lead, isLoading: isLoadingLead, error: leadError } = useLead(leadId);
  const {
    data: conversations,
    isLoading: isLoadingConversations,
    error: conversationsError,
  } = useConversations(leadId);
  const createConversation = useCreateConversation(leadId);
  const [telegramDeepLink, setTelegramDeepLink] = useState<string | null>(null);

  const error = leadError ?? conversationsError;
  const isForbidden = error instanceof ApiError && error.status === 403;
  const isLoading = isLoadingLead || isLoadingConversations;

  if (isLoading) {
    return <Skeleton height={400} />;
  }

  if (isForbidden) {
    return (
      <Text color="destructive" role="alert">
        Você não tem permissão para ver esta página
      </Text>
    );
  }

  if (!lead || !conversations) {
    return null;
  }

  async function handleStart(channel: "META_WHATSAPP" | "TELEGRAM") {
    try {
      const result = await createConversation.mutateAsync({ channel });
      if (isDeepLinkResult(result)) {
        setTelegramDeepLink(result.deepLink);
      }
    } catch {
      toast({ variant: "destructive", title: "Não foi possível iniciar a conversa" });
    }
  }

  async function handleCopyDeepLink() {
    if (!telegramDeepLink) {
      return;
    }
    await navigator.clipboard.writeText(telegramDeepLink);
    toast({ variant: "success", title: "Link copiado" });
  }

  return (
    <div className="flex flex-col gap-4">
      <Heading as="h1" size="xl">
        Conversa com {lead.name}
      </Heading>

      {conversations.length === 0 && (
        <Card header="Iniciar conversa">
          <div className="flex flex-col gap-4">
            <Text size="sm" color="muted">
              Nenhuma conversa iniciada com esse lead ainda.
            </Text>
            <div className="flex gap-2">
              {lead.phone && (
                <Button onClick={() => handleStart("META_WHATSAPP")} isLoading={createConversation.isPending}>
                  Iniciar por WhatsApp
                </Button>
              )}
              <Button
                variant="outline"
                onClick={() => handleStart("TELEGRAM")}
                isLoading={createConversation.isPending}
              >
                Gerar link do Telegram
              </Button>
            </div>
            {telegramDeepLink && (
              <div className="flex flex-col gap-2">
                <Text size="sm" color="muted">
                  Envie esse link ao lead. Quando ele iniciar a conversa no Telegram, ela aparece aqui — recarregue
                  a página depois de ele mandar a primeira mensagem ao bot.
                </Text>
                <div className="flex flex-wrap items-center gap-2">
                  <Text size="sm" className="break-all">
                    {telegramDeepLink}
                  </Text>
                  <Button variant="outline" onClick={handleCopyDeepLink}>
                    Copiar link
                  </Button>
                </div>
              </div>
            )}
          </div>
        </Card>
      )}

      {conversations.length === 1 && <ConversationThreadPane conversationId={conversations[0].id} />}

      {conversations.length > 1 && (
        <Tabs
          tabs={conversations.map((conversation) => ({
            id: conversation.id,
            label: CHANNEL_LABELS[conversation.channel] ?? conversation.channel,
            content: <ConversationThreadPane conversationId={conversation.id} />,
          }))}
        />
      )}
    </div>
  );
}
