/**
 * El gat, redibuixat amb el vocabulari de la resta: color pla, línia negra,
 * cap degradat. Els dos ulls porten dues de les tres primàries i el nas la
 * tercera, així la mascota és també la llegenda.
 */
export default function Cat({ size = 120 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 120 120"
      role="img"
      aria-label="conju.gat"
      style={{ display: "block", overflow: "visible" }}
    >
      <g
        fill="none"
        stroke="var(--ink)"
        strokeWidth="3.5"
        strokeLinejoin="round"
        strokeLinecap="round"
      >
        {/* orelles */}
        <path d="M26 44 22 14l30 16Z" fill="var(--ink)" />
        <path d="M94 44 98 14 68 30Z" />

        {/* cap */}
        <circle cx="60" cy="66" r="38" />

        {/* ulls: dos primaris */}
        <circle cx="44" cy="58" r="9" fill="var(--groc)" />
        <circle cx="78" cy="58" r="9" fill="var(--blau)" />
        <circle cx="44" cy="58" r="2.4" fill="var(--ink)" stroke="none" />
        <circle cx="78" cy="58" r="2.4" fill="var(--ink)" stroke="none" />

        {/* nas: el tercer */}
        <path d="M54 78h12l-6 8Z" fill="var(--vermell)" />

        {/* bigotis */}
        <path d="M22 74 2 68M22 84 4 88M98 74l20-6M98 84l18 4" />
      </g>
    </svg>
  );
}
