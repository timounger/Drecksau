# RV There Yet? - Die Strecke zeichnen

Referenz für das Kartenformat. Es gibt **eine** Karte, nicht mehrere Level: eine
durchgehende Fahrt vom verschneiten Hochplateau bis zur Zielflagge, unterteilt
in sechs Abschnitte. Sie steht als zwei Textzeilen in
[engine/map.ts](../../../website/src/games/rv-there-yet/engine/map.ts), genauso
wie die Level von Panzerkiste als Textkarten stehen.

## Die zwei Zeilen

```text
GROUND = "CCCCCCCCCCBA98765432111111123456789ABC…"   Höhe des Bodens
MARKS  = "  C                   C                 …"   was dort steht
```

Beide Zeilen sind **gleich lang** und werden Zeichen für Zeichen übereinander
gelesen. Ein Zeichen ist ein **Feld** und steht für `ROUTE_STEP` = **8 Meter**
Strecke. Die aktuelle Karte hat 157 Felder, also 1248 Meter.

Zwischen den Stützpunkten wird der Boden **geglättet**
([engine/terrain.ts](../../../website/src/games/rv-there-yet/engine/terrain.ts)),
sonst wäre jede Kuppe eine Kante und das Wohnmobil bekäme alle acht Meter einen
Schlag.

## Die Höhenskala (obere Zeile)

| Zeichen | Höhe               |
| ------- | ------------------ |
| `0`     | 0 m - der Talboden |
| `1`     | 1,5 m              |
| `9`     | 13,5 m             |
| `A`     | 15 m               |
| `Z`     | 52,5 m             |

Jedes weitere Zeichen ist `HEIGHT_UNIT` = **1,5 Meter** höher, die Skala läuft
`0`-`9`, dann `A`-`Z`. Mehr als `Z` gibt es nicht; wer höher hinaus will, muss
die Einheit ändern und nicht die Skala.

## Die Marken (untere Zeile)

Leerzeichen heißt: da steht nichts. Alles, was herumliegt (`K`, `H`, `R`, `S`), wird
**mit der Taste F aufgehoben**, wenn man davorsteht - nicht im Vorbeilaufen.
Wer nah genug ist (`PICKUP_REACH` = 5 m), sieht einen gelben Ring darum.

| Zeichen | Element   | Bedeutung                                                                                                                                                       |
| ------- | --------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `T`     | Baum      | Festmachpunkt für die Seilwinde. Nur zu Fuß erreichbar (`ANCHOR_REACH` = 3 m).                                                                                  |
| `C`     | Abschnitt | Beginn eines Abschnitts. Flagge am Weg, kurze Meldung und **Speicherpunkt** beim Erreichen. Gehört auf **ebenen** Boden.                                        |
| `X`     | Graben    | Wer hier hineinfährt, hat ein **kaputtes** Wohnmobil. Mit dem Seil darüber bleibt es ganz.                                                                      |
| `K`     | Kanister  | Benzinkanister: aufheben, in die Hand nehmen, am Wohnmobil 4 s F halten - Tank wieder voll, Kanister leer.                                              |
| `H`     | Hammer    | Liegt herum, wird mit F aufgehoben, repariert das Wohnmobil (3 s F halten).                                                                             |
| `R`     | Reifen    | Geländereifen: montiert doppelten Grip (`TYRE_FACTOR`) - und sichtbar dickere Stollenräder, auf denen das Wohnmobil höher steht.                                |
| `S`     | Spray     | Bärenspray. Reicht 10 m weit und muss **gehalten** werden (2 s), dann zieht der Bär ab. Tragen allein nützt nichts.                                             |
| `N`     | Nebel     | **Zwei** Marken: die erste schließt die Sicht, die zweite öffnet sie wieder. Steht nur eine, gilt der Nebel bis zum Ziel.                                       |
| `B`     | Bär       | Bewacht seine Stelle: sperrt die Strecke 6 m vorher, bis er verscheucht ist. Sieht dich aus 30 m, kommt mit 3,2 m/s, folgt höchstens 12 m weit, tötet nach 4 s. |
| `P`     | Brücke    | Morsches Holz über einer Schlucht, mit Warnschild davor. Trägt das Wohnmobil mit **einem** Insassen; sitzen beide drin, bricht sie ein.                         |
| `M`     | Matsch    | Zerfahrener Boden: lässt das Fahrzeug durch, nimmt ihm aber das Tempo (höchstens 2 m/s). Steht vor einem Anstieg, den das Seil gewinnen soll.                      |
| `A`     | Abgrund   | Gar keine Straße: 3,9 m breit, ohne Boden. Wer hineinfährt oder hineinspringt, ist tot. Zu Fuß bleibt man 1,5 m davor stehen.                                   |
| `L`     | Baum      | Der Baum, der den Abgrund zufällt. Steht **jenseits** davon; gefällt liegt er als Straße darüber.                                                               |
| `Z`     | Axt       | Fällt den Baum (3 s F halten). Liegt ebenfalls drüben - man kommt nur über das Dach des Wohnmobils dorthin.                                                     |

**Schnee wird nicht gezeichnet.** Alles über `SNOW_FROM` = 14 m ist weiß, ab
`SNOW_FULL` = 18 m ganz. So sind das Startplateau und die hohen Pässe
automatisch verschneit und die Täler nicht, ohne dass es jemand zweimal
einträgt.

## Die Rechnung, die beim Zeichnen zählt

Ein Anstieg um **ein** Zeichen pro Feld ist eine Steigung von etwa 0,28 - das
ist fahrbar. **Zwei** Zeichen sind etwa 0,56 und damit über `NO_GRIP_SLOPE`
(0,55): da drehen die Räder durch.

Daraus folgt die eine Regel, an der eine Karte scheitern kann:

> **Jede Wand von zwei Zeichen oder mehr braucht einen Baum in Reichweite** -
> `WINCH_RANGE` = 46 m, also etwa fünfeinhalb Felder von der Stelle, an der die
> Räder aufgeben. Sonst ist die Strecke eine Sackgasse.

Ausnahme: Wände, die mit **Geländereifen** gemeint sind. Die verdoppeln den
Grip, also ist eine Zwei-Zeichen-Wand mit Reifen fahrbar - und genau davon lebt
Abschnitt 4, wo es keinen Baum gibt.

Und: Abschnittsmarken auf ebenen Boden setzen. Wer auf einer Schräge startet, fängt
damit an, rückwärts zu rutschen.

## Die Karte, wie sie jetzt ist

**Sechs Abschnitte auf 1592 Metern.** Es gibt keine Checkpoints daneben: Eine `C`
in der Markenzeile beginnt einen Abschnitt, und wer sie erreicht, hat den
vorigen geschafft - genau dann wird gespeichert. Der fünfte Abschnitt endet an
der Zielflagge.

| Nr. | Beginn | Feld |  Höhe | Bis    | Was dort zu tun ist                     |
| --: | -----: | ---: | ----: | ------ | --------------------------------------- |
|   1 |   16 m |    2 | 18,0m | 376 m  | Bergab, dann bergauf - herunterschalten |
|   2 |  376 m |   47 | 28,5m | 688 m  | Matsch b. 504, Anstieg, Baum bei 560 m  |
|   3 |  688 m |   86 | 12,0m | 888 m  | Der Graben, Baum bei 752, Hammer b. 808 |
|   4 |  888 m |  111 |  0,0m | 1088 m | Zu steil, kein Baum, Reifen bei 904 m   |
|   5 | 1088 m |  136 |  3,0m | 1256 m | Der Bär bei 1152, Spray bei 1104 m      |
|   6 | 1256 m |  157 |  0,0m | 1536 m | Nebel 1248 - 1512 m, ständiges Auf und Ab |
|   7 | 1536 m |  192 |  1,5m | 1760 m | Die Brücke bei 1636 - 1684 m            |
|   8 | 1760 m |  220 |  1,5m | 2232 m | Der Abgrund bei 1854 - 1858 m           |

Was wo liegt:

| Ding     | Feld       | Meter     |
| -------- | ---------- | --------- |
| Kanister | 6          | 48        |
| Matsch   | 63         | 500 - 508 |
| Bäume    | 70, 94     | 560, 752  |
| Graben   | 90, 91, 92 | 716 - 740 |
| Hammer   | 101        | 808       |
| Reifen   | 113        | 904       |
| Spray    | 138        | 1104      |
| Bär      | 144        | 1152      |
| Nebel    | 156 - 189  | 1248-1512 |
| Brücke   | 205 - 210  | 1636-1684 |
| Abgrund  | 232        | 1854-1858 |
| Baum     | 233        | 1864      |
| Axt      | 234        | 1872      |

### Die acht Abschnitte

Jeder trägt seinen Namen in der Leiste über dem Bild, hinter der Nummer -
„Abschnitt 3 / 8 - Am Seil hinauf". Die Namen stehen in
[i18n/texts.ts](../../../website/src/games/rv-there-yet/i18n/texts.ts), einer je
Abschnittsmarke; ein Test hält beide Zahlen aneinander.

1. **Bergab, dann bergauf** (16 - 376 m). Vom verschneiten Hochplateau hinunter
   ins Tal und auf der anderen Seite wieder hinauf auf den Pass.

   Die Gangschaltung lernt man hier - aber anders, als man denkt. Mit Gas durchs
   Tal erreicht das Wohnmobil **immer** die Höchstgeschwindigkeit des fünften
   Gangs, und die trägt rund 190 Meter Anstieg. Der Anstieg ist 136 Meter lang,
   also schleicht man auch im fünften hinüber, mit knapp 6 m/s.

   Bissig wird die Lektion, sobald man **steht**: Mitten am Hang kommt das
   Wohnmobil im fünften Gang in 40 Sekunden noch **3,9 Meter** weit, im ersten
   **182**. Wer anhält, um sich etwas anzusehen, muss herunterschalten.

2. **Am Seil hinauf** (376 - 688 m). Vom Hochplateau geht es hinunter ins Tal
   und dann vor eine Wand, die zum Fahren zu steil ist - aber ein Baum bei
   560 m steht in Seillänge. Aussteigen, hinlaufen, Seil dran, hochziehen. Hier
   lernt man die Winde, bevor der Graben sie verlangt.

   Damit das so bleibt, liegt bei 500 - 508 m **Matsch** vor der Wand. Ohne ihn
   kam man mit dem Anlauf vom Plateau im fünften Gang schlicht hinüber:
   gemessen bis **750,9 m**, also weit in den nächsten Abschnitt hinein, und
   die Winde war Zierde. Mit Matsch endet dieselbe Fahrt bei **520,8 m**, am
   Fuß der Wand.

   Die Zahlen, die man kennen sollte, wenn man daran schraubt: Im ersten Gang
   kommt das Wohnmobil bis **521,8 m** und bleibt dann stehen. Bis zum Baum
   sind es von dort **38,2 Meter** - bei 46 Metern Seil. Ein Test misst beides
   bei jedem Lauf gegeneinander, damit ein Dreh am Matsch die Wand nicht
   unlösbar macht.

3. **Der Graben** (688 - 888 m). Jetzt, wo die Winde sitzt, kommt der Fall, in
   dem man sie **braucht**: Zu Fuß läuft man über den Graben bei 716 - 740 m
   hinüber, mit dem Wohnmobil bricht man ein. Also aussteigen, zum Baum bei
   752 m laufen, Seil dran, hinüberziehen. Wer trotzdem hineinfährt, hat ein
   **kaputtes** Fahrzeug und braucht den **Hammer** von 808 m und drei
   Sekunden F.

4. **Zu steil, kein Baum** (888 - 1088 m). Weder Gas noch Winde helfen. Auf dem
   Weg davor liegen bei 904 m die **Geländereifen**: aufheben, zum Fahrzeug
   zurück, F halten, montieren. Damit hält es doppelt so viel Steigung.
5. **Der Bär** (1088 - 1248 m). Bei 1152 m bewacht er die Strecke, für Fahrzeug
   **und** Fahrer. Davor liegt bei 1104 m das **Bärenspray** - dabeizuhaben
   reicht nicht: nah ran und **F halten**, zwei Sekunden lang.
   Er sieht dich aus 30 m und kommt dann, und er ist bei dir, bevor die Dose
   fertig ist. Wer weiterhält, gewinnt; wer loslässt, fängt von vorn an. Hat er
   dich vier Sekunden, ist die Fahrt zu Ende. Ins Fahrerhaus zu steigen ist der
   Ausweg - wer drin sitzt, ist für einen Bären nicht da. Im Koop reicht eine
   Dose für beide: einer sprüht, beide kommen durch.

6. **Im Nebel** (1256 - 1536 m). Ab 1248 m ist die Sicht zu: Man sieht knapp
   zwei Wagenlängen weit und danach nichts mehr. Die Strecke geht ständig auf
   und ab - keine Stufe steiler als eine, also alles fahrbar - aber **welche**
   gerade kommt, sieht man nicht. Bleibt nur der Tacho: Fällt die Nadel bei
   gleichem Gas, geht es bergauf; steigt sie, bergab. Zu hoch geschaltet bleibt
   man an einer Kuppe hängen, die man nie gesehen hat.

   Und im Nebel darf man **nicht stehen bleiben**: Wer sich fünf Sekunden lang
   nicht bewegt - im Fahrzeug wie zu Fuß -, wird geholt und die Fahrt ist zu
   Ende. Ab der zweiten Sekunde steht die Warnung mit Prozentzahl auf dem
   Schirm, ab 40 % schält sich vorn auf der Strecke eine hohe, dünne Gestalt
   aus dem Grau - in der Seitenansicht wie durch die Windschutzscheibe. Jede
   Bewegung setzt den Zähler zurück, und außerhalb des Nebels läuft er gar
   nicht erst.

   Bei 1512 m reißt der Nebel wieder auf - noch vor dem nächsten Abschnitt,
   denn was dort kommt, muss man sehen können.

7. **Die Brücke** (1536 - 1760 m). Bei 1636 m steht ein rotes Warndreieck, und
   dahinter liegen 48 Meter altes Holz über einer Schlucht. Die Zeile am Rand
   sagt, was das Schild meint: **morsch, hält nur wenig Gewicht.**

   Es trägt das Wohnmobil mit **einem** Insassen. Sitzen beide drin, bricht es
   ein, sobald die Räder auf den Planken sind - dann ist die Fahrt zu Ende und
   der Abschnitt beginnt von vorn. Also fährt einer, und der andere geht zu Fuß
   hinüber; wer nebenherläuft, zählt nicht, denn die Planke unter einem Paar
   Stiefel ist nicht die Planke unter drei Tonnen.

   Allein stellt sich die Frage nie - dies ist die eine Stelle der Karte, die
   dem Koop-Paar etwas abverlangt, was ein einzelner Spieler nie zu tun hat.

8. **Der Abgrund** (1760 - 2232 m). Bei 1854 m hört die Straße einfach auf:
   3,9 Meter ohne Boden. Wer hineinfährt, ist tot und fängt den Abschnitt neu
   an; zu Fuß bleibt man anderthalb Meter vor der Kante stehen.

   Zugefällt wird er mit dem **Baum bei 1864 m** - der steht drüben, und die
   **Axt bei 1872 m** liegt dort auch. Hinüber kommt man nur über das
   **Wohnmobil**: dicht an die Kante fahren, aussteigen, hinten an der Leiter
   die Leertaste drücken und aufs Dach klettern, vorn an die Dachkante laufen
   und mit **Doppelsprung** hinüberspringen.

   Das ist gerechnet und nicht geraten: Ein Sprung trägt gut fünf Meter, aber
   vom Boden aus muss er anderthalb Meter vor der Kante beginnen und vom Dach
   aus nicht. Damit ist der Abgrund von unten unerreichbar und von oben mit
   gut anderthalb Metern Luft zu schaffen - man muss also nicht auf den
   Zentimeter genau parken.

   Drüben: Axt aufheben (F), zum Baum, **F halten** - nach drei Sekunden fällt
   er über den Abgrund und ist von da an Straße. Über den Stamm geht es zurück
   zum Wohnmobil und dann darüber hinweg.

Dahinter ist die Zielflagge, und damit ist das Spiel geschafft. Weitere
Abschnitte gibt es vorerst nicht.

## Nichts davon wird dem Auge überlassen

[engine/map.test.ts](../../../website/src/games/rv-there-yet/engine/map.test.ts)
fährt **jeden Abschnitt einzeln** mit einem Autopiloten ab: aussteigen,
hinlaufen, Seil dranmachen, kurbeln, Hammer/Reifen/Spray holen, halten zum
Arbeiten. Kommt ein Abschnitt nicht durch, schlägt der Test fehl - eine Karte,
die man nicht schaffen kann, fällt also beim Bauen auf und nicht beim Spielen.

Geprüft wird ausserdem, dass jede Abschnittsmarke auf ebenem Boden steht, dass zum
Graben ein Baum in Seilreichweite gehört und dass die Wand hinter den Reifen
umgekehrt **keinen** Baum in Reichweite hat - sonst wäre der Umweg über die
Geländereifen keiner.
