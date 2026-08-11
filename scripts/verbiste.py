"""Verbiste-format conjugation engine for Catalan (verbecc data).

A template is named `stem:suffix` — the suffix is what gets stripped from the
infinitive to obtain the verb's radical. Each cell holds an ending; a leading
`-` means "drop one more character from the radical before appending".

    mou:re + beure  ->  radical "beu"
      1s "-c"   -> "be"  + "c"   = "bec"
      2s "s"    -> "beu" + "s"   = "beus"
      1p "-vem" -> "be"  + "vem" = "bevem"
"""

from __future__ import annotations

import xml.etree.ElementTree as ET
from dataclasses import dataclass, field

PERSONS = ("1s", "2s", "3s", "1p", "2p", "3p")

# Mood/tense nodes we extract, keyed by the name we expose.
TENSES = {
    "indicatiu.present": ("Indicatiu", "present"),
    "indicatiu.imperfet": ("Indicatiu", "imperfet"),
    "indicatiu.passat-simple": ("Indicatiu", "passat-simple"),
    "indicatiu.futur": ("Indicatiu", "futur"),
    "subjuntiu.present": ("Subjuntiu", "present"),
    "subjuntiu.imperfet": ("Subjuntiu", "imperfet"),
}


@dataclass
class Template:
    name: str
    suffix: str  # part after ':' — stripped from the infinitive
    # tense -> tuple of 6 cells, each cell a tuple of ending variants
    cells: dict[str, tuple[tuple[str, ...], ...]] = field(default_factory=dict)


def _endings(node) -> tuple[tuple[str, ...], ...]:
    out = []
    for p in node.findall("p"):
        variants = tuple(i.text or "" for i in p.findall("i"))
        out.append(variants or ("",))
    return tuple(out)


def load_templates(path: str) -> dict[str, Template]:
    root = ET.parse(path).getroot()
    templates: dict[str, Template] = {}
    for node in root.findall("template"):
        name = node.get("name") or ""
        _, _, suffix = name.partition(":")
        tpl = Template(name=name, suffix=suffix)
        for key, (mood, tense) in TENSES.items():
            found = node.find(f"{mood}/{tense}")
            if found is not None:
                tpl.cells[key] = _endings(found)
        templates[name] = tpl
    return templates


def load_verbs(path: str) -> dict[str, str]:
    """infinitive -> template name"""
    root = ET.parse(path).getroot()
    verbs = {}
    for node in root.findall("v"):
        inf = node.find("i")
        tpl = node.find("t")
        if inf is not None and tpl is not None and inf.text and tpl.text:
            verbs[inf.text] = tpl.text
    return verbs


def radical(infinitive: str, template: Template) -> str | None:
    if template.suffix and not infinitive.endswith(template.suffix):
        return None
    return infinitive[: len(infinitive) - len(template.suffix)]


def apply_ending(rad: str, ending: str) -> str:
    """Leading dashes each drop one character from the radical."""
    drop = len(ending) - len(ending.lstrip("-"))
    if drop:
        if drop > len(rad):
            return ""
        return rad[:-drop] + ending[drop:]
    return rad + ending


def conjugate(infinitive: str, template: Template, tense: str) -> list[tuple[str, ...]] | None:
    cells = template.cells.get(tense)
    if cells is None:
        return None
    rad = radical(infinitive, template)
    if rad is None:
        return None
    return [tuple(apply_ending(rad, e) for e in variants) for variants in cells]
