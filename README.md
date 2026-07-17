# Drecksau

Das Kartenspiel [Drecksau](<https://de.wikipedia.org/wiki/Drecksau_(Spiel)>)
(Frank Bebenroth, Kosmos) als Browserspiel gegen Computergegner.

Wer zuerst nur noch Drecksäue und kein sauberes Schwein mehr vor sich liegen
hat, gewinnt.

## Spielanleitungen

Offizielle Regeln von Kosmos als PDF:

- Grundspiel: [Drecksau-Anleitung (Art.-Nr. 740276)](https://cms.kosmos.de/game-instructions/4002051740276_Drecksau_Manual_2023_web.pdf)
- Erweiterung: [Sauschön-Anleitung (Art.-Nr. 740375)](https://gesellschaftsspiele.spielen.de/uploads/files/2669/5718aca153430.pdf)

Wie die Regeln in dieser Umsetzung genau greifen, steht in
[docs/game-rules.md](docs/game-rules.md).

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
| `npm test`          | Unit-Tests der Spiel-Engine (Vitest)  |
| `npm run lint`      | ESLint                                |
| `npm run format`    | Prettier                              |
| `npm run typecheck` | TypeScript ohne Emit                  |
| `npm run docs`      | API-Doku via TypeDoc nach `docs/api/` |

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

## Spielername

Unter **Einstellungen** eintragbar. Er erscheint im Spielverlauf neben den
Mitspielern („Timo: Matsch! …“). Bleibt das Feld leer, heisst der Spieler
schlicht **„Du"** - so wie vor dieser Einstellung.

Direkte Anreden bleiben immer beim „Du" („Du bist dran", „Deine Schweine",
„Du hast gewonnen!") - der Name ersetzt nur die dritte Person. Waehlt man den
Namen eines Gegners, weicht dieser auf einen anderen aus; zwei Bertas im
Spielverlauf waere unlesbar.

Gilt ab dem naechsten Spiel: Die Namen werden beim Austeilen vergeben, und ein
laufender Spielverlauf soll nicht ruecklaufend andere Namen zeigen.

### Namen der Computergegner

Werden pro Partie aus einem Pool gezogen
([player-names.ts](website/src/i18n/player-names.ts)) - jedes Spiel ein anderer
Tisch.

Wichtig dabei: Sie kommen aus dem **Seed der Partie**, nicht aus
`Math.random()`. Zwei Gruende:

- Das erste Spiel wird beim Build **vorgerendert**. Echter Zufall wuerde im
  Browser andere Namen erzeugen als im ausgelieferten HTML - Hydration-Fehler.
- Die Engine ist gesaet: gleicher Seed, gleiche Partie. Darauf bauen die Tests.

Ein Reload zeigt darum denselben Tisch, und der eigene Name faellt vorher aus
dem Pool.

## Erweiterung „Sauschön“

Unter **Einstellungen** zuschaltbar, standardmaessig **aus** - ohne sie ist es
das unveraenderte Grundspiel. Sie bringt 32 Karten dazu: 16 Schönsau, 12 Aus
dem Staub, 4 Glücksvogel.

Zwei Dinge aendern sich dadurch grundlegend:

- **Zwei Wege zu gewinnen:** nur noch Drecksaeue **oder** nur noch Schönsaeue.
  Eine Mischung gewinnt nicht.
- **Jeder hat nur 3 Schweine**, unabhaengig von der Spielerzahl (statt 5/4/3).

Die Umschaltung gilt ab dem naechsten Spiel - Deck und Schweinezahl werden beim
Austeilen festgelegt. Details und Quellen in
[docs/game-rules.md](docs/game-rules.md).

## Zusatzkarten „Drecksau total“

Eigene Einstellung, Standard **aus**. Bringt zwei **Verteidigungskarten** aus
der Ausgabe Drecksau total - der Name taeuscht, es sind keine Angriffe:

- **Extra-Matsch** (2x): rettet eine eigene Drecksau vor „Bauer schrubbt" und
  vor Regen.
- **Lippenstift** (2x): rettet eine eigene Schönsau vor „Aus dem Staub".
  Kommt nur ins Spiel, wenn auch die Erweiterung Sauschön an ist.

Beide **loesen automatisch aus**: Wird eine eigene Sau angegriffen und man haelt
die passende Karte, wird sie von selbst eingesetzt (eine Karte rettet eine Sau).
Aktiv spielen kann man sie nicht - auf der Hand nur ablegen. Warum automatisch
und nicht auf Nachfrage, steht als bewusste Festlegung in
[docs/game-rules.md](docs/game-rules.md).

## Schwierigkeit

Unter **Einstellungen** waehlbar: **Leicht**, **Mittel** (Standard) oder
**Schwer**. Auf keiner Stufe schaut der Gegner in deine Handkarten - schwerer
heisst cleverer, nicht unfairer. Der Code steht in
[ai.ts](website/src/game/ai.ts).

- **Leicht:** spielt meist zufaellig (nimmt aber einen sofortigen Sieg mit).
  **Du faengst immer an.**
- **Mittel:** die Heuristik - bester Zug pro Runde, zielt schon leicht auf den
  Fuehrenden. Zufaelliger Startspieler.
- **Schwer:** die Heuristik **plus ein Zug Vorausschau** - steht ein Gegner
  einen Zug vor dem Sieg, wird er bevorzugt zurueckgesetzt. Zufaelliger
  Startspieler.

Die Stufe wirkt sofort auf die KI; der Startspieler wird beim Austeilen des
naechsten Spiels festgelegt.

## Kartendesign

Unter **Einstellungen** waehlbar: **Modern** (Standard) oder **Klassisch**. Rein
visuell, darum wirkt die Umschaltung **sofort** - kein neues Spiel noetig.

Jedes Design ist ein Bildordner
([website/src/assets/cards/](website/src/assets/cards/)) mit denselben
Dateinamen. Ein weiteres Design anzulegen heisst: neuer Ordner, ein Eintrag in
der Theme-Liste und ein Import-Block - siehe die README im Bildordner.

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

## Regeln

Die verbindliche Spezifikation steht in [docs/game-rules.md](docs/game-rules.md),
belegt aus der offiziellen Kosmos-Anleitung. Die Coding-Regeln stehen in
[docs/coding-rules.md](docs/coding-rules.md).
