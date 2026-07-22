# Panzerkiste

Ein Top-Down-Panzerspiel nach dem Vorbild von „Tanks!" aus Wii Play. Du steuerst
einen Panzer über ein 2D-Feld voller Mauern und feindlicher Panzer; zerstöre
alle Gegner, um das Level zu schaffen.

## Steuerung

- **Bewegen:** W A S D (oder Pfeiltasten)
- **Schießen:** Linksklick - das Rohr zielt auf den Mauszeiger; Schüsse prallen
  einmal an einer Mauer ab
- **Mine legen:** Leertaste - die **gelbe** Mine explodiert nach **3 Sekunden**
  (in der letzten Sekunde blinkt sie schnell rot/gelb) und reißt alles im Umkreis
  mit (auch dich). Ein **Treffer durch einen Schuss zündet sie sofort**. Der
  Explosionsradius wird bewusst **nicht** angezeigt.

Drei Leben zum Start, mit stärker werdenden Gegnern über viele Level. Alle fünf
Level (5, 10, 15, ...) gibt es ein Bonusleben dazu.

## Aufbau des Spielmoduls

```text
games/panzerkiste/
  engine/       reine Simulation, ohne Canvas oder DOM (Schritt, Kollisionen, KI)
  components/   Canvas-Renderer und die React-Oberflaeche
  hooks/        Animationsschleife + Eingabe (Tastatur/Maus)
  i18n/         deutsche Texte
  assets/       das Cover-Logo
```

Die Simulation ist bewusst von der Darstellung getrennt und **rein funktional**:
[engine/engine.ts](engine/engine.ts) rechnet aus Zustand plus Eingabe plus
vergangener Zeit den nächsten Zustand aus - ohne Canvas, ohne Uhr. Derselbe Seed
und dieselben Eingaben spielen sich identisch ab, was die Gegner-KI ohne Browser
testbar macht. Der Renderer ([components/render.ts](components/render.ts)) malt
diesen Zustand nur; die Schleife und die Eingabe stecken in
[hooks/use-panzerkiste.ts](hooks/use-panzerkiste.ts).

## Level

Die Level sind ASCII-Karten in [engine/levels.ts](engine/levels.ts): `#` Mauer,
`x` zerstörbare Wand, `.` Boden, `P` der (blaue) Spieler und `B` ein brauner
Gegner. Die vollständige Zeichen-Legende steht in der Karten-Doku (siehe unten).
Ein neues Level ist einfach eine weitere Karte.

Das Spielfeld ist **fest 22 x 12 Zellen** (wie in Wii Play), und der **umlaufende
Mauerrand wird automatisch** von [engine/setup.ts](engine/setup.ts) angelegt -
die Karte zeichnet also nur das Innere und kann den Rand nicht vergessen. Mit
Rand ergibt das ein 24 x 14 grosses Gitter.

Das vollständige Kartenformat - **welches Zeichen für welches Element steht**,
Größe, Regeln und eine leere Vorlage - steht in
[docs/games/panzerkiste/levels.md](../../../../docs/games/panzerkiste/levels.md).

## Cover-Logo

Das Bild liegt in [assets/logo.webp](assets/logo.webp) - aktuell ein Platzhalter,
den man durch echte WebP-Grafik ersetzen kann.
