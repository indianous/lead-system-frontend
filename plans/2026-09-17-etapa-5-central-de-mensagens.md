# Etapa 5 — Central de mensagens (frontend)

> Ref.: roadmap (`plans/roadmap.md`, Etapa 5), `00-documentation/04-rotas-e-telas.md` (`/inbox`,
> `/leads/[id]/chat`). Depende das Etapas 8 e 9 do backend (`Conversation`/`Message`,
> WebSocket/STOMP), já concluídas e no ar em `main`.

---

## 1. Problemas encontrados / decisões de escopo

1. **`/inbox` não tem endpoint de backend nenhum que sirva** — o roadmap descreve a tela como
   "lista unificada das conversas de todos os leads, ordenada pela mensagem mais recente, com
   indicador de não lida", mas o backend (Etapa 8) só expõe `GET /api/leads/{id}/conversations`
   (conversas de **um** lead). Não existe `GET /api/conversations` global, e pior: **não existe
   conceito de "não lida" no modelo de dados** (`Message`/`Conversation` não têm nenhum campo tipo
   `read_at`/`unread_count`). Decisão: **`/inbox` fica de fora desta etapa**, mesmo tratamento dado
   a `/invite/[token]` na Etapa 1 — a tela placeholder da Etapa 0 continua como está, sem tentar uma
   aproximação client-side (ex.: N+1 de `GET /api/leads` + `GET /api/leads/{id}/conversations` por
   lead) que não resolveria "não lida" de qualquer forma. Retomar quando o backend ganhar um
   endpoint agregado com esse dado.
2. **Não existe camada de BFF neste frontend.** O `CLAUDE.md` da raiz descreve a ordem genérica
   "tipos → backend → BFF → componentes → páginas", mas desde a Etapa 2 este projeto não tem
   nenhuma rota `app/api/*` além do `next-auth` — os client components chamam o backend
   diretamente via `apiFetch`/`NEXT_PUBLIC_BACKEND_API_URL`, usando o JWT da sessão do NextAuth
   (`session.accessToken`). Esta etapa segue o mesmo padrão; não há passo de "BFF" a criar.
3. **`POST /api/leads/{id}/conversations` responde com duas formas diferentes de corpo** —
   `ConversationResponse` (201, canal WhatsApp) ou `{"deepLink": "..."}` (200, canal Telegram, sem
   criar `Conversation` ainda — ver plano da Etapa 8 do backend, o `chat_id` só existe depois que o
   lead manda `/start` pro bot). O frontend precisa de um tipo união + type guard para tratar as
   duas formas.
4. **Sem media type persistido em `Message`.** O `ConversationThread` do base-ds aceita
   `mediaUrl`/`mediaType` (`'image'|'audio'|'document'`) por mensagem, mas nenhum ponto do backend
   hoje popula `media_url` (nem o composer do vendedor aceita anexo, nem os webhooks do
   WhatsApp/Telegram tentam extrair mídia da mensagem recebida — sempre gravam `null`). Decisão:
   não mapear esse campo agora (sempre `undefined` no componente) — recurso inexistente ponta a
   ponta, fora do escopo desta etapa (mesma lógica de "não implementar workaround para o que ainda
   não existe" já usada no backend para Instagram/Messenger).
5. **Nova conversa do Telegram não aparece sozinha na tela.** Como a `Conversation` só nasce quando
   o lead manda `/start` (evento assíncrono, fora do controle do frontend, sem nenhum evento de
   "conversa criada" no WebSocket — só `/topic/conversations/{id}` depois que ela já existe),
   depois de gerar o link o vendedor só vê a conversa aparecer recarregando a página. Decisão:
   documentar isso na própria tela (texto abaixo do link), sem implementar polling — over-engineering
   para um caso de uso raro (uma vez por lead).
6. **Issue [base-ds#36](https://github.com/indianous/base-ds/issues/36) já foi resolvida** —
   `ConversationThread` (thread + composer + preservação de scroll) e `ConversationList` (lista de
   conversas, usada quando `/inbox` for retomado) já existem no pacote instalado
   (`node_modules/base-ds`, `dist/index.d.ts` já exporta os dois). Nenhuma issue nova nem workaround
   local necessário.
7. **Formatação de timestamp do `ConversationThread`**: o componente só formata bonito
   (`HH:mm` via `Intl.DateTimeFormat`) quando recebe um `Date`; se receber `string` ele devolve a
   string crua sem tratamento. `Message.sentAt` da API é uma string ISO — o mapeamento precisa
   converter para `new Date(message.sentAt)` antes de passar pro componente, senão a bolha mostra o
   ISO inteiro (`"2026-09-17T14:34:42.30Z"`) em vez de `14:34`.
8. **Sem SockJS**: o cliente STOMP usa `brokerURL` (WebSocket nativo) direto pro backend
   (`ws://`/`wss://` + `/ws`), sem `sockjs-client` (não está nas dependências instaladas na Etapa 0,
   e o backend também não configurou fallback SockJS — ver `WebSocketConfig` do backend). A URL do
   WS é derivada de `NEXT_PUBLIC_BACKEND_API_URL` trocando o protocolo (`http`→`ws`, `https`→`wss`)
   em vez de uma env var nova — evita duas URLs de configurar/dessincronizar.
9. **Uma conexão STOMP por conversa ativa, não uma global.** Como o `Tabs` do base-ds só renderiza
   o conteúdo da aba ativa (confirmado lendo o componente), trocar de canal desmonta a aba anterior
   e a nova monta do zero — cada montagem abre sua própria conexão/subscrição e fecha ao desmontar.
   Simples e correto para o caso de uso real (vendedor olha uma conversa por vez; no máximo 2 canais
   por lead), evitado deliberadamente um gerenciador de socket único e multi-tópico.

---

## 2. Testes a incluir/alterar

- **`lib/realtime.test.ts`** (novo): mocka o módulo `@stomp/stompjs` inteiro (`Client`).
  Verifica: `brokerURL` derivado corretamente de `NEXT_PUBLIC_BACKEND_API_URL`; `connectHeaders`
  contém `Authorization: Bearer <token>`; ao disparar `onConnect` do client mockado, o hook chama
  `client.subscribe("/topic/conversations/{id}", ...)`; o callback do subscribe faz `JSON.parse`
  do `body` do frame e repassa pro `onMessage`; `client.deactivate()` é chamado no unmount/quando
  `conversationId` fica `undefined`.
- **`components/ConversationThreadPane.test.tsx`** (novo): mocka
  `@/lib/queries/conversations` (`useMessages`, `useSendMessage`) e `@/lib/realtime`
  (`useConversationSocket`). Verifica: renderiza histórico vindo de `useMessages`; digitar e
  enviar no composer chama `useSendMessage().mutate` com o conteúdo certo; invocar manualmente o
  callback capturado de `useConversationSocket` injeta a mensagem nova na lista renderizada, sem
  duplicar quando o `id` já está presente.
- **`components/ConversationChatView.test.tsx`** (novo): mocka `useLead`, `useConversations`,
  `useCreateConversation`. Verifica: skeleton no loading; mensagem de 403 (mesmo padrão do
  `LeadDetailView`); estado vazio mostra botão de WhatsApp só quando `lead.phone` existe, e sempre
  mostra o de Telegram; com 1 conversa renderiza a thread direto (sem `Tabs`); com 2+ conversas
  renderiza `Tabs` com um rótulo por canal; gerar link do Telegram mostra o link com botão de
  copiar (mocka `navigator.clipboard.writeText`).
- **`components/LeadDetailView.test.tsx`** (alterado): novo caso garantindo o link "Conversar"
  apontando para `/leads/{id}/chat`.

---

## 3. O que entra no projeto

- **Tipos (`types/api.ts`)**: `ConversationStatus`, `MessageDirection`, `MessageStatus`,
  `ConversationResponse`, `MessageResponse`, `CreateConversationRequest`,
  `CreateConversationResponse` (união `ConversationResponse | { deepLink: string }` + type guard),
  `CreateMessageRequest`.
- **`lib/queries/conversations.ts`** (novo): `useConversations(leadId)`
  (`GET /api/leads/{id}/conversations`), `useCreateConversation(leadId)`
  (`POST /api/leads/{id}/conversations`, invalida `["conversations", leadId]`),
  `useMessages(conversationId)` (`GET /api/conversations/{id}/messages`),
  `useSendMessage(conversationId)` (`POST /api/conversations/{id}/messages`) — no `onSuccess`,
  mescla a mensagem retornada no cache de `["messages", conversationId]` por um helper compartilhado
  que deduplica por `id` (a mesma mensagem também chega pelo WebSocket; sem dedupe duplicaria a
  bolha).
- **`lib/realtime.ts`** (novo): `useConversationSocket(conversationId, onMessage)` — lê o token da
  sessão (`useSession`), cria um `@stomp/stompjs` `Client` com `brokerURL` derivado de
  `NEXT_PUBLIC_BACKEND_API_URL`, `connectHeaders: { Authorization: "Bearer <token>" }" e
  `reconnectDelay: 5000`; ativa no mount, assina `/topic/conversations/{conversationId}`, repassa
  o payload parseado pro callback; desativa no unmount ou quando `conversationId`/`token` mudam.
- **`components/ConversationThreadPane.tsx`** (novo): junta `useMessages` + `useConversationSocket`
  (mesclando no cache via o helper acima) + `useSendMessage`; mapeia `MessageResponse` →
  `ConversationMessage` do base-ds (`timestamp: new Date(message.sentAt)`, sem `mediaUrl`/`mediaType`
  por ora — ver decisão 4); renderiza `ConversationThread`.
- **`components/ConversationChatView.tsx`** (novo): usado por `/leads/[id]/chat`. Busca o lead
  (`useLead`) e as conversas (`useConversations`); trata loading/403 como o `LeadDetailView`; sem
  conversa nenhuma, mostra os dois botões de iniciar (WhatsApp condicionado a `lead.phone`,
  Telegram sempre) com o texto explicando a limitação da decisão 5; com 1 conversa, renderiza um
  `ConversationThreadPane` direto; com 2+, usa `Tabs` do base-ds (uma aba por conversa, rótulo
  "WhatsApp"/"Telegram").
- **`components/LeadDetailView.tsx`** (alterado): novo botão "Conversar" ao lado de "Mudar
  etapa"/"Editar", linkando para `/leads/{id}/chat`.
- **`app/(app)/leads/[id]/chat/page.tsx`** (alterado): troca o placeholder por
  `<ConversationChatView leadId={id} />`, mesmo padrão async-params de `leads/[id]/page.tsx`.
- **Fora desta etapa**: `/inbox` (decisão 1) e qualquer coisa de mídia anexada (decisão 4).
