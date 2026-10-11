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
        <rect width="28" height="14" fill="#e6e2d8" />
        <path d="M0 4 Q7 -2 14 4 T28 4 L28 10 Q21 16 14 10 T0 10 Z" fill="#8a8a85" />
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
          d="M-1.5 9.5 C-1 5.5 0.8 2 1 -1.5"
          fill="none"
          stroke="#7a4e26"
          stroke-width="2.4"
          stroke-linecap="round"
        />
        <path
          d="M-1.5 9.5 C-1 5.5 0.8 2 1 -1.5"
          fill="none"
          stroke="#b07a3c"
          stroke-width="0.9"
          stroke-linecap="round"
          stroke-dasharray="1.2 1.7"
        />
        <g transform="translate(1 -2.2)">
          <g id="s-frond">
            <path
              d="M0 0 C2.5 -3.4 6.5 -3.6 9.2 -1.2 C8.4 0.6 6.2 1.4 3.6 1.1 C2 0.9 0.8 0.5 0 0 Z"
              fill="#2f9a52"
              stroke="#1b5e33"
              stroke-width="0.45"
              stroke-linejoin="round"
            />
            <path d="M0 0 C3 -1.8 6 -1.8 9 -1.1" fill="none" stroke="#1b5e33" stroke-width="0.5" />
          </g>
          <use href="#s-frond" transform="rotate(-62)" />
          <use href="#s-frond" transform="rotate(-22)" />
          <use href="#s-frond" transform="rotate(22)" />
          <use href="#s-frond" transform="scale(-1 1) rotate(-62)" />
          <use href="#s-frond" transform="scale(-1 1) rotate(-22)" />
          <use href="#s-frond" transform="scale(-1 1) rotate(22)" />
          <use href="#s-frond" transform="rotate(-95) scale(0.8)" />
          <circle cx="-1.1" cy="0.9" r="1.1" fill="#8a5a2b" stroke="#5a3a18" stroke-width="0.4" />
          <circle cx="1.2" cy="1.2" r="1.1" fill="#8a5a2b" stroke="#5a3a18" stroke-width="0.4" />
          <circle cx="0" cy="2.1" r="1" fill="#8a5a2b" stroke="#5a3a18" stroke-width="0.4" />
        </g>
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

      {/* Barraca de praia: guarda-sol com gomos. Cor via currentColor. */}
      <symbol id="s-tent" viewBox="-12 -12 24 24">
        <ellipse cx="1" cy="9.5" rx="7" ry="1.6" fill="#0b2a3b" opacity="0.25" />
        <path d="M0 2 L0.6 10" stroke="#3a2a1a" stroke-width="1.4" stroke-linecap="round" />
        <g stroke="#0b2a3b" stroke-width="0.9" stroke-linejoin="round">
          <path d="M0 -9 L-11 2 Q-9.2 3.8 -7.3 2.6 Z" fill="currentColor" />
          <path d="M0 -9 L-7.3 2.6 Q-5.5 4.2 -3.7 3.2 Z" fill="#fff" />
          <path d="M0 -9 L-3.7 3.2 Q-1.8 4.6 0 3.4 Z" fill="currentColor" />
          <path d="M0 -9 L0 3.4 Q1.8 4.6 3.7 3.2 Z" fill="#fff" />
          <path d="M0 -9 L3.7 3.2 Q5.5 4.2 7.3 2.6 Z" fill="currentColor" />
          <path d="M0 -9 L7.3 2.6 Q9.2 3.8 11 2 Z" fill="#fff" />
        </g>
        <g fill="#0b2a3b" opacity="0.18">
          <path d="M0 -9 L-7.3 2.6 Q-5.5 4.2 -3.7 3.2 Z" />
          <path d="M0 -9 L0 3.4 Q1.8 4.6 3.7 3.2 Z" />
          <path d="M0 -9 L7.3 2.6 Q9.2 3.8 11 2 Z" />
        </g>
        <circle cx="0" cy="-9.4" r="1" fill="#3a2a1a" />
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
