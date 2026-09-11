# Plano — Etapa 0: Fundação (frontend)

Continuação da Etapa 0 do `plans/roadmap.md`. Fecha o scaffolding base antes de qualquer tela de domínio (Etapa 1 em diante).

## 1. Problemas encontrados

- `app/(app)/` e `app/(auth)/` já têm páginas placeholder geradas (26 rotas de `04-rotas-e-telas.md`), mas continuam **não commitadas** desde a sessão anterior.
- `app/page.tsx` (scaffold padrão do `create-next-app`) foi removido localmente (colidia com `app/(app)/page.tsx` na rota `/`), mudança também não commitada.
- Não existe nenhum provider raiz: `QueryClientProvider` (TanStack Query), `SessionProvider` (next-auth) e `ToastProvider`/`ToastViewport` (base-ds) não estão wireados em `app/layout.tsx`.
- `app/layout.tsx` não importa `base-ds/styles`; `app/globals.css` não tem os tokens do base-ds mapeados para um bloco `@theme` do Tailwind v4 (bug de integração já registrado na issue [base-ds#37](https://github.com/indianous/base-ds/issues/37); aqui aplicamos o stopgap descrito na Etapa 0 do roadmap).
- Não existe `lib/auth.ts` (NextAuth `authOptions`), nem `app/api/auth/[...nextauth]/route.ts`, nem augmentação de tipos (`types/next-auth.d.ts`) — login não wireado.
- Não existe `middleware.ts` — nenhuma rota `(app)` está protegida.
- Não existe `.env.example` documentando `BACKEND_API_URL`/`NEXTAUTH_SECRET`/`NEXTAUTH_URL`.
- Não existe `lib/navigation.ts` nem os componentes `AppSidebar`/`AppNavbar`/`LogoutButton` — `app/(app)/layout.tsx` e `app/(auth)/layout.tsx` nem existem ainda.
- Não existe `vitest.config.ts`/`vitest.setup.ts` nem `playwright.config.ts`, apesar das libs já instaladas — nenhum teste roda ainda.

## 2. Testes a incluir/alterar

| Arquivo | O que testa |
|---|---|
| `vitest.setup.ts` | (não é teste em si — registra `@testing-library/jest-dom`) |
| `lib/navigation.test.ts` | `NAV_ITEMS` tem os itens esperados (label/href/ícone), sem duplicar `href` |
| `lib/auth.test.ts` | `authorize()`: credenciais ausentes → `null`; `fetch` chamado com método/URL/corpo corretos; resposta 200 → mapeia `id/name/email/accessToken/role`; resposta não-ok → `null` |
| `app/providers.test.tsx` | `Providers` renderiza os `children` sem lançar exceção (smoke test dos três providers compostos) |

Não escrevo um teste dedicado por página placeholder (são só `Heading`/`Text` estáticos, sem lógica) — cobertura por página real começa na Etapa 1 em diante, quando cada tela ganhar comportamento.

## 3. O que entra no projeto

Ordem de implementação (cada item só depois do teste correspondente, quando houver):

1. [x] `vitest.config.ts` + `vitest.setup.ts` (ambiente jsdom, plugin React) + script `test` no `package.json`
2. [x] `lib/navigation.ts` (dado puro) + teste
3. [x] `types/next-auth.d.ts` (augmentação de `Session`/`User`/`JWT` com `accessToken`/`role`)
4. [x] `lib/auth.ts` (`authOptions`: `CredentialsProvider` chamando `POST {BACKEND_API_URL}/api/auth/login`, `session.strategy = "jwt"`, `pages.signIn = "/login"`) + teste do `authorize()`
5. [x] `app/api/auth/[...nextauth]/route.ts`
6. [x] `proxy.ts` (renomeado de `middleware.ts` — convenção do Next 16, ver nota abaixo) via `withAuth`, matcher cobrindo as rotas `(app)`
7. [x] `.env.example`
8. [x] `app/providers.tsx` (`SessionProvider` + `QueryClientProvider` + `ToastProvider`/`ToastViewport`) + teste smoke
9. [x] Stopgap de tema em `app/globals.css` (bloco `@theme inline` + `@source` apontando pro `src` do base-ds — ver nota abaixo)
10. [x] `components/app-sidebar.tsx`, `components/app-navbar.tsx`, `components/logout-button.tsx`
11. [x] `app/(app)/layout.tsx`, `app/(auth)/layout.tsx`
12. [x] `app/layout.tsx`: importa `base-ds/styles` (via `globals.css`), envolve `children` em `Providers`
13. [x] `playwright.config.ts` (config mínima; sem specs ainda — não há fluxo real de ponta a ponta até a Etapa 1)
14. [x] Revisão final: `next build` limpo (26 rotas, TypeScript, lint) + `npm run dev` validado via curl (redirects de auth corretos, base-ds renderizando)
15. [ ] Commit de tudo — **aguardando confirmação do usuário** antes de commitar/subir

### Descobertas durante a implementação (não previstas no plano original)

- **`base-ds` tem cópia própria de `react`/`react-dom`** (`react`/`react-dom` duplicados em `dependencies` E `peerDependencies` no `package.json` do base-ds) → duas instâncias de React → `Invalid hook call` em qualquer componente que use hooks (`ToastProvider`, etc.). Issue aberta: [base-ds#38](https://github.com/indianous/base-ds/issues/38). Stopgap: `resolve.alias`/`resolveAlias` forçando uma única cópia de React em `vitest.config.ts` e `next.config.ts` (`turbopack.resolveAlias`).
- **Turbopack não resolve módulos fora da raiz do projeto**: o `base-ds` fica fora da raiz do `frontend`. Precisei configurar `turbopack.root` em `next.config.ts` apontando pro ancestral comum (`../../..`, ou seja `~/dev`).
- **Tailwind v4 só escaneia conteúdo dentro da raiz do projeto**: sem um `@source` explícito apontando pro `src` do base-ds, nenhuma classe usada internamente por ele era detectada e nenhum utilitário era gerado, mesmo com os tokens certos em `@theme`. Comentário adicionado em [base-ds#37](https://github.com/indianous/base-ds/issues/37#issuecomment-5641780179).
- **`middleware.ts` está deprecado no Next 16** em favor de `proxy.ts` (mesmo comportamento, só muda o nome do arquivo/convenção) — migrado direto, sem precisar do codemod.
