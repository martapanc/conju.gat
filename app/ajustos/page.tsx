"use client";

import Nav from "@/components/Nav";
import { useProgress, useSettings } from "@/lib/store";

export default function AjustosPage() {
  const [settings, setSettings] = useSettings();
  const { progress, reset } = useProgress();
  const studied = Object.keys(progress).length;

  return (
    <>
      <Nav />
      <div className="page">
        <aside>
          <h1>Ajustos</h1>
        </aside>
        <div className="settings">
          <div className="setting">
            <div className="setting-text">
              <b>Pista de color</b>
              <p>
                Mostra el senyal del patró mentre practiques. Apaga-la quan ja
                no et faci falta.
              </p>
            </div>
            <button
              role="switch"
              aria-checked={settings.hint}
              aria-label="Pista de color"
              className="switch"
              onClick={() => setSettings((s) => ({ ...s, hint: !s.hint }))}
            />
          </div>
          <div className="setting">
            <div className="setting-text">
              <b>Progrés</b>
              <p>
                {studied} {studied === 1 ? "verb practicat" : "verbs practicats"}{" "}
                en aquest dispositiu. No surt res del navegador.
              </p>
            </div>
            <button className="btn" style={{ flex: "none" }} onClick={reset}>
              Esborra
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
