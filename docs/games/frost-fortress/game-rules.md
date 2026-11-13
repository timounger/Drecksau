# Frost Fortress - Spielregeln als Spezifikation

Eigenes Spiel dieser Sammlung (keine Vorlage). Diese Datei ist die verbindliche
Referenz für die Engine in `website/src/games/frost-fortress/engine/`. Alle
Zahlen stehen als Tabellen in `structures.ts`, `enemies.ts`, `research.ts`,
`waves.ts`, `happenings.ts` und `modifiers.ts`; hier die Kernwerte.

## Ziel

Einzelspieler-Survival. Start mit Hauptquartier (HQ) und Lagerhaus mitten auf
einer verschneiten Karte (72 x 72 Felder zu 32 Einheiten). Gegner kommen in
Wellen vom Kartenrand und wollen das HQ zerstören. Fällt das HQ, ist das Spiel
verloren. Es gibt kein Ende - es zählt die erreichte Welle.

## Ressourcen

Holz, Eisen, Stein, Energie, Nahrung, Treibstoff. Start: 200 / 150 / 100 / 100
/ 80 / 20. Lagergrenze je Ressource: 300 + 250 je HQ-Stufe + 400 je
Lagerhaus-Stufe (nur fertige Gebäude).

- Produktion je Sekunde = Grundwert x (1 + 0,6 x (Stufe - 1)) x Faktoren
  (Forschung +25 %, Schneesturm bis -30 %, Kältewelle -30 %; mit Isolierung
  -12 % bzw. -15 %).
- Energie: Verbraucher ziehen Energie (+30 % je Stufe). Reicht der Vorrat
  nicht, arbeiten alle Verbraucher mit dem Anteil Erzeugung/Bedarf.
- Holzfällerlager: Holz 2,2 und Nahrung 0,45 je s, Holz x min(1,25, Bäume im
  Umkreis 4 / 12); mindestens 3 Waldfelder nötig.
- Mine: Eisen 1,5 und Stein 1,6 je s, je x min(1, Vorkommen-Felder im Umkreis
  von 1 Feld / 6); mindestens ein Vorkommen-Feld nötig.
- Weitere Quellen: Beute besiegter Gegner (Chance je Typ), Wellenbelohnung
  (Holz 40 + 15 n, Eisen 25 + 10 n, Stein 25 + 10 n, Nahrung 20 + 5 n),
  Versorgungsabwurf, Erzader, Überlebende, Händler, Erkundung.

## Gebäude

| Gebäude           | Größe | Kosten                                   | LP   | Stufen | ab HQ | Wirkung                                                            |
| ----------------- | ----- | ---------------------------------------- | ---- | ------ | ----- | ------------------------------------------------------------------ |
| Hauptquartier     | 3x3   | (Ausbau)                                 | 2600 | 5      | -     | Holz .7, Stein .4, Eisen .4, Nahrung .9, Energie 1,2/s             |
| Lagerhaus         | 2x2   | Holz 80, Stein 40                        | 700  | 4      | 1     | Lager +400 je Stufe                                                |
| Holzfällerlager   | 2x2   | Holz 50                                  | 450  | 4      | 1     | siehe oben                                                         |
| Mine              | 2x2   | Holz 70, Eisen 20                        | 600  | 4      | 1     | siehe oben, Energie .4                                             |
| Generator         | 2x2   | Holz 60, Eisen 60, Stein 30              | 500  | 4      | 1     | Energie 3/s                                                        |
| Werkstatt         | 2x2   | Holz 120, Eisen 80, Stein 60             | 650  | 4      | 2     | Holz .8 -> Treibstoff .7/s, repariert 5 LP/s je Stufe im Umkreis 6 |
| Forschungszentrum | 2x2   | Holz 100, Eisen 100, Stein 80            | 550  | 4      | 2     | 1 Forschungspunkt/s (+60 % je Stufe)                               |
| Kaserne           | 2x2   | Holz 120, Eisen 60, Stein 60, Nahrung 40 | 850  | 4      | 2     | 1 + Stufe Soldaten (je 20 Nahrung, 16 s)                           |
| Krankenstation    | 2x2   | Holz 100, Eisen 60, Stein 60, Nahrung 30 | 500  | 3      | 3     | heilt Soldaten 9 LP/s je Stufe, Ausbildung x1,6                    |

- LP je Stufe +40 % (Mauern +75 %). Ausbaukosten: Baukosten x 0,85 x 1,55^(Stufe-1).
  Ausbauzeit: Bauzeit x (1 + 0,5 x Stufe). Keine Stufe über der HQ-Stufe
  (Verteidigung mit Festungsbau +1).
- Ausbau-Pfeil: Ist ein fertiger Bau (außer Mauern) bezahlbar ausbaubar,
  steht ein grüner Pfeil an seiner rechten oberen Ecke; ein Klick darauf
  startet den Ausbau ohne Umweg über die Infoleiste.
- Bau in höherer Stufe: Im Baumenü lässt sich jede Stufe bis zur
  Stufengrenze wählen. Kosten = Baukosten + alle Ausbaukosten bis dorthin,
  Bauzeit = Bauzeit + alle Ausbauzeiten bis dorthin; Abriss erstattet
  anteilig diese Summe.
- Baustellen beginnen mit 15 % LP. Gleichzeitig arbeiten 2 Bautrupps (+1 je
  zwei HQ-Stufen, +1 mit Baumaschinen); weitere Baustellen warten.
- Nicht fertige Baustellen lassen sich verschieben (Fortschritt bleibt) und
  kostenlos abbrechen; Abriss fertiger Bauten erstattet 50 %.
- Baugebiet: Radius 10 + 3 je HQ-Stufe über 1 (+5 mit Außenposten) um die
  HQ-Mitte. Nicht auf Fels, Wald, Eis, belegten Feldern oder neben Gegnern.
- Reparatur kostet fehlenden LP-Anteil x Baukosten x 50 % (30 % mit
  Feldreparatur) und stellt 12 % LP je s wieder her. Minenfelder werden dabei
  neu bestückt (12 Eisen, 4 Stein je Mine).

## Verteidigung (Stufe 1)

| Anlage        | Kosten                             | LP  | Reichweite | Schaden | Intervall | Besonderes                                                                |
| ------------- | ---------------------------------- | --- | ---------- | ------- | --------- | ------------------------------------------------------------------------- |
| MG-Turm       | Holz 60, Eisen 40                  | 450 | 5,5        | 8       | 0,2 s     | erstes Ziel                                                               |
| Kanonenturm   | Holz 80, Eisen 110, Stein 60       | 520 | 6,5        | 58      | 1,7 s     | Fläche 1,4                                                                |
| Scharfschütze | Holz 60, Eisen 140                 | 300 | 11         | 130     | 2,3 s     | stärkstes Ziel                                                            |
| Elektroturm   | Eisen 150, Stein 80, Energie 50    | 380 | 4,6        | 34      | 1,1 s     | Kette 4 (+1 je Stufe, -25 % je Sprung), 0,3 s Betäubung, 2 Energie/Schuss |
| Flammenwerfer | Eisen 110, Stein 40, Treibstoff 30 | 620 | 3,3        | 5       | 0,1 s     | Kegel, Brand 10/s für 3 s, 0,04 Treibstoff/Stoß, ignoriert Panzerung      |
| Minenfeld     | Eisen 50, Stein 20                 | 120 | -          | 180     | -         | 3 Minen (+1 je Stufe), Fläche 1,7, unsichtbar für Gegner                  |
| Mauer (1x1)   | Holz 4, Stein 12                   | 700 | -          | -       | -         | lenkt den Weg der Gegner                                                  |

Je Stufe: Schaden +40 %, Reichweite +8 %, Feuerrate +10 %. In den
Einstellungen lässt sich die Reichweite aller Türme mit 1,5x, 2x, 3x oder 5x
malnehmen (Normal = 1x, die kleinste; Minenfelder bleiben gleich). Nachts und im
Sturm sinkt die Reichweite (Faktor Sicht, siehe unten). Panzerung zieht vom
Schaden ab, mindestens 25 % kommen durch.

## Gegner (Welle 1)

| Gegner          | LP   | Panzer | Tempo | Schaden        | Reichweite | ab Welle | Punkte |
| --------------- | ---- | ------ | ----- | -------------- | ---------- | -------- | ------ |
| Plünderer       | 45   | 0      | 2,4   | 6              | 0,75       | 1        | 1      |
| Soldat          | 95   | 1      | 1,35  | 7              | 3,4        | 1        | 2      |
| Schwerer Soldat | 340  | 3      | 0,85  | 22             | 2,6        | 4        | 6      |
| Sprengkommando  | 80   | 0      | 1,9   | 230 Fläche 1,6 | 0,8        | 6        | 4      |
| Belagerung      | 950  | 9      | 0,55  | 85 Fläche 1    | 8,5        | 9        | 16     |
| Frostkoloss     | 2400 | 3      | 0,5   | 60 Fläche 1,4  | 3,2        | jede 5.  | -      |

- LP x (1 + 0,1 (n-1)) x 1,04^max(0, n-10); Schaden x (1 + 0,05 (n-1)).
  Boss-LP x (0,1 + 0,15 n). Der Boss stampft alle 9 s (40 Schaden, Radius 3)
  und ruft alle 14 s 1 + n/10 Soldaten.
- Bewegung über ein Flussfeld (Dijkstra vom HQ): Tiefschnee und Wald kosten
  mehr, Bauten sehr viel (Mauern 8 + 5 je Stufe), Fels ist gesperrt. Was im
  Weg steht, wird angegriffen. Schützen feuern im Gehen auf alles in
  Reichweite, Belagerung und Sprengkommandos bevorzugen Türme, Plünderer
  stehlen 4 Ressourcen je Treffer an Gebäuden.

## Wellen

- Erste Welle nach 210 s, danach 100 s nach dem Ende der vorigen.
  "Welle jetzt rufen" gibt 0,8 Holz und Eisen je verbleibender Sekunde.
- Budget n: 4 + 4 n + 0,7 n^2 Punkte, zufällig auf freigeschaltete Typen
  verteilt (Gewichte Plünderer 3, Soldat 4, Schwer 2, Spreng 1,5, Belagerung
  1). Spawn über bis zu 45 s, durch 1 Tor (+1 je 3 Wellen, höchstens 4; ab
  Welle 6 auch die Ecken). Tore werden 60 s vorher rot angezeigt.
- Eine Welle endet, wenn alle Gegner besiegt sind, spätestens 200 s nach dem
  Start (Nachzügler bleiben auf dem Feld).

## Forschung

Ein Projekt zur Zeit, Preis beim Start, Abbruch erstattet. Punkte je s =
Summe der Labore (Polarlicht x2). Zweige: Waffen (Ballistik -> Kanone,
Sprengstoffe -> Minenfeld, Zielfernrohre -> Scharfschütze, Thermochemie ->
Flammenwerfer, Hochspannung -> Elektroturm), Feuerkraft (+15 %/+15 % Schaden,
+20 % Feuerrate, Frostgeschosse: Treffer bremsen auf 70 % für 1,5 s),
Panzerung (+25 %/+25 % LP der Verteidigung, Festungsbau +1 Stufe),
Wirtschaft (+25 % Produktion, Isolierung, Baumaschinen, Feldreparatur,
Außenposten), Sicht (Flutlichter, Wärmebildoptik).

## Tag, Nacht, Wetter, Ereignisse

- Tag 360 s: Dämmerung ab 220 s, Nacht 250-320 s. Sicht = (1 - 0,3 x
  Dunkelheit) x (1 - 0,4 x Sturm); Flutlichter 0,08, Wärmebildoptik 0,18.
  Die Sicht verkürzt Turm- und Schützenreichweiten gleichermaßen.
- Schneesturm ab Welle 2: nach 100-220 s Ruhe zu 60 % für 40-80 s; baut sich
  mit 0,08/s auf und ab. Gegner im Sturm 15 % langsamer.
- Zufallsereignisse alle 70-130 s ab Sekunde 150: Versorgungsabwurf (Kiste
  zum Anklicken), Kältewelle (45 s), Erzader, Händler (30 s Bedenkzeit),
  Plündertrupp (nur zwischen Wellen, ab Welle 2), Polarlicht (60 s, nur mit
  Labor), Generatorausfall (30 s, nur mit Generator), Überlebende.
- Erkundung vom HQ: 40 Nahrung + 15 Treibstoff, 50 s, 15 % Hinterhalt, sonst
  Ressourcen (wächst mit der Welle).

## Speichern und Statistik

- Automatisch (alle 30 s, nach jeder Welle, beim Verlassen) und von Hand
  (Menü: Speichern/Laden/Neu), versioniert über `lib/storage/local-store`.
- Gemeinsame Statistik: begonnene Spiele, Niederlagen, Spielzeit. Eigene
  Karte: höchste Welle, überstandene Wellen, besiegte Gegner und Bosse,
  gebaute Anlagen, gefallene Festungen.

## Erkundung

- Kosten 40 Nahrung, 15 Treibstoff; dauert 50 s; 15 % Hinterhalt (nichts).
  Sonst Holz 60-140, Eisen 40-100, Stein 40-100, Energie 0-40, Nahrung
  20-60, Treibstoff 10-40, je gestarteter Welle +8 %, bis zur Lagergrenze.
- Haken „Automatisch erneut aussenden“: Der Trupp zieht wieder los, sobald
  er zurück ist und der Preis bezahlbar ist (sonst wartet er darauf). Die
  Wahl wird im Spielstand gespeichert.

## Freies Bauen

- Einstellung „Spielmodus“: Wellen (Standard) oder Freies Bauen. Gilt sofort,
  auch in der laufenden Partie; wird nicht im Spielstand gespeichert.
- Freies Bauen: Der Countdown steht, es kommen keine Wellen und keine
  Plündertrupp-Überfälle von selbst. „Welle jetzt rufen“ schickt die nächste
  Welle (ohne Früh-Bonus).
- Rechte Leiste: Gegnergruppen rufen - 6 Plünderer, 5 Soldaten, 3 Schwere
  Soldaten, 3 Sprengkommandos, 2 Belagerungsfahrzeuge oder 1 Frostkoloss, aus
  einem zufälligen Tor, so stark wie die Gegner der aktuellen Welle.
- Verbündete rufen: je 5 Soldaten, kostenlos, höchstens 60. Sie bewachen das
  Hauptquartier (Umkreis 10 Felder) wie Kasernen-Soldaten ihre Kaserne und
  haben deren Werte mit der HQ-Stufe.

## Cheat

- Knopf „Cheat-Modus“ oben bei den anderen Knöpfen, an- und abschaltbar.
- An: alle Forschung erledigt, alle Gebäude ohne Hauptquartier-Stufe
  baubar, keine Stufengrenze durch das Hauptquartier, alle Lager stehen
  dauerhaft auf 99999 (angezeigt als ∞), keine Bauzeiten (Baustellen und
  Ausbauten sind sofort fertig, ohne Bautrupp-Grenze), zusätzlich Tempo 10x
  und 100x.
- Bei 100x rechnet ein Bild höchstens 12 ms; wird es zu viel, läuft das
  Spiel etwas langsamer statt zu ruckeln.
- Aus: Lager fallen auf ihre Grenze zurück, die Forschung bleibt, 10x und
  100x verschwinden. Wird mit Cheat gespielt, zählt die Partie für keine
  Bestwerte (Spielzeit und Spielanzahl zählen weiter).

## Balance

Geprüft mit einer Headless-Simulation der Engine (Bots ohne Oberfläche,
Seeds 1, 7, 42, 99, 123; nicht im Repo):

- **Bot ohne Bau:** fällt in Welle 1 - ein ungeschütztes HQ hält nicht.
- **Einfacher Bot** (je 2 Holzfäller und Minen, 1 Generator, 4 MG-Türme um
  das HQ plus je ein MG bei abgelegenen Minen/Holzfällern, repariert, aber
  kein Ausbau und keine Forschung): fällt in Welle 9, 10, 7, 5 und 8 - die
  ersten Wellen sind machbar, ohne Ausbau ist früh Schluss (der Boss in
  Welle 5 ist die erste Hürde).
- **Wachsender Bot** (baut nach und nach alle Gebäude und Türme, baut aus,
  forscht, schickt Erkundungen): erreicht Welle 16 bis 35, dann wird es zu
  viel - ab Welle 10 wachsen die Gegner zusätzlich um 4 % je Welle.

## Test-Abkürzungen

Nur über die Adresse, nirgends verlinkt: `?ff=night,storm,rich,tech,fast,wave8`
(Nacht, Sturm, volle Lager, alle Forschung, erste Welle in 8 s, Start in
Welle 8). Übersprungene Wellen zählen nicht in der Statistik.
