# Plano — Frontend Etapa 2: Usuários e Permissões

> Referência: `frontend/plans/roadmap.md` (Etapa 2), `00-documentation/04-rotas-e-telas.md`
> (`/users`, `/users/new`, `/users/[id]/edit`, `/settings/roles`),
> `backend/plans/2026-09-12-etapa-2-catalogo-produtos.md` (`GET /api/roles`, novo).
>
> **Decisões confirmadas com o usuário**:
> - `/users/new` usa o contrato real do backend — admin define a senha inicial direto no
>   formulário (`POST /api/users` pede `name/email/password/roleId`); não há link de convite.
> - `/settings/roles` é **só leitura** (não há endpoint de escrita de papel/permissão no
>   backend); exibe a matriz, sem edição.
> - Segue o padrão já estabelecido para `/login`: cada formulário vira um componente próprio em
>   `components/forms/`, a página só monta layout + o formulário.

## 1. Problemas encontrados

- Não existe nenhum client de API no frontend para chamar o backend autenticado a partir do
  navegador — `lib/auth.ts` só cobre o `POST /api/auth/login` feito pelo NextAuth no servidor.
  TanStack Query já está instalado (Etapa 0) mas nunca foi usado.
- `BACKEND_API_URL` (`.env.example`) é uma env var só de servidor (usada dentro do route handler
  do NextAuth) — as telas desta etapa rodam no navegador (client components, para usar
  `useSession`/TanStack Query), então precisam de uma variável `NEXT_PUBLIC_...` própria para
  montar a URL do backend a partir do browser.
- `types/next-auth.d.ts`/`lib/auth.ts` guardam `role` (nome do papel) na sessão, mas não a lista
  de `permissions` do usuário logado — não há hoje como o frontend decidir "esconder o link de
  `/users` no menu para quem não tem `CREATE_USER`" de forma correta. **Fora de escopo nesta
  etapa** (não pedido no roadmap): as telas só ficam de fato protegidas pelo 403 que o backend já
  devolve; a UI mostra uma mensagem de "sem permissão" nesse caso, mas não escondemos itens de
  navegação por permissão ainda.
- `app/(app)/users/[id]/edit/page.tsx` é rota dinâmica; no App Router desta versão do Next,
  `params` chega como `Promise` — a página continua Server Component (`async function`, dá
  `await params`) e repassa o `id` (string) para o client component do formulário, em vez de
  tentar ler `params` dentro de um client component.
- `Switch` do base-ds é controlado via `checked`/`onChange(boolean)` (não é um `<input>` nativo) —
  não dá para usar `{...register("active")}` do React Hook Form direto nele; precisa de
  `Controller`.

## 2. Testes a incluir/alterar (agrupados por arquivo)

- `lib/api-client.test.ts` (novo) — `apiFetch` monta a URL com `NEXT_PUBLIC_BACKEND_API_URL`,
  manda `Authorization: Bearer <token>` quando informado, lança `ApiError` com `status`/`message`
  em resposta não-ok.
- `components/forms/CreateUserForm.test.tsx` (novo) — validação client-side (nome/e-mail/senha/
  papel obrigatórios, senha mínima), chama a mutação de criação com o payload certo, mostra erro
  de e-mail duplicado (409) vindo da API, redireciona para `/users` no sucesso.
- `components/forms/EditUserForm.test.tsx` (novo) — carrega dados do usuário (nome/papel/ativo),
  altera papel e o toggle `active` via `Switch`, chama a mutação de atualização com o payload
  certo, redireciona para `/users` no sucesso.
- `app/(app)/users/page.test.tsx` (novo) — mostra `Skeleton` durante o carregamento, renderiza a
  tabela com os usuários retornados, mostra mensagem de "sem permissão" quando a query falha com
  403.
- `app/(app)/settings/roles/page.test.tsx` (novo) — renderiza os papéis retornados por
  `GET /api/roles` com suas permissões.

## 3. O que entra no projeto

1. **Tipos compartilhados** — `types/api.ts` (novo): `UserResponse`, `RoleResponse`,
   `CreateUserRequest`, `UpdateUserRequest`, espelhando os DTOs do backend (Etapa 1 + Etapa 2).
2. **`.env.example`** — adiciona `NEXT_PUBLIC_BACKEND_API_URL=http://localhost:8080`.
3. **`lib/api-client.ts`** (novo) — `apiFetch<T>(path, { token, method, body })` e `ApiError`
   (status + message), base para todos os hooks de query/mutation desta etapa em diante.
4. **`lib/queries/users.ts`** (novo) — `useUsers()`, `useUser(id)`, `useCreateUser()`,
   `useUpdateUser()` (TanStack Query, usando `useSession()` para o token).
5. **`lib/queries/roles.ts`** (novo) — `useRoles()`.
6. **`components/forms/CreateUserForm.tsx`** (+ teste) — nome/e-mail/senha (React Hook Form + Zod
   + `@hookform/resolvers`, mesmo padrão do `LoginForm`), `Select` de papel a partir de
   `useRoles()`.
7. **`components/forms/EditUserForm.tsx`** (+ teste) — nome, `Select` de papel, `Switch` de
   `active` via `Controller`; carrega o usuário atual com `useUser(id)`.
8. **`app/(app)/users/page.tsx`** — `Table` do base-ds com nome/e-mail/papel/status, botão "Novo
   usuário" (→ `/users/new`), link de editar por linha (→ `/users/[id]/edit`); estados de
   carregamento (`Skeleton`) e erro (403 → mensagem de permissão).
9. **`app/(app)/users/new/page.tsx`** — layout + `<CreateUserForm />`.
10. **`app/(app)/users/[id]/edit/page.tsx`** — Server Component que resolve `params.id` e repassa
    para `<EditUserForm userId={id} />`.
11. **`app/(app)/settings/roles/page.tsx`** — lista os papéis (`useRoles()`) com suas permissões
    (badges), somente leitura.
12. Marcar os itens da Etapa 2 em `frontend/plans/roadmap.md` como concluídos, com a nota sobre
    `/settings/roles` ser só leitura e sobre o gap de `permissions` na sessão (itens acima).
