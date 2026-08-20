# Flip 7

Das Kartenspiel von Eric Olsen (The Op, 2025). Sammle Zahlenkarten, so lange du
dich traust - ziehst du eine Zahl zum zweiten Mal, ist deine Runde vorbei und du
bekommst **nichts**. Wer zuerst 200 Punkte hat, gewinnt.

3 bis 8 Spieler.

## Spielen

| Seite                   | Was dort passiert                     |
| ----------------------- | ------------------------------------- |
| `/flip-7`               | Spiel mit Computergegnern             |
| `/flip-7/einstellungen` | Spielerzahl (3 bis 8)                 |
| `/flip-7/online`        | automatische Suche oder privater Raum |
| `/flip-7/statistik`     | gespielte Partien und Erfolge         |

Die vollständigen Regeln stehen im Spiel hinter dem Knopf **„? Regeln"** und als
Spezifikation in
[docs/games/flip-7/game-rules.md](../../../../docs/games/flip-7/game-rules.md).

## Der Witz steckt im Deck

Von jeder Zahl liegen so viele Karten im Deck, **wie sie wert ist**: zwölf
Zwölfen, eine Eins ([engine/cards.ts](engine/cards.ts)). Die Karte, die du am
liebsten hättest, ist also genau die, die du am ehesten noch einmal ziehst - und
das zweite Mal wirft dich raus. Mehr muss man über dieses Spiel nicht wissen.

Die 0 ist die Ausnahme, die es beweist: eine einzige Karte, null Punkte wert,
und trotzdem eine Zahlenkarte - sie kann dich rauswerfen und zählt für Flip 7
mit.

## Die Prozentzahl auf dem Bildschirm ist kein Tipp

Der Tisch zeigt an, wie wahrscheinlich die nächste Karte dich rauswirft
([components/flip-7-table.tsx](components/flip-7-table.tsx)). Das ist keine
Hilfe, die es am echten Tisch nicht gäbe: Die Deckzusammensetzung steht in der
Anleitung, und jede genommene Karte liegt offen da. Wer will, rechnet es aus.
Die Zahl zu verstecken hieße, das Spiel zu verstecken - nicht, es zu bewahren.

Der Computergegner rechnet genau dasselbe ([engine/ai.ts](engine/ai.ts)), und
zwar aus denselben Quellen: offene Karten und Ablagestapel. In den
Nachziehstapel sieht er nie.

## Ein Zug ist eine Karte

Die Anleitung ist an dieser Stelle nicht ganz eindeutig, und die Entscheidung
prägt das ganze Spiel: _„The Dealer now offers each player **in turn** the
option to Hit or Stay"_, und im Beispiel _„if they choose to Stay **next
time**"_. Beides ergibt nur zusammen einen Sinn, wenn die Frage jede Runde am
Tisch neu gestellt wird. Also: **eine Karte, dann ist der Nächste dran.** Das ist
auch die Lesart, die Einfrieren und Dreimal überhaupt erst wertvoll macht - man
kommt zwischen den Zügen der anderen zum Handeln.

## Zwei Dinge halten den Tisch an

Alles in diesem Spiel ist derselbe Moment: **eine Karte landet vor jemandem**
(`giveCard` in [engine/moves.ts](engine/moves.ts)). Dorthin führen drei Wege -
das Austeilen zu Rundenbeginn, ein „Karte", und ein Dreimal, das jemandem drei
Karten aufzwingt. Deshalb braucht ein Dreimal, das beim Austeilen auftaucht,
keinen Sonderfall.

Zwei Dinge halten den Tisch dabei an, und beide unterbrechen, was gerade lief:

- eine **Aktionskarte** muss auf jemanden gezeigt werden,
- die **drei Karten** eines Dreimal werden einzeln umgedreht.

`advance` erledigt alles, was keine Entscheidung braucht, und bleibt beim ersten
stehen, das eine braucht. Was unterbrochen wurde, steht deshalb in einem eigenen
Feld (`stage`) und nicht in einer Phase, die die Unterbrechung überschreiben
würde.

### Ein Fund aus dem Selbstspiel

Ein Dreimal kann **zwei** Aktionskarten zurückhalten. Die wurden anfangs beide
in einem Durchlauf herausgegeben - und die zweite überschrieb die erste, weil
immer nur eine Karte gleichzeitig in der Luft sein kann. Eine Karte verschwand
spurlos aus dem Deck. Dasselbe noch einmal eine Ebene tiefer: Ein
zurückgehaltenes Dreimal löste ein neues aus und warf dabei die Warteschlange
des alten weg.

Beides fand dieselbe Prüfung: **nach jedem Zug nachzählen, ob noch 94 Karten da
sind.** Ein Deck, das leise Karten verliert, funktioniert weiter und ist irgendwann
nicht mehr das Deck aus der Schachtel.

## Online ist nichts geheim

Der einfachste Adapter der Sammlung
([multiplayer/adapter.ts](multiplayer/adapter.ts)): Jede Karte liegt offen vor
jemandem, es gibt keine Hand und nichts zu schwärzen. Genau das macht die
Wahrscheinlichkeiten überhaupt berechenbar - und damit das Spiel zu dem, was es
ist.

## Aufbau des Spielmoduls

```
flip-7/
  engine/       Karten, Zustand, Schiedsrichter, Computergegner
  components/   Tisch, Endstand, Offline- und Online-Bildschirm
  hooks/        das Spiel gegen den Computer
  multiplayer/  Adapter für die gemeinsame Online-Schicht
  settings/     Spielerzahl, im Browser gemerkt
  i18n/         deutsche Texte und die Anleitung im Spiel
```
