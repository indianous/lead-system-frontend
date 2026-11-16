import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderHook } from "@testing-library/react";
import { useSession } from "next-auth/react";
import { Client } from "@stomp/stompjs";
import { useConversationSocket } from "./realtime";

vi.mock("next-auth/react", () => ({
  useSession: vi.fn(),
}));

const activate = vi.fn();
const deactivate = vi.fn();
const subscribe = vi.fn();
let lastClientOptions!: ConstructorParameters<typeof Client>[0];

vi.mock("@stomp/stompjs", () => ({
  Client: vi.fn().mockImplementation(function MockClient(options) {
    lastClientOptions = options;
    return { activate, deactivate, subscribe };
  }),
}));

beforeEach(() => {
  vi.mocked(useSession).mockReturnValue({
    data: { accessToken: "jwt-token" },
  } as unknown as ReturnType<typeof useSession>);
  vi.mocked(Client).mockClear();
  activate.mockClear();
  deactivate.mockClear();
  subscribe.mockClear();
});

describe("useConversationSocket", () => {
  it("does not connect without a conversationId", () => {
    renderHook(() => useConversationSocket(undefined, vi.fn()));

    expect(Client).not.toHaveBeenCalled();
  });

  it("connects with the JWT in the STOMP CONNECT header and activates", () => {
    renderHook(() => useConversationSocket("conversation-1", vi.fn()));

    expect(Client).toHaveBeenCalledTimes(1);
    expect(lastClientOptions!.connectHeaders).toEqual({ Authorization: "Bearer jwt-token" });
    expect(activate).toHaveBeenCalledTimes(1);
  });

  it("subscribes to the conversation topic and forwards the parsed payload on connect", () => {
    const onMessage = vi.fn();
    renderHook(() => useConversationSocket("conversation-1", onMessage));

    lastClientOptions!.onConnect?.({} as never);

    expect(subscribe).toHaveBeenCalledWith("/topic/conversations/conversation-1", expect.any(Function));

    const subscribeCallback = subscribe.mock.calls[0][1];
    subscribeCallback({ body: JSON.stringify({ id: "message-1", content: "Olá" }) });

    expect(onMessage).toHaveBeenCalledWith({ id: "message-1", content: "Olá" });
  });

  it("deactivates the client on unmount", () => {
    const { unmount } = renderHook(() => useConversationSocket("conversation-1", vi.fn()));

    unmount();

    expect(deactivate).toHaveBeenCalledTimes(1);
  });
});
