import type { Clue, Color, StructureKind, Terrain, Territory } from "@shiny/core";

export const TERRAIN_NAME: Record<Terrain, string> = {
  sea: "mar",
  sand: "areia",
  palms: "palmeiras",
  boardwalk: "calçadão",
  street: "rua",
};

export const TERRITORY_NAME: Record<Territory, string> = {
  gulls: "gaivotas",
  crabs: "caranguejos",
};

export const STRUCTURE_NAME: Record<StructureKind, string> = {
  kiosk: "quiosque",
  tent: "barraca",
};

export const COLOR_NAME: Record<Color, string> = {
  blue: "azul",
  white: "branca",
  green: "verde",
  black: "preta",
};

/** Human-readable clue, pt-BR. */
export function clueText(clue: Clue): string {
  const not = clue.negate;
  switch (clue.kind) {
    case "terrain2":
      return not
        ? `O diamante NÃO está em ${TERRAIN_NAME[clue.a]} nem em ${TERRAIN_NAME[clue.b]}`
        : `O diamante está em ${TERRAIN_NAME[clue.a]} ou em ${TERRAIN_NAME[clue.b]}`;
    case "nearTerrain":
      return `O diamante ${not ? "NÃO " : ""}está a até 1 hex de ${TERRAIN_NAME[clue.terrain]}`;
    case "nearTerritory":
      return `O diamante ${not ? "NÃO " : ""}está a até 1 hex de um território (gaivotas ou caranguejos)`;
    case "near2Territory":
      return `O diamante ${not ? "NÃO " : ""}está a até 2 hexes de ${TERRITORY_NAME[clue.territory]}`;
    case "near2Structure":
      return `O diamante ${not ? "NÃO " : ""}está a até 2 hexes de um(a) ${STRUCTURE_NAME[clue.structure]}`;
    case "near3Color":
      return `O diamante ${not ? "NÃO " : ""}está a até 3 hexes de uma estrutura ${COLOR_NAME[clue.color]}`;
  }
}

export const SEAT_COLORS = ["#ff5d73", "#ffb830", "#b388ff", "#2ee6a6", "#ff8c42"];
export const seatColor = (seat: number): string => SEAT_COLORS[seat % SEAT_COLORS.length] as string;
