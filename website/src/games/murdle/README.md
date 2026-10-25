# Murdle

Kriminalfälle zum Selberlösen, allein oder online gemeinsam. Jeder Fall hat drei oder vier
Verdächtige, ebenso viele Waffen und Orte und ab "Hartgesotten" auch Motive.
Mit den Hinweisen findet man heraus, wer was wo (und warum) hatte, und klagt
dann an: **Wer? Womit? Wo? (Warum?)**

Nach **Murdle: Volume 1** von G. T. Karber. Vorlagen:

- die Leseprobe `game_instructions/Murdle/Murdle Vol 1_9781250892317_BLAD.pdf`
  (38 Seiten) mit der Anleitung und dem Übungsfall am Deduction College;
- Fotos der eigenen Buchseiten unter `game_instructions/Murdle/Murdle Band 1/`:
  `Elementar` (Fälle 3 bis 25, je zwei Seiten), `Medium` (26 bis 50, je zwei
  Seiten), `Hard` (51 bis 75, je vier Seiten) und `Impossible` (76 bis 100,
  je vier Seiten), jeweils `NN - Seite K.png`; dazu `Hints` und `Solutions`
  (`Seite KK.png`) mit den Hinweisen und Lösungen aller 100 Fälle.

Gebaut sind 101 Fälle: der Übungsfall und die Fälle 1 bis 100 des Buchs. Der
Löser (`npm run murdle`) beweist für jeden genau eine Lösung, gleich der
hinterlegten - und die Lösung jedes Falls ist mit den Lösungsseiten des Buchs
abgeglichen (wer, womit, wo und ab Fall 51 warum). Jeder Fall beginnt mit dem
Hinweis aus dem Buch (ins Deutsche übertragen, "Hinweis aus dem Buch"),
danach folgen selbst geschriebene Lösungsschritte; der Übungsfall nutzt den
Lösungsweg aus "How to Solve".

Beweisstück C (das Labyrinth an den alten Ruinen) und D (der Lageplan der
Midnight-Movie-Studios) sind nicht fotografiert. Wo ein Hinweis sie braucht
(Fälle 64, 66, 69, 83, 85, 96 und 100), ist er ausgeschrieben - mit der
Lesart, die als einzige die Lösung des Buchs ergibt; der Kopf der Datei sagt
es jeweils.

## Aufbau

```
murdle/
  engine/
    types.ts     Fall, Verdächtige, Waffen, Orte, Motive, Hinweis, Aussage
    solver.ts    alle Verteilungen durchprobieren, Mörder bestimmen, Anklage prüfen
    grid.ts      Blöcke des Deduktionsrasters, Markierungen, Tippen, Auto-Kreuz
    cases.ts     alle Fälle, Bücher, Sortierung
  cases/         ein Fall je Datei: Karten, Hinweise, Aussagen, Lösung, Tipps
  hooks/         use-murdle.ts - Zustand, Uhr, Speicherung im Browser;
                 use-murdle-online.ts - der Raum als dieselbe Schnittstelle
  multiplayer/   adapter.ts - Murdle für die gemeinsame Online-Schicht
  components/    Spiel, Fallauswahl, Karten, Raster, Statistik, Online-Bildschirm
  i18n/          Texte, Beweisstücke A und B, Spielregeln
```

- **Ein Hinweis ist Code.** Jeder Hinweis hat seinen deutschen Satz und ein
  kleines Prädikat über eine `Scene` (eine mögliche Verteilung) mit Fragen wie
  `holder("fork")`, `at("stadium")`, `locationOf("emerald")` oder
  `motiveOf("grey")`. Die Attribute (Größe, Händigkeit, Augen, Haare,
  Sternzeichen, Gewicht, Material, drinnen/draußen) stehen an den Karten, die
  Prädikate fragen sie ab.
- **Leichenfund**: Der fett gedruckte letzte Hinweis (`body`) nennt den Ort des
  Mordes (`location`) - Mörder ist, wer dort war - oder die Tatwaffe
  (`weapon`, etwa "erstochen") - Mörder ist, wer sie hatte.
- **Aussagen**: Der Mörder lügt, alle anderen sagen die Wahrheit
  (`murderersOf` in [engine/solver.ts](engine/solver.ts)). Ohne Leichenfund
  ist der einzige Lügner der Mörder (Fälle 36 und 76).
- **Beweismittel**: Ein Fall nennt in `exhibits` die Beweisstücke, die er
  braucht; sie stehen im Fall unter "Beweismittel". Fall 2 braucht
  Beweisstück A (die Lupe ist aus Kristall von Emerald Industries), Fall 36
  zeigt Beweisstück B, die astrologische Fibel seines Kapitels.

## Reihen und Fallauswahl

Jeder Fall gehört zu einem Buch (`series` am Fall; bisher nur "Murdle: Band
1", `SERIES_ORDER` in [engine/cases.ts](engine/cases.ts) - ein weiteres Buch
kommt dort hinten dazu, mit Namen in `SERIES_NAMES` und Farbe in
`SERIES_BADGE`/`SERIES_CHIP` in
[components/case-filter.tsx](components/case-filter.tsx)). Die Liste folgt
Murdoku:

- **Oben die Bücher, darunter die Schwierigkeiten**: ein Chip je Buch mit der
  Zahl seiner Fälle, der gewählte in der Farbe des Buchs; ein Buch ohne Fälle
  ist ausgeblendet. Eine Kategorie "Alle" für die Bücher gibt es nicht - beim
  ersten Besuch ist das erste Buch gewählt. Die Schwierigkeits-Chips
  (Einführung, Elementar, Okkultes Medium, Hartgesotten, Unmöglich, mit ihren
  Lupen, dazu "Alle") zeigen nur Schwierigkeiten, die das gewählte Buch hat,
  jeweils mit Zahl.
- **Die Suche geht über alle Bücher** und listet die Treffer alphabetisch
  (ohne Artikel: "Eine Kreuzfahrt zum Sterben" steht unter K), jeden mit
  seinen Labels. Ein × im Feld oder Esc leert sie; ein Klick auf ein Buch
  beendet sie ebenfalls.
- **Sortierung** (`inOrder`, `byName`): ein Buch nach seinen Nummern, der
  Übungsfall zuerst.
- Filter, Suche und "Gelöste ausblenden" bleiben im Browser gespeichert
  (`drecksau-app/murdle/list`). Zurück aus einem Fall steht die Liste wie
  verlassen, an derselben Stelle.
- Der Host online wählt mit denselben Filtern (ohne "Gelöste ausblenden").
- Vorschaubilder gibt es nicht - eine Kachel zeigt nur die Symbole der
  Verdächtigen, also muss nichts verzögert gezeichnet werden.

## Das Deduktionsraster

Wie gedruckt: oben Verdächtige, (Motive), Orte; links Waffen, Orte, (Motive);
jede Blockreihe einen Block kürzer (`blocksOf` in
[engine/grid.ts](engine/grid.ts)). Ein Tipp auf ein Feld: leer, Kreuz, Haken,
leer. Ein neuer Haken kreuzt die freien Felder seiner Zeile und Spalte im
selben Block aus - abschaltbar mit "Haken streicht Zeile und Spalte
automatisch aus" (gespeichert unter `drecksau-app/murdle/settings`). Das
Raster prüft nichts; "Rückgängig" und "Raster leeren" gibt es.

## Anklage, Tipps, Lösung

- Die Anklage braucht alle Felder. Richtig: Dialog mit Zeit, genutzten Tipps,
  falschen Anklagen und - wo das Buch ihn druckt - dem Schlusstext. Falsch:
  nur "Falsch", ohne zu verraten, was.
- "Tipp" zeigt den nächsten Schritt; Buch-Tipps sind markiert.
- "Tipp" eine Sekunde gedrückt halten zeigt alle Tipps auf einmal, füllt
  das ganze Raster nach der Lösung aus (jeder Haken, jedes Kreuz) und trägt
  die richtige Anklage ins Formular ein - "Anklagen" drückt man selbst. Das
  Raster kommt in einem Zug, den "Rückgängig" wieder zurücknimmt; online gilt
  alles für alle (`allHints`), dort ohne Rückgängig. Ein Balken im Knopf füllt
  sich, solange er gehalten wird. Wie bei Murdoku zählen die Tipps dann als
  genutzt, und der Fall zählt nach richtiger Anklage wie jeder andere als
  gelöst.
- **Ein Tipp lässt sich ausführen**: Schließt ein Schritt auf bestimmte
  Paare, steht "▶ Ausführen" daneben, und ein Klick auf den Tipp setzt genau
  diese Felder (`marks` am Schritt: `{ a, b, value }` mit den Ids zweier
  Dinge und "check" oder "cross"; `stepped` in
  [engine/grid.ts](engine/grid.ts), `applyHint` im Hook) - ein Haken streicht
  bei eingeschalteter Einstellung seine Zeile und Spalte aus. Ein Zug, den
  "Rückgängig" zurücknimmt; online für alle (`step`). Die Marks wurden aus den
  Texten der Schritte abgeleitet (Dinge, die im selben Satz genannt werden und
  laut Lösung zusammengehören; Kreuze nur aus verneinten Sätzen mit genau
  zwei Dingen), der letzte Schritt ergänzt alle noch fehlenden Paare. Reine
  Überlegungen ohne Schluss haben keine. `npm run murdle` prüft, dass jedes
  Mark zur Lösung passt und alle Schritte nacheinander ausgeführt das Raster
  vollständig lösen.
- "Lösung zeigen" fragt einmal nach; danach zählt der Fall nicht mehr als
  gelöst, das Raster zeigt die Lösung und darunter eine Tabelle wie im Buch.
- **Drucken / PDF**: Der Knopf neben "Lösung zeigen" öffnet den Fall in einem
  neuen Tab als Buchseite (`/murdle/drucken/<id>/`,
  [components/case-print.tsx](components/case-print.tsx)): "Murdle" mit Band
  und Schwierigkeit samt Lupen, Titel, Geschichte, die Karten der
  Verdächtigen, Waffen, Orte und Motive mit Beschreibung und Merkmalen, die
  Hinweise (der Leichenfund fett), die Aussagen, die nötigen Beweisstücke
  (klein gesetzt), das leere Deduktionsraster (`DeductionGrid` mit `printed`:
  feste Felder, nichts zum Tippen) und die Zeilen "Wer? Womit? Wo? (Warum?)"
  mit Platz für Notizen. Die Seite öffnet sofort den Druckdialog; "Als PDF
  speichern" liefert die Datei, benannt nach dem Tab-Titel ("Murdle - 3. Die
  Kunst des Tötens"). Sie ist immer hell. Fälle ohne Motive passen auf eine
  A4-Seite, die mit Motiven brauchen zwei. Den Rahmen (A4, Druckknopf, helles
  Farbschema, Druckdialog) teilt sie mit Murdoku
  ([components/print-sheet.tsx](../../components/print-sheet.tsx)). Online
  gibt es den Knopf genauso, weil dort dieselbe `CaseView` zeichnet.

## Gemeinsam online

Unter `/murdle/online` ([components/murdle-online.tsx](components/murdle-online.tsx),
[multiplayer/adapter.ts](multiplayer/adapter.ts)) lösen 2 bis 6 Ermittler einen
Fall zusammen - genau wie bei Murdoku: ein privater Raum mit Code, der Host
wählt den Fall und öffnet ihn, und dann schreiben **alle gleichzeitig im
selben Deduktionsraster** und füllen **dieselbe Anklage** aus. Tipps, die
Lösung und das Urteil sehen alle. Dazu der Chat und der Sprachchat der
Sammlung.

- Es läuft auf der gemeinsamen Online-Schicht (`useOnlineRoom`): Der Host
  wendet die Züge in der Reihenfolge an, in der sie ankommen. Keine Züge der
  Reihe nach (`seatIndexOnTurn` ist immer null), keine Computer, nichts
  Verdecktes.
- **Jeder Zug sagt, was am Ende gelten soll**, statt umzuschalten: "dieses
  Feld ein Haken", "dieses Feld leer" (`markSet` in
  [engine/grid.ts](engine/grid.ts)). Tippen zwei gleichzeitig dasselbe Feld
  an, bekommen beide das Feld, das sie meinten. Der Zug trägt die eigene
  Einstellung "automatisch ausstreichen" mit; die bleibt pro Person.
- Gezeichnet wird mit derselben Ansicht wie allein (`CaseView`);
  [hooks/use-murdle-online.ts](hooks/use-murdle-online.ts) macht aus dem Raum
  dieselbe Schnittstelle wie `useMurdle`. "Rückgängig" gibt es online nicht -
  bei mehreren Schreibern wüsste niemand, wessen Schritt zurückginge. Auch
  "Nochmal lösen" fehlt: Nach dem Lösen öffnet der Host den nächsten Fall.
- Anklagen kann jede:r. Falsch: alle sehen "Bea hat angeklagt - falsch.".
  Richtig: "Gelöst von Bea!", der Dialog mit der Zeit erscheint bei allen.
  Die Uhr läuft, seit der Host den Fall geöffnet hat. Wer erst dazukommt, wenn
  der Fall schon offen ist, schaut zu.
- Die Räume liegen wie bei allen Spielen unter `rooms/murdle-CODE`; an den
  Firebase-Regeln ist nichts zu ändern. Online-Fälle zählen nicht in die
  Statistik des Browsers.

## Speicherung und Statistik

Fortschritt je Fall (Raster, Uhr, Tipps, falsche Anklagen), gelöste Fälle und
Zeiten liegen unter `drecksau-app/murdle/cases`. Die Seite `/murdle/statistik`
zeigt die Statistik der Sammlung und je Fall gelöst, Bestzeit, letzte Zeit und
Gesamtzeit, gruppiert nach Schwierigkeit.

## Prüfen

`npm run murdle` ([scripts/murdle-check.ts](../../../scripts/murdle-check.ts))
prüft jeden Fall: Daten stimmig, genau eine Lösung, gleich der gespeicherten,
und bei Übungsfall, Fall 1 und Fall 2 gleich der gedruckten.

## Übersetzung

Namen bleiben wie im Buch; Berufe und Ränge sind übersetzt (Bürgermeister
Honey, Dekan Glaucous, Rektorin Tuscany, Pater Mango, Kapitänin Slate,
Astrologin Azure, Kryptozoologe Cloud, Chefproduzentin Steel, Schreiberling
Blaxton, Statistin Marengo), Anreden bleiben (Dame, Miss, Mx., Signor, Earl).
Größen sind von Fuß und Zoll in Meter umgerechnet. Die verwürfelte Nachricht
in Fall 76 ist auf Deutsch neu verwürfelt.
