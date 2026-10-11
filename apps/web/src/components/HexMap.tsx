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

const R = 20;
const SQ3 = Math.sqrt(3);
const W = R * (1.5 * (COLS - 1) + 2);
const H = SQ3 * R * (ROWS + 0.5);

export const hexCenter = (c: Cell): [number, number] => {
  const col = colOf(c);
  const row = rowOf(c);
  return [R * 1.5 * col + R, SQ3 * R * (row + 0.5 * (col & 1)) + (SQ3 * R) / 2];
};

const HEX_POINTS = Array.from({ length: 6 }, (_, i) => {
  const a = (Math.PI / 3) * i;
  return `${(R * Math.cos(a)).toFixed(2)},${(R * Math.sin(a)).toFixed(2)}`;
}).join(" ");

const TERRAIN_FILL: Record<Terrain, string> = {
  sea: "#2f9fd6",
  sand: "#f1d9a0",
  palms: "#3f9a5f",
  boardwalk: "#d8d2c6",
  street: "#5b5f68",
};

const STRUCT_FILL = {
  blue: "#2457ff",
  white: "#f7f7f7",
  green: "#2bb24c",
  black: "#1a1a1a",
} as const;

/** Offsets for up to 5 seat markers inside one hex. */
const MARKER_POS: [number, number][] = [
  [0, -0.52],
  [0.5, -0.16],
  [0.31, 0.42],
  [-0.31, 0.42],
  [-0.5, -0.16],
];

export const cellLabel = (c: Cell): string =>
  `${String.fromCharCode(65 + colOf(c))}${rowOf(c) + 1}`;

export interface HexMapProps {
  map: BeachMap;
  markers: Marker[];
  selected?: Cell | null;
  /** Cells to dim (assist: impossible). */
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

  return (
    <svg
      class={`hexmap ${p.onCell ? "interactive" : ""} ${p.class ?? ""}`}
      viewBox={`0 0 ${W} ${H}`}
      role={p.onCell ? "grid" : "img"}
      aria-label="mapa da praia"
    >
      <title>Mapa da praia</title>
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
                {t === "sea" && (
                  <circle r={R * 0.2} cx={-R * 0.3} cy={R * 0.25} fill="#fff" opacity="0.18" />
                )}
                {t === "palms" && (
                  <circle r={R * 0.28} cx={R * 0.25} cy={-R * 0.3} fill="#2a7a45" opacity="0.6" />
                )}
                {terr && (
                  <polygon
                    points={HEX_POINTS}
                    transform="scale(0.8)"
                    fill="none"
                    stroke={terr === "gulls" ? "#ffffff" : "#ff3b3b"}
                    stroke-width={2.2}
                    stroke-dasharray="4 3"
                    class="territory"
                  />
                )}
                {dim && <polygon points={HEX_POINTS} fill="#06131b" opacity="0.7" class="dim" />}
                {p.notes?.[c] === 1 && (
                  <path
                    d={`M${-R * 0.4} ${-R * 0.4} L${R * 0.4} ${R * 0.4} M${R * 0.4} ${-R * 0.4} L${-R * 0.4} ${R * 0.4}`}
                    stroke="#ff3b3b"
                    stroke-width="3"
                    stroke-linecap="round"
                  />
                )}
                {p.notes?.[c] === 2 && (
                  <text
                    y={R * 0.3}
                    text-anchor="middle"
                    font-size={R * 0.9}
                    font-weight="700"
                    fill="#ffd166"
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
          const fill = STRUCT_FILL[s.color];
          const k = R * 0.42;
          return (
            <g
              key={`${s.kind}-${s.color}`}
              transform={`translate(${x.toFixed(2)} ${y.toFixed(2)})`}
              class="structure"
            >
              {s.kind === "kiosk" ? (
                <>
                  <rect
                    x={-k}
                    y={-k * 0.2}
                    width={k * 2}
                    height={k * 1.1}
                    fill={fill}
                    stroke="#0b2a3b"
                    stroke-width="1.5"
                  />
                  <path
                    d={`M${-k * 1.2} ${-k * 0.2} L0 ${-k * 1.1} L${k * 1.2} ${-k * 0.2} Z`}
                    fill={fill}
                    stroke="#0b2a3b"
                    stroke-width="1.5"
                  />
                </>
              ) : (
                <path
                  d={`M${-k * 1.1} ${k * 0.8} L0 ${-k * 1.1} L${k * 1.1} ${k * 0.8} Z`}
                  fill={fill}
                  stroke="#0b2a3b"
                  stroke-width="1.5"
                />
              )}
            </g>
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
            const r = R * 0.24;
            const col = seatColor(m.seat);
            return m.kind === "disc" ? (
              <circle
                key={`${m.seat}-${c}`}
                cx={mx}
                cy={my}
                r={r}
                fill={col}
                stroke="#0b2a3b"
                stroke-width="1.2"
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
                stroke-width="1.2"
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
          return (
            <g transform={`translate(${x} ${y})`}>
              <g class="diamond">
                <circle r={R * 1.1} fill="#7be0ff" opacity="0.35" class="diamond-halo" />
                <path
                  d={`M0 ${-R * 0.75} L${R * 0.6} ${-R * 0.2} L0 ${R * 0.8} L${-R * 0.6} ${-R * 0.2} Z`}
                  fill="#b9f0ff"
                  stroke="#0b2a3b"
                  stroke-width="1.5"
                />
                <path
                  d={`M${-R * 0.6} ${-R * 0.2} H${R * 0.6}`}
                  stroke="#0b2a3b"
                  stroke-width="1.2"
                />
              </g>
            </g>
          );
        })()}
    </svg>
  );
}
