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

## Etapa 1 — Autenticação

- [ ] `/login`: formulário (FormField + Input + PasswordInput do base-ds, React Hook Form + Zod), chama `signIn("credentials", ...)`
- [ ] `/invite/[token]`: define senha inicial a partir de um convite
- [ ] `/reset-password/[token]`: redefine senha a partir de token de recuperação
- [ ] Testes (RTL): validação client-side, erro de credenciais inválidas, redirecionamento pós-login

## Etapa 2 — Usuários e Permissões

Depende da Etapa 1 do backend.

- [ ] `/users`: `Table` do base-ds + TanStack Query, papel e status (ativo/inativo)
- [ ] `/users/new`: formulário de cadastro + geração do link de convite
- [ ] `/users/[id]/edit`: altera papel, ativa/desativa
- [ ] `/settings/roles`: matriz de papéis × permissões
- [ ] Testes

## Etapa 3 — Catálogo de Produtos

Depende da Etapa 2 do backend.

- [ ] `/products`: lista (livre a qualquer usuário autenticado)
- [ ] `/products/new`, `/products/[id]/edit` (`EDIT_CATALOG`)
- [ ] Testes

## Etapa 4 — Funil de Leads (Kanban)

Depende das Etapas 3, 5 e 7 do backend (leads, status, qualificação).

- [ ] Verificar se a issue do componente Kanban ([#35](https://github.com/indianous/base-ds/issues/35)) foi resolvida; senão, avaliar implementação local temporária com `dnd-kit` + `Card` do base-ds (documentar como workaround provisório)
- [ ] `/leads`: board com colunas por etapa do funil, filtro por tipo/canal
- [ ] `/leads/new`: cadastro manual (Meta/Telegram)
- [ ] `/leads/[id]`: detalhe (qualificação, origem, produtos, histórico)
- [ ] `/leads/[id]/edit`
- [ ] `/leads/[id]/interactions/new`
- [ ] `/leads/[id]/status`: mudança de etapa / marcar perdido (exige motivo)
- [ ] Testes

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
