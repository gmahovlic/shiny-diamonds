/**
 * Shared SVG art: terrain patterns and symbols for structures, animals and the diamond.
 * Rendered once per SVG that needs them; ids are document-global so the legend can reuse them.
 */
export function MapDefs() {
  return (
    <defs>
      {/* Mar: ondas */}
      <pattern id="p-sea" width="24" height="12" patternUnits="userSpaceOnUse">
        <rect width="24" height="12" fill="#2d9bd3" />
        <path
          d="M0 7 Q6 3 12 7 T24 7"
          fill="none"
          stroke="#8fd8f5"
          stroke-width="1.4"
          opacity="0.75"
        />
        <path
          d="M-12 1 Q-6 -3 0 1 T12 1"
          fill="none"
          stroke="#8fd8f5"
          stroke-width="1.2"
          opacity="0.45"
        />
      </pattern>
      {/* Areia: grãos */}
      <pattern id="p-sand" width="12" height="12" patternUnits="userSpaceOnUse">
        <rect width="12" height="12" fill="#f3d58a" />
        <circle cx="2.5" cy="3" r="0.9" fill="#d9ad57" />
        <circle cx="8" cy="8.5" r="0.9" fill="#d9ad57" />
        <circle cx="9.5" cy="2" r="0.6" fill="#fff5d6" />
        <circle cx="4" cy="9.5" r="0.6" fill="#fff5d6" />
      </pattern>
      {/* Palmeiras: grama escura (a palmeira em si é um símbolo por hex) */}
      <pattern id="p-palms" width="10" height="10" patternUnits="userSpaceOnUse">
        <rect width="10" height="10" fill="#3f9a5f" />
        <path
          d="M1 8 l2 -3 M6 9 l2 -3 M4 4 l1.5 -2.5"
          stroke="#2f7f4a"
          stroke-width="1.2"
          stroke-linecap="round"
        />
      </pattern>
      {/* Calçadão: ondas de Copacabana */}
      <pattern id="p-boardwalk" width="28" height="14" patternUnits="userSpaceOnUse">
        <rect width="28" height="14" fill="#f5f2ea" />
        <path d="M0 4 Q7 -2 14 4 T28 4 L28 10 Q21 16 14 10 T0 10 Z" fill="#1d1d1f" />
      </pattern>
      {/* Rua: asfalto com faixa */}
      <pattern id="p-street" width="18" height="18" patternUnits="userSpaceOnUse">
        <rect width="18" height="18" fill="#55595f" />
        <circle cx="4" cy="4" r="0.7" fill="#6b7076" />
        <circle cx="13" cy="14" r="0.7" fill="#6b7076" />
        <rect x="3" y="8.5" width="9" height="1.6" rx="0.8" fill="#f2c94c" opacity="0.85" />
      </pattern>

      {/* Palmeira */}
      <symbol id="s-palm" viewBox="-10 -10 20 20">
        <path
          d="M0 8 Q1.5 2 0.5 -2"
          fill="none"
          stroke="#7a4b23"
          stroke-width="2"
          stroke-linecap="round"
        />
        <g fill="#1e7a3e">
          <ellipse rx="6" ry="2" transform="translate(0.5 -2) rotate(-55) translate(4 0)" />
          <ellipse rx="6" ry="2" transform="translate(0.5 -2) rotate(-15) translate(4 0)" />
          <ellipse rx="6" ry="2" transform="translate(0.5 -2) rotate(-125) translate(4 0)" />
          <ellipse rx="6" ry="2" transform="translate(0.5 -2) rotate(-165) translate(4 0)" />
          <ellipse rx="5" ry="1.6" transform="translate(0.5 -2) rotate(-90) translate(4 0)" />
        </g>
        <circle cx="-1" cy="-1" r="1.1" fill="#7a4b23" />
        <circle cx="1.5" cy="-0.5" r="1.1" fill="#7a4b23" />
      </symbol>

      {/* Gaivota */}
      <symbol id="s-gull" viewBox="-10 -10 20 20">
        <path
          d="M-8 2 Q-4 -4 0 0 Q4 -4 8 2"
          fill="none"
          stroke="#ffffff"
          stroke-width="2.2"
          stroke-linecap="round"
        />
        <path
          d="M-8 2 Q-4 -4 0 0 Q4 -4 8 2"
          fill="none"
          stroke="#0b2a3b"
          stroke-width="0.8"
          stroke-linecap="round"
          opacity="0.6"
        />
      </symbol>

      {/* Caranguejo */}
      <symbol id="s-crab" viewBox="-10 -10 20 20">
        <g stroke="#ff4d4d" stroke-width="1.6" stroke-linecap="round" fill="none">
          <path d="M-5 1 l-3 3 M-5 -1 l-3.5 0 M5 1 l3 3 M5 -1 l3.5 0 M-4 3 l-2 4 M4 3 l2 4" />
          <path d="M-5 -3 Q-8 -7 -5 -8 M5 -3 Q8 -7 5 -8" />
        </g>
        <ellipse rx="5.5" ry="4" fill="#ff4d4d" stroke="#0b2a3b" stroke-width="0.8" />
        <circle cx="-2" cy="-1" r="1" fill="#0b2a3b" />
        <circle cx="2" cy="-1" r="1" fill="#0b2a3b" />
        <circle cx="-6.5" cy="-8" r="1.8" fill="#ff4d4d" stroke="#0b2a3b" stroke-width="0.8" />
        <circle cx="6.5" cy="-8" r="1.8" fill="#ff4d4d" stroke="#0b2a3b" stroke-width="0.8" />
      </symbol>

      {/* Quiosque: toldo listrado + balcão. Cor via currentColor. */}
      <symbol id="s-kiosk" viewBox="-12 -12 24 24">
        <rect
          x="-7"
          y="-1"
          width="14"
          height="9"
          fill="currentColor"
          stroke="#0b2a3b"
          stroke-width="1.2"
        />
        <rect x="-7" y="2" width="14" height="2" fill="#0b2a3b" opacity="0.25" />
        <path
          d="M-10 -1 L-7 -8 H7 L10 -1 Z"
          fill="currentColor"
          stroke="#0b2a3b"
          stroke-width="1.2"
        />
        <path
          d="M-6 -1 L-4 -8 M-2 -1 L-1 -8 M2 -1 L1 -8 M6 -1 L4 -8"
          stroke="#0b2a3b"
          stroke-width="1.6"
          opacity="0.35"
        />
        <path
          d="M-10 -1 Q-8.5 1 -7 -1 Q-5.5 1 -4 -1 Q-2.5 1 -1 -1 Q0.5 1 2 -1 Q3.5 1 5 -1 Q6.5 1 8 -1 Q9 1 10 -1"
          fill="#0b2a3b"
          opacity="0.35"
        />
        <rect x="-2" y="3" width="4" height="5" fill="#0b2a3b" opacity="0.5" />
      </symbol>

      {/* Barraca de praia: guarda-sol listrado. Cor via currentColor. */}
      <symbol id="s-tent" viewBox="-12 -12 24 24">
        <path d="M0 2 V9" stroke="#0b2a3b" stroke-width="1.6" stroke-linecap="round" />
        <path
          d="M-11 2 A11 11 0 0 1 11 2 Z"
          fill="currentColor"
          stroke="#0b2a3b"
          stroke-width="1.2"
        />
        <path
          d="M-7.8 -5.8 L-4 2 M-3 -8.6 L-1.5 2 M3 -8.6 L1.5 2 M7.8 -5.8 L4 2"
          stroke="#0b2a3b"
          stroke-width="2.2"
          opacity="0.35"
        />
        <path
          d="M-11 2 Q-9.6 4 -8.2 2 Q-6.8 4 -5.4 2 Q-4 4 -2.6 2 Q-1.2 4 0.2 2 Q1.6 4 3 2 Q4.4 4 5.8 2 Q7.2 4 8.6 2 Q9.8 4 11 2"
          fill="#0b2a3b"
          opacity="0.35"
        />
      </symbol>

      {/* Diamante facetado */}
      <symbol id="s-diamond" viewBox="-12 -12 24 24">
        <polygon
          points="-11,-3 -6,-10 6,-10 11,-3 0,11"
          fill="#5fd3ff"
          stroke="#0b2a3b"
          stroke-width="1.2"
          stroke-linejoin="round"
        />
        <polygon points="-6,-10 6,-10 3,-3 -3,-3" fill="#d9f6ff" />
        <polygon points="-11,-3 -6,-10 -3,-3" fill="#9fe6ff" />
        <polygon points="11,-3 6,-10 3,-3" fill="#9fe6ff" />
        <polygon points="-3,-3 3,-3 0,11" fill="#2fb7ea" />
        <polygon points="-11,-3 -3,-3 0,11" fill="#7edcff" />
        <polygon points="11,-3 3,-3 0,11" fill="#1f9fd3" />
        <path d="M-11 -3 H11" stroke="#0b2a3b" stroke-width="0.8" opacity="0.6" />
        <path
          d="M-5 -14 l1 2 l2 1 l-2 1 l-1 2 l-1 -2 l-2 -1 l2 -1 Z"
          fill="#ffffff"
          class="sparkle"
        />
      </symbol>
    </defs>
  );
}
