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
  game/           Spiel-Engine von Drecksau, ohne React
    cards.ts        Kartenarten und Deck (21 Matsch, 4 Regen, 9 Stall, ...)
    state.ts        Zustandstypen (Schwein, Spieler, Partie)
    setup.ts        Neue Partie austeilen
    moves.ts        Welche Karte darf auf welches Schwein?
    engine.ts       Kartenwirkungen, Nachziehen, Siegpruefung
    ai.ts           Computergegner (Heuristik)
    random.ts       Gesaeter Zufall - gleicher Seed, gleiche Partie
    serialization.ts  Prueft gespeicherte Staende, bevor sie in die Engine gehen
  games/
    registry.ts     Liste aller Spiele - hier docken weitere an
  lib/
    storage/        Generisch: localStorage mit Namensraum und Versionierung
    stats/          Generisch: Statistik-Modell, Speicherung, React-Store
  i18n/           deutsche Texte (Kartennamen, Log) und Formatierung
  components/     React-Oberflaeche
  hooks/          Bindeglied zwischen Engine und React
```

## Animationen

Wird eine Karte gespielt - egal von wem - laeuft ein kurzer Effekt ueber den
Bildschirm: Regen regnet, der Blitz blitzt, Matsch spritzt. Die Effekte liegen
in [action-effect-overlay.tsx](website/src/components/action-effect-overlay.tsx),
die Keyframes in [globals.css](website/src/app/globals.css).

Abschalten unter **Einstellungen** (`/einstellungen`). Standardmaessig sind sie
**an** - mit einer Ausnahme: Steht das Betriebssystem auf „Bewegung
reduzieren" (`prefers-reduced-motion`), sind sie zunaechst aus. Diese
Einstellung setzen Menschen, denen bewegte Oberflaechen uebel machen; sie zu
ueberfahren waere unhoeflich. Einschalten laesst sie sich trotzdem jederzeit.

## Speicherung und Statistik

Spielstand und Statistik liegen im **localStorage**, nicht in Cookies: Ein
Spielstand ist rund 5 KB gross und passt nicht in ein Cookie (~4 KB Limit) -
und auf GitHub Pages gibt es ohnehin keinen Server, der Cookies lesen wuerde.

Alle Schluessel liegen unter dem Praefix `drecksau-app/<spiel-id>/...`. Das ist
kein Schmuck: Alle GitHub-Pages-Projektseiten eines Kontos teilen sich **eine**
Origin (`<konto>.github.io`), und der localStorage gilt pro Origin - ohne
Praefix wuerde diese App die Daten anderer Projekte lesen und ueberschreiben.

### Ein weiteres Spiel hinzufuegen

Die Speicher- und Statistik-Schicht ist bewusst spielunabhaengig. Fuer ein
neues Spiel reicht:

1. In [registry.ts](website/src/games/registry.ts) eine `GameId` und einen
   Eintrag ergaenzen.
2. Die eigene Engine anlegen (analog zu `src/game/`) samt einer
   `isGameState`-Pruefung fuer gespeicherte Staende.
3. `loadSession` / `saveSession` und die `record*`-Funktionen mit der neuen
   `GameId` aufrufen.

Statistik-Seite, Zuruecksetzen und Versionierung funktionieren dann ohne
weitere Aenderung - die Seite iteriert ueber die Registry.

Gespeicherte Daten tragen eine Schema-Version. Passt sie nicht, oder ist ein
Eintrag beschaedigt, wird er verworfen und das Spiel startet frisch, statt mit
einem kaputten Zustand abzustuerzen.

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
