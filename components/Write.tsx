"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { PERSONS, formsOf, type Dataset } from "@/lib/data";
import { nextVerb, useProgress, type Settings } from "@/lib/store";
import Cat from "./Cat";

const ACCENTS = ["à", "è", "é", "í", "ï", "ò", "ó", "ú", "ü", "ç", "l·l"];

const empty = ["", "", "", "", "", ""];

export default function Write({
  data,
  settings,
}: {
  data: Dataset;
  settings: Settings;
}) {
  const { progress, record } = useProgress();
  // Mounts only after the data has loaded, i.e. client-side: drawing the first
  // verb during init is safe and avoids a setState-in-effect round trip.
  const [verb, setVerb] = useState(() => nextVerb(data.deck, progress));
  const [answers, setAnswers] = useState<string[]>(empty);
  const [checked, setChecked] = useState(false);
  const [tally, setTally] = useState({ right: 0, wrong: 0 });
  const inputs = useRef<(HTMLInputElement | null)[]>([]);
  const focused = useRef(0);

  // Focus is a DOM side effect, not state — an effect is the right home for it.
  useEffect(() => {
    inputs.current[0]?.focus();
  }, [verb]);

  const draw = useCallback(
    (avoid?: string) => {
      setVerb(nextVerb(data.deck, progress, avoid));
      setAnswers(empty);
      setChecked(false);
    },
    [data.deck, progress],
  );

  const row = data.verbs.get(verb);
  const pattern = row ? data.byId.get(row[0]) : undefined;
  if (!row || !pattern) return <p className="loading">Preparo l&apos;esercizio…</p>;

  const correct = formsOf(row);
  // Accents are the whole point of the written drill — only case and spacing forgiven.
  const isRight = (i: number) =>
    !correct[i] || answers[i].trim().toLowerCase() === correct[i]!.toLowerCase();

  function check() {
    setChecked(true);
    const allRight = correct.every((_, i) => isRight(i));
    record(verb, allRight);
    setTally((t) => ({
      right: t.right + (allRight ? 1 : 0),
      wrong: t.wrong + (allRight ? 0 : 1),
    }));
  }

  function insert(ch: string) {
    const idx = focused.current;
    const el = inputs.current[idx];
    if (!el) return;
    const start = el.selectionStart ?? el.value.length;
    const end = el.selectionEnd ?? start;
    const next = el.value.slice(0, start) + ch + el.value.slice(end);
    setAnswers((a) => a.map((v, i) => (i === idx ? next : v)));
    requestAnimationFrame(() => {
      el.focus();
      el.setSelectionRange(start + ch.length, start + ch.length);
    });
  }

  return (
    <div className="stage" style={{ alignItems: "stretch" }}>
      <div style={{ display: "flex", alignItems: "center", gap: ".7rem", justifyContent: "center" }}>
        <Cat size={32} color={settings.hint ? pattern.colore : undefined} asleep={!checked} />
        <h2 className="prompt" style={{ fontSize: "clamp(1.8rem, 8vw, 2.4rem)" }}>
          {verb}
        </h2>
      </div>

      <div className="cue" style={{ justifyContent: "center" }}>
        {settings.hint ? (
          <>
            <span className="chip" style={{ background: pattern.colore }} />
            {settings.showPatternName && <span>{pattern.nome}</span>}
          </>
        ) : (
          <span>indizio disattivato</span>
        )}
      </div>

      <div className="grid">
        {PERSONS.map((person, i) => {
          const state = !checked ? "" : isRight(i) ? "ok" : "no";
          return (
            <div key={person}>
              <div className={`field ${state}`}>
                <span className="person">{person}</span>
                <input
                  ref={(el) => {
                    inputs.current[i] = el;
                  }}
                  value={answers[i]}
                  disabled={checked || !correct[i]}
                  placeholder={correct[i] ? "" : "— non esiste"}
                  autoComplete="off"
                  autoCapitalize="off"
                  spellCheck={false}
                  aria-label={`Forma per ${person}`}
                  onFocus={() => {
                    focused.current = i;
                  }}
                  onChange={(e) =>
                    setAnswers((a) => a.map((v, j) => (j === i ? e.target.value : v)))
                  }
                  onKeyDown={(e) => {
                    if (e.key !== "Enter") return;
                    e.preventDefault();
                    const next = inputs.current
                      .slice(i + 1)
                      .find((el) => el && !el.disabled);
                    if (next) next.focus();
                    else if (!checked) check();
                  }}
                />
                {checked && (
                  <span className={`verdict ${state}`}>{state === "ok" ? "✓" : "✕"}</span>
                )}
              </div>
              {checked && state === "no" && (
                <p className="answer">{correct[i]}</p>
              )}
            </div>
          );
        })}
      </div>

      {!checked && (
        <div className="accents">
          {ACCENTS.map((ch) => (
            <button key={ch} type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => insert(ch)}>
              {ch}
            </button>
          ))}
        </div>
      )}

      <div className="actions">
        {!checked ? (
          <button className="btn primary" onClick={check}>
            Comprova
          </button>
        ) : (
          <button className="btn primary" onClick={() => draw(verb)}>
            Verbo successivo
          </button>
        )}
      </div>

      <div className="tally">
        <span>perfette {tally.right}</span>
        <span>con errori {tally.wrong}</span>
      </div>
    </div>
  );
}
