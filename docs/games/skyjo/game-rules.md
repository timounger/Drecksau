# Skyjo - Spielregeln als Spezifikation

Grundlage der Implementierung. Quelle: Skyjo von **Magilano** (Autor Alexander
Bernhardt). Diese Datei ist die verbindliche Referenz für die Engine in
`website/src/games/skyjo/engine/`.

## Ziel

**Wenig ist gut.** Jede Karte, die am Rundenende noch vor einem liegt, zählt
gegen einen. Sobald jemand die Punktgrenze reißt, ist das Spiel vorbei und wer
die **wenigsten** Punkte hat, gewinnt.

## Spielmaterial (150 Karten)

| Wert | Anzahl |
| ---- | -----: |
| -2   |      5 |
| -1   |     10 |
| 0    |     15 |
| 1    |     10 |
| …    |      … |
| 12   |     10 |

Also 5 + 10 + 15 + 12 x 10 = **150 Karten**. Es gibt keine Farben und keine
unterscheidbaren Rückseiten - eine Karte ist nichts als ihr Wert. Darum ist das
Deck im Code eine schlichte Zahlenliste.

## Aufbau

- **2 bis 8 Spieler.**
- Jede und jeder bekommt **12 Karten verdeckt**, ausgelegt als **4 Spalten zu
  3 Reihen**.
- Die nächste Karte kommt offen als Ablagestapel aus, der Rest ist der
  Nachziehstapel.
- Alle decken **zwei** ihrer Karten auf.
- Es beginnt, wer die **höchste Summe** seiner beiden offenen Karten zeigt.

## Zugablauf

Reihum genau eine der beiden Möglichkeiten:

1. **Die offene Karte** vom Ablagestapel nehmen und gegen eine eigene Karte
   tauschen - egal ob offen oder verdeckt. Die ersetzte Karte kommt offen auf
   den Ablagestapel.
2. **Verdeckt ziehen.** Danach entweder
   - die gezogene Karte gegen eine eigene tauschen (die ersetzte kommt offen ab),
     oder
   - die gezogene Karte **wegwerfen** und stattdessen eine eigene **verdeckte**
     Karte aufdecken.

Eine getauschte Karte liegt danach immer offen.

Ist der Nachziehstapel leer, wird der Ablagestapel ohne seine oberste Karte neu
gemischt und zum Nachziehstapel.

### Bedienung

Der Zug wird durch Antippen der Stapel gespielt, es gibt keine Knöpfe dafür.
Eine gezogene Karte landet dabei einfach auf dem Ablagestapel - sie ist **nicht
als gezogen gekennzeichnet**, genau wie am echten Tisch.

| Tippen auf …                                           | Was passiert                                                                 |
| ------------------------------------------------------ | ---------------------------------------------------------------------------- |
| **Nachziehstapel**                                     | Die Karte kommt offen auf den Ablagestapel. Danach ist der Stapel tot.       |
| **Ablagestapel**                                       | Die oberste Karte kommt in die Hand (mehrfaches Tippen ändert daran nichts). |
| eine **eigene Karte** mit Karte in der Hand            | Sie wird gegen die Karte in der Hand getauscht.                              |
| eine eigene **verdeckte** Karte ohne Karte in der Hand | Sie wird aufgedeckt; eine gezogene Karte bleibt damit liegen.                |

Drei Festlegungen stecken darin, jede aus einem echten Fehlgriff entstanden:

**Der Nachziehstapel geht genau einmal.** Danach ist er aus. Ein zweites Tippen
hatte kurzzeitig eine unsichtbare Bedeutung („Karte doch liegen lassen") - man
sah davon nichts, weil die Karte so oder so offen auf dem Ablagestapel liegt.

**Der Ablagestapel nimmt nur auf, er legt nie hin.** Auf die Karte zu tippen, die
man haben will, heißt „die nehme ich" - und sonst nichts. Ein zweites Tippen darf
das erste deshalb nicht wieder aufheben; genau das hat vorher Karten still
verschwinden lassen.

**Was man in der Hand hat, ist zu sehen.** Die aufgenommene Karte bekommt einen
kräftigen Rahmen und darunter steht **in der Hand**. Ohne dieses Zeichen tippt
man ein zweites Mal, weil scheinbar nichts passiert ist - und das war der Weg in
den Fehler.

## Die Spalten-Regel

Zeigt eine Spalte **drei gleiche offene Karten**, fliegt die ganze Spalte sofort
aus dem Spiel und zählt **nichts** mehr. Die drei Karten kommen auf den
Ablagestapel.

Das ist der Hebel des Spiels: Eine Spalte aus drei Zwölfen ist 36 Punkte wert,
die auf einen Schlag verschwinden.

## Rundenende

Sobald jemand **alle 12 Karten offen** hat, endet die Runde - alle anderen sind
aber noch **genau einmal** dran. Danach werden alle verbliebenen Karten
aufgedeckt und jede Auslage zusammengezählt.

### Die Strafe für den Beender

Wer die Runde beendet, geht eine Wette ein: Er muss **allein** die niedrigste
Punktzahl haben. Ist jemand gleichauf oder darunter, zählt seine Punktzahl
**doppelt**.

## Spielende

Nach jeder Runde werden die Punkte addiert. Erreicht jemand **100 Punkte oder
mehr**, ist das Spiel vorbei. Es gewinnt, wer insgesamt die wenigsten Punkte
hat.

## Bewusste Festlegungen

Punkte, die die Anleitung offen lässt. Die Engine legt fest:

### 1. Eine Punktzahl von 0 oder weniger wird nie verdoppelt

Die Verdopplung ist eine **Strafe**. Ein negatives Ergebnis zu verdoppeln würde
den Beender belohnen statt ihn zu bestrafen. Die Engine verdoppelt darum nur,
wenn die Punktzahl größer als 0 ist.

### 2. Gleichstand beim Eröffnen entscheidet der Sitzplatz

Zeigen zwei Personen dieselbe höchste Summe, beginnt die weiter vorn sitzende.
Das betrifft nur, wer anfängt.

### 3. Die nächste Runde eröffnet der Beender

Wer die letzte Runde beendet hat, deckt in der neuen als Erster auf.

### 4. Ein geteilter letzter Platz zählt als Sieg

Für die [Statistik](../../../website/src/lib/stats/game-stats.ts) gilt eine
Partie als gewonnen, wenn die eigene Punktzahl die niedrigste ist - auch wenn
sich jemand den Platz teilt.

## Modi

Skyjo folgt dem Aufbau der übrigen Einzelspieler-Spiele: `/skyjo` **teilt
sofort ein Spiel gegen den Computer aus**, es gibt keine Startseite davor. Alles
Weitere hängt in der Kopfzeile.

| Seite                  | Was dort passiert                                          |
| ---------------------- | ---------------------------------------------------------- |
| `/skyjo`               | Das Spiel gegen den Computer. Spielstand wird gespeichert. |
| `/skyjo/einstellungen` | Spielerzahl (2 bis 8) und Schwierigkeit.                   |
| `/skyjo/online`        | Automatische Suche oder privater Raum mit Code.            |
| `/skyjo/statistik`     | Gespielte Partien und Erfolge.                             |

Einstellungen werden im Browser gemerkt und gelten **ab dem nächsten Spiel** -
Tisch und Gegner stehen beim Austeilen fest, ein laufendes Spiel wird also nicht
unter den Händen umgebaut.

### Der Computergegner

Eine lesbare Heuristik, keine Suche - bei so vielen verdeckten Karten wäre eine
Suche ohnehin überwiegend Raterei. Sie wägt in dieser Reihenfolge ab:

1. **Spalte vollmachen**, wenn möglich - drei gleiche Karten sind mehr wert, als
   ihr Zahlenwert vermuten lässt.
2. **Die schlechteste sichtbare Karte tauschen**, wenn die angebotene deutlich
   besser ist.
3. Sonst **eine Karte aufdecken**. Eine verdeckte Karte wird dabei mit dem
   Durchschnittswert des Decks angesetzt.

Der Computer liest **nie** einen verdeckten Wert, auch keinen eigenen. Ein Test
prüft das, indem er ihm zwei Spielstände vorlegt, die sich nur in den verdeckten
Karten unterscheiden - er muss beide Male gleich ziehen.

#### Die drei Stufen

Die Stufen tauschen nicht den Spieler aus, sie drehen dieselbe Heuristik auf und
zu:

| Stufe      | Was anders ist                                                            |
| ---------- | ------------------------------------------------------------------------- |
| **Leicht** | Blind für die Spalten-Regel, und tauscht erst bei sehr großem Gewinn.     |
| **Mittel** | Wägt alles ab wie oben beschrieben.                                       |
| **Schwer** | Wie Mittel, plus: prüft vor der letzten Karte, ob sich das Beenden lohnt. |

Gemessen über je 30 ausgespielte Partien zu dritt, Punkte des Siegers je Runde
(weniger ist besser):

| Stufe  | Punkte/Runde | Runden je Partie |
| ------ | -----------: | ---------------: |
| Leicht |         23,4 |              2,9 |
| Mittel |         19,6 |              3,5 |
| Schwer |         18,1 |              3,7 |

Ein Test hält diese Reihenfolge fest: Mittel muss besser abschneiden als Leicht
und Schwer mindestens so gut wie Mittel. Eine Stufe, die nichts ändert, fällt
damit auf.

### Online an einen Tisch kommen

Zwei Wege, wie bei den anderen Spielen:

- **Automatische Suche** gegen Fremde. Vorher trägt man seinen **Wunschtisch**
  ein (2 bis 8 Spieler). Findet sich ein offener Tisch mit derselben
  Spielerzahl, geht es sofort los; sonst wird nach 20 Sekunden auch eine andere
  Spielerzahl genommen, damit ein Wunsch nach einem großen Tisch niemanden auf
  Dauer hängen lässt. Der Wunsch wird im Browser gemerkt.
- **Privater Raum** mit vierstelligem Code, den man selbst weitergibt. Hier
  startet der Host von Hand, sobald genug Leute da sind.

Die Schwierigkeit geht in die Suche **nicht** ein: Sie beschreibt allein die
Computergegner, und online spielt man gegen Menschen.

Gemessen gegen den fertigen Export, zwei Spieler, ab dem letzten Klick:

| Fall                                     | Bis das Spiel läuft |
| ---------------------------------------- | ------------------: |
| Beide wünschen sich dieselbe Spielerzahl |              0,35 s |
| Unterschiedliche Spielerzahl (2 gegen 5) |              20,4 s |

### Wenn jemand nicht mehr mitspielt

Ein Tisch soll nie an einer einzelnen Person hängen bleiben. Zwei Fälle:

- **Untätig:** Wer **30 Sekunden** nichts tut, für den zieht der Computer.
  Danach geht es normal weiter - die Person ist ja noch da und kann sofort
  wieder selbst ziehen. Der Wert gilt in privaten Räumen wie an Tischen mit
  Fremden.
- **Weggegangen:** Verlässt jemand mitten im Spiel den Raum, übernimmt der
  Computer seinen Platz dauerhaft. Neben dem Namen steht dann ein
  **🤖 Computer**, damit klar ist, dass dort niemand mehr sitzt. Die Sitzplätze
  werden dabei **nicht** neu vergeben - das Spiel läuft ohne Bruch weiter.

Das gilt in beide Richtungen: Geht der **Host**, wird der erste noch anwesende
Spieler zum neuen Host und spielt das Spiel aus dem letzten Stand plus dem
Host-Tresor weiter - der Platz des alten Hosts bekommt dasselbe Abzeichen.

Gemessen gegen den fertigen Export, zwei Spieler: die Automatik greift nach
30,3 s; ein weggegangener Spieler ist in beiden Richtungen sofort als Computer
markiert und wird weitergespielt.

### Was online geheim bleibt

Skyjo versteckt anders als übliche Kartenspiele: Die verdeckten Werte sind
**auch vor ihrem Besitzer** geheim. Es gibt darum keine private Hand, die
verteilt würde - die Werte werden für **jeden** Client geschwärzt und liegen nur
beim Host.

Damit ein Host-Wechsel das Geheimnis nicht mitnimmt, reisen die Werte und der
Nachziehstapel im **Host-Vault** mit - demselben Kanal, den Binokel für seinen
Talon nutzt.

Geschwärzt wird genau zweierlei: die **verdeckten Karten** und der
**Nachziehstapel**. Die **gezogene Karte gehört ausdrücklich nicht dazu** -
Nachziehen legt sie offen auf den Ablagestapel, wo sie für alle sichtbar ist.
Sie mitzuschwärzen wäre nicht etwa besonders vorsichtig, sondern schlicht
falsch: Jeder außer dem Host sähe dort eine 0 und könnte nicht beurteilen, ob
sich die Karte lohnt. Weil die Schwärzung ausgerechnet mit einer 0 arbeitet und
0 auch ein echter Kartenwert ist, prüfen die Tests in
[multiplayer/adapter.test.ts](../../../website/src/games/skyjo/multiplayer/adapter.test.ts)
vorher, dass die betrachtete Karte keine echte 0 ist - sonst könnte eine fehlende
Schwärzung wie eine vorhandene aussehen.

Nachgeprüft am laufenden Spiel: Im veröffentlichten Spielstand steht bei jeder
verdeckten Karte und bei jeder Karte des Nachziehstapels eine 0. Offen sind die
aufgedeckten Karten, der Ablagestapel und die gezogene Karte.

## Umsetzung

| Was                         | Wo                                                                                    |
| --------------------------- | ------------------------------------------------------------------------------------- |
| Deck und Auslage            | [engine/cards.ts](../../../website/src/games/skyjo/engine/cards.ts)                   |
| Zustand und Zugtypen        | [engine/state.ts](../../../website/src/games/skyjo/engine/state.ts)                   |
| Austeilen                   | [engine/setup.ts](../../../website/src/games/skyjo/engine/setup.ts)                   |
| Regeln (der Schiedsrichter) | [engine/moves.ts](../../../website/src/games/skyjo/engine/moves.ts)                   |
| Wertung und Spielende       | [engine/scoring.ts](../../../website/src/games/skyjo/engine/scoring.ts)               |
| Computergegner              | [engine/ai.ts](../../../website/src/games/skyjo/engine/ai.ts)                         |
| Schwierigkeitsstufen        | [engine/difficulty.ts](../../../website/src/games/skyjo/engine/difficulty.ts)         |
| Einstellungen               | [settings/app-settings.ts](../../../website/src/games/skyjo/settings/app-settings.ts) |
| Online-Anbindung            | [multiplayer/adapter.ts](../../../website/src/games/skyjo/multiplayer/adapter.ts)     |

Die Engine ist rein: `applyMove` ist der einzige Schiedsrichter und gibt bei
einem unerlaubten Zug `null` zurück - der Online-Host kann den Zug eines Gastes
also ungeprüft hineinreichen.

### Grenzwerte

| Konstante       | Wert | Bedeutung                          |
| --------------- | ---: | ---------------------------------- |
| `GRID_SIZE`     |   12 | Karten je Auslage                  |
| `GRID_COLUMNS`  |    4 | Spalten                            |
| `GRID_ROWS`     |    3 | Reihen                             |
| `OPENING_FLIPS` |    2 | Karten, die zu Beginn offen kommen |
| `POINT_LIMIT`   |  100 | ab hier endet das Spiel            |
| `MIN_PLAYERS`   |    2 | kleinste Runde                     |
| `MAX_PLAYERS`   |    8 | größte Runde                       |

## Quellen

Skyjo ist ein Spiel von **Magilano**, Autor **Alexander Bernhardt**,
erschienen 2015. Die Regeln oben sind nach der beiliegenden Anleitung
umgesetzt.

> **Hinweis:** Hier steht bewusst kein Link. Anders als bei
> [Drecksau](../drecksau/game-rules.md), wo die Kosmos-Anleitung als PDF unter
> einer stabilen Adresse liegt, konnte für Skyjo keine dauerhafte offizielle
> Fundstelle bestätigt werden. Wer eine hat, trägt sie hier nach.
