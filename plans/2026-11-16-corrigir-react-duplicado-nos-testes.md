# Plano — Corrigir React duplicado nos testes (lucide-react do base-ds)

> Ref.: issue [base-ds#38](https://github.com/indianous/base-ds/issues/38) (React duplicado no
> `base-ds` linkado via `file:`), `vitest.config.ts` (alias de `react`/`react-dom` criado na
> Etapa 0). Bloqueia a validação da Etapa 5 (central de mensagens), ainda não commitada.

---

## 1. Problemas encontrados

1. **`npm test` falha: 21 de 88 testes, em 7 de 21 arquivos.** Os arquivos afetados são
   `components/forms/LoginForm.test.tsx` (6/6), `components/forms/CreateUserForm.test.tsx` (4/4),
   `app/(app)/leads/page.test.tsx` (4/4), `components/ConversationThreadPane.test.tsx` (3/4),
   `components/forms/CreateLeadForm.test.tsx` (2/4), `components/forms/EditLeadForm.test.tsx` (1/4)
   e `components/forms/UpdateLeadStatusForm.test.tsx` (1/4). Todos falham pelo mesmo erro:

   ```
   TypeError: Cannot read properties of null (reading 'useContext')
    ❯ useLucideContext ../../../node/base-ds/node_modules/lucide-react/...
    ❯ ../../../node/base-ds/node_modules/react/cjs/react.development.js
   ```

   Essas falhas também atingem etapas já commitadas (Etapas 1 a 4), não só o código novo da Etapa 5.
   O backend não é afetado: os 144 testes dele passam.

2. **Diagnóstico: existem duas cópias de React.** O `base-ds` é consumido via
   `"base-ds": "file:../../../node/base-ds"`, então as dependências dele são resolvidas a partir de
   `../../../node/base-ds/node_modules`. Essa pasta tem React 19.3.0 próprio, enquanto o frontend
   usa 19.2.8, e também tem `lucide-react` 1.23.0, que o frontend nem tem instalado. O alias de
   `react`/`react-dom` em `vitest.config.ts:10-13` só vale para os módulos que o Vite processa. O
   `lucide-react` é externalizado (o Node nativo carrega o pacote), e por isso o `require("react")`
   dele cai na cópia do `base-ds`. O ícone chama `useContext` (`LucideContext`) com um React
   diferente daquele que está renderizando, e o resultado é o `null` acima. Só falham os testes que
   renderizam algum ícone (toast, select, composer do chat etc.), e isso explica por que alguns
   arquivos falham só em parte.

3. **Hipóteses testadas sem alterar o projeto.** Rodei variações com um config temporário no
   scratchpad, que estende o `vitest.config.ts` via `mergeConfig`:

   | Variação | Resultado |
   |---|---|
   | `test.server.deps.inline: ["base-ds", "lucide-react"]` | 21 falhas (sem mudança) |
   | o mesmo + `resolve.dedupe: ["react", "react-dom"]` | 21 falhas |
   | `test.server.deps.inline: true` | 21 falhas |
   | `test.deps.optimizer.web` com `include` dos dois pacotes | 7 arquivos falhando (outro erro) |
   | **`test.deps.optimizer.client` com `enabled: true, include: ["base-ds", "lucide-react"]`** | **88/88 passando** |

   O pré-bundle do optimizer (esbuild) aplica o alias de `react` dentro do bundle de
   `base-ds` + `lucide-react`, e com isso sobra uma única cópia de React.

4. **A causa raiz continua no `base-ds`** (packaging: `react`/`react-dom` instalados nas
   `node_modules` do pacote linkado). O ajuste aqui é um workaround local do frontend, no mesmo
   espírito do alias que já existe. Pela regra do `CLAUDE.md`, a necessidade precisa ficar
   registrada no `base-ds`: comentar na issue #38 que o problema reapareceu via `lucide-react`
   (hooks em `LucideContext`), já que o alias de `react` não cobre dependências externalizadas.

5. **Fora do escopo:** o `next dev`/`next build` (Turbopack/webpack) não são afetados por esta
   config, que é só do Vitest. Verificar se o app rodando também sofre com React duplicado fica a
   cargo do usuário (verificação visual é feita por ele, conforme o `CLAUDE.md` da raiz).

## 2. Testes a incluir/alterar

- **Nenhum teste novo nem alterado.** A mudança é de configuração de teste. O critério de aceite é
  a suíte existente: `npm test` precisa passar com **88/88 testes em 21/21 arquivos**, incluindo os
  testes ainda não commitados da Etapa 5 (`ConversationChatView.test.tsx`,
  `ConversationThreadPane.test.tsx`, `lib/realtime.test.ts`, caso novo em `LeadDetailView.test.tsx`).
- Rodar também `npm run lint` para garantir que o `vitest.config.ts` alterado continua limpo.

## 3. O que entra no projeto

- **`vitest.config.ts`**: adicionar em `test` o bloco abaixo, com um comentário curto no mesmo
  estilo do comentário do alias, explicando o porquê e apontando para base-ds#38:

  ```ts
  deps: {
    optimizer: {
      client: { enabled: true, include: ["base-ds", "lucide-react"] },
    },
  },
  ```

  O alias de `react`/`react-dom` continua lá, porque o optimizer depende dele para apontar para a
  cópia do frontend.
- **Issue base-ds#38**: comentar com o diagnóstico (lucide-react 1.23 → `useContext` → React
  duplicado sob link `file:`) e o workaround adotado. Isso é uma ação externa (comentário público
  no GitHub), então só faço com a sua confirmação.
- **`plans/roadmap.md`**: registrar o workaround na Etapa 5, junto do commit dela.
- **Sem mudanças em:** tipos, componentes, páginas, `package.json` (nenhuma dependência nova) e
  backend.
