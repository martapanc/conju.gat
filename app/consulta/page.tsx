"use client";

import { Suspense, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Mark from "@/components/Mark";
import Nav from "@/components/Nav";
import Verb from "@/components/Verb";
import { search, type Dataset } from "@/lib/data";
import { WithData } from "../providers";

export default function ConsultaPage() {
  return (
    <>
      <Nav />
      <Suspense fallback={<p className="empty">Carregant…</p>}>
        <WithData>{(data) => <Consulta data={data} />}</WithData>
      </Suspense>
    </>
  );
}

function Consulta({ data }: { data: Dataset }) {
  const router = useRouter();
  const params = useSearchParams();
  const verb = params.get("v");
  const other = params.get("amb");

  // The URL is the state: back and forward work, and a paradigm is shareable.
  function go(next: { v?: string | null; amb?: string | null }) {
    const q = new URLSearchParams(params.toString());
    for (const [k, val] of Object.entries(next)) {
      if (val) q.set(k, val);
      else q.delete(k);
    }
    router.push(q.toString() ? `/consulta?${q}` : "/consulta");
  }

  return (
    <div className="page">
      <aside>
        <h1>Consulta</h1>
        <p className="muted">
          Cerca un verb i mira&apos;n el paradigma. A sota hi trobaràs els verbs
          que funcionen igual.
        </p>
      </aside>

      <div>
        <Finder
          data={data}
          value={verb}
          onPick={(v) => go({ v, amb: null })}
          placeholder="menjar, llegir, treure…"
          label="Cerca un verb"
        />

        {!verb && <Cloud data={data} onPick={(v) => go({ v })} />}

        {verb && data.verbs.has(verb) && (
          <>
            <div className={other ? "compare" : undefined}>
              <Verb verb={verb} data={data} onPick={(v) => go({ v, amb: null })} />
              {other && data.verbs.has(other) && (
                <Verb
                  verb={other}
                  data={data}
                  onPick={(v) => go({ amb: v })}
                />
              )}
            </div>

            <div className="compare-bar">
              {other ? (
                <button className="btn" onClick={() => go({ amb: null })}>
                  Deixa de comparar
                </button>
              ) : (
                <Finder
                  data={data}
                  value={null}
                  onPick={(v) => go({ amb: v })}
                  placeholder="compara amb un altre verb…"
                  label="Compara amb"
                  small
                />
              )}
            </div>
          </>
        )}

        {verb && !data.verbs.has(verb) && (
          <p className="empty">«{verb}» no és al diccionari.</p>
        )}
      </div>
    </div>
  );
}

function Finder({
  data,
  value,
  onPick,
  placeholder,
  label,
  small,
}: {
  data: Dataset;
  value: string | null;
  onPick: (verb: string) => void;
  placeholder: string;
  label: string;
  small?: boolean;
}) {
  const [query, setQuery] = useState("");
  const results = useMemo(() => search(data, query), [data, query]);

  return (
    <div style={{ marginBottom: "var(--s4)" }}>
      <input
        className={small ? "searchfield small" : "searchfield"}
        type="search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder={value ?? placeholder}
        autoComplete="off"
        autoCapitalize="off"
        spellCheck={false}
        aria-label={label}
      />

      {query && results.length > 0 && (
        <ul className="results">
          {results.slice(0, 10).map((v) => {
            const pattern = data.byId.get(data.verbs.get(v)![0])!;
            return (
              <li key={v}>
                <button
                  onClick={() => {
                    setQuery("");
                    onPick(v);
                  }}
                >
                  <Mark pattern={pattern} size="1em" />
                  <span className="r-lemma">{v}</span>
                  <span className="r-pattern">{pattern.nome}</span>
                </button>
              </li>
            );
          })}
        </ul>
      )}

      {query && results.length === 0 && (
        <p className="empty">Cap verb amb «{query}». Prova amb l&apos;infinitiu.</p>
      )}
    </div>
  );
}

/** The common verbs, sized by how early they turn up in real Catalan. */
function Cloud({
  data,
  onPick,
}: {
  data: Dataset;
  onPick: (verb: string) => void;
}) {
  return (
    <section>
      <h2 className="cloud-title">Per començar</h2>
      <div className="cloud">
        {data.deck.map((v, i) => {
          const pattern = data.byId.get(data.verbs.get(v)![0]);
          if (!pattern) return null;
          const weight = 1 - i / data.deck.length;
          return (
            <button
              key={v}
              onClick={() => onPick(v)}
              style={{
                fontSize: `${0.85 + weight * 0.95}rem`,
                fontWeight: weight > 0.6 ? 700 : 400,
              }}
            >
              <Mark pattern={pattern} size="1em" />
              {v}
            </button>
          );
        })}
      </div>
    </section>
  );
}
