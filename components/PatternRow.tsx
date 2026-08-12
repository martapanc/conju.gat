"use client";

import Link from "next/link";
import { colour, splitForm, type Dataset, type Pattern } from "@/lib/data";
import Mark from "./Mark";

/**
 * One pattern as a specimen: the mark, the verb that names it, and its six
 * forms with the ending — the part the pattern dictates — in colour.
 */
export default function PatternRow({
  pattern,
  data,
  forms,
}: {
  pattern: Pattern;
  data: Dataset;
  /** show the exemplar's full paradigm, not just the name */
  forms?: boolean;
}) {
  const row = data.verbs.get(pattern.esempio);
  const sig = pattern.sig;

  return (
    <div className="prow">
      <Mark pattern={pattern} size="1em" />
      <Link href={`/consulta?v=${encodeURIComponent(pattern.esempio)}`} className="prow-name">
        {pattern.esempio}
      </Link>
      {forms && row && (
        <span className="prow-forms">
          {row.slice(1).map((f, i) => {
            const [stem, end] = splitForm(f as string | null, sig[i] ?? "");
            return (
              <span key={i} className="prow-cell">
                {f ? (
                  <>
                    {stem}
                    <span className="tone" style={{ color: colour(pattern.text) }}>
                        {end}
                      </span>
                  </>
                ) : (
                  "—"
                )}
              </span>
            );
          })}
        </span>
      )}
      <span className="prow-n">{pattern.n.toLocaleString("ca")}</span>
    </div>
  );
}
