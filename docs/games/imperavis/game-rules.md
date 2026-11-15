# IMPERAVIS - Spielregeln als Spezifikation

Eigenes Spiel dieser Sammlung (keine Vorlage). Diese Datei ist die verbindliche
Referenz für die Engine in `website/src/games/imperavis/engine/`. Alle Zahlen
stehen als Tabellen in `buildings-data.ts`, `goods.ts`, `tiers.ts`,
`ships-data.ts`, `units-data.ts`, `research-data.ts`, `time.ts`, `population.ts`, `trader.ts`,
`combat.ts`, `diplomacy.ts`, `missions.ts`, `incidents.ts`, `ai.ts` und
`world.ts`; die Tabellen unten sind daraus erzeugt.

## Ziel

Aufbauspiel ohne festes Ende gegen 0 bis 3 KI-Gegner (Standard 2). Jeder
Spieler beginnt (auf "Normal", siehe [Schwierigkeit](#schwierigkeit)) mit 3000 Gold und einem Schoner vor seiner Heimatinsel
(Ladung: 50 Bretter, 14 Werkzeug, 24 Fisch, 10 Ziegel). Es zählt, wie groß
die Bevölkerung wird und welche Schicht sie erreicht. Die Heimatinseln der
KI liegen möglichst weit (mindestens 22 % der Kartenbreite) vom Spieler und
voneinander entfernt und sind nach Baufläche, Wald und Fruchtbarkeit
gewählt.

## Welt

- Kartengröße: klein 160 x 160, mittel 224 x 224, groß 288 x 288 Felder; bis zu
  8 / 13 / 20 Inseln (Radius 8 bis 17 / 20 / 22 Felder, die Heimatinsel 21 /
  23 / 24), mindestens 8 Felder offenes Meer zwischen zwei Inseln. Inseln unter
  30 Feldern versinken.
- Höhe je Feldecke aus verzogenem Inselkegel, Hügel- und Kammrauschen.
  Geländearten nach mittlerer Feldhöhe: über 4,6 Gebirge (unbebaubar), über 3
  Fels, unter 0,9 an der Küste Strand, sonst Wiese oder (Waldrauschen über
  0,53) Wald. Wasser unter -1,6 ist tiefes Meer.
- Flüsse: auf Inseln ab 380 Feldern (Heimatinsel immer, sonst 65 %) vom
  Hügelfuß bergab bis zum Meer, höchstens 70 Felder; Flussfelder sind
  unbebaubar.
- Vorkommen als runde Flecken (Radius 2,5): Stein und Erz auf Fels, Lehm auf
  Wiese oder Strand. Chancen je Insel: Stein 75 %, Lehm 60 %, Erz 45 %. Die
  Heimatinsel hat immer Stein und Lehm, nie Erz; mindestens eine andere Insel
  hat Erz.
- Fruchtbarkeit je Insel: Getreide 70 %, Trauben 35 %, Tabak 35 %. Die
  Heimatinsel trägt Getreide, aber weder Trauben noch Tabak; mindestens eine
  andere Insel trägt Trauben und eine Tabak. (Tabak wird aus einem eigenen
  Hash der Saat bestimmt, alte Welten bleiben dadurch gleich.)
- Inselnamen aus eigenen Silben, nie doppelt.

## Zeit

- Fester Takt: 0,1 Spielsekunden je Schritt; Tempo 1x, 2x, 4x oder Pause.
- Ein Tag dauert 240 s, eine Jahreszeit 2 Tage (ein Jahr 32 Minuten).
- Felder (Getreide, Schafe, Trauben): Frühling x1, Sommer x1,2, Herbst
  x1,05, Winter x0,45. Fischer: x1 / x1,1 / x1 / x0,8.
- Wetter wechselt alle 70 bis 200 s. Chancen (klar/Regen/Nebel/Sturm):
  Frühling 55/30/10/5, Sommer 70/15/5/10, Herbst 40/30/20/10, Winter
  45/15/25/15 %. Wirkung: Regen Felder x1,1, Fischer x0,95, Schiffe x0,95;
  Nebel Fischer x0,9, Schiffe x0,8; Sturm Felder x0,9, Fischer x0,5, Schiffe
  x0,6.

## Bauen

- Gebäude haben keine Bauzeit: Sie stehen fertig, sobald sie gesetzt sind
  (auch in der Pause). Zeit brauchen nur Schiffe in der Werft und Einheiten
  in der Kaserne (siehe die Tabellen; seit dieser Änderung halb so lang wie
  zuvor). Ausbaustufe 2 wirkt wie bisher sofort.
- Bauen nur im eigenen Baugebiet: Kreis mit Radius 22 um ein Kontor, 14 um
  einen Marktplatz, 12 um ein Lagerhaus, nur auf derselben Insel. Jede Insel
  gehört höchstens einem Spieler (dem mit dem Kontor); auf fremden Inseln
  darf niemand bauen.
- Prüfungen in dieser Reihenfolge: freigeschaltet, beim Menschen von der
  Einführung freigegeben (siehe "Einführung"), auf der Karte, auf Land
  derselben Insel, Baugrund (Strand, Wiese, Wald, Fels), nicht belegt (auch
  keine Straße), Neigung (höchste minus tiefste Ecke höchstens 1,3), Baugebiet,
  Küste (mindestens zwei Meerfelder am Rand), Standort (Wald, Vorkommen,
  Fruchtbarkeit, Fischgrund), Gold, Baustoffe im Lager der Insel. Betriebe und
  Lager ohne Straße am Rand dürfen stehen und arbeiten; ihre Karren fahren
  dann übers Gelände, langsamer (siehe "Lager und Karren").
- Ein Kontor auf einer Insel ohne eigenes Kontor bezahlt seine Baustoffe (10
  Bretter, 4 Werkzeug) aus einem eigenen Schiff, das höchstens 18 Felder
  entfernt liegt; das Gold kommt aus der Kasse. Der Rest der Schiffsladung geht
  ins neue Kontor. Jede Insel gehört nur einem Spieler; Kontore auf beliebig
  vielen verschiedenen Inseln sind erlaubt (die Prüfung ist inselbezogen:
  "Diese Insel gehört einer anderen Partei").
- Je Insel steht höchstens ein Kontor ("Diese Insel hat schon ein Kontor");
  das Baugebiet wächst mit Lagerhäusern (12) und Marktplätzen (14), die am
  Rand des bisherigen Gebiets stehen. Spielstände aus der kurzen Zeit, in der
  ein zweites Kontor je Insel erlaubt war, laden weiter: Abreißen oder
  Verlieren eines der beiden nimmt nur dieses Gebäude weg.
- Weil die Ladung ins neue Kontor geht, ist das Schiff danach leer. Für das
  nächste Kontor lädt es an einem eigenen Kontor nach: Das Schiffsfenster
  zeigt dort "Baustoffe für ein Kontor laden" (lädt, was an 10 Brettern und 4
  Werkzeug fehlt, aus dem Lager des Kontors). Fehlt die Ladung, sagt die
  Ablehnung genau, was an Bord fehlt; liegt kein eigenes Schiff in 18 Feldern,
  sagt sie das.
- Cheat: Ein Kontor darf ohne Schiffsladung gebaut werden; ein eigenes Schiff
  muss trotzdem höchstens 18 Felder entfernt liegen, die Baustoffe zahlt der
  Cheat.
- Eine Einflussmechanik (Einfluss als Ressource, Kosten oder Grenzen für
  Kontore oder Schiffe) gibt es nicht: Das Baugebiet ("Gebiet" in der
  Gebäudetabelle) gilt je Insel um Kontor, Markt und Lagerhäuser.
- Abreißen gibt die Hälfte der Baustoffe (abgerundet) zurück, nie Gold. Das
  letzte Kontor einer Insel lässt sich erst abreißen, wenn sonst nichts auf
  der Insel steht.
- Versetzen ist kostenlos (nicht beim Kontor).
- Ein neues Gebäude belegt seine Felder sofort, nicht erst im nächsten Takt;
  so überlappen auch mehrere Gebäude nicht, die in der Pause nacheinander
  gesetzt werden. Nach jedem Bau-, Straßen-, Pflaster-, Abriss- und
  Versetzbefehl des Menschen werden die abgeleiteten Raster (Belegung,
  Baugebiet, Reichweiten, Wege der Karren) sofort neu berechnet und
  `game.version` steigt - die Ansicht zeigt Baustelle, Straße oder Lücke also
  auch in der Pause sofort. Der nächste Takt hätte dasselbe als Erstes getan;
  der Ablauf bleibt schrittgleich.
- Straße: 3 Gold je neues Feld, Neigung höchstens 1,6; der Weg wird mit A*
  geplant, bestehende Straßen kosten dort die Hälfte.
- Gepflasterte Straße (zweite Stufe, im Straßenraster Wert 2): Werkzeug
  "Pflastern" (Baumenü Infrastruktur oder Umschalt plus T), dann über eine
  bestehende Straße ziehen; der Weg folgt nur eigenen Straßen. Je Feld 5 Gold
  und 1 Steinquader aus dem Lager der Insel (Befehl `pave`). Gepflastert
  sieht die Straße grau mit dunkler Kante aus.
- Insel besiedeln: Liegt ein eigenes Schiff höchstens 3 Felder vor Land
  einer freien Insel, zeigt sein Fenster den Knopf "Insel besiedeln" - vor
  der ersten wie vor jeder weiteren freien Insel. Er
  setzt das Kontor sofort auf den erlaubten Platz dieser Insel, der dem
  Schiff am nächsten liegt (dieselben Prüfungen wie oben: Küste, freie
  Insel, Gold, Baustoffe an Bord in 18 Feldern). Wer den Platz selbst
  wählen will, setzt das Kontor wie bisher über das Baumenü.

## Einführung

Beim neuen Spiel lässt sich "Geführter Einstieg" wählen (Standard an). Die
Einführung führt den Menschen in zwölf Aufgaben vom Schiff bis zur zweiten
Schicht (`engine/tutorial-data.ts`, `engine/tutorial.ts`).

- Sie liegt über der normalen Freischaltung: Ein Gebäude ist frei, wenn es
  nach Einwohnern, Schicht und Forschung frei ist und die aktuelle oder eine
  frühere Aufgabe es freigibt. Sie hält nur zurück, sie gibt nie etwas früher
  frei. Straßen und Abriss sind Werkzeuge und immer frei.
- Die Sperre gilt im Befehl `build` (Prüfgrund `tutorial`), nicht nur im
  Menü - aber nur für den Menschen; die KI baut wie immer. Versetzen bleibt
  frei.
- Jede Aufgabe empfiehlt Gebäude (im Baumenü mit Goldrahmen, Leuchten und
  Abzeichen "Empfohlen", ihre Kategorie mit einem Stern); gesperrte Kacheln
  nennen die Aufgabe, nach der sie frei werden; Kategorien ohne baubares
  Gebäude sind abgedunkelt.
- Ist eine spätere Aufgabe schon erledigt, wenn sie an die Reihe kommt, wird
  sie sofort übersprungen (mit ihrer Meldung). Jede erledigte Aufgabe meldet
  sich einmal, mit den Gebäuden, die damit neu ins Baumenü kommen.
- Geprüft wird nach Ereignissen, nicht in jedem Takt: nach Bau-, Straßen- und
  Abrissbefehlen des Menschen, wenn die abgeleiteten Raster neu entstanden
  sind (fertige Baustelle, Straße am Lager) und einmal je Sekunde für das, was
  von selbst wächst (Einwohner, Schicht, das Schiff vor der Küste). Das Schiff
  wird nur in dieser Sekunde angesehen, damit ein geladenes Spiel
  schrittgleich weiterläuft.
- Sie lässt sich jederzeit beenden (Aufgabenfenster oder Pausenmenü, mit
  Rückfrage), endgültig für die Partie (Befehl `tutorialEnd`). Danach und
  nach der letzten Aufgabe gilt nur die normale Freischaltung.
- Mit Cheat hält sie nichts zurück (Gebäude sind ohne jede Voraussetzung
  baubar); sie wird dabei aber nicht beendet und greift wieder, sobald der
  Cheat aus ist und sie noch läuft.
- Aufgabe 4 (Straße zum Kontor) ist eine Empfehlung, keine Pflicht: Sie gilt
  als erledigt, sobald ein Holzfäller über Straßen an einem fertigen Lager
  hängt, oder 45 s nach Aufgabe 3, wenn ein fertiger Holzfäller schon über das
  Gelände erreicht wird.

| Nr. | Aufgabe                        | Empfohlen           | Gibt frei                       | Erledigt, wenn                                                                                                           |
| --- | ------------------------------ | ------------------- | ------------------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| 1   | Finde eine Insel               | Handelskontor       | Handelskontor                   | ein eigenes Schiff liegt höchstens 3 Felder vor einer freien Insel mit erlaubtem Kontorplatz, oder eine Insel gehört dir |
| 2   | Besiedle die Insel             | Handelskontor       | -                               | 1 eigene Insel                                                                                                           |
| 3   | Errichte einen Holzfäller      | Holzfäller          | Holzfäller                      | 1 Holzfäller steht (Baustellen zählen)                                                                                   |
| 4   | Empfehlung: Straße zum Kontor  | Straße              | -                               | ein Holzfäller erreicht über Straßen ein Lager, oder 45 s nach Aufgabe 3 erreichen ihn Karren übers Gelände              |
| 5   | Errichte ein Sägewerk          | Sägewerk            | Sägewerk                        | 1 Sägewerk                                                                                                               |
| 6   | Baue Wohnhäuser                | Wohnhaus            | Wohnhaus                        | 4 Wohnhäuser                                                                                                             |
| 7   | Errichte eine Fischerei        | Fischerhütte        | Fischerhütte                    | 1 Fischerhütte                                                                                                           |
| 8   | Marktplatz und Kapelle         | Marktplatz, Kapelle | Marktplatz, Kapelle             | je 1 (Bauern wollen Fisch, Markt und Kapelle)                                                                            |
| 9   | Lass die Siedlung wachsen      | Wohnhaus            | Lagerhaus, Baum, Blumenbeet     | 40 Einwohner (höchster Stand) - dort werden Schäferei und Weberei frei                                                   |
| 10  | Aufstieg zu den Arbeitern      | Wohnhaus            | Lehmgrube, Ziegelei, Steinbruch | ein Haus erreicht die Arbeiter                                                                                           |
| 11  | Erste Kette: Wolle zu Stoff    | Schäferei, Weberei  | Schäferei, Weberei              | je 1 (Arbeiter wollen Stoff)                                                                                             |
| 12  | Ein Wirtshaus für die Arbeiter | Wirtshaus           | Wirtshaus                       | 1 Wirtshaus (frei ab 60 Bauern oder höher) - dann ist die Einführung abgeschlossen                                       |

Alles, was keine Aufgabe freigibt (Werft, Militär, die übrigen Betriebe und
Zierden), wartet auf das Ende der Einführung. Vor der Gründung zeigt das
Baumenü nur das Kontor als empfohlen, mit dem Hinweis, zuerst eine Insel zu
finden. Das Aufgabenfenster (links unter der Inselübersicht, am Handy über
der Bauleiste, einklappbar) zeigt nur die aktuelle Aufgabe: Titel, einen
Satz, den Fortschritt (etwa "2/4 Häuser"), "Zeigen" (Baumenü in der
richtigen Kategorie; bei Aufgabe 1 "Zur Insel": Kamera zur Heimatinsel und
das Schiff gewählt; bei Aufgabe 2 "Zum Schiff"), in den Aufgaben 1 und 2
"Insel besiedeln" und "Einführung beenden". Der alte Starthinweis erscheint
nur noch ohne Einführung.

Ohne jede Straße (der Bot baut keine, Saat 12345 mittel, 2 KI): Aufgabe 4
nach 1,12 Minuten, alle zwölf Aufgaben nach 21,5 Minuten (mit Straßen 14,1).

Headless (ein Bot spielt die Einführung, Zeiten in Spielminuten, fünf
Karten mit 0 bis 3 KI): Aufgaben 1 und 2 nach 0,03, Holzfäller 0,37, Straße
0,40, Sägewerk 0,43, Häuser 0,57, Fischerei 0,60, Markt und Kapelle 0,67, 40
Einwohner 1,3 bis 1,4, Arbeiter 1,8 bis 2,7, Stoffkette 4,8 bis 7,7 (mit
knapper Kasse auf der kleinen Karte mit drei KI 22,5), Wirtshaus und Ende
14 bis 16 (25,7). Die Arbeiter kommen vor der Stoffkette, weil der Aufstieg
nur die Bedürfnisse der Bauern braucht; Stoff brauchen erst die Arbeiter
selbst.

## Gebäude

| Gebäude          | Größe | Kosten                                                       | Bauzeit | Unterhalt/Min | Arbeitskräfte | Rezept                                              | Reichweite    | LP                                     | Freischaltung                   |
| ---------------- | ----- | ------------------------------------------------------------ | ------- | ------------- | ------------- | --------------------------------------------------- | ------------- | -------------------------------------- | ------------------------------- |
| Handelskontor    | 3x3   | 400 Gold, Bretter 10, Werkzeug 4                             | sofort  | 8             | -             | -                                                   | 14, Gebiet 22 | 1500 (Rüstung 30 %)                    | Start                           |
| Lagerhaus        | 2x2   | 150 Gold, Bretter 6, Werkzeug 1                              | sofort  | 4             | -             | -                                                   | 12, Gebiet 12 | 340                                    | Start                           |
| Wohnhaus         | 2x2   | Bretter 3                                                    | sofort  | 0             | -             | -                                                   | -             | 300                                    | Start                           |
| Marktplatz       | 3x3   | 200 Gold, Bretter 8, Werkzeug 1                              | sofort  | 6             | -             | -                                                   | 14, Gebiet 14 | 640                                    | Start                           |
| Kapelle          | 2x2   | 120 Gold, Bretter 6                                          | sofort  | 3             | -             | -                                                   | 12            | 340                                    | Start                           |
| Wirtshaus        | 2x2   | 250 Gold, Bretter 8, Ziegel 4, Werkzeug 1                    | sofort  | 8             | -             | -                                                   | 13            | 340                                    | 60 Bauern                       |
| Schule           | 3x2   | 500 Gold, Bretter 10, Ziegel 12, Werkzeug 3                  | sofort  | 16            | -             | -                                                   | 15            | 460                                    | 80 Arbeiter                     |
| Badehaus         | 3x3   | 1000 Gold, Bretter 10, Ziegel 18, Steinquader 10, Werkzeug 6 | sofort  | 28            | -             | -                                                   | 15            | 640                                    | 80 Handwerker                   |
| Holzfäller       | 2x2   | 50 Gold, Bretter 2                                           | sofort  | 2             | 4 Bauern      | - -> 1 Holz in 14 s                                 | 5             | 340                                    | Start                           |
| Sägewerk         | 2x2   | 100 Gold, Bretter 3, Werkzeug 1                              | sofort  | 4             | 5 Bauern      | 1 Holz -> 1 Bretter in 12 s                         | -             | 340                                    | Start                           |
| Fischerhütte     | 2x2   | 80 Gold, Bretter 3                                           | sofort  | 2             | 3 Bauern      | - -> 1 Fisch in 15 s                                | 6             | 340                                    | Start                           |
| Schäferei        | 3x3   | 100 Gold, Bretter 4                                          | sofort  | 3             | 4 Bauern      | - -> 1 Wolle in 20 s                                | -             | 640                                    | 40 Bauern                       |
| Weberei          | 2x2   | 180 Gold, Bretter 4, Werkzeug 1                              | sofort  | 6             | 6 Bauern      | 1 Wolle -> 2 Stoff in 20 s                          | -             | 340                                    | 40 Bauern                       |
| Lehmgrube        | 2x2   | 80 Gold, Bretter 2                                           | sofort  | 2             | 4 Bauern      | - -> 1 Lehm in 14 s                                 | 3             | 340                                    | 50 Bauern                       |
| Ziegelei         | 2x2   | 150 Gold, Bretter 4, Werkzeug 1                              | sofort  | 5             | 6 Bauern      | 1 Lehm -> 1 Ziegel in 14 s                          | -             | 340                                    | 50 Bauern                       |
| Steinbruch       | 2x2   | 100 Gold, Bretter 3                                          | sofort  | 3             | 6 Bauern      | - -> 1 Steinquader in 18 s                          | 3             | 340                                    | 50 Bauern                       |
| Getreidehof      | 3x3   | 120 Gold, Bretter 4                                          | sofort  | 3             | 5 Bauern      | - -> 1 Getreide in 16 s                             | -             | 640                                    | 30 Arbeiter                     |
| Mühle            | 2x2   | 200 Gold, Bretter 5, Werkzeug 1                              | sofort  | 6             | 4 Arbeiter    | 1 Getreide -> 1 Mehl in 14 s                        | -             | 340                                    | 30 Arbeiter                     |
| Bäckerei         | 2x2   | 220 Gold, Bretter 4, Ziegel 3                                | sofort  | 7             | 4 Arbeiter    | 1 Mehl -> 1 Brot in 14 s                            | -             | 340                                    | 30 Arbeiter                     |
| Mälzerei         | 2x2   | 200 Gold, Bretter 4, Ziegel 2                                | sofort  | 6             | 4 Arbeiter    | 1 Getreide -> 1 Malz in 16 s                        | -             | 340                                    | 50 Arbeiter                     |
| Brauerei         | 2x2   | 280 Gold, Bretter 4, Ziegel 5, Werkzeug 1                    | sofort  | 8             | 5 Arbeiter    | 1 Malz -> 1 Bier in 16 s                            | -             | 340                                    | 50 Arbeiter                     |
| Schneiderei      | 2x2   | 280 Gold, Bretter 4, Ziegel 4, Werkzeug 1                    | sofort  | 8             | 5 Arbeiter    | 1 Stoff -> 1 Kleidung in 18 s                       | -             | 340                                    | 60 Arbeiter                     |
| Köhlerei         | 2x2   | 120 Gold, Bretter 3                                          | sofort  | 3             | 3 Bauern      | 2 Holz -> 1 Kohle in 20 s                           | -             | 340                                    | 20 Arbeiter                     |
| Erzmine          | 2x2   | 300 Gold, Bretter 6, Ziegel 4, Werkzeug 2                    | sofort  | 8             | 6 Arbeiter    | - -> 1 Erz in 20 s                                  | 3             | 340                                    | 60 Arbeiter                     |
| Schmelzhütte     | 2x2   | 380 Gold, Bretter 4, Ziegel 8, Werkzeug 1                    | sofort  | 10            | 6 Arbeiter    | 1 Erz + 1 Kohle -> 1 Eisen in 24 s                  | -             | 340                                    | 60 Arbeiter                     |
| Werkzeugschmiede | 2x2   | 380 Gold, Bretter 4, Ziegel 6, Werkzeug 1                    | sofort  | 10            | 5 Arbeiter    | 1 Eisen -> 1 Werkzeug in 24 s                       | -             | 340                                    | 60 Arbeiter                     |
| Weingut          | 3x3   | 300 Gold, Bretter 6, Werkzeug 2                              | sofort  | 6             | 6 Bauern      | - -> 1 Trauben in 22 s                              | -             | 640                                    | 40 Handwerker                   |
| Kelterei         | 2x2   | 450 Gold, Bretter 6, Ziegel 8, Werkzeug 2                    | sofort  | 12            | 6 Handwerker  | 1 Trauben -> 1 Wein in 22 s                         | -             | 340                                    | 40 Handwerker                   |
| Werft            | 3x3   | 700 Gold, Bretter 12, Ziegel 6, Werkzeug 4                   | sofort  | 12            | 8 Arbeiter    | -                                                   | -             | 640                                    | 20 Arbeiter                     |
| Feuerwache       | 2x2   | 300 Gold, Bretter 6, Ziegel 4, Werkzeug 1                    | sofort  | 6             | -             | -                                                   | 14            | 340                                    | 40 Arbeiter                     |
| Medikus          | 2x2   | 600 Gold, Bretter 6, Ziegel 8, Werkzeug 2                    | sofort  | 12            | -             | -                                                   | 15            | 340                                    | 40 Handwerker                   |
| Gelehrtenhaus    | 3x2   | 1200 Gold, Bretter 10, Ziegel 16, Werkzeug 6                 | sofort  | 24            | 6 Handwerker  | -                                                   | -             | 460                                    | 60 Handwerker                   |
| Universität      | 3x3   | 3000 Gold, Ziegel 30, Steinquader 20, Werkzeug 10, Glas 10   | sofort  | 50            | 8 Ingenieure  | -                                                   | 16            | 640                                    | Forschung Gehobene Gesellschaft |
| Theater          | 3x3   | 2500 Gold, Ziegel 24, Steinquader 16, Glas 8, Werkzeug 6     | sofort  | 40            | -             | -                                                   | 16            | 640                                    | Forschung Wohlstand             |
| Quarzgrube       | 2x2   | 200 Gold, Bretter 4, Werkzeug 1                              | sofort  | 4             | 4 Arbeiter    | - -> 1 Quarzsand in 16 s                            | -             | 340                                    | Forschung Glasmacherkunst       |
| Glashütte        | 2x2   | 700 Gold, Bretter 4, Ziegel 10, Werkzeug 4                   | sofort  | 18            | 6 Handwerker  | 1 Quarzsand + 1 Kohle -> 1 Glas in 24 s             | -             | 340                                    | Forschung Glasmacherkunst       |
| Feinmechanik     | 2x2   | 1200 Gold, Ziegel 12, Werkzeug 6, Glas 4                     | sofort  | 26            | 5 Ingenieure  | 1 Glas + 1 Eisen -> 1 Instrumente in 30 s           | -             | 340                                    | Forschung Optik                 |
| Tabakplantage    | 3x3   | 400 Gold, Bretter 6, Werkzeug 2                              | sofort  | 8             | 6 Bauern      | - -> 1 Tabak in 22 s                                | -             | 640                                    | Forschung Tabakanbau            |
| Tabakdreherei    | 2x2   | 800 Gold, Bretter 4, Ziegel 10, Werkzeug 4                   | sofort  | 18            | 6 Handwerker  | 1 Tabak -> 1 Tabakwaren in 22 s                     | -             | 340                                    | Forschung Tabakanbau            |
| Perlentaucher    | 2x2   | 500 Gold, Bretter 6, Werkzeug 2                              | sofort  | 10            | 4 Arbeiter    | - -> 1 Perlen in 30 s                               | 6             | 340                                    | Forschung Goldschmiedekunst     |
| Goldschmied      | 2x2   | 1600 Gold, Ziegel 14, Werkzeug 8, Glas 4                     | sofort  | 30            | 6 Ingenieure  | 1 Perlen + 1 Werkzeug -> 1 Schmuck in 30 s          | -             | 340                                    | Forschung Goldschmiedekunst     |
| Büchsenmacherei  | 2x2   | 420 Gold, Bretter 4, Ziegel 6, Werkzeug 2                    | sofort  | 10            | 5 Arbeiter    | 1 Eisen + 1 Holz -> 1 Musketen in 26 s              | -             | 340                                    | 10 Handwerker                   |
| Geschützgießerei | 3x2   | 900 Gold, Ziegel 12, Steinquader 6, Werkzeug 4               | sofort  | 16            | 6 Arbeiter    | 2 Eisen + 1 Kohle -> 1 Kanonen in 40 s              | -             | 460                                    | Forschung Geschützguss          |
| Maschinenbau     | 3x2   | 2000 Gold, Ziegel 14, Werkzeug 8, Glas 4                     | sofort  | 32            | 6 Ingenieure  | 2 Eisen + 1 Instrumente -> 1 Dampfmaschinen in 45 s | -             | 460                                    | Forschung Dampfkraft            |
| Wachturm         | 2x2   | 400 Gold, Bretter 6, Steinquader 6, Werkzeug 2               | sofort  | 6             | -             | -                                                   | 9             | 600 (Rüstung 20 %), Kanonen 22/9/2.5 s | 30 Arbeiter                     |
| Küstenbatterie   | 2x2   | 900 Gold, Ziegel 10, Steinquader 10, Werkzeug 6              | sofort  | 14            | -             | -                                                   | 12            | 1000 (Rüstung 35 %), Kanonen 45/12/4 s | Forschung Festungsbau           |
| Deich            | 3x1   | 150 Gold, Bretter 2, Steinquader 6                           | sofort  | 2             | -             | -                                                   | 7             | 280                                    | 50 Bauern                       |
| Pumpstation      | 2x2   | 350 Gold, Bretter 4, Ziegel 6, Werkzeug 3                    | sofort  | 6             | -             | -                                                   | 12            | 340                                    | 40 Arbeiter                     |
| Bewässerung      | 2x2   | 200 Gold, Bretter 4, Steinquader 4                           | sofort  | 3             | -             | -                                                   | 9             | 340                                    | 30 Arbeiter                     |
| Hafenmauer       | 3x1   | 400 Gold, Steinquader 12, Werkzeug 2                         | sofort  | 5             | -             | -                                                   | 12            | 900 (30 % Rüstung)                     | 50 Arbeiter                     |

Standortbedarf: Holzfäller mindestens 4 unberührte Waldfelder im Umkreis 5
(volle Leistung ab 16), Fischerhütte an der Küste mit mindestens 30
Meerfeldern im Umkreis 6 (voll ab 60), Lehmgrube, Steinbruch und Erzmine ein
passendes Vorkommen im Umkreis 3, Höfe die Fruchtbarkeit der Insel, Kontor,
Werft und Hafenmauer die Küste. Deich und Pumpstation stehen in der
Infrastruktur, die Bewässerung in der Landwirtschaft, die Hafenmauer im
Hafen (siehe "Katastrophen").

## Lager und Karren

- Alle Lager einer Insel teilen einen Bestand. Platz je Ware: Kontor 80 (zählt
  schon als Baustelle), jedes fertige Lagerhaus 40; auf Stufe 2 je 50 % mehr.
- Produktion und Transport sind getrennt: Jeder Betrieb arbeitet in sein
  eigenes Lager (Ausgang höchstens 6 Waren, Eingang höchstens 4 je Rohstoff),
  solange Arbeitskräfte und Rohstoffe da sind - mit oder ohne Straße. Ist der
  Ausgang voll, pausiert er ("Eigenes Lager voll"), bis ein Karren abholt.
  Kein Betrieb steht wegen fehlender Straße still.
- Kontor und Lagerhaus haben je 2 Karren (Stufe 2: 3). Alle 0,5 s bekommt ein
  freier Karren den dringendsten Auftrag eines Betriebs, den er erreicht:
  Abholen ab 2 fertigen Waren (bis 4 je Fahrt) oder Liefern, wenn der
  Eingangsvorrat knapp ist.
- Reichweite: Ein Lager versorgt die Betriebe seiner Insel, deren Mitte
  höchstens Reichweite plus halbe Gebäudegröße entfernt ist (Kontor 14,
  Lagerhaus 12) und zu denen es einen Weg gibt. Unter mehreren Lagern gewinnt
  das mit der kürzesten Fahrzeit (bei Gleichstand das zuerst gebaute).
- Wege (`engine/logistics.ts`, Zahlen in `engine/logistics-data.ts`): Karren
  fahren über Straßen und über begehbares Land der Insel. Der Weg wird mit
  derselben Suche wie A* (ohne Ziel, also Dijkstra) je Lager gesucht; Kosten
  je Feld ist die Fahrzeit, Straßen werden also bevorzugt. Übers Gelände
  fahren die Karren bis 6 Felder über die Reichweite hinaus, auf Straßen
  beliebig weit (höchstens 6000 Felder je Suche). Nicht befahrbar: Wasser,
  Flüsse, Gebirge und Gebäude (die Wege beginnen und enden neben Start und
  Ziel).
- Fahrzeit = Summe über die Felder des Wegs von 1 / (3 x Tempo des Felds),
  im Verkehr zusätzlich geteilt durch den Stau-Faktor (siehe unten).

| Feld                                   | Tempo (Anteil) | Felder je Sekunde |
| -------------------------------------- | -------------- | ----------------- |
| gepflasterte Straße                    | 1,5            | 4,5               |
| einfache Straße                        | 1,0            | 3,0               |
| Wiese, Strand, gerodeter Wald          | 0,4            | 1,2               |
| Fels (Baugrund von Gruben und Minen)   | 0,3            | 0,9               |
| Wald                                   | 0,25           | 0,75              |
| Wasser, Fluss, Gebirge, fremde Gebäude | -              | nicht befahrbar   |

- Anbindung (Ampel): grün, wenn der ganze Weg aus Straße besteht; gelb, wenn
  er (teils) übers Gelände führt; rot, wenn kein Lager einen Weg findet
  (außerhalb jeder Reichweite oder etwa hinter einem Gebirge). Ein roter
  Betrieb produziert, bis sein Lager voll ist, und meldet dann "Kein
  Transportweg".
- Die Wege werden nur neu gesucht, wenn sich Gebäude, Straßen oder fertige
  Lager ändern (mit den anderen abgeleiteten Rastern, nie je Takt), und dann
  nur auf den Inseln, auf denen sich etwas geändert hat (Vergleich der
  Straßen- und Belegungsraster mit dem Stand der letzten Suche). Die Karren
  nehmen den gespeicherten Weg (`game.links`, abgeleitet, nicht gespeichert).
- Wohnhäuser und öffentliche Gebäude brauchten nie eine Straße und brauchen
  keine: Ihre Versorgung folgt den Reichweiten von Markt und öffentlichen
  Gebäuden. Der Markt ist Abholpunkt der Häuser (sie nehmen ihre Waren aus
  dem Inselbestand), aber kein Ausgangspunkt für Karren. Hafen und Werft
  bleiben wie bisher.
- Verkehr: Für jedes Straßenfeld zählt, wie viele Karren ihren Weg noch
  darüber planen. Ein Karren fährt mit voller Geschwindigkeit, jeder weitere
  bremst alle auf dem Feld um 30 % (Faktor 1 / (1 + 0,3 x (Karren - 1))). Ab
  2 Karren wird das Feld gelb, mit mehr Karren orange bis rot angezeigt.
- Vorrang: Ein Betrieb mit "Vorrang beim Abholen" bekommt bei der Wahl des
  nächsten Auftrags 3 Punkte auf seine Dringlichkeit (sonst höchstens 2) -
  ein freier Karren fährt also zuerst zu ihm, zum Liefern wie zum Abholen.
  Mehrere Betriebe mit Vorrang ordnen sich wie sonst nach Dringlichkeit.

## Dekoration

Kategorie "Dekoration" (Kategorie `decor`), ohne Arbeitskräfte, ohne Straße.
Jede Zierde gibt Häusern derselben Insel, deren Mitte in ihrer Reichweite
liegt, Zufriedenheit dazu (über das Raster der Reichweiten wie bei den
öffentlichen Gebäuden). Verschiedene Arten zählen zusammen, dieselbe Art
mehrfach nur einmal; höchstens +15 Punkte. Der Zuschlag kommt auf das Ziel
der Zufriedenheit (Bedürfnisse, Steuersatz, Seuche), das Haus nähert sich
ihm wie sonst.

| Zierde              | Größe | Kosten                               | Bauzeit | Unterhalt/Min | Reichweite | Zufriedenheit | Freischaltung |
| ------------------- | ----- | ------------------------------------ | ------- | ------------- | ---------- | ------------- | ------------- |
| Baum                | 1x1   | 8 Gold, 1 Holz                       | sofort  | 0             | 4          | +2            | von Anfang an |
| Blumenbeet          | 1x1   | 15 Gold                              | sofort  | 0             | 4          | +2            | von Anfang an |
| Laterne             | 1x1   | 25 Gold, 1 Werkzeug                  | sofort  | 1             | 5          | +2            | 10 Arbeiter   |
| Gepflasterter Platz | 2x2   | 60 Gold, 4 Steinquader               | sofort  | 1             | 6          | +3            | 30 Arbeiter   |
| Park                | 3x3   | 120 Gold, 4 Holz, 4 Bretter          | sofort  | 2             | 8          | +5            | 60 Arbeiter   |
| Brunnen             | 2x2   | 200 Gold, 8 Steinquader, 2 Werkzeug  | sofort  | 3             | 7          | +5            | 20 Handwerker |
| Statue              | 1x1   | 350 Gold, 10 Steinquader, 2 Werkzeug | sofort  | 4             | 8          | +6            | 10 Kaufleute  |

Baum und Blumenbeet sind von Anfang an frei, auch in älteren Spielständen
(beim Laden werden fehlende Startgebäude ergänzt). Jede Zierde hat ein
eigenes prozedurales Modell.

## Produktion

- Ein Zyklus nimmt die Eingangswaren beim Start und dauert Rezeptzeit geteilt
  durch (Standort x Anteil der Arbeitskräfte x Jahreszeit x Wetter).
- Arbeitskräfte: je Insel und Schicht der Anteil besetzter Plätze; höhere
  Schichten füllen freie Plätze niedrigerer. Unter 5 % steht der Betrieb.
- Auslastung = gleitender Mittelwert (60 s) des Arbeitsanteils.
- Unterhalt je Minute: fertige Gebäude voll, angehaltene zur Hälfte,
  Baustellen zu einem Viertel; Stufe 2 kostet 50 % mehr.
- Weitere Faktoren: Stufe 2 x1,5; unter 50 % Lebenspunkten x0,5; Forschung
  Fruchtwechsel +20 % auf Höfe, Zunftwesen +15 % im Handwerk; gute Ernte x1,4,
  Missernte x0,6 auf die Höfe einer Insel. Ein brennendes Gebäude steht.

## Ausbaustufen

Betriebe, Kontor, Lagerhaus und Gelehrtenhaus lassen sich einmal ausbauen
(Stufe 2): 75 % ihres Goldpreises plus 6 Ziegel und 3 Werkzeug aus dem
Lager der Insel. Betriebe und Gelehrte arbeiten 50 % schneller, Lager
fassen 50 % mehr und schicken einen Karren mehr; der Unterhalt steigt um
50 %. Sichtbar allein an der Architektur: Steinkante mit Ecksteinen, Anbau
auf Steinsockel mit Fachwerk, Schieferdach und Ziegelschornstein, Steinstufen
vor der Front. Ein Ausbau bekommt keine Fahne und keinen Wimpel
(`render/models.ts`, `upgradeExtras`); Fahnen, die fest zu einem Modell
gehören (Kontor, Kaserne), bleiben.

## Waren

| Ware           | Kategorie       | Wert (Gold) |
| -------------- | --------------- | ----------- |
| Holz           | Rohstoff        | 4           |
| Bretter        | Baustoff        | 9           |
| Steinquader    | Baustoff        | 8           |
| Lehm           | Rohstoff        | 4           |
| Ziegel         | Baustoff        | 11          |
| Erz            | Rohstoff        | 10          |
| Kohle          | Rohstoff        | 8           |
| Eisen          | Zwischenprodukt | 22          |
| Werkzeug       | Baustoff        | 36          |
| Fisch          | Bedarfsgut      | 6           |
| Getreide       | Rohstoff        | 5           |
| Mehl           | Zwischenprodukt | 9           |
| Brot           | Bedarfsgut      | 18          |
| Wolle          | Rohstoff        | 7           |
| Stoff          | Bedarfsgut      | 16          |
| Kleidung       | Bedarfsgut      | 32          |
| Malz           | Zwischenprodukt | 9           |
| Bier           | Bedarfsgut      | 24          |
| Trauben        | Rohstoff        | 9           |
| Wein           | Luxusgut        | 44          |
| Quarzsand      | Rohstoff        | 7           |
| Glas           | Luxusgut        | 40          |
| Instrumente    | Luxusgut        | 90          |
| Tabak          | Rohstoff        | 12          |
| Tabakwaren     | Luxusgut        | 60          |
| Perlen         | Rohstoff        | 30          |
| Schmuck        | Luxusgut        | 140         |
| Musketen       | Baustoff        | 48          |
| Kanonen        | Baustoff        | 110         |
| Dampfmaschinen | Baustoff        | 260         |

## Bevölkerung

| Schicht            | Plätze/Haus | Steuer/Kopf/Min | Waren (je Kopf/Min)                                                                     | Öffentlich                                                                      | Aufstieg kostet                               | Forschung             |
| ------------------ | ----------- | --------------- | --------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------- | --------------------------------------------- | --------------------- |
| Bauern             | 8           | 0.9             | Fisch 0.05                                                                              | Marktplatz, Kapelle                                                             | -                                             | -                     |
| Arbeiter           | 12          | 1.5             | Fisch 0.05, Stoff 0.035                                                                 | Marktplatz, Kapelle, Wirtshaus                                                  | Bretter 3                                     | -                     |
| Handwerker         | 16          | 2.4             | Brot 0.045, Kleidung 0.03, Bier 0.03                                                    | Marktplatz, Kapelle, Wirtshaus, Schule                                          | Bretter 2, Ziegel 4                           | -                     |
| Kaufleute          | 22          | 3.6             | Brot 0.045, Kleidung 0.03, Bier 0.03, Wein 0.025                                        | Marktplatz, Kapelle, Wirtshaus, Schule, Badehaus                                | Ziegel 6, Werkzeug 2                          | -                     |
| Ingenieure         | 28          | 4.8             | Brot 0.045, Kleidung 0.03, Bier 0.03, Wein 0.025, Glas 0.02                             | Marktplatz, Kapelle, Wirtshaus, Schule, Badehaus, Medikus                       | Ziegel 8, Steinquader 4, Werkzeug 4           | Ingenieurwesen        |
| Gehobene Schicht   | 34          | 6.2             | Brot 0.05, Kleidung 0.035, Wein 0.03, Instrumente 0.015, Tabakwaren 0.02                | Marktplatz, Kapelle, Wirtshaus, Schule, Badehaus, Medikus, Universität          | Ziegel 10, Steinquader 8, Werkzeug 6, Glas 4  | Gehobene Gesellschaft |
| Wohlhabende Bürger | 40          | 8               | Brot 0.05, Kleidung 0.04, Wein 0.035, Instrumente 0.02, Tabakwaren 0.025, Schmuck 0.015 | Marktplatz, Kapelle, Wirtshaus, Schule, Badehaus, Medikus, Universität, Theater | Ziegel 12, Steinquader 12, Werkzeug 8, Glas 6 | Wohlstand             |

- Jede Sekunde nehmen Häuser in Reichweite eines Marktplatzes ihre Waren aus
  dem Inselbestand. Die Versorgung je Ware folgt dem gedeckten Anteil
  (gleitend, 15 % je Sekunde). Unter 35 % gibt es eine Mangelmeldung.
- Bedürfnis-Erfüllung: Waren = Versorgung (nur mit Markt), öffentliche
  Gebäude = 1 in deren Reichweite, sonst 0. Die Zufriedenheit folgt dem
  Mittelwert (+10 % bei niedrigem, -12 % bei hohem Steuersatz) mit 10 % je
  Sekunde.
- Bewohner-Ziel = Plätze x (0,25 + 0,75 x Zufriedenheit); alle 5 s zieht
  einer ein oder aus. Ein fertiges Haus beginnt mit einem Bewohner.
- Steuer je Minute = Bewohner x Steuer der Schicht x Faktor (0,7 / 1 / 1,35)
  x (0,5 + 0,5 x Zufriedenheit).
- Aufstieg (Prüfung alle 8 s): Haus voll, jedes Bedürfnis mindestens 75 %,
  Zufriedenheit mindestens 60 %, Baustoffe der nächsten Schicht im Lager,
  und für Ingenieure, gehobene Schicht und wohlhabende Bürger die Forschung
  der Schicht.
- Abstieg: Liegt die Zufriedenheit 90 s am Stück unter 30 %, fällt das Haus
  eine Schicht zurück (Bewohner höchstens die Plätze der neuen Schicht).
- Freischaltung: Ein Gebäude wird frei, sobald die Einwohner der genannten
  Schicht oder höher die Zahl erreichen; es bleibt frei.

## Schiffe und Handelsrouten

Die Typen sind Daten in `ships-data.ts`; die internen Namen der älteren
Spielstände bleiben (`cog` ist der Schoner, `hulk` der Klipper, `galleon` das
Frachtschiff, `warship` das Kanonenboot). Handelsschiffe tragen keine
Geschütze. Freischaltung: die höchste erreichte Schicht der eigenen Häuser
und die Forschung.

| Schiff          | Rolle (id)         | Freischaltung              | Tempo | Laderaum | LP   | Panzerung | Geschütze (Schaden/Reichweite/Nachladen) | Truppen | Besatzung | Unterhalt/Min | Kosten                                                         | Bauzeit |
| --------------- | ------------------ | -------------------------- | ----- | -------- | ---- | --------- | ---------------------------------------- | ------- | --------- | ------------- | -------------------------------------------------------------- | ------- |
| Schoner         | Handel (`cog`)     | Arbeiter                   | 3,2   | 3 x 30   | 300  | 10 %      | -                                        | 6       | 12        | 10            | 600 Gold, Bretter 20, Stoff 8, Werkzeug 4                      | 30 s    |
| Klipper         | Handel (`hulk`)    | Handwerker                 | 3,9   | 4 x 40   | 420  | 10 %      | -                                        | 8       | 18        | 16            | 1400 Gold, Bretter 30, Stoff 20, Werkzeug 8                    | 50 s    |
| Frachtschiff    | Handel (`galleon`) | Kaufleute, Schiffbaukunst  | 2,8   | 7 x 50   | 900  | 20 %      | -                                        | 14      | 32        | 26            | 2400 Gold, Bretter 44, Stoff 24, Werkzeug 12, Eisen 8          | 75 s    |
| Dampfschiff     | Handel (`steamer`) | Ingenieure, Dampfkraft     | 4,6   | 8 x 60   | 1100 | 25 %      | -                                        | 16      | 24        | 40            | 4200 Gold, Bretter 30, Eisen 30, Werkzeug 12, Dampfmaschinen 4 | 90 s    |
| Kanonenboot     | Krieg (`warship`)  | Arbeiter                   | 3,9   | 1 x 20   | 480  | 15 %      | 6 (18/6/2,2 s)                           | 4       | 22        | 18            | 1200 Gold, Bretter 24, Stoff 8, Werkzeug 10                    | 50 s    |
| Fregatte        | Krieg (`frigate`)  | Handwerker, Schiffbaukunst | 3,6   | 2 x 20   | 1100 | 35 %      | 24 (45/8,5/2,6 s)                        | 6       | 45        | 40            | 3200 Gold, Bretter 40, Stoff 20, Werkzeug 16, Eisen 10         | 80 s    |
| Linienschiff    | Krieg (`lineShip`) | Kaufleute, Geschützguss    | 2,6   | 3 x 20   | 2200 | 40 %      | 64 (72/9/3,6 s)                          | 10      | 90        | 60            | 5200 Gold, Bretter 70, Stoff 30, Werkzeug 20, Kanonen 12       | 110 s   |
| Schlachtkreuzer | Krieg (`cruiser`)  | Ingenieure, Dampfkraft     | 4,3   | 2 x 20   | 2600 | 50 %      | 8 (96/11/3 s)                            | 8       | 60        | 80            | 7800 Gold, Eisen 50, Werkzeug 20, Kanonen 10, Dampfmaschinen 6 | 130 s   |
| Freier Händler  | - (`trader`)       | -                          | 3     | 8 x 40   | 500  | 0 %       | -                                        | 0       | 20        | 0             | -                                                              | -       |
| Piratenschiff   | - (`pirate`)       | -                          | 3,4   | 4 x 40   | 650  | 20 %      | 12 (26/7/3 s)                            | 0       | 35        | 0             | -                                                              | -       |

- Schiffe suchen ihren Weg mit A* über das Meer (8 Richtungen, Felder an der
  Küste kosten 1,6), der Weg wird zu geraden Abschnitten geglättet. Sie drehen
  mit ihrer Wendigkeit und werden in engen Kurven bis auf 35 % langsamer; zu
  nahe Schiffe weichen einander aus.
- Ein Schiff liegt an einem Kontor, wenn es höchstens 2,5 Felder von dessen
  Liegeplatz entfernt ist. Dann lädt und entlädt es von Hand in Schritten zu 10. Laderaum: je Ware so viele Plätze, wie angefangene Platzgrößen belegt
  sind.
- Handelsroute: mindestens zwei Halte (Kontore). An jedem Halt wird zuerst
  entladen (höchstens die Menge, bis das Lager die Grenze erreicht), dann
  geladen (bis die Ladung die Menge erreicht, ohne das Lager unter die Grenze
  zu leeren); ein Halt dauert 4 s. Blockiert ist eine Route ohne Schiff, mit
  einem Halt ohne Kontor oder ohne Seeweg.

## Freier Händler

- Erster Besuch nach 90 s, danach alle 100 bis 170 s; er kommt nur, wenn ein
  Kontor Aufträge hat, und besucht dann alle solchen Kontore.
- Preis = Wert x (1 + 0,6 x Druck); er zahlt 80 % davon und verlangt 115 %.
  Jede verkaufte Einheit senkt den Druck um 1/80, jede gekaufte hebt ihn; der
  Druck klingt mit 0,4 % je Sekunde ab (Bereich -1 bis 1).
- Je Besuch und Ware höchstens 40 Einheiten; sein Vorrat je Ware füllt sich
  auf 30 auf (0,05 je Sekunde). Gekauft wird nur, soweit das Gold reicht.

- Routen: Jede Ware an einem Halt hat einen Vorrang (niedrig, normal, hoch);
  höherer Vorrang wird zuerst entladen und geladen, wenn der Laderaum knapp
  ist. Die Routen des Spielers sind als gestrichelte Linien zwischen den
  Liegeplätzen auf der Karte zu sehen.
- Schiffe legen nur an eigenen Kontoren an (der freie Händler überall).
- Im Schiffsfenster (Registerkarte "Befehle"): Aufgabe, Flotte, "Ziel
  setzen" (Bewegen), "Anhalten"; bei Handelsschiffen Laden und Entladen (Karte
  "Ladung"), "Route erstellen" (zwischen dem Kontor, an dem es liegt, und
  einem zweiten eigenen, mit diesem Schiff) und "Route starten" / "Route
  stoppen"; bei Kriegsschiffen Angreifen, Patrouillieren, Eskortieren und
  "Flotte bilden". Die Übersicht zeigt Name, Typ, LP, Laderaum, Tempo,
  Position, Aufgabe und Zugehörigkeit; die Verwaltung unter "Schiffe" alle
  eigenen Schiffe mit denselben Angaben.

## Werft

- Ein Klick auf die eigene, fertige Werft öffnet ihr Fenster groß in der
  Mitte, auf der Karte "Werft": links Helling (Schiff, Fortschritt, Restzeit,
  Abbrechen) und Warteschlange, rechts die Schiffe auf den Registerkarten
  "Handelsschiffe" und "Kriegsschiffe" - je Kachel Bild, Name, Beschreibung,
  alle Werte, Kosten (rot, was im Lager der Insel fehlt, dazu "Fehlt: ..."),
  Freischaltung und "In Auftrag geben". Gesperrte oder zu teure Schiffe sind
  ausgegraut, mit dem Grund.
- Ein Auftrag wird beim Annehmen bezahlt: Gold aus der Kasse, Baustoffe aus
  dem Lager der Insel der Werft. Höchstens 5 Aufträge (Helling und
  Warteschlange); sie werden nacheinander gebaut.
- Gebaut wird mit Arbeitskräften: Der Fortschritt wächst je Sekunde um den
  Anteil besetzter Plätze der Werft (8 Arbeiter; höhere Schichten springen
  ein). Ohne Arbeitskräfte ruht der Bau ("Keine Arbeitskräfte").
- Fertig legt das Schiff auf dem freien Meeresfeld ab, das dem Liegeplatz der
  Werft am nächsten liegt (höchstens 5 Felder, im selben Wasser, mindestens
  1,6 Felder von jedem anderen Schiff). Ist keines frei, wartet die Werft mit
  dem fertigen Schiff ("wartet auf freies Wasser"). Das Schiff ist sofort
  steuerbar.
- Abbrechen: Das Schiff auf der Helling gibt 50 % des noch nicht verbauten
  Anteils zurück (Kosten x 0,5 x (1 - Fortschritt), abgerundet), ein
  wartender Auftrag alles. Gold geht in die Kasse, Waren ins Lager der Insel
  (soweit Platz ist); der nächste Auftrag rückt nach.
- Warum vorher keine Schiffe entstanden: Die Bauknöpfe lagen versteckt in der
  Registerkarte "Erweiterungen" (das Fenster öffnete auf "Übersicht"), es gab
  keine Warteschlange und keine Anzeige fehlender Arbeitskräfte - ohne
  Arbeiter auf der Insel blieb der Fortschritt stumm bei 0. Freischaltung,
  Ressourcenprüfung, Zuordnung und Liegeplatz waren in Ordnung; eine Straße
  braucht die Werft nicht.

## Kriegsschiffe und Flotten

- Rechtsklick auf ein feindliches Schiff oder Gebäude (im Krieg, Piraten
  immer) gibt den gewählten Kriegsschiffen den Befehl `shipAttack`: Sie
  verfolgen das Ziel (neuer Kurs alle 3 s, bis 60 % ihrer Reichweite heran)
  und feuern zuerst darauf, solange es in Reichweite ist; ist es versenkt,
  zerstört oder kein Feind mehr, warten sie. Unbewaffnete Schiffe lehnen ab.
- Patrouille (`shipPatrol`): von der Stelle des Schiffs zu einem gewählten
  Punkt auf See und zurück, immer wieder; Feinde in 12 Feldern werden
  verfolgt, danach geht die Patrouille weiter.
- Eskorte (`shipEscort`): bleibt höchstens 3 Felder bei einem eigenen Schiff
  und fährt jedem Feind entgegen, der dem Schützling auf 12 Felder nahe kommt.
- Flotte (`fleetCreate`, `fleetMove`, `fleetDisband`): ein Name und bis zu
  12 eigene Schiffe. Ein Rechtsklick aufs Wasser mit allen Schiffen einer
  Flotte gewählt bewegt sie gemeinsam in Formation (2,5 Felder Abstand), alle
  im Tempo des langsamsten. Flotten, Patrouillen und Eskorten werden
  gespeichert; Steuergruppen (Strg plus Zahl) bleiben reiner
  Bildschirmzustand.

## KI-Spieler

| KI              | Charakter    | Goldreserve beim Bauen (Kolonie +) | Häuser je Insel | nächste Insel ab Einwohnern je Insel | ab Gold | Inseln höchstens | Gelehrtenhäuser | Soldaten Frieden/Krieg | Kriegsschiffe Frieden/Krieg | Unterhalt der Gebäude | erste Forschung     |
| --------------- | ------------ | ---------------------------------- | --------------- | ------------------------------------ | ------- | ---------------- | --------------- | ---------------------- | --------------------------- | --------------------- | ------------------- |
| Haus Varenne    | Händler      | 900 (+1200)                        | 44              | 110                                  | 2500    | 3                | 2               | 0 / 4                  | 0 / 2                       | 100 %                 | Glasmacherkunst     |
| Haus Morvaine   | Kriegerisch  | 700 (+1200)                        | 38              | 140                                  | 2500    | 3                | 1               | 4 / 10                 | 2 / 4                       | 100 %                 | Festungsbau         |
| Haus Elsenreich | Expansionist | 900 (+900)                         | 52              | 45                                   | 1600    | 4                | 1               | 0 / 4                  | 0 / 2                       | 75 %                  | Fruchtwechsel, Glas |

- Jede KI denkt alle 3 Spielsekunden (versetzt um 0,7 s je KI) über die
  Wirtschaft und alle 45 s über die Nachbarn nach. Ein Gedanke darf höchstens
  1500 Bauplatzprüfungen und 6 Straßensuchen machen; eine erfolglose Suche
  sperrt diese Gebäudeart auf dieser Insel für 240 s.
- Sie baut mit denselben Befehlen wie der Spieler: Kontor (auf der nächsten
  freien Insel mit mindestens 300 bebaubaren Feldern), Straßen, die
  Grundausstattung (2 Holzfäller, Sägewerk, Fischer, Markt, Kapelle, 6
  Häuser; solange eine Stadt weniger als 12 Häuser hat, hält sie dafür nur
  100 Gold zurück).
- Der Weg nach oben (nur auf der Heimatinsel, vor allen anderen Wünschen):
  Lehmgrube und Ziegelei ab 8 Häusern, Gelehrtenhaus und Steinbruch ab
  Handwerkern, ab 24 Häusern das zweite Gelehrtenhaus des Händlers und eine
  zweite Ziegelei, Werkzeugkette bei Erz, Weinberg und Kelterei, nach der
  Glasforschung Quarzgrube, Köhlerei und Glashütte, später Universität,
  Tabak-, Instrumenten- und Schmuckketten. Bretter, Werkzeug, Ziegel, Stoff,
  Fisch und alles, was die vorhandenen Schichten, der nächste Aufstieg oder
  die öffentlichen Gebäude der nächsten Schicht brauchen und keine eigene
  Insel herstellen kann, kauft sie beim Händler; Baustoffe (Ziegel,
  Werkzeug, Stein, Glas) ab 3000 Gold bis 60 Stück, sonst bis 20. Bretter
  und Fisch kauft sie auch beim Sparen.
- Danach je Insel bis zu drei Betriebe für die Waren, deren Erzeugung am
  weitesten hinter dem Bedarf liegt (Bewohner, Eingänge anderer Betriebe,
  Baustoffe und die Aufstiegskosten der nächsten Schicht); eine Kette wird
  von vorne gebaut (erst Hof, dann Mühle, dann Bäckerei). Ein Betrieb wird
  nur gebaut, wenn seine Eingänge auf einer eigenen Insel entstehen können.
  Dann öffentliche Gebäude der nächsten Schicht (dort, wo Häuser sie noch
  nicht erreichen; fehlt der Platz, reißt sie zwei Häuser ab), Häuser (wenn
  75 % voll, Zufriedenheit 65 %, Kolonien nur mit Fisch und höchstens ein
  Haus je 16 bebaubare Felder), Lagerhäuser, Werft (ohne Frachtschiff
  sofort), Feuerwache, Medikus, Kaserne (im Krieg oder als Kriegerischer).
- Weitere Inseln: wenn die Heimat mindestens 12 Häuser hat, genug Einwohner
  und Gold, die Kasse in der letzten Spielminute nicht geschrumpft ist und nicht
  gespart wird; ohne eigenen Lehm schon ab 80 Einwohnern und 1500 Gold, ohne
  Trauben eine Insel mehr als sonst. Beim Sparen für eine Insel hält sie
  das Gold für alles außer Grundausstattung, Mangelbetriebe und Häuser
  zurück. Bevorzugt werden Inseln mit dem, was noch keiner eigenen Insel
  gehört (Trauben und Getreide dreifach, Lehm doppelt, Erz, Stein, Tabak).
- Kolonien bauen, was die Heimat braucht, aber dort keinen Platz findet,
  dazu Lehm, Stein, Trauben, Getreide, Erz, Tabak und Wolle, wenn die Heimat
  es nicht kann. Die Route Heimat - Kolonie wird laufend angepasst: Bretter,
  Werkzeug, Fisch (und Ziegel, wenn die Heimat Lehm hat) gehen hin, die drei
  Waren, von denen die Kolonie am meisten hat (ab 25 Stück), kommen zurück.
- Krisen: unter 400 Gold hohe Steuern, Verkauf von Vorräten, Bau nur noch
  von Nahrung; über 1000 Gold wieder normal. Über 8000 Gold baut sie
  Gebäude auf Stufe 2 aus, Gelehrtenhäuser zuerst.
- Aufträge der Krone: Jede KI sieht sich jedes neue Angebot einmal an und
  nimmt es mit 70 % (Händler), 60 % (Expansionist) oder 40 %
  (Kriegerisch) an, wenn sie es schaffen kann (Lieferung und Produktion nur
  mit eigenem Betrieb der Ware, Bauauftrag nur mit Gold für alle Gebäude,
  Besiedlung nur mit Frachtschiff). Sie liefert, sobald 10 Stück im Lager
  sind, baut die verlangten Gebäude und segelt die verlangte Insel an.
- Schiffe nach Charakter: Kriegsschiffe wählt die KI aus ihrer Liste, das
  erste freigeschaltete und bezahlbare (Händler und Expansionist: Fregatte,
  Kanonenboot; Kriegerisch: Schlachtkreuzer, Linienschiff, Fregatte,
  Kanonenboot), Handelsschiffe für neue Kolonien ebenso (Händler:
  Dampfschiff, Frachtschiff, Klipper, Schoner; sonst Klipper, Schoner).
- Truppen nach Charakter: eine Mischung mit Gewichten (Händler: Linie 3,
  Musketen 2, Aufklärer 1; Expansionist: Miliz 2, Linie 2, Musketen 1,
  Aufklärer 1; Kriegerisch: Linie 3, Grenadiere 2, Musketen 2, je 1
  Artillerie, Kavallerie, Pioniere, Sanitäter, Scharfschützen, Elite). Sie
  bildet jeweils die freigeschaltete, bezahlbare Art aus, von der sie für ihr
  Gewicht am wenigsten hat. Wer Truppen will, kauft Musketen beim Händler und
  baut eine Büchsenmacherei, wenn eine eigene Insel Eisen machen kann; nach
  Geschützguss ebenso Kanonen. Neue Forschungen: Kriegerisch nach
  Schiffbaukunst Geschützguss und Kriegskunst, die anderen am Ende.
- Krieg: Wachtürme, Batterie, Kriegsschiffe und Soldaten nach Charakter.
  Die Flotte greift das nächste Kontor des schwächsten Feindes an, sechs
  oder mehr bereite Soldaten fahren mit einem Schiff mit genug Plätzen
  dorthin und stürmen es. Nach einer Eroberung ruhen Flotte und Truppen
  gegen diesen Feind, bis die Erinnerung verblasst.

## Diplomatie

- Meinung einer KI über einen Spieler = Charakter (Händler +10,
  Expansionist 0, Kriegerisch -15) + halber Ruf des anderen + Verträge
  (Handelsabkommen +8, Pakt +10, Bündnis +15, Krieg -40) + Nachbarschaft (-6
  je Paar Inseln näher als 35 Felder, höchstens -18) + Streit um freie
  Inseln (-3 je freie Insel, die beiden näher als 45 Felder liegt, höchstens
  -12) + gemeinsamer Feind (+12)
  - Erinnerungen (Geschenke, erfüllte Forderungen -15, Ablehnungen -5,
    Geschäfte +3, Aufträge, Angriffe -1 je Treffer, -8 je versenktes Schiff,
    Kriegserklärung -25, Friedensschluss +10, gebrochener Pakt -20,
    eroberte Insel -15, Zwischenfälle). Jede Erinnerung ist auf ±40
    begrenzt und verblasst um 2 % alle 10 s; der Ruf um 0,5 %.
- Zwischenfälle: Bei jedem Nachdenken über einen anderen Spieler würfelt
  die KI (nur aus dem Zufallszustand des Spiels): mit 25 % ein Streit an der
  Grenze (-4 bis -12) unter Nachbarn und Rivalen um Inseln, bei Kriegerischen
  auch sonst mit 12,5 %; ohne Spannung ein freundlicher Austausch (+2 bis
  +6).
- Ruf: Kriegserklärung -10, Pakt kündigen -12, Geschenk +2, erfüllter
  Auftrag +3 je Schwierigkeit, gescheiterter Auftrag die Hälfte davon.
- Antworten der KI: Handelsabkommen ab Meinung -10 (Händler) / 0
  (Expansionist) / 15 (Kriegerisch); Pakt ab 25 (Kriegerisch 45); Bündnis ab
  50 und nur mit Pakt. Frieden erst nach 240 s Krieg, wenn der Vorschlagende
  mindestens 0,6 / 0,8 / 1,1 mal so stark ist, nach 900 s Krieg oder sobald
  der Gefragte in diesem Krieg eine Insel erobert hat. Forderungen werden
  erfüllt, wenn der Fordernde 1,5 / 1,8 / 2,5 mal so stark ist. Ein Tausch
  wird angenommen, wenn das Erhaltene mindestens das 1,0 / 1,1 / 1,2-fache
  des Gegebenen wert ist (abzüglich 0,2 % je Meinungspunkt); Waren, an denen
  die KI Mangel hat, zählen 1,4-fach, solche im Überfluss 0,6-fach. Jede
  Antwort hat einen Grund.
- Was eine KI selbst tut (höchstens ein Schritt je Partner und Gedanke):
  im Krieg Frieden anbieten, wenn sie schwächer ist (unter 0,8), der Krieg
  600 s dauert, oder nach 300 s, wenn sie eine Insel erobert hat oder nur
  über ein Bündnis hineingezogen wurde und den Gegner kaum hasst (Meinung
  über -30); sonst Krieg erklären bei Meinung unter -25 (Kriegerisch) / -60
  und Macht über 1,0 / 1,3 mal der des anderen (Macht = Stärke + Gold / 2000
  - Einwohner / 100); Pakt oder Bündnis kündigen bei Meinung unter -20;
    fordern (nicht der Händler) bei Meinung unter 0 und 1,5-facher Macht mit
    25 % Wahrscheinlichkeit; Verträge vorschlagen; fehlende Waren (Versorgung
    unter 50 %) für den 1,1-fachen Wert von einer anderen KI kaufen, die
    mindestens 70 davon hat; als Händler Überschuss an KIs verkaufen, denen
    die Ware fehlt; mit 30 % Wahrscheinlichkeit 300 Gold schenken, wenn die
    Meinung zwischen 10 und 55 liegt und mehr als 3000 Gold da sind (nicht
    Kriegerisch), oder um einen viel stärkeren, verärgerten Nachbarn zu
    beruhigen.
- Ein Handelsabkommen bringt jedem Partner je Minute 1 Gold je 20 Einwohner
  des anderen (höchstens 30). Ein Geschenk bringt 1 Meinungspunkt je 40 Gold
  Wert (höchstens 25). Krieg erklären geht nicht mit Pakt. Bündnisse ziehen
  in den Krieg: Verbündete des Angegriffenen erklären dem Angreifer den
  Krieg (wenn sie mit ihm keinen Pakt haben), Verbündete einer angreifenden
  KI folgen ihr, wenn sie den Angegriffenen nicht mögen (Meinung unter 20)
  und keinen Pakt mit ihm haben. Im friedlichen Spiel gibt es keinen Krieg.
- Angebote einer KI an den Spieler (Verträge, Frieden, Forderungen, Tausch)
  stehen 120 s; Krieg, Geschenke und Kündigungen gelten sofort.
- Das Diplomatie-Fenster (Verwaltung, Register "Diplomatie") listet alle
  Mächte zusammen: erst die KI-Rivalen, dann die vier Völker, dann die
  Piratenbanden; ein Filter (Alle / Rivalen / Völker / Piraten) zeigt eine
  Art allein. Jede Macht ist eine Karte im gleichen Aufbau: Wappen, Name,
  Art (Rivale, Volk, Piraten), Status (Frieden, Handelsbeziehung, Bündnis,
  Krieg, "Krieg - Schutzgeld bezahlt", "Friedliches Spiel"), Herrscher bzw.
  Charakter, Stärke, Meinung mit Balken (bei Völkern und Piraten mit Stufe)
  und Gründen, darunter ihre Aktionen; Völker und Piraten haben dazu "Hafen
  öffnen" (ihr Hafenfenster) und "Zur Insel". Ein eigenes Register
  "Fraktionen" gibt es nicht mehr.

## Militär

- Stärke = Summe über bewaffnete Schiffe und Verteidigungen von LP x
  Schaden / Nachladezeit, geteilt durch 100.
- Alle 0,5 s suchen Schiffe mit Kanonen das nächste feindliche Schiff in
  Reichweite, sonst ein feindliches Gebäude (Verteidigung vor Kontor vor dem
  Rest); Türme und Batterien schießen auf Schiffe. Ein Treffer macht Schaden
  x 0,8 bis 1,2 x (1 - Rüstung). Untätige eigene Kriegsschiffe verfolgen
  Feinde im Umkreis von 12 Feldern.
- Feinde sind Spieler im Krieg miteinander und Piraten gegen alle. Ein Schiff
  mit 0 LP sinkt. Ein Kontor mit 0 LP wird erobert: Insel, Gebäude und Waren
  gehen an den Angreifer, die Hälfte der Bewohner flieht, das Kontor behält
  30 % LP (Entscheidung: Eroberung statt Zerstörung, damit Krieg Inseln
  bewegt). Piraten plündern stattdessen 40 % aller Waren und ziehen ab
  (Kontor 25 % LP). Andere Gebäude mit 0 LP sind zerstört.
- Reparatur: Schiffe höchstens 6 Felder vor dem Liegeplatz einer eigenen,
  fertigen Werft 10 % LP je Sekunde, an einem eigenen Kontor 4 % LP je
  Sekunde, je für 0,5 Gold je LP, frühestens 5 s nach dem letzten Treffer; Gebäude 1 % je Sekunde für
  0,2 Gold je LP, 20 s nach dem letzten Treffer. Beschädigte Schiffe fahren
  bis auf 50 % langsamer.
- Sofortreparatur: Im Objektfenster setzt "Reparieren" ein eigenes, fertiges,
  nicht brennendes Gebäude sofort auf volle LP, für 0,4 Gold je fehlendem LP
  (doppelter Preis der langsamen Reparatur). Befehl `repair`.

### Landtruppen und Kaserne

Die Einheiten sind Daten in `engine/units-data.ts` (Tabelle daraus erzeugt).
Der frühere einzige Soldat ist die Linieninfanterie mit denselben Werten;
Soldaten älterer Spielstände werden beim Laden zu Linieninfanterie.
Freischaltung: höchste erreichte Schicht, Forschung und - wo genannt - ein
fertiges eigenes Gebäude der Art.

| Einheit          | Kategorie          | LP  | Schaden | Reichweite | Nachladen | Tempo | Panzerung | Sicht | gegen Gebäude | gegen Stellung | Nahkampf (Fernkämpfer) | Fläche     | Fähigkeit        | Kosten                           | Ausbildung | Unterhalt/Min | Freischaltung            |
| ---------------- | ------------------ | --- | ------- | ---------- | --------- | ----- | --------- | ----- | ------------- | -------------- | ---------------------- | ---------- | ---------------- | -------------------------------- | ---------- | ------------- | ------------------------ |
| Miliz            | Infanterie         | 60  | 6       | 1,5        | 1,2 s     | 1,2   | 0 %       | 6     | x0,4          | x1             | -                      | -          | -                | 60 Gold, Holz 2                  | 6 s        | 1             | Bauern                   |
| Linieninfanterie | Infanterie         | 80  | 9       | 1,6        | 1,2 s     | 1,1   | 0 %       | 6     | x0,6          | x1             | -                      | -          | -                | 120 Gold, Werkzeug 1             | 13 s       | 2             | Arbeiter                 |
| Grenadiere       | Schwere Infanterie | 100 | 13      | 2,2        | 1,6 s     | 1     | 15 %      | 6     | x2,4          | x1,3           | -                      | -          | -                | 220 Gold, Werkzeug 1, Musketen 2 | 18 s       | 4             | Handwerker               |
| Eliteinfanterie  | Schwere Infanterie | 170 | 16      | 1,7        | 1,1 s     | 1,15  | 30 %      | 7     | x0,8          | x1             | -                      | -          | -                | 380 Gold, Musketen 2, Kleidung 2 | 23 s       | 6             | Kaufleute, Kriegskunst   |
| Musketenschützen | Fernkampf          | 70  | 11      | 4,5        | 2 s       | 1     | 5 %       | 7     | x0,5          | x1             | x0,5                   | -          | -                | 160 Gold, Musketen 2             | 15 s       | 3             | Handwerker               |
| Scharfschützen   | Fernkampf          | 60  | 30      | 7,5        | 4 s       | 1     | 0 %       | 10    | x0,3          | x1             | x0,4                   | -          | -                | 320 Gold, Musketen 2, Werkzeug 2 | 20 s       | 5             | Kaufleute, Kriegskunst   |
| Artillerie       | Fernkampf          | 90  | 34      | 6,5        | 5 s       | 0,55  | 10 %      | 8     | x3            | x1,5           | x0,3                   | 1,6 Felder | -                | 420 Gold, Kanonen 1, Bretter 4   | 25 s       | 6             | Handwerker, Geschützguss |
| Kavallerie       | Spezialisten       | 120 | 13      | 1,6        | 1,1 s     | 2,4   | 15 %      | 8     | x0,5          | x0,45          | -                      | -          | -                | 300 Gold, Musketen 1, Getreide 6 | 20 s       | 5             | Kaufleute, Getreidehof   |
| Pioniere         | Spezialisten       | 80  | 7       | 1,5        | 1,3 s     | 1,1   | 10 %      | 6     | x1,2          | x1             | -                      | -          | repariert 6 LP/s | 180 Gold, Werkzeug 3, Bretter 4  | 15 s       | 3             | Handwerker, Festungsbau  |
| Sanitäter        | Spezialisten       | 60  | 3       | 1,4        | 1,5 s     | 1,1   | 0 %       | 6     | x0,2          | x1             | -                      | -          | heilt 4 LP/s     | 200 Gold, Stoff 4                | 15 s       | 3             | Kaufleute, Medikus       |
| Aufklärer        | Spezialisten       | 55  | 5       | 1,5        | 1,2 s     | 2     | 0 %       | 14    | x0,3          | x1             | -                      | -          | klärt auf        | 90 Gold, Werkzeug 1              | 8 s        | 2             | Handwerker               |

- Kaserne: 3 x 2 Felder, 600 Gold, 8 Bretter, 6 Ziegel, 3 Werkzeug, 8
  Unterhalt, ab 40 Arbeitern. Ihr Fenster öffnet groß in der Mitte: links die
  Ausbildungsschlange (höchstens 10 Einheiten, die erste mit Fortschritt und
  Restzeit, jede mit "Abbrechen") und "Ausbildung anhalten" / "fortsetzen",
  rechts die Kategorien Infanterie, Fernkampf, Schwere Infanterie und
  Spezialisten mit je einer Kachel (Bild, Name, Beschreibung, Angriff,
  Verteidigung, LP, Tempo, Reichweite, Nachladen, Ausbildungszeit, Unterhalt,
  Kosten - rot, was fehlt -, Freischaltung; ausgegraut mit Grund) und den
  Knöpfen "Ausbilden" und "5 ausbilden".
- Bezahlt wird beim Start aus Kasse und Lager der Insel. Abbrechen: die
  Einheit in Ausbildung gibt 50 % des noch offenen Anteils zurück, wartende
  alles (wie bei der Werft). Die fertige Einheit erscheint auf dem freien,
  begehbaren Feld neben der Kaserne, das ihr am nächsten liegt (kein Gebäude,
  kein Gebirge, mindestens 0,6 Felder zur nächsten Einheit, höchstens 3
  Felder entfernt); ist keines frei, wartet sie.
- Kampf alle 0,5 s, aus dem Zufallszustand des Spiels: Schaden x 0,8 bis 1,2,
  dann die Faktoren der Art (gegen Gebäude, gegen eine Stellung), Fernkämpfer
  mit einem Feind in 2 Feldern Nähe nur mit ihrem Nahkampf-Faktor, aus einer
  Linie 15 % stärker; das Ziel zieht seine Panzerung ab (+20 %, wenn es die
  Position hält, +15 % im Block gegen Nahkampf, höchstens 80 %). Artillerie
  trifft alle Feinde in 1,6 Feldern um das Ziel mit 60 % (locker stehende nur
  mit der Hälfte davon). Eine Stellung: haltende Einheiten und Einheiten
  höchstens 3 Felder von einem eigenen Turm, einer Batterie oder einem
  Kontor.
- Fernkämpfer schießen auch auf feindliche Schiffe in ihrer Reichweite, alle
  auf ein Schiff, das sie angreifen sollen.
- Pioniere reparieren das am meisten beschädigte eigene Gebäude in 3 Feldern
  mit 6 LP je Sekunde für 0,2 Gold je LP, auch unter Beschuss. Sanitäter
  heilen die am schwersten verwundete eigene Einheit in 3 Feldern mit 4 LP je
  Sekunde. Aufklärer sehen 14 Felder weit; eigene Einheiten in 6 Feldern um
  einen Aufklärer erkennen Feinde ebenso weit, und Minimap und Weltkarte
  zeigen feindliche Truppen (rote Punkte) und feindliche Schiffe (roter Ring)
  im Umkreis von 16 Feldern um jeden Aufklärer - ohne Aufklärer erscheinen
  feindliche Truppen dort nicht.
- Steuerung: Linksklick und Auswahlrechteck wählen, Rechtsklick ins Gelände
  marschiert (`march`), Rechtsklick auf eine feindliche Einheit, ein
  feindliches Gebäude oder ein feindliches Schiff am Ufer greift an
  (`unitAttack`). Im Fenster der Auswahl: Formation Linie, Block oder locker
  (`formation`), "Position halten" (`unitHold`), "Rückzug" zur nächsten
  eigenen Kaserne oder zum Kontor der Insel (`unitRetreat`; Feinde werden auf
  dem Weg nicht verfolgt) und "Patrouille" (`unitPatrol`, zweiten Punkt auf
  der Karte wählen). Eine Formation ordnet die Ziele beim Marsch: Linie
  nebeneinander (7 je Reihe), Block dicht, locker doppelt so weit.
- Truppenplätze der Schiffe stehen in der Schiffstabelle. "Einschiffen" holt
  die wartenden Einheiten einer Insel an Bord, sobald das Schiff an einem
  Kontor liegt oder Land dieser Insel höchstens 4 Felder entfernt ist (jede
  Küste, kein Kontor nötig). Rechtsklick mit gewählten Truppen auf ein eigenes
  Schiff schickt genau diese an Bord (Befehl `embark` mit `soldiers`),
  Abgesetzt wird auf jeder Insel: im Schiffsfenster (Reiter "Truppen" mit
  Auswahl der Inseln, nächste zuerst; die Übersicht zeigt bei Soldaten an
  Bord den Knopf "... Soldaten an Bord - jetzt absetzen") oder per Rechtsklick
  mit dem gewählten Schiff auf Land einer Insel:
  "Angriff: Insel" (Feind im Krieg) schickt das Schiff vor das Kontor; dort
  gehen sie auf dem nächsten Land im Umkreis von 4 Feldern an Land und
  marschieren auf einem einmal gesuchten Weg (A*) zum Kontor. "Absetzen"
  bringt sie auf eine eigene Insel (vor das Kontor), eine freie Insel oder
  die Insel eines Rivalen im Frieden (an die nächste Küste); dort bleiben sie
  stehen und stürmen nichts.
- Truppen auf dem Land eines Rivalen im Frieden: Beim Absetzen sinkt seine
  Meinung um 12 plus 1 je Soldat, und je 10 s, die sie dort stehen, um 1
  weitere (Grund "Truppen auf ihrem Land", höchstens -40, verblasst wie
  jede Erinnerung). Bündnis- oder Paktpartner nehmen es halb so übel. Fällt
  seine Meinung auf -60 (Händler), -50 (Expansionist) oder -35 (Kriegerisch),
  erklärt er dir den Krieg - nie im friedlichen Spiel. Gehen die Truppen
  wieder an Bord, verblasst der Ärger.
- Verteidiger auf eigener Insel gehen auf Feinde in 20 Feldern los, sonst in
  ihrer Sichtweite. Wachtürme und Batterien schießen auf Einheiten, wenn kein
  feindliches Schiff in Reichweite ist; die Wache jedes Kontors macht 4
  Schaden je Sekunde am nächsten Feind an seinen Mauern (3 Felder). Ein
  Kontor mit 0 LP wird erobert wie von See aus; die Einheiten bleiben als
  Besatzung.
- Sinkt ein Schiff, sinken seine Einheiten mit. Nach einem Friedensschluss
  kehren Einheiten auf fremdem Boden zur ersten eigenen Insel zurück. Die
  Stärke eines Spielers zählt Einheiten mit (LP x Schaden / Nachladezeit / 100
  je Einheit), der Unterhalt die ihrer Art.
- Militärübersicht (Verwaltung, Registerkarte "Militär"): Zahl der
  Einheiten, an Land und an Bord, Kriegsschiffe, Unterhalt des Militärs, Wert
  (Goldkosten aller Einheiten und Kriegsschiffe), Einheiten je Gattung,
  Positionen je Insel (mit "Hinsehen"), Steuergruppen, Flotten (mit "Flotte
  wählen"), Ausbildungs- und Werftaufträge sowie freie Plätze in Kasernen,
  Werften und Schiffen.
- Darstellung: jede Art mit eigener Ausrüstung als Instanzen (ein Mantel in
  der Farbe des Besitzers je Gestalt - zu Fuß, zu Pferd, Geschütz - und eine
  Ausrüstung je Art: Spieß, Bajonett, Granate, Muskete, langes Gewehr,
  Feldgeschütz auf Rädern, Pferd, Spaten, Sanitätstasche, Fernrohr), bis 240
  im Umkreis von 70 Feldern um den Blickpunkt.

## Aufträge

- Alle 150 bis 240 s (erstmals nach 120 s) ein neues Angebot, höchstens 3
  offen und 3 laufend; ein Angebot steht 300 s. Auftraggeber ist zur Hälfte
  ein Rivale, mit dem kein Krieg ist, sonst die Krone.
- Arten: Lieferung (20 je Schwierigkeit einer Ware aus einem eigenen Lager),
  Besiedlung (Kontor auf einer genannten freien Insel), Produktionsziel (25
  je Schwierigkeit erzeugen), Handelsauftrag (40 je Schwierigkeit an den
  Händler verkaufen), Wirtschaftsziel (Einwohner +60 oder Gold +2000 je
  Schwierigkeit), Diplomatie (Handelsabkommen mit einem Rivalen), Rettung
  (Schiffbrüchige auf offener See mit einem Schiff abholen und in einen
  eigenen Hafen bringen), Bauauftrag (2 je Schwierigkeit bauen).
- Zeitlimit 360 s x (Schwierigkeit + 1); Belohnung 600 Gold je Stufe, ab
  Stufe 2 Werkzeug, +10 Beziehung und +3 Ruf je Stufe. Scheitern kostet die
  Hälfte von Beziehung und Ruf.
- Wettlauf: Aufträge der Krone der Arten Lieferung, Besiedlung,
  Produktionsziel, Handelsauftrag, Wirtschaftsziel und Bauauftrag können
  auch andere Spieler annehmen (derselbe Befehl `missionAccept` mit der ID
  des Angebots). Jeder Teilnehmer bekommt eine eigene Kopie mit eigenem
  Fortschritt (Wirtschaftsziele gemessen an seinem eigenen Stand), alle
  Kopien tragen dieselbe Auftragsnummer (`contract`). Wer zuerst erfüllt,
  bekommt die Belohnung; alle anderen Kopien enden als „Verloren“ ohne
  Strafe, mit dem Namen des Gewinners. Auch eine Besiedlung, die ein anderer
  zuerst schafft, ist „Verloren“ statt gescheitert. Das Missionsfenster
  zeigt bei Angeboten und laufenden Aufträgen die Konkurrenz mit ihrem
  Fortschritt.

## Ereignisse

- Alle 60 s (erstmals nach 300 s) wird gewürfelt: Feuer (12 % je Spieler mit
  mindestens 12 Gebäuden, sobald die Feuerwache frei ist): ein Gebäude brennt
  bis 45 s und verliert 1,6 % LP je Sekunde; eine Feuerwache in Reichweite
  löscht nach 6 s. Seuche (4 % je Insel ab 80 Einwohnern, 150 s): Häuser ohne
  Medikus verlieren alle 10 s einen Bewohner und 35 % Zufriedenheit. Gute
  Ernte / Missernte (je 4 % je Insel mit Höfen, 240 s). Piraten (8 %, ab 20
  Minuten, nicht im friedlichen Spiel, ab 60 Minuten zwei Schiffe): sie
  segeln ein Kontor an, bevorzugt reicher Spieler, und ziehen nach Plünderung
  oder 420 s ab.
- Ein Sturm beschädigt jedes Schiff auf See einmal um 8 bis 20 % seiner LP
  (versenkt aber keines).
- Jede Ereignisart lässt sich beim neuen Spiel abwählen (siehe
  "Spieleinstellungen"): Feuer, Seuche, Sturm auf See (aus: statt Sturm
  regnet es), Missernte, gute Ernte, Piratenüberfälle (Überfälle der Banden,
  ihre große Flotte und die Piraten alter Welten), Ereignisse der Völker und
  Piraten (Hungersnot bis Meuterei; Aufträge der Fraktionen bleiben) und die
  fünf Katastrophen.

## Katastrophen

Fünf Naturkatastrophen (`engine/disasters.ts`, Zahlen in
`engine/disasters-data.ts`). Jede wird angekündigt (Meldung mit Sekunden bis
zum Schlag), schlägt zu, wütet eine Weile, endet mit einer Meldung und ist
auf der Karte zu sehen. Gewürfelt wird alle 60 s, frühestens nach 20
Spielminuten, je Insel eines Spielers oder einer Fraktion in fester
Reihenfolge (Überschwemmung, Dürre, Heuschrecken, Tsunami), höchstens eine
Katastrophe je Insel. Nach einer Katastrophe hat die Insel 15 Minuten Ruhe,
ihr Besitzer auf allen Inseln 10 Minuten; jede Art kommt nach ihrem Ende
erst nach ihrer Pause wieder (Überschwemmung 5, Dürre und Heuschrecken 10,
Tsunami 25, Schneesturm 7 Minuten). Während des geführten Einstiegs trifft
keine Katastrophe den Menschen. Überschwemmung, Dürre und Tsunami kommen zu
einem Spieler erst, wenn er ihren Schutz (Deich, Bewässerung, Hafenmauer)
bauen könnte.

| Katastrophe       | Chance je Wurf             | Vorwarnung | Dauer                      | Wann                                             | Wirkung                                                                                                                                                                                                                                                                                                                                                                               | Schutz                                                                                                                      |
| ----------------- | -------------------------- | ---------- | -------------------------- | ------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| Überschwemmung    | 2,5 % je Insel             | 30 s       | 120 s                      | Insel mit Gebäuden am Fluss oder an tiefer Küste | Entweder tritt der Fluss über die Ufer (Land bis 2 Felder neben dem Fluss) oder eine Sturmflut überspült die tiefe Küste einer Seite (unter Höhe 1,3, bis 3 Felder vom Meer). Betriebe im Wasser stehen still ("Überflutet") und verlieren ihre Waren; Gebäude verlieren 0,3 % LP je Sekunde (nie unter 40 %) und werden im Wasser nicht repariert; Karren fahren nicht durch Wasser. | Deich: in seiner Reichweite (7) läuft kein Wasser. Pumpstation: legt ihre Reichweite (12) 25 s nach dem Hochwasser trocken. |
| Dürre             | 6 % je Insel               | 45 s       | 300 s                      | Sommer, klares Wetter, Insel mit Höfen           | Höfe und Plantagen (Schaf, Getreide, Wein, Tabak) tragen 35 %.                                                                                                                                                                                                                                                                                                                        | Bewässerung (Reichweite 9): 100 %. Zierbrunnen in Reichweite: 60 %.                                                         |
| Heuschreckenplage | 1,5 % je Insel             | 20 s       | Schwarm 60 s, Felder 240 s | Insel mit mindestens 2 Höfen                     | Die Hälfte der Höfe (aufgerundet) ist 240 s kahl ("Kahlgefressen", Produktion 0, Ausgang verloren); im Lager frisst der Schwarm 30 % Getreide, 15 % Mehl, 10 % Brot.                                                                                                                                                                                                                  | Kein Gebäude: Vorräte im Lager und Höfe auf anderen Inseln.                                                                 |
| Tsunami           | 0,5 % je Insel             | 25 s       | Welle 6 s                  | Insel mit Gebäuden an der Küste                  | Die Welle trifft eine Seite der Insel (Felder bis 5 vom Meer): Hafenanlagen (Kontor, Werft, Fischer, Perlentaucher, Küstenbatterie) verlieren 60 % LP, andere Gebäude 45 % (nie unter 15 %); ein getroffenes Kontor verliert 12 % jeder Ware; Schiffe am Kontor 40 % LP, Schiffe auf See bis 40 Felder 10 % (nie unter 10 %).                                                         | Hafenmauer (Reichweite 12): Hafenanlagen 15 %, sonst 40 % der Wucht, Lager und Schiffe am Kontor ebenso. Deich: 50 %.       |
| Schneesturm       | 15 % je Wurf (ganze Karte) | 30 s       | 150 s                      | nur im Winter                                    | Karren auf Straßen nur im Geländetempo (Straße 0,4, Pflaster 0,6 der Straßengeschwindigkeit, Gelände 85 %), Schiffe 70 % Tempo. Jedes Haus in Reichweite eines Marktes verbrennt 0,02 Brennmaterial je Bewohner und Minute (erst Kohle, dann Holz); fehlt es, sinkt die Zufriedenheit um bis zu 30 Punkte.                                                                            | Holz und Kohle im Lager.                                                                                                    |

Fraktionen werden ebenso getroffen: Ihre Betriebe arbeiten während einer
Überschwemmung mit 60 %, einer Dürre mit 50 %, bei Heuschrecken mit 40 %
(die fressen auch ihr Getreide und Brot); ein Tsunami verdirbt 25 % ihrer
drei größten Bestände und schließt ihren Hafen 90 s. Die KI baut Schutz, wenn
eine Katastrophe sie getroffen hat (Deich, Pumpstation, Bewässerung,
Hafenmauer gegen das, was kam), der vorsichtige Händler-Charakter auch
vorher (außer der Pumpstation); je Insel höchstens 3 Deiche, 1 Pumpstation,
2 Bewässerungen und 1 Hafenmauer, jeweils neben einem gefährdeten Gebäude.

Anzeige: Das Gebäudefenster nennt die Gefahren am Standort und was davor
schützt, bei Schutzgebäuden die Zahl der gefährdeten Gebäude in Reichweite;
Häuser zeigen im Schneesturm, wie gut ihr Brennmaterial reicht. Die
Bauvorschau eines Schutzgebäudes nennt "schützt hier N Gebäude" und färbt
die gefährdeten Felder der eigenen Inseln: grün, wo diese Art schon schützt,
rot, wo nicht. Auf der Karte: Flutwasser über den überfluteten Feldern,
gelbbrauner Boden bei Dürre, ein dunkler Schwarm über den Höfen, Schnee auf
Land und Straßen mit dichtem Schneefall, die Welle, die in den letzten 14 s
auf die Küste zuläuft.

Gemessen (Headless, Saat 777, mittlere Karte, eine KI-Insel nach 50
Minuten, jede Katastrophe einzeln erzwungen):

| Katastrophe                            | ohne Schutz                                                                                                | mit Schutz                                                                                                                          |
| -------------------------------------- | ---------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| Überschwemmung (88 Felder, 8 Betriebe) | 8 Betriebe 120 s unter Wasser (952 Betriebs-Sekunden), 1426 LP Schaden, Produktion der Insel 344 statt 424 | 11 Deiche: 2 Felder nass, kein Betrieb, kein Schaden; 3 Pumpstationen: nach 30 s noch 1 Betrieb nass, 294 Betriebs-Sekunden, 230 LP |
| Dürre (11 Höfe, 300 s)                 | Ernte 46 %                                                                                                 | 4 Bewässerungen: 95 %                                                                                                               |
| Heuschrecken (11 Höfe)                 | 6 Höfe kahl, Getreide 100 -> 73, Brot 100 -> 95, Ernte in 5 min 99 statt 206                               | -                                                                                                                                   |
| Schneesturm                            | Karren 1,1 statt 2,6 Felder/s, Schiffe 2,2 statt 3,1 Felder/s, Zufriedenheit 67 % statt 73 %               | mit Holz und Kohle: 14 Brennmaterial verbraucht, Zufriedenheit 72 % wie ohne Sturm                                                  |
| Tsunami (25 Gebäude)                   | Hafenanlagen -60 % LP, andere -45 %, Lager -12 %                                                           | Hafenmauer und Deiche: Hafenanlagen -9 %, andere -18 %, Lager -2 %                                                                  |

Häufigkeit (große Karte, drei KI, alle Fraktionen, 120 Minuten, Saaten
12345, 777 und 4242 zusammen): 29 Überschwemmungen, 20 Dürren, 13
Heuschreckenplagen, 6 Tsunamis und 3 Schneestürme; davon trafen die KI 25
(je KI-Spieler rund eine alle 35 Minuten), die Fraktionen 43, die ganze
Karte 3. Die erste kam nach 22 Minuten. Die KI baute danach Deiche, Pumpstationen,
Bewässerung und Hafenmauern (zum Beispiel Saat 4242: Händler 3 Deiche, 1
Pumpstation, 2 Bewässerungen). KI-Einwohner nach 120 Minuten mit gegen ohne
Katastrophen: 12345 1360 gegen 1504, 777 1684 gegen 1671, 4242 1469 gegen
1504 (zusammen 4513 gegen 4679, -3,5 %). Takt: höchstens 9,6 ms (12345),
8,1 ms (777) während einer Katastrophe; Saat 4242 hat Spitzen bis 26 ms, die
aus der Wegsuche der Kriegsschiffe kommen und ohne Katastrophen ebenso
auftreten (20 ms).

## Forschung

| Forschung             | Punkte | braucht               | schaltet frei                              |
| --------------------- | ------ | --------------------- | ------------------------------------------ |
| Fruchtwechsel         | 120    | -                     | +20 % Höfe                                 |
| Glasmacherkunst       | 150    | -                     | Quarzgrube, Glashütte                      |
| Festungsbau           | 150    | -                     | Küstenbatterie, Pioniere                   |
| Zunftwesen            | 180    | -                     | +15 % Handwerk                             |
| Schiffbaukunst        | 200    | -                     | Frachtschiff, Fregatte                     |
| Ingenieurwesen        | 250    | Glasmacherkunst       | Schicht Ingenieure                         |
| Optik                 | 300    | Ingenieurwesen        | Feinmechanik                               |
| Tabakanbau            | 200    | Ingenieurwesen        | Tabakplantage, Tabakdreherei               |
| Gehobene Gesellschaft | 400    | Optik, Tabakanbau     | Schicht Gehobene Schicht, Universität      |
| Goldschmiedekunst     | 350    | Gehobene Gesellschaft | Perlentaucher, Goldschmied                 |
| Wohlstand             | 500    | Goldschmiedekunst     | Schicht Wohlhabende Bürger, Theater        |
| Geschützguss          | 220    | Festungsbau           | Geschützgießerei, Linienschiff, Artillerie |
| Kriegskunst           | 240    | -                     | Eliteinfanterie, Scharfschützen            |
| Dampfkraft            | 450    | Optik                 | Maschinenbau, Dampfschiff, Schlachtkreuzer |

- Gelehrtenhaus 12, Universität 30 Punkte je Minute bei voller Besetzung
  (Stufe 2 x1,5). Gearbeitet wird an einem Feld; ein fertiges Feld schaltet
  frei, was in der Tabelle steht.

## Fremde Völker und Piraten

Jede neue Welt hat vier fremde Völker und eine Piratenbande (große Karte:
zwei Banden, die zweite ist die Bruderschaft vom Schwarzriff), je mit einer
festen, kleinen Heimatinsel (Radius 7,5 Felder). Der Generator legt sie
direkt nach der Startinsel an: mindestens 30 % der Kartenbreite vom Start
und 20 % voneinander (die beste von 400 Stellen aus der Saat; eine kleine
Karte nimmt so viele Völker, wie Platz ist, aber nie weniger als zwei). Die
üblichen Inseln kommen danach in voller Zahl dazu, die Rivalen starten weit
weg von den Fraktionen. Die Heimatinseln sind für alle Bauprüfungen
gesperrt (Grund "Heimatinsel eines fremden Volkes oder von Piraten"), kein
Siedlungsziel der KI oder eines Auftrags, nicht eroberbar und nicht
zerstörbar; Truppen landen dort nicht. Aussehen: Sand, Kuppeln und Palmen
(Qasirah), Pagoden, geschwungene Dächer und Kirschbäume (Shogunara), helle
Steinhäuser mit roten Ziegeln und Markt (Valdoria), Langhäuser im
Nadelwald mit Wachtürmen (Skeld), dunkle Klippen mit Festung,
Kanonentürmen, schwarzen Flaggen, Wracks und Lagerfeuern (Piraten). Die
Stadt ist je Insel ein einziges Mesh; dazu rudern kleine Boote im Hafen,
Rauch steigt auf, die Fraktionsschiffe tragen ihre Flagge.

Alte Welten (Spielstände der Formate 1 bis 4) bekommen keine neuen Inseln,
weil die Karte aus der Saat entsteht: Sie laden ohne Fraktionen, und ihre
Piraten verhalten sich wie bisher (Überfall auf ein Kontor vom Kartenrand).

| Fraktion                     | Insel       | Herrscher                 | Art     | Start | Gold/min | Betriebe (je min)                           | Verbrauch (je min)                                                                     | verkauft                          | kauft                                                                                                      | Schiffe                                     | Freischaltung                                                                                                                    |
| ---------------------------- | ----------- | ------------------------- | ------- | ----- | -------- | ------------------------------------------- | -------------------------------------------------------------------------------------- | --------------------------------- | ---------------------------------------------------------------------------------------------------------- | ------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| Sultanat von Qasirah         | Qasirah     | Sultanin Nadira           | Volk    | 10    | 320      | Gewürze 6, Seide 3, Parfüm 1                | Bretter 1,6, Werkzeug 0,8, Glas 0,6, Schmuck 0,25, Instrumente 0,25, Fisch 1,5, Brot 1 | Gewürze, Seide, Parfüm            | Bretter, Holz, Werkzeug, Glas, Schmuck, Instrumente, Fisch, Brot, Eisen                                    | 2 x Frachtschiff, 1 x Fregatte              | Rezept der Parfümerie: ein neuer Betrieb macht aus Gewürzen und Glas Parfüm, das die oberen Schichten lieben. (ab 20, 2500 Gold) |
| Kaiserreich von Shogunara    | Shogunara   | Kaiserin Sayaka           | Volk    | 0     | 260      | Tee 6, Porzellan 3, Seide 1,5               | Eisen 1,2, Musketen 0,5, Kanonen 0,2, Bretter 1,2, Fisch 1,5, Getreide 1,5             | Tee, Porzellan, Seide             | Eisen, Musketen, Kanonen, Bretter, Holz, Fisch, Getreide, Werkzeug                                         | 1 x Klipper, 3 x Fregatte                   | Lackpanzerung: alle deine Schiffe bekommen 10 Prozentpunkte mehr Rüstung. (ab 20, 3000 Gold)                                     |
| Handelsrepublik Valdoria     | Valdoria    | Dogin Livia Morosetti     | Volk    | 5     | 380      | Wein 5, Glas 3, Olivenöl 5, Luxusmöbel 1,5  | Holz 2, Bretter 1, Ziegel 1,2, Steinquader 1, Getreide 1,5, Wolle 1, Stoff 0,8         | Wein, Glas, Olivenöl, Luxusmöbel  | Holz, Bretter, Ziegel, Steinquader, Getreide, Wolle, Stoff, Kleidung, Werkzeug und jeden Überschuss (60 %) | 3 x Klipper, 1 x Fregatte                   | Handelsprivileg: 12 % bessere Preise in Valdoria und exklusive Lieferverträge mit 12 % besserem Preis. (ab 60, 0 Gold)           |
| Nordlande von Skeld          | Skeld       | Jarl Ragnhild             | Volk    | 0     | 180      | Pelze 4, Fisch 8, Wolle 5, Eisen 3, Seile 5 | Getreide 2, Brot 1, Bier 1,2, Wein 0,5, Kleidung 0,6, Werkzeug 0,6                     | Pelze, Fisch, Wolle, Eisen, Seile | Getreide, Brot, Bier, Wein, Kleidung, Stoff, Werkzeug, Ziegel                                              | 1 x Skeld-Knarr, 2 x Kanonenboot            | Bauplan der Skeld-Knarr: ein robuster, schwer gepanzerter Frachter für deine Werften. (ab 20, 2000 Gold)                         |
| Piraten von Krähenfels       | Krähenfels  | Kapitän Brack Rabenauge   | Piraten | -25   | 140      | Rum 4, Fisch 3, Bretter 2                   | Fisch 1,5, Brot 0,8, Bier 0,6, Wein 0,4, Rum 1                                         | Rum, Schatzkarte                  | Musketen, Kanonen, Werkzeug, Holz, Bretter, Brot, Bier, Wein                                               | 3 Piratenboote zu Beginn, dann eigene Werft | -                                                                                                                                |
| Bruderschaft vom Schwarzriff | Schwarzriff | Kapitänin Ysolde Riffzahn | Piraten | -30   | 110      | Rum 3, Fisch 3, Bretter 2                   | Fisch 1,5, Brot 0,6, Rum 1, Bier 0,6                                                   | Rum, Schatzkarte                  | Musketen, Kanonen, Werkzeug, Bretter, Brot, Bier, Wein, Kleidung                                           | 2 Piratenboote zu Beginn, dann eigene Werft | -                                                                                                                                |

Jede Fraktion hat ein eigenes Lager (höchstens 400 je Ware) und eigenes
Gold. Waren entstehen nur in ihren festen Betrieben (Raten oben; bei einer
Epidemie halb, bei reicher Ernte eine Ware dreifach) und durch Handel; ihre
Leute verbrauchen die Liste oben (bei Hungersnot Nahrung dreifach). Gold
kommt von ihren Einwohnern (Gold/min) und aus dem Handel. Lage eines Volkes:
Ruhig, Produziert, Handelt, Verhandelt, Baut Schiffe, Verteidigt sich,
Erholt sich; der Piraten: Ruhig, Patrouille, Sucht Beute, Verfolgt, Greift
an, Plündert, Kehrt heim, Repariert, Verhandelt.

### Preise und Handel

Preis = Wert x (1 + Ausschlag x Druck), Druck = (Ziel - Bestand) / Ziel,
begrenzt auf -1 bis 1; Ziel 150 bei eigenen Waren, 120 bei gesuchten, 60 bei
anderem Überschuss (der nur 60 % bringt). Ausschlag 0,5 bis 0,85 (Valdoria
am stärksten). Kaufpreis = Preis x 1,15, Verkaufspreis = Preis x 0,8,
jeweils 5 / 10 / 15 % besser bei Freundlich / Verbündet / Vertrauensvoll
(Misstrauisch 5 % schlechter); bei einer Hungersnot kostet Nahrung 60 % mehr.
Ein Geschäft rechnet mit dem Bestand nach der halben Menge, also steigt und
fällt der Preis nachvollziehbar mit jeder Menge. Eine Fraktion behält einen
Teil ihres Ziels zurück (65 / 40 / 25 / 12 / 5 % von Misstrauisch bis
Vertrauensvoll) - Freunde bekommen größere Mengen - und kauft nur, solange
sie mehr als 1500 Gold hat. Ein Volk kauft seine eigenen Waren nicht zurück.

Gehandelt wird nur mit einem eigenen Schiff im Hafen (still, höchstens 3,5
Felder vom Liegeplatz) und nach "Handelsbeziehungen aufnehmen" (ab der
Handelsgrenze: Shogunara ab -20, Skeld ab -40, sonst ab -60). Rechtsklick
auf eine Fraktionsinsel schickt ein Schiff in ihren Hafen; das Schiffsfenster
zeigt dann "Hafen von ...". Handelsrouten können Fraktionshäfen als Halt
haben: Ausladen verkauft, Einladen kauft; die Grenze ist der Mindest- bzw.
Höchstpreis je Einheit (0 = jeder Preis). Ein Sturm im Hafen schließt ihn
2 Minuten.

### Lieferverträge

Ein Volk schließt bis zu zwei Verträge je Spieler: alle 10 Minuten 10 bis
100 Einheiten, beim Verkauf zu 95 % des Preises beim Ziel-Bestand (beim
Kauf umgekehrt); Valdorias Privileg gibt 12 % mehr. Ein Handelsschiff des
Volkes segelt zum Kontor des Spielers (dem mit dem meisten der Ware), lädt
bzw. entlädt dort und zahlt bzw. kassiert. Fehlt dem Spieler Ware oder Gold,
ist die Lieferung ausgesetzt und zählt als Bruch (Erinnerung -6, bei
Shogunara doppelt); nach 3 Brüchen in Folge kündigt das Volk (weitere -12).
Fehlt dem Volk die Ware oder ein freies Schiff, ist die Lieferung ohne Bruch
ausgesetzt. Jede gelungene Lieferung bringt +3 Erinnerung. Wird das Schiff
unterwegs versenkt, ist die Ladung verloren.

### Beziehung und Diplomatie

Die Beziehung läuft über dieselben Beziehungen und Erinnerungen wie bei den
Rivalen (`diplomacy.ts`), verblasst aber langsamer (0,997 je 10 s). Meinung
= Wesen (Start oben) + halber Ruf + Handelsbeziehung 5 + Bündnis 15 +
Schutzgeld 10 - Feindschaft 40 (nur bei Völkern; der Krieg der Piraten
zählt nicht extra) + Erinnerungen (Handel bis 4 je Geschäft,
Geschenke 1 je 40 Gold bis 25, Verträge, Aufträge, Jagd auf Piraten +4 je
versenktem Piratenschiff, Angriffe -1 je Treffer und -8 je versenktem
Schiff ...). Das Temperament gewichtet: Qasirah Handel x1,5, Valdoria Handel
x2, Shogunara Verträge und Brüche x2, Skeld Piratenjagd x2. Stufen: bis -60
Feindselig, -59 bis -20 Misstrauisch, -19 bis 19 Neutral, 20 bis 59
Freundlich, 60 bis 89 Verbündet, ab 90 Vertrauensvoll.

Aktionen (alle im Diplomatie-Fenster, Kaufen und Verkaufen im Hafenfenster):
Handelsbeziehungen aufnehmen, kaufen, verkaufen, Geschenk und Forderung
(siehe unten), Liefervertrag schließen und kündigen (Kündigen -6),
militärische Unterstützung anfragen (Shogunara und Skeld, ab Verbündet oder
mit Bündnis: ihre Kriegsschiffe patrouillieren 5 Minuten vor deinem Kontor,
dann 5 Minuten Pause; ein Wächter bleibt daheim), gemeinsam Piraten jagen
(ab Freundlich: Patrouille vor der Pirateninsel), Waffenstillstand (bei
Feindschaft mit einem Volk nach 2 Minuten; Piraten kennen keinen),
Bündnisvertrag (ab Verbündet und mit Handelsbeziehung; ein Verbündeter
schickt bei deinem Krieg oder einem Piratenangriff auf deine Schiffe von
selbst Hilfe) und ihre Kunst lernen (siehe Tabelle). Wer ein
Volk angreift (Rechtsklick mit einem Kriegsschiff), bricht den Frieden:
Feindschaft, Ruf -10, Erinnerung -30. Ein angegriffenes Volk erklärt bei
Meinung -60 von selbst Feindschaft. Die Wächter eines Volkes jagen Feinde
bis 22 Felder um ihre Insel und um ihre Händler und brechen eine Jagd 30
Felder von daheim ab.

Geschenk und Forderung gehen bei Völkern genau wie bei den Rivalen, mit
denselben Knöpfen und Beträgen: 200 oder 1000 Gold schenken, 1000 Gold
fordern. Ein Geschenk geht in das Gold des Volkes und bringt 1
Meinungspunkt je 40 Gold (höchstens 25, Temperament wie oben) und Ruf +2.
Eine Forderung zahlt das Volk aus seinem eigenen Gold, wenn die Stärke des
Spielers mindestens das Nötige mal der Stärke des Volkes ist: nötig ist
sein Charakter (Qasirah 1,5, Valdoria 1,8, Shogunara 2,5, Skeld 2,5) minus
0,01 je Meinungspunkt (ein Freund zahlt eher, ein Feind seltener),
mindestens aber 0,5. Antworten: "aus Furcht" bzw. bei Meinung ab 20 "die
Beziehung ist gut genug"; abgelehnt mit Grund "sie fürchten dich nicht",
"nicht genug Gold" (es bleiben ihm sonst keine 1500 Gold) oder "ihr seid im
Krieg". Eine erfüllte Forderung bleibt als Erinnerung -15, eine abgelehnte
als -5, wie bei den Rivalen; beides steht in den Nachrichten des Volkes.
Piraten werden nicht zur Kasse gebeten.

Die KI-Rivalen handeln von selbst mit den Völkern: alle 4 Minuten segelt ein
Händler eines Volkes zu einem Rivalen (reihum), verkauft bis zu 20 Einheiten
von 2 Waren und kauft Überschuss (über 60) der gesuchten Waren. Diese
Händler werden genauso überfallen wie die Schiffe der Spieler.

### Spezialwaren und Exotik

| Ware        | Wert | Herkunft                | Verwendung                                               |
| ----------- | ---- | ----------------------- | -------------------------------------------------------- |
| Gewürze     | 50   | Qasirah                 | Exotik: Handwerker, Kaufleute; Parfümerie                |
| Seide       | 70   | Qasirah, Shogunara      | Exotik: Ingenieure, Gehobene Schicht, Wohlhabende Bürger |
| Tee         | 45   | Shogunara               | Exotik: Kaufleute, Ingenieure                            |
| Porzellan   | 85   | Shogunara               | Exotik: Ingenieure, Gehobene Schicht, Wohlhabende Bürger |
| Olivenöl    | 30   | Valdoria                | Exotik: Kaufleute, Ingenieure                            |
| Luxusmöbel  | 120  | Valdoria                | Exotik: Gehobene Schicht, Wohlhabende Bürger             |
| Pelze       | 55   | Skeld                   | Exotik: Handwerker, Kaufleute                            |
| Seile       | 20   | Skeld                   | Bau der Skeld-Knarr                                      |
| Rum         | 28   | Krähenfels, Schwarzriff | Exotik: Arbeiter, Handwerker                             |
| Parfüm      | 150  | Qasirah, Parfümerie     | Exotik: Gehobene Schicht, Wohlhabende Bürger             |
| Schatzkarte | 400  | Schwarzer Markt         | führt zu einem Schatz                                    |

Die Exotik ist ein freiwilliges Bedürfnis: Häuser im Marktbereich nehmen
diese Waren zusätzlich (0,008 bis 0,02 je Bewohner und Minute). Voll
versorgt bringt sie +12 % Zufriedenheit; ab 50 % Versorgung steigt ein Haus
schon auf, wenn jedes Bedürfnis zu 60 % statt 75 % erfüllt ist. Fehlt sie,
kostet das nichts (keine Mangelmeldung). Der freie Händler führt keine
dieser Waren. Die Parfümerie (2 x 2, Handwerker, 1 Gewürze + 1 Glas = 1
Parfüm in 30 s) gibt es nur durch Qasirah. Die Skeld-Knarr ist ein
Frachter mit 1300 LP, 40 % Rüstung, Tempo 3,6, 5 x 45 Laderaum (1800 Gold,
30 Bretter, 20 Seile, 8 Werkzeug). Shogunaras Lackpanzerung gibt allen
eigenen Schiffen 10 Prozentpunkte Rüstung (höchstens 75 %).

### Piraten

| Schiff              | LP   | Rüstung | Tempo | Schaden/Reichweite/Nachladen | Laderaum | Kosten der Bande                  | höchstens |
| ------------------- | ---- | ------- | ----- | ---------------------------- | -------- | --------------------------------- | --------- |
| Piratenboot         | 320  | 10 %    | 4.4   | 14/5.5/2.2                   | 2 x 30   | 900 Gold, 14 Bretter, 0 Kanonen   | 4         |
| Piratenkorvette     | 650  | 20 %    | 4     | 28/7/2.4                     | 3 x 30   | 2200 Gold, 28 Bretter, 2 Kanonen  | 3         |
| Piratenfregatte     | 1200 | 30 %    | 3.6   | 46/8/2.6                     | 4 x 40   | 4200 Gold, 44 Bretter, 6 Kanonen  | 2         |
| Piratenkriegsschiff | 2200 | 40 %    | 3     | 70/9/3.2                     | 5 x 40   | 8000 Gold, 70 Bretter, 12 Kanonen | 1         |

Die Bande baut neue Schiffe aus Gold, Brettern und Kanonen ihres Lagers
(höchstens 6, alle 5 Minuten eines, 500 Gold bleiben übrig); Fregatten erst,
wenn ein Gegner die Stärke 30 hat, das Kriegsschiff ab 120. Kanonentürme der
Piraten: Schaden 42, Reichweite 10, alle 3 s (Krähenfels 4, Schwarzriff 3);
die Türme der Völker: Schaden 30, Reichweite 9.

Krieg: Jede Bande ist von Spielbeginn an mit jedem Spieler im Krieg, mit
dem Menschen wie mit den KI-Rivalen (im friedlichen Spiel nicht: Status
"Friedliches Spiel", keine Überfälle). Es gibt keinen Waffenstillstand und
keinen Frieden per Vorschlag. Der Krieg ist ihr Normalzustand und zählt
deshalb nicht zusätzlich in ihre Meinung; Handel im Hafen, Schwarzer Markt
und Taverne bleiben offen (Schmuggel). Schutzgeld ist bezahlter Schutz: Der
Krieg bleibt, aber die Bande überfällt dich nicht, solange du zahlst
(Status "Krieg - Schutzgeld bezahlt").

Bündnis: erst möglich, wenn du seit dem letzten gebrochenen Bündnis mit
dieser Bande 5 Schiffe anderer Gegner versenkt hast (Rivalen oder Völker,
keine Piraten) oder 1 Kontor eines Rivalen erobert oder zerstört hast. Jede
Bande zählt das je Spieler (`deeds`); das Diplomatie-Fenster zeigt den
Fortschritt ("3 von 5 Gegnerschiffen versenkt ...") und den gesperrten Knopf
mit Grund. Ist die Bedingung erfüllt, nimmt die Bande "Bündnis anbieten" an,
wenn ihre Meinung über dich mindestens -50 ist; sonst lehnt sie mit Grund
ab. Jedes versenkte Piratenschiff drückt die Meinung (-8 und die Treffer),
Geschenke heben sie. Verbündete Piraten: Krieg vorbei (Status "Bündnis",
Meinung +15), sie überfallen dich und deine Schiffe nicht mehr, ihre Türme
schießen nicht auf dich, Schutzgeld ist nicht nötig (ein laufendes endet,
ein neues wird abgelehnt) und eine Schutzgeldforderung bleibt aus. Sie
greifen deine Kriegsgegner an: Ihre Räuber suchen zuerst Handelsschiffe
deiner Feinde (1000 Gold Vorrang in der Zielwahl), der große Überfall nach
dem Sammeln trifft zuerst einen deiner Feinde, und alle 10 Minuten segelt
ein bereiter Räuber gegen das nächste Kontor eines deiner Kriegsgegner.
Eine Eskorte durch Piraten gibt es nicht. Greifst du die Bande an
(Rechtsklick mit einem Kriegsschiff) oder beendest du das Bündnis selbst
(Erinnerung -12), ist wieder Krieg, und die Bedingung zählt von vorn. Eine
Meuterei beendet das Bündnis nicht. Die KI-Rivalen bleiben mit den Piraten
im Krieg; sie schließen kein Bündnis mit ihnen.

Überfälle: frühestens nach 20 Minuten, nie im friedlichen Spiel, nie bei
Schutzgeld oder Bündnis. Höchstens 1 Räuber zugleich
(alle 30 Minuten einer mehr, bis 3), 2 Minuten Pause je Überfall, 6 Minuten
je Opfer. Ein Räuber legt sich 8 Felder neben ein Handelsschiff auf die
Lauer (Patrouille), sucht 50 s je Stück See (Sicht 16 Felder) und gibt nach
7 Minuten auf. Er greift an, wenn seine Gruppe (Räuber in 10 Feldern)
mindestens 1,3-mal so stark ist wie die Eskorte (Kriegsschiffe in 8 Feldern)
plus 12 je weiterem Handelsschiff im Konvoi (6 Felder) und der Konvoi
kleiner ist als seine Grenze (Boot 1, Korvette 2, Fregatte 4,
Kriegsschiff 8). Gewässer bis 28 Felder um ein Volk meidet er. Das
Handelsschiff flieht zum nächsten eigenen Hafen (oder 14 Felder fort) und
ruft untätige eigene Kriegsschiffe in 20 Feldern. Unter 35 % LP streicht es
die Flagge: die Piraten schießen nicht mehr, entern (2,2 Felder) und nehmen
die Hälfte jeder Ware, so weit ihr Laderaum reicht; die Beute kommt in ihr
Lager. Ein Räuber unter 40 % LP flieht heim und repariert dort (3 % je
Sekunde, 0,3 Gold je LP). Wer ein Piratenschiff versenkt, holt 60 % seiner
Ladung mit einem eigenen Schiff in 8 Feldern zurück - und muss mit Rache
rechnen: bis zu 2 Räuber greifen sein nächstes Kontor an (Plünderung 40 %,
die Beute geht an Bord).

Schutzgeld: 1000 Gold + 2 je Einwohner (höchstens 4000, auf 50 gerundet),
sofort und alle 10 Minuten, 30 Minuten lang. Eine verpasste Zahlung beendet
den Schutz (Erinnerung -10, die Piraten nehmen dich sofort wieder ins Ziel);
ein Angriff auf ihre Schiffe hebt ihn auf. Nachrichten kaufen (500 Gold)
zeigt 10 Minuten die ganze Flotte. Der Schwarze Markt wechselt alle 5
Minuten (zu 25 % geschlossen): bis zu drei Posten aus dem Lager (Beute, Rum,
Waffen; je bis 40, zu 90 % des Preises) und zu 50 % eine Schatzkarte für 600
Gold. Ein Schiff mit der Karte findet den Schatz (1500 bis 4500 Gold) in 3
Feldern um die Stelle, die das Piratenfenster nennt. Die Gefahrenstufe
(Ruhig, Wachsam, Gefährlich, Sehr gefährlich) folgt den Räubern auf See.

### Aufträge und Ereignisse der Fraktionen

Jede Fraktion bietet dir alle 5 bis 10 Minuten einen Auftrag an (über das
Missionssystem, höchstens einer zugleich): Fracht in den Hafen (20 / 40 / 60
einer gesuchten Ware, Lohn 1,4-facher Wert, im Hafenfenster abgeben),
Piratenjagd (1 bis 3 Piratenschiffe versenken, nur Völker) und in der
Taverne der Piraten Kaperaufträge (ein bestimmtes Handelsschiff eines
Rivalen oder Volkes versenken) und Fracht (Kanonen, Musketen, Werkzeug,
Wein, Bier). Lohn: Gold, Beziehung +10 je Schwierigkeit, Ruf.

Ereignisse alle 7 bis 14 Minuten je Fraktion: Hungersnot (5 min, Nahrung
dreifach verbraucht und 60 % teurer, dazu ein dringender Frachtauftrag mit
doppeltem Lohn), Epidemie (5 min halbe Produktion), Sturm im Hafen (2 min
kein Handel, die drei größten Bestände verlieren 20 %), reiche Ernte (5 min
eine Ware dreifach), Bitte um Hilfe (Piratenjagd); bei Piraten: Flotte
sammelt sich (3 min daheim, dann großer Überfall aller Räuber auf das Kontor
des reichsten Gegners), ein Kapitän bietet einen Schatz (Karte zum halben
Preis), Schutzgeldforderung (5 min; wer nicht zahlt: -10 und bevorzugtes
Ziel), Beutekonvoi (ein Räuber bringt bis zu 40 Beute zu einem Hehler am
Kartenrand, 81 % des Werts in Gold - abfangen lohnt sich), Piratenschiff
gesichtet (2 min ganze Flotte sichtbar), Meuterei (neuer Kapitän, alle
Erinnerungen halbiert, Schutz verfällt, ein Bündnis hält). Eine
Schutzgeldforderung geht nie an einen Verbündeten.

### Bedienung

Klick auf die Insel eines Volkes oder der Piraten öffnet ihr Hafenfenster
groß in der Mitte (Übersicht mit Bildnis, Beziehung und Gründen, Angebot und
Nachfrage mit Kaufen und Verkaufen, Aufträge bzw. Taverne, bei Piraten der
Schwarze Markt mit Flotte, Stand des Schutzgelds und Gefahrenstufe,
Nachrichten). Die Diplomatie (Geschenke, Forderungen,
Verträge, Hilfe, Kunst, Lieferverträge, Bündnis, Schutzgeld) steht nur im
Diplomatie-Fenster; das Hafenfenster verweist mit dem Knopf "Diplomatie"
dorthin und zeigt beim Handel und beim Schutzgeld nur den Stand.
Minimap und Weltkarte zeigen die Inseln mit Küste in der Fraktionsfarbe,
Stadt und Hafen.

## Speichern

Automatisch alle 2 Minuten und beim Verlassen der Seite, von Hand in drei
Spielstände (Format 6). Gespeichert werden Saat, Größe und Einstellungen (die
Welt entsteht daraus neu), Spieler mit Kasse, Buchhaltung, Forschung, Ruf und
KI-Zustand, Gebäude (mit LP, Stufe, Feuer), Straßen, gefällte Bäume,
Bestände, Karren, Schiffe (mit Besitzer und LP), Routen, Händler,
Diplomatie, Aufträge, Ereignisse, Zeit, Wetter, Arbeitskräfte und der
Zufallszustand, seit Format 3 auch Soldaten (an Land und an Bord), die
Ausbildung der Kasernen, die Wettläufe um Aufträge der Krone (Auftragsnummer
und Gewinner) und welche Aufträge jede KI schon angesehen hat - ein
geladenes Spiel läuft schrittgleich weiter. Spielstände der Formate 1
(erste Version: ein Spieler, keine KI; fehlende Waren werden ergänzt) und 2
(Rivalen, noch ohne Truppen: keine Soldaten, Kasernen ohne Auftrag,
Aufträge ohne Wettlauf, gesperrte Bauplätze der KI vergessen) werden beim
Laden umgewandelt; unbekannte Formate werden im Menü als "nicht ladbar"
angezeigt. Seit dem neuen Bildschirm tragen Gebäude den Vorrang ihrer Karren
(`priority`); Spielstände ohne ihn laden mit "kein Vorrang". Das Format
bleibt 3. Seit der Einführung speichert es auch ihren Stand (`tutorial`:
an/aus, Aufgabe, Spielzeit jeder erledigten Aufgabe) und die Einstellung
`guided`; ein Spielstand ohne sie lädt mit ausgeschalteter Einführung, also
mit der normalen Freischaltung. Das Format bleibt 3, weil das fehlende Feld
schon "aus" bedeutet. Seit der Logistik stehen gepflasterte Straßenfelder
zusätzlich in `paved` (`roads` enthält weiter alle Straßenfelder); ein
Spielstand ohne `paved` lädt mit einfachen Straßen. Karren alter Spielstände
fahren ihren gespeicherten Weg zu Ende. Das Format bleibt 3.

Format 4 (Flotten und Heer): Werften speichern ihre Warteschlange
(`yard.queue`), Kasernen eine Schlange von Einheitenarten statt einer Zahl
und ihren Pausenzustand (`drill.queue`, `drill.paused`), Einheiten ihre Art,
ihren Befehl (Angriff, Schiff angreifen, Patrouille, Position halten,
Rückzug) und ihre Formation, Schiffe die neuen Befehle (Angriff, Patrouille,
Eskorte, Fahrt mit der Flotte), dazu die Flotten (`fleets`). Spielstände der
Formate 1 bis 3 werden beim Laden umgewandelt: leere Warteschlangen, die Zahl
bestellter Soldaten wird zu so vielen Linieninfanteristen, jeder Soldat
Linieninfanterie ohne Befehl in Linie, keine Flotten, die Waren Musketen,
Kanonen und Dampfmaschinen beginnen bei 0 (auch beim Händler).

Format 5 (Fremde Völker und Piraten): dazu `factions` (je Fraktion Lager,
Gold, Lage, Schiffe mit Aufgabe, Verträge, Schutzgeld, Schwarzer Markt,
Nachrichten, gelehrte Kunst, laufende Ereignisse, Unterstützung,
Waffenstillstände, Schätze) und `settings.factions`, mit dem die Welt mit
ihren Heimatinseln entsteht. Format 4 wird umgewandelt: keine Fraktionen,
die alte Karte; neue Waren beginnen bei 0. Der Rivale "Haus Valdoro" heißt
seit der Republik Valdoria "Haus Varenne"; alte Spielstände laden mit dem
neuen Namen (die interne ID bleibt).

Format 6 (Katastrophen): dazu `hazards` (angekündigte und wütende
Katastrophen mit den überfluteten Feldern, Ruhezeiten je Insel, Besitzer und
Art, was jeden Spieler schon getroffen hat, Brennmaterial je Insel), je
Gebäude `blight` (Sekunden, die ein Hof nach Heuschrecken kahl bleibt) und in
den Einstellungen `eventsOff` und `culturesOff`. Format 5 wird umgewandelt:
alle Ereignisse und Völker an, keine Katastrophe, keine Schutzgebäude, der
erste Wurf frühestens nach 20 Minuten bzw. eine Minute nach dem Laden.

Piraten immer im Krieg (Format bleibt 6): Beim Laden jedes Formats wird
jede Beziehung einer Piratenbande zu einem Spieler zu Krieg, wenn kein
Bündnis besteht (im friedlichen Spiel zu Frieden); ein Waffenstillstand
oder Frieden mit Piraten aus einem alten Stand wird so zu Krieg, ihre
Waffenstillstände verfallen. Ein laufendes Schutzgeld bleibt, ein Bündnis
mit Piraten bleibt. Neu gespeichert wird je Bande `deeds` (je Spieler die
versenkten Schiffe anderer Gegner und die eroberten bzw. zerstörten Kontore
seit dem letzten gebrochenen Bündnis); fehlt es, beginnt es leer. Ein neuer
Stand ändert sich beim Laden nicht, darum bleibt das Format 6 und das Laden
schrittgleich.

Schwierigkeit (Format bleibt 6): Die Einstellungen tragen `difficulty`
(`easy`, `normal`, `hard`). Ein Spielstand ohne das Feld (jedes ältere
Format und jeder Stand von vorher) lädt als "Normal", also genau wie bisher;
darum braucht es kein neues Format.

## Spieleinstellungen

Beim neuen Spiel gewählt und in `GameSettings` gespeichert (also auch im
Spielstand):

- Kartengröße, Zahl der KI-Gegner, Schwierigkeit (siehe unten), friedliches
  Spiel, geführter Einstieg.
- "Ereignisse und Katastrophen" (`eventsOff`, die abgewählten): je ein
  Kästchen für Feuer, Seuche, Sturm auf See, Missernte, gute Ernte,
  Piratenüberfälle, Ereignisse der Völker und Piraten, Überschwemmung,
  Dürre, Heuschreckenplage, Tsunami und Schneesturm; Knöpfe "Alle" und
  "Keine"; Standard: alle an. Das friedliche Spiel schaltet Krieg und
  Piratenüberfälle weiter selbst ab: Das Kästchen "Piratenüberfälle" ist dann
  ausgegraut mit Hinweis, ebenso ohne Piraten.
- "Völker" (`culturesOff`, die abgewählten): Qasirah, Shogunara, Valdoria,
  Skeld und die Piraten. Ein Kästchen gilt für beide Banden (Krähenfels und
  auf großer Karte das Schwarzriff), weil sie dieselbe Rolle spielen.
  Abgewählte bekommen keine Insel; die übrigen werden aus derselben Saat
  gesetzt, als gäbe es die abgewählten nicht. Dieselbe Saat und Auswahl
  ergeben dieselbe Welt, und die Spieler haben immer gleich viele Inseln
  (die Fraktionsinseln kommen oben drauf: klein 8, mittel 13, groß 20). Ohne
  Piraten gibt es keine Überfälle, keinen Schwarzen Markt, keine Taverne und
  auch keine Piraten vom Kartenrand.
- Das Menü merkt sich die letzte Auswahl für das nächste Spiel (gespeicherte
  Einstellung `imperavis.newGame`). Beide Abschnitte sind zu Beginn
  eingeklappt und zeigen "n von m".
- Im laufenden Spiel zeigt das Pausenmenü unter "In diesem Spiel", welche
  Ereignisse an sind und welche Völker es gibt (nur Anzeige).

## Schwierigkeit

Beim neuen Spiel wählt man "Schwierigkeit: Leicht / Normal / Schwer" (drei
Knöpfe unter den KI-Gegnern, darunter eine Zeile, was die Stufe bewirkt).
Standard ist Normal; das Menü merkt sich die letzte Wahl (`difficulty` in
`imperavis.newGame`, ein älterer gemerkter Wert ohne sie gilt als Normal).
Die Stufe steht in `GameSettings.difficulty` und damit im Spielstand. Das
Pausenmenü zeigt sie unter "In diesem Spiel", die Liste der Spielstände im
Hauptmenü hinter dem Datum, die Ladeknöpfe im Pausenmenü im Tooltip.

Alle Faktoren stehen in `engine/difficulty-data.ts` (`DIFFICULTY`) und
werden nur über `difficultyOf(game)` gelesen. "Normal" setzt jeden Faktor
neutral (1 bzw. 0) und verhält sich schrittgleich wie das Spiel vor den
Stufen.

| Faktor (`DIFFICULTY`) | gilt für           | Wirkung                                                                                                                                                                                                              | Leicht                                               | Normal    | Schwer              |
| --------------------- | ------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------- | --------- | ------------------- |
| `startGold`           | Mensch             | Startgold (3000)                                                                                                                                                                                                     | x1,5 (4500)                                          | x1 (3000) | x0,7 (2100)         |
| `startCargo`          | Mensch             | jede Ware der ersten Schiffsladung (gerundet)                                                                                                                                                                        | x1,25 (63 Bretter, 18 Werkzeug, 30 Fisch, 13 Ziegel) | x1        | x1                  |
| `aiThink`             | Rivalen            | Zeit zwischen zwei Wirtschaftsgedanken (3 s)                                                                                                                                                                         | x1,25 (3,75 s)                                       | x1        | x0,8 (2,4 s)        |
| `aiBudget`            | Rivalen            | Bauplatzprüfungen (1500) und Straßensuchen (6) je Gedanke                                                                                                                                                            | x0,8 (1200 / 5)                                      | x1        | x1,25 (1875 / 8)    |
| `aiGrowth`            | Rivalen            | Häuser je Insel des Charakters; Einwohner und Gold vor der nächsten Insel geteilt                                                                                                                                    | x0,8                                                 | x1        | x1,25               |
| `aiIslands`           | Rivalen            | Inseln, die der Charakter höchstens will (mindestens 1)                                                                                                                                                              | -1                                                   | 0         | +1                  |
| `aiWork`              | Rivalen            | Arbeitstempo ihrer Betriebe (ein Bonus bzw. Malus, den nur die KI hat)                                                                                                                                               | x0,8                                                 | x1        | x1,25               |
| `aiUpkeep`            | Rivalen            | Unterhalt der Gebäude, zusätzlich zum Charakter (Expansionist 75 %)                                                                                                                                                  | x1,15                                                | x1        | x0,85               |
| `aiWarLine`           | Rivalen gegen dich | Punkte auf die Meinung, unter der sie dir den Krieg erklären (-60, Kriegerisch -25) und unter der sie Truppen auf ihrem Land mit Krieg beantworten                                                                   | -15                                                  | 0         | +10                 |
| `aiWarRatio`          | Rivalen gegen dich | Stärke, die sie vor einem Krieg über dir wollen (1,3, Kriegerisch 1)                                                                                                                                                 | x1,15                                                | x1        | x0,85               |
| `raidGap`             | Piraten            | Pause der Bande nach dem Auslaufen eines Räubers (120 s) und Ruhe eines Opfers nach einem Überfall (360 s); Piraten vom Kartenrand alter Welten: Wahrscheinlichkeit geteilt                                          | x1,8                                                 | x1        | x0,6                |
| `raiders`             | Piraten            | Räuber gleichzeitig unterwegs, zu Beginn (1) und höchstens (3), mindestens 1                                                                                                                                         | -1 (1, höchstens 2)                                  | 0         | +1 (2, höchstens 4) |
| `pirateBuild`         | Piraten            | Pause zwischen zwei neuen Schiffen (300 s) und ihr Goldpreis                                                                                                                                                         | x1,6                                                 | x1        | x0,6                |
| `hazardChance`        | alle               | Wahrscheinlichkeit je Wurf von Katastrophen, Feuer und Seuche                                                                                                                                                        | x0,5                                                 | x1        | x1,5                |
| `hazardImpact`        | alle               | Dauer der Katastrophen; Flutschaden, Tsunami-Schaden (auch Lager und Schiffe am Kai), Heuschrecken (Anteil der Höfe, gefressene Vorräte), Feuerschaden; der Ertrag bei Dürre (35 %) wird hoch diesen Faktor genommen | x0,7 (Dürre 48 %)                                    | x1        | x1,3 (Dürre 26 %)   |
| `buyPrice`            | Mensch             | was du beim freien Händler und bei den Völkern (Hafen, Routen, Lieferverträge) zahlst                                                                                                                                | x0,9                                                 | x1        | x1,1                |
| `sellPrice`           | Mensch             | was sie dir zahlen                                                                                                                                                                                                   | x1,1                                                 | x1        | x0,9                |

- Was den Menschen betrifft, gilt nur für ihn; was die Rivalen betrifft,
  nur für sie. Die KI bekommt keine verdeckten Vorteile: `aiWork`,
  `aiUpkeep` und `aiThink`/`aiBudget` sind die einzigen Abweichungen von
  den Regeln des Spielers, alle stehen in der Tabelle.
- Piraten und Katastrophen treffen alle Inseln gleich, auch die der
  Rivalen und Völker.
- Die Schonzeit der Katastrophen (frühestens nach 20 Minuten, nie während
  des geführten Einstiegs) und alle Ruhezeiten gelten auf jeder Stufe.
- Nicht von der Stufe berührt: die Startausstattung der Rivalen (3000 Gold
  und dieselbe Ladung), der Schwarze Markt der Piraten, Schutzgeld,
  gute Ernte und Missernte, Sturm auf See, die Bestwerte der Statistik.
- Abgestimmt mit einem Bot (die KI des Händlers spielt den Menschen),
  mittlere Karte, drei Rivalen, alle Völker, 120 Minuten, Saaten 12345, 777
  und 4242 (Mittelwerte; die Kriege zählen nur Erklärungen der Rivalen an
  den Menschen):

  | Stufe  | Bot Gold am Ende | Bot Gold am tiefsten | Bot Einwohner | Rivalen Einwohner | Kriege gegen den Bot | Minuten im Krieg | Piratenschiffe gebaut | Räuber-Minuten auf See | Überfälle (alle) | Katastrophen (alle) | Feuer (alle) |
  | ------ | ---------------- | -------------------- | ------------- | ----------------- | -------------------- | ---------------- | --------------------- | ---------------------- | ---------------- | ------------------- | ------------ |
  | Leicht | 30769            | 539                  | 826           | 1063              | 0                    | 19               | 9                     | 63                     | 6                | 17                  | 28           |
  | Normal | 16283            | 239                  | 669           | 1205              | 3                    | 24               | 12                    | 100                    | 5                | 25                  | 51           |
  | Schwer | 14127            | 41                   | 458           | 1557              | 6                    | 68               | 17                    | 102                    | 7                | 31                  | 61           |

## Bedienung

- Aufteilung: oben die Ressourcenleiste, links die Inselübersicht
  (einklappbar), rechts Meldungen, das Objektfenster und die Minimap, unten
  die Bauleiste, dazwischen Baufenster, Verwaltung und Weltkarte. Die Felder
  liegen in einem Raster und können einander nicht verdecken. Ab 2200 x 1250
  Pixeln wächst alles um 30 %, ab 3000 x 1700 um 65 %, ab 3600 x 2000 auf das
  Doppelte (`--imp-scale`). Unter 768 Pixeln Breite gibt es eine Spalte, und
  nur ein Fenster ist offen.
- Ressourcenleiste: Spieler mit Wappen, Insel im Blick und Entwicklung (die
  höchste erreichte Schicht); Gold mit Einnahmen und Ausgaben der letzten
  Minute und Trend; Einwohner je Schicht; zehn Waren (je Bildschirmbreite
  weniger) mit Bestand und Saldo je Minute, alle 27 im aufklappbaren
  Warenfenster; mittlere Zufriedenheit; Datum, Wetter, Forschung, Krieg;
  ganz rechts das Tempo Pause, 1x, 2x, 3x (Plus/Minus; mit Cheat dazu 10x und 100x, die
  je Bild höchstens 12 ms rechnen). Ein gespeichertes Starttempo 4 (alte
  Version) gilt als ungültig und wird 1.
- Produktion und Verbrauch je Minute sind aus dem Spiel abgeleitet: Betriebe
  mit Auslastung x Geschwindigkeit x Menge je Durchgang, Bewohner in
  Marktreichweite mit dem Bedarf ihrer Schicht.
- Bauleiste: Wohngebäude, Landwirtschaft (Höfe, Holzfäller, Fischer),
  Produktion (Gruben, Minen, Werkstätten), Öffentliche Gebäude,
  Infrastruktur (Straße, Lagerhaus), Hafen (Kontor, Werft), Militär,
  Dekoration; dazu Abriss und Verwaltung. Eine Kategorie öffnet das
  Baufenster mit Suche und einer Kachel je Gebäude (Kosten, Unterhalt,
  Arbeitskräfte, Freischaltung). Mit Einführung zeigen Kacheln und
  Kategorien zusätzlich "empfohlen" und "gesperrt bis ..." (siehe
  "Einführung").
- Neues Spiel: Kartengröße, Rivalen, friedliches Spiel und "Geführter
  Einstieg" (Standard an), dazu die einklappbaren Abschnitte "Ereignisse und
  Katastrophen" und "Völker" (siehe "Spieleinstellungen").
- Baumodus: Vorschau grün (geht, Straße am Rand), gelb ("Ohne Straße:
  Transport langsamer") oder rot (echtes Bauverbot, mit Grund). Im Bau-,
  Straßen-, Pflaster- und Versetzmodus schwebt über jedem eigenen Betrieb ein
  Punkt in der Farbe seiner Anbindung (grün, gelb, rot). Linksklick setzt und bleibt im
  Baumodus (außer beim Kontor), Rechtsklick und Esc brechen ab, R und
  Umschalt plus Mausrad drehen, das Mausrad allein zoomt.
- Maus: Linksklick wählt aus, ein Klick ins Leere hebt die Auswahl auf,
  Umschalt plus Klick ergänzt sie. Linke Taste ziehen: Auswahlrechteck für
  eigene Schiffe und Soldaten an Land, nie für Gebäude. Rechtsklick ohne
  Ziehen: Befehl an die gewählten Einheiten (oder Abbruch eines Werkzeugs).
  Mittlere Taste ziehen: Karte verschieben. Rechte Taste ziehen: drehen und
  neigen (Neigung 0,42 bis 1,38 rad über dem Horizont). Mausrad: weich zum
  Mauszeiger zoomen, mit Strg 2,5-mal so schnell; über scrollbaren Fenstern
  scrollt es das Fenster. Klick und Ziehen trennt eine Schwelle von 6
  Pixeln; ein Klick bewegt die Kamera nie.
- Befehle: Rechtsklick auf Wasser schickt alle gewählten Schiffe hin, in
  einer Formation mit 2,5 Feldern Abstand (wo dort kein Wasser ist, zum
  Zielpunkt selbst); sind genau die Schiffe einer Flotte gewählt, fährt die
  Flotte gemeinsam. Auf ein eigenes Kontor oder Hafengebäude: anlegen. Auf ein
  feindliches Schiff oder Gebäude: die bewaffneten Schiffe greifen an
  (`shipAttack`), gewählte Einheiten ebenso (`unitAttack`), auch auf eine
  feindliche Einheit. Auf Land ohne Wasser in 3 Feldern: abgelehnt mit
  Hinweis. Soldaten an Land marschieren auf einen Rechtsklick über das
  Land ihrer Insel (Befehl `march` mit Spieler-ID, Wegsuche wie beim
  Sturm, Aufstellung um den Zielpunkt); auf Wasser oder eine andere Insel
  wird abgelehnt.
- Hervorhebung: Gebäude unter der Maus bekommen einen Umriss, Schiffe und
  Soldaten einen weißen Ring, gewählte Einheiten goldene Ringe. Nach 0,45 s
  Ruhe zeigt ein Tooltip Name, Besitzer und Zustand; kurzes Verrutschen
  (bis 0,22 s) lässt ihn stehen.
- Kamera: WASD oder Pfeile bewegen, Q/E drehen, der Rand der Spielfläche
  (18 Pixel) bewegt ebenfalls, wenn die Maus über der Karte und nicht über
  einem Fenster steht und das Fenster den Fokus hat (in den Einstellungen
  abschaltbar). Tempo je Sekunde 0,9 x Abstand, gedämpft und unabhängig
  von der Bildrate; die Kamera bleibt 1,5 Felder über dem Gelände und das
  Ziel in der Karte.
- Tasten: B Baumenü (letzte Kategorie), R drehen, T Straße, X/Entf Abriss,
  Tab und Umschalt plus Tab nächste oder vorige eigene Einheit (Schiffe,
  dann Soldaten an Land; die Kamera fährt hin), 1 bis 9 Steuergruppen:
  Strg plus Zahl speichert die gewählten Einheiten, die Zahl wählt sie,
  zweimal innerhalb von 0,4 s fährt die Kamera hin. Plus und Minus (auch
  am Ziffernblock) wechseln das Tempo, die Leertaste pausiert und setzt das
  letzte Tempo fort. Esc in Stufen: Werkzeug abbrechen, offenes Fenster
  schließen, Auswahl aufheben, Pausenmenü. Keine Taste wirkt in
  Eingabefeldern, in einem offenen Dialog oder mit Strg, Alt oder Meta -
  außer Strg plus Zahl. Auswahl und Gruppen werden nicht gespeichert.
- Objektfenster: Registerkarten nur, wo es etwas zu zeigen gibt (Übersicht,
  Produktion, Logistik, Lagerbestand, Arbeitskräfte oder Bewohner, Finanzen,
  Erweiterungen; bei Schiffen Ladung, Route, Truppen); unten Verbessern,
  Reparieren, Produktion stoppen, Versetzen, Abreißen. Bei Betrieben steht die
  Ampel der Anbindung vor dem Zustand; "Logistik" zeigt Anbindung, aktuelle
  Produktion, lokalen Bestand (Ein- und Ausgang), Transport (Kein
  Transportweg, Puffer voll - wartet auf Karren, Karren unterwegs, Wartet auf
  Karren, Nichts abzuholen), Entfernung zum Lager (Felder und Sekunden je
  Fahrt), Transporttempo (Felder je Sekunde und Anteil am Straßentempo) und
  ob eine Straße am Gebäude liegt.
- Verwaltung: ein Fenster mit Finanzen, Bevölkerung, Produktion (je Ware
  Betriebe, Menge, Verbrauch, Saldo und Engpässe; darunter "Transport": je
  Ware, wie viele Betriebe nur übers Gelände oder gar nicht erreicht werden
  und wie viele Waren in den Betrieben auf Karren warten), Lager, Inseln (mit
  Miniatur, Wappen, Versorgung und Warenproduktion; Klick fährt hin),
  Schiffe (mit Bild, LP, Tempo, Aufgabe, Flotte und Position), Militär,
  Handelsrouten, Handel, Diplomatie (Rivalen, Völker und Piraten),
  Aufträge, Forschung.
- Minimap und Weltkarte: aus den Weltdaten gezeichnet (Gelände, Küsten in
  Besitzerfarbe, Gebäude, Kontore, Schiffe, Kamerafeld; die Weltkarte dazu
  Namen, Handelsrouten, Vorkommen und Fruchtbarkeit). Einen Nebel gibt es
  nicht, die ganze Welt ist bekannt. Ein Klick fährt die Kamera hin.
- Meldungen: Hinweise verschwinden nach 6 s, Warnungen nach 10 s; Krieg mit
  dir, Eroberung, leere Kasse, Angriff auf ein Kontor oder gelandete Feinde
  und gesunkene Schiffe bleiben bis zur Bestätigung. Aus dem Zustand
  abgeleitet kommen dazu: Lager voll, Route blockiert, Produktion
  eingestellt (keine Arbeiter, kein Standort, kein Transportweg), Gebäude fertig,
  Bevölkerung gewachsen (je 100), Einwohner unzufrieden (unter 40 %).
- Tooltips: an allen Symbolen und Knöpfen nach 0,35 s, mit Überschrift.

## Cheat-Modus

- Knopf "Cheat-Modus" in der Kopfzeile, im Hauptmenü und im Spiel.
- An: Die Kasse des Menschen steht fest auf 9 999 999 Gold (angezeigt als
  unendlich), und jede Ware auf jeder eigenen Insel wird in jedem Takt bis
  zur Lagergrenze aufgefüllt. Beim Einschalten sind alle Forschungen sofort
  erledigt (eine laufende endet). Solange er an ist, ist jedes Gebäude ohne
  Voraussetzung baubar: Einwohner, Schicht, Forschung und die Sperre der
  Einführung entfallen (`buildOpen` und `guidedHolds` in `engine/cheat.ts`);
  die Einführung selbst läuft weiter. Alle fertigen Wohnhäuser des Menschen
  stehen am Ende jedes Takts auf der höchsten Schicht (wohlhabende Bürger),
  voll bewohnt, mit 100 % Zufriedenheit und allen Bedürfnissen erfüllt - neu
  gesetzte ebenso, sobald sie fertig sind (`fillIfCheating`). KI-Spieler
  bekommen nichts.
- Aus: Das Gold von vor dem Einschalten kommt zurück; die Waren bleiben,
  soweit die Lager sie fassen. Die Forschung bleibt erledigt, gebaute
  Gebäude bleiben stehen, die Freischaltung folgt wieder den normalen Regeln
  (was die Einwohner des Cheats erreicht haben, bleibt nach diesen Regeln
  frei), und die Häuser leben normal weiter: Fehlt ihnen etwas, steigen sie
  ab.
- Im Hauptmenü ist der Startwert der Welt nur bei eingeschaltetem Cheat zu
  sehen und einzugeben; sonst wird er für jedes neue Spiel gewürfelt. Ein
  neues Spiel startet mit Cheat, wenn er im Menü an ist.
- Der Zustand wird mitgespeichert. Eine Partie, in der der Cheat einmal an
  war, zählt Spielzeit, aber keine Bestwerte für die Statistik.

## Mehrspieler-Architektur

Die Simulation ist deterministisch (fester Takt, Zufall nur aus dem
Zufallszustand des Spiels). Jede Aktion ist ein Befehl als Datenobjekt mit
der Spieler-ID (`PlayerCommand`); die KI benutzt dieselben Befehle wie der
Mensch, auch die neuen: `train` (Einheiten ausbilden, mit Art),
`cancelTraining`, `pauseTraining`, `embark` (einschiffen), `land`
(anlanden), `march`, `unitAttack`, `unitPatrol`, `unitHold`, `unitRetreat`,
`formation`, `buildShip`, `cancelShip`, `shipAttack`, `shipPatrol`,
`shipEscort`, `fleetCreate`, `fleetMove`, `fleetDisband` und
`missionAccept` für den Wettlauf um einen Auftrag eines anderen Spielers. Ein Server könnte die Befehle aller
Spieler je Takt sammeln und an alle verteilen. Einen Mehrspieler-Knopf gibt
es nicht. Was nur der Beschleunigung dient (Seekosten- und
Wasserflächen-Tabellen, Puffer der Straßensuche), hängt allein von der Welt
ab und ändert kein Ergebnis.

## Balance

Geprüft mit einer Headless-Simulation der Engine (nicht im Repo), immer mit
drei KI-Spielern über 120 Spielminuten. Der aktive Bot für den Menschen
gründet das Kontor und baut nacheinander Holzfäller, Sägewerk, Fischer,
Markt, Kapelle, Lagerhäuser und Häuser, dann die Stoff-, Ziegel-, Brot-,
Bier- und Kleidungsketten; er verteidigt sich nicht. Die KI-Spieler spielen
in allen Läufen selbst.

Stand nach 120 Minuten (Einwohner, höchste Schicht, Inseln, erforschte
Felder):

| Lauf (Saat, Karte) | Mensch             | Händler (Varenne)                   | Kriegerisch (Morvaine)              | Expansionist (Elsenreich)           |
| ------------------ | ------------------ | ----------------------------------- | ----------------------------------- | ----------------------------------- |
| 12345, mittel      | 274, Handwerker, 1 | 509, Handwerker, 3 Inseln, 5 Felder | 328, Handwerker, 1 Insel, 0         | 235, Arbeiter, 2 Inseln, 0          |
| 99, mittel         | 336, Kaufleute, 1  | 733, Handwerker, 2 Inseln, 7 Felder | 461, Arbeiter, 2 Inseln, 0          | 492, Handwerker, 4 Inseln, 4 Felder |
| 2024, mittel       | 360, Kaufleute, 1  | 660, Handwerker, 2 Inseln, 6 Felder | 342, Arbeiter, 1 Insel, 0           | 898, Handwerker, 4 Inseln, 1 Feld   |
| 777, klein         | erobert            | 436, Handwerker, 2 Inseln, 0        | 620, Handwerker, 3 Inseln, 5 Felder | 182, Bauern, 1 Insel, 0             |
| 4242, groß         | erobert            | 675, Kaufleute (414), 2 Inseln, 7   | 724, Handwerker, 3 Inseln, 3 Felder | 770, Handwerker, 4 Inseln, 3 Felder |

- Forschung: Der Händler baut zwei Gelehrtenhäuser und forscht in 4 von 5
  Läufen 5 bis 7 Felder (Glas, Ingenieurwesen, Fruchtwechsel, Zunftwesen,
  Tabak, Optik, Gehobene Gesellschaft); in der vorigen Runde waren es 0 bis 2. Kriegerische und Expansionisten kommen auf 0 bis 5 Felder, je nachdem,
  ob ihre Insel Lehm hat und sie genug Handwerker für das Gelehrtenhaus
  zusammenbekommen. Ziegel sind der Engpass: ohne Lehm auf der Heimat kommen
  sie über eine Lehm-Kolonie, den Händler (bis 60 auf Lager) und Käufe bei
  anderen KIs.
- Aufstieg: Die KI erreicht Kaufleute (bis 414 auf der großen Karte),
  Ingenieure (Schicht 5) aber in keinem Lauf, auch nicht nach 180 Minuten
  mit allen Forschungen: es fehlt immer eine Ware der Kaufleute (meist Wein
  ohne Trauben-Insel, sonst Brot oder das Badehaus), und ein Haus steigt nur
  voll bewohnt mit jedem Bedürfnis über 75 % auf.
- Diplomatie zwischen den KIs je Lauf (Saaten 12345 / 99 / 2024 / 777 /
  4242): Kriege 12 / 1 / 3 / 18 / 15 (davon über Bündnisse 5 / 0 / 1 / 7 /
  7), Friedensschlüsse 12 / 1 / 3 / 16 / 13, Handelsabkommen 2 / 3 / 3 / 1 /
  2, Pakte 1 / 0 / 1 / 1 / 1, Bündnisse 1 / 0 / 1 / 1 / 1, angenommene
  Geschenke 21 / 58 / 21 / 5 / 5, erfüllte Forderungen 4 / 23 / 10 / 0 / 3
  (abgelehnt 5 / 2 / 2 / 5 / 3), Warengeschäfte angenommen 8 / 24 / 28 / 27
  / 4 (abgelehnt 56 / 3 / 2 / 46 / 3). Von 49 Kriegen sind 45 nach 120
  Minuten wieder beendet.
- Landtruppen: Im Krieg bilden die KIs 4 Soldaten aus, die kriegerische bis
  10, und landen (4 und 8 Landungen auf der kleinen und der großen Karte);
  die Wache des Kontors und Türme schlagen schwache Landungen zurück, eine
  voller Schoner (6) nimmt ein unverteidigtes Kontor.
- Aufträge der Krone: Die KIs nehmen je Lauf 1 bis 24 an und erfüllen 0
  bis 10, der Mensch verliert dadurch bis zu 4 Aufträge. Ist der Mensch
  erobert, bietet die Krone keine Aufträge mehr an (Saat 4242: nur 1).
- Expansionist: geht nicht mehr pleite (kein Lauf mit Schulden), spart je
  nach Heimatinsel 2 bis 79 % der Zeit (Kriegerisch 17 bis 78 %, Händler 4
  bis 28 %) und hält am Ende die meisten Inseln (4 in 3 von 5 Läufen);
  seine erste Kolonie gründet er nach 43 bis 64 Minuten, der Händler nach 27
  bis 54. Auf der winzigen Heimat von Saat 12345 (376 Felder) bleibt er
  schwach.
- Laufzeit je Takt (0,1 Spielsekunden) auf der großen Karte mit drei KI,
  allein gemessen: im Mittel 0,21 bis 0,29 ms, Maximum 6,4 / 9,4 / 11,1 ms
  (Saaten 8 / 31337 / 4242), kein Takt über 16 ms von 3 x 72 000. Vorher
  31 bis 40 ms: die Seekostentabelle (31 ms) entstand im ersten Seeweg,
  jetzt beim Erzeugen des Spiels; Seewege zu Wasser ohne Verbindung enden
  sofort über eine Tabelle der Wasserflächen; die KI aktualisiert nach einem
  Bau nur die belegten Felder statt alles neu zu berechnen; die Zuordnung
  der Betriebe zu Lagern sucht in wiederverwendeten Puffern.
- Bildrate (Chromium ohne vsync-Grenze, `--disable-gpu-vsync
--disable-frame-rate-limit`, Saat 4242 groß nach 60 Minuten, 317 Gebäude):
  nah 931 Bilder/s, 0,86 ms CPU je Bild, 208 000 Dreiecke, 73 Draw Calls;
  mittel 900 / 0,90 ms / 250 000 / 102; fern 717 / 1,16 ms / 311 000 / 182.
  Ein Versuch mit Blöcken für Gebäude ab 75 Feldern Entfernung sparte 22 bis
  28 % Dreiecke, brachte aber keine Bilder mehr (nah 951, fern 646, mehr
  Draw Calls) und wurde wieder entfernt.
- Speichern und Laden: In allen Läufen ergeben ein gespeicherter und ein
  wieder geladener Stand nach 600 weiteren Schritten denselben Spielstand
  (Truppen, Wettläufe, KI und Diplomatie eingeschlossen). Spielstände der
  Formate 1 und 2 werden geladen, zweimal geladen laufen sie 600 Schritte
  gleich, und als Format 3 gespeichert und wieder geladen ebenso.

### Logistik (Straße als Vorteil)

Dieselbe Stadt (Saat 12345 mittel, Kontor, 3 Holzfäller und 2 Sägewerke 7
bis 12 Felder vom Kontor, volle Belegschaft, 10 Spielminuten, 2 Karren):

| Variante                | Holz erzeugt | Bretter erzeugt | Bretter abgeholt | Fahrt Holz holen | Holz bringen | Bretter holen | Puffer voll |
| ----------------------- | ------------ | --------------- | ---------------- | ---------------- | ------------ | ------------- | ----------- |
| ohne Straße (Gelände)   | 70           | 44              | 36               | 37,4 s           | 22,2 s       | 21,2 s        | 15 %        |
| einfache Straße (32 F.) | 76           | 69              | 65               | 12,1 s           | 9,7 s        | 9,4 s         | 0 %         |
| gepflasterte Straße     | 76           | 71              | 68               | 8,4 s            | 6,7 s        | 6,2 s         | 0 %         |

Ohne Straße läuft die Kette, aber gut ein Drittel langsamer, weil die zwei
Karren lange unterwegs sind; mit Straße hängt der Durchsatz an den
Holzfällern, gepflastert sind die Fahrten noch ein Drittel kürzer. Die
Einführung lässt sich ganz ohne Straße durchspielen (21,5 statt 14,1
Minuten).

KI vorher und nachher (gleiches Skript, 120 Spielminuten, drei KI, Summe
der KI-Einwohner): mit Krieg wie in der Tabelle oben 12345: 1072 -> 1385
(Kriegerisch erobert alle), 99: 1686 -> 1258, 2024: 1900 -> 1984, 777:
1238 -> 971, 4242: 2169 -> 2232. Weil Kriege den Verlauf stark streuen, auch
friedlich auf acht Karten: 12345 1060 -> 1142, 99 1455 -> 1094, 2024 1724 ->
1600, 777 925 -> 996, 4242 2012 -> 1915, 31337 (groß) 1622 -> 1845, 8 919 ->
1001, 555 (klein) 869 -> 922; zusammen 10 586 -> 10 515 (-0,7 %, innerhalb
der Streuung einzelner Läufe von +-25 %). Der Bot des Menschen: 2452 -> 2399. Die KI baut weiter Straßen zu jedem Betrieb.

Laufzeit je Takt nach der Änderung (große Karte, drei KI, 120 Minuten, allein
gemessen): 4242 im Mittel 0,33 ms, höchstens 8,5 ms (vorher 17,3 ms); Saat 8
0,26 ms, höchstens 10,0 ms (vorher 7,6 ms); kein Takt über 16 ms. Eine
vollständige Wegsuche aller Inseln dauert auf der mittleren Karte nach 60
Minuten höchstens 5,2 ms; im Spiel wird nur die geänderte Insel gesucht,
und in 120 Prüfungen ergab das immer dieselben Wege wie eine volle Suche.

### Flotte und Heer

Gleiches Skript wie oben (120 Spielminuten, drei KI, Summe der
KI-Einwohner), vor und nach der Runde "Flotte und Heer": mit Krieg 12345
1385 -> 1079, 99 1258 -> 1363, 2024 1984 -> 2002, 777 971 -> 1194, 4242
2232 -> 2070 (zusammen 7830 -> 7708, -1,6 %); friedlich 12345 1142 -> 1100,
99 1094 -> 1171, 4242 1915 -> 2025, 31337 1479 -> 1504 (5630 -> 5800,
+3,0 %); alle zusammen 13 460 -> 13 508 (+0,4 %, innerhalb der Streuung).

Was die KI nach 120 Minuten unter Waffen hat (Beispiele): Saat 2024,
Kriegerisch 4 Linieninfanterie, 1 Grenadier, 5 Musketenschützen und 4
Kanonenboote; Saat 777, Händler 4 Aufklärer, Kriegerisch 5 Linie, 2
Musketen, 3 Grenadiere; Saat 8 (groß), Händler 2 Linie, 1 Musketen, 1
Aufklärer, Kriegerisch 4 Linie, 3 Grenadiere, 3 Musketen, 4 Kanonenboote und
einen Klipper, Expansionist 3 Miliz und 1 Linie.

Laufzeit je Takt (große Karte, drei KI, 120 Minuten, allein gemessen): Saat
4242 im Mittel 0,31 ms, höchstens 11,0 ms; Saat 8 0,30 ms, höchstens 9,0 ms.
Belastungsprobe: Saat 4242 groß, 25 Minuten Aufbau, dann alle mit allen im
Krieg, 240 Einheiten aller Arten gelandet und daheim, 24 Kriegsschiffe der
vier Kriegstypen vor feindlichen Inseln, 2 Minuten Kampf: im Mittel 0,68
ms, höchstens 14,2 ms, kein Takt über 16 ms.
