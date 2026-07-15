# Drecksau

Das Kartenspiel [Drecksau](https://de.wikipedia.org/wiki/Drecksau_(Spiel))
(Frank Bebenroth, Kosmos) als Browserspiel gegen Computergegner.

Wer zuerst nur noch Drecksäue und kein sauberes Schwein mehr vor sich liegen
hat, gewinnt.

## Starten

```bat
install.bat    :: einmalig - installiert die Dependencies
start.bat      :: startet den Dev-Server und oeffnet den Browser
```

Oder direkt:

```bash
cd website
npm install
npm run dev     # http://localhost:3000
```

## Skripte (im Ordner website/)

| Befehl              | Zweck                                  |
| ------------------- | -------------------------------------- |
| `npm run dev`       | Dev-Server                             |
| `npm run build`     | Produktions-Build                      |
| `npm test`          | Unit-Tests der Spiel-Engine (Vitest)   |
| `npm run lint`      | ESLint                                 |
| `npm run format`    | Prettier                               |
| `npm run typecheck` | TypeScript ohne Emit                   |
| `npm run docs`      | API-Doku via TypeDoc nach `docs/api/`  |

## Aufbau

Die Spiellogik ist vollstaendig von der Oberflaeche getrennt und rein
funktional - jeder Zug erzeugt einen neuen Zustand. Dadurch ist sie ohne
Browser testbar, und mit demselben Seed laeuft eine Partie identisch ab.

```text
website/src/
  game/           Spiel-Engine, ohne React
    cards.ts        Kartenarten und Deck (21 Matsch, 4 Regen, 9 Stall, ...)
    state.ts        Zustandstypen (Schwein, Spieler, Partie)
    setup.ts        Neue Partie austeilen
    moves.ts        Welche Karte darf auf welches Schwein?
    engine.ts       Kartenwirkungen, Nachziehen, Siegpruefung
    ai.ts           Computergegner (Heuristik)
    random.ts       Gesaeter Zufall - gleicher Seed, gleiche Partie
  i18n/           deutsche Texte (Kartennamen, Log)
  components/     React-Oberflaeche
  hooks/          Bindeglied zwischen Engine und React
```

## Regeln

Die verbindliche Spezifikation steht in [docs/game-rules.md](docs/game-rules.md),
belegt aus der offiziellen Kosmos-Anleitung. Die Coding-Regeln stehen in
[docs/coding-rules.md](docs/coding-rules.md).
