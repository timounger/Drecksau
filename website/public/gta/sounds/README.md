# Geräusche

Hier liegen die Geräusche des Spiels - im Gegensatz zum Radio nebenan mit
**festen Namen**: Ein Sender ist irgendeine Datei im Ordner, ein Geräusch
gehört zu einem Moment.

## Dateien

| Datei              | Wann es läuft                                                                       |
| ------------------ | ----------------------------------------------------------------------------------- |
| `car-enter.mp3`    | Einmal beim Einsteigen in ein Auto                                                  |
| `police-siren.mp3` | Schleife, solange eine Streife auf Einsatz in Hörweite ist - je näher, desto lauter |

- **Format:** `.mp3`
- **Benennung:** Kleinbuchstaben mit Bindestrich, benannt nach dem **Moment**,
  nicht nach dem Klang: `car-enter`, später etwa `car-exit`, `car-crash`,
  `pickup`, `door-shop`. Dieselbe Schreibweise wie bei Panzerkiste
  (`public/panzerkiste/sounds/`).
- **Zwei Sorten:** Ein **Einzelton** passiert einmal und bekommt jedes Mal ein
  eigenes Element, damit zwei sich überlagern können. Eine **Schleife** wie die
  Sirene läuft dauerhaft und wird nur lauter und leiser - davon gibt es immer
  nur eine.
- **Zwei Sorten:** Ein **Einzelton** passiert einmal und bekommt jedes Mal ein
  eigenes Element, damit zwei sich überlagern können. Eine **Schleife** wie die
  Sirene läuft dauerhaft und wird nur lauter und leiser - davon gibt es immer
  nur eine.
- **Zwei Sorten:** Ein **Einzelton** passiert einmal und bekommt jedes Mal ein
  eigenes Element, damit zwei sich überlagern können. Eine **Schleife** wie die
  Sirene läuft dauerhaft und wird nur lauter und leiser - davon gibt es immer
  nur eine.
- **Neues Geräusch hinzufügen:** Datei hier ablegen **und** zwei Zeilen in
  `src/games/gta/audio/sounds.ts` ergänzen - einen Namen in `OneShot` und die
  Datei daneben in `FILES`. Ohne diese zwei Zeilen weiß das Spiel nicht, wann
  es abgespielt werden soll.
- Fehlt eine Datei, bleibt es still; kaputt geht nichts.
- Die Lautstärke ist dieselbe wie beim Radio: der Regler über dem Bild, ganz
  links ist stumm.

## Herkunft und Lizenz

Die Geräusche stammen von **freesound.org**.

Dort hat **jede Datei ihre eigene Lizenz** - meist CC0 (keine Namensnennung
nötig), oft aber auch CC BY (Namensnennung nötig) oder CC BY-NC. Deshalb wird
hier je Datei vermerkt, was gilt, und ob die Datei verändert wurde: Bei CC BY
verlangt die Lizenz ausdrücklich beides - Namensnennung **und** den Hinweis auf
Änderungen.

Das übliche Schema dafür ist **TASL**: Titel, Autor, Quelle, Lizenz - plus
„bearbeitet" mit einem Wort dazu, was gemacht wurde.

| Datei              | Titel / Autor                                                  | Quelle                                                                   | Lizenz          | Bearbeitet                                       |
| ------------------ | -------------------------------------------------------------- | ------------------------------------------------------------------------ | --------------- | ------------------------------------------------ |
| `car-enter.mp3`    | Car Door Open/Close (exterior perspective) / iainmccurdy       | [freesound.org](https://freesound.org/people/iainmccurdy/sounds/643122/) | Attribution 4.0 | ja: in MP3 umgewandelt, geschnitten, komprimiert |
| `police-siren.mp3` | VEHSirn_Police Car Siren.Synthesized.Dry 2_EM.wav / newlocknew | [freesound.org](https://freesound.org/people/newlocknew/sounds/692525/)  | Attribution 4.0 | ja: in MP3 umgewandelt                           |

Wenn eine Datei **CC BY** ist, gehört ihr Eintrag zusätzlich sichtbar ins
Spiel. Das steht unter dem Bild im Abschnitt **„Geräusche"** neben der Musik -
und kommt aus `SOUND_CREDITS` in `src/games/gta/audio/sounds.ts`. Also: Zeile
hier eintragen **und** dort, sonst steht die Nennung nur im Repo und nicht da,
wo man das Spiel hört.

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
