# CargoCalc

Sistema web para planejamento de cargas de transportadoras. Compara peso e volume, recomenda a menor carroceria compatível e distribui cargas que exigem múltiplos veículos.

## Executar

```bash
npm install
npm run dev
```

Acesse `http://localhost:3000`. Sem credenciais do Supabase, o sistema inicia automaticamente com dados demonstrativos mantidos em memória durante a execução.

## Supabase

1. Crie um projeto no Supabase.
2. Execute `supabase/migrations/001_initial_schema.sql` no SQL Editor.
3. Copie `.env.example` para `.env.local` e preencha as três variáveis.
4. Reinicie o servidor de desenvolvimento.

As rotas de API usam a service role somente no servidor. Nunca exponha `SUPABASE_SERVICE_ROLE_KEY` no navegador ou em commits.

## Qualidade

```bash
npm run lint
npm test
npm run build
```

Stack: Next.js App Router, TypeScript, Tailwind CSS, shadcn/ui, Supabase, React Hook Form, Zod e Vitest.
