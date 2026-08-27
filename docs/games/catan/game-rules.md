# CATAN - Spielregeln

Umsetzung von **CATAN - Das Spiel** von Klaus Teuber (KOSMOS, Ausgabe 2025,
Art.-Nr. 684655). Die Regeln stammen aus der deutschen Originalanleitung
(`catan.pdf`, 12 Seiten).

Dazu die **5-6 Personen Erweiterung** (KOSMOS, Art.-Nr. 685058,
`catan_5_6_Spieler.pdf`, 4 Seiten) und die ersten Varianten aus **CATAN -
Händler & Barbaren** (KOSMOS, Art.-Nr. 685140, `catan_babaren.pdf`, 24 Seiten).
Was davon umgesetzt ist und was noch nicht, steht unter
[Erweiterungen](#erweiterungen).

**Das PDF enthält eingebetteten Text**, die Regeln sind also wörtlich gelesen
und nicht vom Bild abgeschrieben. Zwei Dinge stehen dort trotzdem nur als Bild -
die Hex-Ausrichtung und die Häfen; beides wurde an den Abbildungen auf Seite 4
und 5 abgelesen. Was daraus stammt und was nicht, steht unten unter
[Was nicht in der Anleitung steht](#was-nicht-in-der-anleitung-steht).

## Material

- **19 Landschaftsfelder**: Hügelland 3 (Lehm), Wald 4 (Holz), Weideland 4
  (Wolle), Ackerland 4 (Getreide), Gebirge 3 (Erz), Wüste 1
- **18 Zahlenchips**: je zweimal 3, 4, 5, 6, 8, 9, 10, 11 und je einmal 2 und 12
- **95 Rohstoffkarten**, 19 je Sorte
- **25 Entwicklungskarten**: 14 Ritter, 5 Siegpunkt, 2 Monopol, 2 Straßenbau,
  2 Erfindung
- Pro Farbe **5 Siedlungen, 4 Städte, 15 Straßen**
- 2 Sondersiegpunkttafeln, 1 Räuber, 2 Würfel, 6 Rahmenteile mit 9 Häfen

**3 bis 6 Spieler.** „Spielt ihr zu dritt, lasst ihr die weißen Figuren weg" -
zu dritt spielen also Rot, Blau und Orange, zu viert kommt Weiß dazu. Fünf und
sechs spielen mit der 5-6 Personen Erweiterung in Grün und Lila, auf einem
anderen Brett - siehe [Zu fünft und zu sechst](#zu-fünft-und-zu-sechst).

## Das Spielfeld

Die Anleitung nennt die beiden Bauplätze, zählt sie aber nicht auf:

> Wege münden immer in eine Kreuzung - das ist der Punkt, an dem 3 Felder
> zusammenstoßen (an der Küste nur 2 Felder).

Aus den 19 Feldern in Reihen von 3-4-5-4-3 ergeben sich daher **54 Kreuzungen**
und **72 Wege**, davon 30 an der Küste. Das Brett zu fünft und zu sechst hat
Reihen von 3-4-5-6-5-4-3 und wird nach genau derselben Rechnung abgeleitet. Die Umsetzung rechnet das aus der
Reihenanordnung aus, statt 126 Einträge abzuschreiben
([engine/board.ts](../../../website/src/games/catan/engine/board.ts)), und ein
Wegwerf-Test hat genau diese Zahlen geprüft. Gerechnet wird auf einem
**ganzzahligen Gitter** aus halben Feldbreiten und halben Feldhöhen: Zwei Felder,
die sich eine Ecke teilen, erzeugen damit denselben Schlüssel, ohne dass
irgendwo gerundet wird.

## Aufbau

Umgesetzt ist der **variable Aufbau** ab Seite 12, nicht der feste Startaufbau
von Seite 4:

1. Die Rahmenteile werden in beliebiger Reihenfolge zusammengesteckt.
2. Die Landschaftsfelder werden verdeckt gemischt und ausgelegt.
3. Die Zahlenchips kommen **in alphabetischer Reihenfolge, gegen den
   Uhrzeigersinn ab einem beliebigen Eckfeld** auf die Felder. Die Wüste wird
   übersprungen.
4. Der Räuber steht auf der Wüste.

Dass die Chips **den Buchstaben nach** gelegt werden und nicht gemischt, ist
kein Detail: Es ist der Grund, warum ein zufälliges Catan-Brett trotzdem
ausgewogen ist.

### Gründungsphase

Runde 1 im Uhrzeigersinn: 1 Siedlung und 1 angrenzende Straße. Runde 2 gegen den
Uhrzeigersinn, beginnend bei der Person, die zuletzt gesetzt hat - wieder
1 Siedlung und 1 Straße. **Die ersten Rohstoffe gibt es nur für die zweite
Siedlung**, je 1 Karte pro angrenzendem Feld.

## Ein Zug

1. **Ertragsphase**: mit beiden Würfeln werfen
2. **Handels- und Bauphase**: handeln und bauen, in beliebiger Reihenfolge und
   beliebig oft abwechselnd

Eine Entwicklungskarte darf **zu jedem Zeitpunkt** des eigenen Zugs ausgespielt
werden, auch vor dem Würfeln - aber nur **eine pro Zug**, und keine, die in
diesem Zug gekauft wurde.

### Erträge

Jede Siedlung an einem Feld mit der gewürfelten Zahl bringt 1 Rohstoff, jede
Stadt 2. Das Feld unter dem Räuber bringt nichts.

### Die 7

1. Wer **mehr als 7 Karten** hat, gibt die Hälfte ab (abgerundet).
2. Die würfelnde Person setzt den Räuber auf ein **anderes** Feld und zieht
   1 zufällige Karte von jemandem mit einem Gebäude an diesem Feld.

## Baukosten

| Was               | Kosten                                 | Punkte |
| ----------------- | -------------------------------------- | ------ |
| Straße            | 1 Lehm + 1 Holz                        | -      |
| Siedlung          | 1 Lehm + 1 Holz + 1 Wolle + 1 Getreide | 1      |
| Stadt             | 2 Getreide + 3 Erz                     | 2      |
| Entwicklungskarte | 1 Wolle + 1 Getreide + 1 Erz           | -      |

Eine Stadt entsteht nur aus einer eigenen Siedlung; die Siedlung geht zurück in
den Vorrat.

### Wohin gebaut werden darf

- **Straße**: auf einen freien Weg an einer Kreuzung, an die eine eigene Straße,
  Siedlung oder Stadt grenzt **und an der keine fremde Siedlung oder Stadt
  steht**. Beide Hälften zählen: Ein fremdes Gebäude hilft nicht nur nicht, es
  riegelt die Kreuzung ab - so wird eine fremde Handelsroute zerschnitten.
- **Siedlung**: auf eine Kreuzung, zu der eine eigene Straße führt, unter
  Beachtung der **Abstandsregel** - die 3 benachbarten Kreuzungen müssen frei
  sein, egal wem sie gehören würden.

## Handeln

- **Mit den anderen**: nur mit der Person, die am Zug ist. Die anderen tauschen
  **nicht untereinander**.
- **Mit dem Vorrat**: 4 gleiche gegen 1 beliebige.
- **Mit einem Hafen**, an dem man ein Gebäude hat: 3:1 beliebig, oder 2:1 der
  angegebenen Sorte.

## Die beiden Sondertafeln

- **Längste Handelsroute** (2 Siegpunkte): ab 5 zusammenhängenden Straßen.
  Abzweigungen zählen nicht, eine fremde Siedlung unterbricht. Wer **länger**
  baut, bekommt die Tafel sofort.
- **Größte Rittermacht** (2 Siegpunkte): ab 3 ausgespielten Rittern. Wer **mehr**
  ausspielt, bekommt sie sofort.

Beide wechseln nur beim echten Überbieten, nicht beim Gleichstand.

## Spielende

Das Spiel endet in dem Zug, in dem jemand **10 oder mehr Siegpunkte** erreicht
und selbst am Zug ist. Siegpunktkarten bleiben bis dahin verdeckt.

## Was nicht in der Anleitung steht

Vier Dinge fehlen in der Anleitung oder stehen dort nur als Bild. Alle vier sind
hier Entscheidungen, keine Regeln.

### 1. Welcher Buchstabe welche Zahl trägt

Die Anleitung sagt, die Chips würden mit der **Buchstabenseite nach oben**
ausgelegt und „in alphabetischer Reihenfolge" platziert - welcher Buchstabe
welche Zahl trägt, druckt sie nie, weil man die Chips am Tisch einfach umdreht.
Umgesetzt ist die aufgedruckte Folge A bis R der Chips selbst:

| A   | B   | C   | D   | E   | F   | G   | H   | I   | J   | K   | L   | M   | N   | O   | P   | Q   | R   |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 5   | 2   | 6   | 3   | 8   | 10  | 9   | 12  | 11  | 4   | 8   | 10  | 9   | 4   | 5   | 6   | 3   | 11  |

Das ist **Wissen aus dem Spiel, nicht aus diesem Heft**. Es passt aber zur
Materialliste: einmal 2, einmal 12, zweimal alles dazwischen außer 7.

### 2. Wo die Häfen liegen

Die Häfen sitzen auf dem Rahmen, und der Rahmen wird „in beliebiger Reihenfolge"
zusammengesteckt - **wo ein Hafen liegt, ist also ohnehin variabel**. Fest ist
nur, dass es neun sind: viermal 3:1 und je einmal 2:1 für jeden der fünf
Rohstoffe.

Umgesetzt sind neun feste Plätze auf den 30 Küstenwegen, gleichmäßig verteilt
(zwei freie Wege zwischen zwei Häfen, drei an den Spitzen der Insel), und die
neun Hafensorten werden darauf gemischt. Die Abstände sind an der Abbildung auf
Seite 4 abgelesen, nicht aus einer gedruckten Liste.

### 3. Der feste Startaufbau

Der Aufbau „für das erste Spiel" auf Seite 4 ist nur als **Abbildung** gedruckt,
und die Abbildung ist über zwei Seiten verteilt, von denen jede die andere Hälfte
zeigt. Er ist deshalb nicht umgesetzt; gespielt wird immer der variable Aufbau,
den die Anleitung selbst für alle weiteren Partien vorsieht.

### 4. Wer anfängt

„Würfelt reihum mit beiden Würfeln. Wer die höchste Zahl würfelt, beginnt." Am
Bildschirm wird der Startspieler stattdessen ausgelost - dasselbe Ergebnis ohne
eine Runde, in der noch nichts passiert.

## Zu fünft und zu sechst

Umgesetzt nach der 5-6 Personen Erweiterung.

### Material

- **11 Landschaftsfelder mehr**: je 2 x Hügelland, Wald, Weideland, Ackerland,
  Gebirge und 1 x Wüste - macht **30 Felder und zwei Wüsten**.
- **28 Zahlenchips** statt 18, und zwar nur die der Erweiterung: zweimal die 2
  und die 12, dreimal alles dazwischen außer der 7.
- **9 Entwicklungskarten mehr**: 1 Monopol, 1 Straßenbau, 1 Erfindung,
  6 Ritter - macht 34, davon 20 Ritter.
- Zwei weitere Farben: **Grün und Lila**.
- Der Räuber startet auf einer der **beiden** Wüsten.

Die Chips kommen wie im Grundspiel in alphabetischer Reihenfolge, von einer Ecke
spiralförmig nach innen. Die Anleitung nennt hier keine Richtung; die Pfeile auf
der Abbildung laufen gegen den Uhrzeigersinn, wie im Grundspiel.

### Ein Spielzug gehört zwei Personen

Das ist die eigentliche Regeländerung, und sie ersetzt die frühere
„Außerordentliche Bauphase":

|                                     | Stein 1                  | Stein 2    |
| ----------------------------------- | ------------------------ | ---------- |
| Würfeln                             | ja, Pflicht              | nein       |
| Handel mit den anderen              | ja                       | **nein**   |
| Handel mit dem Vorrat               | ja                       | ja         |
| Bauen und Entwicklungskarten kaufen | ja                       | ja         |
| 1 Entwicklungskarte ausspielen      | ja, auch vor dem Würfeln | ja, danach |

Stein 2 sitzt **3 Plätze links** von Stein 1. Nach beiden Hälften wandern beide
Steine einen Platz nach links, der Abstand bleibt also immer drei.

Das Spielende zählt beide: „Als ,an der Reihe' gelten hier beide, die in diesem
Zug einen Stein vor sich haben. Sollten beide im selben Spielzug die 10 Punkte
erreichen, hat sofort gewonnen, wer Stein 1 vor sich stehen hat." Umgesetzt ist
das, indem der Sieg immer bei der **gerade handelnden** Person geprüft wird -
Stein 1 handelt zuerst und gewinnt in dem Moment, in dem es reicht, also kommt
Stein 2 dann gar nicht mehr dran.

### Was auch hier nicht in der Anleitung steht

**Welcher Buchstabe welche Zahl trägt** - wie im Grundspiel nicht gedruckt, und
für die 28 Chips liegt mir die Folge auch nicht vor. Die **Anzahlen** stehen auf
der Materialseite und sind übernommen; die **Reihenfolge ist gesucht, nicht
geraten**.

Gesucht wurde gegen die eine Aufgabe, die die gedruckte Folge erfüllt: rote
Zahlen auseinanderhalten. Gemessen über 400 echte Verteilungen je Brett - mit
zufälligen Wüsten und zufälliger Startecke - liegt beim gedruckten 18er-Alphabet
**in 100 % der Partien keine 6 neben einer 6 oder 8**. Ein erster, von Hand
gebauter 28er-Vorschlag, der die roten Zahlen bloß gleichmäßig übers Alphabet
verteilte, kam auf **im Median 2 solche Paare** und nur 9 % saubere Bretter. Die
jetzt eingebaute Folge erreicht wieder **100 %**.

**Wie viele Häfen** die zusammengesteckten Rahmenteile tragen, sagt die
Anleitung nicht. Umgesetzt sind **elf** - zwei 3:1 mehr als im Grundspiel. Das
hält die Hafendichte an der längeren Küste und lässt genau einen 2:1-Hafen je
Rohstoff, sodass keine Sorte leichter zu tauschen ist als eine andere.

**Der feste Startaufbau** und die Regel, dass zu fünft eine Farbe als inaktive
Siedlungen stehen bleibt, gehören beide zum Aufbau „für das erste Spiel", der
nur als Abbildung gedruckt ist. Gespielt wird - wie im Grundspiel - immer
variabel, und dabei sagt die Anleitung selbst: „Wenn ihr mit einem variablen
Aufbau spielt, folgt nun die Gründungsphase nach den Regeln von CATAN - Das
Spiel." Zu fünft sind dann fünf Farben im Spiel und keine inaktive.

## Erweiterungen

### Umgesetzt: zwei Varianten aus Händler & Barbaren

Beide sind in den Einstellungen einzeln zuschaltbar und **beliebig
kombinierbar**. Das ist keine Auslegung, sondern steht so in der Anleitung:
„Alle Varianten sind sowohl untereinander als auch mit den Szenarien dieser
Erweiterung, mit Seefahrer und teilweise auch mit den Erweiterungen Städte &
Ritter und Entdecker & Piraten kombinierbar."

#### Freundlicher Räuber

> Ihr dürft den Räuber nicht auf ein Landschaftsfeld setzen, an das eine
> Siedlung einer Person grenzt, die nur 2 Siegpunkte hat.

Gezählt wird in **offenen** Siegpunkten, nicht in echten. Eine Siegpunktkarte
liegt verdeckt, bis sie das Spiel gewinnt - ein Tisch könnte die Regel auf
Punkte, die niemand sieht, gar nicht anwenden, und ein Schiedsrichter, der es
täte, würde damit verraten, dass jemand eine hält.

Bleibt dadurch kein Feld übrig, bleibt der Räuber auf der Wüste bzw. kommt
dorthin zurück - so steht es in der Anleitung, und es sorgt nebenbei dafür, dass
die Phase nie ohne erlaubten Zug dasteht. Wer höchstens 2 Siegpunkte hat, wird
auch an der Wüste nicht bestohlen.

#### Ereignisse auf Catan

37 Karten ersetzen die Würfel. Die Zahl der aufgedeckten Karte schüttet die
Erträge aus, und **das Ereignis kommt zuerst**.

Die Zahlen sind kein Zufall und auch keine Mischung: Sie sind die zwei Würfel
ausgeschrieben - einmal die 2, zweimal die 3, dreimal die 4, viermal die 5,
fünfmal die 6, sechsmal die 7 und wieder herunter bis einmal die 12. Genau die
36 Ergebnisse zweier Würfel, plus die Karte Jahreswechsel ohne Zahl. Das ist der
Sinn der Variante, und deshalb sind die Anzahlen abgeschrieben und nicht
erfunden.

Die Karte **Jahreswechsel** wird beim Aufbau ausgelegt, die übrigen 36 gemischt,
5 davon verdeckt darunter und 31 darüber gelegt. Der Stapel läuft also
irgendwo in den letzten sechs Karten aus.

Zwei Ereignisse brauchen eine Erklärung:

- **Erdbeben**: Jede:r stellt eine eigene Straße quer. Reparatur kostet 1 Holz +
  1 Lehm. Bis dahin darf die Person keine neue Straße bauen, und die
  quergestellte Straße führt zu keiner neuen Siedlung mehr - für die Längste
  Handelsroute zählt sie aber weiter, wie die Karte ausdrücklich sagt.
- **Gute Nachbarschaft**: Alle geben gleichzeitig 1 Karte nach links. Am
  Bildschirm wird nacheinander gefragt, die Karten werden aber **gepuffert und
  gemeinsam bewegt** - sonst könnte jemand eine Karte weitergeben, die er gerade
  erst bekommen hat.

#### CATAN für Zwei

Zu zweit gibt es kein Catan ohne diese Variante, also ist sie **kein Schalter**:
Ein Tisch mit zwei Personen spielt sie immer. Vier Dinge ändern sich.

**Zwei neutrale Farben.** „Die beiden Figurensätze, mit denen ihr nicht spielt,
sind die Figuren von zwei imaginären neutralen Personen." Sie sind hier
gewöhnliche Sitze, weil sie auf dem Brett genau das sind: Eine Kreuzung merkt
sich den Sitz, der darauf gebaut hat. Sie bekommen nie Erträge, halten nie
Karten und sind nie am Zug - aber sie können die **Längste Handelsroute**
halten, was die Anleitung ausdrücklich sagt.

Ihre beiden Startsiedlungen stehen schon, bevor die Gründungsphase beginnt. Die
Anleitung zeigt sie nur im Bild, auf dem festen Startaufbau: **oben und unten am
Mittelfeld**, punktsymmetrisch zur Brettmitte. Weil hier variabel aufgebaut
wird, ist daraus eine _Form_ geworden statt zweier Kreuzungsnummern - die
oberste und unterste Ecke des mittleren Landschaftsfeldes. Das ist auch
drehungssicher: Es fragt die Geometrie, wo oben ist, statt zu raten, welcher
Eintrag von `corners` das gerade ist.

**Zweimal würfeln pro Zug**, und die beiden Zahlen müssen sich unterscheiden.
Ein Wiederholungswurf ist kein Ergebnis, also wird er im Schiedsrichter
weggeworfen statt angezeigt. Nach jedem Wurf gibt es sofort Erträge bzw. wird
bei einer 7 der Räuber versetzt - erst danach kommt der zweite Wurf.

**Freie neutrale Figur.** Wer eine Straße oder Siedlung baut, setzt gratis eine
in einer neutralen Farbe dazu. Nicht bei Stadt oder Entwicklungskarte, und nicht
in der Gründungsphase: Die Anleitung zählt das Brett danach ab - „insgesamt 6
Siedlungen und 4 Straßen" - und das sind die zwei aus dem Aufbau plus je zwei.

Am Bildschirm wird **erst die Farbe gewählt, dann der Platz**. Anders geht es
nicht: Eine neutrale Siedlung darf auf jede freie Kreuzung, die die
Abstandsregel erlaubt - und das ist für beide Farben dieselbe Menge, ein Tippen
allein könnte also nie sagen, welche gemeint war.

**Handelschips.** Fünf zum Start. Eine Aktion kostet 1 Chip, oder **2, solange
man vorne liegt** - eine Aufholregel. Zwei Aktionen: _Zwangshandel_ (2 Karten
blind ziehen, 2 beliebige zurückgeben) und _Räuber in die Wüste_ (ohne jemanden
zu bestehlen). Nachschub: einen ausgespielten Ritter abgeben (+2), eine Siedlung
an der Küste (+1), an der Wüste (+2), an beidem (+3).

#### Die Häfen von Catan

Siedlung am Hafen 1 Hafenpunkt, Stadt 2. Ab 3 Hafenpunkten gibt es die
Sondersiegpunkttafel **Stärkste Häfen** (2 Siegpunkte), und sie wechselt nur
beim echten Überbieten - wie die beiden gedruckten Tafeln auch.

Die Anleitung sagt: „Es gewinnt, wer an der Reihe ist und 11 Siegpunkte
besitzt." Umgesetzt ist das als **plus eins** statt als feste Elf, denn das ist
die Rechnung dahinter - die gedruckten Zehn plus die neue Tafel. So behält auch
eine bewusst kurze oder lange Partie ihre Länge.

### Noch nicht umgesetzt

Umgesetzt sind: Händler & Barbaren ganz (vier Varianten, fünf Szenarien, auch
zu fünft und sechst), Städte & Ritter, das Grundspiel zu fünft und sechst, von
Seefahrer die allgemeinen Regeln samt freiem Spiel, und von Entdecker & Piraten
die Grundregeln samt den ersten beiden Szenarien. Der Stand im Einzelnen:

| Anleitung                     | Umfang                                               | Stand                                       |
| ----------------------------- | ---------------------------------------------------- | ------------------------------------------- |
| Händler & Barbaren, Varianten | Freundlicher Räuber, Ereignisse auf Catan, Die Häfen | fertig                                      |
| Händler & Barbaren, Varianten | CATAN für Zwei                                       | fertig                                      |
| Händler & Barbaren, Szenarien | 5 Szenarien als Kampagne                             | **[alle 5](szenarien.md)**                  |
| Seefahrer                     | Allgemeine Regeln plus freies Spiel                  | [Neue Welt fertig](seefahrer.md)            |
| Städte & Ritter               | Handelswaren, Ritter, Metropolen                     | [fertig](staedte-und-ritter.md)             |
| Entdecker & Piraten           | Grundregeln plus Szenarien 1 und 2                   | [Land in Sicht, Piratenlager](entdecker.md) |
| 5-6 Personen, Grundspiel      | Stein 1 / Stein 2, 30 Felder                         | fertig                                      |
| 5-6 Personen, je Erweiterung  | Wagen 1 / Wagen 2 je Szenario                        | [Händler & Barbaren fertig](szenarien.md)   |

Die vier erweiterungseigenen 5-6-Hefte setzen jeweils das Grundspiel zu fünft
und sechst voraus - das ist umgesetzt - und legen dann Szenariomaterial obendrauf.
Sie kommen mit den jeweiligen Erweiterungen.

## Was am Bildschirm anders läuft

Drei Stellen macht ein Tisch gleichzeitig, ein Bildschirm aber nacheinander.
Am Ergebnis ändert das nichts, an der Reihenfolge schon.

### Abwerfen nach einer 7 geht reihum

Am Tisch zählen alle gleichzeitig ihre Hand. Hier stehen die Betroffenen in
einer Warteschlange und sind einzeln dran.

### Ein Angebot wird reihum beantwortet

Die Anleitung lässt einen Tisch frei feilschen („so lange und so oft, wie es
deine Rohstoffkarten zulassen"). Über eine Leitung passt das nicht. Umgesetzt
ist: Wer am Zug ist, legt **ein** Angebot auf den Tisch (was ich gebe, was ich
bekomme), alle anderen antworten nacheinander mit Ja oder Nein, und die
anbietende Person sucht sich unter den Ja-Antworten eine aus.

Damit ein Zug nicht zur Endlosschleife wird, sind **höchstens 10 Angebote pro
Zug** erlaubt. Die Anleitung nennt keine Zahl, weil ein Tisch von selbst
aufhört; ein Computergegner tut das nicht.

### Ein Zug ohne Entscheidung läuft von selbst

Zwei Momente einer Catan-Partie sind gar keine Entscheidung, und für die gibt es
am Bildschirm keinen Knopf mehr zu drücken:

- **Vor dem Würfeln**, wenn keine spielbare Entwicklungskarte auf der Hand liegt.
  Dann sind die Würfel das Einzige, was geht.
- **Nach dem Würfeln**, wenn man nichts eingenommen hat, keine Karte hält und
  keine kostenlose Straße mehr offen ist. Dann kann man nicht bauen, nicht mit
  dem Vorrat tauschen und nicht einmal anbieten, denn ein Angebot braucht eine
  Karte auf dem Tisch.

In beiden Fällen macht die Oberfläche den Zug nach einem kurzen Moment selbst.
Eine Siegpunktkarte zählt dabei als keine Karte, weil sie nie ausgespielt wird.
Sobald es irgendetwas zu entscheiden gibt - eine spielbare Karte, eine einzige
Rohstoffkarte in der Hand - passiert nichts von allein, und die Knöpfe stehen
wie vorher da.

Das ist eine Bedienungshilfe und keine Regelabweichung: Gespielt wird genau der
Zug, den die Anleitung vorschreibt, nur ohne den Knopf davor. Der Knopf bleibt
trotzdem stehen, wer schneller ist als die Pause, drückt ihn einfach.

### Der Vorrat ist unerschöpflich

Diese Ausgabe der Regeln erwähnt nirgends, was passiert, wenn eine Rohstoffsorte
ausgeht. Die 19 Karten je Sorte sind hier deshalb eine Eigenschaft der
Schachtel und keine Regel - der Vorrat ist nicht begrenzt umgesetzt.

## Online

Das Brett ist öffentlich, die Hände sind es nicht - genau wie am Tisch.

- **Rohstoffkarten** liegen auf dem privaten Kanal des jeweiligen Platzes. Was
  öffentlich mitreist, ist die **Anzahl**: Am Tisch kann jede:r die Karten der
  anderen zählen und niemand sie lesen. Deshalb ist die Anzahl ein eigenes Feld
  und wird vom Schiedsrichter nach jedem Zug nachgeführt - eine für die Leitung
  geleerte Hand hätte sie sonst mit den Sorten verloren.
- **Entwicklungskarten** genauso; ausgespielte Ritter bleiben offen, weil die
  Größte Rittermacht an offen liegenden Karten hängt.
- Der **Entwicklungsstapel** ist vor allen geheim und liegt im Tresor des Hosts.

Am Spielende wird **nichts mehr verdeckt** - das ist die Regel selbst: „Du
deckst sie erst auf, wenn du mindestens 10 Punkte erreicht hast."
