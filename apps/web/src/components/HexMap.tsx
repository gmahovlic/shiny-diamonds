import {
  type BeachMap,
  type Cell,
  COLS,
  colOf,
  type Marker,
  ROWS,
  rowOf,
  type Terrain,
} from "@shiny/core";
import type { Note } from "../notes";
import { seatColor } from "../strings";
import { MapDefs } from "./MapDefs";

export const R = 20;
const SQ3 = Math.sqrt(3);
export const MAP_W = R * (1.5 * (COLS - 1) + 2);
export const MAP_H = SQ3 * R * (ROWS + 0.5);

export const hexCenter = (c: Cell): [number, number] => {
  const col = colOf(c);
  const row = rowOf(c);
  return [R * 1.5 * col + R, SQ3 * R * (row + 0.5 * (col & 1)) + (SQ3 * R) / 2];
};

const HEX_POINTS = Array.from({ length: 6 }, (_, i) => {
  const a = (Math.PI / 3) * i;
  return `${(R * Math.cos(a)).toFixed(2)},${(R * Math.sin(a)).toFixed(2)}`;
}).join(" ");

export const TERRAIN_FILL: Record<Terrain, string> = {
  sea: "url(#p-sea)",
  sand: "url(#p-sand)",
  palms: "url(#p-palms)",
  boardwalk: "url(#p-boardwalk)",
  street: "url(#p-street)",
};

export const STRUCT_FILL = {
  blue: "#2457ff",
  white: "#f7f7f7",
  green: "#2bb24c",
  black: "#1a1a1a",
} as const;

/** Offsets for up to 5 seat markers inside one hex. */
const MARKER_POS: [number, number][] = [
  [0, -0.55],
  [0.52, -0.17],
  [0.32, 0.45],
  [-0.32, 0.45],
  [-0.52, -0.17],
];

export const cellLabel = (c: Cell): string =>
  `${String.fromCharCode(65 + colOf(c))}${rowOf(c) + 1}`;

export interface HexMapProps {
  map: BeachMap;
  markers: Marker[];
  selected?: Cell | null;
  /** Cells to dim (assist: impossible / illegal). */
  dimmed?: ReadonlySet<Cell> | undefined;
  /** Cells to highlight (assist: certain). */
  glow?: ReadonlySet<Cell> | undefined;
  notes?: Record<number, Note> | undefined;
  solution?: Cell | null;
  onCell?: ((c: Cell) => void) | undefined;
  intro?: boolean;
  class?: string;
}

export function HexMap(p: HexMapProps) {
  const byCell = new Map<Cell, Marker[]>();
  for (const m of p.markers) {
    const list = byCell.get(m.cell);
    if (list) list.push(m);
    else byCell.set(m.cell, [m]);
  }
  const cells = Array.from({ length: COLS * ROWS }, (_, i) => i);
  const sym = R * 1.3;

  return (
    <svg
      class={`hexmap ${p.onCell ? "interactive" : ""} ${p.class ?? ""}`}
      viewBox={`0 0 ${MAP_W} ${MAP_H}`}
      role={p.onCell ? "grid" : "img"}
      aria-label="mapa da praia"
    >
      <title>Mapa da praia</title>
      <MapDefs />
      <g class="terrain">
        {cells.map((c) => {
          const [x, y] = hexCenter(c);
          const t = p.map.terrain[c] as Terrain;
          const terr = p.map.territory[c];
          const dim = p.dimmed?.has(c);
          const sel = p.selected === c;
          const glow = p.glow?.has(c);
          return (
            // biome-ignore lint/a11y/noStaticElementInteractions: SVG <g> is the only hit target; role/tabIndex/keyboard are set when interactive.
            <g
              key={c}
              transform={`translate(${x.toFixed(2)} ${y.toFixed(2)})`}
              class={`hex ${sel ? "sel" : ""} ${glow ? "glow" : ""}`}
              role={p.onCell ? "gridcell" : undefined}
              tabIndex={p.onCell ? 0 : undefined}
              onClick={p.onCell ? () => p.onCell?.(c) : undefined}
              onKeyDown={
                p.onCell ? (e) => (e.key === "Enter" || e.key === " ") && p.onCell?.(c) : undefined
              }
            >
              <g
                class={p.intro ? "hex-in" : undefined}
                style={
                  p.intro
                    ? `animation-delay:${(c % COLS) * 35 + Math.floor(c / COLS) * 25}ms`
                    : undefined
                }
              >
                <polygon points={HEX_POINTS} fill={TERRAIN_FILL[t]} class="tile" />
                {t === "palms" && (
                  <use href="#s-palm" x={-sym / 2} y={-sym / 2 - 2} width={sym} height={sym} />
                )}
                {terr && (
                  <>
                    <polygon
                      points={HEX_POINTS}
                      transform="scale(0.82)"
                      fill="none"
                      stroke={terr === "gulls" ? "#ffffff" : "#ff4d4d"}
                      stroke-width={2.2}
                      stroke-dasharray="4 3"
                      class="territory"
                    />
                    <use
                      href={terr === "gulls" ? "#s-gull" : "#s-crab"}
                      x={-R * 0.42}
                      y={-R * 0.42}
                      width={R * 0.84}
                      height={R * 0.84}
                    />
                  </>
                )}
                {dim && <polygon points={HEX_POINTS} fill="#06131b" opacity="0.72" class="dim" />}
                {p.notes?.[c] === 1 && (
                  <path
                    d={`M${-R * 0.4} ${-R * 0.4} L${R * 0.4} ${R * 0.4} M${R * 0.4} ${-R * 0.4} L${-R * 0.4} ${R * 0.4}`}
                    stroke="#ff3b3b"
                    stroke-width="3.5"
                    stroke-linecap="round"
                  />
                )}
                {p.notes?.[c] === 2 && (
                  <text
                    y={R * 0.32}
                    text-anchor="middle"
                    font-size={R * 0.95}
                    font-weight="800"
                    fill="#ffd166"
                    stroke="#0b2a3b"
                    stroke-width="0.8"
                  >
                    ?
                  </text>
                )}
              </g>
            </g>
          );
        })}
      </g>
      <g class="structures">
        {p.map.structures.map((s) => {
          const [x, y] = hexCenter(s.cell);
          const k = R * 1.5;
          return (
            <use
              key={`${s.kind}-${s.color}`}
              href={s.kind === "kiosk" ? "#s-kiosk" : "#s-tent"}
              x={x - k / 2}
              y={y - k / 2}
              width={k}
              height={k}
              style={`color:${STRUCT_FILL[s.color]}`}
              class="structure"
            />
          );
        })}
      </g>
      <g class="markers">
        {cells.flatMap((c) => {
          const list = byCell.get(c);
          if (!list) return [];
          const [x, y] = hexCenter(c);
          return list.map((m) => {
            const [dx, dy] = MARKER_POS[m.seat % MARKER_POS.length] as [number, number];
            const mx = x + dx * R;
            const my = y + dy * R;
            const r = R * 0.25;
            const col = seatColor(m.seat);
            return m.kind === "disc" ? (
              <circle
                key={`${m.seat}-${c}`}
                cx={mx}
                cy={my}
                r={r}
                fill={col}
                stroke="#0b2a3b"
                stroke-width="1.4"
                class="marker pop"
              />
            ) : (
              <rect
                key={`${m.seat}-${c}`}
                x={mx - r}
                y={my - r}
                width={r * 2}
                height={r * 2}
                rx={2}
                fill={col}
                stroke="#0b2a3b"
                stroke-width="1.4"
                class="marker pop"
              />
            );
          });
        })}
      </g>
      {p.solution !== null &&
        p.solution !== undefined &&
        (() => {
          const [x, y] = hexCenter(p.solution);
          const d = R * 1.7;
          return (
            <g transform={`translate(${x} ${y})`}>
              <g class="diamond">
                <circle r={R * 1.15} fill="#7be0ff" opacity="0.4" class="diamond-halo" />
                <use href="#s-diamond" x={-d / 2} y={-d / 2} width={d} height={d} />
              </g>
            </g>
          );
        })()}
    </svg>
  );
}
