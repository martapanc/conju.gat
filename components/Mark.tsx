import { colour, type Pattern } from "@/lib/data";

/**
 * The pattern's mark: a flat square of the pattern's tone. The 1a regular is
 * the one outline in the whole app — empty means nothing to remember.
 */
export default function Mark({
  pattern,
  size = 14,
  title,
}: {
  pattern: Pattern;
  /** number = pixels; "1em" makes the mark match the surrounding text */
  size?: number | string;
  title?: string;
}) {
  const c = colour(pattern.colore);
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      className="mark"
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
      <rect
        x={pattern.buit ? 2.5 : 1}
        y={pattern.buit ? 2.5 : 1}
        width={pattern.buit ? 19 : 22}
        height={pattern.buit ? 19 : 22}
        fill={pattern.buit ? "none" : c}
        stroke={pattern.buit ? c : "none"}
        strokeWidth="3"
      />
    </svg>
  );
}
