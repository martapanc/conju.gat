"use client";

import { useEffect, useState } from "react";
import { FAMILY_LABEL, loadData, type Dataset, type Family } from "@/lib/data";
import { useProgress, useSettings } from "@/lib/store";
import Cat from "./Cat";
import Flashcards from "./Flashcards";
import Search from "./Search";
import Write from "./Write";

/** The mascot in the header wears the brand's own amber, not a pattern's hue —
 *  only the cat inside a drill takes on the colour of what you're studying. */
const BRAND = "#D98324";

const TABS = [
  { id: "cerca", label: "Cerca" },
  { id: "flashcard", label: "Flashcard" },
  { id: "escriu", label: "Scrivi" },
] as const;

type Tab = (typeof TABS)[number]["id"];

/** One swatch per family, so the legend teaches the code at a glance. */
const LEGEND: Family[] = [
  "regular-1",
  "ortho-1",
  "segona",
  "incoativa-3",
  "pura-3",
  "irregolare",
];

export default function Shell() {
  const [data, setData] = useState<Dataset | null>(null);
  const [failed, setFailed] = useState(false);
  const [tab, setTab] = useState<Tab>("cerca");
  const [showSettings, setShowSettings] = useState(false);
  const [settings, setSettings] = useSettings();
  const { reset } = useProgress();

  useEffect(() => {
    loadData().then(setData).catch(() => setFailed(true));
  }, []);

  const familyColour = (fam: Family) =>
    data?.patterns.find((p) => p.fam === fam)?.colore ?? "var(--rule)";

  return (
    <div className="shell">
      <header className="topbar">
        <Cat size={30} color={BRAND} />
        <h1 className="wordmark">
          <b>conju</b>
          <span>.gat</span>
        </h1>
        <span className="spacer" />
        <button
          className="iconbtn"
          aria-pressed={showSettings}
          aria-label="Impostazioni"
          onClick={() => setShowSettings((s) => !s)}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
            <circle cx="12" cy="12" r="3.2" />
            <path d="M12 2.5v3M12 18.5v3M2.5 12h3M18.5 12h3M5.2 5.2l2.1 2.1M16.7 16.7l2.1 2.1M18.8 5.2l-2.1 2.1M7.3 16.7l-2.1 2.1" strokeLinecap="round" />
          </svg>
        </button>
      </header>

      {showSettings && (
        <div className="settings">
          <div className="setting">
            <div>
              <label htmlFor="hint">Indizio del colore</label>
              <p>Mostra la tinta del pattern prima che tu risponda.</p>
            </div>
            <button
              id="hint"
              role="switch"
              aria-checked={settings.hint}
              aria-label="Indizio del colore"
              className="switch"
              onClick={() => setSettings((s) => ({ ...s, hint: !s.hint }))}
            />
          </div>
          <div className="setting">
            <div>
              <label htmlFor="pname">Nome del pattern</label>
              <p>Accanto al colore, scritto per esteso.</p>
            </div>
            <button
              id="pname"
              role="switch"
              aria-checked={settings.showPatternName}
              aria-label="Nome del pattern"
              className="switch"
              onClick={() =>
                setSettings((s) => ({ ...s, showPatternName: !s.showPatternName }))
              }
            />
          </div>
          <div className="setting">
            <button className="danger" onClick={reset}>
              Azzera i progressi
            </button>
          </div>
        </div>
      )}

      <div className="tabs" role="tablist">
        {TABS.map((t) => (
          <button
            key={t.id}
            role="tab"
            aria-selected={tab === t.id}
            className="tab"
            onClick={() => setTab(t.id)}
          >
            {t.label}
          </button>
        ))}
      </div>

      <main>
        {failed ? (
          <p className="empty">
            Non riesco a caricare i verbi. Controlla la connessione e ricarica.
          </p>
        ) : !data ? (
          <p className="loading">Carico gli 8.582 verbi…</p>
        ) : tab === "cerca" ? (
          <Search data={data} />
        ) : tab === "flashcard" ? (
          <Flashcards data={data} settings={settings} />
        ) : (
          <Write data={data} settings={settings} />
        )}

        {data && tab === "cerca" && (
          <div className="legend-strip">
            {LEGEND.map((fam) => (
              <span key={fam}>
                <span className="chip" style={{ background: familyColour(fam) }} />
                {FAMILY_LABEL[fam]}
              </span>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
