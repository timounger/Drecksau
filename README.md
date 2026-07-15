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

## Favicon

Das Icon liegt in [website/src/app/favicon.ico](website/src/app/favicon.ico)
und wird von Next.js automatisch verlinkt - im `layout.tsx` ist dafuer nichts
einzutragen. Zum Aendern einfach die Datei ersetzen.

**Achtung:** Next erkennt in `src/app/` auch `icon.svg`, `icon.png` und
`apple-icon.png`. Liegt eine davon daneben, wird sie **zusaetzlich** verlinkt,
und moderne Browser bevorzugen dann das SVG - das `favicon.ico` erscheint nicht
mehr. Also entweder `favicon.ico` **oder** die `icon.*`-Variante verwenden.

## Deployment (GitHub Pages)

Ein Push auf `main` baut und veroeffentlicht die Seite automatisch
([.github/workflows/github-ci.yml](.github/workflows/github-ci.yml)).

Das Spiel laeuft komplett im Browser, deshalb wird es als **statischer Export**
gebaut (`output: "export"` in [website/next.config.ts](website/next.config.ts))
und landet in `website/out/`.

**Einmalig noetig:** in den Repo-Einstellungen unter *Settings -> Pages* als
Source **"GitHub Actions"** auswaehlen. Ohne das schlaegt der Workflow-Schritt
`configure-pages` fehl.

Die Seite liegt dann unter einem Unterpfad (`/Drecksau`). Den setzt die CI
automatisch per `NEXT_PUBLIC_BASE_PATH`, damit alle Asset-Pfade stimmen - lokal
ist die Variable leer und die Seite laeuft unter `/`. Einen Pages-Build lokal
nachstellen:

```powershell
$env:NEXT_PUBLIC_BASE_PATH="/Drecksau"; npm run build
```

## Regeln

Die verbindliche Spezifikation steht in [docs/game-rules.md](docs/game-rules.md),
belegt aus der offiziellen Kosmos-Anleitung. Die Coding-Regeln stehen in
[docs/coding-rules.md](docs/coding-rules.md).
