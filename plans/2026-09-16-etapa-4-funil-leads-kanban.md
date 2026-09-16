# Plano — Frontend Etapa 4: Funil de Leads (Kanban)

> Referência: `frontend/plans/roadmap.md` (Etapa 4), `00-documentation/04-rotas-e-telas.md`
> (`/leads`, `/leads/new`, `/leads/[id]`, `/leads/[id]/edit`, `/leads/[id]/status`,
> `/leads/[id]/interactions/new`), `backend/plans/2026-09-15-etapa-3-leads-e-origem.md`
> (contrato de `Lead`/`LeadOrigin`, já implementado e commitado).

## 1. Problemas encontrados

- O roadmap desta etapa depende das Etapas 3, 5 e 7 do **backend**. Só a Etapa 3 está
  implementada e commitada; a Etapa 5 (`PATCH /api/leads/{id}/status` + histórico) só tem o
  **plano** salvo (`backend/plans/2026-09-16-etapa-5-funil-historico-status.md`), ainda não
  implementada; a Etapa 6 (Interações) e a Etapa 7 (qualificação automática) nem têm plano ainda.
  Decisão: reduzir o escopo desta etapa ao que a Etapa 3 do backend já sustenta, adiando o resto —
  ver a lista item a item abaixo.
- **Adiado explicitamente** (sem endpoint de backend para consumir):
  - `/leads/[id]/status` — não existe `PATCH /api/leads/{id}/status` ainda (Etapa 5 do backend,
    só planejada). Não vou criar essa tela agora.
  - `/leads/[id]/interactions/new` — não existe nenhuma entidade/rota de `Interaction` ainda
    (Etapa 6 do backend, nem planejada). Não vou criar essa tela agora.
  - A seção "histórico de mudança de etapa" do detalhe do lead (`/leads/[id]`, ver
    `04-rotas-e-telas.md`) depende do campo `statusHistory` que só existirá em `LeadResponse`
    depois da Etapa 5 do backend — o detalhe fica sem essa seção por enquanto.
- **Kanban arrastável**: o board da tela `/leads` (`04-rotas-e-telas.md`: "cards arrastáveis")
  normalmente move um lead de coluna = mudar `funnel_status`, mas isso é exatamente o que
  `PATCH /api/leads/{id}/status` faria — e esse endpoint não existe ainda (`PUT /api/leads/{id}`
  da Etapa 3, por decisão documentada naquele plano, **não** altera `funnel_status`). Decisão:
  usar o `KanbanBoard` do base-ds (já existe — a issue
  [#35](https://github.com/indianous/base-ds/issues/35) foi resolvida, não precisa de workaround
  com `dnd-kit` cru) com drag-and-drop habilitado, mas o `onCardMove` só mostra um toast
  ("Mudança de etapa ainda não disponível — aguardando a Etapa 5 do backend") e não chama nenhuma
  mutação; como as colunas são recalculadas a cada render a partir dos dados de
  `GET /api/leads` (nova referência de array), o card volta visualmente para a coluna original
  assim que o toast dispara um novo render.
- `qualification_score` é preenchido automaticamente pela Etapa 7 do backend (não implementada),
  mas já é um campo comum de `Lead` desde a Etapa 3 e `PUT /api/leads/{id}` já aceita defini-lo
  manualmente. Decisão: `EditLeadForm` expõe `qualificationScore` como um `Select` manual
  (`HIGH`/`MEDIUM`/`LOW`/vazio) — quando a Etapa 7 existir, esse campo manual vira só um override.
- `04-rotas-e-telas.md` é explícito: `/leads/new` é "para o vendedor registrar manualmente um lead
  recebido pela Meta (WhatsApp/Instagram/Messenger) ou Telegram — **não é usado para leads do
  site**" (isso é só a Etapa 4 do backend, `POST /api/public/leads`) **nem** para busca
  local/grupos (isso é `/prospecting/manual-entry`, fora do escopo desta etapa). Decisão:
  `CreateLeadForm` fixa `leadType=DIRECT_CONTACT` (não expõe a escolha) e o `Select` de canal só
  lista `META_WHATSAPP`/`META_INSTAGRAM`/`META_MESSENGER`/`TELEGRAM` (exclui `WEBSITE`).
- Esta é a primeira tela do projeto a usar `useToast`/`ToastProvider` do base-ds — já ficam
  disponíveis desde `app/providers.tsx` (Etapa 0), mas nenhuma tela os usou até agora; `useToast`
  está na lista de componentes de uso obrigatório do `CLAUDE.md`.
- `assignedUserId` (responsável) e `productsOfInterest` nos formulários reaproveitam
  `useUsers()`/`useProducts()` já existentes (Etapas 2 e 3) — sem nova rota de backend.

## 2. Testes a incluir/alterar (agrupados por arquivo)

- `components/forms/CreateLeadForm.test.tsx` (novo) — validação client-side (nome e canal
  obrigatórios), chama `useCreateLead().mutateAsync` com `leadType: "DIRECT_CONTACT"` fixo e o
  payload correto (incluindo `estimatedBudgetCents` convertido de reais via `lib/money.ts`),
  mostra toast de sucesso e redireciona para `/leads`.
- `components/forms/EditLeadForm.test.tsx` (novo) — carrega dados do lead (`useLead(id)`),
  altera responsável (`Select`, via `useUsers()`) e produtos de interesse (`MultiSelect`, via
  `useProducts()`), chama `useUpdateLead(id).mutateAsync` com o payload certo, redireciona para
  `/leads/[id]` no sucesso.
- `app/(app)/leads/page.test.tsx` (novo) — mostra `Skeleton` durante o carregamento; renderiza as
  6 colunas do funil com os leads retornados agrupados por `funnelStatus`; ao simular
  `onCardMove` do `KanbanBoard`, verifica que **nenhuma** mutação é chamada e que o toast
  "ainda não disponível" aparece; `FilterDropdown` de tipo/canal presente.
- `app/(app)/leads/[id]/page.test.tsx` (novo) — mostra `Skeleton` durante carregamento; renderiza
  dados de qualificação, origem e produtos de interesse do lead retornado; mensagem de "sem
  permissão" quando a query falha com 403; **não** renderiza nenhuma seção de histórico de status
  (ainda não existe no contrato).

## 3. O que entra no projeto

1. **`types/api.ts`** (edita) — adiciona `LeadType`, `Channel`, `SearchSource`, `CaptureMethod`,
   `FunnelStatus`, `QualificationScore` (union types espelhando os enums do backend),
   `LeadOriginResponse`, `LeadResponse`, `CreateLeadRequest`, `UpdateLeadRequest`.
2. **`lib/queries/leads.ts`** (novo) — `useLeads({ leadType?, channel? })`, `useLead(id)`,
   `useCreateLead()`, `useUpdateLead(id)`, mesmo padrão de `lib/queries/products.ts`.
3. **`components/forms/CreateLeadForm.tsx`** (+ teste) — nome, canal (`Select`, só Meta/Telegram),
   telefone, e-mail, mensagem inicial (`Textarea`), orçamento estimado em reais (`Input`, via
   `lib/money.ts`), prazo desejado, responsável (`Select` via `useUsers()`), produtos de interesse
   (`MultiSelect` via `useProducts()`); `useToast()` no sucesso; redireciona para `/leads`.
4. **`components/forms/EditLeadForm.tsx`** (+ teste) — mesmos campos de qualificação + pontuação
   (`Select` `HIGH`/`MEDIUM`/`LOW`) + responsável + produtos de interesse; carrega com
   `useLead(id)`; `useToast()` no sucesso; redireciona para `/leads/[id]`.
5. **`app/(app)/leads/page.tsx`** (+ teste) — `KanbanBoard` do base-ds, 6 colunas fixas
   (`NEW`→"Novo", `CONTACTED`→"Contatado", `PROPOSAL`→"Proposta", `NEGOTIATION`→"Negociação",
   `CLOSED`→"Fechado", `LOST`→"Perdido"), cards com nome/canal/badge de pontuação; dois
   `FilterDropdown` (tipo de lead, canal) que viram parâmetros de `useLeads(...)`; botão "Novo
   lead" (→ `/leads/new`); `onCardMove` mostra toast informativo, sem persistir (ver decisão
   acima); estados de carregamento (`Skeleton`) e erro (403 → mensagem de permissão).
6. **`app/(app)/leads/new/page.tsx`** — layout + `<CreateLeadForm />`.
7. **`app/(app)/leads/[id]/page.tsx`** (+ teste) — detalhe: dados de qualificação, origem
   (`LeadOriginResponse`), produtos de interesse (`Badge` por produto), responsável; link "Editar"
   (→ `/leads/[id]/edit`); **sem** seção de histórico de status (depende da Etapa 5 do backend).
8. **`app/(app)/leads/[id]/edit/page.tsx`** — Server Component que resolve `params.id`
   (`Promise`, Next 16) e repassa para `<EditLeadForm leadId={id} />`.
9. Marcar em `frontend/plans/roadmap.md`: itens 1–4/6 (board, cadastro, detalhe, edição) como
   concluídos; `/leads/[id]/status` e `/leads/[id]/interactions/new` continuam pendentes,
   bloqueados pelas Etapas 5/6 do backend — não remover do roadmap, só anotar o bloqueio.
