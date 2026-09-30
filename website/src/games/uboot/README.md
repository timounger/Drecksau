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

`XP_CAP` ist der Vollausbau: **900 Punkte**, aus der Tabelle gerechnet und
nicht hingeschrieben ([settings/profile.ts](settings/profile.ts)). Mehr kann
niemand ansammeln - weder durch Wiederholen noch über die Abkürzung in den
Einstellungen, und ein von Hand aufgeblasener Spielstand kommt beim Laden
beschnitten heraus.

Punkte sind in diesem Spiel kein Guthaben, sondern die Frage, welches Boot man
fährt. Diese Frage ist beantwortet, sobald alles gekauft werden kann; eine Zahl,
die danach weiterwächst, ohne dass sich etwas ändert, misst nur noch Fleiß.

Die Rechnung geht trotzdem auf: Alle zehn Gewässer bringen beim ersten Mal 740,
eine zweite Runde zahlt je ein Viertel und füllt damit genau auf 900 auf.
Ausgezahlt wird nur, was noch unter den Deckel passt - und **das** ist auch die
Zahl, die das Siegblatt zeigt. Eine Belohnung anzukündigen, die nicht ankommt,
wäre gelogen; steht da +0, sagt eine Zeile darunter, warum.

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

| Waffe   | Wie sie wirkt                        | Auf eine Mine |
| ------- | ------------------------------------ | ------------- |
| Harpune | sticht, `reach: 0`                   | drei Treffer  |
| Torpedo | sprengt, `reach: 42`, nimmt Fels mit | ein Treffer   |
| Seemine | wird gelegt, `speed: 0`, `reach: 66` | ein Treffer   |

Die Stiche stehen als `dents` im Weltzustand, nach demselben Schlüssel wie
`gone` (`row * cols + col`) und genauso nur für diesen Tauchgang. Und man sieht
sie: Mit jedem Stich fehlt der Mine ein Dorn, die Kugel wird bleicher und ein
Riss läuft über sie. Eine Waffe, bei der man mitzählen muss, statt hinzusehen,
wäre keine.

**Der Torpedo ersetzt die Harpune**, er kommt nicht dazu - es ist dasselbe Rohr,
nur besser bestückt. Die Seemine kommt dazu, hat ihre eigene Uhr (`laid`) und
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

Vier Stück: drei für je eine vollständige Stufe, eine für den Wächter
([settings/awards.ts](settings/awards.ts)). **Keine davon steht im
Spielstand.** Eine Auszeichnung ist kein Besitz, sondern eine Feststellung über
die gemeisterten Gewässer - und wird deshalb aus ihnen ausgerechnet statt
nebenher mitgeschrieben. Ein Haken, der beim Speichern verlorengeht, kann so
nicht entstehen, und wer ein Gewässer nachholt, bekommt die Auszeichnung im
selben Moment.

Auf der Tafel stehen auch die, die man noch nicht hat, mitsamt ihrer
Bedingung - eine Tafel, die nur Erreichtes zeigt, ist eine Liste; eine, die
alles zeigt, ist ein Ziel.

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
der Vorlage, die klassische Ausbaubäume benutzen: unten die sechs Kategorien,
darüber die Stufen als achteckige Felder, dazwischen Verbindungen, rechts der
Punktestand und eine Tafel, die erklärt, was man gerade angetippt hat. Darunter
die beiden einzigen Knöpfe, die es braucht: alles zurückholen und fertig.

Der Ablauf ist **einmal antippen zum Ansehen, dann einbauen** - entweder über
den Knopf auf der Tafel oder mit einem Doppelklick auf das Feld selbst. Der
Knopf ist der Weg, den man findet, ohne ihn zu kennen; der Doppelklick ist der,
den man nimmt, wenn man den Baum kennt und zügig ausbauen will.
Was eine Stufe kostet, steht auf dem Feld; was sie tut, braucht einen Satz, und
einen Satz liest niemand auf achtzig Pixeln. So kann man im Baum stöbern, ohne
aus Versehen Punkte auszugeben, und es braucht keinen Kaufknopf, der ein
Viertel der Tafel wegnimmt.

Auf den Doppelklick hört dabei **nur das Feld, das wirklich als nächstes dran
und bezahlbar ist**. Gekauft wird ja immer die nächste Stufe einer Bahn - ohne
diese Bedingung würde ein Doppelklick irgendwo oben im Baum die unterste Stufe
kaufen, und zwar eine ganz andere als die, auf die man getippt hat.

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
| Waffen      | Harpune, Torpedo, Seemine - drei Dinge, drei Formen |
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

Die Zahlen sind mit Absicht knapp: Alle zehn Gewässer beim ersten Mal bringen
**740 EP**, der volle Ausbau kostet **900 EP**. Die erste Frage ist also nicht,
wann man alles hat, sondern **welches Boot** man will - eines, das vier Treffer
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

## Gezeichnet, nicht geklebt

Das Boot ist Canvas-Code ([components/sub.ts](components/sub.ts)), kein Bild:
Die Schraube muss sich drehen, das Glas muss über dem liegen, was dahinter ist,
und der Affe muss aus der Kuppel heraus genau dorthin schauen, wo es gleich
knallt. Auch das Logo der Spielesammlung ist mit demselben Code gezeichnet.

## Ton: gerechnet, nicht geladen

Das Spiel klingt, und zwar **ohne eine einzige Audiodatei**
([audio/sounds.ts](audio/sounds.ts)). Was man hört, sind ein paar
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
