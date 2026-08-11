"""Assign a mark to every present-tense cluster.

Miró's vocabulary: flat primaries plus black, no gradients, no shades. That
gives four colours for 51 patterns, so colour carries the *conjugation* and the
shape of the mark carries the *subtype*:

    colour  groc = 1a ortogràfica · vermell = 2a · blau = 3a · negre = la resta
    shape   cercle / quadrat / triangle / rombe / creu / estrella / lluna
    fill    ple or buit — a second bit, so each hue holds fourteen marks

Two readings are reserved and never reused:
    quadrat buit negre  = 1a regular — 64% of verbs, nothing to remember
    ple negre           = the ten irregulars, each learnt on its own

Shape survives colour blindness and photocopying, which shades never did.
"""

from __future__ import annotations

import collections
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "data" / "out"
PERSONS = ("1s", "2s", "3s", "1p", "2p", "3p")

REGULAR_1 = ("o", "es", "a", "em", "eu", "en")

GROC = "#F6BE00"
VERMELL = "#D8232A"
BLAU = "#1B3FBB"
NEGRE = "#141414"

SHAPES = ["cercle", "quadrat", "triangle", "rombe", "creu", "estrella", "lluna"]

# 7 shapes × 2 fills = 14 distinct marks per hue. Patterns past that are the
# deep tail (three verbs or fewer) and share one honest "cas a part" mark —
# a silent collision would be a bug; a declared one is a category.
TAIL = "barra"

# Verbs learnt one by one: black, filled, each with its own shape.
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
    "regular-1": ("1a conjugació regular", NEGRE),
    "ortho-1": ("1a conjugació, alternança ortogràfica", GROC),
    "segona": ("2a conjugació", VERMELL),
    "incoativa-3": ("3a conjugació incoativa", BLAU),
    "pura-3": ("3a conjugació pura", BLAU),
    "irregolare": ("irregular", NEGRE),
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


COLOUR_OF = {
    "regular-1": NEGRE,
    "irregolare": NEGRE,
    "ortho-1": GROC,
    "segona": VERMELL,
    "incoativa-3": BLAU,
    "pura-3": BLAU,
}

# Reserved and never reused: the 64% that needs no colour at all.
RESERVED = ("quadrat", False)


def mark_sequence(colour: str) -> list[tuple[str, bool]]:
    """Marks for one hue, filled first then outline, most legible first."""
    seq = [(s, True) for s in SHAPES] + [(s, False) for s in SHAPES]
    if colour == NEGRE:
        seq = [m for m in seq if m != RESERVED]
    return seq


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
            else f"{FAMILIES[family][0]} · tipus {exemplar}"
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
            "colore": COLOUR_OF[family],
            "forma": None,  # allocated below, once every size is known
            "pieno": False,
            "signature": list(signature),
            "esempio": exemplar,
            "forme_esempio": [dataset[exemplar]["forme"].get(p) for p in PERSONS],
            "n_verbi": len(members),
            "varianti": varianti,
            "verbi": members,
        })
        for v in members:
            verb_index[v] = {"pattern": pid, "forme": [dataset[v]["forme"].get(p) for p in PERSONS]}

    # Allocate marks per hue, biggest pattern first, so the shapes you meet
    # most often are the simplest ones.
    for colour in (NEGRE, GROC, VERMELL, BLAU):
        pool = mark_sequence(colour)
        members = sorted(
            (p for p in patterns if p["colore"] == colour),
            key=lambda p: -p["n_verbi"],
        )
        i = 0
        for p in members:
            if p["famiglia"] == "regular-1":
                p["forma"], p["pieno"] = RESERVED
                continue
            if i < len(pool):
                p["forma"], p["pieno"] = pool[i]
                i += 1
            else:
                p["forma"], p["pieno"] = TAIL, False
                p["cas_a_part"] = True

    (OUT / "patterns.json").write_text(json.dumps(patterns, ensure_ascii=False, indent=1), encoding="utf-8")
    (OUT / "verbs.json").write_text(json.dumps(verb_index, ensure_ascii=False, indent=1), encoding="utf-8")

    total = sum(p["n_verbi"] for p in patterns)
    by_family = collections.Counter()
    for p in patterns:
        by_family[p["famiglia"]] += p["n_verbi"]
    print(f"{len(patterns)} pattern, {total} verbi\n")
    for fam, n in by_family.most_common():
        print(f"  {fam:14s} {n:5d}  {100*n/total:5.1f}%")

    # A mark must never repeat: colour+shape+fill is the whole identity.
    marks = collections.Counter((p["colore"], p["forma"], p["pieno"]) for p in patterns)
    clashes = {m: n for m, n in marks.items() if n > 1}
    print(f"\nsegni distinti: {len(marks)} su {len(patterns)} pattern")
    if clashes:
        print("segni ripetuti (distinti solo dal nome):")
        for (col, shape, fill), n in sorted(clashes.items(), key=lambda kv: -kv[1]):
            print(f"  {col} {shape:9s} {'ple' if fill else 'buit':5s} ×{n}")

    print("\ntop 12:")
    for p in patterns[:12]:
        print(f"  {p['colore']} {p['forma']:9s} {'ple' if p['pieno'] else 'buit':5s} "
              f"{p['n_verbi']:5d}  {p['esempio']:12s} "
              f"{' '.join(f or '—' for f in p['forme_esempio'])}")


if __name__ == "__main__":
    main()
