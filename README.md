# Shiny Diamonds

Party game de dedução: um diamante está escondido numa praia de hexágonos, cada jogador
tem uma pista secreta, e a galera joga pelo celular com o mapa na TV.

Plano completo em [PLAN.md](./PLAN.md).

## Dev

```sh
pnpm install
pnpm test        # vitest
pnpm lint        # biome
pnpm typecheck
pnpm gen-bank    # regenera o banco de seeds (packages/core/src/bank.json)
pnpm --filter @shiny/server dev   # worker + Durable Object local em :8787
```

Deploy: push na `main` roda lint/typecheck/test e faz `wrangler deploy` (secrets
`CLOUDFLARE_API_TOKEN` e `CLOUDFLARE_ACCOUNT_ID` no GitHub).

## Estrutura

- `packages/core` — lógica do jogo em TS puro: grid hex, pistas, solver, gerador de mapa,
  gerador de puzzle (1 solução garantida), regras de turno, banco de seeds.
- `apps/web` — (fase 3) Preact + Vite.
- `apps/server` — Cloudflare Worker + 1 Durable Object por sala (WebSocket com hibernação,
  bots por alarm, sala pura e testável em `room.ts`).
