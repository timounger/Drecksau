# Murdoku

Ein Kriminalrätsel wie ein Sudoku, allein gespielt. Ein Verbrechen, ein
Lageplan aus Bereichen (Inseln, Meer, Räume) und eine Handvoll Verdächtiger mit
je einem Hinweis, wo sie waren. Wer für jede Person ihr Feld findet, weiß, wer
mit dem Opfer allein war - das ist der Täter.

Nach den Rätseln von **Murdoku** von Manuel Garand ([murdoku.com](https://murdoku.com)).
Der erste Fall ist sein kostenloser Probefall "Summer Isles"
(`game_instructions/Murdoku/Level1.png`, Lösung daneben). Die Bilder des
Originals sind nicht übernommen: Karte, Figuren und Logo sind hier selbst
gezeichnet, die Gegenstände sind Emojis.

## Regeln

- In jeder Reihe und jeder Spalte steht genau eine Person.
- Personen stehen auf freien Feldern, im Wasser, in einem Haus oder auf einem
  Boot - nie auf Baum, Strauch, Hai, Wildschwein, Felsen oder Kaktus.
- **Neben** heißt links, rechts, darüber oder darunter **und im selben
  Bereich**. Die dicken Linien auf der Karte sind die Grenzen.
- Der Täter war allein mit dem Opfer in dessen Bereich.

## Aufbau

| Datei                                                      | Was                                                             |
| ---------------------------------------------------------- | --------------------------------------------------------------- |
| [engine/types.ts](engine/types.ts)                         | Fall, Bereich, Gegenstand, Verdächtiger, Hinweis                |
| [engine/levels.ts](engine/levels.ts)                       | Die Fälle als Daten                                             |
| [engine/rules.ts](engine/rules.ts)                         | Hinweise prüfen, Zusammenstöße, Täter, **Löser**                |
| [engine/board.ts](engine/board.ts)                         | Die Notizen des Spielers: Personen setzen, Kreuze               |
| [hooks/use-murdoku.ts](hooks/use-murdoku.ts)               | Zustand, Speichern im Browser, Statistik                        |
| [components/case-map.tsx](components/case-map.tsx)         | Die Karte als SVG                                               |
| [components/murdoku-game.tsx](components/murdoku-game.tsx) | Fallauswahl, Verdächtige, Werkzeuge, Anklage                    |
| [i18n/texts.ts](i18n/texts.ts)                             | Alle Texte; die Hinweise werden aus dem Hinweis selbst gebildet |

**Die Hinweise werden nicht ausgeschrieben, sondern gebaut**: Ein Fall sagt nur
`{ kind: "beside", thing: "boar" }`, der Satz "Sie war neben einem
Wildschwein." kommt aus `clueText`. So kann auf dem Bildschirm nie etwas anderes
stehen, als der Schiedsrichter prüft.

**Der Löser** (`solve`) probiert per Backtracking jede Person auf jedes noch
freie Feld, dessen Hinweis nicht schon verletzt ist, und hört bei zwei Lösungen
auf. Für "Summer Isles" findet er in unter 100 ms genau eine - dieselbe wie auf
dem Lösungsblatt: A R2C1, B R8C4, C R9C2, D R1C3, E R5C6, F R3C7, G R6C5,
H R4C8, V R7C9; der Dieb ist Bjorn. Lösung zeigen und Anklage rechnen mit
dieser Lösung, nicht mit einer abgeschriebenen.

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
- **Ein Feld gedrückt halten** (eine Sekunde: Nach einer halben Sekunde erscheint ein Ring und lädt sich in der nächsten halben auf - ist er voll, steht die Person. Ein gewöhnlicher Klick zeigt den Ring nie; wer loslässt, während er lädt, bricht ab, ohne etwas zu tun)
  setzt die Person fest (`placed`): Ihre anderen Notizen verschwinden, und ihre
  ganze Reihe und Spalte wird ausgekreuzt und von Notizen geräumt - was das
  gedruckte Rätsel einem von Hand zu tun aufträgt. Steht in einem Feld genau
  eine Notiz, setzt Halten diese Person auch ohne sie vorher zu wählen.
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
- Zwei feste Personen in einer Reihe oder Spalte bekommen einen roten Ring. Am
  Hinweis zeigt ein Haken, dass er zum Feld der festen Person passt, ein rotes
  Kreuz, dass nicht. Über der Karte steht bewusst kein Text - was eine Person sagt, steht auf ihrer Karte, wie gespielt wird, im Regelblatt.
- **Ein Tipp ist ein Schritt des Lösungswegs, keine Position.** Jeder Fall
  bringt seinen Lösungsweg mit (`hints` in [engine/levels.ts](engine/levels.ts)),
  so wie ihn das Lösungsblatt des gedruckten Falls erklärt; "Tipp (2/9)" zeigt
  den nächsten Schritt als Text unter der Karte. Die Tipps sind zu Beginn
  ausgeblendet - auch beim Weiterspielen eines Falls -, jeder Druck zeigt den
  nächsten, und "Tipps ausblenden" klappt sie wieder weg. Gezählt wird nur ein
  Schritt, der noch nie gezeigt wurde. **Ein Tipp lässt sich ausführen**: Sagt ein Schritt, wer wo stehen muss
  oder was auszustreichen ist, steht "▶ Ausführen" daneben, und ein Klick auf
  den Tipp setzt die Personen fest bzw. kreuzt die Felder aus (`place` und
  `cross` am Schritt, `applyHint` im Hook) - in einem Zug, den "Rückgängig"
  wieder zurücknimmt. Alle neun Schritte von "Summer Isles" nacheinander
  ausgeführt ergeben genau die Lösung. Setzen muss man die Personen
  selbst. **Lösung zeigen** legt die Lösung über die eigenen Notizen - beim ersten Mal nach einer Rückfrage im eigenen Dialog. **Lösung ausblenden** holt die eigenen Notizen zurück, und man kann weiterknobeln; danach kommt und geht die Lösung ohne Rückfrage. Der erste Blick zählt den Fall in der Statistik als verloren und wird gespeichert (`peeked`): Wer danach richtig anklagt, bekommt "Richtig - mit Blick in die Lösung", aber keinen Haken in der Fallauswahl und keinen zweiten Eintrag in der Statistik. Anklagen geht jederzeit; ein falscher
  Name kostet nichts außer der Erkenntnis.
- Auf dem Handy stehen die Figuren noch einmal klein über der Karte, damit man
  nicht zwischen Karten und Plan scrollen muss.

## Gemeinsam online

Unter `/murdoku/online` ([components/murdoku-online.tsx](components/murdoku-online.tsx),
[multiplayer/adapter.ts](multiplayer/adapter.ts)) lösen 2 bis 6 Ermittler einen
Fall zusammen: ein privater Raum mit Code, der Host wählt den Fall (mit
Vorschau) und öffnet ihn, und dann schreiben **alle gleichzeitig auf dieselbe
Karte** - Notizen, Kreuze, feste Personen, Tipps, die Lösung, die Anklage.
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
- Eine falsche Anklage sehen alle ("Bea hat Allegra angeklagt"), eine richtige
  beendet den Fall ("Gelöst von Bea!"), und der Host öffnet den nächsten.
  Wer erst dazukommt, wenn der Fall schon offen ist, schaut zu und ist beim
  nächsten dabei.
- Die Räume liegen wie bei allen Spielen unter `rooms/murdoku-CODE`; an den
  Firebase-Regeln ist nichts zu ändern. Online-Fälle zählen nicht in die
  Statistik des Browsers.

Angefangene Fälle und gelöste werden im Browser gespeichert
(`drecksau-app/murdoku/cases`). Ein neu begonnener Fall zählt in der Statistik
als Spiel, ein angeklagter Täter als Sieg, Aufgeben als Niederlage.

## Einen Fall hinzufügen

Einen Eintrag in `LEVELS` ([engine/levels.ts](engine/levels.ts)): die Bereiche
mit Buchstabe, Name, Untergrund und Farbe, zwei Bilder aus Buchstaben (Bereich
und Gegenstand je Feld, Schlüssel in `THING_KEYS`) und die Verdächtigen mit
ihrem Hinweis, dazu der Lösungsweg vom Lösungsblatt als `hints`. Danach mit `solve` prüfen, dass es genau eine Lösung gibt - ein
Fall ohne eindeutige Lösung zeigt das auf der Seite an.
