# Murdoku

Ein Kriminalrätsel wie ein Sudoku, allein gespielt. Ein Verbrechen, ein
Lageplan aus Bereichen (Inseln, Meer, Räume) und eine Handvoll Verdächtiger mit
je einem Hinweis, wo sie waren. Wer für jede Person ihr Feld findet, weiß, wer
mit dem Opfer allein war - das ist der Täter.

Nach den Rätseln von **Murdoku** von Manuel Garand ([murdoku.com](https://murdoku.com)).
Die Fälle sind seine Probefälle, nach Schwierigkeit in
`game_instructions/Murdoku/Easy`, `Medium`, `Hard` und `Expert` abgelegt, je
mit Lösungsblatt daneben (`<Name>_Solution.png`). Ins Deutsche übertragen sind
Titel, Bereiche, Hinweise und der Lösungsweg. Die Bilder des Originals sind
nicht übernommen: Karte, Figuren und Logo sind hier selbst gezeichnet, die
Gegenstände sind Emojis.

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
| [engine/levels.ts](engine/levels.ts)                                   | Die Liste der Fälle                                                 |
| [levels/](levels/)                                                     | Ein Fall je Datei                                                   |
| [engine/board.ts](engine/board.ts)                                     | Die Notizen des Spielers: Personen setzen, Kreuze                   |
| [hooks/use-murdoku.ts](hooks/use-murdoku.ts)                           | Zustand, Speichern im Browser, Statistik                            |
| [components/case-map.tsx](components/case-map.tsx)                     | Die Karte als SVG                                                   |
| [components/murdoku-game.tsx](components/murdoku-game.tsx)             | Fallauswahl mit Filter, Verdächtige, Werkzeuge, Bestätigen          |
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
  Spalte lässt sie aus. Unter der Karte steht wie im gedruckten Fall, was
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
Lösungsblatt. Dann in [engine/levels.ts](engine/levels.ts) eintragen und
`npm run murdoku` laufen lassen: Es prüft die Daten, löst jeden Fall und
meldet `OK` nur bei genau einer Lösung, die dem Lösungsblatt gleicht, und einem
Täter.
