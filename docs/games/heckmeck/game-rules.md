# Heckmeck am Bratwurmeck - Spielregeln

Umsetzung des Würfelspiels von Reiner Knizia (Zoch Verlag, 2005).

> **Hinweis:** Wie bei den letzten Spielen lag keine Anleitung vor; die Regeln
> sind aus Spielkenntnis rekonstruiert. Unsichere Punkte stehen unten.

2 bis 7 Spieler. Wer am Ende die meisten **Würmer** hat, gewinnt - nicht die
meisten Chips.

## Material

- **16 Chips** mit den Zahlen 21 bis 36. Sie liegen offen auf dem Grill.
  - 21-24: 1 Wurm · 25-28: 2 Würmer · 29-32: 3 Würmer · 33-36: 4 Würmer
- **8 Würfel** mit den Seiten 1, 2, 3, 4, 5 und **Wurm**.

Der Wurm zählt beim Addieren **5**. Aber ohne mindestens einen Wurm unter den
beiseitegelegten Würfeln zählt der ganze Wurf **gar nichts**.

## Ein Zug

1. Alle acht Würfel werfen.
2. **Einen Wert wählen** und **alle** Würfel dieses Werts beiseitelegen. Jeder
   Wert darf pro Zug nur **einmal** beiseitegelegt werden - das ist der Haken,
   an dem sich das ganze Spiel aufhängt.
3. Aufhören oder die übrigen Würfel erneut werfen.
4. Beim Aufhören zählt die Summe aller beiseitegelegten Würfel. Damit darf man:
   - den Chip mit **genau dieser Zahl** vom Grill nehmen - oder den
     **nächstniedrigeren**, der noch da liegt;
   - **oder** den **obersten** Chip eines Mitspielers klauen, wenn dessen Zahl
     **exakt** der Summe entspricht.

Aufhören darf nur, wer mindestens einen **Wurm** beiseitegelegt hat.

## Sich verspekulieren

Der Zug ist verloren, wenn

- nach einem Wurf **kein Wert** mehr übrig ist, der noch nicht beiseiteliegt,
- oder der letzte Würfel beiseitegelegt ist und die Summe für keinen Chip
  reicht (oder der Wurm fehlt).

Dann passiert zweierlei:

1. Der eigene **oberste Chip** kommt zurück auf den Grill.
2. Der **höchste** Chip auf dem Grill wird umgedreht und ist **aus dem Spiel**.

Der zweite Punkt ist es, der wehtut - und zwar allen: Verspekulieren verkürzt
das Spiel, und die fetten Chips gehen zuerst.

## Spielende

Sobald der Grill leer ist, ist Schluss. Jede:r zählt die Würmer auf den eigenen
Chips.

## Unsichere Werte

Aus dem Gedächtnis, alle in
[engine/state.ts](../../../website/src/games/heckmeck/engine/state.ts):

1. **Chips 21-36** und die Wurmverteilung 1/2/3/4 in Vierergruppen.
2. **8 Würfel**, Wurm zählt 5.
3. Beim Verspekulieren wird der **höchste** Chip des Grills entfernt - auch
   dann, wenn der zurückgegebene Chip selbst der höchste ist.

Sicher sind: jeder Wert nur einmal, mindestens ein Wurm zum Aufhören, Klauen
nur exakt und nur den obersten Chip, Spielende bei leerem Grill.

## Umsetzung

- Regeln: [engine/moves.ts](../../../website/src/games/heckmeck/engine/moves.ts)
- Computergegner: [engine/ai.ts](../../../website/src/games/heckmeck/engine/ai.ts)
- Online: [multiplayer/adapter.ts](../../../website/src/games/heckmeck/multiplayer/adapter.ts)
