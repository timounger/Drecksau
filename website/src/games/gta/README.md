# GTA

Los Santos von oben. Du läufst durch die Stadt, nimmst dir ein Auto, fährst
Aufträge - und je schneller du unterwegs bist, desto mehr interessiert sich die
Polizei für dich. Wer alle vier Viertel übernommen hat, dem gehört die Stadt.

## Spielen

- Gegen die Stadt: `/gta`
- **W A S D** oder Pfeiltasten: zu Fuß in alle vier Richtungen, im Auto Gas,
  Bremse und Lenkung
- **Maus**: zu Fuß der Blick - **Klick** schießt dorthin
- **E** oder **Enter**: ein- und aussteigen
- **Shift** halten oder der Knopf **Turbo (Cheat)**: zu Fuß zehnfach, im Auto
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

Was **nicht** ins Bild gebacken wird, ist alles, was sich ändert: der Schatten,
der grüne Rahmen um den Wagen, in dem man sitzt, und der Rauch eines Wracks.

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

Shift ist ein Cheat: zehnfaches Tempo zu Fuß, dreifaches im Auto. Er kostet
eine Zeile im Motor - und eine zweite, wichtigere, in der Kollision.

Zwei Schalter führen auf dieselbe Fahne: die gehaltene Taste und ein Knopf im
Kopf, der einrastet. Der Knopf ist nicht nur Bequemlichkeit - er ist sichtbar.
Eine gehaltene Taste kann am Fenster vorbeigehen, vom System geschluckt werden
oder beim Alt-Tab hängen bleiben, und dann steht man vor einem Cheat, der
vielleicht kaputt ist und vielleicht nur nicht ankommt. Der Knopf leuchtet,
wenn der Turbo läuft, und beantwortet die Frage.

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
