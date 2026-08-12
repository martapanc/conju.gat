"""Generate the present indicative from verbecc templates and check every form
against the Softcatala dictionary (the ground truth).

Reports how many verbs survive intact, so we know how big the manual-fix list is.
"""

from __future__ import annotations

import collections
import json
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))
from verbiste import PERSONS, conjugate, load_templates, load_verbs  # noqa: E402

ROOT = Path(__file__).resolve().parent.parent
RAW = ROOT / "data" / "raw"
OUT = ROOT / "data" / "out"

TENSE = "indicatiu.present"
TAGS = {p: f"VMIP{p[0]}{p[1].upper()}" for p in PERSONS}


def load_truth() -> dict[tuple[str, str], set[str]]:
    """(lemma, person) -> accepted forms, from Softcatala."""
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


def main() -> None:
    templates = load_templates(str(RAW / "conj-ca.xml"))
    verbs = load_verbs(str(RAW / "verbs-ca.xml"))
    truth = load_truth()

    ok: dict[str, dict[str, str]] = {}
    bad: dict[str, dict[str, tuple[str, list[str]]]] = {}
    unknown: list[str] = []
    per_cell_fail = collections.Counter()
    fail_by_template = collections.Counter()
    total_by_template = collections.Counter()

    for inf, tpl_name in sorted(verbs.items()):
        tpl = templates.get(tpl_name)
        if tpl is None:
            continue
        rows = conjugate(inf, tpl, TENSE)
        if rows is None:
            continue
        if not any((inf, p) in truth for p in PERSONS):
            unknown.append(inf)  # verb absent from Softcatala — cannot judge
            continue

        total_by_template[tpl_name] += 1
        forms, errors = {}, {}
        for person, variants in zip(PERSONS, rows):
            generated = variants[0]
            accepted = truth.get((inf, person), set())
            forms[person] = generated
            if accepted and generated not in accepted:
                errors[person] = (generated, sorted(accepted))
                per_cell_fail[person] += 1
        if errors:
            bad[inf] = errors
            fail_by_template[tpl_name] += 1
        else:
            ok[inf] = forms

    total = len(ok) + len(bad)
    print(f"verbs evaluated          : {total}")
    print(f"  fully correct          : {len(ok)} ({100*len(ok)/total:.2f}%)")
    print(f"  with at least one error: {len(bad)} ({100*len(bad)/total:.2f}%)")
    print(f"  not in Softcatala      : {len(unknown)} (not evaluated)")
    print()
    print("errors per cell:", dict(per_cell_fail))
    print()
    print("=== most problematic templates (failed/total) ===")
    for name, n in fail_by_template.most_common(15):
        print(f"  {name:16s} {n:5d} / {total_by_template[name]:5d}")

    OUT.mkdir(parents=True, exist_ok=True)
    (OUT / "present_ok.json").write_text(
        json.dumps(ok, ensure_ascii=False, indent=1), encoding="utf-8"
    )
    (OUT / "present_bad.json").write_text(
        json.dumps(bad, ensure_ascii=False, indent=1), encoding="utf-8"
    )
    (OUT / "present_unknown.json").write_text(
        json.dumps(unknown, ensure_ascii=False, indent=1), encoding="utf-8"
    )


if __name__ == "__main__":
    main()
