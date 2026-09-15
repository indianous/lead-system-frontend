# Plano — Frontend Etapa 3: Catálogo de Produtos

> Referência: `frontend/plans/roadmap.md` (Etapa 3), `00-documentation/04-rotas-e-telas.md`
> (`/products`, `/products/new`, `/products/[id]/edit`), `backend/plans/2026-09-12-etapa-2-catalogo-produtos.md`
> (contrato de `Product`, já implementado e commitado).
>
> Depende só da Etapa 2 do backend (já concluída) — não depende da Etapa 3 do backend (Leads).

## 1. Problemas encontrados

- `types/api.ts` só tem os tipos de `User`/`Role` (Etapa 2) — faltam `ProductType`,
  `ProductResponse`, `CreateProductRequest`, `UpdateProductRequest`, espelhando os DTOs do
  backend.
- Preço é armazenado em centavos no backend (`minPriceCents`/`maxPriceCents`), mas o formulário
  deve exibir/editar em reais — conversão é responsabilidade da camada de apresentação (mesma
  regra de `03-entidades.md`). O `base-ds` não tem um input de moeda dedicado, mas `Input`
  (`type="number"`, `step="0.01"`) já cobre entrada numérica genuína — não é um gap de componente,
  então a conversão fica num helper próprio (`lib/money.ts`), sem abrir issue no `base-ds`.
- `min_price_cents`/`max_price_cents` são opcionais (produto personalizado pode não ter faixa
  fechada) — os campos de preço do formulário precisam aceitar vazio, sem forçar `0`.
- Mesmo gap já identificado e aceito na Etapa 2 (`/users`): a sessão do NextAuth não carrega as
  `permissions` do usuário — `/products` é livre a qualquer autenticado, mas `/products/new` e
  `/products/[id]/edit` exigem `EDIT_CATALOG` só no backend. O botão "Novo produto"/link "Editar"
  aparecem para todos; quem não tem a permissão recebe 403 do backend ao submeter, exibido inline
  (mesmo padrão do erro 409 em `CreateUserForm`).
- `app/(app)/products/{page,new/page,[id]/edit/page}.tsx` já existem como placeholder da Etapa 0
  e precisam ser substituídos (mesma situação de `/users*` na Etapa 2).

## 2. Testes a incluir/alterar (agrupados por arquivo)

- `lib/money.test.ts` (novo) — `centsToReaisInput`: `150000` → `"1500.00"`, `null`/`undefined` →
  `""`; `reaisInputToCents`: `"1500.00"`/`"1500,00"` → `150000`, `""` → `null`, arredonda
  centavos fracionários.
- `components/forms/CreateProductForm.test.tsx` (novo) — validação client-side (nome e tipo
  obrigatórios, `minPrice > maxPrice` quando os dois informados), converte os preços em reais
  digitados para centavos ao chamar a mutação, mostra erro de permissão (403) vindo da API,
  redireciona para `/products` no sucesso.
- `components/forms/EditProductForm.test.tsx` (novo) — carrega dados do produto (nome/tipo/
  descrição/preços já convertidos para reais/ativo), alterna `active` via `Switch`, chama a
  mutação de atualização com o payload certo (de volta em centavos), redireciona para `/products`
  no sucesso.
- `app/(app)/products/page.test.tsx` (novo) — mostra `Skeleton` durante o carregamento, renderiza
  a tabela com os produtos retornados (nome, tipo, faixa de preço formatada, status).

## 3. O que entra no projeto

1. **`types/api.ts`** (edita) — adiciona `ProductType` (`"READY_MADE" | "CUSTOM"`),
   `ProductResponse`, `CreateProductRequest`, `UpdateProductRequest`.
2. **`lib/money.ts`** (novo, + teste) — `centsToReaisInput(cents)`/`reaisInputToCents(value)`,
   únicas funções de conversão usadas pelos dois formulários.
3. **`lib/queries/products.ts`** (novo) — `useProducts()`, `useProduct(id)`, `useCreateProduct()`,
   `useUpdateProduct(id)`, mesmo padrão de `lib/queries/users.ts`.
4. **`components/forms/CreateProductForm.tsx`** (+ teste) — nome (`Input`), tipo (`Select` com
   `READY_MADE`→"Pronto"/`CUSTOM`→"Personalizado"), descrição (`Textarea`), preço mínimo/máximo em
   reais (`Input` numérico, opcionais), valida `min ≤ max` via Zod (`superRefine`, mesmo padrão de
   `@AssertTrue` do backend).
5. **`components/forms/EditProductForm.tsx`** (+ teste) — mesmos campos + `Switch` de `active`
   via `Controller` (mesmo padrão de `EditUserForm`); carrega o produto atual com `useProduct(id)`.
6. **`app/(app)/products/page.tsx`** (+ teste) — `Table` do base-ds com nome/tipo/faixa de preço
   (formatada em R$)/status (`Badge`), botão "Novo produto" (→ `/products/new`), link "Editar" por
   linha (→ `/products/[id]/edit`); estados de carregamento (`Skeleton`) e erro (403 → mensagem de
   permissão, mesmo padrão de `/users`).
7. **`app/(app)/products/new/page.tsx`** — layout + `<CreateProductForm />`.
8. **`app/(app)/products/[id]/edit/page.tsx`** — Server Component que resolve `params.id`
   (`Promise`, Next 16) e repassa para `<EditProductForm productId={id} />`.
9. Marcar a Etapa 3 em `frontend/plans/roadmap.md` como concluída ao final.
