"""Assign a colour to every present-tense cluster.

Design rules agreed up front:
  - the huge regular class stays NEUTRAL, so colour means "something to watch"
  - one hue per mechanism family, shades within it for the orthographic triggers
  - a handful of vivid accents reserved for the memorise-one-by-one irregulars
  - never colour alone: every pattern also carries a readable name
"""

from __future__ import annotations

import collections
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "data" / "out"
PERSONS = ("1s", "2s", "3s", "1p", "2p", "3p")

REGULAR_1 = ("o", "es", "a", "em", "eu", "en")

# One hue per conjugation: 1a amber, 2a red, 3a teal/blue. Violet is left free
# for `ser`, the verb that earns the most distinct tint on the page.
ACCENTS = {
    "ser": ("#8E44AD", "ser / ésser"),
    "anar": ("#E0662A", "anar"),
    "fer": ("#C9A227", "fer"),
    "estar": ("#4AA05A", "estar"),
    "tenir": ("#5566CC", "tenir / venir"),
    "poder": ("#17A2A2", "poder"),
    "dir": ("#C0399B", "dir"),
    "veure": ("#3D7BD6", "veure"),
    "saber": ("#8A6D3B", "saber"),
    "voler": ("#D1506B", "voler"),
}

FAMILIES = {
    "regular-1": {"nom": "1a regolare", "color": "#8A8F98"},
    "ortho-1": {"nom": "1a, alternanza ortografica", "color": "#D98324"},
    "incoativa-3": {"nom": "3a incoativa (-eix-)", "color": "#1F9E88"},
    "pura-3": {"nom": "3a pura", "color": "#2A6DA8"},
    "segona": {"nom": "2a coniugazione", "color": "#C2413A"},
}

# Shades within a family, applied by cluster size rank.
SHADES = {
    "ortho-1": ["#D98324", "#B8651A", "#E8A33D", "#F0C173", "#9C5210"],
    "incoativa-3": ["#1F9E88", "#157A69", "#4FBFAA"],
    "pura-3": ["#2A6DA8", "#1B4D7A", "#5C97C8", "#8FBBDD"],
    "segona": ["#C2413A", "#9B2E28", "#D4685F", "#E39189", "#AE3730", "#7F221D"],
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


def main() -> None:
    dataset = json.loads((OUT / "present.json").read_text(encoding="utf-8"))
    clusters = json.loads((OUT / "clusters.json").read_text(encoding="utf-8"))

    used_shade = collections.Counter()
    patterns, verb_index = [], {}

    # Accent clusters first, so they win over their family colour.
    accent_for: dict[int, tuple[str, str]] = {}
    for i, c in enumerate(clusters):
        for verb, (color, label) in ACCENTS.items():
            if verb in c["verbs"] and i not in accent_for:
                accent_for[i] = (color, label)

    for i, c in enumerate(clusters):
        members = c["verbs"]
        signature = tuple(c["signature"])
        cls = collections.Counter(dataset[v]["classe"] for v in members).most_common(1)[0][0]
        family = classify(signature, cls)
        exemplar = pick_exemplar(members)

        if i in accent_for:
            color, label = accent_for[i]
            family, nom = "irregolare", f"irregolare: {label}"
        else:
            shades = SHADES.get(family)
            if shades:
                color = shades[min(used_shade[family], len(shades) - 1)]
                used_shade[family] += 1
            else:
                color = FAMILIES[family]["color"]
            nom = f"{FAMILIES[family]['nom']} · tipo {exemplar}"

        # Accent variants inside one pattern (fer/refer, aprèn/entén): same
        # mechanism, same colour, but the drill still needs the exact spelling.
        varianti = []
        for var in c.get("varianti", []):
            if len(c.get("varianti", [])) < 2:
                break
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
            "colore": color,
            "signature": list(signature),
            "esempio": exemplar,
            "forme_esempio": [dataset[exemplar]["forme"].get(p) for p in PERSONS],
            "n_verbi": len(members),
            "varianti": varianti,
            "verbi": members,
        })
        for v in members:
            verb_index[v] = {"pattern": pid, "forme": [dataset[v]["forme"].get(p) for p in PERSONS]}

    (OUT / "patterns.json").write_text(json.dumps(patterns, ensure_ascii=False, indent=1), encoding="utf-8")
    (OUT / "verbs.json").write_text(json.dumps(verb_index, ensure_ascii=False, indent=1), encoding="utf-8")

    total = sum(p["n_verbi"] for p in patterns)
    print(f"{len(patterns)} pattern, {total} verbi\n")
    by_family = collections.Counter()
    for p in patterns:
        by_family[p["famiglia"]] += p["n_verbi"]
    print("copertura per famiglia:")
    for fam, n in by_family.most_common():
        print(f"  {fam:14s} {n:5d}  {100*n/total:5.1f}%")
    print("\ntop 20 pattern:")
    for p in patterns[:20]:
        print(f"  {p['colore']}  {p['n_verbi']:5d}  {p['esempio']:12s} "
              f"{' '.join(f or '—' for f in p['forme_esempio'])}")


if __name__ == "__main__":
    main()
