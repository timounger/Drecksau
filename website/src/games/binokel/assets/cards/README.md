# Binokel-Kartenbilder

Hier liegen die Bilder der Spielkarten. Zum Austauschen einfach die Dateien
unter denselben Namen ersetzen - im Code aendert sich nichts.

## Dateien (24 Karten + Rückseite)

Ein Bild pro Karte (beide Exemplare teilen sich dasselbe Bild). Namensschema:
`<farbe>-<rang>.webp`.

- Farben: `eichel`, `blatt`, `herz`, `schellen`
- Raenge: `daus`, `zehn`, `koenig`, `ober`, `unter`, `sieben`

Also z. B. `herz-daus.webp`, `schellen-unter.webp`, dazu `back.webp` (Rückseite).

Der Daus (Ass) heisst bewusst `daus` - der schwaebische Binokel-Begriff.

## Format

- **WebP**, **hochkant**, alle Karten **im selben Seitenverhaeltnis** (aktuell
  ca. **13:23**, die Bilder sind 130 x 230 px). Hoehere Aufloesung ist fuer
  scharfes Zoomen unproblematisch - als WebP bleibt die Datei klein.
- Das Verhaeltnis steht als `CARD_ASPECT` in [../card-images.ts](../card-images.ts)
  und muss zu den Bildern passen, sonst entstehen Raender (`object-contain`).
  Wenn du auf ein anderes Kartenformat wechselst, dort `CARD_ASPECT` anpassen.

## Warum hier und nicht in `public/`

Wie bei Drecksau per **Static Import** eingebunden - der `basePath` fuer GitHub
Pages stimmt dann automatisch, ein Tippfehler bricht den Build (statt still ein
kaputtes Bild), und `next/image` kennt die Groesse.
