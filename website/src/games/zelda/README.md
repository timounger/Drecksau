# Zelda

Ein kleines Top-Down-Abenteuer im Stil von _The Legend of Zelda: The Minish
Cap_ auf dem Game Boy Advance, mit eigener Geschichte: Der Schattenmagier
Vorgrim hat den Sonnenstein aus dem Dorf Grünau geraubt. Link spricht mit der
Dorfältesten, kauft im Laden ein, holt sich im **Moostempel** (zehn Räume,
Schlüssel und Türen, Karte und Kompass, Schiebeblock, Fackeln, rissige Wand,
Panzerkäfer als Zwischengegner, Steinwächter als Boss) den Sonnenstein und die
Krafthandschuhe, schrumpft auf dem **Wichtelstumpf** und schlüpft durch
Mauselöcher ins **Wurzelreich**. Danach bleibt die Oberwelt mit dem Darknut in
den Ruinen und vier Herzteilen zu erkunden. Unterwegs füllt sich das Inventar
mit zwölf Gegenständen (Laterne, Sprintstiefel, Feuerstab, Enterhaken,
Schaufel, Sprungfeder und mehr) und vier Flaschen. Link schwimmt in Fluss und
See und taucht mit R nach versunkenen Rubinen und einem Herzcontainer.

Route: `/zelda`, Statistik: `/zelda/statistik`. Regeln für Spieler:
[`i18n/rules.ts`](i18n/rules.ts), Überblick für Entwickler:
[`docs/games/zelda/game-rules.md`](../../../../docs/games/zelda/game-rules.md).

## Steuerung

| Taste    | Tastatur              | Gamepad        | Handy       |
| -------- | --------------------- | -------------- | ----------- |
| Bewegen  | Pfeiltasten / W A S D | Stick, Kreuz   | Steuerkreuz |
| A        | Linksklick, J, Leer   | A              | A           |
| B        | Rechtsklick, K        | B, X           | B           |
| R        | L, Umschalt           | Schultertasten | R           |
| Inventar | I, Enter              | Start          | Start       |
| Pause    | Esc                   | -              | -           |

A und B benutzen, was auf ihnen liegt (am Anfang Schwert auf A, Bogen auf B).
Gibt es vor Link etwas zu tun, redet, liest, öffnet, kauft, hebt oder wirft A
stattdessen - egal, was auf A liegt. R rollt oder tut dasselbe wie A; auf dem
Stumpf schrumpft und wächst Link damit. Im Wasser taucht R, A oder B macht
einen Schwimmzug. Die Touch-Tasten erscheinen nur bei
grobem Zeiger (`pointer: coarse`) und verfolgen jeden Finger einzeln (Pointer
Capture).

Im Menü (Seite **Gegenstände**) legt ein Linksklick auf ein Feld den
Gegenstand auf A, ein Rechtsklick auf B; mit Tastatur, Gamepad oder Touch
wandert der Cursor mit dem Steuerkreuz, A und B legen ab. Liegt er schon auf
der anderen Taste, tauschen beide. Leere Felder tun nichts. Die Maus bewegt
den Cursor mit (Hover). Der Knopf **SPEICHERN** schreibt denselben Platz wie
das Pause-Menü. R oder die Pfeile am Rand blättern zur Karte. Die Klicks
kommen über eine Warteschlange im Hook (`PointerState`) mit ihrer Stelle im
240 x 160-Bild in die Eingabe (`Input.click`, `Input.hover`); solange das Menü
offen ist, zählt ein Klick nicht als A oder B. Das Layout der Seite steht in
`engine/menu.ts` und wird von Zeichnung und Maus gemeinsam benutzt.

Esc öffnet das Pause-Menü: weiterspielen, von Hand speichern (`zelda/slot`),
diesen Stand laden oder neu starten. Der Autosave (`zelda/save`) läuft
unabhängig davon weiter.

## Aufbau

```text
zelda/
  assets/        world.png, dungeon.png, interior.png, mini.png (Gebiete
                 gemalt), map.png (Menükarte), sprites.png, logo.webp;
                 dieselben Bilder als -2x / -3x mit feinerer Pixeldichte
  engine/        die Simulation, ohne DOM
    types.ts       Spielzustand, Eingabe, Ereignisse
    world-map.ts   die Oberwelt als Buchstabenzeilen (generiert)
    area-maps.ts   Tempel, Häuser, Wurzelreich als Buchstabenzeilen (generiert)
    tiles.ts       Gebiete, Räume und was die Buchstaben bedeuten
    clearing.ts    welche Felder nicht mehr sperren, Namen der Merker
    areas.ts       Türen, Löcher, Treppen; was beim Ankommen passiert
    world.ts       Monster-Spawns, neues Spiel, Speicherstand und Übernahme
    physics.ts     Kollision mit Karte, Blöcken und Leuten, Ecken-Rutschen,
                   Hüpfen, Ausweichen
    player.ts      Link: Laufen, Rollen, Gegenstände auf A/B, Reden, Heben,
                   Schieben
    gear.ts        Besitz, Flaschen, auf A oder B legen (mit Tausch)
    menu.ts        Seite Gegenstände: Layout, Cursor, Maus, Speichern
    tools.ts       Laterne, Sprintstiefel, Feuerstab, Enterhaken, Schaufel,
                   Sprungfeder, Flaschen; Grabstellen
    swim.ts        Schwimmen, Schwimmzug, Tauchen, Tauchstellen
    dialog.ts      Textbox mit Tippen, Fund hochhalten
    treasure.ts    Truheninhalte, Funde, Laden
    npcs.ts        Dorfbewohner, ihre Texte nach Fortschritt, Waren
    dungeon.ts     Schiebeblöcke, Platten, Gitterräume
    items.ts       Schwert, Pfeile, Steine, Bomben, Bumerang, Fundstücke
    enemies.ts     die Monsterarten und ihr Wiederkommen
    boss.ts        Panzerkäfer und Steinwächter, fallende Felsen
    combat.ts      Schaden, Rückstoß, Schilde, Schwachpunkte, Beute
    effects.ts     Wölkchen, Funken, Staub und Beutetabellen
    engine.ts      ein Schritt, Abblenden, Raumscrollen, Kamera
  components/    Canvas-Darstellung (Welt, HUD und Menüs), Eingabe, Touch
  hooks/         use-zelda-game: Spielschleife, Speichern, Statistik
  audio/         per WebAudio erzeugte Töne und Fanfaren
  stats/         eigene Zahlen (Monster, Rubine, Ohnmachten, Büsche)
  i18n/          alle deutschen Texte und die Regeln
```

- **Fester Takt**: 60 Simulationsschritte pro Sekunde, gezeichnet einmal je
  Animationsbild.
- **240 x 160 Pixel** wie der GBA: gezeichnet in einen Puffer, dann um
  einen ganzzahligen Faktor (in Gerätepixeln) auf die sichtbare Leinwand
  vergrößert, `image-rendering: pixelated`. Im Modus **HD** (Standard, Knopf
  "Grafik: HD / Pixel") hat der Puffer die doppelte oder dreifache Dichte
  (480 x 320 oder 720 x 480, über `ctx.setTransform`), und die Bilder kommen
  aus den `-2x`/`-3x`-Dateien mit entsprechend größeren Quellrechtecken; die
  Logik rechnet weiter in 240 x 160. Texte (Schilder, Inventar, R-Taste)
  kommen danach in voller Auflösung darüber.
- **Gebiete**: Oberwelt mit mitlaufender Kamera; Tempel und Häuser sind in
  Räume zu einem Bildschirm geteilt, zwischen denen die Kamera scrollt;
  Türen, Löcher und Treppen blenden über Schwarz in ein anderes Gebiet.
- **Merker**: Was dauerhaft erledigt ist (Truhen, Türen, Fackeln, Platten,
  Wächter, Gegenstände, Geschichte), steht als Zeichenkette in `flags`.
- **Speichern** unter `drecksau-app/zelda/save` (Version 3) alle fünf Sekunden
  und bei wichtigen Ereignissen; Spielstände der Versionen 2 und 1 werden beim
  Laden übernommen (`migrateSave`, `migrateSaveV1`): Schwert, Schild, Bogen,
  Bomben und Bumerang (und die Handschuhe, falls gefunden) gehören Link, das
  Schwert liegt auf A, das alte B-Item auf B. Der Platz `zelda/slot` (Version
  2, alte Version 1 wird ebenso übernommen) hält dasselbe Format. `drecksau-app/zelda/adventure-stats` hält die
  eigenen Zahlen, `drecksau-app/zelda/muted` den Tonschalter,
  `drecksau-app/zelda/graphics` den Grafikschalter (HD oder Pixel).
- **Statistik**: Start eines Laufs, Spielzeit, Sieg (Steinwächter besiegt) und
  Niederlage (Game Over) gehen in die gemeinsame Statistik.

## Grafik und Ton

Alles ist eigens gezeichnet und erfunden - keine Nintendo-Grafiken, -Karten,
-Raumpläne, -Figuren, -Texte, -Musik oder -Töne. Ein Gameplay-Video des
Originals diente nur dazu, Tempo, Zeiten (Schwung, Rollen, Abblenden,
Raumscrollen, Tippgeschwindigkeit, Fund hochhalten) und den Aufbau von HUD,
Textbox und Menü zu treffen.

Die Bilder in `assets/` entstehen aus einem Python-Generator (PIL): die Figuren
als Pixel-Raster aus Zeichenketten mit Palette oder prozedural (Käfer, Wächter,
Truhen, Türen), Bäume, Gras, Wasser, Klippen, Tempelmauern und Riesenhalme
prozedural. Er schreibt `world.png`, `dungeon.png`, `interior.png`, `mini.png`,
`map.png`, `sprites.png`, `components/sprite-atlas.ts`, `engine/world-map.ts`
und `engine/area-maps.ts` - Karten und Bilder bleiben so im Gleichschritt.
Wer eine Karte ändert, muss den Generator neu laufen lassen, nicht die Dateien
von Hand anfassen. Truheninhalte (`treasure.ts`) und Schildtexte (`texts.ts`)
folgen der Lesereihenfolge der Karten. Die Töne werden zur Laufzeit mit
Oszillatoren und Rauschen erzeugt.

Für den HD-Modus gibt es jedes Bild zusätzlich mit doppelter und dreifacher
Pixeldichte (`*-2x.png`, `*-3x.png`, gleiches Layout, Atlas-Koordinaten mal
2 bzw. 3). Nativ in der höheren Dichte erzeugt sind die Oberwelt (Boden,
Wasser, Gras, Wege, Feld, Schatten, Bäume), Boden und Mauern des Tempels, die
Dielen der Häuser, die Menükarte und Link von vorn und hinten (2x, von Hand
gezeichnet). Die übrigen Figuren und Gegenstände, Klippen, Treppe, Brücke,
Hausfassade, Möbel und das Wurzelreich entstehen aus den 1x-Bildern mit einem
eigenen kantentreuen Vergrößerer (Scale2x/Scale3x) samt dünnerer Kontur und
Lichtkante; kein Weichzeichnen.
