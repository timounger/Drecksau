# The Game

Das kooperative Kartenspiel von Steffen Benndorf
(Nürnberger-Spielkarten-Verlag), nominiert für das **Spiel des Jahres 2015**.
Vier Reihen, 98 Karten, und die eine Regel, die alles trägt: **über konkrete
Zahlen darf nicht geredet werden.**

## Spielen

| Seite                     | Was dort passiert                     |
| ------------------------- | ------------------------------------- |
| `/the-game`               | gegen Computerpartner, oder solo      |
| `/the-game/einstellungen` | wie viele mitspielen, wie schwer      |
| `/the-game/online`        | automatische Suche oder privater Raum |
| `/the-game/statistik`     | gespielte Partien und Ergebnisse      |

Die vollständigen Regeln stehen im Spiel hinter **„? Regeln"** und als
Spezifikation in
[docs/games/the-game/game-rules.md](../../../../docs/games/the-game/game-rules.md).

## Eine Zahl, für beide Richtungen

Zwei Reihen laufen hoch, zwei runter, und die naive Umsetzung schreibt dieselbe
Regel zweimal gespiegelt hin - und den Rückwärts-Trick ein drittes und viertes
Mal. Stattdessen gibt es **ein** Maß, `gain`
([engine/cards.ts](engine/cards.ts)):

```
aufsteigend:  card - top
absteigend:   top - card
```

So wollen beide Reihen dasselbe - eine **kleine positive Zahl** - und der
Rückwärts-Trick kommt auf beiden als exakt `-10` heraus, weil „zehn tiefer auf
einer aufsteigenden" und „zehn höher auf einer absteigenden" derselbe Zug von
zwei Enden aus sind.

Jede andere Frage im Spiel wird durch dieses eine Maß gestellt: ob eine Karte
darf, was sie kostet, welche Reihe sie am wenigsten will. Zweimal geschrieben
wäre jede davon ein Zweig, der irgendwann nur auf einer Seite repariert wird.

Auf dem Bildschirm bekommt der Sprung sein **echtes Vorzeichen** zurück: `+4`
auf einer aufsteigenden, `-95` auf einer absteigenden. Der erste Anlauf zeigte
dort das Maß selbst, also `+95` für die 3 auf die 100 - und das las sich wie ein
Gewinn.

## Das Ende ist die schwierige Regel

„Das Spiel endet sofort, wenn ein Spieler, der gerade am Zug ist, nicht mehr die
geforderte Mindestanzahl an Karten ablegen kann."

Nicht „hat keine spielbare Karte" - **kann die Mindestanzahl nicht erreichen**.
Das ist eine andere und deutlich unangenehmere Frage, weil die erste Karte die
Reihe verändert und damit die zweite erst möglich macht. Eine Hand mit 34 und 24
gegen eine aufsteigende Reihe auf 33 kann beide ablegen, in dieser Reihenfolge
und nur in dieser.

`canReach` ([engine/moves.ts](engine/moves.ts)) probiert es deshalb wirklich
durch. Gezählt statt gesucht hätte das Spiel eine Runde zu früh geendet - und
das ist genau die Sorte Fehler, die niemand je bemerkt.

Die Suche ist winzig: höchstens acht Karten, vier Reihen, Tiefe drei.

## Die zwei Sätze, die ihr sagen dürft

Die Anleitung erlaubt jede Kommunikation außer konkreten Zahlen und gibt zwei
Beispiele: „Bitte nicht auf den unteren Stapel legen" und „Auf diesem Stapel
bitte nur noch einen ganz kleinen Sprung machen".

Genau diese zwei sind hier **Marker an jeder Reihe** - und zwar deshalb, weil
ein Marker **keine Zahl verraten kann**. Ein Chatsatz kann es. Von allen Formen
dieses Gesprächs ist der Marker die einzige, die die Regel für dich mitträgt.

Jeder darf sie jederzeit setzen, auch **während jemand anders überlegt**: Der
Schiedsrichter lässt einen Marker von jedem Platz durch, ob am Zug oder nicht
([engine/moves.ts](engine/moves.ts)). Eine Bitte, die erst ankommt, wenn man
selbst dran ist, wäre keine.

Sprach- und Textchat bleiben trotzdem offen. Die Regel ist eine Abmachung
zwischen Menschen; am Tisch hält euch ja auch niemand den Mund zu.

## Was der Nachziehstapel geheim hält

Zwei Sorten Geheimnis, und sie werden verschieden behandelt
([multiplayer/adapter.ts](multiplayer/adapter.ts)):

- Eine **Hand** ist vor den anderen geheim, nicht vor ihrem Besitzer. Sie reist
  auf dem privaten Kanal dieses Platzes; im öffentlichen Schnappschuss steht die
  passende Anzahl Nullen - ein Wert, den keine echte Karte hat. Wie viele Karten
  jemand hält, sieht man am echten Tisch auch.
- Der **Nachziehstapel** ist vor allen geheim, seinen Besitzer eingeschlossen.
  Zu wissen, was kommt, wäre hier mehr wert als eine fremde Hand zu sehen: Die
  halbe Kunst besteht darin zu ahnen, ob eine Reihe auf etwas wartet, das nie
  kommt. Er geht deshalb an **keinen** Client, sondern in den Host-Vault - und
  ein neuer Host stellt ihn beim Übernehmen wieder her.

## Der Computerpartner sieht deine Hand nicht

Das ist keine Höflichkeit, das ist das Spiel. Er liest genau das, was du liest:
die vier Reihen und die Marker ([engine/ai.ts](engine/ai.ts)).

Was ihn von einem naiven Spieler unterscheidet, ist eine Sache: **Er plant die
ganze Pflicht auf einmal**, nicht Karte für Karte. Wer zwei ablegen muss, legt
regelmäßig die falsche zuerst - die 34 auf die 33 kostet eins, aber wenn die
Hand auch 35 und 36 hält, ist die richtige Eröffnung die, nach der alle drei in
Einerschritten fallen.

Gemessen über je 40 Partien pro Tischgröße:

| Tisch | Karte für Karte | mit Plan |
| ----- | --------------: | -------: |
| solo  |              22 |   **18** |
| zu 2  |              12 |    **7** |
| zu 3  |              15 |   **12** |
| zu 4  |              12 |    **9** |
| zu 5  |               8 |    **6** |
| Profi |              30 |       28 |

Der erste Anlauf mit Plan war **schlechter** als ohne, und der Grund war ein
echter Fehler: Der Ketten-Bonus - „die Trick-Partnerkarte liegt noch auf der
Hand, die Reihe ist also noch etwas wert" - wurde auch tief im Plan vergeben,
wo dieselben zehn Karten schon als eigener Zug mit -10 eingerechnet waren.
Doppelt gezählt waren zehn Karten zweiundzwanzig wert, und der Partner baute
lieber einen Trick auf, um ihn sofort zu verbrennen, statt zwei wirklich billige
Karten zu legen. Das kostete solo rund sechs Karten pro Partie - und sah aus wie
„Planen bringt nichts" statt wie ein Fehler.

Die Profivariante bewegt sich kaum. Drei Pflichtkarten pro Zug lassen so wenig
Wahl, dass kaum ein Plan übrig bleibt - vermutlich genau deshalb nennt die
Schachtel sie die schwere.

## Zwei Taps, mit Absicht

Karte antippen, dann Reihe. In diesem Projekt passiert ein eindeutiger Tap sonst
sofort - hier nicht, und zwar weil die ganze Entscheidung dieses Spiels das
**Wohin** ist. Erst wenn eine Karte gewählt ist, steht an jeder Reihe, was sie
dort kostet: `+3`, `+41`, `Rückwärts-Trick`. Beim ersten Tap zu spielen würde
die Karte weglegen, bevor die einzige Zahl auf dem Schirm steht, die zählt.

Die Farbe des Sprungs richtet sich nach seiner **Größe**, nicht nach seinem
Vorzeichen: grün bis 5, gelb bis 20, danach rot, und der Trick violett. Nach dem
Vorzeichen gefärbt wäre die 3 auf die 100 grün gewesen - ein Zug, der 95 Zahlen
wegwirft.

Der Zug beendet sich **nicht** von selbst, auch wenn nichts mehr geht. Das
Weitergeben ist der Moment, einen Marker zu setzen, und ein Zug, der sich selbst
beendet, nähme genau den weg.

## Aufbau des Spielmoduls

```
the-game/
  engine/       Karten und Reihen, Zustand, Schiedsrichter, Computerpartner
  components/   Tisch, Endstand, Offline- und Online-Bildschirm, Einstellungen
  hooks/        die Partie gegen den Computer
  multiplayer/  Adapter für die gemeinsame Online-Schicht
  settings/     Tischgröße und Schwierigkeit
  i18n/         deutsche Texte und die Anleitung im Spiel
```

## Cover-Logo

Das Bild liegt in [assets/logo.webp](assets/logo.webp) - ein Platzhalter, den
man durch echte WebP-Grafik ersetzen kann.
