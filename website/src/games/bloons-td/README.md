# Bloons TD

**Türme bauen, Ballons zerstechen.** Ballons laufen über einen Weg quer durch
die Wiese; daneben stehen Affen, die sie aufstechen, bevor sie am anderen Ende
hinauslaufen. Jede Runde kommen mehr, und jede neue Sorte kann etwas, das die
vorige nicht konnte.

| Seite                  | Was dort ist            |
| ---------------------- | ----------------------- |
| `/bloons-td`           | das Spiel               |
| `/bloons-td/statistik` | Partien und Spielzeiten |

## Die Karte ist Text

Zehn Zeilen, zehn Zeichen ([engine/map.ts](engine/map.ts)): `.` ist Wiese,
auf der ein Turm stehen darf, `=` ist Straße, `S` ist ihr Anfang. Mehr Zeichen
gibt es nicht - wer eine zweite Karte bauen will, schreibt zehn Zeilen und ist
fertig.

**Der Weg wird abgelaufen, nicht aufgeschrieben.** Jedes Straßenfeld hat genau
zwei Nachbarn, die auch Straße sind (Anfang und Ende haben einen), und damit
ist die Reihenfolge eindeutig: Man läuft vom `S` los und geht nie dorthin
zurück, wo man herkam. Eine zweite Liste mit denselben Feldern in Reihenfolge
wäre eine Liste, die man beim nächsten Umbau vergisst.

**Vorn und hinten steht ein Punkt neben der Karte.** Ein Ballon, der auf dem
Startfeld auftaucht, erscheint aus dem Nichts, und einer, der auf dem letzten
Feld verschwindet, verschwindet mitten im Bild. Beide sollen von draußen
hereinkommen und nach draußen hinauslaufen, also hat der Weg je einen Punkt
eine Feldbreite davor und dahinter - in dieselbe Richtung verlängert, in die
er am Rand ohnehin läuft.

**Ein Ballon weiß nur, wie weit er ist**, nicht, wo er steht: Sein ganzer Ort
ist eine Strecke in Bildpunkten, und `spotAt` rechnet daraus den Punkt. Damit
sind "wer ist vorn" und "wie weit ist er noch vom Ziel" dieselbe Frage, und die
Türme können sie beantworten, ohne den Weg zu kennen.

> Genau dort steckte auch der einzige wirklich teure Fehler beim Bauen: Die
> Schleife in `spotAt` lief nach dem gefundenen Teilstück weiter und rechnete
> mit einer negativen Reststrecke. Der Punkt landete hinter dem Ende der Karte,
> kein Turm hatte je etwas in Reichweite, und auf dem Bild sah alles richtig
> aus - die Ballons liefen ja. Seitdem hört die Schleife auf, wenn sie fertig
> ist.

## Ein Ballon ist eine Hülle über einem anderen

Wer eine Hülle zersticht, bekommt nicht nichts, sondern das, was darunter war
([engine/bloons.ts](engine/bloons.ts)). Deshalb ist die ganze Tabelle eine
Kette, und deshalb heißt die Zahl, die zählt, nicht "Leben", sondern **RBE**:
wie viele Treffer in einem Ballon stecken, wenn man ihn samt allem darin
zerlegt.

Die Zahlen sind die des Vorbilds und nicht geschätzt - ein schwarzer Ballon
enthält zwei rosa (2 × 5) plus seine eigene Hülle, macht elf. Wer an einer
Zahl dreht, dreht damit an der Rechnung, die darüber steht:

| Sorte      | RBE | Darin             | Immun gegen        |
| ---------- | --- | ----------------- | ------------------ |
| Rot        | 1   | nichts            | -                  |
| Blau       | 2   | Rot               | -                  |
| Grün       | 3   | Blau              | -                  |
| Gelb       | 4   | Grün              | -                  |
| Rosa       | 5   | Gelb              | -                  |
| Schwarz    | 11  | Rosa + Rosa       | Sprengstoff        |
| Weiß       | 11  | Rosa + Rosa       | Eis                |
| Lila       | 11  | Rosa + Rosa       | Energie und Feuer  |
| Blei       | 23  | Schwarz + Schwarz | Spitzes, Klebstoff |
| Zebra      | 23  | Schwarz + Weiß    | Sprengstoff, Eis   |
| Regenbogen | 47  | Zebra + Zebra     | -                  |
| Keramik    | 104 | Regenbogen × 2    | - (zehn Hüllen)    |

**Die zweite Hälfte der Tabelle sind die Immunitäten**, und sie sind der Grund,
warum man mehr als einen Turm baut: Der schwarze Ballon lacht über Sprengstoff,
der weiße über Eis, der bleierne über alles Spitze. Ein Spielfeld voller
Wurfpfeilaffen steht vor dem ersten Blei still - und der Bombenwerfer, der es
knackt, schaut den beiden schwarzen Ballons hinterher, die daraus kommen. Das
ist keine Gemeinheit, sondern die Lehrstunde des Spiels.

## Sechs Affen, und keiner kann alles

Nur die **Primär-Affen** ([engine/towers.ts](engine/towers.ts)). Militär, Magie
und Unterstützung stehen im Vorbild daneben und kommen später; was hier steht,
reicht für die Entscheidung, um die es geht.

| Affe             | Preis | Schaden     | Wofür                                       |
| ---------------- | ----- | ----------- | ------------------------------------------- |
| Wurfpfeilaffe    | $200  | spitz       | billig, schnell, am Blei machtlos           |
| Bumerangaffe     | $325  | spitz       | trifft auf dem Rückweg noch einmal          |
| Reißnagelwerfer  | $280  | spitz       | acht Nägel rundum, nur direkt an der Straße |
| Bombenwerfer     | $525  | Sprengstoff | knackt Blei, prallt an Schwarz ab           |
| Eisaffe          | $325  | Eis         | Frostwelle alle 2,2 s, friert 1 s fest      |
| Klebstoffschütze | $270  | Klebstoff   | 3 s halb so schnell, zielt auf Klebfreie    |

**Zwei der sechs machen keinen Schaden**, und zwar mit Absicht: Der Eisaffe
hält auf, der Klebstoffschütze bremst - zerstören können beide erst, wenn man
es ihnen kauft (Deep Freeze, Corrosive Glue). Ein Feld aus Eis und Klebstoff
allein übersteht keine einzige Runde; gemessen sind es null zerstochene
Schichten. Hätten sie von Haus aus Schaden, bräuchte niemand diese beiden
Verbesserungen.

Die Reichweiten stehen in **Feldbreiten** und nicht in Pixeln: Auf dieser Karte
liegt die Straße im Abstand von Feldern, und "zweieinhalb Felder" sagt sofort,
welche Abschnitte ein Turm erwischt.

**Und jeder sieht anders aus** ([components/render.ts](components/render.ts)):
vier stehende Affen mit Schwanz, Ohren, Schnauze und Augen - braun mit
Wurfpfeil, mit gelbem Helm und Bumerang, hellblau mit ausgebreiteten Armen,
blauen Handschuhen und Stiefeln, braun mit grünem Klebstoffrucksack und
Klebepistole - und zwei Maschinen, denn zwei der
sechs sind im Vorbild keine Affen: der Reißnagelwerfer, eine rosa Scheibe mit
acht Nägeln ringsum, genau wie er schießt, und der Bombenwerfer, eine
dunkelblaue Kanone auf Messingfuß, deren Rohr zur Mündung hin breiter wird.

**Der Affe dreht sich mit, und zwar räumlich.** Sein Kopf ist eine Kugel, und
die Merkmale sitzen darauf: die Schnauze vorn, die Augen daneben, die Ohren
auf einer Vierteldrehung. `facet(aim, wo)` rechnet für jede Blickrichtung
aus, wo so ein Merkmal landet (`x`) und ob es noch vorn liegt (`z`) - und
gezeichnet wird in der Reihenfolge der Tiefe: erst, was hinter der Kugel
liegt, dann die Kugel, dann, was davor liegt.

Damit gibt es **dieselbe Figur von vorn, von der Seite und von hinten**, ohne
drei Zeichnungen: Schaut der Affe nach unten, sieht man sein Gesicht und
seinen helleren Bauch; schaut er zur Seite, wandert die Schnauze an den Rand,
ein Auge verschwindet hinter dem Kopf, und die Füße stehen hintereinander;
schaut er nach oben, sieht man seinen Hinterkopf - kein Gesicht, kein Bauch,
dafür der Schwanz vor dem Körper. Nichts davon ist ein Sonderfall im Code, es
fällt aus derselben Rechnung heraus.

Bei der Kanone dreht sich das Rohr und nicht der Fuß; ein Geschütz, das sich
samt Lafette um die eigene Achse dreht, steht auf nichts. Auf grüner Wiese
sieht man außerdem grünes Gerät nicht, weshalb der Rucksack dunkler ist als
das Gras.

**Der Wurf ist eine Animationsspur aus drei Haltungen.** Der Wurfpfeilaffe hat
einen Arm aus zwei Knochen - Schulter, Ellbogen, Hand -, und zwischen drei
Haltungen wird gemischt: _locker_, solange nichts ansteht, _ausgeholt_ (Hand
hinter und über der Schulter, Ellbogen stark geknickt), kurz bevor er wirft,
und _gestreckt_ im Augenblick des Wurfs. Beide Mischungen kommen aus Zahlen,
die ohnehin im Spielzustand stehen: `kick` für den Wurf selbst, der Rest der
Nachladezeit fürs Ausholen. Dass er erst spät ausholt, macht die dritte
Potenz - ein gleichmäßiges Heben über die ganze Nachladezeit sähe aus wie
Zeitlupe.

Den Pfeil hält er dabei in der Hand, und zwar bis zum Wurf; danach fliegt
derselbe Pfeil über das Feld und dreht sich in seine Flugrichtung. **Die Tiefe
wird um die Hälfte gestaucht**: Ein Arm, der vom Betrachter weg zeigt, geht
nicht um seine volle Länge nach oben, sonst reckt der Affe beim Zielen nach
oben den Arm in den Himmel, statt nach hinten zu zeigen.

## Bewegung steht im Zustand, nicht in der Zeichnung

Zwei Zahlen je Turm, und der Bildschirm erfindet nichts dazu:

- **`faced`** ist die Richtung, in die das Rohr gerade zeigt. Sie schwenkt mit
  gut fünfhundert Grad je Sekunde auf das Ziel zu, jedes Bild ein Stück, über
  den kürzeren der beiden Wege. Geschossen wird entlang `aim`, der echten
  Richtung zum Ziel - ein Turm, der erst zu Ende schwenken müsste, würde beim
  Zielwechsel danebenschießen, und das sieht man nicht als Trägheit, sondern
  als Fehler.
- **`kick`** ist eins im Augenblick des Schusses und fällt in gut einer
  Fünftelsekunde auf null. Daraus macht der Bildschirm den Rückstoß (das Rohr
  fährt zurück und wieder vor), das Mündungsfeuer (ab 0,72 sichtbar, es wird
  kürzer, während es verblasst) und bei den Affen das Zucken des Wurfarms.

Dass beides im Spielzustand steht und nicht im Zeichner, ist der Grund, warum
der Schnellvorlauf stimmt: Bei achtfachem Tempo läuft die Animation achtmal
so schnell, ohne dass irgendwo eine zweite Uhr nachgeführt werden müsste.

Der Bumerang ist dabei der einzige Turm mit Gedächtnis: Ab der Hälfte seiner
Flugzeit zieht es ihn zurück zum Werfer, und unterwegs trifft er ein zweites
Mal. Deshalb hat er vier Durchschläge statt zwei - sonst wäre der Rückweg ein
Bild ohne Wirkung.

**Die `pierce`-Spalte heißt bei drei Türmen drei Dinge**, weil es dreimal
dieselbe Frage ist: wie viele Ballons eine Wirkung erfasst. Beim Wurfpfeil
sind es die, durch die er hindurchgeht; beim Eisaffen die, die er einfriert;
beim Bombenwerfer die, die sein Knall erwischt (vierzehn, wie in der Vorlage).

## Zwei Säulen je Turm

Jeder Turm hat zwei Säulen mit je zwei Stufen
([engine/upgrades.ts](engine/upgrades.ts)), und keine Säule macht beim selben
Turm dasselbe wie die andere: Der Reißnagelwerfer wird auf der einen dichter
(acht Nägel, zehn, zwölf) und auf der anderen weiter. Wer beides will, zahlt
beides.

**Eine Stufe ist ein Unterschied zur Stufe davor, nicht zum Anfang.** Wer die
zweite kauft, hat die erste schon. Multipliziert wird, was ein Verhältnis ist,
addiert, was eine Anzahl ist - und dabei kommen genau die Zahlen der Vorlage
heraus: 2 → 3 → 5 Durchschläge beim Wurfpfeilaffen, 4 → 8 → 13 beim Bumerang,
14 → 20 → 30 erfasste Ballons beim Bombenwerfer, 0,95 → 0,8075 → 0,633
Sekunden Nachladezeit.

**Namen und Preise sind die der Vorlage**, aus der mittleren der vier
Preisspalten - derselben, aus der auch die Grundpreise der Türme kommen.
Deshalb heißen die Stufen hier "Glaives" und "Missile Launcher" und nicht
übersetzt: Es sind Eigennamen, und wer sie nachschlägt, soll das Richtige
finden. Die Beschreibung darunter ist deutsch.

**Drei Stufen mussten umgedeutet werden**, weil die Vorlage dort etwas kann,
das es hier nicht gibt:

| Stufe            | Vorlage                          | Hier                                            |
| ---------------- | -------------------------------- | ----------------------------------------------- |
| Cold Snap        | friert Blei und Getarnte         | friert, was gegen Eis immun ist: Weiß und Zebra |
| Permafrost       | Dauer über Schichten geregelt    | hält so lange an, wie der Frost gedauert hat    |
| Missile Launcher | +4 Reichweite (von 40 Einheiten) | zehn Prozent mehr Reichweite                    |

Tarnung gibt es hier nicht, und Blei ist in unserer Ballontabelle gegen
Spitzes und Klebstoff immun, nicht gegen Eis - "friert Blei ein" wäre also
eine Zeile ohne Wirkung gewesen. Immun gegen Eis sind hier Weiß und Zebra,
und genau die knackt Cold Snap.

Zwei Stufen bringen Mechanik mit, die es vorher nicht gab: **Glue Soak** zieht
den Klebstoff in die Ballons hinein, die aus einem beklebten herauskommen -
ohne diese Stufe kommt das Innere frisch und ungebremst heraus, wie im
Vorbild. **Corrosive Glue** frisst einem beklebten Ballon alle zwei Sekunden
eine Schicht. Beides steht im Ballon selbst (`soak`, `bite`), nicht im Turm:
Der Belag muss weiterwirken, auch wenn der Turm, der ihn aufgetragen hat,
längst verkauft ist.

**Jeder Turm führt sein eigenes Konto.** Was durch seinen Treffer platzt -
auch über den Umweg eines Knalls -, wird ihm angeschrieben und steht unter
seinem Namen, sobald man ihn antippt. Zwei gleiche Affen an verschiedenen
Ecken der Karte sehen gleich aus; hieran sieht man, welcher von beiden sein
Geld wert ist.

Gekauft wird **auch mitten in der Welle**, wie in der Vorlage. Wenn die Runde
kippt, soll entscheiden, ob man rechtzeitig nachlegt - nicht, ob man zwanzig
Sekunden früher richtig geraten hat. Am Fuß jedes Turms steht ein goldener
Punkt je gekaufter Stufe, sonst stehen auf dem Feld zwei gleiche Affen, von
denen nur einer etwas taugt.

## Der Fehler, der am längsten drin war

`fire` zog vom Nachladen jedes Bild **eine feste Zahl** ab statt der Zeit, die
das Bild gedauert hat. Bei sechzig Bildern in der Sekunde feuerte damit jeder
Turm dreimal so oft, wie in seiner Tabelle steht - und auf einem langsameren
Rechner anders. Auf dem Bild sah alles richtig aus: Es wurde geschossen, es
platzte etwas, nur eben dreimal zu viel. Aufgefallen ist es erst, als ein
Eisaffe einen Ballon nicht mehr losließ: Sein Frost hält eine Sekunde, er lädt
2,2 Sekunden nach - bei 0,73 Sekunden Nachladezeit stand der Ballon für immer.

Seitdem zählt die Nachladezeit in der Zeit, die vergangen ist. Jeder Turm
schießt damit so oft, wie seine Tabelle sagt, und ein gemischtes Feld an der
Straße übersteht trotzdem sechzig Runden ohne ein verlorenes Leben - ein Feld
aus lauter Wurfpfeilaffen dagegen fällt in Runde fünfzehn, am ersten Blei.

## Der Eisaffe wirft nie

**Er schießt nicht, er pulsiert.** Alle 2,2 Sekunden geht in seinem Umkreis
eine Frostwelle los, und zwar _regelmäßig_ - nicht, wenn ihm jemand vor die
Füße läuft. Ob gerade ein Ballon in Reichweite ist, ändert nur, ob die Welle
jemanden erwischt; gemessen sind es sieben Wellen in fünfzehn Sekunden, auch
wenn der Affe in der entferntesten Ecke der Karte steht und nie etwas trifft.

Deshalb sucht er sich auch kein Ziel (`leader` wird für ihn gar nicht erst
gerufen), deshalb dreht er sich nicht, und deshalb hält er nichts in der Hand:
Er steht mit ausgebreiteten Armen da und reißt sie hoch, wenn die Welle
losgeht. Ein Schneeball in seiner Hand wäre eine Ankündigung, die nie
eingelöst wird.

Die Welle selbst ist eine eigene Art von Knall (`look: "frost"`): eine
Scheibe, die aufleuchtet, verblasst und Zacken nach außen treibt - so groß wie
seine Reichweite, damit man sieht, was sie erfasst hat. Ein dünner Ring wie
bei einem geplatzten Ballon wäre zu wenig für den ganzen Angriff eines Turms.

Und sie friert nicht alles ein, sondern **die vordersten acht** - das ist seine
`pierce`-Zahl, dieselbe Spalte, die bei den anderen sagt, wie viele Ballons
ein Geschoss hintereinander trifft. Ohne Grenze wäre er bei dreißig Ballons
auf dem Bild kein Turm mehr, sondern ein Schalter. Seine zweite Säule hebt die
Grenze auf zwölf und dann auf zwanzig, die erste verlängert den Frost von
einer auf zwei Sekunden.

## Die ersten zwanzig Runden stehen von Hand da

Eine Welle ist eine Ansage ("jetzt kommt zum ersten Mal Blei"), und eine Ansage
schreibt man auf, statt sie auszurechnen ([engine/waves.ts](engine/waves.ts)).
Jede neue Sorte taucht einmal in kleiner Zahl auf, bevor sie in großer kommt:
Wer beim ersten schwarzen Ballon merkt, dass seine Bomben nichts tun, hat noch
Zeit, etwas anderes zu bauen.

Erst danach wird gerechnet, weil nach zwanzig Runden keine Ansage mehr kommt,
sondern nur noch mehr. Ein Ende hat das Spiel nicht - die Frage ist, wie lange
hält, was man gebaut hat.

## Ein Bild, in dieser Reihenfolge

Erst laufen die Ballons, dann schießen die Türme, dann fliegen die Geschosse
([engine/engine.ts](engine/engine.ts)). Ein Turm zielt damit auf das, was
wirklich vor ihm liegt, und nicht auf die Stelle, an der etwas vor einem
Sechzigstel einer Sekunde war.

Gezielt wird auf den **vordersten** Ballon in Reichweite. Das ist in der
Vorlage eine Einstellung je Turm; hier ist es eine Regel, und sie ist die, die
man in neun von zehn Fällen ohnehin will.

**Eine Ausnahme gibt es, und sie steht in der Tabelle**
([engine/towers.ts](engine/towers.ts), `picks`): Der Klebstoffschütze nimmt
den vordersten, an dem noch _nichts klebt_. Ein zweiter Klecks verlängert
nämlich nichts - er stellt nur dieselbe Uhr noch einmal, und der Ballon
dahinter läuft ungebremst vorbei. Findet er keinen klebfreien, schießt er gar
nicht.

Der Eisaffe wirft überhaupt nichts: Seine Frostwelle hält alles, was sie
erfasst, **eine Sekunde lang fest** (Tempo null, nicht gebremst). Die Bombe trifft
mit ihrem Knall mehrere Ballons auf einmal und lädt dafür von allen Schützen
am längsten nach.

Der Schnellvorlauf rechnet **dasselbe Bild dreimal** statt einen dreifach
größeren Zeitschritt zu nehmen. Mit einem großen Schritt springen Geschosse
durch Ballons hindurch, und genau das wäre im schnellen Vorlauf am wenigsten zu
erklären.

## Drei Knöpfe, die nicht zum Spiel gehören

Über dem Feld stehen **+$10.000**, **Turbo** und **Auto-Start**. Der erste
schummelt, der zweite rechnet acht Bilder statt einem, der dritte schickt die
nächste Welle anderthalb Sekunden nach der vorigen von selbst los. Alle drei
sind zum Ausprobieren da: Wer sehen will, wie sich ein ausgebautes Feld in
Runde vierzig anfühlt, soll dafür keine halbe Stunde brauchen. Der Schummelknopf
sagt auch dazu, dass er einer ist - ein verstecktes Tastenkürzel wäre
derselbe Eingriff, nur unehrlich.

## Was noch fehlt

Die MOAB-Klasse (M.O.A.B., D.D.T., B.F.B., Z.O.M.G., B.A.D.), die
Zusatzeigenschaften (getarnt, nachwachsend, verstärkt, mit Schild), die
Boss-Ballons und die drei anderen Affengruppen. Von den Aufwertungen gibt es
zwei Säulen mit je zwei Stufen statt drei Pfaden mit je fünf - die oberen
Stufen sind im Vorbild eigene Fähigkeiten und keine größeren Zahlen, und die
erfindet man nicht nebenbei. Der
goldene Ballon fehlt ebenfalls: Er steht im Vorbild unter den Standardsorten,
aber wann er auftaucht und wie lange er bleibt, wäre hier erfunden - und
erfundene Regeln in einem nachgebauten Spiel merkt man sofort.
