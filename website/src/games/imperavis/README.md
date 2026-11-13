# IMPERAVIS

Historisch angehauchte Aufbau- und Wirtschaftssimulation in 3D: Inseln
besiedeln, Produktionsketten aufbauen, Bürger versorgen und aufsteigen lassen,
Schiffe bauen und Handelsrouten zwischen den eigenen Inseln ziehen - gegen bis
zu drei KI-Rivalen mit Diplomatie (auch untereinander), Seekrieg,
Landtruppen, Aufträgen im Wettlauf, Ereignissen und Forschung. Eigenes
Spiel dieser Sammlung - Name, Gebäude, Inselnamen, Zahlen, Grafik (prozedurale
Low-Poly-Modelle mit three.js) und Ton (WebAudio) sind selbst erzeugt, es gibt
keine externen Assets.

Die Regeln mit allen Zahlen stehen in `docs/games/imperavis/game-rules.md`.

## Aufbau

| Ordner        | Inhalt                                                                                                                                                                                                                                             |
| ------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `engine/`     | Simulation ohne DOM und ohne three.js: Welt, Inseln, Gelände, Gebäude, Straßen, Wirtschaft, Bevölkerung, KI, Diplomatie, Kampf, Aufträge, Ereignisse, Forschung                                                                                    |
| `render/`     | three.js-Ansicht: Kamera, Gelände, Wasser, Modelle, Instancing, Licht, Wetter, Rauch; `input.ts` liest Maus, Touch, Rad und Tasten an einer Stelle                                                                                                 |
| `components/` | React-Oberfläche über der Karte im eigenen Stil (`imperavis.css`, Symbole in `icons.tsx`, Bausteine in `ui.tsx`): Ressourcenleiste, Inselübersicht, Baumenü, Objektfenster, Verwaltung, Minimap und Weltkarte, Meldungen, Hauptmenü, Einstellungen |
| `hooks/`      | `use-imperavis.ts`: Spielschleife mit festem Takt, Befehle, Werkzeuge, Tastenbefehle, Speichern, Autosave, Statistik; `orders.ts`: Auswahl, Gruppen und Befehle an Einheiten; `news.ts`: Meldungen aus Ereignissen und Zustand                     |
| `audio/`      | synthetische Klänge, Meeresrauschen, Regen, Vögel, eine leise Melodie                                                                                                                                                                              |
| `settings/`   | Einstellungen (Ton, Schatten, Wettereffekte, Autosave, Kamera am Bildschirmrand, Starttempo)                                                                                                                                                       |
| `stats/`      | eigene Statistik-Karte                                                                                                                                                                                                                             |
| `storage/`    | Autosave und drei Spielstände von Hand                                                                                                                                                                                                             |
| `i18n/`       | Texte und Regeln                                                                                                                                                                                                                                   |

### Systeme (Abschnitt 21 der Vorgabe)

| System            | Datei(en)                                                                                     | Stand  |
| ----------------- | --------------------------------------------------------------------------------------------- | ------ |
| WorldManager      | `engine/world.ts`                                                                             | fertig |
| IslandManager     | `engine/islands.ts`                                                                           | fertig |
| TerrainSystem     | `engine/terrain.ts`, `engine/noise.ts`                                                        | fertig |
| BuildingSystem    | `engine/buildings.ts`, `engine/placement.ts`, `engine/buildings-data.ts`, `engine/derived.ts` | fertig |
| RoadSystem        | `engine/roads.ts` (Straßen, Pflaster), `engine/pathfinding.ts` (A\*, Dijkstra)                | fertig |
| (Logistik)        | `engine/logistics.ts`, `engine/logistics-data.ts` (Wege der Karren, Tempi)                    | fertig |
| PopulationManager | `engine/population.ts`, `engine/tiers.ts`                                                     | fertig |
| EconomyManager    | `engine/economy.ts`                                                                           | fertig |
| ProductionManager | `engine/production.ts`                                                                        | fertig |
| ResourceManager   | `engine/goods.ts`                                                                             | fertig |
| WarehouseManager  | `engine/warehouse.ts` (Lager, Karren)                                                         | fertig |
| ShipManager       | `engine/ships.ts`, `engine/ships-data.ts`, `engine/fleets.ts` (Flotten, Kriegsbefehle)        | fertig |
| TradeRouteManager | `engine/trade-routes.ts`                                                                      | fertig |
| AIManager         | `engine/ai.ts` (KI-Spieler), `engine/trader.ts` (freier Händler), `engine/players.ts`         | fertig |
| TimeManager       | `engine/time.ts` (Takt, Tag, Jahreszeit, Wetter)                                              | fertig |
| SaveManager       | `engine/save.ts`, `storage/save-store.ts`                                                     | fertig |
| CameraController  | `render/camera.ts`                                                                            | fertig |
| UIManager         | `components/`                                                                                 | fertig |
| AudioManager      | `audio/sounds.ts`                                                                             | fertig |
| DiplomacyManager  | `engine/diplomacy.ts`                                                                         | fertig |
| CombatManager     | `engine/combat.ts`, `engine/troops.ts` (Landtruppen), `engine/units-data.ts` (Einheiten)      | fertig |
| QuestManager      | `engine/missions.ts`                                                                          | fertig |
| (Ereignisse)      | `engine/incidents.ts`                                                                         | fertig |
| (Forschung)       | `engine/research.ts`, `engine/research-data.ts`                                               | fertig |
| (Einführung)      | `engine/tutorial.ts`, `engine/tutorial-data.ts`, `components/tutorial-panel.tsx`              | fertig |

Befehle (`engine/commands.ts`) sind reine Datenobjekte mit der ID des
Spielers (`PlayerCommand`), die zwischen zwei Takten angewendet werden; die
KI-Spieler benutzen genau dieselben Befehle wie der Mensch. Alle Zufälle
kommen aus dem Zufallszustand des Spiels, die Zeit läuft in festen Schritten
von 0,1 Spielsekunden. Dieselbe Saat, dieselben Einstellungen und dieselben
Befehle ergeben dasselbe Spiel - ein geladener Spielstand läuft Schritt für
Schritt genauso weiter wie das Original.

### Mehrspieler-Architektur

Vorbereitet, nicht gebaut (es gibt keinen Mehrspieler-Knopf): Ein Server
müsste je Takt die `PlayerCommand`s aller Spieler sammeln, in fester
Reihenfolge anwenden und an alle Teilnehmer verteilen (Lockstep). Auch die
Befehle dieser Runde tragen die Spieler-ID: `train`, `embark`, `land` und
`missionAccept` für den Wettlauf um einen Auftrag eines anderen Spielers. Weil der
Zustand nur aus Saat, Einstellungen und Befehlen folgt, reicht zum Abgleich
ein Prüfwert über `toSave()`. Jeder Spieler hat seine eigene Kasse,
Forschung und Freischaltung (`game.players`), Besitz hängt an den Inseln
(`island.owner`), an Schiffen (`ship.owner`) und Routen (`route.owner`).

## Technik

- Die Welt (Höhenkarte, Gelände, Flüsse, Vorkommen, Fruchtbarkeit, Namen)
  entsteht rein aus Saat und Größe und wird nicht gespeichert; ein Spielstand
  enthält nur das, was der Spieler verändert hat (rund 15 bis 30 KB).
- Abgeleitete Raster (belegte Felder, Baugebiet, Reichweite öffentlicher
  Gebäude, Wege der Karren von jedem Lager zu jedem Betrieb) werden nur bei
  Bauänderungen neu berechnet, nicht in jedem Takt; die Wege nur auf den
  Inseln, auf denen sich Straßen, Gebäude oder fertige Lager geändert haben.
  Nach jedem Befehl des Menschen (Bauen, Straße, Pflastern, Abriss,
  Versetzen) geschieht das sofort, damit die Ansicht auch in der Pause gleich
  neu zeichnet (`game.version`).
- Logistik: Produktion und Transport sind getrennt. Jeder Betrieb arbeitet
  in sein eigenes kleines Lager, mit oder ohne Straße; Karren holen ab und
  bringen Rohstoffe über Straßen (3 Felder/s, gepflastert 4,5) oder über das
  Gelände (Wiese 1,2, Fels 0,9, Wald 0,75 Felder/s). Die Tempi stehen in
  `engine/logistics-data.ts`, die Tabelle in der Doku unter "Lager und Karren".
- Pause: Möwen, Bewohner, Karren, schaukelnde Schiffe, Mühlen, Wracks, Rauch,
  Regen und Blitze stehen still (eigene Uhr der Ansicht, die nur läuft, wenn
  das Spiel läuft); nur das Wasser bewegt sich weiter. Regen, Donner, Stadt-
  und Hafengeräusche schweigen, das Meer wird leiser. Pausenmenü und
  verborgener Tab zählen als Pause.
- Gebäude werden je Modell (Art, Schicht und Ausbaustufe) als ein `InstancedMesh`
  gezeichnet, Bäume in Kacheln zu 24 x 24 Feldern (Frustum Culling je Kachel,
  einfachere Bäume in der Ferne), Karren, Bewohner und Möwen ebenfalls
  instanziert, Rauch und Regen als Partikel-Pools.
- three.js wird nur auf der IMPERAVIS-Seite geladen, und dort erst beim
  Spielstart (`import()` der Ansicht).
- KI mit Taktbudget: jede KI denkt alle 3 s (versetzt), höchstens 1500
  Bauplatzprüfungen (mit billiger Vorprüfung) und 6 Straßensuchen je
  Gedanke; nach einem Bau trägt sie nur die neuen Felder ein, statt alle
  abgeleiteten Raster neu zu rechnen. Diplomatie alle 45 s. Kampf und
  Landtruppen schlagen alle 0,5 s zu, Bevölkerung, Forschung und Aufträge
  laufen im Sekundentakt, Diplomatie alle 10 s.
- Seewege: Kostentabelle und Wasserflächen (welches Wasser mit welchem
  verbunden ist) entstehen beim Erzeugen oder Laden des Spiels, nicht im
  Takt; ein Ziel in nicht verbundenem Wasser wird ohne Suche abgelehnt. Die
  Zuordnung der Betriebe zu Lagern sucht in wiederverwendeten Puffern. Das
  langsamste Takt-Stück auf der großen Karte mit drei KI: 6 bis 11 ms
  (vorher 31 bis 40 ms).
- Karren und Bewohner weiter als 70 Felder vom Blickpunkt werden nicht
  gezeichnet; Schiffe tragen eine Flagge in der Farbe ihres Besitzers und bei
  Schaden einen Lebensbalken. Belastete Straßen, Routenlinien,
  Kanonenkugeln und Schiffbrüchige sind eigene, gebündelte Überlagerungen.

## Bedienung

Neues Spiel: Kartengröße, Zahl der KI-Gegner (0 bis 3),
"Friedliches Spiel" (kein Krieg, keine Piraten) und "Geführter Einstieg"
(Standard an, siehe unten); die Saat ("Startwert der
Welt") ist nur bei eingeschaltetem Cheat-Modus zu sehen, sonst wird sie
gewürfelt. Der Knopf "Cheat-Modus" in der Kopfzeile gibt unendlich Gold und
volle Lager auf allen eigenen Inseln (`engine/cheat.ts`) sowie die Tempi 10x
und 100x, erledigt alle Forschungen, macht jedes Gebäude ohne Voraussetzung
baubar (auch an der Einführung vorbei, die aber weiterläuft) und hebt alle
fertigen eigenen Wohnhäuser auf wohlhabende Bürger, voll und mit allen
Bedürfnissen erfüllt; ausgeschaltet kommt das Gold von vorher zurück, die
Forschung bleibt, Freischaltung und Häuser folgen wieder den normalen
Regeln. Partien mit Cheat
zählen nicht für die Bestwerte der Statistik.

Der Bildschirm (Neugestaltung im Stil des Industriezeitalters: dunkles Holz,
Messing, Gold; Überschriften in Cinzel, nur auf dieser Seite geladen) liegt
als Raster über der Karte, damit sich nichts überdeckt:

- oben die Ressourcenleiste: Spieler mit Wappen, Insel und Entwicklung,
  Gold mit Einnahmen, Ausgaben und Trend, Einwohner je Schicht, die
  wichtigsten Waren (alle im aufklappbaren Warenfenster), Zufriedenheit,
  Datum, Wetter, Forschung, Krieg und ganz rechts das Tempo (Pause, 1x, 2x, 3x;
  Plus/Minus wechseln es);
- links die einklappbare Inselübersicht (Wappen, Einwohner, Bilanz,
  Gebäude, Lager, Baufläche, Fruchtbarkeit, Vorkommen, Produktion,
  Versorgung, Hafen) mit dem Weg zur Liste aller Inseln;
- rechts die Meldungen, das Objektfenster mit Registerkarten und Aktionen
  (Verbessern, Reparieren, Produktion stoppen, Vorrang, Versetzen, Abreißen)
  und die Minimap mit dem Knopf zur Weltkarte;
- unten die Bauleiste mit acht Kategorien (Wohngebäude, Landwirtschaft,
  Produktion, Öffentliche Gebäude, Infrastruktur, Hafen, Militär,
  Dekoration), Abriss und Verwaltung (alle Übersichten in einem Fenster,
  neu mit Produktion und Engpässen).

Bauen: Kategorie (oder B für die zuletzt benutzte), dann Kachel. Die
Vorschau zeigt grün (mit Straße), gelb ("Ohne Straße: Transport langsamer")
oder rot mit Grund; im Bau-, Straßen- und Pflastermodus zeigt ein farbiger
Punkt über jedem eigenen Betrieb seine Anbindung (grün Straße, gelb Gelände,
rot kein Weg). Pflastern: Werkzeug "Pflastern" in Infrastruktur oder
Umschalt plus T, dann über eine Straße ziehen (je Feld 5 Gold, 1
Steinquader). Das Objektfenster eines Betriebs hat den Reiter "Logistik"; Linksklick
setzt, der Baumodus bleibt (außer beim Kontor). Rechtsklick oder Esc bricht
ab, R oder Umschalt plus Mausrad drehen, das Mausrad allein zoomt auch im
Baumodus.

Maus: Linksklick wählt (ins Leere: Auswahl weg), Umschalt plus Klick
ergänzt, linke Taste ziehen zieht ein Auswahlrechteck für eigene Schiffe
und Soldaten an Land (nie Gebäude). Rechtsklick gibt den gewählten
Einheiten einen Befehl: Schiffe fahren in kleiner Formation aufs Wasser
(eine ganze Flotte gemeinsam), legen an einem Kontor oder Hafengebäude an
oder greifen im Krieg ein feindliches Schiff oder Gebäude an (`shipAttack`,
sie verfolgen es); Einheiten marschieren über das Land ihrer Insel (Befehl
`march`) oder greifen eine feindliche Einheit, ein Gebäude oder ein Schiff am
Ufer an (`unitAttack`). Mittlere Taste
ziehen verschiebt, rechte Taste ziehen dreht und neigt (begrenzt), das Rad
zoomt weich zum Mauszeiger (mit Strg schneller). Klick und Ziehen trennt
eine Schwelle von 6 Pixeln, ein Klick bewegt die Kamera nie. Über Fenstern
scrollt das Rad das Fenster, nie die Seite. Hover hebt Gebäude (Umriss),
Schiffe und Soldaten (Ring) hervor; nach kurzer Pause folgt ein Tooltip mit
Name, Besitzer und Zustand. Die Kamera bewegt sich mit WASD/Pfeilen und
am Rand der Spielfläche (abschaltbar in den Einstellungen; nur über der
Karte, nicht über Fenstern, und nur mit Fokus), mit Geschwindigkeit je
Sekunde passend zur Höhe, gedämpft und unabhängig von der Bildrate, über
dem Gelände und in der Karte.

Tasten: Q/E drehen, B Baumenü, R drehen, T Straße, Umschalt plus T
Pflastern, X/Entf Abriss, Tab und
Umschalt plus Tab die nächste oder vorige eigene Einheit (die Kamera fährt
hin), 1-9 Steuergruppen (Strg plus Zahl speichert, zweimal schnell fährt
die Kamera hin), Plus/Minus das Tempo, Leertaste Pause, Esc in Stufen:
Werkzeug, Fenster, Auswahl, Pausenmenü. Keine Taste wirkt in Eingabefeldern,
in einem offenen Dialog oder mit Strg/Alt außer Strg plus Zahl. Alle
Eingaben liest `render/input.ts`; es entfernt beim Verlassen alle Listener.
Auswahl und Gruppen sind reiner Bildschirmzustand und werden nicht
gespeichert. Alle Symbole und Knöpfe haben Tooltips. Meldungen gehen von selbst, wichtige (Krieg, Eroberung, Schulden,
Angriff auf ein Kontor, gesunkenes Schiff) bleiben bis zur Bestätigung.
Große Bildschirme vergrößern alles (`--imp-scale`: 1,3 ab 2200 x 1250, 1,65
ab 3000 x 1700, 2 ab 3600 x 2000). Am Handy: eine Spalte, immer nur ein
Fenster, Symbolleiste unten; tippen wählt und baut, mit einem Finger
verschieben, mit zwei Fingern zoomen und drehen; Schiffe steuert dort der
Knopf "Ziel setzen".

Werft: Ein Klick auf die eigene Werft öffnet ihr Fenster groß in der Mitte
(`components/shipyard-panel.tsx`): links Helling und Warteschlange (bis 5
Aufträge, Fortschritt, Restzeit, "Abbrechen"), rechts Handels- und
Kriegsschiffe als Kacheln mit Bild (`components/unit-art.tsx`), allen
Werten, Kosten (rot, was fehlt) und Freischaltung. Bezahlt wird beim
Annehmen, gebaut mit Arbeitskräften; das fertige Schiff legt auf freiem
Wasser vor der Werft ab, sonst wartet die Werft. Abbrechen gibt beim Schiff
auf der Helling 50 % des noch nicht verbauten Anteils zurück, bei wartenden
Aufträgen alles.

Schiffe: Das Schiffsfenster hat die Karte "Befehle" (`components/ship-orders.tsx`):
Bewegen und Anhalten; Handelsschiffe "Route erstellen", "Route starten" /
"Route stoppen" (Laden und Entladen unter "Ladung"); Kriegsschiffe
Angreifen (Ziele in der Nähe oder Rechtsklick auf ein feindliches Schiff oder
Gebäude), Patrouillieren (zweiten Punkt auf der Karte wählen), Eskortieren
und "Flotte bilden". Mehrere gewählte Schiffe bilden eine Flotte; ein
Rechtsklick aufs Wasser bewegt sie gemeinsam im Tempo des langsamsten.
Liegt ein Schiff an einem eigenen Kontor, lädt "Baustoffe für ein Kontor
laden" die 10 Bretter und 4 Werkzeug für die nächste Insel; "Insel
besiedeln" erscheint vor jeder freien Insel. Je Insel steht ein Kontor; das
Baugebiet wächst mit Lagerhäusern und Marktplätzen.

Landtruppen: Die Kaserne öffnet groß (`components/barracks-panel.tsx`) mit
der Ausbildungsschlange (bis 10, anhalten, abbrechen) und elf Einheiten in
vier Kategorien (`engine/units-data.ts`). Rechtsklick ins Gelände
marschiert, auf eine feindliche Einheit, ein Gebäude oder ein Schiff am Ufer
greift an; im Fenster der Auswahl Formation (Linie, Block, locker), Position
halten, Rückzug und Patrouille. Ein Schiff vor der Küste ihrer Insel (kein
Kontor nötig) holt sie mit "Einschiffen" an Bord, oder Truppen wählen und
rechts auf das eigene Schiff klicken; Schiffe vor einer eigenen Werft werden
schnell repariert; "Angriff: Insel" schickt es zu
einer Insel eines Feindes im Krieg, "Absetzen: Insel" bringt sie auf jede
andere Insel (eigen, frei oder eines Rivalen); Truppen auf dem Land eines
Rivalen im Frieden verärgern ihn bis hin zur Kriegserklärung. Verteidigt wird von selbst. Die Verwaltung hat die
Registerkarte "Militär" (`components/military-view.tsx`). Im Fenster
Aufträge zeigt "Konkurrenz", welche Rivalen denselben Auftrag der Krone
verfolgen.

## Geführter Einstieg

Die Einführung (`engine/tutorial-data.ts` als Daten, `engine/tutorial.ts`
als Ablauf) führt in zwölf Aufgaben vom Schiff über Kontor, Holzfäller,
Straße (nur empfohlen), Sägewerk, Häuser, Fischerei, Markt und Kapelle und 40 Einwohner zu
den Arbeitern, ihrer Stoffkette und ihrem Wirtshaus. Sie hält Gebäude nur
zusätzlich zur normalen Freischaltung zurück, auch im Befehl `build`
(Grund `tutorial`, nur beim Menschen), überspringt schon erledigte
Aufgaben, prüft nach Ereignissen statt in jedem Takt und wird mit dem Spiel
gespeichert (`game.tutorial`; alte Spielstände laden mit Einführung aus).
Das Aufgabenfenster (`components/tutorial-panel.tsx`) zeigt nur die
aktuelle Aufgabe mit Fortschritt, "Zeigen" und "Einführung beenden"
(endgültig, Befehl `tutorialEnd`, auch im Pausenmenü). Das Baumenü zeigt
verfügbar, gesperrt (mit der Aufgabe, nach der es frei wird) und empfohlen
(Goldrahmen, Leuchten, Abzeichen; Stern an der Kategorie). Das Schiffsfenster
bietet vor einer freien Insel "Insel besiedeln" und setzt das Kontor sofort
auf den nächsten erlaubten Küstenplatz - ein Klick, der auch am Handy ohne
Zielen geht; den Platz frei wählen kann man weiter über das Baumenü. Die
Schritttabelle steht in der Doku unter "Einführung".

## Stand der Vorgabe

Erledigt (Phasen 1-8, dazu die Prüfungen aus Phase 9):

- Phasen 1-5 wie bisher: prozedurale Inselwelt, Bauen mit Prüfungen, Straßen
  und Karren mit A*, Ketten, Bevölkerung, Wirtschaft, Zeit und Wetter,
  Schiffe, Handelsrouten, freier Händler, Menü, Speichern, Statistik. Jetzt
  27 Waren und 43 Gebäude (seit "Flotte und Heer" 30 Waren und 53 Gebäude
  samt Zierden).
- Phase 6: KI-Spieler (0 bis 3, Standard 2) mit Name, Farbe und Charakter
  (Händler, Kriegerisch, Expansionist), die mit denselben Befehlen bauen,
  Inseln besiedeln, Routen fahren, handeln, forschen und auf Mangel,
  Geldnot und Krieg reagieren. Diplomatie mit Meinung und Ruf samt Gründen,
  Handelsabkommen, Pakt, Bündnis, Frieden, Krieg, Geschenke, Forderungen,
  Warentausch; Antworten mit Grund; Angebote der KI an den Spieler.
  Militär: Kriegsschiff, Fregatte, Galeone mit Kanonen, Wachturm,
  Küstenbatterie, Lebenspunkte, Rüstung, Reichweite, Eroberung von Kontoren,
  Reparatur im Hafen, friedliches Spiel.
- Phase 7: Aufträge (8 Arten) mit Zielen, Fortschritt, Belohnung, Zeitlimit,
  Schwierigkeit und Bedingung, von der Krone und von Rivalen. Ereignisse:
  Feuer (Feuerwache), Seuche (Medikus), Sturm, Piraten, gute Ernte,
  Missernte. Forschung (11 Felder) schaltet Ingenieure, gehobene Schicht und
  wohlhabende Bürger mit Glas, Instrumenten, Tabakwaren und Schmuck frei,
  dazu Galeone und Fregatte, Küstenbatterie und Produktivitätsboni. Häuser
  steigen bei schlechter Versorgung ab.
- Phase 8: Straßenverkehr mit Stau (sichtbar gelb bis rot), Ausbaustufe 2
  für Betriebe, Lager, Kontor und Gelehrte (sichtbar), mehr Lagerplatz und
  doppelte Stoffleistung der Weberei, Routenlinien und Vorrang je Ware,
  Ton nach Lage (Stadt, Hafen, Baustelle, Kampf), Starthinweis nur ohne
  Kontor.

- Runde "mach weiter mit dem rest": KI baut ihre Ziegel-, Stein-, Wein-
  und Forschungsketten gezielt (Gelehrtenhäuser, Lehm-Kolonien,
  angepasste Routen, Kauf fehlender Baustoffe), forscht 5 bis 7 Felder
  (Händler); KI-Diplomatie untereinander mit Zwischenfällen, Streit um
  Inseln, Verträgen, Kündigungen, Geschenken, Forderungen, Warentausch,
  Kriegen samt Bündnispflicht und Friedensschlüssen; Expansionist mit
  billigerem Unterhalt und ohne Schulden; KI nimmt Aufträge der Krone an
  (Wettlauf, sichtbar im Fenster); Landtruppen mit Kaserne, Truppenplätzen,
  Landung, Sturm, Verteidigung und KI-Einsatz; Takt-Spitzen unter 16 ms;
  Meldungen am Handy ohne Überdeckung; Bildrate gemessen (LOD lohnte nicht);
  Speicherformat 3.

- Runde "UI-Neugestaltung": neuer Bildschirm (siehe Bedienung), Dekoration
  als achte Baukategorie mit sieben Zierden (eigene Modelle, Zufriedenheit
  über die Reichweiten, höchstens +15), Sofortreparatur (`repair`), Vorrang
  der Karren (`priority`), Minimap und Weltkarte, Meldungen aus dem Zustand,
  Tempo 1x/2x/3x (Cheat 10x/100x), Gebäude belegen ihre Felder sofort.
  Speicherformat bleibt 3 (fehlender Vorrang = aus).

- Runde "Geführter Einstieg": Einführung mit zwölf Aufgaben, Sperre im
  Befehl, Aufgabenfenster, drei Kachelzustände im Baumenü, "Insel
  besiedeln" am Schiff, Einstellung im Hauptmenü, Speichern ohne neues
  Format, Test-Flag `tutorial`.

- Runde "Logistik": Produktion getrennt vom Transport, Karren über Straßen
  und Gelände (Dijkstra je Lager, Wege je Insel zwischengespeichert),
  gepflasterte Straße, Ampel der Anbindung, Reiter "Logistik", Transport in
  der Verwaltung, Straßen-Aufgabe der Einführung als Empfehlung; Cheat mit
  Forschung, Freischaltung und Häusern; Bauen in der Pause sofort sichtbar;
  Pause hält Möwen, Regen, Rauch, Karren und Geräusche an. Speicherformat
  bleibt 3 (fehlendes `paved` = nur einfache Straßen).

- Runde "Flotte und Heer": Ausbau ohne automatische Fahne (nur Architektur:
  Anbau mit Schornstein, Steinkante, Stufen); weitere Kontore über "Baustoffe
  für ein Kontor laden" und "Insel besiedeln" mit genauer Meldung, was an Bord
  fehlt, und Kontor ohne Ladung im Cheat; Werftfenster mit Warteschlange,
  Abbruch und Ablegen auf freiem Wasser; acht Schiffstypen (vier Handel, vier
  Krieg; die alten IDs bleiben), Angriff, Patrouille, Eskorte und Flotten;
  elf Einheitenarten mit Ausbildungsschlange, Formationen, Halten, Rückzug,
  Patrouille, Angriff per Rechtsklick, Heilen, Reparieren und Aufklären;
  Militärübersicht; drei neue Waren (Musketen, Kanonen, Dampfmaschinen) mit
  Büchsenmacherei, Geschützgießerei und Maschinenbau; drei Forschungen
  (Geschützguss, Kriegskunst, Dampfkraft). Speicherformat 4 (1 bis 3 werden
  umgewandelt).

Offen: ein Mehrspielermodus mit Server (bewusst nicht gebaut). Die KI
erreicht in 120 Minuten Kaufleute, aber noch keine Ingenieure.

## Balance prüfen

Eine Headless-Simulation der Engine (nicht im Repo) lief mit `npx tsx` gegen
`engine/game.ts`: ein aktiver Bot für den Menschen und drei KI-Spieler über
120 Spielminuten auf fünf Karten. Sie zählt Forschung, Schichten, Inseln,
Sparzeiten, Diplomatie, Landungen und Auftrags-Wettläufe, misst jeden Takt
und prüft Speichern und Laden. Ergebnisse stehen in der Doku unter
"Balance".

## Test-Abkürzungen

`?imp=autostart,found,rich,tutorial,scholar,debug,ai=3,peace,seed=12345,size=small` -
nur zum Ausprobieren, nirgends verlinkt: `autostart` startet sofort, `found`
setzt das Kontor, `rich` gibt Gold, Waren und alle Gebäude ohne Forschung und schaltet die
Einführung aus, `tutorial` erzwingt die Einführung (auch mit `found` und
`rich`; sie springt dann über das schon Erledigte),
`scholar` erledigt die Forschungen ohne Vorbedingung, `ai=0..3` setzt die
Zahl der KI-Gegner, `peace` das friedliche Spiel, `debug` stellt
`window.imperavisDebug` für Browsertests bereit (Befehle, `run(s)`,
`spawn(owner, kind, x, y)`, `ignite(id)`, `grant(points)`, `stats()` mit
CPU-Zeit je Bild, Dreiecken und Draw Calls der Ansicht).
