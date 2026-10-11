# Murdoku

Ein Kriminalrätsel wie ein Sudoku, allein gespielt. Ein Verbrechen, ein
Lageplan aus Bereichen (Inseln, Meer, Räume) und eine Handvoll Verdächtiger mit
je einem Hinweis, wo sie waren. Wer für jede Person ihr Feld findet, weiß, wer
mit dem Opfer allein war - das ist der Täter.

Nach den Rätseln von **Murdoku** von Manuel Garand ([murdoku.com](https://murdoku.com)).
Die Vorlagen liegen nach Reihe in `game_instructions/Murdoku/`:
`Das Murdoku-Orginal/<Nr>. <Fall>/` und `Murdoku 2 - Auf Zeitreise/<Nr>. <Fall>/`
(Seiten der Bücher), `Online Rätsel/<Schwierigkeit>/<Fall>/` (`Sehr Leicht`,
`Leicht`, `Mittel`, `Schwer`, `Experte`, `Blitz`), `Familie/` und `Wettbewerb/`;
manche mit Lösungsblatt daneben (`<Name>_Solution.png`), die anderen mit den
offiziellen Tipps. Ins Deutsche übertragen sind Titel, Bereiche, Hinweise und
der Lösungsweg. Die Bilder des Originals sind nicht übernommen: Karte, Figuren
und Logo sind hier selbst gezeichnet - viele Gegenstände als eigene Zeichnung
nach dem Vorbild der Seite (siehe [Die Karte](#die-karte)), der Rest als Emoji.

Dazu kommen ein Fall aus einer anderen Reihe ("Stadtbus" nach "City Bus" von
murdermysterypuzzles.com, Hiroji Osaka, bei den Online-Rätseln) und die Reihe
**Familie Murdoku** (`game_instructions/Murdoku/Familie`, PDFs ohne
Lösungsblatt): Dort hat der
Löser die einzige Lösung gefunden, und der Lösungsweg in den Tipps ist selbst
geschrieben. Familienfälle haben oft kein Opfer - der Täter ist dann, wer in der
obersten Reihe stand oder auf den Krümeln; das sagt der Fall selbst
(`findCulprit`). Das Wort für den Täter folgt der Person: "die Diebin", "die
Täterin" (`culpritWord`).

In der Reihe **Wettbewerb** (`series: { book: "contest" }`) steht der erste
Wettbewerbsfall "The Treasure Hunt" (PDF ohne Lösungsblatt, 24x24 mit 23
Piraten): Es gibt kein Verbrechen, gesucht ist das Feld des Schatzes. Der Schatz
ist ein eigenes Stück mit Karte (`treasure` am Fall nennt es) und liegt auf
dem allerletzten Feld - in der einzigen Reihe und Spalte, die übrig bleiben.
Er darf auch unter einem Gegenstand vergraben sein, auf dem sonst niemand
stehen kann (`buried` am Stück, `isStandableFor` in
[engine/rules.ts](engine/rules.ts)); Personen dürfen dort nach wie vor nicht
hin. Nach "Bestätigen" nennt der Dialog statt eines Täters die Stelle: "Der
Schatz liegt in Reihe 4, Spalte 11". Auch hier hat der Löser die einzige
Lösung gefunden (mit einem eigenen Vorausblick im Fall, `prune`), und der
Lösungsweg ist selbst geschrieben.

## Reihen und Fallauswahl

Jeder Fall gehört zu einer Reihe (`series: { book, number }` am Fall); ohne
Reihe steht er unter "Weitere Fälle". Die Reihen haben ein farbiges Label
(`SERIES_BADGE` in [components/murdoku-game.tsx](components/murdoku-game.tsx)):
Das Murdoku-Original lila, Murdoku 2: Auf Zeitreise orange, Auf Weltreise
hellblau, Beyond the Grave dunkelgrün, Familie Murdoku pink, Online-Rätsel gelb,
Wettbewerb rot. Die Fallnummer eines Buchs steht im Titel ("3. English
Breakfast", `titleOf`), nicht im Label. Eine Schwierigkeit (`difficulty`)
haben nur die Online-Rätsel.

- **Oben die Reihen, darunter die Schwierigkeiten**: Ein Chip je Reihe mit der
  Zahl ihrer Fälle, der gewählte in der Farbe der Reihe; eine Reihe ohne Fälle
  ist ausgeblendet. Die Schwierigkeits-Chips erscheinen nur für eine Reihe, deren
  Fälle Schwierigkeiten haben. Eine Kategorie "Alle" gibt es nicht - beim ersten
  Besuch ist "Das Murdoku-Original" gewählt.
- **Die Suche geht über alle Reihen**, egal welche gewählt ist, und listet die
  Treffer alphabetisch, jeden mit seinem Label. Ein × im Feld oder Esc leert
  sie; ein Klick auf eine Reihe beendet sie ebenfalls.
- **Sortierung** (`inOrder`, `byName` in [engine/levels.ts](engine/levels.ts)):
  ein Buch nach seinen Nummern, die anderen nach Schwierigkeit und darin nach
  dem Namen - ohne Artikel, "Der Buchclub" steht unter B. Die Reihenfolge der
  Liste `LEVELS` selbst spielt keine Rolle.
- Filter, Suche und "Gelöste ausblenden" bleiben im Browser gespeichert
  (`drecksau-app/murdoku/list`). Zurück aus einem Fall - auch mit der Zurück-Taste
  des Browsers - steht die Liste wie verlassen, an derselben Stelle.
- Im Fall führen ← → neben "Zurück zur Levelübersicht" zum vorigen und
  nächsten Fall derselben Reihe, in derselben Reihenfolge wie die Liste.
- **Die Vorschauen werden erst gezeichnet, wenn ihre Karte in die Nähe des
  Bildschirms kommt** (`CasePreview` in
  [components/case-map.tsx](components/case-map.tsx)) - fünfzig Karten auf
  einmal wären viele tausend Formen und machten jeden Wechsel der Reihe träge.

## Regeln

- In jeder Reihe und jeder Spalte steht genau eine Person.
- Personen stehen auf freien Feldern, im Wasser, in einem Haus oder auf einem
  Boot - nie auf Baum, Strauch, Hai, Wildschwein, Felsen oder Kaktus.
- **Neben** heißt links, rechts, darüber oder darunter **und im selben
  Bereich**. Die dicken Linien auf der Karte sind die Grenzen.
- Der Täter war allein mit dem Opfer in dessen Bereich.

## Aufbau

| Datei                                                                  | Was                                                                 |
| ---------------------------------------------------------------------- | ------------------------------------------------------------------- |
| [engine/types.ts](engine/types.ts)                                     | Fall, Bereich, Hinweis, Regel, der Kontext für Hinweise             |
| [engine/catalog.ts](engine/catalog.ts)                                 | Alle Gegenstände und Untergründe: Name, Emoji, besetzbar, Art       |
| [engine/clues.ts](engine/clues.ts)                                     | Fertige Bausteine für Hinweise: auf, neben, im Bereich, Spalte …    |
| [engine/rules.ts](engine/rules.ts)                                     | Karte lesen, Hinweise prüfen, Zusammenstöße, Täter, **Löser**       |
| [engine/levels.ts](engine/levels.ts)                                   | Die Liste der Fälle, Reihen, Schwierigkeiten, Sortierung            |
| [levels/](levels/)                                                     | Ein Fall je Datei                                                   |
| [engine/board.ts](engine/board.ts)                                     | Die Notizen des Spielers: Personen setzen, Kreuze                   |
| [hooks/use-murdoku.ts](hooks/use-murdoku.ts)                           | Zustand, Speichern im Browser, Statistik                            |
| [components/case-map.tsx](components/case-map.tsx)                     | Die Karte als SVG                                                   |
| [components/murdoku-game.tsx](components/murdoku-game.tsx)             | Fallauswahl mit Filter, Verdächtige, Werkzeuge, Bestätigen          |
| [components/murdoku-online.tsx](components/murdoku-online.tsx)         | Gemeinsam online: Raum, Fallauswahl des Hosts                       |
| [components/murdoku-stats.tsx](components/murdoku-stats.tsx)           | Die Fälle auf der Statistikseite                                    |
| [i18n/texts.ts](i18n/texts.ts)                                         | Die deutschen Texte, Namen der Reihen und Schwierigkeiten           |
| [i18n/emphasis.ts](i18n/emphasis.ts)                                   | Welche Wörter eines Hinweises fett stehen                           |
| [../../../scripts/murdoku-check.ts](../../../scripts/murdoku-check.ts) | Prüft jeden Fall: Daten, genau eine Lösung, gleich dem Lösungsblatt |

**Ein Hinweis ist ein kleines Stück Code, kein Eintrag in einer Liste.** Die
gedruckten Fälle sagen Dinge wie "genau eine Reihe nördlich von Ivan", "der
einzige Mann auf der Wüsteninsel" oder "eine Frau in seinem Raum stand neben
der Kamera" - viel zu viele Arten, um jeder einen Namen zu geben. Also trägt
ein Hinweis seinen deutschen Satz und die Prüfung dahinter, geschrieben gegen
einen Kontext, der die Karte kennt und weiß, wer wo steht (`Context` in
[engine/types.ts](engine/types.ts)). Was nur vom eigenen Feld abhängt, steht in
`unary` - damit schließt der Löser Felder früh aus; was andere Personen braucht,
in `check`, geprüft sobald die genannten stehen (`uses`) oder alle (`global`).
Für das Übliche gibt es Bausteine ([engine/clues.ts](engine/clues.ts)), die
auch wissen, was beim Auswählen der Person aufleuchtet. Regeln des ganzen
Falls (die Lupen-Notizen unter den Verdächtigen) sind `rules`.

**Karten** dürfen jede Größe und Form haben: Felder außerhalb sind `.` in der
Bereichskarte. Der Untergrund kann je Feld angegeben werden (Wasser in einem
Gehege, Teppich), und ein Gegenstand über mehrere Felder - ein Auto, ein
Elefant - steht auf jedem davon.

## Die Karte

Die Karte soll aussehen wie die gedruckte Seite. Was nur zum Aussehen gehört,
ändert am Rätsel nichts; das Prüfskript sieht es nicht.

- **Ein Ding über mehrere Felder** (`pieces`: Rechteck mit `at`, `rows`,
  `cols`) wird einmal gezeichnet: ein Bett mit Kissen und Decke, ein Tisch
  über drei Felder, ein Auto über zwei, ein Elefant über vier.
- **Tische und Teppiche um die Ecke** (`shapes`: die Felder als Liste, L- oder
  T-förmig) werden als ein Stück gezeichnet - ein Tresen ist kein eigenes Ding,
  nur ein Tisch in anderer Form. Ob Tisch oder Teppich, sagt das erste Feld.
- **Teppichboden** wird als Teppich gezeichnet, wenn seine Felder in
  `carpets` stehen (je Teppich eine Liste); ohne das ist er nur eingefärbt -
  richtig für einen gemusterten oder gefliesten Boden, der kein Teppich ist.
- **Fenster und Tafeln in der Wand** (`windows`: Feld und Seite): Ein Fenster
  sitzt auf der Wandlinie, nicht im Feld. `board` macht daraus eine Tafel über
  `length` Felder, mit Kreideschrift `text`.
- **Schilder der Bereiche**: `labelEnd` endet das Schild an seinem Feld statt
  dort zu beginnen; zu lange Namen werden kleiner, damit sie im Bereich
  bleiben - außer mit `labelOverhang`, dann ragen sie wie im Buch hinaus.
  Bereiche, die eine Regel als Adelsräume nennt (`crowned`), tragen eine Krone.
- **Eigene Zeichnungen statt Emoji** (`DrawnThing`, `DRAWN_THINGS` in
  [components/case-map.tsx](components/case-map.tsx)): Tisch, Schreibtisch,
  Teppich, Matte, Bett, Regal, Kasse, Schutt, Karton, Holzkiste, Statue, Spind,
  Boxsack, Auto, Bus, Kutsche, Boot, Ölfleck, Schlamm- und Wasserpfütze,
  Schachtisch, Wasserrad, Krümel, Strauch, Staffelei, gerahmtes Bild (an der
  Wand oben im Feld), Seerosenblatt, Klavier, Lautsprecher, Schlagzeug, Tresor
  und Laterne. Dieselbe Zeichnung steht in der Legende unter der Karte.
- **Post-its** (`note: true` an einer Regel) stehen als gelber Zettel unter
  den Verdächtigen statt als Lupen-Hinweis und werden nie geprüft.

**Der Löser** (`solve`) schließt erst für jede Person aus, was ihr eigener
Hinweis und die Regeln nicht zulassen, und probiert dann per Backtracking immer
die Person mit den wenigsten verbleibenden Feldern, wobei jeder Hinweis geprüft
wird, sobald die Personen stehen, die er nennt. Er hört bei zwei Lösungen auf.
Das Spiel selbst rechnet mit der Lösung vom Lösungsblatt (`solution`); das
Prüfskript stellt sicher, dass sie die einzige ist.

## Spielen

- In der Fallauswahl zeigt jede Karte eine Vorschau der Karte des Falls -
  dieselbe Zeichnung wie im Spiel, nur ohne Nummern, Namen und Klickflächen
  (`preview` an `CaseMap`).
- **Die Schlagwörter der Hinweise sind fett**, wie auf den gedruckten Seiten
  ([i18n/emphasis.ts](i18n/emphasis.ts)): Richtungen und Beziehungen (neben,
  allein mit, nicht, nördlich, Reihe, Spalte, Ecke, Wand, erste/letzte …), die
  Dinge, Untergründe und Bereiche des Falls und die Namen der Verdächtigen. Das
  gilt für die Hinweise der Verdächtigen und die Lupen-Hinweise, nicht für den
  Lösungsweg. Wo ein Text anders betont sein soll, markiert er seine fetten
  Wörter selbst mit `**…**` - dann gilt nur das.

- **Tippen merkt vor, Halten setzt fest.** Person wählen und Felder antippen,
  auf denen sie gewesen sein könnte: Dort steht ihr Buchstabe klein, in ihrer
  Farbe, jede Person an einem festen Platz im Feld (`noted` in
  [engine/board.ts](engine/board.ts)). Die Person bleibt dabei gewählt, so lassen
  sich mehrere Felder hintereinander vormerken.
- **Was der Hinweis meint, leuchtet auf**, solange die Person gewählt ist
  (`cluePoints` in [engine/rules.ts](engine/rules.ts)): bei "in einem Haus"
  alle Häuser, bei "neben einem Strauch" alle Sträucher - die Dinge selbst, auch
  wenn man nur daneben stehen kann -, bei einem Bereich, einer Reihe oder Spalte
  deren Felder, und bei "neben derselben Art wie Harmony" das, neben dem
  Harmony steht, sobald sie fest gesetzt ist.
- Die Verdächtigen stehen links immer zu zweit nebeneinander; Reihen und
  Spalten heißen wie auf dem Lösungsblatt R1 bis R9 und C1 bis C9.
- **Ein Feld gedrückt halten** - nur mit gewählter Person: Nach 0,2 Sekunden
  erscheint ein Ring und ist nach weiteren 0,3 Sekunden voll, dann steht die
  Person fest (`placed`). Ihre anderen Notizen verschwinden, und ihre ganze
  Reihe und Spalte wird ausgekreuzt und von Notizen geräumt - was das gedruckte
  Rätsel einem von Hand zu tun aufträgt. Ein gewöhnlicher Klick zeigt den Ring
  nie; wer loslässt, während er lädt, bricht ab, ohne etwas zu tun. Ohne
  gewählte Person gibt es keinen Ring und kein Festsetzen - jeder Druck ist ein
  Klick (`canHold` an `CaseMap`).
- Ohne gewählte Person setzt ein Tipp aufs Feld ein Kreuz; eine feste Person
  antippen nimmt sie herunter - mitsamt den Kreuzen in ihrer Reihe und Spalte
  (`removed`). Ein Kreuz, das auch in Reihe oder Spalte einer anderen festen
  Person liegt, bleibt stehen.
- **Rechtsklick leert ein Feld**: alle Notizen und das Kreuz darin
  (`wiped`); eine feste Person bleibt stehen. Mit der rechten Taste gedrückt
  halten setzt niemanden fest - nur die linke Taste lädt den Ring. Auf dem
  Handy meldet ein langer Druck ebenfalls "Kontextmenü"; dort gilt er aber als
  Festsetzen, darum leert nur der Rechtsklick einer Maus.
- **Felder, auf denen niemand stehen kann** (Baum, Strauch, Hai, Wildschwein,
  Felsen, Kaktus), nehmen keinen Tipp an: kein Vormerken, kein Setzen, kein
  Kreuz - sie haben gar keine Klickfläche. Auch das Auskreuzen von Reihe und
  Spalte lässt sie aus. Nur in einem Fall mit vergrabenem Schatz sind sie
  anklickbar und werden mit ausgekreuzt (`isStandableForAny`), denn der Schatz
  könnte darunter liegen; vormerken und setzen lässt sich dort nur der Schatz. Unter der Karte steht wie im gedruckten Fall, was
  besetzt werden kann und was nicht, mit genau den Dingen dieser Karte.
- Zwei feste Personen in einer Reihe oder Spalte bekommen einen roten Ring.
  Ein Haken am Namen heißt nur, dass die Person schon fest steht - **nicht**,
  ob sie richtig steht; das verrät erst "Bestätigen". Über der Karte steht
  bewusst kein Text - was eine Person sagt, steht auf ihrer Karte, wie gespielt
  wird, im Regelblatt.
- **Ein Tipp ist ein Schritt des Lösungswegs, keine Position.** Jeder Fall
  bringt seinen Lösungsweg mit (`hints` in [engine/levels.ts](engine/levels.ts)),
  so wie ihn das Lösungsblatt des gedruckten Falls erklärt; "Tipp (2/9)" zeigt
  den nächsten Schritt als Text unter der Karte. Die Tipps sind zu Beginn
  ausgeblendet - auch beim Weiterspielen eines Falls -, jeder Druck zeigt den
  nächsten, und "Tipps ausblenden" klappt sie wieder weg. Gezählt wird nur ein
  Schritt, der noch nie gezeigt wurde. **"Tipp" eine Sekunde gedrückt halten** zeigt alle Tipps auf einmal und führt sie alle aus - in einem Zug, den "Rückgängig" wieder zurücknimmt; online für alle (`allHints`). **Ein Tipp lässt sich ausführen**: Sagt ein Schritt, wer wo stehen muss
  oder was auszustreichen ist, steht "▶ Ausführen" daneben, und ein Klick auf
  den Tipp setzt die Personen fest bzw. kreuzt die Felder aus (`place` und
  `cross` am Schritt, `applyHint` im Hook) - in einem Zug, den "Rückgängig"
  wieder zurücknimmt. Alle neun Schritte von "Summer Isles" nacheinander
  ausgeführt ergeben genau die Lösung. Setzen muss man die Personen
  selbst. **Lösung zeigen** legt die Lösung über die eigenen Notizen - beim ersten Mal nach einer Rückfrage im eigenen Dialog. **Lösung ausblenden** holt die eigenen Notizen zurück, und man kann weiterknobeln; danach kommt und geht die Lösung ohne Rückfrage. Der erste Blick zählt den Fall in der Statistik als verloren und wird gespeichert (`peeked`): Wer danach richtig bestätigt, bekommt "Richtig - mit Blick in die Lösung", aber keinen Haken in der Fallauswahl und keinen zweiten Eintrag in der Statistik.
- **Bestätigen statt Anklagen.** Den Täter muss niemand nennen: Stehen alle
  Personen und das Opfer fest, wird "Bestätigen" klickbar. Dann bekommt eine
  Figur nach der anderen, von A bis zum Opfer, einen Ring - grün, wenn sie auf
  ihrem Feld der Lösung steht, rot, wenn nicht (`checked` in
  [engine/rules.ts](engine/rules.ts), `verdicts` an `CaseMap`). Danach öffnet
  sich ein Dialog: Stimmt alles, ist der Fall gelöst, und der Täter steht da -
  wer mit dem Opfer allein war. Sonst steht da, wie viele falsch stehen, mit
  "Nochmal" (der Fall beginnt von vorn) und "Bearbeiten" (die roten Ringe
  bleiben, bis man etwas ändert).
- Auf dem Handy stehen die Figuren noch einmal klein über der Karte, damit man
  nicht zwischen Karten und Plan scrollen muss.

## Zeit und Statistik

- **Die Uhr** neben der Geschichte zeigt, wie lange man an einem Fall schon
  sitzt. Sie zählt nur, solange der Fall auf dem Bildschirm ist: Ist der Tab im
  Hintergrund, steht sie, und eine Lücke über einer Minute zählt nicht. Die
  gespielte Zeit wird mit den Notizen gespeichert (`playedMs`), ein Fall läuft
  nach dem Neuladen also weiter, wo er stand. Ist er gelöst, steht die Uhr auf
  der Lösezeit. Online läuft sie ab dem Öffnen des Falls durch den Host.
- **Nächster Fall**: Im Dialog nach einem gelösten Fall öffnet der Knopf den
  nächsten Fall der Liste und startet ihn.
- **Statistik** (`/murdoku/statistik`): oben die Zahlen der Sammlung wie bei
  jedem Spiel (begonnen, gewonnen, Spielzeit), darunter je Fall, wie oft er
  gelöst wurde, Bestzeit, letzte Zeit und Zeit gesamt, und wie viele Fälle
  gelöst sind ([components/murdoku-stats.tsx](components/murdoku-stats.tsx)).
  Die Fälle stehen nach Reihe gruppiert, jede mit "x von y gelöst", in derselben
  Reihenfolge wie die Fallauswahl.
  Die Zeiten je Fall liegen beim gespeicherten Fortschritt (`records`).
  Gezählt wird nur ein Fall ohne Blick in die Lösung.

## Gemeinsam online

Unter `/murdoku/online` ([components/murdoku-online.tsx](components/murdoku-online.tsx),
[multiplayer/adapter.ts](multiplayer/adapter.ts)) lösen 2 bis 6 Ermittler einen
Fall zusammen: ein privater Raum mit Code, der Host wählt den Fall (mit
Vorschau) und öffnet ihn, und dann schreiben **alle gleichzeitig auf dieselbe
Karte** - Notizen, Kreuze, feste Personen, Tipps, die Lösung, das Bestätigen.
Dazu der Chat und der Sprachchat der Sammlung.

- Es läuft auf der gemeinsamen Online-Schicht (`useOnlineRoom`): Der Host
  wendet die Züge in der Reihenfolge an, in der sie ankommen. Es gibt keine
  Züge der Reihe nach (`seatIndexOnTurn` ist immer null), keine Computer und
  nichts Verdecktes.
- **Jeder Zug sagt, was am Ende gelten soll**, statt umzuschalten: "diese
  Notiz an", "dieses Kreuz aus". Tippen zwei gleichzeitig dasselbe Feld an,
  bekommen beide das Feld, das sie meinten, statt dass es an- und gleich wieder
  ausgeht (`markSet`, `crossSet` in [engine/actions.ts](engine/actions.ts)).
- Gezeichnet wird mit derselben Ansicht wie allein (`CaseView`);
  [hooks/use-murdoku-online.ts](hooks/use-murdoku-online.ts) macht aus dem Raum
  dieselbe Schnittstelle wie `useMurdoku`. Eigen bleibt nur, welche Person man
  gerade zum Setzen in der Hand hat. "Rückgängig" gibt es online nicht - bei
  mehreren Schreibern wüsste niemand, wessen Schritt zurückginge.
- Bestätigen kann jeder; die Ringe und den Dialog sehen alle ("Bea hat
  bestätigt - noch nicht alles richtig"). Stimmt alles, ist der Fall für alle
  gelöst ("Gelöst von Bea!"), und der Host öffnet den nächsten. "Nochmal"
  beginnt den Fall für alle von vorn, solange er nicht gelöst ist.
  Wer erst dazukommt, wenn der Fall schon offen ist, schaut zu und ist beim
  nächsten dabei.
- Die Räume liegen wie bei allen Spielen unter `rooms/murdoku-CODE`; an den
  Firebase-Regeln ist nichts zu ändern. Online-Fälle zählen nicht in die
  Statistik des Browsers.

Angefangene Fälle und gelöste werden im Browser gespeichert
(`drecksau-app/murdoku/cases`). Ein neu begonnener Fall zählt in der Statistik
als Spiel, ein angeklagter Täter als Sieg, Aufgeben als Niederlage.

## Einen Fall hinzufügen

Eine neue Datei in [levels/](levels/) nach dem Vorbild von
[levels/summer-isles.ts](levels/summer-isles.ts): die Bereiche (Buchstabe,
deutscher Name, "im …"/"auf der …", Untergrund, Feld für das Namensschild),
Bereichs- und Gegenstandskarte als Buchstabenbilder (`.` = nichts bzw. außerhalb),
bei Bedarf eine Untergrundkarte, die Verdächtigen mit deutschem Hinweis und der
Prüfung dahinter, die Regeln, der Lösungsweg als `hints` und die Lösung vom
Lösungsblatt. Dazu die Reihe (`series`, bei einem Buch mit `number`) und bei
einem Online-Rätsel die Schwierigkeit, und was die Seite zeigt: Dinge über
mehrere Felder (`pieces`), Tische und Teppiche um die Ecke (`shapes`), Teppiche
(`carpets`), Fenster (`windows`). Dann in
[engine/levels.ts](engine/levels.ts) eintragen und
`npm run murdoku` laufen lassen: Es prüft die Daten, löst jeden Fall und
meldet `OK` nur bei genau einer Lösung, die dem Lösungsblatt gleicht, und einem
Täter.
