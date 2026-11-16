import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ToastProvider, ToastViewport } from "base-ds";
import { ConversationChatView } from "./ConversationChatView";
import { useLead } from "@/lib/queries/leads";
import { useConversations, useCreateConversation } from "@/lib/queries/conversations";
import { ApiError } from "@/lib/api-client";

vi.mock("@/lib/queries/leads", () => ({
  useLead: vi.fn(),
}));

vi.mock("@/lib/queries/conversations", () => ({
  useConversations: vi.fn(),
  useCreateConversation: vi.fn(),
}));

vi.mock("@/components/ConversationThreadPane", () => ({
  ConversationThreadPane: ({ conversationId }: { conversationId: string }) => (
    <div data-testid="thread-pane">{conversationId}</div>
  ),
}));

const mutateAsync = vi.fn();

const baseLead = {
  id: "lead-1",
  name: "Cliente Existente",
  phone: "5511999999999",
};

function renderView() {
  return render(
    <ToastProvider>
      <ConversationChatView leadId="lead-1" />
      <ToastViewport />
    </ToastProvider>,
  );
}

beforeEach(() => {
  vi.mocked(useLead).mockReturnValue({ data: baseLead, isLoading: false, error: null } as unknown as ReturnType<
    typeof useLead
  >);
  vi.mocked(useCreateConversation).mockReturnValue({
    mutateAsync,
    isPending: false,
  } as unknown as ReturnType<typeof useCreateConversation>);
  mutateAsync.mockReset();
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("ConversationChatView", () => {
  it("shows a skeleton while loading", () => {
    vi.mocked(useConversations).mockReturnValue({
      data: undefined,
      isLoading: true,
      error: null,
    } as unknown as ReturnType<typeof useConversations>);

    const { container } = renderView();

    expect(container.querySelector('[aria-hidden="true"]')).toBeInTheDocument();
  });

  it("shows a permission message when conversations fail with 403", () => {
    vi.mocked(useConversations).mockReturnValue({
      data: undefined,
      isLoading: false,
      error: new ApiError(403, "forbidden"),
    } as unknown as ReturnType<typeof useConversations>);

    renderView();

    expect(screen.getByText("Você não tem permissão para ver esta página")).toBeInTheDocument();
  });

  it("offers WhatsApp and Telegram when the lead has a phone and no conversation exists", () => {
    vi.mocked(useConversations).mockReturnValue({ data: [], isLoading: false, error: null } as unknown as ReturnType<
      typeof useConversations
    >);

    renderView();

    expect(screen.getByRole("button", { name: "Iniciar por WhatsApp" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Gerar link do Telegram" })).toBeInTheDocument();
  });

  it("hides the WhatsApp button when the lead has no phone", () => {
    vi.mocked(useLead).mockReturnValue({
      data: { ...baseLead, phone: null },
      isLoading: false,
      error: null,
    } as unknown as ReturnType<typeof useLead>);
    vi.mocked(useConversations).mockReturnValue({ data: [], isLoading: false, error: null } as unknown as ReturnType<
      typeof useConversations
    >);

    renderView();

    expect(screen.queryByRole("button", { name: "Iniciar por WhatsApp" })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Gerar link do Telegram" })).toBeInTheDocument();
  });

  it("renders a single conversation thread directly, without tabs", () => {
    vi.mocked(useConversations).mockReturnValue({
      data: [{ id: "conversation-1", leadId: "lead-1", channel: "META_WHATSAPP" }],
      isLoading: false,
      error: null,
    } as unknown as ReturnType<typeof useConversations>);

    renderView();

    expect(screen.getByTestId("thread-pane")).toHaveTextContent("conversation-1");
    expect(screen.queryByRole("tablist")).not.toBeInTheDocument();
  });

  it("renders tabs with a label per channel when there is more than one conversation", () => {
    vi.mocked(useConversations).mockReturnValue({
      data: [
        { id: "conversation-1", leadId: "lead-1", channel: "META_WHATSAPP" },
        { id: "conversation-2", leadId: "lead-1", channel: "TELEGRAM" },
      ],
      isLoading: false,
      error: null,
    } as unknown as ReturnType<typeof useConversations>);

    renderView();

    expect(screen.getByRole("tab", { name: "WhatsApp" })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "Telegram" })).toBeInTheDocument();
  });

  it("shows the Telegram deep link with a copy button after generating it", async () => {
    vi.mocked(useConversations).mockReturnValue({ data: [], isLoading: false, error: null } as unknown as ReturnType<
      typeof useConversations
    >);
    mutateAsync.mockResolvedValue({ deepLink: "https://t.me/bot?start=lead-1" });
    const user = userEvent.setup();
    const writeText = vi.fn().mockResolvedValue(undefined);
    vi.stubGlobal("navigator", { ...navigator, clipboard: { writeText } });
    renderView();

    await user.click(screen.getByRole("button", { name: "Gerar link do Telegram" }));

    expect(await screen.findByText("https://t.me/bot?start=lead-1")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Copiar link" }));
    expect(writeText).toHaveBeenCalledWith("https://t.me/bot?start=lead-1");
  });
});
