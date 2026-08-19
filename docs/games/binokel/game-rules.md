# Binokel - Spielregeln als Spezifikation

Grundlage der Implementierung. Binokel ist ein wuerttembergisches Stichspiel der
Bezique-/Pinochle-Familie. Regionale Varianten sind zahlreich; diese Datei legt
die **eine** Variante fest, die die Engine in `website/src/games/binokel/engine/`
umsetzt. Abweichende Hausregeln koennen spaeter als Optionen dazukommen.

Umgesetzt sind **3 bis 6 Spieler**, jeder gegen jeden - und zu viert wie zu
sechst wahlweise als **Kreuzbinokel** in zwei Mannschaften.

## Karten

Doppeltes deutsches Blatt (jede Karte zweimal). Vier Farben: **Eichel**,
**Blatt** (auch Schippen/Laub/Gruen), **Herz**, **Schellen**.

Raenge und Werte (hoch nach niedrig):

| Rang       | Wert | Engine-Rang |
| ---------- | ---- | ----------- |
| Daus (Ass) | 11   | `daus`      |
| Zehner     | 10   | `zehn`      |
| Koenig     | 4    | `koenig`    |
| Ober       | 3    | `ober`      |
| Unter      | 2    | `unter`     |
| Sieben     | 0    | `sieben`    |

Wichtig: Der **Zehner ist die zweithoechste Karte** (direkt unter dem Daus), nicht
zwischen Koenig und Neun. Das ist die Pinochle-/Binokel-Ordnung.

- **Mit Siebenern:** 48 Karten (6 Raenge x 4 Farben x 2).
- **Ohne Siebener:** 40 Karten (5 Raenge x 4 Farben x 2). Haeufigere Variante.

Gesamte Augen im Spiel: (11+10+4+3+2+0) x 4 x 2 = **240**, plus **10 fuer den
letzten Stich** = **250 Stichpunkte** pro Runde. Die Siebener sind 0 Augen wert;
mit oder ohne Siebener bleibt die Augensumme gleich.

## Geben

So viele Karten je Person, dass der Rest genau den Dabb ergibt:

| Spieler | ohne Siebener (40) | mit Siebenern (48) |
| ------- | ------------------ | ------------------ |
| 3       | je 12, Dabb 4      | je 15, Dabb 3      |
| 4       | je 9, Dabb 4       | je 11, Dabb 4      |
| 5       | je 7, Dabb 5       | je 9, Dabb 3       |
| 6       | je 6, Dabb 4       | je 7, Dabb 6       |

Ohne Dabb werden die Karten gleichmaessig ausgeteilt; was nicht aufgeht, bleibt
als kleiner Rest liegen.

Der Dabb liegt verdeckt. Wer das Reizen gewinnt (Spielmacher), nimmt den Dabb
auf und **drueckt** danach genau so viele Karten wieder ab, dass er wieder seine
Grund-Handzahl haelt.

Beim Aufnehmen wird der Dabb **offen** hingelegt: Alle am Tisch sehen, welche
Karten der Spielmacher bekommt. Das ist keine Nebensaechlichkeit, sondern
Information, mit der die Gegenpartei spielt. Die Umsetzung zeigt ihn deshalb
jedem an, solange er offen liegt - also vom Zuschlag bis zum Druecken -, und
schwaerzt ihn online in dieser Zeit ausdruecklich **nicht**. Verdeckt bleibt er
nur davor, waehrend des Reizens.

## Reizen (Bieten)

Als Duell, nicht reihum: Die **Vorhand** (links vom Geber) haelt zunaechst den
Reiz. Der naechste Spieler reizt gegen sie - beide gehen abwechselnd in
10er-Schritten hoch, **bis einer „weg" sagt**. Der Gewinner reizt dann gegen den
naechsten Spieler, und so weiter. Der zuletzt Verbliebene ist **Spielmacher** und
hat den Reizwert als Zielvorgabe.

Bewusste Festlegungen (Engine):

1. **Reizschritt = 10.**
2. **Mindestgebot = 150.** Wer gar nichts bieten will, passt sofort. Passen alle
   Herausforderer, spielt die **Vorhand** zum Mindestgebot.
3. Gereizt wird auf **Melde- plus erwartete Stichpunkte**; die KI schaetzt das
   aus ihrer Hand.

Der Spielmacher nimmt den Dabb, drueckt, sagt die **Trumpffarbe** an und meldet.

## Melden

Meldepunkte zaehlen nur, wenn der meldende Spieler **mindestens einen Stich**
macht. In der 3-Spieler-Runde meldet zuerst der Spielmacher, dann die Gegner;
jeder wertet seine eigenen Meldungen.

| Meldung                                            | Punkte | Trumpf |
| -------------------------------------------------- | ------ | ------ |
| **Dix** (Trumpf-Sieben; nur mit Siebenern)         | 10     | -      |
| **Paar** Koenig + Ober einer Farbe                 | 20     | 40     |
| **Binokel** (Blatt-Ober + Schellen-Unter)          | 40     | -      |
| **Vier Unter** (je einer pro Farbe)                | 40     | -      |
| **Vier Ober**                                      | 60     | -      |
| **Vier Koenige**                                   | 80     | -      |
| **Vier Dausen**                                    | 100    | -      |
| **Familie** Daus-Zehn-Koenig-Ober-Unter 1 Farbe    | 100    | 150    |
| **Rundgang** (in jeder Farbe ein Koenig+Ober-Paar) | 240    | -      |
| **Doppelbinokel** (Binokel doppelt)                | 300    | -      |
| **Acht Gleiche** (ein Rang, alle 8 Karten)         | 1000   | -      |
| **Doppelte Familie** (alle 10 Karten einer Farbe)  | 1500   | -      |

Karten-Mehrfachnutzung (bewusste Festlegung, an der gaengigen Regel orientiert):

- Eine **Familie** verbraucht ihren Koenig und Ober - dieselben Karten bilden
  **kein** zusaetzliches Paar. Erst ein weiterer Koenig+Ober (zweites Exemplar)
  gaebe ein Paar.
- Der **Rundgang** (in jeder Farbe ein Paar) wird aus den nach den Familien
  uebrigen Paaren gebildet und geht den Einzelpaaren vor.
- **Vier/Acht Gleiche, Binokel und Dix** zaehlen unabhaengig und duerfen Karten
  mitbenutzen (der Daus einer Familie zaehlt z. B. auch bei „Vier Dausen").
- „Vier Gleiche" braucht vier **verschiedene** Farben desselben Rangs; die
  zweiten Exemplare zaehlen erst bei „Acht Gleiche".

## Stechen

Zum ersten Stich spielt die **Vorhand** aus - der Spieler links vom Geber -,
**nicht** der Spielmacher. Da der Geber jede Runde weiterrueckt, kommt reihum
jedes Mal ein anderer heraus.

Einzige Ausnahme: Beim **Durch** spielt der Spielmacher aus. Er muss ohnehin
jeden Stich machen, also kommt er selbst heraus.

Zwaenge, in dieser Reihenfolge:

1. **Farbzwang:** Angespielte Farbe bedienen, wenn moeglich.
2. **Stichzwang:** Wer bedienen kann, muss den bisher hoechsten Wert im Stich
   **ueberbieten**, wenn er eine hoehere Karte derselben Farbe hat.
3. **Trumpfzwang:** Wer die Farbe nicht bedienen kann, muss **Trumpf** spielen -
   und einen bereits liegenden Trumpf **ueberstechen**, wenn moeglich.
4. Wer weder bedienen noch trumpfen kann, gibt eine beliebige Karte zu.

Trumpf sticht jede andere Farbe. Bei **wertgleichen** hoechsten Karten (zwei
identische, z. B. beide Herz-Daus) gewinnt die **zuerst gespielte**. Der
Stichgewinner spielt zum naechsten Stich aus.

**Letzter Stich:** zusaetzlich **10 Punkte**.

## Wertung einer Runde

Jeder Spieler: **Stichpunkte** (Augen seiner Stiche) + eigene **Meldepunkte**
(nur bei mindestens einem Stich) + ggf. 10 fuer den letzten Stich.

- **Spielmacher erreicht seinen Reizwert** (Melde + Stich >= Reizwert): Er
  bekommt seine Punkte gutgeschrieben, die Gegner ebenfalls ihre.
- **Spielmacher „geht ab"** (Reizwert nicht erreicht): Ihm wird der **doppelte
  Reizwert abgezogen**, seine Meldungen verfallen. Die Gegner werten normal.

Rundung der Stichpunkte auf Zehner (ab 5 Augen auf, sonst ab). Meldepunkte sind
schon glatt.

## Gesamtpartie

Vorab vereinbarte **Zielpunktzahl** (Standard **1000**, waehlbar). Nach jeder
Runde werden die Punkte fortgeschrieben. Erreicht ein Spieler durch ein
**gewonnenes** (nicht abgegangenes) Spiel das Ziel, ist die Partie zu Ende; wer
oben steht, gewinnt.

## Was umgesetzt ist

- **3 bis 6 Spieler.** Zu viert und zu sechst wahlweise als **Kreuzbinokel** in
  zwei Mannschaften; die Handkartenzahl richtet sich nach der Tischgroesse, so
  dass der Rest genau den Dabb ergibt.
- **Mit oder ohne Siebener** (48 oder 40 Karten) und **mit oder ohne Dabb**.
  Ohne Dabb werden die Karten gleichmaessig verteilt; was nicht aufgeht, bleibt
  als kleiner Rest liegen.
- **Durch** (alle Stiche): nach dem Melden ansagbar, +1000 bei Erfolg, -1000
  sonst. Der Spielmacher spielt dabei selbst aus.
- Frei benennbar: Farben, Daus, Dix und das Reizen - je nachdem, wie es am
  eigenen Tisch heisst.

## Offene/spaetere Punkte

- Spiel zu **zweit**.
- Sonderspiel „Bettel/Untendurch" (kein Stich).
- „Rufen" einer fehlenden Karte.

## Quellen

- [Binokel - Wikipedia](https://de.wikipedia.org/wiki/Binokel)
