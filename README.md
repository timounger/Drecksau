# Spielesammlung

Eine kleine Sammlung von Browser-Spielen, komplett clientseitig und als
statische Seite auf GitHub Pages gehostet. Die Startseite ist die Uebersicht;
jedes Spiel hat seine eigene Seite.

## Spiele

| Spiel                                                     | Beschreibung                                                                                             | Modus                |
| --------------------------------------------------------- | -------------------------------------------------------------------------------------------------------- | -------------------- |
| [Drecksau](website/src/games/drecksau/README.md)          | Kosmos-Kartenspiel: wer zuerst nur noch Drecksaeue hat, gewinnt.                                         | Computer + Online    |
| [Binokel](website/src/games/binokel/README.md)            | Schwaebisches Stichspiel - Reizen, Melden, Stechen.                                                      | Computer + Online    |
| [Panzerkiste](website/src/games/panzerkiste/README.md)    | Top-Down-Panzergefecht - alle feindlichen Panzer zerstoeren (WASD, Maus, Minen).                         | Allein + Koop-Online |
| [Krakel Orakel](website/src/games/krakel/README.md)       | Kooperativ: alle malen gleichzeitig, dann streicht ihr gemeinsam die Woerter weg, die keiner gemalt hat. | Nur Online           |
| [Skyjo](website/src/games/skyjo/README.md)                | Karten tauschen und Spalten abraeumen - die wenigsten Punkte gewinnen.                                   | Computer + Online    |
| [RV There Yet?](website/src/games/rv-there-yet/README.md) | Seitenansicht: das Wohnmobil ueber den Berg bringen - notfalls mit der Seilwinde.                        | Allein + Koop-Online |

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
    game-logos.ts   das Cover-Bild je Spiel
    drecksau/       Kartenspiel gegen Computer oder online
    binokel/        Stichspiel gegen Computer oder online
    panzerkiste/    Panzer-Actionspiel, allein oder zu zweit im Koop
    krakel/         kooperatives Malspiel (nur online)
    skyjo/          Kartenspiel gegen Computer oder online
    rv-there-yet/   Fahrspiel in der Seitenansicht, allein
                    (jedes Spiel mit eigener README im Ordner)
  online/         geteilte Online-Schicht (host-autoritativ, Firebase) fuer alle Spiele
  components/     geteilte UI (Uebersicht, Statistik)
  lib/
    storage/        Generisch: localStorage mit Namensraum und Versionierung
    stats/          Generisch: Statistik-Modell, Speicherung, React-Store
  i18n/           geteilte Texte (Sammlung, Statistik) und Formatierung
```

Die Spiellogik eines Spiels ist von der Oberflaeche getrennt und rein
funktional: jeder Zug erzeugt einen neuen Zustand, testbar ohne Browser.

## Online-Spielername

Der Name, unter dem du online spielst, gilt **fuer alle Spiele der Sammlung**.
Er wird beim Tippen gespeichert, und jedes Online-Startfenster fuellt sein Feld
damit vor - egal, in welchem Spiel du ihn zuletzt eingegeben hast.

Frueher hatte jedes Spiel seinen eigenen: Der Name fuer Binokel war fuer Skyjo
unbekannt, und der bei Drecksau eingetippte wurde gar nicht erst gespeichert.
Niemand haelt sich pro Spiel fuer jemand anderen - der Name gehoert zum
Spieler, nicht zum Tisch, an dem er gerade sitzt
([online/player-name.ts](website/src/online/player-name.ts)).

Wer vorher schon einen Namen in einem Spiel hinterlegt hatte, verliert ihn
nicht: Beim ersten Mal wird der aelteste noch vorhandene uebernommen, danach
gibt es nur noch den einen Schluessel.

## Sprachchat

Alle Online-Spiele haben einen **Sprachchat**. Der Ton geht **direkt von
Gerät zu Gerät** (WebRTC) und nicht über einen Server - was auch der einzige
Weg ist, denn hinter dieser Seite steht keiner. Der Raum, den ihr ohnehin
teilt, dient nur dazu, dass sich die Browser finden.

**Stumm ist der Anfangszustand**, und das Mikrofon wird gar nicht erst
angefragt, bis jemand zum ersten Mal auf „Mikro an" drückt. Wer nie sprechen
will, bekommt nie einen Berechtigungsdialog. Zuhören läuft von selbst.

Ob dein Mikrofon offen ist, zeigt ein **Mikrofonsymbol**: **rot**, solange du zu
hören bist, und **grau durchgestrichen**, solange nicht. Nicht nur die Farbe
entscheidet - der Strich sagt dasselbe noch einmal, für alle, die Rot und Grau
schlecht auseinanderhalten. Rot ist bewusst der laute Zustand: Es ist die Farbe,
die überall sonst „nimmt gerade auf" bedeutet.

Wie **laut** die anderen sind, stellt ein Regler unter dem Mikrofonknopf ein -
von voll bis stumm. Die Einstellung gilt für alle Online-Spiele und hält bis zum
nächsten Mal. Sie betrifft nur, was bei dir ankommt: Wer dich hört, hört dich
unverändert, egal wie leise du ihn gedreht hast.

Der Regler ist von der Lautstärke der **Spielgeräusche** getrennt (die hat
Panzerkiste über dem Feld). Man kann also stumm gestellte Panzer mit lautem
Gespräch haben oder umgekehrt - genau deshalb sind es zwei Regler und nicht
einer.

Neben jedem Mitspieler steht, ob die Leitung steht. Das ist kein Schmuck: Bei
manchen Netzen kommen zwei Geräte nicht direkt zueinander, und dann braucht es
einen **Relais-Server (TURN)** - das einzige Stück, das eine statisch gehostete
Seite nicht selbst mitbringen kann. Ohne einen solchen Server bleibt es für
diese wenigen still, und dann soll wenigstens dastehen, warum.

Ein Relais wird über Umgebungsvariablen eingehängt, falls du eins hast:

```bash
NEXT_PUBLIC_TURN_URL=turns:beispiel.de:5349
NEXT_PUBLIC_TURN_USER=benutzer
NEXT_PUBLIC_TURN_PASSWORD=geheim
```

Ohne diese Angaben läuft alles Übrige unverändert weiter.

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

Eine Ausnahme gibt es: Die **Bestenliste von RV There Yet?** ist global und
liegt deshalb in der Firebase-Datenbank, die auch die Online-Raeume traegt
(unter `rooms/rv-there-yet-__best`, weil die Sicherheitsregeln nur `rooms/`
abdecken). Wer eine Fahrt von Abschnitt 1 bis ans Ziel schafft, darf sich mit
Namen und Zeit eintragen - offline gefahren genauso wie online. Alles Weitere
steht im [Spiel-README](website/src/games/rv-there-yet/README.md#bestenliste).

### Ein weiteres Spiel hinzufuegen

Die Speicher- und Statistik-Schicht ist bewusst spielunabhaengig. Fuer ein neues
Spiel reicht:

1. In [registry.ts](website/src/games/registry.ts) eine `GameId` und einen
   Eintrag (Name, Tagline, Emoji, `href`) ergaenzen.
2. Ein eigenes Modul `website/src/games/<spiel>/` anlegen (Engine, Komponenten,
   Texte) samt einer `isGameState`-Pruefung fuer gespeicherte Staende.
3. Eine Route `website/src/app/<spiel>/page.tsx` erstellen, die die
   Spielkomponente rendert.
4. Ein Cover-Bild als `assets/logo.webp` ablegen und in
   [game-logos.ts](website/src/games/game-logos.ts) eintragen.

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
  `docs/games/<spiel>/`:
  [Drecksau](docs/games/drecksau/game-rules.md) ·
  [Binokel](docs/games/binokel/game-rules.md) ·
  [Panzerkiste](docs/games/panzerkiste/levels.md) ·
  [Krakel Orakel](docs/games/krakel/game-rules.md) ·
  [Skyjo](docs/games/skyjo/game-rules.md) ·
  [RV There Yet?](docs/games/rv-there-yet/route-map.md)
