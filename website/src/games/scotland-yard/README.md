# Scotland Yard

Der Ravensburger-Klassiker in der Neuauflage 2024, "Auf der Jagd nach
Mister X": Mister X flieht mit Taxi, Bus und Underground quer durch London, die
Detektive sehen nur seine Tickets - und müssen ihn fassen, bevor 22 Runden um
sind.

## Spielen

| Seite                          | Was dort passiert                                  |
| ------------------------------ | -------------------------------------------------- |
| `/scotland-yard`               | gegen den Computer - als Mister X oder Detektive   |
| `/scotland-yard/einstellungen` | Seite, Spielerzahl, Variante, Name, Versteck-Hilfe |
| `/scotland-yard/online`        | automatische Suche oder privater Raum              |
| `/scotland-yard/statistik`     | gespielte Jagden, Siege und Spielzeit              |

Die Regeln stehen im Spiel hinter **"? Regeln"** und als Spezifikation in
[docs/games/scotland-yard/game-rules.md](../../../../docs/games/scotland-yard/game-rules.md).

- **2 bis 6 Spieler**, die Bobbys ergänzen bei 2 bis 4 Spielern wie in der
  Schachtel.
- **Standardspiel** (22 Runden, Tickets, Auftauchen nach dem 3., 8., 13., 18.
  und 24. Zug) und **Einsteigerspiel** (13 Runden, ohne Underground und
  Tickets, feste Startfelder, Mister X sichtbar bis auf drei Züge).
- "Mister X" oder "Ms. X" - nur der Name.

## Mister X bleibt verborgen

Am Tisch schreibt Mister X hinter einem Sichtschirm. Hier hält das Spiel seine
Position - also bekommt jeder Bildschirm eines Detektivs eine Kopie, in der sie
fehlt (`viewFor` und `redact` in [engine/view.ts](engine/view.ts)): keine
Figur, und in der Fahrtentafel nur die Tickets und die Stationen, an denen er
sich gezeigt hat.

- **Online wird seine Position gar nicht erst gesendet.** Der geteilte Stand ist
  die redigierte Kopie; nur der Platz von Mister X bekommt sie über seinen
  privaten Kanal, und der Host bewahrt sie im Tresor (`vault`) für einen
  Host-Wechsel auf ([multiplayer/adapter.ts](multiplayer/adapter.ts)). Der
  Zufallsstand bleibt nicht im Spiel - sonst könnte man seine Startkarte aus
  ihm nachziehen.
- Das Gerät des Hosts hält das ganze Spiel, so arbeitet die Online-Schicht.
  Auch dort zeigt der Tisch nur `viewFor`; wer als Detektiv hostet, sieht Mister
  X also nicht - könnte ihn mit den Entwicklerwerkzeugen des Browsers aber
  finden. Darum ist Mister X in der Lobby standardmäßig der Host, und der
  Computer kann ihn spielen.

## Der Computer schummelt nicht

Die Computer-Detektive bekommen **nur die redigierte Kopie**
([engine/ai.ts](engine/ai.ts)). Daraus rechnen sie wie ein Mensch am Tisch:
Wo wurde er zuletzt gesehen, welche Tickets hat er seitdem benutzt - also auf
welchen Stationen kann er jetzt stehen (`hidingPlaces`)? Dann rücken sie auf
diese Stationen vor, die nächste zuerst, und ziehen auf eine davon, wenn es
geht.

Der Computer-Mister-X schaut einen Zug voraus: weg von den Stationen, die ein
Detektiv als Nächstes erreicht, hin zu Stationen mit vielen Ausgängen - und so,
dass die Detektive möglichst viele Verstecke durchsuchen müssen. Black-Tickets
setzt er dort ein, wo sie am meisten verschleiern (gleich nach dem Auftauchen,
auf der Fähre), den Doppelzug, wenn ein Detektiv ihn sonst erwischt. Ein wenig
Zufall sorgt dafür, dass gleich gute Züge nicht immer dieselben sind.

Im Selbstspiel (200 Partien, Computer gegen Computer) gewinnt Mister X das
Standardspiel etwa jede zweite Partie; ein Zug dauert höchstens etwa 10 ms.

## Die Hilfe "Mögliche Verstecke"

Abschaltbar in den Einstellungen (und online je Gerät): markiert jede Station,
auf der Mister X nach seiner Fahrtentafel stehen kann. Das ist genau die
Rechnung, die die Computer-Detektive machen - offen auf den Plan gelegt.

## Der Spielplan

Gezeichnet aus dem Streckennetz, nicht vom Brett abfotografiert
([components/scotland-yard-board.tsx](components/scotland-yard-board.tsx)):
jede Station an ihrer Stelle, die Linien gerade dazwischen in den Farben der
Schachtel - gelb Taxi, türkis Bus, rot Underground, schwarz gestrichelt die
Fähre. Das Schild einer Station zeigt oben türkis für einen Bushalt und unten
rot für die Underground. Die Themse entlang der Fähre und zwei Parks dienen
nur der Orientierung.

Die Daten (199 Stationen, 468 Verbindungen, Lage auf dem Brett) stammen aus dem
offenen Datensatz
[AlexElvers/scotland-yard-data](https://github.com/AlexElvers/scotland-yard-data)
und stehen in [engine/map-data.ts](engine/map-data.ts); die Beispiele der
Anleitung stimmen damit überein. Der Plan lässt sich vergrößern; am Zug rollt
er zur Figur, die ziehen soll.

## Aufbau des Spielmoduls

| Datei                                                                      | Was                                                          |
| -------------------------------------------------------------------------- | ------------------------------------------------------------ |
| [engine/map-data.ts](engine/map-data.ts)                                   | Stationen und Linien als Daten                               |
| [engine/map.ts](engine/map.ts)                                             | Nachbarn je Verkehrsmittel, Halte, Entfernungen              |
| [engine/state.ts](engine/state.ts)                                         | Spielzustand, Züge, die Zahlen aus der Schachtel             |
| [engine/setup.ts](engine/setup.ts)                                         | Spieler, Figuren, Bobbys, Startkarten                        |
| [engine/moves.ts](engine/moves.ts)                                         | erlaubte Züge, Zug spielen, Rundenablauf, Spielende          |
| [engine/view.ts](engine/view.ts)                                           | was jede Seite sieht, mögliche Verstecke                     |
| [engine/ai.ts](engine/ai.ts)                                               | der Computer als Mister X und als Detektive                  |
| [engine/serialization.ts](engine/serialization.ts)                         | prüft gespeicherte und empfangene Spielstände                |
| [hooks/use-scotland-yard-game.ts](hooks/use-scotland-yard-game.ts)         | Spiel gegen den Computer: Speichern, Statistik, Computerzüge |
| [components/scotland-yard-board.tsx](components/scotland-yard-board.tsx)   | der Spielplan als SVG                                        |
| [components/scotland-yard-table.tsx](components/scotland-yard-table.tsx)   | Tisch: Plan, Zugwahl, Fahrtentafel, Figuren                  |
| [components/scotland-yard-online.tsx](components/scotland-yard-online.tsx) | Online: Eingang, Lobby, Tisch, Chat                          |
| [multiplayer/adapter.ts](multiplayer/adapter.ts)                           | Anschluss an die Online-Schicht                              |

## Cover-Logo

[assets/logo.webp](assets/logo.webp) ist selbst gezeichnet: ein Stück
Stadtplan mit Taxi-, Bus- und Underground-Linien, die Themse, eine Lupe und
das schwarze X.
