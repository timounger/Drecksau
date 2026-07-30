# Krakel Orakel

Ein kooperatives Mal- und Rätselspiel. Alle malen **gleichzeitig** ihr eigenes
geheimes Wort auf eine eigene Tafel - und zwar nur entlang der vorgedruckten
Punkte. Danach liegen alle Bilder offen, dazu eine Wortliste mit allen gemalten
Wörtern **plus vier, die niemand gemalt hat**. Reihum streicht ihr die
Zusatzwörter weg. Richtig gestrichen bringt Punkte, ein gemaltes Wort kostet
welche.

Es gibt **keine Einzelwertung**: ihr spielt gemeinsam gegen die Punktzahl.

## Nur online

Krakel Orakel braucht Mitspieler - allein gibt es nichts auszuschließen, und
einen Computergegner gibt es nicht. Das Spiel läuft daher ausschließlich unter
`/krakel/online`, entweder über einen privaten Raumcode oder über die
automatische Suche.

Bei der Suche zählen **Spielerzahl und Schwierigkeit**: Stimmen beide überein,
startet die Runde sofort; sonst wird nach 20 Sekunden auch ein anderer
Wunschtisch genommen.

## Aufbau des Spielmoduls

```text
games/krakel/
  engine/       Regeln, Wertung, Wortlisten und die gedruckten Tafeln
  components/   Spielbrett, Karten-Canvas und der Online-Bildschirm
  hooks/        die Netz- und Renderschleife
  multiplayer/  das Datenmodell fuer die Leitung
  settings/     Name, Spielerzahl und Schwierigkeit im Browser
  i18n/         deutsche Texte
  assets/       das Cover-Logo
```

Die Engine ist rein und serialisierbar; die Uhr wird von außen hereingereicht,
damit die Regeln ohne Browser testbar bleiben.

## Die Tafeln

Die 14 Zeichenvorlagen sind **nicht erzeugt**, sondern von Scans der echten
Spielbretter abgenommen - Punkt für Punkt, zusammen 26.117 Stück. Sie liegen
kodiert in [engine/boards-data.ts](engine/boards-data.ts) (generiert, nicht von
Hand ändern); Decoder und Einrasten des Stifts stehen in
[engine/boards.ts](engine/boards.ts).

Format, Seitenverhältnis und der Weg, einen neuen Scan einzulesen, stehen in
[docs/games/krakel/tafeln-und-woerter.md](../../../../docs/games/krakel/tafeln-und-woerter.md).

## Die Wörter

Zwei Listen in [engine/words.ts](engine/words.ts), eine je Schwierigkeit:
**leicht** (238 Wörter, überwiegend Dinge, die man malen kann) und **schwer**
(239 Wörter, dazu Ideen, Orte und Tätigkeiten ohne festes Bild). Ein Spiel zieht
immer nur aus einer davon.

Innerhalb einer Liste darf kein Wort doppelt vorkommen - sonst könnten zwei
Personen denselben Begriff bekommen. Ein Test prüft das.

## Regeln im Detail

Die verbindliche Spezifikation samt aller bewussten Festlegungen steht in
[docs/games/krakel/game-rules.md](../../../../docs/games/krakel/game-rules.md).

## Cover-Logo

Das Bild liegt in [assets/logo.webp](assets/logo.webp) - aktuell ein Platzhalter,
den man durch echte WebP-Grafik ersetzen kann.
