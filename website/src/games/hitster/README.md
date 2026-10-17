# Hitster

Das Musik-Partyspiel: Ein Song läuft, und du legst seine Karte an die richtige
Stelle deiner Zeitleiste - davor, dahinter oder dazwischen. Wer zuerst 10
Karten richtig liegen hat, gewinnt.

## Spielen

| Seite                    | Was dort passiert                      |
| ------------------------ | -------------------------------------- |
| `/hitster`               | gegen 1 bis 7 Computer                 |
| `/hitster/einstellungen` | Computer-Gegner, ihre Stärke, das Ziel |
| `/hitster/online`        | automatische Suche oder privater Raum  |
| `/hitster/statistik`     | gespielte Partien, Siege und Spielzeit |

Die Regeln stehen im Spiel hinter **"? Regeln"** und als Spezifikation in
[docs/games/hitster/game-rules.md](../../../../docs/games/hitster/game-rules.md).

- 2 bis 8 Spieler, je mit einer Startkarte und 2 Token (höchstens 5).
- Titel und Interpret richtig getippt: +1 Token. Überspringen kostet 1 Token,
  eine Karte kaufen 3.
- **HITSTER!**: Hat jemand gelegt, dürfen die anderen der Reihe nach ein Token
  in eine andere Lücke legen. Wer richtig liegt, wenn die Person falsch lag,
  bekommt die Karte.
- Ziel 10 Karten wie in der Schachtel, einstellbar auf 5 oder 15.

## Die Songs laufen über YouTube

In der Schachtel liegt auf jeder Karte ein QR-Code für die Hitster-App. Hier
spielt jeder Song als YouTube-Video
([components/song-player.tsx](components/song-player.tsx)), eingebettet von
youtube-nocookie.com und **abgedeckt von einer drehenden Schallplatte** -
Titel, Bild und Jahr bleiben verborgen. Der Song startet bei Sekunde 40, wo
die meisten Lieder schon losgelegt haben. Ein Browser spielt Ton erst nach
einem Klick, darum wartet der Song auf **"▶ Abspielen"**.

Spielt ein Video nicht (gelöscht, im Land gesperrt), meldet das der Player
über seine JavaScript-Nachrichten, und wer dran ist, holt sich mit einem Klick
kostenlos einen neuen Song (`broken`).

**Die Songliste** ([engine/songs.ts](engine/songs.ts)) hat 252 Songs von 1957
bis 2023, mit deutschen Titeln. Jedes Video wurde über die YouTube-Suche
gefunden und gegen YouTubes oEmbed-Antwort geprüft: Es existiert, darf
eingebettet werden, und sein Titel nennt Song und Interpret - fast immer der
Kanal der Künstler oder VEVO. Das Jahr ist das der ersten Veröffentlichung des
Songs, nicht das des Videos.

## Titel und Interpret raten

Am Tisch entscheiden die anderen, ob "Bohemian Rapsody von Queen" zählt. Hier
entscheidet [engine/guess.ts](engine/guess.ts), genauso großzügig:
Groß-/Kleinschreibung, Akzente, Satzzeichen, "the" und alles in Klammern sind
egal, und in längeren Wörtern sind ein bis zwei Tippfehler erlaubt. Beim
Interpreten reicht ein Name: "Rihanna" für "Rihanna feat. Jay-Z".

## Der Computer

Ein Computer, der einfach das Jahr von der Karte liest, läge nie daneben.
Dieser schätzt wie ein Mensch ([engine/ai.ts](engine/ai.ts)): Sein Gefühl für
das Jahr liegt ein paar Jahre daneben - auf "Leicht" bis zu 9, auf "Schwer"
bis zu 2. Titel und Interpret kennt er nur manchmal, HITSTER ruft er nur, wenn
er sich sicher ist, und Karten kauft er, wenn er 5 Token hat.

## Gemeinsam online

Unter `/hitster/online` hört jede:r den Song am eigenen Gerät: Jeder Tisch
bettet dasselbe Video ein. Der Host stellt das Ziel ein und kann Computer
dazusetzen - dann geht es auch allein. Die Computer sind Spieler des Spiels
hinter den menschlichen Plätzen; ihre Züge rechnet das Gerät des Hosts
([multiplayer/adapter.ts](multiplayer/adapter.ts)).

Geheimnisse gibt es keine: Die Zeitleisten liegen offen. Das Jahr des
laufenden Songs steckt im Spielstand, wie es in der Schachtel auf der
Kartenrückseite steht; die Oberfläche zeigt es erst, wenn die Karte umgedreht
ist.

## Aufbau des Spielmoduls

| Datei                                                          | Was                                                 |
| -------------------------------------------------------------- | --------------------------------------------------- |
| [engine/songs.ts](engine/songs.ts)                             | die Songs: Video, Interpret, Titel, Jahr            |
| [engine/state.ts](engine/state.ts)                             | Spielzustand, Züge, die Zahlen aus der Schachtel    |
| [engine/rules.ts](engine/rules.ts)                             | Aufbau, wohin eine Karte passt, Zug spielen, Ablauf |
| [engine/guess.ts](engine/guess.ts)                             | ob Titel und Interpret stimmen                      |
| [engine/ai.ts](engine/ai.ts)                                   | der Computer                                        |
| [hooks/use-hitster-game.ts](hooks/use-hitster-game.ts)         | Spiel gegen den Computer: Speichern, Statistik      |
| [components/song-player.tsx](components/song-player.tsx)       | das abgedeckte YouTube-Video                        |
| [components/timeline.tsx](components/timeline.tsx)             | Zeitleiste mit Karten und Lücken                    |
| [components/hitster-table.tsx](components/hitster-table.tsx)   | der Tisch, lokal und online                         |
| [components/hitster-online.tsx](components/hitster-online.tsx) | Online: Eingang, Lobby, Tisch, Chat                 |
| [multiplayer/adapter.ts](multiplayer/adapter.ts)               | Anschluss an die Online-Schicht                     |

## Cover-Logo

[assets/logo.webp](assets/logo.webp) ist selbst gezeichnet: eine
Schallplatte, zwei Jahreskarten und eine Zeitleiste mit Lücken.
