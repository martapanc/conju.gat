"""Assign a colour to every present-tense cluster.

Colour carries everything: one hue per conjugation, shades of it for the
subtypes, and a rainbow for the ten irregulars.

    buit (contorn)  1a regular — 64% of verbs, nothing to remember
    groc            1a amb alternança ortogràfica
    vermell         2a
    blau            3a incoativa
    verd aigua      3a pura
    arc de Sant Martí   els deu irregulars, un to cadascun

Each hue holds about six legible shades. Patterns past that are the deep tail
(three verbs or fewer): they share the family's base shade and are told apart
by name, never by colour alone.
"""

from __future__ import annotations

import collections
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "data" / "out"
PERSONS = ("1s", "2s", "3s", "1p", "2p", "3p")

REGULAR_1 = ("o", "es", "a", "em", "eu", "en")

NEGRE = "#141414"

# Shades run light-to-dark within a hue, biggest pattern first, and stay above
# a luminance floor so they survive the dark theme too.
SHADES = {
    "ortho-1": ["#F6BE00", "#C99400", "#FFD75E", "#A87F0A", "#FFE9A3"],
    "segona": [
        "#D8232A", "#8E1519", "#F0736B", "#A8443C",
        "#F7ADA6", "#6E2320", "#D9598A", "#C0797A",
    ],
    "incoativa-3": ["#1B3FBB", "#12308F", "#5B79E8", "#97AAF2"],
    "pura-3": ["#0E8A7D", "#0A5F56", "#3FBBAB", "#8AD8CC", "#17A392", "#04423C"],
}

# A tone each, chosen between the family hues so no irregular can be mistaken
# for a conjugation.
RAINBOW = {
    "ser": "#7A3FA8",
    "anar": "#E4640F",
    "fer": "#9A7B1F",
    "estar": "#3B8F4A",
    "tenir": "#0F8FA6",
    "poder": "#4A45C9",
    "dir": "#B23C96",
    "veure": "#2E9E6B",
    "saber": "#8A5A34",
    "voler": "#C7407A",
}

# Verbs learnt one by one, each with its own tone.
ACCENTS = {
    "ser": "ser / ésser",
    "anar": "anar",
    "fer": "fer",
    "estar": "estar",
    "tenir": "tenir / venir",
    "poder": "poder",
    "dir": "dir",
    "veure": "veure",
    "saber": "saber",
    "voler": "voler",
}

FAMILIES = {
    "regular-1": "1a conjugació regular",
    "ortho-1": "1a conjugació, alternança ortogràfica",
    "segona": "2a conjugació",
    "incoativa-3": "3a conjugació incoativa",
    "pura-3": "3a conjugació pura",
    "irregolare": "irregular",
}

# Preferred exemplars — a pattern is remembered by a verb you actually use.
COMMON = """ser estar tenir fer anar poder dir veure saber voler haver venir
parlar donar passar quedar trobar portar deixar pensar mirar arribar entrar
tornar esperar treballar cantar comprar ajudar estudiar canviar viatjar
menjar passejar netejar dibuixar trencar buscar pagar jugar pregar arribar
començar caçar liquar servir llegir vestir patir obeir traduir teixir lluir
dormir morir obrir collir sortir fugir cosir omplir tossir sentir
perdre vendre batre córrer prendre aprendre comprendre entendre atendre ofendre
dependre conèixer créixer merèixer vèncer témer moldre resoldre valer doldre
escriure viure beure creure riure seure caure treure jeure moure veure
néixer cabre refer desfer satisfer empènyer tòrcer""".split()
RANK = {v: i for i, v in enumerate(COMMON)}


def pick_exemplar(members: list[str]) -> str:
    return min(members, key=lambda v: (RANK.get(v, 10_000), len(v), v))


def classify(signature: tuple[str, ...], cls: str) -> str:
    if cls == "1":
        return "regular-1" if signature == REGULAR_1 else "ortho-1"
    if cls == "3":
        return "incoativa-3" if "eix" in "".join(signature) else "pura-3"
    return "segona"


def _luminance(hex_colour: str) -> float:
    r, g, b = (int(hex_colour[i : i + 2], 16) / 255 for i in (1, 3, 5))
    f = lambda c: c / 12.92 if c <= 0.03928 else ((c + 0.055) / 1.055) ** 2.4
    return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b)


def readable(hex_colour: str, ceiling: float = 0.28) -> str:
    """Darken a tone until it holds as body text on paper.

    A pale yellow is perfectly legible as a filled square and almost invisible
    as a letter, so marks and text get different values of the same hue.
    """
    r, g, b = (int(hex_colour[i : i + 2], 16) for i in (1, 3, 5))
    while _luminance(f"#{r:02x}{g:02x}{b:02x}") > ceiling and max(r, g, b) > 8:
        r, g, b = (int(c * 0.92) for c in (r, g, b))
    return f"#{r:02x}{g:02x}{b:02x}"


def shade_for(family: str, rank: int) -> str:
    """The rank-th shade of a family; the tail falls back to the base tone."""
    shades = SHADES[family]
    return shades[rank] if rank < len(shades) else shades[0]


def main() -> None:
    dataset = json.loads((OUT / "present.json").read_text(encoding="utf-8"))
    clusters = json.loads((OUT / "clusters.json").read_text(encoding="utf-8"))

    accent_for: dict[int, str] = {}
    for i, c in enumerate(clusters):
        for verb, label in ACCENTS.items():
            if verb in c["verbs"] and i not in accent_for:
                accent_for[i] = label

    patterns, verb_index = [], {}

    for i, c in enumerate(clusters):
        members = c["verbs"]
        signature = tuple(c["signature"])
        cls = collections.Counter(dataset[v]["classe"] for v in members).most_common(1)[0][0]
        family = "irregolare" if i in accent_for else classify(signature, cls)
        exemplar = pick_exemplar(members)

        nom = (
            f"irregular: {accent_for[i]}"
            if family == "irregolare"
            else f"{FAMILIES[family]} · tipus {exemplar}"
        )

        varianti = []
        if len(c.get("varianti", [])) > 1:
            for var in c["varianti"]:
                v_ex = pick_exemplar(var["verbs"])
                varianti.append({
                    "signature": var["signature"],
                    "esempio": v_ex,
                    "forme_esempio": [dataset[v_ex]["forme"].get(p) for p in PERSONS],
                    "n_verbi": len(var["verbs"]),
                })

        pid = f"p{i:02d}"
        patterns.append({
            "id": pid,
            "famiglia": family,
            "nome": nom,
            "colore": NEGRE,  # assigned below, once every size is known
            "text": NEGRE,
            "buit": family == "regular-1",
            "signature": list(signature),
            "esempio": exemplar,
            "forme_esempio": [dataset[exemplar]["forme"].get(p) for p in PERSONS],
            "n_verbi": len(members),
            "varianti": varianti,
            "verbi": members,
        })
        for v in members:
            verb_index[v] = {"pattern": pid, "forme": [dataset[v]["forme"].get(p) for p in PERSONS]}

    # Shades go to the biggest patterns first, so the tones you meet most
    # often are the clearest ones.
    for family, shades in SHADES.items():
        # Size first, then usefulness: between two patterns of equal weight the
        # tone goes to the one built on a verb you actually meet.
        members = sorted(
            (p for p in patterns if p["famiglia"] == family),
            key=lambda p: (-p["n_verbi"], RANK.get(p["esempio"], 10_000)),
        )
        # The square carries the subtype; the coloured ending carries only the
        # family. Three shades of yellow darkened for text all land on the same
        # olive, so claiming otherwise would be false precision.
        family_text = readable(shades[0])
        for rank, p in enumerate(members):
            p["colore"] = shade_for(family, rank)
            p["text"] = family_text
            if rank >= len(shades):
                p["cas_a_part"] = True

    for p in patterns:
        if p["famiglia"] == "irregolare":
            base = p["esempio"] if p["esempio"] in RAINBOW else None
            if base is None:
                base = next(
                    (v for v in p["verbi"] if v in RAINBOW), None
                )
            p["colore"] = RAINBOW.get(base or "", NEGRE)
            p["text"] = readable(p["colore"])

    (OUT / "patterns.json").write_text(json.dumps(patterns, ensure_ascii=False, indent=1), encoding="utf-8")
    (OUT / "verbs.json").write_text(json.dumps(verb_index, ensure_ascii=False, indent=1), encoding="utf-8")

    total = sum(p["n_verbi"] for p in patterns)
    by_family = collections.Counter()
    for p in patterns:
        by_family[p["famiglia"]] += p["n_verbi"]
    print(f"{len(patterns)} patterns, {total} verbs\n")
    for fam, n in by_family.most_common():
        print(f"  {fam:14s} {n:5d}  {100*n/total:5.1f}%")

    # A tone may repeat only in the declared tail, never among the big patterns.
    tones = collections.Counter(p["colore"] for p in patterns)
    shared = {c: n for c, n in tones.items() if n > 1}
    print(f"\ndistinct tones: {len(tones)} of {len(patterns)} patterns")
    if shared:
        print("shared tones (distinguished by name):")
        for col, n in sorted(shared.items(), key=lambda kv: -kv[1]):
            tail = [p for p in patterns if p["colore"] == col and p.get("cas_a_part")]
            print(f"  {col} x{n}  ({sum(p['n_verbi'] for p in tail)} verbs in tail)")

    print("\ntop 12:")
    for p in patterns[:12]:
        print(f"  {p['colore']} {'buit' if p['buit'] else 'ple '} "
              f"{p['n_verbi']:5d}  {p['esempio']:12s} "
              f"{' '.join(f or '—' for f in p['forme_esempio'])}")


if __name__ == "__main__":
    main()
