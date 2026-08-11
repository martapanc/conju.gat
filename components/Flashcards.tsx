"use client";

import { useCallback, useState } from "react";
import { type Dataset } from "@/lib/data";
import { nextVerb, useProgress, type Settings } from "@/lib/store";
import Cat from "./Cat";
import { Forms } from "./Table";

export default function Flashcards({
  data,
  settings,
}: {
  data: Dataset;
  settings: Settings;
}) {
  const { progress, record } = useProgress();
  // This only ever mounts once the data has loaded, i.e. client-side, so
  // drawing the first card during init cannot desync hydration.
  const [verb, setVerb] = useState(() => nextVerb(data.deck, progress));
  const [revealed, setRevealed] = useState(false);
  const [tally, setTally] = useState({ right: 0, wrong: 0 });

  const draw = useCallback(
    (avoid?: string) => {
      setVerb(nextVerb(data.deck, progress, avoid));
      setRevealed(false);
    },
    [data.deck, progress],
  );

  const row = data.verbs.get(verb);
  const pattern = row ? data.byId.get(row[0]) : undefined;
  if (!row || !pattern) return <p className="loading">Preparo il mazzo…</p>;

  function answer(correct: boolean) {
    record(verb, correct);
    setTally((t) => ({
      right: t.right + (correct ? 1 : 0),
      wrong: t.wrong + (correct ? 0 : 1),
    }));
    draw(verb);
  }

  return (
    <div className="stage">
      <Cat
        size={44}
        color={settings.hint ? pattern.colore : undefined}
        asleep={!revealed}
        title={settings.hint ? `Pattern: ${pattern.nome}` : "conju.gat"}
      />

      <h2 className="prompt">{verb}</h2>

      <div className="cue">
        {settings.hint ? (
          <>
            <span className="chip" style={{ background: pattern.colore }} />
            {settings.showPatternName && <span>{pattern.nome}</span>}
          </>
        ) : (
          <span>indizio disattivato</span>
        )}
      </div>

      {!revealed ? (
        <>
          <p className="instruction">
            Coniugalo ad alta voce al presente d&apos;indicatiu, poi rivela.
          </p>
          <div className="actions">
            <button className="btn primary" onClick={() => setRevealed(true)}>
              Rivela
            </button>
          </div>
        </>
      ) : (
        <div className="reveal">
          <div className="card">
            <Forms row={row} pattern={pattern} colour={settings.hint} />
          </div>
          <div className="actions">
            <button className="btn bad" onClick={() => answer(false)}>
              L&apos;ho sbagliato
            </button>
            <button className="btn good" onClick={() => answer(true)}>
              Lo sapevo
            </button>
          </div>
        </div>
      )}

      <div className="tally">
        <span>giuste {tally.right}</span>
        <span>sbagliate {tally.wrong}</span>
        <span>mazzo {data.deck.length}</span>
      </div>
    </div>
  );
}
