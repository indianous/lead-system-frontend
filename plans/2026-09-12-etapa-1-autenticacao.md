# Plano — Frontend Etapa 1: Autenticação

> Referência: `frontend/plans/roadmap.md` (Etapa 1), `00-documentation/04-rotas-e-telas.md` (`/login`,
> `/invite/[token]`, `/reset-password/[token]`), `backend/plans/2026-09-12-etapa-1-auth-rbac.md`
> (contrato de `POST /api/auth/login` recém-implementado).
>
> **Escopo confirmado com o usuário**: só `/login` fica funcional de ponta a ponta nesta etapa.
> `/invite/[token]` e `/reset-password/[token]` continuam como os placeholders da Etapa 0 — o
> backend não tem (em nenhuma etapa do roadmap) endpoint de convite ou redefinição de senha por
> token; desenhar esse fluxo fica para quando essa funcionalidade entrar em escopo no backend.

## 1. Problemas encontrados

- `app/(auth)/login/page.tsx` é só o placeholder da Etapa 0 (`Heading` + `Text`), sem formulário,
  sem `useForm`/Zod, sem chamada a `signIn`.
- **Contrato quebrado entre frontend e backend no login** — achado ao comparar os dois lados:
  - `frontend/lib/auth.ts:9-15` (`BackendLoginResponse`) e `frontend/lib/auth.test.ts` (já
    commitados na Etapa 0) esperam que `POST /api/auth/login` responda
    `{ id, name, email, token, role }`.
  - `backend/.../api/LoginResponse.java` (Etapa 1 do backend, ainda não commitada) só retorna
    `{ token }` — segui literalmente o item do roadmap do backend ("email + senha → JWT") sem
    olhar o que o frontend já esperava.
  - Como o frontend já foi testado e commitado com esse formato, a correção é no backend (fazer o
    backend refletir o contrato que o frontend já assume), não o contrário.
- Não há `@hookform/resolvers` em `frontend/package.json` — `react-hook-form` e `zod` já estão
  instalados (Etapa 0), mas não há o adaptador oficial que liga um schema Zod ao `resolver` do
  `useForm`. Sem ele, a validação teria que ser reimplementada manualmente.

## 2. Testes a incluir/alterar (agrupados por arquivo)

- `backend/src/main/java/.../api/LoginResponse.java` e `AuthService.java` (backend, correção do
  contrato) — `backend/src/test/java/.../api/AuthControllerTest.java`: o teste
  `loginWithValidAdminCredentialsReturnsToken` passa a também checar `$.id`, `$.name`, `$.email`,
  `$.role` (dados do admin seedado), além de `$.token`.
- `frontend/app/(auth)/login/page.test.tsx` (novo, RTL)
  - renderiza os campos de e-mail/senha e o botão de entrar
  - submeter o formulário vazio mostra erro de validação client-side (Zod) e **não** chama
    `signIn`
  - e-mail em formato inválido mostra erro de validação e não chama `signIn`
  - submissão válida chama `signIn("credentials", { email, password, redirect: false })`
  - quando `signIn` retorna erro (credenciais inválidas), mostra mensagem de erro e permanece na
    página
  - quando `signIn` tem sucesso, redireciona (`router.push`) para `/`
- `frontend/lib/auth.test.ts` (existente) — sem alteração de comportamento esperada; já cobre o
  contrato `{id, name, email, token, role}` que o backend vai passar a cumprir.

## 3. O que entra no projeto

1. **Backend** (correção de contrato, não é uma etapa nova — é o que a Etapa 1 do backend deveria
   ter entregado):
   - `LoginResponse` ganha `id`, `name`, `email`, `role` além de `token`.
   - `AuthService.login` passa a montar o `LoginResponse` completo (tem o `User` autenticado em
     mãos) em vez de devolver só a `String` do token.
2. **Dependência nova**: `@hookform/resolvers` (adaptador Zod ↔ React Hook Form) em
   `frontend/package.json`.
3. **`app/(auth)/login/page.tsx`** — formulário real:
   - `FormField` + `Input`/`PasswordInput` do base-ds, `useForm` + `zodResolver` (schema: e-mail
     obrigatório e válido, senha obrigatória).
   - `onSubmit` chama `signIn("credentials", { ...values, redirect: false })`; erro → mensagem via
     `Text color="destructive"`; sucesso → `router.push("/")`.
4. **`app/(auth)/login/page.test.tsx`** — os testes descritos na seção 2 (mock de
   `next-auth/react` e `next/navigation`).
5. Marcar o item `/login` da Etapa 1 em `frontend/plans/roadmap.md` como concluído (`/invite` e
   `/reset-password` continuam em aberto, documentado como dependente de decisão futura do
   backend).

## Descoberta não prevista: segunda manifestação do bug base-ds#38

Ao rodar os testes RTL do `/login` pela primeira vez, `PasswordInput` (que usa `Icon` internamente,
de `lucide-react`) disparou `Invalid hook call` — a mesma causa raiz da issue
[base-ds#38](https://github.com/indianous/base-ds/issues/38) (React duplicado, pois `react`/`react-dom`
estão tanto em `dependencies` quanto em `peerDependencies` do base-ds), só que por um caminho que a
Etapa 0 nunca exercitou (nenhuma tela renderizava um componente que usa `Icon`/`lucide-react`).

O alias já existente em `vitest.config.ts` (`resolve.alias` para `react`/`react-dom`) **não** cobre
esse caso: `lucide-react` faz seu próprio `require('react')` de dentro de
`base-ds/node_modules/lucide-react`, um `require` cru que nunca passa pelo resolver do Vite (só
alias de import processado pelo bundler resolveria; isso é um `require` do Node em tempo de
execução). Tentei `test.server.deps.inline` e `ssr.noExternal` no `vitest.config.ts` — nenhum dos
dois teve efeito.

**Workaround aplicado** (fora do repositório, não commitado): as cópias de `react`/`react-dom` em
`~/dev/node/base-ds/node_modules/` foram substituídas por symlinks apontando para as cópias em
`frontend/node_modules/`, deduplicando fisicamente as duas instâncias de React (eram versões
realmente diferentes: 19.2.7 no base-ds vs. 19.2.8 no frontend). Isso é regenerado/perdido a cada
`npm install` no base-ds — **qualquer pessoa que reinstalar dependências do base-ds vai precisar
refazer os symlinks manualmente até a issue #38 ser corrigida na origem** (mover `react`/`react-dom`
de `dependencies` para só `peerDependencies` no `package.json` do base-ds). Comentário deixado na
issue com esse detalhe: https://github.com/indianous/base-ds/issues/38#issuecomment-5649807253.
