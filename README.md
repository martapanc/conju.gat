# conju.gat 🐱

Le coniugazioni catalane con **un colore per ogni meccanismo di coniugazione**.

L'idea: i verbi catalani sono migliaia, ma i *pattern* con cui si coniugano sono
poche decine. Otto colori coprono il 96% dei verbi. Se impari il colore, hai
imparato tutta la famiglia — non un verbo alla volta.

Attualmente copre il **presente d'indicatiu**.

---

## Come funziona il colore

Il colore non identifica il verbo: identifica il **meccanismo**. In ogni forma,
la parte colorata è quella che il pattern determina; la parte in grigio è la
radice, che resta del verbo.

| famiglia | colore | copertura | esempio |
| --- | --- | --- | --- |
| 1a regolare | grigio neutro | 64,0% | `parlar` → parl**o**, parl**es**, parl**a** |
| 1a con alternanza ortografica | ambra (5 intensità) | 22,5% | `viatjar` → viat**jo**, viat**ges** |
| 2a coniugazione | rosso (6 intensità) | 2,9% | `perdre` → perd**o**, perd**s**, perd |
| 3a incoativa | verde acqua | 9,1% | `servir` → serv**eixo**, serv**eixes** |
| 3a pura | blu | 0,6% | `dormir` → dorm**o**, dorm**s** |
| irregolari | 10 tinte proprie | 0,9% | `ser`, `anar`, `fer`, `tenir`… |

Tre principi, decisi prima di scrivere il codice:

1. **La classe enorme e regolare resta neutra.** Se colorassimo anche il 64% dei
   verbi, tutto urlerebbe e non risalterebbe niente. Il grigio vuol dire
   "nessuna sorpresa".
2. **Una tinta per meccanismo, intensità per l'innesco.** Le quattro alternanze
   ortografiche della 1a (`j→g`, `c→qu`, `g→gu`, `ç→c`) sono lo stesso
   meccanismo: stessa ambra, intensità diverse.
3. **Mai il colore da solo.** Ogni pattern porta anche il nome per esteso, sia
   per il daltonismo sia perché la coda di pattern rari condivide le tinte.

I verbi che differiscono **solo per l'accento** (`fer`/`refer`, `cosir`/`descosir`)
stanno nello stesso pattern: sono lo stesso meccanismo con un prefisso che sposta
l'accento. Le grafie esatte restano registrate come *varianti* dentro il pattern,
perché nell'esercizio scritto l'accento va comunque azzeccato.

## Le tre modalità

- **Cerca** — cerchi un verbo, vedi la coniugazione colorata, e sotto gli altri
  verbi che seguono lo stesso meccanismo.
- **Flashcard** — l'app propone un verbo con l'indizio del colore, tu lo coniughi
  ad alta voce, poi riveli. L'indizio si spegne dalle impostazioni quando non
  serve più.
- **Scrivi** — digiti tutte e sei le forme e l'app corregge cella per cella.
  Gli accenti contano: c'è una barra con `à è é í ï ò ó ú ü ç l·l`.

Il mazzo dà priorità ai verbi che sbagli più spesso. I progressi restano nel
browser (`localStorage`), non esce nulla dal dispositivo.

## Sviluppo

```bash
npm install
npm run data:fetch   # scarica i dizionari a monte (una volta sola)
npm run data         # ricostruisce il dataset e l'anteprima dei pattern
npm run dev          # http://localhost:3000
```

`npm run data:preview` genera `preview.html`, un campionario di tutti i pattern
con i colori assegnati: serve per validare i raggruppamenti a occhio.

### La pipeline dei dati

```
verbecc (template)  ─┐
                     ├─→ build.py ──→ palette.py ──→ export_app.py ──→ public/data/
Softcatalà (verità) ─┘   genera e      assegna i      formato app
                         valida        colori
```

I template di verbecc generano le forme; ogni forma viene poi **verificata
contro il dizionario Softcatalà**. Dove i due divergono:

- **differenza di solo accento** → si adotta Softcatalà (291 celle corrette);
- **variante dialettale** → si sceglie il catalano centrale con regole esplicite
  (81 celle: si scartano valenzano e baleare);
- **template sbagliato** → correzione in `data/overrides.json`.

`overrides.json` è il file da toccare per correggere un verbo. Ha tre
meccanismi: `templates` definisce nuovi pattern, `assign` rimappa un verbo a un
template, `forms` impone le forme esplicite. Quasi tutte le correzioni sono state
fatte per *famiglia* (i composti di `prendre`, `treure`, `néixer`, `empènyer`,
`tòrcer`), non verbo per verbo.

Stato attuale: **8.582 verbi, 51 pattern, 0 forme non verificate.**

### Perché serve la verifica

I dati a monte contengono errori proprio sui verbi frequenti. `saber` e `voler`
erano mappati sul template `perd:re`, che pretende un infinito in *-re*: non
producevano forme sbagliate, sparivano in silenzio. In tutto 29 verbi avevano un
template strutturalmente inapplicabile, fra cui `ser`, `ésser`, `néixer`,
`desfer`, `tòrcer`. Per un'app di studio insegnare forme sbagliate è il bug
peggiore possibile, quindi la validazione non è opzionale.

## Licenze e attribuzione

Il dataset deriva da due fonti copyleft, entrambe scaricate a build time e non
incluse nel repository:

- [**verbecc**](https://github.com/bretttolbert/verbecc) — template di
  coniugazione in formato Verbiste. Dati GPL-2.0, di Brett Tolbert e
  Pierre Sarrazin.
- [**Softcatalà catalan-dictionary**](https://huggingface.co/datasets/softcatala/catalan-dictionary)
  — 1,18 milioni di forme flesse con lemma e tag morfologico. GPL-2.0 / LGPL-2.1.

Di conseguenza **il dataset derivato in `public/data/` è GPL-2.0**. Se distribuisci
l'app, mantieni l'attribuzione e la licenza sui dati.

Varietà linguistica: **catalano centrale**.

Il sito [verbs.cat](https://www.verbs.cat/) non è stato usato come fonte di dati:
è il progetto che ha ispirato questo, e merita una visita.
