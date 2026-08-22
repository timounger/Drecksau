# Sky Team

Das kooperative Würfelspiel von Luc Rémond (Le Scorpion Masqué / KOSMOS),
**Spiel des Jahres 2024**. Genau zwei Personen landen gemeinsam ein
Passagierflugzeug - und dürfen dabei nicht miteinander reden.

Umgesetzt ist das erste Szenario, **YUL Montréal-Trudeau**.

## Spielen

| Seite                     | Was dort passiert                     |
| ------------------------- | ------------------------------------- |
| `/sky-team`               | Landung gegen den Computer            |
| `/sky-team/einstellungen` | Welchen Platz du fliegst              |
| `/sky-team/online`        | automatische Suche oder privater Raum |
| `/sky-team/statistik`     | gespielte Landungen und Erfolge       |

Die vollständigen Regeln stehen im Spiel hinter dem Knopf **„? Regeln"** und als
Spezifikation in
[docs/games/sky-team/game-rules.md](../../../../docs/games/sky-team/game-rules.md).

## Das Schweigen ist das Spiel

Absprechen dürft ihr euch nur **vor** dem Würfeln, und über eure Würfel nie.
Danach teilt ihr euch nur noch dadurch mit, **wohin** ihr einen Würfel legt.
Eine 6 aufs Ruder ist ein Satz. Eine 1 auf den Funk ist ein anderer.

Deshalb ist der Online-Modus hier nicht die zweite Wahl, sondern die erste: Am
Tisch ist der Sichtschirm ein Stück Plastik und eine Abmachung, hier **werden
die Würfel des anderen gar nicht erst gesendet**
([multiplayer/adapter.ts](multiplayer/adapter.ts)). Über die Leitung geht eine
Reihe Nullen der richtigen Länge - man sieht, wie viele noch hinter dem
Sichtschirm liegen, und sonst nichts.

Der Text- und Sprachchat bleiben trotzdem offen. Das Schweigen ist eine
Abmachung zwischen zwei Menschen, keine Sache, die ein Programm erzwingen
sollte - am Tisch hält euch ja auch niemand den Mund zu.

## Das Cockpit ist der Spielplan

Nicht eine Liste von Feldern, sondern das Paneel selbst
([components/sky-team-cockpit.tsx](components/sky-team-cockpit.tsx)):
Fluglage-Anzeiger und Geschwindigkeitsmesser als **ein** rundes Instrument in
der Mitte, Ruder und Funk daneben, Triebwerke darunter, die Bremsleiste als
Bogen, und Fahrwerk und Landeklappen auf eigenen Paneelen an den Rändern. Die
beiden Leisten schieben sich oben herein und zeigen ihr Fenster.

Das ist mehr als Optik. Auf dem echten Brett sitzen die zwei
Aerodynamik-Marker **auf derselben Skala wie die Geschwindigkeit** - „in welchem
Band liegt diese Summe" ist damit ein Blick statt einer Rechnung. Und Fahrwerk
und Klappen liegen genau deshalb an den Rändern, weil jedes von beiden einen
dieser Marker verschiebt. Eine Reihe beschrifteter Knöpfe versteckt die einzige
Beziehung, um die es in diesem Spiel geht.

Zwei Dinge daran waren beim ersten Anlauf falsch und sind es nicht mehr:

- Die **Markerbalken lagen über den Zahlen**, auf die sie zeigen. Ausgerechnet
  die zwei Geschwindigkeiten, die entscheiden, wie weit das Flugzeug fliegt,
  waren die einzigen zwei, die man nicht lesen konnte. Jetzt stehen sie außen.
- **Scheibe und Zeiger drehten gegeneinander.** Ein echtes Fluglage-Instrument
  dreht den Horizont gegen ein festes Flugzeugsymbol - der Anzeiger auf dem
  Brett ist aber ein runder Marker, den man als Ganzes dreht. Gegenläufig
  gezeichnet widersprachen sich die zwei Hälften derselben Anzeige.

Das Paneel behält in beiden Themes seine eigenen Farben. Es ist bemalte Pappe;
eine echte wird abends nicht dunkler, und die Seite ringsum trägt das Theme.

## Die zwei Plätze sind zwei verschiedene Spiele

Die **Pilotin** (blau) fährt das Fahrwerk aus und bedient die Bremsen, der
**Co-Pilot** (orange) die Landeklappen. Jede:r hat Funk, und Ruder wie
Triebwerke brauchen von beiden je einen Würfel. Niemand kann die Arbeit des
anderen tun, und fragen darf man auch nicht - das ist der ganze Aufbau
([engine/spaces.ts](engine/spaces.ts)).

## Luftwiderstand ist ein Werkzeug, kein Preis

Jedes ausgefahrene Fahrwerksteil und jede Landeklappe schiebt einen
Aerodynamik-Marker nach rechts. Das heißt: Dieselben Würfel tragen euch danach
**weniger weit**. Beides ist wahr und beides steht in der Anleitung:

- Müsst ihr noch Strecke machen? Dann fahrt sie **nicht zu früh** aus.
- Steht ein Flugzeug im Weg und ihr müsst stehen bleiben? Dann fahrt sie
  **jetzt** aus - mit dem Marker auf 4 trägt euch jede Summe ab 5 vorwärts, und
  das sind fünf von sechs Würfen.

## Der Computergegner ist ein schwacher Partner

Er sitzt auf dem anderen Platz und bekommt deine Würfel **nie** zu sehen
([engine/ai.ts](engine/ai.ts)) - er entscheidet allein aus dem, was offen im
Cockpit liegt. Das ist die richtige Blindheit, aber es ist nicht das Spiel: Sky
Team lebt davon, dass jemand zu erraten versucht, was du mit einer Ablage
gemeint hast, und das kann er nicht.

Im Selbstspiel Computer gegen Computer gewinnt er auf dem echten Brett so gut
wie nie, und **auch ohne jeden Verkehr nur etwa jede siebte Partie**. Die
Diagnose ist also eindeutig: nicht die Zahlen des Brettes sind schuld, sondern
der Partner. Gegen einen Menschen, der die andere Hälfte trägt, sieht es
besser aus - aber der Modus ist Übung. Das Spiel ist der Online-Modus.

Drei Fehler hat das Selbstspiel dabei sichtbar gemacht, die alle drei genau die
sind, vor denen die Anleitung warnt: den Ruder-Würfel bis zuletzt aufzusparen,
die Pflichtfelder zu vergessen, und den Luftwiderstand zur falschen Zeit
auszufahren.

## Aufbau des Spielmoduls

```
sky-team/
  engine/       Felder, Zustand, Schiedsrichter, Computergegner
  components/   Cockpit, Endstand, Offline- und Online-Bildschirm
  hooks/        die Landung gegen den Computer
  multiplayer/  Adapter für die gemeinsame Online-Schicht
  settings/     welchen Platz du fliegst
  i18n/         deutsche Texte und die Anleitung im Spiel
```

## Cover-Logo

Das Bild liegt in [assets/logo.webp](assets/logo.webp) - ein Platzhalter, den
man durch echte WebP-Grafik ersetzen kann.
