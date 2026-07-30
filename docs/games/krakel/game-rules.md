# Krakel Orakel - Spielregeln als Spezifikation

Grundlage der Implementierung. Diese Datei ist die verbindliche Referenz für die
Engine in `website/src/games/krakel/engine/`.

> **Quellenhinweis:** Anders als bei [Drecksau](../drecksau/game-rules.md) und
> [Binokel](../binokel/game-rules.md) liegt hier **keine offizielle Anleitung**
> zugrunde. Die Regeln wurden für dieses Projekt festgelegt. Vom physischen
> Vorbild übernommen sind die **Zeichenvorlagen**: die 14 Tafeln sind von Scans
> der echten Spielbretter abgenommen, siehe
> [tafeln-und-woerter.md](tafeln-und-woerter.md).

## Ziel

Krakel Orakel ist **kooperativ**. Es gibt keine Einzelwertung und keinen
Gegner - alle Spielenden teilen sich eine Punktzahl und spielen gemeinsam gegen
das Brett.

## Ablauf einer Runde

Eine Partie geht über **3 Runden**. Jede Runde hat drei Phasen:

### 1. Malen (120 Sekunden, alle gleichzeitig)

- Jede Person bekommt **heimlich ein eigenes Wort** und **eine eigene Tafel**.
- Alle malen **zeitgleich**. Niemand sieht die Tafel der anderen.
- Gemalt werden darf **nur auf den vorgedruckten Punkten** der Tafel. Der Stift
  rastet auf den nächsten Punkt ein; abseits der Linien hebt er ab.
- Wer fertig ist, drückt **Fertig**. Sind alle fertig, endet die Phase sofort,
  sonst nach Ablauf der Zeit.

### 2. Ausschließen (reihum, 45 Sekunden pro Zug)

- Alle Tafeln liegen offen. Dazu erscheint eine Wortliste: **alle gemalten
  Wörter plus 4 Wörter, die niemand gemalt hat** (Zusatzwörter), gemischt.
- Reihum streicht jeweils eine Person **ein Wort**, von dem sie glaubt, dass es
  niemand gemalt hat.
- Es gibt **genau 4 Züge pro Runde** - einen je Zusatzwort.
- Ob der Zug richtig war, ist **sofort sichtbar**. Das ist Absicht: die Gruppe
  soll aus dem Fehler für die nächsten Züge lernen können.
- Läuft die Zeit ab, streicht die Uhr für die säumige Person ein zufälliges
  Wort. Das verhindert, dass eine Runde hängen bleibt.

### 3. Auflösung (10 Sekunden)

Jede Tafel zeigt ihr Wort. Danach beginnt die nächste Runde, oder das Spiel
endet.

## Punkte

| Ereignis                              | Punkte |
| ------------------------------------- | ------ |
| Ein Zusatzwort gestrichen (richtig)   | **+3** |
| Ein gemaltes Wort gestrichen (falsch) | **-2** |

Die Punkte sind ein **gemeinsames Konto**, kein Wert pro Person.

Höchstpunktzahl: 3 Runden x 4 Zusatzwörter x 3 Punkte = **36**.

### Abschlusswertung

| Anteil am Maximum | Titel          |
| ----------------- | -------------- |
| 100 %             | Hellseher      |
| ab 80 %           | Orakel         |
| ab 50 %           | Gute Spürnasen |
| ab 20 %           | Ahnungsvoll    |
| darunter          | Blindgänger    |

## Schwierigkeit

Vor dem Spiel wird eine von zwei Wortlisten gewählt; sie gilt für die ganze
Partie und wird im Browser gemerkt (Vorgabe: leicht).

| Stufe      | Wörter | Was drin ist                                      |
| ---------- | -----: | ------------------------------------------------- |
| **Leicht** |    238 | Überwiegend Dinge, die man direkt malen kann      |
| **Schwer** |    239 | Dazu Ideen, Orte und Tätigkeiten ohne festes Bild |

Schwer heißt nicht "mehr Wörter", sondern "schwerer zu malen": Begriffe wie
`Langeweile`, `Perfektion` oder `Vergangenheit` müssen über einen Umweg
dargestellt werden, den die anderen lesen können. Beide Listen stehen in
[tafeln-und-woerter.md](tafeln-und-woerter.md).

## Spielerzahl

**2 bis 8.** Vor dem Spiel wird die gewünschte Zahl eingestellt; sie wird im
Browser gemerkt (Vorgabe: 4).

Pro Runde ergibt sich daraus die Wortliste: `Spielerzahl + 4` Wörter, davon
immer genau 4 Zusatzwörter. Zu zweit sind das 6 Wörter, zu acht sind es zwölf.
Der Anteil der Zusatzwörter sinkt also mit der Gruppengröße - die Runde wird mit
mehr Leuten schwerer, nicht leichter.

## Bewusste Festlegungen

Punkte, die sich aus den Regeln nicht von selbst ergeben. Die Engine legt fest:

### 1. Die Zug-Reihenfolge läuft über die Runden durch

Eine Runde vergibt nur 4 Züge. Würde die Reihenfolge jede Runde neu bei der
ersten Person beginnen, kämen **ab 5 Spielenden die hinteren nie an die Reihe**.
Der Zähler läuft darum über die ganze Partie weiter.

So verteilen sich die 12 Züge einer Partie (Zahlen sind Sitzplätze):

| Spieler | Runde 1 | Runde 2 | Runde 3 | Züge je Person  |
| ------: | ------- | ------- | ------- | --------------- |
|       2 | 1,2,1,2 | 1,2,1,2 | 1,2,1,2 | 6,6             |
|       3 | 1,2,3,1 | 2,3,1,2 | 3,1,2,3 | 4,4,4           |
|       4 | 1,2,3,4 | 1,2,3,4 | 1,2,3,4 | 3,3,3,3         |
|       5 | 1,2,3,4 | 5,1,2,3 | 4,5,1,2 | 3,3,2,2,2       |
|       6 | 1,2,3,4 | 5,6,1,2 | 3,4,5,6 | 2,2,2,2,2,2     |
|       7 | 1,2,3,4 | 5,6,7,1 | 2,3,4,5 | 2,2,2,2,2,1,1   |
|       8 | 1,2,3,4 | 5,6,7,8 | 1,2,3,4 | 2,2,2,2,1,1,1,1 |

12 Züge gehen nicht durch jede Spielerzahl glatt auf - bei 5, 7 und 8 bekommen
einige eine Runde mehr. Jede Person kommt aber mindestens einmal dran; ein Test
prüft das für alle Tischgrößen.

### 2. Ein eigenes Wort darf gestrichen werden

Das eigene Wort ist in der Liste mit **dein Wort** markiert und bleibt
anklickbar. Es zu sperren würde niemandem etwas verraten, aber die Regel
verkomplizieren - und ein Fehlklick ist ein ehrlicher Fehler.

### 3. Keine zwei gleichen Wörter, keine zwei gleichen Tafeln

Begriffe und Zusatzwörter werden in **einem** Zug gezogen. Dadurch kann kein
Zusatzwort zufällig das Wort einer Person sein und keine zwei Personen
bekommen denselben Begriff. Innerhalb einer Runde bekommt außerdem jede Person
eine andere Tafel.

Über die Partie hinweg wiederholt sich kein Wort. Bei 8 Spielenden sind das
36 Wörter aus der gewählten Liste.

### 4. Sieg = fehlerfreie Partie

Für die [Statistik](../../../website/src/lib/stats/game-stats.ts) braucht es
Sieg und Niederlage - ein kooperatives Spiel kennt das nicht von sich aus.
Festgelegt: **gewonnen ist nur die perfekte Partie** (volle 36 Punkte, also in
allen 3 Runden alle 4 Zusatzwörter gestrichen und kein gemaltes Wort erwischt).
Alles darunter zählt als Niederlage. Eine niedrigere Hürde hätte die Spalte
"Siege" bedeutungslos gemacht.

Jeder Browser führt seine eigene Statistik, auch als Gast im fremden Raum.

## Online

Krakel Orakel wird **nur online** gespielt - ohne Mitspielende gibt es nichts
auszuschließen. Es gibt keinen Computergegner.

### Rollen

Eine Person ist **Host** und führt das maßgebliche Spiel; alle anderen sind
dünne Clients, die den veröffentlichten Spielstand anzeigen und ihre Züge
hinschicken.

### Was geheim bleibt, und wie lange

| Geheimnis               | Sichtbar ab  | Wie geschützt                                        |
| ----------------------- | ------------ | ---------------------------------------------------- |
| Der eigene Begriff      | Auflösung    | Liegt nur im privaten Fach des jeweiligen Sitzes     |
| Die eigene Zeichnung    | Ausschließen | Während des Malens gehen **alle** Tafeln leer heraus |
| Welche Wörter echt sind | Auflösung    | Der Basis-Seed verlässt den Host nie                 |

Die Wortliste selbst ist ab der Ausschluss-Phase öffentlich - sie muss es sein.

### Mitspielende finden

- **Privater Raum:** Code erzeugen und weitergeben. Der Host startet von Hand,
  sobald genug Leute da sind.
- **Automatisch:** Es wird nach einem Raum gesucht, der in **Spielerzahl und
  Schwierigkeit** übereinstimmt.
  - Stimmt beides und ist die Wunschzahl erreicht, startet die Runde **sofort**.
  - Sonst wird nach **20 Sekunden** auch ein anderer Wunschtisch genommen -
    andere Spielerzahl, andere Schwierigkeit oder beides. Mindestens zu zweit
    wird immer gespielt.

Technisch reist die Schwierigkeit im `variant`-Feld des geteilten
[Wunsches](../../../website/src/online/matchmaking.ts) mit. Das Feld ist
optional; Spiele ohne eine solche Einstellung lassen es weg, und zwei von ihnen
passen weiterhin zusammen.

## Umsetzung

| Was                       | Wo                                                                         |
| ------------------------- | -------------------------------------------------------------------------- |
| Regeln, Runden, Punkte    | [engine/game.ts](../../../website/src/games/krakel/engine/game.ts)         |
| Wortlisten je Stufe       | [engine/words.ts](../../../website/src/games/krakel/engine/words.ts)       |
| Zeiten und Grenzwerte     | [engine/types.ts](../../../website/src/games/krakel/engine/types.ts)       |
| Punktevergabe und Wertung | [engine/scoring.ts](../../../website/src/games/krakel/engine/scoring.ts)   |
| Tafeln und Wörter         | [tafeln-und-woerter.md](tafeln-und-woerter.md)                             |
| Netzwerk-Modell           | [multiplayer/net.ts](../../../website/src/games/krakel/multiplayer/net.ts) |

Die Engine ist eine reine Funktion über einen serialisierbaren Wert. Die Uhr
wird von außen hereingereicht, damit die Regeln ohne Browser testbar bleiben.

### Zeiten und Grenzwerte

| Konstante           | Wert  | Bedeutung                                  |
| ------------------- | ----- | ------------------------------------------ |
| `DRAW_SECONDS`      | 120   | Malzeit pro Runde                          |
| `ELIMINATE_SECONDS` | 45    | Bedenkzeit pro Ausschluss-Zug              |
| `REVEAL_SECONDS`    | 10    | Auflösung zwischen den Runden              |
| `TOTAL_ROUNDS`      | 3     | Runden pro Partie                          |
| `DECOY_COUNT`       | 4     | Zusatzwörter, und damit Züge pro Runde     |
| `MIN_PLAYERS`       | 2     | kleinste Runde                             |
| `MAX_PLAYERS`       | 8     | größte Runde                               |
| `SNAP_TOLERANCE`    | 0.025 | wie nah der Stift an einem Punkt sein muss |
| `SNAP_MAX_JUMP`     | 0.04  | größerer Sprung hebt den Stift             |
| `MAX_STROKES`       | 600   | Striche pro Tafel                          |
| `MAX_STROKE_POINTS` | 400   | Punkte pro Strich                          |

`SNAP_TOLERANCE` und `SNAP_MAX_JUMP` sind auf das echte Punktraster abgestimmt
(die Punkte liegen rund 0,017 auseinander) und sollten nicht ohne Blick auf
[tafeln-und-woerter.md](tafeln-und-woerter.md) verstellt werden.
