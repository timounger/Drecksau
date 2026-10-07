# U-Boot

**Journey to the Deep.** Ein Tauchspiel von der Seite: auf der Seekarte ein
Gewässer wählen, links ablegen, rechts ankommen - und dazwischen alles
vermeiden, was ein U-Boot aufreißen kann. Im Boot sitzt ein Affe. Er steuert
nicht mit.

## Spielen

| Seite              | Was dort passiert                 |
| ------------------ | --------------------------------- |
| `/uboot`           | alles: Seekarte und Tauchgang     |
| `/uboot/statistik` | Fahrten, Ergebnisse und Spielzeit |

**Es gibt genau ein Spielfenster.** Seekarte, Tauchgang, Werkstatt,
Enzyklopädie und Erfolge liegen alle in demselben Rahmen - der Canvas gibt ihm
seine Größe, alles andere wird darübergelegt. Die drei Türen sitzen am Fuß des
Fensters, und was sie öffnen, geht als Blatt darin auf. Keine eigenen Routen,
kein Seitenwechsel: Wer in die Werkstatt geht, verliert seinen Tauchgang
nicht, und der Punktestand auf der Karte ändert sich, noch während man kauft.

Steuerung: **W** auftauchen, **S** abtauchen, **A** zurück, **D** vorwärts,
**Esc** Pause. Geschossen wird mit **Linksklick dorthin, wo man hinklickt**,
Seeminen legt der **Rechtsklick**; ohne Maus feuert die Leertaste und **Q** legt
eine Mine. Die Pfeiltasten tun dasselbe wie WASD. Die Regeln stehen im Spiel
hinter **„? Regeln"**.

**Losgefahren wird losgefahren.** Es gibt keinen Startknopf: Wer ein Gewässer
gewählt hat, sieht es liegen, und der erste Druck nach vorn ist das Ablegen.
Ein Knopf, der nur fragt, ob man wirklich will, was man gerade angeklickt hat,
ist ein Klick zu viel.

**Auf dem Telefon wird im Bild gesteuert**
([hooks/touch-controls.ts](hooks/touch-controls.ts)): Links ins Bild fassen
lässt ein **Steuerkreuz unter dem Daumen** aufgehen, das man in die vier
Richtungen zieht; rechts tippen feuert. Vier Knöpfe unter dem Bild waren der
falsche Weg - sie kosten den Platz, den auf einem Telefon das Spiel braucht,
und der Daumen muss jedes Mal hinsehen, wo er hinfasst. Ein Kreuz, das dort
aufgeht, wo man hingefasst hat, muss man nicht finden. Genauso macht es die
[Panzerkiste](../panzerkiste), und wer es dort gelernt hat, kann es hier.

## Zehn Gewässer in vier Stufen

Jede Stufe nimmt genau eine Sicherheit weg - und jede hat ihre Antwort schon
im Laden liegen, bevor sie gebraucht wird.

| Gewässer | Stufe          | Was sie ausmacht                                        |
| -------- | -------------- | ------------------------------------------------------- |
| 1-3      | leicht ☀       | Offenes Wasser. **Auftauchen füllt die Luft**           |
| 4-6      | Höhle ⛰        | Fels über und unter dir. Der Tank ist, was du dabeihast |
| 7-9      | finster 🌑     | Dieselbe Höhle im Schwarzen - Licht und Sonar zählen    |
| 10       | der Wächter 🦑 | Alle drei nacheinander, und am Ende steht etwas         |

**Das Auftauchen** ist eine Eigenschaft des Gewässers und steht deshalb am
Kurs, nicht in der Engine ([engine/course.ts](engine/course.ts)): Die Engine
fragt nur nach, ob die Oberfläche hier Luft gibt. Über einer Höhle ist Fels -
dort erledigt sich die Frage von selbst, aber der Schalter macht sichtbar,
dass es eine Entscheidung war.

**Die letzte Fahrt wird unterwegs dunkel.** Sie beginnt im Hellen, geht in die
Höhle und endet im Schwarzen; `darkness(level, share)` in
[engine/levels.ts](engine/levels.ts) rechnet das aus dem Fortschritt aus. Für
die neun anderen ist es eine feste Zahl - nur diese eine braucht einen Verlauf,
so wie man beim echten Abtauchen das Licht verliert, nämlich nicht auf einen
Schlag.

## Höhlen aus Bausteinen, die zusammenpassen

Alle Höhlenbausteine haben den Gang **an beiden Rändern auf denselben vier
Zeilen**. Damit passt jeder an jeden, und eine Höhle ist eine Liste statt einer
Rechenaufgabe: `["tunnel", "caveWave", "caveTeeth", "caveOut"]`. Was dazwischen
passiert, ist die Abwechslung - absacken, aufsteigen, eng werden, Zähne
bekommen.

Nachgemessen mit einer Suche über das Gitter, die das Boot in seiner echten
Größe an jede halbe Zeile setzt und die Engine fragt, ob es dort passt: **alle
zehn Kurse sind durchtauchbar.**

Ein Wort zur Sonde selbst, weil sie beim ersten Anlauf gelogen hat: Sie
verlangte, dass die Zwischenhöhen eines Spurwechsels schon in der **alten**
Spalte frei sind. Das Boot fährt aber die Schräge, es springt nicht - und so
meldete sie sechs gut fahrbare Höhlen als unpassierbar. Jetzt genügt es, wenn
eine der beiden Spalten frei ist.

## Punkte haben einen Deckel

`XP_CAP` ist der Vollausbau: **980 Punkte**, aus der Tabelle gerechnet und
nicht hingeschrieben ([settings/profile.ts](settings/profile.ts)). Mehr kann
niemand ansammeln - weder durch Wiederholen noch über die Abkürzung in den
Einstellungen, und ein von Hand aufgeblasener Spielstand kommt beim Laden
beschnitten heraus.

Punkte sind in diesem Spiel kein Guthaben, sondern die Frage, welches Boot man
fährt. Diese Frage ist beantwortet, sobald alles gekauft werden kann; eine Zahl,
die danach weiterwächst, ohne dass sich etwas ändert, misst nur noch Fleiß.

**Die Rechnung geht exakt auf**: Alle zehn Gewässer bringen beim ersten Mal
zusammen genau 980 - wer jedes einmal geschafft hat, kann jede Stufe jeder Bahn
kaufen. Wiederholungen zahlen je ein Viertel; das hilft, solange man noch
Gewässer offen hat, und füllt nie über den Vollausbau hinaus.

Früher zahlten die Gewässer zusammen nur 740 bei einem Vollausbau von 900, und
der Rest war nur über Wiederholungen zu holen. Mit der Lenkrakete (80 Punkte)
wurden die Belohnungen auf 30, 45, 60, 75, 85, 100, 110, 125, 150 und 200
angehoben. **Alte Spielstände werden beim Laden umgerechnet** (`ladder`): Wer
die Seemine hatte (damals Stufe 3 der Bewaffnung), behält sie als Stufe 4 und
bekommt die Lenkrakete samt ihrem Preis dazu, und für jedes schon geschaffte
Gewässer wird nachgezahlt, was es heute mehr bringt.
Ausgezahlt wird nur, was noch unter den Deckel passt - und **das** ist auch die
Zahl, die das Siegblatt zeigt. Eine Belohnung anzukündigen, die nicht ankommt,
wäre gelogen; steht da +0, sagt eine Zeile darunter, warum.

## Auf dem Telefon

Drei Dinge halten das Spiel auf einem kleinen Bildschirm zusammen:

**Die Werkstatt meldet sich nur, wenn man dort etwas bekommt.** Die Zahl am
Hammer erscheint nicht, sobald Punkte übrig sind, sondern erst, wenn davon
wirklich eine nächste Stufe bezahlbar ist (`canBuyAny`). Wer zwölf Punkte hat
und nichts unter zwanzig vor sich, liefe sonst in eine Werkstatt, in der alles
grau ist - und glaubt dem Hinweis beim nächsten Mal nicht mehr.

**Die Seekarte misst sich am Fenster, nicht am Bildschirm.** Jede Größe darauf
steht in `cqw` - einem Hundertstel der Fensterbreite -, und das Blatt trägt dafür
die Klasse `.game-measured` (`container-type: inline-size`). **Diese Klasse ist
nicht schmückend:** Ohne einen solchen Container fällt `cqw` auf den
Darstellungsbereich zurück - auf einem 1600 Pixel breiten Monitor wurden die
Marken dann 70 statt 44 Pixel groß, während das Spielfenster bei seinen 992
blieb. Als Inline-Stil versucht funktioniert es übrigens nicht: React trägt
`container-type` nicht ins DOM ein. Damit sieht die Karte auf dem Telefon aus wie auf dem Bildschirm,
nur kleiner; mit festen Pixelgrößen schoben sich vorher Marken, Namen und die
drei Türen übereinander, weil sie für genau eine Breite gemacht waren.

**Im Hintergrund der Karte schwimmt etwas vorbei**
([components/chart-life.tsx](components/chart-life.tsx)). Dort lag vorher eine
Insel mit Bergen - die erzählte aber von Land, und die Karte handelt von dem,
was unter dem Strich liegt. Jetzt ziehen ein paar Bewohner quer durchs Blatt,
blass und langsam, verschwinden an der einen Kante und kommen an der anderen
wieder.

Dasselbe steht **hinter dem Ausbaubaum**, dort aber nur Fischschwärme: Die
Werkstatt ist der Ort zwischen zwei Tauchgängen, und ein Anglerfisch, der dort
durchs Bild zieht, erinnert ans Gefecht, statt ans Boot denken zu lassen. Ein
Schwarm ist Wasser mit Bewegung darin. Wer vorbeizieht, sagt also das Blatt -
die Leinwand selbst weiß es nicht.

Es sind **dieselben Tiere wie im Wasser** ({@link ./creatures drawBeast}), nur
blasser und ohne jede Wirkung: anklicken kann man sie nicht, treffen können sie
einen nicht. Ein zweiter Satz eigens gemalter Hintergrundfische wäre ein
zweiter Satz, den man beim nächsten Umbau einer Qualle vergisst. Ihre Bahn
braucht dabei keinen Zustand - sie ist der Rest einer Teilung aus Startpunkt,
Tempo und Uhrzeit.

**Die Blätter nehmen auf dem Telefon den ganzen Bildschirm** (`fixed inset-0`,
ab `md` wieder im Fenster). Im Fenster wären Werkstatt, Buch und Erfolge dort
zwei Finger hoch, und Text, der in zwei Finger passen muss, ist kein Text mehr.
Die Werkstatt stellt sich dabei um: Felder eine Nummer kleiner, die Tafel nur
so hoch wie ihr Baum - sechs Türme nebeneinander in einer Handbreit wären
sonst sechs Türme, von denen man vier nicht sieht.

**Was aus dem Bild führt, steht in einer Ecke:** oben rechts, nebeneinander -
links der Weg aus dem Vollbild, rechts die Pause. Zwei Wege hinaus in zwei
verschiedenen Ecken sind zwei, die man beide suchen muss; und unten rechts
wohnt inzwischen der Minenknopf, der dort auch bleiben kann.

**Das Vollbild gibt es überall**, nicht nur im Tauchgang: Auf dem Telefon ist es
der einzige Weg zu einer Karte, auf der man etwas lesen kann - und dorthin will
man, bevor man ein Gewässer aussucht. Quer gehalten füllt das Spielfenster dann
den ganzen Bildschirm.

Gesteuert wird wie in der Panzerkiste: **links ins Bild fassen**, und unter dem
Daumen geht ein Steuerkreuz auf; rechts tippen schießt, rechts halten legt eine
Seemine. Damit legt man auch ab - der erste Zug nach vorn startet den
Tauchgang, auf dem Telefon wie an der Tastatur.

**Und genau daran ist es eine Weile gescheitert.** Vor dem Ablegen hat die
Schleife in jedem Bild `forget()` gerufen, um nichts Gedrücktes aus der Zeit
davor mitzuschleppen. An der Tastatur fiel das nicht auf, weil eine gehaltene
Taste von allein nachfeuert; der Daumen aber setzt auf und zieht **danach** -
und zwischen diesen beiden Augenblicken war er jedes Mal gelöscht. Das
Steuerkreuz blinkte auf und verschwand, das Boot blieb liegen, und einen
anderen Weg loszufahren gibt es auf dem Telefon nicht. Vergessen wird jetzt nur
noch dort, wo ohnehin nicht gefahren werden kann: auf der Karte, in der Pause
und nach dem Tauchgang.

**Vor dem Ablegen steht auf dem Telefon, wie man es anfasst.** Dort hilft der
Satz nicht, welche Taste vorwärts fährt - es gibt keine Taste, sondern eine
Stelle im Bild, und die muss man zeigen. Also stehen im Wartebild zwei
verschiedene Hinweise: an der Tastatur der mit `D`, am Finger der mit dem
Zeigefinger nach links („Links ins Bild fassen: Dort geht das Steuerkreuz unter
deinem Daumen auf"), dazu eine Zeile übers Zielen und die Seemine. Umgeschaltet
wird über `pointer-coarse`, nicht über die Fensterbreite: Gemeint ist der
Finger und nicht das schmale Fenster.

**Ein Kreuz, das schon steht, bleibt stehen.** Der zweite Finger zielt - auch
auf der linken Seite, denn dort schwimmt genauso viel herum wie rechts. Ohne
diese Regel spränge das Steuerkreuz unter dem Daumen weg, sobald man nach links
schießt, und das Boot bliebe mitten im Gefecht stehen.

**Und für die Seemine gibt es einen Knopf** unten rechts im Bild - aber nur auf
Geräten mit grobem Zeiger (`pointer-coarse`) und nur, wenn wirklich Minen an
Bord sind. Am Rechner liegt sie auf der rechten Maustaste; auf dem Telefon gibt
es die nicht, und das lange Halten rechts im Bild ist zwar da, aber nichts,
worauf man von allein kommt. Ein Knopf, der nichts tut, wäre schlimmer als
keiner - deshalb hängt er an {@link Hud.mines} und nicht einfach am Bildschirm.

## Das Blatt vor dem Tauchgang

Ein Klick auf ein Gewässer taucht nicht ab, sondern öffnet
[components/course-brief.tsx](components/course-brief.tsx). Die Anordnung ist
die der Vorlage, die Farben kommen aus dem Wasser: **links, was es ist** - ein
Blick durchs Bullauge und darunter die drei schnellsten Zeiten mit Gold,
Silber und Bronze -, **rechts, was man damit tut** - der Text zur Karte, die
eigene Bestmarke, die Schwierigkeit und der Knopf.

**Das Bullauge ist kein gemaltes Bild, sondern ein Bild des Spiels.** Derselbe
Zeichner, der den Tauchgang zeichnet, malt hier ein Standbild davon - ohne
Anzeigen (`Scene.bare`), dafür an der Stelle des ersten Bewohners statt am
leeren Anfang. Eine gemalte Vorschau würde altern, sobald jemand am Kurs etwas
ändert; diese kann das nicht. Sie zeigt sogar die Dunkelheit und den
Scheinwerferkegel, wenn das Gewässer dunkel ist.

Dasselbe gilt für die Zeile **"Dich erwarten"**: Tiere und Minen werden im
gebauten Kurs gezählt, nicht aufgeschrieben. Wer daneben die Schwierigkeit
umstellt, sieht die Zahlen und das Bild mitgehen - und genau deshalb steht die
Wahl auf diesem Blatt und nicht nur in den Einstellungen.

Drei Plätze statt zehn: Vor dem Ablegen will man wissen, was zu schlagen ist.
Die ganze Liste ist einen Klick entfernt und steht ohnehin am Ende jedes
Tauchgangs. Wer eine Zeit schlagen will, soll sie vorher gesehen haben; ein
Spiel, das die Rangliste erst hinterher zeigt, verrät einem das Ziel, wenn es
nichts mehr nützt.

**Eine Liste je Gewässer** (`uboot-1` bis `uboot-10`), denn Zeiten aus dem
Hafenbecken gegen Zeiten aus dem Graben zu stellen hieße, zehn Fragen mit einer
Antwort zu beantworten. Geladen, sortiert und eingetragen wird mit dem
gemeinsamen Gerüst der Sammlung ([@/online/leaderboard](../../online/leaderboard.ts)),
also unter `rooms/{id}-__best` und mit **einem Platz je Name** - sonst nimmt ein
starker Spieler die ganze Liste ein, und es gibt nichts mehr zu holen.

Eingetragen wird auf dem Siegblatt, in dem Moment, in dem die Zeit feststeht.
Ein abgebrochener Versuch hat keine.

**Gemessen wird auf die Millisekunde.** Die Uhr im Bild zeigt Hundertstel -
eine Ziffer, die nur flackert, liest niemand -, das Ergebnis und die Liste
zeigen Tausendstel. Zwei gute Fahrten durch dasselbe Gewässer trennt oft
weniger als ein Zehntel.

## Vier Stufen, zwei Schrauben

Die Schwierigkeit ([engine/grades.ts](engine/grades.ts)) dreht an genau zwei
Dingen: **wie schnell das Wasser nachläuft** (`pace`) und **wie viel darin
lebt** (`swarm`). Beides sieht man im Bild. Es gibt keinen versteckten
Multiplikator auf Schaden oder Luft - wer auf Unmöglich stirbt, soll wissen,
woran.

| Stufe     | Fenster  | Bewohner (alle zehn Kurse) |
| --------- | -------- | -------------------------- |
| Leicht    | 63 px/s  | 43                         |
| Mittel    | 84 px/s  | 78                         |
| Schwer    | 113 px/s | 124                        |
| Unmöglich | 147 px/s | 179                        |

"Mittel" ist Faktor eins auf beiden Schrauben, also genau das Spiel von vorher.
Deshalb bekommen alte Spielstände beim Laden "Mittel" als Bestleistung
eingetragen: Was damals geschafft wurde, war dieses Spiel.

Auf Unmöglich läuft das Wasser mit 147 px/s - ein Boot von der Stange schafft 146. Das ist Absicht: Die höchste Stufe verlangt Antrieb aus der Werkstatt,
sonst wird man die ganze Fahrt über geschoben.

**Die Karte bleibt dieselbe.** Mehr Bewohner werden _neben_ die vorhandenen
gesetzt ([engine/course.ts](engine/course.ts), `peopled`), weniger werden
gleichmäßig ausgedünnt - nicht zufällig, sonst wäre die halbe Strecke leer.
Ein Gewässer auf Leicht ist dasselbe Gewässer wie auf Unmöglich, und nur
deshalb ist die Bestleistung eine Aussage über den Spieler.

Gespeichert wird je Gewässer **das Höchste**, was dort gelang
(`Profile.best`). Nach dem Ziel steht es auf dem Siegblatt, auf der Seekarte
unter jedem Punkt - und wer alle zehn auf Unmöglich hat, bekommt die fünfte
Auszeichnung.

## Zwei Sorten Fels

`#` ist gewachsener Stein und hält alles aus. `B` ist Bruchfels: dasselbe
Hindernis, aber ein Torpedo oder eine Seemine macht eine Tür hinein.

Das ist der ganze Sinn der Unterscheidung. Könnte man überall durchsprengen,
wäre jede Höhle nur noch eine Frage der Munition; könnte man es nirgends, wäre
der Torpedo eine Waffe gegen Fische. Die Regel dahinter ist einfach genug, um
sie beim Fahren zu lernen: **Grund und Decke halten, was dazwischen hängt,
nicht.**

Man sieht es, bevor man schießt - Bruchfels ist wärmer in der Farbe und hat
Risse, und das Sonar zeichnet ihn mit einem Kreuz statt als leeres Kästchen.
Eine Wand, der man erst am Einschlag ansieht, ob sie nachgibt, wäre kein
Rätsel, sondern eine verschwendete Mine.

## Zehn Landmarken auf dem Grund

**Die sechs Häuser stehen alle in Bikini Bottom.** Ananas, Stein mit Antenne,
Krosse Krabbe, Baumkuppel, Abfalleimer, Tiki-Kopf - jedes ist ein Gebäude aus
dem SpongeBob-Film, und genau deshalb erkennt man sie im Vorbeifahren, ohne
dass irgendwo ein Name dabeisteht. Die vier Bewohner weiter unten kommen aus
anderen Filmen; nur der Geist am Ende gehört wieder dorthin.

Auf dem Grund des ersten Gewässers steht ein Haus aus einer Ananas - mit
Blätterkrone, Rundbogentür, zwei Bullaugen und dem Kamin an der rechten Flanke
([components/landmarks.ts](components/landmarks.ts), Vorbild
`game_instructions/UBoot/ananas_haus.jpg`). Es ist **kein Hindernis**: Sein
Feld `H` zählt wie Tang als Wasser - man fährt hindurch, Schüsse fliegen
hindurch, und es tut niemandem etwas.

Dafür macht es aus einem Kurs einen Ort. Wer das Hafenbecken zum dritten Mal
fährt, erkennt es nicht an seinen Felsen wieder, sondern daran, dass hier
jemand wohnt. Es steht in einem eigenen Kursstück (`home`), das nur das erste
Gewässer benutzt - eine Landmarke, die überall steht, ist keine.

Im zweiten Gewässer steht das zweite: eine **Kuppel aus Stein** mit einer
Fernsehantenne obendrauf (Feld `R`, Kursstück `rock`, Vorbild
`game_instructions/UBoot/haus_patrick.webp`). Das ganze Haus ist ein
Felsbrocken; das Einzige, was verrät, dass jemand darunter wohnt, steht oben
drauf und ist gelb.

Im dritten steht die **Bude mit dem Schild** (Feld `L`, Kursstück `shack`,
Vorbild `game_instructions/UBoot/krosse_krabbe.webp`): ein Bretterbau wie eine
umgedrehte Reuse, Wimpelkette davor, und links daneben auf einem Mast die
Tafel, an der man sie erkennt. Die Schrift darauf sind drei rote Striche -
lesen soll man das bei dieser Größe nicht, erkennen schon.

Im vierten steht **die Glaskuppel mit dem Baum**
(`HOUSE_SANDY`, Kursstück `caveDome`, Vorbild
`game_instructions/UBoot/Haus/house_sandy.jpg`): ein Stück Land unter einer
Glocke, mit Gras, einem Baum und einer Schleuse an der Seite. Das einzige
Haus, in das man hineinsieht - draußen Wasser, drinnen Luft, und man sieht
beides gleichzeitig.

Zwei Dinge daran sind Absicht. Die **Schleuse ist überdacht**, denn sie ist kein
Türpaar, sondern ein Raum: Man geht durch die äußere Luke hinein, das Wasser
läuft ab, und erst dann geht die innere auf. Ohne Dach sähen die beiden Luken
aus, als klebten sie von außen an der Kuppel. Und der **Baum hat Lücken**: Stamm
mit Schattenseite, zwei Äste, eine Krone aus Büscheln in drei Grüntönen, dunkel
von unten und hell von oben. Ein grüner Kreis auf einem Strich wäre ein
Lutscher; was man wiedererkennt, sind die Lücken dazwischen.

Im fünften steht **der Eimer** (`ABFALLEIMER`, Kursstück `caveBucket`): ein
Blecheimer, oben breiter als unten, mit Henkel, einem Sack obendrauf und einem
roten Schriftband quer über dem Bauch. Im sechsten **der Steinkopf**
(`HOUSE_THADDAEUS`, Kursstück `caveMoai`): schmal oben, breit unten, mit
Krempe, zwei Ohren, einer langen Nase und einer Tür darunter. Dass es ein Haus
ist und kein Felsen, verraten die Augen - es sind Fenster.

In den vier dunklen Gewässern wohnt niemand mehr in einem Haus - dort trifft
man **Bewohner** ([components/dwellers.ts](components/dwellers.ts)). Im
siebten stehen sich **zwei Fische** gegenüber (`NEMO`, Kursstück `caveNemo`,
Vorbild `game_instructions/UBoot/Haus/nemo.jpg`): ein kleiner oranger mit drei
weißen Binden und ein größerer blauer mit gelbem Schwanz. Zwei und nicht
einer: Ein einzelner Fisch ist ein Fisch, zwei, die voreinander stehen, sind
eine Begegnung.

Im achten zieht **der Delfin mit dem Reiter** vorbei (`FLIPPER`, Kursstück
`caveFlipper`, Vorbild `game_instructions/UBoot/Haus/flipper.jpg`). Der Junge
auf seinem Rücken ist nicht Beiwerk: Ein Delfin allein wäre ein Tier wie die
anderen im Spiel, erst der Reiter mit dem hochgerissenen Arm macht daraus den,
den man kennt. Im neunten sitzt **die Meerjungfrau in ihrer Muschel**
(`ARIELLE`, Kursstück `caveArielle`, Vorbild
`game_instructions/UBoot/Haus/ariell.jpg`) - die Muschel steht hinter ihr wie
eine Lehne und macht die Stelle schon von weitem zu einem Ort, lange bevor man
nah genug für ein Gesicht ist.

Und im zehnten wartet, kurz vor dem Wächter, **der grüne Geist** (`HOLLAENDER`,
Kursstück `caveGhost`, Vorbild
`game_instructions/UBoot/Haus/fliegende_holländer.webp`): Dreispitz, Bart,
Schnurrbartlocken, erhobener Säbel, Klaue, und unten statt Beinen ein Schweif.
Er ist das einzige Wesen im Spiel, das leuchtet und trotzdem nichts tut - wer
ihn im Schwarzen auftauchen sieht, hält ihn für den Gegner und merkt erst beim
Vorbeifahren, dass der eigentliche noch kommt.

**Was im Dunkeln steht, leuchtet selbst.** Die sechs Häuser stehen im Hellen,
die vier Bewohner in Gewässern, in denen das Licht aus ist - und eine
Landmarke, die der Schleier frisst, ist keine. Darum trägt jeder von ihnen in
`LANDMARK_GLOW` eine eigene Farbe, und `glimmer` in
[components/render.ts](components/render.ts) zeichnet sie samt Schein noch
einmal **über** die Dunkelheit. Das ist genau dasselbe, was `beacons` für die
leuchtenden Tiere tut, und aus demselben Grund.

**Die Landmarken heißen im Code, wie sie heißen**
([engine/landmarks.ts](engine/landmarks.ts)): `HOUSE_SPONGEBOB`,
`HOUSE_PATRICK`, `KROSSEN_KRABBE`, `HOUSE_SANDY`, `ABFALLEIMER`,
`HOUSE_THADDAEUS`, `NEMO`, `FLIPPER`, `ARIELLE`, `HOLLAENDER`, in der
Reihenfolge ihrer Gewässer. Ein
Buchstabe im Kursplan sagt für sich genommen nichts, und `"L"` an fünf Stellen
im Code ist eine Verabredung, an die sich niemand erinnert. Welcher Strich zu
welcher Landmarke gehört, steht als Tafel in
[components/landmark-art.ts](components/landmark-art.ts) - die nächste ist dort
ein Eintrag und im Zeichner des Grundes keine Zeile.

Zwei Kleinigkeiten mussten dafür mitwachsen: Eine Landmarke ist höher und breiter als
sein Feld, also zeichnet der Grund jetzt drei Felder über den Bildrand hinaus
statt einem - sonst verschwände es an der Kante, bevor es draußen ist. Und was
Zierde ist, steht nicht mehr an fünf Stellen als Aufzählung, sondern einmal als
`isDecor` in [engine/types.ts](engine/types.ts): Die nächste Landmarke kostet
damit eine Zeile und nicht fünf.

**Ein Buchstabe kann nicht beides sein.** Felder und Tiere stehen im selben
Kursplan und werden beide über einen Buchstaben angesprochen - und `K` war
bereits die Panzerkrabbe, als die Bude ihn bekam. Das Ergebnis: Hinter jeder
Krabbe stand plötzlich ein Haus, und zwar in sechs Gewässern gleichzeitig.
Seitdem ist die Bude `L`, und [engine/course.ts](engine/course.ts) vergleicht
beim Laden beide Listen und wirft, wenn sich ein Buchstabe doppelt - der Fehler
zeigt sich dann dort, wo er gemacht wurde, und nicht im Bild.

## Was da unten lebt

Sechs Arten, und sie stehen **als Buchstaben in den Kursstücken**: `F`
Fischschwarm, `Q` Leuchtqualle, `I` Seeigel, `K` Panzerkrabbe, `A` Tiefseeaal,
`T` Anglerfisch. Beim Bauen des Kurses werden daraus Wesen, und das Quadrat
selbst bleibt Wasser - ein Tier ist kein Feld, es schwimmt ja davon.

Alles über sie steht einmal in [engine/beasts.ts](engine/beasts.ts), in
`BREEDS`: wie es heißt, was es aushält, wie groß es ist, wie es sich bewegt, ob
es leuchtet - **und sein Text für die Enzyklopädie**. Damit kann im Wasser
nichts schwimmen, was im Buch fehlt, und im Buch nichts stehen, was es nicht
gibt. Der häufigste Fehler in Spielen mit einem Bestiarium ist ein Eintrag, der
seit drei Versionen von etwas anderem handelt.

| Art          | Hält aus | Bewegung              | Besonderheit        |
| ------------ | -------- | --------------------- | ------------------- |
| Fischschwarm | 1        | zieht zur Seite       | -                   |
| Leuchtqualle | 2        | treibt auf und ab     | leuchtet im Dunkeln |
| Seeigel      | 4        | steht still           | Stiche prallen ab   |
| Panzerkrabbe | 4        | läuft den Grund ab    | -                   |
| Tiefseeaal   | 2        | schießt in Sätzen     | schnell             |
| Anglerfisch  | 5        | **kommt auf dich zu** | leuchtet im Dunkeln |

Die Qualle folgt dabei einer eigenen Vorlage
(`game_instructions/UBoot/qualle.webp`): runde Glocke, dunkle Flecken auf
festen Plätzen, ein heller Streifen oben links, darunter der gewellte Saum und
**vier dicke Arme** - keine dünnen Fäden. Das ist der Unterschied zwischen
einer Qualle und einem Quastenbesen.

Zwei Entscheidungen stecken darin. **Jedes Tier hat ein Zuhause** und entfernt
sich nie weit davon - ein Kurs, dessen Bewohner weglaufen, ist beim zweiten
Versuch ein anderer Kurs, und dann lernt man ihn nie. Und alles außer dem
Anglerfisch ist eine Funktion seiner eigenen Uhr: Der Aal fährt bei jedem
Versuch dieselbe Linie, und genau das macht ihn lernbar.

**Der Seeigel ist die Antwort auf die Frage, wozu man einen Torpedo braucht.**
An seinen Stacheln prallt jeder Stich ab; was ihn aufmacht, ist ein Knall.
Damit kann die teure Waffe etwas, was die billige nicht kann, und zwar nicht
nur schneller, sondern überhaupt.

## Die Waffen

**Geschossen wird dorthin, wo man hinklickt.** Der Zielpunkt kommt als
`input.aim` in die Engine - in _Kurspixeln_, nicht in Bildpunkten. Umgerechnet
wird genau einmal, in [hooks/use-uboot-game.ts](hooks/use-uboot-game.ts):
`x + state.window`, `y - SURFACE`. Ein Zielpunkt in Bildpunkten wäre kein
Zielpunkt, sondern ein Versprechen, das mit jedem Meter, den das Fenster
weiterläuft, ein Stück weiter daneben liegt. Ohne Zielpunkt fliegt der Schuss
geradeaus, denn eine Tastatur hat keinen Ort, auf den sie deuten kann.

Die Engine kennt zwei Arten, etwas kaputt zu machen, und sie sind absichtlich
verschieden:

| Waffe      | Wie sie wirkt                        | Auf eine Mine |
| ---------- | ------------------------------------ | ------------- |
| Harpune    | sticht, `reach: 0`                   | drei Treffer  |
| Torpedo    | sprengt, `reach: 42`, nimmt Fels mit | ein Treffer   |
| Lenkrakete | wie der Torpedo, lenkt selbst nach   | ein Treffer   |
| Seemine    | wird gelegt, `speed: 0`, `reach: 66` | ein Treffer   |

Die Stiche stehen als `dents` im Weltzustand, nach demselben Schlüssel wie
`gone` (`row * cols + col`) und genauso nur für diesen Tauchgang. Und man sieht
sie: Mit jedem Stich fehlt der Mine ein Dorn, die Kugel wird bleicher und ein
Riss läuft über sie. Eine Waffe, bei der man mitzählen muss, statt hinzusehen,
wäre keine.

**Der Torpedo ersetzt die Harpune** und die Lenkrakete den Torpedo, sie kommen
nicht dazu - es ist dasselbe Rohr, nur besser bestückt.

**Die Lenkrakete lenkt nach, sie springt nicht** ([engine/homing.ts](engine/homing.ts)).
Jedes Bild sucht sie das nächste Ziel im Umkreis von 170 Pixeln - in der
Kampagne ein Tier, den Wächter oder eine Mine im Fels, im Endlosen die Tiere -
und dreht mit höchstens 4,5 Bogenmaß je Sekunde darauf zu, bei gleichem Tempo.
Wer knapp daneben zielt, trifft trotzdem; wer in die völlig falsche Richtung
schießt, nicht. Sie lebt drei Sekunden statt 2,6, damit sie die Kurve auch zu
Ende fliegen kann, und trägt ein rotes Suchlicht an der Nase. Im Endlosen, wo
das Boot immer voll ausgebaut ist, ist sie die Waffe im Rohr. Die Seemine kommt dazu, hat ihre eigene Uhr (`laid`) und
blockiert das Rohr nicht: Sie wird nicht geschossen, sondern platziert, bleibt
liegen, wo man sie gelassen hat, und geht nach 2,4 Sekunden hoch. Deshalb steht
sie trotzdem in `shots` - was sie unterscheidet, ist nur, dass ihre
Geschwindigkeit null ist.

## Die letzte Fahrt ist drei Fahrten

Das zehnte Gewässer ist dreizehn Stücke lang und enthält alle drei Sorten
Wasser in der Reihenfolge, in der man sie gelernt hat: vier Stücke offenes
Wasser mit Luft über einem, drei Stücke Höhle, in der man noch sieht, vier
Stücke Finsternis - und dann die Arena.

Dass es dunkel wird, steht nicht als Prozentzahl im Kurs, sondern als
`dusk: { from: 7, to: 8 }`: **gezählt wird in Stücken.** Das Licht geht über
dem achten Stück aus, also genau dort, wo die Höhle enger wird. Schiebt man
später ein Stück dazwischen, wandert die Dämmerung mit, statt plötzlich in der
falschen Höhle zu liegen.

| Anteil | Stück      | dunkel |
| ------ | ---------- | ------ |
| 30 %   | spires     | 0,00   |
| 45 %   | caveWave   | 0,00   |
| 54 %   | caveNarrow | 0,02   |
| 58 %   | caveNarrow | 0,54   |
| 62 %   | caveTeeth  | 1,00   |

## Die Enzyklopädie zeichnet, was sie beschreibt

Das Buch ([components/codex-board.tsx](components/codex-board.tsx)) ruft für
jeden Tiereintrag dieselbe Zeichenfunktion auf wie das Spiel
([components/creatures.ts](components/creatures.ts)). Was im Buch steht, sieht
deshalb genau so aus wie das, was einen eben umgebracht hat - und niemand muss
ein zweites Bild malen, wenn sich eine Qualle ändert.

Vier Kapitel: die Geschichte samt dem Affen, die Bewohner, was im Wasser liegt,
und was man selbst dabeihat. Kein Suchfeld: Zwanzig Einträge liest man
schneller, als man tippt.

**Zwei Tafeln nebeneinander**, nach dem Vorbild aus
`game_instructions/UBoot/enzyklodädie.png`: links ein Gitter aus Bildern unter
dem Kapitelnamen, rechts das eine, das gerade offen ist - groß im hellen
Rahmen, darunter der Name in Gold, der Text und zuletzt seine Kurzangaben.
Was angewählt ist, trägt einen gelben Rahmen.

Der Unterschied zur früheren Liste ist nicht die Hübschheit, sondern das
Suchen: In einer Liste liest man Überschriften, bis die richtige kommt; in
einem Gitter sieht man das Tier, das einen eben umgebracht hat, und klickt
darauf. **Deshalb stehen in den Kacheln keine Namen** - stünde einer darunter,
läse man wieder.

Die große Fläche ist **breiter als hoch**, und auch das hat einen Grund: Der
Anglerfisch trägt seine Rute weit vor sich her. Auf einem Quadrat wäre
entweder die Rute abgeschnitten oder der Fisch eine Briefmarke.

## Der Wächter

Am Ende der zehnten Fahrt bleibt das Fenster stehen
([engine/engine.ts](engine/engine.ts), `windowAt`) - ein Kampf, bei dem der
Ausschnitt weiterwandert, ist kein Kampf, sondern eine Flucht mit Zuschauer.
Der Wächter zieht auf und ab und wirft **einen Fächer aus drei Strahlen**
dorthin, wo man gerade war; was ihn trifft, sind die eigenen Schüsse **und
alles, was in seiner Nähe hochgeht** (sonst wäre eine Seemine, die eine
Armlänge neben ihm liegt, nur Dekoration).

Drei Dinge machen ihn zu einem Gegner statt zu einer Zielscheibe:

- **Sein Leib tut weh** (`grabbed`). Ohne das wäre der sicherste Platz im
  ganzen Kampf mitten in ihm drin - dort trifft jede Harpune, und seine Tinte
  entsteht erst an seinem Rand und fliegt vorbei.
- **Er wirft einen Fächer.** Einem einzelnen Strahl weicht man mit einem
  Tastendruck aus, ohne das Zielen zu unterbrechen; durch drei muss man
  hindurchsteuern.
- **Angeschlagen wirft er schneller** (`GUARD.frenzy`): Unter der halben Hülle
  sinkt die Wurfpause auf sechzig Prozent. Die zweite Hälfte des Kampfes ist
  die schwerere, sonst wäre er nach dem ersten Treffer entschieden.

Er hält achtzehn Harpunentreffer aus - ein Torpedo nimmt drei davon auf
einmal.

Er ist das Ziel: Die Linie hinter ihm zählt erst, wenn er unten ist - sonst
schwimmt man an ihm vorbei und hätte "gewonnen".

Gezeichnet wird er **nach** der Dunkelheit und mit eigenem Leuchten. Ein
Gegner, den der Schleier verschluckt, ist kein Kampf, sondern ein Ratespiel -
und in dieser Tiefe leuchtet ohnehin fast alles, was lebt.

Balance, mit einem Bot gemessen, der Abstand hält, auf ihn zielt und der
Tinte ausweicht:

| Ausrüstung                   | Ergebnis                           |
| ---------------------------- | ---------------------------------- |
| ohne Waffe, 4 Hüllen         | verloren nach 23,1 s               |
| Harpune, 2 Hüllen            | gewonnen nach 9,8 s, 0 Treffer     |
| Harpune, 4 Hüllen, Antrieb 3 | gewonnen nach 9,7 s, 1 Treffer     |
| Torpedo, 3 Hüllen            | gewonnen nach 29,4 s, 1 Treffer    |
| Torpedo, 4 Hüllen, Antrieb 3 | verloren nach 14,8 s, er bei 15/18 |
| Alles                        | gewonnen nach 13,0 s, 1 Treffer    |

Dass derselbe Bot mit demselben Boot mal gewinnt und mal nicht, ist kein
Messfehler, sondern genau das Band, in dem ein Endgegner liegen soll: Ohne
Waffe kommt niemand vorbei, mit Waffe entscheidet, wie man fährt.

## Auszeichnungen, die nicht gespeichert werden

Fünf Stück: drei für je eine vollständige Stufe, eine für den Wächter, eine für
alle zehn Gewässer auf "Unmöglich" ([settings/awards.ts](settings/awards.ts)).
**Keine davon steht im Spielstand.** Eine Auszeichnung ist kein Besitz, sondern
eine Feststellung über die gemeisterten Gewässer - und wird deshalb aus ihnen
ausgerechnet statt nebenher mitgeschrieben. Ein Haken, der beim Speichern
verlorengeht, kann so nicht entstehen, und wer ein Gewässer nachholt, bekommt
die Auszeichnung im selben Moment.

Auf der Tafel stehen auch die, die man noch nicht hat, mitsamt ihrer
Bedingung - eine Tafel, die nur Erreichtes zeigt, ist eine Liste; eine, die
alles zeigt, ist ein Ziel.

**Gebaut nach `game_instructions/UBoot/erfolge.png`**: breite Karten in drei
Reihen, und gerollt wird nach rechts. Links das Zeichen, rechts Name und Text,
unten ein Balken. **Jede Karte ist gleich groß** - eine Tafel, auf der die
geschafften Felder größer sind als die offenen, liest sich als Rangliste und
nicht als Ziel. Dafür ist der Text auf drei Zeilen beschnitten und die Höhe
gedeckelt: Auf dem Telefon nimmt das Blatt den ganzen Bildschirm, und drei
Karten über neunhundert Pixel wären drei Plakate.

**Angefasst wird der Streifen auch mit der Maus.** Auf dem Telefon wischt man
ohnehin - am Rechner gäbe es sonst nur die Rollleiste ganz unten, und die muss
man mit dem Zeiger suchen, statt die Tafel einfach weiterzuschieben. Gezogen
wird dabei **die Tafel und nicht der Blick**: Die Karten folgen der Hand wie
Papier unter dem Finger - nach links gezogen laufen sie nach links, und von
rechts kommen die nächsten herein. Die Rollleiste macht es andersherum, und das
ist kein Widerspruch, sondern der Unterschied zwischen einem Griff und dem
Blatt selbst: Wer am Griff zieht, verschiebt den Ausschnitt; wer aufs Blatt
fasst, verschiebt das Blatt.

**Die Rollleiste gehört dabei dem Browser.** Ein Saum von vierzehn Pixeln am
unteren Rand startet unseren Griff gar nicht erst - sonst zögen zwei an
derselben Tafel, und unsere Richtung gewänne, weil wir in jedem Bild neu
setzen. Genau das drehte das Ziehen am Griff um. Der Saum ist fest und nicht
aus der Leistenhöhe gerechnet: Schwebt die Leiste über dem Inhalt, wie auf dem
Mac und in neueren Browsern, ist diese Höhe null. Finger und
Stift bleiben dabei außen vor: Dort wischt der Browser schon selbst, und zwei
Hände am selben Streifen ruckeln. **Markieren lässt sich auf der Tafel nichts**
(`select-none`) - sonst zöge man beim Schieben den halben Text blau.

**Unten steht, wie weit man ist**, und nicht nur, dass es noch nicht reicht
(`progressOf`): „1/3" für die Höhlen, „0/10" für alle Gewässer auf Unmöglich,
„0/1" für eine Landmarke. „Noch offen" ist dasselbe für den, dem ein Gewässer
fehlt, und für den, der noch nie getaucht ist - und genau dieser Unterschied
ist das, was jemanden noch einmal hinunterschickt.

## Zehn Haken für zehn Landmarken - und die eine Ausnahme

Dazu kommen zehn weitere, eine je Landmarke: Wer an der Ananas, am Steinkopf,
an der Meerjungfrau vorbeigefahren ist, bekommt dafür einen Haken und **zwei
Sätze darüber, was dort steht**. Der graue Haken verrät vorher nur das
Gewässer; die Beschreibung steht erst da, wenn er leuchtet. Eine Landmarke, die
auf der Tafel beschrieben ist, bevor man sie gesehen hat, ist keine Entdeckung
mehr.

Diese zehn sind **die Ausnahme von der Regel oben**: Vorbeigefahren zu sein
lässt sich aus den gemeisterten Gewässern nicht ausrechnen, denn eine Landmarke
steht mitten im Kurs und nicht an seinem Ende. Also steht sie doch im
Spielstand - `Profile.seen`, eine Liste von Buchstaben
([settings/profile.ts](settings/profile.ts)).

**Geschrieben wird im Moment des Vorbeifahrens, nicht am Ziel.** Wer an der
Ananas vorbei ist und zwei Felder später auf eine Mine fährt, war trotzdem
dort - und genau so verhält sich der Haken auch. Dafür sammelt
[engine/course.ts](engine/course.ts) beim Auslegen ein, wo die Landmarken
stehen (`Course.marks`), und `passedMarks` beantwortet pro Bild die Frage
"woran bin ich schon vorbei" aus einer Liste von zwei Einträgen statt aus
dreitausend Quadraten. Vorbei heißt dabei wirklich vorbei: ein Feld Zugabe,
weil eine Landmarke breiter ist als ihr Quadrat und man den Haken sonst bekäme,
während sie noch neben einem steht.

**Gemeldet wird sie auch.** Sobald eine Auszeichnung dazukommt, fällt oben in
der Mitte des Fensters ein kleiner Zettel ein, bleibt vier Sekunden stehen und
geht wieder ([components/award-toast.tsx](components/award-toast.tsx)). Gefunden
wird sie dabei wie auf der Tafel - aus dem **Unterschied zweier Spielstände**
([hooks/use-award-news.ts](hooks/use-award-news.ts)) und nicht dadurch, dass
irgendeine Stelle im Code sie "vergibt": Eine Auszeichnung ergibt sich aus dem
Profil, und wer sie vergeben wollte, müsste an jede Stelle denken, die das
Profil anfasst - an das Vorbeifahren, an das Ziel, an die Werkstatt, an "alles
freischalten". So ist jede abgedeckt, auch die nächste. Beim ersten Blick wird
nur gemerkt und nicht gemeldet, sonst bekäme jeder beim Öffnen der Seite seine
halbe Tafel als Neuigkeit; und mehr als drei Zettel auf einmal gibt es nicht,
weil "alles freischalten" sonst fünfzehn übereinanderstapelt.

Dass in jedem Bild gefragt und fast nie geschrieben wird, trägt `withSeen`:
Kommt nichts dazu, gibt es **dasselbe Profil** zurück, und der Aufrufer sieht
an einem Vergleich, dass er nichts zu speichern hat.

## Der Schlund: ein zweites Spiel im selben Fenster

Unten links auf der Seekarte liegt ein Strudel, der nicht zur Route gehört.
Dahinter steckt der **Endlosmodus** ([endless/](endless/)) - und der ist in
fast allem das Gegenteil der Kampagne:

|            | Kampagne                           | Schlund                                      |
| ---------- | ---------------------------------- | -------------------------------------------- |
| Ausschnitt | ein Fenster, das nach rechts läuft | eine Kamera am Boot, in alle Richtungen      |
| Karte      | 14 Reihen tief, fest geschrieben   | 72 × 46 Felder, aus Stufe und Saat gewachsen |
| Boot       | das, was du gekauft hast           | immer der Vollausbau                         |
| Ende       | das Tor am rechten Rand            | keins                                        |

**Deshalb steht er daneben und nicht darin.** Ein Weltzustand, der beides
kann, könnte am Ende keines von beidem richtig; die zehn Gewässer sind fertig,
und sie sollen fertig bleiben. Gemeinsam genutzt wird, was die Dinge aussehen
lässt, wie sie aussehen: dasselbe Boot ([components/sub.ts](components/sub.ts)),
dieselben Bewohner ([components/creatures.ts](components/creatures.ts)),
dieselbe Steuerung ([hooks/controls.ts](hooks/controls.ts)) und derselbe Ton.
Ein Endlosmodus, der aussieht wie ein anderes Spiel, wäre einer.

**Die Karte wächst aus zwei Zahlen**, Stufe und Saat
([endless/world.ts](endless/world.ts)). Das ist kein Geiz, sondern die
Voraussetzung für den Koop: So muss keine Karte über die Leitung, der Gast baut
sich aus denselben zwei Zahlen dieselbe. Nach unten wird der Fels dichter, nach
Stufe hin werden es mehr und zähere Bewohner - und welche Art überhaupt
mitspielt, hängt an der Stufe: Was man in der Kampagne erst spät trifft, kommt
auch hier erst spät dazu.

**Fels hält auf, er tut nicht weh.** In der Kampagne ist eine Wand tödlich,
weil das Fenster einen hineindrückt; hier fährt man ganze Stufen an Wänden
entlang, und ein Treffer fürs Streifen wäre keine Hürde, sondern eine Strafe
fürs Umsehen. Wehtun können die Bewohner - und genau die sind der Grund, hier
unten zu sein. Ein Torpedo macht trotzdem eine Tür in den Fels, so wie überall.

**Links ist eine Richtung, kein Rückwärtsgang.** Ohne Fenster gibt es kein
Vorn, also dreht sich das Boot um, wenn es nach links fährt - gespiegelt und
nicht gedreht, denn gedreht sähe es aus, als läge es auf dem Rücken. Dass es
sich dabei nicht neigt, gilt hier wie dort.

**Je tiefer, desto weniger.** Die Dunkelheit hängt an der Tiefe und nicht am
Gewässer; unten bleiben der Scheinwerfer und das Sonar. **Das Sonar läuft dabei
von der ersten Sekunde an**, und es malt denselben Strich wie in der Kampagne:
gelbe Umrisse um Fels und Bewohner, am hellsten dort, wo der Ring gerade
vorbeiläuft. Hier unten fährt man den Vollausbau - ein Gerät, das erst in der
Tiefe angeht, sähe aus wie ein Fehler und nicht wie Ausrüstung. Im Hellen
spricht es leiser, weil seine Helligkeit an der Tiefe hängt. Das ist auch der
Grund, warum man hier mit dem Vollausbau startet: Wer den Schlund fährt, will
nicht sparen, sondern wissen, wie lange er durchhält.

**Vier Gegenstände, von der Panzerkiste geliehen:** Schild, Schnellfeuer,
Fächerschuss - und die Rettung, die nur fällt, solange wirklich jemand unten
liegt. Sie sind dort erprobt, und wer beide Spiele spielt, muss nichts Neues
lernen.

## Zu zweit im Schlund

Der Koop läuft wie der der Panzerkiste, weil er dort funktioniert: **Der Host
rechnet, der Gast schaut zu.** Jedes Bild bringt der Host die Welt mit seinen
eigenen Tasten als Boot eins und den gestreamten Tasten des Gastes als Boot
zwei weiter und veröffentlicht sie zwanzigmal in der Sekunde
([multiplayer/net.ts](multiplayer/net.ts),
[hooks/use-uboot-online.ts](hooks/use-uboot-online.ts)). Verschickt wird der
Zustand, wie er ist - er ist klein genug. Die Karte bleibt daheim.

**Wer stirbt, ist in der nächsten Stufe wieder dabei.** Er wird nicht aus der
Liste genommen, sondern umgelegt: Er bleibt im Bild, und beim Stufenwechsel
steht er wieder. Vorbei ist es erst, wenn in derselben Stufe beide untergehen.
Ein Fehler kostet damit die Stufe und nicht den Abend - und das ist der ganze
Unterschied zwischen einem Koop, den man zu zweit spielt, und einem, bei dem
einer zusieht.

## Das Fenster ist das Spiel

Der Ausschnitt wandert von allein nach rechts, und niemand fällt hinten heraus:
Wer den hinteren Rand berührt, wird mitgeschoben. Innerhalb des Fensters ist man
frei.

Damit ist aus einem Hindernis-Parcours ein Spiel mit **Rhythmus** geworden.
Vorwärtsfahren kauft Platz, den man vor der nächsten engen Stelle wieder
ausgibt - stehenbleiben und schauen kostet genau diesen Platz.

Zwei Dinge daran waren Arbeit:

**Der hintere Rand darf keine Falle sein** ([engine/engine.ts](engine/engine.ts),
`heldInside`). Die erste Fassung setzte die Geschwindigkeit auf null, sobald das
Boot gegen einen Rand lief - sinnvoll am vorderen Rand, tödlich am hinteren: Der
Motor fing dort jedes Bild bei null an, während das Fenster weiterlief, und wer
einmal hinten hing, kam nie wieder weg. Jetzt **erbt** das geschobene Boot das
Tempo des Fensters; ein Druck aufs Gas reicht, um sich zu lösen.

**Und wer vorn fährt, zieht das Fenster mit** (`chasing`): Ab der Mitte legt
das Wasser zu, ganz vorn auf das **Dreifache** - deutlich schneller, als das
Boot selbst je fährt. Das ist Absicht und regelt sich von selbst: Wer sich nach
vorn schiebt, wird zügig eingeholt und steht dann wieder in der Mitte, wo das
Fenster gemächlich läuft. Ein Gummiband, kein Wettrennen, und der vordere Rand
ist damit ein Ort, an dem man kurz ist und nicht einer, an dem man wohnt.

Nachgemessen: 84 px/s bis 55 % der Fensterbreite, 140 bei 70 %, 177 bei 80 %,
230 ganz vorn.

**Und das Fenster bleibt am Ende stehen** (`windowAt`): Es hält eine
Bildschirmbreite vor dem Ziel an. Die letzten Meter gehören dem Spieler, nicht
dem Rennen.

## Die Karten sind Text, und zwar in Bausteinen

Ein Kurs ist ASCII: `#` Fels, `M` Mine, `~` Seetang, `.` Wasser, `S` Start,
`Z` Ziel - dieselbe Idee wie bei der [Panzerkiste](../panzerkiste), eine Karte,
die man im Editor **sieht**.

Nur ist ein Kurs hier über hundert Spalten lang, und eine Zeile mit hundert
Zeichen kann niemand zählen. Deshalb besteht ein Kurs aus **Bausteinen** zu 16
Spalten ([engine/levels.ts](engine/levels.ts)), und ein Kurs ist eine Liste von
Namen:

```ts
{ name: "Das Riff", pieces: ["start", "spires", "mines", "narrow", ...] }
```

Ein neues Hindernis ist ein Eintrag mehr und steht sofort jedem Kurs zur
Verfügung. Das vollständige Format steht in
[docs/games/uboot/levels.md](../../../../docs/games/uboot/levels.md).

**Fels wächst von unten, Minen schweben oben.** Das ist keine Kosmetik, sondern
die Form des Spiels: Unten ist die Gefahr Stein, den man von weitem sieht, oben
sind es Stacheln, nach denen man suchen muss.

## Erfahrung, Ausbau, und warum nichts davon schiefgehen kann

Ein gemeistertes Gewässer zahlt Punkte, ein wiederholtes ein Viertel davon
([settings/profile.ts](settings/profile.ts)). Ausgegeben wird in sechs Bahnen:
Sauerstoff, Rüstung, Bewaffnung, Beleuchtung, Tiefenruder, Antrieb
([engine/upgrades.ts](engine/upgrades.ts)).

**Gespeichert wird, was verdient wurde - nie, was übrig ist.** Was ein Boot
gekostet hat, wird aus den Stufen selbst ausgerechnet (`spentOn`). Damit ist
„alles zurückholen" eine Zeile - man händigt frische Stufen aus, und die ganze
Summe ist wieder frei - und es kann weder Punkte verlieren noch welche
erfinden, egal was wann in welcher Reihenfolge gekauft wurde.

**Die Werkstatt ist eine Tafel, kein Formular**
([components/upgrade-board.tsx](components/upgrade-board.tsx)) - gebaut nach
`game_instructions/UBoot/verbesserungen.png`: **der Baum füllt das Blatt**,
unten die sechs Bahnen, darüber ihre Stufen als achteckige Felder, dazwischen
Verbindungen. Links oben führt der Weg zurück zur Seekarte, rechts oben stehen
die freien Punkte und gleich daneben der Knopf, der alles wieder herausholt.
Keine Tafel an der Seite mehr.

Beides oben rechts, weil es dasselbe ist: Die Zahl und das Zurückholen handeln
von denselben Punkten, und wer sieht, dass ihm welche fehlen, greift als
Nächstes genau daneben. Eine Rückfrage gibt es dort nicht - es geht nichts
verloren, jeder Punkt kommt zurück und kann sofort wieder ausgegeben werden.

Der Ablauf ist **einmal tippen zum Ansehen, nochmal tippen zum Einbauen**. Was
eine Stufe kostet, steht auf dem Feld; was sie tut, braucht einen Satz, und
einen Satz liest niemand auf achtzig Pixeln - also steht er in einer
Sprechblase **am Feld selbst**, mit einer letzten Zeile, die sagt, was das
zweite Tippen bewirkt oder warum es nichts bewirkt („erst die Stufe darunter",
„dafür reichen die Punkte noch nicht"). Eine Erklärung drei Handbreit neben
dem, was sie erklärt, liest man beim dritten Mal nicht mehr.

Ein Klick für beides wäre eine Falle: Wer stöbert, soll dabei keine Punkte
ausgeben. Zwei Klicks sind der kürzeste Weg, der beides kann - und gekauft wird
nur, was wirklich als nächstes dran und bezahlt ist; sonst bleibt es beim
Zeigen.

Am Rand kippt die Blase nach innen: Die äußerste Bahn ist auf dem Telefon nur
einen Daumen vom Blattrand entfernt, und eine Blase, die zur Hälfte daneben
hängt, erklärt die Hälfte.

**Die Blase fängt keine Klicks ab und geht bei einem Klick daneben wieder zu.**
Sie deckt die Nachbarfelder halb zu - also zeigt ein Klick auf so ein Feld
dessen eigene Blase, statt in der fremden zu versanden
(`pointer-events-none`). Und wer irgendwo sonst ins Blatt fasst, meint sie
nicht mehr: Das Blatt schließt sie, die Felder halten ihren Klick dafür auf,
sonst ginge sie im selben Augenblick wieder auf.

**„Alles freischalten" steht oben rechts neben dem Zurückholen** - und nur
dann da, wenn es reicht. Wer alles bezahlen kann, soll nicht fünfzehnmal tippen
müssen; der Knopf erscheint aber erst, wenn die freien Punkte für sämtliche
fehlenden Stufen langen. Sonst wäre „alles" eine Behauptung, und man müsste
hinterher nachsehen, was davon wirklich eingebaut wurde. Damit steht alles, was
mit Punkten zu tun hat, in derselben Ecke: Stand, alles kaufen, alles
zurückholen.

**Die Tafel rollt nicht.** Ein Ausbaubaum, von dem man die Hälfte erst
herunterziehen muss, ist keine Übersicht mehr - also sagt das Blatt
(`scroll={false}` an [components/panel.tsx](components/panel.tsx)), dass sein
Inhalt hineinpasst, und der Baum hält sich daran: Die Felder sind eine Nummer
kleiner, solange das Fenster schmal ist, und die Sprechblase des **obersten**
Feldes kippt nach unten auf. Über ihm ist der Rand, und eine abgeschnittene
Erklärung erklärt nichts.

**Die Symbole sind gezeichnet, nicht aus der Emoji-Tabelle**
([components/upgrade-icons.tsx](components/upgrade-icons.tsx)) - und zwar
genau deshalb: Eine Stufe muss man **sehen** können, ohne zu lesen, und dafür
muss das Zeichen mitwachsen. Es gibt aber kein Emoji für „zwei Blasen" oder
„eine größere Schraube", es gibt nur immer dasselbe. Also sind es ein paar
Pfade in SVG:

| Bahn        | Was von Stufe zu Stufe wächst                       |
| ----------- | --------------------------------------------------- |
| Sauerstoff  | eine Blase mehr, von einer bis vier                 |
| Rüstung     | eine Panzerplatte mehr auf dem Schild               |
| Waffen      | Harpune, Torpedo, Lenkrakete, Seemine - vier Formen |
| Licht       | Scheinwerfer mit Kegel, dann Sonarbögen             |
| Tiefenruder | ein Winkelpaar mehr, nach oben und nach unten       |
| Antrieb     | ein Blatt mehr an der Schraube, und eine größere    |

Zwei Kleinigkeiten daran waren nötig, damit es funktioniert: Die Schraube
fängt bei **drei** Blättern an (zwei ergeben zwei Ellipsen auf einer Linie -
das liest sich als Stab), und die Blätter stehen **schräg** (gerade Blätter
sind Blütenblätter).

Die Farben tragen dabei je genau eine Bedeutung: **Messing** ist alles, was man
hat oder haben kann, **Stahl** der Rest, und **Grün** ausschließlich das Feld,
auf das man gerade getippt hat. Wäre auch das Bezahlbare grün, könnte man das
eine vom anderen nicht unterscheiden.

**Und wer alles bezahlen kann, muss nicht fünfzehnmal klicken.** Solange nichts
angetippt ist, steht auf der Tafel ein Knopf _Alles freischalten_ - aber nur,
wenn die freien Punkte für **sämtliche** fehlenden Stufen reichen. Sonst wäre
"alles" eine Behauptung, und man müsste hinterher nachsehen, was davon wirklich
eingebaut wurde.

Das Zurücksetzen fragt **nicht** nach - dabei geht nichts verloren: Jeder Punkt
kommt sofort zurück und kann neu vergeben werden. Eine Sicherheitsfrage stünde
nur dem im Weg, wofür der Knopf da ist, nämlich ein anderes Boot auszuprobieren.

Alle zehn Gewässer beim ersten Mal bringen **980 EP**, genau so viel wie der
volle Ausbau. Unterwegs ist die erste Frage also nicht, wann man alles hat,
sondern **welches Boot** man will - eines, das vier Treffer
aushält, ist ein anderes als eines, das im Dunkeln sieht.

Und die Engine weiß von all dem nichts. Sie bekommt ein {@link Gear} - Luft,
Hülle, Waffe, Licht, Ruder - und kennt weder Punkte noch Preise. Eine sechste
Bahn wäre eine Änderung an genau einer Datei.

## Ankommen

Ein geschaffter Kurs endet nicht mit einer Meldung, sondern mit einer Feier:
Das Boot hebt sich, die Nase kommt hoch, die Schraube dreht weiter, ein Schwall
Blasen steigt über das ganze Bild und es leuchtet kurz golden auf
([components/render.ts](components/render.ts), `cheer`). Das passiert **auf dem
Wasser**, nicht im Blatt darüber - gefeiert wird der Tauchgang und nicht die
Schaltfläche.

Darüber springt die Zielflagge, und die Punkte laufen von null auf das hoch,
was es gab. Eine Zahl, die einfach dasteht, ist etwas, das man liest; eine, die
hochläuft, ist etwas, das man bekommen hat. Dann zwei Knöpfe: **Weiter** führt
zurück auf die Seekarte, wo das nächste Gewässer gerade aufgegangen ist, und
**Kurs wiederholen** beginnt denselben noch einmal.

## Vorwärts ist immer die schnellere Richtung

Der Antrieb wirkt auf beide Richtungen, aber **rückwärts bleiben davon sechzig
Prozent** ([engine/engine.ts](engine/engine.ts), `ASTERN`) - auf jeder
Ausbaustufe, nachgemessen im freien Wasser:

| Antrieb | vorwärts | rückwärts | Anteil |
| ------- | -------- | --------- | ------ |
| ab Werk | 116 px/s | 70 px/s   | 0,60   |
| Stufe 1 | 139 px/s | 83 px/s   | 0,60   |
| Stufe 2 | 162 px/s | 97 px/s   | 0,60   |
| Stufe 3 | 185 px/s | 111 px/s  | 0,60   |

Das ist keine Kosmetik. Eine Schraube, die rückwärts genauso zieht, macht aus
dem wandernden Fenster etwas, dem man einfach rückwärts davonfährt - und damit
aus der einzigen Regel des Spiels eine Empfehlung. Rückwärts ist zum Warten und
für die Korrektur im letzten Moment da, und es soll sich auch so anfühlen. Das
Fenster läuft mit 84 px/s: Schon ab Werk kommt man vorwärts davon, rückwärts
nie.

## Dunkelheit, die man sich wegkaufen kann

Jedes Gewässer hat einen Wert `dark` von 0 bis 1. Der Renderer legt daraus einen
Schleier über das Bild, mit einem Loch dort, wo das Boot ist - ein Radius, und
ein Radius ist genau das, was ein radialer Verlauf kann
([components/render.ts](components/render.ts), `night`). Der Scheinwerfer macht
das Loch größer und legt einen Kegel nach vorn; das Sonar zeichnet Umrisse weit
außerhalb davon, in Gelb - was das Sonar zeigt, ist kein Licht, sondern eine
Auskunft, und die muss sich von allem unterscheiden, was man wirklich sieht.

**Ohne Licht ist das Loch kaum größer als das Boot selbst** (50 Pixel, danach
in 100 Pixeln nach Schwarz). Wer in die finsteren Gewässer fährt, ohne einen
Scheinwerfer gekauft zu haben, merkt das an der ersten Wand und nicht erst am
Ende des Kurses. Der Scheinwerfer macht daraus 130 Pixel plus den Kegel nach
vorn - immer noch wenig, und genau deshalb ist das Sonar die zweite Stufe.

**Die ersten drei Gewässer sind taghell**, und das ist kein Zufall: Dunkelheit
ist etwas, das das Spiel einem antut, **nachdem** es einem die Mittel dagegen
gegeben hat - niemals vorher.

## Ein Boot ist drei Kreise

Die Kollision prüft drei Scheiben entlang des Rumpfes gegen die Quadrate, die
sie berühren ([engine/engine.ts](engine/engine.ts), `touching`). Ein Rechteck
hätte Ecken, und eine Ecke, die an einem Felsen hängenbleibt, durch den der
Spieler Tageslicht sieht, macht ein Ausweichspiel kaputt.

Ein Treffer kostet eine Hülle, schiebt das Boot vom Hindernis weg und macht es
für 1,3 Sekunden unverwundbar. Ohne diese Sekunden wäre Rüstung keine Rüstung,
sondern eine kürzere Lunte: Ein einziger Fels nähme in der Drittelsekunde, die
man braucht, um von ihm herunterzukommen, sämtliche Stufen auf einmal.

**Was der Torpedo wegsprengt, ist nur dieser Tauchgang.** Die Karte bleibt, wie
sie geschrieben ist; zerstörte Quadrate stehen als Nummern im Weltzustand
(`gone`), und jede Frage nach „ist da Fels" geht durch `solidAt`, das beides
fragt.

## Nachgemessen

Sonden über die Engine, nicht im Browser:

| Was                                | Ergebnis                              |
| ---------------------------------- | ------------------------------------- |
| Alle zehn Kurse durchtauchbar      | ja, auch nach dem Weiten der Höhlen   |
| Harpune auf Fischschwarm / Qualle  | 1 bzw. 2 Treffer, dann weg            |
| Harpune auf Seeigel                | 29 Schüsse, hält stand                |
| Torpedo auf Seeigel                | weg nach 2 Schüssen                   |
| Ein Tier berühren                  | eine Hülle, dann 1,3 s unverwundbar   |
| Torpedo auf grauen Fels            | hält stand                            |
| Torpedo auf Bruchfels              | Loch nach 0,3 s                       |
| Bestleistung nach Unmöglich/Leicht | bleibt Unmöglich                      |
| Luft ohne Ausbau / voll ausgebaut  | 70 s / 150 s, Ende jeweils exakt dort |
| Rüstung Stufe 3                    | 4 Treffer, dann vorbei                |
| Harpune schräg auf eine Mine       | Stiche nach 0,35 / 0,77 / 1,18 s      |
| Harpune ohne Zielpunkt             | fliegt geradeaus, trifft nicht        |
| Torpedo schräg auf dieselbe Mine   | weg nach 0,62 s                       |
| Torpedo auf Fels                   | räumt 4 Felder                        |
| Gelegte Seemine                    | bleibt auf x, Knall nach 2,38 s       |
| Kauf über dem Punktestand          | wird nicht ausgeführt                 |
| Zurücksetzen                       | Punkte vollständig zurück             |

Der letzte Kurs ist 208 Spalten lang: reine Fahrzeit 50 Sekunden mit dem Boot
von der Stange, 31 mit vollem Antrieb - bei 70 Sekunden Standardtank, und der
Kampf kommt noch obendrauf. Das ist so gewollt: Er ist von der Stange
theoretisch zu schaffen und praktisch eine Ansage. Luft holen kann man nur im
ersten Drittel, danach ist Fels über einem.

Tempo, gemessen nach sechs Sekunden Vollgas:

| Antrieb | vorwärts | Fenster |
| ------- | -------- | ------- |
| keiner  | 140 px/s | 84 px/s |
| Stufe 1 | 168 px/s | 84 px/s |
| Stufe 2 | 195 px/s | 84 px/s |
| Stufe 3 | 223 px/s | 84 px/s |

Den Deckel setzt dabei nicht `MAX_VX`, sondern der Wasserwiderstand: Schub
geteilt durch `DRAG` ist die Geschwindigkeit, bei der das Boot aufhört
schneller zu werden.

## Der Schub ist das, was man sieht

Hinter der Schraube steht kein Blasenstrom, sondern **aufgewühltes Wasser**.
Blasen steigen auf, und ein Boot, das Luft verliert, hat ein Loch; Wasser
bleibt, wo es ist, und fällt zurück.

**Man sieht das Boot von der Seite, also auch den Strudel.** Von der Seite ist
ein Schraubenstrudel kein Kreis: Jedes Blatt zieht einen Wirbelfaden hinter
sich her, der sich um die Fahne windet - und eine Schraubenlinie, von der Seite
gesehen, ist eine Welle. Gezeichnet werden deshalb zwei solche Wellen, die nach
hinten aufgehen, langsamer werden und auslaufen, dazu Schlieren im Strahl.

Zwei solche Wellen sahen allerdings aus wie eine Schlange. Was daraus eine
**Strömung** macht, ist die Menge und die Unschärfe: dreizehn Fäden, jeder mit
eigener Weite, eigenem Takt, eigenem Tempo, eigener Länge und eigener
Mittellinie - und jeder **zweimal** gezeichnet, einmal breit und fast
durchsichtig als Dunst, einmal dünn als Faden darin. Wo sich viele überlagern,
wird das Wasser hell; wo nicht, bleibt es Wasser.

Dazu strecken sich die Windungen nach hinten (`stretch`), weil der Strahl
langsamer wird, je weiter er weg ist, und jedes Stück zittert ein wenig
(`jitter`) - umso mehr, je weiter es weg ist. Wasser ist nicht symmetrisch.

Gezeichnet wird in Bändern mit je einem `Path2D`: Ein Strich kann in Canvas
nicht entlang seiner Länge ausblenden, und ohne Ausblenden hörte die Fahne mit
einer Kante auf. Fünf Bänder je Faden statt zwanzig Einzelstücken halten das
bei dreizehn Fäden bezahlbar.

Wie stark der Wirbel ist, hängt an `state.wash` - **der Hand am Hebel, nicht
der Geschwindigkeit**. Der Wert baut sich in einer Sekunde auf und in einer
Sekunde wieder ab (`WASH_TIME`). Daran hängt dreierlei: wie schnell die
Schraube dreht, wie deutlich sich ihre Blätter zur Scheibe verwischen, und wie
weit die Fahne nach hinten reicht. Weil auch die _Länge_ mitwächst, wächst der
Wirbel aus der Schraube heraus, statt in voller Länge aufzutauchen.

Die Drehung selbst steht als `state.spin` im Weltzustand, in Umdrehungen
aufsummiert. Aus `time * tempo` gerechnet würde sie bei jeder Tempoänderung
springen - man multipliziert dann eine wachsende Zeit mit einer neuen Zahl, und
das Bild macht einen Satz.

| Nach               | Schub | Schraube          |
| ------------------ | ----- | ----------------- |
| 0,25 s gedrückt    | 0,25  | 0,6 Umdrehungen   |
| 0,50 s             | 0,50  | 1,4               |
| 1,00 s             | 1,00  | 4,1               |
| 0,25 s losgelassen | 0,75  | läuft weiter      |
| 1,00 s losgelassen | 0,00  | nur noch Leerlauf |

## Woher der Affe kommt

Das Spiel heißt nicht zufällig U-Boot. In der Softwareentwicklung hängt man an
eine Änderung gern noch ein paar Prüfer, die damit nichts zu tun haben; die
sitzen dann unten drin, lesen mit, sagen nichts und tauchen nie auf. **U-Boote**
nennt man sie - und genau so einer sitzt mit seinem Laptop in der Kanzel: Er
steuert nicht, er gibt nichts frei, er schaut nur dorthin, wo es gleich knallt.

Das steht als sein Eintrag in der Enzyklopädie und als Fußnote unter den Regeln.
Für das Spiel selbst ändert es nichts - es erklärt nur, warum vorn jemand sitzt.

## Gezeichnet, nicht geklebt

Das Boot ist Canvas-Code ([components/sub.ts](components/sub.ts)), kein Bild:
Die Schraube muss sich drehen, das Glas muss über dem liegen, was dahinter ist,
und der Affe muss aus der Kuppel heraus genau dorthin schauen, wo es gleich
knallt. Ein fertiges Bild kann nichts davon.

**Das Boot bleibt dabei gerade.** Beim Steigen und Sinken die Nase mitzukippen
sieht nach Flugzeug aus; ein U-Boot hält die Lage und fährt mit seinen
Tiefenrudern auf und ab, ohne sich zu neigen. Die einzige Ausnahme ist das
Ankommen - dort hebt es die Nase, und das ist keine Fahrt, sondern ein Jubel.

**Die Form stammt aus der Vorlage** (`game_instructions/UBoot/uboot.png`): ein
Tropfen, der nach hinten spitz zuläuft und vorn in einer großen Glaskuppel
endet, Turm mit Kragen und abgeknicktem Periskop darüber, ein Bullauge an der
Seite, Nietenreihen auf den Plattennähten, zwei Kufen unter dem Bauch - und
hinter dem Glas der Affe mit dem Laptop, einen Finger am Kinn. Die Umrisslinie
steht als Anteile seiner halben Länge und Höhe in `SHELL`, nicht als Pixel: Ein
Boot, das größer wird, behält damit seine Form, statt an zwanzig Stellen
nachgerechnet zu werden.

## Ton: gerechnet, nicht geladen

Das Spiel klingt auch dann, wenn **keine einzige Audiodatei** etwas hergibt
([audio/sounds.ts](audio/sounds.ts)) - und solange die Platzhalter unter
`public/uboot/` leer sind, ist genau das der Fall. Was man dann hört, sind ein
paar
Oszillatoren: ein Blip für die Harpune, ein dumpfer Schlag für einen Treffer,
Rauschen durch einen zufallenden Filter für eine Explosion, vier Töne fürs
Ankommen, einer abwärts fürs Ende. Dazu ein tiefes Brummen aus zwei Tönen, die
ein paar Hertz auseinanderliegen - die Schwebung daraus ist das ganze Rezept,
und sie klingt nach Wasser und Maschine statt nach Sirene. Für ein Spiel, das
seine ganze Welt zeichnet statt sie zu laden, ist das die passende Antwort.

**Gehört wird der Unterschied zweier Weltzustände**, nicht ein Rückruf aus der
Engine ([hooks/use-uboot-game.ts](hooks/use-uboot-game.ts), `sing`): Ein Schuss
mehr als im Bild davor ist ein Schuss, eine Hülle weniger ist ein Treffer. Die
Engine bleibt davon unberührt, und was man hört, ist garantiert das, was
wirklich passiert ist.

Zwei Regler statt einem, anders als bei GTA und der Panzerkiste: Dort gibt es
eine Sorte Ton, hier laufen Dauerton und Einzelgeräusche nebeneinander und
gehen einem unterschiedlich schnell auf die Nerven. Wer das Brummen wegdreht,
will meistens trotzdem hören, dass er getroffen wurde.

**Musik beginnt leise und wächst über zwei Sekunden auf ihre Lautstärke**
([audio/samples.ts](audio/samples.ts), `swell`). Musik, die schlagartig
dasteht, klingt wie ein Fehler; eine, die aufkommt, klingt, als hätte sie schon
gespielt. Das gilt für den ersten Start wie für jedes Weitermachen an der
Stelle, an der zuletzt aufgehört wurde - für den, der zuhört, ist beides
derselbe Augenblick.

**Das Fahrgeräusch wächst nicht**, und darum steht in seiner Zeile eine Null:
Es hängt an der Taste nach vorn und soll im selben Augenblick da sein wie der
Schub. Ein Motor, der erst nach zwei Sekunden zu hören ist, gehört zu einem
anderen Boot. Wie lange eine Schleife braucht, steht deshalb je Schleife und
nicht einmal für alle.

Gerechnet wird dabei **nach der Uhr und nicht in gezählten Schritten**: Ein
Zeitgeber kommt mal früher, mal später, und aus zwanzig gezählten Schritten
wird so schnell eine Sekunde, die zwei ist. Gelesen wird deshalb, wie viel Zeit
wirklich vergangen ist - die Schritte sagen nur, wie oft nachgesehen wird. Wer
währenddessen am Regler dreht, hört das sofort: Das Ziel wird in jedem Schritt
neu gelesen, statt beim Start eingefroren zu werden.

Alles daran ist optional: Ein Browser ohne Web Audio, ein Kontext, der nicht
starten darf, eine Stummschaltung durch das System - nichts davon darf das
Spiel stören, also ist jede Berührung mit der Audio-Welt eingepackt. Im
schlimmsten Fall ist es eben still.

## Hinter dem Zahnrad

Oben rechts auf der Seekarte, dort, wo in jedem Spiel ein Zahnrad sitzt:
Musik- und Soundlautstärke, _Spielstand zurücksetzen_ und _Alles freischalten_.
Die beiden letzten fragen nach, die Regler nicht - ein verstellter Regler ist
in zwei Sekunden zurückgedreht, ein gelöschter Spielstand nicht.

Der Punktestand steht **nicht** mehr daneben, sondern am Hammer, also dort, wo
man ihn ausgibt. Eine Zahl an zwei Stellen ist eine Zahl zu viel.

## Was noch kommt

Die Enzyklopädie und die Erfolge sind angelegt und verlinkt, aber leer - eine
Tür, die auf ein ehrliches „noch nicht" aufgeht, ist mehr wert als eine, die
sich nicht öffnet. Wenn der Inhalt kommt, ist der Weg dorthin schon gebaut.
