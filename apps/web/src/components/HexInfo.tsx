import type { Cell, GameView } from "@shiny/core";
import { cycleNote, type Note } from "../notes";
import { COLOR_NAME, STRUCTURE_NAME, seatColor, TERRAIN_NAME, TERRITORY_NAME } from "../strings";
import { cellLabel, hexCenter, MAP_H, MAP_W } from "./HexMap";

export interface HexInfoProps {
  game: GameView;
  cell: Cell;
  note: Note | undefined;
  canNote: boolean;
  mode: "cube" | "act" | "wait" | "over";
  cubeLegal: boolean;
  opponents: { seat: number; name: string }[];
  onAsk: (target: number) => void;
  onSearch: () => void;
  onCube: () => void;
  onClose: () => void;
}

/** Popover anchored to a hex: what is there, who marked it, and the actions available now. */
export function HexInfo(p: HexInfoProps) {
  const { game, cell } = p;
  const [x, y] = hexCenter(cell);
  const px = (x / MAP_W) * 100;
  const py = (y / MAP_H) * 100;
  const below = py < 35;
  const tx = px < 30 ? "-12%" : px > 70 ? "-88%" : "-50%";
  const style = `left:${px.toFixed(2)}%;top:${py.toFixed(2)}%;transform:translate(${tx},${below ? "14px" : "calc(-100% - 14px)"})`;

  const terrain = game.map.terrain[cell];
  const territory = game.map.territory[cell];
  const structure = game.map.structures.find((s) => s.cell === cell);
  const marks = game.markers.filter((m) => m.cell === cell);

  return (
    <div
      class={`hexinfo ${below ? "below" : "above"} ${px < 30 ? "left" : px > 70 ? "right" : ""}`}
      style={style}
    >
      <header>
        <strong>{cellLabel(cell)}</strong>
        <span class="t">{terrain ? TERRAIN_NAME[terrain] : ""}</span>
        <button type="button" class="x" aria-label="fechar" onClick={p.onClose}>
          ×
        </button>
      </header>
      <ul class="facts">
        {territory && <li>Território: {TERRITORY_NAME[territory]}</li>}
        {structure && (
          <li>
            {STRUCTURE_NAME[structure.kind]} {COLOR_NAME[structure.color]}
          </li>
        )}
        {marks.length > 0 && (
          <li class="marks">
            {marks.map((m) => (
              <span key={m.seat} class="mark">
                <i class={m.kind} style={`background:${seatColor(m.seat)}`} />
                {game.seats[m.seat]?.name}: {m.kind === "disc" ? "sim" : "não"}
              </span>
            ))}
          </li>
        )}
        {marks.length === 0 && !territory && !structure && (
          <li class="muted">Nada por aqui ainda.</li>
        )}
      </ul>
      <div class="actions">
        {p.mode === "act" && (
          <>
            {p.opponents.map((o) => (
              <button
                type="button"
                key={o.seat}
                class="btn small"
                style={`border-color:${seatColor(o.seat)}`}
                onClick={() => p.onAsk(o.seat)}
              >
                Perguntar a {o.name}
              </button>
            ))}
            <button type="button" class="btn small primary" onClick={p.onSearch}>
              🔎 Procurar aqui
            </button>
          </>
        )}
        {p.mode === "cube" && (
          <button
            type="button"
            class="btn small primary"
            disabled={!p.cubeLegal}
            onClick={p.onCube}
          >
            {p.cubeLegal ? "Colocar cubo aqui" : "Sua pista diz SIM aqui"}
          </button>
        )}
        {p.canNote && (
          <button type="button" class="btn small ghost" onClick={() => cycleNote(cell)}>
            {p.note === 1 ? "✕ marcado · trocar" : p.note === 2 ? "? marcado · limpar" : "✏️ marcar"}
          </button>
        )}
      </div>
    </div>
  );
}
