# Krakel Orakel - Tafeln und Wörter

Referenz für die beiden Inhalte, die das Spiel ausmacht: die **Zeichenvorlagen**
(Tafeln) und die **Wortlisten**. Die Regeln stehen in
[game-rules.md](game-rules.md).

## Die Tafeln

Es gibt **14 Tafeln**. Sie sind nicht erzeugt, sondern von Scans der echten
Spielbretter abgenommen - Punkt für Punkt, insgesamt 26.117 Stück.

| Tafel | Punkte | Tafel | Punkte | Tafel | Punkte |
| ----: | -----: | ----: | -----: | ----: | -----: |
|     1 |   1575 |     6 |   2136 |    11 |   2251 |
|     2 |   1959 |     7 |   1534 |    12 |   2180 |
|     3 |   1902 |     8 |   2011 |    13 |   2106 |
|     4 |   1504 |     9 |   1885 |    14 |   2002 |
|     5 |   1316 |    10 |   1756 |       |        |

Jede Runde bekommt jede Person eine andere Tafel zugeteilt; über die Leitung
geht nur die **Tafelnummer**.

### Dateien

| Datei                                                                            | Inhalt                                                 |
| -------------------------------------------------------------------------------- | ------------------------------------------------------ |
| [engine/boards-data.ts](../../../website/src/games/krakel/engine/boards-data.ts) | Die Punktdaten. **Generiert - nicht von Hand ändern.** |
| [engine/boards.ts](../../../website/src/games/krakel/engine/boards.ts)           | Decoder, Zugriff, Einrasten des Stifts                 |

### Format

Eine Tafel ist eine Zeichenkette. Je Punkt **vier Zeichen**: zwei für x, zwei
für y. Jedes Zeichen trägt 6 Bit über ein 64er-Alphabet, eine Koordinate also
12 Bit (0 bis 4095) auf der normierten 0..1-Fläche.

```text
   Zeichen:   c0 c1 c2 c3   c4 c5 c6 c7   ...
              \___/ \___/   \___/ \___/
                x     y       x     y
              1. Punkt      2. Punkt

   x = (wert(c0) << 6 | wert(c1)) / 4095
   y = (wert(c2) << 6 | wert(c3)) / 4095

   wert(z) = Position von z in
             "ABC...XYZabc...xyz0123456789+/"
```

Das ist bewusst simpel gehalten. Eine dichter gepackte Kodierung spart rund
13 KB nach gzip, macht den Decoder aber fehleranfälliger - bei 26.117 Punkten
ein schlechter Tausch. Der Quantisierungsfehler liegt bei höchstens 0,17 Pixel
gemessen am Scan, bei 9 Pixel großen Punkten also unsichtbar.

### Seitenverhältnis

`BOARD_ASPECT` ist **1.436** - das Verhältnis der gedruckten Tafel. Das Canvas
richtet seine Höhe danach (960 x 669), sonst würde das Punktmuster verzerrt.
Wer die Zahl ändert, muss auch die Tailwind-Klassen `aspect-[960/669]` in
[krakel-board.tsx](../../../website/src/games/krakel/components/krakel-board.tsx)
mitziehen.

### Eine Tafel ergänzen oder ersetzen

Die Scans liegen **nicht** im Repository. Zum Neueinlesen braucht es einen
Extraktionsschritt, der aus einem Scan die Punktmitten holt:

1. Weiße Karte aus dem schwarzen Scanrand freistellen (größte helle Fläche).
2. Tinte schwellen (Luminanz < 195).
3. **Matched Filter** (Boxfilter über etwa eine Punktbreite) und anschließend
   greedy Non-Maximum-Suppression mit mindestens 13 Pixel Abstand.
4. Mitten auf 0..1 normieren und wie oben kodieren.

Schritt 3 ist der springende Punkt: einfaches Zusammenhangs-Labeling verliert
rund 16 Prozent der Punkte, weil an Linienkreuzungen zwei Punkte zu einem Klumpen
verschmelzen. Erosion hilft nicht - die Punkte sind nur etwa 9 Pixel groß und im
Halbtondruck ausgefranst, sie verschwinden dabei ganz.

Zur Kontrolle taugt nur der Augenschein: die erkannten Punkte neu rendern und
neben den Scan legen. Zahlen allein verraten einen Versatz nicht.

Prüfwerte einer sauberen Extraktion: die Karte misst rund 1414 x 983 Pixel, der
Abstand benachbarter Punkte liegt bei etwa 16,6 Pixel.

Der [Tafel-Test](../../../website/src/games/krakel/engine/boards.test.ts) prüft
danach automatisch, dass jede Tafel dekodierbar ist, innerhalb der Fläche liegt,
sie ganz ausfüllt und sich von den anderen unterscheidet.

## Die Wortlisten

Zwei flache Listen in
[engine/words.ts](../../../website/src/games/krakel/engine/words.ts), eine je
Schwierigkeit. Ein Spiel zieht immer nur aus **einer** davon.

| Konstante    | Stufe  | Wörter | Charakter                                         |
| ------------ | ------ | -----: | ------------------------------------------------- |
| `EASY_WORDS` | Leicht |    238 | Dinge, die man direkt malen kann                  |
| `HARD_WORDS` | Schwer |    239 | Dazu Ideen, Orte und Tätigkeiten ohne festes Bild |

`wordsFor(difficulty)` liefert die passende Liste, `pickWords(...)` zieht daraus.

Beide Listen teilen eine Konvention: Einträge, die **keine Dinge** sind, werden
kleingeschrieben - Tätigkeiten (`tauchen`, `pilgern`) und Eigenschaften
(`giftig`, `wortkarg`). Das ist Absicht und macht sie auf einen Blick kenntlich.

### Regeln für die Listen

- **Kein Wort doppelt - innerhalb einer Liste.** Das ist keine Kosmetik:
  Begriffe und Zusatzwörter werden in einem Zug gezogen, ein doppelt gelistetes
  Wort kann also zweimal gezogen werden - dann bekommen zwei Personen denselben
  Begriff, oder ein Zusatzwort ist in Wahrheit das Wort einer Person. Beides
  macht die Runde kaputt. Der
  [Wort-Test](../../../website/src/games/krakel/engine/words.test.ts) prüft das
  für beide Listen.
- **Zwischen den Listen darf sich etwas überschneiden.** Ein Spiel zieht nur aus
  einer, ein Wort in beiden Listen schadet also nicht.
- **Genug Wörter für die längste Partie.** Nötig sind
  `TOTAL_ROUNDS x (MAX_PLAYERS + DECOY_COUNT)`, aktuell also 36. Auch das prüft
  der Test.
- **Keine überflüssigen Leerzeichen.** Mehrwortbegriffe wie `Erste Hilfe` sind
  in Ordnung; Wörter werden angeklickt, nicht getippt.

### Ein Wort ergänzen

Einfach an `EASY_WORDS` oder `HARD_WORDS` anhängen. Die Reihenfolge spielt keine
Rolle - jede Runde zieht ohnehin gemischt.
