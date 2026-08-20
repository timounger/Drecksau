# Exploding Kittens

Das Kartenspiel von Exploding Kittens Inc. (Original Edition, 56 Karten). Im
Deck stecken Explodierende Kätzchen; reihum wird gezogen, bis jemand eines
erwischt. **Wer als Letzter übrig bleibt, gewinnt.**

2 bis 5 Spieler. Die Anleitung ist englisch, das Spiel ist deutsch.

## Spielen

| Seite                              | Was dort passiert                      |
| ---------------------------------- | -------------------------------------- |
| `/exploding-kittens`               | Spiel mit Computergegnern              |
| `/exploding-kittens/einstellungen` | Spielerzahl (2 bis 5), schnelles Spiel |
| `/exploding-kittens/online`        | automatische Suche oder privater Raum  |
| `/exploding-kittens/statistik`     | gespielte Partien und Erfolge          |

Die vollständigen Regeln stehen im Spiel selbst hinter dem Knopf **„? Regeln"**
und als Spezifikation in
[docs/games/exploding-kittens/game-rules.md](../../../../docs/games/exploding-kittens/game-rules.md).

## Eine Karte wirkt nicht, wenn sie gelegt wird

**Nö!** darf jederzeit von jedem gespielt werden, auch außer der Reihe. Deshalb
passiert beim Ausspielen einer Karte erst einmal gar nichts: Sie landet als
`Pending` auf dem Tisch, ein Fenster geht auf, und erst wenn das Fenster
zugeht, wirkt sie - oder eben nicht
([engine/moves.ts](engine/moves.ts)). Legen und Ausführen sind zwei getrennte
Funktionen, und die Karten verlassen die Hand **bevor** feststeht, ob die Aktion
überlebt. So steht es in der Anleitung: „Any cards that have been Noped are
lost. Leave them in the Discard Pile."

Nö!s werden gezählt, nicht sofort verrechnet. Eine ungerade Zahl tötet die
Aktion, eine gerade heißt, das letzte Wort war „Doch!".

### Das Fenster fragt nur die, die auch können

Bewusst abweichend vom echten Tisch: Gefragt wird nur, wer wirklich ein Nö! auf
der Hand hält. Bei 5 Nö!s in 56 Karten wären das sonst vier Klicks ins Leere pro
gespielter Karte. Das verrät ein wenig - nämlich dass überhaupt jemand nöppen
könnte - und ist der Preis dafür, dass der Tisch nicht bei jeder Karte stehen
bleibt. Wer die oberste Karte gerade selbst gelegt hat, wird nie gefragt.

## Der Angriff, bei dem sich die Anleitung selbst widerspricht

Der Kartentext sagt: Der Nächste macht **2** Züge. Die Stapelregel sagt:
„aktueller plus verbleibende Züge **plus 2**" - was beim nicht angegriffenen
Angreifer 3 ergäbe. Beide Beispiele der Anleitung passen nur zur Stapelregel.

Umgesetzt ist die einzige Lesart, die Kartentext **und** beide Beispiele
erfüllt, und dafür braucht der Zustand zwei Felder statt einem
([engine/state.ts](engine/state.ts)): `turnsOwed` und `underAttack`. Ein nicht
angegriffener Angreifer verschenkt 2 Züge; ein angegriffener verschenkt seine
noch offenen plus 2. Ohne das zweite Feld ließe sich „ein Zug, weil ich dran
bin" nicht von „ein Zug, weil ich angegriffen wurde" unterscheiden.

## Was online geheim bleibt

Drei Dinge, alle in dieselbe Richtung geheim - vor den anderen, nicht vor ihrem
Besitzer:

- die **Hand** und der **Blick in die Zukunft** gehen über den privaten Kanal
  des jeweiligen Sitzes,
- der **Nachziehstapel** gehört niemandem und wird für alle geschwärzt. Er
  liegt zusätzlich im Host-Tresor (`vault`,
  [multiplayer/adapter.ts](multiplayer/adapter.ts)), damit ein abstürzender Host
  nicht die Reihenfolge der Karten mitnimmt - und mit ihr das Kätzchen, um das
  alle gerade herumlaufen.

Wohin ein entschärftes Kätzchen zurückgesteckt wird, steht in keinem Feld: Das
ist ein **Zug**, und Züge erfährt nur der Host.

## Der Computergegner rechnet, statt zu schummeln

Er liest seine eigene Hand, seinen eigenen Blick in die Zukunft, den
Ablagestapel und die **Anzahl** der fremden Karten - sonst nichts
([engine/ai.ts](engine/ai.ts)). Wie gefährlich der Stapel ist, zählt er so, wie
man es am Tisch täte: noch nicht hochgegangene Kätzchen geteilt durch Karten im
Stapel. Ein gesehenes Kätzchen ist Gewissheit, in beide Richtungen.

Ein entschärftes Kätzchen legt er in die obersten paar Karten zurück, aber nicht
immer ganz nach oben. Ganz oben wäre der stärkste Zug und zugleich
unerträglich: Jede Entschärfung würde den Nächsten sofort umbringen.

## Was die Oberfläche nicht selbst entscheidet

Der Tisch baut den Zug und fragt `applyMove`, ob er durchginge - ein Knopf
leuchtet genau dann, wenn der Schiedsrichter ja sagen würde
([components/exploding-kittens-table.tsx](components/exploding-kittens-table.tsx)).
Eine ausgewählte Karte ist ein Zug, zwei gleiche sind ein Diebstahl, drei sind
eine Forderung - dieselbe Geste, drei Bedeutungen.

## Aufbau des Spielmoduls

```
exploding-kittens/
  engine/       Karten, Zustand, Schiedsrichter, Computergegner
  components/   Tisch, Endstand, Offline- und Online-Bildschirm
  hooks/        das Spiel gegen den Computer
  multiplayer/  Adapter für die gemeinsame Online-Schicht
  settings/     Spielerzahl und schnelles Spiel, im Browser gemerkt
  i18n/         deutsche Texte und die Anleitung im Spiel
```

## Erfundene Namen

Am Deck ist nichts erfunden - jede Zahl steht in der Anleitung. Nur **wie die
fünf Katzenkarten heißen** steht dort nicht: Sie sind als Bilder abgebildet und
als „5 Sorten zu je 4" gezählt. Festgelegt sind die Namen der Original Edition
(`CAT_KINDS` in [engine/cards.ts](engine/cards.ts)) - eine Zeile.

## Die Sprache

Die Anleitung ist englisch, alles Nutzersichtbare deutsch. Zwei Karten behalten
ihren Namen: **Tacocat** (das Palindrom ist der Witz) und **Nö!**, das ohnehin
schon deutsch ist.
