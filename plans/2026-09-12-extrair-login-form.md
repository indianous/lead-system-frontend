# Plano — Extrair formulário de login para `components/forms/`

## 1. Problemas encontrados

- `app/(auth)/login/page.tsx` mistura rota e formulário: schema Zod, `useForm`, chamada a
  `signIn` e todo o JSX do form vivem dentro do componente de página, em vez de um componente
  de formulário reaproveitável.
- `frontend/components/` só tem `app-navbar.tsx`, `app-sidebar.tsx`, `logout-button.tsx` soltos
  na raiz — não há uma subpasta para agrupar formulários (útil já que Etapas futuras trazem mais
  formulários: `/users/new`, `/products/new` etc.).

## 2. Testes a incluir/alterar

- Mover `app/(auth)/login/page.test.tsx` → `components/forms/LoginForm.test.tsx`, testando o
  componente `LoginForm` diretamente em vez da página. Os 6 casos de teste continuam os mesmos
  (só troca o alvo do `render`/import); nenhum caso novo.
- `page.tsx` fica simples o bastante (só layout + `<LoginForm />`) para não precisar de teste
  próprio — mesmo padrão das demais páginas da Etapa 0.

## 3. O que entra no projeto

- `frontend/components/forms/LoginForm.tsx` (novo) — todo o conteúdo funcional hoje em
  `page.tsx` (schema, `useForm`, `onSubmit`, JSX do `<form>`), exportado como componente
  `LoginForm`.
- `frontend/components/forms/LoginForm.test.tsx` (novo, conteúdo migrado de
  `app/(auth)/login/page.test.tsx`).
- `app/(auth)/login/page.tsx` — reduzido para o heading + `<LoginForm />`.
- Remove `app/(auth)/login/page.test.tsx` (migrado).
