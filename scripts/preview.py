"""Render the colour-coded pattern specimen sheet from the built dataset."""

from __future__ import annotations

import html
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "data" / "out"
PERSONS = ("jo", "tu", "ell/ella", "nosaltres", "vosaltres", "ells/elles")

FAMILY_ORDER = [
    ("regular-1", "1a coniugazione regolare", "Grigio: è la base. Se non è colorato, non c'è niente da ricordare."),
    ("ortho-1", "1a coniugazione, alternanza ortografica", "Ambra. Stesso meccanismo della regolare — cambia solo la grafia davanti a <i>e</i>: <i>j→g</i>, <i>c→qu</i>, <i>g→gu</i>, <i>ç→c</i>. Stessa tinta, intensità diverse."),
    ("segona", "2a coniugazione", "Rosso: il territorio irregolare, dove la radice cambia fra singolare e plurale."),
    ("incoativa-3", "3a coniugazione incoativa", "Verde acqua. L'infisso <i>-eix-</i> nelle quattro forme forti, e sparisce in <i>nosaltres</i>/<i>vosaltres</i>."),
    ("pura-3", "3a coniugazione pura", "Blu: niente infisso, la radice resta nuda."),
    ("irregolare", "Irregolari da sapere a memoria", "Dieci verbi che non rispondono a nessuna regola. Ognuno ha un colore proprio."),
]

PAIRS = [
    ("menjar", "passejar", "Stesso pattern, identico in tutte e sei le celle."),
    ("llegir", "vestir", "Stesso pattern: entrambi incoativi."),
    ("beure", "treure", "Quattro celle su sei coincidono. Divergono in <i>nosaltres</i> e <i>vosaltres</i> — dove il catalano nasconde le sue irregolarità."),
]


def split_form(form: str | None, ending: str) -> tuple[str, str]:
    """Return (stem, ending) so the mechanism can be coloured on its own."""
    if not form:
        return ("", "")
    if ending in ("Ø", "·", ""):
        return (form, "")
    if form.endswith(ending):
        return (form[: len(form) - len(ending)], ending)
    return (form, "")


def cells(forms: list, signature: list[str], color: str) -> str:
    out = []
    for form, ending in zip(forms, signature):
        stem, end = split_form(form, ending)
        if not form:
            out.append('<span class="cell empty">—</span>')
            continue
        out.append(
            f'<span class="cell"><span class="stem">{html.escape(stem)}</span>'
            f'<span class="end" style="color:{color}">{html.escape(end)}</span></span>'
        )
    return "".join(out)


def main() -> None:
    patterns = json.loads((OUT / "patterns.json").read_text(encoding="utf-8"))
    verbs = json.loads((OUT / "verbs.json").read_text(encoding="utf-8"))
    by_id = {p["id"]: p for p in patterns}
    total = sum(p["n_verbi"] for p in patterns)

    fam_totals: dict[str, int] = {}
    for p in patterns:
        fam_totals[p["famiglia"]] = fam_totals.get(p["famiglia"], 0) + p["n_verbi"]

    # ---- coverage bar
    bar = "".join(
        f'<span class="seg" style="flex:{fam_totals[f]};background:{by_id_family_color(patterns, f)}" '
        f'title="{html.escape(label)}: {fam_totals[f]} verbi"></span>'
        for f, label, _ in FAMILY_ORDER
        if fam_totals.get(f)
    )

    # ---- pairs
    pair_html = []
    for a, b, note in PAIRS:
        rows = []
        for v in (a, b):
            p = by_id[verbs[v]["pattern"]]
            rows.append(
                f'<div class="pair-row"><span class="chip" style="background:{p["colore"]}"></span>'
                f'<span class="lemma">{html.escape(v)}</span>'
                f'<span class="forms">{cells(verbs[v]["forme"], p["signature"], p["colore"])}</span></div>'
            )
        same = verbs[a]["pattern"] == verbs[b]["pattern"]
        badge = "stesso pattern" if same else "pattern diversi"
        pair_html.append(
            f'<article class="pair"><header><h3>{html.escape(a)} <span class="vs">·</span> {html.escape(b)}</h3>'
            f'<span class="badge {"same" if same else "diff"}">{badge}</span></header>'
            f'{"".join(rows)}<p class="note">{note}</p></article>'
        )

    # ---- families
    fam_html = []
    for fam, label, blurb in FAMILY_ORDER:
        members = [p for p in patterns if p["famiglia"] == fam]
        if not members:
            continue
        rows = []
        for p in members:
            share = 100 * p["n_verbi"] / total
            variants = ""
            if p.get("varianti"):
                vrows = "".join(
                    f'<div class="vrow"><span class="vname">{html.escape(v["esempio"])}</span>'
                    f'<span class="forms">{cells(v["forme_esempio"], v["signature"], p["colore"])}</span>'
                    f'<span class="vcount">{v["n_verbi"]}</span></div>'
                    for v in p["varianti"]
                )
                variants = (
                    f'<div class="variants"><span class="vlabel">stesso meccanismo, '
                    f"accento diverso</span>{vrows}</div>"
                )
            rows.append(
                f'<li class="pattern">'
                f'<div class="row">'
                f'<span class="chip" style="background:{p["colore"]}"></span>'
                f'<span class="pname">{html.escape(p["esempio"])}</span>'
                f'<span class="forms">{cells(p["forme_esempio"], p["signature"], p["colore"])}</span>'
                f'<span class="count"><b>{p["n_verbi"]}</b><span class="pct">{share:.2f}%</span></span>'
                f"</div>{variants}</li>"
            )
        fam_html.append(
            f'<section class="family"><header><h2>{html.escape(label)}</h2>'
            f'<span class="famcount">{fam_totals[fam]} verbi · {100*fam_totals[fam]/total:.1f}%</span></header>'
            f'<p class="blurb">{blurb}</p><ol class="patterns">{"".join(rows)}</ol></section>'
        )

    page = TEMPLATE.format(
        total=f"{total:,}".replace(",", "."),
        npatterns=len(patterns),
        bar=bar,
        persons="".join(f"<span>{p}</span>" for p in PERSONS),
        pairs="".join(pair_html),
        families="".join(fam_html),
    )
    (ROOT / "preview.html").write_text(page, encoding="utf-8")
    print(f"scritto preview.html — {total} verbi, {len(patterns)} pattern")


def by_id_family_color(patterns: list, fam: str) -> str:
    for p in patterns:
        if p["famiglia"] == fam:
            return p["colore"]
    return "#999"


TEMPLATE = """<title>conju.gat · campionario dei pattern</title>
<style>
  :root {{
    --paper: #FAF9F7; --card: #FFFFFF; --ink: #1B1B1E; --muted: #6F6E72;
    /* The chrome stays achromatic: on a specimen sheet every hue belongs to the data. */
    --rule: #E4E1DC; --rule-soft: #EFEDE9; --accent: #57534E; --fill: #EDEAE5;
    --mono: ui-monospace, "SF Mono", Menlo, Consolas, monospace;
    --serif: "Iowan Old Style", "Palatino Linotype", Palatino, Georgia, serif;
    --sans: system-ui, -apple-system, "Segoe UI", sans-serif;
  }}
  @media (prefers-color-scheme: dark) {{
    :root:not([data-theme="light"]) {{
      --paper: #16161A; --card: #1D1D22; --ink: #ECEBEE; --muted: #97969E;
      --rule: #2E2E35; --rule-soft: #26262C; --accent: #B8B2AB; --fill: #26262C;
    }}
  }}
  :root[data-theme="dark"] {{
    --paper: #16161A; --card: #1D1D22; --ink: #ECEBEE; --muted: #97969E;
    --rule: #2E2E35; --rule-soft: #26262C; --accent: #B8B2AB; --fill: #26262C;
  }}
  * {{ box-sizing: border-box; }}
  body {{
    background: var(--paper); color: var(--ink); font-family: var(--sans);
    line-height: 1.55; margin: 0; padding: 0 1.25rem 5rem;
    -webkit-font-smoothing: antialiased;
  }}
  .wrap {{ max-width: 62rem; margin: 0 auto; }}
  .eyebrow {{
    font-size: .72rem; letter-spacing: .14em; text-transform: uppercase;
    color: var(--accent); font-weight: 600; margin: 3.5rem 0 .9rem;
  }}
  h1 {{
    font-family: var(--serif); font-weight: 500; font-size: clamp(2rem, 5vw, 3rem);
    line-height: 1.1; margin: 0 0 1rem; text-wrap: balance; letter-spacing: -.01em;
  }}
  .lede {{ font-size: 1.06rem; color: var(--muted); max-width: 44rem; margin: 0 0 2.5rem; }}
  .lede b {{ color: var(--ink); font-weight: 600; }}

  .stats {{ display: grid; grid-template-columns: repeat(auto-fit, minmax(9rem, 1fr)); gap: 1px;
            background: var(--rule); border: 1px solid var(--rule); margin-bottom: 2.5rem; }}
  .stat {{ background: var(--card); padding: 1rem 1.1rem; }}
  .stat b {{ display: block; font-family: var(--serif); font-size: 1.8rem; font-variant-numeric: tabular-nums; }}
  .stat span {{ font-size: .78rem; color: var(--muted); }}

  .bar {{ display: flex; height: 2.25rem; overflow: hidden; border: 1px solid var(--rule); }}
  .bar .seg {{ display: block; }}
  .barcap {{ font-size: .78rem; color: var(--muted); margin: .6rem 0 3.5rem; }}

  h2 {{ font-family: var(--serif); font-weight: 500; font-size: 1.35rem; margin: 0; letter-spacing: -.005em; }}
  .family {{ margin-bottom: 3rem; }}
  .family > header {{ display: flex; align-items: baseline; justify-content: space-between;
                      gap: 1rem; border-bottom: 1px solid var(--rule); padding-bottom: .5rem; flex-wrap: wrap; }}
  .famcount {{ font-size: .78rem; color: var(--muted); font-variant-numeric: tabular-nums; }}
  .blurb {{ font-size: .9rem; color: var(--muted); margin: .7rem 0 1.1rem; max-width: 42rem; }}

  .legend {{ display: flex; gap: .35rem; font-size: .7rem; color: var(--muted);
             font-family: var(--mono); padding-left: calc(.85rem + .75rem + 6.5rem); margin-bottom: .4rem; }}
  .legend span {{ flex: 1; min-width: 0; overflow: hidden; text-overflow: ellipsis; }}

  ol.patterns {{ list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; }}
  .pattern {{ display: flex; flex-direction: column; padding: .55rem 0;
              border-bottom: 1px solid var(--rule-soft); }}
  .pattern > .row {{ display: flex; align-items: center; gap: .75rem; }}
  .variants {{ margin: .5rem 0 .15rem; padding: .5rem .7rem; background: var(--fill); border-radius: 3px;
               display: flex; flex-direction: column; gap: .25rem; }}
  .vlabel {{ font-size: .66rem; letter-spacing: .08em; text-transform: uppercase; color: var(--muted); }}
  .vrow {{ display: flex; align-items: center; gap: .75rem; }}
  .vname {{ width: 6.5rem; flex: none; font-size: .82rem; color: var(--muted); }}
  .vcount {{ width: 5rem; flex: none; text-align: right; font-size: .72rem; color: var(--muted);
             font-variant-numeric: tabular-nums; }}
  .chip {{ width: .85rem; height: .85rem; border-radius: 2px; flex: none;
           box-shadow: 0 0 0 1px rgba(0,0,0,.14) inset; }}
  .pname {{ width: 6.5rem; flex: none; font-weight: 600; font-size: .9rem;
            overflow: hidden; text-overflow: ellipsis; }}
  .forms {{ display: flex; gap: .35rem; flex: 1; min-width: 0; font-family: var(--mono); font-size: .8rem; }}
  .cell {{ flex: 1; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }}
  .stem {{ color: var(--muted); }}
  .end {{ font-weight: 700; }}
  .cell.empty {{ color: var(--rule); }}
  .count {{ width: 5rem; flex: none; text-align: right; font-variant-numeric: tabular-nums; }}
  .count b {{ font-size: .9rem; }}
  .count .pct {{ display: block; font-size: .68rem; color: var(--muted); }}

  .pairs {{ display: grid; gap: 1px; background: var(--rule); border: 1px solid var(--rule); margin-bottom: 3.5rem; }}
  .pair {{ background: var(--card); padding: 1.1rem 1.2rem; }}
  .pair > header {{ display: flex; align-items: center; gap: .7rem; margin-bottom: .8rem; }}
  .pair h3 {{ font-family: var(--serif); font-weight: 500; font-size: 1.1rem; margin: 0; }}
  .vs {{ color: var(--muted); }}
  .badge {{ font-size: .68rem; letter-spacing: .06em; text-transform: uppercase;
            padding: .18rem .5rem; border-radius: 999px; font-weight: 600; }}
  .badge.same {{ background: var(--ink); color: var(--paper); }}
  .badge.diff {{ background: transparent; color: var(--muted); box-shadow: inset 0 0 0 1px var(--rule); }}
  .pair-row {{ display: flex; align-items: center; gap: .75rem; padding: .3rem 0; }}
  .lemma {{ width: 6.5rem; flex: none; font-weight: 600; font-size: .9rem; }}
  .note {{ font-size: .85rem; color: var(--muted); margin: .8rem 0 0; }}

  footer {{ border-top: 1px solid var(--rule); margin-top: 3rem; padding-top: 1.2rem;
            font-size: .8rem; color: var(--muted); }}
  footer a {{ color: var(--accent); }}
  @media (max-width: 46rem) {{
    .legend {{ display: none; }}
    .pattern > .row, .pair-row, .vrow {{ flex-wrap: wrap; }}
    .vname {{ width: auto; }}
    .pname, .lemma {{ width: auto; }}
    .forms {{ flex-basis: 100%; }}
    .count {{ margin-left: auto; }}
  }}
</style>

<div class="wrap">
  <p class="eyebrow">conju.gat · present d'indicatiu</p>
  <h1>Il colore è il meccanismo,<br>non il verbo</h1>
  <p class="lede">
    Ogni pattern di coniugazione ha una tinta. La parte <b>colorata</b> di ogni forma è
    ciò che il pattern determina; la parte grigia è la radice, che resta tua.
    Dataset costruito dai template <b>verbecc</b> e validato forma per forma contro il
    dizionario <b>Softcatalà</b>, in catalano centrale.
  </p>

  <div class="stats">
    <div class="stat"><b>{total}</b><span>verbi</span></div>
    <div class="stat"><b>{npatterns}</b><span>pattern distinti</span></div>
    <div class="stat"><b>8</b><span>colori per il 96%</span></div>
    <div class="stat"><b>0</b><span>forme non verificate</span></div>
  </div>

  <div class="bar">{bar}</div>
  <p class="barcap">Distribuzione reale dei verbi fra le famiglie. La prima fascia, grigia, è la 1a regolare.</p>

  <h2 style="margin-bottom:1rem">Le tue intuizioni, verificate</h2>
  <div class="pairs">{pairs}</div>

  <div class="legend">{persons}</div>
  {families}

  <footer>
    Dati: <a href="https://github.com/bretttolbert/verbecc">verbecc</a> (template, GPL-2.0) e
    <a href="https://huggingface.co/datasets/softcatala/catalan-dictionary">Softcatalà catalan-dictionary</a>
    (verità di riferimento, GPL-2.0 / LGPL-2.1). Varietà: catalano centrale.
  </footer>
</div>
"""


if __name__ == "__main__":
    main()
