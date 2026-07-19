# Binokel

Das schwäbische Stichspiel [Binokel](https://de.wikipedia.org/wiki/Binokel) als
Browserspiel - gegen Computergegner oder online mit Freunden.

Gereizt, gemeldet, gestochen: Wer das Spiel bekommt, nimmt den Dabb auf, drückt
weg, sagt Trumpf an, meldet seine Kartenkombinationen und muss dann seinen
Reizwert erspielen. Gespielt wird über mehrere Runden bis zur Zielpunktzahl.

## Aufbau des Spielmoduls

```text
games/binokel/
  engine/       reine Spiel-Logik, ohne React (Karten, Zustand, Zuege, Melden, KI)
  components/   React-Oberflaeche (Spielbrett, Karten, Online-UI) - geteilte
                Bausteine in binokel-parts.tsx
  hooks/        Bindeglied zwischen Engine und React (lokales Spiel, Online-Raum)
  multiplayer/  Binokel-Bindung (adapter.ts) an die geteilte Online-Schicht
  assets/       Kartenbilder und Farb-Symbole - siehe assets/cards/README.md
  settings/     Spiel- und Lobby-Einstellungen (localStorage)
  i18n/         deutsche Texte (Karten- und Meld-Namen, Online-Texte)
```

Die Engine ist vollständig von der Oberfläche getrennt und rein funktional -
jeder Zug erzeugt einen neuen Zustand. Dadurch ist sie ohne Browser testbar, und
mit demselben Seed läuft eine Partie identisch ab.

## Regeln

Die verbindliche Spezifikation - Karten, Melden, Reizen, Durch, Bete und
Punktwertung - steht in
[docs/games/binokel/game-rules.md](../../../../docs/games/binokel/game-rules.md).
Diese README beschreibt die App und ihre Einstellungen; die Spielregeln stehen
dort, nicht hier.

## Online-Multiplayer

Mit Freunden per Raumcode/Link, gehostet auf GitHub Pages über Firebase als
Echtzeit-Leitung. Der Modus liegt unter `/binokel/online`.

Die eigentliche Raum-Logik - Verbindung, Sitze, Schiedsrichter, Übernahme beim
Weggehen des Gastgebers - ist spielunabhängig und in der geteilten Schicht
`src/online/` untergebracht; Binokel dockt nur mit einem Adapter an
([multiplayer/adapter.ts](multiplayer/adapter.ts)). Er sorgt dafür, dass jeder
Spieler nur seine eigenen Karten sieht (die anderen Hände und der verdeckte Dabb
sind aus dem geteilten Zustand herausgerechnet) und dass der Gastgeber jeden Zug
prüft, bevor er ihn ausführt.

Zum Starten sind **mindestens drei Spieler** nötig (bis zu sechs). Reagiert ein
Spieler nicht, kann der Computer seinen Zug nach einer einstellbaren Zeit
übernehmen; verlässt der Gastgeber die Seite, übernimmt der erste verbliebene
Spieler und der Computer spielt den frei gewordenen Sitz weiter.

## Einstellungen

Unter **Einstellungen** ([components/binokel-settings-view.tsx](components/binokel-settings-view.tsx))
je Spiel gespeichert. Deck- und Tisch-Optionen gelten ab der nächsten Partie;
die Farb-Reihenfolge und die Schwierigkeit wirken sofort.

- **Mit 7ern:** 48-Karten-Deck (mit Siebenern) statt 40 Karten.
- **Mit Dabb:** mit Dabb (Widow) und Drücken. Aus: die Karten werden gleichmäßig
  verteilt, es wird nicht gedrückt.
- **Spieleranzahl:** 3 bis 6. Hand- und Dabb-Größe passen sich an; die 240 Augen
  des Decks bleiben immer im Spiel.
- **In Teams:** nur bei 4 oder 6 Spielern - zwei Gruppen über Kreuz (2er- bzw.
  3er-Teams), die ihre Punkte zusammenzählen.
- **Farb-Reihenfolge:** in welcher Reihenfolge die Handkarten sortiert werden.
- **Schwierigkeit:** wie stark die Computergegner spielen (siehe unten).

## Schwierigkeit

Unter **Einstellungen** wählbar: **Leicht**, **Mittel** (Standard) oder
**Schwer**. Auf keiner Stufe schaut der Gegner in deine Handkarten - schwerer
heißt cleverer, nicht unfairer. Der Code steht in [engine/ai.ts](engine/ai.ts).

- **Leicht:** reizt zaghaft und spielt eine zufällige erlaubte Karte - die
  schwächste Spielweise.
- **Mittel:** reizt bis zur Handschätzung und spielt stets die billigste erlaubte
  Karte.
- **Schwer:** kämpft härter ums Spiel und cash't seine Sticher - spielt beim
  Ausspielen die stärkste Karte, um Trümpfe zu ziehen und Punkte zu holen.

Die Stufe wirkt sofort auf die KI (auch online, wenn der Computer einen Sitz
übernimmt). Wer das Reizen eröffnet, ist auf jeder Stufe zufällig und wandert
danach reihum mit dem Geber.

## Kartenbilder

Die Karten- und Farb-Bilder liegen unter [assets/](assets/) und sind über die
Dateinamen austauschbar - siehe [assets/cards/README.md](assets/cards/README.md).
