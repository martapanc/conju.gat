"""Emit compact JSON for the app: no indentation, no duplicated member lists."""

from __future__ import annotations

import json
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))
from palette import COMMON  # noqa: E402

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "data" / "out"
PUB = ROOT / "public" / "data"


def main() -> None:
    patterns = json.loads((OUT / "patterns.json").read_text(encoding="utf-8"))
    verbs = json.loads((OUT / "verbs.json").read_text(encoding="utf-8"))

    slim = [
        {
            "id": p["id"],
            "fam": p["famiglia"],
            "nome": p["nome"],
            "colore": p["colore"],
            "esempio": p["esempio"],
            "sig": p["signature"],
            "n": p["n_verbi"],
            "varianti": [
                {"esempio": v["esempio"], "sig": v["signature"], "n": v["n_verbi"]}
                for v in p.get("varianti", [])
            ],
        }
        for p in patterns
    ]

    # verb -> [patternId, ...six forms]; null marks a defective cell (caler)
    compact = {v: [d["pattern"], *d["forme"]] for v, d in verbs.items()}

    deck = [v for v in COMMON if v in verbs]
    seen, ordered = set(), []
    for v in deck:
        if v not in seen:
            seen.add(v)
            ordered.append(v)

    PUB.mkdir(parents=True, exist_ok=True)
    for name, payload in (("patterns", slim), ("verbs", compact), ("deck", ordered)):
        path = PUB / f"{name}.json"
        path.write_text(json.dumps(payload, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")
        print(f"{path.relative_to(ROOT)}  {path.stat().st_size / 1024:.0f} KB")

    print(f"\n{len(compact)} verbi, {len(slim)} pattern, mazzo di {len(ordered)} verbi comuni")


if __name__ == "__main__":
    main()
