# CATAN - Seefahrer

Gelesen aus `game_instructions/catan_seefahrer.pdf` (24 Seiten).

| Teil | Stand |
| ---- | ----- |
| **Allgemeine Regeln** (Schiffe, Seeräuber, Goldfluss) | **fertig** |
| **Neue Welt** (freies Spiel) | **fertig** |
| Die 8 Kampagnen-Szenarien | offen - siehe unten |

## Warum die Kampagne anders liegt als die fünf von Händler & Barbaren

Bei den Szenarien von *Händler & Barbaren* stand die Form immer im Text: die
Wüste wird ersetzt, die Wasserstelle liegt in der Mitte, jeder Fluss ist eine
waagerechte Reihe. Daraus ließ sich das Brett **herleiten** und an den
gedruckten Zahlen nachrechnen.

Die acht Seefahrer-Szenarien haben das nicht. Jedes ist eine **gezeichnete
Karte** - „baut das Szenario wie auf dieser Seite gezeigt auf" -, und wo welche
Insel liegt, sagt kein Satz. Man könnte acht Karten erfinden; das wäre dann
aber nicht mehr das gedruckte Spiel, sondern acht eigene Szenarien mit
fremdem Namen.

Das freie Spiel **Neue Welt** dagegen baut sein Brett selbst: „Mischt alle
Sechseckfelder verdeckt und legt sie offen nacheinander im Rahmen aus." Das ist
eine Anleitung und kein Bild - und deshalb ist es das, was hier steht.

## Das Brett

Neue Welt zählt **42 Felder** ab: 19 Meer und 23 Landschaften. Das Gitter
dieses Tisches braucht Reihen, die ineinandergreifen, also jede um eins länger
oder kürzer als die vorige; die nächstliegende Form ist **5-6-7-8-7-6-5 = 44**.

Die zwei Felder mehr gehen an die zwei **Goldflüsse**, die die Anleitung selbst
einlädt: „Spielt ihr mit Goldfluss-Landschaftsfeldern, achtet darauf, dass auf
diesen keine roten Zahlen liegen." In der Schachtel liegen genau zwei. Damit
kommt das Brett auf **19 Meer + 23 Landschaften + 2 Goldflüsse = 44** - das Meer
bleibt bei der gedruckten Zahl, und die Landschaften bleiben es auch.

Die Zahlenchips: 23 gedruckte (2, 3×3, 3×4, 3×5, 2×6, 2×8, 3×9, 3×10, 2×11, 12)
plus zwei für die Goldflüsse.

**Gemischt, nicht gelegt.** Zwei Bedingungen prüft der Aufbau an der fertigen
Auslage und mischt sonst neu - genau wie ein Tisch, der hinsieht und noch einmal
legt:

- keine zwei roten Zahlen nebeneinander, keine rote Zahl auf einem Goldfluss,
- und **wirklich eine Inselwelt**: mindestens drei Inseln, und die größte hält
  höchstens 60 % des Landes. Ein reiner Zufallswurf liefert oft einen Kontinent
  mit Pfützen, und Seefahrer auf einem Kontinent ist das Grundspiel mit
  Umwegen. Die Anleitung erlaubt das Nachbessern ausdrücklich: „Seid ihr mit der
  Auslage der Felder nicht zufrieden, dürft ihr Veränderungen vornehmen."

Nachgerechnet über fünf Aufbauten: 19 Meer, 25 Land, 3 bis 5 Inseln, 10 Häfen.

## Schiffe

Kosten 1 Holz + 1 Wolle, 15 je Farbe.

- Nur auf **Wasser**: zwischen zwei Meerfeldern oder zwischen Meer und Land.
- An eine **eigene** Siedlung, Stadt oder ein eigenes Schiff - verzweigen ist
  erlaubt.
- Ein Weg trägt entweder ein Schiff oder eine Straße, nie beides.
- **Nie direkt an eine Straße.** Diese Regel steht nirgends als Verbot im Code:
  Straßen stehen einfach nicht in der Liste dessen, woran ein Schiff andocken
  darf. Dasselbe von der anderen Seite gelesen.
- Wer mit einer Schiffslinie ein Landschaftsfeld erreicht, darf dort eine
  Siedlung gründen - eine Straße ist dafür nicht nötig.

**Versetzen:** Das vorderste Schiff einer **offenen** Linie darf aufgenommen und
anderswo neu gesetzt werden, einmal je Zug, nie eines aus dieser Runde, nie
eines aus einer geschlossenen Linie. „Vorderstes Schiff" heißt hier: eines, das
an einem Ende ins Leere führt - keine eigene Siedlung, kein weiteres eigenes
Schiff. Vom einzelnen Schiff aus gefragt, aber dieselbe Antwort wie von der
Linie aus: Eine geschlossene Linie hat an beiden Enden ein Gebäude und deshalb
nirgends ein loses Ende.

**Längste Handelsroute:** Schiffe zählen mit. „Schiffe gelten mit Straßen nur
dann als verbunden, wenn eine Siedlung oder Stadt dazwischensteht" - der Lauf
merkt sich also, worauf er zuletzt gefahren ist, und darf nur an einem eigenen
Gebäude wechseln.

## Der Seeräuber

Sitzt auf einem **Meerfeld**. Bei einer „7" oder mit einer Ritterkarte gilt:
„Du kannst wählen, ob du entweder den Seeräuber versetzen willst oder den
Räuber. Eine der beiden Figuren muss versetzt werden." Am Brett leuchten
deshalb beide zugleich - die Meerfelder für den einen, die Landschaften für den
anderen.

Wer ihn versetzt, zieht eine Karte von jemandem mit einem Schiff an einer der
sechs Kanten. Und solange er steht, darf auf diesen sechs Kanten kein Schiff
gesetzt und keines entfernt werden.

## Der Goldfluss

„Wird die Zahl auf einem Goldfluss-Feld gewürfelt, nehmen sich alle mit einer
Siedlung an diesem Feld 1 Rohstoffkarte pro eigene Siedlung. Die Rohstoffart
dürfen sich alle selbst aussuchen." Eine Stadt bringt zwei, und die zwei dürfen
verschieden sein - deshalb zählt der Schiedsrichter **Karten** und nicht
Gebäude, und fragt jede betroffene Person der Reihe nach.

## Neue Welt: die Sonderregeln

- Gegründet wird **an beliebigen Plätzen**; wer eine Siedlung an die Küste
  setzt, darf statt der Straße ein Schiff daran setzen.
- Am Ende der Gründungsphase werden die **Heimatinseln** festgeschrieben - „zu
  Beginn habt ihr also alle eine oder zwei Heimatinseln".
- Für die **erste** Siedlung auf einer fremden Insel gibt es 1 Siegpunkt-Chip.
- Gespielt wird bis **12 Siegpunkte**.

## Was das Selbstspiel gefunden hat

Vier Partien über 88 bis 170 Züge, alle beendet. Drei Fehler kamen heraus, und
zwei davon lagen außerhalb der Seefahrt:

1. Ein Brett mit **44 Feldern** ließ sich nicht laden: Die Zustandsprüfung kannte
   nur die 19 und die 30 des Grundspiels. Ein gespeichertes Seefahrer-Spiel wäre
   beim Laden verworfen worden.
2. Die Phasenliste derselben Prüfung kannte **acht Phasen nicht**, die diese
   Sitzung angelegt hat - `vote`, `posting`, `barbarians`, `knights`, `driving`,
   `shifting`, dazu die zwei neuen. Jede gespeicherte Partie, die in einer davon
   stand, wäre stillschweigend weggeworfen worden. Derselbe Fehler wie damals
   bei `event`, nur achtmal.
3. Der **Goldfluss zahlte nie**: Er setzt die Phase, in der gewählt wird - und
   die Zeile, die nach der Ausschüttung die nächste Phase bestimmt, überschrieb
   sie sofort wieder. Jetzt fragt sie zuerst, ob noch jemand wählen muss.

## Was noch offen ist

Die acht Kampagnen-Szenarien: *Zu neuen Ufern*, *Die vier Inseln*, *Ozeanien*,
*Durch die Wüste*, *Der vergessene Stamm*, *Stoffe für Catan*, *Die
Pirateninseln*, *Die Catanischen Wunder*. Jedes bringt eigene Regeln mit -
Stoffballen, Piratenfestungen, die Catanischen Wunder als Bauwerke - und jedes
braucht seine gedruckte Karte. Die allgemeinen Regeln, auf denen alle acht
aufsetzen, stehen jetzt.
