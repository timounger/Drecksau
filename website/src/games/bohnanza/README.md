# Bohnanza

Das Kartenspiel von **Uwe Rosenberg** (AMIGO, 1997 und 2016). Bohnen anbauen,
mit den anderen handeln und zur richtigen Zeit ernten - wer am Ende die meisten
Bohnentaler hat, gewinnt.

104 Karten, acht Sorten, 3 bis 5 Spieler.

## Spielen

| Seite                     | Was dort passiert                     |
| ------------------------- | ------------------------------------- |
| `/bohnanza`               | Spiel mit Computergegnern             |
| `/bohnanza/einstellungen` | Spielerzahl (3 bis 5)                 |
| `/bohnanza/online`        | automatische Suche oder privater Raum |
| `/bohnanza/statistik`     | gespielte Partien und Erfolge         |

Die vollständigen Regeln stehen im Spiel hinter dem Knopf **„? Regeln"** und als
Spezifikation in
[docs/games/bohnanza/game-rules.md](../../../../docs/games/bohnanza/game-rules.md).

## Die Hand ist eine Liste, kein Haufen

> „Die Reihenfolge der Karten auf deiner Hand darfst du während des gesamten
> Spiels nicht ändern."

Das ist die Regel, an der das ganze Spiel hängt, und deshalb ist
[`Player.hand`](engine/state.ts) eine **geordnete Liste** und keine Menge. Index
0 ist die vorderste Karte - die, die du nächste Runde anbauen **musst**.
Nachgezogene Karten kommen hinten dran.

Die Oberfläche bietet dafür keine Geste an: nicht sortieren, nicht ziehen, nicht
umstecken ([components/bohnanza-table.tsx](components/bohnanza-table.tsx)). Das
ist keine fehlende Funktion. Eine Hand, die man aufräumen könnte, wäre ein
anderes Spiel.

## Das Bohnometer steht auf der Karte

Von jeder Sorte liegen so viele Karten im Spiel, wie die große Zahl sagt: 6
Gartenbohnen, 20 Blaue Bohnen. Und je häufiger eine Sorte ist, desto mehr Karten
braucht sie für einen Taler - 2 Gartenbohnen bringen einen, 4 Blaue Bohnen auch.

Die Zahlen stehen genau einmal im Code, in
[engine/beans.ts](engine/beans.ts), als **Schwellen** statt als Tabelle: „ab 2
Karten ein Taler, ab 3 zwei". So beantworten dieselben acht Zeilen beide Fragen,
die im Spiel gestellt werden - was ein Feld jetzt wert ist, und wie viele Karten
noch bis zum nächsten Taler fehlen. Die Regelseite im Spiel baut ihre Tabelle
daraus ([i18n/rules.ts](i18n/rules.ts)); zwei Kopien derselben Zahlen wären zwei
Kopien, die auseinanderlaufen können.

Die Anleitung hatte ihren Fließtext als Text eingebettet, die Bohnometer aber
nur als Kartenbilder. Sie wurden abgelesen, nicht erinnert - und zwei davon
nennt der Fließtext zusätzlich und bestätigt das Abgelesene.

## Die Karten sind Karten

Hochformat, etwa zwei zu drei - das Maß aus der Schachtel
([components/bean-card.tsx](components/bean-card.tsx)). Die Form ist hier nicht
Deko: Man hält eine **Reihe** davon in fester Reihenfolge und liest sie von
links nach rechts. Gleich hohe Textschnipsel lesen sich als Liste, Karten lesen
sich als Hand.

Die gedruckte Karte hat vier Dinge drauf, und jedes verdient seinen Platz - also
stehen alle vier auch hier, in derselben Reihenfolge: die **Anzahl** oben (wie
oft die Sorte im Spiel ist - die ganze Ökonomie des Spiels auf einer Karte), die
**Bohne**, der **Name** auf farbigem Band, und unten das **Bohnometer** als
Reihe von Talern.

Die Bilder sind **selbst gezeichnet**, nicht aus der Anleitung übernommen - die
Zeichnungen dort gehören jemandem. Unterschieden werden die Sorten deshalb
zuerst an der **Form**, nicht an der Farbe: eine Hülse, eine Niere, ein Auge,
ein Paar, eine gebrochene Hülse, eine flache Scheibe, Sprenkel, eine glatte
runde Bohne. Acht Farben sind mehr, als eine Palette für jeden auseinanderhalten
kann, und eine Hand, die man nur über Farbe liest, ist für manche keine Hand.

Karten behalten ihre **Druckfarben in beiden Themes**, wie das Monopoly-Brett
und aus demselben Grund: Eine echte Karte wird abends nicht dunkler, und das
Thema trägt die Seite ringsherum. Es macht die Zeichnung überhaupt erst möglich

- eine Bohne mit dunkler Kontur braucht etwas Helles unter sich.

## Handeln ohne zu reden

Am Tisch ist der Handel ein Gespräch, und ein Gespräch lässt sich nicht
übersetzen. Was sich übersetzen lässt, ist die Form darunter: **ich lege diese
Karten hin, und dafür hätte ich gern eine von jener Sorte.**

Deshalb nennt ein Angebot ([components/bohnanza-trade.tsx](components/bohnanza-trade.tsx))
auf der einen Seite **konkrete Karten** und auf der anderen nur **Sorten**. Das
ist genau die Asymmetrie des echten Tisches: Was du hergibst, hältst du in der
Hand und kannst es zeigen; was du haben willst, liegt in einer Hand, die du
nicht siehst. Die Anleitung schreibt denselben Satz: „Möchte jemand die
Sojabohne? Am liebsten hätte ich dafür eine Rote Bohne."

Zwei kleinere Entscheidungen folgen daraus:

- **Ein Angebot zur Zeit.** Mehrere gleichzeitig wären am Tisch alle
  gleichzeitig reden.
- **Wer zusagt, wählt selbst, welche Karte er hergibt.** Zwei Rote Bohnen sind
  austauschbar, ihre **Position** in der Hand ist es nicht: Wer die vorderste
  weggibt, ändert damit, was er nächste Runde anbauen muss. Vorgeschlagen wird
  die vorderste, entschieden wird es von Hand.

Ein Angebot ohne Wunschsorte ist ein Geschenk - und braucht dieselbe Zusage wie
jeder andere Handel, weil die Anleitung das ausdrücklich verlangt.

## Ernten geht immer

„Du darfst jederzeit im Spiel deine Bohnenfelder abernten, auch wenn du nicht
die aktive Person bist." Deshalb nimmt der Schiedsrichter eine Ernte in jeder
Phase von jedem Platz an ([engine/moves.ts](engine/moves.ts)), und deshalb steht
der Knopf auf jedem eigenen Feld und nicht nur, wenn man dran ist. Ein Knopf,
der nur im eigenen Zug erscheint, wäre eine Regel, die dieser Tisch sich still
ausgedacht hätte.

Gebremst wird das nur von der **Bohnenschutzregel**: eine einzelne Bohne darfst
du nicht ernten, solange ein anderes deiner Felder mehr als eine hat. Eine
Sackgasse kann daraus nie werden - verbietet die Regel ein Feld, dann gibt es
per Definition ein anderes mit mehr als einer Karte, und das darf man ernten.

## Warum der Stapel überhaupt ein drittes Mal ausgeht

Karten, die zu Talern werden, sind **aus dem Spiel**. Sie werden umgedreht und
kommen nie wieder in den Kreislauf. Genau deshalb wird der Ablagestapel bei
jedem Mischen kleiner, und genau deshalb geht der Nachziehstapel irgendwann ein
drittes Mal leer - was das Spielende ist.

Der Code hält deshalb alle 104 Karten fest, auch die abgerechneten
(`BohnanzaGame.spent`). Das ist keine Ordnungsliebe: Ein Stapel, der leise
Karten verliert, funktioniert weiter und ist irgendwann nicht mehr der Stapel
aus der Schachtel. Die Selbstspiel-Probe hat nach **jedem** Zug nachgezählt, ob
es noch 104 sind.

Das Ende wird **getragen, nicht sofort vollzogen**: „Sollte dies beim Aufdecken
der Karten in der 2. Phase passieren (auch wenn nur eine Karte aufgedeckt werden
konnte), werden die 2. und die 3. Phase noch zu Ende gespielt." Deshalb setzt
das Ziehen der letzten Karte ein Flag (`ending`), und wo das Spiel wirklich
stehen bleibt, entscheidet die Phase, in der das passiert ist.

## Der Computergegner rechnet mit dem, was alle sehen

Der ganze Gegner hängt an **einer** Zahl
([engine/ai.ts](engine/ai.ts), `placementValue`): Was ist eine Bohne dieser Sorte
für diesen Spieler wert? Drei Fälle, und es sind die drei, die die Regeln
erzeugen - die Sorte wächst schon irgendwo (die Karte verlängert eine Reihe und
bringt vielleicht den nächsten Taler), es ist ein Feld frei (sie fängt eine an),
oder keins von beidem - und dann kostet sie ein Feld, und das ist das einzige
wirklich Schlechte, was einem in diesem Spiel passieren kann.

Dieselbe Zahl beantwortet alle vier Fragen: was von der Hand angebaut wird, was
angeboten wird, ob ein fremdes Angebot gut ist, und wohin die erhandelten Karten
kommen.

**In keine Hand wird geschaut** - auch nicht in die der anderen Computergegner.
Wem eine Sojabohne angeboten wird, entscheidet sich an den **offenen Feldern**,
so wie am Tisch: Wer sichtbar Sojabohnen anbaut, will noch eine. Der Rest wird
gefragt und findet es heraus.

Angeboten wird der Reihe nach, jedem einmal: Ein Angebot, das gerade abgelehnt
wurde, wird nicht besser, wenn man es demselben Menschen noch einmal macht.

Und der Computer **fängt auf fremden Zügen nichts an**. Ein Gegner, der auch
noch selbst Angebote aufmacht, füllt den Tisch damit - und ein Tisch, an dem die
Maschinen miteinander reden, macht niemandem Spaß. Er antwortet auf alles und
bietet nur im eigenen Zug an.

## Online: Felder offen, Hände zu

**Die Felder sind öffentlich, die Hände nicht** - genau so, wie es auf dem Tisch
liegt ([multiplayer/adapter.ts](multiplayer/adapter.ts)). Alles, was man durch
Hinsehen erführe, reist unverändert im gemeinsamen Schnappschuss: jedes Feld mit
Sorte und Höhe, die quer liegenden Karten, die zwei aufgedeckten, der
Ablagestapel, jeder Talerstapel - und wie viele Karten jeder auf der Hand hält.
Die Zahl ist keine Nebensache: Sie sagt, wie nah jemand daran ist, etwas anbauen
zu müssen.

Verborgen sind drei Dinge:

- die **Hand** - auf dem privaten Kanal ihres Platzes, öffentlich nur als Reihe
  verdeckter Karten in der richtigen Länge,
- der **Nachziehstapel** - im Tresor des Hosts, denn seine Zusammensetzung kann
  jeder ausrechnen, seine **Reihenfolge** nicht, und die Reihenfolge ist genau
  das, was gleich aufgedeckt wird,
- der **Talerstapel** - die Karten liegen verdeckt, welche Bohnen aus dem Spiel
  sind, geht niemanden etwas an. Nur wie viele es sind, steht offen da.

Was aussieht wie ein Geheimnis und keines ist: eine **angebotene Karte**. Sie
ins Angebot zu legen heißt, sie zu zeigen - deshalb trägt das Angebot ganze
Karten und wird nie geschwärzt. Sie bleibt dabei in der Hand, aus der sie kommt,
was auch die Anleitung rät: „Ziehe eine Karte erst aus der Hand, sobald der
Handel auch wirklich zustande kommt."

## Aufbau des Spielmoduls

```
bohnanza/
  engine/       Sorten und Bohnometer, Zustand, Schiedsrichter, Computergegner
  components/   Tisch, Handelsfenster, Endstand, Offline- und Online-Bildschirm
  hooks/        das Spiel gegen den Computer
  multiplayer/  Adapter für die gemeinsame Online-Schicht
  settings/     Spielerzahl, im Browser gemerkt
  i18n/         deutsche Texte und die Anleitung im Spiel
```
