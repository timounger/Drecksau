# Qwixx

Das Würfelspiel von Steffen Benndorf. Sechs Würfel, vier Reihen, ein Zettel je
Person - und eine Regel, an der alles hängt:

> **In einer Reihe wird nur von links nach rechts angekreuzt.** Was du
> überspringst, ist für den Rest des Spiels weg.

Die 9 zu nehmen, wenn die Reihe bei der 4 steht, kostet dich nicht die 9. Es
kostet dich die 5, 6, 7 und 8. Deshalb zeigt der Zettel hier verbrannte Zahlen
**durchgestrichen** an und nicht bloß die Kreuze - der Preis eines Kreuzes ist
die eigentliche Information.

(Zur Einordnung: 2013 zum **Spiel des Jahres nominiert**, gewonnen hat Hanabi.)

## Spielen

`/qwixx` teilt sofort ein Spiel gegen den Computer aus:

| Seite                  | Was dort passiert                     |
| ---------------------- | ------------------------------------- |
| `/qwixx`               | Spiel gegen den Computer              |
| `/qwixx/einstellungen` | Spielerzahl (2 bis 5)                 |
| `/qwixx/online`        | automatische Suche oder privater Raum |
| `/qwixx/statistik`     | gespielte Partien und Erfolge         |

## Ein Zug, zwei Schritte, zwei verschiedene Leute

Das ist die Stelle, an der Neulinge das Spiel falsch verstehen, und deshalb
sagt der Bildschirm bei jedem Schritt dazu, wer gefragt ist:

1. **Weiße Würfel - alle dürfen.** Die Summe der beiden weißen Würfel darf
   jede:r ankreuzen. Reihenfolge egal; der Schritt ist vorbei, wenn alle
   geantwortet haben.
2. **Farbwürfel - nur der aktive Spieler.** Ein weißer plus ein farbiger
   Würfel, angekreuzt in dieser Farbe.

Nur wer am Zug ist und **nichts** angekreuzt hat, bekommt einen Fehlwurf. Für
alle anderen ist Verzichten gratis - der Knopf sagt das auch dazu.

Die vollständigen Regeln stehen in
[docs/games/qwixx/game-rules.md](../../../../docs/games/qwixx/game-rules.md).

## Aufbau des Spielmoduls

```text
games/qwixx/
  engine/       Zettel, Regeln, Wertung, Computergegner - ohne DOM
  components/   Zettel, Tisch mit Würfeln, Endtafel, Einstellungen, Online
  hooks/        das Spiel gegen den Computer (Spielstand, Statistik)
  multiplayer/  der Adapter fuer die geteilte Online-Schicht
  settings/     Spielerzahl im Browser
  i18n/         deutsche Texte
  assets/       das Cover-Logo
```

## Der Computergegner rechnet mit dem Preis

Er stellt sich dieselbe Frage wie ein guter Mitspieler: **was verbrennt dieses
Kreuz?** Der Gewinn ist der echte - weil die Punkte einer Reihe als
Dreieckszahl wachsen, ist dasselbe Kreuz in einer vollen Reihe mehr wert als in
einer leeren, und das fällt aus der Wertung heraus, ohne dass man es
hinschreiben müsste.

Dagegen stehen die übersprungenen Zahlen, und deren Preis **sinkt gegen Ende**:
Solange das Spiel jung ist, sind vier verbrannte Zahlen eine Katastrophe; wenn
zwei Reihen fast zu sind, ist es die letzte Gelegenheit, die noch kommt.

## Online ist hier fast nichts zu tun

Der kürzeste Adapter der Sammlung - und das aus einem guten Grund: **In Qwixx
ist nichts geheim.** Jeder Zettel liegt offen, die Würfel liegen in der Mitte.
Also gibt es keine Schwärzung, keinen privaten Kanal und kein Host-Vault; der
geteilte Zustand _ist_ das Spiel
([multiplayer/adapter.ts](multiplayer/adapter.ts)).

Interessant ist nur der Zug: Gemeldet wird der aktive Spieler - das ist auch am
echten Tisch öffentlich -, und im weißen Schritt dürfen die anderen trotzdem
handeln. Das geht, weil die Schicht Züge nicht nach Absender filtert, sondern
dem Schiedsrichter überlässt, wer noch eine Antwort schuldig ist.

## Cover-Logo

Das Bild liegt in [assets/logo.webp](assets/logo.webp) - ein Platzhalter, den
man durch echte WebP-Grafik ersetzen kann.
