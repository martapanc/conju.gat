# conju.gat 🐱

*[Llegeix-ho en català](README.ca.md)*

Catalan conjugations with **a sign for every conjugation mechanism**.

The idea: there are thousands of Catalan verbs, but only a few dozen *patterns*
by which they conjugate. Learn the sign, and you've learned the whole family —
not one verb at a time.

Currently covers the **present indicative**. The interface is in Catalan.

---

## How the sign works

The visual language is Miró inside a table of paradigms: primary yellow, red
and blue plus black, flat colour, black line, no curvature stroke. Three
primaries aren't enough to distinguish 51 patterns, though, so the sign
carries **two** pieces of information:

- **colour** says which conjugation the mechanism belongs to;
- **shape** (circle, square, triangle, diamond, cross, star, crescent, filled
  or hollow) says which subtype.

| family | sign | coverage | example |
| --- | --- | --- | --- |
| 1st regular | **hollow** black square | 64.0% | `parlar` → parl**o**, parl**es** |
| 1st with spelling shift | **yellow**, shape per trigger | 22.5% | `viatjar` → viat**jo**, viat**ges** |
| 2nd conjugation | **red** | 2.9% | `perdre` → perd**o**, perd**s** |
| 3rd inchoative | **blue** circle | 9.1% | `servir` → serv**eixo** |
| 3rd pure | **blue** square | 0.6% | `dormir` → dorm**o** |
| irregular | **filled** black, one per verb | 0.9% | `ser`, `anar`, `fer`, `tenir`… |

Three principles, decided before writing any code:

1. **The huge, regular class gets no colour.** 64% of verbs carry a hollow
   black square: hollow means "nothing to remember." Filled black, at the
   opposite end, means "everything to remember" and is reserved for the ten
   irregulars. Neither reading is ever reused for anything else.
2. **Colour for the mechanism, shape for the trigger.** The 1st-conjugation
   spelling shifts (`j→g`, `c→qu`, `g→gu`, `ç→c`) are the same mechanism: same
   yellow, different shapes. Shape survives colour blindness and photocopying,
   which shade differences did not.
3. **Never the sign alone.** Every pattern also carries the name in full.

Seven shapes across two fills give 14 signs per hue: 46 of the 51 patterns
have a unique sign. The 11 remaining verbs (`néixer`, `dur`, `caldre`,
`caler`, `heure`, `pudir`, `tossir`) share a declared hollow bar, `cas a
part`: a silent collision would be a bug, a declared one is a category.

Verbs that differ **only by accent** (`fer`/`refer`, `cosir`/`descosir`)
stay in the same pattern: they're the same mechanism with a prefix that
shifts the stress. Exact spellings are still recorded as *variants* within
the pattern, because in the writing exercise the accent still has to be
right.

## The modes

The exercise is full-screen, one cell at a time, no navigation: above, the
requested person; below, the paradigm being built row by row. The six
persons always stay in the same order and position, because spatial memory
is part of learning.

- **Consulta** — look up a verb and see its paradigm, along with other verbs
  that follow the same mechanism.
- **Digues-ho** — conjugate out loud, reveal cell by cell, and self-assess
  at the end of the paradigm.
- **Escriu-ho** — write the six forms. Accents count: the comparison
  forgives only case and spacing, and there's a bar with
  `à è é í ï ò ó ú ü ç l·l`.

The colour hint can be switched off in settings once it's no longer needed.

### Typography

Bricolage Grotesque for display, Inter Tight for body text, Fragment Mono for
grammatical labels and forms. Self-hosted via `next/font`, so the PWA keeps
its typography offline too. All three render the geminated l (`col·legi`,
`instal·lar`) correctly: that's a hard requirement, checked by hand and not
assumed from the font's spec sheet.

The deck prioritises the verbs you get wrong most often. Progress stays in
the browser (`localStorage`) — nothing leaves the device.

## Development

```bash
npm install
npm run data:fetch   # download the upstream dictionaries (once)
npm run data         # rebuild the dataset
npm run dev          # http://localhost:3341
```

The full set of 51 patterns with their signs is the **Patrons** page inside
the app: it's generated from the data, so it can't go out of sync.

### The data pipeline

```
verbecc (templates)  ─┐
                      ├─→ build.py ──→ palette.py ──→ export_app.py ──→ public/data/
Softcatalà (truth)   ─┘   generates &    assigns       app format
                          validates      signs
```

verbecc's templates generate the forms; every form is then **checked against
the Softcatalà dictionary**. Where the two diverge:

- **accent-only difference** → Softcatalà wins (291 cells corrected);
- **dialectal variant** → central Catalan is chosen with explicit rules
  (81 cells: Valencian and Balearic forms are dropped);
- **wrong template** → fixed in `data/overrides.json`.

`overrides.json` is the file to touch to fix a verb. It has three
mechanisms: `templates` defines new patterns, `assign` remaps a verb to a
template, `forms` forces explicit forms. Almost all corrections were made by
*family* (the compounds of `prendre`, `treure`, `néixer`, `empènyer`,
`tòrcer`), not verb by verb.

Current state: **8,582 verbs, 51 patterns, 0 unverified forms.**

### Why the verification matters

The upstream data has errors precisely on the frequent verbs. `saber` and
`voler` were mapped to the `perd:re` template, which assumes an infinitive
ending in *-re*: it didn't produce wrong forms, it silently dropped them
entirely. In total, 29 verbs had a structurally inapplicable template,
including `ser`, `ésser`, `néixer`, `desfer`, `tòrcer`. For a study app,
teaching the wrong forms is the worst possible bug, so validation isn't
optional.

## Licensing and attribution

The dataset derives from two copyleft sources, both downloaded at build time
and not vendored in the repository:

- [**verbecc**](https://github.com/bretttolbert/verbecc) — conjugation
  templates in Verbiste format. GPL-2.0 data, by Brett Tolbert and
  Pierre Sarrazin.
- [**Softcatalà catalan-dictionary**](https://huggingface.co/datasets/softcatala/catalan-dictionary)
  — 1.18 million inflected forms with lemma and morphological tag.
  GPL-2.0 / LGPL-2.1.

As a result, **the derived dataset in `public/data/` is GPL-2.0**. If you
distribute the app, keep the attribution and the data licence.

Language variety: **central Catalan**.

The site [verbs.cat](https://www.verbs.cat/) was not used as a data source:
it's the project that inspired this one, and it's worth a visit.
