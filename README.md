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
```

## Estrutura

- `packages/core` — lógica do jogo em TS puro: grid hex, pistas, solver, gerador de mapa,
  gerador de puzzle (1 solução garantida), regras de turno, banco de seeds.
- `apps/web` — (fase 3) Preact + Vite.
- `apps/server` — (fase 2) Cloudflare Worker + Durable Object por sala.
