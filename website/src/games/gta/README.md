# GTA

Los Santos von oben. Du läufst durch die Stadt, nimmst dir ein Auto, fährst
Aufträge - und je schneller du unterwegs bist, desto mehr interessiert sich die
Polizei für dich. Wer alle vier Viertel übernommen hat, dem gehört die Stadt.

Dazwischen liegt der Rest der Stadt: ein Waffenladen, die eine Bank, die eine
Notendruckerei, in die man nur mit einer angeheuerten Crew hineinkommt, und das
Gefängnis für den Fall, dass es schiefgeht - aus dem man auch wieder ausbrechen
kann.

## Spielen

- Gegen die Stadt: `/gta`
- **W A S D** oder Pfeiltasten: zu Fuß in alle vier Richtungen, im Auto Gas,
  Bremse und Lenkung
- **Maus**: zu Fuß der Blick - **Klick** schießt dorthin
- **E** oder **Enter**: ein- und aussteigen
- **Shift** halten: rennen. Mit dem **Cheat-Modus** zu Fuß zehnfach, im Auto
  dreifach

## Was von GTA San Andreas übrig bleibt

Das Vorbild ist ein 3D-Spiel von 2004 mit einer Geschichte, Waffen und einem
halben Bundesstaat. Was hier steht, ist der Teil, den ein Browser trägt und der
das Spiel eigentlich ausmacht: **eine Stadt, ein Auto, eine Uhr und die Sterne
im Rückspiegel.** Geschossen wird nicht - die Spannung kommt aus dem Verkehr,
der Zeit und der Frage, ob du die Streife noch abhängst.

Gebaut ist es wie [Panzerkiste](../panzerkiste/README.md): eine reine
Simulation, die React einmal pro Bild um eine Zeitscheibe weiterdreht. Nichts im
`engine`-Ordner kennt eine Leinwand oder eine Uhr, und derselbe Startwert mit
denselben Tasten spielt sich zweimal gleich - genau das macht eine Verfolgung
ohne Browser prüfbar.

## Die Stadt steht fest, der Tag nicht

Der Stadtplan wird gerechnet und ist immer derselbe: ein Raster aus Straßen,
dazwischen Blöcke mit Gehweg, Parks als Auflockerung und im Süden Strand und
Meer. Eine Stadt, die sich bei jedem Start neu würfelt, nimmt einem das, was ein
offenes Spiel ausmacht - dass man sich nach einer Stunde auskennt.

Was **auf** den Straßen ist, kommt dagegen aus dem Startwert: Verkehr, Passanten,
geparkte Wagen, die Lackiererei und der erste Auftrag.

## Sterne bekommt man leicht, los wird man sie schwer

Ein Stern für jeden Wagen, den du jemandem wegnimmst, für jeden angefahrenen
Passanten und für jeden Streifenwagen, den **du** rammst. Auf jemanden zu
schießen kostet zwei - eine Kugel ist keine Unachtsamkeit. Ein geparkter Wagen
kostet nichts - das ist der ganze Handel dieses Spiels: Der schnellste Weg
irgendwohin ist der, der einen Stern kostet.

Drei Regeln, die alle erst nach dem Ausprobieren entstanden sind:

- **Die Fahndung kühlt nur außer Sicht ab.** Eine Streife neben dir hält die
  Suche wach. Sonst wäre „abhängen" ein Timer und keine Verfolgungsjagd.
- **Gerammt zu werden kostet keinen Stern.** In der ersten Fassung schon - und
  weil vier Streifen einen umstellten und selbst hineinfuhren, sammelte man im
  Stehen Sterne, während die Abkühlung nie begann.
- **Ein Zusammenstoß zählt einmal, nicht pro Bild.** Zwei Autos berühren sich
  viele Bilder lang. Ohne diese Sperre schrieb ein Anstupser den Wagen in drei
  Sekunden ab, und ein Streifschuss auf dem Gehweg war der sofortige Tod.

Stehenbleiben ist trotzdem keine Lösung: Die Streifen rammen, der Wagen hält das
nicht lange aus - nach etwa acht Sekunden ist er hin. Wegfahren dagegen wirkt:
außer Sicht fällt alle 18 Sekunden ein Stern, und beim letzten verschwinden die
Streifen.

## Gehen und Zielen sind zwei Fragen

Zu Fuß bewegen die vier Tasten die Figur nach Norden, Süden, Westen und Osten -
in Weltrichtungen, nicht relativ zum Blick. Wohin die Figur **schaut**, sagt die
Maus, und dorthin geht auch der Schuss.

Das ist die Trennung, die dieses Genre ausmacht: Man kann rückwärts von einer
Streife weglaufen und sie dabei ansehen. Mit einer Steuerung, in der A und D nur
drehen, ginge das nicht - da ist Laufrichtung gleich Blickrichtung, und ein
Rückzug wird zum Wendemanöver.

Im Auto bleibt es beim Alten: Gas, Bremse, Lenkung. Ein Wagen, der seitwärts
fahren kann, ist kein Wagen.

Geschossen wird nur zu Fuß. Ein Drive-by wäre ein anderes Spiel - er braucht
eine zweite Hand am Lenkrad, und ein schießendes Auto macht aus jeder Verfolgung
ein Schießbudenspiel.

## Die Schrägsicht

Gezeichnet wird gekippt, wie bei Panzerkiste: Tiefe wird um den Faktor 0,82
gestaucht, Höhe hebt einen Punkt gerade nach oben. Häuser, Autos und Leute
bekommen dadurch ein Dach und eine Wand, die zur Kamera zeigt.

**Der Motor bleibt flach.** Kollision, Verfolgung, Parkplatz - alles rechnet
weiter in einer Draufsicht auf ein Raster. Nur das Bild ist gekippt, und
`components/projection.ts` ist die einzige Stelle, die beide Welten kennt. Der
Hook braucht sie ebenfalls: Die Maus ist ein Bildschirmpunkt und muss erst
zurück auf die Straße gerechnet werden, sonst zielt der Schuss neben das
Fadenkreuz.

**Alles Stehende wird von hinten nach vorne gemalt.** Jedes Ding meldet die
Stadt-y seiner Vorderkante an, dann wird sortiert. Damit verschwindet ein Auto
nördlich eines Hauses hinter dem Haus und fährt südlich davon davor vorbei -
ohne dass irgendein Zeichner vom anderen wissen muss.

**Ein Haus pro Block, nicht eines pro Feld.** Ein Block ist neun Bau-Felder in
einem Ring aus Gehweg; neun Kästen hätten Nähte und Schatten mitten durch ein
Haus gezogen. Die Höhe würfelt jeder Block selbst - immer gleich, aus seinen
Koordinaten - und wird zur Stadtmitte hin größer. Das ergibt eine Skyline
statt eines Gewerbegebiets.

**Und nichts verschwindet hinter einem Haus.** Das ist der Preis der Kippung:
Ein Dach wird nach oben gezeichnet und ragt deshalb über die Straße nördlich
davon - was dort steht, läge plötzlich hinter einer Wand, neben der es in
Wirklichkeit steht. Die Antwort hat zwei Hälften, und beide gelten für alles,
was sich bewegt - den Spieler, jedes Auto, jeden Passanten, dazu die Ringe der
Aufträge:

- **Das Haus wird durchsichtig**, sobald irgendetwas davon dahinter steht. Dann
  sieht man nicht nur das Ding selbst, sondern auch die Straße, auf der es
  steht. Ein Block, hinter dem nichts ist, bleibt massiv - durchsichtig wird
  immer nur dort, wo es etwas zu sehen gibt. Steht der **Spieler** dahinter,
  geht das Haus weiter auf als für alle anderen: einen Passanten kurz zu
  verlieren kostet nichts, sich selbst zu verlieren kostet das Spiel.
- **Und das Verdeckte kommt oben drauf**, fast deckend, an seiner echten
  Stelle. Ein Streifenwagen hinter einem Block ist einer, den man kennen muss.
  Der Spieler kommt voll deckend zurück und bekommt einen grünen Ring um sich:
  Ein kleines grünes Männchen auf einem hellen Dach übersieht man auch dann,
  wenn es gezeichnet ist - einen Ring nicht.

Beides hängt am selben Test: Jedes Haus meldet das Rechteck, das es auf dem
Bildschirm bedeckt, und wer dahinter steht, wird noch einmal aufgerufen.

## Waffen sind eine Tabelle

Neun Waffen, und jede ist eine **Zeile** in `engine/weapons.ts`: wie schnell
sie geht, was sie abzieht, wie weit sie reicht, wie sehr sie streut und auf
welche von vier Arten sie die Hand verlässt - Schlag, Schuss, Feuer,
Explosion. Der Motor kennt nur diese vier Arten; eine achte Waffe ist eine
Zeile, kein Umbau.

Der Gürtel ist **eine Zahl je Fach**, und die sagt zwei Dinge auf einmal: Null
heißt "nicht gefunden oder leergeschossen", eine Zahl ist die Munition, und
unter Null heißt "gefunden, geht nie aus". Nur die Faust startet unter Null;
das Messer kommt durch Aufheben dorthin. Das Mausrad überspringt leere Fächer,
denn ein Rad, das auf etwas Unbenutzbarem stehen bleibt, muss zweimal gedreht
werden.

## Der Fernzünder ist zwei Knöpfe, nicht einer

Die neunte Waffe passt in keine der vier Arten, wie etwas die Hand verlässt -
also gibt es eine fünfte: `planted`. Was sie ausmacht, steht in zwei Sätzen im
Code und beschreibt das ganze Spielzeug:

- **Rechts legt ab, links löst aus.** `Input.plant` ist eine eigene Flanke und
  keine zweite Bedeutung von `Input.fire`, weil die beiden Hälften derselben
  Waffe entgegengesetzt sind. `layCharge()` legt eine Ladung **dorthin, wo der
  Spieler steht** - nicht, wohin er zeigt -, und das macht aus einer Waffe eine
  Falle: Man legt die Reihe, und dann geht man weg von ihr.
- **Alle auf einmal.** `setOff()` zündet jede liegende Ladung im selben Bild.
  Eine Reihe unter einem Panzer ist eine Entscheidung; zehnmal drücken, während
  der Panzer weiterfährt, wäre nur eine Art, sie falsch zu treffen.
- **Der Gürtel zählt den Boden mit.** `beltOf()` setzt für das Fach des
  Fernzünders die Zahl der liegenden Ladungen ein, sobald die Tasche leer ist.
  Ohne das wäre die zehnte gelegte Ladung diejenige, die einem den Knopf aus der
  Hand nimmt: `carried()` sagt Nein, das Mausrad überspringt das Fach, und zehn
  scharfe Ladungen liegen ohne Auslöser in der Stadt.
- **Das Licht liegt über allem, die Ladung darunter.** Gezeichnet wird die
  Ladung mit den Fundstücken auf der Straße - ein Auto, das darüber parkt,
  verdeckt sie, und genau das will man von einer Falle. Das blinkende rote
  Licht kommt danach noch einmal über das ganze Bild, weil die einzige Frage,
  die der Spieler nie verlieren darf, "wo habe ich sie hingelegt" ist. Der
  langsame Takt läuft über die Weltuhr statt über die eigene, damit eine Reihe
  wie **ein** Ding pulst; die erste Sekunde blinkt jede schnell, und das ist die
  Quittung für den Knopfdruck.
- **Warum 150.** Ein Panzer hat 400 Blech, eine Granate nimmt ihm knapp 70.
  Drei Ladungen darunter sind 450 - also genau das Werkzeug, mit dem man zu Fuß
  einen Panzer auseinandernimmt, und kein zweites, das alles andere auch schon
  könnte.

## Zwei Theken, ein Fenster

Waffenladen und Bank sind derselbe Mechanismus, und zwar bewusst: `counterAt()`
fragt einmal, ob der Spieler **zu Fuß** und näher als `COUNTER_RANGE` an einer
Tür einer der beiden Sorten steht, und `<Counter>` zeigt, was es dort gibt. Was
man in dieser Stadt im Stehen tun kann, ist eine kurze Liste und gehört an eine
Stelle.

Gedrückt wird im HTML, entschieden wird im Motor. Der Knopf setzt ein
`Order`-Objekt in einen Ref, das nächste Bild hängt es als `Input.order` an, und
`serveCounter()` prüft alles noch einmal nach: Geld da, Waffe im Gürtel, Tür
noch in Reichweite. Die Anzeige bietet nur an, was geht - die Prüfung im Motor
fängt den Fall ab, dass jemand zwischen Drücken und Bedienen aus der Tür läuft.
Ein Kauf, den nur der Knopf kennt, wäre ein Kauf, den der Online-Zustand nicht
kennt.

**Munition kostet ein Viertel.** Eine Waffe zu kaufen ist eine Anschaffung, sie
zu füllen eine Nebensache - `refillPrice()` ist diese Regel als eine Zeile, und
es gibt sie nur für das, was schon im Gürtel liegt.

## Der Überfall sind drei Uhren

`runHeist()` ist die ganze Bank. Drei Uhren laufen gleichzeitig, und aus ihnen
besteht die Entscheidung:

- **Das Geld** kommt als Rate, nicht als Betrag. Die Kassen sind schnell und
  klein (`TILL_RATE`, `TILL_TOTAL`), der Tresor braucht erst `VAULT_WORK`
  Sekunden zum Aufkriegen und schüttet danach das Mehrfache aus. Deshalb ist er
  eine Entscheidung und keine Gewohnheit: Wer ihn mitnimmt, steht eine halbe
  Minute länger in einem Raum, in dem die Uhr gegen ihn läuft.
- **Der Alarm** geht nach `ALARM_DELAY` Sekunden raus und setzt die Fahndung auf
  `HEIST_STARS`. Danach kommt alle `HEIST_STAR_EVERY` Sekunden ein Stern dazu.
  Die Sterne werden nur nach oben genommen (`Math.max`), damit ein Überfall
  keine laufende Verfolgung zurücksetzt.
- **Die Tür.** Weggehen beendet den Überfall genau so wie der Knopf; beides
  landet in `away()`. Ein Raubzug, den man nur über ein HTML-Element verlassen
  kann, wäre im Vollbild ein Raubzug ohne Ausgang - deshalb zeichnet der
  Renderer Beutel und Alarm zusätzlich ins Bild.

**Die Beute ist kein Geld.** Sie liegt in `Player.loot` und wird erst beim
letzten Stern in `coolDown()` aufs Konto gebucht. Das ist der ganze Sinn der
Sache: Der Überfall ist nicht die Tat, sondern die Flucht danach. `busted()`
zieht deshalb `loot` **und** den laufenden Griff in den Tresor ein und sagt es
im Protokoll, `onStreet()` nimmt der Krankenhausrechnung dasselbe - Geld, das
ohne ein Wort verschwindet, liest sich wie ein Fehler.

## Fahrzeuge sind Kisten, und Kisten haben Regeln

Ein Fahrzeug wird nicht als Bild gezeichnet, sondern als **Quader**: unten der
Kasten bis zur Gürtellinie, darauf die Kabine, obendrauf das Dach als
Draufsicht-Sprite. Das ist dasselbe, was eine Engine mit einem Würfel und einer
orthografischen Kamera täte - nur von Hand:

1. **Eine einzige Silhouette.** `bodyOutline` liefert vier Ecken, und aus genau
   denen wird beides gebaut: Die Draufsicht wird damit gefüllt, die Wände werden
   daraus hochgezogen. Oberkante der Wand und Rand des Dachs darüber sind damit
   per Konstruktion dieselbe Linie. Vorher standen die Wände auf einem _Rechteck_,
   während sich das Dach zur Nase hin verjüngte - dazwischen klaffte ein Keil
   Tageslicht, der beim Drehen von einer Seite auf die andere wanderte. Genau das
   ist „die Autoteile sind nicht zusammen, da ist Luft dazwischen". Für die Kabine
   macht `cabinOutline` dasselbe.
2. **Alle Wände, von hinten nach vorn.** Rückseiten wegzuwerfen ist die
   naheliegende Optimierung und hier die falsche: Das Dach eines Stockwerks ist
   ein eigenes Bild auf eigener Höhe, also blieb dort, wo eine Rückwand
   weggeworfen wurde, _nichts_ zwischen Dach und Blech - ein Schlitz quer durchs
   Auto, immer auf der abgewandten Seite. Von hinten nach vorn gemalt liegen sie
   einfach unter dem, was sie ohnehin verdeckt, und kosten einen Pinselstrich.
3. **Jedes Teil auf seiner Höhe.** Das Draufsicht-Bild enthält mehr als das
   Dach: Räder und Spiegel stehen über die Karosserie hinaus. In einem Rutsch
   auf Gürtelhöhe gestempelt, schwebten die Räder der abgewandten Seite über
   dem Dach - das war der Grund, warum die Fahrzeuge aus jedem schrägen Winkel
   schief aussahen. Jetzt geht das Bild in zwei Durchgängen runter: der **Ring
   mit den Rädern auf der Straße**, die **Karosserie oben auf den Wänden**.
   Geschnitten wird mit derselben Silhouette (der Ring: Rand minus Silhouette
   nach der Even-Odd-Regel), nicht mit Rechtecken - sonst bliebe die verjüngte
   Nase der Motorhaube unten auf der Straße liegen. Das Loch im Ring ist dabei
   **etwas größer als die Karosserie** (`RING_BITE`): Das Draufsicht-Bild
   umrandet die Silhouette mit einem Stift, der auf der Kante sitzt, und die
   äußere Hälfte dieser Linie ist alles, was vom Ring übrig bleibt - ein
   schwarzer Umriss des Autos, flach auf der Straße, der von der Seite als
   **gerader Strich unter den Schwellern** zu sehen war.

Eine Engine bekommt Punkt 3 geschenkt, weil ein Rad dort ein Ding auf einer
Höhe ist und nicht ein paar Pixel in einem Bild. Der Rest ist in beiden Welten
dieselbe Arbeit.

**Der normale Wagen ist ein Golf VIII**, und er hat einen eigenen Satz Wände
(`golfWall`) statt der Limousine mit anderen Zahlen. Der Grund ist die Form:
Das Auto auf den Werkszeichnungen ist keine Limousine. Was stimmen muss, in der
Reihenfolge, in der man es bemerkt:

- **Schrägheck.** Die Kabine reicht bis fast an die Stoßstange und endet in
  einer steilen Klappe mit Spoiler darüber. `cabinBack` von -9,6 auf -17: diese
  eine Zahl ist der halbe Wiedererkennungswert.
- **Lichtbalken über der Nase.** Zwei schmale Leuchten und ein dunkler Streifen
  dazwischen, quer durch, Zeichen in der Mitte. Das Band ist das, was von vorn
  Golf sagt; darunter der breite dunkle Lufteinlass und die Ecklüfter.
- **Das Heck ist nicht die Front mit roten Birnen.** Die Leuchten sitzen hoch
  und breit, direkt unter der Scheibe am oberen Rand der Klappe, jede ein
  schmaler Balken, der um die Ecke auf die Flanke läuft - deshalb sieht man von
  der Seite beide Enden leuchten. **Dazwischen ist nichts**: Die Klappe ist
  lackiertes Blech mit dem Zeichen darauf, der dunkle Balken gehört der Front.
  Darunter eine rote Linie über der Stoßstange, das Kennzeichen tief in der
  Mitte, und ganz unten die dunkle Schürze mit je einem hellen Endrohr.
- **Die Scheiben laufen durch.** Die Fasen an den Ecken der Kabine bekommen
  nicht die Wagenfarbe, sondern die Farbe der Säulen: Lackiert steht zwischen
  Windschutzscheibe und Türscheibe ein farbiger Streifen, und so etwas hat
  dieses Auto nicht - das Glas läuft in einem Stück um die Ecke.
- **Die Türgriffe** auf Schulterhöhe. Den Knick, auf dem sie sitzen, gibt es
  nicht mehr: Bei dieser Größe ist eine Linie über die ganze Flanke keine
  Sicke, sondern ein Streifen, der um das Auto herum gemalt ist.

- **Runde Ecken.** Vier Ecken geben vier Wände und vier rechte Winkel, und von
  oben ist das eine Schuhschachtel, so sorgfältig die Flanken auch gemalt sind.
  `bodyOutline` liefert für dieses Auto deshalb **zwölf** Ecken - drei je
  Kante -, und `panels` zieht aus jeder eine Wand hoch. Welche Wand welche ist,
  wird **aus der Form gelesen** statt in Reihenfolge abgezählt - zeigt die
  Außenseite einer Kante überwiegend längs, ist es ein Ende, überwiegend quer,
  eine Flanke, alles dazwischen eine Fase.

- **Jede Kante bekommt ihr Stück des Bildes, nicht das ganze.** Ein Wandbild
  wird für die **volle** Länge bzw. Breite des Fahrzeugs gemalt. Die vier
  Fasen, die längs zeigen, zählen aber ebenfalls als Flanke - und wer jeder von
  ihnen das ganze Bild aufzieht, quetscht ein komplettes Auto aus Türen, Rädern
  und Stoßstangen in zwei Pixel. Genau das war der **schwarze Balken, der vorn
  und hinten neben den Reifen auf der Straße stand**, sobald man ein Auto von
  der Seite sah. `wallFaces` gibt deshalb zu jeder Kante zusätzlich `start` und
  `end` - wo sie über dem Bild liegt, null bis eins -, und `panels` stempelt mit
  `drawImage` genau diesen Ausschnitt. Damit stimmt der Maßstab an jeder Kante:
  Drei Pixel Fase zeigen drei Pixel Auto.

**Der Streifenwagen ist ein eigenes Fahrzeug.** Er war ein Golf mit Blaulicht,
und im Head-up stand entsprechend "Golf VIII" drin. Auf dem Foto steht aber eine
Mercedes E-Klasse T-Modell, und die ist ein Kombi und deutlich größer: 4949 mal
1880 Millimeter gegen 4284 mal 1789. Im Maßstab, in dem alles andere gezeichnet
ist - der Golf ist 44 Pixel lang -, sind das **50,8 mal 19,3**. Es gibt deshalb
die Karosserie `patrol` mit eigener Zeile in `VEHICLES` (Name: "Polizeiwagen")
und eigenem Eintrag in `TIERS`. Gefahren wird sie wie der Golf, mit den Zahlen,
auf die die Verfolgungsjagd einmal eingestellt wurde - eine Jagd, die man nicht
verlieren kann, ist so langweilig wie eine, die man nicht gewinnen kann.

**Gemessen, nicht geschätzt - aus der Rettungskarte.** Ein 3D-Modell dieses
Wagens war nicht aufzutreiben, aber es gibt etwas beinahe ebenso Gutes: Die
Rettungskarte des Herstellers (`rk.mb-qr.com/de/214.250`) enthält eine
maßstäbliche **Seitenansicht und Draufsicht** genau dieses Autos. Alle Zahlen
unten sind daran abgelesen, mit dem Radstand als Lineal - 2961 Millimeter kamen
auf 595,5 Zeichnungspixel, und die Höhe, die dieser Maßstab dann vorhersagt,
ist 1487 gegen 1469 laut Datenblatt. Wer so nah liegt, hat eine saubere
Parallelprojektion vor sich und keine Perspektive.

Gemalt wird sie mit **denselben Wandroutinen** wie der Golf. Was sie zum Kombi
macht, sind vier Zahlen:

- **Die Motorhaube ist lang.** Die Frontscheibe trifft sie 999 Millimeter vor
  der Wagenmitte - zehn Pixel -, und weil der Wagen selbst länger ist, sind das
  vierzehn Pixel Haube gegen elf beim Golf.
- **Das Dach läuft bis ans Heck.** `cabinBack` sitzt zwei Pixel vor dem Ende,
  und darunter gibt es keine abfallende Heckklappe.
- **Die Heckklappe steht.** Dafür gibt es `BACK_RAKE_OF`: Das Dach endet 2,6
  Pixel vor dem Fuß der Klappe, gegen eine Frontscheibe, die 11,7 zurückliegt -
  ein Verhältnis von 0,22, wo das Schrägheck 0,55 hat. Dieser eine Winkel ist
  von der Seite der größte Unterschied zwischen den beiden Silhouetten.
- **Die Räder sitzen nicht symmetrisch.** Vor dem Vorderrad liegen 843
  Millimeter Überhang, hinter dem Hinterrad **1144** - also 16,8 Pixel vor der
  Mitte und 13,7 dahinter. Dafür gibt es `AXLES`; auf derselben Achse beidseits
  gezeichnet landet das Hinterrad drei Pixel zu weit hinten, und ein Auto mit
  dem Hinterrad in der Heckklappe kann niemand benennen. Beim Golf liegen die
  Überhänge 880 zu 784 und damit einen Pixel auseinander - der zeichnet weiter
  symmetrisch.

Und eine Zahl, die sich zu prüfen lohnte: **Höher als ein Golf ist sie nicht.**
1487 Millimeter gegen 1491. Eine E-Klasse wirkt groß, weil sie sechs Pixel
länger ist, nicht weil sie hoch steht.

**Und dann kam die CAD-Zeichnung**
(`game_instructions/GTA/Fahrzeuge/Polizei/eklasse_ansicht.jpg`, vier
Ansichten). Damit war die E-Klasse kein langer Golf mehr:

- **Ein Kühlergrill statt einer Lichtleiste.** Ein Golf trägt vorn einen
  schmalen dunklen Balken mit den Leuchten darin und ein Emblem so groß wie ein
  Stecknadelkopf. Dieses Auto trägt einen **Kühlergrill**: halb so breit wie der
  Wagen, ein Viertel der Bordwandhöhe hoch, oben breiter als unten, mit dem
  Stern in der Mitte - und schmale Leuchten, die nach außen an die Kotflügel
  gedrängt sind. `mercedesFace`.
- **Keine Antenne.** Der Golf hat die Haifischflosse hinten auf dem Dach, dieser
  Wagen nicht: Was er da oben trägt, ist der Balken, und ein Mast daneben liest
  sich als Fehler.
- **Gerade Hauben-Sicken.** Beim Golf laufen zwei Knicke vom Emblem nach außen
  zu den Kotflügeln, hier zwei gerade parallele Powerdomes über die ganze Haube.
- **POLIZEI auf Haube und Vordertüren**, und zwar an beiden Stellen so
  gedreht, dass man es auch lesen kann:

  - Die **Haube ist blau** und der Schriftzug darauf weiß - wie jeder
    POLIZEI-Schriftzug an diesem Wagen. Das blaue Feld ist ein Stück von der
    Silhouette eingerückt, damit ringsum ein Rand Silber stehen bleibt: bis an
    die Kanten gemalt liest es sich als blaues Auto mit silbernem Dach.
  - Auf der **Haube** läuft das Wort **quer** über den Wagen, nicht längs.
    Diese Ansicht dreht sich mit dem Auto - längs gelegt ließe es sich nur dann
    lesen, wenn der Wagen seitlich an einem vorbeifährt. Quer gelegt steht es
    in dem einen Fall richtig herum, auf den es ankommt: wenn ein Streifenwagen
    direkt auf einen zufährt. In Schwarz, weil Blau auf Silber bei dieser Größe
    ein Fleck ist.
  - Auf der **Tür** weiß auf blauem Feld, und das Flankenbild wird **zweimal
    gebaut**: einmal mit der Schrift vorwärts, einmal rückwärts. Welche Kopie
    aufgelegt wird, entscheidet sich **pro Bild neu**, und zwar an der
    Bildschirmrichtung - nicht an `flip`.

    Das ist der Punkt, an dem ich es beim ersten Anlauf falsch hatte. `flip`
    sagt, wie das Bild in den Fahrzeugkoordinaten auf die Kante passt, und das
    ist dasselbe, egal wohin das Auto zeigt. Eine Schrift interessiert aber, in
    welche Richtung sie am Ende **über den Bildschirm** läuft, und das dreht
    sich mit dem Auto - für beide Flanken gleichzeitig, weil sie sich
    gemeinsam drehen. Nach `flip` gespiegelt stand das Wort deshalb auf beiden
    Seiten rückwärts, sobald der Wagen in die andere Richtung fuhr. Jetzt
    rechnet `panels` aus, wohin die x-Achse des Bildes auf dem Schirm zeigt,
    und holt die gedrehte Kopie, wenn sie nach links zeigt. Nase und Heck
    bekommen keine zweite Kopie, weil dort nichts geschrieben steht.

- **Das Blaulicht brennt nur im Einsatz**, und dann blitzt es. Ein
  Streifenwagen, der einfach herumfährt - und das tun die meisten, weshalb jetzt
  auch einer im normalen Verkehr rollt (`ON_THE_ROAD`) -, hat es aus. Das ist
  der Unterschied zwischen "die Polizei ist unterwegs" und "die Polizei ist
  hinter dir her": Es blitzt, was die Wache losschickt, sobald der Spieler
  Sterne hat; ein Wagen, den der Spieler selbst fährt, blitzt nicht, denn dann
  ist niemand im Einsatz.

  Der Rhythmus ist der deutsche und kein langsames Pulsieren: **zweimal kurz
  dicht hintereinander**, eine Runde in 0,42 s (`FLASH_OVER`, `FLASH_LIT`,
  `FLASH_AGAIN`). Die rechte Seite hängt dabei **genau einen Blitz** hinter der
  linken (`BLUE_APART`), und daraus werden aus zwei Doppelblitzen drei Schläge:
  **erst links allein, dann beide zusammen, dann rechts allein.** Nachgemessen
  über eine Runde: links bei 0,00-0,06, beide bei 0,12-0,18, rechts bei
  0,24-0,30, dann dunkel. Der Versatz wird von der Uhr **abgezogen** statt
  daraufgerechnet - addiert käme die rechte Seite zuerst und das Muster hieße
  beide, links, rechts. Die versteckten Leuchten im Kühlergrill gehen mit der
  Seite, über der sie sitzen - für die ist vorn nichts gemalt, und genau das
  macht einen Blitz aus einem silbernen Grill heraus aus.

  **Und keine zwei Fahrzeuge blitzen im Gleichschritt.** Jede Maschine hat
  ihren eigenen Versatz im Takt, aus ihrer id gerechnet (`ownBeat`) - dieselbe
  Zahl in jedem Bild, dieselbe nach dem Laden eines Spielstands, und eine
  andere als die des Nachbarn. Eine Straße mit vier Streifenwagen flackert
  dadurch, statt zu pulsieren; dass zwei zufällig auf denselben Schlag fallen,
  kommt vor und sieht aus wie das, was es ist.

- **Das Blaulicht ist ein Kasten, kein Rechteck.** Es war flach ins Dachbild
  gemalt, und eine Farbfläche, die im Lack liegt, liest sich als Aufkleber: Sie
  hat keine Dicke, fängt von der Seite kein Licht und verschwindet aus flachem
  Winkel ganz im Dach. Jetzt wird es gebaut wie der Rest der Stadt - ein Umriss,
  auf Höhe gezogen, Wände von hinten nach vorn, Deckel drauf (`beacon`). Genauer
  gesagt drei Kästen: an jedem Ende eine blaue Leuchte, dazwischen der dunkle
  Kasten, was aus zehn Metern Entfernung genau so aussieht. Der Schein kommt
  entsprechend von **über** dem Dach statt aus ihm heraus. Seine Breite misst
  sich am **Dach**, nicht am Wagen (BAR_WIDE): Ein Blaulichtbalken läuft von
  einer Dachreling zur anderen, und gegen die volle Wagenbreite gerechnet kam
  er knapp halb so breit heraus, wie er sein soll - ein blaues Kästchen mitten
  in viel Silber.

**Und die Ecken sind jetzt zu.** Das war ein echter Fehler: Eine Kante, die
weder längs noch quer zeigt - also jede Fase an den vier Ecken -, bekam kein
Bild, sondern die Lackfarbe. Auf einem einfarbigen Auto fällt das nicht auf, auf
einem gestreiften schon: An jeder Ecke stand ein grauer Streifen, und die
Lackierung hörte links und rechts davon einfach auf. Der Grund für die
Sonderbehandlung - eine ganze Flanke in zwei Pixel gequetscht ist ein Schmierer

- gilt nicht mehr, seit jede Kante nur noch ihr eigenes Stück des Bildes nimmt.
  Also bekommt jetzt **jede** Kante ein Bild: das der Wand, der sie am nächsten
  zeigt. Dazu passen Flanke und Enden ihre Streifen auf dieselben vier Zahlen an
  (`POLICE_BAND`), damit sie sich an der Ecke auch wirklich treffen; über die
  Front sacken sie dann in den Stoßfänger ab und wieder hoch, weil dort der Grill
  sitzt - genau wie am echten Wagen.

**Die Handbremse hält das Bremslicht an**, auch im Stand. Der Fuß auf der
Bremse tut das nicht: Ein Auto, das mit brennenden Bremslichtern steht, sieht
aus wie eines, das gleich anfährt. Ein Auto auf der Handbremse steht aber
absichtlich, und das ist eine Aussage wert.

**Rückfahrlicht für alle Fahrzeuge.** Das Heck kennt jetzt drei Zustände statt
zwei, und jedes Fahrzeug der Stadt hat alle drei: **rückwärts** ist weiß und
hell, **bremsen** ist dasselbe Rot nur härter, und sonst brennt das Rücklicht,
mit dem hier ohnehin jeder fährt. Rückwärts schlägt die anderen beiden, denn ein
Rückfahrscheinwerfer ist die einzige Leuchte an einem Auto, die etwas anderes
sagt als "hier bin ich" - sie sagt, dass das Ding gleich rückwärts auf einen
zukommt. Abgelesen wird sie an der Geschwindigkeit und nicht an einem Schalter:
Ein Wagen, der ohne Motor einen Hang hinunterrollt, fährt für jeden dahinter
trotzdem rückwärts.

**Das Polizeimotorrad ist eine BMW R 1300 RT** und damit eine eigene
Karosserie (`patrolbike`, Name "Polizeimotorrad"), kein Motorrad in Polizeilack.
Ein Tourer sieht anders aus als ein nacktes Motorrad, und zwar genau da, wo man
es von oben sieht: **vorn schmal, hinten breit**. Vorn Scheibe und Verkleidung,
hinten links und rechts ein Koffer - das ist die ganze Silhouette, mehr gibt
diese Größe nicht her. Vorlage ist
`game_instructions/GTA/Fahrzeuge/Polizei/polizei_motorrad.png`.

Zwei Dinge, die beim Zeichnen zählten:

- **Schmal bleiben.** Mit Koffern ist die RT tausend Millimeter breit gegen die
  achtzehnhundert des Autos. Beim ersten Versuch hatte ich sie zu breit gemacht,
  und dann ist sie von oben kein Motorrad mehr, sondern ein sehr kurzer
  Lieferwagen.
- **Die Räder gehören nach unten.** Ein Motorrad von der Seite ist überwiegend
  Rad; deshalb wird unterhalb der Achslinie nichts lackiert außer dem Motor
  zwischen den Rädern - und der ist kurz, denn ein Balken von Rad zu Rad macht
  aus den beiden eine einzige schwarze Masse.
- **Drei Stufen, kein Balken.** Vorn steht die Verkleidung am höchsten, dahinter
  fällt die Sitzbank ab, hinten sitzt der Koffer quer über dem Hinterrad. Diese
  gestufte Linie ist das Profil eines Tourers; ein durchgehender Streifen von
  vorn bis hinten ist das Profil eines Stoßfängers.

Die Blaulichter sitzen bei ihr auf Stielen neben der Scheibe statt auf einem
Dachbalken; sie blitzen im selben Takt wie die des Wagens.

**Ein Motorrad für alle.** Das normale Motorrad ist jetzt dieselbe Maschine wie
das Polizeimotorrad - derselbe Tourer mit Verkleidung und Koffern -, nur in
Grün oder Schwarz statt in der Lackierung und ohne alles, was blinkt
(`BIKE_PAINT`). Eine Form ordentlich schlägt zwei halbherzig, und eine Stadt, in
der die Polizei ein anderes **Fabrikat** fährt als alle anderen, ist eine Stadt,
in der jemand zwei Motorräder gezeichnet hat.

**POLIZEI steht auf beiden Koffern**, weiß auf blauem Feld, und wird genauso
seitenrichtig gespiegelt wie der Schriftzug an der Autotür.

**Drei Blaulichter**: eines neben jedem Griff und eines mittig am Heck, alle im
selben Takt wie die des Wagens. Die Gehäuse sind gemalt, damit man sie auch
sieht, wenn nichts brennt.

**Und es legt sich in die Kurve.** Zehn Pixel auf einer elf Pixel breiten
Maschine (`LEAN_MOST`) - eine ganze Motorradbreite: Vollgas auf vollem
Einschlag hängt der Fahrer **neben** seiner Maschine statt auf ihr.
Nachgemessen: 9,83 von 10, geradeaus null. Das ist weiter, als ein echtes geht,
und zwar mit Absicht - eine naturgetreue Schräglage ist von hier oben keine,
die jemand sieht, und gesehen werden ist der ganze Zweck.

Damit das ein **Kippen** bleibt und kein seitliches Wegrutschen, geht die Stadt
stockwerksweise mit: Die Reifen stehen, wo die Straße ist, die Schweller sind
schon zu einem knappen Drittel drüben (`LEAN_FOOT`), der Fahrer ganz. Jede
Wand hat dafür eine eigene Oberkante - unten die der Schweller, oben die des
Dachs -, und dieselbe Maschinerie, mit der eine schräge Frontscheibe ihr Dach
nach hinten zieht, zieht hier das Motorrad zur Seite.

Dazu wird sie oben **schmaler** (`LEAN_NARROW`): Ein Motorrad auf der Seite
zeigt einem, der von oben schaut, seine Flanke statt seines Sattels. Diese
Ansicht kann nichts umkippen, aber sie kann das Bild quer stauchen, und das
zusammen mit dem herausgetragenen Fahrer ist das, was aus einem Versatz eine
Schräglage macht. Zwei waren eine, nach der man suchen musste, vier eine, die
man sah, sechseinhalb eine, die man nicht übersah. Geneigt wird außerdem **gestaffelt**:
Die Räder und die Schweller gehen kaum mit (`LEAN_FOOT`), der Fahrer geht den
ganzen Weg. Ein Motorrad kippt um seine Aufstandspunkte, und alles um denselben
Betrag zu verschieben sah aus wie ein Motorrad, das seitlich wegrutscht,
während der Fahrer kerzengerade darauf sitzen bleibt.

Kurvenrate mal Geschwindigkeit ist der
seitliche Zug, und genau dagegen lehnt sich ein Fahrer: harte Kurve, weit
herüber; Schritttempo, aufrecht, egal was der Lenker macht (`LEAN_STIFF`,
`LEAN_MOST`). Gespeichert wird das als **Versatz in Pixeln**, nicht als Winkel,
denn diese Ansicht kann kein Bild kippen - was sie kann, ist Maschine und
Fahrer über den Rädern zur Seite schieben, und ein Fahrer zwei Pixel innerhalb
seiner eigenen Reifen liest sich als jemand in Schräglage. Geglättet statt
gesetzt, sonst schnippt es statt zu neigen.

**Ein Motorrad hat von vorn einen Reifen, und der ist so breit wie ein
Reifen.** Die Maschine ist elf Pixel breit, der Reifen keine drei davon - also
besteht die Stirnwand aus diesem einen schmalen, stehenden Streifen in der Mitte
und aus dem, was darüber steht: Verkleidung, ein Scheinwerfer, der Lenker. Vorher
stand dort ein ganzes Rad von der Seite, und weil die Draufsicht die beiden
Reifen ohnehin flach auf die Straße legt, hatte das Ding von Norden oder Süden
aus **vier** Räder - und keines in der Breite, die ein Reifen wirklich hat. Der
Lenker war dabei eine schwarze Platte über die volle Breite; jetzt ist er eine
Stange mit zwei Griffen.

Der Scheinwerfer sitzt mittig, weil der **leuchtende** dort sitzt: Ein Zweirad
trägt eine Lampe auf der Mittellinie (`LAMP_SIDES`), und der Schein, den der
Renderer darüberlegt, braucht ein Glas an genau dieser Stelle. Als Paar gemalt
ergaben die beiden plus der Schein dazwischen drei Lichter an einem Motorrad.

**Und die Ecken des Motorrads sind nicht mehr abgeschrägt** (`ROUNDS`). Eine
Fase ist ein ein bis zwei Pixel schmaler Wandstreifen, der sich seine Scheibe
aus dem Bild nimmt, dem er am nächsten zugewandt ist - an den Ecken eines
Motorrads ist das die **Flanke**, und vorn besteht die Flanke aus Reifen. Von
vorn stand deshalb links und rechts neben der Maschine ein schwarzer Strich auf
der Kante: zwei weitere Räder, genau dort, wo ein Motorrad überhaupt kein Blech
hat. Der Umriss ist jetzt ein schlichtes Rechteck - abzurunden gab es da nichts,
was jemand sehen konnte, denn die Keilform steckt in der Zeichnung.

**Der Motor darf kein Reifen sein.** Schwarz, flach und zwischen zwei
schwarzen Reifen hängend schloss er die Lücke zwischen ihnen: Von der Seite kam
die Maschine als eine lange dunkle Masse heraus - also als ein einziger sehr
breiter Reifen mit Verkleidung obendrauf. Jetzt ist er metallfarben, umrandet,
deutlich über der Straße und kurz genug, dass links und rechts Tageslicht
bleibt.

**Ein Zweirad hinterlässt eine Bremsspur, nicht zwei.** Es hat einen
Hinterreifen. Das Polizeimotorrad fehlte in `TYRE_TRACKS` und legte das Paar
hin, das ein Auto legt - ein Motorrad mit Hinterachse. Dasselbe für den Rauch
beim Driften.

**Eine Bremsspur ist eine Kurve, kein Lattenzaun.** Jede Marke wurde einzeln
gezeichnet, als kurzes Stück entlang der Richtung, in die ihr Reifen gerade
zeigte - und in einer Kurve ist das eine Reihe von **Tangenten**: Jeder Strich
steht an beiden Enden über die Kurve hinaus, und die Kurve selbst kommt
nirgends vor. Jede Marke weiß deshalb jetzt, welches Fahrzeug und welcher
Reifen sie gelegt hat (`Mark.car`, `Mark.lane`), und das Bild zieht die Linie
von einer zur nächsten. Diese Linie ist der Weg, den der Reifen genommen hat -
also genau die Spur, die er hinterlassen hat.

Gezeichnet wird das **stückweise statt paarweise**: Paar für Paar gestrichen
landet jede runde Kappe auf der nächsten und die Linie perlt. Eine ganze
Sekunde Bremsspur als ein einziger Pfad ist eine glatte Linie, und über eine
Sekunde gegen zwanzig Sekunden Verblassen unterscheidet sich die Schwärze um
ein paar Prozent - keine Naht wert. Zwei Spuren, die zeitlich oder räumlich
weit auseinanderliegen, werden dagegen nicht verbunden: Das sind zwei Spuren
auf der Straße und keine Linie von hier nach dort.

**Und der Rauch ist Rauch, kein Konfetti.** Drei flache Scheiben in einem Grau
lesen sich als drei Scheiben. Was ein brennender Reifen tatsächlich macht: eine
Fahne, die dort von der Straße abgeht, wo der Gummi ist, aufsteigt, sich
ausbreitet und hinter dem Wagen zu nichts ausdünnt. Also ist jede Wolke entlang
der Fahne größer als die davor, höher über der Straße und blasser - und jede
einzelne hat eine weiche Kante statt einer harten, was der ganze Unterschied
zwischen Rauch und einem hellgrau gezeichneten Kreis ist.

**Ein Fahrrad raucht gar nicht.** Auf zwei so dünnen Reifen liegt nicht genug
Gewicht, um etwas abzubrennen: Ein Fahrrad, das die Haftung verliert, rutscht,
und das ist alles.

**Die Nase läuft spitz zu - gezeichnet, nicht geschnitten.** Der naheliegende
Weg wäre gewesen, den Umriss vorn zusammenzuziehen, und das war der falsche:
Der Umriss ist das, was die Draufsicht beschneidet, also lagen bei einer
handbreiten Nase Scheibe, Spiegel und Blaulichter außerhalb davon - und was
außerhalb liegt, stempelt der Ring flach auf die Straße. Es lagen also plötzlich
Kästchen auf dem Asphalt. Der Umriss bleibt deshalb rechteckig, und die Spitze
steckt in der Zeichnung, wo sie nichts kostet: eine gebogene Verkleidung, die
vorn auf einen Punkt zuläuft, in der Draufsicht wie von der Seite.

**Das Bremslicht geht nur an, solange die Bremse auch bremst.** Jenseits von
null ist dieselbe Taste der Rückwärtsgang und keine Bremse mehr, und ein Auto,
das mit brennenden Bremslichtern rückwärts aus einer Lücke fährt, macht zwei
Dinge gleichzeitig. Nachgemessen: Auto −210 und Motorrad −40 Pixel pro Sekunde,
beide mit `braking: false`.

**Auf dem Sattel sitzt, wer darauf sitzt** - und das gilt fürs Fahrrad genauso.
Fremde Fahrräder haben einen Mann im gelben Trikot ohne Helm, ein
Streifenmotorrad einen Polizisten in dunklem Leder mit weißem Helm - und wenn
der Spieler eines von beiden nimmt, sitzt der Spieler darauf, in seinem Grün
und mit dunklem Kopf (`riderLook`). Eine Maschine, auf der noch der sitzt, dem
man sie gerade abgenommen hat, ist das Bild von jemandes anderem Fahrzeug. Das Bild
wird dafür zweimal vorgehalten, aber nur bei Zweirädern: Alles andere hat ein
Dach über dem Fahrer.

Und er hat Gliedmaßen. Vorher war er eine Platte mit einem Punkt darauf, und
eine Platte, die schmaler ist als die Wand, auf der sie steht, lässt links und
rechts Tageslicht durch - genau das ließ den Fahrer hohl aussehen. Jetzt sitzt
da jemand: **Arme nach vorn an den Lenker, Stiefel unten auf den Fußrasten**,
dazwischen ein Oberkörper, der den Sattel ausfüllt, und ein Helm mit Visier.
Von vorn stehen die Knie am weitesten heraus, so wie bei einem Menschen auf
einem Motorrad auch.

**Kein Rückfahrlicht, kein Rückwärtsgang.** Beides hängt an derselben Tatsache
(`twoWheeled`). Rückwärts geht es nur im Schritttempo - 40 Pixel pro Sekunde
gegen die halbe Höchstgeschwindigkeit eines Autos -, weil der Fahrer die Füße
auf den Boden stellt und schiebt. Nachgemessen: Auto −210, Motorrad −40.

**Und die Räder sind keine geschrumpften Autofelgen.** Ein Motorradrad ist
überwiegend Reifen, und was man darin sieht, ist eine **Bremsscheibe**: ein
heller Ring mit der Nabe in der Mitte und Luft zwischen den Speichen. Das
Profil sind Rillen rund um die Lauffläche - eine Spur heller als der Gummi und
ein Stück vor der Kante endend, sonst sieht das Rad aus wie ein Zahnrad. Rillen
und Speichen drehen sich mit demselben `spin` wie beim Auto, das Rad rollt also
sichtbar statt zu rutschen.

**Motorräder fahren auch Streife, aber es sind weniger.** Im normalen Verkehr
steht je einer von beiden in der Liste (`ON_THE_ROAD`) - der Sinn einer Streife
im Verkehr ist, dass ab und zu eine vorbeikommt, und mit zwei Wagen darin stand
an jeder zweiten Kreuzung einer. Und was
die Wache schickt, ist jeder vierte ein Kraftrad (`BIKE_EVERY`) - unterhalb von
zwei Sternen dagegen immer eines, denn ein Kraftrad ist das, was man zu einer
Verkehrssache schickt, und kein Wagen mit Besatzung. Der Testschalter, der
zwischendurch nur Motorräder fahren ließ, ist wieder draußen.

**Einsteigen ist ein Weg, keine Taste.** E setzt einen nicht mehr durch das
Blech hindurch auf den Sitz. Es schickt den Mann zur **Fahrertür**, und die ist
immer die **linke**: Links von einer Nase, die entlang `angle` zeigt, ist
`angle` minus ein rechter Winkel, denn in diesem Bild läuft y nach unten - wer
nach Osten fährt, fährt entlang positivem x und hat Norden, also negatives y,
vor dem linken Fenster. Dieselbe Seite benutzen der Herausgezerrte
(`tipOut`, `throwOut`) und der Aussteigende (`leaveCar`): Es ist eine Tür, und
sie ist immer dieselbe. Dort geht sie auf, und eine knappe halbe Sekunde später
(`DOOR_OPEN`) sitzt er drin. Wer vorher darin saß, steigt in genau diesem
Moment aus; das ist der eigentliche Zweck der Pause, denn ein Autodiebstahl,
bei dem der Fahrer im selben Augenblick verschwindet, in dem man die Klinke
berührt, ist ein Zaubertrick.

Drei Sachen daran waren nicht geschenkt:

- **Er läuft um den Wagen herum, nicht hinein.** Die Fahrertür liegt so oft auf
  der abgewandten Seite wie auf der zugewandten, und Blech ist fest. Geradeaus
  darauf zu drückte ihn an den hinteren Kotflügel, wo er stehen blieb und
  schob. Führt die Linie zur Tür in den Wagen, folgt er ihm stattdessen an der
  Tangente herum - den kürzeren Weg, mit einem kleinen Schlenker nach außen
  (`DOOR_SWERVE`). Der Schlenker ist keine Zierde: Ein Fahrzeug blockiert jeden
  Schritt, der nicht weiter von ihm weg endet als er begann, und ein Schritt
  exakt auf der Tangente hält den Abstand auf den Pixel genau.
- **Wem die Tür aufgerissen wird, der hält an.** Der Wagen geht dafür über
  dieselbe Bremse, die der Verkehr an einer roten Ampel benutzt - die
  Bremslichter gehen damit von allein an -, und ohne das fuhr der Fahrer
  einfach weiter, ließ den Mann auf der Straße stehen und hatte ihn eine halbe
  Sekunde später sechzig Pixel entfernt im Wagen.
- **Die Laufrichtungstasten brechen ab, aber erst nach einem Moment**
  (`BOARD_GRACE`). Fast jeder drückt die Taste im Gehen. Ohne diese
  Viertelsekunde bricht die Taste, die ihn hingetragen hat, genau das ab, was
  die andere Taste gerade begonnen hat, und Einsteigen ginge nur im Stand.

**Am Steuer ist der Daumen ein Kompass, kein Lenkrad.** Die vier Tasten sind
ein Lenkrad: Oben ist Gas, links und rechts ist Einschlag, und beides wird
gegen die Richtung gelesen, in die der Wagen gerade zeigt. Ein Daumen auf dem
Telefon ist das nicht - man schiebt den Stick dorthin, wo man hinwill, und
**unten heißt Süden, nicht rückwärts**. Der Stick schickt deshalb seine
Richtung mit (`Input.steer`), und hinter dem Lenkrad wird genau die benutzt:
Der Wagen dreht sich zu dieser Himmelsrichtung und fährt dorthin.

Gelenkt wird dabei **weich** statt bis zum Anschlag (`STICK_EASE`): voller
Einschlag, solange die Nase weit von der gewünschten Richtung weg ist, und
immer weniger, je näher sie kommt - sonst pendelt der Wagen ewig um die Linie.
Und die Tiefe der Ansicht wird herausgerechnet, bevor die Richtung in die Stadt
übersetzt wird: Das Bild staucht Norden und Süden, also will ein senkrecht nach
unten geschobener Daumen eine südlichere Richtung als derselbe Schub flach
gelesen - sonst führe der Wagen dorthin, wo der Daumen auf dem **Schirm** zeigt,
statt dorthin, wo er auf der **Karte** zeigt. Auf den Beinen ändert sich
nichts; Laufen war schon immer ein Kompass.

**Auf ein Zweirad steigt man nicht ein, man setzt sich drauf.** Ein Motorrad
hat keine Fahrertür und keine linke Seite, die diesen Namen verdient: Man steht
daneben, schwingt ein Bein darüber und sitzt. Auf welcher Seite man gerade
steht, ist dabei egal, also gibt es dort weder Weg noch Pause - die Taste setzt
einen sofort auf den Sattel. Für alles mit vier Rädern bleibt es der Weg zur
Tür, die aber **deutlich schneller** aufgeht als vorher: eine Siebtelsekunde
(`DOOR_OPEN`) statt einer halben. Man sieht es passieren und wartet nicht
darauf.

**Wer überfahren wird, steht schneller wieder auf.** Neun Zehntelsekunden
statt zwei und zwei Zehnteln (`FLOOR_SECONDS`): lang genug, um ein Preis zu
sein, und kurz genug, um einer zu bleiben. Bei zwei Sekunden saß man da und
sah der Straße beim Vorbeiziehen zu - was Überfahrenwerden kosten soll, ist
das Auto, das man gerade erreichen wollte, nicht die nächste Spielminute.
Dieselbe Zahl gilt für umgefahrene Polizisten.

**Und wenn an der Fahrertür eine Wand steht, nimmt er die andere Seite.** Ein
Wagen, der dicht an einem Haus parkt, hat eine Fahrertür, an der niemand stehen
kann; der Mann lief dorthin, stieß gegen die Hauswand und schob. Jetzt wird
geprüft, ob der Platz überhaupt frei ist, und wenn nicht, steigt er auf der
anderen Seite ein und rutscht hinüber - was jeder tut. Dazu geht er auch um
**Häuser** herum und nicht nur ums Auto.

**Und wo gar kein Weg hinführt, steigt er trotzdem ein.** Steht der Wagen so
eng, dass beide Türen in einer Wand liegen, wird der Gang erst gar nicht
angetreten: Die Taste setzt ihn sofort hinters Lenkrad. Und wer nach
`BOARD_PATIENCE` Sekunden noch nicht angekommen ist, kommt auch nicht mehr an -
dann steigt er ebenfalls einfach ein. Draußen vor einem Auto zu stehen, in das
man gerade einsteigen wollte, ist kein Ergebnis: Der Weg zur Tür ist die schöne
Art einzusteigen, keine Bedingung dafür.

Die offene Tür ist gemalt wie jede andere Wand auch: eine Platte, vorn
angeschlagen, um `DOOR_SWING` herausgeschwenkt, mit Glas im oberen Drittel. Ein
Motorrad bekommt keine - man macht ein Motorrad nicht auf, man schwingt ein
Bein darüber -, die Pause aber schon.

**Ein Polizeifahrzeug je Stern, und das gilt auch für die aus dem Verkehr.**
Die Leiter ist so schlicht, wie sie klingt: ein Fahrzeug bei einem Stern, zwei
bei zweien, bis sechs; ab fünf Sternen dazu der **Hubschrauber**, ab sechs
zusätzlich der **Panzer**. Beide zählen nicht mit, weil beide _dazukommen_ und
nicht _anstelle_ - der Panzer wird deshalb auch dann losgeschickt, wenn die
sechs schon draußen sind, sonst kam er nie, weil sechs umgeschaltete
Streifenwagen aus dem Verkehr das Kontingent längst gefüllt hatten.

Das Umschalten war nämlich das eigentliche Leck. "Wer Sterne hat, wird von
**allen** verfolgt" hieß wörtlich genommen: jede Streife der Stadt - und seit
welche im normalen Verkehr rollen, sind das einige - wurde beim ersten Stern
zum Verfolger. Ein Stern für eine gestohlene Handtasche und ein halbes Dutzend
Wagen hinterher. Jetzt wird nur die **Differenz** umgeschaltet, die nächsten
zuerst, und unter zwei Sternen Motorräder vor Wagen, weil ein Stern eine
Verkehrssache ist.

Dazu: **Wer niemanden drin hat, fährt auch nicht.** Ein Streifenwagen, dessen
Männer auf dem Gehweg stehen - oder dort liegen -, ist Kulisse, und genau das
sagt die Zählung längst über ihn. Ihn trotzdem weiter verfolgen zu lassen war
der Weg, auf dem eine abgeschüttelte Jagd am Ende mehr Wagen hatte, als die
Sterne hergeben.

**Zwei Sterne, sobald man auf einem Polizeifahrzeug sitzt** - Wagen wie Motorrad,
und egal, ob es einem Beamten abgenommen, am Bordstein gefunden oder sonstwie
beschafft wurde. Gesehen werden muss das von niemandem: Das Funkgerät darin
gehört ihnen, und es meldet sich nicht mehr, sobald jemand anderes am Lenker
sitzt (`PATROL_STARS`).

**Niemand ist auf Streife, solange jemand gesucht wird.** Ein Streifenwagen im
Verkehr ist Kulisse: Er hält sich an die Ampeln und verfolgt niemanden. Sobald
der Spieler einen Stern hat, hört das auf - **jedes** Polizeifahrzeug in
Sichtweite ist hinter ihm her, nicht nur das, was die Wache geschickt hat -, und
sobald er sauber ist, fängt es wieder an. Das ist der Unterschied zwischen einer
Verfolgungsjagd und einer Straße.

Gemacht wird das, indem sich ändert, **was der Wagen ist** (`callOffPatrol`),
nicht indem man dem Verkehr das Verfolgen beibringt: Verkehr und Polizei werden
von zwei verschiedenen Routinen gefahren, und ein Wagen, der beides ist, wird
pro Bild zweimal bewegt. Ein leerer Streifenwagen bleibt übrigens stehen, wo er
steht - einer, dessen Besatzung auf dem Gehweg steht, ist keine Streife, sondern
ein geparktes Auto.

**Die Faust trifft jetzt auch Blech.** Sie ging vorher durch Karosserien
hindurch, also war ein Faustschlag auf die Motorhaube eines Streifenwagens die
einzige Provokation der Stadt, die überhaupt nichts provoziert hat. Jetzt gibt
das **zwei Sterne und eine Verfolgung**, bei einem fremden Auto eine
Sachbeschädigung wie jede andere - also einen Stern, wenn jemand in Uniform
zusieht, und sonst nur Hitze.

**Und wer an einem Streifenwagen vorbei eine Straftat begeht, hat sofort einen
Stern.** Die Regel gab es schon - `trouble` vergibt den ersten Stern sofort,
wenn jemand in Uniform in Sichtweite ist -, aber sie zählte nur Wagen, die die
Wache losgeschickt hatte. Jetzt zählt **jedes** Polizeifahrzeug, also auch das
eine, das im normalen Verkehr mitrollt. Etwas vor dessen Nase zu tun heißt es
vor der Polizei zu tun.

**Und es kommen überwiegend Autos.** Die Streife war jede zweite ein Motorrad,
womit genauso viele Beamte auf zwei Rädern anrückten wie in Streifenwagen - ein
Motorrad schickt man aber zu einem Verkehrsverstoß, nicht zu einem Überfall. Ab
zwei Sternen ist jetzt nur noch jeder vierte Einsatz ein Motorrad
(`BIKE_EVERY`), der Rest kommt im Wagen. Bei einem Stern bleibt es beim
Motorrad, das ist Absicht.

Die Lackierung hängt an der Karosserie, nicht am Besitzer: Wer einen
Streifenwagen klaut, fährt weiter einen gestreiften Streifenwagen.

**Der Streifenwagen ist silbern, nicht weiß.** Vorlage ist
`game_instructions/GTA/Fahrzeuge/Polizei` - ein deutscher Streifenwagen, und
damit ein silbernes Auto mit blau-gelbem Band, kein weißes mit schwarzen Türen.
Das Weiß-Schwarze ist amerikanisch und war das eine Detail am Polizeiauto, an
dem man sofort sieht, in welchem Land man ist.

Drei Teile hat die Lackierung, und alle drei müssen mit sechs mal vierundvierzig
Pixeln auskommen:

- **Die Flanke ist komplett blau**, mit einem leuchtgelben Streifen unten und
  einem oben an der Schulterlinie - und dazwischen kein Lack. Vorher waren es
  Streifen auf silberner Flanke, was über dem Schriftzug ein graues Band stehen
  ließ; das las sich als Auto mit Aufkleber statt als lackiertes Auto.

- **Nase und Heck tragen nur den unteren Streifen**, darüber blau bis zur
  Schulter. Der zweite Streifen gehört zu den Seiten. Gemalt wird das vor
  Grill, Leuchten und Kennzeichen, die dann darauf sitzen wie am echten Wagen.

- **Grau bleibt nur das Dach.**

- **Dieselben zwei Bänder quer über Nase und Heck**, dort waagerecht, unten im
  Stoßfänger, sodass Kennzeichen und Leuchten darüber frei bleiben.

- **Der Balken vorn auf dem Dach**, an beiden Enden blau und in der Mitte
  dunkel, flach und breit statt als Kasten. Rot gehört auf dieser Seite des
  Wassers an ein Feuerwehrauto.

Von oben sieht man vom Seitenband nur die Oberkante: eine leuchtgelbe Linie an
jeder Flanke. Die hört allerdings fünf Pixel vor jedem Ende auf - ein Rechteck
über die volle Länge steht an den abgeschrägten Ecken über die Silhouette
hinaus, und was übersteht, stempelt der Ring flach auf die Straße. Das waren
zwei gelbe Sprenkel auf dem Asphalt.

**Und die Farben stehen in der Preisliste.** Ein Golf VIII wird in neun Lacken
ausgeliefert - Uranograu, Pure White, Anemonenblau Metallic, Crystal Ice Blue
Metallic, Delfingrau Metallic, Grenadillschwarz Metallic, Kings Red Metallic,
Oyster Silver Metallic und Oryxweiß Perlmutteffekt -, und die stehen jetzt in
`GOLF_PAINT` statt in der Buntstiftschachtel, aus der der übrige Verkehr lackiert
wird. Das ändert das Straßenbild: Echte Autos sind viel öfter grau, weiß und
schwarz als rot, und eine Reihe geparkter Golfs liest sich damit als Reihe
Autos statt als Farbkarte.

Drei davon sind hell, und genau das hatte die alte Palette vermieden: Ein weißes
Auto könnte man für den DMC-12 halten, das einzige Fahrzeug der Stadt, für das
man über eine Kreuzung läuft. Keiner der drei ist allerdings das blanke Blech
des DMC (`STEEL`), und ein Schrägheck ist kein Keil mit Flügeltüren - die beiden
sind also weiterhin an allem außer einem Blick auf die Farbe zu unterscheiden.

**Die Zahlen sind gemessen, nicht geschätzt.** Zu diesem Auto gibt es ein
3D-Modell (`game_instructions/vw-golf-mk8-gti-2022.stl`, 446 809 Dreiecke). Aus
dem lässt sich jede Zahl dieses Abschnitts ablesen, statt sie aus Fotos zu
raten: Die Dreiecke werden auf die drei Ebenen projiziert und so skaliert, dass
der Wagen 44 Pixel lang ist, dann liest man das Dachprofil Scheibe für Scheibe
ab. Die Gegenprobe ist der Radstand - gemessen 26,4 Pixel, laut Datenblatt
2620 von 4284 Millimetern, also 26,9. Wer so nah liegt, hat die richtige Achse
erwischt.

Zwei Werte waren daraufhin grob falsch:

- **Die Scheibe liegt zwölf Pixel zurück, nicht fünf.** Eine moderne
  Windschutzscheibe ist ein Viertel der ganzen Draufsicht. Geraten hatte ich
  ein Drittel davon.
- **Die Kabine ist viel schmaler als der Wagen**, 14,6 gegen 18,4 - das Dach
  eines Golf ist drei Viertel so breit wie seine Schulter. Gezeichnet war sie
  fast so breit wie die Karosserie.

**Das Heck ist aus dem Werksfoto ausgemessen** (`Golf-8-hinten.webp`), und
zwar in Anteilen: Der Boden des Fotos ist null, die Schulterlinie ist eins, und
jede Kante wird als Bruchteil dieser Strecke abgelesen. Drei Dinge waren falsch:

- **Die Rückleuchte ist ein Flügel, kein Klotz.** Außen ist sie tief
  (0,169 der Wandhöhe), nach innen läuft sie auf ein abgerundetes Ende zu, das
  noch gut halb so hoch ist, und sie endet bei 0,444 der halben Breite. Als
  zwei gleich hohe Rechtecke gezeichnet sieht das Heck aus wie eine Limousine.

- **Die Heckklappe hat einen Umriss, und die Leuchte liegt darin.** Die
  Schattenfuge läuft neben der Scheibe herunter, **quer durch die Leuchte** bei
  0,77 der halben Breite, und biegt deutlich unter dem Emblem quer über den
  Wagen (`GOLF_HATCH`, `GOLF_LID_SIDE`, `GOLF_LID_FOOT`). Ohne sie ist das Heck
  eine leere Platte und die Leuchten wirken aufgeklebt statt zur Hälfte im
  Deckel zu sitzen.

- **Keine Reflektorleiste auf dem Stoßfänger.** Der Wagen hat eine, eine
  Handbreit unter der Fuge - und eine Handbreit sind hier ein Pixel. Gezeichnet
  verschmierte sie genau die eine Linie, an der man die Klappe erkennt.

**Und der Wagen steht niedriger.** `tall` war mit 15,3 die wahre Höhe im
Maßstab des Modells, nur wird in dieser Projektion der Boden mit `DEPTH` (0,82)
gestaucht und die Höhe nicht - also stand das Auto höher über seinem eigenen
Grundriss, als es das in Wirklichkeit tut, und sah von der Seite aus wie ein
Kastenwagen. Jetzt sind `tall` und `belt` um denselben Faktor gestaucht wie der
Grundriss (12,6 und 8,9), und `GOLF_TYRE` ist entsprechend nachgezogen, damit
das Rad nicht mitschrumpft.

**Das Rad ist zu sieben Zehnteln Felge.** Gemessen wird es, indem man das
Vorderrad in dünne Scheiben schneidet und zusieht, wie die Sehne wächst: Der
Reifen kommt auf sieben Pixel bei 44 Pixel Wagenlänge, also 680 Millimeter -
und die Speichenenden und das Felgenhorn sitzen bei 0,7 des Radius, was einer
18-Zoll-Felge entspricht. Gezeichnet war es andersherum, ein kleiner silberner
Nabendeckel in einer schwarzen Scheibe, und damit fuhr die ganze Stadt auf
Vollgummi. Jetzt ist das Schwarz ein Band am Rand, darin liegt das dunkle
Felgenbett, und darüber fünf helle Speichen, das Horn und die Nabe
(`WHEEL_RIM`, `WHEEL_SPOKES`). Davon profitiert jedes Fahrzeug, das `wheelAt`
benutzt, nicht nur der Golf.

**Die Räder drehen sich, und zwar untersetzt.** Ein Auto merkt sich in
`rolled`, wie weit es gerollt ist - vorzeichenbehaftet, rückwärts zählt
rückwärts, und gezählt wird, was es **wirklich** geschafft hat, damit die Räder
an einer Wand nicht durchdrehen. Es ist derselbe Trick wie `Player.walked` beim
Gehen: Der Renderer muss sich zwischen zwei Bildern nichts merken, und ein
geladener Spielstand kommt mit den Rädern zurück, wie er sie verlassen hat.

Nur darf man den Winkel nicht einfach hinschreiben. Ein Rad ist hier sechs Pixel
groß und dreht sich alle neunzehn Pixel Straße einmal - bei Verkehrstempo also
sechsmal pro Sekunde, 36 Grad von einem Bild zum nächsten, gegen ein
Speichenmuster, das sich alle 72 Grad wiederholt. Exakt gezeichnet säße jedes
Rad der Stadt genau auf der Kante des Wagenrad-Effekts: die Hälfte liefe
rückwärts, der Rest stünde still. Deshalb wird der gezeichnete Winkel mit
`WHEEL_GEAR` auf ein Drittel untersetzt - das sind zwölf Grad pro Bild, lesbar,
richtungsrichtig und proportional zum Tempo. Über `WHEEL_FAST` (230 Pixel pro
Sekunde, also deutlich über Verkehrstempo und gut unter Höchstgeschwindigkeit)
verschwimmen die Speichen zu der grauen Scheibe, die ein schnelles Rad
tatsächlich ist. Beides zusammen ist das, was eine Engine mit Rädern macht, die
zu klein zum ehrlichen Animieren sind.

Gezeichnet wird das über den Bild-Cache: `wheelStep` liefert eine Stufe von 0
bis 5 (sechs Bilder über **eine** Speiche - fünf Speichen sehen alle gleich aus,
nach 72 Grad ist das Rad wieder da, wo es war) oder `WHEEL_SMEAR`. Die Stufe
steckt im Cache-Schlüssel, aber nur bei den Flanken: Nase, Heck und
Windschutzscheibe haben keine Räder und werden nicht siebenfach vorgehalten.

**Minus, nicht plus.** Ein Flankenbild wird mit der Nase nach rechts gemalt,
ein vorwärts fahrendes Auto fährt also nach rechts, und ein nach rechts
rollendes Rad dreht sich im Uhrzeigersinn. Das Wandbild wird aber mit der
Straße unten und der Höhe nach oben gezeichnet (`ctx.scale(GRAIN, -GRAIN)`),
und in dieser Lage zählen die Winkel **gegen** den Uhrzeigersinn - der Schritt
muss also abgezogen werden. Mit Plus lief jedes Rad der Stadt exakt verkehrt
herum.

**Die Handbremse hält das Hinterrad an.** Sie wirkt nur auf die Hinterachse,
also stehen die hinteren Räder still, während die vorderen weiterrollen - und
genau das ist von der Seite der Unterschied zwischen einem Auto, das bremst, und
einem, das per Handbremse um die Kurve geworfen wird. `Car.locked` ist dafür da
und nicht `Car.braking`: Letzteres ist auch beim Fußbremsen an. Gezeichnet wird
das blockierte Rad auf einer festen Stufe statt auf der, bei der es zufällig
stehengeblieben ist - eine Lüge, die sechs Pixel wert ist, denn was man in
dieser Größe liest, ist "dreht sich nicht", nie "welche Speiche steht oben".

**Der Radlauf beginnt jetzt auf Achshöhe.** Dort ist der Reifen am breitesten.
Weiter unten angesetzt standen seine beiden unteren Ecken über die Rundung des
Reifens hinaus, und was man sah, war ein dunkles Dreieck links und rechts neben
jedem Rad, das auf der Straße stand und nichts war.

**Über der Frontscheibe stand ein zweiter schwarzer Balken.** Die Scheibe hörte
0,7 Pixel vor der Oberkante ihrer Wand auf, und in diesem Streifen lag die
Lackfarbe mit je einer schwarzen Linie darüber und darunter - gedacht als
Dachrahmen, gezeichnet als Balken. Ein Dachrahmen ist an einem Auto eine
Handbreit Blech, hier also nichts: Die Scheibe läuft jetzt bis an die Dachkante
durch, genau wie sie seitlich schon bis an die Kanten läuft.

**Die Glühpunkte sitzen da, wo die Leuchte gemalt ist.** `LAMP_HIGH_OF` galt für
beide Enden, und die Rückleuchten eines Golf sitzen eine halbe Bordwand höher
als die Scheinwerfer - der rote Punkt schwebte also unter der Leuchte im
Kofferraumdeckel. Es gibt jetzt `LAMP_BACK_OF` für das Heck, und `TAIL_GLOW`
ist kleiner: Durch einen Lichtklecks von doppelter Leuchtengröße sieht man
weder den Flügel noch die Fuge.

Und drei Kleinigkeiten, die erst im Bild auffielen:

- **Der Spiegel gehört in die Draufsicht, nicht an die Flanke.** Laut Mesh sitzt
  er bei x 4,8 bis 6,8 mit der Mitte auf der Schulterlinie - und die
  Schulterlinie ist die Oberkante des Flankenbildes. Alles, was dort gezeichnet
  wird, steht über der Motorhaube davor wie eine Antenne.
- **Die A-Säule wird in Wagenfarbe gezogen, nicht in Tinte.** Der Rand des
  Kabinenbildes _ist_ die Säule; schwarz gestrichelt liest sie sich von der
  Seite als Mast aus der Haube.
- **Das Rad hat 7 Pixel Durchmesser.** Aus den Seitenwandpunkten des Mesh einen
  Kreis gefittet: bei z = 1,75 ist die Sehne 3,06 breit, was auf r = 3,5 führt.
  Der Radlauf ist entsprechend weiter, damit der Reifen ihn auch ausfüllt.

Dazu kam die Breite selbst: 4284 zu 1789 Millimeter sind 44 zu **18,4** Pixel,
nicht 44 zu 24. Die 24 waren eine Schätzung und der Grund, warum das Auto wie
ein Kastenwagen aussah. Rad (6,6 Pixel Durchmesser), Radstand, Schwellerhöhe
und Schulterlinie kommen aus derselben Messung.

Was der Schrägsicht nicht beizubringen ist: Die Kamera steht fast senkrecht,
also ist das Dach eine große Fläche und die Flanke ein schmales Band. Die
Silhouette aus der Seitenansicht kann dieses Bild nicht zeigen - was es zeigen
kann, sind die Kanten, die Rundungen und die Lichter, und die sind es.

**Eine Windschutzscheibe steht schräg, also steht ihre Wand schräg.** Das Dach
der Kabine ist kürzer als ihr Boden - so weit, wie die Scheibe sich zurücklegt -
und die Wand dazwischen war trotzdem senkrecht. Also endete das Dach ein paar
Pixel vor der Oberkante seiner eigenen Wand, und durch den Schlitz sah man je
nach Blickwinkel ins Freie. Eine Wand hat jetzt eine eigene **Oberkante**
(`Storey.lean`): unten die Standfläche, oben die Linie, auf die das Dach
zugeschnitten ist. Nur die Enden neigen sich; die Flanken nicht, denn in deren
Bild ist die Schräge beider Scheiben schon eingezeichnet, und geneigt würde sie
doppelt gezählt.

**Von oben sieht man keine Reifen.** Ein Auto von senkrecht oben ist Blech: Die
Reifen stehen unter den Radkästen, und zu sehen sind sie nur von der Seite - wo
sie das Wandbild ohnehin zeichnet. Im Draufsicht-Bild standen sie seitlich über
die Karosserie hinaus, was von vorn vier freistehende Reifen neben ein Auto mit
Radkästen stellte und von der Seite unter jedes Rad einen schwarzen Balken legte.
Beides ist weg, und mit ihm der Grund für den Ring-Durchgang: Was im Bild
außerhalb der Silhouette liegt, landet auf der Straße - also liegt jetzt nichts
mehr dort. Spiegel und Rammbügel sind nach innen gerückt.

**Nur der Reifen berührt den Boden.** Schweller und Radkasten hören darüber auf.
Sie liefen bis auf die Straße herunter, was einen schwarzen Strich unter das
ganze Auto und quer über jede Aufstandsfläche legte - und ein Reifen mit einem
dunklen Band über der Aufstandsfläche sieht platt aus.

**Der Traktor ist nach denselben Regeln gebaut.** Seine Wandbilder wurden aus
einer linken oberen Ecke in ein Bild gezeichnet, dessen Nullpunkt die Mitte der
Bodenlinie ist: Der Rumpf schwebte, die Kabine saß darunter und die Räder hingen
über dem Dach. Jetzt hat er wie alle anderen eine Silhouette (`NARROWS`), eine
Kabine (`cabinOutline`) und Wände, die auf dem Boden stehen. Seine Räder sind die
einzigen, die von oben zu sehen sind - die stehen bei einem Traktor wirklich
außen -, und sie beginnen genau an der Silhouette, damit dazwischen keine Straße
durchblitzt.

**Licht ist keine Farbe, sondern Licht.** Scheinwerfer und Rücklichter werden in
der Zeichenphase mit `lighter` obendrauf gelegt, nicht ins Sprite gemalt: Ein
weißer Aufkleber sieht aus wie ein weißer Aufkleber.

**Aber das Glas gehört darunter.** Eine Lampe, die nur aus addiertem Licht
besteht, wird weiß, so rot sie auch gemalt ist: Ein Rot mit etwas Grün und Blau
darin, addiert auf eine Farbe, die beides schon hat, sättigt alle drei Kanäle -
und drei gesättigte Kanäle sind Weiß. Also erst das Glas deckend (`source-over`),
dann den Hof darum additiv, und der Hof fast reines Rot. Ein Rücklicht, das man
vom Scheinwerfer nicht unterscheiden kann, ist schlimmer als gar keins. Sie brennen immer - das ist
nicht Realismus, sondern Lesbarkeit: zwei weiße Punkte und zwei rote sagen aus
vierzig Metern, wo bei einem vier Pixel großen Ding vorn ist. `Car.braking` sagt,
wann die roten heller werden; geschrieben wird es dort, wo über das Tempo
entschieden wird, gelesen nur vom Renderer.

Was sonst noch daran hängt:

- **Reifen.** Ein Auto ist viereinhalb Meter lang und seine Reifen sind zwei
  Drittel Meter hoch - bei diesem Maßstab gut sechs Pixel, nicht drei. Sie
  waren drei, was als Möbelrolle durchging, solange sie auf Gürtelhöhe
  mitschwammen; seit sie auf der Straße stehen, fällt es auf. Draufsicht und
  Seitenansicht rechnen jetzt dieselbe Größe aus.
- **Bündige Enden.** Die Draufsicht wölbte sich vorn und hinten anderthalb
  Pixel über den Quader hinaus. Die Wände stehen aber genau an den Enden - was
  das Dach darüber hinausträgt, hängt in der Luft und sah von vorn aus wie eine
  durchhängende Motorhaube. Jetzt endet die Karosserie exakt an der Stoßstange.
- **Weicher Schatten.** Er war eine Ellipse mit harter Kante und schnitt genau
  durch die Räder, die darauf stehen - ein Reifen mit dunklem Band quer über
  der Aufstandsfläche sieht platt aus. Jetzt läuft er nach außen aus (das gilt
  für alle Schatten im Spiel, auch die der Figuren), und die Reifen bekommen
  oben eine hellere Lauffläche, damit sie als runde Dinger lesen.
- **Windschutzscheibe.** Ein Kasten hat eine senkrechte Scheibe, was seit
  ungefähr 1935 kein Auto mehr hat. `VehicleTiers.rake` sagt, wie weit sie sich
  zurücklegt - und **das Dach muss mit**: Es endet dort, wo die Scheibe endet,
  nicht dort, wo die Kabine auf dem Blech steht. Sonst ragt es über das Glas
  hinaus. Die Heckscheibe legt sich etwa halb so weit.

## Der Berg ist ein Höhenfeld, keine Schraffur

Es gibt in diesem Bild keine Höhe, also wurde der Berg gezeichnet, wie ein
Atlas einen zeichnet: eine Lasur, die zur Mitte hin heller wird, mit Ringen
darauf. Das las sich als beigefarbener Essteller.

Was eine Engine stattdessen tut, tut jetzt auch dieser Renderer: **ein
Höhenfeld, und Licht darauf.** `heightAt` ist die Form des Bergs - ein Kegel
mit Kämmen, die daran herunterlaufen, und drei Oktaven Rauschen obendrauf -,
und jedes Pixel wird danach eingefärbt, wie sein eigenes Stück Hang gegen ein
Licht von Nordwesten geneigt ist. Kämme und Rinnen entstehen dabei von selbst,
denn genau das **ist** Schattierung. Nichts daran ist ein Bild von einem Berg;
es ist ein beleuchteter Berg.

Zwei Dinge, die man dabei lernt:

- **Eine Welle, die um den Berg läuft, hat am Gipfel unendliche Steigung.** Ihre
  Steigung ist ihre Höhe geteilt durch den Abstand zur Mitte. Auf voller Höhe
  gehalten malte die Schattierung deshalb einen Stern auf die Bergspitze. Die
  Kämme wachsen jetzt mit dem Radius mit, dann ist ihre Steigung überall
  ungefähr gleich.
- **Die Farbbänder werden gemischt, nicht gestuft.** Gestuft trägt das Rauschen
  ganze Hangstücke auf einmal über eine Grenze, und der Berg zerfällt in flache
  Farbinseln - das ist wieder die Höhenschichtkarte.

**Ausgeschnitten nach dem Boden.** Jedes Pixel fragt den Boden, ob es auf Fels
steht, zwischen den Feldmitten geglättet, und blendet aus, wo nicht. Das ist es,
was den Bergfuß von der Straße um ihn herum fernhält - die Lasur war eine große
Ellipse und lag einfach über dem Asphalt - und dasselbe schneidet die Piste in
den Hang, denn deren Felder sind auch kein Fels.

Einmal in ein Bild gerechnet, und die Höhen zuerst in ein `Float32Array`: Die
Schattierung braucht zu jedem Pixel auch die vier Nachbarhöhen, und die
nochmals auszurechnen ist dieselbe Summe fünfmal - bei einem Berg dieser Größe
zehn Millionen Sinus und ein sichtbares Stocken, wenn man das erste Mal
vorbeifährt.

## Ein Fahrrad ist ein Strich mit zwei Ringen

Drei Dinge machen eines aus, und alle drei sind Weglassungen.

**Man sieht hindurch.** Ein Fahrradrad ist ein dünner Reifen auf einer dünneren
Felge, und dazwischen sind ein paar Dutzend Drähte - also wird hier gar nichts
gefüllt (`cycleWheel`): Der Reifen ist ein **gestrichener** Kreis, und was
darin steht, ist das, was gerade hinter dem Fahrrad ist. Vorher war es eine
schwarze Scheibe mit sechs Strichen drüber, und eine schwarze Scheibe ist ein
Mofa. Die Speichen drehen sich mit wie bei jedem anderen Rad der Stadt; bei
hohem Tempo verwischen sie zu einer Scheibe, durch die man immer noch
hindurchsieht.

**Und es hat pro Ende genau einen Reifen.** In der Draufsicht wurden auch noch
welche gezeichnet; die stempelt der Körperstempel auf Gürtelhöhe, also hing
hinter dem Reifen, den die Wand malt, ein zweiter in der Luft. Die Draufsicht
malt jetzt keine mehr - die Wände können das, und bei einer Maschine ohne Blech
darüber ist ohnehin nur das zu sehen, was die Wände malen.

Dazu bekommt das Fahrrad als einziges Fahrzeug der Stadt **nur die zugewandte
Flanke** (`single`). Von jedem Auto wird jede Wand gemalt, die abgewandten
zuerst, weil ein Auto Volumen zwischen seinen Flanken hat und die nahe die
ferne verdeckt - lässt man die ferne weg, klafft Tageslicht zwischen Dach und
Blech. Ein Fahrrad hat dieses Volumen nicht und nichts, wovor sich etwas
verstecken könnte: Beide Flanken landen ein paar Pixel auseinander im Freien,
und weil man durch die Räder hindurchsieht, waren es **vier** - zwei auf der
Straße und zwei darüber schwebend.

**Von oben ist es ein Strich.** Neun Pixel breit statt zwölf, und die meisten
davon sind der Mensch: Reifen und Rahmen sind so schmal gezeichnet, wie sie
sind, und das Breiteste am Fahrrad sind die Schultern dessen, der darauf sitzt.

**Und es hat kein einziges Licht** - keinen Scheinwerfer, kein Rücklicht, kein
Bremslicht, denn es hat keine Batterie und nichts, womit man eins einschalten
würde. Eine leere Liste in `LAMP_SIDES` schaltet Glas, Schein, Bremse und den
Lichtfleck auf der Straße in einem Zug ab: Alle vier fragen dort zuerst nach.

Der Rahmen ist dazu das Diamant-Dreieck, nach dem Fahrräder seit hundertdreißig
Jahren gebaut werden - Sitzrohr, Unterrohr, Oberrohr und die beiden Streben zur
Hinternabe -, gezeichnet als Linien so dick wie die Rohre. Als Fläche gemalt
kam ein grauer Kasten heraus, in dem ein Mann saß.

**Es brennt auch nicht.** Ein Fahrrad hat keinen Tank, keinen Sprit und keinen
Motor; wenn man darauf schießt, hört es auf, ein Fahrrad zu sein - der Rahmen
verbiegt sich, die Räder sind hin, und es liegt auf der Straße. Es bekommt
deshalb nie eine `Car.fireAt`, und das nimmt ihm in einem Zug den Rauch, die
Flammen, den Countdown und den Knall am Ende: Alle vier fragen dort zuerst
nach. Übrig bleibt der Ruß, den das Bild jedem Wrack gibt - kaputt, nicht
abgebrannt.

**Und es fährt langsamer als ein Auto.** Der Verkehr lief mit einer einzigen
Zahl, also hielt der Mann, der zur Arbeit radelt, mit dem Golf neben sich mit -
das Einzige an einem Fahrrad im Verkehr, das noch nie jemand gesehen hat. Er
fährt jetzt `PEDAL_SHARE` davon, also gut die Hälfte: sechzig Pixel die
Sekunde gegen hundertzehn. Das macht ihn nebenbei zum Hindernis, was der Grund
ist, ihn überhaupt auf die Straße zu stellen.

## Der Transporter ist ein Kasten auf Rädern

Sechs Meter davon, gut zwei breit, ein Laderaum, in dem man stehen kann: 62 mal
22 Pixel, ein Drittel länger als ein Streifenwagen. Er fährt wie das, was er
ist - träge los, träge oben, und **absichtlich schlecht um die Kurve**: Ein
hoher Kasten mit dem Gewicht im Dach legt sich auf die Außenreifen und schiebt
über die Vorderachse, was die niedrige Haftungszahl sagt. Wozu er taugt, ist im
Weg zu stehen.

**Hoch, aber nicht so hoch wie zuerst.** Fünfundzwanzig Pixel sind bei 8,6
Pixeln pro Meter 2,9 Meter, und das ist ein Kastenwagen mit Hochdach; im
Verkehr las er sich auch so. Einundzwanzig sind 2,44 Meter - ein gewöhnlicher
Lieferwagen, und immer noch das Höchste auf der Straße, was kein Lastwagen
ist.

Er ist das einzige Fahrzeug der Stadt, dessen **oberes** Stockwerk das größere
ist. Bei einem Auto ist die Kabine ein Glashaus auf einer Motorhaube; bei einem
Transporter ist sie der Laderaum, sie ist über die volle Breite, sie fängt
hinter dem Fahrer an und geht bis an die hintere Stoßstange. Und das Dach des
Fahrerhauses liegt auf derselben Höhe wie das des Kastens, weshalb das obere
Stockwerk über die ganze Länge reicht - sonst läge die Windschutzscheibe einen
Stock zu tief.

Gezeichnet wird alles als Kasten: quadratisch hinten, quadratisch an den
Seiten, nur vorn zieht sich das Fahrerhaus ein. Alles, was ein Auto zum Auto
macht - die verjüngte Schnauze, die gefasten Ecken, das umlaufende Fensterband
-, ist genau das, was dieser nicht haben darf.

Der Name steht in Gelb auf den **Flanken und der Hecktür**, wo eine Firma ihn
hinmalt und wo man ihn vom Gehweg aus liest - nicht auf der Front, und nicht in
der Draufsicht. Und er muss seitenrichtig stehen, egal, wohin der Wagen fährt.
Das ist `WallJob.mirror`, und die Frage davor war falsch gestellt: Eine
gespiegelte Kopie einer Wand bekam nur, **wer Räder auf dieser Wand hat** -
also die untere Flanke eines Streifenwagens oder eines Taxis. Beim Transporter
steht die Schrift aber auf dem **oberen** Stockwerk, also gab es die zweite
Kopie nie, und beide Flanken bekamen dasselbe Bild, gezeichnet mit der Nase
nach rechts. Nach links gefahren stand da `sdu`. Gefragt wird jetzt, welche
Wände **beschriftet** sind, und das ist pro Karosserie eine andere Antwort.

Drei Dinge daran waren Bilder von Teilen statt Teile:

- **Keine Räder auf Bug und Heck.** Da standen zwei ganze runde Räder mitten
  auf den Hecktüren. Von hinten sieht man von einem Transporter die äußere
  Flanke der Reifen um die Ecke und sonst nichts - also derselbe schmale
  Streifen Gummi an jeder Kante, den auch das Heck des DeLorean bekommt.
- **Keine Reifen in der Draufsicht.** Was dieses Bild außerhalb des Umrisses
  zeichnet, stempelt der Ring flach auf die Straße - genau dafür ist er da, und
  bei einem Auto, dessen Reifen über die Flanken stehen, stimmt das auch. Beim
  Transporter lagen dadurch vier schwarze Balken im Rinnstein neben Rädern, die
  die Flankenwände längst richtig gezeichnet hatten. Die Reifen stecken hier
  unter dem Kasten, und gezeichnet werden sie nur auf den Wänden.
- **Die Spiegel gehören neben die Fahrertür** - und **innerhalb** des
  Umrisses. Mit ihnen ging es zweimal schief, und beide Male endeten sie als
  Müll auf der Straße: an der Nase hingen sie einen Pixel frei vor der gefasten
  Ecke, und nach hinten ans Fahrerhaus versetzt standen sie immer noch über die
  Flanke hinaus - und was über den Umriss hinaussteht, stempelt der Ring flach
  auf den Asphalt. Zu sehen war ein kleiner schwarzer Balken unter dem
  Vorderrad. Sie sitzen jetzt da, wo jeder andere Spiegel der Stadt sitzt:
  innen an der Blechkante, gezeichnet auf der Flankenwand.

Und **keine Windschutzscheibe in der Draufsicht**: Die Nasenwand hat schon eine,
und eine zweite kommt als Glasband direkt dahinter heraus - derselbe Fehler, den
vorher das Panzerrohr gemacht hat.

## Ein Traktor ist sein Hinterrad

Es gibt genau ein Fahrzeug, dessen Proportionen man benennen kann, ohne den
Rest gesehen zu haben: riesige Triebräder hinten, kleine Lenkräder vorn, und
der Unterschied ist nicht fein - er ist mehr als das Doppelte. Gezeichnet war
er als halbe gegen drei Zehntel Bordwandhöhe, in der Draufsicht achtzehn mal
sieben gegen zehn mal viereinhalb. Das ist ein Lieferwagen mit ungleichen
Reifen.

Jetzt sind es `FARM_BACK_TYRE` gegen `FARM_FRONT_TYRE` - 0,62 gegen 0,27 der
Bordwand -, und damit dafür überhaupt Platz ist, ist die **Gürtellinie** des
Traktors höher gelegt (16 statt 13): Das Rad wird innerhalb des unteren
Stockwerks gezeichnet, also entscheidet dessen Höhe, wie groß es werden kann.
Das ist keine verschobene Zahl, sondern die Form der Maschine - die Motorhaube
eines Traktors sitzt oben auf einem Hinterrad, das einem Mann bis an die
Schulter geht.

Dazu bekommt er ein eigenes Rad (`farmWheel`) statt des Stadtreifens: **Stollen**
rundherum, schräg gestellt, die sich mitdrehen, und darin eine schmale
Stahlfelge mit sechs Schrauben. Eine glatte schwarze Scheibe dieser Größe am
Heck eines Traktors liest sich als Kirmesfahrgeschäft; und weil ein
Traktorreifen gerade davon lebt, wie viel Gummi zwischen Felge und Boden steht,
nimmt die Felge nur `FARM_RIM_SHARE` des Rades ein. Die Stollen stehen auch in
der Draufsicht, als Reihe von Balken quer über den Reifen - von oben ist das
die Hälfte dessen, was einen Traktor ausmacht.

**Und die Räder stehen nicht mehr raus.** Die Silhouette war ein schmales
Trapez - vier Zehntel der Breite an der Schnauze, zwei Drittel am Heck - und
die Räder lagen außerhalb davon. Was außerhalb der Silhouette liegt, stempelt
der Ring aber flach auf die Straße: zwei schwarze Platten neben der Maschine,
jede der Länge nach halbiert von der Karosserie, die darüber gestempelt wird.
Ein Traktor mit je einem **halben Rad** auf dem Asphalt daneben, und ein
Drittel zu breit.

Die Silhouette ist deshalb jetzt rechteckig und die **schmale Haube ist
aufgemalt** - dieselbe Lehre, die vorher schon die Motorradnase gelernt hat:
Was das Bild leer lässt, bleibt leer, also kostet eine volle Kontur nichts und
bringt eine Maschine, deren Räder innerhalb ihrer eigenen Form liegen. Die
Wände an den Enden zeichnen die Haube entsprechend schmal (`FARM_NOSE`,
`FARM_TAIL`), sonst hätte der Traktor einen Kühler so breit wie seine
Hinterachse.

Die **Rücklichter** sitzen dazu oben auf den Kotflügeln (`LAMP_BACK_OF` 0,98)
statt auf halber Bordwand, wo sie hinter dem Hinterrad lagen - das ist zwei
Drittel der Bordwandhöhe hoch.

Der Rest ist das, was man an einem stehenden Traktor sieht und vorher nicht
sah: das **Kotflügelblech** über dem Hinterrad, die **Trittleiter** daran
hoch, die **Kiemen** entlang der Haube, der **Kühlergrill** mit den Scheinwerfern
auf den Haubenecken, der **Auspuff**, der vor der Kabine hochsteht, die
**Kabinentür** mit Griff und Spiegel am Ausleger, zwei **Arbeitsscheinwerfer**
vorn auf dem Dach, die beiden **Hubarme** der Dreipunkt-Hydraulik neben dem
Zughaken - und das **orange Rundumlicht** auf der Dachecke, das an dieser Größe
der einzige Farbfleck ist, der Landmaschine statt Kleinlaster sagt.

## Der Cybertruck ist der Golf rückwärts

Derselbe Kasten, dieselben drei Stockwerke, und trotzdem das Gegenteil - weil
alles, was den Golf ausmacht, hier **weggelassen** wird:

| Golf                           | Cybertruck                            |
| ------------------------------ | ------------------------------------- |
| zwölf Ecken, gefast            | vier Ecken, scharf                    |
| Radlauf ins Blech geschnitten  | schwarzes Trapez aufgesetzt           |
| zwei Lampen plus Balken        | ein Balken, durchgehend, beide Enden  |
| Scheiben mit Rahmen und Säulen | eine Scheibe, ein Keil                |
| Kofferraumdeckel               | gar keiner: das Dach läuft bis hinten |
| neun Lackfarben                | eine, und die ist kein Lack           |

Dazu kommt der Grundriss: Von oben ist dieses Fahrzeug ein **Sechseck** - die
Nase zieht hart ein, das Heck etwas, und am breitesten ist es über den Rädern.
Das ist dieselbe Tabelle (`NARROWS`), mit der der Golf beinahe gleich breit
bleibt, nur andersherum benutzt.

**Nachgemessen statt geschätzt.** 5,68 m lang und 2,03 m über der Karosserie.
Die Stadt zeichnet mit **10,3 Pixeln auf den Meter** - ein Golf VIII ist 4,28 m
und 44 Pixel, eine E-Klasse 4,95 m und 50,8 -, also ist dieser hier 58 mal 21.
Und genau das macht ihn groß: ein Drittel länger als ein Golf und keine drei
Pixel breiter. Dreißig Pixel quer waren zweieinhalb Meter, und das ist ein
Transporter. Hoch steht er 1,79 m; Höhen zeichnen mit 8,6 Pixeln auf den Meter,
macht 15,4 statt der 17 von vorher.

**Die Kabine ist das ganze Fahrzeug.** Jedes andere Auto hier ist eine
Karosserie mit einem Glashaus obendrauf und einem Knick dazwischen; dieses ist
ein einziger Keil von Stoßstange zu Stoßstange. Es gibt keine flach liegende
Motorhaube, auf deren Ende eine Scheibe steht: Von der vorderen Stoßstange
läuft **eine gerade Linie** hinauf zum Dach und **eine gerade Linie** wieder
hinunter zur Heckklappe, und die Motorhaube ist schlicht die untere Hälfte der
ersten davon.

Also reicht die Kabine über die volle Länge, und beide Enden sind riesige
Neigungen - 27 Pixel Auslauf vorn (`rake`), 21 hinten (`rakeBack`) -, was
dazwischen zehn Pixel flaches Dach lässt und nirgends auf der Silhouette einen
Knick. `rakeBack` ist dieselbe Mechanik wie die geneigte Frontscheibe, nur am
anderen Ende; außer diesem Fahrzeug hat sie keines.

Das Glas folgt dann oben am Keil entlang: Windschutzscheibe, Seitenscheiben und
Heckscheibe in einem Band, weil sie auf der Straße auch ein Stück sind. Was
darunter auf den beiden Schrägen übrig bleibt, ist Blech - vorn die Haube,
hinten die Klappe.

Sonst hat kein Fahrzeug das. Bei einer Limousine neigt sich die Heckscheibe
auch, aber sie ist auf die Seitenwände gemalt und das Dach bleibt, wie es ist -
schneidet man das Dach dort ebenfalls zurück, klafft an der hinteren Ecke eine
Kerbe zwischen Wandoberkante und Dach. Beim Cybertruck geht es, weil dort das
Heck **keine Scheibe im Dach ist, sondern das Dach selbst**, und weil sein
eigenes Flankenbild genau dieselbe Schräge zeichnet.

**Lackiert wird er nicht.** Die Karosserie ist blanker Edelstahl - es gibt in
der Fabrik keine Lackiererei dafür -, also gibt es ihn in genau einer Farbe
(`CYBER_STEEL`): ein kaltes helles Grau fast ohne Buntanteil. Ein roter
Cybertruck ist kein seltener, sondern ein anderes Fahrzeug. Selten ist er
trotzdem: einer auf fünf Limousinen im Verkehr.

Ansonsten besteht das Zeichnen eines Cybertruck darin, nichts zu tun, was man
sonst täte. Die einzige Stelle, an der er darüber hinaus eine Sonderregel
braucht, ist der Lichtbalken: Er läuft an der **Oberkante** des Blechs statt
auf halber Höhe, also gibt es zu `LAMP_HIGH` eine Tabelle mit den Fahrzeugen,
die ihre Lampen woanders tragen.

> Und eine Falle, die zweimal in dieselbe Richtung zuschnappt: `ctx.fillStyle`
> überlebt den Schleifendurchlauf. Die Radkästen wurden vor der Schleife auf
> Schwarz gesetzt, das Rad am Ende jedes Durchlaufs malt aber seine Nabe in
> Silber - also kam der **zweite** Radkasten, der hintere, als zwei blassgraue
> Ohren links und rechts des Hinterreifens heraus. Farbe wird jetzt im
> Durchlauf gesetzt, nicht davor.

## Der DMC-12 war einen halben Meter zu breit

Auch zu diesem Auto gibt es ein 3D-Modell
(`game_instructions/GTA/Fahrzeuge/DMC-12/.../DeLorean.obj`, 143 549 Punkte,
143 379 Flächen), und es hat dasselbe getan wie das des Golf: Es hat gezeigt,
dass die Zahlen geraten waren.

Das Mesh misst **429,0 mal 179,4 mal 115,9 Zentimeter** über das Blech, 198,9
über die Außenspiegel. Bei 10,25 Pixeln pro Meter im Grundriss und 8,6 in der
Höhe sind das 44 lang, 18,4 breit und 10 hoch. Im Spiel stand **46 mal 27**.

27 Pixel sind 2,63 Meter. Damit war der DMC-12 breiter als der Panzer über den
Ketten, breiter als ein Traktor über der Hinterachse und einen halben Meter
breiter, als das Auto je gewesen ist. Von oben las er sich als keilförmiger
Lastkahn, und **gefahren hat er sich auch so**, denn die Breite ist die Zahl,
nach der der Verkehr Abstand hält. Ein DeLorean ist genau so breit wie ein
Golf. Er sieht nur breiter aus, weil er einen Fuß flacher ist.

**Was die Schnitte sonst noch verraten haben**, Scheibe für Scheibe am Mesh
abgelesen:

- **Die Gürtellinie liegt bei 88 von 115,9 Zentimetern.** Drei Viertel der
  Höhe sind Blech, und zwar Blech von konstanter Breite - die Karosserie zieht
  sich von der Straße bis 88 Zentimeter kein Stück ein. Erst darüber fängt das
  Glas an. Ein Golf hat sieben Zehntel, und der Unterschied ist genau das, was
  den DMC-12 zum Briefkastenschlitz macht. Im Spiel stand die Gürtellinie bei
  0,63 der Höhe.
- **Das Glashaus läuft von 0,38 bis 0,93 der Länge** - fast bis ans Heck, weil
  der Motor dahinter sitzt und die Heckscheibe flach darüber liegt. Beide Enden
  davon sind riesige Neigungen, so wie beim Cybertruck: Das eigentliche Dach
  ist nur 0,48 bis 0,76, also lehnt die Frontscheibe 4,4 Pixel zurück und das
  Fließheck 7,5. Vorher war das Dach ein Kasten von 0,4 bis 0,73 ohne jede
  Neigung.
- **Beide Enden ziehen sich ein**, das Heck so stark wie die Nase. Die alte
  Tabelle sagte, das Heck tue das nicht.
- **Die Nase ist 67 Zentimeter hoch, die Gürtellinie 88.** Die Haube fällt also
  über das vordere Drittel um ein Viertel der Seitenhöhe ab - _das_ ist der
  Keil. Gezeichnet war ein Abfall von anderthalb Pixeln auf den letzten zwei,
  also eine Limousine mit abgeschrägter Kante.
- **Die Achsen stehen bei 0,20 und 0,78**, nicht symmetrisch um die Mitte. Das
  ist es, was dem Wagen den langen Überhang hinten gibt.

Die Bandgrenzen stehen jetzt an einer Stelle (`DMC_AT`) und werden von allen
vier Bildern benutzt - Grundriss, Flanke, Bug, Heck -, damit die Haube auf der
Flanke dort aufhört, wo sie im Grundriss aufhört. Ein Auto, dessen
Windschutzscheibe je nach Blickrichtung woanders anfängt, ist genau das, was
diese Tabelle verhindert.

Und zwei Dinge, die keine Maße sind, sondern Beobachtung:

- **Der schwarze Schurz musste weg.** Gezeichnet war das untere Drittel der
  Flanke in Schwarz. Ein DMC-12 hat das nicht - er hat eine dünne Zierleiste
  auf der Sicke in halber Höhe, schwarze Schweller und schwarze Stoßfänger, und
  dazwischen geht das blanke Blech bis auf die Straße.
- **Die Spiegel standen außerhalb des Umrisses.** Derselbe Fehler wie beim
  Transporter, und dieselbe Folge: Was dieses Bild außerhalb der Silhouette
  zeichnet, stempelt der Ring flach auf den Asphalt - ein schwarzer Krümel
  neben dem Vorderrad. Dieselbe Falle hat gleich darauf die **Zierleiste**
  erwischt: Ein Streifen in gleichbleibender Breite an der Flanke entlang läuft
  an beiden Enden aus dem sich einziehenden Umriss heraus. Sie wird jetzt auf
  die Karosserieform geclippt.
- **Keine Rücklichter im Grundriss.** Die Heckwand hat sie schon, und ein
  zweites Paar in der Draufsicht kommt als roter Fleck direkt über den echten
  heraus - derselbe Fehler wie das doppelte Panzerrohr und die doppelte
  Windschutzscheibe des Transporters.

**Und ein Fehler, der alle Autos der Stadt betraf**, aufgefallen erst am
DeLorean: `wheelAt` hat seinen Stift liegen lassen. Die Funktion endet mit
`strokeStyle` auf dem polierten Felgenrand, und jeder Aufrufer, der zwei Räder
in einer Schleife zeichnet, hat damit das **zweite** Radhaus umrandet statt mit
Tinte - ein blassgrauer Keil links und rechts neben dem Hinterreifen, bei jedem
Auto, seit es Radhäuser gibt. Die Funktion setzt jetzt `save()`/`restore()` um
sich herum, und nichts, was sie einstellt, kommt mehr heraus.

Gefunden wurde das nicht am Bild, sondern mit einem **Mitschnitt-Kontext**: ein
`CanvasRenderingContext2D`, der nichts zeichnet, sondern jeden `fill` und
`stroke` mit Farbe und Bounding Box protokolliert. Damit lässt sich eine
Fahrzeugwand in Node zeichnen und Zeile für Zeile lesen, was wo in welcher
Farbe liegt. Zwei Zeilen untereinander, `stroke #0f172a` für das vordere
Radhaus und `stroke #94a3b8` für das hintere, und der Fehler war klar - am
Screenshot war das ein Wackeln von drei Pixeln.

## Der Opel Corsa F, dreimal

**Der Blitz ist so groß wie jedes andere Emblem der Stadt.** Die Limousinen
tragen vorn und hinten eine schlichte Chromscheibe mit Radius 1,1; dieses hier
ist ein Ring mit einem Blitz hindurch, und der Blitz reicht `BOLT_OUT` über den
Ring hinaus - der Ring muss also **kleiner** sein als jene Scheibe, damit das
ganze Zeichen gleich groß herauskommt. Bei `BADGE_SIZE` 0,85 endet der Blitz
bei 1,07, und das ist die Scheibe der Limousine auf ein Zehntel Pixel genau.
Vorher stand da 1,7, was den Blitz auf 2,14 hinausschob: fast doppelt so breit
wie bei allen anderen - ein Auto mit einem Emblem drauf statt eines Emblems auf
einem Auto.

**Ein Golf, dem ein Fuß Länge fehlt.** 4,06 m mal 1,765 - bei den 10,3 Pixeln
der Stadt auf den Meter sind das 41,7 mal 18,1 gegen die 44 mal 18,4 des Golf.
Also eine Spur schmaler und spürbar kürzer, und das ist auch das Einzige, was
man von oben sieht. Der Radstand schrumpft im selben Verhältnis mit, er lenkt
also etwas enger. Und er hat **keinen Haifisch auf dem Dach**: Dieses kleine
Dreieck hinten am Dach ist die Antenne des Golf; der Corsa hat seine in der
Heckscheibe, von oben ist dort nichts.

**Drei Ausstattungen sind drei Fahrzeuge**, keine Variable an einem. Was sie
trennt, ist der Motor - 75, 100 und 130 PS -, und Motoren stehen in `VEHICLES`,
eine Zeile pro Fahrzeug. Ein Auto, das sich anders fährt, ist eine andere
Zeile. Alles andere folgt dann daraus:

|                  | Leistung | Dach und Spiegel | Emblem      | Felgen        |
| ---------------- | -------- | ---------------- | ----------- | ------------- |
| Corsa F          | 75 PS    | in Wagenfarbe    | Chrom       | fünf Speichen |
| Corsa F Elegance | 100 PS   | **schwarz**      | Chrom       | fünf Speichen |
| Corsa F Ultimate | 130 PS   | **schwarz**      | **schwarz** | Sportfelge    |

Das schwarze Dach nimmt die **Säulen und die Spiegelkappen** mit, so wie es
verkauft wird. Schwarzes Dach und Säulen in Wagenfarbe ist kein Zweifarbenauto,
das ist ein Auto mit einem Deckel drauf - also färbt `blackTop` alles drei, das
Dachbild, die Kabinenwände und die Spiegel, und der Lack darunter bleibt, was
bestellt wurde.

**Das Emblem sitzt im Grill zwischen den beiden Scheinwerfern**, nicht auf der
Motorhaube - ein Markenzeichen liegt nicht flach da, wo man von oben darauf
schaut -, und **dasselbe noch einmal auf der Heckklappe**.

Gezeichnet ist es nach der Vorlage: ein **offener Ring**, kein Plättchen, mit
einem Blitz quer hindurch, und der Blitz **steht auf beiden Seiten über den
Ring hinaus**. Dieser Überstand ist das, woran man die Marke von der anderen
Straßenseite erkennt; ein Blitz, der am Ring endet, liest sich als Strich in
einem Kreis und ist das Zeichen von jemand anderem. Der Blitz selbst ist dünn
an den Enden und tief in der Mitte, wo er die Stufe macht.

Zwei Dinge musste er dafür bekommen, die ein echtes Emblem nicht hat. Erstens
sitzt er auf einer **dunklen Platte**, egal welche Farbe das Auto hat: Chrom
auf Schnee Weiß ohne etwas dahinter ist Chrom, das niemand findet. Zweitens
bekommt das schwarze Emblem des Ultimate einen **Chromrand** - den hat ein
Klavierlack-Emblem tatsächlich, und ohne ihn ist Schwarz auf schwarzem Grill
ein Emblem, das man nicht sieht.

**Größer wird er dafür nicht** (`BADGE_SIZE`). Ein echter wäre bei 10,3 Pixeln
auf den Meter keinen Pixel breit; das hier ist schon das Dreifache davon, und
noch größer hört es auf, ein Emblem auf einem Auto zu sein, und fängt an, ein
Auto unter einem Emblem zu sein. Dass er bei dieser Größe gerade noch zu
erkennen ist, ist der Preis - und der richtige.

Die Felgen des Ultimate sind zehn dünne Doppelspeichen in hellem Silber über
einem fast schwarzen Bett, mit einer polierten Lippe außen - und dahinter ein
**roter Bremssattel**. Bei drei Pixeln Felgenradius sagt nichts so laut
"Sportfelge" wie ein roter Sattel, der zwischen den Speichen durchschaut, und
er steht still, während das Rad sich dreht, weil ein Sattel genau das tut.

**Sieben Farben**, für alle drei dieselben: Power Orange, Schnee Weiß, Karbon
Schwarz, Grafik Grau, Kardio Rot, Voltaik Blau, Quarz Silber (`CORSA_PAINT`).
Die Ausstattung entscheidet über Dach, Emblem und Felgen - nie über die Farbe
des Autos.

## Das Taxi ist der Streifenwagen in Gelb

So wie auf der Straße: Das deutsche Taxi ist eine E-Klasse, und der
Streifenwagen ist es auch. Also ist es **dieselbe Zeichnung** - dieselbe Länge,
dieselbe Breite, dieselben Achsen, dieselbe stehende Heckklappe -, und was es
unterscheidet, ist die Farbe, das Karoband und das Schild auf dem Dach. Als
dritte Limousine mit eigenen Maßen gezeichnet war es 46 mal 25 Pixel, also
zweieinhalb Meter breit; so breit war noch keine Limousine.

Das Karoband wird dabei nur **einmal** gemalt, nämlich in der Draufsicht an
beiden Schultern. Der Körperstempel legt das ohnehin auf die Flanke; zusätzlich
auf die Seitenwand gemalt kamen zwei Reihen dunkler Quadrate übereinander
heraus, und das ist ein Bus.

Und es sitzt auf der **hinteren Hälfte** und sonst nirgends. Über die ganze
Länge gezogen kreuzt es die Türen, und die Türen sind, wo die Schrift steht:
**UBER**, auf beiden vorderen Türen, mit demselben Spiegel-Trick wie der
Schriftzug des Streifenwagens - also von beiden Straßenseiten richtig herum
statt von einer verkehrt. Dafür wird für das Taxi wie für den Streifenwagen ein
zweites Flankenbild vorgehalten; alles andere braucht keins, weil auf nichts
anderem etwas geschrieben steht.

**Das Dachschild ist ein Kasten**, aus demselben Grund wie der Lichtbalken:
Ein Schild liegt **auf** einem Dach, es ist nicht hineingemalt. Als gelbe
Fläche im Lack hat es keine Dicke, fängt von der Seite nichts und verschwindet
aus flachem Winkel im Dach.

**TAXI steht auf seinen beiden großen Seiten**, nicht auf dem Deckel. Genau so
ist ein Taxischild gebaut: breit quer über dem Auto, keine zwei Pixel tief und
hoch genug für vier Buchstaben. Also trägt die nach vorn und die nach hinten
gewandte Fläche das Wort, und man liest es von vor oder hinter dem Taxi - wie
auf der Straße - statt von senkrecht oben, wo niemand steht.

Das heißt auch: Das Wort zeigt sich, wenn das Taxi den Schirm hinauf oder
hinunter fährt, und nicht, wenn es quer darüber fährt. Das ist kein Fehler,
sondern diese Ansicht: Sie hat keine Perspektive, eine nach Osten oder Westen
gedrehte Fläche fällt darin zu einer Linie zusammen. Was man von so einem Taxi
sieht, ist der gelbe Kasten, und der genügt.

Gedreht wird das Wort, wo die Kante nach links zeigt - derselbe Trick wie beim
Schriftzug an der Streifenwagentür: In eine Richtung gedruckt läse es sich von
einem Ende der Straße rückwärts, und ein Taxi, auf dem von hinten IXAT steht,
ist schlimmer als eines ohne Aufschrift.

Und das Schild sitzt, wo es auf einem echten sitzt: **vorn auf dem Dach und
über dem Fahrer**, nicht in der Mitte.

Zwei Lampensätze hatte es außerdem. Die Draufsicht malt Lampen für die
Karosserien, deren Wände keine tragen - alles, was `golfWall` zeichnet, trägt
sie aber -, also standen rote und weiße Punkte über und unter den echten
Lichtern, auf der Haube und dem Kofferraumdeckel, wo nie eine Lampe war.
`onGolfWalls` beantwortet das jetzt für alle sechs auf einmal.

## Der Supermarkt hat einen Parkplatz statt eines Gehwegs

Zu einem Supermarkt geht niemand zu Fuß. Er bekommt deshalb als einziges
Gebäude der Stadt **den Ring statt des Gehwegs**: Die Felder, die bei jedem
anderen Block Bürgersteig sind, sind hier Beton, rundherum. Das Gebäude behält
seine ganze Parzelle - ein Supermarkt, dem man für die Autos die Hälfte
wegnimmt, ist ein Tante-Emma-Laden.

Alles andere fällt daraus heraus, ohne neue Mechanik:

- **Boden.** `onCarPark` beantwortet dieselbe Frage wie der Rest von `inTown`,
  nur vor dem Gehweg. Beton ist begehbar und befahrbar, gehört aber nicht zum
  Straßenraster - also biegt der Verkehr nie darauf ab und niemand zu Fuß
  behandelt das Überqueren als Straßenüberquerung.
- **Stellplätze.** `carParks` zählt die Ringfelder auf und gibt zu jedem die
  Richtung, in der ein Auto dort steht: quer zur Wand, nicht auf den
  Mittelpunkt des Ladens gezielt - sonst stünden die vier Eckplätze schräg.
  Knapp die Hälfte bekommt ein Auto, ein gutes Drittel einen Menschen.
- **Kundschaft.** Ihr Zuhause ist der Stellplatz, auf dem sie stehen. Die Regel
  dafür gab es schon: Wer sich zu weit von seinem Zuhause entfernt, geht dorthin
  zurück - bei einem Bandenmitglied ist das seine Ecke, hier ist es das eigene
  Auto. Zwischen Tür und Wagen hin und her ist genau das, was dabei herauskommt.
- **Bild.** Eine weiße Linie zwischen zwei Stellplätzen, quer zum Ring - was
  einen Betonstreifen als Parkplatz lesbar macht, sind die Striche darauf.

## Figuren: die Bilder sind fest, die Bewegung nicht

Körper, Kopf und Beine sind **gecachte Sprites**, ein Satz je Outfit, achtfach
aufgelöst - ein Körperbild sind rund 100 Kilobyte. Ein zweiter Satz fürs Rennen
würde den Speicher jeder Person in der Stadt verdoppeln. **Also kommt alles,
was einen Gang vom anderen unterscheidet, aus der Zeichenphase**, nicht aus
mehr Einzelbildern:

- `pace` - wie schnell jemand geht, als Anteil eines Spaziergangs (0 / 1 / 3 /
  10 bei Stehen, Gehen, Rennen, Cheat). Der Motor rechnet ihn dort aus, wo er
  die Schrittweite ohnehin kennt; nur das Bild liest ihn.
- Daraus skaliert die **Neigung nach vorn** - und _nur_ die. **Hüftschwung** und
  **Wippen** (zwei Fußtritte je Schritt, deshalb doppelte Frequenz) sind bei
  einem Gehtempo gedeckelt: Ein Körper, der umso höher federt, je schneller er
  ist, hüpft, statt zu rennen. Die Neigung darf mitwachsen, weil sie ein
  ruhiger Versatz ist und nicht schwingt.
- **Der Schrittzyklus ist gedeckelt** (`CYCLE_CAP`, doppeltes Gehtempo). Er wird
  von der zurückgelegten Strecke getrieben, liefe also beim Rennen dreifach und
  im Cheat zehnfach so schnell - gemessen 38 Zyklen je Sekunde, was kein Laufen
  mehr ist, sondern ein Flimmern. Jetzt sind es 3,8 beim Gehen und 7,6 bei allem
  Schnelleren. Preis: Die Füße halten beim Sprint nicht mehr mit dem Boden mit -
  ein Handel, den jedes Spiel macht, weil niemand auf die Füße einer Figur
  schaut, die über den Schirm zieht.
- Im Stand bleibt ein langsames **Atmen** übrig, damit eine stehende Figur kein
  eingefrorenes Bild ist.
- Die **Schultern** kommen nur zu 78 % zur Blickrichtung herum, den Rest macht
  der Kopf.
- Der **Kopf** wird schmaler gestempelt als die Schultern. Gleich breit war das,
  was die Leute wie Spielzeug aussehen ließ.

**Plastizität geht nur symmetrisch.** Die Sprites werden gedreht gestempelt -
ein Glanzlicht auf einer Seite und Schatten auf der anderen würde mit der
Figur mitschwenken und dreimal von vier Malen falsch stehen. Was bleibt, ist
`rounded`: dunkler Rand innen an der Silhouette, heller Kern in der Mitte. Das
ist von jeder Seite richtig, aus demselben Grund, aus dem ein Tonmodell unter
jeder Lampe rund aussieht.

## Fahren ist zwei Zahlen, nicht eine

Ein Fahrzeug hatte früher `speed` - eine Zahl, die immer exakt entlang der Nase
zeigte. Das war ein Kettenfahrzeugmodell: Lenken drehte die Bewegung sofort
mit, also konnte nichts je rutschen, und alle Fahrzeuge fühlten sich im Kern
gleich an.

Jetzt kommt `slip` dazu - was der Wagen **quer** zu sich selbst tut. Der ganze
Motor davon steht in `rollCar` und ist sechs Zeilen Arithmetik:

1. Die Nase dreht sich um `swing`.
2. Dieselbe Bewegung, im neuen Bezugssystem gelesen, hat einen Queranteil -
   `forward` und `across` fallen aus einer Drehmatrix.
3. Die Reifen ziehen den Queranteil gerade: `slip = across * exp(-bite * dt)`.

Mehr ist es nicht. Ein Drift ist kein Sonderfall, sondern das, was man sieht,
wenn Schritt 2 schneller einspeist, als Schritt 3 abbaut. Der Endwert ist
ausrechenbar: **Tempo × Lenkrate ÷ Haftung**.

**Die Handbremse ist ein Faktor auf dieselbe Zahl.** `HAND_GRIP` von 0,16 -
mehr ist sie nicht. Dazu ein Bremsmoment, ein tieferer Lenk-Schwellwert
(`HAND_LOCK`) und etwas mehr Lenkrate, damit sich der Wagen im Stand noch
drehen kann. Nirgends steht „Donut": ein Donut ist, was passiert, wenn die
Haftung fast weg ist und die Nase sich trotzdem dreht.

**Bremsspuren sind Wetter, keine Geschichte.** `Mark` ist Punkt, Winkel, Zeit -
kein Besitzer, kein Update, kein Speichern. Gelegt wird alle 30 Millisekunden
von allem, was rutscht (auch von der Polizei), gezeichnet wird unter den Autos,
und verblasst wird über die Uhr. Der Spielstand wirft sie weg.

**Zwei Sorten Spur, ein Feld.** `Mark.tread` sagt, was sie gedrückt hat, und
daraus kommt alles andere: Gummi ist schmal, fast schwarz und hält zwanzig
Sekunden; eine **Kette** ist so breit wie der Stahl, der sie gedrückt hat, hat
die Farbe des aufgerissenen Bodens statt die von Reifen, trägt die Leiter ihrer
Stollen der Länge nach und ist nach neun Sekunden weg (`TRACK_LIFE`). Die
kürzere Lebensdauer ist Arithmetik, nicht Geschmack: Ein Panzer legt sein Paar,
**solange er fährt** - nicht nur, wenn er rutscht -, und bei neun Sekunden sind
das sechshundert Marken, also innerhalb von `MARK_MAX`. Bei zweiundzwanzig
würde ein einziger fahrender Panzer stillschweigend jede Bremsspur der Stadt
ausradieren.

Die Stollen sind eine **gestrichelte zweite Linie** über dem Band, im selben
Pfad - deshalb folgt sie der Kurve von allein. Mit runden Kappen war sie
unsichtbar: Ein Strich, der ein Achtel so lang ist wie die Linie breit, ist mit
runder Kappe ein Kreis an jedem Ende von nichts, die Striche laufen ineinander
und zurück kommt wieder das glatte Band. Also `lineCap = "butt"` für die
Sprossen und danach zurück auf rund.

Zwei Fallstricke, beide erlebt:

- **Haftung als feste Abzugsmenge** (`slip - bite*dt`) macht das Verhalten
  binär: eine Stufe mehr Haftung und der Wagen rutscht _nie_, eine weniger und
  er dreht sich weg. Die Exponentialform ist stufenlos abstimmbar.
- **Wer `speed` setzt, muss `slip` mitsetzen.** Sonst schiebt ein stehendes
  Auto weiter seitwärts vor sich hin.

## Eine Schlange fährt nacheinander an

Alles an einer Warteschlange war bis dahin sofort: In dem Augenblick, in dem
der Vordermann aus dem Weg war, fuhr der Hintermann los, und sechs Autos an
einer roten Ampel fuhren als ein Stück los, alle sechs Nasen im selben Abstand
die ganze Straße hinauf. So fährt niemand.

`Car.wakeAt` ist eine **Reaktionszeit**: Wer steht, schiebt diese Marke eine
halbe Sekunde vor die Uhr, und wenn die Straße frei wird, muss die halbe
Sekunde erst noch ablaufen. Der Vordermann fährt damit eine halbe Sekunde
früher los als der dahinter, der wiederum eine halbe Sekunde früher als der
dahinter - die Schlange **reißt von vorne auf**, wie eine echte. Niemand
organisiert das: Die Staffel fällt daraus ab, dass jeder Fahrer auf den vor ihm
reagiert.

## Wer schießt, sieht einen dabei an

Ein Polizist geht nicht zum Spieler, sondern auf **seinen Platz im Ring** um
ihn herum - sechs Mann an einem Fleck sind eine Rauferei, sechs Mann um ein
Auto sind eine Festnahme. Er blickte aber dorthin, wohin er ging, also stand
ein Angekommener mit dem Rücken zu genau dem Menschen, wegen dem er da war,
und drehte sich für die Länge eines Schusses um, bevor er sich wieder wegdrehte.

Wohin er sieht, ist jetzt eine andere Frage als wohin seine Füße gehen: Wer
jagt oder bewacht, sieht den Spieler an - beim Hingehen, beim Davorstehen und
beim Schießen.

## Wer einen jagt, steht nicht auf der Karte

Eine Streife am Bordstein ist eine Markierung wert, das ist ein Auto, das man
vielleicht haben will. In dem Moment, in dem sie jagt, macht ein blauer Punkt,
der einem die Straße hinauf nachkriecht, aus einer Verfolgung ein Brettspiel:
Man fährt nach der Bildschirmecke und sieht nie mehr auf. Verfolgt zu werden
soll etwas sein, das man im Rückspiegel merkt.

Die Wachen auf dem Militärgelände bleiben drauf - die jagen niemanden, die
stehen, wo sie immer stehen, und das ist es wert, vor dem Hinfliegen zu wissen.

## Zivilisten gehen nicht auf die Gleise

Eine Straße wird ab und zu überquert, absichtlich, von jemandem, der sich dazu
entschlossen hat - dafür gibt es `crossingMood`. Ein Gleis nicht. Der Zug fährt
durch alles hindurch, was darauf steht, und ist nicht aufzuhalten, also ist ein
Gehweg, dessen Spaziergänger auf die Schwellen wandern, ein Gehweg, der den
Fahrplan füttert. Genau das passierte an jedem Bahnübergang der Stadt.

`keepToPath` dreht sie deshalb genauso vom Gleis weg wie von der Fahrbahn, nur
ohne die Ausnahme fürs Überqueren. Eine Ausnahme gibt es trotzdem, und sie ist
die, die den Rest erst zur Regel macht: Ein Penner hat nirgendwo hinzukommen,
und ein Mann, der ab und zu auf der Strecke steht, ist der Unterschied zwischen
einer Stadt mit einer Eisenbahn und einer Stadt mit einem Zaun darum.

Gemessen über zwei Minuten Stadt, vierzig Stichproben, 658 Leute: **kein
einziger** Passant auf dem Gleis.

Der Zug selbst bleibt, wie er ist - er schiebt alles beiseite und ist nicht
kaputtzukriegen. Ein Zug, den man abschießen kann, ist kein Zug.

## Streifenwagen, die schon dastehen

Ein Streifenwagen am Bordstein vor seiner Wache ist ein Auto mit Funk. Daran
vorbeizufahren, mit Sternen, und ihn dastehen zu sehen, ist das Einzige, was
sagt, dass die Stadt Kulisse ist.

`rousePatrols` macht aus jedem geparkten Streifenwagen in Reichweite einen auf
Streife: `kind` wird `"police"`, die Besatzung wird aufgefüllt - und das
Blaulicht geht von selbst an, weil `onCall` im Bild genau diese eine Frage
stellt. Das **fügt keine Polizei hinzu**: Er zählt zur Quote wie jeder von der
Wache geschickte Wagen, es entscheidet nur, woher sie kommt.

## Der Stern ist für die Leute, nicht für das Auto

Ein Wagen, in dem niemand sitzt, geht niemanden etwas an. Er kann am Bordstein
stehen, er kann einer sein, den der Verkehr schon geleert hat, er kann der
sein, den man selbst vor zwei Minuten dort abgestellt hat - und ein Polizist,
der zusieht, wie jemand in ein leeres Auto steigt, hat gesehen, wie jemand in
ein Auto steigt. Sitzt jemand drin, ist es ein Carjacking, und zwar deshalb,
weil der Betreffende danach auf der Straße steht: Das ist, was die Polizei
tatsächlich sieht.

Gefragt wird deshalb `seats` und nicht mehr `kind`. Ein Auto, das der Spieler
gefahren und abgestellt hat, behält seine Art - zurück ins eigene Auto zu
steigen war jedes Mal einen Stern wert. Gemessen: geparkt 0 Sterne, Verkehr mit
Insassen 1 Stern, leergefahrener Verkehrswagen 0 Sterne.

## Geschosse liegen obenauf

Ein Geschoss war ein Ding in der Tiefensortierung wie jedes andere, und das ist
es nicht: Es ist eine **Markierung auf der Stadt**, dieselbe Sorte Ding wie ein
Gegenstand auf der Straße, und eine Markierung, die hinter einer Wand
verschwindet, ist eine, die man nicht mehr lesen kann.

Einsortiert war es schlimmer als das. Ein ganzes Gefängnis zählt als _ein_ Ding,
das an der Vorderkante seines Blocks steht - also wurde jeder Schuss, der im Hof
fiel, zuerst gemalt und danach von dem Gebäude übermalt, in dem er fiel. Eine
Schießerei, von der man kein einziges Geschoss sah. Sie werden jetzt nach allem
anderen gezeichnet.

## Was auf dem Boden liegt, ist gleich groß

Alles in der Stadt wird durch die Linse gezeichnet, und das zu Recht: Ein Auto
doppelt so weit weg soll halb so groß aussehen. Ein Gegenstand am Boden ist
aber nicht Teil der Stadt, sondern eine **Markierung darauf** - dasselbe wie
sein Symbol in der Ecke -, und eine Markierung, die mit der Linse schrumpft,
ist genau dann nicht mehr lesbar, wenn man herausgezoomt hat, um sie zu suchen.
Sie wird deshalb mit eins durch Zoom gezeichnet, was die Linse aufhebt.

## Der Fahrer entscheidet, das Auto schwenkt

Ein Computerfahrer denkt in Himmelsrichtungen, weil die Stadt ein Raster ist
und ein Raster genau das hergibt. Er bekam diese Richtung - und das Auto
**hatte** sie: An der Kreuzung drehte sich das ganze Fahrzeug in einem Bild um
neunzig Grad auf der Stelle und fuhr seitwärts weiter. So dreht sich nichts auf
der Welt.

`Car.want` ist deshalb, wohin er lenkt, `Car.angle` ist, wohin die Maschine
zeigt, und das zweite kommt mit `TRAFFIC_TURN` zum ersten. Der Abstand
dazwischen **ist** die Kurve: gut ein Fünftel Sekunde Bogen durch die Kreuzung,
bei 110 Pixeln die Sekunde ein Radius von etwa fünfundzwanzig - eine halbe
Straßenbreite, also genau die Kurve, die ein Auto in eine Seitenstraße fährt.
Zwei Dinge hängen mit dran:

- **Gefragt wird aus `want`, nicht aus `angle`.** Sonst bekäme ein Auto mitten
  im Rechtsbogen zur Antwort, dass dort keine Straße ist, und suchte sich in
  jedem Bild eine neue Richtung.
- **Kein Spurzug während der Kurve** (`TURN_DONE`). Wer seitwärts in eine Spur
  gezogen wird, aus der er gerade halb heraus ist, krebst durch die Kreuzung,
  statt sie zu fahren.

Gemessen: Die größte Richtungsänderung eines Autos in einem Bild ist jetzt
0,073 Radiant - die Obergrenze - statt 1,571, also statt eines rechten Winkels.

## Autos stehen nicht ineinander

**Auch nicht in der ersten Sekunde.** Zweihundert Autos wurden auf die Karte
geworfen und keines hat hingesehen: Jedes bekam ein zufälliges Feld der
richtigen Bodenart, und das Einzige, was zwei davon vom selben Feld abhielt,
war, dass es viele Felder gibt. Jedes Spiel fing also mit einer Handvoll Paare
an, die ineinander standen - das eine, was sich an einem geparkten Auto nicht
wegerklären lässt.

`keepApart` unten hilft dagegen nicht: Es bewegt nur **fahrenden** Verkehr und
nur in der Nähe des Spielers, denn ein geparktes Auto ist das Feste, aus dem
alles andere herausgeschoben wird - zwei geparkte ineinander bleiben für immer
so stehen. Die Stelle, an der das stimmen muss, ist die, an der sie hingestellt
werden: `freeSpot` würfelt bis zu zwölfmal und nimmt den ersten Platz, auf dem
noch nichts steht.

Gemessen wird dabei als **Kreis von halber Fahrzeuglänge**, also dem Größten,
was ein Fahrzeug in irgendeine Richtung ist. Genaue Kästen wären besser und
sind hier nicht zu haben: Der Winkel, in dem ein Auto am Ende parkt, wird erst
danach entschieden, vom Bordstein, an dem es steht. Ein Kreis, der immer frei
ist, ist mehr wert als ein Kasten, der manchmal falsch liegt.

Gemessen: **0** ineinander steckende Paare beim Start und **0** nach dreißig
Sekunden Stadtverkehr.

## Autos stehen nicht ineinander (im Betrieb)

Alles davor ist ein Fahrer, der Entscheidungen trifft - Abstand halten, an Rot
stehen bleiben, an der Kreuzung Vorfahrt geben -, und jede davon lässt sich
aushebeln: Zwei biegen aus verschiedenen Straßen in dieselbe Lücke, ein
geparktes Auto wird dort abgestellt, wo schon eines steht, ein Panzer schiebt
eines ins andere. Ein Fahrer kann einen Unfall nicht rückgängig machen; was er
kann, ist dabei nicht im Kofferraum des anderen sitzen, und mehr macht
`keepApart` nicht.

Jedes Auto wird dafür als **zwei Kreise** genommen statt als einer, je einen
Radstand vom Mittelpunkt entfernt und so breit wie der Wagen. Ein Kreis würde
aus einer Limousine eine Scheibe von Wagenlänge machen - das schöbe jeden
Bordstein auseinander und zerlegte jeden Parkplatz der Stadt; zwei ergeben eine
Form, die lang und schmal ist wie das Auto, bei vier Abstandsrechnungen je
Paar. Bewegt wird nur der fahrende Verkehr in der Nähe des Spielers: Geparktes
bleibt, wo es geparkt ist - irgendetwas muss das Feste sein, aus dem der Rest
herausgeschoben wird - und den Wagen des Spielers schiebt niemand.

Gemessen über eine Minute Stadtverkehr: **0** von rund zehntausend geprüften
Paaren steckten ineinander.

## Verkehr ist kein Zufallsgenerator

Ein Auto auf der Straße fährt irgendwohin. Vorher wählte jedes alle zweieinhalb
Sekunden eine der vier Himmelsrichtungen und fuhr dorthin, egal was davor stand -
ein Drittel des Verkehrs stand deshalb mit der Nase in einer Hauswand und wartete
auf den nächsten Würfelwurf. Das liest sich als Stadt, in der Autos mitten auf
der Fahrbahn geparkt sind, und genau so wurde es auch gemeldet.

Die Regeln sind jetzt die, die ein Fahrer hat:

- **Rechts halten.** `streetRun` sagt, wie breit die Straße an dieser Stelle
  laut Plan ist - eine Gasse ein Feld, eine Autobahn fünf. Die rechte Hälfte
  gehört der eigenen Richtung, und der Wagen zieht quer zur Nase in die
  **nächstgelegene** Spur dieser Hälfte. Auf der Autobahn sind das zwei je
  Richtung, also kann man überholen statt hinterherzufahren.
  Gemessen wird nach dem Plan und nicht nach dem Boden: An einer Kreuzung liegt
  in beiden Richtungen sieben Felder Asphalt, und ein Wagen, der daraus seine
  Spur ausrechnet, stellt sich in die Kreuzungsmitte.
- **Nur an Kreuzungen abbiegen**, und nur in eine Straße, die auch eine ist. Der
  Blick zur Seite geht dreieinhalb Felder weit - er muss über die eigene
  Fahrbahnbreite hinausreichen, sonst biegt ein Wagen auf der Autobahn in seine
  eigene Fahrbahn ab und fährt quer über sie in den Gegenverkehr.
- **Anhalten für das, was davor steht.** Der Fußgänger vor der Haube, der Wagen
  in der Schlange, die rote Ampel: drei Gründe, ein Fuß auf der Bremse. Deshalb
  brauchen die Bremslichter keinen eigenen Fall.
- **Vorfahrt, damit es weitergeht.** Man reiht sich hinter jemanden ein, der in
  dieselbe Richtung fährt; für Gegenverkehr bremst niemand. Stehen zwei quer
  zueinander, fährt der mit der kleineren Nummer - eine willkürliche Regel, und
  genau das ist eine Vorfahrtsregel. Ohne sie halten zwei Autos ewig füreinander.
- **Ampeln nur dort, wo zwei Autobahnen kreuzen.** Eine Ampel an jeder Ecke eines
  Rasters heißt, dass man das Spiel im Wartezustand verbringt. Sie laufen auf
  **einer** Uhr für die ganze Stadt: sieben Sekunden Nord-Süd, sieben Sekunden
  Ost-West. Das ist eine grüne Welle und kostet nichts.
- **Abstand halten, an der Ampel weniger.** Hinter etwas, das fährt, bleibt
  ein knapper Wagen Platz; hinter etwas, das steht, eine halbe Wagenlänge.
  Damit schließt sich eine Schlange an der roten Ampel und zieht sich beim
  Anfahren wieder auseinander - eine Bedingung, zwei Abstände. Beide Zahlen
  sind größer, als sie aussehen: `bodyRadius` ist das Mittel aus halber Länge
  und halber Breite, also deutlich weniger als die Nase, für die es steht.
- **Niemand wird zurückgeholt.** Ein Wagen, der alle paar Straßen umdreht, weil
  der Spieler in der anderen Richtung steht, ist ein Pendelbus vor dem Fenster:
  Gemessen legten die Autos viertausend Pixel zurück und endeten dreihundert
  Pixel vom Startpunkt. Jetzt wird an jeder Kreuzung frei gewählt und meist
  geradeaus gefahren - dieselbe Messung ergibt jetzt Luftlinien von ein- bis
  sechstausend Pixeln. Was die Straßen belebt, ist nicht, dass dieselben
  Autos zurückkommen, sondern dass andere ankommen.
- **Der Verkehr rückt nach.** Simuliert wird nur, was nahe genug ist; ein Wagen,
  der weiter wegfährt, bleibt stehen, wo er die Grenze überschreitet, und sammelt
  sich dort. Wer aus dem Zählkreis herausgefallen ist, wird deshalb hinter dem
  Bildrand wieder abgesetzt - nach innen zeigend, sonst sieht ihn nie jemand.
- **Geparkt wird am Bordstein.** Hundertsechzig geparkte Wagen standen auf
  Fahrbahnfeldern. Sie stehen jetzt auf dem Gehwegrand und zeigen längs der
  Straße; die Fahrbahn gehört denen, die fahren.
- **In jedem Wagen sitzt jemand.** `Car.seats` ist eine Zahl und wird erst im
  Moment des Türöffnens zu Leuten: Fahrer an seiner Tür, Beifahrer an ihren, alle
  erschrocken und alle weg. Weit genug vom Blech - bei zweiundzwanzig Pixeln
  landete der Fahrer in seinem eigenen Auto und wurde davon überfahren.
- **Ein Wagen, den man verlässt, bleibt stehen.** Er wird `parked`. Verkehr sind
  die Autos, in denen jemand sitzt.

- **Landstraßen fährt man nicht als Zickzack.** Draußen gibt es kein Raster,
  die Straße schwingt - und ein Fahrer mit vier Himmelsrichtungen fährt einen
  Schwung als Treppe. `routeHeading` gibt die Richtung des nächsten Teilstücks
  derselben Polylinie zurück, aus der auch der Asphalt entstanden ist, und
  draußen zeigt der Wagen einfach dorthin.
- **Rammen verschiebt.** Zwei Autos, die sich gegenseitig totstellen, ist das,
  was eine Wand tut. Wer fährt, gewinnt den Stoß: Der Getroffene fliegt entlang
  der Verbindungslinie davon - deshalb schiebt ein Streifschuss zur Seite und
  ein Volltreffer nach vorn -, mit einem Anteil des Tempos, das ihn getroffen
  hat und nach Fahrzeuggewicht verteilt. Der Rammende behält gut die Hälfte
  seines Tempos, statt zu stoppen und zurückzuprallen. Und ein Wagen, der eben
  gestoßen wurde, **rollt** aus, statt sofort wieder Verkehr zu sein - sonst
  sieht ein Rammstoß aus, als würde der andere einfach in eine neue Richtung
  losfahren.
- **Ampeln haben drei Farben.** Grün, Gelb, Rot - jede Richtung bekommt ihr
  Grün, dann ihr Gelb, und ist genau so lange rot, wie die andere beides hat.
  Damit können die beiden Seiten nie etwas anderes als gegensätzlich sein.
  Gelb heißt anhalten: Es dauert zwei Sekunden, der Blick nach vorn ist knapp
  eine Sekunde Fahrt, also hat ein Wagen, der Gelb sieht, Platz zum Anhalten.

Fußgänger haben dieselbe Art Regel bekommen: Wer nur spazieren geht, bleibt auf
dem Gehweg, überquert die Fahrbahn nur, wenn ihn gerade danach ist
(`crossingMood` - Personennummer plus Uhr, damit derselbe Mensch seine Meinung
lange genug behält, um wirklich hinüberzukommen), und geht nie auf die Autobahn.
Wer flieht, wer bewaffnet ist und wer irgendwohin muss, geht weiter, wohin er
will.

## Abschleppen ist eine Zahl auf dem Zugfahrzeug

`Car.hitched` steht auf dem **Traktor**, nicht auf dem Anhang: der Traktor
entscheidet, der Traktor zieht, der Traktor lässt los. `towAlong` setzt den
Anhang jeden Schritt auf einen festen Punkt hinter dem Zugfahrzeug und gibt ihm
dessen Winkel und Tempo - eine starre Deichsel statt eines Gelenks. Reißt der
Abstand (Explosion, jemand anders steigt ein), löst sich die Kupplung von
selbst.

Der Berg ist genauso wenig Geometrie: `MOUNTAIN` ist Mittelpunkt und Radius,
die Felder sind Rechtecke, und beides wird gezeichnet statt modelliert. Der
erste Versuch malte den Fels Feld für Feld heller zur Mitte hin - das Ergebnis
war ein Schachbrett. Jetzt ist es **eine** Fläche mit Verlauf und Höhenlinien.

## Die Uhr ist eine Zahl, das Licht eine Tabelle - und beides ist abschaltbar

`clockAt(time)` rechnet die Sekunden des Spiels in Minuten des Tages um - eine
Sekunde je Minute, ein Tag in 24 Minuten. Darüber liegt `SKY`: zehn Stützstellen
mit Farbe und Stärke, zwischen denen linear gemischt wird. Gezeichnet wird das
als **ein** Rechteck über die ganze Leinwand, nachdem die Stadt fertig ist und
bevor Minikarte, Anzeige und Knöpfe drankommen - was man lesen muss, wird nicht
dunkel.

Kein Licht pro Objekt, keine Schattenwürfe, keine zweite Palette: eine
Tabelle, eine Füllung, und die Nacht ist da.

**Aus ist der Auslieferungszustand.** Ein Schalter, mehr nicht - er kommt wie
der Zoom aus den Einstellungen und wird als Ref in den Loop gereicht, damit ein
Umschalten im nächsten Bild wirkt. Ist es aus, kehrt `drawLight` sofort zurück
und die Anzeige rückt um die Höhe des Uhrkastens nach oben - ein erster Besuch
landet nicht um halb zwölf nachts in einer Stadt, die er für kaputt hält.

## Zwei Hubschrauber, ein Bild

`paintHeli` zeichnet die Maschine, und beide Hubschrauber im Spiel sind sie:
die Polizei in Blau, das Militär in Oliv. Ein zweites Bild hätte bedeutet, jede
Änderung zweimal zu machen und beim zweiten Mal daneben.

**Es ist eine Sikorsky UH-60, nach den Maßen des Herstellers.** Der Rumpf ist
15,25 m lang und 2,36 m breit - von oben also ein **langer, schmaler Körper mit
einem Ausleger hinten dran**, und diese Form erkennt man, bevor man irgendein
Detail daran sieht. Alles andere ist dieses Verhältnis mal `HELI_LONG`:

|               | Meter      | Anteil der Länge | gezeichnet   |
| ------------- | ---------- | ---------------- | ------------ |
| Rumpfbreite   | 2,36       | 0,155            | 7,1          |
| Hauptrotor    | 16,36 quer | 1,07             | 24,7 Radius  |
| Heckrotor     | 3,35 quer  | 0,22             | 5,1 Radius   |
| Höhenleitwerk | 4,40 quer  | 0,29             | 6,6 je Seite |
| Spurweite     | 2,97       | 0,19             | 4,5 je Seite |

Fünf Dinge unterscheiden sie von "einem Hubschrauber":

- **Vier Blätter an jedem Rotor.** Der Hauptrotor hatte zwei, und zwei ist eine
  Huey.
- **Der Heckrotor sitzt rechts am Seitenleitwerk und ist um zwanzig Grad
  geneigt** - das hat sonst keiner, und die Neigung ist dazu da, ihm etwas
  Auftrieb abzugewinnen. Von oben ist die Scheibe eines Heckrotors eine Linie
  **längs**, nicht quer, und die Neigung öffnet diese Linie zu einer schmalen
  Ellipse. Gezeichnet war sie quer.
- **Räder, keine Kufen.** Ein Bugfahrwerk hat sie nicht: zwei Haupträder unter
  der Kabine und ein Spornrad ein gutes Stück vorn auf dem Ausleger, nicht an
  dessen Ende.
- **Zwei Triebwerksgondeln** links und rechts des Rotorkopfs, mit den Abgasen
  nach außen und hinten.
- **Ein Höhenleitwerk** quer über dem Ausleger vor dem Seitenleitwerk, und es
  ist breit - fast so breit wie die Stummelflügel.

An genau einer Stelle sind die Zahlen zugunsten der Maschine gerundet: Bei
sechsundvierzig Pixeln Länge wären sieben Pixel Breite maßstäblich richtig, und
sieben Pixel Oliv mit zwei schwarzen Triebwerksdecks darauf lassen einen Rumpf
übrig, den man kaum noch sieht. Er ist deshalb eine Spur breiter (`HAWK_WIDE`).

Der fliegbare ist **kein Fahrzeug**. Er hat weder Blech noch Tank noch einen
Platz in der Verkehrssimulation, sondern ist ein eigener kleiner Zustand:
`chopper = { x, y, angle, height, speed, spin }`. Der Trick, der alles andere
geschenkt bekommt: solange man drin sitzt, wird `player.height` auf die Höhe
der Maschine gesetzt. Damit hebt die Kamera von selbst mit (dieselbe Zeile wie
beim Jetpack), die Flak trifft den Spieler statt ein Fahrzeug, und
`player.x/y` bleibt die Position, an der alles andere im Spiel nachschaut.

## Wachen gehören zu einem Ort, Streifen zu einem Auto

Die zehn Mann auf dem Militärgelände sind dieselbe `Cop`-Struktur wie eine
Streifenbesatzung, mit einem Feld mehr: `guards` - der Fleck, zu dem sie
zurückgehen. Daran hängen drei Dinge, und alle drei mussten sein:

1. **Sie steigen in kein Auto.** `carId` ist -1; ohne die Ausnahme in `walkCop`
   liefe der Zähler `boardAt` los, `boardCars` steckte sie in ein Auto, das es
   nicht gibt, und das Gelände wäre nach anderthalb Minuten leer.
2. **Sie zählen nicht als Polizei im Einsatz.** Sonst hätten zehn Mann in der
   Wüste bedeutet, dass nirgendwo in San Andreas je wieder eine Streife
   geschickt wird.
3. **Sie rennen nicht quer über die Karte.** Nur wenn der Spieler näher als
   `GUARD_REACH` an ihrem Posten ist, verlassen sie ihn.

## Eine Polizeiwache pro Stadtteil

`POLIZEI` stand schon in der Gebäudetabelle, und der Plan hat die Wachen
gestreut wie jedes andere Schild: drei in der Stadt, zwei davon vier Blöcke
auseinander in derselben Ecke, und zwei ganze Stadtteile ohne eine. Eine
Polizeiwache ist aber kein Frisör - sie ist das Gebäude, das man sucht, wenn
etwas schiefgegangen ist, und man sucht es in dem Viertel, in dem man steht.

`stationIn(district)` fragt deshalb in zwei Durchgängen, und der zweite ist der
Unterschied zu allem anderen in dieser Tabelle:

1. **Die, die der Plan gewürfelt hat**, und zwar die mittigste des Viertels.
2. **Sonst der schlichteste Block nahe der Mitte.** Jedes andere Wahrzeichen
   kann nur _ausgedünnt_ werden - wo der Plan eine zweite Bank zeichnet, steht
   danach ein Haus. Hier geht es andersherum: Ein Viertel, dem die Würfel keine
   Wache gegeben haben, bekommt trotzdem eine. Übernommen wird nur ein
   gewöhnliches Haus, nie ein Krankenhaus, ein Club oder eine Bank - ein
   Wahrzeichen gegen ein Wahrzeichen zu tauschen bringt der Stadt nichts.

Dabei ist ein Kreis entstanden, den man sich merken sollte: `buildingAt` fragt
jetzt, wo die Wache des Viertels steht, also darf die Wachensuche nichts mehr
fragen, was seinerseits `buildingAt` fragt. Der erste Versuch prüfte mit
`prisonUnder`, ob auf dem Block schon ein Gefängnis steht - und `prisonUnder`
fragt `buildingAt`. Der Stack war nach einem Frame voll. `gaoled()` liest
stattdessen `rawKindAt` und den Grundriss-Test des Gefängnisses, und beide
fragen niemanden.

**Und davor steht etwas.** Ein Gebäude mit POLIZEI über der Tür und nichts
davor ist ein Schild an einer Wand; was von der anderen Straßenseite aus
Polizeiwache sagt, sind die Streifenwagen am Bordstein und die Leute, die
dazwischen herumstehen. Der Plan bietet den Gehsteig rings um das Grundstück an
(`stations()`), und `createGame` nimmt sich davon, was taugt - erst Wagen, dann
Männer:

- **Angeboten, nicht vorgeschrieben.** Der Plan weiß, wo das Grundstück liegt,
  und nichts darüber, was auf einem einzelnen Feld wirklich ist. Eine Wache an
  einer Autobahnecke hat auf zwei Seiten keinen Gehweg. Also kommt der Ring als
  Vorschlagsliste zurück, Südseite zuerst, und wer fragt, wirft weg, was auf
  der Fahrbahn oder in einer Wand liegt.
- **Wagen und Männer wechseln sich von selbst ab.** Ein Streifenwagen belegt
  gut ein Feld, die Ringpunkte liegen 0,8 Felder auseinander, also scheitert
  der jeweils nächste Wagen an `clearOf` - und auf den Punkt stellt sich dann
  ein Mann. Niemand musste das so schreiben, es fällt aus dem Abstand heraus.
- **Die Männer sind Wachen, keine Streife.** `guards` zeigt auf ihren Fleck vor
  der Wache: Sie gehören zu einem Ort statt zu einem Auto, sie steigen in
  nichts ein, sie zählen nicht als Streife im Einsatz, und sie verlassen den
  Gehweg nur für jemanden, der ihnen mit Sternen zu nahe kommt. Das ist
  dieselbe Mechanik wie beim Militärgelände, einen Abschnitt weiter oben.

## Auf dem Dach landen

Der Jetpack war eine Zahl nach oben und dieselbe Zahl nach unten, und der Boden
war **immer die Straße**. Wer über der Mitte eines Blocks losließ, sank durch
das Dach, die Wohnung und den Laden darunter hindurch und stand auf dem
Gehweg.

Das Bild wusste dagegen von Anfang an, wie hoch jedes Haus ist - es muss es
wissen, um es zu zeichnen. Also ist diese Rechnung dorthin gewandert, wo der
Motor sie auch lesen kann: `scatter`, `houseHeight` und `HOUSE_LOW`/`HOUSE_HIGH`
stehen jetzt in `city.ts` bzw. `types.ts`, und darauf sitzt `roofAt(cells, x,
y)` - wie hoch das Dach über einem Punkt ist, null im Freien. Scheune, Kaserne
und Stadtblock werden in der Reihenfolge gefragt, in der sie gebaut werden.

Daran hängen drei Dinge, und zusammen sind sie das ganze Verhalten:

- **Der Boden ist, was darunter ist.** `fly` klemmt die Höhe nach unten auf
  `roofAt` statt auf null. Loslassen über einem Dach heißt landen.
- **Wo eine Wand ist, hängt davon ab, wie hoch man ist** (`clears`). Auf dem
  Gehweg ist ein Haus eine Wand, auf seinem Dach ist es der Boden, über allem
  ist nichts im Weg. Ein höheres Nachbarhaus bleibt dabei eine Wand - man
  läuft nicht in einen Wolkenkratzer hinein, nur weil man auf dem Flachbau
  daneben steht.
- **Und deshalb fällt man herunter.** Niemand programmiert das: Der nächste
  Schritt über die Dachkante hat null unter sich, also sinkt er dorthin.

Dazu wird er auf dem Dach **vor** allem anderen gezeichnet, sonst steckte er in
dem Haus, auf dem er steht. Über der Straße dagegen nicht: Da ist er zwischen
den Häusern wie alle anderen, und dass eines davor steht, ist das Bild, das
funktioniert.

Gemessen: Auf ein 40,4 Pixel hohes Dach losgelassen, bleibt er bei 40,4 stehen,
läuft 93 Pixel darauf nach Osten und fällt dann über die Kante auf den Gehweg.

**Und man sieht das Gerät - solange er damit fliegt.** Zwei Stahlflaschen
zwischen den Schultern, hinter ihm angesetzt, damit beide an den Schultern
vorbeikommen, und darunter zwei kurze Flammen nach unten. Zwei Schalter, zwei
verschiedene Fragen:

- **Die Flammen brennen, solange er drückt** (`Player.thrust`). Vorher waren es
  zwei mannsgroße Fahnen mitten durch ihn hindurch, die brannten, sobald er
  überhaupt in der Luft war - also auch den ganzen Weg nach unten.
- **Das Gerät ist auf, solange er über dem ist, was unter ihm liegt.** Man hat
  es auf, wenn man damit fliegt; sobald man aufsetzt - auf der Straße oder auf
  einem Dach - läuft man wieder herum, und dann hat man es nicht mehr um. Das
  ist genau `height > roofAt(...)`, also dieselbe Zahl, die auch entscheidet,
  ob er steht oder fällt.

## Der Jetpack ist eine Zahl

`player.height`. Sie tut zwei Dinge: sie hebt die Figur auf dem Schirm (eine
Stufe nach oben ist in dieser Projektion eine Stufe nach hinten, also wird sie
schlicht von `y` abgezogen), und oberhalb von `ROOF_HEIGHT` überspringt `walk`
die Kollision mit dem Boden ganz - dann gilt nur noch der Kartenrand. Es gibt
kein Flugmodell, keinen Treibstoff und keinen Sturzschaden: Das ist ein Weg über
den Block, kein Flugzeug.

## Die Karte ist eine Formel, kein Bild

San Andreas ist ein Land aus drei Städten, Wald, Wüste, Bucht, Hafen und
Flughafen - und nichts davon liegt als Datei irgendwo. `cellAt(col, row)`
beantwortet für jedes Feld in dieser Reihenfolge:

1. Liegt hier die **Bahn**? Ihre vier Geraden fallen auf Straßenlinien, damit
   der Zug durch Straßen fährt statt durch Wohnzimmer - und ihre vier Ecken
   sind Kurven mit achtzehn Feldern Radius. Eisenbahn macht keine rechten
   Winkel; ein Neunzig-Grad-Knick ist eine Entgleisung und sieht von oben nach
   Computer aus. Die Strecke ist deshalb kein Rechteck mehr, sondern eine
   **Linie**: `railLine` läuft sie einmal in Fünftel-Feld-Schritten ab,
   `railCells` merkt sich daraus, welches Feld Gleis ist **und in welche
   Richtung**, und alles Weitere liest daraus ab - der Boden, die Schwellen im
   Bild, `railAt` für den Zug, `stationAlong` für die Bahnsteige. Die
   Südkante lag früher auf Zeile 138 und damit quer über dem Berg; sie liegt
   jetzt auf 114 und geht zwanzig Felder daran vorbei.
2. Liegt hier eine **Landstraße**? Die sind Polygonzüge, keine Rasterlinien -
   und wo eine über Wasser läuft, **ist** sie die Brücke. Ein zweites System für
   Brücken gibt es nicht mehr.
3. **Flughafen**, dann **Stege**, dann **Kaimauer**: Beton schlägt Strand, sonst
   wäre der ganze Hafen Sand - er hat auf drei Seiten Wasser.
4. **Strand**, wo das Meer zwei Felder weit ist.
5. In der Stadt das gewohnte Raster aus Straßen, Gehwegen, Parks und Blöcken.
6. Und sonst: Meer, Wüste, Wald oder Wiese.

**Wo Land ist, steht in `types.ts`** (`LAND`), und die Städte stehen daneben in
`ISLANDS`. Zwei Module müssen sich darüber einig sein: der Boden legt Meer, wo
kein Land ist, und die Blocktabelle weigert sich, ein Krankenhaus auf Wasser zu
stellen - sonst stehen Clubs im Meer und ihre Warteschlange gleich mit. Genau
das war der erste Fehler beim Umbau.

**Die Küste franst.** Jede Kante jedes wilden Rechtecks wird um bis zu drei
Felder verschoben, und zwar nach einem Hash der Koordinate: unregelmäßig, aber
jedes Mal gleich unregelmäßig. Die Stadtrechtecke wandern **nicht** - eine Stadt
mit angeknabbertem Rand hätte Wohnzimmer im Meer.

**Die Antwort wird gemerkt.** Der Strand fragt für jedes Feld 25 Nachbarn nach
Wasser ab; ohne `LAND_MEMO` würde die teuerste Frage der Karte
fünfundzwanzigmal je Feld gestellt. Mit ihr dauert `createCity` 0,25 statt 1,7
Sekunden.

**Landstraßen sind gebogen.** `ROUTES` sind eine Handvoll Eckpunkte, `bend`
zieht mit Catmull-Rom eine weiche Linie hindurch, und `onRoute` fragt nur noch
den Abstand zur nächsten Teilstrecke. Darum ist draußen nichts gerade und in der
Stadt alles.

**Gefahren wird auf Feldern, gezeichnet wird eine Linie.** Das ist die
wichtigste Trennung im Renderer. Der Boden beantwortet in 48-Pixel-Feldern, _wo
man fahren darf_ - und eine Kurve in Feldern dieser Größe ist eine Treppe.
Also zeichnet `drawCountryRoads` nicht den Boden, sondern **dieselbe Kurve**,
aus der die Felder entstanden sind: ein Pfad, runde Ecken, etwas breiter als
das Feldband darunter. Die Stufen verschwinden unter der Linie, und an der
Spiellogik ändert sich nichts.

Das ist auch die Antwort auf „dann nimm doch eine Engine": Eine Engine würde an
dieser Stelle genau dasselbe tun - Kollision grob, Darstellung glatt. Dafür
braucht es sie nicht.

**Wer die Straße verbreitert, verkleinert die Häuser.** Eine fünf Felder breite
Autobahn frisst ein Feld der Parzelle nebenan. Darum fragt `builtPlot` in
./city dieselben zwei Fragen wie der Boden - ist diese Linie Straße, ist sie
Gehweg - und der Renderer baut auf das, was übrig bleibt, statt die alten
festen „Felder zwei bis vier" anzunehmen. Sonst steht ein Haus auf der
Außenspur.

**Autobahnen sind keine neue Sorte Straße**, sondern jede vierte Rasterlinie mit
zwei Spuren links und rechts. Eine Zeile in `isRoad`, kein zweites Wegesystem.

**Eine Straße ist drei Felder breit, ein Block acht.** Vorher war eine Gasse ein
Feld - achtundvierzig Pixel, also zwei Autobreiten ohne Rest. Zwei Wagen, die
sich begegneten, fuhren mit den Rädern auf dem Bordstein aneinander vorbei. Die
Straße bekam also links und rechts ein Feld dazu (`ROAD_HALF`), und der Block
wuchs um zwei mit, damit die Parzellen dieselbe Größe behalten und nur mehr
Platz zwischen ihnen liegt.

Zehn wurde zuerst probiert: fünf Felder Parzelle, richtig große Gebäude - und
**sechsundvierzig bebaute Blöcke in ganz San Andreas**, darunter der einzige
Supermarkt. Eine Stadt, die man in drei Straßen durchquert, ist keine. Bei acht
sind es siebzig, und das ist noch eine Stadt.

**`builtBlock` fragt nach der Parzelle, nicht nach dem Block.** Ein Stadtrechteck
endet nicht auf einem Vielfachen von acht. Nach den Ecken des Blocks gefragt
fiel jeder Randblock jeder Stadt weg - bei dieser Blockgröße die Mehrzahl.

**Was durch eine Parzelle läuft, wird nicht überbaut.** Ein Haus ist ein Kasten
über der ganzen Parzelle, ganz gleich was der Boden darunter sagt - wo also eine
Bahnkurve, eine Landstraße oder ein Bahnsteig durchging, wurde erst Asphalt
gezeichnet und dann ein Wohnzimmer darüber. Das liest sich genau als das, was es
ist: ein durchgesägtes Haus. `builtBlock` fragt jetzt zusätzlich `crossed`, und
wo etwas durchläuft, bleibt der Block frei. Zwei Dinge hängen daran:

- **Der Boden muss mitziehen.** `inTown` legt auf einem unbebauten Block
  Grünfläche statt Gebäude. Täte er das nicht, stünde dort eine Wand, die
  nirgends gezeichnet wird - und die lief man sich auf der Suche nach dem
  Fehler zweimal ab.
- **Die Antwort wird gemerkt.** Die Landstraßen sind tausend Punkte, und der
  Renderer fragt für jeden sichtbaren Block in jedem Bild.
- **Ein Feld Rand gehört dazu.** Gezeichnet wird breiter als gelegt: Die
  Landstraße ist eine glatte Linie, etwas breiter als ihr Feldband, damit die
  Treppe darunter verschwindet - und dann steht eine Straße, die nur den Gehweg
  streift, trotzdem an der Hauswand. Deshalb prüft `crossed` ein Feld über die
  Parzelle hinaus.
- **Landstraßen enden nicht mitten in der Stadt.** Drei von ihnen taten es, und
  eine Landstraße endet als runde Kappe Asphalt - also lag ein Kreis Teer über
  einem halben Wohnblock. Ihre Endpunkte liegen jetzt knapp außerhalb der
  Stadtrechtecke, auf der Randstraße, wo sie ins Raster übergehen.

**Das Gleis wird als Linie gezeichnet, nicht als Felder.** Dieselbe Trennung
wie bei den Landstraßen, und aus demselben Grund: Jedes Feld malte vorher sein
eigenes Stück Gleis, gedreht nach der Richtung dort und zentriert auf der
Feldmitte. In der Kurve liegt die Feldmitte aber neben der Linie - also lagen
die Stücke versetzt nebeneinander statt hintereinander, und die Schienen waren
lauter kurze Striche. Jetzt läuft `drawTrack` einmal die Polylinie aus
`railLine` ab: Schwellen quer darauf, und die beiden Schienen als je ein
durchgehender Pfad, um eine halbe Spurweite nach außen versetzt.

**Bahnsteige gehören zur Karte, nicht zum Bild.** `platformBox` sagt, wo der
Beton liegt; der Renderer zeichnet genau dieses Rechteck und `crossed` hält die
Häuser davon frei. Vorher kannte nur der Renderer das Maß - und ein Bahnsteig,
der sieben Felder lang ist, reicht in die Parzelle nebenan hinein. Genau so war
das Haus des Spielers halbiert.

**Der Zug ist eine Zahl.** `train.along` - wie weit er auf der Runde ist. Wo die
Lok steht, wo der vierte Wagen steht und wohin sie zeigen, rechnet `trainAt`
daraus aus. Dazu kommt `waitUntil`: Würde ein Schritt an einem Bahnsteig
vorbeiführen, wird der Zug stattdessen **auf** den Bahnsteig gesetzt und bleibt
dort stehen. Weil er dabei genau auf dem Halt landet, beginnt der nächste
Schritt hinter ihm - derselbe Bahnsteig kann ihn nicht zweimal fangen. Ein
Mitfahrer ist ebenfalls keine eigene Mechanik: `player.aboard`, und die Position
des zweiten Wagens wird ihm jeden Schritt zugewiesen.

## Nicht jede Linie ist eine Straße

**Eine Stadt ist kein Karopapier.** Jede achte Linie war eine Straße, in beide
Richtungen, ausnahmslos - das ergibt ein Raster aus gleichen Quadraten mit einem
gleichen Abstand um jedes herum, und genau das eine, was man in einer echten
Stadt nie sieht: zwei Häuser, die nebeneinanderstehen. Jedes Haus war eine
Insel.

`street(line, across)` entscheidet deshalb **pro Achse**, ob auf einer
Blockgrenze überhaupt Asphalt liegt. Ein Viertel der Grenzen wird schlicht nicht
gebaut; wo eine fehlt, laufen die beiden Blöcke links und rechts davon zu einer
langen Parzelle zusammen, und die Häuser darauf stehen Wand an Wand. Weil die
Frage pro Achse gestellt wird, gibt es Züge, die nur ihre Nord-Süd-Straßen haben
und keine Querstraßen - was die Form der halben Straßen ist, in denen jemals
jemand gewohnt hat.

Zwei Regeln halten das Ganze bei einer Stadt statt bei einer Wiese:

- **Eine Autobahn fällt nie aus.** Sie ist die eine Straße, die man der Länge
  nach fährt, und eine Lücke darin ist eine Lücke in der Karte.
- **Zwei Blöcke dürfen zusammenlaufen, drei nicht.** Eine Grenze, die ausfallen
  will, sieht nach, ob die vorige ausgefallen ist, und bleibt stehen, wenn ja.
  Ohne das ergibt eine Pechsträhne einen Block von einem Vierteldorf Länge, in
  den man nirgends abbiegen kann.

`isRoad` und `nextToRoad` fragen beide dieselbe Funktion, und alles, was von
ihnen abhängt - `builtSpan`, `openSpan`, `builtPlot`, `prisonPlot`,
`atCrossing`, der Boden selbst - bekommt die Achse mit durchgereicht. Das ist
der ganze Umbau: **eine** Antwort, an einer Stelle, und der Rest der Stadt zieht
nach.

## Ein Haus hat eine Tür

**Eine Wand mit beleuchteten Fenstern ist ein Lagerhaus.** Jedes Gebäude war
eine flache Platte mit einem Raster leuchtender Quadrate darauf und sonst
nichts - kein Weg hinein, nichts auf der Höhe, auf der ein Mensch steht, nichts,
was ein Wohnhaus von einem Bürohaus oder von der Flanke eines Parkhauses
unterscheidet.

Vier Dinge beheben das, und alle vier sind unten, wo man hinsieht:

- **Eine Haustür**, mittig, mit Zarge, Klinke und einer Stufe auf den Gehweg
  hinaus. Jedes Gebäude bekommt eine: Was es sonst auch ist, irgendwer geht dort
  hinein. Wohnhäuser bekommen ein Blatt aus Holz, alles mit einem Namen darüber
  zwei Flügel Glas mit dem Pfosten dazwischen.
- **Ein Sockel** aus Stein am Fuß der Wand, und der ist das, was die Platte
  aufhört, als Platte zu lesen.
- **Fenster mit Rahmen, Sprossen und Bank** statt flacher Rechtecke. Ein Feld
  mit einem Strich drumherum liest sich als Loch in einer Wand; eines ohne als
  Aufkleber darauf. Vier kleine Scheiben statt einer großen sind der
  Unterschied zwischen einem Fenster und einer Windschutzscheibe.
- **Und eine Veranda** auf manchen Wohnhäusern - ein Dach über die Front auf
  zwei Pfosten, die Tür darunter. Nicht auf einer Bank und nicht auf einer
  Feuerwache; nur auf den namenlosen Häusern, und nicht auf allen, weil eine
  Straße, in der jedes Haus dieselbe Veranda hat, wieder dasselbe Lagerhaus
  ist.

**Der Eingang fragt zuerst, die Fenster weichen aus.** Ein Verandapfosten mitten
durch ein Fenster ist das Einzige, was schlimmer ist als gar keine Veranda, und
bei mittiger Tür und gleichmäßig verteilten Fenstern hält nichts die beiden
davon ab, auf derselben Stelle zu landen. `frontage` zeichnet deshalb zuerst und
gibt zurück, wie viel Wand der Eingang für sich beansprucht hat; `drawWindows`
verteilt das Erdgeschoss danach auf die **zwei** Wandstücke, die übrig bleiben -
die Fenster links davon gleichmäßig über das linke Stück, die rechts davon über
das rechte. Der erste Versuch, jedes störende Fenster nur zur Seite zu schieben,
machte seinen eigenen Schlamassel: Zwei in dieselbe Richtung geschobene Scheiben
berührten sich, und das ist ein Schaufenster, kein Paar Hausfenster. Die
Obergeschosse liegen über dem Verandadach und bleiben, wie sie waren.

**Und Parkplätze.** `drive` legt vor manche Häuser eine Bucht mit aufgemalter
Markierung, flach auf den Gehweg, seitlich neben der Tür, damit sich die beiden
nicht um denselben Meter Bordstein streiten. Zwei Dinge daran sind die Arbeit:

- **Eine pro Haus, nicht eine pro Parzelle.** Eine Reihenhauszeile sind fünf
  Häuser auf einem Block; eine einzelne Bucht quer darüber gehörte denen, vor
  denen sie zufällig landete. Jedes Haus würfelt für sich.
- **Nur wo Gehweg ist, auf den man sie legen kann.** Ein Block, der direkt an
  eine Autobahn grenzt, hat keinen Bordstein und keinen Streifen - der Asphalt
  beginnt, wo die Wand aufhört -, und eine Bucht dort ist eine Bucht auf der
  Überholspur. `drawHouse` fragt deshalb den Plan, was vor diesem Haus wirklich
  liegt, bevor irgendetwas darauf gemalt wird.

## Spielstände ohne den Boden

`storage/saves.ts` schreibt alles außer `GameState.cells`. Der Boden sind
28.000 Felder, die sich aus dem Plan jedes Mal identisch ergeben - beim Laden
werden nur die drei Garagen wieder hineingeschnitten und die Tür geöffnet, die
offen war. Das ist der Unterschied zwischen 220 Kilobyte und einem Megabyte pro
Stand.

Gespeichert wird im Spiel-Loop, nicht im Effekt: React darf während eines
Effekts keinen State setzen, und der Loop ist ohnehin die Stelle, an der jede
andere Aktualisierung passiert.

## Die dritte kleine Welt

Die Casa de Papel - die Banknotendruckerei - ist nach demselben Muster gebaut wie der Knast und aus
demselben Grund: ein fester Plan aus Feldern, eigene Figuren darauf, und genau
**eine** Naht zur Stadt. `advanceMint()` bekommt den Zustand und die Tasten und
gibt drei Antworten zurück - weiter, raus, oder sie sind drin. Die Stadt steht
so lange still.

Der Unterschied zum Knast ist, dass hier **drei Uhren gleichzeitig** laufen und
**jede jemand anderem gehört**:

- **Die Geiseln drucken.** Nur besetzte Pressen zählen (`manned()`), und besetzt
  heißt: jemand steht wirklich daran, nicht bloß, dass er hingeschickt wurde.
- **Die Crew gräbt.** `digCrew()` ist das ganze Argument für das Anheuern
  draußen: der Tunnel ist die einzige Uhr, über der niemand stehen muss, und wie
  schnell sie läuft, hat der Spieler auf der Straße entschieden.
- **Die Polizei drückt.** `siege()` schickt alle `WAVE_EVERY` Sekunden einen
  Trupp an den schwächsten der drei Eingänge, und von da an ist es Arithmetik.

Dass der Spieler **nur eine** dieser drei Uhren selbst bedienen kann, ist das
Spiel. Das Gebäude ist absichtlich so groß, dass der Weg vom Fenster zum
Ladetor fünfzehn Sekunden dauert.

**Eine Maus, drei Arbeiten.** `doWork()` entscheidet nicht über ein Menü,
sondern über den Ort: an einer Tür stapelt die gehaltene Maus, an einem
Angestellten nimmt sie eine Geisel, am Schacht gräbt sie. Ein Knopf pro Tätigkeit
wäre eine Leiste, die man liest, statt eines Gebäudes, durch das man rennt.

**Barrikade und Druck sind zwei Zahlen, keine.** Was vor der Tür liegt,
verlangsamt, was durch sie kommt (`SHIELD`), und was durch sie kommt, frisst
langsam, was davor liegt (`WEAR`). Stapeln **drängt zusätzlich zurück**
(`RETAKE`) - ohne das bliebe eine Tür, die zu drei Vierteln offen war, für den
Rest des Bruchs zu drei Vierteln offen, und die letzten Minuten wären an einer
Tür verloren, die man nie wieder zubekommt.

**Jede Art, Zeit zu kaufen, kostet Geld.** Eine Geisel rauslassen kostet eine
Presse für immer; den Strom kappen kostet alle Pressen, solange es dunkel ist,
und geht nur einmal. Ein drittes Mittel, das nichts kostet, würde die beiden
anderen überflüssig machen.

**Der Tunnel ist die Belohnung, nicht nur der Ausgang.** Wer durch die Vordertür
geht, hat eine Verfolgungsjagd; wer durch den Boden geht, hat keine. Deshalb
setzt `upTheTunnel` **keine** Sterne - es gibt nichts zu verfolgen, weil niemand
weiß, wo das Loch endet. Weil damit aber auch kein Stern mehr abgebaut wird,
nimmt `cashIn` dem Spieler beim Auszahlen die Maske ab: Sonst liefe er für den
Rest des Spiels im Overall herum.

**Der Tunnel kommt auf einer Straße hoch**, nicht einfach zweihundertsechzig
Pixel südlich der Tür: `tunnelMouth()` sucht ringweise die nächste Kreuzung, die
wirklich Asphalt ist. Die schlichte Variante setzte eine der beiden Druckereien
unter einen Wohnblock - und in einer Wand hochzukommen wäre ein schlimmeres Ende
als geschnappt zu werden.

## Eine Crew ist vier Leute, die man nicht verlieren darf

Drei Kleinigkeiten machen aus "vier Mann laufen ungefähr hinter dir her" etwas,
mit dem man arbeiten kann - und alle drei sind dieselbe Erkenntnis: Was man nur
mühsam beisammenhält, nimmt man nicht mit.

- **Sie schauen, wo sie hinlaufen.** `walkPerson` legt jetzt denselben Blick
  nach vorn ein, den die Polizisten zu Fuß haben (`steerRound`): Die gewünschte
  Richtung wird probiert, dann dieselbe ein Stück zur Seite gedreht, bis eine
  frei ist. Das ist keine Route, sondern ein Blick - in einem Raster reicht das,
  weil das, was im Weg steht, ein Block ist. Vorher lief eine Crew jedes Mal in
  die Hauswand, wenn ihr Anführer um die Ecke bog.
- **Sie sind schneller als du.** Ein Bandenmitglied schlendert mit 48 Pixeln je
  Sekunde, der Spieler geht 130. Wer folgt, läuft deshalb mit dem Faktor
  `CREW_HURRY`, und wer weiter als `CREW_LOST` zurückliegt, rennt.
- **Sie fahren mit.** `getIn` nimmt beim Einsteigen jeden aus
  `GameState.people` heraus, der nah genug steht, und legt ihn nach
  `GameState.riders`; `putDown` stellt sie beim Aussteigen um den Wagen herum
  wieder hin. Wer in einem Auto sitzt, ist **nicht** woanders auf der Straße -
  die Alternative wären vier Gangmitglieder, die im Dauerlauf hinter einem
  Wagen herhecheln, und das war der Grund, warum eine Crew wertlos wurde,
  sobald man sich hinters Steuer setzte.

## Das eigene Haus sieht aus wie das eigene Haus

Drei Häuser dieser Stadt gehören dir - zwei davon so, wie dieser Abschnitt sie
beschreibt, und das dritte ist die Villa im Südosten, die einen eigenen
Abschnitt hat. Das Einzige, was ein eigenes Haus früher sagte, war ein
Rolltor mitten in einer gewöhnlichen Häuserzeile: Man fuhr nach Hause zu einem
Gebäude, das man aus der Straße, in der es steht, nicht heraussehen konnte. Ein
Ort, an dem man Dinge aufbewahrt, sollte ein Ort sein, den man findet.

Es wird deshalb als das gute Haus der Straße gebaut - Stein statt Putz,
Eckquader die Ecken hoch, ein Gesims unter der Traufe, ein **Portikus** auf
zwei Säulen über der Haustür mit je einer Lampe daneben, und zwei Reihen hoher
Sprossenfenster. Vor der Garage ist ein **Stellplatz** auf den Gehweg gemalt,
was die andere Hälfte dessen ist, wofür ein eigenes Haus da ist: ein Platz für
den Wagen, auf den sonst niemand Anspruch hat.

Erkannt wird es daran, dass der Plan dort eine Garage hineingeschnitten hat -
kein Flag, kein Feld. Und das Einzige, was es nicht tun darf, ist über sein
eigenes Garagentor zu malen: Das ist ein Bild für sich und kommt danach obenauf,
also werden die Fenster über die Front verteilt und die, die in die Toröffnung
fallen, weggelassen.

## Die Villa im Südosten

Drei Häuser gehören dem Spieler, eines je Insel, und seit Kurzem ist eines davon
nicht dasselbe Haus. Das im **Südosten** ist nach einem Foto gezeichnet - einer
spanischen Villa -, und welches es ist, steht nicht in einem Flag, sondern im
Plan: In welchem Stadtviertel die Garage liegt, in dem liegt das Haus
(`districtAt`).

Vier Dinge tragen diesen Bautyp, und mehr braucht es nicht:

- **Das Dach ist Ziegel, und es ist das meiste, was man sieht.** Terrakotta, in
  Reihen, mit First oben, Graten an beiden Enden und einem Dachüberstand als
  Schattenkante unten. Von hier oben sind neun Zehntel des Hauses Dach. Die
  Reihen liefen zuerst alle vier Pixel - das war Wellblech; bei sieben und in
  einer Farbe, die nur einen Hauch vom Ziegel abweicht, liest es sich als
  Pfannen auf einer Schräge.
- **Zwei Baukörper, keine Kiste.** Links der zweigeschossige Hauptbau, rechts
  daneben ein einstöckiger Flügel unter eigenem, tieferem Dach, dessen Ende
  offen ist: der Carport. Dass der Flügel _angebaut_ ist und nicht danebensteht,
  sagt ein schmaler Streifen Putz an der Fuge - die zweigeschossige Wand, die
  über dem Flügeldach stehen bleibt.
- **Bögen.** Beide Erdgeschosse sind Loggia: rundbogige Öffnungen in tiefem
  Schatten, die Haustür mittendrin und eine Treppe hinunter zur Auffahrt.
- **Und ein Balkon** über der Tür, mit schmiedeeisernem Geländer und Töpfen
  darauf - das Einzige im Obergeschoss, das sagt, dass hier jemand wohnt.
- **Ein Schornstein mitten auf dem Dach.** Er stand an der Vorderkante der
  Ziegel, halb neben dem Haus; ein Schlot kommt aus der Mitte eines Daches. Er
  steht jetzt knapp zwei Drittel hinten auf der Schräge des großen Daches und
  quer in dessen Mitte - da, wo auf dem Foto der Rauch herauskommt - und er ist
  fast doppelt so breit, mit Schattenseite, Lüftungsschlitzen und Abdeckplatte.
- **Ein Giebel über dem linken Ende.** Auf dem Foto ist die linke Seite ein
  eigener Flügel unter einem Satteldach, und was man davon von der Straße aus
  sieht, ist ein Dreieck. Von oben sind es zwei Schrägen, die sich am First
  treffen, und das Einzige, was das in dieser Größe sagt, ist, dass die beiden
  nicht ganz dieselbe Farbe haben. Darunter auf der Wand das Dreieck selbst,
  mit den Ziegeln über beide Schrägen gezogen und einem Ochsenauge darin.
- **Und die Haustür ist die mittlere Arkade**, nicht ein Brett davor. Sie ist
  so breit wie der Bogen: Steingewände, Rundbogen darüber, zwei Flügel mit
  Kassetten, ein beleuchtetes Oberlicht im Bogenfeld. Sieben Pixel Holz in
  einem zwanzig Pixel breiten Bogen waren eine Katzenklappe in einer
  Kathedrale.

**Die Garage steht im Carport, und das ist eine Planänderung.** Jedes Haus der
Stadt bekommt sein Tor in der Mitte der Front (`DOOR_ACROSS`), und bei einem
Haus von drei Feldern nimmt ein autobreites Tor ein Drittel der Front mit -
Haustür, Balkon und Fenster lagen alle dahinter. Die Villa hat ihren Carport am
rechten Ende, also wird die Bucht dort aus der **letzten Spalte** des
Grundstücks geschnitten statt aus der mittleren. Gerechnet wird das in
`myHouses` und in `villaPlot` aus derselben Quelle (`openSpan`), damit das Loch
in der Wand und das Loch im Boden nicht an verschiedenen Stellen landen können.
Der Flügel legt sich dann von selbst über die Öffnung: Wo die Bucht ist, ist der
Carport, und dort fährt man hinein.

**Und sie hat ein Grundstück, und zwar über zwei Blöcke.** Das Haus nebenan
kommt dafür weg. Damit liegt die Straße zwischen den beiden Blöcken _innerhalb_
des Grundstücks - dasselbe, was ein Gefängnis mit der Kreuzung in seiner Mitte
macht, und es gilt dieselbe Regel: Eine gewöhnliche Straße darf geschluckt
werden, eine **Autobahn** nicht. Genommen wird außerdem nur ein gewöhnliches
Haus; eine Bank, ein Krankenhaus oder ein Club ist einmalig und an seinem Platz
mehr wert als als Rasenfläche.

**Quer aufgeteilt wird es in Streifen**, und jede Zahl davon steht an einer
Stelle (`VILLA_KERB`, `VILLA_LAWN`, `VILLA_ROOMS`, `VILLA_MAIN`,
`VILLA_BAY_IN`): Gehweg, Hecke, Wiese, das Haus, gleich anschließend der
gepflasterte Hof, dann Wiese, Hecke, Gehweg. Die **Hecke ist die Linie zwischen
Gehweg und Garten**, nicht die zwischen Garten und Straße: Sie steht innerhalb
des Fußwegs, der an beiden Seiten vorbeiführt, und läuft auch hinten am
Grundstück entlang. Man geht also an der Villa auf Pflaster vorbei mit einer
Hecke am Ellbogen.

**Drei Seiten, nicht vier.** Vorn an der Straße steht keine: Ein Haus, das man
von der Straße aus nicht sieht, ist ein Haus mit einer Hecke davor, und dieses
ist zum Ansehen da. Die Hecke selbst ist neun Pixel tief statt fünf und aus
drei Tönen gebaut - dunkel am Boden, ihre eigene Farbe im Körper, und eine
Reihe geschnittener Köpfe auf der Sonnenseite, von denen kein einziger genau
auf der Linie sitzt. Flaches Grün mit einer Wellenlinie darauf war eine
Billardbande.

**Auf der Wiese blühen Blumen.** Jedes Büschel kommt aus `scatter` auf dem Feld,
auf dem es steht - dieselbe Rabatte an derselben Stelle, jedes Mal, ohne dass
irgendetwas aufgeschrieben wird. Und sie werden **vor** der Auffahrt und dem
Hof gezeichnet, nicht danach: Die Auffahrt liegt auf Feldern, die der Plan
weiterhin Wiese nennt, also wuchsen zuletzt gezeichnete Blumen durch den
Asphalt.

**Und Zivilisten haben auf dem Grundstück nichts verloren.** Es ist
Privatgrund - Wiese, Pflaster, Haus, alles hinter einer Hecke -, und das
Einzige, was die Öffentlichkeit davon angeht, ist der Fußweg an beiden Seiten.
Den Boden kümmert das nicht, Gras ist Gras; gesagt wird es also dem
Spaziergänger, genau wie bei der Fahrbahn und beim Gleis. Gemessen über eine
Minute Stadt, dreißig Stichproben: **null** Leute auf dem Grundstück.

**Hingesetzt wird dort ohnehin niemand mehr**, und das hat einen zweiten Grund,
der beim Nachsehen herauskam: Die Garagenbucht ist ein Feld `walk`, das mitten
aus dem Haus geschnitten ist, damit ein Auto hineinpasst - und `findSpot` sucht
Fußgängern Felder vom Typ `walk`. Zu Spielbeginn stand also in jedem Spiel ein
Passant in der eigenen Garage. Auf dem Fußweg neben dem Grundstück wird
außerdem nur noch jeder Dritte abgesetzt (`VILLA_PASSERS`): ein Dutzend Felder
Pflaster, eingeklemmt zwischen Hecke und Fahrbahn, läuft sonst voll und bleibt
voll. Wer später von selbst hereinspaziert, ist willkommen.

Herauskommen tun sie auch wieder: Gemessen, fünf Leute auf den Fußweg gesetzt,
nach siebzig Sekunden sind vier davon über die Straße auf die andere Seite
gegangen. Das ist `crossingMood`, dieselbe Laune, nach der überall in der Stadt
jemand eine Straße überquert. **Das Haus steht nicht auf der Grenze** -
das ist der ganze Unterschied zwischen einer Villa in ihrem Grundstück und
einem Reihenhaus mit großem Garten: Um eine Villa geht man herum.

`villaCell` legt danach vier Sorten Boden: `walk` an den beiden Rändern,
`building` für das Haus, `dock` für den Hof und `park` für alles andere. Das
kostet nichts, weil alle vier begehbar sind - niemand, der sich bewegt, muss
davon wissen. Der Hof reicht **bis an den Bordstein**: ein Platz, auf den man
nicht von der Straße fahren kann, ist ein Hinterhof.

**Der Hof ist gepflastert, nicht eingezeichnet.** Aufgemalte Buchten haben
daraus einen Supermarktparkplatz gemacht; was neben eine Villa gehört, ist ein
Kopfsteinpflaster, auf dem die Wagen stehen, wo sie eben stehen. Die Steine
sind ein `CanvasPattern`, einmal gebaut und behalten - ein Hof von drei mal
vier Feldern sind hundertfünfzig Steine, und die jedes Bild einzeln zu zeichnen
sind hundertfünfzig Rechtecke pro Bild für einen Boden, den niemand zweimal
ansieht. Gelegt wird das Muster ab der **Ecke des Hofes**, sonst kriecht es
unter der Kamera weg statt auf dem Boden liegen zu bleiben.

**Und das Garagentor sitzt mitten im Anbau.** Der Anbau ist dafür breiter (drei
Felder statt zwei) und höher (`VILLA_LOW` 0,72 statt 0,62): Das Tor ist 38
Bildpunkte hoch, und ein Anbau, der niedriger ist als sein eigenes Tor, ist ein
Tor, das über die Traufe hinausragt. Wie viel vom Haus Anbau ist, kommt jetzt
aus dem Plan statt aus der Torposition - andersherum gerechnet fing der Anbau
genau dort an, wo das Tor anfing, und das Tor saß auf seiner Kante.

Dabei ist ein dritter Zirkelschluss aufgefallen, und ein hübscher: `villaBlock`
fragte `myHouses`, und `myHouses` verschiebt die Tür der Villa auf die
Garagenspalte - die auf einem Grundstück von zwei Blöcken Breite im **anderen**
Block liegt. Damit hielt die Villa sich für ihren eigenen Nachbarn, und das
ganze Grundstück wanderte bei jeder Abfrage einen Block weiter nach rechts.
`homeDoors` liefert jetzt die ungeschobenen Türen, und `villaBlock` fragt die.

Aus demselben Grund findet das Bild das eigene Haus nicht mehr über den Block,
sondern über das Grundstück: Nach Block gefragt kam die Villa als gewöhnliches
Haus heraus und das schlichte Haus nebenan als Villa - also als gar nichts, weil
dieser Block geschluckt ist und nie gezeichnet wird.

Gemessen, ob die geschluckte Straße den Verkehr staut: nach neunzig Sekunden
stehen an der Sackgasse zwei Wagen, keiner davon still.

Dabei ist ein zweiter Ring aufgefallen, dieselbe Sorte wie beim
Polizeiwachen-Umbau: `doorsOf` wollte den geschluckten Block überspringen und
fragte dafür `villaTook` - was über `villaBlock` und `myHouses` wieder bei
`doorsOf` landet. Nötig war es ohnehin nicht: Der Block liegt im selben Viertel
wie die Villa, und pro Viertel gibt es nur ein eigenes Haus. Übersprungen wird
er im **Bild**, wo der Prison-Umbau dieselbe Prüfung schon hat.

Darauf liegt dann der Rest, und zwar in den Koordinaten des **Grundstücks**,
nicht des Hauses - das Haus ist eine Ecke einer Wiese von zwölf Feldern Breite,
und eine Hecke ums Haus wäre eine Hecke quer durch den Garten. Also: die
gepflasterte Auffahrt, auf das Grundstück geklemmt, mit dem Stellplatz darauf;
geschnittene Hecke rings herum mit zwei Lücken - der Auffahrt zur Garage und
der ganzen Einfahrt des Parkplatzes, denn eine Hecke quer vor einem Parkplatz
ist ein Parkplatz, auf dem nie ein Auto steht; eine Reihe Zypressen und ein
paar Agaven im Gras. Die
Pflasterfugen laufen quer zur Auffahrt statt längs - andersherum sieht es aus
wie eine Holzterrasse, und niemand dielt einen Vorplatz. Die Hecke ist eine
Reihe geschnittener Buckel und kein grüner Balken; ein grüner Balken ist ein
Billardtisch.

**Höher ist sie auch**, und zwar in `houseHeight` statt im Bild: zwei richtige
Geschosse mit Ziegeldach darüber, statt des Bungalows, den die Würfel für diese
Ecke gerollt hätten. Dort, weil `roofAt` dieselbe Zahl liest - das Dach, auf dem
man mit dem Jetpack landet, muss das Dach sein, das man sieht.

## Hinter dem Garagentor können sie einen nicht sehen

Die Polizei hat durch die Wand geguckt, und zwar an vier Stellen auf einmal.
Wer in seiner eigenen Garage saß, wurde weiterhin angefahren, beschossen,
eingekesselt und verhaftet - und die Fahndung lief nicht ab, weil `coolDown`
jeden Polizisten innerhalb von `SEEN_RANGE` als Augenzeugen zählt, Mauer hin
oder her. Eine Tür, durch die man verfolgt werden kann, ist kein Versteck,
sondern eine Sackgasse.

Alles daran folgt jetzt aus einem Satz, und der steht in `lost()`: **Durch eine
Wand sieht niemand.** Vier Stellen lesen ihn:

- `coolDown` zählt ihn nicht mehr als gesehen, also läuft die Uhr, die ihm die
  Sterne abnimmt. **Nicht sofort** - die Garage ist keine Begnadigung, sie ist
  ein Ort, in den sie nicht hineinsehen können. Gemessen: mit drei Sternen
  hineingefahren, nach zwanzig Sekunden zwei, nach vierzig einer, nach sechzig
  „Die Luft ist rein".
- Die Männer und die Wagen fahren nicht mehr auf ihn zu, sondern auf **die
  Straßen um das Haus herum**, jeder auf seinen eigenen Punkt eines Rings
  (`searchAt`). Das ist es, was sie in die Nebenstraßen verteilt, statt sie
  alle vor der Tür aufzustapeln.
- Niemand schießt. Ein Polizist feuert auf alles in Reichweite seiner Waffe,
  was durch ein geschlossenes Garagentor hindurch ein Mann wäre, der auf gut
  Glück auf ein Gebäude schießt.
- Und niemand verhaftet. Ein Ring Polizisten um ein Haus ist kein Ring um den
  Mann darin - stillzusitzen ist genau das, was man in einer Garage tut, und
  genau das war die Verhaftungsbedingung.

## Das Garagentor ist eine Wand, kein Bild

Drei Dinge mussten zusammenkommen, damit man in die eigene Garage fahren kann:

- **Ein Loch im Haus.** `openBay` schneidet beim Spielstart genau ein Feld aus
  dem Block heraus, in dem dein Haus steht; `setGarage` öffnet und schließt das
  Feld darunter - das Torfeld - zusammen mit dem Tor. Kein Sonderfall in der
  Kollision: Wer fragt, ob er da durchfahren darf, fragt den Boden, und der
  antwortet dasselbe wie das Bild.
- **Zwei Felder tief.** Eines reicht nicht. Wer in einer Wand steht, darf sich
  **heraus**bewegen - diese Regel verhindert, dass jemand für immer in der
  Kulisse klemmt -, also stünde ein Wagen im Torfeld selbst und würde beim
  Schließen einfach hinausfahren. Der Wagen parkt deshalb im hinteren Feld, und
  das Tor geht davor zu.
- **Das Tor wird nach dem Haus gezeichnet.** Vorher lag es in derselben Lage wie
  die Ringe auf der Straße, also **unter** der Hauswand - und weil das Haus
  durchsichtig wird, sobald man dahintersteht, sah man die Fenster durch das
  geschlossene Tor. Jetzt ist es ein eigener Eintrag in der Tiefensortierung,
  eine Haaresbreite hinter der Hauswand. Und wenn der Spieler drinnen steht,
  wird es danach noch einmal gezeichnet: Die Regel "der Spieler ist immer
  sichtbar" würde sonst die eigene Motorhaube durch das zugesperrte Tor malen.

## Vier kleine Welten, eine Naht

Knast, Notendruckerei und Bank sind nach demselben Muster gebaut, und das ist
kein Zufall, sondern die einzige Art, so etwas billig zu halten:

- ein fester Plan aus Buchstaben (`PLAN`), eine `LEGEND`, ein `solid()`,
- ein eigener Zustand im `GameState` (`prison`, `mint`, `bank`) und eine eigene
  `Phase`,
- eine Funktion `advanceX(state, input, dt)`, die drei Antworten kennt: weiter,
  raus, vorbei,
- ein eigener Renderer, der denselben Kippwinkel und dieselben Figuren benutzt
  wie die Stadt und sonst nichts mit ihr teilt.

Die Stadt steht still, solange eine davon läuft. Was zurückkommt, ist immer nur
ein Ergebnis - wie viel Geld, und ob man gesehen wurde.

**Die Bank ist die kleinste davon und die mit der klarsten Entscheidung.**
Decken oder arbeiten: Wer an einer Kasse steht, steht nicht bei den Leuten, und
wer nicht bei den Leuten steht, hat in fünf Sekunden einen auf dem Weg zum
Knopf. Die Geiseln laufen deshalb **mit** - der Mann mit der Kombination muss
an die Tresortür gebracht werden, und das geht nur, indem man ihn hintersich
herlaufen lässt.

## Was im Bild steht, steht nicht daneben

Unter dem Bild lief eine zweite Zeile mit Sternen, Respekt und „Pakete
abholen". Die Sterne standen damit **zweimal** auf dem Schirm - oben rechts
gezeichnet, unten noch einmal in Text -, und das Spiel hörte am Rand des Bildes
nicht auf, sondern lief in die Seite hinein. Die Zeile ist weg. Was zählt,
steht im Bild: Sterne, Blech, Geld, Waffe.

## Die Knöpfe stehen im Bild, nicht auf der Seite

`gta-actions.ts` ist beides: die Liste der Knöpfe und ihre Kästen. Der Renderer
malt sie, der Hook fragt sie, was ein Klick getroffen hat. Ein Knopf ist nur
dann ein Knopf, wenn gezeichnet und getroffen dieselbe Rechnung sind - zwei
Listen, die auseinanderlaufen können, wären die erste Stelle, an der ein Kauf
danebengeht.

Sie liegen im Bild und nicht darunter, weil es im Vollbild kein Darunter gibt,
auf dem Telefon keinen Platz dafür, und weil ein Laden, für den man von der
Straße wegsehen muss, ein Laden ist, vor dem man erschossen wird.

## Drei Tabellen statt drei Sonderfällen

Waffen, Leute, Fahrzeuge und Häuser sind jeweils **eine Tabelle**, und der
Motor liest die Zeile statt den Typ. Ein Panzer ist ein sehr langsames, sehr schweres, sehr
zähes Auto - nur seine Kanone ist ein Sonderfall. Ein Bandenmitglied ist ein
Passant mit mehr Gesundheit, einer Waffe und einer Seite. Eine sechste
Karosserie oder eine siebte Sorte Mensch ist eine Zeile und eine Form, kein
Umbau am Fahren oder am Laufen.

Beim Menschen macht die Zeile drei Dinge aus: wie schnell er geht, wie viel er
aushält und ob er schießt. Nur zwei Fragen stellt der Motor über die Art selbst,
und beide betreffen die Banden - wer ist auf welcher Seite, und wen darf eine
Kugel treffen. Grün geht auf Orange, Orange auf Grün und auf dich; alle anderen
laufen weiter und rennen, wenn es laut wird.

## Wer wem was tut

Die Regeln, wer hier eigentlich Schaden nimmt, sind absichtlich anders als beim
Vorbild - und zwar so, dass jeder Tod eine Ursache hat, die man sieht:

- **Autos bremsen für Fußgänger.** Ein Kombi, der einen aus dem Nichts über den
  Haufen fährt, ist kein Spiel, sondern ein Würfel. Geprüft wird ein Korridor
  vor der Motorhaube, nicht ein Kreis: wer neben dem Wagen auf dem Gehweg
  läuft, steht nicht im Weg.
- **Nicht jede Tat ruft die Polizei.** Was Passanten trifft, sammelt sich als
  „Aufsehen" (`heat`) im Zustand an; drei Punkte ergeben einen Stern. Ist
  dagegen eine Streife in Sichtweite, zählt die erste Tat sofort - und alles,
  was gegen die Polizei selbst geht, sowieso. Der Zwischenschritt ist der ganze
  Unterschied zwischen einer Stadt, in der man sich prügeln kann, und einer, in
  der jeder Faustschlag eine Verfolgungsjagd auslöst. Damit „kein Stern" nicht
  wie ein Fehler aussieht, sagt das Log die Tat trotzdem an - mit dem Zusatz,
  dass sie niemand gesehen hat.
- **Die Streifen kommen einzeln.** Ein Wagen je Stern, sieben Sekunden Abstand,
  höchstens sechs. Wracks zählen nicht mit: Wer einen ausschaltet, hat die
  Zeitspanne bis zum nächsten - und wer in der Zeit aus der Sichtweite kommt,
  wird die Sterne los.
- **Zu Fuß steigt die Polizei aus.** Der Streifenwagen hält auf Höhe des
  Spielers, zwei Mann steigen aus, kommen auf Schussweite und schießen. Im Auto
  bleiben sie drin und rammen - eine Verfolgung ist eine Verfolgung.
- **Im Auto zahlt das Blech.** Ein Zusammenstoß kostet die Karosserie, nicht den
  Fahrer, auch an einer Hauswand. Wie viel noch da ist, steht als Balken in der
  Ecke - das ist die Warnung, solange es etwas zu warnen gibt.
- **Ist das Blech alle, ist der Wagen ein Wrack.** Kein Antrieb mehr, er rollt
  aus. Dann läuft eine Uhr von neun Sekunden in vier sichtbaren Stufen: Rauch,
  schwarzer Qualm, Feuer, Knall. Vorher steht die Uhr still - ein Auto, das
  schon beim halben Balken qualmt, macht den Balken überflüssig, und ein Auto,
  das ohne Vorwarnung hochgeht, ist ein Würfel.
- **Jede Waffe ist ein kleines Bild, und die Bilder stehen in einer Tabelle.**
  Zehn Sorten sind lange über der Grenze, ab der eine `else if`-Kette nicht mehr
  zu lesen ist, und jedes dieser Bildchen hat den anderen nichts zu sagen. Alle
  zeigen **nach Osten** und passen in zwölf Pixel um die Mitte - dann stimmt
  dasselbe Bild im Eck-Panel, als Fundstück auf der Straße und in der Hand, wo
  es nur noch in den Zielwinkel gedreht wird.
- **Wenig liegt herum, und das Schwere nur einmal.** Die Fundstücke werden
  nicht mehr aus einer Tüte gezogen, sondern abgezählt: eine Zeile je Sorte mit
  "wie viele" und "kommt wieder". Maschinengewehr, Flammenwerfer und Panzerfaust
  stehen dort mit `many: 1, again: false` - genau eines in der ganzen Stadt, und
  weg ist weg. Dafür trägt jeder Polizist und jedes Bandenmitglied eine Waffe im
  Zustand (`holds`), und `dropArms` legt sie dorthin, wo er fällt. Wer etwas
  Schweres will, nimmt es jemandem ab.
- **Was einer trägt, entscheidet auch, wie er kämpft.** Reichweite und Schaden
  kommen aus der Waffentabelle statt aus eigenen Polizei- und Bandenzahlen, und
  ein Schlagstock hat `way: "swing"` - also kein Geschoss, sondern ein Treffer
  aus der Nähe, und der Mann bleibt entsprechend näher stehen. Eine Zeile in der
  Tabelle ändert damit das Verhalten von drei Sorten Gegner.
- **Der Turm des Panzers ist ein Bild für sich.** Alles andere in dieser Stadt
  zeigt dorthin, wo es fährt, weshalb ein Bild je Fahrzeug reichte; ein Turm
  tut das nicht. Er hat einen eigenen Winkel im Zustand (`Car.turret`), folgt der
  Maus und wird als gedrehtes Sprite auf die Wanne gelegt. Die Granate startet
  in seiner Richtung - und hört dort auf, wo das Fadenkreuz liegt.
- **Wer fällt, bleibt liegen.** Vorher stand ein Niedergeschlagener nach sechs
  Sekunden wieder auf, was jede Schießerei zu einem Nickerchen machte. Jetzt
  zählt `goneAt` herunter, bis die Leiche vom Pflaster genommen wird - ein Durchgang über beide Listen in `clearBodies`, dieselbe Uhr für Passanten und
  Polizisten, denn sie sterben gleich und werden gleich weggeräumt.
- **Die Besatzung steht im Wagen, nicht im Nichts.** `Car.crew` sagt, wie viele
  Polizisten an Bord sind: zwei frisch, keiner solange sie draußen stehen, wieder
  zwei nach dem Einsteigen. Daran hängen drei Dinge auf einmal - ob der Wagen
  überhaupt fährt (ohne Fahrer nicht), ob noch jemand aussteigen kann, und ob er
  als Streife zählt. Eine auf dem Gehweg erschossene Besatzung macht den Wagen
  damit zur Kulisse, und weil er nicht mehr zählt, schickt die Zentrale den
  nächsten - genau das, was vorher fehlte.
- **Zu Fuß laufen sie, im Auto fahren sie.** Welche der beiden Aufgaben ein
  Polizist hat, hängt allein davon ab, wo der Spieler ist. Auf dem Gehweg wird zu
  Fuß verfolgt; sitzt der Spieler am Steuer, sind Männer auf der Straße nutzlos,
  also drehen sie um, gehen zu ihrem Wagen und steigen ein. Das Einsteigen
  braucht `BOARD_SECONDS` an der Tür - wäre es sofort, wäre Aussteigen für die
  Polizei folgenlos und für den Spieler wertlos.
- **Angst hat die Person, nicht der Spieler.** Vorher galt: nah am Spieler und
  der hat einen Stern, also rennen. Das ließ eine halbe Stadt davonlaufen, die
  nichts gesehen hatte - man ging mit einem alten Stern eine Straße entlang und
  alles stob auseinander. Jetzt setzt der **Knall** eine Uhr (`scaredAt`) bei
  jedem, der in Hörweite war; sechs Sekunden läuft der, dann beruhigt er sich.
  Wer nicht dabei war, erfährt nie davon und geht weiter einkaufen.

  Reichweiten nach Lautstärke: Faustschlag 120, Schuss 300 (ungefähr ein
  Bildschirm - weiter wäre Weglaufen vor etwas Unsichtbarem, also genau der
  Fehler von vorher), Explosion 520. Gesetzt wird sie an jeder Stelle, an der
  eine Kugel entsteht: Spieler, Panzerrohr, Bande, Polizei - und beim Knall
  selbst. Wer im Schneidersitz an der Wand sitzt, steht dafür auf.

- **Manche gehören an einen Ort.** Beide Banden, die Nachtschwärmerinnen und
  die Penner haben ein `home` im Zustand - eine Ecke, eine Clubtür, eine
  Ladentür - und kehren dorthin zurück, wenn sie zu weit abdriften. Damit hat
  die Stadt Orte statt nur Straßen: Vor dem Nachtclub steht immer jemand, und
  die Karte zeigt mit einem Cocktailglas, wo das ist.
- **Die Spitze der Fahndung ist nicht zu erlaufen.** Alles, was durch
  `trouble` geht - Passanten, Autos, Banden - deckelt bei `CIVIL_STARS`. Nur
  was direkt über `wanted` läuft, also Angriffe auf die Polizei, hebt darüber
  hinaus. Ein Höchststand, in den man beim Herumfahren hineingerät, ist kein
  Höchststand.
- **Getroffen wird der Hubschrauber dort, wo er zu sehen ist.** Er wird seine
  eigene Höhe über dem Punkt gemalt, über dem er schwebt - das Fadenkreuz, das
  man auf ihn legt, landet also `HELI_LOOK` Pixel nördlich davon, und der Schuss
  ging vorher darunter durch. Auf das zu zielen, was man sieht, ist die einzige
  Regel, die ein Spieler von selbst errät; also wird der Treffer dort geprüft.
  Dafür wohnt `DEPTH` jetzt bei den Regeln und nicht mehr im Zeichner: Wo etwas
  Fliegendes **erscheint**, ist Rechnen, nicht Malen.
- **Ein Blick statt einer Route.** Wer zu Fuß oder im Wagen jemandem nachsetzt,
  probiert die gerade Linie, dann dieselbe Linie ein Stück nach links gedreht,
  dann nach rechts, und so weiter bis zum rechten Winkel; die erste, die auf
  Sichtweite frei ist, wird genommen. Das reicht in dieser Stadt, weil die Stadt
  ein Raster ist: Was im Weg steht, ist ein Block, und an dessen Wand entlang
  kommt man um die Ecke. Die Seiten werden **immer links zuerst** probiert - wer
  sich jedes Bild neu für die nähere Seite entscheidet, steht vor der Wand und
  zappelt.
- **Umgestoßen ist nicht tot.** Zwei Enden aus einer Uhr: Wer `down` ist, wurde
  getötet und wird weggeräumt; wer `floored` ist, wurde umgerannt und steht
  wieder auf. Welches von beiden, sagt die Stimmung - so bleibt es ein Feld.
- **Der Hubschrauber ist keine Zeile im Verkehr.** Er fliegt: keine Wand hält
  ihn, keine Straße trägt ihn, und gezeichnet wird er weit über allem anderen.
  Genau deshalb ist er ein eigener Typ im Zustand und keine weitere Karosserie.
  Seine Höhe wird mit dem Zoom multipliziert - bei sechsfacher Vergrößerung
  wäre ein großer Wert längst oben aus dem Bild, während der Schatten noch
  mitten drin liegt.
- **Abgeschossen wird er nicht gelöscht, er stürzt.** `Heli.fallAt` merkt sich,
  wann das Leben aufgebraucht war; von da an fliegt `fallHeli()` ihn weiter
  geradeaus, lässt den Rotor über `HELI_FALL` auslaufen und zündet erst beim
  Aufschlag `blast()` an der Stelle, wo er dann ist - nicht dort, wo er
  getroffen wurde. Der Renderer liest dieselbe eine Zahl: Sie senkt die Höhe,
  legt die Maschine schräg (`FALL_SLEW`), setzt die Rauchfahne und die Flamme.
  Ein Zustand, zwei Leser - und deshalb passen Bild und Explosion zusammen.
- **Tiere sind jetzt zwei Sprites wie die Leute.** Rücken samt Pfoten und
  Schwanz unten, Kopf mit Ohren und Schnauze darüber - dieser Abstand ist es,
  der eine Katze auf der Straße stehen lässt, statt sie wie einen Teppich
  daraufzudrucken.
- **Das Garagentor antwortet auf den Spieler.** Zu, solange niemand kommt; auf,
  wenn der Spieler näher als zwei Wagenlängen ist; und während der Arbeit im
  Inneren wieder zu. Das steht nicht im Zustand, sondern wird im Zeichner aus
  dem Abstand gerechnet - ein Tor, das sich nur öffnet und schließt, hat keine
  Geschichte, die zwei Bilder desselben Zustands auseinanderbringen könnte.
- **Penner gehören vor den Supermarkt.** Fünf je Laden, die meisten im
  Schneidersitz an der Ladenwand, der Rest schlurfend um die Tür. Die
  Sitzenden werden gleich auf die Türlinie gesetzt, damit die gesuchte Wand die
  Ladenfront ist und nicht das Haus gegenüber. Dafür trägt die Straßenmischung nur noch
  halb so viele von ihnen: Gruppen an wenigen Stellen sagen mehr über eine Stadt
  als überall einer. Dieselbe Mechanik wie bei Banden und Clubtür - der Ort
  kommt aus `doorsOf("market")`, also aus derselben Tabelle, aus der das Bild
  das Dach malt.
- **Wo welches Haus steht, weiß jetzt die Tabelle**, nicht der Renderer:
  `buildingAt(blockX, blockY)` in `engine/buildings.ts`. Der Motor braucht es,
  um jemanden vor die richtige Tür zu stellen, das Bild, um Dach und Schild zu
  malen - und beide dürfen sich über keine Ecke uneinig sein.
- **Banden halten Ecken.** Sie werden nicht mehr aus derselben Tüte gezogen wie
  alle anderen - das setzte auf jeden zweiten Gehweg zwei bewaffnete Männer, und
  das ist keine Bande, sondern eine Uniform. Jede Seite hat drei Ecken mit je
  vier Mann, jeder kennt seine Ecke (`home`), und wer abdriftet, geht zurück.
  Das ist der einzige Grund, aus dem in dieser Stadt überhaupt jemand zielgerichtet
  läuft.
- **Banden fangen nichts an.** Beide Seiten laufen friedlich herum, bis der
  Spieler auf eine von ihnen schießt; dann - und erst dann - ist diese Seite im
  Krieg, und die andere zieht mit. Das steht als `feud` im Zustand und nicht in
  den Köpfen der Einzelnen, weil es eine Sache zwischen Gruppen ist. Im
  Krankenhaus wird es zurückgesetzt.
- **Schaden am Spieler geht durch eine Tür.** `hurt()` zieht erst von der
  Rüstung ab, dann vom Leben, merkt sich den Zeitpunkt für die Regeneration und
  prüft den Cheat. Ein Dutzend Stellen können wehtun; eine Stelle entscheidet,
  was das heißt.
- **Was auf den Spieler zielt, ist mit `FOE_DAMAGE` gedämpft.** Polizei,
  Hubschrauber und Banden geben nur diesen Anteil des Tabellenwerts weiter, und
  nur gegen den Spieler. Die Waffentabelle sagt, was eine Waffe kann; dieser
  eine Faktor sagt, wie hart die Stadt ist. Voller Polizeischuss machte aus
  sechs Sternen eine Sache von Sekunden, und das ließ sich nicht an der Waffe
  regeln, ohne dieselbe Waffe in der eigenen Hand mitzuschwächen.
- **Blech zahlt nur, was man auch sieht.** Auto gegen Auto kostet nichts mehr -
  beide bleiben stehen, einer prallt zurück, fertig. Was Blech kostet, sind
  Hauswände (in `drive`) und Beschuss. Und `damageCar()` sieht gleich am Anfang
  nach, ob das der Wagen des Cheats ist: Unsterblichkeit, die am Blech endet,
  ist keine.
- **Kein Nachschub ins Leere.** Bevor eine Streife geschickt wird, zählt
  `onDuty` zusammen, was schon da ist - fahrtüchtige Streifenwagen mit
  Besatzung **plus** die Männer zu Fuß, je `COPS_PER_CAR` als eine Streife
  gerechnet. Ohne den zweiten Summanden schickte das Spiel für jeden
  ausgestiegenen Trupp einen neuen Wagen und die Straße füllte sich endlos.
- **Ein genommener Streifenwagen bleibt einer.** `enter()` setzt nur noch
  `driven` und leert die Besatzung; die Sorte bleibt `police`. Was ihn davon
  abhält, sich wie die Polizei zu benehmen, ist die leere Besatzung, nicht eine
  neue Lackierung. Damit er nicht als sein eigener Zeuge dasteht, fragt
  `onWatch()` überall dort, wo eine Streife etwas sehen oder tun soll: kein
  Wrack, kein gefahrener Wagen, nicht der eigene.

## Die Verhaftung ist eine Uhr, kein Abstand

Zuerst nahm dich ein Polizist mit, sobald du ihm zu nahe kamst. Für den Spieler
war das nicht von Willkür zu unterscheiden: Man stand an einer Ecke und war weg.

Jetzt hat die Zelle drei Bedingungen, die gleichzeitig gelten müssen -
gesucht, **stillstehend**, und die Polizei direkt daneben. Erst dann läuft eine
Uhr von drei Sekunden, und das Log sagt es an: „Sie haben dich eingekesselt."
Anfahren, abschütteln, oder losrennen setzt sie zurück.

Was „stillstehend" heißt, hängt davon ab, wo man ist, und das ist die einzige
Fallunterscheidung: im Auto ein Tempo unter `BUST_CRAWL`, zu Fuß ein Blick auf
`Player.movedAt` - den Zeitpunkt der letzten Eingabe, die einen bewegt hat.
Steht man `BUST_STILL` lang eingekesselt herum, ist man verhaftet. Damit ist
auch zu Fuß eine Festnahme möglich, ohne dass sie je aus dem Nichts kommt: Wer
sich bewegt, wird nicht verhaftet, und `state.player.god` schließt es ohnehin
aus - unsterblich heißt auch, nicht abgeführt zu werden.

Wo man danach steht, entscheidet `respawn()` über `nearest()`: nach dem Tod die
nächste Tür von `doorsOf("hospital")`, nach der Haft die von `doorsOf("prison")`.
Die Stadt steht fest, also gibt es diese Türen ohne Suche - man wacht dort auf,
wo man herausgekommen wäre.

## Das Gefängnis ist ein Geviert, kein Kasten

In der Stadt war es ein Haus wie jedes andere mit GEFÄNGNIS über der Tür - ein
Gefängnis in demselben Sinn, in dem eine Hütte mit BANK darauf eine Bank ist.
Was ein Gefängnis von oben ausmacht, ist seine **Form**:

- **Ein Zellentrakt einmal ringsherum**, zwei Felder dick, an jeder Ecke
  geschlossen. Kein Tor, keine Lücke, nichts, wodurch man sehen könnte.
- **Auf jeder der vier Ecken ein Wachturm**: ein Schaft, darauf eine verglaste
  Kanzel, und darin ein Wächter in Uniform, der über die Mauer schaut. Die
  Kanzel ist dabei so **hoch**, wie sie breit sein dürfte: Breiter geht nicht,
  sie muss im Eckfeld des Trakts bleiben - also bekommt sie Höhe, und Höhe ist
  ohnehin das meiste, was man von ihr sieht, denn das Glas ist ein Band über
  der Turmfront. Beide
  Kästen stehen **auf** dem Eckfeld des Trakts und nicht darüber hinaus -
  vorher waren sie vom Eckpunkt aus aufgespannt, also stand je die Hälfte
  außerhalb des Gefängnisses und die Kanzel noch weiter: vier Türmchen, außen
  an die Mauer geschraubt.
- **Vorn ein Torbogen mit zwei Stahlflügeln**, zu. Jedes Gefängnis hat die eine
  Stelle, an der ein Wagen hineinfährt, und sie ist genau das, was eine blanke
  Wand aus Zellenfenstern nicht sagt. Der Ring bleibt trotzdem dicht - die Tore
  sind geschlossen, und der Boden darunter sagt dasselbe.
- **In jedem Turm ein Scheinwerfer**, der den Hof abstreicht - jeder auf seinem
  eigenen Bogen, außer Takt mit den anderen, was das Ganze von der Straße aus
  bemannt aussehen lässt.
- **Und um das Ganze ein Zaun mit Stacheldraht**, der **flach liegt**: Ein
  aufrecht gezeichneter Zaun war der Versuch, ihn wie jedes andere stehende
  Ding zu behandeln, und er ist daran gescheitert, dass diese Projektion die
  Tiefe staucht und die Breite in Ruhe lässt. Ein Lauf, der von der Kamera
  weggeht, hat gar kein Gesicht zu zeigen - die Hälfte jedes stehenden Zauns
  kam als nackter Strich heraus, und die beiden Hälften sahen nie nach
  demselben Zaun aus. Ein Zaun ist das eine aufrechte Ding hier, das sich als
  Grundriss besser liest als als Wand.
  Offen bleiben die **Ecken** trotzdem nicht: Welche Richtung ein Feld hat,
  entschied früher eine einzige Frage (linke oder rechte Spalte?), also kamen
  die Eckfelder als reine Längsläufe heraus und der Querlauf hörte an jedem
  Ende ein Feld zu früh auf. Beide Fragen werden jetzt getrennt gestellt, und
  ein Eckfeld zeichnet **beide** Läufe - jeden aber nur von der Mitte des
  Feldes aus nach außen, in die Richtung, in die er weitergeht. So treffen sie
  sich am Eckpfosten zu einem sauberen **L**, und keiner wird über den anderen
  gemalt. Dazu ein Einlass, ein Feld vor dem Gebäude, mit einer **Schranke**
  genau vor dem Tor. Beide nehmen ihre Stelle aus
  `prisonGate`: ein Tor, an das man heranfährt, und dahinter eine Mauer wäre
  ein Witz auf Kosten des Fahrers. Der
  Streifen dazwischen ist der freigehaltene Boden, den jedes Gefängnis hat, und
  er ist das, was den Zaun als Zaun lesbar macht statt als Muster am Fuß der
  Mauer. Bezahlt wird er aus dem **Gebäude**, nicht aus dem Hof: Der Grundriss
  ist, was das Straßenraster übrig lässt, und keinen Meter mehr - ein halb so
  tiefer Trakt liest sich immer noch als Trakt, weil man von ihm die Höhe
  seiner Wand sieht, ein zwei Felder kleinerer Hof dagegen hat keinen Platz
  mehr für ein Spielfeld. Der Boden unter dem Draht ist geharkter Kies; der
  Sand, auf dem der Zaun des Militärgeländes steht, wäre mitten in der Stadt
  ein Strand.
- **In der Mitte der Hof**: Wiese, ein Basketballfeld mit Mittelkreis, Zonen
  und Körben, unter den Körben die ausgetretene Erde, die Werkstatt oben links
  mit ihrem Schild und ihrem rauchenden Schornstein, und je zwei Sitzbänke
  links und rechts des Feldes.
- **Und Männer darin**, die ihre Runden gehen. Zwei sitzen auf den Bänken, weil
  in jedem Hof jemand sitzt.

### Vier Blöcke, nicht einer

Es steht auf **vier** Stadtblöcken: dreizehn Felder mal dreizehn statt der fünf
mal fünf, die ein einzelner Block hergibt. Das ist keine Willkür, sondern die
nächste Größe, die das Raster überhaupt anbietet - alles dazwischen ist Straße.
Und nötig ist sie: In einen Hof von fünf mal fünf Feldern passt kein
Basketballfeld, und ohne Hof ist der Ring nur ein Kasten mit einem Loch.

Die Straßenkreuzung, die vorher zwischen den vier Blöcken lag, verschluckt der
Hof; deshalb fragt `inTown` **zuerst** nach dem Gefängnis und erst danach nach
den Straßen. Die Straßen **rings außen** bleiben, weil der Grundriss an ihnen
aufhört: Das Gefängnis schließt eine Kreuzung, nicht vier Straßen.

Drei Dinge mussten dafür mitziehen, und jedes davon war sonst ein sichtbarer
Fehler gewesen:

- **Eine Autobahn darf nicht an einer Gefängnismauer enden.** Wo der Grundriss
  eine überdecken würde, baut der Plan stattdessen ein Wohnhaus - dasselbe, was
  er mit einer zweiten Bank macht. Von den drei Gefängnissen, die der Plan
  zeichnet, liegen zwei quer über einer Autobahn und werden zu Häusern. Eines
  ist für ein Wahrzeichen ohnehin die richtige Zahl: Es ist das Gebäude, aus
  dem man entlassen wird, und immer am selben Tor entlassen zu werden ist
  besser als am jeweils nächsten von dreien.
- **Die drei verschluckten Blöcke bekommen keine Tür.** Sie behalten, was der
  Plan dort gezeichnet hat - ein Haus, einen Club, einen Waffenladen -, und
  nichts davon ist noch ein Gebäude: Der Boden darunter ist Gefängnis. Eine Tür
  wäre ein Laden gewesen, den niemand betreten kann - und in dieser Stadt war
  es genau einmal die eigene **Garage** des Spielers, als Loch durch die
  Gefängnismauer geschnitten.
- **Das Dach hat eine Höhe, nicht vier.** `roofAt` fragt für jedes Feld des
  Gefängnisses den Ankerblock, nicht den Block, auf dem das Feld liegt - sonst
  stünde, wer auf der anderen Seite des Rings landet, ein paar Pixel im Dach
  oder darüber.

Dazu ist es über den eigenen Gehweg mitgebaut, die Mauer geht bis an den
Bordstein; das **Tor** liegt deshalb auf der Straße südlich des ganzen
Grundrisses statt auf dem Gehweg eines Blocks, und die **Baracke** wird auf
dasselbe Feld gezeichnet, das der Boden massiv macht - `prisonHut` ist die eine
Stelle, die das entscheidet, und Bild und Boden fragen beide dort.

**Und die Garagen kommen beim Laden aus dem Plan statt aus der Datei.** Sie
sind eine Formel über eine Stadt, die selbst eine Formel ist - ein Haus je
Insel, das der Inselmitte nächste -, also kann ein Spielstand, der vor einer
Planänderung geschrieben wurde, einfach die heutige Antwort bekommen. Und er
muss: Als das Gefängnis auf vier Blöcke wuchs, lag das Haus, in das eine der
Garagen geschnitten war, **darin** - das Garagentor des Spielers ging durch die
Gefängnismauer. Verloren geht dabei nichts, denn im Spiel verschiebt niemand
je eine Garage.

### Was ein Gefängnis verdecken kann, ist seine Vorderfront

Jedes Haus der Stadt wird durchsichtig, sobald jemand dahinter steht - sonst
verschwände man hinter der eigenen Häuserzeile. Gefragt wird das an einem
Rechteck, und für ein gewöhnliches Haus ist das ganze Grundstück die richtige
Antwort: Es ist von vorn bis hinten massiv.

Ein Gefängnis ist das nicht - es ist eine Mauer um ein Loch. Das Rechteck über
den ganzen Grundriss verschluckte deshalb auch den Hof, und wer mitten im Hof
stand, im Freien, mit nichts vor sich, machte das ganze Gefängnis durchsichtig.
Der Kasten hört jetzt am **hinteren Rand des vorderen Trakts** auf: Er deckt
genau den ab, den diese Mauer verbirgt, und niemanden dahinter im Hof.

### Ein Hof ist eine Wiese, in die ein Feld getreten ist

Beton hat keine Geschichte: Jeder Quadratmeter davon sieht gleich aus, ob
tausend Mann dort gelaufen sind oder keiner. Der Hof ist deshalb **Wiese** -
auch im Boden, nicht nur im Bild: `prisonCell` gibt dort `park` zurück, also
dasselbe, was jede Grünfläche der Stadt ist.

Und was die Männer damit gemacht haben, sieht man. **Unter jedem Korb** - wo
den ganzen Tag jeder steht, sich dreht und landet - ist das Gras weg und die
nackte Erde durch, und sie läuft zum Grün hin aus, statt an einer Kante
aufzuhören: Ein Radialverlauf mit einem harten Kern und einem transparenten
Rand, weil ausgetretener Boden genau so aussieht. Die Linien des Feldes sind
direkt darauf gemalt - es gibt keine Asphaltplatte mehr, denn eine Platte wäre
wieder eine Fläche ohne Geschichte.

### Fenster mit Gittern, keine Kratzer

Die Trakte hatten drei Pixel breite Schlitze mit je einem Strich darin, und in
dieser Größe liest sich eine Reihe davon als aufgemalter Zaun. Jedes Fenster
ist jetzt eine **Laibung in der Mauer, das Dunkel der Zelle dahinter und ein
Gitter darüber** - drei Stäbe hochkant, ein Riegel quer. Das ist das eine
Ding an einer Hausfront, das Gefängnis sagt und sonst nichts.

### Das Feld steht hochkant

Ein Basketballfeld ist fast doppelt so lang wie breit, und die lange Seite ist
die, auf der gespielt wird: von Korb zu Korb. Quer gelegt - breit und flach -
liest es sich als Tennisplatz ohne Netz. Es steht deshalb der Länge nach mitten
im Hof, und damit es dort Platz hat, ist die **Werkstatt in die obere linke
Ecke** gerückt: In der Mitte stand sie mitten im Feld, die Männer liefen ihre
Runden durch sie hindurch, und für Bänke war kein Platz mehr.

Das Feld sitzt dabei ein Stück **rechts der Mitte** (`COURT_OVER`): Links oben
steht die Werkstatt, der Boden dort ist also vergeben, der rechts nicht - genau
mittig stand das Feld mit der Seitenlinie eine Schrittlänge vor der Werkstatt
und einer leeren halben Hofbreite daneben.

Die **Bänke stehen je zwei links und rechts des Feldes und hochkant**, also
entlang der Seitenlinie: Wer auf einer quer liegenden Bank sitzt, sitzt mit der
Schulter zum Spiel. Die Latten drehen sich mit, denn Latten laufen der Länge
einer Bank nach.

### Die Werkstatt steht frei, und sie arbeitet

Sie ist doppelt so groß (zwei Felder im Geviert) und steht ein Feld von den
Trakten ab, sodass man um sie herumgehen kann - das ist der Unterschied
zwischen einem Gebäude im Hof und einer Beule an der Mauer. Ihr Name steht auf
einem **Schild an der Wand** statt frei schwebend über dem Dach: Was ein Werk
hat, ist ein Brett an der Front, und in dieser Größe ist das Brett das, was man
zuerst liest - ein helles Rechteck auf dunkler Wand mit dem Namen quer darüber.

Sie hat dazu eine **Tür und zwei Fenster** - was ein Gebäude von einem Klotz
mit einem Namen darauf unterscheidet - und das Schild sitzt oben unter der
Traufe statt auf halber Wand, wo die Tür hingehört.

Daneben, auf der hinteren Dachecke, ein **Schornstein, der raucht**: fünf
Wolken aus der Uhr, jede höher, breiter und blasser als die darunter. Ein
Schornstein, der auf der Wiese stünde, wäre ein Rohr; einer auf dem Dach ist
ein Betrieb.

### Sechs Wärter halten den Hof, und sonst nichts

Der Ring hat keinen Durchgang, der einzige Weg hinein ist über die Mauer - und
ein Ort, in den man sich fallen lassen, in dem man herumlaufen und aus dem man
wieder herausspazieren kann, ist ein Park mit einem Zaun drum.

Geantwortet haben darauf erst die vier **Türme**: Sobald der Spieler irgendwo im
Grundriss war, fanden ihn die Scheinwerfer, und `PRISON_AIM` später kam alle
`PRISON_RATE` eine Kugel aus jeder Ecke. Das hat funktioniert und war trotzdem
falsch, und zwar auf die Art, die man erst merkt, wenn jemand es spielt: **Da
war niemand.** Die Schüsse kamen aus vier Gebäudeecken, in denen nichts stand,
was gezeichnet war, und nichts, was man hätte treffen können. Im Hof zu stehen
hieß, in einem Raum zu stehen, der einem Leben abzieht. Das ist keine Wache, das
ist eine Falle - und der Unterschied ist genau der, dass eine Falle keine
Antwort hat und eine Wache sechs.

Jetzt stehen sechs Mann auf der Wiese (`warderPosts`): vier am Fuß der vier
Türme, zwei in der Mitte des Hofes. Es sind gewöhnliche Polizisten aus
`state.cops` mit einem Posten, dieselbe Sorte wie die zehn auf dem
Militärgelände - sie schießen, sie sind zu treffen, und wenn sie fallen, bleiben
sie liegen.

**Und die Kanzeln sind leer.** In jedem Turm war eine Figur gemalt, und genau
die war das Problem: Sie sah aus wie der, der schießt, und zurückschießen konnte
man auf sie nicht. Ein Mann im Turm steht auf einem Feld Gebäude, und eine Wand
hält jede Kugel auf, die auf den dahinter abgefeuert wird - gemessen: Zwölf
Sekunden Maschinengewehr aus zehn Metern haben ihm nichts getan.

Der Ausweg, ihn in der Kanzel zu _zeichnen_ und seinen Trefferpunkt unten auf
der Wiese zu lassen, repariert das Schießen und zerlegt dafür das Bild: Gezielt
wird hier flach, auf einen Punkt am Boden, und jedes erhöhte Ding wird über
seinem Standpunkt gezeichnet - der Mann schwebte also anderthalb Felder neben
seinem eigenen Turm über der Wiese. Also stehen alle sechs unten, wo man sie
sieht und trifft. Dass ein Turm besetzt ist, sagt sein Scheinwerfer, und der
geht mit dem letzten von ihnen aus.

Drei Dinge mussten dafür geradegezogen werden:

- **Ein Wärter ist ein Wachmann, dessen Posten auf Gefängnisboden steht.** Kein
  neues Feld, keine Migration, keine zweite Wahrheit: `warder(cop)` fragt den
  Plan, was unter `cop.guards` liegt. Ein Spielstand von vorgestern beantwortet
  dieselbe Frage von selbst richtig.
- **Er schießt nur auf den, der in seinem Hof steht.** Alle anderen hier
  schießen auf alles, was in die Reichweite ihrer Waffe kommt - für einen Mann
  in einem Gefängnishof hieße das, über die eigene Mauer hinweg den Gehsteig
  draußen zu beharken. Er wartet stattdessen auf die Scheinwerfer: erst müssen
  die ihn haben, dann vergeht dieselbe `PRISON_AIM`-Pause wie vorher.
- **Und er verlässt seinen Hof nie.** Ein Wachmann auf dem Militärgelände lässt
  sich von jemandem mit Sternen vom Fleck locken, was für ein Gelände richtig
  ist, in das man hineinfährt. Ein Gefängnishof hat keinen Ein- und keinen
  Ausgang, also wäre ein Wärter, der losliefe, ein Wärter, der in sein eigenes
  Gebäude läuft und den Rest des Spiels darin steht.
- **Er sieht auch nur den an, den er beschießen würde.** `GUARD_REACH` sind
  fünfzehnhundert Pixel - dreißig Felder, und das reicht von der Mitte eines
  Gefängnishofs weit in die Straßen ringsum. Draußen vorbeizugehen drehte
  deshalb alle sechs Mann auf der Wiese mit, durch die eigene Mauer hindurch.
  Geguckt wird jetzt nach derselben Prüfung, nach der auch geschossen wird:
  wenn die Scheinwerfer jemanden haben. Gemessen: draußen vorbei sehen null von
  sechs her, im Hof alle sechs.
- **Und wenn niemand da ist, schaut er seine eigene Richtung.** Ein Mann auf
  seinem Fleck ist angekommen, also gäbe die Richtung, in die seine Füße
  wollen, `atan2(0, 0)` - also Osten, für alle sechs, in einer Reihe. Jeder
  nimmt stattdessen seine eigene Peilung aus `post`, und die sechs stehen da
  und schauen in sechs Richtungen.

**Und sie sind mit dem Gefängnis gezeichnet, nicht mit dem Verkehr.** Alles, was
sich bewegt, wird nach Bildschirmtiefe sortiert gemalt, und ein ganzes Gefängnis
zählt dabei als _ein_ Ding, das an der Vorderkante seines Blocks steht - wer im
Hof steht, wird also zuerst gemalt und danach von dem Gebäude übermalt, in
dessen Mitte er steht. Genau deshalb zeichnet `drawPrison` die Häftlinge selbst,
und die Wärter gehen denselben Weg. Sechs blaue Hemden, die auf der Wiese
standen und die man nicht sah, waren der erste Versuch.

**Eine Wache braucht einen Grund, und der Grund ist ein Stern.** Wer hier
schießt, prüft nur eines: ob jemand in Reichweite seiner Waffe steht. Für einen
Streifenpolizisten stimmt das - der ist überhaupt nur da, weil jemand ihn
gerufen hat. Für eine Wache stimmt es nicht: Die steht einfach da, wo sie
arbeitet. Ohne diese Bedingung haben die vier Mann vor jeder Polizeiwache auf
jeden geschossen, der auf dem Gehsteig vorbeilief - eine Polizeiwache, an der
man nicht vorbeigehen kann. Die zwei Orte, an denen das bloße Dasein die
Straftat ist, verteilen dafür Sterne, also deckt dieselbe Prüfung sie mit ab.

**Und im Hof gesehen zu werden kostet zwei Sterne.** Niemand ist versehentlich
in einem Gefängnishof; man kommt über die Mauer. Die Sterne sind zugleich das,
was den Wärtern das Schießen erlaubt - Alarm und Fahndungsstufe sind dasselbe
Ereignis, genau wie auf dem Militärgelände.

**Ein Fehler, der dabei aufgefallen ist und alle Wachen betraf:** Am Ende von
`moveCops` steigt, sobald die Fahndung vorbei ist, jeder wieder in sein Auto -
und `putAboard` nimmt jeden vom Pflaster, den man ihm gibt, mit Auto oder ohne.
Übergeben wurde ihm _jeder lebende Polizist_. Im ersten Frame jedes Spiels, bei
null Sternen, verschwanden damit die zehn Wachen des Militärgeländes und alles
andere mit `carId: -1` lautlos in Fahrzeugen, die es nicht gibt. Das Gelände war
unbewacht, seit es Wachen hat. Übergeben wird jetzt nur, wer ein Auto hat - und
das sagt `guards` bereits.

### Sind alle sechs unten, steht das Tor offen

Was vierhundert Männer in einem Hof hält, sind die sechs, die zusehen. Sind die
sechs weg, hält nichts mehr die Tür.

`GameState.jailbreak` ist die Uhrzeit, zu der der letzte gefallen ist - die eine
Sache an diesem Gebäude, die Geschichte ist und nicht Wetter, und deshalb die
eine, die aufgeschrieben wird. Drei Dinge passieren im selben Atemzug, und das
müssen sie auch:

- **Der Boden** bekommt einen ein Feld breiten Gang von der Straße durch das Tor
  in den Hof (`openGaol`): das Torfeld im Zaun und die Durchfahrt im Trakt.
- **Das Bild** klappt die beiden Torflügel an die Laibung, stellt die Schranke
  auf und lässt die Scheinwerfer aus - ein abgesuchter Hof über einem Hof
  voller Leichen wäre ein Gebäude, das etwas anderes behauptet als sein eigener
  Boden.
- **Die Häftlinge gehen.** Die Uhr ihres Rundgangs bleibt im Moment des
  Ausbruchs stehen, und von da an misst sich alles an derselben Zahl: quer über
  den Hof zum Tor, dann geradeaus die Straße hinunter, einer nach dem anderen
  mit `OUT_WAIT` Abstand. Vierhundert Mann gleichzeitig durch eine Tür sind ein
  Fleck; eine Schlange ist das, was ein Gefängnis beim Leerlaufen tatsächlich
  ist. Nach `OUT_GONE` Pixeln wird keiner mehr gezeichnet - das Bild geht
  niemandem nach Hause nach.

**Und bei null Sternen ist alles wieder wie vorher.** Ein leergeräumtes
Gefängnis bleibt nur so lange leer, wie jemand den sucht, der es leergeräumt
hat: Sobald die Fahndung durch ist, gehen die Tore zu, die Wärter stehen wieder
auf ihren Posten und die Männer laufen wieder im Hof.

Das ist kein Rückgängigmachen - es wird nichts gemerkt und nichts aus einer
Kopie zurückgespielt. Der Boden fragt den **Plan**, was auf die beiden
Torfelder gehört, und die Wärter werden schlicht neu gemacht, mit demselben
Aufruf wie beim Spielstart. Die Häftlinge brauchen gar nichts: Sie kommen aus
der Uhr, und mit `jailbreak` wieder auf null laufen sie im nächsten Bild ihre
Runden.

Dasselbe musste auch nach einer abgesessenen Strafe passieren, und zwar aus
einem Grund, den man erst beim Hinausgehen sieht: `onStreet` räumt **jeden**
Polizisten aus dem Spiel - die sechs im Hof eingeschlossen. Wer seine Zeit
abgesessen hatte, stand also vor einem Gefängnis, das in dem Moment niemand
mehr hielt und dessen Tor hinter ihm aufging.

Zwei Dinge, die nicht offensichtlich sind:

- **Die Leichen der Wärter bleiben liegen.** Alle anderen werden nach einer
  Weile abgeräumt, was für einen Gehsteig richtig ist. Diese sechs werden aber
  _gezählt_ statt angesehen - das Tor geht auf, wenn keiner mehr lebt -, also
  nähme das Abräumen die Zählung mit, und ein Gefängnis, dessen Wärter man
  lediglich weggeputzt hätte, öffnete sein eigenes Tor.
- **Ein alter Spielstand bekommt seine Wärter nachgereicht.** Ein Stand, der
  geschrieben wurde, als noch niemand im Hof stand, hat keine - und ein
  Gefängnis, das niemand hält, geht beim ersten Schritt in den Hof von selbst
  auf. `rebuild` setzt sie nach, aber nur, wenn das Tor noch zu ist und in der
  Datei kein einziger von ihnen steht. Eine Leiche zählt: sie ist der Beleg
  dafür, dass es jemand getan hat.

### Der Hof ist Wetter, keine Geschichte

Die Häftlinge selbst rührt nichts an, solange das Tor zu ist, also muss keiner
von ihnen im Zustand stehen. Wo jeder gerade ist, kommt aus der Uhr und daraus, wo sein Gefängnis
steht, genauso wie die Farbe einer Ampel: eine eigene Ellipse je Mann, ein
eigenes Tempo, eine eigene Richtung. Das kostet nichts je Bild und erspart es,
ein Dutzend Personen je Gefängnis durch jeden Spielstand zu tragen - für einen
Hof, den man über eine Mauer hinweg ansieht.

Der einzige Weg hinein ist über die Mauer, also der Jetpack, und der einzige
Weg hinaus derselbe - bis jemand die sechs Wärter erledigt und das Tor
aufgeht. Ein Hof, den nichts erreicht, ist kein Versehen: er ist der eine Ort
der Stadt, zu dem man fliegen muss.

Die **Scheinwerfer** sitzen auf den Türmen (`prisonTowers`) und sind auf den
Hof geklemmt: Ein Lichtkegel ist ein Fleck auf dem Boden, und ein Fleck auf dem
Dach des Trakts, auf dem die Lampe montiert ist, ist eine Lampe, die jemand an
die Decke gehalten hat. Sie sind außerdem der Auslöser - erst wenn sie jemanden
haben, machen die Männer im Hof von ihren Waffen Gebrauch.

In den Kanzeln steht niemand: Was dort oben wäre, könnte man nicht treffen -
siehe den Abschnitt über die Wärter.

Gezeichnet wird **von Norden nach Süden** statt als ein Kasten, denn das Ding
hat ein Innen: erst der ferne Trakt mit seinen Türmen, dann der Hofboden, dann
was im Hof steht und wer darin geht, und zuletzt der nahe Trakt - die Mauer
zwischen Kamera und Hof verdeckt den Hof, wie eine Mauer das tut.

Zwei Zahlen an der Kanzel sind dabei Projektion und nicht Geschmack: Ihre
Wände beginnen erst oben am Schaft (`base`), sonst wäre der ganze Turm von
unten bis oben eine Glasscheibe; und der Wächter steht fast vorn in ihr
(`GUARD_AT`), weil jedes Feld weiter nördlich 0,82 Pixel weiter
**oben** auf dem Schirm liegt - mittig gestellt stünde er auf dem Dach seiner
eigenen Kanzel.

## Der Knast ist eine zweite Welt, keine Ecke der Stadt

Verhaftet zu werden endet nicht mehr in einem Knopf, sondern in einer Frage -
absitzen oder ausbrechen -, und der Ausbruch spielt in einem eigenen kleinen
Spiel: `engine/prison.ts` mit `components/prison-render.ts`.

**Warum daneben und nicht darin.** Im Gefängnis gibt es kein Auto, keine
Fahndung, kein Viertel und keine Waffe; in der Stadt gibt es keine Zellentür.
Hätte man den Knast in die Stadt gelegt, müsste jede Regel dort ab sofort
fragen, ob sie gerade drinnen oder draußen gilt. Stattdessen hält
`GameState.prison` einen eigenen Zustand, und `step()` schickt die Bilder
dorthin, solange die Phase `prison` ist. Die Stadt steht derweil **still** -
wer aus der Wand kommt, findet sie genau so vor, wie er sie verlassen hat.

**Was zwischen beiden Welten läuft, ist eine Antwort.** `advance()` kennt
`GameState` nicht und gibt einen `PrisonTurn` zurück: den Knast einen Schritt
weiter, die Zeilen für den Ticker und eines von drei Enden - `on`, `out`,
`back`. Die Stadt übersetzt das in `doTime()`, und beide Ausgänge landen in
derselben Funktion wie das Krankenhaus (`onStreet`). Deshalb gibt es die
Kaution auch nur an einer Stelle: **wer absitzt, zahlt** - beim Ausbruch wird
nichts abgebucht, und beim Verhaften selbst auch noch nicht, weil sonst die
Wahl schon vor der Wahl entschieden wäre.

**Der Grundriss ist ein Bild.** Der Knast steht als Buchstabengitter im Code -
`#` Mauer, `|` Gitter, `w` die eigene Kloschüssel, `X` die losen Steine, `~` der
Gang, `I` die Krankenstation, `=` das Kabel. Ein Plan, den man lesen kann,
während man ihn ändert, ist mehr wert als eine Liste von Rechtecken; und fest
ist er aus demselben Grund wie die Stadt: Ein Ausbruch ist ein auswendig
gelernter Weg, und ein Weg, der sich jedes Mal neu mischt, ist ein Labyrinth.

**Eine Leiter statt einer Handvoll Flaggen.** Wie weit der Ausbruch ist, steht
in genau einem Feld (`PrisonStage`), und die Reihenfolge in `LADDER`. Alles
andere fragt danach: welche Stelle der Ring zeigt (`markOf`), was die Leiste
sagt (`taskLine`), ob ein Quadrat noch zu ist (`solid` - die Steine öffnen sich
nach `stones`, das Fenster und das Kabel nach `window`, und die eigene
Kloschüssel wird begehbar, sobald sie ab ist, weil man in genau der Ecke kniet).

**Gesehen zu werden ist erst dann etwas.** `hunting()` beantwortet die eine
Frage, die drinnen zählt: Schraube dabei, gerade am Arbeiten, oder schon hinter
der Wand. Nur dann greift ein Wärterkegel zu - und derselbe Aufruf färbt den
Kegel im Bild rot. Ein Kegel, den man fürchten muss, und einer, durch den man
laufen darf, dürfen nicht gleich aussehen.

**Die Mitgefangenen laufen keinen eigenen Weg.** Sie folgen einer Spur von
Brotkrumen, die der Spieler alle `TRAIL_GAP` Pixel fallen lässt. Drei eigene
Wegfindungen durch ein Loch in einer Wand wären dieselbe Schlange, nur teurer
und gelegentlich falsch.

**Der Mann auf dem Turm ist die eine Ausnahme von der Mauer.** Jeder Wärter
hat seine eigene Sichtweite (`Warder.range`), und einer davon steht oben:
`Warder.high` heißt zweierlei, und beides ist, wofür ein Turm da ist - er sieht
**über** die Mauern statt an ihnen entlang (`sees()` überspringt für ihn die
Sichtlinie), und gezeichnet wird er um `TOWER_HEIGHT` angehoben auf seiner
Plattform. Sein Weg liegt neben dem Kabel, sodass die letzte Etappe kein Laufen
mehr ist, sondern Warten: Er schaut je zur Hälfte in die eine und die andere
Richtung, und hinüber ist man in gut zwei Sekunden.

**Höhe ist in diesem Bild eine Verschiebung nach oben, sonst nichts.** Deshalb
zieht sich das Hängen am Kabel und das Stehen auf dem Turm auf dasselbe Feld
zusammen (`PrisonFolk.lift`): ein `translate`, kein zweiter Zeichenweg. Und weil
es pro Person gilt statt nur für den Spieler, hängt die ganze Schlange am Kabel
und nicht nur ihr erster.

**Die Sträflingskluft ist ein Figurenstil, keine Farbe.** `figure-art` kennt
jetzt `convict` und malt die schwarzen Streifen quer über Rumpf und Beine; die
Farbe darunter bleibt weiß. Denselben Stil trägt der Spieler in der Stadt,
solange `Player.striped` gesetzt ist - das ist genau die Zeit zwischen dem
Sprung von der Mauer und dem letzten Stern. Ein Ausbrecher, den man an der
Kleidung erkennt, macht aus der Fahndung eine Erklärung statt einer Strafe.

**Draußen ist der Ausbruch nicht zu Ende.** `onTheRun()` setzt `ESCAPE_STARS`,
stellt die Uhr fürs Abkühlen neu (ohne das fiele die eben verdiente Fahndung im
ersten Bild wieder auseinander) und setzt fünf `convict`-Passanten neben den
Spieler, alle mit gesetztem `scaredAt` - in dieser Stadt ist Angst das, was
Rennen bedeutet. `convict` ist bewusst **nicht** in `IN_THE_STREET`: Ein
Ausbrecher ist keine Sorte Passant, die die Stadt austeilt, sondern das, was aus
einem Loch in einer Gefängnismauer kommt.

**Durchsichtig wird eine Wand auch für die Aufgabe.** Die Schüssel und das Loch
stehen an der Südwand des Blocks, und in dieser Schrägsicht deckt eine Wand
alles zu, was nördlich davor liegt. Deshalb prüft `hides()` nicht nur den
Spieler, sondern auch den Punkt, den der Ring zeigt - sonst spielte die Mitte
des Ausbruchs hinter einem grauen Balken.

## Daumen statt Maus, und ein Bild ohne Seite drumherum

Auf einem Telefon gibt es weder Tastatur noch Maus noch zweite Maustaste. Die
Antwort darauf ist dieselbe wie bei Panzerkiste - und zwar bewusst dieselbe,
weil zwei Spiele derselben Sammlung sich nicht unterschiedlich anfühlen sollen:

- **`components/touch-controls.ts`** hört zu und merkt sich, mehr nicht. Der
  linke Daumen setzt einen Stick dorthin, wo er landet, der rechte schaut und
  schießt, und drei runde Knöpfe unten rechts sind das, wofür am Rechner Maus
  und Tastatur da sind: **Auto** (ein- und aussteigen), **Waffe** (eine weiter)
  und **Zünder** (ablegen). Der Hook nimmt einmal je Bild eine Probe und faltet
  sie in denselben `Input`, den Tastatur und Maus erzeugen - die Simulation
  erfährt nie, womit gespielt wird.
- **Alles darin rechnet in Ansichtspixeln**, denselben, in denen der Renderer
  zeichnet. Ein Knopf liegt damit genau dort, wo er aussieht, egal wie fein der
  Bildschirm ist und wie groß die Leinwand gerade skaliert wird.
- **Der Stick ist eine Achse, die Simulation kennt vier Tasten.** Umgerechnet
  wird an genau einer Stelle im Hook, an `STICK_GATE`. Ein Daumen, der auf dem
  Stick liegt, soll nicht loslaufen; ein Telefon, das erst bei ganz
  durchgedrücktem Stick reagiert, fühlt sich träge an.
- **Finger werden nicht zweimal gezählt.** `onPointer` steigt bei
  `pointerType === "touch"` sofort aus, sonst würde jeder Tipper auf den Stick
  zusätzlich als Mausklick ankommen und die Faust schwingen.
- **Ein Klick kann zwischen zwei Bilder fallen.** Der Abzug ist ein gehaltener
  Zustand, aber ein Tipp von zehn Millisekunden wäre damit verloren. Deshalb
  merken sich Hook und Controller den Druck zusätzlich als Flanke und geben ihn
  genau ein Bild lang aus - ein Tipp, ein Schuss.
- **Vollbild** ist der gemeinsame `useFullscreen`-Hook aus `lib/screen` auf dem
  Rahmen um die Leinwand, plus `useShotRatio`, damit die CSS-Regel
  `.game-fullscreen:fullscreen` das Bild skalieren kann, ohne es zu verzerren.
  Der Rahmen enthält bewusst nur das Bild und die Overlays: Ticker und
  Tastenliste haben im Vollbild nichts verloren, und was der Spieler wirklich
  braucht - Geld, Leben, Waffe, Sterne, Karte, Auftragszeile - malt der
  Renderer ohnehin in die Ecken der Leinwand.

## Das Mausrad und die passive Zuhörer-Falle

Das Rad wechselt die Waffe - und darf dabei die Seite nicht wegscrollen.
`event.preventDefault()` in Reacts `onWheel` hilft nicht: React hängt seinen
Rad-Zuhörer **passiv** an die Wurzel, und ein passiver Zuhörer darf das Scrollen
nicht abbrechen. Deshalb hängt der Zuhörer hier von Hand an der Leinwand, mit
`{ passive: false }`, und wird beim Wechsel der Leinwand wieder abgehängt.

## Wie nah die Kamera steht

Die Stadt wird herangeholt - voreingestellt mit dem Faktor **drei**, und in den
Einstellungen von 1,5-fach bis 6-fach umstellbar. Lebensgroß war alles zu weit
weg, um es zu lesen: eine Figur achtzehn Pixel hoch, eine Straße zwei Finger
breit.

Bezahlt wird mit Übersicht, und deshalb ist es eine Einstellung und keine Zahl:
Bei 1,5-fach passen gut zwei Häuserblöcke nebeneinander aufs Bild, bei 6-fach
etwas mehr als ein halber. Die Seite schreibt genau das an jede Stufe, denn das
ist die Entscheidung, die man trifft. Die Geschwindigkeiten sind unverändert -
nicht die Stadt ist kleiner geworden, die Linse ist näher gekommen.

Mit der Kamera ist auch die **Bevölkerung** gewachsen: 220 Leute, 58 fahrende
und 54 geparkte Fahrzeuge, 30 Katzen. Bei Lebensgröße hielt der Bildschirm sechs
Häuserblöcke, da wirkten ein paar Dutzend Menschen wie eine belebte Straße; bei
dreifachem Zoom hält er einen, und dieselben paar Dutzend wirken wie eine
Geisterstadt. Simuliert wird ohnehin nur, was in der Nähe des Spielers ist - die
größere Zahl kostet Speicher, keine Zeit (nachgemessen: weiterhin 60 Bilder je
Sekunde).

Der Zoom liegt im Zustand des Hooks in einem Ref und wird vom Einstellungs-Store
gefüttert. Damit wirkt eine Änderung im nächsten Bild statt im nächsten Spiel -
auch aus einem anderen Tab.

Technisch ist es **eine** Stelle: `draw` legt vor der Stadt eine Skalierung um
den Bildmittelpunkt an und nimmt sie danach wieder weg. Alles Weltliche rechnet
weiter in Bildpunkten und weiß nichts davon; Karte und Zahlenblock in den Ecken
werden nach der Skalierung gezeichnet und bleiben deshalb gleich groß. Die Maus
geht durch `worldAt` denselben Weg rückwärts - Zoom und Kippung in einer
Funktion, damit der Schuss dort landet, wo das Fadenkreuz steht.

## Bildpunkte und echte Pixel

Gezeichnet wird in **Bildpunkten**: 960 x 600, und daran hängt alles - wie viel
Stadt aufs Bild passt, wie groß ein Auto ist, wo die Karte in der Ecke sitzt.
Wie viele echte Pixel daraus werden, ist eine andere Frage, und die beantwortet
die Leinwand: Sie bekommt so viele Pixel, wie ihr Kasten auf dem Bildschirm und
das Gerät hergeben - auf einem scharfen Display doppelt so viele in jeder
Richtung -, und der Zeichner skaliert einmal pro Bild hinein.

Vorher hatte die Leinwand feste 960 Pixel und wurde von CSS auf die Kastenbreite
gezogen: ein Bild, über einen größeren Kasten gespannt, ist ein weiches Bild.
Jetzt ist es scharf, ohne dass beim Zeichnen einer Motorhaube irgendwer über
Gerätepixel nachdenken müsste. Gedeckelt bei zwei - darüber malt man die
vierfache Fläche für einen Unterschied, den niemand sieht.

Die Maus rechnet in denselben Bildpunkten. Damit bleibt das Zielen von der
Auflösung unberührt - nachgemessen bei einfacher und doppelter Dichte, gleiches
Ergebnis.

## Wie die Grafik entsteht

Drei Wege sind in Webspielen üblich: **fertige Sprite-Sheets** (PNG-Atlas,
gekauft, gefunden oder gemalt), **3D einmal von oben gerendert** und dann als
Bilder benutzt, oder **Vektorgrafik im Code**. Hier ist es der dritte Weg, aber
mit dem Trick aus dem ersten: gezeichnet wird mit Pfaden, und das Ergebnis wird
**einmal in ein Sprite gerendert** und danach nur noch gestempelt.

`components/figure-art.ts` malt einen Menschen aus geschlossenen Pfaden mit
Kontur: Schultern, die zur Brust hin schmaler werden, Arme mit Ärmel und Hand,
ein Kopf mit Haaransatz, Ohren, Brauen, Augen mit Pupillen und Nase - und je
nach Sorte Revers und Krawatte, ein zerrissener Mantel mit Flicken, eine
verkehrt herum getragene Kappe, eine Dienstmütze mit Schirm und Abzeichen.

Der Cache ist der Grund, warum das bezahlbar ist. Vierzig Pfade je Person mal
hundert Personen mal sechzig Bilder in der Sekunde wären nicht zu halten; ein
`drawImage` je Person schon. Gebaut wird faul: Nur die Kleidungskombinationen,
die tatsächlich auf dem Bildschirm auftauchen, werden je gezeichnet.

**Drei Sprites je Person, nicht eins.** Beine, Rumpf und Kopf liegen auf
verschiedenen Höhen - die Beine flach, der Rumpf auf Schulterhöhe, der Kopf
darüber -, und dieser Abstand ist es, der die Figur in der gekippten Ansicht
aufrecht stehen lässt. Dazu kommt: Die Beine drehen sich mit den Tasten, Rumpf
und Kopf mit der Maus. Ein einziges Bild könnte das nicht.

**Drei Armhaltungen, und die Waffe entscheidet welche.** Eine Schusswaffe wird
vor den Körper gehalten - so sieht Zielen von oben aus. Fäuste nicht: Wer mit
vorgestrecktem Arm die Straße entlangläuft, sieht aus, als würde er gleich
umfallen. Also schwingen die Arme normal mit, und **erst der Klick** zeigt den
Schlag: Der Arm schnellt vor, die Faust wird größer gezeichnet.

Die Schlaghaltung braucht keine eigene Uhr. Sie steht genau so lange, wie die
Waffe zum Nachladen braucht - `reloadAt` ist ohnehin da, und so stimmt das Bild
immer mit dem überein, was der Motor als Nächstes zulässt.

**Mit der Faust schlägt man abwechselnd.** Niemand prügelt sich zehnmal
hintereinander mit derselben Hand, also zählt `player.punches` die Schläge mit,
und die Figur setzt den Arm bei jedem zweiten auf die andere Seite. Der Zähler
steht bewusst im Zustand und nicht im Zeichner: Der Zeichner darf sich nichts
merken, sonst laufen zwei Bilder desselben Zustands auseinander.

Was man in der Hand hält, bleibt dagegen in dieser Hand. Schlagring und
Schlagstock sind rechts, Schlag für Schlag - eine Waffe, die zwischen den
Händen hin und her springt, sieht nicht nach Faustkampf aus, sondern nach
Fehler. Deshalb fragt die Figur den Zähler nur bei der bloßen Faust.

Jede Sorte hat genau ein Merkmal, das sie von oben trägt, und nicht mehr: beim
feinen Herrn der Hut mit Krawatte, beim Penner der Flickenmantel, bei der
Nachtschwärmerin das lange blonde Haar mit Sonnenbrille und der Bikini - von senkrecht oben ist
Haar das größte Stück eines Menschen, also macht es dort die Figur aus. Kleid,
Stiefel und Handtasche kommen dazu, weil sie am Rand der Silhouette liegen.

Ein Detail, das erst falsch war: Der Kragen war ein Fleck in Hautfarbe mitten
auf der Brust - von oben liest sich das als nackter Bauch. Jetzt ist es der
Kragen des Hemdes, in einer dunkleren Tönung derselben Farbe, und die Tönung
wird gerechnet statt nachgeschlagen: Jede künftige Farbe hat damit ihre eigene.

**Sitzen ist dieselbe Figur, nur tiefer.** Die Penner lagen vorher als Ellipse
mit einem `z` darüber auf dem Gehweg - das liest sich als Leiche, nicht als
jemand mit einem schlechten Jahr. Jetzt sitzen sie im Schneidersitz an einer
Wand, und das kostet **eine Zahl und ein Bild**: Schultern, Kopf und Beine
kommen auf 52 Prozent ihrer Höhe herunter, das Wippen des Schritts fällt weg,
und statt der Schrittbeine wird ein gekreuztes Paar gestempelt.

Der Schneidersitz von oben ist ein breiter Rhombus: Knie nach außen, Schienbeine
nach vorn über Kreuz, jeder Fuß unter dem anderen Knie. Er muss **weit über den
Rumpf hinausreichen**, sonst deckt das Rumpf-Sprite ihn zu und der Mann liest
sich als Bündel. Gezeichnet als zwei Striche je Bein - ein dunkler, ein
schmalerer in der Hosenfarbe darüber -, weil ein gleichmäßig dickes,
gebogenes Bein eine Linie ist und keine Kontur mit Füllung.

Wo sie sitzen, entscheidet nicht der Zeichner, sondern die Stadt: Der Platz beim
Aufbau liegt mitten auf dem Gehweg, also werden von dort die vier Richtungen
abgesucht, bis eine in ein Gebäude läuft. Sie sitzen dann mit dem **Rücken zur
Wand**, nicht mit dem Gesicht - so sitzt man an einer Wand, und nur so landen
die gekreuzten Beine auf dem Gehweg statt im Mauerwerk. Findet sich in
Reichweite keine Wand, steht dieser eben auf und geht.

**Wer liegt, ist ein Bild statt drei.** Ein Toter war vorher eine Ellipse in
Hemdfarbe mit einem Kreis am Ende - ein unrunder Fleck, kein Mensch. Jetzt ist
es eine eigene Zeichnung: zwei Arme und zwei Beine, jedes aus zwei geraden
Stücken mit dem Gelenk dazwischen, dazu Hände, Schuhe, Hals und der bekannte
Kopf, zur Seite gerollt. Die vier Glieder sind absichtlich **nicht gespiegelt**:
Ein Knie ist angezogen, das andere Bein liegt gestreckt, ein Arm ist nach hinten
geworfen, der andere über die Brust. Zwei gleiche Hälften sehen aufgebahrt aus.

Die Gründe für drei getrennte Sprites fallen dabei alle weg: Nichts sitzt auf
Schulterhöhe, nichts dreht sich mit der Maus, nichts ist mitten im Schritt. Also
ist es ein Sprite, flach auf die Straße gelegt - ohne jede Höhe, und das ist der
ganze Unterschied zwischen Stehen und Liegen in dieser Ansicht. Die Armhaltung
steht auch nicht im Schlüssel: Ein Mann auf dem Asphalt ist derselbe Mann, egal
was er eine Sekunde vorher in der Hand hatte.

Was in der Hand liegt, wird **nicht** ins Sprite gebacken: Die Waffe wechselt
mit dem Mausrad, das Hemd nicht. Sie wird klein an die Handposition gezeichnet -
dieselbe Zeichnung, die als Fundstück auf der Straße liegt.

Wenn irgendwann echte gemalte Sprites dazukommen sollen, tauscht man genau eine
Stelle aus: `bodySprite`, `headSprite` und `legsSprite` geben dann ein
geladenes Bild zurück statt eines gemalten. Der Rest des Renderers merkt nichts
davon.

## Die Fahrzeuge, nach demselben Muster

`components/vehicle-art.ts` macht mit den Autos, was `figure-art.ts` mit den
Leuten macht: Konturen statt Rechtecke, einmal gemalt und danach gestempelt.
Ein Auto ist dreißig Pfade wert - Karosserie mit verjüngter Schnauze, Dach mit
Naht, Scheinwerfer und Rücklichter, vier Räder, die über die Flanken stehen, und
zwei Spiegel - und dreißig Pfade mal sechzig Autos mal sechzig Bilder wären
nicht zu halten. Einmal je Karosserie und Farbe schon.

Die sechs Sorten sind **eine Zeichnung mit Reglern**, nicht sechs Zeichnungen:
wie stark sich die Schnauze verjüngt, wie weit die Räder herausstehen, was aufs
Dach kommt. Ein Geländewagen verjüngt sich kaum und trägt Dachreling und
Rammbügel, ein Taxi hat Schild und Karo-Streifen, ein Streifenwagen schwarze
Türen auf weißem Blech und den Balken. Motorrad und Fahrrad sind zwei Räder,
ein Rahmen, ein Lenker und ein Fahrer von oben; der Panzer ist Kette, Wanne,
Turm und Rohr.

Was **nicht** ins Bild gebacken wird, ist alles, was sich ändert: der Schatten
und der Rauch eines Wracks. Einen Rahmen um den Wagen, in dem man sitzt, gab es
auch einmal - der ist weg: Die Kamera sitzt darauf, also war nie fraglich,
welcher es ist, und ein gezeichnetes Kästchen war das einzige auf dem Schirm,
das nicht Teil der Stadt sein konnte.

**Zwei Farben sind vergeben.** Gelb gehört dem Taxi, Weiß dem DMC-12 - die
beiden Fahrzeuge, die man quer über eine Kreuzung erkennen können muss. Wagen
und Geländewagen bekommen deshalb die Palette **ohne** diese beiden Töne; das
Taxi bekommt sein Gelb fest statt aus der Palette, wo es vorher auch blau
herauskommen konnte.

### Der Panzer ist kein Auto mit Gewehr

Vier Dinge stimmten an ihm nicht, und jedes einzelne ist ein Beispiel dafür,
wie ein Fahrzeug aussieht, das aus einem Auto gebaut wurde.

**Die linke Kette lag nicht auf dem Panzer.** Beide kamen aus
`side * wide - band`, was auf der einen Seite das Band innen an die Flanke legt
und auf der anderen ein ganzes Band **außerhalb** der Maschine - die linke fiel
über den Rand des Bildes und wurde abgeschnitten. Der Panzer fuhr auf
anderthalb Ketten.

**Die Wanne hörte vor ihnen auf.** Sie war um etwas mehr eingerückt, als die
Ketten breit waren, und zwischen Wanne und eigener Kette blieb auf jeder Seite
ein Haarstrich Straße stehen: Man konnte durch einen Panzer sehen. Jetzt
überlappt das Deck die Innenkante beider Ketten - Panzerung, die sich trifft,
wird sich treffend gezeichnet.

**Und zwischen Turm und Deck war Luft.** Der Turm wurde als flaches Bild auf
Dachhöhe gelegt, mit nichts darunter: sieben Pixel offener Himmel genau dort,
wo die Panzerung am dicksten ist. Jetzt ist er ein Kasten wie alles andere hier

- nur steht er im Winkel des **Rohrs** statt im Winkel der Ketten, und er ist
  damit die einzige Wand der Stadt, die sich dreht, während das Fahrzeug darunter
  steht. Dazu gehören auch eigene Maße im Kasten (`TIERS.tank.cabin*`): Es waren
  die der Wanne, vierunddreißig Pixel breit, was solange egal war, wie niemand
  darauf stand.

**Und er blinkte.** Ein Polizeipanzer fiel in den Zweig für Fahrzeuge ohne
Dachbalken und bekam die drei Blaulichter des Motorrads: sechzig Tonnen
Kettenfahrzeug, die den Verkehr anblitzen. Die Bedingung fragt jetzt nach
**zwei Rädern** statt nach „kein Balken".

**Man kam nicht hinein.** Seit es den Gang zur Fahrertüre gibt, lief der Mann
auch beim Panzer zu einer Stelle `DOOR_STAND` neben dessen Mitte - bei einer
sechsundvierzig Pixel breiten Maschine sind das elf Pixel neben der Flanke. Er
lief also in den Panzer hinein und schob dort, für immer, denn „angekommen"
heißt: näher als `DOOR_REACH` an einem Punkt, den er nicht erreichen kann. Ein
Panzer hat keine Fahrertüre: Man steigt auf die Wanne und lässt sich durch die
Luke fallen, von der Seite aus, auf der man gerade steht. Also steht er in
`noDoor` neben den Zweirädern, und ein Tastendruck daneben genügt.

**Und er hat zwei Waffen, nicht eine.** Die Kanone ist für das, was einen
Granate wert ist; alles andere - ein Mann auf der Straße, ein Auto, das nicht
zur Seite geht, ein Schaufenster - ist die Aufgabe des **Maschinengewehrs**
neben dem Rohr, und ein Panzer ohne eins ist ein sehr langsames Fahrzeug mit
einem Einzelschussgewehr. Linke Maustaste Granate, rechte Maustaste gehalten
MG.

Zwei Kleinigkeiten daran sind nicht beliebig:

- **Gehalten, nicht gedrückt.** `Input.plant` ist eine Flanke - ein Druck, eine
  Ladung -, und mit einer Flanke bekäme man einen Schuss je Klick. Also hat die
  rechte Maustaste zusätzlich `Input.spray`, den Zustand. Beide Lesarten
  desselben Knopfes streiten nicht: Die Ladung will, dass man zu Fuß ist, das
  MG will, dass man im Panzer sitzt.
- **Eine eigene Uhr** (`Player.gunAt`). Mit `reloadAt` geteilt würde eine
  MG-Garbe die Nachladezeit der Kanone elfmal je Sekunde zurücksetzen - man
  könnte Granaten so schnell feuern, wie man rattert - oder umgekehrt eine
  Granate das MG für eine Sekunde verstummen lassen. Die beiden feuern auch
  gleichzeitig, genau wie im Original: Der Richtschütze legt die Kanone auf
  etwas Lohnendes und hält das MG dabei am Laufen.

Was die Kette laufen lässt, ist `wheelStep` mit einem eigenen Zweig: Ein Panzer
zählt nicht Speichen, sondern **Platten**, es gibt also nichts zu verschmieren
und keinen Wagenradeffekt zu umgehen - nur eine Untersetzung aus demselben
Grund wie bei den Rädern. Bei echter Teilung liefe die Kette mit siebenundvierzig
Zyklen je Sekunde gegen sechzig Bilder und stünde still; bei `TRACK_CREEP`
(sechs Teilungen) läuft sie mit acht, und das sieht aus wie eine laufende Kette.

Deshalb ist der Panzer auch das **einzige Fahrzeug, dessen Draufsicht je Schritt
zwischengespeichert** wird. Bei allem anderen sitzt das Bewegliche an den
Wänden: Von oben ist ein Reifen ein schwarzes Rechteck und ein drehender Reifen
dasselbe schwarze Rechteck. Eine Kette nicht - von oben sieht man die Platten,
und Platten, die stehen bleiben, sind ein aufgemalter Streifen. Der Schritt geht
also in den Schlüssel: sechs Bilder Panzer, null Kosten für alles andere.

Von der Seite ist die Kette ein **geschlossener Umlauf**: ein Stadion, aus dem
mit der Even-Odd-Regel ein zweites Stadion herausgeschnitten ist, also ein Band
gleicher Dicke oben herum, um den Leitrad vorn, unten zurück und um das Triebrad
hinten. Die Laufrollen stehen in der Mitte davon und berühren beide Trume - was
vorher da war, war ein flacher Kasten mit außen aufgemalten Rollen, und eine
Kette ohne Innenraum kann nicht umlaufen. Die Platten der beiden geraden Trume
laufen **gegeneinander**: Das untere steht auf der Straße, während die Maschine
darüber wegfährt, läuft von der Wanne aus gesehen also rückwärts, und das obere
kommt mit doppelter Geschwindigkeit nach vorn.

Und wo er fährt, bleibt etwas liegen - siehe `Mark.tread` weiter oben.

### Die Kaserne ist ein Gebäude, keine Fläche

Drei Hütten auf dem Militärgelände waren zwei Rechtecke und ein Türloch: eine
flache grüne Platte als Dach, ein dunklerer Streifen als Vorderwand, ein
schwarzes Oblong in der Mitte. In dieser Größe ist das eine Form, kein Gebäude -
und es steht auf dem einen Fleck der Karte, den man zu Fuß überqueren muss, um
an einen Panzer zu kommen, wird also genauer angesehen als alles außerhalb der
Stadt.

**Und es führt keine Straße hin.** Eine Landstraße endete laut Tabelle eine
Reihe vor dem Zaun - legte aber trotzdem zweieinhalb Felder Asphalt dahinter,
weil eine fünf Felder breite Straße so weit neben ihre Linie reicht. Also lief
eine Zufahrt durchs Tor bis vor die Kaserne, und auf ein Militärgelände führt
keine Zufahrt. Die Strecke ist weg, und `cellAt` fragt das Gelände jetzt
**vor** den Straßen: Was innerhalb des Zauns liegt, ist Beton, was auch immer
die Breite einer Straße daneben tut. Die nächste Landstraße geht südlich daran
vorbei; die letzten Meter fährt man über den Sand, und das ist auch richtig so.

Jetzt wird sie gebaut, wie so etwas gebaut wird: eine **Betonplatte** ringsum,
ein **Satteldach mit First entlang der langen Achse** (welche Achse das ist,
entscheidet die Hütte selbst - die kleine am Tor ist keine geschrumpfte Kopie
der großen), die Nähte der Dachbahnen quer zum First, eine Reihe **Lüfter auf
dem First**, eine Vorderwand mit Sockel, Traufschatten und so vielen
**Sprossenfenstern**, wie die Front hergibt, und in der Mitte eine **Tür mit
Vordach und Stufe**.

### Zwei Kästen, nicht einer

Von oben sahen die Wagen gut aus, in der Höhe waren sie ein Kasten in
Wagenfarbe. Das ist der Punkt, an dem eine gekippte Ansicht auffällt: Man sieht
die Seite, und die Seite eines Autos hat Räder.

Also hat jedes Fahrzeug jetzt **zwei Kästen übereinander**. Unten der Wagenboden
über die volle Länge, oben die kürzere, schmalere Kabine. Zwei Kästen reichen
für die ganze Silhouette: Motorhaube, aufgesetztes Fensterband, Kofferraum. Auf
dem Motorrad ist der obere Kasten der Fahrer, beim Panzer der Turm.

Jede Wand trägt ein eigenes Bild, aus derselben Werkstatt wie die Draufsicht und
genauso zwischengespeichert: die Flanke mit zwei runden Rädern in ihren
Radhäusern, Schwellern, Türfugen, Griffen und Stoßstangen; die Schnauze mit
Kühlergrill, Scheinwerfern, Kennzeichen; das Heck mit Rücklichtern. Die Kabine
trägt die Scheiben - Seitenfenster mit schrägen Säulen, vorn die
Windschutzscheibe, hinten die Heckscheibe.

Gestempelt wird das mit einer gewöhnlichen affinen Transformation: quer am
Bodenrand entlang, hoch um die Höhe. Die Wand ist auf dem Schirm ein
Parallelogramm, und genau das kann `drawImage` - deshalb kostet eine Reihe
Räder an einem beliebig gedrehten Auto einen Aufruf und nicht dreißig Pfade.

Zwei Regeln halten das Bild zusammen. Die Kabine muss **genau dort stehen, wo
die Draufsicht das Dach malt** - sonst liegt ein Stück Dach flach auf der Haube
und daneben führt eine Stufe hinauf. Und **kein Glas in der Draufsicht**: Jede
Scheibe sitzt auf einer Wand der Kabine, wo sie hingehört. Eine flach
mitgemalte Windschutzscheibe läge eine Stufe zu hoch und machte aus dem Wagen
eine Kiste mit dunklem Deckel.

Die Draufsicht wird dafür **zweimal** gestempelt, aus einem einzigen Bild: einmal
tief, wo sie Haube und Kofferraum ist, und einmal auf der Kabine, auf die Kabine
beschnitten, wo sie das Dach ist. Der ganze Trick der Stufe ist eine Zeichnung,
die der Kasten unter ihr in zwei Teile schneidet.

## Warum kein fertiges Sprite-Sheet von der Platte

Der übliche Weg wäre eine Reihe fertiger Bilder je Blickrichtung. Dagegen
sprechen hier zwei Dinge.

**Gezielt wird mit der Maus**, die Blickrichtung ist also jeder beliebige
Winkel. Ein Sheet müsste ihn auf acht oder sechzehn Stufen runden; die Figur
würde beim Zielen ruckweise einrasten. Ein von oben gezeichnetes Sprite lässt
sich dagegen frei drehen - deshalb reicht _ein_ Bild je Pose statt acht.

**Und die Farben gehören dem Spiel, nicht dem Bild.** Hemd, Hose, Haut, Haare
und Bandenfarbe werden beim Malen gesetzt; ein fertiges PNG müsste je Kombination
einmal existieren.

Übernommen ist vom Sprite-Sheet die wichtigere Hälfte: **die Pose kommt aus
einem Zyklus.** Beine und Arme schwingen gegeneinander, der Körper wippt beim
Abstoßen, der Kopf zeigt das Gesicht nach vorne.

**Alles unterhalb des Kopfes wird für jeden in derselben Reihenfolge gebaut** -
Schuhe, Beine, Saum, Rumpf, Kragen, Ärmel, Hände - und erst danach legt der Stil
drauf, was diesen Menschen ausmacht: Revers und Krawatte beim feinen Herrn,
Flicken beim Penner, die Kappe in Bandenfarbe, Weste und Abzeichen beim
Polizisten, der Rocksaum beim Kleid. Der Kopf kommt zuletzt: Haare von oben, das
Gesicht als Keil nach vorn, darin zwei Augen, eine Nase und ein Mund.

Zwei Dinge, die dabei nicht funktionieren und deshalb nicht drin sind: ein
**Gürtel** - von fast senkrecht oben läge er _hinter_ der Figur statt um sie
herum und läse sich als Loch - und ein Schatten in Figurgröße, der bei nahem
Zoom wie eine Grube im Asphalt wirkt. Der Schatten ist so groß wie die Füße.

**Getaktet wird der Zyklus von der gelaufenen Strecke, nicht von der Uhr.** Das
steht als `walked` im Zustand, in Pixeln. Eine Figur, die nach einem Timer
animiert, macht den Moonwalk, sobald sie langsamer oder schneller wird - und
dieses Spiel hat den Bummel, die Flucht und den zehnfachen Cheat. Gelaufene
Strecke kann sich von den Füßen nicht lösen.

Wer stehen bleibt, friert nicht mitten im Schritt ein: Der Zyklus läuft bis zum
nächsten Punkt weiter, an dem die Füße beieinander sind, und hält dort. Gegen
eine Wand laufen zählt als stehen - die Füße kommen ja auch nicht voran.

Beim Spieler zeigt der Körper zur Maus und die Beine dorthin, wohin die Tasten
schicken. Genau das lässt einen Rückzug wie einen Rückzug aussehen und nicht
wie eine Kehrtwende.

## Shift, und warum Bewegung in Häppchen läuft

Shift hat zwei Stufen, und welche gilt, entscheidet der Cheat-Modus: allein ist
die Taste ein Lauf (dreifach zu Fuß, anderthalbfach im Auto), mit dem Cheat der
alte Turbo (zehnfach und dreifach). Eine Funktion, `sprint`, beantwortet das für
beide Aufrufstellen - der eigene Turbo-Knopf ist weg, weil eine gehaltene Taste
kein Modus ist, den man anschaltet.

Das kostet eine Zeile im Motor - und eine zweite, wichtigere, in der
Kollision.

Geprüft wird immer nur das **Ende** eines Schritts gegen die Stadt. Bei
Schrittweiten von zwanzig Pixeln geht das gut; mit dem Cheat sind es
fünfundsechzig, und damit springt man über eine Hauswand hinweg mitten in einen
Block - wo dann jeder Weg hinaus ebenfalls blockiert ist und man für immer
feststeckt. `slide` zerlegt jede Bewegung deshalb in Häppchen von höchstens
zwölf Pixeln. Bei normalem Tempo ist das genau ein Häppchen, es ändert also
nichts; mit Shift sind es ein Dutzend.

Aus demselben Grund zählt ein Zusammenstoß höchstens mit ehrlicher
Höchstgeschwindigkeit: sonst wäre mit gehaltenem Shift jeder Bordstein ein
Totalschaden.

**Hauptstraßen sind auf der Karte ein Pixel breit.** Eine Autobahn über ihre
ganzen fünf Felder schwarz gemalt ist ein etwas breiteres Grau - man kann sie
nicht herausgreifen, und dafür ist eine Karte in der Ecke da. Also malt
`mainRoads` nach den Feldern eine einzelne schwarze Linie: die Mittellinie jeder
Autobahn innerhalb der Städte, und dazu die Polylinien der Landstraßen. Die
Piste auf den Berg bekommt keine - sie führt nirgendwohin.

## Die Karte zeigt die Stadt, nicht den Bildschirm

Die erste Fassung der Karte oben rechts zeigte einen Ausschnitt um den Spieler
herum, ungefähr so groß wie das Sichtfeld - also eine kleinere Kopie dessen,
was ohnehin auf dem Bildschirm steht. Eine Karte ist aber für das da, was man
**nicht** sieht: in welchem Viertel man steckt, wie weit der Auftrag noch weg
ist, aus welcher Richtung die Streifen kommen.

Jetzt passt die ganze Stadt hinein. Der Stadtboden wird einmal in ein
Hilfsbild gezeichnet - ein Pixel je Rasterfeld, helle Straßen auf dunklen
Blöcken - und danach nur noch skaliert gestempelt; die Stadt ändert sich nie,
also lohnt es sich, sie nicht sechzig Mal in der Sekunde neu zu malen.

Alles andere ist ein Punkt: Auftrag, Lackiererei, Streifen, und zuletzt der
Spieler in Weiß mit dunklem Ring - ein weißer Punkt auf einer hellen Straße
wäre sonst kein Punkt.

## Aufträge und Viertel

Gelber Ring: abholen. Grüner Ring: abliefern. Bezahlt wird nach Entfernung, die
Uhr läuft ab dem Abholen. Jeder erledigte Auftrag zählt für das Viertel, in dem
er **endet**; drei Aufträge, und das Viertel gehört dir. Deshalb steht unter der
Stadt eine Leiste mit allen vier Vierteln und ihrem Stand - ohne sie wäre das
Ziel des Spiels unsichtbar.

## Aufbau

| Datei                       | Verantwortung                                  |
| --------------------------- | ---------------------------------------------- |
| `engine/types.ts`           | Zustand und jede Stellschraube mit Namen       |
| `engine/city.ts`            | Der Stadtplan: Straßen, Blöcke, Viertel        |
| `engine/setup.ts`           | Wer und was zu Beginn wo steht                 |
| `engine/engine.ts`          | Ein Schritt Los Santos                         |
| `components/render.ts`      | Zeichnen: Stadt, Autos, Leute, Stadtkarte      |
| `engine/weapons.ts`         | Die Waffentabelle: sieben Zeilen, keine Zweige |
| `engine/people.ts`          | Wer auf der Straße lebt, und auf wessen Seite  |
| `engine/vehicles.ts`        | Sechs Karosserien, eine Zeile je Fahrzeug      |
| `engine/buildings.ts`       | Was in den Blöcken steht, fünfzehn Zeilen      |
| `settings/`                 | Der Zoomfaktor, im Browser gespeichert         |
| `components/figure-art.ts`  | Die Menschen: Konturen, einmal gezeichnet      |
| `components/vehicle-art.ts` | Die Fahrzeuge, nach demselben Muster           |
| `hooks/use-gta-game.ts`     | Bildschleife, Tasten, Statistik                |

## Was die Probe gezeigt hat

Sechs Läufe ohne Browser, direkt gegen die Simulation:

- Verkehr fährt (7 von 26 Wagen in Sichtweite bewegen sich; der Rest schläft
  außerhalb, damit die Bildrate nicht an der anderen Stadthälfte hängt).
- Ein geklauter Wagen bringt genau einen Stern, ein geparkter keinen.
- Zwei Streifen kommen und fahren dir hinterher.
- Ein Auftrag zahlt 249 bis 424 €, drei in einem Viertel übernehmen es, und
  dafür gibt es fünf Respekt obendrauf.
- Die Lackiererei nimmt 100 € und löscht die Fahndung.
- Bei null Gesundheit endet es im Krankenhaus, kostet 200 € - und danach steht
  man wieder auf der Straße.

Die letzten Regeln noch einmal gemessen, mit demselben Verfahren:

- Im Cheat gegen die Wand: Blech 100, Leben 100; ohne Cheat 87.
- Auto gegen Auto: beide behalten 100.
- Ein genommener Streifenwagen bleibt `police`, gefahren, Besatzung 0 - und nach
  vier Sekunden darin ist niemand verhaftet.
- Zu Fuß eingekesselt stehen geblieben: `busted`. Dasselbe im Cheat: `playing`.
- Nach dem Tod steht man auf einer Krankenhaustür, nach der Haft auf einer
  Gefängnistür.
- Abgeschossen fliegt die Maschine noch 180 Pixel weiter und explodiert erst
  beim Aufschlag.
- Nach 90 Sekunden bei drei Sternen sind es 2 Streifen und 4 Mann zu Fuß, nicht
  mehr.

Am Telefon nachgemessen (Chromium, 412x915, echte Touch-Ereignisse):

- Der Stick fährt: nach einer Sekunde Schub steht die Figur zwei Straßen
  weiter.
- Die Knöpfe kommen an: neunmal **Waffe** landet auf dem Fernzünder, **Zünder**
  meldet „Zünder gelegt (1/10)" und „(2/10)", ein Tipp rechts löst beide aus,
  **Auto** meldet „Eingestiegen." und die Kopfzeile sagt „am Steuer".
- **Vollbild** wird angeboten und geht an.

Der Fernzünder, gemessen:

- Ein Fund gibt zehn Ladungen. Zwölf Rechtsklicks ergeben trotzdem zehn
  liegende und eine leere Tasche.
- Ein Linksklick löst alle zehn im selben Bild aus und kostet keine Munition.
- Unter einem Panzer: eine Ladung 400 -> 250, zwei -> 100, drei -> hin. Eine
  Granate an derselben Stelle nimmt ihm 66.
- Nach der Zelle liegt nichts mehr auf der Straße.

Und der Ausbruch, einmal ganz durchgespielt (ohne Wärter, mit einem Automaten
am Steuer):

- Schraube, Schüssel, Steine, Gang, Fenster, Kabel - alle sechs Schritte gehen
  auf, zusammen knapp **56 Sekunden** reiner Weg.
- Nach den Steinen hängen **drei Mitgefangene** dran und sind am Ende noch da.
- Mit der Schraube mitten im Gang stehen bleiben: nach **2,1 Sekunden**
  erwischt, zurück in der Zelle, Schraube weg. Ohne Schraube an derselben
  Stelle **30 Sekunden** lang: nichts.
- Beim dritten Mal endet der Ausbruch mit `back`.
- Ausbrechen kostet nichts, Absitzen 300 € - beides stellt einen vor das
  Gefängnistor.
- Der Turmwärter: Sichtweite 320, sieht über Mauern. Am Kabel, während er nach
  Westen schaut: **sofort** erwischt. Dreht er nach Osten: in drei Sekunden
  nicht gesehen. Im Hof, weit weg vom Turm: sieht er einen nicht. In 20
  Sekunden schaut er 10,2 s nach Westen und 9,8 s nach Osten.
- Nach den Steinen laufen **fünf** mit.
- Draußen: drei Sterne, fünf gestreifte Ausbrecher auf der Straße, alle in
  Panik - und die Sterne bleiben auch zehn Sekunden später noch stehen.
