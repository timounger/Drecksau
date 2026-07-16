# Kartenbilder

Hier liegen die Bilder der Spielkarten. **Nicht** nach `public/` legen - der
Grund steht unten.

## Erwartete Dateien

Die Namen sind kebab-case (Coding-Regeln); der Code bildet sie auf die
Kartentypen ab.

| Datei               | Karte                  | Engine-Typ     |
| ------------------- | ---------------------- | -------------- |
| `mud.png`           | Matsch                 | `mud`          |
| `rain.png`          | Regen                  | `rain`         |
| `barn.png`          | Stall                  | `barn`         |
| `lightning.png`     | Blitz                  | `lightning`    |
| `lightning-rod.png` | Blitzableiter          | `lightningRod` |
| `farmer-scrubs.png` | Bauer schrubbt die Sau | `farmerScrubs` |
| `barn-door.png`     | Bauer-ärgere-dich      | `barnDoor`     |
| `pig-clean.png`     | Sauberschwein          | -              |
| `pig-dirty.png`     | Drecksau               | -              |

## Format

- **PNG** (mit Transparenz) oder **WebP** (deutlich kleiner).
- Hochkant, Seitenverhaeltnis der echten Karten (ca. 2:3).
- Breite **ca. 320-400 px**. Der Build hat keinen Bild-Optimierer
  (`images: { unoptimized: true }`, noetig fuer den statischen Export), es wird
  also genau die abgelegte Datei ausgeliefert. Ein 4000-px-Scan wuerde
  ungenutzt in voller Groesse ueber die Leitung gehen.
- Alle Karten im gleichen Seitenverhaeltnis, sonst springt das Layout.

## Warum hier und nicht in `public/`

Bilder werden per **Static Import** eingebunden
(`import mud from "@/assets/cards/mud.png"`). Das hat vier Vorteile:

1. **Der `basePath` stimmt automatisch.** Die Seite laeuft auf GitHub Pages
   unter `/Drecksau`. Bei einem Pfad aus `public/` erzeugt `next/image` die URL
   `/cards/mud.png` - **ohne** Praefix. Lokal geht das, auf GitHub Pages ist es
   ein 404. Beim Static Import wird daraus
   `/Drecksau/_next/static/media/mud.<hash>.png`. (Steht auch so in der
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
