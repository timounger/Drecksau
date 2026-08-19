# The Mind - Spielregeln

Umsetzung des Kartenspiels von Wolfgang Warsch (Nürnberger-Spielkarten-Verlag,
2018).

> **Zur Einordnung:** The Mind war 2018 für das **Spiel des Jahres
> nominiert**, gewonnen hat es nicht - der Preis ging an Azul. Am Spiel ändert
> das nichts, aber die Sammlung soll nichts Falsches behaupten.

> **Achtung:** Auch hier lag **keine Anleitung** vor. Der Ablauf ist aus
> Spielkenntnis rekonstruiert und sicher; die **Belohnungsstufen** sind es
> nicht - siehe [Unsichere Werte](#unsichere-werte).

2 bis 4 Spieler, **kooperativ**: Ihr gewinnt zusammen oder gar nicht.

## Das Ziel

Alle Karten in **aufsteigender Reihenfolge** ablegen - ohne euch abzusprechen.

## Aufbau

- Ein Stapel mit den Zahlen **1 bis 100**, jede einmal.
- **Leben**: so viele wie Spieler.
- **Wurfsterne**: 1.
- **Level**: zu zweit 12, zu dritt 10, zu viert 8.

In Level _n_ bekommt jede:r **n Karten**. Der Stapel wird für jedes Level neu
gemischt.

## Die einzige Regel

**Nicht reden.** Keine Absprachen, keine Zeichen, kein Zählen, kein Tippen auf
den Tisch. Erlaubt ist genau eine Mitteilung: die Hand heben, um einen
Wurfstern vorzuschlagen.

## Ablauf

Es gibt **keine Reihenfolge und keine Züge**. Jede:r legt, wann er oder sie
glaubt, die niedrigste Karte zu haben. Man legt immer die niedrigste Karte der
eigenen Hand - jede andere wäre dieselbe Entscheidung, nur schlechter.

Liegt beim Ablegen bei jemandem noch eine **niedrigere** Karte:

- Alle niedrigeren Karten werden aufgedeckt und kommen aus dem Spiel.
- Ihr verliert **1 Leben**.
- Weitergespielt wird von der gerade gelegten Karte an.

Sind alle Karten weg, ist das Level geschafft. Bei **0 Leben** ist das Spiel
vorbei; nach dem letzten Level habt ihr gewonnen.

### Der Wurfstern

Wer will, hebt die Hand. Heben **alle** die Hand, die noch Karten haben, wird
ein Wurfstern ausgegeben: Jede:r legt die eigene **niedrigste** Karte offen ab.
Diese Karten sind aus dem Spiel, aber sie kosten kein Leben - im Gegenteil, sie
sind genau die Information, die gefehlt hat.

Ohne Wurfstern geht das nicht, und wer keine Karten mehr hat, hat auch keine
Stimme.

## Unsichere Werte

Diese Zahlen stammen aus dem Gedächtnis und stehen in
[engine/state.ts](../../../website/src/games/the-mind/engine/state.ts):

1. **Welche Level eine Belohnung bringen und welche.** Im Original steht das auf
   den Levelkarten. Hier ist es eine Tabelle `REWARDS` je Spielerzahl, die
   abwechselnd Wurfstern und Leben verteilt. Der Rhythmus dürfte stimmen, die
   genauen Stufen sind geraten.
2. **Obergrenze 5** für Leben und Wurfsterne.

Sicher sind dagegen: Levelanzahl je Spielerzahl (12/10/8), Startleben = Anzahl
Spieler, 1 Startwurfstern, Karten 1-100.

## Bewusste Abweichungen

- **Man legt immer die niedrigste Karte.** Im Original darf man theoretisch
  jede Karte legen; es gibt nur keinen Grund dazu. Der Knopf legt deshalb die
  niedrigste, und der Zug verrät unterwegs keine Zahl.
- **Kein Zeitdruck von außen.** Es gibt keine Uhr und keinen Countdown; die
  einzige Zeit, die zählt, ist die, die ihr euch nehmt.

## Umsetzung

- Regeln: [engine/moves.ts](../../../website/src/games/the-mind/engine/moves.ts)
- Zustand: [engine/state.ts](../../../website/src/games/the-mind/engine/state.ts)
- Online: [multiplayer/adapter.ts](../../../website/src/games/the-mind/multiplayer/adapter.ts)

The Mind wird **nur online** gespielt: Das Spiel besteht daraus, das Zögern der
anderen zu lesen, und dafür braucht es Menschen am Tisch. Warum ein
Computerpartner das nicht ersetzen kann, steht im
[Modul-README](../../../website/src/games/the-mind/README.md).
