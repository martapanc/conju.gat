"use client";

import {
  PERSONS,
  formsOf,
  signatureFor,
  splitForm,
  colour,
  type Dataset,
} from "@/lib/data";
import Link from "next/link";
import Mark from "./Mark";

/**
 * A verb's full paradigm as a real table: horizontal rules only, the six
 * persons always in the same order and the same place, because spatial memory
 * is part of the learning.
 */
export default function Verb({
  verb,
  data,
  onPick,
}: {
  verb: string;
  data: Dataset;
  onPick: (verb: string) => void;
}) {
  const row = data.verbs.get(verb);
  if (!row) return null;
  const pattern = data.byId.get(row[0]);
  if (!pattern) return null;

  const sig = signatureFor(pattern, row);
  const forms = formsOf(row);
  // Common verbs first: sorting by length surfaces obscurities like "ujar"
  // ahead of "passejar", which teaches nothing.
  const rank = (v: string) => {
    const i = data.deck.indexOf(v);
    return i === -1 ? data.deck.length : i;
  };
  const siblings = (data.byPattern.get(pattern.id) ?? [])
    .filter((v) => v !== verb)
    .sort(
      (a, b) =>
        rank(a) - rank(b) || a.length - b.length || a.localeCompare(b, "ca"),
    )
    .slice(0, 16);

  return (
    <div>
      <div className="verb-head">
        <Mark pattern={pattern} size={20} title={pattern.nome} />
        <h1>{verb}</h1>
      </div>
      <p className="verb-meta">
        {pattern.nome} · {pattern.n.toLocaleString("ca")} {pattern.n === 1 ? "verb" : "verbs"}
      </p>

      <div className="table-scroll">
        <table className="paradigm-full">
          <caption>present d&apos;indicatiu</caption>
          <thead>
            <tr>
              <th scope="col">persona</th>
              <th scope="col">forma</th>
            </tr>
          </thead>
          <tbody>
            {PERSONS.map((person, i) => {
              const [stem, end] = splitForm(forms[i], sig[i] ?? "");
              return (
                <tr key={person}>
                  <th scope="row">{person}</th>
                  <td>
                    {forms[i] ? (
                      <>
                        {stem}
                        <span className="tone" style={{ color: colour(pattern.text) }}>
                          {end}
                        </span>
                      </>
                    ) : (
                      <span className="muted">no existeix</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="practice-links">
        <Link className="btn" href={`/escriu?v=${encodeURIComponent(verb)}`}>
          Escriu-lo
        </Link>
        <Link className="btn" href={`/digues?v=${encodeURIComponent(verb)}`}>
          Digues-lo
        </Link>
      </div>

      {pattern.varianti.length > 1 && (
        <div className="table-scroll">
          <table className="paradigm-full">
            <caption>mateix mecanisme, accent diferent</caption>
            <tbody>
              {pattern.varianti.map((v) => (
                <tr key={v.esempio}>
                  <th scope="row">{v.esempio}</th>
                  <td>{v.formes.filter(Boolean).join(" · ")}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {siblings.length > 0 && (
        <>
          <h2 className="siblings-title">Verbs semblants</h2>
          <p className="muted siblings-note">
            Mateix mecanisme: {pattern.n.toLocaleString("ca")} verbs al diccionari.
          </p>
          <div className="siblings">
            {siblings.map((v) => (
              <button key={v} onClick={() => onPick(v)}>
                {v}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
