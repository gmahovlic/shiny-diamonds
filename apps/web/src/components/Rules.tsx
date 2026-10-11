import { COLORS, TERRAINS, TERRITORIES } from "@shiny/core";
import { colorName, structureName, t, terrainName, territoryName } from "../i18n";
import { STRUCT_FILL, TERRAIN_FILL } from "./HexMap";
import { MapDefs } from "./MapDefs";

function Swatch(p: { fill: string; palm?: boolean }) {
  return (
    <svg viewBox="-12 -12 24 24" class="sw" aria-hidden="true">
      <polygon
        points="12,0 6,10.4 -6,10.4 -12,0 -6,-10.4 6,-10.4"
        fill={p.fill}
        stroke="#1f3a4d"
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
      <section class="modal" role="dialog" aria-modal="true" aria-label={t("rules.title")}>
        <svg width="0" height="0" style="position:absolute" aria-hidden="true">
          <MapDefs />
        </svg>
        <header>
          <h2>{t("rules.title")}</h2>
          <button type="button" class="x" aria-label={t("hex.close")} onClick={p.onClose}>
            ×
          </button>
        </header>

        <h3>{t("rules.how")}</h3>
        <ul class="rules">
          <li>{t("rules.r1")}</li>
          <li>{t("rules.r2", { hard: p.hard ? t("rules.r2hard") : "" })}</li>
          <li>{t("rules.r3")}</li>
          <li>{t("rules.r4")}</li>
          <li>{t("rules.r5")}</li>
        </ul>

        <h3>{t("rules.terrains")}</h3>
        <ul class="legend">
          {TERRAINS.map((x) => (
            <li key={x}>
              <Swatch fill={TERRAIN_FILL[x]} palm={x === "palms"} /> {terrainName(x)}
            </li>
          ))}
        </ul>

        <h3>{t("rules.territories")}</h3>
        <ul class="legend">
          {TERRITORIES.map((x) => (
            <li key={x}>
              <Icon href={x === "gulls" ? "#s-gull" : "#s-crab"} /> {territoryName(x)}{" "}
              <span class="muted">{t("rules.dashed")}</span>
            </li>
          ))}
        </ul>

        <h3>{t("rules.structures")}</h3>
        <ul class="legend grid">
          <li>
            <span class="icons">
              <Icon href="#s-kiosk" color="#9aa3ad" />
              <Icon href="#s-tent" color="#9aa3ad" />
            </span>
            <span class="muted">
              {structureName("kiosk")} + {structureName("tent")}
            </span>
          </li>
          {COLORS.slice(0, p.hard ? 4 : 3).map((c) => (
            <li key={c}>
              <span class="icons">
                <Icon href="#s-kiosk" color={STRUCT_FILL[c]} />
                <Icon href="#s-tent" color={STRUCT_FILL[c]} />
              </span>
              <span>{colorName(c)}</span>
            </li>
          ))}
        </ul>
        <p class="muted">
          {t("rules.oneEach")}
          {p.hard ? t("rules.blackHard") : ""}
        </p>

        <h3>{t("rules.clues")}</h3>
        <ul class="rules">
          <li>{t("rules.c1")}</li>
          <li>{t("rules.c2")}</li>
          <li>{t("rules.c3")}</li>
          <li>{t("rules.c4")}</li>
          <li>{t("rules.c5")}</li>
          <li>{t("rules.c6", { black: p.hard ? t("rules.c6black") : "", n: p.hard ? 4 : 3 })}</li>
          {p.hard && <li>{t("rules.c7")}</li>}
        </ul>
        <p class="muted">{t("rules.tip")}</p>
        <p class="muted">{t("rules.house")}</p>
      </section>
    </div>
  );
}
