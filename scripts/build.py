"""Build the conju.gat present-indicative dataset.

Pipeline:
  1. generate  — apply verbecc templates to every verb
  2. repair    — where Softcatala disagrees, adopt its form:
                 (a) accent-only mismatch  -> unambiguous, take it
                 (b) otherwise             -> pick the Central Catalan variant
  3. review    — anything still unresolved is flagged for manual curation
  4. cluster   — group verbs by their present-tense signature; a cluster is a colour
"""

from __future__ import annotations

import collections
import json
import sys
import unicodedata
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))
from verbiste import PERSONS, Template, conjugate, load_templates, load_verbs  # noqa: E402

ROOT = Path(__file__).resolve().parent.parent
RAW = ROOT / "data" / "raw"
OUT = ROOT / "data" / "out"

TENSE = "indicatiu.present"
TAGS = {p: f"VMIP{p[0]}{p[1].upper()}" for p in PERSONS}


def deaccent(s: str) -> str:
    return "".join(c for c in unicodedata.normalize("NFD", s) if unicodedata.category(c) != "Mn")


def levenshtein(a: str, b: str) -> int:
    prev = list(range(len(b) + 1))
    for i, ca in enumerate(a, 1):
        cur = [i]
        for j, cb in enumerate(b, 1):
            cur.append(min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (ca != cb)))
        prev = cur
    return prev[-1]


def verb_class(infinitive: str) -> str:
    if infinitive.endswith("ar"):
        return "1"
    if infinitive.endswith("ir"):
        return "3"
    return "2"


# Preference rules for Central Catalan, applied to Softcatala's variant set.
# Valencian (-e 1s, -ix, -isc) and Balearic (bare 1s, -am/-au, -eis) lose.
def centrality(form: str, person: str, cls: str) -> int:
    score = 0
    if person == "1s":
        if form.endswith("o"):
            score += 10
        elif form.endswith("c"):
            score += 4
        if cls == "3":
            if form.endswith("eixo"):
                score += 6
            if form.endswith(("esc", "isc", "ix")):
                score -= 8
    elif person in ("2s", "3s", "3p"):
        if cls == "3":
            if "eix" in form:
                score += 8
            elif form.endswith(("ix", "ixes", "ixen")):
                score -= 8
        if person == "2s" and form.endswith("s"):
            score += 2
        if person == "3p" and form.endswith("en"):
            score += 2
    elif person == "1p":
        if form.endswith(("em", "im", "ïm")):
            score += 10
        if form.endswith("am"):
            score -= 10
    elif person == "2p":
        if form.endswith(("eu", "iu", "ïu")):
            score += 10
        if form.endswith(("au", "is")):
            score -= 10
    return score


def load_truth() -> dict[tuple[str, str], set[str]]:
    wanted = {tag: person for person, tag in TAGS.items()}
    truth: dict[tuple[str, str], set[str]] = collections.defaultdict(set)
    with open(RAW / "softcatala-diccionari.txt", encoding="utf-8") as fh:
        for line in fh:
            parts = line.split()
            if len(parts) != 3:
                continue
            form, lemma, tag = parts
            person = wanted.get(tag[:6])
            if person:
                truth[(lemma, person)].add(form)
    return truth


def common_prefix(a: str, b: str) -> int:
    n = 0
    while n < min(len(a), len(b)) and a[n] == b[n]:
        n += 1
    return n


def pick_central(accepted: set[str], person: str, cls: str, infinitive: str, generated: str) -> str:
    """Choose the Central Catalan variant.

    After the ending rules, prefer the form whose stem still looks like the
    infinitive (neixo over naixo, trec over trac) — but only in the singular and
    3rd plural, where the stressed stem surfaces; in 1p/2p the stem legitimately
    shifts. Last tiebreak: the shorter form (vull over Valencian vullc).
    """
    stem_matters = person in ("1s", "2s", "3s", "3p")
    base = deaccent(infinitive)
    return max(
        accepted,
        key=lambda f: (
            centrality(f, person, cls),
            common_prefix(deaccent(f), base) if stem_matters else 0,
            -len(f),
            -levenshtein(f, generated),
        ),
    )


def load_overrides(templates: dict[str, Template]) -> tuple[dict[str, str], dict[str, list]]:
    path = ROOT / "data" / "overrides.json"
    if not path.exists():
        return {}, {}
    ov = json.loads(path.read_text(encoding="utf-8"))
    for name, spec in ov.get("templates", {}).items():
        tpl = Template(name=name, suffix=spec["suffix"])
        for tense, endings in spec.items():
            if tense.startswith("_") or tense == "suffix":
                continue
            tpl.cells[tense] = tuple((e,) for e in endings)
        templates[name] = tpl
    return ov.get("assign", {}), ov.get("forms", {})


def main() -> None:
    templates = load_templates(str(RAW / "conj-ca.xml"))
    verbs = load_verbs(str(RAW / "verbs-ca.xml"))
    truth = load_truth()
    assign, explicit = load_overrides(templates)
    verbs.update(assign)

    dataset: dict[str, dict] = {}
    review: dict[str, dict] = {}
    stats = collections.Counter()

    for inf in sorted(set(verbs) | set(explicit)):
        if inf in explicit:
            forms = {p: f for p, f in zip(PERSONS, explicit[inf]) if f}
            dataset[inf] = {
                "template": "manuale",
                "classe": verb_class(inf),
                "forme": forms,
                "note": {p: "manuale" for p in forms},
            }
            stats["manuale"] += 1
            continue

        tpl = templates.get(verbs[inf])
        if tpl is None:
            stats["template_mancante"] += 1
            continue
        rows = conjugate(inf, tpl, TENSE)
        if rows is None:
            stats["template_inapplicabile"] += 1
            review[inf] = {"errore": f"template {verbs[inf]} non applicabile a {inf}"}
            continue
        if not any((inf, p) in truth for p in PERSONS):
            stats["assente_da_softcatala"] += 1
            continue

        cls = verb_class(inf)
        forms, notes, unresolved = {}, {}, False
        for person, variants in zip(PERSONS, rows):
            generated = variants[0]
            accepted = truth.get((inf, person), set())
            if not accepted:
                forms[person] = generated
                notes[person] = "generato"
                continue
            if generated in accepted:
                forms[person] = generated
                notes[person] = "ok"
                continue

            same_accent = [a for a in accepted if deaccent(a) == deaccent(generated)]
            if len(same_accent) == 1:
                forms[person] = same_accent[0]
                notes[person] = "accento"
                stats["riparato_accento"] += 1
                continue

            best = pick_central(accepted, person, cls, inf, generated)
            forms[person] = best
            top = centrality(best, person, cls)
            rivals = [f for f in accepted if f != best and centrality(f, person, cls) == top]
            if rivals and person in ("1p", "2p"):
                notes[person] = "ambiguo"
                unresolved = True
                stats["ambiguo"] += 1
            else:
                notes[person] = "dialetto"
                stats["riparato_dialetto"] += 1

        dataset[inf] = {"template": tpl.name, "classe": cls, "forme": forms, "note": notes}
        if unresolved:
            review[inf] = {
                "forme": forms,
                "note": notes,
                "alternative": {
                    p: sorted(truth.get((inf, p), set()))
                    for p, n in notes.items()
                    if n == "ambiguo"
                },
            }

    stats["verbi"] = len(dataset)
    stats["da_rivedere"] = len(review)

    # ---- clustering: the signature is the tuple of endings after the common radical
    def signature(forms: dict[str, str]) -> tuple[str, ...]:
        vals = [forms.get(p) or "·" for p in PERSONS]  # · = cella difettiva (caler)
        n = 0
        while n < min(len(v) for v in vals) and len({v[: n + 1] for v in vals}) == 1:
            n += 1
        return tuple(v[n:] or "Ø" for v in vals)

    # Verbs that differ only by an accent are the same mechanism (fer/refer,
    # prendre/aprendre): they share a cluster, and the accent survives as a
    # variant inside it — the writing drill still needs the exact spelling.
    clusters: dict[tuple[str, ...], dict[tuple[str, ...], list[str]]] = collections.defaultdict(
        lambda: collections.defaultdict(list)
    )
    for inf, e in dataset.items():
        exact = signature(e["forme"])
        key = tuple(deaccent(x) for x in exact)
        clusters[key][exact].append(inf)

    def size(variants: dict) -> int:
        return sum(len(v) for v in variants.values())

    ranked = sorted(clusters.items(), key=lambda kv: -size(kv[1]))
    merged = sum(1 for _, variants in ranked if len(variants) > 1)
    print(f"verbi nel dataset : {len(dataset)}")
    print(f"cluster di presente: {len(ranked)}  (di cui {merged} con varianti d'accento)")
    print()
    print("=== cluster (>=3 verbi) ===")
    cum = 0
    for key, variants in ranked:
        n = size(variants)
        if n < 3:
            continue
        cum += n
        members = [v for vs in variants.values() for v in vs]
        example = sorted(members, key=len)[0]
        flag = f"  [{len(variants)} varianti]" if len(variants) > 1 else ""
        print(f"{n:5d} ({100*n/len(dataset):5.2f}%) cum {100*cum/len(dataset):5.1f}%  "
              f"{'-'.join(key):38s} es. {example}{flag}")
    tail = sum(size(v) for _, v in ranked if size(v) < 3)
    print(f"\ncoda (cluster con 1-2 verbi): {tail} verbi in {sum(1 for _, v in ranked if size(v) < 3)} cluster")
    print()
    print("statistiche:", dict(stats))

    OUT.mkdir(parents=True, exist_ok=True)
    (OUT / "present.json").write_text(json.dumps(dataset, ensure_ascii=False, indent=1), encoding="utf-8")
    (OUT / "review.json").write_text(json.dumps(review, ensure_ascii=False, indent=1), encoding="utf-8")
    (OUT / "clusters.json").write_text(
        json.dumps(
            [
                {
                    "signature": list(max(variants, key=lambda s: len(variants[s]))),
                    "verbs": sorted(v for vs in variants.values() for v in vs),
                    "varianti": [
                        {"signature": list(sig), "verbs": sorted(vs)}
                        for sig, vs in sorted(variants.items(), key=lambda kv: -len(kv[1]))
                    ],
                }
                for _, variants in ranked
            ],
            ensure_ascii=False,
            indent=1,
        ),
        encoding="utf-8",
    )


if __name__ == "__main__":
    main()
