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

## Der Cybertruck ist der Golf rückwärts

Derselbe Kasten, dieselben drei Stockwerke, und trotzdem das Gegenteil - weil
alles, was den Golf ausmacht, hier **weggelassen** wird:

| Golf                           | Cybertruck                           |
| ------------------------------ | ------------------------------------ |
| zwölf Ecken, gefast            | vier Ecken, scharf                   |
| Radlauf ins Blech geschnitten  | schwarzes Trapez aufgesetzt          |
| zwei Lampen plus Balken        | ein Balken, durchgehend, beide Enden |
| Scheiben mit Rahmen und Säulen | eine Scheibe, ein Keil               |
| Kofferraumdeckel               | offene Ladefläche mit Abdeckung      |

Dazu kommt der Grundriss: Von oben ist dieses Fahrzeug ein **Sechseck** - die
Nase zieht hart ein, das Heck etwas, und am breitesten ist es über den Rädern.
Das ist dieselbe Tabelle (`NARROWS`), mit der der Golf beinahe gleich breit
bleibt, nur andersherum benutzt.

Das Zeichnen eines Cybertruck besteht darin, nichts zu tun, was man sonst täte.
Die einzige Stelle, an der er eine Sonderregel braucht, ist der Lichtbalken: Er
läuft an der **Oberkante** des Blechs statt auf halber Höhe, also gibt es zu
`LAMP_HIGH` eine Tabelle mit den Fahrzeugen, die ihre Lampen woanders tragen.

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

Zwei Fallstricke, beide erlebt:

- **Haftung als feste Abzugsmenge** (`slip - bite*dt`) macht das Verhalten
  binär: eine Stufe mehr Haftung und der Wagen rutscht _nie_, eine weniger und
  er dreht sich weg. Die Exponentialform ist stufenlos abstimmbar.
- **Wer `speed` setzt, muss `slip` mitsetzen.** Sonst schiebt ein stehendes
  Auto weiter seitwärts vor sich hin.

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

`paintHeli` zeichnet die Maschine - Kabine, Stummelflügel, Heckausleger,
Heckrotor, vier Blätter -, und beide Hubschrauber im Spiel sind sie: die
Polizei in Blau, das Militär in Oliv. Ein zweites Bild hätte bedeutet, jede
Änderung zweimal zu machen und beim zweiten Mal daneben.

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
