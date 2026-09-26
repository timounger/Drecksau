# Lademusik - Musik über dem Ladebild

Hier hinein kommen die Lieder, die laufen, **während Los Santos aufgebaut
wird** - also solange das Splash-Bild mit dem Balken zu sehen ist. Pro Aufbau
wird eines davon **zufällig** gezogen, genau wie das Bild dahinter aus
`../splash/`.

## Dateien

- **Format:** `.mp3` (auch `.m4a`, `.ogg`, `.opus`, `.webm`, `.wav`)
- **Benennung:** `Künstler - Titel.mp3`. Im Code steht **kein Dateiname** - die
  Seite liest beim Bauen den Ordner aus. Aus dem Namen wird der Nachweis auf
  der Spielseite, deshalb lohnt sich das Schema. Umbenennen ist nicht nötig:
  Wie die Datei heißt, ist allein eine Frage des Nachweises.
- **Wie viele:** beliebig. Je mehr hier liegen, desto seltener hört man
  dasselbe Lied zweimal.
- **Danach:** einmal neu bauen bzw. deployen, damit die Liste in der Seite
  landet. Auf GitHub Pages funktioniert das wie bei `../splash/`.
- Diese Datei bleibt liegen - gezählt werden nur Audiodateien.

## Warum ein eigener Ordner

Neben diesem liegt `../radio/` mit den Sendern für das Autoradio. Das sind zwei
verschiedene Aufgaben: Ein Sender ist etwas, in das man sich hineinsetzt, die
Lademusik ist die Ouvertüre davor. Ein Lied, das in beiden Ordnern liegt, ist
beides - erlaubt, aber doppelt abgelegt.

## Wann es still bleibt

Beim **direkten Aufruf** von `/gta` (Adresszeile, F5) bleibt es stumm, und
daran ist nichts kaputt: Browser spielen erst Ton ab, wenn die Seite einmal
angefasst wurde. Wer über die Spielesammlung hereinklickt oder „Neues Spiel"
drückt, hat sie angefasst - dann läuft die Musik. Fehlt eine Datei oder mag der
Browser das Format nicht, ist es genauso still, und das Spiel läuft weiter.

Eingeblendet wird in einer Viertelsekunde, ausgeblendet in knapp einer
Sekunde. Kurz herein, weil der ganze Ladebildschirm nur etwa eine Sekunde
dauert - mit einer langen Blende wäre die Musik da, aber nicht zu hören.
Langsam hinaus, weil der Moment, auf den man wartet, der Schnitt auf die Straße
ist und ein Lied, das dort abrupt abbricht, nach Fehler klingt. Die Lautstärke ist dieselbe wie bei Radio und Geräuschen - der Regler
über dem Bild, ganz links ist stumm.

## Herkunft und Lizenz

Die Musik stammt vom **Free Music Archive** (<https://freemusicarchive.org/>)
und steht unter **CC BY** (<https://creativecommons.org/licenses/by/4.0/>).

Die Lizenz verlangt Titel, Künstler, Quelle und Lizenz. Das erledigt das Spiel
von selbst: Unter dem Bild steht der aufklappbare Abschnitt **„Musik &
Geräusche - Lizenzen"**, und darin die Lieder aus **diesem** Ordner und aus
`../radio/` in einer Liste. Alles davon kommt aus den Dateinamen.

### Hier verwendet

<!-- Nur nötig, wenn ein Stück nicht CC BY ist oder anders heißt als die Datei. -->

- Alle Lieder in diesem Ordner: Free Music Archive, CC BY.
