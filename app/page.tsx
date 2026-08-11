"use client";

import Link from "next/link";
import Cat from "@/components/Cat";
import Mark from "@/components/Mark";
import Nav from "@/components/Nav";
import PatternRow from "@/components/PatternRow";
import { FAMILY_LABEL, type Dataset, type Family } from "@/lib/data";
import { WithData } from "./providers";

const ORDER: Family[] = [
  "regular-1",
  "ortho-1",
  "segona",
  "incoativa-3",
  "pura-3",
  "irregolare",
];

const BLURB: Record<Family, string> = {
  "regular-1":
    "Dos verbs de cada tres. El senyal és buit perquè no hi ha res a recordar: preneu la rel i afegiu-hi les terminacions.",
  "ortho-1":
    "El mateix mecanisme que la regular. Només canvia la grafia davant de e, perquè el so es manté: j→g, c→qu, g→gu, ç→c. La forma del senyal diu quin canvi toca.",
  segona:
    "El terreny irregular. La rel canvia entre el singular i el plural, i sovint apareix una -c a la primera persona: bec però bevem, trec però traiem.",
  "incoativa-3":
    "Hi entra l'infix -eix- a les quatre formes fortes, i desapareix a nosaltres i vosaltres. És el grup gran de la tercera.",
  "pura-3": "Sense infix: la rel es queda nua a totes sis.",
  irregolare:
    "Deu verbs que no responen a cap regla i s'aprenen d'un en un. Senyal negre ple: tot per recordar.",
};

export default function Home() {
  return (
    <>
      <Nav />
      <WithData>{(data) => <Explanation data={data} />}</WithData>
    </>
  );
}

function Explanation({ data }: { data: Dataset }) {
  const top = [...data.patterns].sort((a, b) => b.n - a.n).slice(0, 8);

  return (
    <div className="page">
      <aside>
        <h1>
          El color és el
          <br />
          mecanisme
        </h1>
        <div style={{ marginTop: "var(--s5)" }}>
          <Cat size={110} />
        </div>
      </aside>

      <div>
        <section className="prose" style={{ marginBottom: "var(--s6)" }}>
          <p>
            El català té més de vuit mil verbs, però només una cinquantena de
            maneres de conjugar-los al present. Vuit d&apos;aquestes maneres en
            cobreixen més del noranta per cent. Si aprens el mecanisme, has
            après tota la família de cop.
          </p>
          <p>
            Cada mecanisme porta un senyal, i el senyal diu dues coses alhora:
            el <b>color</b> és la conjugació, la <b>forma</b> és el subtipus.
          </p>
        </section>

        <section style={{ marginBottom: "var(--s6)" }}>
          <h2>Com es llegeix un senyal</h2>
          <ul className="reading">
            <li>
              <span className="swatch" style={{ background: "var(--groc)" }} />
              <span>
                <b>Groc</b> — primera conjugació, els verbs en <i>-ar</i>
              </span>
            </li>
            <li>
              <span className="swatch" style={{ background: "var(--vermell)" }} />
              <span>
                <b>Vermell</b> — segona, els verbs en <i>-re</i> i <i>-er</i>
              </span>
            </li>
            <li>
              <span className="swatch" style={{ background: "var(--blau)" }} />
              <span>
                <b>Blau</b> — tercera, els verbs en <i>-ir</i>
              </span>
            </li>
            <li>
              <span className="swatch outline" />
              <span>
                <b>Buit</b> — la primera regular: res a recordar
              </span>
            </li>
            <li>
              <span className="swatch" style={{ background: "var(--ink)" }} />
              <span>
                <b>Negre ple</b> — un dels deu irregulars: tot a recordar
              </span>
            </li>
          </ul>
        </section>

        <section style={{ marginBottom: "var(--s6)" }}>
          <h2>Els patrons més comuns</h2>
          <p className="muted" style={{ marginBottom: "var(--s3)" }}>
            La part en color és la que decideix el patró; la resta és la rel del
            verb.
          </p>
          <div className="plist">
            {top.map((p) => (
              <PatternRow key={p.id} pattern={p} data={data} forms />
            ))}
          </div>
        </section>

        <section>
          <h2>Tots els patrons</h2>
          {ORDER.map((fam) => {
            const members = data.patterns
              .filter((p) => p.fam === fam)
              .sort((a, b) => b.n - a.n);
            if (members.length === 0) return null;
            const n = members.reduce((s, p) => s + p.n, 0);
            return (
              <details key={fam} className="family">
                <summary>
                  <Mark pattern={members[0]} size={13} />
                  <span className="fam-name">{FAMILY_LABEL[fam]}</span>
                  <span className="fam-n">
                    {n.toLocaleString("ca")} verbs · {members.length}{" "}
                    {members.length === 1 ? "patró" : "patrons"}
                  </span>
                </summary>
                <p className="muted fam-blurb">{BLURB[fam]}</p>
                <div className="plist">
                  {members.map((p) => (
                    <PatternRow key={p.id} pattern={p} data={data} forms />
                  ))}
                </div>
              </details>
            );
          })}
        </section>

        <p className="muted" style={{ marginTop: "var(--s6)" }}>
          Quan tinguis la lògica clara: <Link href="/digues">digues-ho</Link> en
          veu alta o <Link href="/escriu">escriu-ho</Link>.
        </p>
        <p className="muted source-note">
          Les xifres que acompanyen cada patró són el nombre de verbs al
          diccionari de Softcatalà, no un cens de la llengua.
        </p>
      </div>
    </div>
  );
}
