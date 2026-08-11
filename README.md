# conju.gat 🐱

Le coniugazioni catalane con **un segno per ogni meccanismo di coniugazione**.

L'idea: i verbi catalani sono migliaia, ma i *pattern* con cui si coniugano sono
poche decine. Se impari il segno, hai imparato tutta la famiglia — non un verbo
alla volta.

Attualmente copre il **presente d'indicatiu**. L'interfaccia è in catalano.

---

## Come funziona il segno

Il linguaggio visivo è Miró dentro una tavola di paradigmi: giallo, rosso e blu
primari più il nero, colore piatto, linea nera, nessun raggio di curvatura.
Tre primari non bastano però a distinguere 51 pattern, quindi il segno porta
**due** informazioni:

- il **colore** dice di quale coniugazione è il meccanismo;
- la **forma** (cerchio, quadrato, triangolo, rombo, croce, stella, mezzaluna,
  piena o vuota) dice quale sottotipo.

| famiglia | segno | copertura | esempio |
| --- | --- | --- | --- |
| 1a regolare | quadrato nero **vuoto** | 64,0% | `parlar` → parl**o**, parl**es** |
| 1a con alternanza ortografica | **giallo**, forma per innesco | 22,5% | `viatjar` → viat**jo**, viat**ges** |
| 2a coniugazione | **rosso** | 2,9% | `perdre` → perd**o**, perd**s** |
| 3a incoativa | **blu** cerchio | 9,1% | `servir` → serv**eixo** |
| 3a pura | **blu** quadrato | 0,6% | `dormir` → dorm**o** |
| irregolari | nero **pieno**, uno per verbo | 0,9% | `ser`, `anar`, `fer`, `tenir`… |

Tre principi, decisi prima di scrivere il codice:

1. **La classe enorme e regolare non prende colore.** Il 64% dei verbi porta un
   quadrato nero vuoto: vuoto vuol dire "niente da ricordare". Il nero pieno,
   all'opposto, vuol dire "tutto da ricordare" ed è riservato ai dieci
   irregolari. Le due letture non si riusano mai per altro.
2. **Colore per il meccanismo, forma per l'innesco.** Le alternanze ortografiche
   della 1a (`j→g`, `c→qu`, `g→gu`, `ç→c`) sono lo stesso meccanismo: stesso
   giallo, forme diverse. La forma sopravvive al daltonismo e alla fotocopia,
   cosa che le sfumature non facevano.
3. **Mai il segno da solo.** Ogni pattern porta anche il nome per esteso.

Sette forme per due riempimenti danno 14 segni per tinta: 46 dei 51 pattern
hanno un segno unico. Gli 11 verbi che restano (`néixer`, `dur`, `caldre`,
`caler`, `heure`, `pudir`, `tossir`) condividono una barra vuota dichiarata,
`cas a part`: una collisione silenziosa sarebbe un bug, una dichiarata è una
categoria.

I verbi che differiscono **solo per l'accento** (`fer`/`refer`, `cosir`/`descosir`)
stanno nello stesso pattern: sono lo stesso meccanismo con un prefisso che sposta
l'accento. Le grafie esatte restano registrate come *varianti* dentro il pattern,
perché nell'esercizio scritto l'accento va comunque azzeccato.

## Le modalità

L'esercizio è a schermo intero, una cella alla volta, senza navigazione: sopra la
persona richiesta, sotto il paradigma che si costruisce riga per riga. Le sei
persone stanno sempre nello stesso ordine e nella stessa posizione, perché la
memoria spaziale è parte dell'apprendimento.

- **Consulta** — cerchi un verbo e ne vedi il paradigma, con gli altri verbi che
  seguono lo stesso meccanismo.
- **Digues-ho** — coniughi ad alta voce, riveli cella per cella e ti valuti alla
  fine del paradigma.
- **Escriu-ho** — scrivi le sei forme. Gli accenti contano: il confronto perdona
  solo maiuscole e spazi, e c'è una barra con `à è é í ï ò ó ú ü ç l·l`.

La pista del colore si spegne dalle impostazioni quando non serve più.

### Tipografia

Bricolage Grotesque per il display, Inter Tight per il testo, Fragment Mono per
le etichette grammaticali e le forme. Auto-ospitati via `next/font`, quindi la
PWA mantiene la sua tipografia anche offline. Tutti e tre rendono correttamente
la ela geminada (`col·legi`, `instal·lar`): è un requisito bloccante, verificato
a mano e non dedotto dalla scheda del font.

Il mazzo dà priorità ai verbi che sbagli più spesso. I progressi restano nel
browser (`localStorage`), non esce nulla dal dispositivo.

## Sviluppo

```bash
npm install
npm run data:fetch   # scarica i dizionari a monte (una volta sola)
npm run data         # ricostruisce il dataset
npm run dev          # http://localhost:3341
```

Il campionario completo dei 51 pattern con i rispettivi segni è la pagina
**Patrons** dentro l'app: si genera dai dati, quindi non può andare fuori sync.

### La pipeline dei dati

```
verbecc (template)  ─┐
                     ├─→ build.py ──→ palette.py ──→ export_app.py ──→ public/data/
Softcatalà (verità) ─┘   genera e      assegna i      formato app
                         valida        segni 
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
