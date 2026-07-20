# Spielesammlung

Eine kleine Sammlung von Browser-Spielen, komplett clientseitig und als
statische Seite auf GitHub Pages gehostet. Die Startseite ist die Uebersicht;
jedes Spiel hat seine eigene Seite.

## Spiele

| Spiel                                            | Beschreibung                                                                   |
| ------------------------------------------------ | ------------------------------------------------------------------------------ |
| [Drecksau](website/src/games/drecksau/README.md) | Kosmos-Kartenspiel gegen Computergegner oder online mit Freunden.              |
| [Binokel](website/src/games/binokel/README.md)   | Schwaebisches Stichspiel (Reizen, Melden, Stechen) gegen Computer oder online. |
| [Panzerkiste](website/src/games/panzerkiste/README.md) | Top-Down-Panzergefecht - alle feindlichen Panzer zerstoeren (WASD, Maus, Minen). |

Weitere Spiele docken ueber die Registry an (siehe
[Ein weiteres Spiel hinzufuegen](#ein-weiteres-spiel-hinzufuegen)).

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

| Befehl              | Zweck                                 |
| ------------------- | ------------------------------------- |
| `npm run dev`       | Dev-Server                            |
| `npm run build`     | Produktions-Build                     |
| `npm test`          | Unit-Tests (Vitest)                   |
| `npm run lint`      | ESLint                                |
| `npm run format`    | Prettier                              |
| `npm run typecheck` | TypeScript ohne Emit                  |
| `npm run docs`      | API-Doku via TypeDoc nach `docs/api/` |

## Aufbau

Jedes Spiel ist ein eigenes Modul unter `games/`; darum herum liegt nur
gemeinsame Infrastruktur (Speicherung, Statistik, Uebersicht). So aendert ein
neues Spiel nichts an den geteilten Schichten.

```text
website/src/
  app/            Routen (Uebersicht /, je Spiel /<spiel> mit /einstellungen, /statistik, /online)
  games/
    registry.ts     Liste aller Spiele - hier docken weitere an
    drecksau/       das Spiel Drecksau (eigene README im Ordner)
    binokel/        das Spiel Binokel (eigene README im Ordner)
  online/         geteilte Online-Schicht (host-autoritativ, Firebase) fuer alle Spiele
  components/     geteilte UI (Uebersicht, Statistik)
  lib/
    storage/        Generisch: localStorage mit Namensraum und Versionierung
    stats/          Generisch: Statistik-Modell, Speicherung, React-Store
  i18n/           geteilte Texte (Sammlung, Statistik) und Formatierung
```

Die Spiellogik eines Spiels ist von der Oberflaeche getrennt und rein
funktional: jeder Zug erzeugt einen neuen Zustand, testbar ohne Browser.

## Speicherung und Statistik

Spielstaende und Statistik liegen im **localStorage**, nicht in Cookies: Ein
Spielstand ist schnell groesser als das ~4-KB-Cookie-Limit - und auf GitHub
Pages gibt es ohnehin keinen Server, der Cookies lesen wuerde.

Alle Schluessel liegen unter dem Praefix `drecksau-app/<spiel-id>/...`. Das ist
kein Schmuck: Alle GitHub-Pages-Projektseiten eines Kontos teilen sich **eine**
Origin (`<konto>.github.io`), und der localStorage gilt pro Origin - ohne
Praefix wuerde diese App die Daten anderer Projekte lesen und ueberschreiben.

Gespeicherte Daten tragen eine Schema-Version. Passt sie nicht, oder ist ein
Eintrag beschaedigt, wird er verworfen und das Spiel startet frisch, statt mit
einem kaputten Zustand abzustuerzen.

### Ein weiteres Spiel hinzufuegen

Die Speicher- und Statistik-Schicht ist bewusst spielunabhaengig. Fuer ein neues
Spiel reicht:

1. In [registry.ts](website/src/games/registry.ts) eine `GameId` und einen
   Eintrag (Name, Tagline, Emoji, `href`) ergaenzen.
2. Ein eigenes Modul `website/src/games/<spiel>/` anlegen (Engine, Komponenten,
   Texte) samt einer `isGameState`-Pruefung fuer gespeicherte Staende.
3. Eine Route `website/src/app/<spiel>/page.tsx` erstellen, die die
   Spielkomponente rendert.

Uebersicht, Statistik-Seite, Zuruecksetzen und Versionierung funktionieren dann
ohne weitere Aenderung - sie iterieren ueber die Registry.

## Favicon

Das Icon liegt in [website/src/app/favicon.ico](website/src/app/favicon.ico) und
wird von Next.js automatisch verlinkt - im `layout.tsx` ist dafuer nichts
einzutragen. Zum Aendern einfach die Datei ersetzen.

**Achtung:** Next erkennt in `src/app/` auch `icon.svg`, `icon.png` und
`apple-icon.png`. Liegt eine davon daneben, wird sie **zusaetzlich** verlinkt,
und moderne Browser bevorzugen dann das SVG - das `favicon.ico` erscheint nicht
mehr. Also entweder `favicon.ico` **oder** die `icon.*`-Variante verwenden.

## Deployment (GitHub Pages)

Ein Push auf `main` baut und veroeffentlicht die Seite automatisch
([.github/workflows/github-ci.yml](.github/workflows/github-ci.yml)).

Die Seite laeuft komplett im Browser, deshalb wird sie als **statischer Export**
gebaut (`output: "export"` in [website/next.config.ts](website/next.config.ts))
und landet in `website/out/`.

**Einmalig noetig:** in den Repo-Einstellungen unter _Settings -> Pages_ als
Source **"GitHub Actions"** auswaehlen. Ohne das schlaegt der Workflow-Schritt
`configure-pages` fehl.

Die Seite liegt dann unter einem Unterpfad (`/Drecksau`). Den setzt die CI
automatisch per `NEXT_PUBLIC_BASE_PATH`, damit alle Asset-Pfade stimmen - lokal
ist die Variable leer und die Seite laeuft unter `/`. Einen Pages-Build lokal
nachstellen:

```powershell
$env:NEXT_PUBLIC_BASE_PATH="/Drecksau"; npm run build
```

## Dokumentation

- Coding-Regeln: [docs/coding-rules.md](docs/coding-rules.md),
  TypeScript-Leitfaden: [docs/typescript-guide.md](docs/typescript-guide.md)
- Pro Spiel: eigene README im Spielordner und Spezifikation unter
  `docs/games/<spiel>/` (z. B.
  [docs/games/drecksau/game-rules.md](docs/games/drecksau/game-rules.md)).
