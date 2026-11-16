import { ConversationChatView } from "@/components/ConversationChatView";

export default async function ChatPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  return <ConversationChatView leadId={id} />;
}
