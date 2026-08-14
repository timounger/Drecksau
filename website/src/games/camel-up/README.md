# Camel Up

Das Kamelrennen von Steffen Bogen, **Spiel des Jahres 2014**. Fünf Kamele
laufen um die Wette, und niemand steuert sie - man wettet nur darauf. Wer am
Ende das meiste **Geld** hat, gewinnt; welches Kamel gewonnen hat, ist dabei
egal.

**Das Spiel ist der Stapel.** Kamele stehen aufeinander, und ein Kamel, das
zieht, nimmt alle auf seinem Rücken mit. Daraus folgt die eine Regel, an der
sich hier alles entscheidet:

> **Oben heißt vorn.** Von zwei Kamelen auf einem Feld liegt das obere vorn -
> es wird getragen. Das unterste eines Haufens ist Letzter, egal wie weit vorn
> der Haufen steht.

Deshalb zeichnet die Strecke den Stapel senkrecht und schreibt den Satz über
das Feld: Praktisch jede verlorene Wette in diesem Spiel kommt daher, dass
jemand einen Haufen als „die stehen gleichauf" gelesen hat.

## Spielen

`/camel-up` teilt sofort ein Rennen gegen den Computer aus. Alles Weitere hängt
in der Kopfzeile:

| Seite                     | Was dort passiert                     |
| ------------------------- | ------------------------------------- |
| `/camel-up`               | Rennen gegen den Computer             |
| `/camel-up/einstellungen` | Spielerzahl (2 bis 8)                 |
| `/camel-up/online`        | automatische Suche oder privater Raum |
| `/camel-up/statistik`     | gespielte Rennen und Erfolge          |

## Vier Aktionen, eine davon zahlt

Im Zug macht man **genau eine** Sache:

1. **Pyramide würfeln** - ein Kamel zieht, du bekommst 1 Münze.
2. **Etappenwette** - die oberste Karte eines Kamels nehmen (5, dann 3, dann 2).
3. **Gesamtwette** - verdeckt eine Farbkarte auf Sieger oder Verlierer legen.
4. **Wüstenplättchen** - Oase (+1, drauf) oder Fata Morgana (-1, drunter).

Darin steckt die ganze Spannung: **Nur das Würfeln bringt Geld, und nur das
Würfeln bewegt das Rennen.** Wer wetten will, muss jemand anderen würfeln
lassen - und wer würfelt, verschafft den anderen die Information.

Die vollständigen Regeln stehen in
[docs/games/camel-up/game-rules.md](../../../../docs/games/camel-up/game-rules.md).

## Ohne Anleitung gebaut

Zu diesem Spiel lag **keine Anleitung** vor - anders als bei „Das politische
Talent". Der Ablauf ist aus Spielkenntnis rekonstruiert und sitzt; eine Handvoll
**Zahlen** ist unsicher (die Werte der Etappenkarten, die Auszahlungen der
Gesamtwetten, das Startgeld). Sie stehen alle beieinander in
[engine/state.ts](engine/state.ts) und sind einzeln in
[der Spezifikation](../../../../docs/games/camel-up/game-rules.md#unsichere-werte)
aufgelistet. Wer die Schachtel hat, prüft sie in einer Minute nach.

## Aufbau des Spielmoduls

```text
games/camel-up/
  engine/       Strecke, Regeln, Wahrscheinlichkeiten, Computergegner - ohne DOM
  components/   Rennstrecke, Aktionsleiste, Ergebnistafel, Einstellungen, Online
  hooks/        das Rennen gegen den Computer (Spielstand, Statistik)
  multiplayer/  der Adapter fuer die geteilte Online-Schicht
  settings/     Spielerzahl im Browser
  i18n/         deutsche Texte
  assets/       das Cover-Logo
```

## Der Computergegner rechnet wirklich

Er schätzt nicht, er **zählt**. Mit höchstens fünf Würfeln in der Pyramide, die
je 1, 2 oder 3 zeigen, gibt es höchstens `5! x 3^5 = 29160` Arten, wie die
Etappe ausgehen kann - und alle sind gleich wahrscheinlich. Also läuft
[engine/odds.ts](engine/odds.ts) sie alle ab und weiß danach **exakt**, wie oft
jedes Kamel vorn landet.

Das ist gerade hier die Mühe wert: Ob ein Kamel Favorit ist, hängt daran, wer
auf wessen Rücken steht, und dafür gibt es keine Faustregel. Auf dieser Zahl
steht dann eine schlichte Rechnung: Würfeln bringt sicher 1 Münze, also wird
gewettet, sobald eine Wette mehr als 1 Münze wert ist.

Damit das schnell bleibt, zieht der Zähler die Kamele **um und wieder zurück**,
statt für jeden Zweig eine neue Strecke anzulegen - vierzigtausend Kopien pro
Entscheidung wären der Unterschied zwischen „antwortet sofort" und „denkt eine
Sekunde". Der Schiedsrichter selbst bleibt rein funktional, wo es darauf
ankommt.

## Was online geheim bleibt

Fast nichts - und das ist der Punkt. Strecke, Geld, Etappenwetten und die
Würfel in der Pyramide liegen im echten Spiel offen auf dem Tisch und reisen
deshalb unverändert im geteilten Snapshot.

**Genau eine Sache ist verdeckt: die Gesamtwetten.** Diese Karten liegen mit dem
Bild nach unten, und das ganze Ende des Spiels hängt daran, dass niemand weiß,
worauf die anderen sich festgelegt haben. Veröffentlicht wird deshalb nur, dass
und **wann** jemand gelegt hat - denn das bestimmt die Auszahlung -, während die
Farbe auf dem privaten Kanal des Platzes bleibt.

Mit ausgeteilt werden auch die **Farbkarten in der Hand**: Fünf Farben minus die
noch gehaltenen wären genau die Liste der Kamele, auf die jemand gesetzt hat -
die Redaktion wäre durch Abzählen zu knacken
([multiplayer/adapter.ts](multiplayer/adapter.ts)).

## Cover-Logo

Das Bild liegt in [assets/logo.webp](assets/logo.webp) - ein Platzhalter, den
man durch echte WebP-Grafik ersetzen kann.
