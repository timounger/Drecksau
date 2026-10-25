# Sherlock Holmes - Rätselsammlung

118 Rätsel rund um Sherlock Holmes und Dr. Watson zum Selberlösen: Logik,
Zahlen, Wörter, Bilder und kleine Kriminalfälle. Lesen, grübeln, dann die
Lösung nachlesen und das Rätsel als gelöst markieren.

Vorlage sind die Fotos der Buchseiten unter
`game_instructions/Sherlock Holmes – Rätselsammlung/Screens/` (`Seite NNN.png`,
Seiten 6 bis 127: Inhaltsverzeichnis, Rätsel und Lösungen). Das Buch hat vier
Teile; jedes Rätsel steht hier mit deutschem Titel, dem englischen
Originaltitel, dem Text und der Lösung auf Deutsch.

## Aufbau

```
sherlock/
  engine/
    types.ts     Rätsel, Teil, Bild - was ein Rätsel ausmacht
    puzzles.ts   alle Rätsel nach Nummer, PART_ORDER, byId, neighbours
  puzzles/       die Daten je Teil: elementary.ts (1-30), straightforward.ts,
                 cunning.ts, fiendish.ts (bis 118)
  hooks/         use-sherlock.ts - offenes Rätsel, Uhr, Speicherung im Browser
  components/    Spiel und Liste, Filter, Text und Bilder, Druckseite, Statistik
  i18n/          Texte und Spielregeln
  assets/        logo.webp
```

Die Bilder, die ein Rätsel braucht (die Buchstabengitter der Wordknots, der
Zettel), liegen unter `public/sherlock/` und stehen am Rätsel in `images`.

## Teile und Liste

| Im Buch         | Hier      | Lupen | Nummern |
| --------------- | --------- | ----- | ------- |
| Elementary      | Elementar | 1     | 1-30    |
| Straightforward | Einfach   | 2     | 31-62   |
| Cunning         | Knifflig  | 3     | 63-91   |
| Fiendish        | Teuflisch | 4     | 92-118  |

- Chips für "Alle" und die vier Teile, jeweils mit Zahl und Lupen; der
  gewählte in der Farbe seines Teils.
- Die **Suche** geht über deutschen Titel, englischen Originaltitel und den
  Text. Ein × im Feld oder Esc leert sie. Sie wirkt zusammen mit dem
  gewählten Teil; die Zahlen auf den Chips zeigen, was ein Klick zeigen würde.
- "Gelöste ausblenden" blendet gelöste Rätsel aus.
- Filter, Suche und Häkchen bleiben im Browser gespeichert
  (`drecksau-app/sherlock/list`). Zurück aus einem Rätsel steht die Liste wie
  verlassen, an derselben Stelle.
- Eine Kachel zeigt Nummer, Titel, Originaltitel, Teil, den Anfang des Texts,
  den Stand (öffnen, weiter grübeln, gelöst), "EN" für englische
  Worträtsel und ein Bildsymbol, wenn das Rätsel Bilder hat.

## Ein Rätsel

- Oben Nummer und deutscher Titel, der Teil, klein der Originaltitel, dann
  die Leiste mit Uhr, ← → (voriges und nächstes Rätsel nach Nummer) und "Zu
  den Rätseln". Ein offenes Rätsel ist ein Schritt in der Browser-Historie:
  "Zurück" führt zur Liste.
- Der Text in Absätzen, darunter die Bilder (so breit wie die Spalte, höchstens
  36rem). Englische Worträtsel (`english: true`) tragen den Hinweis
  "Englisches Worträtsel - die Wörter bleiben englisch".
- **Lösung ansehen** zeigt die Lösung sofort, ohne Rückfrage; "Lösung
  ausblenden" verbirgt sie wieder. Jedes Rätsel, dessen Lösung einmal offen
  war, zählt in der Statistik unter "Lösung angesehen". Anders als bei Murdle zählt das Rätsel
  trotzdem, wenn man es danach als gelöst markiert - man prüft seine Antwort
  ja mit der Lösung.
- **Gelöst** markiert das Rätsel als gelöst und hält die Uhr an; ein zweiter
  Druck nimmt es zurück, die Uhr läuft weiter.
- Die **Uhr** läuft, solange das Rätsel offen, sichtbar und nicht gelöst ist
  (Lücken über einer Minute zählen nicht).
- **Drucken / PDF** öffnet `/sherlock/drucken/<id>/` in einem neuen Tab
  ([components/puzzle-print.tsx](components/puzzle-print.tsx)) mit dem
  geteilten Druckrahmen
  ([components/print-sheet.tsx](../../components/print-sheet.tsx)): Kopf mit
  Sammlung, Nummer und Teil, Titel und Originaltitel, Text und Bilder; nach
  einem Seitenumbruch die Seite "Lösung". Der Tab-Titel und damit der
  PDF-Name ist "Sherlock Holmes - 12. Titel".

## Vorlesen

Mit der Sprachausgabe des Browsers (Web Speech API, `speechSynthesis`), ohne
weitere Abhängigkeiten ([hooks/use-read-aloud.ts](hooks/use-read-aloud.ts),
[engine/read-aloud.ts](engine/read-aloud.ts),
[components/read-aloud-controls.tsx](components/read-aloud-controls.tsx)).

- **🔊 Vorlesen** über dem Text liest "Rätsel N: Titel", alle Absätze und bei
  Bildern deren Beschreibung (`alt`). Buchstabengruppen darin werden
  buchstabiert ("1. CDP" wird "1: C D P"). Englische Worträtsel werden mit
  derselben deutschen Stimme gelesen.
- Während des Lesens: **⏸ Pause** / **▶ Weiter** und **⏹ Stopp**. Ist die
  Lösung offen, hat sie ihren eigenen Knopf **🔊 Lösung vorlesen**; "Lösung
  ausblenden" beendet ihr Vorlesen.
- Das Vorlesen endet von selbst beim Wechsel zu einem anderen Rätsel, zurück
  zur Liste und beim Verlassen der Seite (`pagehide`/`beforeunload`).
- Der Text wird in Sätze bis etwa 220 Zeichen zerlegt und Stück für Stück
  gesprochen - Chrome bricht lange Äußerungen sonst nach rund 15 Sekunden ab.
- **Stimme**: standardmäßig die beste deutsche (`de-*`); Namen mit "Natural",
  "Online", "Google Deutsch", "Katja", "Hedda" usw. gehen vor. Die Stimmen
  kommen in manchen Browsern erst später (`voiceschanged`). Unter
  "⚙ Vorlese-Stimme" lassen sich Stimme und Tempo (0,8 / 1 / 1,2) wählen,
  gespeichert unter `drecksau-app/sherlock/speech`.
- **Mitlesen**: Die Absätze stehen Wort für Wort als eigene Spans da
  (getrennt nur an Leerzeichen, Anführungszeichen und Satzzeichen bleiben am
  Wort). Das gerade gesprochene Wort ist hellgelb hinterlegt - aus den
  `boundary`-Ereignissen der Äußerung (`charIndex` plus der Stelle, an der
  das Stück im Absatz beginnt). Titel und "Lösung" leuchten ganz, solange sie
  gelesen werden; bei einem Bild bekommt das Bild einen gelben Rahmen. Läuft
  das Wort aus dem Bildschirm, scrollt die Seite sanft nach.
- **Ersatz ohne Wortgrenzen**: Manche Stimmen (einige Microsoft-Online- und
  Android-Stimmen) melden keine Wortgrenzen. Kommt in der ersten Sekunde
  eines Stücks keine, wird für diese Stimme der ganze Satz (das Stück)
  hinterlegt.
- **Ab hier vorlesen**: Ein Klick auf ein Wort markiert es (violetter Rahmen,
  ein zweiter Klick nimmt die Marke weg); "Vorlesen" heißt dann "Vorlesen ab
  Markierung" und beginnt dort, ebenso "Weiter" nach einer Pause. Während
  des Lesens springt ein Klick sofort zu dem Wort. Das Stückeln beginnt am
  gewählten Wort. Ein Klick zählt nur ohne Textauswahl - Markieren zum
  Kopieren geht weiter.
- Kann der Browser nicht sprechen, gibt es die Knöpfe nicht.

## Speicherung und Statistik

Gelöste Rätsel, angesehene Lösungen und die Zeit je Rätsel liegen unter
`drecksau-app/sherlock/puzzles`. Das erste Öffnen eines Rätsels zählt in der
Sammlungsstatistik als begonnenes Spiel, "Gelöst" als gewonnenes. Die Seite
`/sherlock/statistik` zeigt dazu je Teil und gesamt: gelöst (mit Balken),
Lösung angesehen und die Zeit.

## Übersetzung

Texte und Lösungen sind ins Deutsche übertragen; Namen und Orte bleiben wie
im Buch. Rätsel über englische Wörter oder Buchstaben (Wordknots,
Camouflages, Buchstabencodes) behalten ihre englischen Wörter, nur der Rest
ist deutsch.
