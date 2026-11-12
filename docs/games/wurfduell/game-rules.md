# Wurfduell - Spielregeln als Spezifikation

Eigenes Spiel dieser Sammlung (keine Vorlage). Diese Datei ist die verbindliche
Referenz für die Engine in `website/src/games/wurfduell/engine/`.

## Ziel

Zwei Spieler, je eine Figur, 20 Meter auseinander. Abwechselnd
wird geworfen; wer getroffen wird, verliert Lebenspunkte (LP). Wer zuerst 0 LP
hat, ist k.o. und verliert. Ausweichen gibt es nicht.

## Ablauf

1. **Figurenwahl** (Phase `pick`): beide wählen gleichzeitig, jede Wahl ist
   sofort für beide sichtbar und endgültig. Gegen den Computer wählt er sofort
   nach dem Menschen. Danach Phase `throw`.
2. **Werfen** (Phase `throw`): Wer anfängt, wechselt mit jeder Partie
   (`round % 2`). Ein Wurf besteht aus Winkel (0 bis 88 Grad), Kraft (0 bis 1)
   und optional **einer** noch unverbrauchten Fähigkeit der eigenen Figur.
3. Nach jedem Wurf ist der andere dran (außer er ist eingefroren), mit neuem
   Wind.
4. **Ende** (Phase `over`): durch K.o. oder Aufgabe. Der Sieger bekommt einen
   Punkt im Tischstand (`wins`).
5. **Revanche:** Haben beide sie verlangt, beginnt eine neue Partie (neuer
   Seed, neue Landschaft, Stand bleibt).

## Feld, Wind, Flug

- Breite 2400, Boden auf Höhe 0, Figuren bei x = 200 und x = 2200; kein Hindernis.
- Landschaft (Garten, Stadt, Hof, Winter) je Partie aus dem Seed, rein optisch.
- Wind je Wurf aus dem Seed: -5 bis +5 Stufen, je Stufe 19 Einheiten/s²,
  multipliziert mit Windfaktor von Gegenstand und Figur.
- Abwurf an der Hand (24 vor der Figur, Höhe 104 x Figurengröße).
  Geschwindigkeit `(450 + Kraft x 950) x Wurfkraft der Figur x Tempo des
Gegenstands`. Schwerkraft 560 x Schwerefaktor; Schrittweite 1/120 s.
- Verhalten: `split` zerfällt am Scheitelpunkt in drei, `bounce` springt einmal ab, `magnet` wird im Umkreis von 300 mit
  900 Einheiten/s² zum Gegner gezogen. Mehrfachwürfe (`volley`) starten
  mehrere Teile mit Winkelversatz.

## Schaden

| Treffer | Schaden                                                    |
| ------- | ---------------------------------------------------------- |
| Körper  | Schaden des Gegenstands                                    |
| Kopf    | Schaden x 1,5 (gerundet)                                   |
| Schild  | Gesamtschaden des Wurfs halbiert (aufgerundet), Schild weg |

Schaden mehrerer Teile wird addiert und auf die verbleibenden LP begrenzt.

## Fähigkeiten - Reihenfolge in einem Wurf

1. Effekte auf dem Werfer wirken und verfallen: `shaky` (Wackeln ±9 Grad,
   ±0,12 Kraft, aus dem Seed), `rooted` (Kraft höchstens 0,7), `blind` (nur
   Anzeige: keine Zielhilfe, kein Wind; der Computer streut stärker).
2. Fähigkeit: Heilung (gedeckelt auf Max-LP), Rum wackelt selbst, Windstille
   setzt den Wind auf 0, Gegenstand/Mehrfachwurf wird ersetzt.
3. Flug und Schaden (Schild des Ziels beachten).
4. Effekte aufs Ziel: Brand (nur bei Treffer, 2 Züge), Einfrieren, Brüllen,
   Rankenfalle, Mehlwolke; Schild für den Werfer.
5. Eingefroren: Der Werfer ist sofort noch einmal dran, das Eis ist weg.
6. Brand: Wer jetzt am Zug ist und brennt, verliert 10 LP (kann k.o. machen).

## Online-Sonderregeln

- Übertragen wird nur `{ kind: "throw", angle, power, ability }`; alles andere
  rechnen beide Seiten deterministisch aus dem Seed.
- Zeitlimit 25 s je Zug, dann schwacher Wurf (45 Grad, Kraft 0,3, ohne
  Fähigkeit); in der Wahlphase eine zufällige Figur.
- Ein abwesender Spieler wird nach Kulanzzeit vom Computer mit genau diesen
  schwachen Würfen vertreten.
- Aufgabe ist in jeder Phase außer `over` möglich.
