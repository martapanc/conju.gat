type Props = {
  /** the current pattern's colour — the cat wears whatever you're studying */
  color?: string;
  size?: number;
  /** closed eyes while the answer is still hidden */
  asleep?: boolean;
  title?: string;
};

export default function Cat({ color, size = 26, asleep = false, title }: Props) {
  const fill = color ?? "var(--faint)";
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      role={title ? "img" : "presentation"}
      aria-label={title}
      aria-hidden={title ? undefined : true}
      style={{ display: "block", flex: "none" }}
    >
      {/* ears */}
      <path d="M6.5 12.2 5.2 4.6l6.6 3.9Z" fill={fill} />
      <path d="M25.5 12.2 26.8 4.6l-6.6 3.9Z" fill={fill} />
      {/* head */}
      <ellipse cx="16" cy="18" rx="11" ry="9.6" fill={fill} />
      {/* eyes */}
      {asleep ? (
        <>
          <path
            d="M9.6 17.4q2.2 2 4.4 0"
            fill="none"
            stroke="var(--card)"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
          <path
            d="M18 17.4q2.2 2 4.4 0"
            fill="none"
            stroke="var(--card)"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
        </>
      ) : (
        <>
          <ellipse cx="11.8" cy="17.2" rx="1.7" ry="2.1" fill="var(--card)" />
          <ellipse cx="20.2" cy="17.2" rx="1.7" ry="2.1" fill="var(--card)" />
          <circle cx="11.8" cy="17.6" r="0.95" fill={fill} />
          <circle cx="20.2" cy="17.6" r="0.95" fill={fill} />
        </>
      )}
      {/* nose + mouth */}
      <path d="M14.9 21.1h2.2L16 22.5Z" fill="var(--card)" />
      <path
        d="M16 22.6v1.1m0 0q-1.3 1.2-2.6 0m2.6 0q1.3 1.2 2.6 0"
        fill="none"
        stroke="var(--card)"
        strokeWidth="1.1"
        strokeLinecap="round"
      />
      {/* whiskers */}
      <g stroke={fill} strokeWidth="1.1" strokeLinecap="round" opacity="0.85">
        <path d="M6.4 20.4 1.6 19.2M6.4 22.2 2 22.8" />
        <path d="M25.6 20.4 30.4 19.2M25.6 22.2 30 22.8" />
      </g>
    </svg>
  );
}
