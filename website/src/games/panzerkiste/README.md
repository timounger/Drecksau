# Panzerkiste

Ein Top-Down-Panzerspiel nach dem Vorbild von „Tanks!" aus Wii Play. Du steuerst
einen Panzer über ein 2D-Feld voller Mauern und feindlicher Panzer; zerstöre
alle Gegner, um das Level zu schaffen.

## Steuerung

- **Bewegen:** W A S D (oder Pfeiltasten)
- **Schießen:** Linksklick - das Rohr zielt auf den Mauszeiger; Schüsse prallen
  einmal an einer Mauer ab
- **Lenkrakete:** Linke Maustaste **gedrückt halten** - sie sucht sich selbst
  einen Gegner. Kann einer **in gerader Linie** getroffen werden, nimmt sie den,
  auch wenn ein näherer erst umständlich um Ecken anzufliegen wäre. Eigene
  Panzer sind für sie tabu: Sie zielt nie auf den Koop-Partner und fliegt auch
  unterwegs einfach über ihn hinweg.
- **Mine legen:** Leertaste - die **gelbe** Mine explodiert nach **3 Sekunden**
  (in der letzten Sekunde blinkt sie schnell rot/gelb) und reißt alles im Umkreis
  mit (auch dich). Ein **Treffer durch einen Schuss zündet sie sofort**. Der
  Explosionsradius wird bewusst **nicht** angezeigt.

Drei Leben zum Start, mit stärker werdenden Gegnern über viele Level. Alle fünf
Level (5, 10, 15, ...) gibt es ein Bonusleben dazu.

## Die Endlos-Arena (Level 25)

Nach dem letzten Kampagnenlevel geht es in die **Arena**. Sie wird nie geräumt:
Ist das Feld leer, kommt nach einer kurzen Pause die nächste **Welle** -
jedes Mal mehr Panzer, und mit der Zeit auch schlimmere. Schluss ist erst,
wenn die Leben alle sind.

| Welle | Was dazukommt                      |
| ----- | ---------------------------------- |
| 1     | Braun und Grau, zwei Stück         |
| 3     | Gelb (legt Minen)                  |
| 4     | Türkis (Raketen)                   |
| 6     | Grün (Bankschütze)                 |
| 7     | Lila (schnell, doppelte Feuerrate) |
| 9     | Unsichtbar                         |
| 11    | **Schwarz**                        |

Die Anzahl wächst um einen Panzer je zwei Wellen und ist bei **acht** gedeckelt -
darüber wird die Arena kein Stück schwerer, sondern nur voll. Ab da steigt die
Schwierigkeit nur noch über die **Sorte**, die auftaucht.

Ein verlorenes Leben kostet die Welle **nicht**: Es geht dort weiter, wo du warst.
Sonst wäre der Endlosmodus nach jedem Fehler wieder am Anfang.

**Die Kampagne gilt als gewonnen, sobald du die Arena betrittst.** Die Arena
selbst kann man nicht gewinnen, also wäre der Sieg sonst nirgends verbucht.

## Was Gegner fallen lassen

Ein zerstörter Panzer lässt **gelegentlich** etwas liegen; einfach drüberfahren,
dann wirkt es sofort:

| Fundstück                   | Wirkung                                                                                                                        |
| --------------------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| **Schild** (blau)           | Kurze Zeit unverwundbar. Ein Ring um den Panzer zeigt es; die letzten Sekunden **blinkt** er, damit das Ende nicht überrascht. |
| **Schnellfeuer** (orange)   | Deutlich kürzere Nachladezeit.                                                                                                 |
| **Streumunition** (violett) | Jeder Schuss geht als Fächer raus - genauso lange wie das Schnellfeuer.                                                        |
| **Wiederbeleben** (grün)    | Nur online, und nur solange der Partner am Boden liegt: Er steht neben dir wieder auf, kurz geschützt.                         |

Das grüne Fundstück fällt gar nicht erst, wenn es niemand gebrauchen kann -
allein oder mit lebendem Partner liegt dafür nichts herum.

Der letzte und härteste Gegner ist der **schwarze Panzer**: schneller als jeder
andere auf dem Feld, und er feuert schnelle Raketen im kurzen Takt, die einmal
abprallen. Deckung kauft gegen ihn deutlich weniger Zeit als gegen alle
anderen.

## Koop online

Unter `/panzerkiste/online` geht es **zu zweit im Koop** durch dieselben
Missionen. Entweder über „Mitspieler finden" (automatische Suche) oder über
einen privaten Raumcode.

## Statistik

Neben den geteilten Zahlen (begonnen, gewonnen, Spielzeit) führt Panzerkiste
unter `/panzerkiste/statistik` eine **eigene** Karte:

| Zahl                            | Bedeutung                                                                              |
| ------------------------------- | -------------------------------------------------------------------------------------- |
| **Weitestes Level**             | Wie weit du je gekommen bist - **erreicht**, nicht geschafft.                          |
| **Level geschafft**             | Wie viele Level insgesamt geräumt wurden.                                              |
| **Weiteste Welle**              | Wie weit du in der Endlos-Arena gekommen bist.                                         |
| **Treffer je Schuss**           | Anteil der Granaten, die einen Gegner erwischt haben.                                  |
| **Schnitt / Schnellstes Level** | Dauer eines geräumten Levels, in **Spielzeit** gemessen - eine Pause zählt nicht dazu. |

Gezählt wird je **Granate**, nicht je Abzug: Eine Streusalve sind drei. Die
Lenkrakete bleibt aus beiden Zahlen heraus - sie sucht sich ihr Ziel selbst,
über Zielgenauigkeit sagt sie also nichts.

Die Zahlen stehen in einer eigenen Karte statt in der geteilten: Level und
Granaten bedeuten einem Kartenspiel nichts, und die geteilte Statistik weiß
bewusst von keinem einzelnen Spiel etwas.

Gebucht wird **während** des Spielens, nicht erst am Missionsende - die meisten
Runden bricht man ab, und alles Verschossene wäre sonst nie gezählt worden.

## Aufbau des Spielmoduls

```text
games/panzerkiste/
  engine/       reine Simulation, ohne Canvas oder DOM (Schritt, Kollisionen, KI)
  components/   Canvas-Renderer und die React-Oberflaeche
  hooks/        Animationsschleife + Eingabe (Tastatur/Maus)
  i18n/         deutsche Texte
  assets/       das Cover-Logo
```

Die Simulation ist bewusst von der Darstellung getrennt und **rein funktional**:
[engine/engine.ts](engine/engine.ts) rechnet aus Zustand plus Eingabe plus
vergangener Zeit den nächsten Zustand aus - ohne Canvas, ohne Uhr. Derselbe Seed
und dieselben Eingaben spielen sich identisch ab, was die Gegner-KI ohne Browser
testbar macht. Der Renderer ([components/render.ts](components/render.ts)) malt
diesen Zustand nur; die Schleife und die Eingabe stecken in
[hooks/use-panzerkiste.ts](hooks/use-panzerkiste.ts).

## Level

Die Level sind ASCII-Karten in [engine/levels.ts](engine/levels.ts): `#` Mauer,
`x` zerstörbare Wand, `.` Boden, `P` der (blaue) Spieler und `B` ein brauner
Gegner. Die vollständige Zeichen-Legende steht in der Karten-Doku (siehe unten).
Ein neues Level ist einfach eine weitere Karte.

Das Spielfeld ist **fest 22 x 12 Zellen** (wie in Wii Play), und der **umlaufende
Mauerrand wird automatisch** von [engine/setup.ts](engine/setup.ts) angelegt -
die Karte zeichnet also nur das Innere und kann den Rand nicht vergessen. Mit
Rand ergibt das ein 24 x 14 grosses Gitter.

Das vollständige Kartenformat - **welches Zeichen für welches Element steht**,
Größe, Regeln und eine leere Vorlage - steht in
[docs/games/panzerkiste/levels.md](../../../../docs/games/panzerkiste/levels.md).

## Cover-Logo

Das Bild liegt in [assets/logo.webp](assets/logo.webp) - aktuell ein Platzhalter,
den man durch echte WebP-Grafik ersetzen kann.
