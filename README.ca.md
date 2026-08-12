# conju.gat 🐱

*[Read this in English](README.md)*

Les conjugacions catalanes amb **un senyal per a cada mecanisme de
conjugació**.

La idea: els verbs catalans són milers, però els *patrons* amb què es
conjuguen són poques desenes. Si aprens el senyal, has après tota la
família — no un verb cada vegada.

Actualment cobreix el **present d'indicatiu**. La interfície és en català.

---

## Com funciona el senyal

El llenguatge visual és Miró dins una taula de paradigmes: groc, vermell i
blau primaris més el negre, color pla, línia negra, cap traç de curvatura.
Tres primaris no basten, però, per distingir 51 patrons, així que el senyal
porta **dues** informacions:

- el **color** diu de quina conjugació és el mecanisme;
- la **forma** (cercle, quadrat, triangle, rombe, creu, estrella, mitja
  lluna, plena o buida) diu quin subtipus.

| família | senyal | cobertura | exemple |
| --- | --- | --- | --- |
| 1a regular | quadrat negre **buit** | 64,0% | `parlar` → parl**o**, parl**es** |
| 1a amb alternança ortogràfica | **groc**, forma segons el desencadenant | 22,5% | `viatjar` → viat**jo**, viat**ges** |
| 2a conjugació | **vermell** | 2,9% | `perdre` → perd**o**, perd**s** |
| 3a incoativa | **blau** cercle | 9,1% | `servir` → serv**eixo** |
| 3a pura | **blau** quadrat | 0,6% | `dormir` → dorm**o** |
| irregulars | negre **ple**, un per verb | 0,9% | `ser`, `anar`, `fer`, `tenir`… |

Tres principis, decidits abans d'escriure cap codi:

1. **La classe enorme i regular no porta color.** El 64% dels verbs porta un
   quadrat negre buit: buit vol dir "res a recordar". El negre ple, a
   l'extrem oposat, vol dir "tot a recordar" i queda reservat als deu
   irregulars. Cap de les dues lectures es reutilitza mai per a res més.
2. **Color per al mecanisme, forma per al desencadenant.** Les alternances
   ortogràfiques de la 1a (`j→g`, `c→qu`, `g→gu`, `ç→c`) són el mateix
   mecanisme: mateix groc, formes diferents. La forma sobreviu al daltonisme
   i a la fotocòpia, cosa que els matisos no feien.
3. **Mai el senyal tot sol.** Cada patró porta també el nom sencer.

Set formes per a dos ompliments donen 14 senyals per to: 46 dels 51 patrons
tenen un senyal únic. Els 11 verbs que queden (`néixer`, `dur`, `caldre`,
`caler`, `heure`, `pudir`, `tossir`) comparteixen una barra buida declarada,
`cas a part`: una col·lisió silenciosa seria un error, una de declarada és
una categoria.

Els verbs que difereixen **només per l'accent** (`fer`/`refer`,
`cosir`/`descosir`) queden en el mateix patró: són el mateix mecanisme amb
un prefix que desplaça l'accent. Les grafies exactes queden registrades com
a *variants* dins el patró, perquè a l'exercici escrit l'accent s'ha
d'encertar igualment.

## Les modalitats

L'exercici és a pantalla completa, una cel·la cada vegada, sense navegació:
a dalt, la persona demanada; a baix, el paradigma que es va construint fila
per fila. Les sis persones sempre estan en el mateix ordre i a la mateixa
posició, perquè la memòria espacial és part de l'aprenentatge.

- **Consulta** — cerques un verb i en veus el paradigma, amb els altres
  verbs que segueixen el mateix mecanisme.
- **Digues-ho** — conjugues en veu alta, vas revelant cel·la per cel·la i
  t'autoavalues al final del paradigma.
- **Escriu-ho** — escrius les sis formes. Els accents compten: la
  comparació només perdona majúscules i espais, i hi ha una barra amb
  `à è é í ï ò ó ú ü ç l·l`.

La pista del color es pot apagar des dels ajustos quan ja no cal.

### Tipografia

Bricolage Grotesque per al display, Inter Tight per al text, Fragment Mono
per a les etiquetes gramaticals i les formes. Autoallotjats via
`next/font`, així que la PWA manté la seva tipografia també sense
connexió. Els tres tipus renderitzen correctament la ela geminada
(`col·legi`, `instal·lar`): és un requisit ineludible, comprovat a mà i no
donat per fet a partir de la fitxa del tipus.

La baralla prioritza els verbs que falles més sovint. El progrés queda al
navegador (`localStorage`); no surt res del dispositiu.

## Desenvolupament

```bash
npm install
npm run data:fetch   # descarrega els diccionaris font (una sola vegada)
npm run data         # reconstrueix el conjunt de dades
npm run dev          # http://localhost:3341
```

El mostrari complet dels 51 patrons amb els seus senyals és la pàgina
**Patrons** dins l'app: es genera a partir de les dades, així que no pot
desincronitzar-se.

### El pipeline de dades

```
verbecc (plantilles)  ─┐
                       ├─→ build.py ──→ palette.py ──→ export_app.py ──→ public/data/
Softcatalà (veritat)  ─┘   genera i      assigna els     format app
                           valida        senyals
```

Les plantilles de verbecc generen les formes; cada forma es **verifica
després contra el diccionari Softcatalà**. On els dos divergeixen:

- **diferència només d'accent** → s'adopta Softcatalà (291 cel·les
  corregides);
- **variant dialectal** → s'escull el català central amb regles explícites
  (81 cel·les: es descarten el valencià i el balear);
- **plantilla errònia** → correcció a `data/overrides.json`.

`overrides.json` és el fitxer a tocar per corregir un verb. Té tres
mecanismes: `templates` defineix patrons nous, `assign` reassigna un verb a
una plantilla, `forms` imposa formes explícites. Gairebé totes les
correccions s'han fet per *família* (els compostos de `prendre`, `treure`,
`néixer`, `empènyer`, `tòrcer`), no verb per verb.

Estat actual: **8.582 verbs, 51 patrons, 0 formes sense verificar.**

### Per què cal la verificació

Les dades font contenen errors precisament en els verbs freqüents. `saber`
i `voler` estaven mapats a la plantilla `perd:re`, que suposa un infinitiu
acabat en *-re*: no produïa formes errònies, desapareixien en silenci. En
total, 29 verbs tenien una plantilla estructuralment inaplicable, entre
ells `ser`, `ésser`, `néixer`, `desfer`, `tòrcer`. Per a una app d'estudi,
ensenyar formes errònies és el pitjor error possible, així que la
validació no és opcional.

## Llicències i atribució

El conjunt de dades deriva de dues fonts copyleft, totes dues descarregades
en temps de build i no incloses al repositori:

- [**verbecc**](https://github.com/bretttolbert/verbecc) — plantilles de
  conjugació en format Verbiste. Dades GPL-2.0, de Brett Tolbert i
  Pierre Sarrazin.
- [**Softcatalà catalan-dictionary**](https://huggingface.co/datasets/softcatala/catalan-dictionary)
  — 1,18 milions de formes flexionades amb lema i etiqueta morfològica.
  GPL-2.0 / LGPL-2.1.

En conseqüència, **el conjunt de dades derivat a `public/data/` és
GPL-2.0**. Si distribueixes l'app, mantén l'atribució i la llicència de les
dades.

Varietat lingüística: **català central**.

El lloc [verbs.cat](https://www.verbs.cat/) no s'ha fet servir com a font
de dades: és el projecte que ha inspirat aquest, i val la pena visitar-lo.
