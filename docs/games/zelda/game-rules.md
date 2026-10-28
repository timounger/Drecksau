# Zelda: Was umgesetzt ist

Kleines Fan-Abenteuer im Stil von _The Legend of Zelda: The Minish Cap_ (Game
Boy Advance). Diese Seite hält fest, **was umgesetzt ist und was bewusst
fehlt** - damit beim nächsten Ausbau niemand raten muss.

Vom Original übernommen ist nur das **Spielgefühl**: Tempo, Zeiten, Aufbau von
HUD, Textbox und Menü, die Art der Rätsel. Karten, Räume, Figuren, Gegner,
Bosse, Geschichte, Grafik und Töne sind eigene Erfindungen - keine Nintendo-
Inhalte, keine nachgezeichneten Sprites oder Raumpläne, keine Namen aus dem
Original (außer dem Helden Link und den Gattungsnamen der Oberwelt-Monster aus
der ersten Version).

## Geschichte

Der Schattenmagier **Vorgrim** hat den **Sonnenstein** aus dem Brunnen von
Grünau geraubt und im **Moostempel** in der Klippe nördlich des Dorfes von
einem steinernen Wächter bewachen lassen. Die **Dorfälteste** schickt Link los;
**Tamo**, die Wache am Tempeltor, lässt ihn erst danach hinein. Nach dem Sieg
über den **Steinwächter** bringt Link den Sonnenstein zurück; die Älteste
verweist dann auf Vorgrims schwarzen Ritter (Darknut) in den Ruinen und den
schweren Felsen am Spiegelsee.

## Umgesetzt

- **Gebiete** (je eine Buchstabenkarte, 16 x 16 Pixel je Feld, Bildausschnitt
  240 x 160 wie auf dem GBA):
  - **Oberwelt** 64 x 48 Felder, weich mitlaufende Kamera: Dorf Grünau mit
    Ältestenhaus und Laden, Feld, Dunkelwald, Hügelland, Fluss, Spiegelsee,
    Moblin-Weide, Ruinen. Elf Schilder.
  - **Moostempel**: vier mal drei Räume zu je einem Bildschirm (zehn genutzt).
    Die Kamera bleibt im Raum und **scrollt** beim Durchschreiten einer Tür in
    0,7 s zum nächsten, Link läuft dabei ein Stück hinein.
  - **Häuser**: Ältestenhaus und Laden, zwei Räume eines Innenbereichs.
  - **Wurzelreich**: 30 x 20 Felder unter der Wiese, Link in normaler Größe,
    dafür Grashalme so hoch wie Häuser und Kiesel so groß wie Felsen.
  - Türen, Tempeltor, Treppe und Mauselöcher führen per **Abblende** (0,3 s
    schwarz werden, kurz schwarz, 0,3 s zurück) in ein anderes Gebiet.
- **Spielgefühl** (am Gameplay-Video abgeglichen): Laufen mit weichem Anlauf
  und Abbremsen (rund 0,1 s), 76 px/s; Schwerthieb in 0,26 s mit Ausholen,
  Schwung und kurzem Halten, weißer Schwungbogen; Wirbelattacke nach 0,85 s
  Laden mit vollem Kreisbogen; Rollen mit Staubwolken; kurzes Einfrieren beim
  Schwerttreffer; Rückstoß und Blinken nach Treffern; Bildschirmwackeln bei
  Boss-Stößen.
- **Schwimmen und Tauchen** (von Anfang an): Wasser (`~`) ist für Link
  begehbar, sobald seine Füße darin stehen, schwimmt er - 62 % des
  Lauftempos, nur Kopf und Schultern über der Wasserlinie, paddelnde Arme,
  Ringe auf dem Wasser, Platschen beim Hinein- und Herausgehen. Im Wasser
  keine Gegenstände, kein Reden; A oder B macht einen Schwimmzug (0,32 s
  schneller), R taucht für 1,5 s (dunkler Schatten und Luftblasen, 75 % des
  Schwimmtempos, Monster und Schüsse treffen nicht), danach 0,7 s Pause.
  Klein oder mit einem Felsen über dem Kopf sperrt Wasser wie bisher. Vier
  Tauchstellen (Glitzern und Blasen auf dem Wasser): drei Rubinhorte (Fluss,
  zweimal See) und tief im See ein **Herzcontainer**; geleerte Stellen sind
  Merker `dive:overworld:<Feld>` im vorhandenen Speicherformat. Rund um die
  Insel im Spiegelsee liegt eine reißende **Strömung** (`c`, dunkler mit
  kreisenden Schaumstreifen), in der niemand schwimmt: die Insel bleibt nur
  mit dem Enterhaken über die beiden Pfosten erreichbar. Die Sprungfeder
  landet im offenen Wasser ohne Strafe, in Strömung oder Pfütze kostet die
  Landung wie bisher ein halbes Herz und setzt Link zurück.
- **Niedrige Kanten** (`l`): zwei Stücke der Hochebenen-Kante (Felder 30-37
  und 51-55 in Zeile 13) sind nur eine Stufe hoch und als schmale Felsleiste
  gezeichnet, darunter Wiese. Läuft Link 0,15 s nach unten dagegen, hüpft er
  in 0,35 s im Bogen hinunter (unverwundbar, ohne Steuerung, Staub beim
  Landen) auf das Feld darunter - nur wenn dort Platz ist, nur abwärts, nicht
  klein und nicht mit Felsen. Von unten sperrt die Kante; die hohe Klippe
  (zwei Felder Felswand) und der Tempeleingang bleiben unverändert. Keine
  Abkürzung zu Tamos Tor, dem Gehege, den Felsnischen oder der Insel.
- **Schild**: Link trägt ihn nur sichtbar in der Hand, solange seine Taste
  gehalten wird (Schild erhoben); nur dann blockt er Steine, Pfeile und
  Angriffe von vorn. Feuerbälle hält er nicht auf.
- **Textbox** klappt auf, tippt rund 50 Zeichen pro Sekunde mit leisem Ticken,
  A zeigt die Seite sofort ganz bzw. blättert weiter, ein blinkender Pfeil
  zeigt das Seitenende. Texte werden mit "|" in Seiten geteilt.
- **Fundstücke**: Truhe öffnen (A), Link hält den Fund mit beiden Armen hoch,
  dazu eine eigene kurze Fanfare, nach 0,9 s erklärt die Textbox den Fund.
- **Moostempel**: zwei kleine Schlüssel und verschlossene Türen, großer
  Schlüssel und Bosstor, Karte und Kompass (Kartenseite im Menü), Bodenplatte
  mit Schiebeblock (Platte gibt nur unter dem Block nach, Block bleibt dann
  liegen), zwei Fackeln, die ein durch das ewige Feuer geschossener Pfeil
  entzündet (dann erscheint die Truhe), eine rissige Wand für Bomben (dahinter
  Kompass und Rubine), Fallgitter, die sich hinter Link schließen, bis die
  Wächter besiegt sind. Steintafeln mit Hinweisen.
- **Zwischengegner Panzerkäfer**: läuft heran, richtet sich aus, stürmt los;
  von vorn gepanzert, nach einem Aufprall an der Wand benommen und dann von
  allen Seiten verwundbar.
- **Boss Steinwächter**: nur das Auge ist verwundbar. Muster: Stampfen, Auge
  öffnen und drei Feuerbälle im Fächer, Sprung mit Erdstoß und herabfallenden
  Felsen (Schatten warnt). Ein Pfeil ins offene Auge oder eine Bombe betäubt
  ihn, dann trifft das Schwert - jeder Treffer verkürzt die Betäubung. Danach
  Herzcontainer, Sonnenstein und die Truhe mit den **Krafthandschuhen**.
- **Krafthandschuhe**: schwere Felsen mit A heben, tragen (langsamer), mit A
  oder B werfen; geworfene Felsen zerbrechen und treffen Monster. Ein schwerer
  Fels am Spiegelsee versperrt eine Truhe mit einem Herzteil.
- **Wichtelstumpf**: darauf stehen und R drücken - Link dreht sich, funkelt und
  schrumpft (bzw. wächst). Klein ist er langsamer, kann nicht kämpfen und keine
  Türen öffnen, passt aber durch **Mauselöcher**: eines führt ins Wurzelreich
  (Truhe mit Herzteil), das andere in eine von Felsen umschlossene Nische mit
  einem weiteren Herzteil.
- **Dorf**: Älteste, Ladenbesitzer Bodo, Wache Tamo, ein Kind und ein Bauer;
  was sie sagen, hängt vom Fortschritt ab. **Laden**: Herz 10, zehn Pfeile 20,
  fünf Bomben 25, ein Herzteil 80 Rubine.
- **Herzteile**: vier ergeben ein Herz (Oberwelt-Nische, Wurzelreich, Felsen
  am See, Laden). Dazu die zwei Herzcontainer der ersten Version, der am Grund
  des Spiegelsees (Tauchstelle) und der des Bosses - zusammen höchstens acht
  Herzen.
- **Maus**: Linksklick ins Bild ist A, Rechtsklick B; das Kontextmenü ist auf
  dem Bild abgeschaltet. Im Menü legt ein Linksklick auf ein Feld den
  Gegenstand auf A, ein Rechtsklick auf B, Hover bewegt den Cursor.
- **Cheat-Modus** (Knopf über dem Spiel, wird nicht gespeichert): keine
  Treffer, zehn Herzen, alle Gegenstände, vier volle Flaschen, 999 Rubine und
  volle Munition, jeden Schritt wieder aufgefüllt; Link geht doppelt so
  schnell. Das Ausgeteilte bleibt nach dem Ausschalten.
- **Pause** (Esc): weiterspielen, Spielstand von Hand speichern, diesen Stand
  laden oder neu starten. Der Autosave läuft unabhängig davon weiter.
- **Menü** (I/Enter), Seite **Gegenstände** im Aufbau des GBA-Menüs (eigene
  Grafik): Titelschild oben links, die Belegung von A und B klein oben rechts,
  ein Raster von 4 x 3 Feldern mit Munition in der Ecke und blinkendem Cursor,
  darunter vier Flaschen und der Knopf SPEICHERN (gleicher Platz wie das
  Pause-Menü), Pfeil-Reiter links und rechts, unten eine Namensleiste mit
  kurzer Wirkung und den Herzteilen. Nicht gefundene Gegenstände bleiben leere
  Felder. R oder ein Pfeil blättert zur **Karte** - in der Oberwelt die
  verkleinerte Landkarte mit blinkendem Link und Tempelmarke, im Tempel das
  Raumraster (ohne Karte nur besuchte Räume, mit Kompass Truhen und Boss).
- **A und B frei belegbar**: jeder Gegenstand oder jede Flasche kann auf A oder
  B liegen; liegt er schon auf der anderen Taste, tauschen die Tasten. Gibt es
  vor Link etwas zu tun (Reden, Lesen, Öffnen, Kaufen, Heben, Werfen), tut A
  das, egal was darauf liegt.
- **Gegenstände** (12 Felder): Schwert, Schild, Bogen, Bomben und Bumerang von
  Anfang an; dazu
  - **Laterne** (Tempel, Truhe hinter der rissigen Wand): entzündet eine kalte
    Fackel direkt vor Link, leuchtet kurz auf.
  - **Sprintstiefel** (Truhe in der Lichtung im Dunkelwald): Taste halten, 0,3 s
    Stampfen, dann Sprint mit 165 px/s und vorgehaltenem Schwert (2 Schaden),
    mäht Gras; gegen eine Wand prallt Link zurück, Bildschirm wackelt, ein Baum
    lässt manchmal Rubine oder ein Herz fallen.
  - **Feuerstab** (Truhe in den Ruinen beim Darknut): ein Feuerball zur Zeit,
    brennt Gras und Büsche ab, entzündet Fackeln, 2 Schaden, betäubt den
    Steinwächter ins offene Auge.
  - **Enterhaken** (Truhe auf der Moblin-Weide): Kette bis 120 px; Holzpfosten
    (`k`) und Truhen ziehen Link heran (auch über Wasser und Strömung), Monster
    werden betäubt, Rubine und Herzen herangeholt. Zwei Pfosten am Spiegelsee
    führen über die Strömung auf eine Insel mit einer Flasche.
  - **Schaufel** (Truhe östlich des Bauernhauses): gräbt Wiese, Weg und Feld
    vor Link um, Loch wächst nach 90 s wieder zu; Zufallsfund Rubin oder Herz.
    Zwei aufgewühlte Grabstellen: Flasche (Lichtung im Nordwald) und 100
    Rubine (Mitte des Bauernfelds, der Bauer gibt einen Hinweis).
  - **Sprungfeder** (zweite Truhe im Wurzelreich): Hüpfer von 0,45 s über
    Zäune, Wasser und Pfützen, in der Luft treffen keine Schüsse und Monster;
    im offenen Wasser schwimmt Link nach der Landung weiter, eine Landung in
    Strömung oder Pfütze kostet ein halbes Herz und setzt Link zurück. Ein
    eingezäuntes Gehege im Hügelland hält eine Flasche.
  - **Krafthandschuhe** (Boss-Truhe): passiv, kommen auf keine Taste.
- **Flaschen**: bis zu vier (Gehege, Insel, Grabstelle, Laden für 30 Rubine).
  Bodo füllt eine leere Flasche mit Heiltrank (20 Rubine); auf A oder B
  getrunken füllt er alle Herzen und die Flasche ist wieder leer.
- **Fortschritt**: Enterhaken und Sprungfeder öffnen keine Abkürzung im
  Tempel - dort gibt es weder Pfosten noch Zäune oder Wasser; Gitter, Türen und
  Wände halten Kette und Hüpfer auf. Klein (auf dem Stumpf geschrumpft) gehen
  Gegenstände nur im Wurzelreich, wo Link wieder seine Größe hat.
- **HUD** wie im Original: Herzen oben links, B/A-Slots und R-Feld oben
  rechts (das R-Feld zeigt, was R gerade tut: Rollen, Lesen, Reden, Öffnen,
  Kaufen, Heben, Werfen, Klein, Groß, im Wasser Tauchen), Rubine unten rechts, im Tempel darüber
  die kleinen Schlüssel.
- **Monster** der Oberwelt wie bisher; im Tempel Schleime und Keese je Raum,
  sie bleiben besiegt, bis Link den Tempel verlässt.
- **Game Over**: Weiter setzt Link mit drei Herzen am Tempeleingang (wenn er
  im Tempel fiel) oder im Dorf ab.
- **Sieg** für die Statistik: der Steinwächter fällt.
- **Speichern** im Browser (Format Version 3): Gebiet, Ort, Herzen, Rubine,
  Munition, Belegung von A und B, gefundene Gegenstände, Flaschen und Inhalt,
  Schlüssel, Herzteile, Größe, gesprengte Felsen und Wände, Herzcontainer,
  besuchte Tempelräume und alle Merker (Truhen, Türen, Fackeln, Platten,
  Wächter, Grabstellen, Geschichte). Spielstände der Versionen 2 und 1 werden
  beim Laden übernommen (Startausrüstung, Schwert auf A, altes B-Item auf B);
  das gilt auch für den von Hand gespeicherten Platz.
- **Töne** per WebAudio erzeugt (eigene Melodien), abschaltbar.
- **Grafik HD / Pixel** (Knopf im Kopf, gemerkt unter `zelda/graphics`,
  Standard HD): HD zeichnet in einen Puffer mit doppelter oder dreifacher
  Pixeldichte (480 x 320 bzw. 720 x 480, Logik bleibt bei 240 x 160) aus
  eigens erzeugten 2x-/3x-Bildern und vergrößert ihn ganzzahlig; die Dichte
  richtet sich nach dem Bildfaktor (teilbar durch 3: 3x, sonst 2x; Faktor 5
  und 7 werden auf 4 und 6 gesenkt). Pixel zeigt die ursprünglichen Bilder.
- **Eingabe**: Tasten- und Mausänderungen gehen über eine Warteschlange an
  die Schritte; jeder Druck und jedes Loslassen ist mindestens einen Schritt
  lang sichtbar, und während des Treffer-Einfrierens bleibt die vorige
  Eingabe stehen. Die Wirbelattacke kommt nur nach 0,85 s durchgehendem
  Halten.

## Bewusst anders oder weggelassen

| Punkt         | Vorlage                           | Hier                                          |
| ------------- | --------------------------------- | --------------------------------------------- |
| Grafik, Musik | Nintendo                          | alles eigens gezeichnet und erzeugt           |
| Welt          | viele Gebiete, sechs Dungeons     | eine Oberwelt, ein Tempel, zwei Häuser        |
| Items         | werden nach und nach gefunden     | fünf zu Beginn, sieben und Flaschen zu finden |
| Schwimmen     | erst mit den Schwimmflossen       | von Anfang an, Tauchen mit R                  |
| Schrumpfen    | an vielen Stümpfen, mit Begleiter | ein Stumpf, ein Wurzelreich                   |
| Musik         | durchgehende Hintergrundmusik     | nur Geräusche und kurze Fanfaren              |
| Ziel          | eigene Geschichte des Originals   | Sonnenstein aus dem Moostempel holen          |
