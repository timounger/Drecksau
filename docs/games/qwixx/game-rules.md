# Qwixx - Spielregeln

Umsetzung des Würfelspiels von Steffen Benndorf (Nürnberger-Spielkarten-Verlag,
2012).

> **Zur Einordnung:** Qwixx war 2013 für das **Spiel des Jahres nominiert**,
> gewonnen hat Hanabi. Die Sammlung soll nichts Falsches behaupten.

> **Hinweis:** Wie bei den letzten beiden Spielen lag keine Anleitung vor. Der
> Ablauf ist aus Spielkenntnis rekonstruiert. Anders als bei Camel Up und The
> Mind sind hier aber **alle Zahlen belegbar knapp** - siehe
> [Unsichere Werte](#unsichere-werte).

2 bis 5 Spieler. Wer am Ende die meisten Punkte auf dem Zettel hat, gewinnt.

## Der Zettel

Vier Reihen mit je elf Zahlen:

| Reihe | Verlauf |
| ----- | ------- |
| Rot   | 2 → 12  |
| Gelb  | 2 → 12  |
| Grün  | 12 → 2  |
| Blau  | 12 → 2  |

Dazu vier Kästchen für **Fehlwürfe**.

## Die eine Regel, die alles bestimmt

**In einer Reihe wird nur von links nach rechts angekreuzt.** Jede Zahl, die du
überspringst, ist für den Rest des Spiels weg. Die 9 zu nehmen, wenn die Reihe
bei der 4 steht, kostet dich nicht die 9 - es kostet dich die 5, 6, 7 und 8.

## Ablauf

Wer am Zug ist, würfelt **alle sechs Würfel**: zwei weiße und vier farbige.
Dann kommen zwei Schritte, und sie gehören verschiedenen Leuten:

1. **Weiße Würfel - alle dürfen.** Jede:r darf die Summe der beiden weißen
   Würfel in einer beliebigen Reihe ankreuzen. Oder auch nicht.
2. **Farbwürfel - nur der aktive Spieler.** Er darf zusätzlich **einen** weißen
   mit **einem** farbigen Würfel kombinieren und die Summe in der Reihe dieser
   Farbe ankreuzen.

Wer am Zug ist und in **keinem** der beiden Schritte etwas angekreuzt hat, muss
einen **Fehlwurf** eintragen. Die Mitspieler trifft das nie - für sie ist
Verzichten gratis.

### Reihen schließen

Die letzte Zahl einer Reihe (12 bei Rot/Gelb, 2 bei Grün/Blau) darf nur
ankreuzen, wer in dieser Reihe schon **mindestens 5 Kreuze** hat. Wer sie
nimmt, schließt die Reihe: Der Farbwürfel kommt vom Tisch, niemand kann diese
Farbe mehr nutzen. Das Schloss zählt als **zusätzliches Kreuz**.

## Spielende

Das Spiel endet sofort, wenn

- **zwei Reihen geschlossen** sind, oder
- jemand seinen **vierten Fehlwurf** einträgt.

## Wertung

Je Reihe zählen die Kreuze (Schloss mitgezählt) als Dreieckszahl:

| Kreuze | 1   | 2   | 3   | 4   | 5   | 6   | 7   | 8   | 9   | 10  | 11  | 12  |
| ------ | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Punkte | 1   | 3   | 6   | 10  | 15  | 21  | 28  | 36  | 45  | 55  | 66  | 78  |

Jeder Fehlwurf zählt **-5**. Alle vier Reihen plus Fehlwürfe ergeben das
Ergebnis.

Dass die Punkte so steil wachsen, ist der Grund, warum man sich auf Reihen
konzentriert statt überall ein bisschen anzukreuzen: doppelt so viele Kreuze
sind viermal so viele Punkte.

## Unsichere Werte

Alles Folgende stammt aus dem Gedächtnis, steht aber in
[engine/state.ts](../../../website/src/games/qwixx/engine/state.ts) und ist in
einer Zeile korrigierbar:

1. **5 Kreuze**, bevor die letzte Zahl einer Reihe genommen werden darf.
2. **-5 Punkte** je Fehlwurf, **4 Fehlwürfe** beenden das Spiel.
3. **2 geschlossene Reihen** beenden das Spiel.

Sicher sind: die vier Reihen und ihre Richtung, die sechs Würfel, die beiden
Schritte je Zug, die Dreieckszahl-Wertung und dass nur der aktive Spieler einen
Fehlwurf riskiert.

## Bewusste Abweichungen

- **Gewürfelt wird automatisch.** Der Wurf ist keine Entscheidung, also gibt es
  keinen Knopf dafür - der Zug beginnt damit, dass die Würfel liegen.
- **Der Zettel zeigt, was ein Kreuz kostet.** Übersprungene Zahlen werden
  durchgestrichen dargestellt. Auf Papier sieht man das auch, nur weniger
  deutlich.

## Umsetzung

- Regeln: [engine/moves.ts](../../../website/src/games/qwixx/engine/moves.ts)
- Zustand und Wertung:
  [engine/state.ts](../../../website/src/games/qwixx/engine/state.ts)
- Computergegner: [engine/ai.ts](../../../website/src/games/qwixx/engine/ai.ts)
- Online: [multiplayer/adapter.ts](../../../website/src/games/qwixx/multiplayer/adapter.ts)
