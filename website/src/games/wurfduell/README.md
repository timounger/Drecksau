# Wurfduell

Zwei Figuren stehen sich gegenüber und bewerfen sich abwechselnd. Ausweichen
gibt es nicht - es zählt nur, wer besser zielt. Wessen Lebensbalken zuerst leer
ist, der ist k.o.

Ein eigenständiges Spiel dieser Sammlung; Figuren, Gegenstände und Grafik sind
alle selbst gezeichnet (Canvas, keine Bilddateien außer dem Cover-Logo, das aus
denselben Zeichenfunktionen erzeugt wurde).

## Einstieg

`/wurfduell` startet direkt gegen den Computer: Figur wählen, dann geht die
Partie los. Die Schwierigkeit steht in den Einstellungen. Auf der Figurenwahl
zeigen die Karten nur Bild, Name, Spruch, Wurf und LP; die Fähigkeiten öffnen
sich beim Drüberfahren (am Handy: erstes Antippen). Online geht es nur über den Knopf
„Online spielen" im Kopf nach `/wurfduell/online` (zufälliger Gegner oder
privater Raum) - wie bei den anderen Online-Spielen.

## Bedienung

- **Maus:** Ein gestrichelter Pfeil an der Hand zeigt zur Maus - das ist der
  Winkel. Drücken und halten lädt die Kraft: Der Balken neben der Figur füllt
  sich in 1,1 s bis 100 % und **pendelt dann wieder herunter** (kein Stehenbleiben
  bei 100 %, sonst wäre jeder Wurf ein Vollwurf). Loslassen wirft.
- **Touch:** Tippen setzt die Richtung, Finger liegen lassen lädt, Loslassen
  wirft. Der rote Knopf unter dem Feld geht genauso (halten/loslassen).
- **Tastatur:** Pfeil hoch/runter = Winkel (mit Umschalt in 5er-Schritten),
  Leertaste halten = laden, loslassen = werfen, 1 bis 3 = Fähigkeit.

Beim Laden zeigen Punkte den Anfang der Bahn, **ohne Wind**.

## Figuren, Wurf und Fähigkeiten

Jede Figur wirft immer ihren eigenen Gegenstand und hat drei Fähigkeiten, je
**einmal pro Partie**. Eine Fähigkeit wird vor dem Wurf angetippt und gilt für
genau diesen Wurf; pro Wurf höchstens eine. Der Zug endet also immer mit einem
Wurf.

| Figur             | LP  | Wirft (Schaden) | Fähigkeiten                                                                                    |
| ----------------- | --- | --------------- | ---------------------------------------------------------------------------------------------- |
| Koch Kuno         | 100 | Tomate (18)     | Pfanne (32), Scharfe Soße (2x 10 Brand), Stärkung (+20)                                        |
| Gärtnerin Gerda   | 95  | Blumentopf (20) | Riesenkürbis (32), Rankenfalle (max. 70 % Kraft), Kräutertee (+25)                             |
| Pirat Pit         | 85  | Kokosnuss (19)  | Kanonenkugel (30, schnell, kein Wind), Fernrohr (ganze Bahn), Rum (+30, Wurf wackelt)          |
| Ritter Rolf       | 115 | Apfel (18)      | Schild (nächster Treffer halb), Apfelhagel (3 x 14), Lanze (26, flach und schnell)             |
| Bäckerin Berta    | 120 | Sahnetorte (19) | Hochzeitstorte (30, riesig), Mehlwolke (Gegner ohne Zielhilfe und Wind), Brezel-Salve (3 x 12) |
| Schneemann Frosti | 110 | Schneeball (17) | Eisblock (Gegner setzt aus), Lawinenball (32), Windstille                                      |
| Robo RX-8         | 90  | Schraube (18)   | Zielcomputer (wahre Bahn mit Wind), Magnet (22, wird angezogen), Doppelwurf                    |
| Dino Dora         | 115 | Knochen (19)    | Brüllen (Gegnerwurf wackelt), Riesenknochen (32), Abpraller                                    |

Kopftreffer kosten das 1,5-Fache. Die Zahlen stehen in
[engine/characters.ts](engine/characters.ts), die Regeln der Fähigkeiten in
[engine/game.ts](engine/game.ts) (`resolveThrow`).

## Feld und Kamera

Kein Hindernis mehr; die Figuren stehen 20 m auseinander (Welt 2400 Einheiten
breit, 100 Einheiten = 1 m), der Bildausschnitt ist 1000 breit - beim Zielen ist
der Gegner nicht im Bild. Die Kamera (`stepCamera` in
[hooks/use-arena.ts](hooks/use-arena.ts)):

1. steht beim Zielen beim Werfer, etwas nach vorn versetzt;
2. folgt dem Gegenstand weich durch die Luft (auch nach oben, wenn er hoch
   fliegt);
3. bleibt nach dem Aufprall kurz auf der Landestelle (Treffer, Schadenszahl,
   Balken, Reaktion der Figur);
4. schwenkt dann ruhig zum nächsten Werfer. Erst wenn sie dort ist, gilt der
   Wurf als abgeschlossen - so wartet auch der Computer.

Sie hängt nur am Spielzustand, also fahren beide Bildschirme online denselben
Weg. Ein Pfeil am Rand zeigt Figuren außerhalb des Bilds mit Entfernung.
Distanzschilder alle 4 m und Windfahnen entlang der Strecke. Auf einem
hochkant gehaltenen Handy ist das Bild höher (1000 x 900). In den Einstellungen
gibt es statt "Folgen" die "Übersicht" über das ganze Feld.

## Einstellungen

`/wurfduell/einstellungen` (Knopf im Kopf, wie bei den anderen Spielen):
Computer-Gegner (leicht/mittel/schwer), Ton, Kamera (Folgen/Übersicht),
Zielhilfe-Punkte. Alles wird gemerkt.

## Spielende

Statt Pokal und Haufen eine Endszene mit beiden Figuren groß nebeneinander: der
Gewinner hüpft mit Armen hoch unter Konfetti, der Verlierer liegt k.o. mit
Sternen und Vögelchen, bekleckert und mit den Wurfgeschossen um sich. Darunter
Revanche / Andere Figur (online: Revanche / Raum verlassen).

## Lebenspunkte

Balken statt Herzen: grün über gelb nach rot, mit weißem Nachlauf-Balken nach
einem Treffer und aufsteigender Schadenszahl. Unter dem Balken stehen die
wirkenden Effekte (Schild, Brand, eingefroren, wackelig, gefesselt, Mehl).

## Aufbau des Spielmoduls

```text
games/wurfduell/
  engine/       reine Regeln und Physik, ohne DOM
    types.ts          Zustand, Züge, Figuren, Gegenstände, Fähigkeiten
    characters.ts     acht Figuren, Gegenstände, 24 Fähigkeiten (Balance-Tabelle)
    arena.ts          Feldmaße (2400 breit), Trefferzonen, Wind
    physics.ts        Flugbahn Schritt für Schritt (120 Schritte/s), Treffer
    game.ts           Reducer: Figurenwahl, Wurf mit Fähigkeit, Aufgabe, Revanche
    ai.ts             Computergegner mit Streuung je Stufe und Fähigkeitswahl
    random.ts         Mulberry32, zustandslos aus Seed + Zähler
    serialization.ts  Prüfungen für alles, was übers Netz kommt
  components/   Canvas-Zeichnungen (Figuren, Gegenstände, Szene, Effekte) und React
  hooks/        use-arena (Animationsschleife, Wiederholung jedes Wurfs, Zielen
                und Kraft laden), use-wurfduell (Partie gegen den Computer)
  multiplayer/  Adapter für die gemeinsame Online-Schicht (src/online)
  stats/        eigene Wurf-Statistik
  settings/     Ton, Stufe, zuletzt gewählte Figur
  audio/        synthetisierte Geräusche (WebAudio, keine Dateien)
  i18n/         deutsche Texte und Regeln
```

**Ein Wurf ist deterministisch.** Übers Netz geht nur
`{ kind: "throw", angle, power, ability }`. `applyMove` wendet Heilung, Wackeln
(aus dem Seed), Windstille usw. an, fliegt den Wurf und schreibt das Ergebnis in
`lastThrow` (tatsächlicher Winkel/Kraft, Schaden, Schild, Heilung, Brand,
Einfrieren). Jeder Bildschirm fliegt denselben Wurf über `flightOf` noch einmal
für die Animation; die Balken fallen genau beim Aufprall.

## Online

Läuft über `useOnlineRoom` (Host entscheidet, Gäste senden Absichten):

- **Die Partie gilt für den Raum nie als beendet** (`isFinished` ist immer
  `false`): Die Revanche ist ein Zug im Spiel. Beide drücken „Revanche", die
  Engine startet die nächste Partie mit neuem Seed, wechselndem Anfänger und
  mitgezähltem Stand.
- **Zeitlimit:** 25 Sekunden pro Zug, danach ein schwacher Wurf ohne
  Fähigkeit (`WEAK_THROW`), bei der Figurenwahl eine zufällige Figur.
- **Verbindungsabbruch:** Der Computer übernimmt den Platz mit genau diesen
  schwachen Würfen, bis der Spieler zurück ist.
- **Aufgabe:** jederzeit über „Aufgeben".

## Statistik

Geteilt: Partien gegen den Computer und online (Siege, Niederlagen,
Spielzeit). Eigene Karte: Würfe, Treffer-Quote, Kopftreffer, Siege ohne
LP-Verlust, Lieblingsfigur, eingesetzte Fähigkeiten und die liebste Fähigkeit.
