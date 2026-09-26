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
schießen kostet zwei - eine Kugel ist keine Unachtsamkeit -, und einen
Polizisten umzufahren kostet dasselbe. Ein geparkter Wagen
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

**Überholt.** So lief die Bank bis zum Umbau: drei Uhren (Geduld der
Angestellten, Streifenwagen, Tresorzeit) und vier Schubladen. Was jetzt drin
steht, steht unter „Der Banküberfall ist ein Raum voller Menschen" - eine Uhr
gibt es dort nur noch, wenn jemand den Knopf erwischt hat.

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
- **Drei Stufen, aber aufgemalt.** Vorn die Verkleidung, dahinter die Sitzbank,
  hinten der Koffer quer über dem Hinterrad: Das ist das Profil eines Tourers,
  und ein durchgehender Streifen von vorn bis hinten ist das Profil eines
  Stoßfängers. Ausgeschnitten werden darf diese Stufung allerdings nicht - die
  Oberkante der Flanke ist die Gürtellinie, auf der die Draufsicht aufsitzt, und
  was dort frei bleibt, ist ein Loch. Siehe „Das Motorrad hatte zwei Köpfe und
  eine Lücke".

Die Blaulichter sitzen bei ihr auf Stielen neben der Scheibe statt auf einem
Dachbalken; sie blitzen im selben Takt wie die des Wagens.

**Ein Motorrad für alle.** Das normale Motorrad ist jetzt dieselbe Maschine wie
das Polizeimotorrad - derselbe Tourer mit Verkleidung und Koffern -, nur in
Grün, Schwarz, Rot oder Orange statt in der Lackierung und ohne alles, was
blinkt (`BIKE_PAINT`). Eine Form ordentlich schlägt zwei halbherzig, und eine Stadt, in
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
Dieselbe Zahl gilt für umgefahrene Passanten. Polizisten liegen länger - siehe
unten.

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

## Das Motorrad hatte zwei Köpfe und eine Lücke

Drei Fehler, und alle drei sieht man erst, wenn man weiß, wie ein Fahrzeug hier
gebaut ist: eine Draufsicht und vier Wände, die daraus aufgestellt werden.

**Der Fahrer wurde zweimal gestempelt.** Die Draufsicht geht zweimal aufs Bild -
einmal auf Gürtelhöhe für die Karosserie, einmal auf Dachhöhe für die Kabine.
Bei einem Auto verdeckt der obere Stempel den unteren, weil ein Dach eine
geschlossene Fläche ist. Ein Mensch ist das nicht: zwischen seinen Armen sieht
man hindurch, und darunter saß derselbe Mann noch einmal, sieben Pixel tiefer.
Jedes Motorrad der Stadt fuhr mit **zwei Helmen** herum, einer hinter dem
anderen.

Die Lösung ist die, die eine Engine wie Godot ohnehin nahelegt: ein Fahrzeug ist
dort eine kleine Szene aus Sprites - Räder, Rahmen, Fahrer -, jedes ein
vollständiges Bild für sich, nach z-Index gestapelt und absichtlich
überlappend. Also bekommt jedes Stockwerk sein eigenes Bild (`SpritePart`): die
**Maschine ohne Fahrer** auf Gürtelhöhe, der **Fahrer ohne Maschine** auf
Sattelhöhe. Was auch der Wahrheit entspricht - er sitzt über dem Tank, nicht
darin.

**Die Flanke reichte oben nicht bis zur Gürtellinie.** Genau dort setzt die
Draufsicht auf. Was die Zeichnung oben frei ließ, war ein Loch, durch das man
die Straße sah, mit dem Dach der Maschine darüber in der Luft - ein **Spalt über
die ganze Länge**, und das war der leere Raum. Ein gestuftes Profil (Verkleidung
hoch, Sitzbank abgesenkt, Heck wieder hoch) ist zwar genau das, wonach ein
Tourer von der Seite aussieht - aber es gehört **aufgemalt**, nicht
ausgeschnitten: Der Umriss füllt die Wand bis oben, und Verkleidung, Sattel und
Koffer sind Farbe darauf. Genauso macht es jedes Auto hier.

**Und die Maße waren gegen nichts gemessen.** Höhen werden in dieser Stadt mit
**8,6 Pixeln je Meter** gezeichnet - ein Golf ist 1,49 m und 12,6 Pixel. Das
Motorrad stand auf 9 und 16, also 1,05 m Maschine mit einem Fahrer, dessen Kopf
auf 1,86 m saß. Jetzt 7,4 und 13,6: Tank und Sitzbank auf 0,86 m, Helm auf
1,58 m. Der halbe Meter zu viel steckte in der Flanke, der einen Wand, die man
von einem Motorrad meistens sieht - und eine Wand, die so hoch und so lang ist,
ist eine **Plakatwand**, da hilft kein Zeichnen mehr.

Das Rad ist deshalb jetzt eine **Ellipse**. Ein Motorradrad ist ein Drittel der
Fahrzeuglänge; auf einer 7,4 Pixel hohen Wand wäre das ein Rad, das höher steht
als die Wand - und was über die Wand ragt, schneidet die Bildkante ab. Rund
gezeichnet wurde daraus ein Traktor: zwei riesige Reifen mit einem Brett
dazwischen. So lang gestreckt, wie die Maschine gestreckt gezeichnet ist, ist es
an beiden Enden ein Rad.

Was sonst noch neu ist:

- **Zwischen den Rädern hängt etwas.** Das Loch in der Mitte war vorher Straße.
  Vier Formen sagen, was dort wirklich ist: der Motorblock (metallfarben, nicht
  schwarz - schwarz zwischen zwei schwarzen Reifen liest sich als ein sehr
  breiter Reifen), die Schwinge nach hinten zur Nabe, die Gabel nach vorn, der
  Topf unter dem Heck. Dazu das Schutzblech über dem Vorderrad, das die Lücke
  zur Verkleidung schließt.
- **Die Draufsicht ist ein Umriss, keine Reihe Rechtecke.** Vorher lagen Nase,
  Rumpf und zwei Koffer nebeneinander - das ist ein Pritschenwagen mit drei
  Kisten. Jetzt eine geschlossene Silhouette von der Spitze bis zum Heck, schmal
  an der Verkleidung, tailliert, wo die Knie sind, breit über den Koffern; alles
  Weitere liegt darauf.
- **Spiegel.** Von oben sind sie das Einzige, was an einem sonst bleistiftförmigen
  Ding seitlich heraussteht, und ohne sie ist ein Motorrad in der Draufsicht ein
  Keil, der auch ein sehr kleines Auto sein könnte. Sie bleiben knapp innerhalb
  der Fahrzeugbreite, sonst stempelt sie der Ring flach auf die Straße.
- **Keine Reifen in der Draufsicht.** Die Wände zeichnen sie, auf der Straße, wo
  sie hingehören. Das ist die Regel, der das Fahrrad längst folgt.
- **Ein heller Helm auf dunkler Jacke.** Schwarz auf Schwarz ist, was ein Fahrer
  wirklich trägt, und von oben ein dunkler Fleck auf einer dunklen Maschine.
- **Vier Lackierungen statt zwei.** Grün und Schwarz bleiben, Rot und Orange
  kommen dazu: Ein schwarzes Motorrad unter einem Fahrer in schwarzem Leder auf
  grauem Asphalt ist ein Fleck mit Scheinwerfer. Silber, Blau und Gelb bleiben
  der Polizei.

## Der Fahrer ist ein Rig, kein Fleck

Auf dem Motorrad saß ein Ellipsoid in Fahrzeugbreite mit einem Punkt darauf -
von oben ein Sack auf einer Sitzbank. Ein Mensch wird aber nicht an seinem
Umriss erkannt, sondern **an seinen Gelenken**, und genau so baut eine Engine
eine Figur: Hüfte, Rumpf, Schultern, Kopf und vier Gliedmaßen, die je **einmal
knicken**.

Mehr ist es nicht. `limb()` bekommt drei Punkte - Schulter, Ellbogen, Hand -
und zeichnet zwei rundgekappte Striche plus einen Knöchel am Ende. Ein Arm als
gerade Linie von der Schulter zum Griff ist ein Besenstiel; derselbe Arm mit
einem Knick darin ist ein Arm. Es gibt hier kein Rig zu lösen, nur drei Punkte
zu setzen - und das ist, was eine Pose ist.

Die Pose ist die eines Tourenfahrers, und jeder ihrer Punkte liegt dort, wo die
Maschine es vorgibt: **Die Hände liegen auf den Griffen**, die Stiefel auf den
Rasten, die Knie stehen dort heraus, wo der Tank ist. Deshalb sieht er aus, als
führe er _dieses_ Motorrad, und nicht, als säße er auf einer Bank. Dazu
Handschuhe, Stiefel, eine Hose in eigener Farbe und ein Helm mit Visier - beim
Polizisten weiß, mit **Warnweste**, denn daran erkennt man einen Verkehrsposten
von oben.

**Das Visier ist eine Sichel, keine Linse.** Ein dunkles Oval mitten in einem
hellen Kreis ist ein Auge, und ein Motorrad mit einem Auge darauf ist ein
Comic. Von oben sieht man das Band des Visiers vorn um den Helm laufen - und
damit zugleich, wohin er schaut.

### Silhouette zuerst, Details danach

Durch den Fahrer konnte man trotzdem noch hindurchsehen - am deutlichsten in
der Kurve, wo zwischen Arm und Rumpf das rote Blech der Maschine durchschien.
Das ist der Preis dafür, eine Figur aus einzelnen Gliedmaßen zu bauen: Wo zwei
Teile schräg aneinanderstoßen, bleibt eine haarfeine Lücke, und weil der Fahrer
über sein eigenes Motorrad gemalt wird, ist diese Lücke kein Hintergrund,
sondern **Lack mitten im Mann**.

Die Regel dagegen ist die älteste im Sprite-Handwerk, und sie steht in jedem
Leitfaden dazu: **Silhouette zuerst, Details danach.** Das Gehirn verarbeitet
die Außenform, bevor es irgendetwas anderes erkennt - je klarer sie ist, desto
weniger muss der Spieler entziffern.

Hier heißt das: Der Fahrer wird **zweimal** gezeichnet. Der erste Durchgang
malt jedes Teil einen Pixel dicker und komplett in Tinte, der zweite den Mann
darauf. Die Tintenkontur schließt die Lücken zwischen den Gliedmaßen und lässt
eine schwarze Linie um ihn herum stehen, die ihn über jedem Untergrund
zusammenhält - egal, ob er gerade über rotem Blech, Asphalt oder Wasser sitzt.
Ein Pixel, nicht anderthalb: bei anderthalb liefen Arme und Rumpf ineinander
und er wurde sein eigener Schatten.

Zwei Kleinigkeiten kamen mit:

- **Die untere Verkleidung.** Zwischen Motor und Vorderrad stand eine
  handbreite Lücke offen, durch die die Straße zu sehen war. Ein Tourer hat
  dort ein Panel, und jetzt hat es dieser auch.
- **Weniger Schmälerung in der Schräglage** (`LEAN_NARROW`): ein Fünftel statt
  einem Drittel. Was da schmaler gezogen wird, ist das obere Stockwerk, und das
  obere Stockwerk ist der **Fahrer** - fünf Pixel breit. Um ein Drittel
  gequetscht war er in jeder Kurve kein Mensch mehr, sondern ein Fleck, der um
  die Ecke fährt.

### Wie oft ein Mann gezeichnet werden darf

Dabei kamen zwei alte Fehler heraus, beide aus derselben Ecke: Ein Fahrzeug ist
hier eine Draufsicht plus vier Wände, und ein Mensch ist kein Kasten.

- **Ein Fahrer hat eine Seite, keine zwei.** Von einer Kabine wird jede Wand
  gezeichnet, auch die abgewandte - bei einem Auto verschwindet sie hinter der
  nahen. Auf einem Motorrad liegen die beiden fünf Pixel auseinander, und damit
  saßen zwei Männer nebeneinander. Jetzt wird wie beim Fahrrad nur die
  kameraseitige Wand gezeichnet (`single`).
- **Die Kabine eines Motorrads ist der Mann, nicht die Maschine.** Sie war elf
  Pixel breit, also so breit wie das Motorrad: Seine Seitenansicht wurde damit
  an der Flanke des _Fahrzeugs_ gezeichnet, eine halbe Maschine von dort
  entfernt, wo er sitzt. Jetzt ist sie 5,5 Pixel breit - seine eigene Breite -,
  und die beiden Bilder landen aufeinander.
- **Der Kopf gehört der Draufsicht.** Sie liegt zuoberst auf dem Stapel, über
  der Mitte der Maschine; die Wände stehen daneben. Zeichnen beide einen Helm,
  hat der Mann zwei Köpfe, ein paar Pixel auseinander. Die Wände zeichnen
  deshalb nur noch den Körper bis zum Kragen - das, was ihn mit dem Sattel
  verbindet -, und der Helm kommt einmal, von oben.

Der Radfahrer hat dasselbe Rig bekommen; er war vorher eine gelbe Kiste mit
einem Kopf daneben.

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

## Ein Auto ist keine Kugel: Polizisten stehen wieder auf

Wer einen Polizisten anfährt, **erschießt** ihn nicht - er wirft ihn um. Beim
ersten Mal geht der Mann zu Boden, liegt vier Sekunden (`COP_FLOOR`) auf der
Straße und steht dann wieder auf: Er läuft von dort weiter, wo er gefallen ist,
und macht da weiter, wo er aufgehört hat. Das ist das Einzige an der Polizei,
was sich rückgängig machen lässt, und genau deshalb lohnt es sich - wer liegt,
schießt nicht, verfolgt nicht und gehört nicht zum Ring, der sich um den Wagen
schließt.

**Beim zweiten Mal ist er tot.** Ob in derselben Fahrt oder zehn Minuten später,
spielt keine Rolle: `floorUntil` wird beim Aufstehen nicht zurückgesetzt, also
trägt der Mann den ersten Anstoß den Rest des Spiels mit sich herum. Einmal ist
ein Versehen, zweimal ist Absicht, und das Spiel sagt das so. Der Tod läuft
dabei über denselben Weg wie ein tödlicher Treffer (`hurtCop`) - die Waffe fällt
ihm aus der Hand, und die anderen schließen die Lücke.

Zwei Bedingungen: Es zählt nur oberhalb von `CRASH_FLOOR`, damit das Heranrollen
an einen Streifenpolizisten keine Fahrerflucht ist, und nie zweimal im selben
Sturz, denn wer schon liegt, steht nicht mehr im Weg. Gekostet hat es zwei
Sterne, wie das Schießen auf einen Polizisten. Gemessen: erster Anstoß bei 1,1 s
(34 HP, liegt), wieder auf den Beinen bei 5,2 s, zweiter Anstoß bei 10,3 s
(0 HP).

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

## Die Flak wartet auf einen Stern

Die Batterien am Militärgelände schießen auf Höhe, nicht auf Personen: Wer
daran vorbeiläuft, ist ihnen egal, wer in hundert Pixeln Höhe darüberkommt,
hat jedes Rohr in Reichweite gleichzeitig am Hals. Das war der Sinn der Sache -
und es galt eben auch für jemanden, der mit dem Jetpack quer durch die Wüste
fliegt oder den Rettungshubschrauber nach Hause bringt. Das liest sich, als
schösse die Armee auf den Verkehr.

Jetzt ist **in der Luft sein kein Verbrechen**. Gefeuert wird nur auf jemanden,
der ohnehin gesucht ist; ohne Stern stehen die Rampen da und sind Kulisse.
Gemessen, zwölf Sekunden in Reichweite und auf Höhe: **ohne Stern null Schüsse
und volle Gesundheit**, mit zwei Sternen neun Schüsse und tot.

## Schwimmen sieht aus wie Schwimmen

Im Wasser bewegte sich die Figur wie auf dem Gehweg: dieselben schwingenden
Arme, derselbe Tritt, dasselbe Auf und Ab bei jedem Schritt. Von oben ist das
jemand, der durch den Hafen marschiert.

**Ein Schwimmer ist aber keine andere Haltung, sondern eine andere Form.** Die
Lauffigur ist ein Mensch vom Scheitel abwärts gesehen: Kopf über Schultern,
Schultern über Füßen. Wer schwimmt, liegt der Länge nach im Wasser. Der erste
Versuch war, genau diese Figur zu strecken und flach zu legen - heraus kam
jemand, der in einem Loch steht. Gezeichnet wird der Schwimmer deshalb
**eigens**, fünf Formen in einem Rahmen, der entlang seiner Richtung gedreht
ist:

- **Der Rumpf**, ein langes Oval im Wasser, im Hemd, in dem er hereinkam.
- **Der Kopf** vorn, der sich zum Atmen zur Seite dreht - immer zu dem Arm hin,
  der gerade über Wasser ist, einmal je Zug.
- **Die beiden Arme**, einen halben Zug auseinander. Einer ist in der
  **Rückholphase**: über dem Wasser, von der Hüfte nach außen und am Kopf
  vorbei nach vorn, und voll gezeichnet, weil er in der Luft ist. Der andere
  **zieht** unter dem Körper von vorn nach hinten und ist blass, weil er unter
  Wasser ist. Dieser Wechsel ist das, was Kraulen von oben ausmacht.
- **Die Beine**, blass und nachgezogen, die gegeneinander schlagen.
- **Der Schaum** an den Füßen - das Einzige, was man von einem Beinschlag aus
  dieser Höhe wirklich sieht: weißes Wasser, das bei jedem Schlag aufquillt.

Die Uhr von allem ist die **geschwommene Strecke**, nicht die Zeit - dieselbe
Regel wie beim Gehen, damit Langsamerwerden den Zug verlangsamt, statt den
Mondgang zu erzeugen. Ein Zug sind 56 Pixel gegen 34 Pixel Schrittlänge, was
bei Schwimmtempo auf knapp einen Zug je Sekunde hinausläuft; mit der
Schrittlänge wirbelten die Arme wie eine Windmühle.

**Und er ist so groß wie an Land.** Die Lauffigur kommt aus einem Sprite-Satz
mit eigenen Maßen, der Schwimmer ist von Hand gezeichnet - nach denselben
Zahlen kam er spürbar kleiner heraus, also jemand, der schrumpft, sobald er
nasse Füße bekommt. Ein einziger Faktor (`SWIM_SIZE`) zieht alles auf: Rumpf,
Kopf, Arme, Beinschlag und den grauen Fleck beim Tauchen. Nachgemessen an der
grünen Fläche des Hemds, beide in Bewegung: an Land 465 Pixel (30 × 26), im
Wasser 420 (36 × 29) - der Liegende ist etwas länger, etwas schmaler und zeigt
etwas weniger Hemd, weil die Arme draußen sind. Vorher waren es 236.

**Auf der Stelle ist ein eigener Zustand.** Der Zug hängt an der geschwommenen
Strecke, und wer seine Position hält, legt keine zurück - mit nur einem Zustand
hing die Figur im Wasser wie ein fallen gelassener Mantel. So machen es auch
die üblichen Engines: ein zweiter Zustand neben dem Zug, auf der **Uhr** statt
auf dem Kilometerzähler, und über die Geschwindigkeit ineinander geblendet.
Hier wird umgeschaltet statt geblendet - auf diese Größe fällt der Wechsel in
denselben Moment, in dem man die Taste loslässt, und ein Kraulen, das in ein
Wassertreten überblendet, wären vier Bilder, die niemand sieht.

Wassertreten ist ein **Scull**: die Arme seitlich draußen, die Hände eine
Handbreit unter der Oberfläche vor und zurück, die beiden gegenphasig, damit
sich der Körper weder dreht noch treibt. Darunter machen die Beine dasselbe
andersherum - der Eierschläger, den jeder Wasserballer tritt -, von oben zwei
Formen, die aneinander vorbeischwingen. Der Rumpf ist dabei **kürzer** als beim
Schwimmen, weil man aufrecht im Wasser steht, und er **steigt bei jedem
Schlag** ein wenig: Genau dafür ist Sculling da, und mehr als das ist von einem
Auf und Ab auf diesem Maßstab nicht zu sehen.

Die Wasserlinie, die den Gehenden früher auf Schulterhöhe abschnitt, gibt es
nicht mehr. Sie war richtig für jemanden, der brusttief steht, und falsch für
jemanden, der im Wasser liegt: Ein waagerechter Schnitt nimmt ihm erst die
Beine, dann die Schultern, dann den Arm, mit dem er greift. Was jetzt „im
Wasser" sagt, ist die Lage und die Tatsache, dass alles unter der Oberfläche
blass gezeichnet wird - und die Ringe liegen um seine Mitte statt über seinen
Füßen.

## Tauchen kostet Luft

Drei Sachen am Tauchen waren falsch, und alle drei hingen am selben Tastendruck.

**Die Leertaste bedeutet im Wasser tauchen, und sonst nichts.** Der Jetpack
liegt auf derselben Taste, also hob sie einen Schwimmer aus dem Meer, statt ihn
darunter zu bringen - und einen anderen Weg, das Gemeinte zu verlangen, gab es
nicht. Nass sein gewinnt jetzt: Wer im Wasser ist, taucht; an Land startet
dieselbe Taste weiterhin den Jetpack. Nachgemessen: zwei Sekunden Leertaste im
Wasser - Höhe 0 und `taucht = true`; zwei Sekunden an Land - Höhe 110.

**Und unter Wasser sieht man keinen Menschen mehr.** Vorher war es dieselbe
Figur, nur blass, mit drei Blasen darüber - was sich liest wie jemand, der
unter einer Glasscheibe spazieren geht, plus ein Leck. Von oben ist ein
Tauchender kein Mensch: Das Wasser nimmt erst die Farben, dann die Kanten, und
übrig bleibt ein **grauer Fleck in Kopfform**, der mitwandert. Drei Ellipsen
ineinander, die äußere fast nichts, damit der Fleck keinen Rand hat - nichts
unter Wasser hat einen. Die Blasen sind weg.

**Und die Luft geht aus.** Tauchen war sonst umsonst zu haben: schneller als
Schwimmen, und eine Kugel, die getroffen hätte, geht über einen hinweg. Ein
Zug, der nichts kostet, ist einer, von dem niemand wieder hochkommt.

- **14 Sekunden** Luft. Genug, um unter einer Brücke durch, unter einem Boot
  hindurch oder eine Salve auszusitzen - und zu wenig, um den Hafen tauchend zu
  durchqueren.
- Danach **9 Leben je Sekunde**, still: Die eine Zeile „Die Luft geht aus."
  steht im Log, wenn sie ausgeht, und danach nichts mehr - jede Sekunde eine
  Meldung wäre ein Log aus nichts anderem.
- An der Oberfläche füllt sie sich **dreimal so schnell**, wie sie ausgeht:
  Luftholen soll einen Moment kosten, nicht den Rückweg zum Strand.

Gemessen, Leertaste gehalten: bei 14 s ist die Luft weg, bei 16 s stehen 82
Leben, bei 20 s noch 46, bei 24 s noch 10. Danach aufgetaucht: nach fünf
Sekunden wieder volle Luft.

## Der Banküberfall ist ein Raum voller Menschen

Vorher war die Bank drei Uhren und vier Schubladen: hingehen, Maus halten,
warten, raus. Jetzt ist sie ein **Szenario**, und alles daran ist eine Frage
über die Leute darin.

### Hereinkommt nur, wer sauber ist

Zwei Bedingungen, und der Knopf an der Tür sagt, welche fehlt: eine **Waffe**,
weil eine Kassiererin über eine Faust lacht - und **keine Sterne**. Mit der
Polizei im Nacken in eine Bank zu gehen ist kein Überfall, sondern ein
Versteck mit einer Tür: Der ganze Job wird gegen einen stillen Alarm gespielt,
den noch niemand gedrückt hat, und wenn die Streifen ohnehin schon unterwegs
sind, gibt es nichts mehr zu spielen. Erst abschütteln.

### Wer drin ist

- **Drei Damen hinter dem Tresen**, je eine an ihrem Schalter. Unter genau
  einem der drei Schalter liegt der stille Alarm - welcher, wird ausgewürfelt,
  und man sieht es am roten Knopf hinter der Scheibe.
- **Der Direktor**, klein und breit, in seinem Büro rechts hinter dem Tresen.
  Er ist der Einzige, der den Tresor aufbekommt.
- **Bis zu drei Kunden**, zufällig, in der Halle.

### Die vier Regeln

1. **Die Waffe hält still, nicht die Nähe.** Wer im Fadenkreuz steht, in
   Reichweite und in Sicht ist, hebt nach einer halben Sekunde die Hände. Die
   Waffe reicht gut fünf Felder weit - ungefähr so weit, wie das Bild bei
   gewöhnlichem Zoom nach vorn zeigt. Weiter darf sie nicht reichen: auf
   jemanden zielen, den man nicht sieht, ist kein Entschluss, sondern Raten.
2. **Die Frau am Knopf hat neun Sekunden.** Sie muss sich nur bücken. Die
   anderen beiden müssen erst den Tresen entlanglaufen - und wer unterwegs ins
   Visier gerät, bleibt stehen. Neun Sekunden reichen, um vorher den Tresen
   abzulaufen; das ist der Unterschied zwischen einer Entscheidung und einem
   Reaktionstest.
3. **Hände oben ist nicht aus dem Spiel.** Nach einer halben Minute ohne Waffe
   im Gesicht gehen sie wieder runter. Nur das **Seil** nimmt jemanden dauerhaft
   heraus - oder eine Kugel. Gefesselt ist in einer halben Sekunde: Was das Seil
   kostet, ist der Weg zum Nächsten, nicht der Knoten.
4. **Drückt keiner, kommt keiner.** Ohne Alarm gibt es überhaupt keine Uhr; man
   kann sich beliebig lange Zeit lassen. Mit Alarm sind es fünfundzwanzig
   Sekunden. Genau dafür lohnt sich das Fesseln, das ja Zeit kostet: Die
   Alternative ist kein schnellerer Überfall, sondern einer mit Countdown.

### Der Tresor macht der Direktor auf, nicht der Spieler

Aufmachen kann ihn nur er, und nur mit freien Händen. Bedrohen, bis die Hände
oben sind - dann läuft er mit, wohin man geht -, und **ihn an die Tresortür
stellen. Den Rest macht er selbst**: Er löst sich, geht zum Schloss, holt den
Schlüssel heraus und dreht ihn, und danach legt er sich ins große Rad, bis die
Tür aufgeht. Sechseinhalb Sekunden, davon ein gutes Drittel Schlüssel und der
Rest Rad.

Eine Taste dafür wäre falsch gewesen: Der Spieler hat den Schlüssel ja gar
nicht. Und es ist der Teil, den man **ansehen** kann - ein Balken, der voll
läuft, sagt, dass eine Arbeit getan wird; ein Rad, das sich dreht, sagt, _wer_
sie tut und wie viel davon noch fehlt. Er arbeitet auch nur, solange die Waffe
mit im Raum ist: Geht man weg, bleibt er stehen, den Schlüssel im Schloss, und
macht weiter, wenn man zurückkommt.

Deshalb lässt er sich auch **nicht fesseln, solange der Tresor zu ist**: ein
Mann mit gebundenen Händen dreht kein Rad. Und wer ihn erschießt, kommt nie
mehr hinein - der eine Zug in diesem Raum, den nichts zurücknimmt.

### Die Schließfächer werden aufgeschossen

Drinnen liegen an allen Wänden Schließfächer - **zehn Stück**, auch in der
Wand zum Büro, aber keine in den Ecken: Ein Fach in der Ecke hat keine Seite
zum Raum hin, man könnte es weder sehen noch treffen, und ein Fach, an das man
nicht herankommt, ist keins.

Gezeichnet sind sie **schmal in Wandrichtung** - ein Fach ist ein Briefkasten
in einer Wand voller Briefkästen, kein Spind. Quer dazu darf die Tür ruhig
breit sein: Das ist die Fläche, auf die man schießt.

Aufgemacht werden sie mit dem, was man dabeihat, und das ist **nicht die
Schadenstabelle**: Eine Stahltür interessiert nicht, wie weh eine Waffe einem
Menschen tut. Das Messer ist auf Armlänge das tödlichste Ding der Stadt und
hier das langsamste, weil ein Schloss mit einer Klinge aufhebeln eben ein
Schloss mit einer Klinge aufhebeln ist.

| Waffe                              | Zeit je Fach           |
| ---------------------------------- | ---------------------- |
| Faust                              | geht nicht             |
| Schlagring                         | 9 s                    |
| Schlagstock                        | 8 s                    |
| Messer                             | 6 s (nur auf Armlänge) |
| Flammenwerfer                      | 3,5 s                  |
| Pistole                            | 2,5 s                  |
| Maschinengewehr                    | 0,8 s                  |
| Panzerfaust, Granate, Sprengladung | sofort                 |

Die **Faust steht nicht in der Tabelle**, und das ist der Sinn der Sache: Mit
bloßen Händen bekommt man die Fächer einer Bank nicht auf, und ein Raum, den
man mit leeren Händen ausräumen kann, ist ein Raum ohne Entscheidung. Das
Waffenrad funktioniert im Tresorraum, sonst wäre es eine Frage dessen, womit
man zufällig hereingekommen ist - und die **Ecke oben rechts** ist dieselbe wie
auf der Straße: Waffe, Munition, Leben, Geld. In einem Raum, in dem das Ding in
der Hand entscheidet, ob ein Fach in einer Sekunde, in sechs oder gar nicht
aufgeht, ist das die Anzeige, nach der man steuert.

Was drin ist, ist ausgewürfelt - 400 € bis gut 3600 €, quadratisch verteilt,
also meistens gewöhnlich und manchmal der Treffer. **Wie viel noch in den
Fächern steckt, steht nirgends**: Eine Zahl, die herunterzählt, machte aus dem
Tresorraum eine Einkaufsliste, die man abarbeitet, bis sie null zeigt. Niemand,
der eine Bank ausräumt, weiß, was hinter der nächsten Tür liegt, und genau
dieses Nichtwissen ist die Entscheidung, wann man aufhört.

Das Geld fällt **auf den Boden**, genau wie ein Passant im Straßenbild seine
Scheine fallen lässt, und wird genauso eingesammelt: drüberlaufen. Damit das
auch stimmt, sind zwei Dinge nötig, die man erst merkt, wenn sie fehlen: Der
Aufhebe-Radius ist mit **vierzehn Pixeln kleiner als ein Schritt**, und ein
Bündel **springt vom Räuber weg**, wenn es ihm vor die Füße fallen würde - denn
wer ein Fach aufbricht, steht direkt davor, und ohne diese beiden wanderte das
Geld aus dem Fach in den Sack, ohne je auf dem Boden gelegen zu haben.

### Und der Grund, warum man die Kunden auch fesselt

Der Tresorraum hat keinen Blick in die Halle. Wer dort drinsteht, deckt
niemanden mehr - und ein Kunde mit freien Händen geht zur nächsten gefesselten
Angestellten und macht sie los. Die geht dann zum Knopf. Das ist der ganze
Grund, warum man Leute fesselt, die einem nichts tun können.

### Die Tasten

Maus = zielen (und wer im Visier steht, hebt die Hände) · **linke Maustaste =
schießen** - auf Menschen und auf Schließfächer · **Leertaste = fesseln** ·
Mausrad = Waffe wechseln, mit derselben Anzeige oben rechts wie draußen ·
Laufen wie immer. Die Tresortür braucht gar keine Taste.

### Nachgemessen

Mit einer absichtlich ungeschickten Sonde (läuft nur achsenweise, hält jede
Taste vier Sekunden):

- Mit zwei Sternen an der Banktür: „Nicht mit Sternen. Erst die Polizei
  abschütteln." Ohne Sterne: drin.
- Nichts tun: Alarm nach neun Sekunden, Uhr läuft.
- Sofort auf die Frau am Knopf zielen: Hände oben, kein Alarm.
- Der ganze Ablauf im kleinen Raum: **drei Damen gefesselt bei 5,3 / 8,0 /
  11,0 Sekunden, ohne Alarm**, Direktor geholt, Tresor auf, Fächer
  aufgeschossen und eingesammelt.
- Direktor an die Tür gestellt und **keine einzige Taste gedrückt**: Tresor
  nach 6,85 s offen.
- Ein Fach mit jeder Waffe: Faust geht nicht, Messer 6,0 s, Schlagstock 8,0 s,
  Schlagring 9,0 s, Flammenwerfer 3,5 s, Pistole 2,5 s, MG 0,8 s, Panzerfaust,
  Granate und Sprengladung sofort - und danach lag das Bündel davor und ging
  beim Drüberlaufen in den Sack (2716 €).
- Direktor erschossen: „Den Tresor macht jetzt keiner mehr auf."
- Im Tresorraum mit lauter losen Angestellten: Alarm.
- Alle gefesselt, zwei Minuten gewartet: kein Alarm, keine Uhr.
- Drei Kunden lose, während man im Tresor steht: drei Angestellte wieder los,
  dann Alarm.

### Was am Raum anders ist

Klein: **15 × 13 Felder** gegen die 30 × 18 von früher, also halb so breit.
Tresorraum und Direktorenbüro grenzen **direkt aneinander**, nur eine Wand
dazwischen - der Gang, der vorher zwischen ihnen lag, war ein Gang, in dem nie
etwas passierte. Und die Halle ist nur noch **zwei Felder tief**: Man kommt
herein, und der Tresen ist da (nachgemessen: 0,43 Sekunden von der Tür bis an
die Theke). Jedes Feld, das man unter einer Uhr durchqueren muss, muss sich
verdienen.

Der Boden liegt in **Streifen** statt in Quadraten - Marmor längs durch die
Halle, Dielen quer im Büro, Estrich im Tresorraum. Und **kein Feld hat mehr
eine Linie um sich**: Vorher war jedes Quadrat der Karte umrandet, und eine so
gezeichnete Wand ist keine Wand, sondern eine Reihe Klötze - der ganze Raum
liest sich dann wie das karierte Papier, auf dem er entworfen wurde. Wand,
Theke und Boden laufen jetzt ohne Naht ineinander. Eine Linie bekommt nur noch,
was wirklich ein **Ding im Raum** ist: ein Schreibtisch, ein Schließfach.

Die Kamera ist die der Stadt - über dem Räuber, so nah, wie der Spieler sie
eingestellt hat. Den ganzen Grundriss ins Bild zu zwingen war einen Versuch
wert und war falsch: Dann sieht ein Raum, in dem man herumläuft, aus wie ein
Bauplan, über dem man schwebt, und jeder darin ist so groß wie eine Münze. Man
sieht von der Bank so viel, wie man von einer Straße sähe - den Rest durch
Hingehen.

## Wer im Auto sitzt, nimmt keinen Schaden - das Blech nimmt ihn

Ein Mann in einem Auto steht nicht auf der Straße. Kugeln, Feuer, ein
Laternenpfahl und der Zug treffen zuerst **Karosserie**, und Karosserie zählt
dieses Spiel ohnehin.

Drei der Wege dorthin fragten das schon von sich aus - Schüsse treffen den
Wagen, Flammen greifen nur den Fußgänger an, der Zug prüft `player.car ===
null`. Die übrigen taten es nicht: eine Explosion neben dem Auto, ein
Rammstoß, der Schlagstock eines Polizisten am Fenster. Statt drei weitere
Sonderfälle zu schreiben, fragt jetzt `hurt()` selbst: Sitzt er in einem Wagen,
**der noch Blech hat**, geht der Schaden dorthin.

Der Zusatz ist der wichtige Teil. Der Schutz hält genau so lange wie das Auto -
wer in einem ausgebrannten Wrack sitzt, ist wieder ein Mensch, sonst wäre
Unverwundbarkeit im brennenden Autowrack kein Schutz, sondern ein Fehler.

Nachgemessen, Polizist mit Schlagstock am Fenster: zu Fuß 100 → 65 Leben bei
vollem Blech; im Auto 100 Leben bei 100 → 65 Blech.

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
- **Nur wo Gehweg ist, auf den man sie legen kann.** Nicht jede Front hat
  einen: Ein Block kann an offenes Land grenzen, an den Sand am Ufer oder an
  einen Parkplatz, und eine Bucht auf einem davon ist eine Bucht im Nirgendwo.
  `drawHouse` fragt deshalb den Plan, was vor diesem Haus wirklich liegt, bevor
  irgendetwas darauf gemalt wird.

## Eine Tür ist zwei Meter hoch, egal wie hoch das Haus ist

Drei Maße am Haus waren Anteile der Wand, und Anteile sind für drei Dinge
falsch, die ein Mensch benutzt:

- **Die Haustür** war ein Drittel der Wandhöhe, gedeckelt bei 15 Pixeln. Auf
  einem Bungalow ergab das eine Tür von einem Meter, auf dem Barber eine Klappe.
  Jetzt ist sie `FRONT_TALL` = 18 Pixel, also bei 8,6 Pixeln je Meter gut zwei
  Meter - dieselbe Tür auf dem Schuppen wie auf dem Hochhaus, weil sie dieselbe
  ist. Nur eine Wand, die zu niedrig für eine ganze Tür ist, bekommt eine
  kleinere (`FRONT_MOST`).
- **Die Fensterhöhe.** Der Sturz saß zwölf Pixel über dem Boden, die Bank damit
  bei vierzig Zentimetern - ein Fenster, über das man steigt, statt eines, aus
  dem man sieht. Jetzt 20 Pixel Sturz: Bank auf gut einem Meter, Oberkante auf
  zweieinviertel. Wieder mit Deckel für niedrige Wände (`PANE_MOST`), damit
  kein Fenster durch das Dach stößt.
- **Der Geschossabstand.** Die Fensterreihen lagen 18 Pixel auseinander, also
  gut zwei Meter. Ein zweistöckiges Haus hatte damit beide Reihen unten
  zusammengedrängt und ein Drittel Wand leer darüber, ein hohes bekam sieben
  Reihen in etwas, das fünf Stockwerke hat. `STOREY` = 26 Pixel sind drei
  Meter, und dieselbe Zahl sagt beides: wo die nächste Reihe hinkommt und wie
  viele Reihen eine Wand überhaupt trägt (`floor(height / STOREY)`).
- **Die Höhe mancher Gebäude selbst.** Siehe unten.

## Ein Barber ist einstöckig, ein Hochhaus nicht

Die Tabelle in `engine/buildings.ts` kannte nur `rise` - einen Faktor auf die
Höhe, die der Block ohnehin gewürfelt hätte. Für ein Hochhaus ist das genau
richtig: eines in der Innenstadt soll höher sein als eines am Stadtrand. Für
einen Laden ist es falsch. Ein Friseur ist ein Raum mit einem Schaufenster und
einer Tür davor, und das ist er zwischen zwei Bürotürmen genauso wie in der
Vorstadt - am Blockwürfel hing er mal bei knapp drei Metern (eine Wand mit
Briefschlitz) und wäre in der Innenstadt ein Friseur im Hochhaus gewesen.

Deshalb gibt es `flat`: eine feste Höhe in Pixeln, oder `null` für den alten
Weg. Der Barber bekommt 34 Pixel, also vier Meter - Schaufenster, Tür und ein
Band Wand darüber für den Namen, eine Fensterreihe, ein Stockwerk. Gelesen wird
das an **einer** Stelle, `wallHeight`, und zwar vom Bild und vom Boden: Das
Dach, auf dem der Jetpack landet, muss das Dach sein, das man sieht.

## Wo kein Schild über der Tür ist, wohnt jemand

Jedes Haus der Stadt hatte ein Flachdach - das, was ein Bürohaus oder ein
Parkhaus hat. Von hier oben ist das Dach das meiste, was man von einem Gebäude
sieht, also war das Flachdach auch das meiste, was eine Wohnstraße wie eine
Reihe Kisten aussehen ließ.

`pitchedRoof` legt ein Satteldach mit grauen Ziegeln darauf. Der First läuft
von hinten nach vorn, die beiden Schrägen zeigen also nach Osten und Westen und
der **Giebel zeigt zur Straße** - das ist das Dreieck auf der Vorderwand, und
das Dreieck ist der Teil, den man wiedererkennt.

**Im Giebel sitzt ein richtiges Fenster.** Dort oben ist ein Zimmer, und ein
Zimmer hat ein Fenster - dasselbe wie in den Reihen darunter, mit Rahmen,
Sprossen und Bank, hell oder dunkel nach demselben Würfel. Vorher war es ein
dunkles Rechteck von vier mal drei Pixeln, und das liest sich als Lüftungsgitter
oder als Loch. Gezeichnet wird es jetzt von `windowPane` - **eine** Funktion für
jedes Fenster im Spiel, damit das im Giebel gar nicht anders aussehen _kann_ als
die anderen. Wo das Dreieck zu klein dafür ist, bleibt es weg: Ein Reihenhaus
ist knapp drei Meter breit, sein Giebel fünf Pixel hoch, und ein Fenster darin
stünde aus beiden Schrägen heraus.

**Und zwar an beiden Enden.** Ein First hat zwei Giebel; ein Dach mit einem
Dreieck vorn und einer geraden Kante hinten ist ein abgesägtes Dach. Beide
Enden bekommen deshalb dieselbe Überhöhung: Eine Funktion (`lift`) sagt, wie
weit das Dach an dieser Stelle quer über der Traufenlinie liegt - null an den
beiden Ortgängen, die volle Höhe am First -, und jede Kante, die sonst gerade
wäre, wird damit angehoben: die beiden Schrägen, die Ziegelreihen, der First
und beide Giebel. Der vordere ist Wand, weil man ihn ansieht; der hintere ist
die Kante der Ziegel gegen den Himmel, also dasselbe Dreieck ohne Füllung. In dieser Größe sagt nur die
Farbe, dass es zwei Schrägen sind: Die eine ist einen Hauch heller, der First
deckt die Naht ab, und die Ziegelreihen laufen mit der Schräge nach unten - als
Schatten (`rgba(0,0,0,0.13)`) statt als graue Linie, sonst ist es auf der
hellen Hälfte Wellblech und auf der dunklen unsichtbar.

Welche Gebäude eines bekommen, ist **kein Extrafeld**: Es ist die Frage, ob
dort jemand wohnt, und was das sagt, ist, dass kein Schild über der Tür hängt
(`sort.name === ""`). Wohnhaus, Doppelhaus, Reihenhaus und Hochhaus bekommen
Ziegel; Laden, Bank und Krankenhaus behalten ihr Flachdach, denn dort sitzt die
Attika mit dem Namen drauf. Die Villa im Südosten zeichnet ihr eigenes Dach und
bleibt rot - sie soll das andere Haus an ihrer Straße sein.

## Ein Krankenhaus je Stadtteil, und es sieht aus wie eins

Ein Krankenhaus alle paar Straßen ist eine Kette. Es ist das Gebäude, aus dem
man nach jedem Tod wieder herauskommt, also sieht man es öfter an als alles
andere in der Stadt - und bei einem Dutzend davon war das, das einen aufnimmt,
immer das nächstgelegene, also jedes Mal ein anderes. Es steht jetzt in
`ONE_PER_QUARTER`, neben dem Nachtclub: vier in Los Santos, eines je Viertel.

**Ausdünnen allein reicht dafür nicht.** `buildingAt` konnte Wahrzeichen bisher
nur wegnehmen - wo der Plan ein zweites zeichnete, ging ein Wohnhaus hoch -,
und ein Viertel, dessen Würfel nie ein Krankenhaus zeigten, hatte damit keines.
Gemessen: zwei der vier Viertel gingen leer aus. Also bekommt das Krankenhaus
dieselbe Nachrücker-Regel wie das Polizeirevier (`ONE_EACH`): den schlichtesten
Block nächst der Viertelsmitte, und nie den, auf dem schon das Revier steht.

Dabei ist noch etwas aufgefallen. Die Frage „ist dieser Block schlicht" wurde
als `PLAIN_BLOCKS.includes(rawKindAt(...))` gestellt - und das ist nicht
dieselbe Frage. Die meisten schlichten Blöcke dieser Stadt wurden nie schlicht
gezeichnet: Sie sind die zweite Bank, der vierte Nachtclub, das Revier eines
Viertels, das schon eines hat - Wahrzeichen, die `buildingAt` zu Wohnhäusern
ausdünnt. Das Strandviertel hat drei bebaute Blöcke, einer davon ein Haus, und
sah so trotzdem aus wie eines ohne Platz. `housing()` stellt jetzt dieselbe
Prüfung an wie `buildingAt` - bis auf die eine Zeile, die das Krankenhaus
selbst betrifft, denn die ruft hier an, und ein Ring zwischen beiden sprengt
den Stack. Das ist in diesem Modul schon zweimal passiert.

**Und gezeichnet wird es eigens** (`hospitalBox`), weil vier Dinge daran kein
Wohnhaus sind:

- **Bandfassade statt Fenstern.** Ein Glasband über die ganze Front je Etage,
  Pfosten alle paar Fuß, dazwischen ein Streifen Brüstung. Löcher mit Bank und
  Sprossen hat ein Reihenhaus.
- **Ein Pfeiler in der Mitte mit dem roten Kreuz.** Das Einzige, wonach hier
  überhaupt jemand sucht, also steht es auf dem einen Stück massiver Wand, über
  der Tür, wo man es vom Ende der Straße lesen kann.
- **Eine Schiebetür**: zwei Glasflügel, die in der Mitte auseinandergehen, so
  breit wie eine Trage samt den beiden, die sie schieben, unter einem Vordach.
- **Der Landeplatz auf dem Dach** - Kreis, Ring und ein H. Die Dachhöhe kommt
  aus `wallHeight`, also ist der Platz, den man sieht, die Höhe, auf der man
  aufsetzt. Gemessen: alle vier Dächer 84 Pixel.

Die Höhe ist dabei fest (`flat`), nicht gewürfelt: drei Etagen zu je `STOREY`,
also knapp zehn Meter. Ein Krankenhaus, das am Stadtrand ein Bungalow ist und
in der Innenstadt ein Turm, sind zwei Gebäude mit demselben Schild - und der
Hubschrauber landet auf beiden.

## Die Feuerwache hat keine Tore, sondern Löcher

Drei Tore, die immer offen stehen, sind keine Tore: Sie sind ein Stück
Gebäude, das nicht da ist. `fireBays(plot)` sagt, wo - drei Rechtecke, je ein
Feld breit und zwei tief, nebeneinander über die ganze Front - und diese
**eine** Antwort lesen beide Seiten: `openStations` schneidet sie aus dem
Boden (als `road`, denn da fährt man hinein), und `fireBox` malt die Öffnungen
an genau dieselben Stellen. Zwei Felder tief, weil ein Transporter
zweiundsechzig Pixel lang ist und ein Feld achtundvierzig: Bei einem Feld
hinge das Heck jedes Fahrzeugs auf dem Gehweg.

Geschnitten wird beim Aufbau **und beim Laden**, denn der Boden wird nicht
gespeichert - dieselbe Zeile wie bei den drei Garagen.

**Und sie wird hinter ihre eigenen Fahrzeuge sortiert.** Die drei Löschzüge
stehen _innen_, also ein bis zwei Felder nördlich der Vorderkante - nach der
Vorderkante sortiert malte das Haus sich über genau die drei Fahrzeuge, für
die es da ist. Die Wache bekommt deshalb die Tiefe der Torrückwand: damit
liegt sie hinter allem, was in der Einfahrt steht, und vor nichts, was weiter
südlich ist.

Dazu stehen die Fahrzeuge mit der **Stoßstange auf der Schwelle** statt mittig
in der Halle. In dieser Ansicht klettert alles, was in einem Gebäude steht,
dessen Vorderwand hinauf - je weiter nördlich, desto höher im Bild -, und ein
Wagen hinten in der Halle hatte seine Leiter quer über dem Namen an der Wand.

**Die Tore sind höher als ihr Sturz sein müsste**, und zwar weil man in sie
hineinsieht: In dieser Ansicht wird ein Fahrzeug, das in einem Gebäude steht,
an dessen Vorderwand hinaufgezeichnet. Eine Öffnung in Fahrzeughöhe zeigte
deshalb einen Löschzug **vor** einer Wand. Bei vierundvierzig Pixeln reicht das
dunkle Tor hinter die ganze Maschine, und was man sieht, ist eine Halle mit
einem Fahrzeug darin.

Die Wache ist außerdem fest achtundsechzig Pixel hoch (`flat`), also acht
Meter: Ein Tor, durch das eine Drehleiter passt, ist vier Meter hoch, und
darüber liegt der Rest des Hauses. Bei der gewürfelten Blockhöhe war es eine
Garage mit einem Schild.

**Eine je Stadtteil**, wie Revier, Klinik und Nachtclub - mit derselben
Nachrücker-Regel (`ONE_EACH`) wie das Krankenhaus, und deshalb auch mit
derselben Einschränkung: Das Strandviertel hat drei bebaute Blöcke, und zwei
davon sind schon Revier und Krankenhaus. Dort steht keine.

## Auf dem eigenen Hof parkt niemand

Der Hof neben der Villa ist gepflastert und leer, und genau das mochte die
Parkplatzsuche: Einer der drei DeLoreans stand bei jedem Spielstart darauf,
und ein paar geparkte Wagen dazu. Das ist kein Fundstück mehr, das ist jemand,
der in der eigenen Einfahrt parkt. `privateGround` - dieselbe Frage, die schon
die Fußgänger vom Grundstück fernhält - gilt jetzt auch für alles, was am
Bordstein abgestellt wird, und der DeLorean sucht sich notfalls achtmal einen
neuen Platz. Gemessen über drei Startwerte: null Fahrzeuge auf dem Grundstück,
und weiterhin drei DeLoreans in der Stadt.

## Das Löschfahrzeug ist der dritte Transporter

Dieselben Maße, dieselbe Kabine, dieselben Wände - `vanLike` sagt jetzt bei
drei Aufbauten ja. Unterschiedlich ist, was daraufgemalt wird: ganz in Rot,
und auf dem Dach die Leiter, zwei Holme über die Länge des Kastens mit den
Sprossen dazwischen. Von senkrecht oben ist das das Einzige, was ihn von
irgendeinem anderen roten Kasten unterscheidet - und es ist eine gerade Linie
in einem Bild, in dem sonst nichts auf diesem Dach gerade ist.

An der Seite steht **FEUERWEHR** statt des Firmennamens - `vanName` bekommt
das Wort und die Farbe jetzt mitgegeben, statt beides zu wissen; ein
Löschfahrzeug mit `ups` auf der Flanke war ein Paketwagen mit Leiter.

**Und zwar groß, und nur dort.** Das Wort hat neun Buchstaben, `ups` hat drei -
in denselben Platz geschrumpft kam es drei Pixel hoch heraus, also als Fleck.
Höhe und erlaubte Breite werden deshalb mitgegeben: zwei Drittel der
Kastenhöhe, und die Breite so bemessen, dass das Wort über dem Laderaum steht
und vor dem Fahrerfenster aufhört.

**Und es bleibt dort, wenn der Wagen andersherum fährt.** Beide Flanken werden
aus demselben Bild gemalt, und welche Fassung genommen wird, hängt davon ab,
wohin das Fahrzeug zeigt - bei der gespiegelten wurde der Versatz **negiert**.
Das setzt das Wort aber nicht an dieselbe Stelle der anderen Seite, sondern ans
**andere Ende derselben Wand**: Nach Osten saß der Name hinter dem Fahrerhaus,
wo er hingehört, nach Westen quer über der Scheibe der Fahrertür. Gespiegelt
wird jetzt nur die Schrift selbst, nicht ihr Platz. Wo dieses Fenster anfängt, ist dabei eine
Zahl, die beide lesen (`VAN_GLASS_AT`) - ausgeschrieben an zwei Stellen war die
zweite geraten und um ein Pixel daneben, und das letzte R saß in der Scheibe.
Auf den **Hecktüren** steht dafür gar nichts mehr: Die Rückseite eines
Transporters ist zweiundzwanzig Pixel breit, und neun Buchstaben darauf waren
ein grauer Strich. Was dort bleibt, sind die beiden Türflügel mit ihren
Griffen. Und er
hat dasselbe Blaulicht auf dem Dach wie der Rettungswagen: dieselbe kleine
Kiste, dunkel, weil er in der Halle steht und nicht auf Fahrt ist.

Die Sicken hat er nicht, so wenig wie der Rettungswagen: Die gehören zum
Kofferaufbau des Paketwagens. Schwerer und träger als die beiden anderen, dafür
hält er mehr aus als alles auf der Straße außer dem Panzer - er fährt ein
Wassertank spazieren.

## Der Ladebildschirm, und warum es zweimal so lang dauerte

Vom Klick auf GTA bis zum ersten Bild vergingen **7,3 Sekunden**, in denen der
Bildschirm stand. Gemessen mit Playwright, und die Ursache war zur Hälfte ein
Zweizeiler:

```ts
const START = createGame(CITY_SEED); // auf Modulebene
```

Das baute Los Santos, **während das Modul ausgewertet wurde** - und der Effekt
darunter baute es gleich noch einmal. Zwei komplette Städte für ein Spiel, und
beide Male lief nichts anderes: Ein Aufruf ist eine Runde der Ereignisschleife,
und solange er läuft, wird nichts gezeichnet. Deshalb war da auch nichts
anzuzeigen - kein Balken, kein Text, kein Bild.

Jetzt ist `START` eine **leere** Stadt (`emptyGame`): kein Boden, kein Verkehr,
niemand auf der Straße, und sie kostet nichts. Die echte wird gebaut, sobald
die Seite steht.

**In Scheiben, und dafür reicht ein Generator.** `buildGame` ist Zeile für
Zeile dieselbe Funktion wie vorher - dieselben lokalen Variablen, dieselben
Würfel in derselben Reihenfolge, dieselbe Stadt Feld für Feld -, nur mit sieben
`yield` dazwischen. Ein Generator hält alles am Leben, was zwischen zwei
Haltepunkten steht, also war kein Umbau nötig: keine Zustandsobjekte, keine
Fortsetzungsfunktionen, keine zweite Fassung, die man pflegen müsste.
`createGame` dreht ihn weiterhin in einem Rutsch durch, und genau das lesen die
Tests und die Messskripte.

Die Anteile sind gemessen und nicht geraten: Boden und Häuser 8 %, Verkehr
2 %, parkende Wagen 20 %, Einsatzfahrzeuge und Wachen 15 %, Passanten 40 %,
Gangs und Läden 10 %. Ein Balken mit gleich großen Schritten bleibt an einem
davon hängen.

**Und zwischen zwei Scheiben ein Bild und ein Schlag**: `requestAnimationFrame`
liegt **vor** dem Zeichnen, eine dort gestartete Scheibe liefe also los, bevor
der Balken, den sie gerade verschoben hat, auf dem Schirm ist. Das `setTimeout`
dahinter hängt die nächste Scheibe hinter das Bild.

Gemessen, nachdem die Route einmal kompiliert war - also so, wie es gebaut
läuft: **4,1 Sekunden vom Klick bis zum Bild**, davon 0,1 für die Seite. Die
restlichen vier Sekunden sind der Aufbau, und sie sind jetzt von einem Balken
begleitet, der sich bewegt, statt von einem Bildschirm, der steht. Der
Neustart-Knopf geht denselben Weg.

**Kein „haben wir das schon" - Merker.** Es gab einen, und er hat genau die
falsche Form für einen Effekt, der hinter sich aufräumt: React startet den
Effekt, räumt ihn ab und startet ihn erneut - bei einem frischen Mount in der
Entwicklung, und jedes Mal, wenn der Router diese Seite zurückholt. Der zweite
Lauf sah den Merker und tat nichts, der erste war von seinem eigenen Aufräumen
schon abgebrochen: **Der Balken stand für immer auf null.** Von der
Spielesammlung zurück ins Spiel zu klicken löste es jedes Mal aus. Ein Effekt,
der eine Arbeit beginnt und zurückgibt, wie man sie abbricht, darf so oft
laufen, wie React will - jeder Lauf baut eine Stadt, jedes Aufräumen wirft
seinen Versuch weg, und übrig bleibt der letzte.

Die Zustandsänderung für den Balken liegt dabei **nicht** im Effekt, sondern
einen Schlag später: setState direkt aus einem Effekt heraus ist, wie ein
Rendern sich selbst hinterherläuft - und die erste Scheibe liefe sonst, bevor
der Balken, zu dem sie gehört, auf dem Schirm ist.

**Auf dem Bild liegt nichts.** Kein dunkles Tuch darüber und kein Prozenttext:
Was man ansieht, während die Stadt entsteht, ist das Bild. Dazu kommen nur der
Balken und eine Zeile Unsinn darüber, was gerade angeblich passiert - beides
unten links, aus der Mitte heraus, der Balken mit dunkler Bahn und hellem
Ring, die Schrift mit Schatten, damit beides auf einem hellen Bild genauso
lesbar ist wie auf einem dunklen. Titel und Prozentzahl hängen als
`aria-label` daran, für alle, die den Balken nicht sehen.

Die Zeilen sind nach Arbeitsschritt sortiert - „Straßen werden betoniert",
„Falschparker werden ausgewählt", „Gangs teilen die Ecken auf" - und welche
davon man bekommt, wird bei jedem Schritt neu gewürfelt, damit das Warten
nicht zweimal derselbe Witz ist. **Gewürfelt wird im Haken**, wo der Schritt
veröffentlicht wird, nicht im Bildschirm: Eine Komponente, die beim Zeichnen
würfelt, gibt jedes Mal eine andere Antwort, und die Zeile flackerte durch die
Liste, während der Balken läuft.

Und der Schritt heißt, **was gerade getan wird**, nicht was gerade fertig
geworden ist: Eine Zeile, die den schon erledigten Teil benennt, lügt genau so
lange, wie der nächste dauert.

**Gespeichert wird nichts, solange es keine Stadt gibt.** Die Spielstandsleiste
liegt unter dem Bild statt hinter dem Ladebildschirm, ist also anklickbar,
während Los Santos noch entsteht - und was dann geschrieben wurde, war der
leere Platzhalter mit dem Spieler auf null, null. Wer den später lud, stand in
der linken oberen Ecke einer leeren Stadt. `save` und `load` warten jetzt, bis
es etwas zu speichern gibt, und `readAuto`/`loadSave` lehnen einen Stand ohne
ein einziges Auto und ohne einen einzigen Passanten ab - für die, die schon
auf einer Platte liegen.

**Und der Balken darf nicht weich sein.** Er hatte `transition-[width]`, und
gemessen stand er die ganze Zeit auf 0 Pixeln, während der Wert darüber schon
auf 85 % stand: Eine CSS-Animation auf `width` läuft auf dem Hauptfaden, und
genau den hält der Aufbau besetzt. Sie fing an und kam nie weiter. Ohne
Übergang springt die Breite sofort dorthin, wo sie hingehört - gemessen 0 ->
29 -> 110 -> 166 -> 313 -> 369 Pixel.

### Die Bilder dahinter: ein Ordner, keine Liste

**Splash art** heißt das Bild, das ein Spiel beim Startvorgang zeigt; der
Bildschirm mit dem Balken darauf heißt _loading screen_ - zwei Wörter, zwei
Dinge, und die Dateien sind das erste davon. Sie liegen in
`public/gta/splash/`, heißen wie sie wollen und dürfen `.webp`, `.avif`,
`.jpg`, `.jpeg` oder `.png` sein. WebP, weil es bei gleicher Qualität rund ein
Drittel kleiner ist als JPEG und jeder aktuelle Browser es kann. 1920 × 1200,
weil die Fläche 960 × 600 Ansichtspixel groß ist und die Leinwand auf scharfen
Anzeigen das Doppelte bekommen darf - alles darüber sind Pixel, die niemand
sieht, und das Seitenverhältnis ist das der Fläche, sodass `bg-cover` nichts
abschneiden muss.

**Der Ordner ist die Liste.** Ein Browser kann nicht in ein Verzeichnis
schauen, also muss irgendwo stehen, was darin liegt - und die beiden
naheliegenden Orte sind beide falsch: Eine Zahl im Code heißt, für ein Bild den
Code zu ändern, und eine getippte Liste heißt, für ein Bild die Liste zu
ändern. `src/app/gta/page.tsx` wird auf dem Server gezeichnet, kann also einfach
nachsehen (`readdirSync`), und die Antwort steckt danach in der gebauten Seite.
Ein Bild dazulegen ist deshalb das ganze Dazulegen; gezählt wird nirgends.

**Und der Unterpfad gehört davor.** Auf GitHub Pages liegt die Seite unter
`/<repo>/`, und eine Adresse, die mit `/` anfängt, zeigt dort auf die Wurzel
der Domain - also ins Leere. Next setzt den `basePath` von selbst nur vor das,
was es kennt: `next/link`, `next/image` und importierte Dateien. Eine von Hand
zusammengesetzte Adresse in einem `url(...)` gehört nicht dazu, und genau
deshalb war der Ladebildschirm überall außer auf dem eigenen Rechner schwarz:
Die Datei wurde unter `/gta/splash/…` gesucht statt unter `/Drecksau/gta/…`.
Die Liste trägt den Pfad aus `NEXT_PUBLIC_BASE_PATH` jetzt selbst vor jeden
Namen - dieselbe Variable, die `next.config.ts` liest und die CI aus der
`configure-pages`-Aktion setzt.

Nachgestellt: einmal mit gesetztem Unterpfad gebaut, den Export unter
`/Drecksau/` ausgeliefert und die Seite geöffnet - die Datei kommt mit 200,
dieselbe Adresse ohne Präfix mit 404, und das Bild steht auf dem
Ladebildschirm.

**Der Spruch hängt nicht mehr am Stück Arbeit.** Er tat es: Jede Bauphase
hatte ihre eigenen Zeilen, und gezeigt wurde eine davon, solange diese Phase
lief. Nur sind die Phasen nicht gleich lang - der Verkehr liegt in zwei
Hundertsteln Sekunde, die Menschenmengen brauchen anderthalb Sekunden -, also
huschten die meisten Sprüche zu schnell vorbei, um gelesen zu werden, und zwei
von sieben standen die ganze Wartezeit da. Jetzt wird erst eine **Kategorie**
gewürfelt und dann eine Zeile daraus, beides aus demselben Wurf: Die Zeilen
bleiben gruppiert, weil man sie so schreibt, aber welche Gruppe drankommt, ist
Zufall. Jede Zeile in der Datei kommt damit vor - nachgemessen, 53 Sprüche,
alle erreichbar - und keine hängt davon ab, wie schnell der Rechner ist.

**Einmal gewürfelt, nicht einmal pro Scheibe.** Die Zeile über dem Balken
wechselt mit jedem Stück Arbeit, das Bild darf das nicht - sonst ist der
Ladebildschirm eine Diashow. Der Wurf fällt also, wenn der Aufbau beginnt, und
gilt bis zur Stadt. Gewürfelt wird groß (0 bis 59) und der Ordner darum
gewickelt, damit der Haken nicht wissen muss, wie viele Bilder es gibt.

Und ein Wurf, der noch nicht gefallen ist, ist **kein Bild** und nicht Bild
null: Das allererste gezeichnete Bild steht auf dem Startwert, den React hat,
bevor der Aufbau losgeht. Eine Zahl dort wäre jedes Mal dieselbe Zahl - zwölf
Ladevorgänge hintereinander zeigten brav dasselbe Bild, das zwei Bildschirme
später vom gewürfelten abgelöst wurde. Jetzt steht dort `-1`, der Rahmen bleibt
zwei Bilder lang dunkel, und dann steht das Bild, das auch stehen bleibt.
Gemessen: zwölf Ladevorgänge, drei Bilder, 7/3/2 - und in keinem einzigen Lauf
ein Wechsel mittendrin.

Ist der Ordner leer oder nicht da, zeichnet der Browser nichts dafür und man
sieht den dunklen Grund darunter - kaputt sieht nichts aus.

## Die Meerenge, und was darüber liegt

Die Bucht war ein Teich. Fünf Felder breit lief die Küstenstraße am Ostufer
entlang, dahinter kam Land, und ein Boot, das nur von einem Ende einer Pfütze
zum anderen kommt, ist Deko, in der man sitzt. Zwei Eingriffe, und beide sind
klein:

**Die Straße ist weg.** Die Landstraße „von Los Santos an den Hafen" lief genau
zwischen den Stegen und dem offenen Wasser - eine Mauer aus Asphalt um die
Boote herum. Der Hafen hängt trotzdem am Netz: Die Kaimauer stößt im Westen an
die Stadt, und über Betonflächen fährt man wie über alles andere.

**Das Meer geht jetzt einmal durch die Karte** - und es wird dabei breiter.
Ein Rechteck, kein gewanderter Küstenverlauf (eine Meerenge wird gegraben,
nicht erodiert), und es liegt in dem einen Band, in dem keine Stadt steht: Die
drei Stadtinseln sitzen auf den Reihen 42-96, 12-66 und 108-156, der Kanal
läuft dazwischen hindurch bis an den Ostrand. Kein gebautes Feld verliert
dadurch eine Wand. Die Sandbänke an beiden Ufern macht die Strandregel von
selbst, weil sie fragt, ob zwei Felder weiter Wasser ist.

Am Hafenende sind es neun Felder, und das ist ein Fluss: Man fährt hinüber,
aber nicht darin herum. Also **öffnet es sich nach Osten** - fünfzehn Felder
weiter nach Norden, über fünfzig Spalten verteilt, bis es drüben zwei Dutzend
Felder offenes Wasser ist. Das Südufer bleibt gerade, denn eine Reihe darunter
fängt Los Santos an; nachgeben tut das Nordufer, und zwar allmählich, damit die
Küste wie ein Trichter aussieht und nicht wie eine Stufe.

**Und was hinüber muss, fährt über eine Brücke.** Dafür gibt es ein neues
Bodenfeld, `"bridge"`, und es ist das einzige, das **zwei Dinge gleichzeitig**
ist:

| wer fragt      | was er findet                                             |
| -------------- | --------------------------------------------------------- |
| Räder und Füße | Straße - man fährt und geht darüber                       |
| Rumpf          | Wasser - man fährt darunter durch                         |
| das Bild       | ein Deck mit Geländer an jeder Kante, an der Wasser liegt |

Mehr war nicht nötig: `isOpen` lässt es ohnehin durch, `isRoadAt` zählt es zur
Fahrbahn (also hält der Verkehr auch auf der Brücke seine Spur), und `inWater`
sagt Ja - deshalb kommt das Boot hindurch und der Schwimmer auch. Gezeichnet
wird das Boot unter einer Brücke **blasser**: Das Deck gehört zum Boden und
alles, was fährt, wird darüber gemalt, also säße das Boot sonst obendrauf
statt darunter.

Nachgemessen mit einer Flutfüllung vom vertäuten Boot aus: 6436 erreichbare
Wasserfelder, darunter alle 77 Brückenfelder, und die östlichste erreichbare
Spalte ist 167 - der Kartenrand. Man kann also vom Steg aus losfahren, unter
den Brücken hindurch, und kommt auf der anderen Seite der Karte heraus.

## Die Bahn quert senkrecht, und sie hat ihre eigenen Träger

Die Eisenbahn lief schräg über das Wasser - eine Treppe aus Feldern quer durch
den Kanal. Sie ist ein Ring um San Andreas mit vier Ecken, und die südöstliche
fing auf Reihe 94 an, also mitten im Meer. Die Ecke ist jetzt **enger** als
die anderen drei (sechs Felder statt achtzehn), und dadurch läuft die Ostseite
kerzengerade bis unter das Südufer: Die Querung steht senkrecht auf beiden
Ufern.

Darüber bekommt sie ihr eigenes Tragwerk - schmal, grau und ohne alles andere:
ein Stahlträger dicht an jeder Seite des Gleises und alle anderthalb Felder
eine Quertraverse. Keine Pylone, keine Seile, keine Farbe. Eine
Eisenbahnbrücke ist ein Stück Technik und kein Wahrzeichen; das eine
Wahrzeichen steht zwanzig Spalten weiter westlich.

## Die dritte Brücke ist weg, und am Ufer liegen Boote

Drei Brücken über dasselbe Wasser sind zwei zu viel, und die östliche stand
ausgerechnet an der **breitesten** Stelle der Meerenge. Was dort fehlt, ist
kein Umweg, sondern ein Grund, ein Boot zu nehmen.

Dazwischen stand kurz eine Fähranlage: zwei Zufahrten und zwei Stege. Beides
ist wieder weg - das waren zwei Streifen Asphalt im Nirgendwo und zwei
Bauwerke für eine Sache, die keines braucht. **Ein Boot am Ufer ist ein Boot
am Ufer.** Drei liegen jetzt längs an jedem der beiden Ufer, hintereinander,
mit dem Bug nach Osten, und zwar **auf der Uferlinie**: Ein Boot, zu dem man
erst schwimmen muss, ist keines am Ufer.

Der Ort ist dabei kein Feld, sondern eine Zahl mit Komma - 83,2 im Norden,
107,8 im Süden -, denn ein ganzes Feld setzt das Boot auf dessen **obere**
Kante, und am Südufer war das ein volles Feld zu weit draußen. Und beide
Reihen liegen gut östlich der Eisenbahnbrücke, damit kein Boot unter deren
Trägern verschwindet. Die Straße von Las Venturas endet oben im Wald.

Wo sie liegen, steht in {@link MOORINGS} - erstes Boot, wie viele dahinter -
und jeder Platz wird beim Aufbau gegen den Boden geprüft. Die Küste ist eine
Formel, und ein Boot im Sand ist schlimmer als kein Boot. Deshalb fängt die
Reihe am Nordufer auch erst östlich der Eisenbahnbrücke an: Das Feld darunter
ist Deck, kein Wasser.

Die Bahnlinie überquert das Wasser unverändert - unter der fährt man ohnehin
durch.

## Spurmarkierung auf jeder Autobahn

Was auf der Brücke angefangen hat, gilt jetzt überall: fünf Striche auf jeder
Autobahn der Karte - durchgezogen in der Mitte, durchgezogen dicht an jedem
Bordstein, dazwischen je eine gestrichelte. Vier gleich breite Spuren, zwei je
Richtung. Alles Schmalere bekommt nichts: Eine drei Felder breite Straße ist
eine Spur je Richtung und braucht keine Ansage.

Zwei Sorten Autobahn, und sie werden aus verschiedenen Dingen gezeichnet:

- **In der Stadt** sind es Linien des Rasters, also wird Feld für Feld gerade
  die Linie entlang gemalt - und an jeder Kreuzung ausgelassen. Eine
  Spurmarkierung quer über eine Kreuzung ist eine, an die sich niemand hält.
  Woran man eine Kreuzung erkennt: `atCrossing` - dort trifft eine Rasterlinie
  eine andere. Vorher wurde gefragt, ob drei Felder neben der Mitte auch
  Asphalt liegt; das stimmt mitten im Block und stimmt überhaupt nicht am
  Stadtrand, wo die Autobahn über offene Flächen läuft: Dort war ringsum alles
  Asphalt, also wurde gar nichts mehr gemalt. Genau das waren die fehlenden
  Markierungen unten rechts.
  Und auf die **Bahn** wird nichts gemalt: Eine Eisenbahnbrücke ist nach dem
  Boden `"bridge"` und damit befahrbar, Spurstriche quer über die Schwellen
  hat sie deswegen noch lange nicht verdient.
- **Auf dem Land** sind es die breiten Routen, und die biegen. Ihre Linien sind
  die eigenen Punkte der Route, seitlich entlang der Normalen verschoben - die
  einzige Art, eine Kurve zu versetzen, ohne sie zweimal zu zeichnen.

**Und der Verkehr hält jetzt überall dort Spur, wo Spuren gemalt sind**, nicht
mehr nur in der Stadt und auf der Brücke. Übrig bleibt die schmale Landstraße,
die sich durch die Gegend schwingt: Dort wäre eine Spur ein Ziel, das mit jeder
Kurve auf die andere Seite springt. Gemessen auf der Wüstenautobahn: acht von
neun Fahrzeugen kommen in zehn Sekunden deutlich voran, und auf dem Bild liegen
sie zwischen den Strichen statt darauf.

## Jede Querung ist eine Brücke - und die Autobahn ist so breit wie sie

Drei Sachen, die zusammengehören.

**Die Autobahn ist schmaler geworden.** Ein Strich, der über den Brückenkopf
hinweg versetzt, ist schlimmer als gar keiner: Vorher war das Band einer
Landstraße `ROAD_COVER` = 1,1 Felder breiter als ihre Felder, das Deck aber nur
eine Schulter von zehn Pixeln - 53 Pixel Unterschied, und an jedem Ufer sprang
die Fahrbahnkante nach innen und die Striche gleich mit. Jetzt ist
`ROAD_COVER` keine eigene Zahl mehr, sondern **genau zwei Schultern**
(`DECK_SHOULDER`), links eine und rechts eine. Damit ist die Landstraße exakt so
breit wie die Brücke, über die sie läuft, und die Randlinie wird draußen nach
derselben Formel gesetzt wie auf dem Deck: Fahrbahnhälfte plus Schulter minus
eine Handbreit. Mitte, gestrichelt und Rand laufen ohne Versatz über die
Brücke.

**Und die Kante läuft jetzt entlang der Linie, nicht Feld für Feld.** Der erste
Versuch hängte Träger und Geländer an die Feldkanten - das ergibt in der Kurve
eine Treppe aus Trägern, und weil die Straße als Band über ihre Felder hinaus
gemalt wird, lag der Stahl obendrein mitten im Asphalt. Beides ist weg: Träger,
Geländer und das Deck selbst sind Striche der **Straßenlinie**, seitlich
verschoben und überall dort unterbrochen, wo die Linie nicht über Wasser läuft.
Ein Stück Code für jede Querung der Karte - Straßen wie Bahn, gerade wie
krumme.

Dazu wird ein Brückenfeld vom Boden als **Wasser** gemalt statt als Deck. Die
Felder sind eine Treppe, und eine Treppe aus Deck, die unter dem glatten Band
hervorschaut, sieht aus wie abgebrochener Beton. Das Deck kommt stattdessen als
Band hinterher: bei der Straße in der helleren Deckfarbe (das Straßenband
selbst ist Straßengrau und ginge im Meer unter), bei der Bahn als Schotterdamm.
Zwei Maße dazu, beide nachgerechnet:

- Der Damm der Bahn reicht **34 Pixel** zu jeder Seite. Mit 22 blieben auf der
  schrägen Querung im Westen fünf Felder als blaues Loch stehen, auf denen man
  trotzdem gehen konnte - in der Schräge liegen die Felder als Treppe um die
  Linie herum. Bei 34 sind alle **250 Brückenfelder** der Karte gedeckt.
- Das Band läuft **einen Punkt weiter**, als das Wasser reicht. Ein Feld ist
  breiter als der Punkt in seiner Mitte, und sonst blieb am Ufer ein blauer
  Zwickel des letzten Brückenfeldes stehen. Jetzt läuft es ein Stück auf das
  Land - dort, wo ein Widerlager hingehört.

Über Wasser gibt es außerdem **keinen Staubstreifen** mehr. Eine Brücke hat
einen Träger, wo die Landstraße ihr Bankett hat; lag der Streifen trotzdem da,
schwamm draußen neben dem Stahl ein brauner Rand auf dem Meer.

**Damit sehen alle Querungen gleich aus**, auch die beiden rechts: die
Eisenbahn über den Kanal und die lange Bahnbrücke quer durchs Meer. Die
Hängebrücke ist die einzige Ausnahme - die malt ihr Bauwerk weiterhin selbst,
und zwar zuletzt.

## Eine Brücke, die eine Brücke ist

Zwei Sachen an der mittleren Querung.

**Sie hörte auf halber Strecke auf.** Die Straße aus der Wüste endete auf Reihe
105 - festgelegt zu einer Zeit, als dort Land war. Seit der Kanal liegt, hörte
sie mitten über dem Wasser auf, und eine Brücke, der das letzte Stück fehlt,
ist keine. Beide Querungen laufen jetzt bis auf festen Boden durch und treffen
dort die erste Querstraße von Los Santos; nachgemessen Feld für Feld: von Reihe
82 bis 111 ist durchgehend Fahrbahn, und wo auf 112 die Bahnlinie quert, ist es
ein Bahnübergang wie jeder andere.

**Und sie ist ein Bauwerk.** Die meisten Querungen sind Asphalt, unter dem
zufällig Wasser liegt; diese ist das Ding, für das man einen Umweg fährt -
inzwischen zusammen mit der kurzen vor San Fierro, die dasselbe Bauwerk trägt. Von oben sind das vier Dinge und keines mehr:

- **International Orange** - die einzige Farbe, die irgendwer mit einer Brücke
  verbindet.
- **Zwei Pylone**, auf einem Viertel und auf drei Vierteln der Länge. Von hier
  oben ist ein Pylon ein Querriegel über der Fahrbahn mit je einem Bein links
  und rechts daneben, und diese Silhouette ist der halbe Wiedererkennungswert.
- **Die Tragseile** an beiden Deckkanten, über die ganze Länge.
- **Die Hänger**, alle zwei Felder ein Strich vom Seil zum Deck. Fünf Pixel
  pro Stück - ohne sie sind die Seile zwei Streifen Farbe.

**Vier gleich breite Spuren, und die Autos liegen mittig darin.**
Durchgezogen in der Mitte, durchgezogen dicht an beiden Rändern, dazwischen je
eine gestrichelte - fünf Striche im gleichen Abstand, bis auf die beiden
äußeren, die an der Bordkante sitzen. Gemessen: 66, 62, 62, 66 Pixel.

Damit das aufgeht, liegen die Fahrspuren des Motors auf einem **Viertel** und
**drei Vierteln** der halben Fahrbahn (vorher 0,3 und 0,74). Das ist die Mitte
jeder Spur, wenn man die Fahrbahn in vier gleiche teilt - und genau dorthin
zielt der Verkehr. Gerechnet wird mit der **Fahrbahn**breite, nicht mit der
Deckbreite: Das Deck ist um die Schulter breiter als die Felder, und mit ihm
gerechnet lagen die Striche neben den Autos.

Dazu hält der Verkehr auf der Brücke jetzt **Spur**: Draußen auf dem Land tut
er es nicht, weil eine Landstraße schwingt und ein Auto, das dort einer Spur
hinterherfährt, die ganze Strecke quer über die Fahrbahn wandert. Eine Brücke
schwingt nicht - sie ist das einzige kerzengerade Stück Landstraße. Gemessen,
fünf Fahrzeuge auf dem Deck: alle auf ±36 oder ±89 Pixel zur Mitte, also genau
in den vier Spuren, die dort gemalt sind.

**Orange ist dabei das Tragwerk, nicht die Straße.** Das ganze Deck orange
anzumalen ergibt ein rotes Rechteck mit Autos darauf; was man von oben sieht,
ist eine graue Fahrbahn mit einem orangen Träger an jeder Seite - samt
Mittelstrich, denn es ist eine Straße.

**Und der Träger ist der äußere Rand.** Das war er zuerst nicht: Eine
Landstraße wird nicht Feld für Feld gemalt, sondern als Band entlang ihrer
Linie gezogen, `ROAD_COVER` breiter als die Felder, die ihr gehören, und mit
einem Randstreifen noch weiter außen. An den Feldern gemessen kam das Tragwerk
schmaler heraus als die Straße, die es tragen soll - eine halbe Spur Asphalt
hing über die Kante.

Die erste Lösung war, das Deck über das ganze Band zu ziehen; das machte die
Brücke aber breit wie eine Landebahn. Jetzt ist sie so breit wie die Fahrbahn
plus eine Schulter von zehn Pixeln, und was die Straße darüber hinaus gemalt
hat - Bankett und Staubstreifen - wird wieder zu **Meer** übermalt. Über Wasser
gibt es keinen Randstreifen.

**Und dafür läuft die Straße jetzt senkrecht.** Ein Träger ist gerade; eine
Straße, die sich über die Brücke hinweg um ein Feld verzieht, lässt sich nicht
damit einfassen, ohne dass der Asphalt irgendwo neben dem Tragwerk liegt. Zwei
Kleinigkeiten regeln das:

- **Vier Punkte auf derselben Spalte** statt zweier. Die Kurve, die `bend` aus
  drei Punkten macht, lief sonst noch in die Brücke hinein; jetzt liegt der
  ganze Bogen nördlich des Wassers und über dem Kanal ist die Linie schnurgerade.
- **Die Spalte ist 95,5 und nicht 95** - also die _Mitte_ einer Spalte. Eine
  fünf Felder breite Straße, die auf einer Feldgrenze liegt, deckt sechs
  Spalten zur Hälfte ab; auf einer Feldmitte deckt sie fünf ganz. Gemessen:
  Deck jetzt exakt Spalte 93 bis 97, Reihe für Reihe.

Das Bild liest die Felder trotzdem vom Boden ab - es soll ja nichts behaupten,
was man nicht befährt - nimmt dann aber die Spalten, die das Deck **die meiste
Zeit** hat. Sonst verspringt der Träger dort um ein Feld, wo die Küste einen
Zahn hat.

## Die zweite Hängebrücke, und sie trägt auch die Bahn

Vor San Fierro queren Straße und Eisenbahn dasselbe Wasser, dicht
nebeneinander. Beides lief vorher **schräg** hinüber, und schräg heißt hier:
als Treppe aus Feldern. Eine Treppe lässt sich nicht mit geraden Trägern
einfassen, also bekam diese Querung auch kein Bauwerk.

Jetzt laufen beide **senkrecht**:

- Die Straße liegt über dem ganzen Wasser auf Spalte **21,5** - der _Mitte_
  einer Spalte, damit eine fünf Felder breite Fahrbahn fünf Spalten ganz deckt
  (19 bis 23) statt sechs zur Hälfte. Derselbe Trick wie bei der Brücke in der
  Mitte.
- Die Bahn fährt gleich daneben auf Spalte **24** geradeaus durch. Dafür ist
  jetzt auch die Südwestkurve eng (sechs Felder statt achtzehn, wie im
  Südosten): Mit dem weiten Bogen fing die Kurve schon auf Reihe 94,5 an, also
  weit vor dem Ufer. Nachgemessen liegt das Gleis von Reihe 90 bis 108 auf
  Spalte 24, und die Kurve danach vollständig an Land.

Die Auffahrt im Norden hört **auf Reihe 96,5** auf und nicht weiter oben. Das
ist kein Schönheitsmaß, sondern Rücksicht: Ein Stück weiter, und das Band der
Straße frisst sich in den Block an der Hafenkante - die Häuser auf Reihe 92
waren beim ersten Versuch weg, so wie damals die Villa. Eine Landstraße gewinnt
gegen einen Stadtblock, immer.

**Und das Bauwerk ist dasselbe wie in der Mitte, nur kürzer.** Es steht jetzt
nicht mehr auf einem festen Kasten, sondern es gibt eine **Liste** von
Kästen - zwei Stück -, und gezeichnet wird in jedem, was der Boden dort an
Deck hergibt: International Orange, zwei Pylone auf einem Viertel und drei
Vierteln, Tragseile an beiden Kanten, Hänger dazwischen.

Zwei Dinge musste das Bild dafür lernen:

- **Ein Deck kann Schotter tragen.** Welche Spalten Gleis sind, steht im Boden
  (`onRail`) und nicht im Code der Brücke. Über der Fahrbahn liegt Asphalt mit
  fünf Strichen, über dem Gleis Schotter, und ein Rahmen liegt um beides. Die
  Schwellen selbst malt die Bahn wie überall sonst - dafür wandert das Bauwerk
  in der Reihenfolge **vor** die Kulisse, sonst läge das Gleis unter dem
  Pylon statt darauf.
- **Die Mitte der Striche ist die Mitte der Felder**, nicht die des gemalten
  Kastens. Auf der Seite ohne Gleis kommt eine Schulter dazu, auf der anderen
  nicht; um deren halbe Breite lagen sonst alle fünf Striche daneben.

Gezeichnet wird außerdem nur der Teil, auf dem das Deck seine **volle Breite**
hat. Wo die Küste einen Zahn hat, hört das Bauwerk auf und die gewöhnliche
Brückenkante macht weiter - das ist das kurze hellere Stück vor jedem Ufer.

Nachgemessen: Die Straße ist von Reihe 96 bis 113 durchgehend befahrbar, und
unter der Brücke kommt ein Boot auf allen acht Reihen quer hindurch.

## Der Zug von oben

Er war fünf gleiche rote Schachteln mit ein paar Strichen an der Seite - aus
der Entfernung ein Zug, aus der Nähe ein Balken. Jetzt sind es die vier Sachen,
die man an einem Zug von oben überhaupt sieht:

- **Das Dach**, und das ist das meiste davon. Grau, mit Sicken quer alle paar
  Pixel, und es liegt in der **Mitte** statt bis an die Kante: Zieht man es
  nach außen, bleibt vom Rot ein Rahmen und der Zug ist grau. Was zwischen
  Dachkante und Bordkante übrig bleibt, ist die Flanke - und die trägt alles
  Weitere.
- **Die Drehgestelle** an beiden Enden, die seitlich ein Stück über den
  Wagenkasten hinausstehen, mit den Rädern daran. Ohne sie steht ein Zug von
  oben auf dem Boden statt auf Drehgestellen.
- **Das Fensterband** an jeder Flanke: ein durchgehender dunkler Streifen mit
  schmalen Pfosten darin, nicht einzeln gemalte Fenster - die sind auf
  sechsundzwanzig Pixel Breite nur Unruhe. Darin zwei **Türen** je Seite, hell
  und mit einem Spalt in der Mitte; die Tür ist das, was einen Wagen von einem
  Container unterscheidet.
- **Die Übergänge** zwischen den Wagen. Sie sind es, die aus fünf Kästen einen
  Zug machen.

Dazu ein Lüfter auf jedem Wagendach und der weiße Zierstreifen an der
Bordkante.

**Und vorne fährt jetzt eine Lok.** `trainCars` gibt sie ohnehin als Erste
zurück, das Bild hat es bloß nie benutzt. Sie ist dieselbe Zeichnung mit drei
Unterschieden, und genau die drei erkennt man: eine **Nase**, die nach vorn
zuläuft, eine **Frontscheibe** darin und ein **Stromabnehmer** auf dem Dach -
zwei Arme und die Wippe quer darüber, die eine Silhouette, die auch von oben
sofort "Lok" sagt. Dazu zwei Spitzenlichter, die Lüftungsgitter des
Maschinenraums und die zwei Seitenfenster des Führerstands. Fensterband und
Türen hat sie nicht: Dahinter fährt niemand mit.

Alles liegt weiterhin flach auf den Schienen und nicht als stehender Kasten wie
ein Auto. Ein Zug ist auf diesem Maßstab eine Form, die einer Linie folgt, und
ein hoher Kasten würde bei jeder Vorbeifahrt eine halbe Straße verdecken.

## Unter der Brücke durch, und wer einem dabei folgt

Zwei Sachen, die beide am Wasser hängen.

### Schwimmen heißt schwimmen, auch unter einer Brücke

Ein Brückenfeld ist zwei Dinge auf einmal: oben Fahrbahn, unten Meer. Für ein
Boot stand das längst richtig im Code - es fährt hindurch und wird dabei
blasser gezeichnet -, für einen Schwimmer nicht: Der stand plötzlich **oben auf
der Brücke**, sobald er darunter kam.

Das Feld selbst kann die Frage nicht beantworten, also zählt jetzt, **wie man
hingekommen ist**. Der Spieler merkt sich, ob er im Wasser ist:

- Wasser macht nass,
- trockener Boden macht trocken,
- und über einem Brückenfeld bleibt es, wie es war.

Wer vom Ufer auf die Brücke zuläuft, geht oben darüber; wer aus dem Wasser
darauf zuschwimmt, schwimmt unten hindurch. Wer aus einem Boot steigt, liegt im
Wasser - sonst stünde er nach dem Aussteigen unter einer Brücke auf deren Deck.
Gezeichnet wird er dabei genauso abgedunkelt wie das Boot daneben, dieselbe
Zahl für beide.

Nachgemessen: quer durch die Bucht geschwommen, Spalte 15 bis 30, Feld für Feld

- durchgehend `schwimmt = true`, auch auf den sechs Brückenspalten. Und zu Fuß
  von Norden über dieselbe Brücke nach Süden: durchgehend `schwimmt = false`.

### Polizeiboote

**Es gab keine.** Wer mit Sternen ins Wasser ging, war in Sicherheit: Ein
Streifenwagen fährt nicht hinterher, der Hubschrauber kommt erst ab fünf
Sternen, und die Meerenge ist breit. Schlimmer noch - der Wagen am Ufer zählte
in der Quote mit, also schickte die Wache gar nichts mehr nach.

Jetzt gibt es das **Polizeiboot**: derselbe Rumpf wie das Motorboot am Ufer,
silbern wie jeder Streifenwagen, mit blauem Band über der Bordwand und einem
Blaulicht auf dem Steuerstand, das im selben Takt blinkt wie ein Balkenlicht.
Etwas schneller als ein ziviles Boot (320 gegen 290) - wer Land erreicht, ist
es los, und genau das ist die Fluchtmöglichkeit.

Drei Dinge mussten dafür geradegezogen werden:

- **Auf dem Wasser wird anders gezählt.** Dort ist das Aufgebot die Zahl der
  Boote (eins je Stern, höchstens drei), nicht die der Wagen. Ein Streifenwagen
  am Ufer ist gegen jemanden im Kanal so viel wert wie keiner.
- **Ein Rumpf sucht Wasser, wo Räder Asphalt suchen.** Die Ausweichfrage beim
  Lenken hing an der Straße; damit lenkte ein Polizeiboot vom offenen Meer weg
  auf die Kaimauer zu. Aussteigen kann die Besatzung ohnehin nicht - die Tür
  ginge aufs Wasser auf -, also bleibt sie sitzen und schießt vom Deck.
- **Und eine Kugel fliegt über Wasser weiter.** Das war der eigentliche Fehler:
  Wasser galt als Wand für alles, auch für Geschosse, und damit endete jeder
  Schuss am Ufer. Gemessen: zwei Boote haben sechzig Sekunden lang auf einen
  Schwimmer gefeuert und **keinen einzigen Treffer** gelandet; die Kugel schlug
  außerdem sofort ins eigene Deck, weil die Mündung auf einem sechzig Pixel
  langen Boot noch mitten im Boot lag. Beides behoben - jetzt geht die
  Gesundheit eines Schwimmers, der nichts tut, in gut zwanzig Sekunden auf
  null, und man kann auch selbst über das Wasser zurückschießen.

## Echte Boote, und der Steg dazu

Die Boote am Hafen waren **aufgemalt**: drei Formen je Steg, flach auf den
Boden gelegt wie die Bäume im Wald. Sie standen zuletzt zum Teil auf der
Fahrbahn, und das war kein Zeichenfehler, sondern die Folge davon, dass die
Küste eine Formel ist und die Stege drei feste Rechtecke waren. Als sich die
Uferlinie verschob, trafen sie sie nicht mehr: Der nördliche endete mitten im
Sand, dreißig Meter vom Wasser entfernt, und der südliche lief quer über die
Küstenstraße - die gewinnt (`onPier` wird nach `onRoute` gefragt), also blieben
von ihm zwei Stummel mit Asphalt dazwischen. Genau dort lagen dann die Boote.

Jetzt laufen alle drei Stege von der Kaimauer über Wasser, das auch da ist -
zwei an der Westseite der Bucht, einer an der Ostseite -, und an jedem liegen
drei **echte** Boote: einsteigen, losfahren, aussteigen. Neun Stück, alle im
Wasser (nachgemessen, auch nach einer Minute Simulation).

**Ein Boot ist ein Auto mit umgedrehter Karte.** Alles andere in dieser Stadt
behandelt Wasser als Wand und Asphalt als Boden; das Boot genau andersherum,
und mehr ist der Unterschied nicht. Dafür beantwortet `clears` jetzt drei
Fragen statt einer:

| wer      | kommt durch                                          |
| -------- | ---------------------------------------------------- |
| `wheels` | überall außer Wasser, Wand, Zaun                     |
| `feet`   | dasselbe, **und** ins Wasser (dort wird geschwommen) |
| `hull`   | **nur** Wasser                                       |

Alles andere fällt damit von selbst an: Einsteigen ist dasselbe Einsteigen,
das HUD zeigt „Motorboot" und das Blech des Boots, die Polizei kann nicht
hinterherfahren, und wer mitten auf dem Wasser aussteigt, schwimmt. Der
Verkehr fasst Boote nicht an - sie sind `parked` und stehen in keiner der
Listen, aus denen die Stadt ihre Wagen zieht.

Gezeichnet wird es eigens (`boatHull`) statt über das Wand-und-Dach-Modell der
Autos: ein Rumpf, der vorn spitz zuläuft und hinten quer abgeschnitten ist, die
weiße **Scheuerleiste** rund um den Bord (das eine Detail, an dem man ein Boot
erkennt, bevor man die anderen gelesen hat), ein Vordeck mit Luke, eine offene
**Plicht** mit zwei Sitzen und dem Steuerstand, die Scheibe quer davor, ein
Handlauf ums Vordeck und der **Motor** am Spiegel - dort, wo der Lärm und das
Kielwasser herkommen. Gemessen: aus dem Stand in zweieinhalb Sekunden auf die
Höchstfahrt von 290, und an der gegenüberliegenden Küste ist Schluss.

**Und das Wasser dahinter sind drei Sachen, weil ein Boot drei macht.** Zwei
Striche waren keine davon:

- **Der Schraubenstrudel** direkt hinter dem Spiegel: vier Scheiben Schaum,
  jede in eigener Größe und mit eigenem Takt, damit es kocht statt zu pulsieren.
  Das ist das Stück, das man tatsächlich anschaut.
- **Die Spur**, was davon übrig bleibt: überlappende Flecken, die nach hinten
  breiter, blasser und unruhiger werden. Kielwasser ist gebrochenes Wasser und
  kein gemalter Streifen.
- **Die Bugwelle**: zwei Kurven, die am Steven losgehen und sich nach achtern
  öffnen - der Keil, den jeder Rumpf vor sich herschiebt. Kurven und keine
  Geraden, denn das Wasser biegt am Bug nicht um die Ecke.

Alles drei ist ein weicher Verlauf und skaliert mit dem Tempo; am vertäuten
Boot ist nichts davon da. Zwei Fallen dabei, beide schon einmal dagewesen: Der
äußere Farbstopp muss **durchsichtiges Weiß** sein und nicht durchsichtiges
Schwarz, sonst läuft der Verlauf durch Grau - und ein Verlauf muss **nach** dem
Verschieben gebaut werden, sonst malt er den Fleck mit seinem eigenen
durchsichtigen Ende, also mit gar nichts.

## Schwimmen, und wie man wieder auftaucht

Wasser war eine Wand: `isOpen` sagt Nein zu `water`, und damit war der Hafen
eine Linie, an der man stehen blieb. Jetzt ist es eine Wand für alles mit
Rädern und für alles, was geworfen wird - und keine für einen Mann zu Fuß. Er
geht hinein und schwimmt.

Der Schalter dafür ist ein einziges Wort: `clears(cells, at, high, wet)`. Nur
`walk` setzt es, alles andere in der Stadt fragt wie bisher. Wer im Wasser ist,
schwimmt - abgeleitet und nicht gemerkt, denn man schwimmt, weil man im Wasser
ist, und in der Sekunde, in der man es nicht mehr ist, auch nicht mehr.

**Tempo:** 52 Pixel je Sekunde an der Oberfläche gegen 130 an Land, also zwei
Fünftel. Wasser ist nicht ein Boden, auf dem man nass wird: Es ist langsam, und
langsam zu sein ist genau das, was aus „wegschwimmen" eine Entscheidung macht
statt einer Flucht. Unter Wasser sind es 66 - man zieht sich, statt zu paddeln,
und das ist neben dem Ausweichen der einzige Grund zu tauchen.

**Die Leertaste taucht**, solange man sie hält; loslassen heißt auftauchen. An
Land ist dieselbe Taste weiterhin der Jetpack - in eine Straße kann man nicht
tauchen.

Zwei Folgen, die kein Extra sind, sondern sich aus „unter Wasser" ergeben:

- **Schüsse gehen über einen Taucher hinweg.** Über seinem Kopf ist Wasser,
  und das ist der ganze Grund, warum man untergeht.
- **Geschossen wird im Wasser nicht**, weder oben noch unten: Eine Hand hält
  die Waffe hoch, die andere hält einen selbst oben. Es verhindert auch, dass
  der Hafen ein Graben wird, aus dem man in Ruhe feuert.

Gezeichnet ist es zweimal dieselbe Figur. **Oben** wird sie an der Wasserlinie
abgeschnitten - Kopf, Schultern, Arme, mehr sieht vom Kai aus niemand -, und
zwei Ringe Kielwasser atmen um sie herum. **Unten** wird nichts abgeschnitten:
Da ist er ganz, nur blass, durch einen Faden Hafenwasser gesehen, und drei
Blasen steigen an ihm vorbei nach oben. Die Ringe sitzen dabei an der
**Wasserlinie** und nicht an seinen Füßen - die liegen in dieser Ansicht ein
Stück unter ihm, und Ringe dort unten lesen sich als Mann über einer Pfütze.

## Schlagring und Schlagstock stehen im Regal

Beide gibt es nicht mehr: Sie liegen nicht herum, die Läden verkaufen sie
nicht, niemand trägt einen, und der Cheat gibt keinen aus. Gelöscht ist
allerdings nichts - die Zeile in `WEAPONS`, der Preis, das Bild in der Hand und
vor allem der **Platz im Gürtel** sind genau da, wo sie waren. Ein Name weniger
in `SHELVED`, und sie sind wieder im Spiel.

Der Platz muss bleiben: Der Gürtel ist ein Feld, das über `WEAPON_ORDER`
indiziert wird, und jeder je gespeicherte Spielstand ist genauso indiziert.
Diese Reihenfolge zu kürzen hieße, jedem stillschweigend die Munition von
jemand anderem in die Hand zu drücken. Gemessen: zehn Plätze wie vorher,
Pistole weiterhin auf Platz vier, null verbannte Waffen im Umlauf.

## Der Strahl hört am Fadenkreuz auf

Der Flammenwerfer sprühte immer volle Reichweite. Das ist die falsche Waffe:
Man hält den Abzug und **streicht** damit über das, was vor einem steht - und
ein Strahl, der immer hundertzwanzig Pixel weit geht, lässt sich nicht auf die
Tür zwei Schritte weiter legen. Jetzt geht er dorthin, wohin man zeigt,
gedeckelt durch die Reichweite der Waffe und mit einem Mindestmaß nach unten,
denn ein Stoß auf die eigenen Stiefel ist immer noch ein Stoß. Dieselbe Regel
hat die Granate schon immer gehabt.

Gemessen: Klick 40 Pixel entfernt -> Strahl 34, Brandstellen bis 47; Klick 70
-> 58 und 73; Klick 120 -> 108 und 120; Klick 300 -> gedeckelt auf 120.

Das zog eine zweite Sache nach sich, und die ist der eigentliche Punkt: Ein
Geschoss muss wissen, **wie weit es gehen wollte**. `left` zählt herunter, also
kam ein kurzer Stoß mit einem `left` aus der Düse, das gegen die vollen
hundertzwanzig gerechnet schon fast aufgebraucht aussah - er kam dumpfrot und
fett heraus statt weiß und schmal. Jedes Geschoss trägt jetzt sein `reach` mit,
und die Farben laufen über **seine** Länge. Zwei Schritte Feuer sind damit
dasselbe Feuer wie zehn, nur kürzer.

## Der Boden brennt weiter

**Ein Flammenwerfer hört nicht auf, wo der Strahl aufhört.** Der Treibstoff
verschwindet nicht - er landet, bleibt liegen und brennt weiter, und genau das
ist der Grund, warum die Waffe etwas taugt: Man kann einen Durchgang
abschneiden oder einen Gehweg absprühen und zusehen, wer dort aus dem Feuer
kommt statt hindurch.

Jedes Geschoss, das seine Reichweite erreicht oder etwas trifft, legt eine
Brandstelle (`Fire`): sechs Sekunden Brenndauer, siebzehn Pixel Hitzeradius,
sechsundzwanzig Lebenspunkte je Sekunde für jeden, der darin steht. Gemessen:
Spieler 200 -> 174 in einer Sekunde, Passant 100 -> 87 in einer halben.

Zwei Dinge, ohne die das sofort aus dem Ruder läuft:

- **Brandstellen verschmelzen.** Eine neue innerhalb von dreizehn Pixeln füllt
  nur die alte wieder auf. Fünfundzwanzig Schuss pro Sekunde wären sonst
  fünfundzwanzig Brandstellen pro Sekunde, und eine Feuerwand mit Lücken, durch
  die man hindurchläuft, ist keine.
- **Es sind höchstens hundertsechzig**, die ältesten fallen hinten heraus.

Es zählt für alle zu Fuß - die Passanten, die Polizei und den Mann mit der
Waffe, der in seinem eigenen Feuer nichts verloren hat. Wer in einem Auto
sitzt, sitzt in einem Auto; das brennt nicht, weil die Straße darunter brennt.

Gezeichnet wird eine Brandstelle als **drei Zungen nebeneinander**, jede mit
eigener Größe und eigenem Takt: Drei Flammen auf demselben Fuß sind ein Klumpen
mit heller Mitte, drei ein paar Pixel auseinander sind ein Feuer. Darunter
glüht der Asphalt, und in der letzten Sekunde werden die Zungen kleiner und
dünner - Feuer geht aus, es schaltet sich nicht ab.

Eine Flamme ist dabei ein **Tropfen, kein Kegel**: unten rund und dick, wo der
Brennstoff liegt, nach oben in eine Spitze gezogen, die der Zug zur Seite
weht. Und unten ist sie **gewölbt** - ein Pfad, den man einfach schließt,
bekommt einen geraden Strich als Boden, und eine Flamme mit flachem Boden ist
ein Zelt.

**Und eine Sache, die jede Flamme in diesem Spiel verschmutzt hat:** Ein
Verlauf interpoliert die Farbe mit, also lief „Orange nach durchsichtigem
**Schwarz**" unterwegs durch ein dreckiges Grau - jedes Feuer hatte einen
Rußschleier um sich, den niemand gezeichnet hatte. Jetzt endet jeder Verlauf
auf seiner eigenen Farbe mit Alpha null, und da bleibt nichts mehr übrig.

## Feuer ist keine Kugel

Der Flammenwerfer warf **Blasen**: zwei flache Kreise, ein oranger mit einem
gelben darin, die mit der Entfernung wuchsen. Von oben sah das aus wie ein
Schlauch, aus dem Seifenblasen kommen. Was einen brennenden Treibstoffstrahl
wie einen aussehen lässt, sind vier Dinge, und keines davon kostet etwas:

- **Es ist eine Zunge, keine Scheibe.** Jede wird entlang der Flugbahn
  gestreckt und um ihre halbe Länge hinter den Kopf des Geschosses geschoben,
  damit sie nachzieht statt vorauszulaufen.
- **Es brennt von innen nach außen.** Weiß an der Düse, dahinter gelb, weiter
  draußen orange, am Ende dumpfes Rot - jede Farbe stirbt auf ihrer eigenen
  Entfernung. Das ist die Reihenfolge, in der die Farben eines echten Feuers
  laufen, und der Grund, warum man die Reichweite der Waffe sieht, ohne dass
  sie irgendwo steht.
- **Kein Rand.** Jede Zunge ist ein weicher Verlauf und keine Form mit einer
  Kante - Feuer hat keine Kontur, und genau das war an den zwei Kreisen falsch.
- **Das Licht addiert sich** (`lighter`): Wo zwei Zungen übereinanderliegen,
  wird die Leinwand heller, statt dass eine die andere verdeckt. Das ist es,
  was aus fünfundzwanzig einzelnen Schüssen pro Sekunde **einen** Strahl macht.

Dazu flackert jede für sich: Die Nummer des Geschosses setzt die Phase, die Uhr
treibt sie. Eine Reihe gleich großer Klumpen ist eine Perlenkette; dieselbe
Reihe, die leicht gegeneinander atmet, ist eine Flamme.

Und ganz am Ende hört es auf, Feuer zu sein, und wird **Rauch**: grau, breiter,
und normal gezeichnet statt addiert - Rauch nimmt Licht weg, statt welches zu
geben.

## In der Kurve legt sich alles, was fliegt, auf die Seite

**Nichts in der Luft dreht flach.** Ein Flugzeug fliegt eine Kurve, indem es
sich legt - der Flügel ist es, der es herumzieht, also muss er gekippt werden,
damit der Zug zur Seite zeigt -, und ein Hubschrauber macht mit seinem Rotor
dasselbe. Beide sind vorher wie Pappaufsteller über den Tisch geschoben worden.

Gerechnet wird es wie beim **Motorrad**: Drehrate mal Tempo ist der seitliche
Zug, und dagegen legt sich die Maschine; gedämpft statt gesetzt, damit sie sich
in die Kurve hineinlegt und wieder heraus, statt in dem Bild umzuklappen, in
dem eine Taste gedrückt wird. Gemessen: Flugzeug 34 Grad, Hubschrauber 32 Grad,
jeweils bei Vollgas und vollem Ausschlag, und zurück auf null, sobald es
geradeaus geht.

Gezeichnet wird es ebenfalls wie beim Motorrad, denn diese Ansicht kann ein
Bild nicht kippen. Also die zwei Dinge, die man von oben tatsächlich sähe:

- **Die Spannweite wird kürzer.** Ein um dreißig Grad gekippter Flügel zeigt
  einem, der von oben schaut, ein Sechstel weniger von sich - das ist der
  Kosinus, und mehr ist es nicht.
- **Die Maschine rutscht in die Kurve**, so wie das Motorrad neben seinen
  eigenen Reifen landet.

Beides wird in dem Rahmen angewendet, der schon entlang der Nase zeigt, also
heißt „quer" quer zur Maschine, egal wohin sie gerade fliegt.

## Rückwärts rollen kann nur das Flugzeug

Ein Flugzeug hat keinen Rückwärtsgang - es hat einen Schlepper, oder einen
Piloten, der mit eingeschlagenem Bugrad kurz Gas gibt. Beides läuft auf
dasselbe hinaus: Man kommt rückwärts vom Fleck, und zwar im Schritttempo.
Siebzig Pixel pro Sekunde sind ein Dreizehntel dessen, was es vorwärts macht -
genug, um vom Vorfeld wegzukommen oder aus dem herauszurollen, in das man
hineingerollt ist, und weit zu wenig, um damit irgendwohin zu fahren.

Technisch ist es **ein Tempo unter null**, und alles dahinter liest es bereits
so: Die Maschine wird entlang ihrer eigenen Nase bewegt, eine negative Zahl
schiebt sie also rückwärts, und das Aussteigen fragt ohnehin nach dem _Betrag_
(`Math.abs`). Zwei Stellen mussten trotzdem angefasst werden:

- **Die Untergrenze war null.** `Math.max(0, …)` hat jedes Gas nach hinten
  weggeschnitten; jetzt ist sie `-back`, und die steht für den Hubschrauber auf
  null - der dreht sich auf der Stelle und fliegt dann dorthin, wohin er zeigt.
- **Der Luftwiderstand zog in die falsche Richtung.** Er wurde vom Tempo
  abgezogen; bei einem negativen Tempo hätte das die Maschine immer schneller
  rückwärts gewickelt, ohne dass jemand etwas berührt. Er zieht jetzt von
  beiden Seiten zur Null.

Abheben kann man rückwärts nicht: Der Flügel braucht {@link PLANE_LIFT}
**vorwärts**, und minus siebzig ist das nicht. Nachgemessen: drei Sekunden
rückwärts ergeben -70 Pixel pro Sekunde und 196 zurückgelegte Pixel, Höhe null;
Gas weg heißt ausrollen bis null; danach Vollgas vorwärts wieder 850 und auf
Höhe. Der Black Hawk steht bei derselben Probe unverändert still.

## Der Rotor, der den Flug auffraß

Einsteigen ging, Gas geben ging, losfliegen nicht: Flugzeug und Hubschrauber
standen mit offener Klappe da und rührten sich nicht vom Fleck. Gemessen -
vier Sekunden Vollgas im Flugzeug, danach **drei** Pixel pro Sekunde und
derselbe Platz auf dem Vorfeld. Drei Pixel sind genau eine Bildlänge
Beschleunigung: Jeder Frame fing wieder bei null an.

Schuld war eine Zeile am Ende von `flyChopper`, die eigentlich nur die Rotoren
der Maschinen anhalten sollte, in denen niemand sitzt:

```ts
} else if (state.choppers.some((machine) => machine.spin !== 0)) {
  next = { ...state, choppers: state.choppers.map(/* ... */) };
}
```

`...state` - also der Stand **vor** dem Flugschritt, den die vierzig Zeilen
darüber gerade berechnet hatten. Und die Bedingung fragte alle Maschinen, auch
die geflogene: Deren Rotor dreht sich, sobald man drinsitzt, also lief der Zweig
in jedem einzelnen Frame und setzte die Maschine jedes Mal dorthin zurück, wo
der Frame sie gefunden hatte. Position, Tempo, Höhe - alles wieder auf Anfang.

Jetzt baut die Stelle auf `next` auf statt auf `state` und fragt nur nach
Maschinen, in denen **niemand** sitzt. Nachgemessen, vier Sekunden Vollgas:
Flugzeug 680 Pixel pro Sekunde, 1366 Pixel Startstrecke, 81 Pixel hoch;
Hubschrauber 460 und auf Reiseflughöhe. Im Browser geflogen und fotografiert.

## Der Flughafen ist eingezäunt, und die Flugzeuge fliegen

Zwei Sachen, die zusammengehören: Ein Flugfeld, auf das man von jeder Seite
fahren kann, ist ein Parkplatz mit einer Landebahn darin, und zwei aufgemalte
Flugzeuge darauf sind Tapete.

**Lang und schmal, wie ein Flugfeld.** Vorher war es ein Quadrat aus Beton,
dreiunddreißig Felder breit, mit einem Stummel Landebahn darin - und eine
Landebahn ist das eine auf einer Karte, das **lang** sein muss; eine, die in
einen Stadtblock passt, ist ein Rollweg mit Markierung. Jetzt beginnt es unter
dem Gefängnis, an der Straße, die dort nach Süden läuft, und reicht nach Osten
bis an den Kartenrand: zweiundsechzig Felder, ein Drittel der Stadt, und elf
tief statt neunzehn. Das östliche Ende steht auf aufgeschüttetem Land im
Wasser - da, wo ein Küstenflughafen seine Bahn ohnehin hinbaut. Die drei
Blöcke, die im Weg standen - ein Wohnhaus, ein Waffenladen und das Casino
unter dem Gefängnis -, sind damit weg; dafür ist der Streifen, auf dem vorher
das alte Feld lag, wieder Stadt.

**Der Zaun ist derselbe Draht wie am Militärgelände.** `onAirportFence` hat
dieselbe Form wie `onFence` - Rand des Rechtecks, minus der Toröffnung -, und
weil die Felder darunter `fence` heißen, hält derselbe Boden das Auto auf, der
auch die Kaserne umschließt. Das Tor liegt an der **Westkante**, am
Stadtende: Das Feld läuft vom Gefängnis bis ans Meer, die einzige Seite, von
der überhaupt jemand kommt, ist die nahe. Drei Felder breit, damit ein
Transporter hineinpasst, und davor liegt Straße. Gemessen: Westkante
`##...######`, die anderen drei Kanten durchgehend zu, null Gebäude im
Flughafenbereich, Gefängnisausgang unberührt.

Das Bild zeichnet den Zaun schon - es musste nur lernen, dass es jetzt drei
Rechtecke gibt, um die Draht laufen kann: Gefängnis, Kaserne, Flugfeld.

**Und die Flugzeuge sind echte Maschinen**, keine Grundrisse mehr: drei
Einträge in `state.choppers`, dieselbe Liste, in der auch der Militär- und die
vier Rettungshubschrauber stehen. Einsteigen, fliegen, landen, aussteigen -
alles dieselben vier Funktionen, die es schon gab. `drawPlanes` und sein
Grundriss sind ersatzlos weg.

Was ein Flugzeug von einem Hubschrauber unterscheidet, sind acht Zahlen in
`flightOf` und **eine** davon ist die eigentliche:

- **Ein Flügel trägt nur, was sich bewegt** (`PLANE_LIFT`). Unter 430 Pixeln
  je Sekunde tut die Leertaste gar nichts und die Maschine sinkt. Genau das
  macht die Landebahn zu etwas, das man braucht, statt zu einem bemalten
  Streifen Beton.
- Neunhundert Pixel je Sekunde Spitze - doppelt so schnell wie der
  Hubschrauber, dreimal so schnell wie ein Auto -, dafür träge im Kurvenflug
  und mit Gas weg rollt sie weiter, statt in der Luft stehen zu bleiben.
- Und aussteigen kann man erst, wenn sie steht (`PLANE_STOP`): Ein Rad am
  Boden bei zweihundert Pixeln je Sekunde ist ein Landelauf, und wer da
  aussteigt, fällt heraus.

Gemessen: Vollgas mit gezogenem Knüppel vom Vorfeld - abgehoben nach 2,6
Sekunden bei 436 Pixeln je Sekunde, nach vierzehn Sekunden auf der Decke von
210 und mit Höchstfahrt unterwegs; Aussteigen in der Luft wird abgelehnt.

**Und sie haben Blech wie ein Auto.** `Chopper.health`, `flyerHealth` je Sorte

- die olive Maschine ist gepanzert (220), der Rettungshubschrauber ein Bus mit
  Rotor (140), das Flugzeug Blech, das gut geformt ist (110). Wer oben getroffen
  wird, verliert nicht selbst Gesundheit, sondern die Maschine verliert Blech:
  dieselbe Regel wie im Auto, und erst damit bedeutet der Balken in der Ecke
  etwas. Bei null steigt sie nicht mehr - kein Motor, kein Auftrieb -, sie sinkt,
  und was unten ankommt, fliegt auseinander. Eine Tür gibt es in der Luft nicht,
  die Antwort auf Beschuss ist also, herunterzukommen, **bevor** der Balken leer
  ist.

Dieselbe Ecke zeigt beides: `carOf` oder die geflogene Maschine, Name und
Balken aus derselben Zeile. Vorher stand im Flug die Waffe da - „Faust", über
einem Balken, der zur Faust gehörte.

**AIRPORT steht auf dem Vorfeld**, nicht auf der Bahn: Auf eine Landebahn
gehört die Mittellinie und sonst nichts. Flach auf den Beton gelegt, so wie
die Zahl auf einer Schwelle - aus dieser Kamera ist ein Schild auf einem
Mast ein Mast.

## Das Rathaus ist aus Backstein, und es ist umgezogen

Zwei Dinge an einem Gebäude, das vorher ein graues Rechteck mit einem Schild
war.

**Gemauert statt gestrichen.** Jede andere Front dieser Stadt ist eine Fläche
in einer Farbe, und für einen Laden oder einen Büroklotz ist das richtig: Die
sind Putz und Glas und haben nichts weiter zu erzählen. Ein Rathaus ist das
älteste Haus der Straße, also bekommt es die drei Dinge, die man ihm ansieht -
**rote Ziegel**, den **Stein** unten und unter der Traufe, und die
**Fensterläden**. Alles drei ist billig in dieser Größe: Der Backstein sind
zwei Durchgänge (erst die Lagerfugen, dann die Stoßfugen, jede zweite Reihe um
einen halben Stein versetzt - das ist es, was eine Wand als Mauerwerk lesbar
macht und nicht als liniertes Papier), der Stein sind zwei Bänder und zwei
Lisenen, und ein Laden ist ein Rechteck mit zwei Lamellenstrichen darin.

Die Läden sind **grün** und stehen **offen**, also neben der Öffnung an der
Wand und nicht davor: Ein Laden über dem Glas ist ein geschlossener, und ein
Rathaus mit geschlossenen Läden ist ein Rathaus, in dem niemand arbeitet. Jeder
ist halb so breit wie das Fenster, denn genau das ist ein Fensterladen - zwei
davon decken zu.

**Zwei Geschosse unter einem Satteldach.** Die Höhe ist eine Zahl und kein
Würfel (`flat`, sechsundfünfzig Pixel = zwei Geschosse zu {@link STOREY}), und
darüber liegen zwei Dachflächen aus rotem Ziegel mit Giebel an beiden Enden -
dasselbe `pitchedRoof`, das die Wohnhäuser tragen, nur mit einer zweiten
Deckung: Schiefer für die Stadt, Ton für das eine Haus, das älter ist als sie.
Alles andere mit einem Schild über der Tür hat ein Flachdach, weil alles andere
mit einem Schild über der Tür in diesem Jahrhundert gebaut wurde.

**Kein Gaubenfenster und kein Schild.** Die Wohnhäuser haben eins im Giebel,
weil dort oben ein Zimmer ist; hier stand es zu drei Pixeln hinter dem Namen,
und ein Fenster, das man nicht erkennt, ist ein Fleck im Mauerwerk. Und der
dunkle Balken unter dem Namen ist ein **Schild**, das man an eine Attika
schraubt - so etwas hat jedes flachgedeckte Haus hier und ein Rathaus gerade
nicht. Der Name steht jetzt direkt auf dem Giebel, mit einer dunklen Kontur
um die Buchstaben, damit er auch vom gegenüberliegenden Gehweg zu lesen ist.

Dabei fiel ein alter Fehler auf: Jedes Haus bekommt beim Zeichnen ein Zehntel
Höhe auf oder ab, damit Doppelhäuser und Reihen nicht wie gestanzt aussehen -
und das traf auch die Häuser, deren Höhe ein **Maß** ist. Aus den
sechsundfünfzig Pixeln des Rathauses wurden siebenundvierzig, also eine Reihe
Fenster statt zweier und viel leerer Backstein darüber. Beim Krankenhaus
verschob es stiller: Das gezeichnete Dach lag nicht mehr auf der Höhe, auf der
`roofAt` den Jetpack landen lässt. Wer eine feste Höhe hat, behält sie jetzt.

**Und es steht fünf Felder weiter hinten.** Es stand in der letzten Blockreihe
vor dem Strand: Wiese dahinter, und daneben eine Straße, die von der
Hauptstraße hereinkam, außen am Flughafenzaun entlanglief und im Sand aufhörte.
Eine Straße, die ein Gebäude bedient und dann endet, ist keine Straße, sondern
eine Einfahrt.

Also haben Haus und Wiese **getauscht** - das kostet das Viertel nichts -, und
die Einfahrt gehört jetzt zum Gebäude, das deshalb fünf Felder breit ist statt
drei.

**Und dann haben Haus und Straße noch einmal getauscht.** Westlich des Hauses
lief die Stadtautobahn vorbei und hörte hundert Meter weiter südlich im Sand
auf - ein Stummel, der nirgends hinführte. Das Rathaus steht jetzt genau dort,
und die Straße läuft da, wo das Rathaus stand: von der Kreuzung hinunter bis an
den Strand. Dieselben zwei Streifen, nur vertauscht; die Autobahn endet
einfach eine Kreuzung früher. Das Feld am Zaun bleibt Gehweg: Ein Zaun ohne
Fußweg daneben ist ein Zaun, an dem man nicht vorbeikommt.

Am Straßen**raster** ändert das nichts, und das ist der Grund, warum es
überhaupt geht: Der Verkehr liest den **Boden** und nicht die Formel
(`isRoadAt`), und ein Fahrer, der vor sich keine Straße mehr findet, biegt in
das ab, was offen ist - genau das, was an diesem Stummel schon immer passierte,
nur zehn Felder weiter nördlich. Nachgemessen über neunzig Sekunden mit dem
Spieler daneben: fünfzehn Fahrzeuge im Bereich, acht davon in zehn Sekunden
unterwegs, keines in einer Wand - vorher waren es vierzehn, von denen sich
drei bewegten.

Drei Kleinigkeiten, an denen so ein Umzug sonst hängen bleibt:

- **Eine Antwort, nicht zwei.** Das neue Rechteck kommt aus `builtPlot` selbst.
  Alles, was fragt, wo dieses Haus steht - der Boden, das Bild, die Tür, die
  Parkplatzsuche -, fragt dieselbe Funktion und bekommt dasselbe Rechteck.
- **Der Boden wird vor den Straßen gefragt**, genau wie beim Gefängnis und bei
  der Villa: Eine der Straßen dort ist ja die geschluckte Einfahrt, und
  andersherum gefragt hätte die Straße gewonnen und liefe durch das Gebäude.
- **Die Tür sitzt an der Wand, nicht im Block.** Gewöhnliche Türen sind ein
  fester Abstand innerhalb des Blocks - richtig für ein Haus, das dort steht,
  wo sein Block es hinstellt. Dieses ist fünf Felder zurückgerückt, und der
  feste Abstand hätte seine Tür draußen im Sand gelassen.

Nachgemessen: Gebäude auf den Feldern 100-104 × 147-151, Gehweg rundherum,
Wiese davor bis zum Strand, keine Straße mehr am Zaun - und weder ein Auto noch
ein Passant steht in der Wand.

## Der DeLorean hat Flügeltüren

Eine Tür ist hier ein Stück Wand: ein Blatt, das an seiner Vorderkante
angeschlagen ist und um {@link DOOR_SWING} nach außen schwingt. Für einen
DMC-12 ist das falsch, und zwar auf eine Art, die man sofort sieht - das Auto
ist wegen dieser Türen berühmt.

Also hat er sein eigenes Blatt. Es hängt nicht an der A-Säule, sondern am
**Dachfirst**: Es läuft von der Mitte des Dachs nach außen über die Flanke und
klappt um diese Linie **nach oben**. Die Zeichnung des Dachs macht das ohnehin
schon vor - `dmcTop` malt es als zwei Platten mit einem erhabenen Streifen
dazwischen, weil ein Dach mit Flügeltüren genau so aussieht -, und die offene
Tür ist eine dieser beiden Platten, angehoben.

Ein Detail, das nur an dieser Tür hängt: **Sie wird immer zuletzt gezeichnet.**
Bei allen anderen entscheidet die Fahrtrichtung, ob die Tür vor oder nach der
Karosserie drankommt - ohne Tiefentest zeichnet ein Wagen, der nach Osten
zeigt, seine Tür sonst quer durchs eigene Dach. Ein Flügel steht **über** dem
Dach, also kann nichts am Auto davor sein, egal wohin die Nase zeigt.

## Der Black Hawk ist ein Panzer, der fliegt

Die olivgrüne Maschine auf dem Militärgelände heißt jetzt **Black Hawk** und
trägt dieselben zwei Waffen wie der Panzer, an denselben zwei Tasten: linke
Maustaste eine Rakete, rechte Maustaste hält das Maschinengewehr am Laufen.
Beide schießen dorthin, wohin die **Maschine** zeigt, nicht aufs Fadenkreuz -
genau wie beim Panzer, wo das Zielen darin besteht, das ganze Ding
auszurichten.

Dafür mussten `fireShell` und `fireCoax` nur eine Kleinigkeit abgeben: Sie
bekamen vorher den Panzer und lasen `tank.turret` heraus, jetzt bekommen sie
**den Winkel**. Ein Hubschrauber hat keinen Turm, den man auslesen könnte, er
hat eine Nase - und eine Funktion, die nach einem Winkel fragt, kann beide
bedienen. Der Rest ist die Kette in `shoot`: ein Zweig mehr für den Auslöser,
ein Zweig mehr für den Dauerfeuer-Knopf.

Die anderen beiden Maschinen bleiben unbewaffnet, und zwar mit Absicht: Ein
Rettungshubschrauber mit Bordkanone ist kein Rettungshubschrauber, und das
Flugzeug ist ein Weg über die Karte. Nachgemessen - Black Hawk: eine Rakete im
ersten Frame, vierzehn MG-Geschosse in zwei Sekunden; Rettungshubschrauber und
Flugzeug: null und null. Der Panzer feuert unverändert: eine Granate, sechzehn
MG-Geschosse.

Nebenbei sagt der Einsteige-Knopf jetzt, was da steht (`flyerName`), statt
„Hubschrauber" über einem Flugzeug.

## Aus einem Hubschrauber werden fünf

`GameState.chopper` war **eine** Maschine, weil es eine gab: die olivgrüne auf
dem Landeplatz des Militärgeländes. Mit einem Rettungshubschrauber auf jedem
Krankenhausdach sind es fünf, also ist daraus `choppers` geworden - eine Liste
mit `id` und `kind` je Maschine - und aus `player.flying` (ob) zusätzlich
`player.chopper` (welche). Beide werden zusammen gesetzt und zusammen gelöscht.

Drei Dinge waren dabei die eigentliche Arbeit, und alle drei kommen daher, dass
diese vier Maschinen **auf einem Dach** stehen:

- **„Gelandet" heißt auf dem, was darunter ist.** `roofAt` sagt, wie hoch das
  Dach über einem Punkt ist - dieselbe Zahl, mit der der Jetpack auf Dächern
  landet -, und Einsteigen, Aussteigen und das Sinken klemmen jetzt darauf
  statt auf null. Vorher hätte der Motor gesagt: Die Maschine ist
  vierundachtzig Pixel über dem Boden, also in der Luft.
- **Einsteigen fragt auch nach der eigenen Höhe.** Wer unten auf dem Gehweg
  steht, ist zwar waagerecht drei Meter von einer Maschine entfernt, aber eben
  drei Stockwerke darunter. `padUnder` verlangt deshalb, dass Spieler und
  Maschine auf derselben Ebene stehen - was ganz nebenbei die einzige Antwort
  auf „wie komme ich da hoch" ist: Jetpack, oder mit der anderen Maschine.
- **Und sie wird vor ihrem eigenen Haus gezeichnet.** Ihr y ist die Mitte des
  Blocks, auf dem sie steht, also lag sie in der Tiefensortierung _hinter_ dem
  Krankenhaus - gezeichnet, und dann vom Haus übermalt. Steht sie auf einem
  Dach, bekommt sie die Tiefe der Blockvorderkante und kommt damit vor ihr
  eigenes Gebäude, aber hinter alles, was südlich davon steht.

Schießen kann keine der fünf, und das war keine Arbeit: Der fliegbare
Hubschrauber hatte noch nie eine Waffe. Was die Polizei in der Luft hat, ist
eine andere Sache (`state.heli`) und hat mit diesen hier nichts zu tun.

Der Grundriss-Hubschrauber, den das Krankenhaus vorher selbst auf sein Dach
malte, ist weg: Was dort steht, ist jetzt eine echte Maschine aus der Liste -
sonst stünde nach dem Wegfliegen noch ein gemalter da.

## Zwei Streifen, nicht drei

Am Krankenwagen laufen genau zwei rote Streifen die Seite entlang: einer an der
Oberkante des Kastens, einer an dessen Unterkante - also direkt über den Rädern
und knapp unter dem Fahrerfenster, wo der Streifen an einem Rettungswagen
verläuft. Ein dritter quer über die Mitte war ein Feuerwehrauto. Das Kreuz
sitzt dazwischen.

**Auf dem Dach liegt gar nichts.** Erst lagen dort auch zwei Streifen und ein
Kreuz - und sie waren das Einzige, was man an dem Wagen ansah, obwohl sie nicht
das sind, woran man ihn erkennt. Von oben ist ein Rettungswagen ein weißes Dach
mit einem Balken vorn drauf; das Rot gehört an die Seiten, wo es am echten
Fahrzeug auch ist.

**Und die Rippen sind die des Paketwagens.** Ein Kofferaufbau ist gesicktes
Blech, und die Querrippen über Dach und Flanken sagen genau das; ein
Rettungswagen hat eine glatte Kunststoffkabine, und ein Dutzend grauer Striche
quer über ein weißes Dach liest sich als Schmutz auf dem Bild statt als
Beplankung. Dieselbe Zeile in `paintVan` und in `vanWall`, einmal gefragt: ist
das hier der Paketwagen.

Dazu das **Blaulicht**: dieselbe kleine Kiste, die der Streifenwagen auf dem
Dach hat (`beacon`) - Lampen, Steuerkasten, Deckel -, aber dunkel. `onCall`
lässt nur die Balken von Polizeifahrzeugen blinken, also bekommt dieser die
Linsen und das Gehäuse und blitzt nicht: Er steht vor einem Krankenhaus, nicht
auf einer Fahrt.

## Das Foyer sind zwei Scheiben in Normalgröße

Der erste Versuch hat unten zwar zwei Scheiben gemacht, aber indem er die
Pfosten auseinandergezogen hat - zwei Scheiben in doppelter Breite. Damit war
das Erdgeschoss ein anderes Gebäude als die zwei Stockwerke darüber. Richtig
ist dasselbe Raster auf kürzerer Strecke: zwei Scheiben in der Breite der
oberen, das Band dafür kürzer und mittig in der Wand, in der es steht.

## Der Rettungshubschrauber ist der alte Hubschrauber

Die Polizei fliegt eine UH-60, nach den Maßen des Herstellers - ein langer,
schmaler Rumpf mit einem Ausleger hinten dran, Stummelflügel, Räder. Ein
Rettungshubschrauber ist die andere Silhouette: eine kurze Kanzel auf Kufen,
vorn fast nur Glas, dahinter Ausleger und Seitenleitwerk. Das ist genau die
Maschine, die dieses Spiel gezeichnet hat, **bevor** die Polizei ihre eigene
bekam - also steht sie wieder im Code, für den einen Zweck, für den ihre Form
die richtige ist.

Gelb über alles, mit dem roten Kreuz auf dem Ausleger. Und sie **steht**: Die
Blätter stehen still und es liegt keine Rotorscheibe darüber. Ein Rotor, der
sich ewig auf einem Dach dreht, von dem nie jemand abhebt, ist ein Karussell.

## Der Krankenwagen ist der Transporter in Weiß

Kein neues Blech, eine neue Lackierung. Ein Kasten auf einem Fahrerhaus ist ein
Kasten auf einem Fahrerhaus - Paketwagen und Rettungswagen sind dasselbe
Fahrzeug auf derselben Straße, und ein zweites von Grund auf zu zeichnen hieße,
das erste noch einmal zu zeichnen und beim zweiten Mal danebenzuliegen.
`vanLike(body)` beantwortet deshalb jede Frage nach der **Form** für beide
zugleich: welche Stockwerkstabelle gilt, welche Wandroutine zeichnet, ob ein
Firmenname auf den Kasten gehört. Unterschiedlich ist nur, was daraufgemalt
wird - und dass er schneller fährt und besser am Boden liegt, denn er ist das
eine Fahrzeug der Stadt, das gebaut ist, um von Berufs wegen schnell gefahren
zu werden.

Wo der Paketwagen seinen Firmennamen hat, hat dieser den Streifen: einen längs
über den Kasten, einen über das Chassis und das Kreuz dahinter. **Und auf dem
Dach, gut innerhalb der Kanten.** Was man von einem Dach sieht, ist nicht das
ganze Dach: Der Grundriss wird auf Kastenhöhe gestempelt und an der geneigten
Kabine beschnitten, der äußere Streifen liegt also hinter den Flanken, zu denen
er gehört. Ein Streifen auf der Kante war ein Streifen, den nie jemand sah. Die
beiden liegen jetzt 4,2 Pixel neben dem Grat, das Kreuz dazwischen - und weil
das von dieser Kamera aus die Ansicht ist, die man den ganzen Tag sieht, ist es
die, auf die es ankommt.

Einen gibt es je Krankenhaus, am Bordstein neben der Tür statt davor: Diese
Stelle ist die, an der man nach jedem Tod wieder aufwacht.

## Das Foyer ist zwei Scheiben, die Station acht

Die Bandfassade zieht sich über alle drei Etagen, aber nicht mit demselben
Raster: Das Erdgeschoss ist das Foyer, da geht man hinein, und ein Eingang, der
in dieselben schmalen Felder geteilt ist wie die Zimmer darüber, liest sich als
Aktenschrank. Unten also zwei Scheiben je Seite (`LOBBY_BAY`), darüber der
normale Pfostenabstand.

## Ein Laden zeigt, was er verkauft

Der Barber hatte im Erdgeschoss zwei kleine Fenster mit Sprossen und Fensterbank

- also das, was ein **Wohnhaus** hat, mit einem Ladenschild darüber
  geschraubt. Ein Laden hat links und rechts der Tür eine Scheibe, vom Sockel bis
  zum Sturz, mit den Pfosten dazwischen und sonst nichts.

`shopFront` zeichnet genau das: Sockelblech unten, Glas darüber, alle
`GLASS_BAY` Pixel ein Pfosten, ein Riegel obendrüber und im oberen Drittel der
Scheibe der Himmel - das Einzige, was sich in dieser Größe als Glas liest. Das
Glas geht etwas höher als die Tür (ein Schaufenster, das am Sturz aufhört, ist
eine Luke) und bleibt unter der Traufe, damit bei einem einstöckigen Laden noch
ein Band Wand für den Namen bleibt.

Geschaltet wird es über `glass` in der Tabelle, und nur das Erdgeschoss ist
betroffen: Was über einem Laden liegt, sind Wohnungen, und Wohnungen haben
Fenster (`drawWindows` fängt dort bei Stockwerk 1 an). Glas haben Barber,
Waffenladen, Restaurant und Supermarkt - die vier, in die man von der Straße
aus hineingeht.

## Auch eine Autobahn hat einen Bordstein

Der Gehwegring war von der Mitte einer gewöhnlichen Straße gemessen - ein Feld
Asphalt je Seite, dann der Gehweg. Eine Autobahn ist drei je Seite, ihre
äußeren Spuren lagen also genau auf den Feldern, auf denen der Gehweg gewesen
wäre. Das Haus fing an, wo die Überholspur aufhörte: Man trat aus der Ladentür
auf die linke Spur.

`nextToRoad` fragt jetzt den **Asphalt** statt die Linie: Ein Feld ist Gehweg,
wenn es selbst keine Fahrbahn ist, aber eines der `WALK_RING` Felder daneben
eine. Damit zieht der Ring automatisch mit, egal wie breit die Straße dort
gerade ist - auch bei allem, was weiter unten noch an den Breiten gedreht wird.

Und weil dieser Gehweg dem Gebäude abgeht, holt es ihn sich hinten zurück:
**Was die Autobahn vorn nimmt, gibt die Rückseite her.** Nach hinten ist der
Streifen entbehrlich - Eingang, Schild und Fenster liegen alle vorn. Nur nach
unten, nur wo hinten Gehweg statt Asphalt liegt, und nie über die Blockgrenze
hinaus: Wo zwei Blöcke ohne Straße zusammenlaufen, gehört das Feld dahinter dem
Nachbarn.

**Der Boden muss dabei dem Bild folgen.** `builtPlot` sagt, wo die Wand
gezeichnet wird; `inTown` sagt, wo man laufen kann - und das Feld, das sich das
Haus nach hinten holt, hielt der Boden weiter für Gehweg. Das Ergebnis war ein
Streifen Fußboden **im** Laden: Die Stadt parkte pflichtschuldig ein Auto darauf
und stellte drei Leute daneben, alle innerhalb der Mauer. `builtOver` fragt
deshalb für jedes Ringfeld dieselbe Funktion, aus der das Bild zeichnet.

## Ein Block ist drei Felder breit, immer

Eine Straße ist drei Felder und nimmt zwei davon aus dem Block links und eines
aus dem Block rechts; acht minus zwei minus eins minus zwei Felder Gehweg macht
drei zum Bebauen. Eine Autobahn ist fünf - sie nimmt jedem ihrer beiden Nachbarn
ein Feld mehr weg als eine Straße, und mit dem Bordstein von oben kamen diese
Blöcke auf **zwei** statt drei heraus. Gemessen über alle 441 Blöcke: 265 davon
hatten eine Seite von zwei Feldern, der Barber war ein Laden von zwei Feldern
Breite mit seinem Namen über der ganzen Front.

Also wird das Feld am **anderen** Ende geholt, wo eine gewöhnliche Straße es
entbehren kann (`handsBack`): Die Straße auf der abgewandten Seite eines
eingeklemmten Blocks gibt ihr äußeres Feld her und ist dort zwei Felder breit
statt drei. Weil eine Autobahn jede `MOTORWAY_EVERY`-te Linie ist, betrifft das
immer die Straße unmittelbar neben einer Autobahn - und zwar auf ihrer ganzen
Länge. Die Fahrbahn springt also nirgends: Sie ist durchgehend schmal oder
durchgehend breit.

Danach: 3×3 als häufigster Block, keine einzige Seite unter drei Feldern mehr,
und die Spur, die `laneDrift` ansteuert, stimmt weiterhin mit dem Asphalt
überein, weil `streetRun` dieselbe Rechnung macht wie der Boden. Zwei Felder
sind 96 Pixel, also gut 48 je Richtung - bei einem Auto von 18 Pixeln Breite
immer noch zwei Wagenbreiten je Spur.

## Vor dem Haus steht kein Streifenwagen

Geparkte Autos wurden aus derselben Liste gezogen wie der Verkehr, und im
Verkehr **soll** ein Streifenwagen sein: Das meiste, was die Polizei tut, ist
mit ausgeschaltetem Blaulicht herumfahren. Stehend ist es etwas anderes - ein
Streifenwagen vor einem fremden Haus, bei null Sternen, bevor das Spiel
angefangen hat, liest sich als Razzia statt als Kulisse, und er ist ein
geschenkter Polizeiwagen für jeden, der vorbeikommt.

`AT_THE_KERB` ist deshalb dieselbe Mischung ohne alles in Polizeifarben, und
`pickParked` zieht daraus - am Bordstein wie auf dem Supermarktparkplatz.
Gemessen über drei Startwerte: 192 geparkte Fahrzeuge, davon 16 in
Polizeifarben, und alle 16 stehen an einer der vier Wachen. Im Verkehr fahren
weiterhin sechs bis elf Streifenwagen herum.

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

### Sie stand gar nicht mehr in der Stadt

Ein Fehler, und ein stiller: Die Druckerei war in `THE_BLOCKS` eingetragen, in
`ONE_ONLY` als Einzelstück geführt - und **in Los Santos nirgends gebaut**. Von
441 Blöcken sind nur 76 bebaut, und auf keinem davon hatten die Würfel `mint`
gezeigt. `theOne("mint")` gab `null`, also wurde jede gezeichnete Druckerei zu
einem Wohnhaus verdünnt, `doorsOf("mint")` lieferte **null Türen**, und der
größte Bruch des Spiels hatte keine Klinke, an der man hätte ziehen können.

Die Lösung ist dieselbe wie beim Polizeirevier, das jedes Viertel bekommt, ob
gewürfelt oder nicht: `theOne()` hat jetzt einen Rückfall (`plainestNear`).
Wo die Würfel keine gezeichnet haben, steht sie auf dem schlichtesten bebauten
Block in der Nähe - und `buildingAt` fragt die Einzelstücke jetzt auch dann,
wenn der Block selbst als Haus gewürfelt wurde. Der Block, den die Bank hat,
ist dabei gesperrt, und die Viertel-Rückfälle (Krankenhaus, Feuerwehr) weichen
ihr aus, damit ein Viertel nicht seine Klinik an sie verliert.

**Und sie steht im Norden.** Die Bank sucht sich den Block nächst der
Stadtmitte; die Druckerei nächst der Mitte der **oberen Stadthälfte**
(`NORTH_END`). Zwei Wahrzeichen auf denselben drei Straßen sind ein
Wahrzeichen: Der ganze Grund, von jedem genau eines zu haben, ist, dass der Weg
dorthin eine Fahrt ist.

### Flach von oben, und herein kommt man von unten

Wie die Bank und der Knast: `squash: FLAT`, keine Höhen, keine Kipp-Kästen. Eine
Werkhalle im Kippwinkel ist eine Reihe grauer Kisten, die einander den Rücken
zudrehen - und der ganze Bruch besteht daraus, auf einen Blick zu sehen, welche
Maschine läuft, an welcher Tür sie drücken und wo die eigenen Leute stehen. Von
oben sind das drei Sachen in einem Bild.

Dazu ist **der Grundriss umgedreht**: Die Vordertür liegt jetzt in der
**Südwand**, man kommt von unten herein und läuft nach Norden - wie in der Bank.
Dahinter die Eingangshalle mit den Schreibtischen, darüber die Presshalle,
dahinter der Keller. Das ist auch die Form des Jobs: Der Weg hinaus liegt am
anderen Ende des Gebäudes als der Weg herein, und jeder Schritt Richtung
Tunnel ist einer weg von der Tür, an der sie drücken.

**Und er ist deutlich kleiner geworden**: von 46 × 34 Feldern auf 26 × 24, das
Gebäude selbst auf 20 × 16 - in der Größenordnung des Bankgebäudes. Vorher war
der Weg vom Fenster zum Ladetor eine Weltreise durch eine leere Halle; jetzt
sieht man vom Tor aus die halbe Presshalle, und drei Pressen statt fünf reichen
dafür. Im Plan liegt **der Tresorraum hinten rechts und das Loch hinten
links** - beide im selben Raum wie der Keller, der eine hinter einer
Stahltür, das andere unter dem Fußboden.

**Und alles hat jetzt Einzelteile.** Eine Presse ist drei Felder lang und
besteht aus den dreien: die Papierrolle am einen Ende, die Zylinder in der
Mitte, am anderen der Schaltkasten mit der Lampe und der Stapel, der
herauskommt. Dazu die gelbe Bodenmarkierung um jede Maschine, Farbfässer an der
Wand, Papierrollen, ein Gabelstapler am Ladetor, Lüftungsrohre über der Halle,
Pfeiler und Kisten im Keller, ein Gully, und in der Eingangshalle der Name der
Bude quer über den Boden. Was man erreichen muss, ist nach wie vor nur dreierlei

- Presse, Tür, Loch -, und nichts davon steht im Weg: Die Einrichtung ist
  Kulisse, nicht Hindernis.

Der Tunnel ist kein schwarzer Streifen mehr, sondern ein Stollen mit Stempeln an
beiden Seiten; der Schacht hat den Erdaushub ringsum, einen Spaten, solange
gegraben wird, und eine Leiter, sobald er durch ist.

### Vorübergehend: neues Spiel startet in der Druckerei

`START_IN_MINT` in `engine/setup.ts` - dieselbe Werkbank wie seinerzeit für die
Bank und den Knast, und genauso wieder herauszunehmen: den Block am Ende von
`buildGame()` löschen und den Aufruf `straightIntoMint(...)` um das
zurückgegebene Objekt herum entfernen. Sonst kostet jede Änderung an der Halle
erst eine Fahrt in den Norden, vier angeheuerte Leute und eine Waffe.

Der Unterschied zum Knast ist, dass hier **vier Uhren gleichzeitig** laufen und
**jede jemand anderem gehört**:

- **Die Willigen drucken.** Nur besetzte Pressen zählen (`manned()`), und
  besetzt heißt: jemand steht wirklich daran und macht auch mit.
- **Die Unwilligen graben.** Der Tunnel ist keine Uhr mehr, die von selbst
  läuft: Es sind Hände im Loch, und es sind genau die Hände, die an der Presse
  nichts getaugt haben.
- **Der Direktor läuft zum Telefon.** Die einzige Uhr im Haus, die schlechter
  wird, während man woanders steht.
- **Die Polizei stellt sich auf und drückt.** Erst `SETTLE_SECONDS` lang gar
  nichts, dann alle `WAVE_EVERY` Sekunden ein Trupp an der schwächsten der
  drei Türen - und irgendwann ein Panzer.

Dass der Spieler **nur eine** dieser Uhren selbst bedienen kann, ist das Spiel.
Das Gebäude ist absichtlich so groß, dass der Weg vom Fenster zum Ladetor
fünfzehn Sekunden dauert.

### Zielen statt Knopfhalten

**Die Waffe ist dabei, und sie ist das Werkzeug.** Man hat drinnen dieselben
Waffen wie draußen (dasselbe Eckfenster über `drawStatus`, dasselbe Mausrad),
und wer ins Fadenkreuz gerät, **hebt sofort die Hände** - kein gehaltener
Knopf, keine Sekundenanzeige. `underTheGun()` ist dieselbe Prüfung wie in der
Bank: das Nächste am Fadenkreuz, in Reichweite, mit freier Sicht.

Wer im Anschlag steht, **läuft einem hinterher** (`led`), und wo man ihn
stehen lässt, ist die Anweisung: an einer Presse wird gedruckt, unten am
Schacht wird gegraben. Man sagt niemandem, an welche Maschine er soll - man
bringt ihn hin. Damit sind die beiden Hälften des Jobs zwei Wege, und dafür ist
das Haus gebaut.

**Man sieht, was man in der Hand hat, und man sieht den Schuss.** Beides fehlte:
Die Figur trug nichts, und ein Treffer war ein Umfallen ohne Ursache - beim
Panzer sah es aus, als wäre er von selbst ausgegangen. Jetzt trägt jede Figur
das, was sie hält (`Figure.holds`: der Spieler seine aktuelle Waffe, die Crew
Pistolen, die Polizisten Schlagstöcke).

**Und geschossen wird mit den Kugeln der Stadt.** Die Druckerei hat eine eigene
kleine Liste `MintState.shots` mit genau demselben `Bullet` wie draußen, und
gezeichnet wird sie mit derselben Funktion (`drawShot` aus `render.ts`, jetzt
exportiert). Damit sieht jede Waffe drinnen aus wie draußen: Die Pistole zieht
einen gelben Strich, der Flammenwerfer wirft dieselben Flammenzungen, die
Panzerfaust dieselbe orange Rakete mit weißem Kern. Getroffen wird von diesen
Kugeln nichts - was der Schuss angerichtet hat, steht schon fest, bevor er
fliegt -, sie sind das Bild dazu. In der Bank reicht dafür der ohnehin
vorhandene Zeitstempel `shotAt`, weil dort das Ziel immer das Fadenkreuz ist.

**Und wer erschossen wird, liegt da wie auf der Straße.** Dieselbe Zeichnung
wie im Rest der Stadt (`lyingDown`, ebenfalls jetzt exportiert): ein flaches
Sprite ohne Höhe, in der Richtung, in der er gefallen ist, mit einer Lache
darunter. Vorher stand der Tote weiter aufrecht und war nur etwas blasser -
zwei Sorten Leiche in einem Spiel.

Und der Abzug ist die andere Entscheidung, die man nicht zurücknehmen kann:
Eine tote Geisel druckt nichts mehr, ein toter Direktor geht nie wieder ans
Telefon, und der Schuss ist draußen zu hören - `calmUntil` fällt auf null und
die nächste Welle kommt sofort.

**Die gehaltene Maus hat noch zwei Arbeiten**, und beide sind Arbeit statt
Drohung: an einer Tür stapeln und selbst am Schacht graben.

### Kooperativ und nicht kooperativ

**Die Hälfte macht mit, und man sieht es keinem an** (`WILLING_SHARE`). Wer an
eine Presse gestellt wird, druckt erst einmal - und wer nicht mitmacht,
**hört nach ein paar Sekunden einfach auf** (`SLACK_LEAST`, `slacking`). Das
ist die einzige Art, es herauszufinden, und sie kostet genau die Sekunden, die
sie kostet.

Die, die aufhören, sind nicht wertlos: Sie sind die Hände für den Tunnel. So
sortiert die Presshalle die Belegschaft und der Keller verbraucht, was die
Presshalle aussortiert hat.

**Und jemand muss dabeistehen.** Ein eigener Mann auf einer Station
(`POSTS`, Knopf „Mann abstellen") hält die Arbeit am Laufen - an der Presse
druckt dann auch der Unwillige weiter, im Keller wird überhaupt nur gegraben,
solange jemand aufpasst. Der eigene Rücken zählt dabei wie ein Mann: Wo man
selbst steht, wird gearbeitet. Genau dafür ist die Crew da, die man draußen
angeheuert hat, und genau deshalb ist sie nicht mehr einfach ein
Tunnelbeschleuniger.

### Die Crew denkt mit, aber nicht zu Ende

Angeheuerte, die einem nur hinterherlaufen, sind vier Leute, die im Weg
stehen. Also suchen sie sich selbst etwas (`mindCrew`), sobald sie nichts zu
tun haben:

1. **Eine Station, an der gearbeitet wird und niemand aufpasst** - da stellen
   sie sich hin.
2. **Sonst jemanden, der herumsteht, während eine Maschine frei ist** - den
   holen sie sich und stellen ihn hin (`talkedRound`).
3. **Sonst** laufen sie hinter einem her wie vorher.

Zwei Bremsen halten das davon ab, das Spiel zu spielen: Sie fangen erst nach
`CREW_THINK` Sekunden an, und sie fassen nichts an, was näher als
`CREW_LEAVE` beim Spieler ist - wer selbst gerade jemanden holt, wird nicht
überholt. Nachgemessen mit einem Spieler, der am Tor steht und nichts tut:
nach 40 Sekunden laufen alle drei Pressen und werden bewacht, nach 100
Sekunden sind 19 000 € gedruckt.

**Und es gibt eine Linie, die sie nicht überschreiten.** Türen verbarrikadiert
niemand außer einem selbst, in den Keller bringt niemand eine Geisel, um den
Direktor kümmert sich niemand, und den Panzer sieht keiner von ihnen an. Die
Presshalle läuft ohne einen; der Tunnel, die drei Türen und der Mann im Anzug
sind die Arbeit, für die man da ist.

### Ein Weg statt einer Luftlinie

Dass die Crew nicht mehr quer durch den Tresen läuft, ist nicht mehr nur
Entlangrutschen an Wänden: Das brachte einen Mann in die Ecke zwischen
Büroaußenwand und Hallenwand und ließ ihn dort für den Rest des Bruchs stehen.
Jetzt rechnet `wayTo()` den Weg aus - eine Flutfüllung von Ziel aus über alle
begehbaren Felder, dann das Nachbarfeld mit der kleinsten Zahl. Jedes Mal neu,
weil das Ziel meistens ein Mensch ist und ein Weg zu dem, wo jemand war, kein
Weg ist.

Das benutzen alle: die Crew, die Geiseln auf dem Weg zur Maschine oder zum
Schacht, und der Direktor auf dem Weg zu seinem Telefon (der dafür vorher
einen von Hand gesetzten Zwischenpunkt brauchte).

### Der Direktor und sein Telefon

Er steht bei Schichtbeginn hinten in der Halle und geht von da aus in sein
Büro - durch die Lücke in der Wand, nicht durch die Wand - und wenn er den
Hörer erreicht, ist Schluss mit Warten: `settleAt` und `waveAt` springen auf
`CALL_SECONDS`, und die Polizei kommt, statt sich aufzustellen. Ohne
Gegenmaßnahme hat man dafür etwa eine halbe Minute.

Dagegen hilft dreierlei, und alle drei kosten etwas: ihn ins Visier nehmen (er
hebt die Hände und bleibt stehen, aber man muss ihn im Auge behalten), ihn
mit nach unten nehmen (dann gräbt er mit, und das ist die beste Verwendung für
ihn), oder das **Telefon** abschießen - laut, aber endgültig.

Wie in der Bank liegt **links das Büro und rechts der Tresorraum**: Das ist
dieselbe Geografie wie beim anderen großen Bruch, damit man beim zweiten
Gebäude nicht wieder von vorn anfängt zu suchen.

**Barrikade und Druck sind zwei Zahlen, keine.** Was vor der Tür liegt,
verlangsamt, was durch sie kommt (`SHIELD`), und was durch sie kommt, frisst
langsam, was davor liegt (`WEAR`). Stapeln **drängt zusätzlich zurück**
(`RETAKE`) - ohne das bliebe eine Tür, die zu drei Vierteln offen war, für den
Rest des Bruchs zu drei Vierteln offen, und die letzten Minuten wären an einer
Tür verloren, die man nie wieder zubekommt.

**Jede Art, Zeit zu kaufen, kostet Geld.** Eine Geisel rauslassen kostet eine
Presse für immer; den Strom kappen kostet alle Pressen, solange es dunkel ist.
Ein drittes Mittel, das nichts kostet, würde die beiden anderen überflüssig
machen.

**Der Strom ist jetzt ein Schalter, kein Trick.** Vorher ging er einmal aus und
von allein wieder an - ein Knopf, den man drückt und der dann nichts mehr tut,
ist ein Knopf, bei dem man sich fragt, wofür er da war. Jetzt sind beide
Richtungen eine Entscheidung: Im Dunkeln wird nichts gedruckt, und draußen will
keiner in ein Gebäude, in das er nicht hineinsehen kann (`calmUntil`); im
Hellen laufen die Maschinen. Man kappt ihn also für die zwei Minuten, in denen
sie an einer Tür stehen, und macht ihn wieder an, sobald sie es sich anders
überlegt haben. Damit das keine Antwort auf alles wird, bringt das Kappen nur
alle `POWER_AGAIN` Sekunden Ruhe - danach ist es nur noch dunkel.

### Der Cheat gilt auch hier drinnen

`godMode()` lief bisher nur in der Phase `playing`, und der Knopf auf der Seite
tat in Bank, Knast und Druckerei nichts - ein Knopf, der hinter einer Tür
aufhört zu wirken, sieht kaputt aus. Jetzt wird er **vor** der Phasenfrage
gesetzt, und die drei kleinen Welten bekommen den bereits verrechneten Zustand.

Was er dort heißt, entscheidet jede selbst, und zwar jeweils über die Uhr, an
der man verliert:

- **Bank:** kein stiller Alarm und keine Razzia (`alarm`, `raidAt`).
- **Druckerei:** an keiner der drei Türen kommt jemand durch - der Druck fällt
  jeden Frame auf null zurück.
- **Knast:** `watchOut()` sieht schon immer auf `input.god` und greift dann
  nicht zu.

Nachgemessen: ohne Cheat ist man in der Druckerei nach 150 Sekunden gestürmt
und in der Bank nach 60 Sekunden hochgenommen, mit Cheat läuft beides weiter;
im Knast wird man am offenen Loch und während der Suche erwischt - mit Cheat
keines von beiden.

### Draußen: aufstellen, Zelt, Essen, Panzer

**Die erste Minute gehört ihnen, nicht dem Spieler.** `SETTLE_SECONDS` lang
passiert an den Türen gar nichts und alles auf der Straße: Die Wagen fahren
vor, Männer stellen sich dahinter, das Zelt der Einsatzleitung wird quer über
die Straße aufgebaut. Deshalb ist die Straße rings um das Gebäude überhaupt im
Plan - ein Belagerungsring, von dem man nur eine Leiste unter dem Bild sieht,
ist eine Leiste und keine Belagerung. Die Leiste sagt in dieser Minute, wie
lange es noch dauert; danach sagt sie, ob das Tor offen ist.

**Und sie stehen nicht still.** Solange nichts passiert, stehen sie hinter
ihren Wagen auf der anderen Straßenseite und treten von einem Fuß auf den
anderen (`COP_PACE`, `COP_BEAT`, jeder in seinem eigenen Takt). Sobald aber ein
Trupp an einer der drei Türen arbeitet, gehen die, deren Aufgabe das ist, **an
die Wand neben dieser Tür** (`standing()`, `OUTSIDE`). Von drinnen ist genau
das die Warnung: Eben waren sie noch weit weg, jetzt stehen sie am Fenster.

**Das Tor ist die einzige Tür, die man selbst bedient** (`shutter`, Knopf „Tor
öffnen"). Offen ist es eine Einladung - der Druck an der Vordertür steigt um
`SHUTTER_PUSH` extra - und gleichzeitig die einzige Möglichkeit, nach draußen
zu schießen oder etwas hereinzuholen.

**Und es hat eine Uhr.** Nach der Hälfte von `OPEN_GRACE` sagen sie es an
(„Sie gehen auf das offene Tor zu"), nach `OPEN_GRACE` Sekunden **schießen sie
durch das offene Tor und kommen rein**: Der Druck an der Vordertür steigt dann
mit `STORM_PUSH` statt mit dem normalen Wert, und man sieht ihre Kugeln
hereinkommen. Nachgemessen: Tor auf und stehen gelassen - Warnung nach sieben
Sekunden, Feuer nach vierzehn, drin nach fünfzehn. Ein Tor, das man offen
lassen kann, wäre kein Tor.

**Das Essen** kommt nach `FOOD_AFTER` Sekunden an die Stufe und steht
`FOOD_WAIT` lang da. Wer aufmacht, hat eine ruhige Weile und eine Belegschaft,
die weitermacht; wer es draußen stehen lässt, hat ab da **keinen** mehr, der
freiwillig an eine Maschine geht. Eine Belagerung ist eine Verhandlung, und das
ist die einzige Runde davon, die man gewinnen kann.

**Der Panzer** kommt nach `TANK_WAVE` Trupps die Straße hoch, stellt sich quer
vors Tor - und schießt erst, wenn er steht. Dagegen hilft nichts, was man
stapeln kann: Tor auf, **Panzerfaust** in die Hand, zwei Treffer
(`MINT_TANK_HITS`). Danach ziehen sie sich erst einmal zurück. Das ist der
einzige Moment im Spiel, in dem man in einer Tür steht, vor der vierhundert
Polizisten liegen, und das soll er auch sein.

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

## In der eigenen Einfahrt steht der eigene Wagen

Der Stellplatz neben der Villa - das gepflasterte Viereck, `dock` im Boden - ist
das einzige Stück Asphalt in Los Santos, das jemandem gehört. Trotzdem wurde er
immer wieder zugeparkt, und zwar jedes Mal von einer anderen Seite: Die
Parkbuchten sind ein festes Raster, die drei DeLorean suchen sich eine Lücke und
nehmen nach acht Versuchen, was übrig ist, Traktoren, Löschzüge und
Krankenwagen bekommen ihren Platz gesagt. Jede dieser Stellen einzeln
abzusichern heißt, die nächste zu vergessen.

Also wird am Ende **abgeschleppt**: Wer geparkt auf dem Grundstück steht -
Pflaster, Rasen oder Haus -, fliegt aus der Liste. Nicht der Gehweg rechts und
links, der ist öffentlich, und nicht das Auto, neben dem man startet: Das steht
auf der Straße vor der Garage, und das soll es auch.

Zwei Feinheiten, die es sonst teuer machen:

- **Ganz zuletzt**, nachdem jedes Fahrzeug seine Nummer hat. Vorher gezogen,
  wäre `cars.length` kleiner geworden und die Streifenwagen danach hätten
  Nummern bekommen, die es schon gab.
- **Ohne Würfel.** Es wird nichts verschoben und nichts neu gesucht, nur
  entfernt - die Stadt liegt Feld für Feld wie vorher. Gemessen über fünf
  Saaten: gleiche Fahrzeugzahl, eindeutige Nummern, null Fahrzeuge auf dem
  Grundstück.

Es ist die Versicherung dagegen, dass die nächste Art, ein Auto abzustellen,
in der eigenen Einfahrt endet.

**Und danach wird der eigene Wagen daraufgestellt.** Eine leere Einfahrt neben
einer Villa ist eine Einfahrt, aus der jemand weggefahren ist. Der Wagen, der
dorthin gehört, ist der DeLorean: Drei stehen irgendwo in der Stadt und wollen
gefunden werden, dieser eine steht bei dir, mitten auf den Pflastersteinen, mit
der Nase zur Straße. Er wird **nach** dem Abschleppen hingestellt, sonst
schleppte ihn der eigene Besen gleich wieder ab, und bekommt die Nummer, die
die Liste **vor** dem Abschleppen hatte - die Wagen, die stehen blieben, haben
ihre ja behalten. Gemessen über fünf Saaten: genau ein Fahrzeug auf dem
Grundstück, ein `dmc` in der Mitte des Pflasters, und alle Nummern eindeutig.

**Geladene Spielstände bleiben unangetastet.** Ein Wagen, den man selbst in die
eigene Einfahrt gestellt hat, ist der eigene Wagen und verschwindet nicht über
Nacht. Wer einen alten Stand lädt, der noch aus der Zeit stammt, als die Villa
woanders stand, findet allerdings, was dort damals am Straßenrand parkte -
gemessen fünf Fahrzeuge, eines davon mitten auf dem Pflaster. Ein neues Spiel
räumt das auf.

## Bank und Kasino haben die Ecken getauscht

Beide stehen auf der Reihe, auf der die Villa steht, drei Blöcke auseinander:
die Bank war die nahe, das Kasino die ferne. Gewünscht war es andersherum -
und ein **Tausch** ist dabei die einzige ehrliche Bauweise. Welcher Block die
Bank trägt, entscheidet kein Eintrag in einer Liste, sondern der Plan: `theOne`
nimmt die Bank, die der Stadtmitte am nächsten liegt, und alle anderen werden
zu Wohnhäusern verdünnt. Eine per Hand versetzte Bank wäre deshalb keine
versetzte Bank, sondern eine zweite - und das Kasino stünde weiterhin, wo es
stand.

Also tauschen die beiden Blöcke: `buildingAt` fragt für den einen nach dem
anderen, und zwar **alles** - Wände, Höhe, Dachfarbe, Schild und damit auch die
Tür, an der der Überfall stattfindet (`doorsOf("bank")` fragt dieselbe
Funktion). Nachgemessen, vorher und nachher, mit demselben Durchlauf über alle
Blöcke:

```
vorher:  Bank 15,14   Kasino 12,14   Banktür 125,119
nachher: Bank 12,14   Kasino 15,14   Banktür 101,119
```

Alles andere steht unverändert: Wachen, Kliniken, Feuerwehren, Club, Villa -
Block für Block dieselbe Liste.

Der Tausch gilt nur, solange die beiden wirklich Bank und Kasino sind. Zeichnet
der Plan eines Tages etwas anderes dorthin, sind sie kein Paar mehr und jeder
Block behält, was er gezogen hat; zwei fremde Häuser tauschen nicht heimlich
die Plätze.

## Die Villa hat eine Adresse

Sie hatte keine, und deshalb ist sie umgezogen. Welches Haus im Südosten dem
Spieler gehört, war eine Frage an den Plan: _das Haus, dessen Tür der Mitte der
südöstlichen Insel am nächsten liegt_. Das ist eine hübsche Regel und eine
falsche, denn die Antwort hängt davon ab, **welche Blöcke überhaupt Häuser
sind**.

Als das Flugfeld länger wurde, waren einige davon plötzlich Rollfeld - `inCity`
lässt den Flughafenkasten aus, und was dort stand, steht nicht mehr. Damit
rückte ein **anderes** Haus an die Inselmitte, und die Villa war ein anderes
Haus an einem anderen Platz: Block 15/17 statt 16/14, ein Block breit statt
zwei. Gemessen, beide Male, mit demselben Aufruf:

```
alter Flughafen: Villa-Block 16,14  Felder 131..143 x 114..119  breit
neuer Flughafen: Villa-Block 15,17  Felder 121..126 x 138..143  schmal
```

Die eigene Haustür ist nichts, was sich verschieben darf, weil zwei Kilometer
weiter südlich eine Landebahn verlängert wurde. Also steht die Adresse jetzt
da: `VILLA_BLOCK = { x: 16, y: 14 }` - die einzige Stelle dieser Stadt, die
nachgeschlagen und nicht ausgerechnet wird, und genau deshalb mit einer
Begründung daneben. `homeDoors` nimmt die Tür auf diesem Block, sobald es eine
dort gibt; gibt es keine, weil dort eines Tages kein schlichtes Haus mehr steht,
greift die alte Regel und der Spieler steht nicht ohne Zuhause da.

Die beiden anderen Häuser suchen weiter wie bisher - der genannte Block liegt
auf der Insel im Südosten, und auf den anderen beiden findet ihn niemand.

**Und sie ist trotzdem noch einmal umgezogen**, weil die Adresse allein nicht
reicht: Gesucht wird die **Tür** auf diesem Block, und Türen gibt es nur auf
Blöcken, auf denen etwas steht. Die neue Landstraße vom Fährsteg lief bis in
die Stadt hinein, und weil `onRoute` vor `inCity` gefragt wird, gewinnt eine
Landstraße gegen jeden Block, durch den sie läuft - sie hat genau den
überbaut, auf dem die Villa steht. Kein gebauter Block, keine Tür, keine
Adresse, Umzug.

Die Lehre steht in beiden Richtungen: Eine Landstraße hört an der ersten
Stadtstraße auf, und wer eine neue zieht, schaut hinterher nach, wo die Villa
steht. Das ist ein Aufruf: `villaBlock()` muss 16/14 sagen.

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
  etwas rechts der Mitte - da, wo auf dem Foto der Rauch herauskommt, und
  daneben statt auf dem Giebel des linken Flügels, denn durch ein Satteldach
  kommt kein Schlot. Er ist
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

**Und der Boden liegt unter den Autos.** Auffahrt, Pflasterhof, Stellplatz und
Blumen werden im Bodendurchgang gezeichnet, bei den übrigen Belägen der Stadt
(`villaGround`), nicht beim Haus. Beim Haus gezeichnet gingen sie **über** die
Wagen, die darauf standen, und ein Hof, auf dem man die Autos nicht sieht, ist
eine Terrasse. Die Hecke ist das andere: Die steht anderthalb Meter hoch vor
dem, was hinter ihr ist, also gehört sie zum Gebäude.

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
Wand sieht niemand.** Vier Stellen lesen ihn.

Gefragt wird nach **Feldern**, nicht nach einem Radius. Erst stand da „höchstens
sechsundzwanzig Pixel von der Mitte der Bucht", also ein halbes Feld: eine
Handbreit schief eingeparkt, oder ausgestiegen und neben dem Wagen gestanden,
und man war für die Polizei wieder im Freien - in der eigenen Garage. Eine
Garage sind zwei Felder. Auf einem davon zu stehen heißt, drin zu sein.

- `coolDown` zählt ihn nicht mehr als gesehen, also läuft die Uhr, die ihm die
  Sterne abnimmt. **Nicht sofort** - die Garage ist keine Begnadigung, sie ist
  ein Ort, in den sie nicht hineinsehen können. Gemessen: mit drei Sternen
  hineingefahren, nach zwanzig Sekunden zwei, nach vierzig einer, nach sechzig
  „Die Luft ist rein".
- Die Männer, die Wagen **und der Hubschrauber** fahren nicht mehr auf ihn zu,
  sondern auf die Straßen um das Haus herum, jeder auf seinen eigenen Punkt
  eines Rings (`searchAt`). Der Ring ist neunhundert Pixel weit und auf die
  nächste Kreuzung gerastet - bei zweihundertsechzig durchsuchten sie den
  Vorgarten, man sah aus der eigenen Garage sechs Polizisten um die Hecke
  stehen, und der Bildschirm ist tausend Pixel breit. Neunhundert sind drei
  Straßen weiter, also aus dem Bild. Und die Kreuzung, weil jemand, der ein um
  die Ecke verschwundenes Auto sucht, die Straßen absucht und nicht einen Punkt
  mitten im Wald.
- Niemand schießt. Ein Polizist feuert auf alles in Reichweite seiner Waffe,
  was durch ein geschlossenes Garagentor hindurch ein Mann wäre, der auf gut
  Glück auf ein Gebäude schießt.
- Und niemand verhaftet. Ein Ring Polizisten um ein Haus ist kein Ring um den
  Mann darin - stillzusitzen ist genau das, was man in einer Garage tut, und
  genau das war die Verhaftungsbedingung.

**Umlackiert wird nicht mehr**, nur repariert. Ein neuer Lack bei jeder Einfahrt
hieß, dass man nie ein Auto in einer Farbe behalten konnte, die einem gefällt -
und er kaufte nichts: Was eine Fahndung abschüttelt, ist, nicht gesehen zu
werden, nicht, eine andere Farbe zu haben.

**Und das Tor schließt bei jeder Einfahrt.** Es fragte vorher, ob es überhaupt
etwas zu _tun_ gäbe - Sterne loszuwerden, Beulen auszubeulen, oder noch nie
dagewesen zu sein -, und bei der zweiten Fahrt mit heilem Wagen und weißer
Weste war die Antwort nein, also blieb es oben. Eine Garage, die bei manchen
Ankünften schließt und bei anderen nicht, ist eine Garage, auf die kein Verlass
ist. Was es jetzt fragt, ist, ob der Wagen noch **rollt**: Das unterscheidet
Ankommen vom Dastehen, und ohne diesen Unterschied ginge das Tor um einen
geparkten Wagen herum alle paar Sekunden auf und zu. Gemessen: dreißig Sekunden
stillgestanden, ein einziger Torwechsel, keine zweite Reparatur.

**Es steigt auch niemand mehr aus dem geklauten Streifenwagen aus.** Ein
Polizeiauto behält seine Nummer, wenn man es der Polizei abnimmt, und die
Männer, die man herausgezerrt hat, haben diese Nummer weiterhin auf sich stehen

- am Ende der Fahndung stiegen sie also wieder ein, wo der Wagen gerade stand.
  So kam es, dass ein geklauter Streifenwagen, nach Hause gefahren und abgestellt,
  plötzlich zwei Polizisten enthielt, die dann in der Garage ausstiegen.
  `putAboard` lässt sie jetzt von der Straße verschwinden wie alle anderen, setzt
  sie aber in kein Auto, das dem Spieler gehört.

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
- ein eigener Renderer, der dieselben Figuren benutzt wie die Stadt und sonst
  nichts mit ihr teilt - beim Kippwinkel gehen sie inzwischen auseinander, siehe
  den nächsten Abschnitt.

Die Stadt steht still, solange eine davon läuft. Was zurückkommt, ist immer nur
ein Ergebnis - wie viel Geld, und ob man gesehen wurde.

**Die Bank ist die kleinste davon und die mit der klarsten Entscheidung.**
Decken oder arbeiten: Wer an einer Kasse steht, steht nicht bei den Leuten, und
wer nicht bei den Leuten steht, hat in fünf Sekunden einen auf dem Weg zum
Knopf. Die Geiseln laufen deshalb **mit** - der Mann mit der Kombination muss
an die Tresortür gebracht werden, und das geht nur, indem man ihn hintersich
herlaufen lässt.

## Die Bank liegt flach, und man kommt von unten herein

Zwei Sachen an der Bank waren verkehrt herum, und beide fallen erst drinnen
auf.

**Ein Raum wird nicht gekippt.** Die Stadt lehnt sich zurück - Tiefe mal
`DEPTH`, Häuser mit Dach und einer Wand zur Kamera -, und das ist draußen
richtig: Man sieht, was vor einem steht. Drinnen ist dieselbe Schräge nur im
Weg. Der Schalter wird zu einem Balken, der sich in die Tiefe zieht, statt zu
der Linie, vor oder hinter der man steht; die Außenwand steht als Klotz vor den
Leuten dahinter, und dagegen half nur eine Regel, die sie halb durchsichtig
malt, sobald jemand dahinter steht. Ein Raum will von oben gesehen werden, wie
in jedem Spiel, das einen ein Gebäude betreten lässt: die Quadrate quadratisch,
die Wand eine Linie, die Theke eine Linie.

Der Kippwinkel gehört deshalb jetzt an die **Kamera**, nicht in die Rechnung:
`View` hat ein `squash`, `project()` und `unprojectFloor()` nehmen es, und wo
nichts dabeisteht, bleibt es `DEPTH` - die Stadt merkt nichts davon. Die Bank
setzt `FLAT`, also gar keine Stauchung.

**Die Leute bleiben gekippt.** Eine Figur wird vom Scheitel abwärts gezeichnet,
mit einem Körper darunter, und platt gedrückt liegt sie als Mantel auf dem
Boden. Sie malen ihre Stauchung selbst, nicht über die Kamera - deshalb sehen
sie in dem flachen Raum genauso aus wie auf der Straße, und der Raum ist um sie
herum flach geworden, nicht sie. Genau so war es auch gewünscht.

Was dabei ganz wegfällt, sind die Kästen: Wand, Theke, Kasse und Tresortür
hatten je eine Deckfläche und eine Frontfläche, dazu `hides()`/`covers()` für
das Halbdurchsichtige. Von oben gibt es keine Front und nichts, wovor etwas
stehen könnte. Übrig bleibt ein Quadrat mit einer Linie darum - und die Linie
ist nötig, sonst werden Wand und Theke daneben eine Fläche. Möbel, um die man
herumgehen kann, werden drei Pixel kleiner als ihr Feld gezeichnet und
**dunkler** als der Boden: In der Bodenfarbe war der Schreibtisch nur ein
Umriss.

**Und die Tür gehört nach unten.** Vorher lag der Eingang in der Nordwand: Man
stand oben am Bildrand und arbeitete sich nach unten durch, auf die Kamera zu.
Ein Raum, den man betritt, liest sich andersherum - die Tür im Rücken, die
Arbeit vor einem. Der Plan ist dafür einfach **gespiegelt** worden, Zeile für
Zeile, und mit ihm die festen Punkte (`row' = PLAN_HIGH - 1 - row`): Halle und
Tür unten, Schalter und Kassen in der Mitte, Schreibtische, Knopf und Tresor
oben. Weil eine Spiegelung alle Abstände erhält, ändert sich am Spiel kein
einziger Schritt - nur die Blickrichtungen kippen mit: Er kommt nach Norden
herein, sie schauen nach Süden zur Tür.

Nachgemessen am fertigen Raum: Start auf `hall` bei y = 14,4 Feldern, die
`door` direkt darunter; nach oben laufen endet vor der Theke; durch das Tor in
Spalte 23 kommt man dahinter; Kasse 3 von hinten in 44 Pixeln Reichweite leer;
Angestellter genommen, nach Norden an die Tresortür gebracht, Tresor auf,
Tresorraum betreten, 9000 € im Sack; nach unten hinaus meldet `out`.

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

## Der leere Blechbalken ist kein Tod

Zwei Zeilen haben zusammen dafür gesorgt, dass eine Verfolgungsjagd im Auto
nach ein paar Sekunden vorbei war, ohne dass der Spieler je getroffen wurde:

- `checkEnd` fragte `state.player.health <= 0 || car.health <= 0`. Der zweite
  Teil ist falsch: Das Blech ist nicht der Fahrer. Der Balken lief leer, und
  der Bildschirm sagte WASTED - bei einem Mann ohne einen Kratzer, in einem
  Wagen, der noch nicht einmal qualmte. Jetzt steht dort nur noch die eigene
  Gesundheit.
- `CAR_TOUGHNESS` war 1,2: Blech nahm **mehr** Schaden als ein Mensch. Ein
  Polizist mit Maschinengewehr macht neun Schaden elfmal die Sekunde, also
  rund hundert - genau das, was ein Mittelklassewagen an Blech hat. Eine
  Sekunde Dauerfeuer, und der Wagen war hin. Jetzt sind es 0,35.

Gemessen mit einem MG und zwei Pistolen, alle drei im Dauerfeuer auf einen
stehenden Wagen: **vorher 4,6 Sekunden bis WASTED**, nachher 11,6 Sekunden, bis
das Blech leer ist - und dann geht es erst los.

Denn was danach passiert, gab es schon, es kam nur nie jemand lebend dort an:
Der Wagen hat keinen Motor mehr, rollt aus und bleibt stehen, raucht erst
dünn, dann dick und schwarz, brennt und fliegt auseinander. Die vier Stufen
waren allerdings weder in der richtigen Reihenfolge - Flammen bei 2,2
Sekunden, schwarzer Qualm erst bei 4 - noch lang genug: viereinhalb Sekunden
insgesamt. Das ist keine Frage, das ist ein Countdown, den man nicht gewinnen
kann. Jetzt: Qualm ab 1, schwarz ab 3,5, Flammen ab 6, Explosion bei 9,5.

Gemessen: aussteigen nach 1,1 Sekunden und weglaufen bringt einen 978 Pixel
weit, die Explosion tut einem dort nichts, und das Spiel läuft weiter. Wer
sitzen bleibt, ist bei 9,5 Sekunden tot. Sitzen bleiben ist jetzt eine
Entscheidung.

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
`#` Mauer, `|` Gitter, `K` das Basketballfeld, `b` die Bänke, `w` die eigene
Kloschüssel, `X` der Boden darunter, `~` der Kriechgang und der lange Tunnel,
`S` die Schächte an seinen Enden, `Z` die harte Wand am Ende des Kriechgangs, `I` die Werkstatt mit ihrem Tisch `A`, `N` die Krankenstation mit
ihren Betten `B` und ihrer verschlossenen Tür `L`, `O` das Fenster darin,
`=` das Kabel. Ein Plan, den man lesen kann,
während man ihn ändert, ist mehr wert als eine Liste von Rechtecken; und fest
ist er aus demselben Grund wie die Stadt: Ein Ausbruch ist ein auswendig
gelernter Weg, und ein Weg, der sich jedes Mal neu mischt, ist ein Labyrinth.

**Eine Leiter statt einer Handvoll Flaggen.** Wie weit der Ausbruch ist, steht
in genau einem Feld (`PrisonStage`), und die Reihenfolge in `LADDER`. Alles
andere fragt danach: welche Stelle der Ring zeigt (`markOf`), was die Leiste
sagt (`taskLine`), ob ein Quadrat noch zu ist (`solid` - der Zellenboden öffnet
sich nach `dig2`, die harte Wand nach `wall`, der Werkstatttisch nach `works`,
das Fenster und das Kabel nach `window`, und die eigene Kloschüssel wird
begehbar, sobald sie ab ist, weil man in genau der Ecke kniet).

**Gesehen zu werden ist erst dann etwas.** `hunting()` beantwortet die eine
Frage, die drinnen zählt, und die Antwort ist seit dem Umbau **eine einzige
Regel: das offene Loch**. Wer über den Hof läuft, im Gang steht oder in seiner
Zelle sitzt, tut das, was er darf - auch mit der Schraube in der Tasche, denn
die sieht niemand. Nur dann greift ein Wärterkegel zu - und derselbe Aufruf
färbt den Kegel im Bild rot. Ein Kegel, den man fürchten muss, und einer, durch
den man laufen darf, dürfen nicht gleich aussehen. Vorher war fast jeder Kegel
rot, und das ist dasselbe, wie gar keinen zu färben.

**Die Mitgefangenen laufen keinen eigenen Weg.** Sie folgen einer Spur von
Brotkrumen, die der Spieler alle `TRAIL_GAP` Pixel fallen lässt. Drei eigene
Wegfindungen durch ein Loch in einer Wand wären dieselbe Schlange, nur teurer
und gelegentlich falsch. Wer überhaupt mitkommt, steht weiter unten unter
„Nur wer zugesehen hat, kommt mit".

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

**Drinnen tragen sie, was die Straße sieht.** Wer an diesem Gefängnis
vorbeifährt, sieht im Hof Männer in **schwarzweißen Streifen** - also stehen
drinnen dieselben Männer in denselben Streifen, aus denselben Konstanten
(`CONVICT_SHIRT` und die anderen, die `render.ts` jetzt exportiert). Vorher war
die Kluft drinnen orange: zwei Gefängnisse, je nachdem, auf welcher Seite der
Mauer man steht.

Das kostet die bequeme Art, Leute auseinanderzuhalten - ein Knast teilt nun
einmal nur einen Anzug aus. Übrig bleiben Gesichter und Haare (die Bande: drei
dunkle Köpfe nebeneinander; der Große: der graue am Block) und vor allem der
Ring aus `markOf`. Wer wichtig ist, sagt das Spiel, nicht der Stoff.

**Die Motorhaube tötet wie die Pistole.** Wer überfahren wird, lässt dasselbe
liegen wie einer, der erschossen wird: die Waffe aus der Hand und das Geld aus
der Tasche. Dafür gibt es jetzt eine Stelle statt zweier - `spillFrom()` -, und
`hurtPerson` und das Überfahren in `inCar` gehen beide da hindurch. Vorher ließ
der Bus nichts liegen und die Pistole schon: eine Stadt, die dafür bezahlt,
welche Waffe man gerade in der Hand hält. Und aus der Hand ist die Waffe
danach auch wirklich weg, sonst stünde der Mann später wieder da und hätte
sie doppelt.

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

## Der Hof, der Zählappell und wer zugesehen hat

Der Ausbruch ist umgebaut worden, und zwar in dieselbe Richtung wie die Bank:
**flach von oben, kein Kippwinkel, keine Klötze**.

### Der Blick

`squash: FLAT`, wie in der Bank - und **keine Linie um jedes Feld**. Eine so
gezeichnete Mauer ist keine Mauer, sondern eine Reihe Blöcke, und der ganze Bau
liest sich dann wie das karierte Papier, auf dem er entworfen wurde. Was einen
Boden vom nächsten trennt, ist jetzt die Farbe und die Maserung darüber:
Asphalt im Hof, ein aufgemaltes Feld in seiner Mitte, Estrich im Block, Erde im
Kriechgang. Die Kabinenwände, das Halbdurchsichtige und der ganze Apparat für
„was steht wovor" sind damit weg - von oben steht nichts vor etwas.

### Der Hof ist derselbe wie von der Straße aus

Der Grundriss ist auf das zusammengestrichen, was ein Gefangener je zu sehen
bekommt: **den Hof und einen Trakt**. Südlich des Hofs der Block: ein Gang mit
vier Zellen daran, die westliche ist die eigene.

Und der Hof sieht **genauso aus wie von außen**, bis auf die Farbwerte: Die
Stadt zeichnet dieses Gefängnis ja bereits, wenn man daran vorbeifährt - Rasen,
ein Basketballfeld, das in den Rasen hineingetreten ist, weiße Linien darüber
und an jedem Ende ein Korb. Genau das steht jetzt auch drinnen, und zwar aus
denselben Konstanten (`YARD_GRASS`, `WORN_EARTH`, `COURT_PAINT` und die
übrigen, die `render.ts` jetzt exportiert). Ein Gebäude, das seinen Belag
wechselt, je nachdem auf welcher Seite der Mauer man steht, wären zwei
Gebäude.

Dazu gehört auch die Ausrichtung: Das Feld **steht der Länge nach im Hof**, Korb
zu Korb, wie außen. Quer gelegt liest es sich als Tennisplatz ohne Netz. Und
gemalt wird es als **ein Bild** über die Felder, die es bedeckt, nicht Quadrat
für Quadrat - ein Mittelkreis aus vier Viertelquadraten ist kein Kreis.

Das Feld steht dabei **rechts im Hof**, nicht in der Mitte: In die Ecke, die
dadurch frei wird, gehört die Werkstatt - `Prison Industry`, dieselbe, die auch
von der Straße aus im Hof steht. Von oben ist sie ein Dach mit Lichtbändern,
ein Schornstein mit Rauch in der fernen Ecke und das Schild an der Wand zum Hof
hin. Der Rauch ist das, was sagt, dass dort gearbeitet wird - und eine
Werkstatt, in der die Männer dieses Trakts ihren Tag verbringen, ist überhaupt
der Grund, warum jemand im Hof steht.

Die Bänke stehen, wie außen, **längs neben dem Feld** - drei je Seite, mit
Lücken dazwischen. Vorher war es eine geschlossene Reihe quer durch den ganzen
Hof: Das ist keine Möblierung, das ist ein Zaun, und man kam nicht mehr daran
vorbei.

Draußen vor der Mauer liegt die **Straße**, auf der das Gefängnis steht, keine
Wiese.

Der Weg nach draußen läuft unter dem Plan, und er läuft zweimal ins Leere,
bevor er hinausführt - was dahinter steckt, steht unten unter „Die lange
Kette". Oben links die Werkstatt, oben rechts die Krankenstation: zwei Räume,
die man **betreten** kann. Solange man draußen steht, sind beide das, was die
Straße von ihnen sieht - ein Dach mit Lichtbändern, ein Schornstein, ein rotes
Kreuz. Sobald man drin steht, ist das Dach weg und es sind Maschinen, ein
Tisch, vier Betten und ein Fenster. Beides muss stimmen, und die Weiche dafür
ist eine Zeile: auf welcher Seite der Tür der Spieler steht (`inside`).

### Nur wer zugesehen hat, kommt mit

Vorher liefen dem Spieler schlagartig alle hinterher, sobald die Wand offen war

- das ist eine Menschenmenge, kein Ausbruch: Niemand wusste etwas, sie waren
  plötzlich da. Jetzt entscheidet, **wer gesehen hat, was man tut**: Bei jeder
  fertigen Arbeit schaut `witnesses()`, welche Herumstehenden nah genug sind und
  freie Sicht haben - dieselbe Sichtprüfung, die auch für Wärter gilt -, und
  genau die wechseln von `idle` nach `mates`. Wer einen über einem Abfluss knien
  sieht, weiß genau eine Sache über einen und hat vor, dabei zu sein, wenn es
  losgeht.

Das macht aus dem Umschauen eine Entscheidung: An der Bank im vollen Hof
schraubt man mit Publikum, in der eigenen Zelle allein. Nachgemessen: Bank mit
einem Zuschauer in Reichweite → ein Mitläufer und die Zeile „Einer hat
zugesehen - der kommt jetzt mit."; dieselbe Arbeit in der Zelle → keiner.

### Erwischt heißt nicht vorbei

Dreimal gesehen zu werden beendet **diesen Versuch**, nicht die Chancen. Danach
steht man wieder vor denselben zwei Türen wie nach der Verhaftung: noch einmal
probieren oder absitzen und zahlen. Ein Ausbruch, den man nur einmal versuchen
darf, ist ein Ausbruch, für den man einen Spielstand lädt.

### Zählappell

Alle 85 Sekunden wird gezählt, 16 Sekunden vorher sagt es die Leiste. Verlangt
wird das Einfachste: **in der eigenen Zelle stehen, mit leeren Händen**. Wer
dabei über seinem Abfluss kniet, ist ebenso gemeldet wie einer, der im Hof
steht - `prison.work` muss auf null sein.

Wer fehlt, wird nicht gegriffen. Es passiert etwas Schlimmeres: Sie fangen an zu
**suchen**. Eine halbe Minute lang sehen alle Wärter anderthalbmal so weit und
so breit (`SEARCH_EYES`, im Bild an den größeren Kegeln zu sehen), und in dieser
Zeit reicht es, am falschen Ort zu stehen - `hunting()` ist wahr, sobald man
nicht in der eigenen Zelle ist. Danach wird es wieder ruhig.

Die Uhr dafür steht rechts in der Leiste und färbt sich innerhalb der Vorwarnung
gelb: Ein Knast, der zählt, ohne zu sagen wann, wäre eine Stoppuhr, die man
nicht sehen darf.

## Die lange Kette: Schraube, Bande, zwei Löcher und ein Kabel

Vorher waren es vier Handgriffe: Schraube, Klo, Steine, Gitter. Das ist kein
Ausbruch, das ist eine Einkaufsliste. Jetzt sind es **elf Sprossen**, und jede
einzelne geht entweder schief oder kostet etwas:

| Sprosse  | Was zu tun ist                                    | Sekunden |
| -------- | ------------------------------------------------- | -------- |
| `screw`  | im Hof an einer Bank die Schraube abdrehen        | 2,6      |
| `gang`   | den Großen am Block anheuern                      | 1,6      |
| `loo`    | in der Zelle die Schüssel abschrauben             | 3,2      |
| `dig`    | graben, mit der Schüssel als Deckel               | 9        |
| `moved`  | in der neuen Zelle Streit anfangen                | 3,5      |
| `dig2`   | zurück in der alten Zelle weitergraben            | 7        |
| `wall`   | im Kriechgang die Wand am Ende durchbrechen       | 4        |
| `works`  | in der Werkstatt graben, mit dem Tisch als Deckel | 8        |
| `ward`   | durch den Tunnel (kein Laufen, eine Ankunft)      | -        |
| `window` | das Fenster der Krankenstation aufdrücken         | 2        |
| `cable`  | am Kabel über die Mauer                           | -        |

### Was eine fertige Arbeit sonst noch auslöst

Die Leiter selbst ist stumpf: fertig, eine Sprosse weiter. Die Geschichte
steht in **einer** Funktion daneben, `afterJob(prison, done)`, und sie ist vier
Zeilen lang - weil jede Wendung dieser Kette daraus besteht, dass jemand
woanders steht als vorher.

- **`screw` → die Bande hat sie.** Die Schraube ist ab, und drei Mann im Hof
  haben genau hingesehen. Sie kommen herüber und nehmen sie einem aus der Hand
  - als Szene, siehe unten. Man hat sie ganze vier Sekunden lang gehabt.
- **`gang` → der Große geht los.** Man heuert nicht die Bande an, sondern den
  einen Mann, mit dem die Bande nicht streitet. **Der steht von der ersten
  Minute an am Block** und nicht erst, wenn man ihn braucht: Man heuert den
  an, den man sieht, sonst ist der Hof ein Automat, aus dem bei Bedarf ein
  Helfer fällt. Gezeichnet wird kein Kampf -
  `runErrand()` lässt ihn hinlaufen („Er nimmt sie ihnen ab. Keiner sagt
  etwas."), zurücklaufen, und wenn er ankommt, liegt sie in der Tasche.
- **`dig` → der Direktor.** Niemand gräbt einen halben Zellenboden weg, ohne
  dass der Staub auffällt, und was ein Gefängnis dagegen tut, ist **verlegen**.
  Er holt einen an der Zellentür ab und geht mit einem den Gang hinunter -
  auch das eine Szene. Danach steht man in einer neuen Zelle, drei Türen
  weiter, mit einem fremden Zellengenossen und einem `myGate`, das jetzt zu
  ist.
- **`moved` → zurück.** Den Neuen kann man nicht fragen; den Ersten hatte man
  sich zum Freund gemacht. Also Streit, genug Blut für eine Verlegung, zurück
  in die alte Zelle - und das Loch liegt noch da, wo man es gelassen hat.

### Zwei Dinge passieren einem, statt dass man sie tut

Die Bande, die einem die Schraube abnimmt, und der Direktor, der einen verlegt,
waren vorher je eine Zeile Text und ein Zustandswechsel im selben Bild. Das ist
keine Wendung, das ist eine Meldung. Jetzt sind beides **Szenen**
(`PrisonScene`), und beide sind nach demselben Muster gebaut:

- Ein paar Leute laufen herein, machen das eine, was die Geschichte braucht,
  und laufen wieder hinaus. Die Uhr dafür steht im Zustand (`left`).
- **Solange sie läuft, tun die Tasten nichts.** `advance()` ruft in dem Fall
  gar nicht erst `walkHero`, `coverUp` und `doWork` auf. Wer währenddessen
  wegspazieren könnte, bekäme von beiden Szenen ein Angebot statt einer
  Tatsache.
- **Bezahlt wird am Ende, nicht am Anfang** (`endScene`). Die Bande hat die
  Schraube erst, wenn der Mittlere vor einem steht; die Zelle ist erst die
  neue, wenn der Gang zu Ende gegangen ist. Andersherum sieht man einer Szene
  zu, deren Ergebnis längst im Zustand steht.
- Der Zielring (`markOf`) ist weg und die Leiste sagt, was los ist („Die Bande
  kommt rüber. Da ist nichts zu machen.") - es gibt in diesen Sekunden nichts,
  wohin man laufen könnte.

**Die Bande** stellt sich in einer Reihe vor einen hin, nicht auf einen drauf:
einer in der Mitte mit der Hand auf, links und rechts je einer, `SCENE_APART`
auseinander. In der Mitte der Szene stehen alle drei still - dieser eine Moment
ist der Übergabe, und ohne ihn ist das Ganze ein Vorbeijoggen. Wie schnell sie
laufen, steht nicht fest, sondern ergibt sich aus Strecke und Restzeit: Wo man
stand, als die Schraube abging, ist jedes Mal woanders, und ein Weg, dem die
Szene ausgeht, endet mitten im Hof.

**Der Rückweg** ist dieselbe Szene noch einmal, nur andersherum: Nach dem
Streit bringt einen ein Wärter den Gang zurück in die alte Zelle. Deshalb ist
aus `bossStep` ein `walkStep` geworden, das beide Richtungen läuft - wer den
Weg hin zeichnet und den Weg zurück in einen Sprung auflöst, hat aus derselben
Strecke zwei verschiedene Dinge gemacht. Der einzige Unterschied ist der
Anfang: Den Direktor muss man erst kommen sehen, der Wärter steht schon da, er
hat die Schlägerei gerade getrennt.

**Der Direktor** ist die einzige Figur im Knast im Anzug statt in Kluft, und
er existiert genau diese fünf Sekunden - ein Direktor, der im Trakt herumsteht,
wäre ein Wärter mit besserem Mantel. Er kommt den Gang herunter bis an die
Zellentür, und dann gehen beide die Länge des Trakts, er ein paar Schritte
voraus (`BOSS_AHEAD`). Der Weg ist eine Linie aus vier Punkten, und abgefahren
wird sie **nach Länge**, nicht nach Teilstück (`alongPath`): Der Gang ist ein
Vielfaches von dem Stück in der Zelle, und die Uhr gleichmäßig auf beide zu
verteilen hieße, den Trakt entlangzusprinten und durch die Tür zu schleichen.

### Der Deckel ist das ganze Mittelstück

Leertaste, und mehr ist es nicht: `coverUp()` schiebt die Schüssel über das
Loch und wieder weg, in der Werkstatt den Tisch. Man kann **nicht durch den
Deckel graben**, und ein Wärter, der einen an dem offenen Loch sieht, hat alles
gesehen - `hunting()` ist genau dafür wahr und für sonst nichts.

**„An dem Loch" heißt zwei Felder** (`HOLE_NEAR`), also etwa die eigene Zelle.
Wer in den Gang tritt, ist wieder ein Gefangener beim Herumlaufen; wer darüber
kniet, während Stiefel vorbeigehen, ist ein Fall für den Bericht. Und erwischt
zu werden kostet einen Versuch und den Rückweg in die Zelle - die Schraube
bleibt in der Tasche. Eine Kette mit einem Reset darin ist eine Kette, die
niemand zu Ende spielt.

Damit ist Graben keine Frage von „schaffe ich das", sondern von „wie viel
schaffe ich, bevor die nächsten Stiefel vorbeikommen". Der Gang wird alle paar
Sekunden abgelaufen, das Loch braucht neun; das geht nur in Stücken. Genau
deshalb ist die Sprosse mit neun Sekunden die längste im Spiel - eine, die in
einem Rutsch durchginge, bräuchte den Deckel nicht.

Der Tastendruck wird auf die **Flanke** gelesen (`liftHeld`), nicht auf das
Gedrückthalten: Sonst flackert der Deckel sechzigmal in der Sekunde.

### Zweimal ins Leere, einmal hinaus

Der Kriechgang unter dem Block endet an einer Wand, und hinter der Wand ist
**Fels**. Das ist kein Bug, das ist die Sprosse `wall`: Vier Sekunden Arbeit
und eine Meldung, die dann auch sagt, was jetzt gilt - „Der Gang ist eine
Sackgasse - hier kommst du nie raus. Bleibt der zweite Plan: rauf in die Prison
Industry und von dort einen Tunnel graben." Eine Sackgasse, die einem nur
mitteilt, dass es nicht weitergeht, ist ein Spielstand, den man lädt. Ein Ausbruch, bei dem der erste Tunnel
stimmt, ist ein Gang mit Türen dran.

Der zweite Anlauf ist die **Werkstatt**: derselbe Deckel-Rhythmus, nur mit
einem Tisch. **Dort ist niemand postiert** - einer der Männer aus dem Hof läuft
ab und zu auf die Halle zu und durch die Tür herein, und das ist der
Unterschied: Man hört die Tür, statt einem Mann zuzusehen, der in dem Raum auf
und ab geht, in dem man gräbt. Seine Runde (`ROUNDS`) beginnt darum mitten im
Hof und endet erst drinnen; ungefähr ein Drittel seiner Zeit verbringt er in
der Halle. Von dort läuft
der Tunnel unter dem Hof hindurch in die **Krankenstation**, und der wird
**gelaufen**: Wer in das Loch steigt, kommt am Westende des Tunnels heraus
(`TUNNEL_WEST`), geht die zwanzig Felder nach Osten und steigt am anderen Ende
die Leiter hoch, mitten in die Krankenstation. Vorher war das ein einziger
Sprung - die längste Strecke des ganzen Ausbruchs war in dem Bild vorbei, in
dem sie anfing.

**Da unten ist kein Wärter**, und das steht auch in der Aufgabenzeile. Der
Tunnel liegt unter der ganzen Anlage, keine Runde führt dorthin, und genau das
ist der Lohn für zwei Löcher: die einzigen Minuten dieses Ausbruchs, in denen
man geradeaus gehen darf. Im Plan sind es die beiden untersten Zeilen, mit
einem `S` an jedem Ende - dem Schacht, durch den man hinein- und hinauskommt.

Die Krankenstation hat eine Tür zum Hof, und die ist **`locked`** - ein
eigener Belag, immer zu. Eine Tür, durch die man einfach hineinspazieren
könnte, würde jedes Loch in diesem Knast zur Verschwendung machen.

Durch das Fenster in der Nordmauer, ans Kabel, und daran entlang über die
Mauer - drei Felder weit, im Schritttempo (`CABLE_PACE`), quer durch den Blick
des Turmwärters. Das Kabel ist mit Absicht kein einzelnes Feld mehr: Hangeln,
das nach einem Schritt vorbei ist, ist kein Hangeln.

### Wie das gezeichnet ist

**Das Loch ist immer zu sehen, der Deckel steht davor oder daneben.** Ein
Deckel, der das Loch auch vor dem Spieler verbirgt, lässt einen raten, wie die
eigene Zelle gerade aussieht. Also: Sobald die Schüssel von der Wand ist, liegt
das Loch da - und die Schüssel steht entweder mitten drüber oder schräg
daneben in der Zelle. Beides ist **dieselbe Schüssel** (`panShape`), einmal
angeschraubt und einmal abgestellt; an der Wand bleibt der blanke Flansch.

Und nach der Sackgasse legt sie sich von selbst wieder drüber: Niemand steigt
aus einem Loch im eigenen Zellenboden und lässt es offen hinter sich liegen.

**Ein Loch ist keine schwarze Kachel.** Erst der Zellenboden, damit die Ecke
zur Zelle gehört; darauf die aufgeworfene Erde, darin der dunkle Schacht, und
drumherum die Steine, die man herausgehoben hat - dort, wo ein Kniender sie
hingelegt hätte. Dasselbe Bild in der Werkstatt, nur mit aufgebrochenem Beton
statt Erde, damit die beiden Löcher als **eine** Arbeit lesbar sind, die man
zweimal macht.

**Solange nicht gegraben ist, ist da nichts zu sehen.** Der Boden über dem
späteren Schacht ist Estrich wie der Rest der Zelle. Ein Boden, dem man ansieht,
wo er schwach ist, ist ein Boden mit der Lösung drauf.

**Räume bekommen Möbel, keine leeren Flächen.** In der Werkstatt drei Maschinen
an der Nordwand, ein Werkzeugbrett an der Ostwand und Öl im Beton; in der
Krankenstation vier Betten, ein Schrank, ein Wagen und der grüne Strich auf dem
Linoleum. Nichts davon steht im Weg - zu erreichen sind hier genau zwei Dinge,
der Tisch und das Fenster, und Möbel, um die man herumlaufen muss, machen die
nur schwerer zu finden.

**Ein Klo hängt an der Wand.** Der Abfluss liegt im Mauerwerk, also steht der
Spülkasten bündig an der Südwand jeder Zelle, die Schüssel ragt davor in den
Raum, und ein kurzes Stück Rohr verbindet beides; dazu der Sitzring, das Wasser
darin und der Schatten in die Ecke. Vorher war es eine freistehende Ellipse mit
dem Kasten auf der **falschen** Seite - zum Gang hin, wo keine Wand ist -, und
das liest sich als Eimer, den jemand hat stehen lassen.

Das zahlt sich zweimal aus: Die Wand, an der das Ding hängt, ist genau die, in
die man gräbt. Schüssel, Rohr und Loch sind dieselbe Ecke derselben Zelle.

**Und geschoben sieht es aus wie die anderen drei.** Steht die Schüssel über dem
Loch, wird sie mit demselben Aufruf gezeichnet wie jedes andere Klo im Trakt -
und am alten Platz dann gar nicht, denn es gibt nur eine (`panOnHole`). Ein
Deckel, der wie ein Deckel aussieht, ist genau das, was ein Wärter im
Vorbeigehen bemerkt.

**Das Fenster ist ein Fenster.** Vier Scheiben, Gitter davor, eine Sohlbank
nach innen; offen ist es ein schwarzes Loch mit dem Flügel, der nach draußen
steht. Vorher war es ein Gitter am Ende eines Gangs, und das war es auch, was
man sah.

**Über den Rasen laufen Trampelpfade.** Vom Blocktor am Feld vorbei bis zur
Werkstatttür, in zwei Zügen gemalt: außen der ausgedünnte Rasen, innen die
blanke Erde. Männer laufen dieselbe Linie jahrelang zweimal am Tag - und es ist
das billigste Detail im ganzen Hof und das, was ihn benutzt aussehen lässt
statt gemäht.

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

## Das Autoradio: der Ordner ist die Senderliste

Wer in ein Auto steigt, hört ein Lied - und beim nächsten Auto ein anderes.

**Im Code steht kein einziger Dateiname.** Die Seite (`app/gta/page.tsx`) wird
auf dem Server gerendert und kann deshalb einfach in den Ordner schauen; was
sie findet, ist beim Bauen in der Seite eingebacken und wird an den Spiel-
Bildschirm weitergereicht. Genau dasselbe Verfahren wie bei den Bildern des
Ladebildschirms (`splashes()`), inklusive `NEXT_PUBLIC_BASE_PATH` davor -
sonst zeigt die Adresse auf GitHub Pages ins Leere.

**Wohin die Dateien gehören:** `website/public/gta/radio/`

- `.mp3` (auch `.m4a`, `.ogg`, `.opus`, `.webm`, `.wav`)
- Die Namen sind egal; es werden alle genommen, alphabetisch sortiert.
- Danach einmal neu bauen bzw. deployen, damit die Liste in der Seite landet.
- Die `README.md` im Ordner bleibt liegen - gezählt werden nur Audiodateien.
- **Benennung `Künstler - Titel.mp3`**, denn aus dem Dateinamen entsteht
  sowohl die Anzeige im Bild als auch der Nachweis auf der Seite.

**Das Radio selbst** (`audio/radio.ts`) ist ein einziges `Audio`-Element für
die ganze Sitzung: Ein Autoradio ist kein Soundeffekt, es gibt immer nur eines
davon. Eingeschaltet wird es in dem Bild, in dem sich `player.car` von „keins"
auf ein Auto ändert, ausgeschaltet in dem Bild, in dem es wieder „keins" wird -
ein Ereignis, kein Zustand. Dazwischen fasst es niemand an.

**Nie zweimal hintereinander derselbe Sender** in einem _anderen_ Auto: Wer
umsteigt und dasselbe Lied hört, merkt genau das sofort.

**Beim selben Auto ist es umgekehrt.** Das zuletzt gefahrene Auto wird gemerkt
(Wagennummer, Sender, Sekunde), und wer dort wieder einsteigt, hört dasselbe
Lied an genau der Stelle weiter. Kurz aussteigen, um ein Tor zu öffnen, ist
kein Grund, den Nachmittag von vorn zu beginnen. Gemerkt wird nur **das letzte**
Auto - eine Notiz je Wagen wäre in einer Stadt mit zweihundert Autos eine
Erinnerung an nichts, das jemand hört. Nachgemessen: bei 42,5 Sekunden
ausgestiegen, wieder eingestiegen, Lied läuft bei 42,5 Sekunden weiter.

**Eine Raste hinter dem letzten Lied ist „Radio aus".** Das Zifferblatt hat
eine Stelle mehr als es Lieder gibt; von selbst wird sie nie gewählt - ein
Auto, das ohne Radio anspringt, sieht nach einem kaputten Radio aus -, aber
hindrehen kann man. Unten rechts steht dann genau das.

**Mit einer Ausnahme: Streifenwagen starten still.** Wer sich in einen Wagen
der Polizei setzt, sitzt nicht in einem Auto mit Radio, sondern in einem mit
Funk - da läuft erst einmal nichts. Anschalten geht mit dem Mausrad wie
überall, und weil danach auch dieser Wagen gemerkt wird, bleibt es beim
nächsten Einsteigen an. Gilt für alles Blaue: Streifenwagen, Polizeimotorrad,
Polizeiboot.

**Und alles ist eingepackt.** Eine fehlende Datei, ein Codec, den der Browser
nicht mag, oder die Autoplay-Regel des Browsers enden alle gleich: still, und
das Spiel läuft weiter. Ohne Ordner gibt es kein Radio und sonst keinen
Unterschied.

**Unten rechts steht, was läuft** - „RADIO" klein und darüber, darunter der
Titel. Der Titel ist der **Dateiname**, weil ein mp3 in einem Ordner keinen
anderen Namen hat: `nameOf()` wirft die Endung weg, macht aus `_` und `%20`
Leerzeichen, wirft eine führende Titelnummer weg und glättet die Bindestriche -
aus `04_-_Bad Company.mp3` wird `Bad Company`. Zu lange Titel werden gekürzt
und bekommen ein `…`, nicht eine kleinere Schrift. Auf dem Telefon rutscht das
Feld über die Daumentasten, sobald der Bildschirm einmal berührt wurde.

**Das Mausrad ist im Auto die Senderwahl.** Zu Fuß ist eine Raste eine Waffe,
hinter dem Lenkrad ist eine Raste ein Sender - vorwärts wie rückwärts, im
Kreis. Das ist auch der einzige Ort, an dem das Waffenrad nie zu gebrauchen
war: Aus dem fahrenden Auto wird ohnehin nicht geschossen.

### Die Geräusche liegen daneben, mit festen Namen

Das Radio ist ein Ordner voller austauschbarer Dateien; ein **Geräusch** gehört
zu einem Moment. Deshalb liegen die unter `website/public/gta/sounds/` und
haben feste Namen - benannt nach dem Moment, nicht nach dem Klang:

| Datei              | Wann                                                       |
| ------------------ | ---------------------------------------------------------- |
| `car-enter.mp3`    | Einmal beim Einsteigen in ein Auto                         |
| `police-siren.mp3` | Schleife, solange eine Streife auf Einsatz in Hörweite ist |

**Die Sirene ist eine Entfernung, kein Ereignis.** Wie laut sie ist,
entscheidet der nächste Wagen, den die Wache losgeschickt hat
(`kind: "police"` - dieselbe Prüfung, die auch den Lichtbalken blinken lässt;
die Streifen im normalen Verkehr fahren ohne). Voll innerhalb von zwei
Wagenlängen, nichts mehr anderthalb Bildschirme weit weg, dazwischen
**quadratisch** abfallend: Schall fällt schneller ab als eine Gerade, und eine
lineare Blende liest sich wie jemand, der am Lautstärkeregler dreht, statt wie
etwas, das näher kommt. Nachgemessen: 180 px → 100 %, 400 px → 69 %,
800 px → 28 %, 1200 px → 5 %, ab 1500 px still.

Sie ist auch die einzige **Schleife**: ein Element, das lauter und leiser
gedreht wird. Alles andere sind Einzeltöne mit einem eigenen Element je Ton,
damit zwei sich überlagern können.

Ein neues Geräusch sind zwei Zeilen in `audio/sounds.ts` - ein Name in
`OneShot`, die Datei daneben in `FILES` - und die Datei im Ordner. Fehlt sie,
bleibt es still. Jeder Ton bekommt sein **eigenes** `Audio`-Element und wird
danach weggeworfen: Ein gemeinsames Element würde eine zufallende Tür abwürgen,
um die nächste zu spielen. Schreibweise und Aufbau sind dieselben wie bei
Panzerkiste, damit man sich nicht zweimal etwas merken muss.

Die Geräusche kommen von **freesound.org**, und dort hat **jede Datei ihre
eigene Lizenz** - meist CC0, oft aber CC BY. Was CC BY ist, steht zusätzlich
**sichtbar im Spiel**: unter dem Bild neben der Musik im Abschnitt „Geräusche",
gespeist aus `SOUND_CREDITS` in `audio/sounds.ts` - mit Titel, Autor, Quelle,
Lizenz und dem Wort „bearbeitet", weil die Dateien geschnitten sind. Was CC0
ist, steht dort bewusst nicht: Eine Liste, die auch das aufführt, wofür niemand
eine Nennung verlangt, liest irgendwann keiner mehr. Im Ordner-README steht die Tabelle
nach dem üblichen Schema (Titel, Autor, Quelle, Lizenz) und dazu eine Spalte
**„bearbeitet"**: Die Dateien sind nicht die Originale, sondern umgewandelt,
geschnitten und komprimiert, und CC BY verlangt neben der Namensnennung
ausdrücklich den Hinweis auf Änderungen. Welche Werkzeuge dafür benutzt wurden,
steht darunter - nicht weil die Werkzeuge genannt werden wollen, sondern damit
der Weg wiederholbar ist. Ist eine Datei CC BY, gehört ihre Zeile zusätzlich
sichtbar ins Spiel, genau wie die Musik.

**Das Radio kommt nicht mit der Tür.** Wer einsteigt, hört eine Sekunde lang
nichts und dann Musik, die in einer weiteren Sekunde auf ihre Lautstärke
hochblendet (`RADIO_DELAY`, `RADIO_FADE`). Das ist der Unterschied zwischen
„ein Lied wird abgespielt" und „ich habe mich in ein Auto gesetzt". Von Hand am
Mausrad ist es umgekehrt: Da kommt der Sender sofort und voll - man hat ja
gerade gedreht, und ein Regler, der zwei Sekunden braucht, ist kaputt.
Nachgemessen: nach 0,6 s still, nach 1,1 s bei 4 %, nach 1,6 s bei 33 %, nach
2,1 s voll.

**Die Lautstärke ist ein Regler über dem Bild**, derselbe wie bei Panzerkiste -
bis auf den Speicherplatz dasselbe Bauteil (`lib/storage/volume-store`). Ganz
links ist stumm; einen zweiten Schalter dafür gibt es nicht und soll es nicht
geben. Er gilt für **alles**, was das Spiel von sich gibt - Radio wie
Geräusche: Zwei Regler für ein Auto wären zwei Regler zum Suchen. Eine Webseite mit zwei Spielen sollte nicht zwei Vorstellungen davon
haben, wie ein Lautstärkeregler aussieht - und wer ihn in dem einen Spiel
gefunden hat, hat ihn in beiden gefunden. Gemerkt wird er unter einem eigenen
Schlüssel, so wie dort.

### Der Nachweis gehört dazu

Die Lieder kommen vom **Free Music Archive** und stehen unter **CC BY**. Diese
Lizenz verlangt eine angemessene Namensnennung: Titel, Künstler, Quelle und
Lizenzart. Genau das steht jetzt unter dem Bild im Abschnitt **Musik** - eine
Zeile je Lied, Quelle und Lizenz verlinkt -, und es entsteht aus denselben
Dateinamen wie die Senderliste (`creditOf()` teilt `Künstler - Titel` auf).

Damit trägt sich jedes neue Lied selbst ein: Wer eine Datei in den Ordner legt,
hat den Nachweis dabei, und niemand muss daran denken, eine Liste zu pflegen.
Im Ordner selbst steht dasselbe noch einmal in Prosa (`public/gta/radio/
README.md`), für den Fall, dass ein Stück einmal unter einer anderen Lizenz
dazukommt - dann gehört es dort vermerkt.

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
| `audio/radio.ts`            | Das Autoradio: ein Element, ein Lied je Auto   |

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
