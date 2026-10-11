import { COLORS, STRUCTURE_KINDS, TERRAINS, TERRITORIES } from "@shiny/core";
import { COLOR_NAME, STRUCTURE_NAME, TERRAIN_NAME, TERRITORY_NAME } from "../strings";
import { STRUCT_FILL, TERRAIN_FILL } from "./HexMap";
import { MapDefs } from "./MapDefs";

function Swatch(p: { fill: string; palm?: boolean }) {
  return (
    <svg viewBox="-12 -12 24 24" class="sw" aria-hidden="true">
      <polygon
        points="12,0 6,10.4 -6,10.4 -12,0 -6,-10.4 6,-10.4"
        fill={p.fill}
        stroke="#0b2a3b"
        stroke-width="1"
      />
      {p.palm && <use href="#s-palm" x="-9" y="-10" width="18" height="18" />}
    </svg>
  );
}

function Icon(p: { href: string; color?: string }) {
  return (
    <svg
      viewBox="-12 -12 24 24"
      class="sw"
      aria-hidden="true"
      style={p.color ? `color:${p.color}` : undefined}
    >
      <use href={p.href} x="-12" y="-12" width="24" height="24" />
    </svg>
  );
}

/** Rules + taxonomy sheet. */
export function Rules(p: { hard: boolean; onClose: () => void }) {
  return (
    // biome-ignore lint/a11y/noStaticElementInteractions: backdrop closes on outside click/Escape; the close button is the accessible control.
    <div
      class="modal-backdrop"
      onClick={(e) => e.target === e.currentTarget && p.onClose()}
      onKeyDown={(e) => e.key === "Escape" && p.onClose()}
    >
      <section class="modal" role="dialog" aria-modal="true" aria-label="Regras e taxonomia">
        <svg width="0" height="0" style="position:absolute" aria-hidden="true">
          <MapDefs />
        </svg>
        <header>
          <h2>Regras & taxonomia</h2>
          <button type="button" class="x" aria-label="fechar" onClick={p.onClose}>
            ×
          </button>
        </header>

        <h3>Como jogar</h3>
        <ul class="rules">
          <li>
            Um diamante tá escondido num hex. Só existe <strong>um</strong> hex que bate com todas
            as pistas juntas.
          </li>
          <li>
            Cada jogador tem uma pista secreta
            {p.hard ? " (no difícil, pode ser negativa: “NÃO está…”)" : ""}. Preparação: cada um
            coloca 2 cubos em hexes que a própria pista rejeita.
          </li>
          <li>
            <strong>Perguntar:</strong> escolha um hex e um jogador. Ele responde na hora: disco = a
            pista dele aceita o hex, cubo = rejeita. Se vier cubo, você coloca um cubo seu em algum
            hex que sua pista rejeita.
          </li>
          <li>
            <strong>Procurar:</strong> escolha um hex que sua pista aceita. Todo mundo responde em
            ordem. Se todos aceitarem, achou e venceu. O primeiro cubo interrompe, e você paga um
            cubo.
          </li>
          <li>
            Disco = SIM, cubo = NÃO. Tudo que tá na mesa é informação pública. Nunca se pode
            procurar num hex com cubo.
          </li>
        </ul>

        <h3>Terrenos</h3>
        <ul class="legend">
          {TERRAINS.map((t) => (
            <li key={t}>
              <Swatch fill={TERRAIN_FILL[t]} palm={t === "palms"} /> {TERRAIN_NAME[t]}
            </li>
          ))}
        </ul>

        <h3>Territórios</h3>
        <ul class="legend">
          {TERRITORIES.map((t) => (
            <li key={t}>
              <Icon href={t === "gulls" ? "#s-gull" : "#s-crab"} /> {TERRITORY_NAME[t]}{" "}
              <span class="muted">(hexes tracejados)</span>
            </li>
          ))}
        </ul>

        <h3>Estruturas</h3>
        <ul class="legend">
          {STRUCTURE_KINDS.map((k) => (
            <li key={k}>
              <Icon href={k === "kiosk" ? "#s-kiosk" : "#s-tent"} color="#2457ff" />{" "}
              {STRUCTURE_NAME[k]}
            </li>
          ))}
          {COLORS.slice(0, p.hard ? 4 : 3).map((c) => (
            <li key={c}>
              <span class="colordot" style={`background:${STRUCT_FILL[c]}`} /> {COLOR_NAME[c]}
            </li>
          ))}
        </ul>
        <p class="muted">
          Cada cor tem exatamente um quiosque e uma barraca.
          {p.hard ? " A cor preta só aparece no modo difícil." : ""}
        </p>

        <h3>Tipos de pista</h3>
        <ul class="rules">
          <li>
            O diamante está em <em>terreno A</em> ou em <em>terreno B</em> (10 combinações)
          </li>
          <li>
            O diamante está a até 1 hex de <em>terreno</em> (5)
          </li>
          <li>O diamante está a até 1 hex de um território, gaivotas ou caranguejos (1)</li>
          <li>
            O diamante está a até 2 hexes de <em>gaivotas</em> / de <em>caranguejos</em> (2)
          </li>
          <li>
            O diamante está a até 2 hexes de um <em>quiosque</em> / de uma <em>barraca</em> (2)
          </li>
          <li>
            O diamante está a até 3 hexes de uma estrutura{" "}
            <em>azul / branca / verde{p.hard ? " / preta" : ""}</em> ({p.hard ? 4 : 3})
          </li>
          {p.hard && (
            <li>No difícil, qualquer pista acima pode vir negada: “O diamante NÃO está…”</li>
          )}
        </ul>
        <p class="muted">
          Dica: “a até N hexes” conta o próprio hex. Um hex de areia está a 0 de areia.
        </p>
      </section>
    </div>
  );
}
