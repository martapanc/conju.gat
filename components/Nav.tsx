"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const LINKS = [
  { href: "/", label: "com funciona" },
  { href: "/consulta", label: "consulta" },
  { href: "/digues", label: "digues-ho" },
  { href: "/escriu", label: "escriu-ho" },
  { href: "/ajustos", label: "ajustos" },
] as const;

/**
 * Always visible so you never have to hunt for the way back — during practice
 * it collapses to the wordmark plus an explicit exit.
 */
export default function Nav({
  compact,
  right,
}: {
  compact?: boolean;
  right?: React.ReactNode;
}) {
  const pathname = usePathname();

  return (
    <nav className="bar">
      <Link href="/" className="wordmark">
        conju.gat
      </Link>

      {!compact && (
        <ul className="navlinks">
          {LINKS.filter((l) => l.href !== "/").map((l) => (
            <li key={l.href}>
              <Link
                href={l.href}
                aria-current={pathname === l.href ? "page" : undefined}
              >
                {l.label}
              </Link>
            </li>
          ))}
        </ul>
      )}

      <span className="bar-right">
        {right}
        {/* The way out is always present, never displaced by the counter. */}
        {compact && <Link href="/">surt</Link>}
      </span>
    </nav>
  );
}
