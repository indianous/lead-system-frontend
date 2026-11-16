import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ToastProvider, ToastViewport } from "base-ds";
import { ConversationThreadPane } from "./ConversationThreadPane";
import { useMessages, useSendMessage } from "@/lib/queries/conversations";
import { useConversationSocket } from "@/lib/realtime";

vi.mock("@/lib/queries/conversations", () => ({
  useMessages: vi.fn(),
  useSendMessage: vi.fn(),
  appendMessage: vi.fn(),
}));

vi.mock("@/lib/realtime", () => ({
  useConversationSocket: vi.fn(),
}));

const mutateAsync = vi.fn();

function renderPane() {
  const queryClient = new QueryClient();
  return render(
    <QueryClientProvider client={queryClient}>
      <ToastProvider>
        <ConversationThreadPane conversationId="conversation-1" />
        <ToastViewport />
      </ToastProvider>
    </QueryClientProvider>,
  );
}

beforeEach(() => {
  vi.mocked(useSendMessage).mockReturnValue({ mutateAsync } as unknown as ReturnType<typeof useSendMessage>);
  vi.mocked(useConversationSocket).mockReset();
  mutateAsync.mockReset();
  mutateAsync.mockResolvedValue(undefined);
});

describe("ConversationThreadPane", () => {
  it("shows a skeleton while loading", () => {
    vi.mocked(useMessages).mockReturnValue({ data: undefined, isLoading: true } as unknown as ReturnType<
      typeof useMessages
    >);

    const { container } = renderPane();

    expect(container.querySelector('[aria-hidden="true"]')).toBeInTheDocument();
  });

  it("renders the message history", () => {
    vi.mocked(useMessages).mockReturnValue({
      data: [
        {
          id: "message-1",
          conversationId: "conversation-1",
          direction: "INBOUND",
          senderUserId: null,
          senderUserName: null,
          content: "Tenho interesse no produto",
          mediaUrl: null,
          externalMessageId: "wamid.1",
          status: "DELIVERED",
          sentAt: "2026-09-17T14:00:00Z",
        },
      ],
      isLoading: false,
    } as unknown as ReturnType<typeof useMessages>);

    renderPane();

    expect(screen.getByText("Tenho interesse no produto")).toBeInTheDocument();
  });

  it("sends the typed content through the composer", async () => {
    vi.mocked(useMessages).mockReturnValue({ data: [], isLoading: false } as unknown as ReturnType<
      typeof useMessages
    >);
    const user = userEvent.setup();
    renderPane();

    await user.type(screen.getByLabelText("Digite uma mensagem"), "Olá, tudo bem?");
    await user.click(screen.getByRole("button", { name: /send message/i }));

    expect(mutateAsync).toHaveBeenCalledWith({ content: "Olá, tudo bem?" });
  });

  it("subscribes to the conversation socket", () => {
    vi.mocked(useMessages).mockReturnValue({ data: [], isLoading: false } as unknown as ReturnType<
      typeof useMessages
    >);

    renderPane();

    expect(useConversationSocket).toHaveBeenCalledWith("conversation-1", expect.any(Function));
  });
});
