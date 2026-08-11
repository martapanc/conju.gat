import { colour, type Pattern } from "@/lib/data";

/**
 * The pattern's mark: flat colour for the conjugation, shape for the subtype,
 * filled or outlined for one more bit. Drawn on a 24-unit box so every shape
 * shares the same optical weight — a triangle needs more area than a square
 * to read as equally heavy.
 */
export default function Mark({
  pattern,
  size = 14,
  title,
}: {
  pattern: Pattern;
  /** number = pixels; "1em" makes the symbol match the surrounding text */
  size?: number | string;
  title?: string;
}) {
  const c = colour(pattern.colore);
  const ple = pattern.ple;
  const fill = ple ? c : "none";
  const stroke = c;
  const sw = 3;

  const shape = () => {
    switch (pattern.forma) {
      case "cercle":
        return <circle cx="12" cy="12" r="9" fill={fill} stroke={stroke} strokeWidth={sw} />;
      case "quadrat":
        return <rect x="3.5" y="3.5" width="17" height="17" fill={fill} stroke={stroke} strokeWidth={sw} />;
      case "triangle":
        return <path d="M12 2.5 22 20.5H2Z" fill={fill} stroke={stroke} strokeWidth={sw} strokeLinejoin="round" />;
      case "rombe":
        return <path d="M12 1.5 22.5 12 12 22.5 1.5 12Z" fill={fill} stroke={stroke} strokeWidth={sw} strokeLinejoin="round" />;
      case "creu":
        return ple ? (
          <path d="M9 2h6v7h7v6h-7v7H9v-7H2V9h7Z" fill={c} />
        ) : (
          <path d="M12 2.5v19M2.5 12h19" stroke={stroke} strokeWidth={sw + 1} strokeLinecap="butt" />
        );
      case "estrella":
        return (
          <path
            d="M12 1.5 14.6 9h7.9l-6.4 4.6 2.5 7.6L12 16.5l-6.6 4.7 2.5-7.6L1.5 9h7.9Z"
            fill={fill}
            stroke={stroke}
            strokeWidth={sw - 1}
            strokeLinejoin="round"
          />
        );
      case "lluna":
        return (
          <path
            d="M16.5 3a10 10 0 1 0 0 18 11.5 11.5 0 0 1 0-18Z"
            fill={fill}
            stroke={stroke}
            strokeWidth={sw}
            strokeLinejoin="round"
          />
        );
      case "barra":
      default:
        return <rect x="1.5" y="9" width="21" height="6" fill={ple ? c : "none"} stroke={stroke} strokeWidth={sw} />;
    }
  };

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      role={title ? "img" : "presentation"}
      aria-label={title}
      aria-hidden={title ? undefined : true}
      style={{
        display: "block",
        flex: "none",
        overflow: "visible",
        alignSelf: "center",
      }}
    >
      {shape()}
    </svg>
  );
}
