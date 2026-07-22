# Panzerkiste - Karten (Level) erstellen

Referenz für das Kartenformat. Ein Level ist eine `LevelMap` in
[website/src/games/panzerkiste/engine/levels.ts](../../../website/src/games/panzerkiste/engine/levels.ts):
ein Array aus Textzeilen, das **nur das Spielfeld-Innere** beschreibt.

## Feldgröße

- Das Innere ist **immer fest 22 Zeichen breit x 17 Zeilen hoch** (wie in Wii
  Play - das Feld ist über alle Level gleich groß).
- Der **umlaufende Mauerrand wird automatisch** angelegt
  ([engine/setup.ts](../../../website/src/games/panzerkiste/engine/setup.ts)). Man
  zeichnet ihn **nicht** selbst und kann ihn nicht vergessen.
- Mit Rand ergibt das ein 24 x 19 großes Gitter; eine Zelle ist 40 x 40 Pixel.

## Zeichen-Legende

Konvention: **Symbole und Kleinbuchstaben** stehen für den Untergrund/Wände,
**Großbuchstaben** für Panzer. Status: **✓** = umgesetzt, **○** = geplant (Zeichen
schon reserviert, im Spiel noch nicht vorhanden).

### Boden und Wände

| Zeichen | Element              | Status | Bedeutung                                                                       |
| ------- | -------------------- | :----: | ------------------------------------------------------------------------------- |
| `.`     | Befahrbarer Boden    |   ✓    | Freie Fläche. Panzer fahren darüber, Schüsse fliegen hindurch.                  |
| `#`     | Wand                 |   ✓    | Blockiert Panzer **und** Schüsse. Schüsse prallen ab. Unzerstörbar.             |
| `x`     | Zerstörbare Wand     |   ✓    | Wie eine Wand (blockt, Schüsse prallen ab), aber eine **Minen**-Explosion in Reichweite macht die Zelle zu Boden.  |
| `o`     | Loch                 |   ✓    | Panzer werden **geblockt**, Schüsse fliegen aber **hindurch**.                  |

### Panzer

| Zeichen | Panzer            | Status | Verhalten                                              |
| ------- | ----------------- | :----: | ------------------------------------------------------ |
| `P`     | Spieler (blau)    |   ✓    | Vom Menschen gesteuert (WASD, Maus, Leertaste).        |
| `B`     | Braun             |   ✓    | Steht fest, feuert langsame, gerade Schüsse.           |
| `G`     | Grau              |   ✓    | Fährt langsam umher und nimmt gezielte Schüsse.        |
| `Y`     | Gelb              |   ✓    | Fährt schnell, feuert und legt beim Fahren Minen.      |
| `U`     | Blau (türkis)     |   ✓    | Fährt umher, feuert schnelle Raketen, die **nicht** abprallen. |
| `N`     | Grün              |   ✓    | Steht fest, feuert schnelle Raketen (2× Abpraller) und zielt per Bank-Schuss über Ecken. |
| `L`     | Lila              |   ✓    | Sehr schnell, feuert doppelt so schnell, Schüsse prallen ab. |
| `I`     | Unsichtbar        |   ✓    | Beim Start kurz weiß, dann unsichtbar; fährt, legt Minen und schießt normal. |
| `S`     | Schwarz           |   ○    | Verhalten noch festzulegen.                            |

> Hinweis: Nur die mit **✓** markierten Zeichen sind aktuell in der Engine
> vorhanden. Die geplanten Elemente werden nacheinander eingebaut; dabei wandert
> ihr Status auf ✓ und ihr Verhalten wird hier eingetragen.

## Regeln

- **Genau 17 Zeilen**, jede **genau 22 Zeichen** lang.
- **Genau ein `P`** (der Spielerstart).
- Beliebig viele Gegner. Ohne Gegner gilt das Level sofort als geschafft.
- **Keinen Rand zeichnen** - die äußere Mauer kommt automatisch dazu.
- Panzer nicht direkt an eine Mauer setzen (mindestens eine freie Zelle Abstand),
  sonst stecken sie fest.

## Vorlage (22 x 17, leer)

```text
......................
......................
......................
......................
......................
......................
......................
......................
......P...............
......................
......................
......................
......................
......................
......................
......................
......................
```

## Ein Level hinzufügen

Eine weitere `LevelMap` an das `LEVELS`-Array in `levels.ts` anhängen. Die Level
werden in dieser Reihenfolge gespielt; das Spiel **beginnt immer mit dem ersten**
(Index 0). Der [Level-Test](../../../website/src/games/panzerkiste/engine/engine.test.ts)
prüft automatisch, dass jede Karte 22 x 17 groß ist und genau ein `P` enthält.
