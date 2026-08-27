# CATAN

**CATAN - Das Spiel** von Klaus Teuber (KOSMOS, Ausgabe 2025). 19
Landschaftsfelder, 5 Rohstoffe, 2 Würfel - und wer zuerst genug Siegpunkte hat
und selbst am Zug ist, gewinnt. Dazu die **5-6 Personen Erweiterung** und die
zuschaltbaren Varianten aus _Händler & Barbaren_.

## Spielen

| Seite                  | Was dort passiert                        |
| ---------------------- | ---------------------------------------- |
| `/catan`               | gegen Computergegner                     |
| `/catan/einstellungen` | Spielerzahl (3-6), Siegpunkte, Varianten |
| `/catan/online`        | automatische Suche oder privater Raum    |
| `/catan/statistik`     | gespielte Partien und Erfolge            |

Die vollständigen Regeln stehen im Spiel hinter **„? Regeln"** und als
Spezifikation in
[docs/games/catan/game-rules.md](../../../../docs/games/catan/game-rules.md).

## Das Brett wird gerechnet, nicht abgeschrieben

Die Anleitung sagt, was eine Kreuzung ist („der Punkt, an dem 3 Felder
zusammenstoßen, an der Küste nur 2") und zählt sie nie auf - am Tisch sieht man
sie ja. Als Daten müssen sie trotzdem existieren, und 54 Kreuzungen plus 72 Wege
von Hand einzutippen wären 126 Gelegenheiten für einen Zahlendreher, den man
erst drei Partien später als „komisch, da ging keine Straße hin" bemerkt.

[engine/board.ts](engine/board.ts) leitet sie stattdessen aus den Reihen
3-4-5-4-3 ab: jede Feldecke einmal einsammeln, doppelte zusammenlegen, dasselbe
für die Kanten. Aus 114 Eckplätzen werden so 54 Kreuzungen, aus 114 Kantenplätzen
72 Wege, weil 42 davon zwei Feldern gehören.

Damit „zusammenlegen" auch wirklich zusammenlegt, ist das Gitter **ganzzahlig**.
Catan-Sechsecke stehen auf der Spitze, also liegt jede Ecke auf einem Raster aus
halben Feldbreiten quer und halben Feldhöhen hoch. Zwei Felder, die sich eine
Ecke teilen, erzeugen damit denselben Schlüssel - ohne Rundung, ohne
Epsilon-Vergleich, ohne die Klasse von Fehler, bei der zwei Kreuzungen fast
dieselbe sind.

Ein Wegwerf-Test hat die Zahlen gegen die Anleitung geprüft: 19 Felder, 54
Kreuzungen, 72 Wege, 30 Küstenwege, 18 Zahlenchips, und jede Beziehung von beiden
Seiten lesbar.

## Die Zahlenchips kommen alphabetisch aufs Brett

Das ist die Regel, die man beim Programmieren übersieht. Die Anleitung mischt die
**Landschaften**, aber nicht die Chips:

> Platziert sie nun in alphabetischer Reihenfolge auf den Landschaftsfeldern.
> Beginnt dabei auf einem beliebigen Eckfeld und legt sie gegen den
> Uhrzeigersinn ab.

Chips zu mischen wäre eine Zeile weniger Code und ein anderes Spiel: Die feste
Buchstabenfolge ist der Grund, warum eine 6 und eine 8 nur so oft nebeneinander
liegen, wie das gedruckte Alphabet es zulässt. Deshalb läuft
[engine/setup.ts](engine/setup.ts) eine **Spirale gegen den Uhrzeigersinn** von
einem der sechs Eckfelder nach innen und überspringt die Wüste.

Welcher Buchstabe welche Zahl trägt, druckt die Anleitung nicht - man dreht die
Chips am Tisch einfach um. Diese Folge ist deshalb Wissen aus dem Spiel und in
der [Spezifikation](../../../../docs/games/catan/game-rules.md) als solche
vermerkt.

## Das Spielfeld ist die Bedienung

Es gibt **keinen „Straße bauen"-Modus**, in den man erst wechselt.
[components/catan-board.tsx](components/catan-board.tsx) leuchtet an, was gerade
erlaubt ist, und **was man antippt, sagt schon, was es ist**: Ein Weg kann nur
eine Straße werden, eine leere Kreuzung nur eine Siedlung, eine eigene Siedlung
nur eine Stadt, und ein Landschaftsfeld ist nur anklickbar, solange der Räuber in
der Hand ist. Die vier überschneiden sich nie, also gibt es nichts vorher
auszuwählen.

Was leuchtet, kommt aus dem Schiedsrichter - `roadSpots`, `townSpots`,
`citySpots`, dieselben Funktionen, aus denen auch der Computergegner spielt. Ein
Bauplatz, den die Regeln ablehnen würden, wird also nicht bloß abgelehnt: Er
leuchtet gar nicht erst.

Die eigene Farbe ist zweimal markiert - ein weiß-dunkler Doppelring um die
eigenen Figuren und ein Ring in der eigenen Farbe um jedes Feld, das man berührt.
Beides sind **Umrisse und keine Flächen**, und das war eine Korrektur: Eine
Einfärbung nimmt dem Feld seine Farbe mit, und auf diesem Brett _ist_ die Farbe
eines Feldes das, was es abwirft. Der Doppelring wiederum ist Gürtel und
Hosenträger für die weißen Figuren, die fast die Farbe des Bretts haben.

Die Häfen werden **zuletzt** gezeichnet, über allem. Ein Hafen ist Möbel und
keine Figur, gehörte also eigentlich nach unten - aber sein Schild sitzt dicht
genug vor der Küste, dass eine Siedlung auf der Nachbarkreuzung ein Zeichen
verdecken kann. Eine halb verdeckte Figur kann man noch lesen, „2:1 Getreide"
ohne die 2 nicht.

## Ein Knopf, der nur gedrückt werden will, ist kein Knopf

Die meisten Catan-Züge beginnen mit „Würfeln" und sonst nichts - eine
Entwicklungskarte vorher auszuspielen ist die Ausnahme, nicht die Regel. Und
manche Züge enden mit „Zug beenden" und sonst nichts, wenn man nichts
eingenommen hat: ohne Karte kann man nicht bauen, nicht mit dem Vorrat tauschen
und nicht einmal anbieten, weil ein Angebot eine Karte auf dem Tisch braucht.

[engine/moves.ts](engine/moves.ts) sagt mit `forcedMove`, welcher der beiden
Fälle vorliegt, und [hooks/use-forced-move.ts](hooks/use-forced-move.ts) drückt
den Knopf. Zwei Dinge daran sind Absicht:

- **`forcedMove` zählt keine Züge.** Es wäre naheliegend, alle erlaubten Züge
  aufzuzählen und zu prüfen, ob es genau einer ist - aber allein die Angebote
  sind eine unendliche Menge, und eine Regel, die „hier gibt es nichts zu
  entscheiden" behauptet, muss lesbar sein, um ihr zu trauen. Alles, was nicht
  sicher ist, gibt `null` zurück und lässt den Zug in Ruhe.
- **Die beiden Pausen sind verschieden lang.** Gewürfelt wird schnell, denn das
  Interessante ist das Ergebnis. Der Zug wird deutlich langsamer beendet, damit
  das eigene Würfelergebnis nicht eine halbe Sekunde nach dem Erscheinen wieder
  weg ist.

Beide Bildschirme benutzen denselben Hook, und jeder Browser führt ihn nur für
seinen eigenen Platz aus - online schickt also der Client der spielenden Person
den Zug, genau als hätte sie selbst gedrückt. Der Knopf bleibt sichtbar: Wer
schneller ist als die Pause, drückt ihn.

## Der Computergegner rechnet in Augen, nicht in Zahlen

[engine/ai.ts](engine/ai.ts) sucht nicht, er sortiert: Jede Lage erzeugt eine
Liste von Zügen, beste zuerst, und gespielt wird der erste, den der
Schiedsrichter durchlässt. Das hat eine nützliche Eigenschaft - er **kann** gar
keinen unerlaubten Zug machen, weil `aiMove` nichts zurückgibt, was `applyMove`
nicht gerade genehmigt hat.

Drei Ideen tragen ihn:

1. **Ein Chip ist seine Augen wert.** Eine 6 kommt fünfmal so oft wie eine 2, und
   die gedruckten Punkte unter der Zahl sagen das. Alles, was einen Platz
   bewertet - wohin gründen, wohin der Räuber, welche Siedlung wird Stadt -
   zählt Augen, keine Zahlen.
2. **Vielfalt schlägt Menge.** Zwei Felder derselben Sorte sind weniger wert als
   zwei verschiedene, weil jede Baukostenkombination eine Mischung verlangt. Ohne
   diesen Abschlag setzt sich der Computer auf drei Getreidefelder, sieht reich
   aus und kann keine Straße bauen.
3. **Erst bauen, dann handeln.** Eine Karte in der Hand ist für sich nichts wert.
   Getauscht wird mit dem Vorrat nur, wenn genau eine Sorte zwischen ihm und
   einem Bauwerk steht.

## Was das Selbstspiel geprüft hat

Nach **jedem einzelnen Zug**: Straßen, Siedlungen und Städte auf dem Brett plus
die im Vorrat ergeben immer 15, 5 und 4; keine Hand wird negativ; die 25
Entwicklungskarten vermehren sich nicht; die Abstandsregel gilt an jeder
besetzten Kreuzung; auf keinem Feld liegt eine 7 und es liegen genau 18 Chips.
Jede Partie endet mit einem Sieger, der wirklich 10 Punkte hat.

Gefunden hat es sofort einen echten Fehler: **eine Endlosschleife im Handel**.
Der Bot bot eine Karte an, wurde abgelehnt, und bot dieselbe Karte wieder an -
40 000 Züge in Runde 5. Die Anleitung nennt keine Obergrenze fürs Feilschen,
weil ein Tisch von selbst aufhört. Ein Computergegner tut das nicht, also gibt
es jetzt eine: höchstens 10 Angebote pro Zug, weit über allem, was ein Mensch
tippt, und kurz genug, um einen Zug zu beenden, der nirgends mehr hinführt.

Die Partien dauern seitdem im Median 100 Züge zu dritt und viert - was ungefähr
20 bis 30 Runden pro Person entspricht und damit einem echten Abend.

## Online

Das Brett ist öffentlich, die Hände sind es nicht. Der interessante Teil ist die
**Anzahl**: Am Tisch kann jede:r die Karten der anderen zählen und niemand sie
lesen, und genau das entscheidet, ob eine 7 jemandem wehtut. Eine für die
Leitung geleerte Hand hätte die Anzahl mit den Sorten verloren, also ist sie ein
eigenes Feld (`CatanPlayer.cards`), das der Schiedsrichter beim Verlassen von
`applyMove` nachführt - an einer Stelle statt an den zwölf, an denen Karten den
Besitzer wechseln.

Am Spielende wird nichts mehr verdeckt. Das ist keine Abkürzung, sondern die
Regel selbst: „Du deckst sie erst auf, wenn du mindestens 10 Punkte erreicht
hast."

## Zwei Bretter, und keine Konstante für eines davon

Das Grundspiel hat 19 Felder, die 5-6 Personen Erweiterung 30 - Reihen von
3-4-5-6-5-4-3, zwei Wüsten, 28 Chips. [engine/board.ts](engine/board.ts) baut
beide aus derselben Ableitung und gibt sie über `islandOf(hexCount)` heraus.

**Es gibt bewusst kein `HEXES` mehr auf Modulebene.** So eine Konstante wäre
eine Falle: Sie funktioniert tadellos, bis jemand zu sechst austeilt, und dann
zeigt der halbe Code auf ein Brett, das gar nicht auf dem Tisch liegt. Ein Spiel
sagt über die Zahl seiner Landschaftsfelder, wie groß es ist, und alles fragt
danach.

Eine Sache musste dafür anders gerechnet werden: die **Ringe** für die
Chip-Spirale. Vorher wurden sie als Abstand zu einem Mittelfeld bestimmt - das
geht beim gedruckten Brett auf, weil es ein sauberes Sechseck mit einem Feld in
der Mitte ist. Das Sechserbrett hat eine Reihe aus sechs Feldern quer durch und
gar kein Mittelfeld. Jetzt wird die Insel wie eine Zwiebel geschält: Ring 0 ist
alles mit einer Seite am offenen Meer, Ring 1 was danach übrig bleibt. Das
stimmt für jede Form.

## Ein Spielzug für zwei Personen

Ab fünft ersetzt die Erweiterung die frühere „Außerordentliche Bauphase": An
jedem Spielzug sind **zwei** Personen beteiligt. Stein 1 würfelt für alle und
darf alles; Stein 2 spielt danach einen kürzeren Zug - bauen, mit dem Vorrat
tauschen, eine Entwicklungskarte, aber **nicht mit den anderen handeln**.

Im Code heißt das: `active` bleibt für den ganzen Spielzug die Person mit
Stein 1, auch während Stein 2 handelt, denn das hält die Rotation einfach.
Alles, was „wer ist gerade dran" meint, fragt stattdessen `actingSeat` - auf
einem Dreier- oder Vierertisch derselbe Platz. Das war die eine invasive Stelle
der Umstellung, und es war die richtige: `active` und „handelt gerade" sind auf
einmal zwei verschiedene Fragen, und jede Stelle, die sie verwechselt, ist ein
Fehler.

Das Spielende fällt damit von selbst richtig aus. Die Anleitung sagt, bei
Gleichstand im selben Spielzug gewinne Stein 1 und Stein 2 komme nicht mehr dran

- und genau das passiert, wenn man den Sieg immer bei der gerade handelnden
  Person prüft.

## Das 28er-Chipalphabet ist gesucht, nicht geraten

Welche Zahl welcher Buchstabe trägt, druckt keines der beiden Hefte. Für die 18
Chips des Grundspiels ist die Folge bekannt; für die 28 der Erweiterung nicht.

Statt zu raten wurde gemessen, was die gedruckte Folge eigentlich leistet: Über
400 echte Verteilungen - zufällige Wüsten, zufällige Startecke - liegt beim
18er-Alphabet **nie** eine 6 oder 8 neben einer 6 oder 8. Ein erster, von Hand
gebauter 28er-Vorschlag, der die roten Zahlen bloß gleichmäßig übers Alphabet
verteilte, kam auf im Median **zwei** solcher Paare. Also wurde eine Folge
gesucht, die den Test besteht - und die eingebaute erreicht wieder 100 %.

Bemerkenswert daran: Die gefundene Folge hat die roten Zahlen teils dicht
beieinander im Alphabet stehen. Auf der Spirale landen sie trotzdem weit
auseinander, weil zwischen zwei Ringen die Nachbarschaft abreißt. Hätte ich nur
nach Gefühl verteilt, wäre das Ergebnis schlechter gewesen - und niemand hätte
es gemerkt außer beim Spielen.

## Städte & Ritter ist ein Modus, keine Variante

Die Varianten aus _Händler & Barbaren_ legen etwas dazu. Städte & Ritter
**ersetzt**: keine Entwicklungskarten, drei Würfel statt zwei, 13 Siegpunkte
statt 10, keine Größte Rittermacht („lasst ihr in der Schachtel"), und die
zweite Gründungsfigur ist eine Stadt. Also ist es eine Auswahl - `mode` - und
steht in den Einstellungen über den Häkchen, nicht zwischen ihnen.

Drei Entwurfsentscheidungen tragen den Rest:

**Ritter bekommen ein eigenes Kreuzungs-Brett** (`garrison`), kein Feld an der
Siedlung. Ein Ritter ist kein Gebäude: Er steht auf einer _freien_ Kreuzung,
ignoriert die Abstandsregel komplett und blockiert Straßen, statt etwas
einzubringen.

**Eine Phase für alle 22 Kartenwirkungen**, nicht zwölf. Die Karte auf dem Tisch
sagt selbst, was sie fragt (`playing`), und eine einzige Antwortnachricht trägt
die Felder, die sie braucht - genau wie es die Ereigniskarten schon machen.
Zwölf fast gleiche Phasen hätten dasselbe Wissen über zwölf Stellen verteilt.

**Marschieren, Vertreiben und Ausweichen sind ein Zug** (`march`). Auf dem Brett
sind sie dieselbe Geste - dieser Ritter geht auf jene Kreuzung -, und was sie
unterscheidet, ist, wer dort steht. Das sieht der Schiedsrichter selbst.

### Was das Selbstspiel gefunden hat

Zehn Partien, 108 bis 216 Züge, alle beendet. **21 der 23 spielbaren Karten**
kamen dabei tatsächlich vor, ohne eine einzige Blockade. Zwei Fehler fielen auf:

1. Ein **Zwangshandel zwischen den beiden Würfen** von CATAN für Zwei kehrte in
   die Bauphase zurück und verschluckte den zweiten Wurf.
2. Der Computer spielte **Medizin** ohne die Rohstoffe dafür und blieb dann in
   der Kartenphase stehen. Er prüft eine Karte jetzt, indem er ihre Antwort
   **durchrechnet** - nicht nur, ob eine existiert.

Der messbarste Beleg, dass die Ritter tun, was sie sollen: Bevor es sie gab,
verloren die Spieler 12 bis 38 Städte je Partie an die Barbaren. Danach 1 bis 4.

Zwei Karten spielt der Computer bewusst nicht. **Alchemie** (die eigenen Würfel
zu bestimmen braucht einen Plan für den Zug; geraten ist sie schlechter als
würfeln) und **Erfindung** (zwei Zahlenchips zu tauschen ist eine offene Wahl,
bei der Raten schadet). Beide sind im Schiedsrichter da und für Menschen
spielbar.

## CATAN für Zwei ist kein Schalter

Die anderen Varianten kann man zuschalten. Diese nicht: **Zu zweit gibt es kein
Catan ohne sie**, also spielt ein Tisch mit zwei Personen sie immer, und der
Code fragt nie eine Einstellung, sondern nur
[`playingTwo`](engine/two.ts) - „stehen neutrale Farben am Tisch?".

Die beiden neutralen Farben sind **gewöhnliche Sitze**. Das war die eine
Entwurfsentscheidung, an der alles andere hängt: Eine Kreuzung merkt sich den
Sitz, der darauf gebaut hat, also muss eine neutrale Siedlung dort stehen und
blockieren können wie jede andere. Dadurch gelten Abstandsregel, Straßenregeln
und die Längste Handelsroute für sie durch den ganz normalen Code - und die
Anleitung will genau das: „In einer neutralen Farbe kann aber durchaus die
Längste Handelsroute entstehen."

Was sie nie tun - Zug, Karten, Erträge, Sieg - steht deshalb an genau drei
Stellen: `realSeats` überspringt sie in der Zugreihenfolge, `payout` schüttet
ihnen nichts aus, und in der Tabelle steht statt Punkten „neutrale Farbe".

### Erst die Farbe, dann der Platz

Eine neutrale Siedlung darf auf **jede** freie Kreuzung, die die Abstandsregel
erlaubt. Das ist für beide Farben dieselbe Menge - ein Tippen aufs Brett könnte
also nie sagen, welche Farbe gemeint war. Also wird die Farbe daneben gewählt
und das Brett leuchtet erst danach. Es ist ohnehin die interessantere Hälfte
der Entscheidung: Wen man füttert, entscheidet, wem die Längste Handelsroute
weggenommen wird.

### Zwei Fehler, die das Selbstspiel gefunden hat

Vier Partien durchgespielt, und zwei Dinge fielen dabei auf:

1. Ein **Zwangshandel zwischen den beiden Würfen** kehrte in die Bauphase
   zurück und verschluckte den zweiten Wurf. Die Rückkehr fragte „wurde schon
   gewürfelt?" statt „ist noch ein Wurf offen?".
2. Der Computer nutzte **keine einzige** Chip-Aktion, weil ihm niemand welche
   beigebracht hatte. Jetzt sind es 15 bis 29 pro Partie.

Nebenbei fiel noch ein Fehler auf, der nichts mit dieser Variante zu tun hat:
Die **erste** Partie nach einer Einstellungsänderung wurde aus den _Vorgaben_
gebaut, nicht aus der Einstellung. Der Grund ist die Hydration - beim ersten
Rendern gibt der Einstellungsspeicher noch seinen Server-Schnappschuss zurück,
damit das Markup passt, und genau daraus war die Referenz gefüllt. Wer eine
Tischgröße wählte, bekam sie erst nach „Neues Spiel". Jetzt wird beim Anlegen
live gelesen.

Und `event` fehlte in der Phasenliste der Zustandsprüfung: Ein Spielstand, der
während einer Ereigniskarte gespeichert wurde, wäre stillschweigend verworfen
worden.

## Varianten sind Schalter, keine Auswahl

Die Anleitung von _Händler & Barbaren_ sagt ausdrücklich, dass ihre Varianten
sich beliebig kombinieren lassen. Deshalb ist `CatanGame.variants` eine **Liste**
und nicht ein Feld, und alles, was sie liest, fragt „ist das hier an" statt
„welche spielen wir". Die Einstellungen zeigen entsprechend Schalter und keine
Radiogruppe.

[engine/variants.ts](engine/variants.ts) hält, was eine Variante _hinzufügt_,
und nichts sonst - genau wie die Anleitung selbst: „Gespielt wird nach den
normalen Regeln von CATAN - Das Spiel. Hinzu kommen folgende Änderungen."

Zwei Dinge daraus sind Auslegungen und stehen als solche in der
[Spezifikation](../../../../docs/games/catan/game-rules.md): Der freundliche
Räuber zählt **offene** Siegpunkte, weil eine verdeckte Siegpunktkarte sonst
verraten würde, dass es sie gibt. Und _Die Häfen von Catan_ erhöht das Ziel um
**eins** statt es auf elf festzunageln, damit eine kurze oder lange Partie ihre
Länge behält.

Das Selbstspiel läuft über **alle vier Kombinationen** der beiden Schalter, und
es hat sofort einen echten Fehler gefunden: `doCity` rief `awardTiles` nicht
auf. Im gedruckten Spiel fällt das nicht auf - eine Stadt ändert weder die
längste Route noch die Ritterzahl. Mit Hafenpunkten schon: Sie verdoppelt einen,
und die Tafel _Stärkste Häfen_ wurde deshalb nach einem Städtebau nie neu
vergeben.

## Ereigniskarten sind zwei Würfel, ausgeschrieben

Bei _Ereignisse auf Catan_ ersetzen 37 Karten die Würfel, und die Zahlen darauf
sind keine Mischung: einmal die 2, zweimal die 3, dreimal die 4 ... sechsmal die
7 und wieder herunter. Das sind exakt die 36 Ergebnisse zweier Würfel. Ein
Blick, der das übersieht, würde die Zahlen "ungefähr gleichmäßig" verteilen und
damit genau das kaputtmachen, wofür es die Variante gibt.

Zwei Regeln haben Zustand gekostet, und beide zu Recht:

- **Gute Nachbarschaft** geschieht am Tisch gleichzeitig. Nacheinander gefragt
  könnte jemand eine Karte weitergeben, die er gerade bekommen hat. Also sammelt
  `given` die Antworten und alle Karten wandern zusammen, wenn die letzte da ist.
- **Erdbeben** legt eine Straße auf die Seite. `CatanPlayer.damaged` merkt sich
  welche: bis zur Reparatur baut diese Person keine Straße mehr und die Straße
  taugt nicht mehr als Anschluss für eine Siedlung - für die Längste
  Handelsroute zählt sie aber weiter, was die Karte ausdrücklich sagt.

Das Selbstspiel prüft über sechs Partien, dass **jedes** der elf Ereignisse
mindestens einmal auftritt und keines den Zug stehen lässt - bei einer Karte,
die vier verschiedene Arten von Antwort verlangen kann, ist genau das die
Gefahr.

## Aufbau des Spielmoduls

```
catan/
  engine/       Insel, Zustand, Aufbau, Schiedsrichter, Varianten,
                Ereigniskarten, Computergegner
  components/   Spielfeld, Aktionsleiste, Handel, Hand und Stand, Endstand
  hooks/        die Partie gegen den Computer
  multiplayer/  Adapter für die gemeinsame Online-Schicht
  settings/     Spielerzahl und Siegpunkte
  i18n/         deutsche Texte und die Anleitung im Spiel
```

## Cover-Logo

Das Bild liegt in [assets/logo.webp](assets/logo.webp) - die Insel in ihren
Landschaftsfarben.
