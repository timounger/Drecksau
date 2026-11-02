# Weihnachtsmann & Co. KG: Was umgesetzt ist

Spiel nach der Zeichentrickserie _Weihnachtsmann & Co. KG_ (1997). Diese Seite
hält fest, **was umgesetzt ist und was bewusst fehlt** - damit beim nächsten
Ausbau niemand raten muss.

Aus der Serie übernommen sind nur die **Figuren und ihre Merkmale** (Namen,
Farben, Bärte, Mützen, Ohren, Schal, rote Nase, Fähigkeiten laut Vorgabe). Alle
Grafiken sind eigene Pixelgrafik, nichts ist nachgezeichnet oder eingebettet.

## Stufe 1 (umgesetzt)

- **Eine Karte**, zunächst als Platzhalter (in Stufe 2 ersetzt, siehe unten).
- **Acht Figuren** gleichzeitig auf der Karte. Eine steuert der Spieler (gelber
  Pfeil über dem Kopf, goldener Ring am Boden, hervorgehoben in der Leiste),
  die anderen **spazieren selbst**: ausruhen (1,2 bis 4,5 s), dann ein Ziel 20
  bis 90 Pixel entfernt mit freiem Weg, im Schlendertempo; bleiben sie hängen,
  geben sie auf und suchen neu. Ab und zu sagen sie etwas.
- **Wechsel jederzeit:** Leiste (Klick), 1-8, Tab, Q / E, Klick auf die Figur,
  Gamepad-Schultertasten, auf dem Handy der Knopf Nächste, ein Porträt oder
  die Figur im Bild antippen. Die Kamera gleitet
  zur neuen Figur, die alte ruht kurz und spaziert dann von ihrem Platz los.
- **Abstand:** Figuren am Boden schieben sich sanft auseinander; die gesteuerte
  weicht am wenigsten, dem Bären weichen alle.
- **Gelände:** Schnee und Weg frei; **Eis** begehbar, aber rutschig (wer wenig
  Halt hat, kommt schwer in Gang und schlittert nach); **Wasser**, Bäume, Zäune,
  Felsen, Schneewehen, Häuser und Gegenstände sperren.
- **Speichern** in localStorage (`weihnachtsmann/save`): gewählte Figur,
  Positionen, Blickrichtung, Jordis Tier, wer fliegt (seit Stufe 2 auch der
  Ort, Version 2).
- **Statistik:** nur Spielzeit.

## Stufe 2: die Karte (umgesetzt)

Vorgabe des Auftraggebers: Das Haus des Weihnachtsmanns ist die
Weihnachtswerkstatt, eine schneebedeckte Glaskuppel, die man betreten kann;
darin steht eine Spielzeugmaschine. Draußen ist ein Tannenbaum aufgemalt, auf
dem der Weihnachtsschlitten startet. Grantelbart gehört ein normales Haus mit
Schrägdach und mehreren Ecken, ebenfalls begehbar, mit viel Musik,
E-Gitarren und eher gruselig eingerichtet.

- **Karte draußen** 60 x 40 Felder (`engine/map-data.ts`): oben links die
  **Glaskuppel** (10 x 4 Felder, runder Grundriss; Glasscheiben mit
  Rahmen, Spiegelungen, Schneehaube, Schnee auf den Streben, warmes Licht
  und Umrisse der Maschine innen, Tür mit Kranz und Laternen). Ein Weg führt
  zur großen Ost-West-Straße. In der Mitte der **aufgemalte Tannenbaum**
  (8 x 10 Felder) auf einer freigeräumten Fläche: grüne Farbe mit Pinselstrichen,
  Girlanden, Kugeln, Stern, gestrichelter Startkreis und Pfeile, Schnee
  darübergestäubt; der **Schlitten** steht darauf. Oben rechts **Grantelbarts
  Haus**: L-förmig, steile Dächer, Gaube, Giebelflügel, schiefer Schornstein
  mit Rauch, lila und rot glimmende Fenster, schiefes Schild, Krähen, tote
  Büsche, kaputter Zaun. Dazu der gefrorene Teich mit Wasserloch (unten
  links), das Rentiergehege mit Tor (unten rechts), Laternen an den Wegen,
  Schneemänner, Geschenke, Felsen, Schneewehen, Wäldchen und Wald am Rand.
- **Werkstatt** (24 x 15 Felder, `engine/interior-data.ts`): runder
  Holzboden mit Messingring unter der Kuppel, ringsum Glas mit Streben,
  Sternenhimmel und Schneehügeln, Girlande mit Lichtern, runder Teppich. In
  der Mitte hinten die **Spielzeugmaschine**: Kessel, Trichter, Rohre,
  drehende Zahnräder, blinkende Lämpchen, Zifferblatt, Dampf, ein Förderband,
  auf dem Teddy, Eisenbahn, Puppe, Ball und Geschenk in einen Sack fallen.
  Dazu zwei Spielzeugregale (eins mit Leiter), Kamin mit Strümpfen und
  flackerndem Feuer, der rote Sessel, zwei Werkbänke, die Wunschzettel-Tafel.
- **Grantelbarts Haus** (20 x 13 Felder): gestreifte Tapete, dunkle Dielen,
  Kabel auf dem Boden, schiefer Teppich, Notenblätter, Poster, ein Porträt,
  dessen Augen der gesteuerten Figur folgen, zwei E-Gitarren an der Wand,
  eine auf dem Ständer, zwei Verstärkertürme mit blinkender Lampe,
  Schlagzeug mit Totenkopf, Orgel mit Kerzen, Kerzenleuchter, ein hoher
  lila Sessel, Spinnweben; alles in dunklem Lila mit Kerzenschein.
- **Türen und Überblendung:** In die Kuppel und in Grantelbarts Haus läuft man
  durch die Tür (in Richtung der Tür drücken); 0,6 s Abblenden und Aufblenden,
  Steuerung währenddessen gesperrt. Drinnen verlässt man den Raum durch die
  Tür unten. Fliegende landen beim Hineingehen, Jordi als Vogel wird wieder
  Jordi; drinnen kann niemand abheben.
- **Figuren und Orte:** Jede Figur ist in genau einem Ort. Nicht gesteuerte
  bleiben in ihrem Ort und spazieren dort (Gilfi startet in der Werkstatt,
  Gugor bei Grantelbart). Wählt man eine Figur in einem anderen Ort, blendet
  das Bild dorthin über. Die Leiste zeigt "in der Werkstatt" / "bei
  Grantelbart".
- **Benutzen (R):** Steht etwas Benutzbares vor der Figur, zeigt ein kleines
  R neben dem Kopf das an; R benutzt es statt zu sprechen.

| Wo                   | Was passiert                                                 |
| -------------------- | ------------------------------------------------------------ |
| Spielzeugmaschine    | Puff am Trichter, Klingeln, ein Spielzeug fliegt in den Sack |
| Wunschzettel-Tafel   | ein Wunschzettel wird vorgelesen                             |
| Sessel               | Weihnachtsmann: "nur fünf Minuten", andere: das ist seiner   |
| Gitarren, Verstärker | kurzes verzerrtes Riff, Noten steigen auf                    |
| Schlagzeug / Orgel   | Trommelwirbel / schauriger Mollakkord, Noten                 |
| Porträt              | "Die Augen ... sie folgen mir!"                              |
| Schlitten            | nur der Weihnachtsmann: Flug, sonst ein Hinweis              |

- **Schlittenflug:** Der Weihnachtsmann startet vom Tannenbaum; ist Rudolf
  draußen, spannt er sich davor (seine Nase leuchtet). Der Schlitten hebt
  ab, fliegt in 11 s eine große Schleife (600 x 340 Pixel, bis 46 Pixel hoch)
  über die Karte mit Glitzerspur und Schatten und landet wieder auf dem Baum;
  die Kamera folgt, wenn der Weihnachtsmann gesteuert ist. Währenddessen
  sind beide von der Karte, man kann aber zu anderen Figuren wechseln.
  Gespeichert wird der Flug nicht - wer mitten drin neu lädt, findet beide am
  Schlitten.
- **Ton:** kurze, leise WebAudio-Klänge für Tür, Spielzeug, Riff, Trommeln,
  Orgel und Schlittenglocken (startet nach der ersten Taste oder dem ersten
  Klick).
- **Alte Speicherstände** (Version 1, ohne Orte) werden gelesen: gewählte
  Figur, Blickrichtung und Jordis Tier bleiben, alle stehen am Startplatz.

## Stufe 3a: der Adventskalender (umgesetzt)

Vorgabe des Auftraggebers: 26 Tore oder Eingänge auf der Karte, darüber
jeweils die Zahl 1-26 wie bei einem Adventskalender, und hinter jedem ein
Minispiel, das man absolvieren muss.

- **Karte** jetzt 88 x 64 Felder. Die alte Karte liegt unverändert oben
  links (alte Speicherstände passen weiter); östlich und südlich davon führt
  der **Adventsweg**: die Hauptstraße nach Osten (Tore 1-4), eine Straße im
  Norden (5-8) und eine im Osten (9-12), dazu zwei Straßen im Süden (13-19
  und 20-26), verbunden durch einen Weg vom Tannenbaum nach Süden und einen
  Querweg im Osten. Laternen, Wäldchen, Schneemänner und Geschenke dazwischen.
- **Tore** in vier Stilen mit gemeinsamem Aussehen: Steinbogen mit
  Holztür und Kranz, Kalenderhütte mit Stern auf der Tür, Tür in einer
  Schneemauer mit Eiszapfen, Riesengeschenk mit Schleife. Über jedem hängt
  ein rotes Schild mit goldenem Rahmen und großer Zahl. Gewonnen: Tür offen,
  warmes Licht, goldener Stern am Schild. Das **nächste** Tor (kleinste noch
  offene Zahl) leuchtet und hat einen hüpfenden Pfeil; ist es nicht im Bild,
  zeigt ein Pfeil am Bildrand mit seiner Zahl die Richtung. Steht man davor,
  erscheint „Türchen 7 - Name“ und „Pfeil hoch: hinein“. Gesperrt nach Datum
  ist nichts - alle Tore gehen jederzeit.
- **Hineingehen** wie bei den Häusern: im Eingang stehen und nach oben
  drücken, jede Figur. Abblenden, dann übernimmt das Minispiel die Leinwand.
  Nach der Rückkehr öffnet das Tor erst wieder, wenn die Taste einmal
  losgelassen wurde.
- **Jedes Minispiel:** Titelkarte (Tor, Figur davor, „Türchen 7“, Name,
  Anleitung, Steuerung, Start / Zurück), Countdown 3-2-1-Los, das Spiel mit
  einheitlicher Kopfzeile (Punkte/Ziel, Herzen, Uhr), Ergebnis (Geschafft /
  Nicht geschafft, eine Zeile Bilanz, Stand des Kalenders, Nochmal / Zurück
  zur Karte). Esc oder der rote Knopf „Minispiel verlassen“ unter dem Bild verlässt jederzeit, auch mitten im Lauf, zurück vor dem Tor. Tastatur, Maus,
  Touch (Stick, Knöpfe Aktion / Taste 2 / Zurück, beide ersten haltbar) und
  Gamepad.
- **Fortschritt:** gewonnene Tore im Speicherstand (Version 3), sofort nach
  dem Sieg gespeichert. Unter dem Bild der Adventskalender mit 26 Feldern,
  „12/26 Türchen“ und dem nächsten Tor. Nach dem 26. Tor: Finale mit
  Schlitten, Rudolf und Feuerwerk.
- **Minispiele 1-6 fertig** (Liste aller 26 und der Vertrag für die
  übrigen in `website/src/games/weihnachtsmann/MINIGAMES.md`):

| Nr  | Name               | Ziel                                               |
| --- | ------------------ | -------------------------------------------------- |
| 1   | Geschenkeregen     | 20 Geschenke fangen in 60 s, Kohle kostet ein Herz |
| 2   | Schneeballschlacht | 12 Trolle treffen in 45 s, Gilfi nicht (3 Herzen)  |
| 3   | Figuren-Memory     | 6 Paare in 75 s                                    |
| 4   | Rudolfs Nachtflug  | 45 s fliegen, 3 Herzen, Sterne als Bonus           |
| 5   | Das Spielzeugband  | 20 Spielzeuge richtig sortieren, 3 Fehler erlaubt  |
| 6   | Grantelbarts Riff  | 70 % der Noten im Takt treffen                     |

- Die Tore 7-26 zeigen bis zu ihrem Bau eine Titelkarte „Kommt bald“ und
  zählen nicht als geschafft.

## Stufe 4: das Dorf (umgesetzt)

- **Karte** jetzt 128 x 64 Felder: 40 Spalten neues Land im Osten, durch einen
  Waldgürtel (Spalten 85-87) getrennt, die Hauptstraße führt hindurch bis zum
  Geschenkelager. Freie Flächen für die nächste Stufe: README, Abschnitt
  „Freie Flächen für Teil 2“.
- **Fünf Gebäude** mit Tür, Innenraum, Licht und Schild: Elfen-Backstube
  (neben der Werkstatt), Poststube (neben dem Kino), Gugors Sternwarte
  (nördlich von Grantelbart, Weg zur Nordstraße), Rentierstall (unter dem
  Gehege, Weg zur Mittelstraße) und Geschenkelager (Osten). Für die Wege
  wurden ein Baum (38,9), zwei Bäume (57,10 / 58,10) entfernt, die Schneewehe
  38,4 nach 42,4 und der tote Busch 54,10 nach 57,12 versetzt.
- **Aufgaben:** Rentiere mit Möhren füttern (nach 90 s wieder hungrig),
  Rudolfs Nickerchen im Stroh, Briefe nach Farbe/Kontinent sortieren (Berg
  wächst nach), der Weihnachtsmann liest Briefe, Plätzchen backen (Teig -
  Blech - Ofen 8 s - herausholen, sonst nach 20 s verbrannt - Kühlgitter),
  Gilfis schwebende Bleche, Balbos Mehlsturz, Rundblick vom großen Fernrohr
  (Gugor sieht dort Verstecktes), das verlorene Geschenk im Paket-Labyrinth
  suchen und in die Werkstatt bringen, Mauselöcher für Jordi als Maus.
- **Speichern:** weiter Version 4, neu ist nur `counts.letters`.

## Teil 2: draußen (umgesetzt)

Der Osten der Karte (88-123) ist bebaut; Daten in `engine/east-data.ts`
(Kästen, Buden, Lichterketten, Glöckchen, Fundorte, Tierreviere, Namen für
den Rundblick), je Attraktion ein Modul, zusammen gestartet von
`engine/east.ts` (`World.east`), Tageszeit und Wetter in `engine/sky.ts`
(`World.sky`). Gezeichnet in `components/render-east.ts` und
`components/render-sky.ts`, Bilder auf dem eigenen Bogen
`assets/outdoor-2x.png` (`components/outdoor-atlas.ts`).

| Attraktion      | Wo (Zellen)                                              | Modul         | Was                                                                                                                     |
| --------------- | -------------------------------------------------------- | ------------- | ----------------------------------------------------------------------------------------------------------------------- |
| Weihnachtsmarkt | 102-122 x 4-16                                           | `market.ts`   | 3 Buden (R: Leckerei, Dampf), Karussell mit 4 Pferden (R: 10 s mitfahren, Spieluhr), Lichterketten, Musik alle 9 s      |
| Rodelhang       | Bahn 103-107 x 24-56                                     | `sled.ts`     | R am Schlittenstapel (109,22): Start bei 105,5/25,6; wird schneller (bis 150 px/s), Lenken, Bremsen, Fahne/Stein bremst |
| Schneeballwiese | 110-122 x 20-28                                          | `snowball.ts` | R wirft in Blickrichtung (170 px/s, 0,6 s); 3 Zielscheiben, 2 Schneemänner                                              |
| Eishöhle        | Wasserfall 114-121 x 32-35                               | `cave.ts`     | Tür 117-118/36 nur bei gebrochenem Vorhang, Schlupfloch 113/35 nur für den Fuchs; Raum `iceCave` (20 x 13)              |
| See             | 109-123 x 38-57, Insel 115-117                           | `rink.ts`     | weniger Halt (Griff x0,7), schneller (x1,25), Runden um die Insel, Balbo rutscht aus (0,35 je s)                        |
| Tannenschonung  | 89-99 x 41-55                                            | `firs.ts`     | junge Tannen fällen (Weihnachtsmann, Elfen), Tragen `fir` geht durch Türen, Ständer in der Werkstatt (7,12)             |
| Glöckchen       | ganze Karte                                              | `bells.ts`    | 12 Stück, Bedingung je Glöckchen (`BellNeed`), gespeichert in `progress.bells`, nicht im Rundblick                      |
| Tiere           | Hasen 88-100 x 21-40, Pinguine See, Eulen 100-121 x 2-14 | `critters.ts` | scheu (fliehen unter 38 px), neugierig auf Jordi in ihrer Gestalt; R: Sprechblase                                       |
| Briefkasten     | 16,13                                                    | `errands.ts`  | Auftrag: Fundsache bringen, besuchen, vom Markt holen; Pfeil zum Ziel; Ziel-Figur wartet, wenn man nah ist              |
| Tag und Nacht   | draußen                                                  | `sky.ts`      | 360 s je Tag, Start morgens; Nachttönung, Licht draußen nachts heller; 60 % der Nächte 75 s Polarlicht                  |
| Schneesturm     | draußen                                                  | `sky.ts`      | nach 150 s, dann alle 160-320 s für 40 s: Schneetreiben, weißer Rand                                                    |

Ausprobieren: `?uhr=22` (Startstunde), `?wetter=sturm`, `?wetter=polarlicht`.

### Jetskis

Vier Schnee-Jetskis (Rumpf auf zwei Kufen, je eine Farbe) in
`engine/jetski.ts`, Standorte `JETSKI_HOMES` in `engine/east-data.ts`:
Teich-Südufer 11/33,7 (rot), Hauptstraße 53/20,8 (gelb), westlich vom Markt
96,5/11 (türkis), See-Westufer 110,5/40,8 (lila). Zustand in `World.jetskis`
(nicht gespeichert; nach dem Neuladen steht der Fahrer daneben bzw. am
Startplatz, falls er im Wasser war).

- **Einsteigen:** R daneben (Spot `jetski`, Schild „Jetski - R: einsteigen“).
  Nicht fliegend („Erst landen“), nicht als Tier, nicht wenn schon jemand
  drauf sitzt.
- **Fahren:** Bug dreht zum Stick (6 rad/s), Schub 320 px/s², Spitze 240 px/s
  auf Schnee/Weg (zu Fuß gesteuert ca. 94 px/s), Eis x1,12, Wasser x1,06.
  Querfahrt verfällt je nach Boden (Schnee 7/s, Wasser 2,6/s, Eis 1,6/s) -
  daher Drift. Zurückziehen bremst. Kollision mit eigenem Rumpf-Kasten
  (18 x 6, darf ins Wasser); an Ecken rutscht er bis 6 px vorbei, sonst prallt
  er ab (40 % zurück, ab 120 px/s mit Plumps und Spruch). Schneemänner im Weg
  fallen um (zählt für „Umgeschubst“). Gischt aus Schnee, Eis oder Wasser
  (Partikel `spray`).
- **Türen, Türchen, Kino:** keine Durchfahrt; wer hineindrückt, bekommt einmal
  je Tür „erst aussteigen“. „Hinein“ erscheint auf dem Jetski nicht.
- **Aussteigen:** R, neben (sonst hinter/vor) dem Jetski auf begehbarem Boden,
  nicht im Wasser. Der Jetski bleibt stehen; nach 180 s unbenutzt woanders
  steht er wieder an seinem Platz (wenn dort keiner steht).
- **Fähigkeit:** Hupe (Grantelbart: Riff mit Noten), 0,7 s Pause.
- **Figurwechsel:** die Figur bleibt sitzen, der Jetski rollt aus;
  zurückgewechselt fährt man weiter. Nicht gesteuerte Figuren steigen nie auf.
  Wer in den Schlitten oder nach drinnen kommt, ist vom Jetski herunter.
- **Kamera** schaut bei Tempo bis 64 px voraus; **Motor** als leises
  Dauerbrummen (`SoundPlayer.motor`, Tonhöhe nach Tempo, still bei
  verborgener Seite, im Minispiel und im Kino), dazu `jetskiStart` und `horn`.
- **Nachts** Scheinwerfer (drei Lichtflecke vor dem Bug).
- **Wechselwirkungen:** Runden um die Insel zählen auf dem Jetski nicht
  („Eisläufer“), das Hasenrennen gilt nur als Hase; das Glöckchen im offenen
  Wasser des Teichs ist mit dem Jetski erreichbar.
- **Rundblick:** jeder Jetski als Strich in seiner Farbe mit Namen.
- **Grafik:** eigener Bogen `assets/jetski-2x.png` mit Atlas
  `components/jetski-atlas.ts` (je Farbe Seite, vorne, hinten, jeweils ganz
  und nur der Teil vor dem Fahrer), Zeichnen in `components/render-jetski.ts`.
  Beides schreibt das Skript `jetski_art.py` (Scratchpad der Sitzung unter
  `jetski/`, nutzt `pix.py`), dazu das Abzeichen „Vollgas“ auf dem
  Figurenbogen bei 74,714.

## Fähigkeiten

Datengetrieben: jede Figur nennt ihre Fähigkeit (`fly`, `transform` oder
eine Vorführung: `wishes`, `guitar`, `telescope`, `levitate`, `fall`),
`engine/abilities.ts` hält je Art einen Handler, `engine/shows.ts` lässt die
Vorführungen ablaufen (Länge, Abklingzeit und Gewohnheiten in `cast.ts`).
Erneutes Drücken während der Vorführung oder der Abklingzeit tut nichts.

| Figur          | Fähigkeit                      | Leertaste                                                                                                                                                                                              |
| -------------- | ------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Weihnachtsmann | erkennt Wünsche; Schlitten (R) | 5 s Gedankenblasen mit Wunschbild und -text über jeder Figur im Bild, goldener Schimmer, Glöckchen                                                                                                     |
| Balbo          | fällt hin; viel Halt auf Eis   | kippt um, Schneestaub, Plumps, Sterne über dem Kopf, "Uff!", steht nach gut 1 s wieder auf; auf Eis rutscht er weiter                                                                                  |
| Jordi          | verwandelt sich in ein Tier    | öffnet die Tierwahl / verwandelt zurück                                                                                                                                                                |
| Trixi          | fliegt                         | Abheben / Landen; bunte Glitzerspur mit gelbem Schimmer                                                                                                                                                |
| Gilfi          | lässt Dinge schweben           | Zauberhände; Geschenke, Steine, Schneemänner, Schilder und Büsche im Umkreis von 4 Feldern und herbeigezauberte Spielzeuge (in der Werkstatt aus Regalen, Werkbank, Maschine) schweben 5 s mit Glitzer |
| Grantelbart    | spielt E-Gitarre               | Gitarren-Pose, Riff, Noten, das Bild wackelt; wer in der Nähe steht, springt und ruft "Zu laut!" (Gugor gefällt's)                                                                                     |
| Gugor          | schaut durchs Fernrohr         | runde Linse, das Bild sucht den Weihnachtsmann (auch in einem anderen Haus oder im Schlitten), Zeile "Gugor beobachtet den Weihnachtsmann ...", danach ein Kommentar                                   |
| Rudolf         | fliegt                         | Abheben / Landen; die rote Nase leuchtet und pulsiert                                                                                                                                                  |

**Wünsche:** Balbo ein Fisch, Jordi eine Eisenbahn, Trixi ein Teddy, Gilfi
ein Kissen, Grantelbart eine E-Gitarre, Gugor (psst) ein Ball, Rudolf eine
Möhre.

**Von selbst:** Balbo stolpert beim Spazieren ab und zu, Grantelbart greift
beim Ausruhen in seinem Haus in die Saiten, Gilfi zaubert selten. Der
Weihnachtsmann und Gugor nur, wenn man sie steuert (das Fernrohr übernimmt
das Bild; Wechsel und Tasten warten so lange).

**Fliegen:** in 18 Pixel Höhe, Schatten bleibt am Boden, über alles hinweg
(nur der Kartenrand begrenzt; der Kopf bleibt immer im Bild). Landen nur, wo
die Figur zu Fuß stehen könnte - sonst "Hier kann ich nicht landen!". Allein
gelassen landet eine Fliegende, sobald unter ihr Platz ist. Trixi 88, Rudolf
100 Pixel pro Sekunde (zu Fuß 62 und 66).

**Jordis Tiere** (Taste F oder Leertaste, Wahl mit 1-6, Pfeilen oder Klick; Puff-Wolke mit
Sternchen; zurück mit F, wenn Platz für Jordi ist):

| Tier    | Tempo (px/s) | Besonderheit                                         |
| ------- | ------------ | ---------------------------------------------------- |
| Hase    | 96           | sehr schnell, hoppelt                                |
| Vogel   | 80           | fliegt (10 px hoch) über alles                       |
| Pinguin | 36           | auf Eis 3,4-fach schnell mit Bauchrutschen, schwimmt |
| Fuchs   | 70           | rutscht nicht auf Eis                                |
| Maus    | 104          | winzig, schlüpft durch Zäune                         |
| Bär     | 38           | pflügt durch Schneewehen, alle weichen ihm aus       |

R lässt die gesteuerte Figur (oder das Tier) etwas sagen.

## Erfolge

54 Erfolge, mindestens einer je Figur und Fähigkeit, dazu Erfolge für alle.
Daten in `engine/achievements.ts` (`ACHIEVEMENTS`: id, für wen, Ziel),
Texte in `i18n/texts.ts` (`ACHIEVEMENT_TEXTS`: Titel, geschafft, Tipp),
Abzeichen auf dem Figurenbogen (`badge...`, Generator `achieve.py`).
Freigeschaltet wird im Moment des Geschehens (`unlock`); was nur vom
Dastehen abhängt (Maus im Zaun, Vogel am Schornstein, Rudolfs Ecken,
Hasenrennen, Werkstatt voll, Türchen), prüft `checkAchievements` jeden
Schritt. Es zählt nur, was die gesteuerte Figur tut.

- **Banner:** oben im Bild, 4,5 s, mit Abzeichen, Jingle und Konfetti; mehrere
  warten nacheinander. Das Spiel läuft weiter.
- **Erfolge-Knopf:** im Kopf und neben dem Adventskalender (Handy: Stern mit
  Zahl). Der Dialog zeigt Karten: geschafft mit Datum, offen grau mit Tipp und
  Fortschrittsbalken.
- **Speichern:** im Spielstand (Version 4) die Erfolge mit Datum, die
  gesammelten Wünsche, Instrumente, Buden, Glöckchen und Tierarten, die
  gezählten Stürze, Spielzeuge, Briefe, Treffer und Aufträge und die beste
  Rodelzeit (alles optional - ältere Stände lesen sich mit 0).
  Spielstände der Version 3 werden gelesen (noch kein Erfolg); wer schon
  Türchen hat, bekommt die Türchen-Erfolge beim ersten Schritt. „Neu
  aufstellen“ behält die Erfolge.

| Erfolg                 | Für                    | Bedingung                                                                                  |
| ---------------------- | ---------------------- | ------------------------------------------------------------------------------------------ |
| Petri Heil             | Jordi                  | als Pinguin im offenen Wasser des Teichs auf den Fisch schwimmen                           |
| Paket von oben         | Trixi                  | fliegend das Geschenk oben auf der Glaskuppel holen                                        |
| Ehrenrunde             | Rudolf                 | in einem Flug (ohne Landen) alle vier Kartenecken (je 12 Felder) besuchen                  |
| Wunschzettel komplett  | Weihnachtsmann         | nach und nach die Wünsche aller 7 anderen lesen (wer beim Wünscheerkennen im Bild ist)     |
| Sabotage!              | Grantelbart            | in der Werkstatt R an der Spielzeugmaschine oder E-Gitarre direkt daneben: sie geht kaputt |
| Meisterhaft repariert  | Jordi, Trixi, Gilfi    | R als Elfe (Jordi nicht als Tier) an der kaputten Maschine: 1,6 s Reparatur                |
| Ohrenbetäubend         | Grantelbart            | ein Riff erschreckt mindestens 3 andere auf einmal                                         |
| Werkstattspion         | Gugor                  | Fernrohr, während der Weihnachtsmann in der Werkstatt ist                                  |
| Erwischt, Angeber!     | Gugor                  | Fernrohr, während der Weihnachtsmann Schlitten fliegt                                      |
| Schwebender Schneemann | Gilfi                  | draußen zaubern, ein stehender Schneemann im Umkreis schwebt mit                           |
| Bauchklatscher         | Balbo                  | auf dem Eis hinfallen                                                                      |
| Stehaufmännchen        | Balbo                  | 10-mal hinfallen (gezählt und gespeichert)                                                 |
| Volltreffer            | Balbo                  | kopfüber in einen Schneemann fallen (er kippt um)                                          |
| Durchgeschlüpft        | Jordi                  | als Maus mitten durch einen Zaun                                                           |
| Schneepflug            | Jordi                  | als Bär durch eine Schneewehe: sie wird platt                                              |
| Warme Füße             | Jordi                  | als Vogel auf Grantelbarts rauchendem Schornstein                                          |
| Turbohase              | Jordi                  | als Hase in unter 8 s von der Werkstatttür zu Grantelbarts Haustür                         |
| Spürnase               | Jordi                  | als Fuchs östlich vom schiefen Schild graben (R): ein goldenes Glöckchen                   |
| Hü, Rudolf!            | Weihnachtsmann, Rudolf | Schlittenrunde, während Rudolf draußen ist (er zieht)                                      |
| Licht aus              | alle                   | R an einer Laterne                                                                         |
| Stromausfall           | alle                   | alle 35 Laternen gleichzeitig aus                                                          |
| Umgeschubst            | alle                   | R an einem Schneemann                                                                      |
| Schneemann-Baumeister  | alle                   | R an einem umgeschubsten Schneemann                                                        |
| Ein-Troll-Band         | alle                   | in Grantelbarts Haus Orgel, Gitarre, Verstärker und Schlagzeug spielen (gespeichert)       |
| Fließbandarbeit        | alle                   | 10 Spielzeuge mit der Maschine bauen (gezählt und gespeichert)                             |
| Hausbesuch             | Weihnachtsmann         | Grantelbarts Haus betreten                                                                 |
| Betriebsversammlung    | alle                   | alle 8 Figuren gleichzeitig in der Werkstatt                                               |
| Das erste Türchen      | alle                   | ein Minispiel gewinnen                                                                     |
| Frohe Weihnachten!     | alle                   | alle 26 Türchen schaffen                                                                   |
| Filmabend              | alle                   | im Kino eine Folge starten                                                                 |
| Satte Rentiere         | alle                   | alle 4 Rentiere im Stall gleichzeitig satt (Möhre aus der Kiste, R an der Box)             |
| Rudolfs Nickerchen     | Rudolf                 | R am Stroh im Rentierstall                                                                 |
| Postmeister            | alle                   | 10 Briefe ins richtige Fach (gezählt und gespeichert)                                      |
| Lieber Weihnachtsmann  | Weihnachtsmann         | in der Poststube einen Brief nehmen (er liest ihn)                                         |
| Erstes Blech           | alle                   | ein fertiges Blech aus dem Ofen holen                                                      |
| Mehlstaub              | Balbo                  | in der Backstube hinfallen                                                                 |
| Fliegende Bleche       | Gilfi                  | in der Backstube zaubern                                                                   |
| Überblick              | alle                   | Rundblick am großen Fernrohr der Sternwarte                                                |
| Adlerauge              | Gugor                  | Rundblick in der Sternwarte, während das Geschenk im Lager versteckt ist                   |
| Geschenk gerettet      | alle                   | das verlorene Geschenk aus dem Lager in die Werkstatt tragen                               |
| Mäuseweg               | Jordi                  | als Maus durch ein Mauseloch im Geschenkelager                                             |
| Bummel über den Markt  | alle                   | R an allen 3 Buden des Weihnachtsmarkts (gespeichert)                                      |
| Rundherum              | alle                   | eine Karussellfahrt (R vor dem Karussell)                                                  |
| Hinter dem Eis         | alle                   | die Eishöhle betreten (Vorhang: Bär mit R; Schlupfloch: Fuchs gräbt mit R)                 |
| Himmelsleuchten        | Gugor                  | draußen Fernrohr, während Polarlichter leuchten (Stärke mindestens 0,3)                    |
| Rodelblitz             | alle                   | Rodelhang in unter 7 s (Bestzeit in Zehntelsekunden als `counts.sledBest`)                 |
| Treffsicher            | alle                   | 15 Treffer auf Zielscheiben und Schneemänner (gezählt und gespeichert)                     |
| Eiskunstläufer         | alle                   | 3 Runden um die Insel des Sees, ohne das Eis zu verlassen (Winkel um die Insel)            |
| O Tannenbaum           | Weihnachtsmann, Elfen  | junge Tanne fällen, in die Werkstatt tragen, R am Ständer                                  |
| Alle Glöckchen         | alle                   | alle 12 goldenen Glöckchen (gespeichert, `progress.bells`)                                 |
| Tiergespräche          | Jordi                  | als Hase/Pinguin/Vogel mit Schneehase/Pinguin/Eule plaudern (gespeichert)                  |
| Fleißiger Bote         | alle                   | 5 Aufträge aus dem Briefkasten (gezählt und gespeichert)                                   |
| Sturmerprobt           | alle                   | 20 s im selben Schneesturm draußen unterwegs                                               |
| Vollgas                | alle                   | in einer Jetski-Fahrt den Westrand (x < 16 Zellen) und den Ostrand (x > 112) erreichen     |

### Was man verändert, stellt sich wieder her

Die Veränderungen stehen in `GameState.world` (`engine/world.ts`), nicht in
der Karte, und werden nicht gespeichert - nach dem Neuladen ist alles heil.

| Veränderung                 | Wie                                  | Zurück                                                                                                                    |
| --------------------------- | ------------------------------------ | ------------------------------------------------------------------------------------------------------------------------- |
| Laterne aus                 | R an der Laterne (nochmal R: an)     | 60 s nach der zuletzt ausgeknipsten gehen sie nacheinander alle 3 s wieder an, mit Flackern                               |
| Schneemann umgeschubst      | R am Schneemann, Balbo fällt hinein  | nach 90 s steht er wieder (Schneestaub, Glitzer); R baut ihn sofort auf                                                   |
| Schneewehe platt            | der Bär läuft hindurch               | nach 45 s wieder da                                                                                                       |
| Fisch gefangen              | Pinguin schwimmt auf ihn             | nach 25 s schwimmt einer an einer anderen Stelle des Lochs                                                                |
| Geschenk von der Kuppel     | Trixi fliegt hin                     | nach 60 s liegt ein neues dort (Glitzer)                                                                                  |
| Spielzeugmaschine kaputt    | Grantelbart (R oder Gitarre daneben) | steht still, Ruß, Funken, Riss, eine Lampe blinkt rot; nach 120 s läuft sie von selbst wieder, eine Elfe repariert sofort |
| Rentier satt                | Möhre an der Box                     | nach 90 s wieder hungrig (Gedankenblase mit Möhre)                                                                        |
| Briefberg kleiner           | Brief nehmen                         | alle 6 s ein Brief mehr, bis 12                                                                                           |
| Ofen / Kühlgitter           | backen, abstellen                    | fertige Plätzchen verbrennen nach 20 s; jedes Blech auf dem Gitter ist nach 50 s weggenascht                              |
| Geschenk geholt             | gefunden und abgeliefert             | nach 45 s geht ein neues verloren; alle 150 s wird das Labyrinth neu gestapelt (nicht, solange man drin ist)              |
| Eisvorhang offen            | Bär R am Vorhang                     | 120 s offen, in den letzten 20 s wächst dünnes Eis nach; dann zu                                                          |
| Schlupfloch frei            | Fuchs R am Loch neben der Klippe     | nach 120 s wieder zugeschneit                                                                                             |
| Tanne gefällt               | R an junger Tanne der Schonung       | Baumstumpf; nach 150 s steht wieder eine junge Tanne                                                                      |
| Christbaum in der Werkstatt | R am Ständer mit Tanne               | nach 240 s verschwindet er (Puff)                                                                                         |
| Glöckchen aus der Tanne     | Gilfi zaubert daneben                | liegt 90 s im Schnee, dann hängt es wieder oben                                                                           |
| Zielscheibe getroffen       | Schneeball                           | wackelt 0,8 s                                                                                                             |
| Brief im Briefkasten        | R liest den Auftrag                  | 20-45 s nach dem erledigten Auftrag liegt ein neuer darin                                                                 |

## Bewusst (noch) nicht umgesetzt

- Geschichte, Gegenstände zum Aufheben (außer Fisch und Geschenk für die Erfolge), Musik im Hintergrund, ein Knopf zum
  Stummschalten. Die Minispiele 7-26 (Platzhalter).
- Bestenlisten oder Zeiten der Minispiele; gespeichert wird nur geschafft
  oder nicht.
- Nicht gesteuerte Figuren gehen nicht von selbst durch Türen.
- Eigenes Verhalten für Jordi als Tier ohne Steuerung: wer ihn als Tier
  verlässt, findet ihn als dasselbe Tier spazierend wieder (der Vogel fliegt
  dabei).

## Kino

- **Ort:** Gebäude 6 x 3 Felder bei Zelle 30,5 (Grundriss sperrt wie ein
  Haus), Tür unten in der Mitte (Felder 32-33, Zeile 8), ein Weg (Spalten
  32-33) führt von der Hauptstraße hinauf. Für den Platz wurden eine
  Schneewehe (31,4 nach 38,4) und ein Stein (33,16 nach 35,16) versetzt.
  Leuchtendes „KINO“-Schild mit Lauflichtern, Lichterkette unter dem Sims,
  warmes Licht aus Tür und Rundfenstern.
- **Hinein:** in der Tür Pfeil hoch (wie bei den Türchen), R vor der
  Fassade, auf dem Handy Hinein oder Benutzen. Überblendung; am dunkelsten
  Punkt setzt die Simulation `cinemaOpen`, der Bildschirm zeigt das Kino als
  `<dialog>` über allem, die Karte steht still. Zurück: Esc oder „Kino
  verlassen“; danach wartet die Tür, bis der Druck nach oben losgelassen ist
  (wie bei den Türchen).
- **Kino:** Vorhang-Optik, Liste der 26 Folgen (Nummer, Titel), 4:3-Leinwand.
  Der Player (youtube-nocookie.com) wird erst nach dem Klick auf eine Folge
  geladen, vorher nur ein Platzhalter; Hinweiszeile „Beim Abspielen werden
  die Folgen vom offiziellen TOGGO-Kanal geladen.“ Fehler: „Diese Folge ist
  gerade nicht verfügbar.“
- **Ausschnitt:** jede Folge nur von 1:04 bis 23:04; Uhr und Zeitleiste
  zeigen 0:00 bis 22:00, Spulen bleibt im Raster. Bei 23:04 hält der Film an,
  der Vorhang schließt sich mit „Ende“, „Nächste Folge“ und „Nochmal
  ansehen“.
- **Steuerung:** eigene Knöpfe in Gold/Samt: Abspielen/Pause, Zeitleiste
  (Klick, Ziehen, Touch), Ton an/aus und Lautstärke, Vollbild für die
  Leinwand. Klick aufs Bild = Pause/Weiter. Tastatur: Leertaste Pause,
  Pfeile ±10 s, Esc verlässt das Kino.
- **Vorhang:** geht auf, sobald der Teil ab 1:04 läuft (2,3 s, sanft
  auslaufend), schließt bei Pause halb und am Ende ganz (0,8 s); darunter
  liegt sofort ein dunkler Schirm. Vorher läuft der Film 4 s stumm hinter dem
  geschlossenen Vorhang an, damit die Titelleiste des Players vorbei ist.
  Nach Weiterspielen, Springen, Puffern und Vollbild decken für 4,5 s dunkle
  Streifen oben/unten und ein goldenes Zeichen in der Mitte die Knöpfe des
  Players ab.
- **Weiterschauen:** gespeichert unter `weihnachtsmann/cinema` (Version 2,
  getrennt vom Spielstand; Version 1 mit nur der letzten Folge wird
  übernommen): die zuletzt gestartete Folge, die Stelle je Folge (Sekunden
  im Raster 1:04-23:04) und die zu Ende geschauten. Gespeichert wird alle
  5 s während der Wiedergabe, bei Pause, beim Folgenwechsel, beim Schließen
  des Kinos und bei pagehide/visibilitychange. Beim Öffnen ist die letzte
  Folge markiert, ein Knopf „Weiterschauen - Folge N, ab M:SS“ setzt dort
  fort (war sie zu Ende geschaut: die nächste Folge); ohne Klick startet
  nichts. Eine Folge aus der Liste setzt an ihrer Stelle fort. In der Liste
  zeigt ein dünner Balken den Stand, „gesehen“ die fertigen; eine fertige
  Folge beginnt beim nächsten Mal wieder bei 1:04. Auch beim Fortsetzen
  läuft der Film 4 s stumm hinter dem Vorhang an.
- **Nächste Folge von selbst:** Bei 23:04 erscheint auf dem Vorhang „Gleich
  geht's weiter: Folge N+1 - Titel“ mit 5-s-Countdown, „Jetzt abspielen“ und
  „Abbrechen“ (zeigt den Ende-Bildschirm). Die nächste Folge lädt per
  `loadVideoById` in denselben Player und startet bei 1:04 mit Ton. Nach
  Folge 26 kommt nur der Ende-Bildschirm.
- **Erfolg:** „Filmabend“ beim ersten Start einer Folge.

## Datumssperre der Türchen

- Januar bis November: alle 26 Türchen offen.
- Dezember: Türchen n öffnet am n. Dezember (am 1. nur Türchen 1, am 2.
  Türchen 1 und 2 usw.), ab dem 26. ist wieder alles offen. Das gilt auch für
  schon geschaffte Türchen.
- Gesperrte Türchen: Schloss vor der Tür, Sprechblase „Türchen 6 öffnet erst
  am 6. Dezember!“, kein „Hinein“-Knopf, graue Zelle in der Kalenderleiste.
  Der Pfeil zum nächsten Türchen zeigt nur auf offene.
- Das Datum kommt vom Gerät (`engine/calendar.ts`, die Engine liest die Uhr
  nicht selbst). Zum Ausprobieren: `/weihnachtsmann?datum=12-05`.
