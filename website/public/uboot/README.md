# Ton für U-Boot

Hier liegen die Tondateien des Spiels. **Alle sind zurzeit leer** - sie stehen
als Platzhalter da, damit die Namen schon feststehen. Legt man eine echte MP3
mit demselben Namen hin, läuft sie ab dem nächsten Laden der Seite, ohne dass
im Code etwas geändert werden muss.

Solange eine Datei leer ist, nimmt das Spiel seinen **gerechneten Ton**
(`src/games/uboot/audio/sounds.ts`): ein paar Oszillatoren, ein Rauschen und
ein tiefes Brummen. Man hört also nie nichts - außer bei `antrieb.mp3`, dafür
gibt es absichtlich keinen Ersatz.

## Dateien

| Datei                 | Art       | Wann es läuft                                                     |
| --------------------- | --------- | ----------------------------------------------------------------- |
| `musik/tiefe.mp3`     | Schleife  | Während des ganzen Tauchgangs, am Regler **Musik**                |
| `sounds/antrieb.mp3`  | Schleife  | Solange Schub nach vorn anliegt - ohne Datei bleibt es hier still |
| `sounds/harpune.mp3`  | Einzelton | Bei jedem Harpunenschuss                                          |
| `sounds/torpedo.mp3`  | Einzelton | Bei jedem Torpedo                                                 |
| `sounds/seemine.mp3`  | Einzelton | Wenn eine Seemine gelegt wird                                     |
| `sounds/knall.mp3`    | Einzelton | Bei jeder Explosion: Torpedo, Seemine, Treibmine                  |
| `sounds/treffer.mp3`  | Einzelton | Wenn die eigene Hülle etwas abbekommt                             |
| `sounds/kreatur.mp3`  | Einzelton | Wenn ein Bewohner zerschossen wird                                |
| `sounds/luft.mp3`     | Einzelton | Einmal, wenn die Luft unter fünfzehn Sekunden fällt               |
| `sounds/sieg.mp3`     | Einzelton | Beim Durchfahren des Tors                                         |
| `sounds/verloren.mp3` | Einzelton | Wenn die Hülle durch ist oder die Luft alle                       |

- **Format:** `.mp3`
- **Benennung:** nach dem **Moment**, nicht nach dem Klang - `treffer`, nicht
  `bang2`. Welche Datei zu welchem Moment gehört, steht im Code genau einmal:
  in `FILES` und `LOOP_FILES` in `src/games/uboot/audio/samples.ts`.
- **Zwei Sorten:** Ein **Einzelton** bekommt jedes Mal ein eigenes Element,
  damit zwei Schüsse sich überlagern können. Eine **Schleife** läuft dauerhaft
  und wird nur an- und ausgeschaltet; davon gibt es zwei.
- **Lautstärke:** Die Musik hängt am Regler _Musik_, alles andere am Regler
  _Sound_ - beide im Zahnrad oben rechts auf der Seekarte.
- **Neues Geräusch:** Datei hier ablegen **und** im Code eintragen (ein Name in
  `Sample`, die Datei in `FILES`); wann es läuft, entscheidet `sing()` in
  `src/games/uboot/hooks/use-uboot-game.ts`.
- Fehlt eine Datei oder ist sie leer, bleibt es beim gerechneten Ton. Kaputt
  geht nichts.
- **Beim Verlassen des Spiels hört alles auf** - Schleifen wie Dauerton. Das
  macht `quiet()` in `src/games/uboot/audio/sounds.ts`, aufgerufen, wenn das
  Spielfenster abgeräumt wird. Ein Brummen, das einem auf die Spielesammlung
  folgt, sucht man dort vergeblich.

## Lizenzen

Noch keine - alle Dateien sind leer. **Sobald hier eine echte Aufnahme liegt,
gehört ihre Herkunft in diese Datei:** Titel, Autor, Quelle, Lizenz und ob sie
bearbeitet wurde (das übliche TASL-Schema). Alles unter `public/` wird mit der
Seite ausgeliefert und ist von dort herunterladbar - das ist die Verbreitung,
von der eine Lizenz redet, und zwar ab dem Moment, in dem die Datei hier liegt.

Verlangt eine Lizenz eine Namensnennung (CC BY, CC BY-NC), muss die Nennung
zusätzlich **sichtbar ins Spiel**, nicht nur ins Repo - so wie es GTA unter
`public/gta/sounds/README.md` vormacht.
