# U-Boot: Das Kartenformat

Ein Kurs ist Text. Eine Zeile ist ein Band Wasser, ein Zeichen ist ein Quadrat
davon, und gelesen wird von links (Hafen) nach rechts (Ausgang).

Die Karten stehen in
[`website/src/games/uboot/engine/levels.ts`](../../../website/src/games/uboot/engine/levels.ts).

## Die Zeichen

| Zeichen | Was                   | Tödlich? |
| ------- | --------------------- | -------- |
| `.`     | offenes Wasser        | nein     |
| `#`     | gewachsener Fels      | **ja**   |
| `B`     | Bruchfels - sprengbar | **ja**   |
| `M`     | Treibmine             | **ja**   |
| `~`     | Seetang               | nein     |
| `S`     | Startpunkt            | -        |
| `Z`     | Ausgang (Ziel)        | -        |

**Zwei Sorten Fels.** `#` haelt alles aus und ist Grund und Decke jeder Hoehle;
`B` ist muerbe, und ein Torpedo oder eine gelegte Seemine macht eine Tuer
hinein. Eine Treibmine geht nach drei Harpunen oder einem Torpedo hoch. Alles
Gesprengte gilt nur fuer den laufenden Tauchgang - die Karte selbst bleibt, wie
sie hier steht.

### Landmarken

Zehn Buchstaben stehen fuer das, was auf dem Grund steht oder dort wohnt
([`engine/landmarks.ts`](../../../website/src/games/uboot/engine/landmarks.ts)).
Sie sind **Zierde**: Man faehrt hindurch wie durch Wasser, und jede steht in
genau einem Gewaesser.

| Zeichen | Was                 | Gewaesser         |
| ------- | ------------------- | ----------------- |
| `H`     | Ananashaus          | 1 Hafenbecken     |
| `R`     | Stein mit Antenne   | 2 Seichtes Wasser |
| `L`     | Bude mit Schild     | 3 Das Riff        |
| `D`     | Glaskuppel mit Baum | 4 Die Hoehle      |
| `E`     | Abfalleimer         | 5 Der Schlund     |
| `O`     | Steinkopf           | 6 Das Labyrinth   |
| `N`     | zwei Fische         | 7 Die Finsternis  |
| `P`     | Delfin mit Reiter   | 8 Der Abgrund     |
| `V`     | Meerjungfrau        | 9 Die Tiefe       |
| `G`     | der gruene Geist    | 10 Der Waechter   |

### Bewohner

Sechs weitere Buchstaben setzen ein Tier an diese Stelle
([`engine/beasts.ts`](../../../website/src/games/uboot/engine/beasts.ts)). Das
Quadrat selbst bleibt Wasser - das Tier schwimmt ja davon.

| Zeichen | Art          |
| ------- | ------------ |
| `F`     | Fischschwarm |
| `Q`     | Leuchtqualle |
| `I`     | Seeigel      |
| `K`     | Panzerkrabbe |
| `A`     | Tiefseeaal   |
| `T`     | Anglerfisch  |

**Ein Buchstabe gehoert entweder einem Feld oder einem Tier, nie beidem.**
Darueber wacht [`engine/course.ts`](../../../website/src/games/uboot/engine/course.ts)
beim Laden und wirft, wenn sich einer doppelt - passiert ist es trotzdem schon
einmal (`K` war die Krabbe **und** die Bude, und hinter jeder Krabbe stand
ploetzlich ein Haus).

Alles, was nicht in dieser Tabelle steht, wird als offenes Wasser gelesen. Eine
Karte mit einem Tippfehler ist damit nicht kaputt, sondern nur an einer Stelle
leer - was beim Bauen genau das richtige Verhalten ist.

## Bausteine statt langer Zeilen

Ein Kurs ist über hundert Quadrate lang. Eine Zeile mit hundert Zeichen kann
niemand zählen: Ein Fels eine Spalte daneben ist im Editor unsichtbar und im
Spiel eine Ungerechtigkeit. Darum besteht ein Kurs aus **Bausteinen**.

Ein Baustein ist

- **16 Spalten** breit (`PIECE_COLS`) - eine halbe Bildschirmbreite,
- **14 Zeilen** hoch (`ROWS`) - von knapp unter der Oberfläche bis zum Grund,
- und seine **unterste Zeile ist immer Fels**: Unter dem Kurs durch geht nichts.

```ts
spires: [
  "................",
  ...
  ".#####....#####.",
  "################",
],
```

Ein neuer Kurs ist dann nur noch eine Liste von Namen:

```ts
{
  name: "Das Riff",
  pieces: ["start", "spires", "mines", "narrow", "kelp", "shelf", "finish"],
}
```

Ein neues Hindernis ist ein Eintrag mehr in `PIECES` - und steht damit sofort
jedem Kurs zur Verfügung.

## Regeln, an die sich ein Baustein halten muss

1. **Genau 14 Zeilen zu genau 16 Zeichen.** Fehlende Zeichen werden als Wasser
   gelesen, aber eine schiefe Karte ist ein Fehler, kein Stil.
2. **Unterste Zeile komplett `#`.**
3. **Ein durchgehender Weg von links nach rechts.** Der Übergang zählt mit:
   Wenn ein Baustein rechts nur auf Höhe der Zeilen 5 bis 8 offen ist, muss der
   nächste dort links ebenfalls offen sein. `tunnel` ist genau dieser Fall - er
   endet in einem Kanal, und was danach kommt, darf dort keinen Fels haben.
4. **Fels wächst von unten oder hängt von einem Überhang.** Was frei im Wasser
   schwebt, sind Minen. Das ist keine Kosmetik, sondern die Form des Spiels:
   unten ist die Gefahr Stein, den man sieht, oben sind es Stacheln, nach denen
   man suchen muss.
5. **`S` nur im ersten, `Z` nur im letzten Baustein.** Mehrere gewinnen nicht,
   der jeweils letzte gilt.

## Hoehlenbausteine

Es gibt zwei Sorten Bausteine. Die offenen (`open`, `spires`, `mines`, ...)
haben Fels nur unten und lassen oben alles frei. Die Hoehlenbausteine
(`tunnel`, `caveWave`, `caveArch`, `caveNarrow`, `caveTeeth`, `caveMines`,
`caveOut`) haben Fels oben **und** unten.

Fuer die gilt eine zusaetzliche Regel, und nur wegen ihr laesst sich eine
Hoehle als Liste schreiben:

> **Der Gang liegt an beiden Raendern auf den Zeilen 5 bis 8.**

Damit passt jeder Hoehlenbaustein an jeden anderen. Was dazwischen passiert -
absacken, aufsteigen, eng werden - ist frei, solange der Gang am rechten Rand
wieder auf 5 bis 8 ankommt. `tunnel` ist der Eingang (offenes Wasser links,
Gang rechts), `caveOut` der Ausgang.

Vier Zeilen sind 144 Pixel; das Boot ist 34 hoch und braucht mit seinen
Kollisionsscheiben rund 30. Es bleiben also gut 110 Pixel Spiel - eng genug,
dass man steuern muss, weit genug, dass man es kann.

## Ein Gewaesser ist mehr als seine Bausteine

Jeder Kurs in `LEVELS` bringt neben seinen Bausteinen noch das mit, was nichts
mit der Karte zu tun hat und trotzdem zum Gewaesser gehoert:

| Feld        | Bedeutung                                                          |
| ----------- | ------------------------------------------------------------------ |
| `hint`      | eine Zeile fuer die Seekarte                                       |
| `reward`    | Erfahrungspunkte beim ersten Durchtauchen                          |
| `dark`      | 0 bis 1 - wie dunkel es dort ist                                   |
| `at`        | wo die Marke auf der Seekarte sitzt, in Prozent                    |
| `tier`      | `easy`, `cave`, `deep` oder `final` - auch fuer die Auszeichnungen |
| `surfacing` | ob Auftauchen hier den Sauerstoff auffuellt                        |
| `dusk`      | ueber welchem Baustein das Licht ausgeht (nur die letzte Fahrt)    |
| `boss`      | ob am Ende der Waechter wartet                                     |

**`dark` ist eine Design-Entscheidung, keine Deko.** Die ersten drei Gewaesser
stehen auf 0. Dunkelheit ist etwas, das das Spiel einem antut, nachdem es einem
mit Scheinwerfer und Sonar die Mittel dagegen verkauft hat - niemals vorher. Wer
ein neues Gewaesser einhaengt, setzt `dark` danach, wie viele Punkte man bis
dorthin haben kann, nicht danach, wie tief es klingt.

Und `reward` steigt mit dem, was ein Kurs verlangt. Zur Orientierung: Alle
Kurse zusammen bringen beim ersten Mal 740 EP, der volle Ausbau kostet 900 EP.
Ein neuer Kurs verschiebt dieses Verhaeltnis - das ist in Ordnung, sollte aber
bewusst passieren.

## Der Schlund hat keine Bausteine

Der Endlosmodus unten links auf der Seekarte faellt aus diesem Format heraus:
Seine Karte ist nicht geschrieben, sondern **aus Stufe und Saat gewachsen**
([`endless/world.ts`](../../../website/src/games/uboot/endless/world.ts)), 72
Spalten breit und 46 Zeilen tief, und sie endet nie. Wer am Kartenformat etwas
aendert, aendert ihn deshalb nicht mit - und umgekehrt.

## Wie viel Platz ist da eigentlich?

| Maß                    | Wert                                 |
| ---------------------- | ------------------------------------ |
| ein Quadrat            | 36 x 36 Pixel (`CELL`)               |
| Wassertiefe            | 14 Quadrate = 504 Pixel (`ROWS`)     |
| Bildbreite             | 960 Pixel = 26,7 Spalten             |
| das Boot               | 76 x 34 Pixel                        |
| Fenstergeschwindigkeit | 84 Pixel/s - ein Baustein in 6,9 s   |
| Standard-Sauerstoff    | 70 s - reicht fuer rund 10 Bausteine |

Ein Boot ist also knapp eine Zeile hoch und gut zwei Spalten lang. Eine Lücke
von **zwei** Zeilen ist eng, aber fahrbar; eine Zeile ist es nicht - dort passt
das Boot rechnerisch hindurch, aber niemand trifft das.

Man sieht ungefähr eineinhalb Bausteine weit voraus, also **rund fünf Sekunden**.
Alles, was der Spieler sehen muss, um es zu schaffen, muss innerhalb dieser fünf
Sekunden sichtbar sein - ein Hindernis, das erst am Bildrand erscheint und
sofortiges Handeln verlangt, ist kein schweres, sondern ein unfaires.

## Prüfen

Es gibt keinen Karten-Test (die Sammlung bekommt keine neuen Tests mehr). Wer
einen Baustein hinzufügt, prüft die Maße am schnellsten so:

```bash
grep -A 16 'neuerBaustein: \[' website/src/games/uboot/engine/levels.ts | grep -o '"[^"]*"' | awk '{ print length($0) - 2 }' | sort -u
```

Es darf genau eine Zahl herauskommen: `16`.
