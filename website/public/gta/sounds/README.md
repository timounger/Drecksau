# Geräusche

Hier liegen die Geräusche des Spiels - im Gegensatz zum Radio nebenan mit
**festen Namen**: Ein Sender ist irgendeine Datei im Ordner, ein Geräusch
gehört zu einem Moment.

## Dateien

Jede Datei gehört zu einem Moment. Welche wann läuft, steht hier - und
dasselbe noch einmal im Code: die Einzeltöne in `OneShot`, die Schleifen in
`LoopKind` (`src/games/gta/audio/sounds.ts`), und **wann** sie laufen in
`src/games/gta/audio/mix.ts`.

| Datei                 | Art       | Wann es läuft                                                                                                                                                                 |
| --------------------- | --------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `car-enter.mp3`       | Einzelton | Einmal beim Einsteigen in ein Auto - nicht auf Fahrrad und Motorrad, die haben keine Tür                                                                                      |
| `hit.mp3`             | Einzelton | Bei jeder Schlaganimation - Faust, Schlagring, Schlagstock, Messer                                                                                                            |
| `pistol.mp3`          | Einzelton | Bei jedem Pistolenschuss; auch bei jedem Schuss von Polizei und Gegnern - je weiter weg, desto leiser                                                                         |
| `rocket-launcher.mp3` | Einzelton | Bei jedem Schuss mit der Panzerfaust und mit der Panzerkanone                                                                                                                 |
| `explosion.mp3`       | Einzelton | Immer wenn etwas explodiert: Raketeneinschlag, Granate, Fernzünder, Autowrack                                                                                                 |
| `police-siren.mp3`    | Schleife  | Solange eine Streife **auf Einsatz** in Hörweite ist - je näher, desto lauter                                                                                                 |
| `car-engine.mp3`      | Schleife  | Solange man in einem Auto sitzt - **und** wenn eines an einem vorbeifährt, je näher desto lauter. Je schneller, desto lauter und höher. Nicht auf dem Fahrrad, das hat keinen |
| `tank-engine.mp3`     | Schleife  | Dasselbe im Panzer, und wenn ein Panzer an einem vorbeifährt                                                                                                                  |
| `machine-gun.mp3`     | Schleife  | Solange man mit dem MG feuert, auch mit dem Bord-MG des Panzers - hört beim Loslassen sofort auf                                                                              |
| `boat.mp3`            | Schleife  | Im Boot, und wenn sich ein Polizeiboot nähert                                                                                                                                 |
| `helicopter.mp3`      | Schleife  | Im Hubschrauber, und wenn der Polizeihubschrauber näher kommt                                                                                                                 |
| `airplane.mp3`        | Schleife  | Im Flugzeug - je schneller, desto lauter                                                                                                                                      |
| `flamethrower.mp3`    | Schleife  | Solange der Flammenwerfer feuert                                                                                                                                              |
| `swimming.mp3`        | Schleife  | Als Schleife sobald man im Wasser ist und sich bewegt                                                                                                                         |

- **Format:** `.mp3`
- **Benennung:** Kleinbuchstaben mit Bindestrich, benannt nach dem **Moment**,
  nicht nach dem Klang: `car-enter`, `car-engine`, später etwa `car-crash`,
  `pickup`, `door-shop`. Dieselbe Schreibweise wie bei Panzerkiste
  (`public/panzerkiste/sounds/`). Zwei Dateien wurden dafür umbenannt:
  `engine.mp3` heißt jetzt `car-engine.mp3` (es gibt zwei Motoren, und
  `tank-engine.mp3` stand schon daneben), und `granade.mp3` heißt
  `explosion.mp3` - richtig geschrieben, und es läuft bei **jeder**
  Explosion und nicht nur bei einer Granate.
- **Zwei Sorten:** Ein **Einzelton** passiert einmal und bekommt jedes Mal ein
  eigenes Element, damit zwei sich überlagern können. Eine **Schleife** wie
  der Motor oder die Sirene läuft dauerhaft und wird nur lauter und leiser -
  davon gibt es je eine. Eine Schleife hört **sofort** auf, ein Einzelton
  spielt sich zu Ende. Genau deshalb ist das MG eine Schleife: Als Folge von
  Einzeltönen ratterte es nach dem Loslassen weiter, weil jedes Element darauf
  besteht, fertig zu werden.
- **Lauter und leiser, höher und tiefer:** Alles, was irgendwo in der Stadt
  passiert, wird nach Entfernung gedämpft - quadratisch, weil Schall
  schneller abfällt als eine Gerade. Motoren werden zusätzlich **schneller
  abgespielt**, je schneller man fährt; das ist derselbe Motor, der dreht.
- **Neues Geräusch hinzufügen:** Datei hier ablegen **und** im Code
  eintragen - für einen Einzelton einen Namen in `OneShot` und die Datei in
  `FILES`, für eine Schleife einen Namen in `LoopKind` und die Datei in
  `LOOPS` (beides `audio/sounds.ts`). Wann es laufen soll, entscheidet
  `audio/mix.ts`: Einzeltöne aus dem, was neu im Zustand auftaucht, Schleifen
  aus dem, was gerade der Fall ist.
- Fehlt eine Datei, bleibt es still; kaputt geht nichts.
- Die Lautstärke ist dieselbe wie beim Radio: der Regler über dem Bild, ganz
  links ist stumm. Im Gefängnis, in der Bank und in der Druckerei ist die
  Stadt still - dort steht sie ja auch.

## Herkunft und Lizenz

Die Geräusche stammen von **freesound.org**.

Dort hat **jede Datei ihre eigene Lizenz** - meist CC0 (keine Namensnennung
nötig), oft aber auch CC BY (Namensnennung nötig) oder CC BY-NC. Deshalb wird
hier je Datei vermerkt, was gilt, und ob die Datei verändert wurde: Bei CC BY
verlangt die Lizenz ausdrücklich beides - Namensnennung **und** den Hinweis auf
Änderungen.

Das übliche Schema dafür ist **TASL**: Titel, Autor, Quelle, Lizenz - plus
„bearbeitet" mit einem Wort dazu, was gemacht wurde.

| Datei                 | Titel / Autor                                                                            | Quelle                                                                            | Lizenz                        | Bearbeitet                                       |
| --------------------- | ---------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------- | ----------------------------- | ------------------------------------------------ |
| `car-enter.mp3`       | Car Door Open/Close (exterior perspective) / iainmccurdy                                 | [freesound.org](https://freesound.org/people/iainmccurdy/sounds/643122/)          | Attribution 4.0               | ja: in MP3 umgewandelt, geschnitten, komprimiert |
| `police-siren.mp3`    | VEHSirn_Police Car Siren.Synthesized.Dry 2_EM.wav / newlocknew                           | [freesound.org](https://freesound.org/people/newlocknew/sounds/692525/)           | Attribution 4.0               | ja: in MP3 umgewandelt, komprimiert              |
| `car-engine.mp3`      | Motorcycle Engine_50Km/h.wav / Cmart94                                                   | [freesound.org](https://freesound.org/people/Cmart94/sounds/518178/)              | Attribution 4.0               | ja: in MP3 umgewandelt, komprimiert              |
| `tank-engine.mp3`     | Tank Engine Loop.flac / qubodup                                                          | [freesound.org](https://freesound.org/people/qubodup/sounds/200303/)              | Attribution 4.0               | ja: in MP3 umgewandelt, komprimiert              |
| `hit.mp3`             | Punch Punching Fist To Skin Hit / deleted_user                                           | [freesound.org](https://freesound.org/people/deleted_user_7146007/sounds/383882/) | Creative Commons 0            | ja: in MP3 umgewandelt, geschnitten, komprimiert |
| `pistol.mp3`          | Pistol (shooting only) / bolkmar                                                         | [freesound.org](https://freesound.org/people/bolkmar/sounds/455922/)              | Creative Commons 0            | ja: in MP3 umgewandelt, geschnitten, komprimiert |
| `machine-gun.mp3`     | Assault Rifle Shooting.wav / 18hiltc                                                     | [freesound.org](https://freesound.org/people/18hiltc/sounds/237273/)              | Attribution 4.0               | ja: in MP3 umgewandelt, geschnitten, komprimiert |
| `flamethrower.mp3`    | Flamethrower (loop) / raphavpires                                                        | [freesound.org](https://freesound.org/people/raphavpires/sounds/867029/)          | Creative Commons 0            | ja: in MP3 umgewandelt, geschnitten, komprimiert |
| `rocket-launcher.mp3` | custom_starwars_the_clonewars_inspired_rocket_launcher_firing_sounds_0407202 / Artninja, | [freesound.org](https://freesound.org/people/Artninja/sounds/849766/)             | Attribution 4.0               | ja: in MP3 umgewandelt, geschnitten, komprimiert |
| `explosion.mp3`       | m67_fragmentation_grenade_explosion_3_no_echo.flac / qubodup                             | [freesound.org](https://freesound.org/people/qubodup/sounds/67473/)               | Creative Commons 0            | ja: in MP3 umgewandelt, geschnitten, komprimiert |
| `helicopter.mp3`      | helicopterRaw_30sec.wav / lorenzosu                                                      | [freesound.org](https://freesound.org/people/lorenzosu/sounds/49483/)             | Attribution NonCommercial 4.0 | ja: in MP3 umgewandelt, geschnitten, komprimiert |
| `airplane.mp3`        | Interior airplane.WAV / ikbenraar                                                        | [freesound.org](https://freesound.org/people/ikbenraar/sounds/133496/)            | Creative Commons 0            | ja: in MP3 umgewandelt, geschnitten, komprimiert |
| `boat.mp3`            | LS_34803-2_FR_ShipCruising.wav / kevp888                                                 | [freesound.org](https://freesound.org/people/kevp888/sounds/647414/)              | Attribution 4.0               | ja: in MP3 umgewandelt, geschnitten, komprimiert |
| `swimming.mp3`        | 05913 swimming loop.wav / Robinhood76                                                    | [freesound.org](https://freesound.org/people/Robinhood76/sounds/317067/)          | Attribution NonCommercial 4.0 | ja: in MP3 umgewandelt, komprimiert              |

Wenn eine Datei **CC BY** oder **CC BY-NC** ist, gehört ihr Eintrag zusätzlich
sichtbar ins Spiel. Das steht unter dem Bild im aufklappbaren Abschnitt
**„Musik & Geräusche - Lizenzen"** und kommt aus `SOUND_CREDITS` in
`src/games/gta/audio/sounds.ts`. Also: Zeile hier eintragen **und** dort, sonst
steht die Nennung nur im Repo und nicht da, wo man das Spiel hört.

**Und zwar ab dem Moment, in dem die Datei hier liegt** - nicht erst, wenn das
Spiel sie abspielt: Alles unter `public/` wird mit der Seite ausgeliefert und
ist von dort herunterladbar, und genau das ist die Verbreitung, von der die
Lizenz redet. Die CC0-Dateien stehen bewusst **nicht** im Spiel: Dafür verlangt
niemand eine Nennung, und eine Liste, die auch das aufführt, liest keiner.

**Ein Sonderfall:** `helicopter.mp3` ist **CC BY-NC** - nur nicht-kommerziell.
Für dieses Spiel passt das (keine Werbung, nichts verkauft); sollte sich das je
ändern, muss die Datei getauscht werden. Deshalb steht die Lizenz im Spiel
ausgeschrieben da.

## Wie bearbeitet wurde

Die Dateien hier sind nicht die Originale von freesound.org, sondern für das
Spiel zurechtgeschnitten. Der Weg, damit es später nachvollziehbar und
wiederholbar ist:

1. **In MP3 umgewandelt** (aus WAV) - <https://convertio.co/de/wav-mp3/>
2. **Geschnitten** - <https://clideo.com/de/cut-audio>
3. **Komprimiert** - <https://www.freeconvert.com/de/mp3-compressor>

Diese Werkzeuge selbst wollen keine Namensnennung; der Punkt der Liste ist die
Nachvollziehbarkeit - und bei CC-BY-Dateien der Nachweis, dass und wie verändert
wurde.
