# Drecksau

Das Kartenspiel [Drecksau](<https://de.wikipedia.org/wiki/Drecksau_(Spiel)>)
(Frank Bebenroth, Kosmos) als Browserspiel - gegen Computergegner oder online
mit Freunden.

Wer zuerst nur noch Drecksäue und kein sauberes Schwein mehr vor sich liegen
hat, gewinnt.

## Aufbau des Spielmoduls

```text
games/drecksau/
  engine/       reine Spiel-Logik, ohne React (Karten, Zustand, Zuege, KI)
  components/   React-Oberflaeche (Spielbrett, Karten, Online-UI)
  hooks/        Bindeglied zwischen Engine und React
  multiplayer/  Online-Modus (host-autoritativ, Firebase) - siehe multiplayer/README.md
  assets/cards/ Kartenbilder je Design - siehe assets/cards/README.md
  settings/     App- und Lobby-Einstellungen (localStorage)
  i18n/         deutsche Texte (Kartennamen, Log) und Gegnernamen
```

Die Engine ist vollstaendig von der Oberflaeche getrennt und rein funktional -
jeder Zug erzeugt einen neuen Zustand. Dadurch ist sie ohne Browser testbar, und
mit demselben Seed laeuft eine Partie identisch ab.

## Regeln

Die verbindliche Spezifikation - Kartenwirkungen, Siegbedingungen, bewusste
Festlegungen und die offiziellen Kosmos-Anleitungen als Quelle - steht in
[docs/games/drecksau/game-rules.md](../../../../docs/games/drecksau/game-rules.md).
Diese README beschreibt die App und ihre Einstellungen; die Spielregeln stehen
dort, nicht hier.

## Online-Multiplayer

Mit Freunden per Raumcode/Link, gehostet auf GitHub Pages ueber Firebase als
Echtzeit-Leitung. Aufbau, Einrichtung und Grenzen stehen in
[multiplayer/README.md](multiplayer/README.md).

## Spielername

Unter **Einstellungen** eintragbar. Er erscheint im Spielverlauf neben den
Mitspielern („Timo: Matsch! …“). Bleibt das Feld leer, heisst der Spieler
schlicht **„Du"**.

Direkte Anreden bleiben immer beim „Du" („Du bist dran", „Deine Schweine",
„Du hast gewonnen!") - der Name ersetzt nur die dritte Person. Waehlt man den
Namen eines Gegners, weicht dieser auf einen anderen aus; zwei Bertas im
Spielverlauf waere unlesbar.

### Namen der Computergegner

Werden pro Partie aus einem Pool gezogen
([i18n/player-names.ts](i18n/player-names.ts)) - jedes Spiel ein anderer Tisch.

Wichtig dabei: Sie kommen aus dem **Seed der Partie**, nicht aus `Math.random()`.
Zwei Gruende:

- Das erste Spiel wird beim Build **vorgerendert**. Echter Zufall wuerde im
  Browser andere Namen erzeugen als im ausgelieferten HTML - Hydration-Fehler.
- Die Engine ist gesaet: gleicher Seed, gleiche Partie. Darauf bauen die Tests.

## Erweiterung „Sauschön“

Unter **Einstellungen** zuschaltbar, standardmaessig **aus** - ohne sie ist es
das unveraenderte Grundspiel. Ist sie an, gibt es einen zweiten Weg zum Sieg und
einen geaenderten Aufbau. Die Umschaltung gilt ab dem naechsten Spiel; welche
Karten und Regeln dazukommen, steht in
[game-rules.md](../../../../docs/games/drecksau/game-rules.md).

## Zusatzkarten „Drecksau total“

Eigene Einstellung, Standard **aus**. Bringt zwei **Verteidigungskarten**
(Extra-Matsch, Lippenstift), die **automatisch** ausloesen, wenn eine eigene Sau
angegriffen wird - aktiv spielen kann man sie nicht, auf der Hand nur ablegen.
Was genau sie schuetzen und warum sie automatisch ausloesen, steht in
[game-rules.md](../../../../docs/games/drecksau/game-rules.md).

## Schwierigkeit

Unter **Einstellungen** waehlbar: **Leicht**, **Mittel** (Standard) oder
**Schwer**. Auf keiner Stufe schaut der Gegner in deine Handkarten - schwerer
heisst cleverer, nicht unfairer. Der Code steht in [engine/ai.ts](engine/ai.ts).

- **Leicht:** spielt meist zufaellig (nimmt aber einen sofortigen Sieg mit).
  **Du faengst immer an.**
- **Mittel:** die Heuristik - bester Zug pro Runde, zielt schon leicht auf den
  Fuehrenden. Zufaelliger Startspieler.
- **Schwer:** die Heuristik **plus ein Zug Vorausschau** - steht ein Gegner einen
  Zug vor dem Sieg, wird er bevorzugt zurueckgesetzt. Zufaelliger Startspieler.

Die Stufe wirkt sofort auf die KI (auch online, wenn der Computer einen Sitz
uebernimmt); der Startspieler wird beim Austeilen des naechsten Spiels festgelegt.

## Kartendesign

Unter **Einstellungen** waehlbar: **Modern** (Standard), **Klassisch** oder
**Benjamin Blümchen**. Rein visuell, darum wirkt die Umschaltung **sofort** -
kein neues Spiel noetig.

Jedes Design ist ein Bildordner ([assets/cards/](assets/cards/)) mit denselben
Dateinamen. Ein weiteres Design anzulegen heisst: neuer Ordner, ein Eintrag in
der Theme-Liste und ein Import-Block - siehe [assets/cards/README.md](assets/cards/README.md).

## Animationen

Wird eine Karte gespielt - egal von wem - laeuft ein kurzer Effekt ueber den
Bildschirm: Regen regnet, der Blitz blitzt, Matsch spritzt. Am Spielende kommt
eine groessere Animation (Trophäe bei Sieg, Scheißhaufen bei Niederlage). Die
Effekte liegen in [components/action-effect-overlay.tsx](components/action-effect-overlay.tsx)
und [components/game-result-overlay.tsx](components/game-result-overlay.tsx), die
Keyframes in [globals.css](../../app/globals.css).

Abschalten unter **Einstellungen**. Standardmaessig **an** - mit einer Ausnahme:
Steht das Betriebssystem auf „Bewegung reduzieren" (`prefers-reduced-motion`),
sind sie zunaechst aus. Einschalten laesst sie sich trotzdem jederzeit.
