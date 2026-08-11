"use client";

import { useMemo, useState } from "react";
import { search, type Dataset } from "@/lib/data";
import Table from "./Table";

export default function Search({ data }: { data: Dataset }) {
  const [query, setQuery] = useState("");
  const [picked, setPicked] = useState<string | null>(null);

  const results = useMemo(() => search(data, query), [data, query]);
  const exact = data.verbs.has(query.trim().toLowerCase())
    ? query.trim().toLowerCase()
    : null;
  const showing = picked ?? exact;

  function choose(verb: string) {
    setPicked(verb);
    setQuery("");
  }

  return (
    <div>
      <div className="searchbox">
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Cerca un verbo…  (menjar, llegir, treure)"
          autoComplete="off"
          autoCapitalize="off"
          spellCheck={false}
          aria-label="Cerca un verbo"
        />
      </div>

      {query && results.length > 0 && (
        <ul className="results" style={{ marginBottom: "1rem" }}>
          {results.slice(0, 12).map((verb) => {
            const row = data.verbs.get(verb)!;
            const pattern = data.byId.get(row[0]);
            return (
              <li key={verb}>
                <button className="result" onClick={() => choose(verb)}>
                  <span className="chip" style={{ background: pattern?.colore }} />
                  <span className="lemma">{verb}</span>
                  <span className="pat">{pattern?.nome}</span>
                </button>
              </li>
            );
          })}
        </ul>
      )}

      {query && results.length === 0 && (
        <p className="empty">Nessun verbo trovato per «{query}».</p>
      )}

      {showing ? (
        <Table verb={showing} data={data} onPick={choose} />
      ) : (
        !query && (
          <p className="empty">
            Cerca un verbo per vederne la coniugazione al presente.
            <br />
            Il colore ti dice il meccanismo, non il verbo.
          </p>
        )
      )}
    </div>
  );
}
