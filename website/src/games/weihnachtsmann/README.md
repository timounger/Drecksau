# Weihnachtsmann & Co. KG

Top-Down-Spiel nach der Zeichentrickserie (1997): Auf einer verschneiten Karte
am Nordpol laufen alle acht Figuren herum - **Weihnachtsmann**, der Eisbär
**Balbo**, die Elfen **Jordi**, **Trixi** und **Gilfi**, die Trolle
**Grantelbart** und **Gugor** und das Rentier **Rudolf**. Der Spieler wählt,
wen er steuert, und wechselt jederzeit; alle anderen spazieren von selbst
umher. Trixi und Rudolf fliegen, Jordi verwandelt sich in sechs Tiere, der
Weihnachtsmann erkennt Wünsche, Grantelbart spielt E-Gitarre, Gugor
beobachtet den Weihnachtsmann durchs Fernrohr, Gilfi lässt Dinge schweben und
Balbo fällt hin.

Stufe 1: Figuren und Fähigkeiten. Stufe 2: die **echte Karte** (60 x 40
Felder) mit der **Weihnachtswerkstatt** - einer verschneiten Glaskuppel, in
der die Spielzeugmaschine steht -, dem **aufgemalten Tannenbaum**, von dem
der Weihnachtsschlitten startet, und **Grantelbarts Haus** voller Gitarren,
Verstärker und Kerzen. In beide Häuser kann man hinein (Überblendung an der
Tür), dazu der gefrorene Teich, das Rentiergehege und Wald rundherum.

Stufe 3: der **Adventskalender**. Die Karte ist auf 88 x 64 Felder
gewachsen; östlich und südlich der alten Karte führt der Adventsweg an
**26 Toren** vorbei (Steinbogen, Kalenderhütte, Tür in einer Schneemauer,
Riesengeschenk), jedes mit einem großen Nummernschild 1-26. Wer hineinläuft,
spielt das Minispiel dahinter; gewonnene Tore stehen offen und tragen einen
goldenen Stern, das nächste leuchtet und hat einen Pfeil. Unter dem Bild
zeigt der Adventskalender den Stand („12/26 Türchen“), nach dem letzten Tor
fliegt der Schlitten durchs Feuerwerk. Fertig sind die Minispiele 1-6, die
übrigen zeigen „Kommt bald“ - wie man eins baut, steht in
[`MINIGAMES.md`](MINIGAMES.md).

Stufe 4: das **Dorf** - Rentierstall, Poststube, Elfen-Backstube, Gugors
Sternwarte und Geschenkelager, jedes zum Hineingehen, mit Aufgaben und elf
neuen Erfolgen. Die Karte ist dafür auf 128 x 64 Felder gewachsen.

Teil 2: **draußen** - im Osten der Weihnachtsmarkt mit Karussell, der
Rodelhang, die Schneeballwiese, der gefrorene Wasserfall mit der Eishöhle,
der See zum Schlittschuhlaufen und die Tannenschonung; dazu zwölf goldene
Glöckchen auf der ganzen Karte, wilde Tiere, der Briefkasten mit Aufträgen,
Tag und Nacht mit Polarlichtern und Schneestürme. Zwölf neue Erfolge (53
insgesamt). Dazu vier **Schnee-Jetskis** zum Herumbrausen und der Erfolg
„Vollgas“ (54).

Route: `/weihnachtsmann`, Statistik (nur Spielzeit): `/weihnachtsmann/statistik`.
Regeln für Spieler: [`i18n/rules.ts`](i18n/rules.ts), Überblick für Entwickler:
[`docs/games/weihnachtsmann/game-rules.md`](../../../../docs/games/weihnachtsmann/game-rules.md).

## Steuerung

| Was                 | Tastatur                              | Gamepad      | Handy                           |
| ------------------- | ------------------------------------- | ------------ | ------------------------------- |
| Laufen              | Pfeiltasten / W A S D                 | Stick, Kreuz | Stick (im Feld Laufen ziehen)   |
| Figur wählen        | 1-8, Tab / Umschalt+Tab, Q / E, Klick | LB / RB      | Leiste, Figur antippen, Nächste |
| Fähigkeit           | Leertaste, F (T für Jordi)            | A            | Fähigkeit                       |
| Sprechen/Benutzen   | R                                     | B            | Sprechen / Benutzen             |
| Ins Haus / hinaus   | auf die Tür zulaufen                  | Stick, Kreuz | Stick oder Hinein               |
| In ein Tor          | davor stehen, Pfeil hoch              | Stick, Kreuz | Stick hoch oder Hinein          |
| Minispiel           | Pfeile, Leertaste, Maus               | Stick, A, B  | Stick, Aktion, Taste 2, Tippen  |
| Minispiel verlassen | Esc, Knopf unter dem Bild             | Back, Start  | Zurück                          |
| Tierwahl            | 1-6, Pfeile + Leertaste/Enter, Klick  | Kreuz + A    | Antippen                        |
| Tierwahl schließen  | Esc, T                                | B, X         | Abbrechen                       |

**Handy:** Die Touch-Steuerung erscheint, wenn das Gerät einen groben Zeiger
meldet (`pointer: coarse`) oder sobald man den Bildschirm zum ersten Mal
berührt; ein Mausklick schaltet zurück. Hochkant liegt das Bild über die ganze
Breite, darunter links das Feld Laufen (ein schwebender Analog-Stick: er
beginnt, wo der Daumen aufsetzt, und wandert mit, wenn der Daumen über den
Rand hinausrutscht) und rechts die Knöpfe; quer stehen Stick und Knöpfe links
und rechts neben dem Bild. Darunter eine Zeile mit der gewählten Figur, die
acht Porträts und ein schmaler Adventskalender. Bild, Steuerung und Leiste
passen zusammen auf einen Bildschirm (`touchRoom` misst, was neben und unter
dem Bild steht: `data-wm-side`, `data-wm-below`). Steht die Figur in einer
Tür oder vor einem Tor, erscheint über dem Bild der Knopf „Hinein“. Der
Knopf Sprechen heißt „Benutzen“, wenn etwas zum Benutzen vor der Figur
steht. In einem Minispiel heißen die Knöpfe Aktion, Taste 2 und Zurück;
Aktion und Taste 2 lassen sich halten (Gießen in 13, Schleichen in 26), und
das Feld füllt die Leinwand auch mit einem gebrochenen Maßstab. Bild, Stick
und Knöpfe fangen alle Gesten ab (kein Scrollen, Zoomen, Markieren, kein
Kontextmenü); über die Leiste lässt sich die Seite weiter scrollen.

Ein Klick auf eine Figur im Bild wählt sie ebenfalls. Einzelne Tasten
(Wechsel, Fähigkeit, Sprechen, Tierwahl) gehen als Befehl (`Action`) in eine
Warteschlange und werden im nächsten Simulationsschritt ausgeführt; gehaltene
Lauftasten liest jeder Schritt neu, ein kurzer Tipp zählt mindestens einen
Schritt (`Controls.tapped`).

R benutzt, was vor der Figur steht (ein kleines R neben dem Kopf zeigt es
an), sonst spricht sie: Spielzeugmaschine (baut ein Spielzeug, Puff und
Klingeln), Wunschzettel-Tafel, Sessel, Gitarren und Verstärker (Riff mit
Noten), Schlagzeug, Orgel, das Porträt, und am Tannenbaum der Schlitten - nur
der Weihnachtsmann fliegt ihn, Rudolf zieht, wenn er draußen ist: eine Runde
von 11 Sekunden über die Karte, die Kamera fliegt mit, danach stehen beide
wieder am Baum. Laternen gehen mit R aus (und wieder an), Schneemänner kippen
um (und stehen wieder auf); Grantelbart macht die Spielzeugmaschine kaputt,
eine Elfe repariert sie.

## Erfolge

54 Erfolge, mindestens einer je Figur und Fähigkeit - Liste und
Bedingungen in
[`docs/games/weihnachtsmann/game-rules.md`](../../../../docs/games/weihnachtsmann/game-rules.md#erfolge),
für Spieler im Regeln-Dialog. Daten: `engine/achievements.ts`
(`ACHIEVEMENTS`), Texte: `ACHIEVEMENT_TEXTS` in `i18n/texts.ts`. Ein neuer
Erfolg ist eine id in `ACHIEVEMENT_IDS` (`types.ts`), ein Eintrag in
`ACHIEVEMENTS`, Texte, ein Abzeichen im Generator (`achieve.py`, Name
`badge` + Id) und ein `unlock(state, id)` dort, wo es passiert - oder eine
Bedingung in `checkAchievements`. Nur die gesteuerte Figur zählt
(`steered`).

Was die Figuren in der Welt verändern (Laternen, Schneemänner, Schneewehen,
Fisch, Geschenk auf der Kuppel, kaputte Maschine), steht in
`GameState.world` (`engine/world.ts`) statt in der Karte, stellt sich nach
einer Weile selbst wieder her und wird nicht gespeichert; gezeichnet wird je
nach Zustand ein anderes Bild (`lampOff`, `snowmanHeap`, `driftFlat`,
`machineBroken` als Auflage). Das Banner zeichnet `render-world.ts` scharf
auf die Leinwand, den Dialog `achievements-panel.tsx`.

## Kino

Nördlich der Hauptstraße steht ein Kino (Grundriss 6 x 3 Felder bei 30,5,
Tür `CINEMA_DOOR` in `map-data.ts`, ein Weg führt hinauf). In der Tür Pfeil
hoch, R vor der Fassade (Spot `cinema`) oder auf dem Handy Hinein/Benutzen
startet eine Überblendung; am dunkelsten Punkt setzt `engine/cinema.ts`
`cinemaOpen`, der Hook hält die Simulation an und der Bildschirm öffnet
`components/cinema-panel.tsx` (ein `<dialog>`, Esc und „Kino verlassen“
schließen, danach `leaveCinema` mit Sperre bis zum Loslassen wie bei den
Toren). Die 26 Folgen (`EPISODES` mit YouTube-Id und dem Tor, dessen
Minispiel die Geschichte erzählt; Titel in `EPISODE_TITLES`) kommen vom
offiziellen TOGGO-Kanal über youtube-nocookie.com - der iframe entsteht erst
beim Klick auf eine Folge. `components/cinema-player.tsx` steuert ihn wie
Hitster über die IFrame-API per `postMessage` (`playVideo`, `pauseVideo`,
`seekTo`, `mute`/`unMute`, `setVolume`; Zeit und Zustand aus
`infoDelivery`/`onStateChange` nach `listening`) mit eigenen Knöpfen,
goldener Zeitleiste, Tastatur (Leertaste, Pfeile ±10 s) und Vollbild für den
eigenen Container (auf dem iPhone füllt er stattdessen das Fenster). Jede
Folge läuft nur von 1:04 bis 23:04 (`SHOW_FROM`/`SHOW_UNTIL`), die Uhr zeigt
0:00 bis 22:00; davor und dahinter wird nie gespielt, auch nicht beim Spulen.
Vom Player soll nichts zu sehen sein: `controls=0`, eine durchsichtige
Ebene über dem Bild fängt jeden Klick (Bild = Pause/Weiter), der Vorhang
deckt Laden, Pause und Ende ab, der iframe ist 7 % größer als die Leinwand
(schneidet die schwarzen Seitenbalken ab). Weil der Player beim ersten Lauf
drei Sekunden Titel und Knöpfe zeigt, läuft er 4 s vorher stumm hinter dem
Vorhang an (ab 1:00); bei 1:04 kommt der Ton und der Vorhang gleitet in
2,3 s auf. Beim Weiterspielen, Springen, Puffern und im Vollbild zeigt der
Player Titel und Knöpfe erneut; dann decken dunkle Streifen oben und unten
und ein goldenes Zeichen in der Mitte sie 4,5 s ab. Untertitel werden per
`unloadModule` abgeschaltet. Fehler meldet der Player per `onError`
(„Diese Folge ist gerade nicht verfügbar.“). Der Player bleibt für alle
Folgen derselbe: eine neue Folge lädt per `loadVideoById`, so läuft die
nächste nach dem 5-s-Countdown am Ende ohne neuen Klick mit Ton weiter.
`storage/cinema-store.ts` (`weihnachtsmann/cinema`, Version 2, Version 1
wird übernommen) merkt sich die zuletzt gestartete Folge, die Stelle je
Folge und die zu Ende geschauten; beim Öffnen setzt der Knopf
„Weiterschauen“ dort fort. Der Spielstand bleibt Version 4, der neue Erfolg
`movieNight` („Filmabend“) liegt einfach in seiner Liste.

## Das Dorf

Fünf Gebäude, jedes ein eigener Ort (`AreaId`) mit Tür, Raumbild, Möbeln
und Licht; Daten in `engine/building-data.ts`, Bilder auf dem eigenen Bogen
`assets/buildings-2x.png` (`components/building-atlas.ts`). Vor jeder Tür
zeigt `render-town.ts` ein Schild mit dem Namen (`BUILDING_NAMES`) und
„Pfeil hoch: hinein“; auf dem Handy erscheint Hinein wie bei allen Türen.

| Gebäude           | Grundriss (Zelle) | Tür außen | Innen   | Was man tut                                                                                                      |
| ----------------- | ----------------- | --------- | ------- | ---------------------------------------------------------------------------------------------------------------- |
| Elfen-Backstube   | 6 x 3 bei 18,6    | 20-21, 9  | 20 x 13 | Teig (R Schüssel) - Blechtisch - Ofen (8 s, nach weiteren 20 s verbrannt) - Kühlgitter (max. 3, Elfen naschen)   |
| Poststube         | 5 x 3 bei 36,5    | 38, 8     | 20 x 13 | Brief vom Berg (12, wächst alle 6 s), ins Fach seiner Farbe; der Weihnachtsmann liest ihn (Gedankenblase, 4 s)   |
| Gugors Sternwarte | 4 x 4 bei 53,6    | 54-55, 10 | 18 x 13 | großes Fernrohr: Rundblick über die Karte; Gugor (Fähigkeit oder R) sieht Verstecktes                            |
| Rentierstall      | 6 x 3 bei 40,33   | 42-43, 36 | 20 x 13 | Möhrenkiste, vier Boxen (Komet, Donner, Blitz, Tänzer, 90 s satt), Stroh: Rudolfs Nickerchen (Vorführung „nap“)  |
| Geschenkelager    | 8 x 4 bei 92,14   | 95-96, 18 | 28 x 18 | Labyrinth aus Paketstapeln, verlorenes Geschenk finden und in die Werkstatt tragen; Mauselöcher nur für die Maus |

- **Tragen** (`engine/carry.ts`, `Character.carry`): eine Sache je Figur -
  Möhre, Brief (mit Kontinent), Teig, Blech roh/fertig/verbrannt, Geschenk;
  gezeichnet neben dem Kopf. Durch eine Tür bleibt alles liegen außer dem
  Geschenk. Nicht gespeichert.
- **Rentierstall** (`engine/stable.ts`): `world.stable.full` je Rentier
  Sekunden bis Hunger, hungrige zeigen eine Gedankenblase mit Möhre. Stroh:
  nur Rudolf legt sich hin (`SHOWS.nap`, 7 s, Schnarch-Partikel `zzz`, Bild
  `rudolfSleep`).
- **Poststube** (`engine/post.ts`): Fächer nach Farbe/Kontinent (Europa blau,
  Amerika rot, Afrika gelb, Asien grün, Australien lila, Namen in scharfer
  Schrift über dem Regal). Sortierte Briefe zählen gespeichert
  (`counts.letters`).
- **Backstube** (`engine/bakery.ts`): Ofen leer/backt/fertig/verbrannt mit
  Glut, Glanz, Duft (Dampf) und Klingel. Gilfi zaubert dort Bleche statt
  Spielzeug (`FloatKind` „tray“); fällt Balbo dort hin, fliegen Mehl
  (`flour`) und Plätzchen (`cookie`) und das Gitter verliert ein Blech.
- **Sternwarte** (`engine/overview.ts`, `components/render-overview.ts`):
  `GameState.overview` - die Karte als kleines Bild (eine Farbe je Feld,
  einmal je Karte gemalt), Figuren als Punkte (drinnen: an der Tür ihres
  Hauses), Türchen (gold = geschafft), Häuser mit Kurznamen. Schließen: R,
  Leertaste, Esc oder Stick. Gugors Fernrohr _in_ der Sternwarte öffnet den
  Rundblick mit Zusatz: Lager von innen mit dem Geschenk, Fuchs-Versteck,
  Fisch.
- **Geschenkelager** (`engine/store.ts`): 9 x 5 Räume je 2 x 2 Felder, Wände
  aus einzelnen Stapeln (`P`, Bild per Zelle aus vier Varianten), Backtracker
  aus den Zufallszahlen des Zustands plus fünf Schleifen, sechs Mauselöcher
  (`m`, Gelände „gap“, nur `maus` darf hinein; nur in waagrechten Wänden, sonst
  verdeckt sie der Stapel davor). Das Geschenk liegt in einer der drei
  entferntesten Sackgassen. Alle 150 s wird neu gestapelt
  (`state.maps.giftStore` neu gebaut), aber nur, wenn die gesteuerte Figur
  nicht drin ist und keiner das Geschenk trägt; wer im Weg steht, kommt an
  den Eingang. 45 s nach dem Abliefern geht ein neues verloren.

Licht: Fenster und Laternen außen (`HOUSE_LIGHTS`), Raumlicht innen
(`ROOM_LIGHTS`), Ofenglut; dazu `shade` je Raum. Backstube und Poststube
haben rauchende Schornsteine (`CHIMNEYS`); „Warme Füße“ zählt weiter nur
Grantelbarts Schornstein.

## Draußen (Teil 2)

Alles im Osten (Spalten 88-123) und die Extras auf der ganzen Karte; Daten
in `engine/east-data.ts`, Ablauf in einem Modul je Attraktion (siehe
Aufbau), Zustand in `World.east` und `World.sky` - nichts davon wird
gespeichert außer den Erfolgen, den gefundenen Glöckchen
(`progress.bells`), Buden und Tierarten (`progress.stalls`,
`progress.critters`), Treffern und Aufträgen (`counts.hits`,
`counts.errands`) und der besten Rodelzeit in Zehntelsekunden
(`counts.sledBest`). Der Spielstand bleibt Version 4: die neuen Einträge
sind optional, ältere Stände lesen sich mit 0.

| Attraktion      | Wo (Zellen)                                                      | Bedienung                                                                                                                                                         |
| --------------- | ---------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Weihnachtsmarkt | 102-122 x 4-16                                                   | Weg von der Hauptstraße (Spalten 106-107). R an einer Bude (Punsch 104, Lebkuchen 110, Maronen 116, Zeile 5-6); R vor dem Karussell (110-114 x 10-11): 10 s Fahrt |
| Rodelhang       | 103-107 x 24-56                                                  | R am Schlittenstapel (109,22) setzt auf den Schlitten; Pfeil links/rechts lenken, hoch bremsen; Ziel Zeile 56,6; Erfolg unter 7 s                                 |
| Schneeballwiese | 110-122 x 20-28                                                  | R wirft in Blickrichtung (Taste zeigt R); Zielscheiben 113/117,22 und 121,24, Schneemänner 114 und 120, Zeile 26                                                  |
| Eishöhle        | Wasserfall 114-121 x 32-35                                       | Bär: R am Vorhang (vor 117-118,36), dann hinein (hoch). Fuchs: links bei 113,35 zuckt der Schnee, R gräbt, dann hoch. 120 s offen                                 |
| See             | 109-123 x 38-57                                                  | gleiten; drei Runden um die Insel (115-117 x 46-48)                                                                                                               |
| Tannenschonung  | 89-99 x 41-55                                                    | Weihnachtsmann/Elfe: R vor einer jungen Tanne; tragen (geht durch Türen); Werkstatt: R am Ständer (7,12)                                                          |
| Briefkasten     | 16,13 (bei der Werkstatt)                                        | Fahne oben: R liest den Auftrag; goldener Pfeil zeigt den Weg, oben im Bild steht der Auftrag                                                                     |
| Tiere           | Hasen 88-100 x 21-40, Pinguine auf dem See, Eulen 100-121 x 2-14 | Jordi als Hase/Pinguin/Vogel: sie kommen näher, R plaudert                                                                                                        |

**Jetskis** (`engine/jetski.ts`, Standorte `JETSKI_HOMES`): Teich-Südufer
11/33,7, Hauptstraße 53/20,8, westlich vom Markt 96,5/11, See-Westufer
110,5/40,8. R daneben steigt auf, R wieder ab (neben dem Jetski, nicht im
Wasser). Stick/Pfeile lenken; Spitze 240 px/s (gut 2,5x zu Fuß), Drift auf
Eis und Wasser, Abprallen an Hindernissen, Schneemänner fallen um. Keine
Türen, Türchen, Kino (Hinweis), nicht fliegend, nicht als Tier. Fähigkeit =
Hupe (Grantelbart: Riff). Beim Figurwechsel bleibt die Figur sitzen. Nach
3 Minuten unbenutzt woanders steht er wieder daheim. Eigener Bogen
`assets/jetski-2x.png` (`components/jetski-atlas.ts`, Generator
`jetski_art.py` im Scratchpad unter `jetski/`), Zeichnen in
`components/render-jetski.ts`. Mehr in game-rules.md.

**Glöckchen** (`BELLS`): Fuchs-Versteck 56,16 (graben), Eishöhle 10,7,
Waldnische 125,30 (nur fliegend), Zaunkäfig 90,23 (Maus, fliegend),
Tannenspitze 99,33 (Gilfi zaubert in 90 px, dann liegt es 90 s darunter),
Schneewehenring 118,58 (Bär, fliegend), offenes Wasser 11,28 (Pinguin,
fliegend), Markt 119,5, Insel 115,46 (nur nachts), Karussell (beim Mitfahren),
Grantelbarts Haus 17,11, Schneemann 120,26 (umwerfen, dann bei 120,27).

**Tag und Nacht** (`sky.ts`): ein Tag dauert 360 s, jeder Besuch beginnt
morgens; nachts liegt eine blaue Tönung über dem Bild draußen, die Lichter
draußen (Laternen, Fenster, Buden) sind tagsüber schwach und nachts hell -
ausgeknipste Laternen bleiben dunkel. In 60 % der Nächte 75 s Polarlicht,
über dem See Eislichter. Schneesturm nach 150 s, dann alle 160-320 s für
40 s (dichtes Schneetreiben, weißer Rand). Räume und Minispiele bleiben
unberührt. Zum Ausprobieren: `?uhr=22`, `?wetter=sturm`,
`?wetter=polarlicht`.

Noch frei sind die übrigen Flächen der alten Karte (Nordband 40-52 x 3-5 und
57-84 x 3-6, südlich des Teichs 2-18 x 32-36, zwischen Wald und Türchen
2-28 x 40-45) und im Osten 88-100 x 4-12 und 109-123 x 58-60. Nicht zubauen:
Türchen, Laternen (35), Schneemänner, Schneewehen, das Fuchs-Versteck, die
Hasen-Runde, die Türen und Wege des Dorfs und alles Obige.

## Aufbau

```text
weihnachtsmann/
  assets/        figures-2x.png (Figuren, Tiere, Effekte, Noten), world-2x.png
                 (Boden, Bäume, Zäune, Häuser, Möbel, Raumbilder, Zahnräder,
                 Spielzeug), portraits-2x.png (Leiste), logo.webp
  audio/sounds.ts  kurze WebAudio-Töne: Tür, Spielzeug, Riff, Trommeln, Orgel,
                 Schlittenglocken, Wunsch-Glöckchen, Zauber, Fernrohr, Plumps,
                 Erfolgs-Jingle, Krach, Hämmern, Lichtschalter, Platsch, Fund
  engine/        die Simulation, ohne DOM
    types.ts       Figuren, Orte, Karte, Türen, Befehle, Spielzustand, Speicherstand
    cast.ts        Bewegungsprofile und Fähigkeit je Figur und Tier, Länge,
                   Abklingzeit und Gewohnheit jeder Vorführung (Daten)
    map-data.ts    die Karte draußen: Buchstabenzeilen, Häuser, Türen, Startplätze
    interior-data.ts  Werkstatt und Grantelbarts Haus (Zeilen, Möbel, Türen,
                   Benutzbares) und wo die Teile der Spielzeugmaschine sitzen
    map.ts         Orte bauen, Grundrisse der großen Dinge, passt eine Figur hierhin?
    doors.ts       durch Türen gehen, Überblendung, Wechsel in einen anderen Ort
    interact.ts    R vor etwas: Maschine, Instrumente, Tafel ...; fliegende Spielzeuge
    sleigh.ts      der Schlittenflug: Start, Schleife, Landung
    camera.ts      Kamera folgt der Figur (oder dem Schlitten)
    movement.ts    Laufen, Rutschen auf Eis, Schwimmen, Fliegen, Ecken-Rutschen
    abilities.ts   Fliegen, Verwandeln, Vorführungen starten, Sprechen (je
                   Fähigkeit ein Handler)
    shows.ts       die Vorführungen: Wünsche, E-Gitarre, Fernrohr, Schweben,
                   Hinfallen (Start, Lauf, Ende je Art; schwebende Dinge)
    spyglass.ts    Gugors Blick durchs Fernrohr: Linse, Kamera, Ortswechsel
    wander.ts      die Figuren ohne Spieler: ausruhen, spazieren, plaudern, landen
    effects.ts     Sprechblasen, Glitzer, Rauch, Puff, Schneestaub
    gates.ts       die 26 Tore: hineingehen, gewonnen markieren, welches als Nächstes
    cinema.ts      das Kino: hineingehen, hinaus, die 26 Folgen (Video, Tor)
    achievements.ts  die Erfolge: Liste, freischalten, Fortschritt, Banner, Speichern
    building-data.ts  die fünf Dorfgebäude innen (Zeilen, Möbel, Türen, Spots)
    carry.ts       Tragen: aufheben, an der Tür liegen lassen
    stable.ts      Rentierstall: Möhren, Füttern, Rudolfs Nickerchen
    post.ts        Poststube: Briefberg, Sortieren, der Weihnachtsmann liest
    bakery.ts      Backstube: Teig, Blech, Ofen, Gitter, Balbos Sturz
    store.ts       Geschenkelager: Labyrinth, Mauselöcher, verlorenes Geschenk
    overview.ts    Rundblick vom großen Fernrohr
    world.ts       was sich verändern lässt und von selbst heilt: Laternen,
                   Schneemänner, Schneewehen, Fisch, Geschenk, Maschine
    east-data.ts   Orte des Ostens, Glöckchen, Fundorte, Tierreviere (Daten)
    east.ts        startet und bewegt alles im Osten (World.east)
    market.ts      Buden, Karussell, Musik
    sled.ts        Rodelhang: Start, Lenken, Stürze, Ziel, Bestzeit
    snowball.ts    Schneebälle, Treffer auf Zielscheiben und Schneemänner
    cave.ts        Eisvorhang, Schlupfloch des Fuchses, Türen der Eishöhle
    rink.ts        See: Gleiten, Runden um die Insel, Balbo rutscht aus
    jetski.ts      Schnee-Jetskis: auf- und absteigen, fahren, driften,
                   abprallen, Hupe, zurück an den Platz
    firs.ts        Tannenschonung, Christbaum in der Werkstatt
    bells.ts       die 12 goldenen Glöckchen
    critters.ts    Schneehasen, Pinguine, Eulen
    errands.ts     Briefkasten und Aufträge
    sky.ts         Tageszeit, Schneesturm, Polarlichter (World.sky)
    engine.ts      neues Spiel, ein Schritt, Wechsel, Kamera, Abstand halten
    random.ts      Zufallszahlen mit Startwert im Zustand
    save.ts        Prüfung eines gelesenen Speicherstands
  components/    Zeichnen und Oberfläche
    sprite-atlas.ts  wo jedes Bild auf den Bögen liegt (generiert)
    sprites.ts       Bögen laden, Bilder ausschneiden
    render.ts        Boden (Dual-Grid) oder Raumbild, Tiefensortierung, Schatten,
                     Leuchten, Abdunkeln, Schneefall, Überblendung,
                     Sprechblasen und R-Hinweis in scharfer Schrift
    render-gates.ts  die Tore mit Nummer, Stern, Leuchten, Name und Wegweiser-Pfeil
    render-minigame.ts  ein Minispiel-Feld groß auf die Leinwand, Texte scharf darauf
    render-world.ts  Geschenk auf der Kuppel, springender Fisch, Schraubenschlüssel
                     beim Reparieren, Erfolgs-Banner mit Konfetti
    achievements-panel.tsx  Knopf „Erfolge x/54“ und der Dialog mit allen Karten,
                     oben Glöckchen-Zähler und Rodel-Bestzeit
    render-town.ts   das Dorf: Rentiere, Ofen, Gitter, Briefberg, Geschenk,
                     Getragenes, Licht, Türschilder, Fächernamen
    render-overview.ts  der Rundblick aus der Sternwarte
    building-atlas.ts   wo die Bilder auf buildings-2x.png liegen (generiert)
    cinema-panel.tsx  das Kino: Kopf, Folgenliste, Datenschutzzeile
    cinema-player.tsx die Leinwand: Vorhang, Film, eigene Steuerung, 1:04-23:04
    advent-progress.tsx der Adventskalender unter dem Bild
    render-east.ts   der Osten: Karussell mit Reitern, Lichterketten, Schlitten,
                     Schneebälle, Tiere, Glöckchen, Auftragspfeil, Eisvorhang,
                     Kristalle, Christbaum; Tier-Blasen, Auftrag, Rodeluhr
    render-sky.ts    Nachttönung, Polarlichter, Schneesturm, Licht nach Tageszeit
    outdoor-atlas.ts wo die Bilder auf outdoor-2x.png liegen (generiert)
    render-jetski.ts die Jetskis mit Fahrer, Scheinwerfer, Schild
    jetski-atlas.ts  wo die Bilder auf jetski-2x.png liegen (generiert)
    render-shows.ts  Fähigkeits-Posen, Gedankenblasen mit Wünschen, Wackeln,
                     Fernrohr-Linse mit Zeile, Schwebendes, Sterne über Balbo
    render-props.ts  was sich bewegt und leuchtet: Zahnräder, Lämpchen, Band und
                     Spielzeug der Maschine, Flammen, Verstärker, Porträt-Augen,
                     fliegender Schlitten mit Rudolf
    input.ts         Tasten, Gamepad, Touch
    character-bar.tsx  die acht Porträt-Knöpfe
    animal-picker.tsx  Jordis Tierwahl
    portrait.tsx       Porträt aus dem Porträtstreifen
    touch-pad.tsx      Stick, Knöpfe und „Hinein“ fürs Handy
    weihnachtsmann-game.tsx  der Bildschirm
  minigames/     die 26 Minispiele, je ein Ordner `<nn>-<id>/`, dazu `kit/`
                 (Titelkarte, Countdown, Ergebnis, Finale, Zeichnen, Töne,
                 Eingabe, Zufall) und `types.ts` (der Vertrag); siehe MINIGAMES.md
  hooks/use-weihnachtsmann-game.ts  Schleife, Leinwand, Speichern, Spielzeit,
                 das offene Minispiel
  storage/save-store.ts             Speicherstand in localStorage
  storage/cinema-store.ts           Kino: letzte Folge, Stellen, gesehene
  i18n/          texts.ts (alle deutschen Texte), rules.ts (Regeln-Dialog)
```

## Technik

- **Feste Schritte:** 60 Simulationsschritte pro Sekunde, unabhängig von der
  Bildrate; nach einem Hänger höchstens fünf Schritte nachholen.
- **Ganzzahlige Pixel:** Die Grafik hat zwei Kunstpixel pro logischem Pixel.
  Gezeichnet wird in einen Puffer in Kunstauflösung, der ganzzahlig auf die
  Leinwand vergrößert wird - bevorzugt um eine gerade Zahl, damit jedes
  Kunstpixel gleich groß ist. Statt das Bild auf einen unpassenden Maßstab zu
  schrumpfen, zeigt das Spiel etwas mehr oder weniger von der Karte
  (mindestens 240 x 135, höchstens 400 x 240 logische Pixel; `fitScale`).
- **Kamera** folgt weich; nach einem Wechsel gleitet sie langsamer zur neuen
  Figur.
- **Tiefe:** Bäume, Zäune, Häuser und Figuren werden nach ihrer Fußlinie
  sortiert; Fliegende liegen über allem, ihr Schatten bleibt am Boden.
- **Boden** als Dual-Grid: Weg, Eis und Wasser liegen zwischen vier Feldern
  und bekommen so runde Ränder, ohne dass die Karte das wissen muss.
- **Orte:** draußen, Werkstatt, Grantelbarts Haus - jeder eine eigene Karte
  (`GameState.maps`), jede Figur weiß, wo sie ist (`Character.area`). Gezeigt
  wird der Ort der gesteuerten Figur (`viewArea`); wer nicht gesteuert wird,
  bleibt in seinem Ort und spaziert dort. Türen sind Felder mit einer
  Richtung: wer darin steht und in diese Richtung drückt, geht hindurch
  (Überblendung 0,6 s, Steuerung währenddessen gesperrt). Drinnen wird nicht
  geflogen.
- **Speichern:** gewählte Figur, Ort, Positionen, Blickrichtung, Jordis Tier,
  wer fliegt, die gewonnenen Tore und die Erfolge (mit Datum, dazu gesammelte
  Wünsche und Instrumente, gezählte Stürze und Spielzeuge), alle fünf
  Sekunden, bei jedem Wechsel, nach jedem Sieg, bei jedem neuen Erfolg und beim
  Verlassen der Seite (`weihnachtsmann/save`, Version 4; die sortierten Briefe
  stehen als `counts.letters` darin, ältere Stände lesen sich mit 0). Speicherstände der
  Version 3 werden gelesen (noch kein Erfolg). Speicherstände der Stufe 2
  (Version 2) werden gelesen: alle
  stehen, wo sie standen (die alte Karte liegt unverändert in der neuen), kein
  Tor ist gewonnen. „Neu aufstellen“ behält den Adventskalender.
- **Minispiele:** Läuft die Figur in ein Tor, setzt die Simulation am
  dunkelsten Punkt der Überblendung `gateOpen`; der Bildschirm öffnet dann
  eine Sitzung (`minigames/kit/host.ts`), die Karte steht so lange still.
  Das Feld ist fest 320 x 180 logische Pixel, wird in einen eigenen Puffer
  gezeichnet und ganzzahlig vergrößert; Texte kommen scharf obendrauf. Passt eine gespeicherte Figur nicht
  mehr hin, steht sie wieder am Startplatz. Speicherstände der Stufe 1
  (Version 1, ohne Orte) werden noch gelesen: gewählte Figur, Blickrichtung
  und Jordis Tier bleiben, alle stehen an ihren Startplätzen. Der Schlittenflug
  wird nicht gespeichert.

## Grafik

Alle Bilder sind eigene Pixelgrafik, gezeichnet von einem Python/PIL-Generator
aus Formen (Ellipsen, Polygone) mit Teil-Konturen, Licht von links oben und
selektiver Außenkontur. Aus den Vorlagen der Serie wurden nur Merkmale
übernommen (Farben, Bart, Mützen, Ohren, Schal, rote Nase), nichts
nachgezeichnet. Der Generator schreibt die drei Bögen, das Logo und
`components/sprite-atlas.ts` zusammen; Bögen und Atlas nur gemeinsam neu
erzeugen.

Figuren: 40 x 40 logische Pixel je Bild (Tiere 24 x 24), drei Blickrichtungen
(links ist rechts gespiegelt), je zwei Bilder Stehen und vier Bilder Laufen,
dazu Fliegen (Trixi, Rudolf, Vogel), Rutschen (Pinguin) und je zwei Bilder
Fähigkeit (`act`): Grantelbart mit E-Gitarre, Gilfi mit Zauberhänden, Gugor
mit Fernrohr, Balbo umkippend und flach liegend. Auf dem Figurenbogen liegen
außerdem die Gedankenblase und die Wunschbilder.

Tore: vier Stile (`gates.py` im Generator), je geschlossen und offen, 56 x 68
logische Pixel auf drei Feldern Grundfläche, das Nummernschild bei allen an
derselben Stelle; die Nummer setzt das Spiel aus Ziffern-Bildern zusammen.
Minispiele haben eigene Bögen und Generatoren (siehe MINIGAMES.md).

Häuser und Möbel: Glaskuppel (10 x 4 Felder, runder Grundriss), Grantelbarts
Haus als zwei Teile (Hauptflügel 5 x 4, Giebelflügel 3 x 5, damit jeder nach
seiner eigenen Vorderkante sortiert wird), aufgemalter Tannenbaum (8 x 10,
liegt flach und sperrt nichts), Schlitten (2 x 1); drinnen ein Raumbild pro
Haus (Werkstatt 24 x 15, Grantelbart 20 x 13 Felder) und Möbel als eigene
Bilder.

Das Dorf hat einen eigenen Bogen `assets/buildings-2x.png` (Häuser, fünf
Raumbilder, Möbel, Paketstapel, Rentiere - aus Rudolfs eigenen Bildern mit
dunkler Nase -, Rudolf schlafend, Tragbares) mit eigenem Atlas
`components/building-atlas.ts`; beide schreibt das Skript `buildings.py`
(liegt im Scratchpad der Sitzung unter `bauten/`, nutzt `pix.py` des großen
Generators) zusammen, dazu die elf Abzeichen auf dem Figurenbogen (Zeile 784,
ab x 170, von Hand in `EFFECTS` eingetragen). Der große Generator fasst den
neuen Bogen nicht an; erzeugt er den Figurenbogen neu, müssen die Abzeichen
nachgezogen werden.

Der Osten hat einen eigenen Bogen `assets/outdoor-2x.png` (Buden, Karussell
in Teilen, Wasserfall mit Eisvorhang, Eishöhle, Kristalle, Rodel-Sachen,
Zielscheiben, Christbaum, Glöckchen, Tiere, Briefkasten, Tragbares) mit
Atlas `components/outdoor-atlas.ts`; beide schreibt das Skript `art.py`
(Scratchpad der Sitzung unter `draussen/`, nutzt `pix.py`), dazu die zwölf
neuen Abzeichen auf dem Figurenbogen (Zeile 784 ab x 357 und Zeile 714 ab
x 23, von Hand in `EFFECTS`).

Kino (96 x 88 logische Pixel auf dem Weltbogen bei 400,630) und das
Abzeichen „Filmabend“ (Figurenbogen bei 153,784) sind nachträglich mit
eigenen kleinen PIL-Skripten in die Bögen gemalt und von Hand in
`sprite-atlas.ts` eingetragen; wer die Bögen mit dem großen Generator neu
erzeugt, muss sie dort nachziehen. Schild-Lauflichter und Lichterkette zeichnet
`render-props.ts`.

## Karte ändern

Die Karte draußen steckt in [`engine/map-data.ts`](engine/map-data.ts), die
Häuser in [`engine/interior-data.ts`](engine/interior-data.ts):
Buchstabenzeilen (Legende im Kopf von `map-data.ts`), große Dinge mit ihrer
linken oberen Ecke, die Tore (Nummer, Stil, linke obere Ecke; darunter ein
freies Feld als Eingang), Türen (Felder, Richtung, Ziel), Benutzbares (`spots`)
und Startplätze (mit Ort). Der Grundriss jedes großen Dings steht in
`map.ts` (`BIG_SHAPES`). Neue Bodenarten oder Gegenstände brauchen einen
Buchstaben in `map.ts` (`LETTERS`) und, falls neu gezeichnet, ein Bild im
Generator. Die Zeilen eines Hauses müssen zu seinem Raumbild passen.

## Eine neue Fähigkeit

`AbilityKind` in `engine/cast.ts` erweitern, die Figur darauf zeigen lassen
und in `engine/abilities.ts` einen Handler eintragen (`HANDLERS`). Texte für
Leiste und Sprechblasen stehen in `i18n/texts.ts`.

Eine Fähigkeit, die ein paar Sekunden lang abläuft (Vorführung, `ShowKind`
in `engine/types.ts`), bekommt in `SHOWS` (`cast.ts`) Länge, Abklingzeit
(länger als die Vorführung - Dauerdrücken schadet nicht), ob die Figur
dabei stillsteht, und optional eine Gewohnheit für Figuren ohne Spieler
(`npc`: Wahrscheinlichkeit pro Sekunde, beim Spazieren oder Ausruhen, nur in
einem Ort). In `engine/shows.ts` stehen Start, Lauf und Ende je Art; die
Pose ist das Bild `act` der Figur (Generator), gezeichnet wird in
`components/render-shows.ts`. Vorführungen werden nicht gespeichert.

| Figur          | Vorführung       | Dauer | von selbst                   |
| -------------- | ---------------- | ----- | ---------------------------- |
| Weihnachtsmann | Wünsche erkennen | 5 s   | nein                         |
| Grantelbart    | E-Gitarre        | 2,2 s | beim Ausruhen in seinem Haus |
| Gugor          | Fernrohr         | 5,6 s | nein (übernimmt das Bild)    |
| Gilfi          | Schweben lassen  | 5 s   | selten, beim Ausruhen        |
| Balbo          | Hinfallen        | 2 s   | beim Spazieren, ab und zu    |

Gugors Fernrohr verschiebt nur das Bild (`GameState.spy`, `viewArea`):
Steht der Weihnachtsmann im selben Ort, gleitet die Kamera hin; sonst
schließt sich die Linse, das Bild wechselt in seinen Ort und zurück.
Währenddessen steht Gugor still und Befehle (Wechsel, Fähigkeit, Sprechen)
werden verworfen, wie während einer Überblendung.

## Datumssperre

Im Dezember öffnet Türchen n erst am n. Dezember, sonst ist alles offen
(`engine/calendar.ts`, `GameState.today` setzt der Hook jedes Bild aus dem
Gerätedatum). Ausprobieren mit `?datum=MM-TT`, z. B. `/weihnachtsmann?datum=12-05`.
