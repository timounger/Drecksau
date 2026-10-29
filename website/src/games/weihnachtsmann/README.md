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

29 Erfolge (drei geheim), mindestens einer je Figur und Fähigkeit - Liste und
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
    achievements.ts  die Erfolge: Liste, freischalten, Fortschritt, Banner, Speichern
    world.ts       was sich verändern lässt und von selbst heilt: Laternen,
                   Schneemänner, Schneewehen, Fisch, Geschenk, Maschine
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
    achievements-panel.tsx  Knopf „Erfolge x/29“ und der Dialog mit allen Karten
    advent-progress.tsx der Adventskalender unter dem Bild
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
  Verlassen der Seite (`weihnachtsmann/save`, Version 4). Speicherstände der
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
