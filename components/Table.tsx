"use client";

import {
  PERSONS,
  formsOf,
  signatureFor,
  splitForm,
  type Dataset,
  type Pattern,
  type VerbRow,
} from "@/lib/data";

export function Forms({
  row,
  pattern,
  colour = true,
}: {
  row: VerbRow;
  pattern: Pattern;
  colour?: boolean;
}) {
  const sig = signatureFor(pattern, row);
  const forms = formsOf(row);
  return (
    <ul className="rows">
      {PERSONS.map((person, i) => {
        const [stem, end] = splitForm(forms[i], sig[i] ?? "");
        return (
          <li key={person}>
            <span className="person">{person}</span>
            {forms[i] ? (
              <span className="form">
                <span className="stem">{stem}</span>
                <span className="end" style={colour ? { color: pattern.colore } : undefined}>
                  {end}
                </span>
              </span>
            ) : (
              <span className="form none">— non esiste</span>
            )}
          </li>
        );
      })}
    </ul>
  );
}

export default function Table({
  verb,
  data,
  colour = true,
  onPick,
}: {
  verb: string;
  data: Dataset;
  colour?: boolean;
  onPick?: (verb: string) => void;
}) {
  const row = data.verbs.get(verb);
  if (!row) return null;
  const pattern = data.byId.get(row[0]);
  if (!pattern) return null;

  // Prefer short, common-looking siblings: they make the pattern recognisable.
  const siblings = (data.byPattern.get(pattern.id) ?? [])
    .filter((v) => v !== verb)
    .sort((a, b) => a.length - b.length || a.localeCompare(b, "ca"))
    .slice(0, 12);

  return (
    <div className="card">
      <div className="card-head">
        <span
          className="chip lg"
          style={{ background: colour ? pattern.colore : "var(--rule)" }}
        />
        <h2>{verb}</h2>
        {colour && <span className="patname">{pattern.nome}</span>}
      </div>

      <Forms row={row} pattern={pattern} colour={colour} />

      {colour && siblings.length > 0 && onPick && (
        <div className="siblings">
          <h3>Stesso meccanismo · {pattern.n.toLocaleString("it")} verbi</h3>
          <div className="tags">
            {siblings.map((v) => (
              <button key={v} className="tag" onClick={() => onPick(v)}>
                {v}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
