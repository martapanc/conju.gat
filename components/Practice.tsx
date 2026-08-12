"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  PERSONS,
  colour,
  formsOf,
  signatureFor,
  splitForm,
  type Dataset,
  type VerbRow,
} from "@/lib/data";
import {
  nextVerb,
  useProgress,
  useSettings,
  type Progress,
} from "@/lib/store";
import Mark from "./Mark";
import Nav from "./Nav";

const ACCENTS = ["à", "è", "é", "í", "ï", "ò", "ó", "ú", "ü", "ç", "l·l"];

export type Mode = "escriu" | "diu";

type Cell = { answer: string; ok: boolean | null };

const blank = (): Cell[] =>
  Array.from({ length: 6 }, () => ({ answer: "", ok: null }));

/** Skip the cells a defective verb hasn't got (caler has only 3s and 3p). */
function liveFrom(forms: (string | null)[], from: number): number {
  let i = from;
  while (i < 6 && !forms[i]) i += 1;
  return i;
}

type Round = { verb: string; index: number; cells: Cell[]; done: boolean };

/** Building the round eagerly keeps setup out of an effect entirely. */
function startRound(
  data: Dataset,
  progress: Progress,
  avoid?: string,
  pinned?: string,
): Round {
  const verb =
    pinned && data.verbs.has(pinned)
      ? pinned
      : nextVerb(data.deck, progress, avoid);
  const row = data.verbs.get(verb) as VerbRow;
  return { verb, index: liveFrom(formsOf(row), 0), cells: blank(), done: false };
}

export default function Practice({
  data,
  mode,
  /** ?v= — the verb you arrived to practise, used for the first round only */
  initialVerb,
}: {
  data: Dataset;
  mode: Mode;
  initialVerb?: string | null;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [settings] = useSettings();
  const { progress, record } = useProgress();
  const [round, setRound] = useState<Round>(() =>
    startRound(data, progress, undefined, initialVerb ?? undefined),
  );
  const input = useRef<HTMLInputElement>(null);

  const { verb, index, cells, done } = round;
  const row = data.verbs.get(verb);
  const forms = row ? formsOf(row) : [];

  useEffect(() => {
    if (mode === "escriu") input.current?.focus();
  }, [index, verb, mode]);

  if (!row) return null;
  const pattern = data.byId.get(row[0]);
  if (!pattern) return null;

  const sig = signatureFor(pattern, row);
  const finished = done || index >= 6;
  const live = forms.filter(Boolean).length;
  const answered = cells.filter((c) => c.ok !== null).length;

  function commit(answer: string) {
    const expected = forms[index];
    const ok =
      !expected || answer.trim().toLowerCase() === expected.toLowerCase();
    const cells2 = round.cells.map((c, i) => (i === index ? { answer, ok } : c));
    const following = liveFrom(forms, index + 1);
    const finishing = following >= 6;

    setRound({ ...round, cells: cells2, index: following, done: finishing });
    if (finishing) record(verb, cells2.every((c) => c.ok !== false));
  }

  /** Speaking aloud is one reveal for the whole paradigm, then self-assessed. */
  function revealAll() {
    setRound({ ...round, index: 6, done: true });
  }

  function advance(knew?: boolean) {
    if (knew !== undefined) record(verb, knew);
    // The pinned verb is spent: drop it from the URL so the address keeps
    // telling the truth about what's on screen.
    if (initialVerb) router.replace(pathname);
    setRound(startRound(data, progress, verb));
  }

  function insert(ch: string) {
    const el = input.current;
    if (!el) return;
    const start = el.selectionStart ?? el.value.length;
    const end = el.selectionEnd ?? start;
    el.value = el.value.slice(0, start) + ch + el.value.slice(end);
    el.focus();
    el.setSelectionRange(start + ch.length, start + ch.length);
  }

  return (
    <>
      <Nav
        right={
          <>
            {mode === "escriu" && (
              <span>
                {Math.min(answered, live)}/{live}
              </span>
            )}
            <Link href={`/consulta?v=${encodeURIComponent(verb)}`}>
              consulta&apos;l
            </Link>
          </>
        }
      />

      <div className="practice">
        <div className="optical">
          {/* The pattern sits with the verb, at a size you can actually read. */}
          {settings.hint && (
            <p className="patcue">
              <Mark pattern={pattern} size={16} />
              <span>{pattern.nome}</span>
            </p>
          )}

          <h1 className="verb-big">{verb}</h1>

          {!finished && (
            <>
              {/* Only the written drill asks for one person at a time. */}
              {mode === "escriu" && (
                <p className="person-label">{PERSONS[index]}</p>
              )}

              {mode === "escriu" ? (
                <>
                  <input
                    ref={input}
                    className="answer-field"
                    key={`${verb}-${index}`}
                    defaultValue=""
                    autoComplete="off"
                    autoCapitalize="off"
                    autoCorrect="off"
                    spellCheck={false}
                    aria-label={`Forma per a ${PERSONS[index]}`}
                    onKeyDown={(e) => {
                      if (e.key !== "Enter") return;
                      e.preventDefault();
                      commit(e.currentTarget.value);
                    }}
                  />
                  <div className="accents">
                    {ACCENTS.map((ch) => (
                      <button
                        key={ch}
                        type="button"
                        tabIndex={-1}
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() => insert(ch)}
                      >
                        {ch}
                      </button>
                    ))}
                  </div>
                </>
              ) : (
                <p className="muted">
                  Conjuga&apos;l sencer en veu alta, i després mostra&apos;l.
                </p>
              )}
            </>
          )}
        </div>

        <div className="paradigm">
          <ol>
            {PERSONS.map((person, i) => {
              const cell = cells[i];
              // In the oral drill nothing shows until the single reveal.
              const shown = mode === "diu" ? finished : i < index || finished;
              const [stem, end] = splitForm(forms[i], sig[i] ?? "");
              return (
                <li key={person} data-current={i === index && !finished}>
                  <span className="p-person">{person}</span>
                  <span className="p-form">
                    {!forms[i] ? (
                      <span className="muted">—</span>
                    ) : shown ? (
                      <>
                        {stem}
                        <span
                          className="tone"
                          style={{
                            color: settings.hint
                              ? colour(pattern.text)
                              : undefined,
                          }}
                        >
                          {end}
                        </span>
                      </>
                    ) : i === index && mode === "escriu" ? (
                      <span className="caret" />
                    ) : null}
                  </span>
                  {shown && cell.ok === false && (
                    <span className="p-verdict" data-ok="false">
                      <s>{cell.answer || "en blanc"}</s>
                    </span>
                  )}
                </li>
              );
            })}
          </ol>
        </div>

        <div className="actions">
          {mode === "diu" ? (
            finished ? (
              <>
                <button className="btn" onClick={() => advance(false)}>
                  No ho sabia
                </button>
                <button className="btn solid" onClick={() => advance(true)}>
                  Ho sabia
                </button>
              </>
            ) : (
              <button className="btn solid" onClick={revealAll}>
                Mostra el paradigma
              </button>
            )
          ) : finished ? (
            <>
              {cells.some((c) => c.ok === false) && (
                <Link
                  className="btn"
                  href={`/consulta?v=${encodeURIComponent(verb)}`}
                >
                  Estudia&apos;l
                </Link>
              )}
              <button className="btn solid" onClick={() => advance()}>
                Següent verb
              </button>
            </>
          ) : (
            <button
              className="btn solid"
              onClick={() => commit(input.current?.value ?? "")}
            >
              Comprova
            </button>
          )}
        </div>
      </div>
    </>
  );
}
