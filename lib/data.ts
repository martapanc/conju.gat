export const PERSONS = [
  "jo",
  "tu",
  "ell / ella",
  "nosaltres",
  "vosaltres",
  "ells / elles",
] as const;

export type Family =
  | "regular-1"
  | "ortho-1"
  | "segona"
  | "incoativa-3"
  | "pura-3"
  | "irregolare";

export type Variant = {
  esempio: string;
  sig: string[];
  n: number;
  formes: (string | null)[];
};

export type Shape =
  | "cercle"
  | "quadrat"
  | "triangle"
  | "rombe"
  | "creu"
  | "estrella"
  | "lluna"
  | "barra";

export type Pattern = {
  id: string;
  fam: Family;
  nome: string;
  colore: string;
  /** shape of the mark — carries the subtype that flat colour cannot */
  forma: Shape;
  /** filled or outlined: one more bit of identity */
  ple: boolean;
  esempio: string;
  sig: string[];
  n: number;
  varianti: Variant[];
};

/** verb -> [patternId, ...six forms]; null = defective cell (caler) */
export type VerbRow = [string, ...(string | null)[]];

export type Dataset = {
  patterns: Pattern[];
  byId: Map<string, Pattern>;
  verbs: Map<string, VerbRow>;
  /** pattern id -> its verbs, built once so lookups aren't O(all verbs) */
  byPattern: Map<string, string[]>;
  lemmas: string[];
  deck: string[];
};

export const FAMILY_LABEL: Record<Family, string> = {
  "regular-1": "1a conjugació regular",
  "ortho-1": "1a amb alternança ortogràfica",
  segona: "2a conjugació",
  "incoativa-3": "3a incoativa",
  "pura-3": "3a pura",
  irregolare: "irregulars",
};

/**
 * The palette lives in the data as flat hex, but the page has two themes and
 * black on black is invisible. Resolve every stored colour to its CSS token so
 * the marks follow the theme instead of fighting it.
 */
const TOKEN: Record<string, string> = {
  "#F6BE00": "var(--groc)",
  "#D8232A": "var(--vermell)",
  "#1B3FBB": "var(--blau)",
  "#141414": "var(--ink)",
};

export function colour(hex: string): string {
  return TOKEN[hex.toUpperCase()] ?? hex;
}

let cache: Promise<Dataset> | null = null;

export function loadData(): Promise<Dataset> {
  if (!cache) {
    cache = (async () => {
      const [patterns, verbs, deck] = await Promise.all([
        fetch("/data/patterns.json").then((r) => r.json() as Promise<Pattern[]>),
        fetch("/data/verbs.json").then(
          (r) => r.json() as Promise<Record<string, VerbRow>>,
        ),
        fetch("/data/deck.json").then((r) => r.json() as Promise<string[]>),
      ]);
      const map = new Map(Object.entries(verbs));
      const byPattern = new Map<string, string[]>();
      for (const [lemma, row] of map) {
        const list = byPattern.get(row[0]);
        if (list) list.push(lemma);
        else byPattern.set(row[0], [lemma]);
      }
      return {
        patterns,
        byId: new Map(patterns.map((p) => [p.id, p])),
        verbs: map,
        byPattern,
        lemmas: Array.from(map.keys()).sort((a, b) => a.localeCompare(b, "ca")),
        deck,
      };
    })();
  }
  return cache;
}

export function formsOf(row: VerbRow): (string | null)[] {
  return row.slice(1) as (string | null)[];
}

/** Strip accents for forgiving search only — never for answer checking. */
export function fold(s: string): string {
  return s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase();
}

export function search(data: Dataset, query: string, limit = 40): string[] {
  const q = fold(query.trim());
  if (!q) return [];
  const starts: string[] = [];
  const contains: string[] = [];
  for (const lemma of data.lemmas) {
    const f = fold(lemma);
    if (f.startsWith(q)) starts.push(lemma);
    else if (f.includes(q)) contains.push(lemma);
    if (starts.length >= limit) break;
  }
  return [...starts, ...contains].slice(0, limit);
}

/**
 * Split a form into the stem it shares with the pattern and the ending the
 * pattern dictates — the ending is what gets the colour.
 */
export function splitForm(
  form: string | null,
  ending: string,
): [string, string] {
  if (!form) return ["", ""];
  if (!ending || ending === "Ø" || ending === "·") return [form, ""];
  if (form.endsWith(ending)) return [form.slice(0, form.length - ending.length), ending];
  return [form, ""];
}

/**
 * Which signature applies to this verb: a pattern can hold accent variants
 * (fer/refer), so pick the variant whose endings actually fit the forms.
 */
export function signatureFor(pattern: Pattern, row: VerbRow): string[] {
  const forms = formsOf(row);
  const candidates = [pattern.sig, ...pattern.varianti.map((v) => v.sig)];
  let best = pattern.sig;
  let bestScore = -1;
  for (const sig of candidates) {
    let score = 0;
    forms.forEach((f, i) => {
      const e = sig[i];
      if (f && e && e !== "Ø" && f.endsWith(e)) score += e.length;
    });
    if (score > bestScore) {
      bestScore = score;
      best = sig;
    }
  }
  return best;
}
