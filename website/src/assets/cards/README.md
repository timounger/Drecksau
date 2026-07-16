# Kartenbilder

Hier liegen die Bilder der Spielkarten. **Nicht** nach `public/` legen - der
Grund steht unten.

## Erwartete Dateien

Die Namen sind kebab-case (Coding-Regeln); der Code bildet sie in
[card-images.ts](card-images.ts) auf die Kartentypen ab.

| Datei                | Karte                  | Engine-Typ     |
| -------------------- | ---------------------- | -------------- |
| `mud.webp`           | Matsch                 | `mud`          |
| `rain.webp`          | Regen                  | `rain`         |
| `barn.webp`          | Stall                  | `barn`         |
| `lightning.webp`     | Blitz                  | `lightning`    |
| `lightning-rod.webp` | Blitzableiter          | `lightningRod` |
| `farmer-scrubs.webp` | Bauer schrubbt die Sau | `farmerScrubs` |
| `barn-door.webp`     | Bauer-ärgere-dich      | `barnDoor`     |
| `pig-clean.webp`     | Sauberschwein          | -              |
| `pig-dirty.webp`     | Drecksau               | -              |

### Erweiterung „Sauschön"

| Datei             | Karte         | Engine-Typ  |
| ----------------- | ------------- | ----------- |
| `beauty.webp`     | Schönsau      | `beauty`    |
| `dust-off.webp`   | Aus dem Staub | `dustOff`   |
| `lucky-bird.webp` | Glücksvogel   | `luckyBird` |

**Die Schönsau ist quer, nicht hoch.** Sie ist im echten Spiel eine einzige
Karte mit zwei Rollen: Man haelt sie auf der Hand und legt sie dann auf ein
Schwein. Deshalb liegt sie im Schweine-Format vor und wird an beiden Stellen
quer angezeigt - eine zweite Datei braucht es nicht.

## Format

- **WebP.** Gegenueber PNG spart es hier rund **85 Prozent** (1113 KB -> 172 KB)
  ohne sichtbaren Unterschied. Qualitaet ca. 0.9; darunter drohen Artefakte in
  den Farbverlaeufen. Alle aktuellen Browser koennen WebP, auch mit Transparenz.
- **Aktionskarten hochkant**, Seitenverhaeltnis **5:8** - Richtwert
  **400 x 640 px**.
- **Schweinekarten und Schönsau quer**, Seitenverhaeltnis **8:5** - Richtwert
  **640 x 400 px**.

### Warum so gross - die App zeigt sie doch klein?

Die App zeigt die Karten mit hoechstens **100 x 160** (hochkant) bzw.
**112 x 70** (quer) an; `max-w-32` deckelt sie, auf schmalen Fenstern werden sie
kleiner. Fuer die reine 1:1-Anzeige wuerde also das Doppelte reichen.

Es zaehlt aber der **Zoom**: Wer im Browser hineinzoomt oder auf dem Handy
aufzieht, bekommt mehr echte Pixel pro CSS-Pixel - und das Bild soll scharf
bleiben. Gemessen an `pig-clean` (639 px):

| Zoom | echte Pixel noetig | 639 px reichen? |
| ---- | ------------------ | --------------- |
| 1x   | 112                | ja              |
| 2x   | 224                | ja              |
| 3x   | 336                | ja              |
| 5x   | 560                | ja              |

Deshalb ist reichlich Aufloesung hier **richtig**, nicht verschwenderisch. Als
WebP kostet ein 640-px-Schwein nur rund 15 KB - der Zoom ist das billiger zu
haben als die Ladezeit teuer.

Die Grenze bleibt die Dateigroesse: Ein Bild-Optimierer existiert nicht
(`images: { unoptimized: true }`, noetig fuer GitHub Pages), es geht exakt die
abgelegte Datei ueber die Leitung. Solange die Summe im Bereich von etwa
150-250 KB bleibt, ist das unauffaellig.

### Seitenverhaeltnis einheitlich halten

Die Bilder werden mit `object-contain` in einen festen Rahmen gezeichnet, nichts
wird verzerrt. Weicht ein Bild im Verhaeltnis ab, erscheint es dafuer etwas
kleiner als seine Nachbarn. Einheitliche 5:8 bzw. 8:5 sehen am ruhigsten aus.

## Warum hier und nicht in `public/`

Bilder werden per **Static Import** eingebunden
(`import mud from "@/assets/cards/mud.webp"`). Das hat vier Vorteile:

1. **Der `basePath` stimmt automatisch.** Die Seite laeuft auf GitHub Pages
   unter `/Drecksau`. Bei einem Pfad aus `public/` erzeugt `next/image` die URL
   `/cards/mud.webp` - **ohne** Praefix. Lokal geht das, auf GitHub Pages ist es
   ein 404. Beim Static Import wird daraus
   `/Drecksau/_next/static/media/mud.<hash>.webp`. (Steht auch so in der
   Next-Doku: "you will need to add the basePath in front of src".)
2. **Tippfehler brechen den Build**, statt still ein kaputtes Bild zu zeigen.
3. **Groesse ist bekannt** - `next/image` setzt width/height selbst, das Layout
   springt beim Laden nicht.
4. **Dauerhaft cachebar** durch den Hash im Dateinamen. Dateien aus `public/`
   liefert Next mit `Cache-Control: max-age=0` aus.

## Rechtliches

Die Original-Illustrationen von Drecksau (Kosmos) sind urheberrechtlich
geschuetzt. Scans der gekauften Karten duerfen **nicht** auf einer oeffentlichen
Seite landen. Selbst gezeichnete oder anderweitig lizenzierte Bilder sind
unproblematisch.
