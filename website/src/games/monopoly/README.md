# Monopoly

**MONOPOLY Klassik** von Hasbro (C1009). Der deutsche Spielplan von Badstraße bis
Schlossallee, 28 Besitzrechtkarten, 32 Häuser, 12 Hotels - und alles, was die
zweiseitige Anleitung beschreibt: Versteigerungen, Hypotheken, Handel und
Bankrott.

## Spielen

| Seite                     | Was dort passiert                     |
| ------------------------- | ------------------------------------- |
| `/monopoly`               | gegen Computergegner                  |
| `/monopoly/einstellungen` | wie viele mitspielen                  |
| `/monopoly/online`        | automatische Suche oder privater Raum |
| `/monopoly/statistik`     | gespielte Partien und Erfolge         |

Die vollständigen Regeln stehen im Spiel hinter **„? Regeln"** und als
Spezifikation in
[docs/games/monopoly/game-rules.md](../../../../docs/games/monopoly/game-rules.md).

## Der Spielplan ist der Spielplan

Ein Ring aus 40 Feldern, LOS unten rechts, die vier Ecken an den vier Ecken, die
Farbbalken auf der **Innenkante**. Das ist keine Dekoration: Wer Monopoly kennt,
weiß, wo die Schlossallee liegt, und ein Brett, das sie woanders hinlegt, zwingt
zum Lesen von vierzig Beschriftungen, um etwas herauszufinden, das man schon
wusste.

Das Ganze ist **ein 11×11-Grid**, und die Zelle jedes Feldes wird aus seiner
Position gerechnet ([components/monopoly-board.tsx](components/monopoly-board.tsx)),
nicht vierzigmal hingeschrieben - eine Tabelle mit vierzig Einträgen wäre
vierzig Gelegenheiten, die Schlossallee in die falsche Ecke zu setzen. Die Ecken
bekommen eine breitere Spur als die Seiten, wie auf dem gedruckten Brett.

In der Mitte steht der Schriftzug, die zwei Kartenstapel liegen auf den
Diagonalen - und davor das, was der Zug gerade verlangt.

Das Brett behält in beiden Themes seine eigenen Farben. Es ist bedruckte Pappe;
eine echte wird abends nicht dunkler.

## Erst die Figur, dann der Wurf

Die Anleitung fängt damit an: „Jeder Spieler nimmt sich eine Spielfigur und
stellt sie auf LOS." Also fängt das Spiel auch damit an - als **Phase**, nicht
als Einstellung daneben. Das ist die einzige Form, die an beiden Orten
funktioniert: gegen den Computer und in einem Raum mit sechs Leuten sucht sich
reihum jeder eine aus dem aus, was übrig ist.

Die Computergegner nehmen **von hinten** aus der Reihe. Nicht von vorn: Wer vor
ihnen wählt, soll die Figur bekommen, die er wollte.

Auf dem Brett steht dann die Figur selbst, nicht ein farbiger Punkt - Leute
nennen sich am Tisch den Hund und das Schiff, und ein Brett mit sechs Punkten
zwingt zum Nachschlagen in einer Legende.

## Dein Besitz steht oben

Neben dem Brett liegen drei Tafeln, und die Reihenfolge ist nicht beliebig:
**dein Besitz zuerst**, dann der Spielerstand, dann das Handelsfenster. Was du
besitzt, ist das, worauf du drückst - bauen, hypothekieren, anbieten -, der
Stand ist nur zum Lesen da. Eine Tafel mit Knöpfen gehört nicht unter eine, die
man nie anfasst.

## Jede Kante eines Feldes bedeutet genau eine Sache

- die **innere** Kante, zur Brettmitte, trägt die Farbgruppe der Straße,
- die **äußere** Kante trägt ein Quadrat in der Farbe des Besitzers, mittig
  angesetzt,
- die Häuser stehen **auf** dem Farbbalken, da, wo sie auf einem gedruckten
  Brett auch stehen.

Alle drei liegen deshalb auf jeder der vier Reihen an einer anderen Seite der
Zelle - unten unten, links links, und so weiter (`sideOf`). Das ist es, was den
Ring als Ring lesbar macht statt als Tabelle.

Der Besitzmarker war zweimal falsch, bevor er richtig war. Erst ein **kleines
Eck-Kästchen** - immer gleich groß, egal was es bedeutet, und liest sich als
Fussel. Dann ein **Streifen über die ganze Feldlänge** - und der sah dem
Farbbalken auf der Gegenkante zum Verwechseln ähnlich, sodass ein volles Brett
den Leser fragte, welcher von zwei gleichen Balken eine Gruppe meint und welcher
eine Person. **Eine Form, die sich nur durch ihre Position unterscheidet, ist
keine andere Form.**

Jetzt ist es ein **Quadrat**, mittig an der Außenkante. Gesetzt wird nur eine
Kantenlänge, die andere kommt aus `aspect-ratio`: Die Felder sind oben und unten
höher als breit und an den Seiten breiter als hoch, also misst sich das Quadrat
jeweils an der **kurzen** Seite und ist dadurch auf allen vier Reihen gleich
groß.

### Wer Platz braucht, bekommt ihn - und nur der

Auf der linken und rechten Reihe ist das Feld flach und breit, der Name füllt die
Breite, und dann liegt an der einen Kante ein Hotel und an der anderen der
Besitzmarker. Also bekommt der Name dort Spuren (`BUILD_LANE`, `MARK_LANE`) -
aber **nur, wo wirklich etwas steht**. Der erste Versuch hielt sie auf jedem
Seitenfeld frei, und schon brach „Gemeinschaft" auf einem Feld um, auf dem gar
nichts liegt.

Das Padding sitzt am Knopf und verschiebt nur den Text: Ein absolut
positioniertes Kind misst von der Padding-Box, die Marker reichen also weiterhin
bis an den Rand.

Damit ein zu langer Name dann auch wirklich **umbricht** statt abgeschnitten zu
werden, braucht er `w-full min-w-0`. Ein Flex-Element hat `min-width: auto` und
weigert sich, schmaler zu werden als sein eigener Text - das `overflow-hidden`
des Feldes schnitt „Bahnhofstraße" daraufhin einfach in der Mitte durch.

### Häuser sehen aus wie Häuser

Eine Reihe kleiner grüner Häuser mit Satteldach und ein langes rotes Hotel -
das ist das Bild, das jeder von einem Monopoly-Brett ohnehin im Kopf hat, und es
sagt ohne Zählen, welches von beiden dasteht. Vorher waren es grüne Quadrate
mitten im Feld unter dem Preis, wo eine Straße mit vier Häusern wie ein
Tippfehler aussah.

## Zwei Dinge sind nur für einen gezeichnet

**Deine** Figur ist größer und geringt, und **deine** Straßen sind zusätzlich in
deiner Farbe eingefärbt und umrandet - über dem Quadrat, das die Straßen aller
bekommen. Auf vierzig Feldern mit sechs Figuren sollte es keine Arbeit sein,
sich selbst zu finden.

Beides hängt bewusst **nicht** davon ab, ob die eigene Farbe hell oder dunkel
ist. Der erste Versuch umrandete die eigenen Straßen einfach in der
Figurenfarbe - und wer den Zylinder spielt, dessen Farbe ist fast schwarz, also
war der Rahmen vom normalen Feldraster nicht zu unterscheiden. Jetzt liegt die
Einfärbung mit niedriger Deckkraft über dem Filz, was bei jedem Farbton liest,
und der Ring um die eigene Figur ist weiß **und** schwarz, einer außen um den
anderen.

Dabei fiel noch ein zweiter Fehler auf: Die Computergegner hießen nach Figuren -
„Schiff", „Zylinder". Das ging, solange die Figur am Sitzplatz hing. Seit man
sie wählt, saß am Tisch ein Spieler namens Zylinder, der die Schubkarre schob.
Ein Spieler hat einen Namen und eine Figur, und das sind zwei verschiedene
Dinge.

## Die Kasse auf Frei Parken

Die bekannteste Hausregel überhaupt, und die Anleitung schreibt ausdrücklich
dagegen an: „Legen Sie niemals Geld in die Mitte des Spielplans." Gespielt wird
sie trotzdem fast überall - deshalb ist sie hier ein **Schalter** in den
Einstellungen, und er steht auf an.

Eingebaut ist sie an der einzigen Stelle, an der Geld verschwindet: `pay` kennt
neben der Bank eine zweite Senke, `POT`, und in die zahlen **Kaution, beide
Steuern, jede Bank-Zahlung einer Karte und die Straßenausbesserungen**. Käufe,
Häuser, Hypothekenzinsen und Mieten nicht - ein Kauf ist keine Strafe, und Miete
zahlt man einander. Wer auf Frei Parken landet, bekommt den ganzen Betrag, und
das Feld zeigt ihn die ganze Zeit an; sonst müsste man ihn sich merken.

Der Schalter reist auch online mit: Der Gastgeber stellt ihn ein, und die Runde
spielt, was er eingestellt hat. Ausgeschaltet ist es das gedruckte Spiel - dann
sammelt sich nichts, und das Feld zeigt auch nichts.

## Doppeltes Gehalt auf LOS

Die zweite Hausregel im selben Zuschnitt: Wer **genau** auf LOS landet, bekommt
400 € statt 200 €. Sie steht ebenfalls in den Einstellungen und ebenfalls auf
an, und der Gastgeber nimmt sie mit ins Online-Spiel.

Gedruckt steht sie nirgends - die Anleitung zahlt für das _Vorübergehen_ und
verliert über das Anhalten kein Wort, weil LOS für sie ein Feld wie jedes andere
ist, über das man läuft.

Im Code ist es eine einzige Frage, `salaryOn`: Was zahlt LOS an einen Zug, der
auf diesem Feld zum Stehen kommt? Beide Wege dorthin zählen, der gewürfelte und
die Karte „Rücke vor bis auf LOS", denn beide setzen den Zug genauso auf die
Ecke. Damit man der Ecke ansieht, dass hier etwas anderes gilt als gedruckt,
steht der Betrag auf dem Feld.

Beim Prüfen dieser Regel fiel ein älterer Fehler auf: Das **erste** Spiel nach
dem Öffnen der Seite entstand aus den Standardwerten, nicht aus den gespeicherten
Einstellungen. Sechs eingestellte Spieler wurden zu vier. Die Einstellungen
kommen über einen externen Store, den es nur im Browser gibt - beim ersten
Commit nach der Hydration stand darin noch das, womit die Seite vorgerendert
wurde. Der Effekt, der das Spiel anlegt, liest die Einstellungen jetzt selbst
aus dem Speicher. Ausgerechnet der Fall ohne gespeicherte Partie ist der, in dem
die Einstellungen zählen.

## Eine Regel, ein Ort

Beim Durchsehen des Moduls war die Halbpreis-Regel viermal aufgeschrieben:
beim Hausverkauf, beim Bankrott, beim Ausrechnen dessen, was ein Spieler noch
aufbringen kann, und auf der Beschriftung des Knopfes. Drei Gelegenheiten, dass
der Knopf etwas verspricht, was der Schiedsrichter dann anders auszahlt. Jetzt
gibt es `sellBackOf(at, count)` und `buildingsOn(estate)` in `state.ts`, und
alle vier fragen dort nach. Die Zahlen ändern sich dabei nicht - nachgerechnet
für jede Straße und jede Gebäudezahl, Summe 6875 € hier wie dort.

Dazu zwei kleinere: `TYPICAL_ROLL` stand zweimal da (Ansicht und Computer) und
steht jetzt einmal in `state.ts`, und die sechs Panels in der Brettmitte teilen
sich `PanelProps`, statt dieselben drei Zeilen sechsmal auszuschreiben.

## Das Hypotheken-Pingpong

Eine Suche nach Fehlern im Endspiel förderte kein falsches Ergebnis zutage,
aber eine schlechte Angewohnheit: Der Computergegner löste eine Hypothek
zurück, sobald er 600 € über der Ablösesumme hatte - und musste dasselbe
Grundstück nach der nächsten Miete wieder belasten. Über eine Partie ging
dieselbe Straße bis zu **zehnmal** hin und her, jedes Mal 10 % Zinsen ärmer und
zwei Denkpausen länger.

Der Schwellenwert war blind für das Brett: Gegen unbebaute Straßen sind 600 €
ein Vermögen, gegen ein Hotel auf der Schlossallee sind sie Kleingeld. Jetzt
zählt `worstRent` die höchste Miete, die gerade jemand anders verlangen kann,
und der Gegner löst erst aus, wenn danach noch zwei solche Treffer im
Portemonnaie bleiben. Über zwanzig Partien: **120 Wechsel vorher, 50 nachher**,
schlimmste Straße von zehn auf fünf.

## Grün baut, Rot reißt ab

In der Liste der eigenen Grundstücke stehen beide Knöpfe untereinander, und ihre
Beschriftungen unterscheiden sich um ein einziges Wort: „Haus auf Badstraße"
gegen „Haus auf Badstraße verkaufen". In einer Bauphase klickt man sich durch
zehn solche Karten, und das Auge sucht dabei den Knopf, nicht den Satz. Also
bekommen die beiden die Farben, die überall dasselbe bedeuten: **Bauen ist
grün, Abreißen ist rot.**

Hypothek und Auslösen bleiben grau, obwohl auch sie Geld bewegen. Sie bewegen
keine Häuser - und eine dritte und vierte Farbe nähme dem Unterschied genau das
wieder, wofür er da ist.

## Ein Knopf zum Ausprobieren

Oben neben „Neues Spiel" steht **+1000 € (Cheat)**. Ein Klick legt dir tausend
Euro in die Kasse, und der Spielverlauf schreibt es mit: „Du: nimmt 1000 € aus
der Bank (Cheat)."

Der Grund ist derselbe wie bei den Levelknöpfen über dem Panzerkiste-Feld: Eine
Partie Monopoly braucht eine Stunde, bis das Geld knapp wird - und erst dann
fangen die Entscheidungen an, die man beim Bauen und Handeln prüfen will.

Zwei Sachen daran sind Absicht:

- **Es ist kein Zug.** Der Knopf greift in den eigenen Spielstand, statt einen
  Zug an den Schiedsrichter zu geben. Ein Zug wäre eine Zugart, die es online
  gäbe - und ein Tisch will keinen Knopf, der Geld druckt.
- **Es gibt ihn nur hier.** Im Online-Spiel ist er nicht eingebaut; dort wird
  der Spielstand vom Gastgeber geführt.

## Alles Geld geht durch eine Funktion

Monopoly ist hauptsächlich Buchhaltung, und in der Buchhaltung geht es schief.
Deshalb geht **jede** Zahlung durch `pay`
([engine/moves.ts](engine/moves.ts)) - Miete, Steuer, Kaution, ein Haus, ein
Gebot -, und diese eine Funktion ist der einzige Ort, der weiß, was passiert,
wenn jemand es nicht bezahlen kann: Sie eröffnet eine Schuld, und eine Schuld
hält das Spiel an, bis sie beglichen ist oder jemand ausscheidet.

Nichts sonst in dieser Datei zieht etwas von einem Kontostand ab.

## Ein Angebot an dich steht in der Brettmitte

In die Mitte des Bretts kommt alles, was **passieren muss**, bevor es weitergeht

- dort, wo am Tisch die Würfel und die eben gezogene Karte liegen
  ([components/monopoly-actions.tsx](components/monopoly-actions.tsx)). Ein
  Handelsangebot an dich gehört dazu: Der andere sitzt da und wartet, genau wie
  bei einer Auktion oder einer Schuld.

Vorher stand in der Mitte nur „Warte auf …", und die Knöpfe zum Annehmen lagen
im Handelsfenster neben dem Brett - man musste also aus dem Augenwinkel
mitbekommen, dass man gefragt worden ist. Jetzt stehen sie an beiden Stellen:
in der Mitte, weil es dran ist, und im Handelsfenster, weil dort ohnehin
hinschaut, wer gerade selbst ein Angebot baut.

## Was auf den Kartenstapeln steht - und was nicht

Auf den beiden Diagonalen in der Brettmitte stehen „Gemeinschaft" und
„Ereignis", da, wo das gedruckte Brett sie auch hat.

Dahinter stand einmal die Anzahl der Karten im Stapel, und die sagte nichts:
„Danach legen Sie die Karte unter den Stapel zurück" macht aus jedem Stapel
einen **Ring**, der nie ausgeht - die Zahl stand die ganze Partie auf 16. Bewegt
hat sie sich nur, solange jemand die Freikarte aus dem Gefängnis hielt, und das
steht ohnehin im Klartext in der Spielertafel.

Eine Zahl, die konstant ist und sich genau dann rührt, wenn sie etwas
wiederholt, ist schlechter als gar keine: Sie bringt einem bei, hinzusehen, und
belohnt es nie.

## Vier Dinge unterbrechen einen Zug

Eine aufgedeckte Karte, ein Grundstück unter dem Hammer, eine Schuld und ein
Angebot auf dem Tisch. Alle vier sind **Felder am Zustand**, keine Phasen, die
den Zug überschreiben - denn jedes muss danach wieder zurückgelegt werden, und
eine Phase kann nichts zurücklegen.

Genau da lagen die zwei Fehler, die das Selbstspiel gefunden hat, und es war
zweimal derselbe: Die Phase hieß noch „auction" bzw. „debt", nachdem Auktion und
Schuld längst erledigt waren, und das Spiel blieb stehen. Die Regel heißt jetzt
nicht mehr „lass die Phase in Ruhe, wenn sie Auktion heißt", sondern **„ist
tatsächlich noch etwas offen?"** - eine Phase, die lügen kann, wird lügen.

Eine Auktion muss außerdem sagen, **wohin es danach geht**, und es gibt zwei
Antworten: Wer nicht kaufen wollte, bekommt seinen Zug zurück; wer pleite bei der
Bank gegangen ist, hat keinen Zug mehr, also ist der Nächste dran.

## Handeln war nicht optional

Der Computergegner sollte anfangs keine Angebote machen - einzuschätzen, was
jemand annimmt, ist eine Verhandlung, und ein Bot, der schlecht verhandelt, ist
schlimmer als einer, der es lässt.

Gemessen über je fünf Partien: zu zweit endeten sie nach rund 180 Zügen, **zu
viert nie**. Alle wurden Millionäre. Der Grund ist Monopolys eigene Ökonomie:
Mit vier Spielern zerfällt das Brett so fein, dass niemand eine Farbgruppe
komplettiert, also baut niemand, also sind die Mieten winzig - und die 200 € pro
Runde kommen schneller herein, als irgendetwas hinausgeht. **Monopoly ohne
Handel ist kein langsameres Monopoly, sondern ein anderes Spiel, das nicht
endet.**

Jetzt macht der Bot genau eine Art Angebot: **Bargeld für die eine Straße, die
ihm zur Farbgruppe fehlt** ([engine/ai.ts](engine/ai.ts)). Geboten wird, was der
andere dafür verlangen würde, plus dessen Marge - rund das Anderthalbfache des
Kaufpreises. Das klingt unverschämt und ist es nicht: Eine fertige Farbgruppe ist
ein Vielfaches ihrer letzten Straße wert, und der Verkäufer weiß genau, wofür
gefragt wird.

Damit enden Vierer-Partien nach 149 bis 325 Zügen.

Der Bot **liest** Angebote und nimmt die guten - eine Person kann also an diesem
Tisch handeln, auch gegen Computergegner.

### Einmal fragen, nicht jede Runde

Ein Nein wird gemerkt (`refused` im Spielzustand, gelesen über `wasRefused`).
Ohne das war es keine Kleinigkeit: gemessen an denselben Partien fragte ein Bot
dieselbe Person **19- und 30-mal nach derselben Straße** - jede Runde aufs Neue,
bis die Partie zu Ende war.

Der Grund ist, dass in diesem Gegner kein zweites Angebot steckt. Der Preis ist
schon das, was der andere dafür verlangen würde; ein zweiter Anlauf wäre
derselbe Handel, nur später. Wer einmal abgelehnt hat, soll das nicht jede Runde
wiederholen müssen.

Die Absage gilt für den Rest der Partie. Sie könnte verfallen - und dann käme
genau das zurück, wogegen sie da ist. Wer es sich anders überlegt, bietet die
Straße selbst an; das Handelsfenster kann das von jeher.

Für **Menschen** gilt die Sperre nicht. Noch einmal zu fragen, mit mehr Geld,
ist die Hälfte dessen, was Handeln überhaupt ist - der Schiedsrichter hat das
nicht zu verbieten. Nur der Computer liest die Liste.

## Der Computergegner sonst

1. **Fast alles kaufen, früh.** Ein Grundstück ohne Besitzer ist das einzige,
   das billig ist. Der einzige Grund, nein zu sagen, ist die nächste Miete nicht
   zu überleben - also eine Bargeldgrenze, keine Bewertung.
2. **Auf Auktionen echtes Geld zahlen.** Dieselbe Straße hat drei Preise: die,
   die die eigene Gruppe schließt, ist über das Doppelte ihres Kaufpreises wert;
   die, die einem anderen die seine verbaut, die Hälfte mehr; alles andere etwas
   unter dem Preis der Bank - denn deren Preis ist, was man beim Landen zahlen
   müsste, und eine Auktion zwingt zu nichts. Und er **nennt diesen Preis in
   einem Gebot**, siehe unten.
3. **Bis drei Häuser bauen.** Der große Sprung der Mietentabelle liegt zwischen
   zwei und drei Häusern.
4. **Im Gefängnis bleiben, wenn das Brett voll ist.** Früh ist das Gefängnis ein
   Käfig, spät das sicherste Feld des Spielplans.

## Eine Auktion darf nicht ratschen

Der offensichtliche Bieter-Bot erhöht um den kleinsten erlaubten Schritt. Das ist
das, was ein Auktionstheoretiker empfehlen würde, und es ist hier unspielbar: Der
kleinste erlaubte Schritt ist **ein Euro**, also klettern zwei Computer von 10 auf
300 in zweihundertneunzig einzelnen Zügen - und wer zusieht, muss jeden davon
absitzen.

Gemessen: Die längste Auktion einer Vierer-Partie dauerte **554 Züge**, und über
eine Partie fielen rund 800 bis 1000 Gebote.

Jetzt nennt der Bot **sofort sein Limit** ([engine/ai.ts](engine/ai.ts)). Das
kostet ihn etwas - wer kriecht, zahlt einen Euro über dem Zweitbesten, wer sein
Limit nennt, zahlt sein Limit -, aber das Limit ist ohnehin konservativ
(neun Zehntel des Kaufpreises für ein gewöhnliches Grundstück), und ein Gebot,
das man sich vorher überlegt hat, ist auch die Art, wie Menschen bieten.

Dieselbe Messung danach: längste Auktion **5 Züge**, fünf bis vierzehn Gebote pro
Partie. Die Schlossallee geht mit einem einzigen Gebot weg.

Auf der eigenen Seite ist Bieten dagegen **eine Zahl, die man eintippt**. Sie
steht schon drin: **zehn über dem letzten Gebot**, denn das ist die Erhöhung,
die jemand meint, wenn er erhöht. Der eine Euro der Anleitung steht als
Abkürzung daneben, für die Fälle, in denen man genau den meint.

Nach **jedem** Gebot steht wieder zehn über dem neuen Höchstgebot da. Eine Zahl,
die man vor drei Geboten getippt hat, ist keine Voreinstellung mehr, sondern ein
Überbleibsel.

### Das Feld korrigiert nicht, während man tippt

Es hält **das, was man getippt hat**, als Text - und nicht eine Zahl, die die
Anzeige schon zurechtgerückt hat. Das klingt nach einer Feinheit und war der
ganze Fehler: Wer den Wert bei jedem Tastendruck auf das Mindestgebot
hochklemmt, macht das Feld unleerbar (leer liest sich als 0, 0 ist zu wenig,
also stand das Mindestgebot sofort wieder drin) - und **150 über einem Gebot von
90 war nicht eintippbar**, weil aus der „1" 91 wurde, bevor die „5" ankam.

Die Regeln kennt jetzt der **Knopf**: Er bleibt grau, solange die Zahl im Feld
keine ist, die der Schiedsrichter annehmen würde, und schreibt hin, was er
schicken würde. Das ist auch die ehrliche Aufteilung - einem Feld, das
stillschweigend umschreibt, was man eingegeben hat, kann man nicht trauen; ein
Knopf, der nicht angeht, erklärt sich selbst.

## Was das Selbstspiel geprüft hat

Nach **jedem einzelnen Zug**, über 24 Partien mit 2, 3, 4 und 6 Spielern:
Häuser auf dem Brett plus Häuser in der Bank sind immer 32 und Hotels immer 12,
innerhalb jeder Farbgruppe steht nirgends mehr als ein Haus Unterschied, auf
einer Gruppe mit Hypothek steht nichts, kein Kontostand ist negativ, ein Pleitier
besitzt nichts, und jede Partie endet mit genau einem Sieger.

Die Häuserzählung ist die schärfste davon: Sie fängt jeden Fehler beim Bauen,
Verkaufen, Umwandeln in Hotels und beim Abwickeln eines Bankrotts - alle vier
Stellen, an denen Gebäude die Seite wechseln.

## Was online geheim ist

Fast nichts, und das ist Monopoly: Geld, Besitz, Gebäude und Hypotheken liegen
offen, weil die halbe Mitte des Spiels darin besteht zu wissen, was der Spieler
auf deiner orangen Gruppe sich leisten kann.

Geheim ist einzig die **Reihenfolge der zwei Kartenstapel**. Sie gehört
niemandem - auch nicht dem Host, in dem Sinne, dass niemand hineinsehen darf -
und liegt deshalb im Host-Vault, nicht auf einem privaten Kanal
([multiplayer/adapter.ts](multiplayer/adapter.ts)). Der öffentliche
Schnappschuss behält die **Anzahl**, denn wie viele Karten noch da sind, sieht
man am Tisch auch.

## Aufbau des Spielmoduls

```
monopoly/
  engine/       Spielplan, Karten, Figuren, Zustand, Schiedsrichter, Gegner
  components/   Brett, Brettmitte, Besitz und Stand, Handel, Endstand, Schirme
  hooks/        die Partie gegen den Computer
  multiplayer/  Adapter für die gemeinsame Online-Schicht
  settings/     Spielerzahl
  i18n/         deutsche Texte und die Anleitung im Spiel
```

## Cover-Logo

Das Bild liegt in [assets/logo.webp](assets/logo.webp) - ein Platzhalter, den
man durch echte WebP-Grafik ersetzen kann.
