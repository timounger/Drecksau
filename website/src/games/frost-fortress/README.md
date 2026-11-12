# Frost Fortress

Survival, Basisbau und Tower Defense im ewigen Winter. Aus einem kleinen Lager
mit Hauptquartier wird eine Festung, die Welle um Welle standhält. Eigenes
Spiel dieser Sammlung; Grafik (Canvas) und Ton (WebAudio) sind selbst erzeugt,
das Cover-Logo stammt aus denselben Zeichenfunktionen.

Die Regeln mit allen Zahlen stehen in `docs/games/frost-fortress/game-rules.md`.

## Aufbau

| Ordner        | Inhalt                                                                                                   |
| ------------- | -------------------------------------------------------------------------------------------------------- |
| `engine/`     | Spiellogik ohne DOM: Karte, Gebäude, Wirtschaft, Kampf, Wellen, Forschung, Wetter, Ereignisse, Speichern |
| `components/` | Canvas-Zeichnung (Gelände-Kacheln, Bauten, Figuren, Effekte, Licht) und die Panels                       |
| `hooks/`      | `use-frost-game.ts`: Bildschleife, Kamera, Maus/Touch/Tasten, Autosave, Statistik                        |
| `audio/`      | synthetische Töne mit Mindestabstand je Klang                                                            |
| `settings/`   | Einstellungen (Spielmodus, Tempo, Reichweite der Türme, Ton, Kanten-Scrollen, Schadenszahlen, Autosave)  |
| `stats/`      | eigene Statistik-Karte                                                                                   |
| `storage/`    | Autosave und Spielstand von Hand                                                                         |
| `i18n/`       | Texte und Regeln                                                                                         |

## Technik

- Ein veränderliches `Game`-Objekt, das die Bildschleife bis zu 30 Mal je
  Spielsekunde rechnet (`MAX_SLICE`); React erfährt nur alle 150 ms davon.
- Gegner laufen über ein Flussfeld (Dijkstra vom HQ), das nur neu berechnet
  wird, wenn Bauten dazukommen oder verschwinden. Türme suchen Ziele über ein
  räumliches Raster (4 x 4 Felder je Zelle).
- Gegner, Geschosse und Partikel kommen aus Pools; das Gelände wird einmal in
  16 x 16-Felder-Kacheln gemalt und danach nur kopiert, die Dunkelheit wird in
  Viertel-Auflösung gezeichnet.

## Bedienung

Linksklick wählt/baut, Rechtsklick oder Esc bricht ab, Mausrad zoomt,
WASD/Pfeile (und der Bildrand) bewegen die Karte, Leertaste pausiert, 1-3
setzen das Tempo. Ein grüner Pfeil an einem Bau heißt: jetzt ausbaubar - ein Klick
darauf baut aus. Im Baumenü lässt sich die Stufe wählen, in der gebaut wird.
Im Spielmodus „Freies Bauen“ kommen keine Wellen von selbst; Gegner und
verbündete Soldaten ruft man in der rechten Leiste. Der Knopf „Cheat-Modus“ oben schaltet alles frei, füllt alle Lager
dauerhaft, streicht die Bauzeiten und bietet zusätzlich 10x und 100x; eine
Partie mit Cheat zählt für keine Bestwerte. Mauern lassen sich ziehen, Baustellen per Ziehen
verschieben. Am Handy: Tippen baut/wählt, Ziehen verschiebt, zwei Finger
zoomen, die Seitenleisten klappen ein.

## Balance prüfen

Eine Headless-Simulation der Engine (Bot ohne Bau, einfacher Bot, wachsender
Bot) ist kein Teil des Repos; sie lief mit `npx tsx --tsconfig tsconfig.json`
gegen `engine/engine.ts`. Ergebnisse stehen in der Doku unter "Balance".

## Test-Abkürzungen

`?ff=night,storm,rich,tech,fast,wave8` - nur zum Ausprobieren, nirgends
verlinkt.
