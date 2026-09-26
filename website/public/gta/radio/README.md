# Autoradio - Musik und Nachweise

Hier hinein kommen die Lieder, die im Auto laufen.

## Dateien

- **Format:** `.mp3` (auch `.m4a`, `.ogg`, `.opus`, `.webm`, `.wav`)
- **Benennung:** `Künstler - Titel.mp3`. Im Code steht kein Dateiname - die
  Seite liest beim Bauen den Ordner aus. Aus dem Namen macht das Spiel die
  Anzeige unten rechts **und** den Nachweis auf der Spielseite, deshalb lohnt
  sich das Schema.
- **Wie viele:** beliebig. Jedes Einsteigen in ein anderes Auto schaltet auf
  einen anderen Sender; mit dem Mausrad schaltet man im Auto weiter, eine
  Raste hinter dem letzten Lied ist "Radio aus".
- **Danach:** einmal neu bauen bzw. deployen, damit die Liste in der Seite
  landet. Auf GitHub Pages funktioniert das wie bei `public/gta/splash/`.
- Diese Datei bleibt liegen - gezählt werden nur Audiodateien.

## Herkunft und Lizenz

Die Musik stammt vom **Free Music Archive** (<https://freemusicarchive.org/>)
und steht unter **CC BY** (<https://creativecommons.org/licenses/by/4.0/>).

Die Lizenz verlangt eine angemessene Namensnennung: **Titel, Künstler, Quelle
(Free Music Archive) und Lizenz (CC BY)**. Das Spiel erledigt das von selbst:

- Unter dem Bild steht auf der Spielseite der Abschnitt **"Musik"** mit einer
  Zeile je Lied - Titel, Künstler, Quelle, Lizenz, jeweils verlinkt.
- Beim Fahren steht der laufende Titel unten rechts im Bild.

Beides kommt aus den Dateinamen. Wer eine Datei anders benennt als
`Künstler - Titel.mp3`, steht im Nachweis ohne Künstler - dann bitte den
Namen korrigieren oder die Zeile unten von Hand ergänzen.

### Hier verwendet

<!-- Nur nötig, wenn ein Stück nicht CC BY ist oder anders heißt als die Datei. -->

- Alle Lieder in diesem Ordner: Free Music Archive, CC BY.
