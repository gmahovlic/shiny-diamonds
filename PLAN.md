# Shiny Diamonds — Plano

> Nome de trabalho anterior: Monsterous (nome do repo/branch). O jogo se chama **Shiny Diamonds**.

Party game de dedução no estilo "ache o tesouro no mapa de hexágonos": um diamante está
escondido numa praia, cada jogador recebe uma pista secreta, o mapa + pistas são gerados automaticamente com **uma única
solução**, todo mundo joga pelo celular/PC e a TV pode entrar na sala só como **display**
do mapa.

> Nome, arte, nomes de terrenos/estruturas e texto das pistas são todos originais.
> Mecânica de jogo em si não é protegida, mas arte/nomes/texto são — então nada de
> reaproveitar nada do jogo original.

---

## 1. Requisitos que mandam na stack

| Requisito | Consequência na stack |
|---|---|
| Rodar em celular, PC **e navegador de TV** | Bundle minúsculo, JS "conservador" (ES2018), SVG em vez de WebGL, sem WebRTC |
| Salas por código / QR | Servidor de estado em tempo real (WebSocket), código curto de 4–5 letras |
| Jogador "display" (TV) | Papel de cliente só-leitura na sala, tela sem interação |
| Geração automática com 1 solução | Gerador + solver em TypeScript puro, determinístico por seed |
| Custo ~zero, pagar só on demand | Serverless + "sleep quando ocioso" de verdade, sem VM ligada 24h |
| Ads + remover ads + contas (futuro) | Deixar hook pra auth/DB/pagamento sem obrigar nada agora |
| Leve e rápido | Sem framework pesado, sem SDK gordo de BaaS no cliente |

---

## 2. Stack escolhida

### Resumo em uma linha
**Preact + Vite (SVG) no front, Cloudflare Workers + Durable Objects (WebSocket com
hibernação) no back, lógica do jogo num pacote TS compartilhado. Tudo na conta Free da
Cloudflare.**

### Front — `apps/web`
- **Preact + TypeScript + Vite.** ~4 KB de runtime, API React, funciona em Chromium
  velho de TV (Tizen/webOS). Signals do Preact pro estado.
- **Mapa em SVG.** Escala em qualquer tela, hit-test de hexágono de graça, zero
  dependência de canvas/WebGL (que é lento ou inexistente em TV).
- **Roteamento mínimo** (3 telas): `/` lobby, `/p/:room` jogador, `/tv/:room` display.
- **QR code** gerado no cliente em SVG (`qrcode-generator`, ~5 KB). Não precisa ler QR
  pela câmera: o QR é só uma URL que a câmera nativa do celular abre.
- **PWA** (`vite-plugin-pwa`): instalável, cache dos assets, abre offline até o lobby.
- **Orçamento de bundle:** < 100 KB gzip no primeiro load. CI falha se passar.
- **Target `es2018`** + `@vitejs/plugin-legacy` só se alguma TV reclamar.
- i18n simples (pt-BR + en) com JSON, sem lib.

### Back / tempo real — `apps/server`
- **Cloudflare Workers** servindo os assets estáticos (grátis, banda ilimitada) +
  **1 Durable Object por sala**.
- O DO é a **fonte da verdade** do estado da sala. Clientes mandam intenções
  (`join`, `start`, `ask`, `search`, `reveal`), o DO valida e faz broadcast do novo
  estado.
- **WebSocket Hibernation API**: sala ociosa não gasta nada; a conexão fica viva mas o
  objeto "dorme". É o que torna o custo ~zero.
- **Storage do DO (SQLite)** guarda o estado da sala — não precisa de banco externo.
- **Alarms do DO** apagam a sala após X horas sem atividade.
- Reconexão: cada cliente recebe um `seatToken` (localStorage). Trocou de aba, travou o
  celular, deu refresh → volta pro mesmo assento. Essencial no mobile.
- Dev: `@cloudflare/vite-plugin` roda Worker + DO + SPA no mesmo `vite dev`.
- Lib opcional: `partyserver` (abstração em cima do DO, da própria Cloudflare). Decidir
  na hora de implementar; DO cru é simples o bastante.

### Lógica do jogo — `packages/core`
TS puro, zero dependências, roda em qualquer lugar (DO, browser, script de build, teste).
- Grid hexagonal (coordenadas axiais), terrenos, estruturas, animais/territórios.
- **Tipos de pista** parametrizados (ex.: "a até N hexes de terreno X",
  "a até N hexes de estrutura Y", "em terreno A ou B", negativas no modo difícil).
- **Solver**: enumera todas as células consistentes com o conjunto de pistas.
- **Gerador**: PRNG com seed → mapa → estruturas → sorteia pistas → solver →
  aceita só se **exatamente 1 célula** sobra. Bônus de qualidade: rejeitar se alguma
  pista for redundante (tirar ela não muda a solução) — garante que todo jogador importa.
- **Tudo determinístico por seed.** Mesmo seed + mesmos parâmetros = mesmo jogo.

#### Truque pra não pagar CPU de geração
O limite de CPU do plano Free é curto. Em vez de gerar no servidor em tempo real:
1. Um script offline (`pnpm gen-bank`) roda o gerador milhares de vezes e guarda **só os
   seeds** que passaram (lista de inteiros, por nº de jogadores e dificuldade). Arquivo
   de alguns KB.
2. Em runtime o DO sorteia um seed do banco e reconstrói o mapa de forma determinística
   (uma passada, sem busca). Microssegundos.
3. Se um dia o limite não for problema, geração on-demand vira um flag.

Vantagem extra: nenhum cliente precisa conhecer o jogo inteiro — o DO manda pra cada
celular **só a pista dele** + o estado público.

### Infra / operação
| Coisa | Escolha | Custo |
|---|---|---|
| Hosting front + API + realtime | Cloudflare Workers + DO (plano Free) | R$ 0 |
| Domínio | `*.workers.dev` grátis; `.com` via Cloudflare Registrar | R$ 0 ou ~R$ 50/ano |
| Deploy | GitHub Actions → `wrangler deploy` | R$ 0 |
| Analytics | Cloudflare Web Analytics (sem cookie, sem banner) | R$ 0 |
| Erros | Sentry free ou só `console` + logs do Worker | R$ 0 |
| Testes | Vitest (core) + Playwright (fluxo de sala, opcional) | R$ 0 |

**Limites do Free que importam** (conferir na doc na hora, muda com frequência):
Workers ~100k req/dia, DO ~100k req/dia + cota de GB-s, 5 GB SQLite. Mensagens de
WebSocket com hibernação contam em proporção reduzida. Se estourar, o **Workers Paid é
US$ 5/mês** e aí sim cobra por uso excedente — é o "pagar beeem pouco on demand".

### Futuro (deixar o caminho, não construir agora)
- **Contas:** Cloudflare D1 (SQLite, free) + login social (Google) com uma lib leve de
  auth. Jogar continua sem conta; conta só pra stats/remover ads.
- **Ads:** AdSense no lobby/fim de partida (nunca na tela da TV nem durante a rodada).
- **Remover ads:** Stripe Checkout one-shot → flag na conta. Sem assinatura.
- Tudo isso cabe no mesmo Worker; nada da stack atual precisa mudar.

---

## 3. Alternativas descartadas (e por quê)

| Opção | Por que não |
|---|---|
| Firebase RTDB / Firestore | SDK pesado no cliente (100 KB+), lock-in, regras de segurança viram o "servidor" e fica chato validar turno |
| Supabase Realtime | Projeto Free pausa após inatividade; lógica autoritativa de sala fica gambiarra |
| Node/Bun em Fly.io / Railway / Render | Precisa de processo ligado; free tiers sumiram ou dormem com cold start ruim |
| PartyKit hospedado | Virou lib (`partyserver`) na sua própria conta CF — ok como lib, não como host |
| Ably / Pusher | Free tier bem limitado em conexões e sem lógica de servidor |
| P2P WebRTC (PeerJS/Trystero) | TV não tem WebRTC, NAT atrapalha, precisa de signaling mesmo assim |
| Colyseus / Nakama | Ótimos, mas precisam de servidor ligado 24h |
| Svelte / Solid no front | Também leves; Preact ganha por compatibilidade com browser velho de TV e ecossistema |

---

## 4. Arquitetura da sala (esboço)

```
celular A ─┐
celular B ─┼─ WebSocket ─► Worker ─► DurableObject "sala ABCD"
celular C ─┤                           ├─ estado autoritativo (SQLite)
TV (display)┘                          ├─ banco de seeds (asset estático)
                                       └─ alarm: limpa sala ociosa
```

**Papéis:** `host` (criou a sala, inicia o jogo), `player`, `display` (TV; só recebe).
Vários displays por sala são permitidos.

**Fluxo:** host cria sala → código `ABCD` + QR → galera entra → TV abre `/tv/ABCD` →
host dá start → DO sorteia seed, manda estado público pra todos e a pista privada pra cada
jogador → rodadas (perguntar / procurar) → DO revela → placar → nova partida mesma sala.

**Protocolo:** JSON, mensagens tipadas em `packages/core/protocol.ts` compartilhadas
entre cliente e servidor (sem gerar código, só tipos).

---

## 4b. Tela do jogador e ferramentas auxiliares

**Cada jogador vê o mapa completo** no celular: é o mesmo componente SVG da TV, em modo
interativo. O DO faz broadcast do estado público (mapa, estruturas, cubos/discos jogados,
de quem é a vez) pra todos; a TV só não recebe a pista privada. Zoom/pan por gesto pra
tela pequena.

**Ferramentas, em duas camadas:**

1. **Anotações privadas — só no cliente, custo zero no servidor**
   - Marcar hex como "impossível / possível / dúvida".
   - Notas por oponente ("Bia não é floresta", "Léo talvez seja pedra ≤ 2").
   - Histórico das jogadas da partida (quem pôs o quê onde).
   - Salvo em localStorage por `sala+assento`. Opcional: sync pro DO junto com o
     `seatToken` (poucos bytes) pra sobreviver a troca de aparelho.

2. **Dedução assistida — roda no cliente usando `packages/core`**
   - Todo cubo/disco jogado é informação pública, então o solver calcula pra cada
     oponente **quais tipos de pista ainda são compatíveis** com o que ele jogou.
   - Com isso dá pra pintar o mapa: "pelas pistas possíveis dos outros, estes hexes já
     caíram". Isso é exatamente o que um jogador experiente faz na cabeça.
   - Níveis configuráveis pelo host na sala:
     - **Hardcore:** nada, só o mapa.
     - **Normal:** anotações manuais + histórico + lista de pistas possíveis por oponente.
     - **Casual/família:** auto-eliminação completa com destaque no mapa.
   - Nada disso toca o servidor; é tudo cálculo local em cima do estado que já chega.

Regra de ouro: ferramentas nunca revelam informação que não seja pública. O cliente
só conhece a própria pista + o estado público, então mesmo abrindo o devtools não dá
pra trapacear.

---

## 4c. Animações

Sem lib pesada: **SVG + CSS transitions/keyframes + Web Animations API**. Se precisar
orquestrar sequência (reveal), `motion` (versão mini, ~3 KB). Framer Motion e GSAP
estouram o orçamento de bundle.

**Regra pra TV:** animar só `transform` e `opacity` (GPU). Nada de `filter`, sombras
animadas ou centenas de nós mexendo juntos.

Onde vale:
- Peça caindo no hex (squash/bounce) + highlight do hex jogado.
- Indicador de turno pulsando no jogador da vez (TV e celular).
- Auto-eliminação: hexes apagando em cascata quando a dedução assistida corta.
- **Reveal final como cena** na TV: pista por pista, hexes caindo, última célula brilha,
  diamante aparece brilhando. Momento party game.
- Intro do mapa montando hex por hex.
- Feedback de busca falha: shake + cubo preto.

Regras:
- `prefers-reduced-motion` respeitado; toggle na sala: cheia / leve / off.
- **Servidor nunca espera animação.** Estado chega, cada cliente anima a diferença
  entre estado antigo e novo no próprio ritmo. Celular lento não trava a sala.
- Animações viram parte do design desde o primeiro componente do mapa (não é polish
  de última hora) — mas a cena de reveal é fase 4.

---

## 5. Estrutura do repo (pnpm workspaces)

```
monsterous/
  packages/core/     # grid, pistas, solver, gerador, protocolo — zero deps
  apps/web/          # Preact + Vite (lobby, jogador, display)
  apps/server/       # Worker + Durable Object + wrangler.jsonc
  scripts/gen-bank   # gera o banco de seeds offline
  .github/workflows  # test + deploy
```

---

## 6. Roadmap

0. **Setup** — monorepo, lint/format, Vitest, Actions com deploy pra CF.
1. **Core** — grid, terrenos, estruturas, pistas, solver, gerador, banco de seeds,
   testes (incluindo "todo seed do banco tem exatamente 1 solução").
2. **Server** — DO de sala, protocolo, join/reconnect, ciclo de partida, alarm de limpeza.
3. **Web** — lobby (criar/entrar/QR), tela do jogador, tela da TV, responsivo, i18n.
4. **Polish** — arte própria, PWA, sons, dificuldades, analytics, teste em TV de verdade.
5. **Depois** — contas (D1), ads, remover ads (Stripe), stats.

---

## 7. Decisões fechadas de design

| Item | Decisão |
|---|---|
| Jogadores | **2 a 5**. Com 3–5, uma pista por jogador. Com **2, cada um segura 2 pistas** e responde pela combinação (default; ajustar testando). |
| Tema | **Praia / caça ao tesouro.** O alvo é um diamante escondido. |
| Terrenos (5) | **mar, areia, palmeiras, calçada, rua** (grama descartada pra manter 5 tipos) |
| Territórios (2) | **gaivotas** e **caranguejos** (áreas contornadas no mapa) |
| Estruturas (2 tipos) | **quiosques** e **barracas**, em 4 cores; a 4ª cor só no modo difícil |
| Mapa | 12 × 9 = 108 hexes, gerado inteiro (sem peças); gerador cria biomas em blocos pra parecer praia |
| Pistas | Mesmas famílias do original, com texto próprio: a até N de terreno X / de território / de tipo de estrutura / de cor de estrutura; "em A ou B"; negativas no modo difícil |
| Identidade visual | Paleta solar (azul-mar, areia, verde-palmeira, cinza-calçada, asfalto), tipografia arredondada, peças = diamantes/conchas |

**Ainda em aberto (decide na implementação):** `partyserver` vs DO cru; quantidade
exata de estruturas por cor e tamanho mínimo de bioma (vai sair do tuning do gerador).

---

## 8. Setup fora do código (checklist)

**Antes do primeiro deploy (fase 2):**
- [x] Conta Cloudflare (free, sem cartão) + ativar subdomínio `*.workers.dev`.
- [x] Anotar o Account ID.
- [x] API Token com template "Edit Cloudflare Workers".
- [x] Secrets no GitHub Actions: `CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID`.

**Máquina local:** Node 20+, pnpm (`corepack enable`), `wrangler login` (opcional).

**Opcional / depois:** domínio próprio (Cloudflare Registrar), Cloudflare Web
Analytics (token no index), Sentry.

**Status:** Cloudflare + secrets configurados. Decisões de design fechadas (seção 7).
Pronto pra fase 0/1.
