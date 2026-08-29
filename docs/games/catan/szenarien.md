# CATAN - Die Szenarien aus Händler & Barbaren

Die fünf Szenarien der Kampagne, gelesen aus
`game_instructions/catan_babaren.pdf` (24 Seiten).

Die Anleitung sagt selbst, wie sie gedacht sind: „Die Schwierigkeit dieser 5
Szenarien steigt von Szenario zu Szenario etwas an. Wir empfehlen daher, die
Szenarien der Reihe nach zu spielen."

**Alle fünf sind umgesetzt** und in den Einstellungen einzeln wählbar - offline
wie im Online-Modus.

| # | Szenario | Stand |
| - | -------- | ----- |
| 1 | **Fischfang auf Catan** | **fertig** |
| 2 | **Die Flüsse von Catan** | **fertig** |
| 3 | **Der Handelstross** | **fertig** |
| 4 | **Der Barbarenüberfall** | **fertig** |
| 5 | **Händler & Barbaren** | **fertig** |

## Warum ein Szenario kein Schalter ist

Catan hat jetzt drei Achsen, und sie unterscheiden sich darin, **was** sie
anfassen:

- eine **Variante** legt eine Regel dazu (`variants`, mehrere gleichzeitig),
- ein **Modus** ersetzt Teile des Spiels (`mode`, eines auf einmal),
- ein **Szenario** ändert das **Brett** (`scenario`, eines auf einmal).

Fischfang nimmt die Wüste weg, legt einen See mitten auf die Insel und sechs
Fischgründe an die Küste. Das ist keine Regel, die man dazuschalten kann - das
ist eine andere Karte.

## 1. Fischfang auf Catan

### Der See ersetzt die Wüste

„Ersetzt die Wüste durch den See." Ein **Ersatz**, also gibt es danach keine
Wüste mehr - und deshalb hat der Räuber zu Beginn keinen Platz und steht neben
dem Brett (`OFF_BOARD`, kurz -1). Er kommt erst bei der ersten „7" oder mit
einer Ritterkarte ins Spiel.

„Der See darf nicht am Rand der Insel (Küste) ausgelegt werden." Kommt die
Wüste am Rand heraus, tauschen die beiden Plättchen die Plätze: Der See geht
nach innen, und was dort lag, wandert an den Rand. Das ist, was ein Tisch mit
einem Plättchen macht, das er so nicht legen darf.

Der See trägt **vier Zahlen** (2, 3, 11, 12) auf einem Feld. Deshalb kann er
kein gewöhnlicher Zahlenchip sein: Das Chip-Feld hält eine Zahl je Landschaft,
und dieses hier hat vier.

### Die Fischgründe

Sechs Stück mit den Zahlen 4, 5, 6, 8, 9, 10; jeder weist **drei Kreuzungen an
der Küste** als Fischfanggebiet aus. Die Anleitung legt sie „auf jede freie
Spitze der Rahmenteile (ohne Hafen)".

Der Rahmen ist hier nicht modelliert - das Brett besteht aus Landschaften,
Kreuzungen und Wegen. Also werden sie **wie die Häfen** hergeleitet: einmal die
Küste entlanglaufen und gleichmäßig verteilen, alles überspringen, wo schon ein
Hafen liegt. Das ist eine Erfindung im Detail und keine in der Form: Was die
Anleitung verlangt, sind sechs Fischgründe rings um die Küste, frei von den
Häfen, mit je drei benachbarten Kreuzungen - und genau das kommt heraus.
Kreuzungsnummern zu nennen wäre nur für einen gedruckten Rahmen richtig und für
das variable Brett dieses Tisches falsch.

### Die Fischplättchen

29 Stück - **11× ein Fisch, 10× zwei, 8× drei**, abgezählt vom Materialbild -
plus den Alten Schuh. Siedlung am Fischfanggebiet: 1 Plättchen, wenn die Zahl
fällt; Stadt: 2. Die zweite Gründungssiedlung an einem Fischgrund bringt sofort
eines.

Höchstens 7 auf der Hand. Der Stapel ist ein Ring: „Gibt es keine verdeckten
Fischplättchen mehr, dreht ihr die offen liegenden um, mischt sie und bildet
damit den neuen Vorrat."

Fische sind **keine Rohstoffe**: Sie zählen bei einer 7 nicht mit, sind nicht
handelbar und nicht zu bestehlen.

### Die fünf Aktionen

| Fische | Aktion |
| ------ | ------ |
| 2 | Räuber vom Spielfeld nehmen |
| 3 | 1 Rohstoff von einer anderen Person ziehen |
| 4 | 1 beliebigen Rohstoff aus dem Vorrat |
| 5 | 1 Straße gratis |
| 7 | 1 Entwicklungskarte gratis |

**Es gibt kein Wechselgeld.** „Gibst du mehr Fische aus, als die Aktion kostet,
verfallen die überzähligen Fische." Die Knöpfe zahlen deshalb mit den größten
Plättchen zuerst und schreiben den Preis dazu - drei Fische für eine
Zwei-Fisch-Aktion sind ein verlorener Fisch, und das soll man vorher sehen.

### Der Alte Schuh

Wer ihn zieht, deckt ihn sofort auf und **braucht 1 Siegpunkt mehr zum Sieg**.
Weitergeben darf man ihn frühestens im nächsten eigenen Zug, und nur an
jemanden mit **gleich vielen oder mehr** Siegpunkten - er wandert also immer
nach oben, was ihn davon abhält, ewig zwischen zwei Leuten hin und her zu
gehen.

Die Ziellinie verschiebt sich damit **pro Person**, nicht für den Tisch. Deshalb
fragt der Schiedsrichter `targetFor(game, seat)` statt `game.target`.

### Was das Selbstspiel gefunden hat

Vier Partien, 63 bis 99 Züge, alle beendet, 8 bis 12 Fischaktionen je Partie,
der Schuh 8- bis 9-mal weitergereicht. Drei Fehler kamen dabei heraus:

1. Der See wurde **zusätzlich** ausgelegt statt die Wüste zu ersetzen - das
   Brett hatte danach einen See *und* eine Wüste.
2. Code, der `hexes[game.robber]` liest, stürzte ab, sobald der Räuber neben dem
   Brett stand. An drei Stellen, alle im Computergegner und im Schiedsrichter.
3. Die Landschaftsliste der Zustandsprüfung kannte `"see"` nicht - ein
   gespeichertes Spiel wäre beim Laden verworfen worden.

## 2. Die Flüsse von Catan

### Die Flussgeometrie, rekonstruiert

Das ist die eigentliche Schwierigkeit dieses Szenarios: Die Anleitung zeigt die
beiden Flüsse **nur als Bild**, auf dem festen Startaufbau - und dieser Tisch
baut die Insel variabel. Eine Liste von Kreuzungsnummern abzuschreiben wäre für
genau ein gedrucktes Brett richtig und für jedes andere falsch.

Was das Bild zeigt: Jedes Flussplättchen ist eine **waagerechte Reihe** von
Landschaften, durch deren Mitte das Wasser von links nach rechts läuft. Ein
spitz stehendes Sechseck hat **senkrechte** linke und rechte Kanten - das
Wasser quert also genau diese. Und eine Querung des Wassers ist genau die
Stelle, an der man eine Brücke braucht.

Daraus folgt alles Übrige:

- **Brückenbauplätze** = die gequerten senkrechten Kanten: je Fluss eine
  zwischen aufeinanderfolgenden Feldern, plus eine, wo das Wasser das letzte
  Feld verlässt.
- **Kreuzungen am Fluss** = die Endpunkte dieser Kanten (das Ufer).
- **Wege am Fluss** = alle anderen Wege, die eine Ufer-Kreuzung berühren.
- **Sumpflandschaft** = das erste Feld jedes Flusses, die Quelle - ohne
  Zahlenchip.

**Die Rekonstruktion lässt sich prüfen**, und das ist der Punkt: `(4−1)+1` und
`(3−1)+1` ergeben **7 Brückenbauplätze** - genau die Zahl, die die Anleitung
nennt („eine Brücke darf nur auf einem der 7 Brückenbauplätze gebaut werden").
Die 7 kommt aus der Geometrie heraus; sie wurde nicht hineingesteckt.

Nachgerechnet auf dem gedruckten 19-Felder-Brett: **7 Brückenplätze, 14
Ufer-Kreuzungen, 22 Ufer-Wege, 2 Sümpfe.**

### Gold

Gold ist kein Rohstoff: Es liegt neben dem Spieler, nicht in der Hand, wird bei
einer 7 nicht mitgezählt und ist nicht zu bestehlen.

| Gebaut | Gold |
| ------ | ---- |
| Straße an einem Ufer-Weg | 1 |
| Siedlung an einer Ufer-Kreuzung | 1 |
| Brücke | 3 |

Ausgeben geht zweierlei, beides nur im eigenen Zug:

- **2 Gold → 1 beliebiger Rohstoff**, höchstens **zweimal je Zug**. Das Gold
  darf frisch aus demselben Zug stammen.
- **Rohstoffe → 1 Gold** zum eigenen Tauschkurs: 4:1 mit dem Vorrat, günstiger
  an einem eigenen Hafen. Der Kurs kommt aus `tradeRate`, also derselben
  Rechnung wie jeder andere Bankhandel.

### Die Brücke ist eine Straße

Eine Brücke wird in `roads` **und** in `bridges` eingetragen, und das ist der
ganze Kniff. „Sie zählt innerhalb einer Längsten Handelsroute wie eine Straße",
Siedlungen dürfen an ihr hängen - also gelten alle Straßenregeln unverändert
weiter, ohne dass eine einzige davon vom Szenario wissen muss. `bridges` sagt
nur, **welche** der Straßen eine Brücke ist: fürs Zeichnen und fürs Abzählen
der drei, die jeder bekommt.

Umgekehrt ist ein Brückenbauplatz **nie** ein Straßenplatz: `canRoad` lehnt ihn
ab, und seit dem Selbstspiel auch die Gründungsphase - dort lief die Prüfung
vorher an `canRoad` vorbei, und eine Gründungsstraße konnte über dem Wasser
landen.

### Die zwei Plättchen

Der **Reichste Cataner** (+1) gehört der Person, die **allein** das meiste Gold
hat; gibt es sie nicht, liegt das Plättchen beiseite. Der **Arme Cataner** (−2)
geht an **alle**, die am wenigsten haben - „haben alle gleich viel Gold oder
kein Gold, erhalten alle das Plättchen", weshalb zu Spielbeginn tatsächlich
jeder −2 hat. Beide werden nach jeder Goldänderung neu ausgerechnet statt
mitgeführt: Sie sind reine Funktionen des Goldes auf dem Tisch.

### Am Brett

Das Wasser läuft von der linken zur rechten senkrechten Kante durch die Mitte
jedes Flussfeldes, bei einem Sumpf erst ab der Feldmitte - er ist die Quelle,
und ein Band quer durch ihn hindurch würde eine Querung versprechen, die es
nicht gibt. Gezeichnet wird es **über der Landschaft und unter dem Zahlenchip**:
Ein Fluss läuft durch das Feld, er verdeckt nicht, was das Feld zahlt.

Eine Brücke ist ein brauner Steg mit dem farbigen Geländer der Person darauf,
keine Straße in anderer Farbe - sie ist 3 Gold wert und eine von nur dreien,
das soll man quer über den Tisch sehen.

### Was das Selbstspiel und der Browser gefunden haben

Vier Partien über 83 bis 104 Züge, alle beendet, 3 bis 5 Brücken und 11 bis 17
Goldkäufe je Partie. Drei Fehler kamen dabei heraus:

1. Die **Gründungsstraße** ging über das Wasser - sie prüft nicht mit
   `canRoad`, und der Brückenbauplatz war dort nicht ausgenommen.
2. Die Zustandsprüfung kannte die neuen Felder nicht; ein gespeichertes Spiel
   wäre beim Laden verworfen worden.
3. Die Einstellung war **wirkungslos**: Sie ließ nur `"fischer"` durch und
   machte aus jedem anderen Szenario stillschweigend `"keins"` - eine Seite
   voller Knöpfe, die nichts taten. Der Filter fragt jetzt `SCENARIOS`, damit
   das dem dritten Szenario nicht wieder passiert.

Dazu eine Lücke, die keine dieses Szenarios war: Die Lobby des Online-Modus
gab `scenario` gar nicht weiter, so wie sie vorher `mode` und `variants` nicht
weitergab. Am Tisch im Netz gibt es jetzt auch die Szenarien - und die Gäste
sehen in der Lobby, was eingestellt ist.

## 3. Der Handelstross

Nomaden haben sich an einer **Wasserstelle** mitten auf der Insel
niedergelassen und schicken **Trosswagen** aus. Drei Handelstrosse wachsen über
das Brett, einer nach dem anderen, und **der Tisch stimmt ab**, wohin jeder
Wagen kommt - mit Wolle und Getreide als Stimmzetteln. Gespielt wird bis **12
Siegpunkte**.

### Die Wasserstelle ersetzt die Wüste

„Die Wasserstelle ersetzt die Wüste. Sie wird genau in der Mitte der Insel
ausgelegt." Zwei Sätze, ein Handgriff: Die Wüste ist weg, das Mittelfeld ist
die Wasserstelle, und was in der Mitte lag, nimmt den Platz der Wüste ein. Sie
trägt keinen Zahlenchip, und der Räuber steht wie beim Fischfang **neben dem
Brett**, bis die erste „7" fällt.

Das 5-6-Spieler-Brett „hat eine Reihe von sechs durch die Mitte und kein
einzelnes Feld in ihrem Zentrum" - dort nimmt der Aufbau das Feld, das der
Mitte am nächsten liegt.

### Die Pfeile, rekonstruiert

Dieselbe Aufgabe wie bei den Flüssen: Die Anleitung zeigt die Pfeile nur als
Bild auf dem gedruckten Plättchen, und dieser Tisch legt die Insel jedes Mal
neu aus.

Was das Bild zeigt: Die Pfeile verlassen die Wasserstelle **in gerader Linie**.
Eine gerade Linie aus einem Sechseck heraus durch eine seiner Ecken ist genau
der **dritte** Weg an dieser Ecke - der, der keine Kante des Feldes ist. Sechs
Ecken geben sechs davon, und die Anleitung will drei Handelstrosse: also jede
zweite Ecke.

**Die Rekonstruktion lässt sich prüfen**, und zwar an beiden Zahlen, die unter
den Beispielen der Anleitung stehen:

- Vor dem ersten Wagen gibt es drei Wege - „es gibt 3 Wege, auf denen er
  platziert werden darf."
- Nach dem ersten wächst dessen Handelstross zweifach weiter, die anderen zwei
  je einfach: vier - „für den nächsten Trosswagen gibt es nun 4 Wege."

Beide Zahlen fallen aus der Form heraus; keine wurde hineingesteckt.

### Wie ein Handelstross wächst

Ein Wagen kommt **nach** einem Zug, in dem gebaut wurde: „Baust du in deinem
Zug eine oder mehrere Siedlungen oder baust eine oder mehrere Siedlungen zu
einer Stadt aus, wird nach Beendigung deines Zuges genau 1 Trosswagen
eingesetzt." Einer, wie viel auch gebaut wurde.

Er muss an den **vordersten** Wagen seines Handelstrosses anschließen: „Eine
Verzweigung eines Handelstrosses ist somit nicht möglich." Ein Handelstross
wächst also nur an seinem Kopf, was aus den drei Wegen einer Kreuzung zwei
macht. Endet dort alles, endet dieser Handelstross; ist der Vorrat von 22 Wagen
leer, enden alle drei.

Treffen sich zwei an einer Kreuzung, wachsen sie mit dem nächsten Wagen
zusammen - der geschluckte behält seine Wagen auf dem Brett und hört nur auf,
selbst zu wachsen.

Eine Straße darf auf einem Weg mit einem Wagen gebaut werden und umgekehrt:
„Wird oder wurde auf einem Weg, auf dem ein Trosswagen steht, eine Straße
gebaut, wird der Trosswagen neben die Straße gestellt."

### Die Abstimmung

Drei Schritte, so wie die Anleitung sie hat:

1. **Auslegen.** Beginnend mit der Person, die gerade gebaut hat, legt jede
   reihum offen Wolle- oder Getreidekarten aus - oder nichts. Jede Karte ist
   eine Stimme. „Alle haben nur einmal die Möglichkeit, Karten auszulegen."
2. **Zuordnen.** Wer ausgelegt hat, setzt **alle** seine Stimmen auf eine
   Position; aufteilen ist nicht erlaubt. Hat aber eine Person allein mehr
   Stimmen als alle anderen zusammen, entscheidet sie sofort allein - dann gibt
   es nichts mehr zu verhandeln.
3. **Setzen.** Hat eine Position allein die meisten Stimmen, kommt der Wagen
   dorthin. Sonst wählt die Person mit den meisten Stimmen. Hat auch die
   niemand allein, bestimmt die Person, die an der Reihe war - „auch wenn sie
   keine Stimme abgegeben hat".

Die ausgelegten Karten sind weg; sie gehen in den Vorrat.

Am Tisch ist das Auslegen ein Zählwerk neben dem Brett, das Zuordnen und das
Setzen dagegen ein **Tipp aufs Brett**: Beides ist ein Ort, und eine Liste von
Wegnummern wäre eine schlechtere Art, dasselbe zu sagen.

### Was die Wagen bringen

- Eine Siedlung oder Stadt **zwischen zwei Wagen** zählt 1 Siegpunkt mehr. Zwei
  Wagen, nicht einer: Eine Kreuzung, an der ein Handelstross nur endet, bringt
  nichts.
- Eine Straße **parallel zu einem Wagen** zählt in der Handelsroute doppelt.
  Damit kann die Längste Handelsroute schon mit weniger als fünf gebauten
  Straßen erreicht werden.

### Zu zweit

„Kommt es zu einer Abstimmungsrunde, geht es um 2 Trosswagen." Wer gewinnt,
setzt beide - aber auf **zwei verschiedene** Handelstrosse. Bei einem
Unentschieden setzt zuerst die Person, die an der Reihe war, und dann die
andere. Nachgerechnet im Selbstspiel: 12 Wagen in 6 Runden, 16 in 8 - genau
zwei je Runde.

### Was das Selbstspiel gefunden hat

Vier Partien zu dritt über 72 bis 134 Züge, alle beendet, 10 bis 11
Abstimmungen je Partie; dazu zwei zu zweit. Ein Fehler kam heraus, und er lag
**nicht** in diesem Szenario:

Die Zahlenchips wurden auf die Insel gelegt, **bevor** ein Szenario Felder
vertauscht hatte. Beim Fischfang tauscht der See mit der Wüste, hier die
Wasserstelle mit der Mitte - und danach lag der Chip auf dem falschen Feld: Das
eingetauschte Feld zahlte gar nichts mehr, und die Wüste an ihrem neuen Platz
trug eine Zahl. Das betraf Fischfang auf Catan seit dem ersten Tag. Die Chips
kommen jetzt zuletzt, auf die Insel, wie sie wirklich gespielt wird.

## 4. Der Barbarenüberfall

Das größte der fünf, und fast ein eigenes Spiel. Barbaren landen an der Küste
und ersticken sie, Ritter werden in einer **Burg** ausgebildet und reiten
gegen sie, es gibt **keinen Räuber**, und die Entwicklungskarten sind ein
eigener Stapel von 26, die beim Kauf sofort ausgelöst werden. Gespielt wird bis
**12 Siegpunkte**.

### Was dieses Szenario an Catan ändert

| | |
| - | - |
| Insel | **ausgelegt**, nicht ausgeteilt: Burg und Wüste nebeneinander, 10 Küstenfelder, 7 Binnenfelder |
| Gründung | 1 Siedlung, dann 1 Stadt - **keine Straßen**; die Stadt bringt 1 Rohstoff je Landschaft |
| Bauen | löst sofort einen Barbarenüberfall aus |
| „7" | kein Räuber - man zieht direkt eine Karte; das Kartenlimit gilt weiter |
| Ritter | stehen auf **Wegen**, nicht auf Kreuzungen, und ziehen am Zugende |
| Entwicklungskarten | eigener Stapel, sofort aufgedeckt und ausgeführt |
| Siegpunkte | je 2 Gefangene 1 Punkt; keine Größte Rittermacht |

### Der Aufbau, rekonstruiert

Die Anleitung zeigt Burg und Wüste „wie abgebildet". Was daran feststeht, ist
die **Form**: beide liegen nebeneinander im äußeren Ring, die zehn übrigen
Felder dieses Rings sind die Küstenfelder, die sieben inneren das Binnenland.
Die Rechnung geht auf - zwölf im Ring, zwei davon belegt, zehn übrig, und genau
zehn Küstenfelder nennt die Materialliste.

*Welche* zwei der zwölf das Bild wählt, ist das Einzige, was diese
Rekonstruktion offenlässt, und es kann nichts ändern: Der Ring ist symmetrisch.

Die Zahlenchips liegen „wie auf der Abbildung". Hier werden sie mit der
gewöhnlichen Spirale ausgelegt und danach so getauscht, dass **die 2 und die
12 auf Küstenfeldern liegen** - denn genau das braucht das Szenario, um die
beiden Start-Barbaren aufstellen zu können.

Die 26 Entwicklungskarten teilen sich auf vier Bilder auf; die Anleitung nennt
die Summe, nicht die Aufteilung. Gewählt sind **10 Ritterweihe, 6 Starker
Ritter, 5 Verrat, 5 Gefangen** - zwei Drittel bringen einen Ritter aufs Brett,
weil das Szenario selbst sagt: „Um dieses Szenario gewinnen zu können, solltet
ihr Ritter bauen." Die billigere Platzierung, die in die Burg, ist die
häufigere.

### Der Überfall

Nach jedem Bau: drei **verschiedene** Zahlen auswürfeln, keine „7". Auf das
Küstenfeld mit der Zahl kommt ein Barbar. Steht dort schon der dritte, passiert
nichts, und der Wurf wird **nicht** wiederholt.

Der dritte Barbar erobert das Feld: Der Chip wird umgedreht, das Feld zahlt
nichts mehr, an seinen Wegen darf keine Straße und an seinen Ecken keine
Siedlung mehr gebaut werden, und eine Siedlung dort wird nicht zur Stadt.

Eine Siedlung oder Stadt, um die herum nur noch Meer und eroberte Küstenfelder
liegen, ist selbst erobert: Sie zählt keinen Siegpunkt und ihr Hafen ist tot.
Am Brett liegt sie auf der Seite. Wüste und Burgfeld können nie erobert werden
- und sie schützen ihre Nachbarn deshalb ohne eine eigene Regel, weil auf ihnen
nie ein Barbar steht.

### Die Ritter

Eine Ritterweihe setzt einen Ritter auf einen freien Weg des **Burgfeldes**,
ein Starker Ritter auf einen beliebigen freien Weg. Am Zugende zieht jeder
Ritter bis zu 3 Wege weit, für 1 Getreide je Ritter bis zu 5. Er darf über
alles hinwegziehen, aber nicht auf einem besetzten Weg und **nie auf einem Weg
des Burgfeldes** stehen bleiben - weshalb ein frisch geweihter Ritter die Burg
noch im selben Zug verlassen muss.

### Der Sieg über die Barbaren

Nach jedem Zug, beginnend links neben der Burg und im Uhrzeigersinn: Stehen um
ein Küstenfeld mehr Ritter als Barbaren darauf, sind die Barbaren besiegt. Die
Reihenfolge ist keine Zierde - ein Ritter, den der Farbwürfel nach dem ersten
Sieg kostet, steht beim nächsten Feld nicht mehr da.

Die Gefangenen: allein vertrieben heißt alle; mehrere Beteiligte bekommen je
einen, bei zu wenigen entscheiden die Würfel und wer leer ausgeht, bekommt 3
Gold. Ein übrig bleibender Gefangener geht an die Partei mit den meisten
Rittern.

War das Feld erobert, ist es **zurückerobert**: Chip wieder umdrehen, Siedlungen
wieder aufrichten.

Danach der **Farbwürfel**. Sechs Farben auf sechs Burgwegen - aber ein Sechseck
hat nur **drei Ausrichtungen**, also kommt der Würfel auf drei mögliche
Antworten hinaus, und jeder Ritter, der so liegt, ist verloren, wem er auch
gehört. Je 3 Gold Entschädigung. Genau deshalb liest dieser Tisch den Würfel
über die Ausrichtung und nicht über die Farbe: Die Farbe ist der Umweg, die
Ausrichtung ist die Regel.

### Was das Selbstspiel gefunden hat

Vier Partien über 57 bis 145 Züge, alle beendet: 12 bis 26 Überfälle, 7 bis 20
eingesetzte Ritter, 11 bis 31 Ritte, 5 bis 9 eroberte Felder, 7 bis 18 Siege
und 6 bis 16 Gefangene je Partie. Drei Fehler kamen heraus:

1. Das **Burgfeld bekam einen Zahlenchip** - die Chip-Verteilung kannte die
   Wüste, den See und den Sumpf, aber die Burg noch nicht.
2. **Verrat konnte das Spiel anhalten**: Die Karte setzt zwei Barbaren wieder
   ein, und wenn kein freies Küstenfeld mehr übrig ist, gibt es dafür keinen
   Platz. Jetzt endet die Karte dort, wo sie nicht weiterkann.
3. Der Computergegner ließ **Ritter in der Burg stehen**, weil ihm der Burgweg
   wertvoller schien als das Feld draußen. Ein geweihter Ritter muss die Burg
   verlassen; für ihn ist der Ritt jetzt keine Wahl, sondern eine Pflicht.

Dazu zwei Fehler, die außerhalb dieses Szenarios lagen: Bei einer „7" ohne
Räuber blieb das Spiel stehen, wenn **niemand Karten hielt** - eine Ziehphase
ohne jemanden, von dem man ziehen könnte. Und **Verrat verlor einen Barbaren**,
wenn die Karte ihn abzog, aber nirgends mehr absetzen konnte; abgezogene
Barbaren gehen jetzt zurück in den Vorrat, was zugleich das „gibt es nicht
genug Barbaren, nimm sie vom Vorrat" der Anleitung erledigt. Nachgezählt über
fünf Partien: Alle 36 Barbaren sind zu jedem Zeitpunkt entweder im Vorrat, auf
dem Brett oder gefangen.

Ein weiterer Fehler betraf dieses Szenario nur nebenbei, dafür gleich sechs
Stellen im ganzen Spiel: Der **Ausbau des Wagen-Tableaus** und der **Kauf einer
Entwicklungskarte** in Händler & Barbaren kosteten in Wahrheit nichts. Beide
zahlten korrekt und schrieben danach den geänderten Spieler aus einer Kopie
zurück, die noch die alte Hand hatte - die Rohstoffe waren damit wieder da.
Dieselbe Verwechslung steckte in Entdecker & Piraten in Schiff, Hafensiedlung
und Einheit und in der Handelsfahrt beim Kauf von Bewegungspunkten. Jetzt wird
überall erst gebucht und dann bezahlt.

Ein sechster Fehler kam erst am Bildschirm heraus, als der Handelschip einen
Barbaren versetzen durfte: **Die Felder ließen sich gar nicht antippen.** Die
Liste der Tipps, die einem _Feld_ gelten statt einer Kreuzung oder einer Kante,
kannte den Räuber und die Piraten, aber nicht den Barbaren - also lag über den
Feldern keine Trefferfläche, und _Verrat_ und _Gefangen_ waren am Tisch zu zweit
wie zu sechst unbeantwortbar. Dieselbe Liste hatte das schon einmal mit dem
Sturm auf ein Piratenlager getan; jetzt steht der Barbar mit darin.

### Der Barbar vor dem Wagen war nicht anzutippen

„Steht ein Barbar auf einem Weg, den du befahren willst, darfst du gegen ihn
würfeln" - im Schiedsrichter stand dieser Zug, in der Anzeige nicht. Ein Mensch
am Trosswagen konnte an einem Barbaren also weder vorbei noch gegen ihn
antreten; der Computergegner konnte beides. Jetzt leuchten die Wege mit
Barbaren vor dem eigenen Wagen wie jeder andere Zug auch, und ein Tipp würfelt.

### Kombination mit CATAN für Zwei

Das Heft hängt an dieses Szenario fünf eigene Regeln für den Tisch zu zweit, und
alle fünf gelten hier:

- **Der Fremde Ritter.** „Ein Ritter einer neutralen Farbe spielt als ‚Fremder
  Ritter' mit und darf von beiden Personen genutzt werden. Sobald eine Person
  ihren ersten Ritter baut, setzt sie den Fremden Ritter auf einem Weg des
  Burgfelds ein." Er zählt bei jedem Sieg mit, egal wer ihn zuletzt gezogen hat.
- **Er geht nie verloren.** Der Farbwürfel nimmt jeden Ritter der gewürfelten
  Ausrichtung - ihn nicht: „Ein Fremder Ritter bleibt während des ganzen Spiels
  auf dem Spielfeld."
- **Bei zu wenigen Gefangenen würfelt er nicht.** „Gilt für den Fremden Ritter
  immer das Würfelergebnis ‚3'." Er nimmt seinen Anteil, und die Gefangenen, die
  er bekommt, sind für beide Personen verloren - er bekommt auch keine 3 Gold,
  wenn er leer ausgeht.
- **Ein Barbar statt des Räubers.** „Da es keinen Räuber gibt, darf man mit 1
  Handelschip ... einen Barbaren auf ein anderes Küstenfeld versetzen." Der Chip
  kostet wie jede Chip-Aktion 2, solange man vorne liegt, und der Knopf ersetzt
  in diesem Szenario _Räuber in die Wüste_.
- **Entschädigung.** „Als Entschädigung beim Verlust eines Ritters erhält man
  statt 3 Gold 2 Gold und 1 Handelschip."

Zwei Abweichungen, beide klein:

1. Den Fremden Ritter setzt der **Schiedsrichter** auf den ersten freien Weg des
   Burgfelds, nicht die Person, die ihren ersten Ritter baut. Alle sechs Wege
   führen in dasselbe Land, und wer am Zug ist, muss ihn im selben Zug ohnehin
   herunterziehen.
2. „Ist eine Person am Zug, zieht sie zuerst ihre(n) Ritter und anschließend den
   Fremden Ritter" ist eine **Reihenfolge, keine Einschränkung**, und der
   Schiedsrichter erzwingt sie nicht. Er müsste sonst genau dann blockieren,
   wenn ein eigener Ritter nicht ziehen will und der Fremde Ritter noch auf dem
   Burgfeld steht, das er verlassen muss. Der Computergegner hält die
   Reihenfolge ein.

## 5. Händler & Barbaren

Das Finale. Die Barbaren sind vertrieben, die Burg wird wieder aufgebaut, und
alle fahren mit einem **Trosswagen** Waren zwischen drei Zielfeldern hin und
her: Die Burg braucht Marmor und Glas, der Steinbruch Werkzeug, die Glashütte
Sand. Jede Lieferung ist ein Siegpunkt und ein Beutel Gold - und gefahren wird
über die Straßen, die alle gebaut haben, weshalb eine fremde Straße 1 Gold
Wegzoll kostet. Gespielt wird bis **13 Siegpunkte**.

### Was dieses Szenario an Catan ändert

| | |
| - | - |
| Insel | 16 Landschaften und **3 Zielfelder** - Wüste, „2" und „12" bleiben in der Schachtel |
| Gründung | 1 Siedlung, dann 1 Stadt; der Trosswagen kommt neben die Stadt |
| Zugende | eine **Fahrt**: Bewegungspunkte, Wegzoll, drei Barbaren auf Wegen |
| Wagen-Tableau | 5 Stufen: Bewegung, Belohnung und der Würfelwurf gegen Barbaren |
| „7" | kein Räuber - man versetzt einen Barbaren und zieht auf einer Straße eine Karte |
| „2"/„12" | Wurf wiederholen |
| Siegpunkte | je Lieferung 1, oberste Stufe 1, keine Längste Handelsroute |

### Die Zielfelder, rekonstruiert

Gedruckt sind die drei Zielfelder **Rahmenteile** außerhalb der Insel, jedes mit
einer Kreuzung samt Gebäude in der Mitte und vier Wegen dorthin. Dieses Brett
ist ein festes Gitter aus 19 Feldern, also liegt ein Zielfeld **auf** einem
davon: kein Zahlenchip, kein Ertrag, und seine innerste Ecke ist die Kreuzung
mit dem Gebäude.

**Die Rekonstruktion lässt sich doppelt prüfen**, und beide Male geht sie auf:

- 16 Landschaften + 3 Zielfelder = **19 Felder** - genau die Insel.
- 16 Landschaften brauchen **16 Chips** - genau die, die übrig bleiben, wenn
  „2" und „12" aussortiert sind.

Beide Zahlen kommen aus der Anleitung, keine wurde hineingesteckt. Die drei
Regeln des gedruckten Plättchens übersetzen sich damit von selbst: keine
Siedlung auf der zentralen Kreuzung, keine Straße an den Seeseiten des
Zielfeldes, Siedlungen an den übrigen Ecken nach der Abstandsregel.

### Die Fahrt

Am Zugende, nach dem Bauen. Zu Beginn 4 Bewegungspunkte:

| | Punkte |
| - | ------ |
| über einen Weg ohne Straße | 2 |
| über eine eigene Straße | 1 |
| über eine fremde Straße | 1 + **1 Gold** an die Besitzerin |
| ein Barbar auf dem Weg | +2 |

Punkte verfallen, wenn der nächste Schritt mehr kostet, als übrig ist. Einmal
je Zug: 1 Getreide für 2 zusätzliche Punkte. **Erreicht der Wagen ein Zielfeld,
endet die Fahrt** - und der Zug: Die Ware wird abgeliefert, und „als letzte
Aktion in deinem Zug" wird die nächste aufgedeckt.

### Das Wagen-Tableau

Fünf Spalten. Die Anleitung schreibt sie nicht aus, nennt aber vier feste
Punkte - Start bei 4 Bewegungspunkten, Belohnung „zwischen 1 und 5 Gold",
Vertreiben „ab der zweiten Ausbaustufe", und im Beispiel vertreibt die dritte
Stufe „bei einer 5 oder 6". Fünf gleichmäßig steigende Spalten sind die
einzige Leiter, die zu allen vier Sätzen zugleich passt:

| Stufe | 1 | 2 | 3 | 4 | 5 |
| ----- | - | - | - | - | - |
| Bewegungspunkte | 4 | 5 | 6 | 7 | 8 |
| Gold je Lieferung | 1 | 2 | 3 | 4 | 5 |
| Barbar vertreiben bei | - | 6 | 5,6 | 4,5,6 | 3,4,5,6 |

Die **Ausbaukosten** stehen nur auf dem Plättchen und sind damit erfunden; sie
werden „in deiner Handels- und Bauphase" gezahlt, also in Rohstoffen, und
steigen wie jede andere Leiter in Catan.

### Die Karten

25 eigene Entwicklungskarten, anders als beim Barbarenüberfall **auf der
Hand**. Drei davon sind namentlich abgebildete Siegpunktkarten - Steinhauerei,
Glasproduktion, Werkzeugbau -, also je eine. Die übrigen 22 verteilen sich auf
Ritter (Barbar versetzen und auf einer Straße eine Karte ziehen), Gute Reise
(eine komplette zweite Fahrt) und Straßenbau (zwei Straßen gratis); die
Aufteilung 12/6/4 folgt der Form des gedruckten Grundspiels.

### Was das Selbstspiel gefunden hat

Vier Partien zu dritt über 17 bis 36 Züge und zwei zu zweit, alle beendet: 47
bis 108 Fahrten, 6 bis 15 Lieferungen, 7 bis 12 Ausbauten je Partie. Vier
Fehler kamen heraus, und der dritte war der lehrreichste:

1. **Der Ritter zauberte einen vierten Barbaren herbei**: Die Karte ging in die
   Setzen-Phase, ohne vorher einen vom Brett zu nehmen. Beide Wege - die „7"
   und die Karte - heben jetzt durch dieselbe Funktion.
2. **Ein Zug konnte beliebig viele Lieferungen enthalten.** Nach der Ankunft
   ging es zurück in die Bauphase, und „Zug beenden" startete von dort eine
   *neue* Fahrt. Ankommen beendet jetzt den Zug, so wie die Anleitung es
   beschreibt.
3. **Das Ausbauen war unmöglich**, und zwar aus einem Grund, den man nicht
   sieht: Die Ausbaukosten wurden mit `{ ...NO_CARDS, holz: 1, lehm: 1 }`
   gebaut, und `NO_CARDS` kommt aus dem Zustandsmodul, das seinerseits dieses
   Modul lädt. Beim Laden war die Konstante noch nicht da, die Kosten hatten
   also nur zwei der fünf Felder, und die Prüfung „reicht die Hand?" las
   `undefined` und sagte immer nein. Die vier Preise stehen jetzt vollständig
   da - eine Kreisabhängigkeit weniger.
4. **Der Würfelwurf gegen einen Barbaren war umsonst**: Der Computergegner
   würfelte, bis es klappte. „Würfelst du eine andere Zahl, hast du den
   Barbaren nicht vertrieben" - ein Versuch, und ein Fehlwurf steht.

## Zu fünft und zu sechst

Alle fünf Szenarien laufen auch auf dem großen Brett. Das steht im
2-seitigen Heft `catan_babaren_5_6_Spieler.pdf`, und es ist mehr als „dasselbe,
nur größer": Jedes Szenario bekommt eigene Zahlen.

| Szenario | Auf dem großen Brett |
| -------- | -------------------- |
| Fischfang | **2 Seen** ersetzen die **2 Wüsten** |
| Die Flüsse | **3 Flüsse** (4+3+3 Felder), 20 Landschaften für den Rest |
| Der Handelstross | **2 Wasserstellen**, also **6 Handelstrosse** |
| Der Barbarenüberfall | **2 Burgfelder** und 2 Wüsten, 12 Küsten- und 14 Binnenfelder |
| Händler & Barbaren | **7 Zielfelder** (1 Burg, 3 Steinbrüche, 3 Glashütten) und 2 Wüsten |

Der Ring des großen Bretts hat **16 Felder**, das Innere **14** - und genau so
rechnet das Heft beim Barbarenüberfall: „im äußeren grauen Kreis 3x Hügelland,
3x Wald, 2x Weideland, 2x Ackerland und 2x Gebirge" sind zwölf, dazu die zwei
Burgen und die zwei Wüsten. Die Zahl fällt aus dem Brett heraus, sie wurde nicht
hineingesteckt.

Rekonstruiert bleiben zwei Kleinigkeiten, die das Heft nur als Bild zeigt: die
drei Landschaften des dritten Flussplättchens und die 21 Landschaften, mit denen
Händler & Barbaren „die freien Plätze der Insel zufällig auffüllt".

### Was das Selbstspiel gefunden hat

Vier der sieben Szenarien waren auf dem großen Brett **kaputt**, und keines
davon wäre bei drei oder vier Personen aufgefallen:

1. **Der Barbarenüberfall** legte elf Felder als `undefined` aus: Die
   Küstenliste hatte zehn Einträge für einen Ring mit sechzehn Plätzen. Ein so
   gebautes Spiel ließ sich nicht einmal speichern.
2. **Die Flüsse** und **Händler & Barbaren** füllten den Rest der Insel mit
   **elf Wüsten** auf - dieselbe Ursache, nur mit einem Notnagel statt einer
   Lücke.
3. **Fischfang** legte nur **einen** See und ließ eine Wüste stehen; der zweite
   See konnte außerdem auf der anderen Wüste landen und sie damit bloß
   verschieben.
4. **Der Handelstross** hatte nur eine Wasserstelle und damit drei Trosse statt
   sechs.

Nachgespielt: alle sieben Szenarien zu fünft **und** zu sechst, je zwei Partien,
alle beendet und alle speicherbar.
