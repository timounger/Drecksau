# CATAN - Seefahrer

Gelesen aus `game_instructions/catan_seefahrer.pdf` (24 Seiten).

| Teil                                                  | Stand               |
| ----------------------------------------------------- | ------------------- |
| **Allgemeine Regeln** (Schiffe, Seeräuber, Goldfluss) | **fertig**          |
| **Neue Welt** (freies Spiel)                          | **fertig**          |
| Die 8 Kampagnen-Szenarien                             | offen - siehe unten |

## Warum die Kampagne anders liegt als die fünf von Händler & Barbaren

Bei den Szenarien von _Händler & Barbaren_ stand die Form immer im Text: die
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

## Szenario 1: Zu neuen Ufern

Das erste der acht Kampagnen-Szenarien, und das einzige, dessen Brett sich ohne
gedruckte Karte rekonstruieren lässt: eine **große Insel** in der Mitte und
**kleine Inseln** daneben, „das eingerahmte Gebiet". Gespielt wird bis **14
Siegpunkte**.

### Das Brett

Die Materialtabelle des Szenarios zählt „Gesamt 42" Felder - 14 Meer, 1 Wüste,
2 Goldflüsse und je 5 der fünf Landschaften - und „27 Zahlenchips", einen für
jedes Feld, das zahlt. Dieses Gitter fasst 44; die zwei übrigen sind Meer, genau
wie bei der Neuen Welt.

Die **Hauptinsel** sind die gedruckten neunzehn Felder in der bekannten Form
3-4-5-4-3, die Wüste darunter, auf der der Räuber startet. Sie liegt an **einer
Seite** des Rahmens, so wie sie gedruckt ist - und das ist keine Kosmetik:
Mittig gelegt bleibt vom Gitter nur ein Ring von einem Feld Breite, in dem sich
alle Inselfelder zu **einer** langen Insel zusammenschließen. An der Seite
liegen vierzehn freie Wasserfelder nebeneinander, und darin haben die neun
Inselfelder Platz.

Verteilt werden sie mit zwei Regeln: Keine kleine Insel berührt die Hauptinsel -
eine angewachsene Insel ist eine Halbinsel und bräuchte gar kein Schiff -, und
keine wird größer als **drei** Felder. Heraus kommen drei kleine Inseln zu je
drei Feldern, mit beiden Goldflüssen darunter.

### Die Sonderregeln

- **Gegründet wird auf der großen Insel.** „Ihr gründet eure ersten beiden
  Siedlungen ... auf der großen Insel" - die kleinen sind das, wofür die Schiffe
  da sind.
- **Statt einer Straße ein Schiff.** Wer an der Küste gründet, darf sofort in
  See stechen; das kann der Schiedsrichter schon seit den allgemeinen Regeln.
- **Räuber und Seeräuber** sind beide im Spiel: der Räuber startet auf der
  Wüste, der Seeräuber auf einem Meerfeld am Rahmen.
- **Zwei Siegpunkt-Chips** für die jeweils erste Siedlung auf einer kleinen
  Insel - „Siedlungswert insgesamt: 3 Siegpunkte". Im freien Spiel der Neuen
  Welt zählt so ein Chip nur 1; hier zählt er 2, und das Panel schreibt dazu,
  welcher Wert gerade gilt.

Nachgespielt: zehn Partien zu dritt, alle beendet, 90 bis 214 Züge. Dabei kam
ein Fehler heraus, der die **Neue Welt** genauso betraf: Der Räuber startete auf
einem Feld, dessen Nummer aus einem ganz anderen Kartenspiel stammte - die Suche
nach der Wüste lief über die Auslage der gedruckten Insel, nicht über die
Inselwelt, die tatsächlich gespielt wird. Er stand damit auf einem beliebigen
Feld und legte es still. Jetzt sucht er die Wüste in der Auslage, die auf dem
Tisch liegt: in _Zu neuen Ufern_ die eine auf der Hauptinsel, in der Neuen Welt
gar keine - dort wartet er neben dem Brett, wie es die Regel ohnehin vorsieht.

## Szenario 2: Die vier Inseln

Vier ungefähr gleich große Inseln, und jede Farbe gründet, wo sie will. Gespielt
wird bis **13 Siegpunkte**.

### Das Brett

Die Materialtabelle zählt „Gesamt 35" Felder mit 23 Landschaften und „Gesamt 23"
Zahlenchips - keine Wüste, kein Goldfluss. Auf diesem Gitter sind das 23
Landschaften und 21 Meerfelder.

Die **Umrisse** der vier Inseln stehen fest: „Die Umrisse der vier Inseln sollten
nicht verändert werden. Innerhalb der Umrisse könnt ihr die Landschaftsfelder,
Häfen und Zahlenchips beliebig neu verteilen." Genau so ist es gebaut - vier
feste Formen in den vier Ecken des Rahmens, dazwischen offenes Wasser, und alles
darin gemischt. Sechs, sechs, sechs und fünf Felder, denn 23 Landschaften gehen
nicht durch vier.

Der Räuber startet **auf der „12"** - dieses Szenario hat keine Wüste, auf der er
sonst stünde -, der Seeräuber auf einem Meerfeld am Rahmen.

### Heimatinseln und fremde Inseln

„Ihr dürft eure beiden Startsiedlungen auf beliebigen Inseln gründen. Alle haben
zu Beginn des Spiels 1 oder 2 Heimatinseln." Was in der Gründungsphase besiedelt
wurde, ist Heimat; alles andere ist fremd, und die **erste** Siedlung auf einer
fremden Insel bringt zwei Siegpunkt-Chips - Siedlungswert 3.

Diese Buchführung stand schon: Der Schiedsrichter schreibt am Ende der
Gründungsphase auf, wer wo begonnen hat, und zählt danach jede neue Insel. Neu
ist nur, was ein Chip wert ist - im freien Spiel 1, in den Szenarien 2 -, und das
Panel schreibt es dazu.

Nachgespielt: zehn Partien zu dritt, alle beendet, 105 bis 168 Züge, mit ein bis
zwei Heimatinseln je Farbe.

## Szenario 3: Ozeanien

Zwei Startinseln, und dazwischen ein **Nebelmeer**: verdeckte Felder, die erst
ans Licht kommen, wenn jemand daran baut. Gespielt wird bis **12 Siegpunkte**.

### Das Brett

„Baut die beiden großen Startinseln (mit Häfen) und das Meer wie gezeigt auf.
Mischt die Sechseckfelder, die übrig geblieben ... sind, und legt sie verdeckt
auf die freien Plätze." Genau so: zwei feste Inseln von je sieben Feldern in
gegenüberliegenden Ecken, mit ihren vierzehn Zahlenchips - und **alles andere
ist Nebel**. Darunter liegen dreizehn Landschaften, beide Goldflüsse darunter
(„sagenhaftes Gold"), und der Rest ist Meer.

Die Chips des Nebels sind in der Anleitung ein **Stapel**: „Die Zahlenchips für
diese Landschaftsfelder werden ebenfalls gemischt und als verdeckter Stapel
bereitgelegt", und wer ein Feld aufdeckt, legt den obersten darauf. Hier sind
sie vorab auf die verdeckten Landschaften verteilt - dasselbe von der anderen
Seite gesehen, und niemand muss einen Stapel mitführen.

### Nebel lichten

„Setzt ihr ein Schiff oder eine Straße auf einen Weg, an dessen Ende ein
Nebelfeld liegt, dreht ihr es um." Meer darunter: nichts weiter. Eine
Landschaft: sie bekommt ihren Zahlenchip, und wer sie entdeckt hat, nimmt sofort
**einen Rohstoff** dieser Art.

Der Nebel zählt bis dahin als Wasser - Schiffe fahren hinein, denn genau so
kommt er weg. Gebaut wird an ihm nichts: eine Siedlung braucht Land, und was
unter dem Nebel liegt, weiß noch niemand.

**Siegpunkt-Chips gibt es hier nicht.** Ozeanien druckt keine
„Sondersiegpunkte"; seine Sonderregel ist der Nebel. Die erste Siedlung auf einer
fremden Insel zählt also einfach eins - und das Panel lässt die Zeile weg,
statt eine Null zu zeigen, die es nicht gibt.

Der Räuber startet auf der „12", der Seeräuber auf einem Meerfeld am Rahmen.

Nachgespielt: zehn Partien zu dritt, alle beendet, 51 bis 137 Züge, dabei vier
bis elf Nebelfelder gelichtet.

## Szenario 4: Durch die Wüste

Eine große Insel, quer darüber ein **Wüstengürtel** - und dahinter ein schmaler
Landstreifen, der als fremde Insel zählt, obwohl man zu Fuß hinkommt. Dazu drei
kleine Inseln im Osten mit Gold und Erz. Gespielt wird bis **14 Siegpunkte**.

### Das Brett

Die Umrisse stehen fest, die Felder darin nicht: „Die Landschaftsfelder, Häfen
und Zahlenchips der Hauptinsel ... können beliebig neu ausgelegt werden. Ihr
könnt auch die Landschaftsfelder und Zahlenchips der kleinen Inseln und des
abgetrennten und markierten Landstreifens ... neu auslegen." Drei Auslagen also:
Hauptinsel (19 Felder), Landstreifen (3) und die kleinen Inseln (5), dazu die
drei Wüsten des Gürtels und 27 Zahlenchips.

Die drei kleinen Inseln liegen als eine Einzelinsel, eine zweite Einzelinsel und
eine Dreiergruppe im Osten. Welche Felder das sind, ist nicht beliebig: Das
freie Wasser östlich der Hauptinsel liegt auf diesem Gitter in einer **Kette**,
und fünf Felder darin nebeneinander wären eine einzige lange Insel - und damit
kein Wettlauf, sondern ein Spaziergang.

### Der Gürtel trennt, was zusammenhängt

Der Landstreifen hinter dem Gürtel ist Land, und über die Wüste führt ein Weg -
„die Wagemutigsten wählen den Weg durch die gnadenlose Wüste". Trotzdem ist er
eine **fremde Insel**, und die erste Siedlung darauf bringt zwei Siegpunkt-Chips
wie jede andere.

Für die Inselzählung gilt deshalb in diesem einen Szenario: **Wüste trennt wie
Wasser.** Damit fallen Hauptinsel, Streifen und die kleinen Inseln
auseinander, ohne dass irgendwo eine Ausnahme in die Baubarkeit eingebaut werden
müsste - gebaut wird auf der Wüste wie auf jedem anderen Feld, sie zahlt nur
nichts.

Gegründet wird auf der **größeren Hauptinsel**, „rechts bzw. unterhalb des
Wüstengürtels". Der Räuber startet auf einer der drei Wüsten, der Seeräuber auf
einem Meerfeld am Rahmen.

Nachgespielt: zehn Partien zu dritt, alle beendet, 101 bis 174 Züge.

## Szenario 5: Der vergessene Stamm

Eine lange, schmale Insel - und ringsum kleine **bewohnte** Inseln, die niemand
besiedelt und die nichts abwerfen. Was es dort gibt, sind **Geschenke**.
Gespielt wird bis **13 Siegpunkte**.

### Das Brett

Die Hauptinsel ist das Mittelband des Gitters: neunzehn Felder, achtzehn
Landschaften mit ihren achtzehn Chips und eine Wüste, auf der der Räuber
startet. Ringsum liegen **sechs** kleine Inseln aus je einem Feld, beide
Goldflüsse darunter - „die kleinen Inseln bleiben alle ohne Zahlenchip", also
zahlt auch das Gold niemandem etwas.

Dass es sechs einzelne sind und nicht mehr, hat einen Grund: Eine kleine Insel
darf weder die Hauptinsel noch eine andere berühren, sonst läge ihre Küste in
Reichweite, ohne dass je ein Schiff fahren müsste. Auf diesem Gitter halten nur
die oberste und die unterste Reihe diesen Abstand, und dort ist Platz für je
drei.

**Häfen liegen keine am Brett.** Alle sechs sind Geschenke: „Mischt die 6 Häfen
verdeckt und legt sie auf die markierten Plätze."

### Die Geschenke

Auf den Küstenlinien der kleinen Inseln liegen **18** Geschenke: 8
Siegpunkt-Chips, 6 Häfen, 4 Entwicklungskarten. Wer ein Schiff auf so eine Kante
baut **oder dorthin versetzt**, nimmt, was dort liegt - und es wird nicht
nachgelegt.

| Geschenk | Was es bringt                                                                                                             |
| -------- | ------------------------------------------------------------------------------------------------------------------------- |
| **SP**   | 1 Siegpunkt                                                                                                               |
| **EK**   | Die oberste Entwicklungskarte, „wie eine in diesem Zug erworbene" - also erst nächste Runde spielbar                      |
| **H**    | Ein Hafen, sofort an eine eigene Küstensiedlung ohne Hafen gelegt; ist keine da, wird er aufbewahrt, bis eine gebaut wird |

Die Wahl, an **welche** eigene Küstensiedlung ein Hafen kommt, trifft der
Schiedsrichter: die erste an der Küste, die noch keinen hat. Was der Hafen tut,
hängt nicht davon ab, an welcher er liegt.

### Der Räuber

„Der Räuber darf nicht auf die kleinen Inseln versetzt werden. Hat er die
Startwüste verlassen, darf er nicht mehr dorthin zurückgesetzt werden." Beides
steht in der Liste der erlaubten Felder; dafür merkt sich die Partie, wo er
angefangen hat.

Nachgespielt: zehn Partien zu dritt, alle beendet, 81 bis 171 Züge, mit null bis
fünf geholten Geschenken je Partie.

Zu sechst kam später noch etwas heraus, und es war dasselbe wie so oft: **Der
Computergegner fuhr nicht zu den Geschenken.** Seine Schiffe suchten fremde
Küsten, weil das im freien Spiel den Siegpunkt bringt - hier liegen die Punkte
aber auf den Kanten der kleinen Inseln. Ist die Küste erst bebaut, hat eine
Flotte, die nur Küsten kennt, gar kein Ziel mehr: Eine Partie stand nach
neuntausend Zügen bei zwölf von dreizehn Punkten, während fünf Siegpunkt-Chips
auf dem Wasser lagen. Jetzt fährt er zum näheren von beidem.

Dazu ein zweiter Fehler mit derselben Wirkung: **Versetzen wurde nur angeboten,
wenn er sich ein Schiff hätte leisten können.** Versetzen kostet aber nichts -
und wer nichts mehr bauen kann, hat genau das noch.

## Szenario 6: Stoffe für Catan

Zwei Hauptinseln oben und unten, dazwischen vier kleine Inseln mit **acht
Dörfern** des Vergessenen Stammes - und die handeln Stoff. Gespielt wird bis
**14 Siegpunkte**, oder bis der Stoff fast alle ist.

### Das Brett

Die beiden Hauptinseln sind das obere und das untere Band des Gitters, je elf
Felder, mit zwei Wüsten und beiden Goldflüssen darunter. Die vier kleinen
Inseln sind einzelne Felder in der Mittelreihe, weit genug voneinander und vom
Land entfernt; sie bringen **keine Erträge** und tragen keinen Feldchip.

Ihre Zahlen liegen stattdessen auf den **Kreuzungen**: „Auf die 4 kleinen
Inseln legt ihr je 2 Zahlenchips, genau auf die Kreuzung (jeder Zahlenchip
stellt ein Dorf dar)." Je zwei gegenüberliegende Ecken eines Feldes, damit ein
Schiff zum einen Dorf fahren kann, ohne das andere zu versperren. Zu jedem Dorf
kommen **5 Stoffballen**, zehn weitere bilden den allgemeinen Vorrat.

### Der Stoffhandel

Eine **Schiffslinie** von einer eigenen Siedlung zu einem Dorf ist eine
Handelsbeziehung: sofort 1 Ballen, und bei jedem Wurf der Dorfzahl 1 weiterer -
für **alle**, die angeschlossen sind. Ist der Vorrat eines Dorfes leer, gibt es
von ihm nichts mehr, auch nicht aus dem allgemeinen Vorrat. **Zwei Ballen sind
1 Siegpunkt.**

Die Linie ist damit geschlossen: Aus ihr darf kein Schiff mehr versetzt werden.
Das merkt sich die Partie beim Anschluss - genau die Kanten, über die der Weg
lief.

### Was dieses Szenario sonst noch umstellt

- **Drei** Gründungssiedlungen statt zwei, und die Startrohstoffe bringt die
  dritte. Die Gründungsreihenfolge kann seither beliebig viele Runden - hin,
  zurück, hin.
- Die **Längste Handelsroute** entfällt, die Größte Rittermacht bleibt.
- Der **Seeräuber** darf nur versetzen, wer mindestens ein Dorf erreicht hat;
  dafür gibt es einen geraubten Stoffballen oder, wenn nichts zu rauben ist, 1
  Rohstoff. Die Wahl trifft der Schiedsrichter zugunsten des Ballens - er ist
  ein halber Siegpunkt und damit mehr wert als eine Karte.
- Der **Räuber** darf die Inseln des Stammes nicht betreten, und gebaut wird
  dort nie.
- **Zweites Spielende:** Sobald nur noch drei Dörfer Ballen haben, endet die
  Partie sofort; es gewinnt, wer die meisten Punkte hat, bei Gleichstand die
  meisten Ballen.

Nachgespielt: zehn Partien zu dritt, alle beendet, 65 bis 178 Züge, mit bis zu
elf Ballen und sechs Handelsbeziehungen.

## Szenario 7: Die Pirateninseln

Das eigenständigste Szenario der Kampagne: eine **Piratenflotte** kreist um die
Wüsteninseln, Ritterkarten werden zu **Kriegsschiffen**, und jede Farbe hat im
Westen eine **Piratenfestung**, die ihr gehört, sobald sie erobert ist.

### Das Brett

„Das Szenario ist nur mit dem vorgegebenen Aufbau ausgewogen und sollte nicht
variiert werden" - also wird nur die Heimatinsel gemischt, und selbst ihre Chips
bleiben liegen. Vier Bänder von West nach Ost: die **Pirateninseln** mit den
Festungen, zwei **Wüsteninseln**, offenes Wasser, und die **Heimatinsel** mit
siebzehn Feldern, auf der alle gründen.

Auf jeder Festung steht von Anfang an eine Siedlung in der Farbe ihrer Besitzer

- und sie zählt nichts: „hat eine Piratenfestung alle 3 Chips verloren, sind die
  Piraten vertrieben und die Siedlung ist zurückerobert. Ab jetzt erhältst du die
  Erträge und den Siegpunkt für diese Siedlung." Bis dahin bringt sie weder Ertrag
  noch Punkt.

### Die Piratenflotte

Vor jedem Wurf fährt die Flotte - „die Zugweite entspricht dem Würfel mit der
niedrigeren Augenzahl" - im Uhrzeigersinn um die Wüsteninseln. Der Ring ist die
Kette der Meerfelder um sie herum, nach dem Winkel sortiert, in dem sie liegen;
das ist es, was „im Uhrzeigersinn" bedeutet, wenn das Bild fehlt.

Endet ihr Zug neben einer Siedlung, wird überfallen. Stärke der Piraten: der
kleinere Würfel. Stärke der Verteidigung: die Zahl der eigenen **Kriegsschiffe**.
Ist der Pirat stärker, kostet es 1 Rohstoff und 1 weiteren je Stadt; ist die
Verteidigung stärker, gibt es 1 Rohstoff aus dem Vorrat; bei Gleichstand nichts.

### Kriegsschiffe und die Festung

Eine **Ritterkarte** wird hier nicht für den Räuber gespielt - es gibt keinen -,
sondern rüstet „das hinterste 'normale' Schiff deiner Schiffslinie" zum
Kriegsschiff um. Und die Linie ist streng: **eine** je Farbe, ohne Abzweigung,
nicht über die Festung hinaus.

Dasselbe tut eine **Siegpunktkarte**: „Deckst du eine Ritterkarte (im Spiel zu
viert auch Siegpunktkarte) auf, darfst du jeweils das hinterste 'normale' Schiff
deiner Schiffslinie in ein Kriegsschiff umwandeln." Die Anleitung nennt den
Tisch zu viert, weil das Szenario für vier gedruckt ist; der Grund gilt an jedem
anderen genauso, denn der Kartenstapel ist die **einzige** Quelle für
Kriegsschiffe und wird nicht nachgemischt. Deshalb gilt es hier an jedem Tisch:
Eine Siegpunktkarte kostet einen Siegpunkt und bringt ein Kriegsschiff - und ein
hier gespielter Ritter zählt für keine Größte Rittermacht, die es in diesem
Szenario ohnehin nicht gibt.

Der Angriff würfelt einen Würfel: mehr Kriegsschiffe als die Zahl nimmt der
Festung einen Chip; weniger kostet die **zwei vordersten** Schiffe, Gleichstand
das vorderste. Danach ist der Zug zu Ende, und ein zweiter Angriff in derselben
Runde ist nicht erlaubt.

Dass die Kriegsschiffe **hinten** entstehen und die Verluste **vorne** anfallen,
ist die ganze Taktik des Szenarios - und genau daran hat sich der
Computergegner die Zähne ausgebissen, siehe unten.

### Sonst noch

- **Kein Räuber.** Bei einer „7" gibt jede Person über sieben Karten die Hälfte
  ab, dann zieht die würfelnde Person eine Karte von irgendwem.
- **Längste Handelsroute und Größte Rittermacht entfallen.**
- Gebaut wird auf den Pirateninseln nur auf der eigenen **markierten Kreuzung**.
- Gewonnen hat, wer die eigene Festung erobert hat **und** 10 Siegpunkte
  besitzt - die Punkte allein genügen nicht.

### Was das Selbstspiel gefunden hat

Der Computergegner musste dieses Szenario von Grund auf lernen, und jeder Schritt
kostete eine Partie:

- **Er griff nie an**, weil der Zug gar nicht in seiner Liste stand.
- Dann griff er **immer** an: 261 Angriffe in einer Partie, alle mit zwei oder
  drei Kriegsschiffen gegen einen Würfel - und verlor dabei laufend Schiffe.
- Dann **kam er nicht mehr an**: Die Wegsuche für Schiffe reichte sechs Schritte
  weit, und die Festung liegt quer über das Brett.
- Dann **spielte er die Ritterkarten nicht**: zwölf Karten auf der Hand, der
  Stapel leer, ein einziges Kriegsschiff auf dem Wasser.
- Und zuletzt **rüstete er zu viel um**: Eine Linie aus lauter Kriegsschiffen
  verliert bei einer Niederlage genau die - jetzt bleiben zwei gewöhnliche
  Schiffe vorne stehen, und die sind es, die fallen.

Nachgespielt: zehn Partien zu dritt, alle beendet, 77 bis 329 Züge, mit 4 bis 24
Angriffen.

Zu zweit, zu fünft und zu sechst kam später noch einmal dasselbe Bild - Partien,
die nach zehntausend Zügen bei 18 oder 19 Siegpunkten standen und trotzdem nicht
enden konnten, weil ohne eroberte Festung niemand gewinnt. Vier Ursachen:

- **Die Schiffslinie war die falsche.** Gefragt wurde die Linie an der _ersten_
  Küstensiedlung, die zufällig ein Schiff neben sich hatte - und das war
  manchmal ein Stummel aus zwei Schiffen im falschen Meer. Die Ritterkarten
  rüsteten dort um, während die Linie an der Festung unbewaffnet blieb. Jetzt
  ist „deine Schiffslinie" die, die zur Festung führt: „baut eine Schiffslinie
  von einer eurer Küstensiedlungen zu eurer Piratenfestung."
- **Er versetzte nie ein Schiff.** „Du darfst pro Zug 1 Schiff versetzen" stand
  im Schiedsrichter und in keiner Zugliste des Computergegners. Wer seine
  fünfzehn Schiffe ins falsche Wasser gebaut hatte, war für den Rest der Partie
  fertig. Jetzt versetzt er eines, sobald der Vorrat leer ist - vorher lohnt es
  nicht, denn ein neues Schiff ist besser als ein umgestelltes.
- **Die Siegpunktkarten rüsteten nicht um.** Die halbe Regel fehlte (siehe
  oben), und mit ihr die Kriegsschiffe, die eine leergekaufte Partie noch
  gewinnen können.
- **Er wartete auf eine Flotte, die nicht mehr kam.** Mit leerem Kartenstapel
  und keinem Bauplatz mehr wächst keine Linie: Dann greift er mit dem an, was er
  hat, denn ein verlorener Kampf gibt die Schiffe in den Vorrat zurück -
  Warten gibt gar nichts.

Drei Runden Selbstspiel später - je zwanzig Szenarien an fünf Tischgrößen mit
mehreren Startaufstellungen - blieb dieses Szenario das einzige, das immer noch
Partien anhielt, und jede hatte einen eigenen Grund:

- **Er baute vier kleine Schiffshaufen statt einer Linie.** „Du darfst in diesem
  Szenario nur 1 Schiffslinie zu den westlichen Inseln bauen": Jetzt baut er
  jedes Schiff an eine eigene Siedlung oder an ein Ende dessen, was schon liegt.
  Vorher lagen fünfzehn Schiffe in vier Haufen, einer davon an der Festung, und
  keiner konnte je ein zweites Kriegsschiff tragen.
- **Er rüstete nicht um, weil er auf Vorschiffe wartete.** Zwei gewöhnliche
  Schiffe vor den Kriegsschiffen sind gut, solange die Linie noch wächst - sie
  wächst aber nicht mehr, sobald sie an der Festung angekommen ist: „die
  Schiffslinie darf ... nicht über die Piratenfestung hinaus gebaut werden."
  Dasselbe galt für den Angriff selbst: Er verlangte drei Kriegsschiffe auf
  einer Linie, die nur zwei tragen kann.
- **Die Linie war ein Stummel.** Wer auf der Pirateninsel gebaut hat, hat dort
  eine Siedlung mit einem Schiff daneben - auch das ist eine Linie, die die
  Festung berührt. Gemeint ist die **längste** davon, nicht die erste.

Und weil dieses Szenario ohne eroberte Festung überhaupt nicht enden kann,
prüft der Schiedsrichter jetzt zwei Sackgassen, die die Anleitung nicht kennt -
siehe [Wenn nichts mehr geht](game-rules.md#wenn-nichts-mehr-geht).

## Szenario 8: Die Catanischen Wunder

Das letzte Szenario der Kampagne, und das einzige, in dem nicht Siegpunkte
allein gewinnen: **fünf Bauwerke**, jedes in vier Stufen, und wer eines
vollendet, hat sofort gewonnen.

### Das Brett

Dieselbe Form wie beim Vergessenen Stamm: eine lange Insel in der Mitte,
neunzehn Felder mit zwei Wüsten, und sechs kleine Inseln ringsum. Hier werden
die kleinen aber **besiedelt**: „Gründest du im Laufe des Spieles eine Siedlung
auf einer kleinen Insel, erhältst du 1 Siegpunkt-Chip." Das zahlen die
Insel-Chips der allgemeinen Regeln von selbst. Der Räuber startet auf einer
Wüste, einen Seeräuber gibt es nicht.

### Die fünf Wunder

| Wunder         | Bedingung    | Eine Stufe kostet                  |
| -------------- | ------------ | ---------------------------------- |
| Große Mauer    | 3 Siedlungen | 2 Lehm, 1 Holz, 2 Erz              |
| Große Brücke   | 2 Häfen      | 2 Lehm, 2 Holz, 1 Wolle            |
| Monument       | 4 Siedlungen | 1 Holz, 1 Wolle, 1 Getreide, 2 Erz |
| Großes Theater | 2 Städte     | 2 Wolle, 2 Getreide, 1 Erz         |
| Burg           | 2 Ritter     | 1 Lehm, 2 Holz, 2 Erz              |

**Rekonstruiert.** Die Anleitung druckt weder Bedingungen noch Preise - sie
stehen auf den Wunderplättchen, und die sind im Text nicht abgebildet. Zitiert
ist die Form („jedes Wunder gliedert sich in vier Stufen. Jede Stufe kostet die
... angegebenen 5 Rohstoffe") und ein Beispiel: „So kannst du beispielsweise nur
dann mit dem Bau des Theaters beginnen, wenn du bereits 2 Städte gebaut hast."
Das Theater steht also wie gedruckt; die anderen vier fragen nach vier
verschiedenen Dingen, damit die Wahl davon abhängt, wie die Partie gelaufen ist,
und nicht davon, welches Wunder das billigste ist.

Wer zuerst anfängt, hat die freie Wahl; wer später kommt, nimmt, was übrig ist -
und wer ein Wunder belegt hat, muss es auch bauen. Mehrere Stufen in einem Zug
sind erlaubt, wenn die Rohstoffe reichen.

### Zwei Wege zu gewinnen

„Sobald jemand ein Catanisches Wunder vollendet (Stufe 4 gebaut) **oder** wenn
jemand an der Reihe ist, 10 Siegpunkte besitzt und eine höhere Stufe beim Bau
des Catanischen Wunders erreicht hat als die anderen." Beide Wege sind da, und
im Selbstspiel kommen beide vor.

Nachgespielt: zehn Partien zu dritt, alle beendet, 64 bis 182 Züge - sieben
davon über ein vollendetes Wunder, drei über die zehn Punkte mit der höchsten
Stufe.

## Wo der Räuber startet

Jedes Szenario sagt das für sich, und sie sagen es verschieden - deshalb steht
es jetzt Szenario für Szenario im Aufbau statt als Faustregel „Wüste, sonst
nichts":

| Szenario | Anleitung |
| --- | --- |
| Zu neuen Ufern | „zu dritt auf dem Feld mit der 12, zu viert auf der Wüste" |
| Die vier Inseln, Ozeanien, Stoffe für Catan, Neue Welt | „auf dem Feld mit der 12" |
| Durch die Wüste, Der vergessene Stamm, Die Catanischen Wunder | auf einer Wüste |
| Die Pirateninseln | **„Es gibt keinen Räuber."** |

Drei davon stimmten nicht: In _Ozeanien_, _Stoffe für Catan_ und im freien Spiel
stand der Räuber neben dem Brett statt auf der Zwölf - und in den
_Pirateninseln_ stand er überhaupt da, obwohl es ihn dort nicht gibt: ein Feld,
das die ganze Partie nichts abwarf.

## Was am Bildschirm zu tippen ist

Zwei Züge dieser Erweiterung waren lange nur dem Computergegner möglich, weil
sie **keinen Knopf** hatten - dem Schiedsrichter fehlte nichts, der Anzeige
schon:

- **Der Angriff auf die Piratenfestung.** Ohne ihn kann in _Die Pirateninseln_
  niemand gewinnen, denn dort gewinnt nur, wer seine Festung erobert **und**
  zehn Punkte hat. Der Knopf steht jetzt in der Zugleiste, sobald die eigene
  Linie an der Festung liegt, und sagt dazu, mit wie vielen Kriegsschiffen
  gekämpft wird.
- **Die Stufen der Catanischen Wunder.** Das Seefahrer-Feld zeigte, welche
  Wunder noch frei sind, und ließ keines bauen. Jetzt steht dort je ein Knopf -
  „Große Mauer beginnen", „Monument: 3. Stufe bauen" -, ausgegraut, solange die
  Baukosten nicht in der Hand sind.

Gefunden hat das eine simple Gegenprobe: **jede Zugart einmal in der
Oberfläche suchen.** Von 73 Zugarten hatten drei keine - die beiden hier und
der Würfelwurf gegen einen Barbaren vor dem Trosswagen in Händler & Barbaren.

## Was noch offen ist

Alle acht Kampagnen-Szenarien sind umgesetzt.
