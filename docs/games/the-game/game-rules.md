# The Game - Spielregeln

Umsetzung des kooperativen Kartenspiels von **Steffen Benndorf**
(Nürnberger-Spielkarten-Verlag, 2015, nominiert für das Spiel des Jahres). Die
Regeln stammen aus der deutschen Originalanleitung
(`Spielanleitung-The-Game.pdf`), deren Text vollständig eingebettet war - es
musste nichts geraten und nichts aus Bildern gelesen werden.

**98 Zahlenkarten, 1 bis 5 Spieler, alle gemeinsam.**

## Ziel

Möglichst viele der 98 Karten auf vier Reihen ablegen. Alle 98 heißt: **das
Spiel besiegt**.

## Material

| Teil                | Anzahl                                        |
| ------------------- | --------------------------------------------- |
| Zahlenkarten 2 - 99 | 98, jede Zahl genau einmal                    |
| Reihenkarten        | 2x aufsteigend (ab 1), 2x absteigend (ab 100) |

Eine Karte ist hier nichts als ihre Zahl - jeder Wert kommt genau einmal vor.

## Ablegeregeln

- **Aufsteigende Reihe:** die abgelegte Zahl muss **größer** sein als die
  oberste.
- **Absteigende Reihe:** sie muss **kleiner** sein.
- Die Lücken dürfen beliebig groß sein. Jede übersprungene Zahl ist aber eine
  Karte, die nie mehr abgelegt werden kann.
- Die Karten liegen **übereinander**, nicht nebeneinander. Sichtbar ist nur die
  oberste.

### Der Rückwärts-Trick

Die einzige Ausnahme: Auf eine **aufsteigende** Reihe darf eine Karte, die
**genau 10 kleiner** ist; auf eine **absteigende** eine, die **genau 10 größer**
ist. Beliebig oft pro Zug, auch mehrfach auf verschiedenen Reihen.

Beispiel aus der Anleitung: Aufsteigende Reihe zeigt 47, die 37 darf darauf.

## Handkarten

| Spieler | Handkarten |
| ------- | ---------- |
| 1       | 8          |
| 2       | 7          |
| 3 bis 5 | 6          |

## Spielablauf

Wer dran ist, muss **mindestens 2 Karten** ablegen - auf beliebige Stapel, in
beliebiger Reihenfolge, gern alle auf denselben. Mehr ist immer erlaubt, bis
hin zur ganzen Hand.

Danach zieht man auf die volle Hand nach. Dann ist der Nächste dran.

## Erlaubte Kommunikation

> "Während des Spiels dürfen die Spieler niemals nach konkreten Zahlenkarten
> fragen oder ihre eigenen Zahlenwerte verraten. Konkrete Zahlenwerte in
> jeglicher Form sind tabu! Ansonsten ist jede Kommunikation erlaubt."

Die Anleitung nennt zwei Beispielsätze: „Bitte nicht auf den unteren Stapel
legen" und „Auf diesem Stapel bitte nur noch einen ganz kleinen Sprung machen".

**Umgesetzt als zwei Marker pro Reihe** - genau diese zwei Sätze, mehr nicht.
Jeder darf sie jederzeit setzen und zurücknehmen, auch wenn er nicht am Zug
ist; das ist der ganze Sinn davon. Ein Marker kann keine Zahl verraten, ein
Chat-Satz schon - deshalb ist er die einzige Form dieses Gesprächs, die die
Regel für einen mitträgt. Sprach- und Textchat bleiben trotzdem offen: Die
Regel ist eine Abmachung zwischen Menschen.

Marker bleiben stehen, bis ihr Besitzer sie wegnimmt. Nichts nimmt sie
automatisch weg - eine Bitte, die von selbst verschwindet, ist keine.

## Spielende

- Ist der **Zugstapel leer**, wird ohne Nachziehen weitergespielt, und es reicht
  ab dann **eine Karte** pro Zug.
- Wer alle Karten abgelegt hat, setzt aus; die anderen spielen weiter.
- Das Spiel **endet sofort**, wenn jemand am Zug die geforderte Mindestanzahl
  nicht mehr ablegen kann.

### Was "kann nicht mehr ablegen" genau heißt

Nicht „hat keine spielbare Karte", sondern **kann die Mindestanzahl nicht
erreichen**. Das ist etwas anderes, weil die erste Karte die Reihe verändert und
damit die zweite erst ermöglichen kann: Eine Hand mit 34 und 24 gegen eine
aufsteigende Reihe auf 33 kann beide ablegen - in dieser Reihenfolge und nur in
dieser.

Die Umsetzung sucht das deshalb wirklich durch
([engine/moves.ts](../../../website/src/games/the-game/engine/moves.ts),
`canReach`) statt spielbare Karten zu zählen. Gezählt hätte das Spiel eine Runde
zu früh beendet, und niemand hätte es je gemerkt.

## Wertung

Gezählt werden die Karten, die **nicht** abgelegt wurden: alle Handkarten plus
der Rest des Zugstapels.

| Karten übrig | Ergebnis          |
| ------------ | ----------------- |
| 0            | Das Spiel besiegt |
| unter 10     | super             |
| 10 bis 20    | gut               |
| mehr         | nochmal           |

Die Stufen „gut" und „nochmal" stehen so nicht in der Anleitung - die nennt nur
„unter zehn ist super" und „alle 98 heißt besiegt". Der Rest ist eine Einteilung
dieser Umsetzung, damit ein Ergebnis nicht wortlos dasteht.

## Profivariante

Alle Regeln bleiben; **3 statt 2 Karten** pro Zug. Zusätzlich optional eine
Handkarte weniger: 5 bei drei bis fünf Spielern, 6 bei zweien, 7 solo.

Umgesetzt als drei Stufen: **Normal**, **Profi** (3 Karten) und **Profi hart**
(3 Karten und eine Handkarte weniger).

## Abweichungen von der Anleitung

Keine an den Regeln. Zwei Dinge, die die Anleitung offen lässt:

- **Wer anfängt.** Die Anleitung sagt „sie einigen sich". Am Bildschirm kann
  sich niemand einigen, also beginnt der erste Platz.
- **Die Bewertungsstufen** zwischen „super" und „besiegt", siehe oben.

## Was der Computerpartner sieht

**Nur das, was du auch siehst**: die vier Reihen und die Marker. Nie eine fremde
Hand. Das ist keine Höflichkeit, sondern die Regel - ein Partner, der in deine
Hand sähe, würde nicht dasselbe Spiel spielen. Details in
[engine/ai.ts](../../../website/src/games/the-game/engine/ai.ts).

Gemessen über je 40 Partien pro Tischgröße kommt er auf etwa 18 übrige Karten
solo, 7 zu zweit und 6 zu fünft. In der Profivariante etwa 28 - drei
Pflichtkarten pro Zug lassen so wenig Wahl, dass kaum noch ein Plan übrig
bleibt.
