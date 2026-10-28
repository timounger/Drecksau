# Die 26 Türchen-Minispiele

Auf der Karte stehen 26 Tore (Adventskalender, Stufe 3). Hinter jedem steckt
ein Minispiel. Diese Seite ist die Anleitung für alle, die ein Minispiel
bauen: Vertrag, Ordner, Grafik, Regeln und die Liste der 26.

Fertig: **alle 26**. Der Platzhalter („Kommt bald“, kann nicht gewonnen
werden) bleibt im Kit für neue Nummern. Jedes Minispiel wird **nur in seinem
eigenen Ordner** gebaut - `minigames/index.ts` und der Rest des Spiels bleiben
unverändert, so können mehrere Leute gleichzeitig arbeiten.

## Ablauf (macht der Host, nicht das Minispiel)

Figur läuft ins Tor (Pfeil hoch) -> Abblenden -> **Titelkarte** („Türchen 7“,
Name, `instructions`, `controls`, Start / Zurück) -> Countdown 3-2-1 ->
**Spiel** (60 Schritte pro Sekunde) -> **Ergebnis** (Geschafft / Nicht
geschafft, `summary()`, Nochmal / Zurück zur Karte) -> Aufblenden, die Figur
steht wieder vor dem Tor. Esc (Gamepad Back/Start, Handy-Knopf „Zurück“)
verlässt jederzeit. Ein Sieg markiert das Tor sofort und speichert. Nach dem 26. Tor kommt das Finale (`kit/finale.ts`).

## Vertrag (`minigames/types.ts`)

```ts
export const MINI_W = 320; // Spielfeld, logische Pixel
export const MINI_H = 180;

export type MiniButton = "left" | "right" | "up" | "down" | "action" | "alt";

export type MiniInput = {
  held: ReadonlySet<MiniButton>; // Pfeile/WASD/Stick, Leertaste/Enter/F = action, R/Umschalt = alt; Handy: Aktion/Taste 2 gehalten
  pressed: ReadonlySet<MiniButton>; // seit dem letzten Schritt gedrückt
  axisX: number;
  axisY: number; // -1..1
  keys: ReadonlySet<string>; // rohe KeyboardEvent.code, gehalten
  keysPressed: ReadonlySet<string>; // rohe Codes, frisch gedrückt
  pointer: MiniPoint | null; // Maus/Finger auf dem Feld
  pointerDown: boolean;
  taps: readonly MiniPoint[]; // Klicks/Tipps seit dem letzten Schritt
};

export type MiniStatus = "running" | "won" | "lost";

export type MiniDraw = {
  ctx: CanvasRenderingContext2D; // auf 320 x 180 logische px skaliert, 2 Kunstpixel je px
  art: Art; // gemeinsame Bögen: figures (Figuren, Effekte), world (Geschenke, Spielzeug, Bäume ...)
  time: number; // Sekunden seit Rundenbeginn
  text(text, x, y, style?): void; // scharfe Schrift obendrauf (TextStyle: size, color, align, baseline, bold, outline, alpha)
};

export type MiniEnv = {
  seed: number; // für kit/random.ts
  sound(sound: MiniSoundId | Recipe): void;
};

export type MiniGameInstance = {
  step(input: MiniInput, dt: number): MiniStatus;
  draw(g: MiniDraw): void; // wird auch auf dem Ergebnisbildschirm noch aufgerufen
  summary?(): string; // eine deutsche Zeile fürs Ergebnis
  dispose?(): void;
};

export type MiniGame = {
  number: number; // 1-26
  id: string; // Ordnername ohne Nummer
  title: string; // deutsch
  instructions: readonly string[]; // 2-4 kurze deutsche Sätze: was tun, wann gewonnen
  controls: string; // eine deutsche Zeile
  ready: boolean; // false nur für Platzhalter
  create(env: MiniEnv): MiniGameInstance;
};
```

`step` gibt `"won"` oder `"lost"` genau einmal zurück, danach ruft der Host
`step` nicht mehr auf. Kein eigenes `requestAnimationFrame`, keine Timer,
kein DOM - alles läuft über `step`/`draw`. Zufall nur aus `createRandom(env.seed)`.

## Ordner

```text
minigames/
  index.ts           Liste aller 26 (nicht anfassen)
  types.ts           der Vertrag
  kit/               gemeinsame Helfer (nur lesen)
    draw.ts          drawSprite, drawSpriteCentred, drawFigure (Figuren in jeder
                     Pose), drawObject (world-Bogen), drawEffect, drawSky,
                     drawSnowfall, drawGlow, drawPanel, drawButton, drawHud
                     (Punkte/Ziel, Herzen, Uhr), wrapText, formatTime, loadSheet
    effects.ts       Funken-/Konfetti-Bursts, aufsteigende Texte, Wackeln
    random.ts        createRandom(seed): next, range, int, pick, chance, shuffle
    sounds.ts        gemeinsame Töne: click tick count go pop coin hit splat
                     miss bump jump whoosh win lose fanfare firework
    host.ts          Titelkarte, Countdown, Ergebnis (nicht anfassen)
    input.ts, placeholder.ts, finale.ts
  07-magische-perle/
    index.ts         export const GAME: MiniGame = { ... }
    sprites.ts       (generiert) SHEET_SRC und SPRITES
    sprites-2x.png   (generiert) eigener Bogen
    ...              weitere Dateien nach Bedarf
```

Ein neues Minispiel: den Platzhalter in `<nn>-<id>/index.ts` durch das
echte Spiel ersetzen und `GAME` exportieren - `number` und `id` bleiben wie
im Platzhalter. Vorlagen zum Abschauen: `01-geschenkeregen` (Fangen),
`02-schneeballschlacht` (Zielen, Pointer), `03-figuren-memory` (Karten,
Cursor + Klick), `04-rudolfs-nachtflug` (Scroller, Parallaxe),
`05-spielzeugband` (Sortieren), `06-grantelbarts-riff` (Rhythmus, eigene
Töne als `Recipe`).

## Regeln

- Code nach `docs/coding-rules.md`: englische Bezeichner und Kommentare,
  deutsche Texte, `@module`-Kopf, JSDoc, höchstens ein `return` je
  Funktion, keine Magic Numbers außerhalb von `eslint-disable`-Blöcken mit
  Begründung (Szenen-Layout darf so einen Block bekommen), nur `-` als Strich.
- Jede Runde 30-90 s, fair, klares Ziel, im HUD sichtbar (`drawHud`).
  Tastatur **und** Maus/Touch: was mit Pfeilen geht, geht auch per Tippen
  (oder per Stick + Knopf „Aktion“ auf dem Handy). Auf dem Handy ist das
  Feld hochkant nur gut 1,2 CSS-Pixel je logischem Pixel groß: Tippziele
  mindestens 24 x 24 logische Pixel, Schrift nicht unter 6,5. Der Stick zählt
  ab einem Viertel Ausschlag als gehaltener Pfeil, jedes neue Drücken als
  `pressed`; Aktion und Taste 2 sind gehalten, solange der Finger draufliegt.
- Saft: Sound bei jeder Aktion, `effects.burst`/`float`/`shake`, kleine
  Animationen. Figuren aus dem gemeinsamen Bogen mit `drawFigure` wiederverwenden.
- Prüfen: `npx tsc --noEmit -p .`, `npx eslint src/games/weihnachtsmann`,
  `npx prettier --check src/games/weihnachtsmann`, `npx vitest run`; im
  Browser durchspielen. Keine neuen Tests schreiben.

## Grafik

Eigene Pixelgrafik, 2 Kunstpixel je logischem Pixel, Licht von links oben,
Teil-Konturen wie im Rest des Spiels. Jedes Minispiel hat einen eigenen
Generator in der Grafik-Werkstatt
(`<scratchpad>/weihnachtsmann/gen/minigames/`, Kopie von `mNN_<id>.py`;
Werkzeugkasten `pix.py` eine Ebene höher, `tiles.py` und `world2.py` für
Bäume, Schnee usw.). `mgkit.write_sheet(game_dir, "<nn>-<id>", "<Titel>", sprites)`
packt die Bilder (Name -> 2x-Bild, Reihenfolge bleibt) und schreibt
`sprites-2x.png` und `sprites.ts` in den Ordner:

```sh
python m07_magische_perle.py C:\git_data\Drecksau\website\src\games\weihnachtsmann
```

Im Code: `const sheet = loadSheet(SHEET_SRC)` beim `create`, dann
`drawSprite(g.ctx, sheet, SPRITES.name, x, y)`. Hintergründe als ein Bild
von 320 x 180 (640 x 360 Kunstpixel) sind üblich.

## Die 26 Minispiele

Schwierigkeit steigt sanft. „Pfeile“ heißt immer auch W A S D, Stick und
der Handy-Stick; „Aktion“ ist Leertaste/Enter, auf dem Handy der Knopf Aktion.

| Nr  | Ordner                    | Name                       | Idee                                                                                                                         | Steuerung                                         |
| --- | ------------------------- | -------------------------- | ---------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------- |
| 1   | `01-geschenkeregen`       | Geschenkeregen             | Der Schlitten wirft Geschenke ab; der Weihnachtsmann fängt 20 im Sack (Stern = 3), Kohle kostet ein Herz. 60 s.              | Pfeile links/rechts, Maus/Finger führt            |
| 2   | `02-schneeballschlacht`   | Schneeballschlacht         | Grantelbart und Gugor tauchen hinter Schneewällen auf - 12 Treffer in 45 s, Gilfi nicht treffen (3 Herzen).                  | Klick/Tipp wirft; Pfeile zielen + Aktion          |
| 3   | `03-figuren-memory`       | Figuren-Memory             | 12 Karten, 6 Figuren-Paare, am Anfang kurz alle offen; alle Paare in 75 s.                                                   | Klick/Tipp; Pfeile + Aktion                       |
| 4   | `04-rudolfs-nachtflug`    | Rudolfs Nachtflug          | Seitlicher Flug, 45 s durchhalten zwischen Schornsteinen und Gewitterwolken, 3 Herzen, Sterne als Bonus.                     | Pfeile hoch/runter halten, Finger gedrückt halten |
| 5   | `05-spielzeugband`        | Das Spielzeugband          | Teddys links, Eisenbahnen Mitte, Bälle rechts; 20 richtig, 3 Fehler erlaubt, Band wird schneller.                            | Pfeile links/runter/rechts, Sack antippen         |
| 6   | `06-grantelbarts-riff`    | Grantelbarts Riff          | Rhythmus: Noten fallen in 4 Spuren, 70 % treffen; jede getroffene Note ist ein Gitarrenakkord.                               | Pfeile oder D F J K, Spur antippen                |
| 7   | `07-magische-perle`       | Die magische Perle         | Jordi als Pinguin taucht unter dem Eis, sammelt 8 Perlen; Luftanzeige, zum Luftloch zurück; Quallen meiden.                  | Pfeile schwimmen                                  |
| 8   | `08-rudolf-verschwunden`  | Rudolf ist verschwunden    | Suchbild im verschneiten Wald: Rudolf fünfmal finden (versteckt zwischen anderen Rentieren, Bäumen), 60 s.                   | Klick/Tipp; Pfeile + Aktion (Lupe)                |
| 9   | `09-gluecksbringer`       | Der Glücksbringer          | Hütchenspiel mit drei Mützen; der Glücksbringer wird gemischt, immer schneller - 4 von 5 Runden richtig.                     | Pfeile + Aktion, Mütze antippen                   |
| 10  | `10-fliegender-teppich`   | Der fliegende Teppich      | Von oben: Teppich durch eine Eisschlucht steuern, durch 15 Tore fliegen, Wände nicht berühren.                               | Pfeile links/rechts                               |
| 11  | `11-sternbilder`          | Trixis Sternbilder         | Sterne in der Reihenfolge 1, 2, 3 ... verbinden, 5 Sternbilder, Zeitlimit je Bild.                                           | Klick/Tipp; Pfeile + Aktion                       |
| 12  | `12-zauberstab`           | Der Zauberstab             | Simon sagt: Kristalle leuchten in einer Folge, nachspielen, bis zur Länge 8.                                                 | Pfeile (4 Kristalle) oder antippen                |
| 13  | `13-wachstumstrank`       | Der Wachstumstrank         | Timing: Gießen halten und genau im grünen Bereich loslassen, 5 Zutaten, Bereich wird enger.                                  | Aktion halten/loslassen, Finger halten            |
| 14  | `14-neues-kostuem`        | Ein neues Kostüm           | Mütze, Mantel, Stiefel aus je 4 Teilen so wählen, dass das Vorbild entsteht; 6 Kostüme in 90 s.                              | Pfeile wählen, Aktion; antippen                   |
| 15  | `15-flugstunde`           | Trixis Flugstunde          | Trixi fliegt (seitlich, mit Schwung) durch 20 Sternenringe, höchstens 3 verpassen.                                           | Pfeile                                            |
| 16  | `16-troll-klopfen`        | Troll-Klopfen              | Hau-den-Troll: Trolle aus 9 Schneelöchern zurückstupsen, Elfen verschonen, 25 Treffer in 45 s.                               | Klick/Tipp; Zifferntasten 1-9                     |
| 17  | `17-doppelgaenger`        | Gugors Doppelgänger        | Viele Gugors, einer ist anders (Mütze, Farbe, Blick); 8 Runden, jede schneller.                                              | Klick/Tipp; Pfeile + Aktion                       |
| 18  | `18-zeitmaschine`         | Jordis Zeitmaschine        | Schiebepuzzle 3 x 3 eines Weihnachtsbildes, lösbar gemischt, 90 s.                                                           | Pfeile schieben, Teil antippen                    |
| 19  | `19-teddy-werkstatt`      | Ein Bär für Pablo          | Fließband: angezeigte Tastenfolgen (Pfeile) schnell genug eingeben, 10 Teddys.                                               | Pfeile; Tasten auf dem Bild antippen              |
| 20  | `20-weihnachtspost`       | Weihnachtspost auf Abwegen | Labyrinth: Balbo bringt 5 Briefe zu den Briefkästen mit der richtigen Farbe, Schneewehen versperren Wege.                    | Pfeile                                            |
| 21  | `21-lichterkette`         | Die Lichterkette           | Rohr-Puzzle: Kabelstücke drehen, bis Strom vom Stecker zum Baum fließt, 4 Gitter.                                            | Klick/Tipp dreht; Pfeile + Aktion                 |
| 22  | `22-flaschenpost`         | Die Flaschenpost           | Angeln am Eisloch: Haken pendelt, im richtigen Moment werfen und einholen, 6 Flaschen, keine Stiefel.                        | Aktion (Timing), antippen                         |
| 23  | `23-schlittenrennen`      | Balbos Schlittenrennen     | Abfahrt von oben: Bäumen ausweichen, über Schanzen springen, Geschenke sammeln, ins Ziel in 60 s.                            | Pfeile, Aktion springt                            |
| 24  | `24-wunschzettel-raetsel` | Sebastians Wunschzettel    | Mastermind mit 4 Spielzeugen aus 6, höchstens 8 Versuche, Hinweise richtig/falsch platziert.                                 | Pfeile + Aktion, antippen                         |
| 25  | `25-laengste-nacht`       | Die längste Nacht          | Schlitten fliegt über Dächer; Geschenke fallen lassen, sodass sie in die Schornsteine treffen, 15 von 20.                    | Aktion wirft ab, Tipp                             |
| 26  | `26-geheimnis`            | Das große Geheimnis        | Schleichen von oben durch die nächtliche Werkstatt: 3 Schlüssel, Grantelbart mit Laternenkegel ausweichen, zur goldenen Tür. | Pfeile                                            |
