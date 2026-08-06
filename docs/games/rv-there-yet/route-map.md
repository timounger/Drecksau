# RV There Yet? - Die Strecke zeichnen

Referenz für das Kartenformat. Es gibt **eine** Karte, nicht mehrere Level: eine
durchgehende Fahrt vom verschneiten Hochplateau bis zur Zielflagge, unterteilt
in fünf Abschnitte. Sie steht als zwei Textzeilen in
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

Leerzeichen heißt: da steht nichts. Alles, was herumliegt (`H`, `R`, `S`), wird
**mit der Taste F aufgehoben**, wenn man davorsteht - nicht im Vorbeilaufen.
Wer nah genug ist (`PICKUP_REACH` = 5 m), sieht einen gelben Ring darum.

| Zeichen | Element   | Bedeutung                                                                                                                            |
| ------- | --------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| `T`     | Baum      | Festmachpunkt für die Seilwinde. Nur zu Fuß erreichbar (`ANCHOR_REACH` = 3 m).                                                       |
| `C`     | Abschnitt | Beginn eines Abschnitts. Flagge am Weg, kurze Meldung und **Speicherpunkt** beim Erreichen. Gehört auf **ebenen** Boden.             |
| `X`     | Graben    | Wer hier hineinfährt, hat ein **kaputtes** Wohnmobil. Mit dem Seil darüber bleibt es ganz.                                           |
| `H`     | Hammer    | Liegt herum, wird mit F aufgehoben, repariert das Wohnmobil (3 s Leertaste halten).                                                  |
| `R`     | Reifen    | Geländereifen: montiert doppelten Grip (`TYRE_FACTOR`) - und sichtbar dickere Stollenräder, auf denen das Wohnmobil höher steht.     |
| `S`     | Spray     | Bärenspray. Reicht 10 m weit und muss **gehalten** werden (2 s), dann zieht der Bär ab. Tragen allein nützt nichts.                  |
| `B`     | Bär       | Bewacht seine Stelle: sperrt die Strecke 6 m vorher, bis er verscheucht ist. Sieht dich aus 30 m, kommt mit 3,2 m/s, tötet nach 4 s. |

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

**Fünf Abschnitte auf 1248 Metern.** Es gibt keine Checkpoints daneben: Eine `C`
in der Markenzeile beginnt einen Abschnitt, und wer sie erreicht, hat den
vorigen geschafft - genau dann wird gespeichert. Der fünfte Abschnitt endet an
der Zielflagge.

| Nr. | Beginn | Feld |  Höhe | Bis    | Was dort zu tun ist                     |
| --: | -----: | ---: | ----: | ------ | --------------------------------------- |
|   1 |   16 m |    2 | 18,0m | 376 m  | Bergab, dann bergauf - herunterschalten |
|   2 |  376 m |   47 | 28,5m | 704 m  | Der Graben, Baum bei 560, Hammer b. 624 |
|   3 |  704 m |   88 |  1,5m | 888 m  | Zu steiler Anstieg, Baum bei 776 m      |
|   4 |  888 m |  111 |  0,0m | 1088 m | Zu steil, kein Baum, Reifen bei 904 m   |
|   5 | 1088 m |  136 |  3,0m | 1248 m | Der Bär bei 1152, Spray bei 1104 m      |

Was wo liegt:

| Ding   | Feld       | Meter     |
| ------ | ---------- | --------- |
| Graben | 66, 67, 68 | 528 - 544 |
| Bäume  | 70, 97     | 560, 776  |
| Hammer | 78         | 624       |
| Reifen | 113        | 904       |
| Spray  | 138        | 1104      |
| Bär    | 144        | 1152      |

### Die fünf Abschnitte

1. **Bergab, dann bergauf** (16 - 376 m). Vom verschneiten Hochplateau hinunter
   ins Tal und auf der anderen Seite wieder hinauf auf den Pass.

   Die Gangschaltung lernt man hier - aber anders, als man denkt. Mit Gas durchs
   Tal erreicht das Wohnmobil **immer** die Höchstgeschwindigkeit des fünften
   Gangs, und die trägt rund 190 Meter Anstieg. Der Anstieg ist 136 Meter lang,
   also schleicht man auch im fünften hinüber, mit knapp 6 m/s.

   Bissig wird die Lektion, sobald man **steht**: Mitten am Hang kommt das
   Wohnmobil im fünften Gang in 40 Sekunden noch **3,9 Meter** weit, im ersten
   **182**. Wer anhält, um sich etwas anzusehen, muss herunterschalten.

2. **Der Graben** (376 - 704 m). Zu Fuß läuft man hinüber, mit dem Wohnmobil
   bricht man ein. Also aussteigen, zum Baum bei 560 m laufen, Seil dran,
   hinüberziehen. Wer trotzdem hineinfährt, hat ein **kaputtes** Fahrzeug und
   braucht den **Hammer** von 624 m und drei Sekunden Leertaste.
3. **Ein Anstieg mit Baum** (704 - 888 m). Dieselbe Übung ohne Graben: zu steil
   zum Fahren, aber ein Baum bei 776 m steht in Seillänge. Der Abschnitt ist das
   Wiederholungsstück - hier merkt man, dass die Winde nicht die Notlösung fürs
   Verunglücken ist, sondern ein Werkzeug, das man einplant.

   Wie knapp das ist, lohnt sich zu wissen, wenn man daran schraubt: Im ersten
   Gang kommt das Wohnmobil bis **731,9 m** und bleibt dann stehen. Bis zum Baum
   sind es von dort **44,1 Meter** - bei 46 Metern Seil. Zwei Meter mehr Wand,
   und der Abschnitt wäre nicht mehr zu schaffen.

4. **Zu steil, kein Baum** (888 - 1088 m). Weder Gas noch Winde helfen. Auf dem
   Weg davor liegen bei 904 m die **Geländereifen**: aufheben, zum Fahrzeug
   zurück, Leertaste halten, montieren. Damit hält es doppelt so viel Steigung.
5. **Der Bär** (1088 - 1248 m). Bei 1152 m bewacht er die Strecke, für Fahrzeug
   **und** Fahrer. Davor liegt bei 1104 m das **Bärenspray** - dabeizuhaben
   reicht nicht: nah ran und die Leertaste **halten**, zwei Sekunden lang.
   Er sieht dich aus 30 m und kommt dann, und er ist bei dir, bevor die Dose
   fertig ist. Wer weiterhält, gewinnt; wer loslässt, fängt von vorn an. Hat er
   dich vier Sekunden, ist die Fahrt zu Ende. Ins Fahrerhaus zu steigen ist der
   Ausweg - wer drin sitzt, ist für einen Bären nicht da. Im Koop reicht eine
   Dose für beide: einer sprüht, beide kommen durch.

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
