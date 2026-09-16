# Roadmap de implementação — Frontend

> Referência: `00-documentation/04-rotas-e-telas.md` (rotas e permissões), `02-bibliotecas-e-apis.md` (bibliotecas), `03-entidades.md` (contratos de dados). Segue o processo de TDD definido no `CLAUDE.md` da raiz: cada tarefa abaixo, ao ser iniciada, ganha seu próprio plano de 3 seções (problemas encontrados / testes a incluir / o que entra no projeto) salvo aqui em `plans/` antes de qualquer alteração de código. Toda tela usa componentes do **base-ds** — gap de componente vira issue em `indianous/base-ds` antes de qualquer workaround local.

Este documento é o backlog macro, em etapas sequenciais. Cada etapa depende do backend ter o(s) endpoint(s) correspondente(s) implementado(s) (ver `backend/plans/roadmap.md`) — algumas tarefas de UI podem ser adiantadas com dados mockados, mas a integração real só fecha quando o endpoint existir.

---

## Etapa 0 — Fundação (concluída)

Detalhe completo em `plans/2026-09-11-etapa-0-fundacao.md`, incluindo descobertas não previstas (bugs de integração com base-ds, ver issues [#37](https://github.com/indianous/base-ds/issues/37)/[#38](https://github.com/indianous/base-ds/issues/38)).

- [x] Scaffold `create-next-app` (Next.js 16, React 19, TypeScript, Tailwind v4)
- [x] Bibliotecas instaladas: `base-ds` (local), TanStack Query, React Hook Form, Zod, `next-auth`, dnd-kit, date-fns, `@stomp/stompjs`, Vitest, Testing Library, Playwright
- [x] Páginas placeholder das rotas de `04-rotas-e-telas.md` em `app/(auth)/` e `app/(app)/`
- [x] `app/providers.tsx`, `lib/auth.ts` + `types/next-auth.d.ts`, `app/api/auth/[...nextauth]/route.ts`, `proxy.ts` (proteção de rotas)
- [x] `.env.example`, `lib/navigation.ts`, `components/app-sidebar.tsx`, `components/app-navbar.tsx`, `components/logout-button.tsx`
- [x] `app/(app)/layout.tsx`, `app/(auth)/layout.tsx`, `app/layout.tsx` (Providers + estilos do base-ds)
- [x] Stopgap de tema (`@theme inline` + `@source`) em `app/globals.css`
- [x] `vitest.config.ts`/`vitest.setup.ts`, `playwright.config.ts`, testes de `lib/navigation`, `lib/auth`, `app/providers`
- [x] Validado: `next build` limpo (26 rotas), `next lint` limpo, `npm run dev` testado via curl (redirects de auth, renderização do base-ds)
- [x] Commit e push (`59986bf`, já em `origin/main`)

## Etapa 1 — Autenticação (parcial — só `/login`)

Detalhe completo em `plans/2026-09-12-etapa-1-autenticacao.md`, incluindo a correção de contrato
em `POST /api/auth/login` (backend) e o bug de duplicação de React do base-ds descoberto no
caminho (issue [base-ds#38](https://github.com/indianous/base-ds/issues/38)).

- [x] `/login`: formulário (FormField + Input + PasswordInput do base-ds, React Hook Form + Zod), chama `signIn("credentials", ...)`
- [ ] `/invite/[token]`: define senha inicial a partir de um convite — **bloqueado**: backend não tem endpoint de convite/token em nenhuma etapa do roadmap; retomar quando esse fluxo entrar em escopo no backend
- [ ] `/reset-password/[token]`: redefine senha a partir de token de recuperação — mesmo bloqueio acima
- [x] Testes (RTL): validação client-side, erro de credenciais inválidas, redirecionamento pós-login

## Etapa 2 — Usuários e Permissões (concluída)

Depende da Etapa 1 do backend (e do `GET /api/roles`, adicionado fora do roadmap do backend na
Etapa 2 dele). Detalhe completo em `plans/2026-09-12-etapa-2-usuarios-permissoes.md`.

- [x] `/users`: `Table` do base-ds + TanStack Query, papel e status (ativo/inativo); mensagem de
  "sem permissão" quando a API responde 403
- [x] `/users/new`: formulário de cadastro (`CreateUserForm`) — admin define a senha inicial
  direto no formulário, seguindo o contrato real do backend (`POST /api/users`); **não há** link
  de convite (fora de escopo, backend não tem esse fluxo em nenhuma etapa do roadmap)
- [x] `/users/[id]/edit`: altera papel (`Select`) e ativa/desativa (`Switch` via `Controller`)
- [x] `/settings/roles`: lista papéis × permissões (`GET /api/roles`) — **somente leitura**, não
  há endpoint de escrita de papel/permissão no backend
- [x] `lib/api-client.ts` (`apiFetch`/`ApiError`) e `lib/queries/{users,roles}.ts` (TanStack Query)
- [x] Testes (RTL): `api-client`, `CreateUserForm`, `EditUserForm`, `users/page`, `settings/roles/page`
- [x] Gap identificado e adiado (fora de escopo desta etapa): sessão do NextAuth não carrega
  `permissions` do usuário logado — itens de navegação não são escondidos por permissão ainda,
  só ficam de fato protegidos pelo 403 do backend

## Etapa 3 — Catálogo de Produtos (concluída)

Depende da Etapa 2 do backend (já concluída). Detalhe completo em
`plans/2026-09-15-etapa-3-catalogo-produtos.md`.

- [x] `/products`: lista (livre a qualquer usuário autenticado), `Table` com nome/tipo/faixa de
  preço formatada em R$/status
- [x] `/products/new`, `/products/[id]/edit` (`EDIT_CATALOG` só no backend — mesmo gap de UI da
  Etapa 2: botão/link aparecem para todos, 403 do backend é quem protege de fato)
- [x] `lib/money.ts` (`centsToReaisInput`/`reaisInputToCents`) — conversão reais↔centavos na
  camada de apresentação, sem precisar de componente novo no `base-ds`
- [x] `lib/queries/products.ts` — `useProduct(id)` deriva o produto da listagem (`GET /api/products`),
  já que o backend não expõe `GET /api/products/{id}`
- [x] Testes (RTL): `lib/money`, `CreateProductForm`, `EditProductForm`, `products/page`

## Etapa 4 — Funil de Leads (Kanban) (concluída, exceto interações)

Depende das Etapas 3, 5 e 7 do backend (leads, status, qualificação). Detalhe completo em
`plans/2026-09-16-etapa-4-funil-leads-kanban.md` — o plano original previa adiar `/leads/[id]/status`
por falta da Etapa 5 do backend, mas ela foi implementada e verificada antes desta etapa começar
(pedido do usuário: backend Etapa 5 → frontend Etapa 4, nessa ordem), então o escopo foi
restaurado para incluir a tela de mudança de status.

- [x] Issue do componente Kanban ([#35](https://github.com/indianous/base-ds/issues/35)) já
  estava resolvida — `KanbanBoard` usado diretamente, sem workaround
- [x] `/leads`: board com as 6 colunas do funil, filtro por tipo/canal (`FilterDropdown`), drag-and-drop
  chama `PATCH /api/leads/{id}/status` de verdade; mover para "Perdido" abre um `Dialog` pedindo o motivo
- [x] `/leads/new`: cadastro manual — fixa `leadType=DIRECT_CONTACT` e só lista canais Meta/Telegram
  (não usado para site nem busca local, conforme `04-rotas-e-telas.md`)
- [x] `/leads/[id]`: detalhe (qualificação, origem, produtos de interesse); **sem** seção de
  histórico de status ainda (não estava no plano original desta etapa — `statusHistory` já existe
  na API, mas a exibição do histórico fica para quando a tela for revisitada)
- [x] `/leads/[id]/edit`
- [x] `/leads/[id]/status`: mudança de etapa / marcar perdido (exige motivo) — reintroduzida ao
  plano por já ter suporte no backend
- [ ] `/leads/[id]/interactions/new` — continua bloqueada (Etapa 6 do backend nem tem plano ainda)
- [x] Primeira tela do projeto a usar `useToast`/`ToastProvider` (obrigatórios pelo `CLAUDE.md`)
- [x] Testes (RTL): `CreateLeadForm`, `EditLeadForm`, `UpdateLeadStatusForm`, `LeadDetailView`,
  `leads/page` (Kanban — sem simular drag-and-drop via dnd-kit, mesmo padrão de teste usado pelo
  próprio `KanbanBoard` do base-ds, que só testa `computeCardMove` isoladamente)

## Etapa 5 — Central de mensagens

Depende das Etapas 8 e 9 do backend (Conversation/Message, WebSocket).

- [ ] Verificar se a issue do componente de chat ([#36](https://github.com/indianous/base-ds/issues/36)) foi resolvida; senão, avaliar implementação local temporária
- [ ] `/inbox`: lista de conversas ordenada pela mensagem mais recente, indicador de não lida
- [ ] `/leads/[id]/chat`: thread de mensagens + envio + client STOMP (`@stomp/stompjs`) para tempo real; alternância entre canais quando o lead tiver mais de uma conversa
- [ ] Testes (incluindo mock do cliente STOMP)

## Etapa 6 — Prospecção

Depende da Etapa 10 do backend.

- [ ] `/prospecting`: define região/segmento, dispara busca (`TRIGGER_PROSPECTING`)
- [ ] `/prospecting/[searchId]/results`: lista resultados, seleciona quais viram lead
- [ ] `/prospecting/manual-entry`: cadastro manual (grupos)
- [ ] Testes

## Etapa 7 — Perfil e Notificações

Depende da Etapa 11 do backend.

- [ ] `/profile`: dados do usuário logado, troca de senha
- [ ] `/profile/notifications`: preferências de canal (WhatsApp/Telegram/e-mail) + contato de cada canal
- [ ] Testes

## Etapa 8 — Métricas

Depende da Etapa 12 do backend.

- [ ] `/metrics`: conversão por canal/tipo, tempo médio de resposta, taxa de fechamento por etapa, produtos mais ofertados — usar `BarChart`/`LineChart`/`Funnel` do base-ds
- [ ] `/metrics/prospecting`: volume de busca local por região/fonte
- [ ] Testes

---

## Fora deste roadmap (explicitamente adiado)

Mesmos itens de "Futuro (evolução)" do estudo de caso listados no roadmap do backend — sem tarefas de UI planejadas até serem priorizados.
