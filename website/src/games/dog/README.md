# Dog

Figuren vom Zwinger einmal rund ums Brett und ins Ziel - bewegt aber nicht mit
Würfeln, sondern mit Karten. Zu viert und zu sechst ist es ein Partnerspiel:
Gewonnen hat erst, wer **alle acht** Figuren des Teams im Ziel hat. Zu zweit, zu
dritt und zu fünft spielt jeder für sich, mit fünf Figuren und vier Zielfeldern.

## Spielen

- Gegen den Computer: `/dog`
- Online zu zweit bis zu sechst: `/dog/online`
- Einstellungen: die Spielerzahl (2 bis 6) und der eigene Name

## Der Tisch ist eine Zahl, kein Konstantenblock

Das Brett wächst mit der Spielerzahl: **sechzehn Felder je Farbe**, also 64 zu
viert, 96 zu sechst, 48 zu dritt. Deshalb ist die Ringlänge in
`engine/board.ts` eine Funktion (`ringSize`) und keine Konstante, und alles, was
auf dem Ring rechnet, bekommt sie mitgereicht. Das ist die Sorte Umbau, die man
einmal macht und danach nie wieder: Eine Konstante `RING` an vierzig Stellen
wäre bei der ersten Sechser-Partie vierzigmal falsch gewesen.

Das Startfeld einer Farbe ist das erste ihrer sechzehn - und damit gleichzeitig
die Abzweigung ins Ziel. Deshalb steht es als **eine** Funktion da
(`startField`) und nicht als zwei: Ein Brett, auf dem Einstieg und Abzweig
auseinanderfallen könnten, wäre ein Brett mit einem Fehler darin.

## Zwei Spiele in einer Anleitung

Die Anleitung beschreibt zwei Spiele, und `teamPlay(seats)` ist die Stelle, an
der sie auseinandergehen:

|                   | zu viert und zu sechst     | zu zweit, zu dritt, zu fünft                |
| ----------------- | -------------------------- | ------------------------------------------- |
| Figuren je Farbe  | 4                          | 5, eine davon steht schon auf dem Startfeld |
| Partner           | gegenüber                  | keiner                                      |
| Karte schieben an | den Partner                | den linken Nachbarn                         |
| kann nicht ziehen | Hand ablegen, Runde vorbei | eine Karte abwerfen, eine nachziehen        |
| gewonnen bei      | acht Figuren im Ziel       | vier Figuren im Ziel                        |

Jede dieser Zeilen ist genau eine Funktion in `engine/board.ts`
(`piecesPerSeat`, `partnerOf`, `giftSeat`, `piecesToWin`) - und der
Schiedsrichter fragt sie, statt die Spielerzahl selbst zu kennen.

Der Kartentausch bei einer toten Hand ist die einzige Regel mit einem
Gedächtnis: Der **erste** Tausch eines Zuges zieht eine Karte nach, der zweite
nicht. Das steht als `redrew` im Spielstand, weil sonst reihum verschieden
große Hände entstünden.

Die eine Stelle, an der das Rechnen nicht naiv sein darf, ist `forwardGap`:
Der Abstand von einem Feld zu sich selbst ist **eine ganze Runde**, nicht null.
Damit fällt die Regel „aus dem Ziel wird nie direkt vom eigenen Startfeld
eingebogen" von selbst heraus, statt als Sonderfall irgendwo zu stehen - eine
Figur auf ihrem Startfeld ist 64 Schritte von der Abzweigung entfernt, und so
weit reicht keine Karte.

## Eine Karte ist eine Zeile, kein Sonderfall

`engine/cards.ts` hält für jeden Wert eine Zeile: wie viele Schritte, ob sie aus
dem Zwinger holt, ob sie rückwärts darf, ob sie sich aufteilt, ob sie tauscht,
ob sie alles sein darf. Der Schiedsrichter fragt die Tabelle; er weiß nicht,
dass ein Ass etwas Besonderes ist.

Das Blatt ist das der Vorlage: acht von jedem der dreizehn Werte plus sechs
Joker, zusammen 110 Karten. Ausgeteilt wird 6, 5, 4, 3, 2 - und dann wieder von
vorn. Nachgezogen wird nie; was gespielt ist, ist weg.

## Alles ist derselbe Lauf

Ziehen, Schlagen, Verbrennen, Blockieren und Einbiegen sind in `engine/moves.ts`
**ein** Schleifendurchlauf über die Felder. Auf jedem Feld dieselben drei
Fragen: Steht da jemand auf seinem eigenen Startfeld (dann ist Schluss), ist das
mein eigenes Startfeld (dann darf ich abbiegen), und steht am Ende jemand (dann
geht der zurück). Vier Regeln, eine Schleife - der Alternativentwurf mit einem
Sonderfall je Regel hätte an vier Stellen dieselbe Zählung gehabt.

Geschützt ist genau ein Feld: das eigene Startfeld, solange die eigene Farbe
darauf steht (`isOnGuard`). Es blockiert, es kann nicht geschlagen und nicht
getauscht werden - auch nicht von der eigenen Seite.

## Die Sieben ist ein Plan, kein Zug

Sieben Punkte, beliebig auf eigene Figuren verteilt, und alles Überholte
verbrennt. Für den Spieler heißt das: Er baut den Zug Stück für Stück auf, und
`sevenChoices` beantwortet die einzige Frage, die dabei zählt - **was lässt
sich danach noch vollständig ausgeben**. Eine Teilung, die den Rest der sieben
Punkte nicht mehr loswird, wird gar nicht erst angeboten, denn die Karte muss
komplett ausgeführt werden.

Für den Computer werden fertige Pläne aufgezählt, mit zwei Vorsichtsmaßnahmen:
Die Suche hört bei einer Obergrenze auf, und sie probiert **große Teile zuerst**.
Sonst sind die ersten vierhundert Pläne alle „sieben Mal ein Feld", und das ist
der Zug, den kein Mensch spielen würde.

Der Partner darf mitziehen, aber erst als zweiter Topf (`sevenPools`): Erst
wenn die eigene Farbe die sieben Punkte nicht unterbringt, sind seine Figuren
dran - genau der Satz aus der Anleitung, nicht mehr.

## Der Zug wird gebaut, nicht eingetippt

Die Bedienung in `components/dog-play.tsx` stellt immer dieselben drei Fragen in
derselben Reihenfolge: welche Karte, welche Figur, und - nur wenn es mehr als
eine gibt - was sie tut. Die Listen kommen aus dem Schiedsrichter, also ist
jeder Knopf, den es gibt, ein Zug, der funktioniert. Das ist hier mehr wert als
sonst: Die Regeln zum Startfeld, zum Ziel und zur Sieben sind genau die, die
man am Tisch vergisst.

Der Joker fragt zuerst, was er sein soll, und spielt danach die Karte, die er
geworden ist - eine Auswahl, kein zweiter Regelzweig.

## Das Brett ist dem gedruckten nachgebaut

Der Dog-Plan ist aufgebaut wie Mensch ärgere dich nicht: Die Laufbahn ist ein
**Stern mit einem Arm je Farbe**. Ein Arm läuft nach außen zur Brettkante,
quer über seine Spitze und wieder nach innen; zwischen zwei Armen sackt die
Bahn Richtung Mitte durch. In der Mitte jedes Arms hängen die vier Zielfelder
dieser Farbe an der Spitze, der Zwinger liegt außen daneben, und in den vier
Ecken des quadratischen Bretts sitzt das DOG-Logo. Vorne vier Farben, hinten
sechs - beides zeichnet `components/dog-board.tsx` aus demselben Stern.

Die ganze Geometrie sind **drei Punkte je Farbe**: die nahe Spitzenecke (das
Startfeld), die ferne Spitzenecke und das Tal auf halbem Weg zur nächsten
Farbe. Vor dem Runden wird jede Gerade gedrittelt, damit die Kurven nur die
Ecken abrunden und die Geraden gerade bleiben.

Die Felder liegen dann nach **Bogenlänge** auf diesem Umriss, nicht nach
Winkel: Er wird fein abgetastet, vermessen und in gleich lange Stücke
geschnitten. Nur so ist das Abzählen von fünf Feldern auf der Geraden dieselbe
Arbeit wie um die Ecke - und weil jede Farbe denselben Abschnitt hat, landet
ihr erstes Feld exakt auf ihrer eigenen Spitze.

Die vier Farben behalten ihren Ton in beiden Themes. Ein Brett ist etwas
Gedrucktes; das Thema trägt die Seite drumherum.

## Der Computer rechnet ein Brett aus, keinen Baum

`engine/ai.ts` spielt jeden legalen Zug einen Halbzug weit aus und bewertet das
Brett: wie weit die eigene Seite gekommen ist, wie weit die anderen, und was die
Karte wert war, die es gekostet hat. Wer die eigene Seite ist, hängt am Tisch -
im Teamspiel der Partner, sonst nur man selbst.

**Nachgedacht wird nicht.** `botWaitMs` ist null: Am Tisch denkt jemand nach,
auf dem Schirm ist eine Denkpause nur Wartezeit für den Menschen davor. Der letzte Posten ist der, der die Bots
wie Spieler wirken lässt - ein Joker für zwei Felder ist ein Joker weniger, und
eine Startkarte, die bei vollem Zwinger liegen bleibt, ist eine verschenkte
Karte.

Beim Schieben an den Partner gibt es genau eine Aussage, die die Regeln
zulassen: Wer keine Figur draußen hat, braucht eine Startkarte. Alles andere
ist „gib die Karte weg, die in der eigenen Hand am wenigsten wert ist".

## Online

`multiplayer/adapter.ts` hängt das Spiel an die gemeinsame Online-Schicht.
Geheim sind drei Dinge, und zwar auf drei verschiedene Arten:

- **Die Hände** gehören einem Platz und fahren auf dessen privatem Kanal; im
  öffentlichen Schnappschuss steht nur ihre Länge.
- **Der Reststapel** gehört niemandem - er ist die Zukunft und liegt deshalb im
  Host-Tresor (`vault`), nicht im Schnappschuss.
- **Die Karte an den Partner** liegt verdeckt auf dem Tisch: Sie wird aus dem
  Schnappschuss entfernt und kommt nur dem zurück, der sie geschoben hat.

Kartennummern verraten in diesem Spiel den Wert (die Nummern laufen beim
Mischen in Wertreihenfolge durch), deshalb wird eine verdeckte Karte durch eine
Karte mit der Nummer −1 ersetzt statt einfach gezählt.

Zwei bis sechs Plätze, und der Tisch wird wie bei den anderen Spielen der
Sammlung gesucht: Wunschgröße einstellen, und wenn sich nach kurzer Zeit nichts
findet, startet die Runde auch mit einer anderen Spielerzahl. Wer gegenübersitzt,
ist im Teamspiel der Partner - mehr Zuordnung braucht es nicht.

**Dreißig Sekunden je Zug.** Danach zieht der Computer für den Platz, der dran
ist; sonst wartet ein Tisch auf jemanden, der das Fenster zugeklappt hat.

## Aufbau

| Datei                       | Verantwortung                               |
| --------------------------- | ------------------------------------------- |
| `engine/board.ts`           | Ring, Zwinger, Ziele und das Rechnen darauf |
| `engine/cards.ts`           | das Blatt und was jeder Wert darf           |
| `engine/state.ts`           | der Spielstand und die Züge als Typen       |
| `engine/setup.ts`           | Austeilen, Runden, Mischen                  |
| `engine/moves.ts`           | der Schiedsrichter                          |
| `engine/ai.ts`              | die Mitspieler                              |
| `engine/serialization.ts`   | Prüfung von Spielstand und Zug              |
| `components/dog-board.tsx`  | das Brett                                   |
| `components/dog-play.tsx`   | Brett, Hand und Auswahl                     |
| `components/dog-game.tsx`   | der Bildschirm gegen den Computer           |
| `components/dog-online.tsx` | Eingang, Lobby und Tisch online             |
| `hooks/use-dog-game.ts`     | Sitzung, Statistik und wann die Bots ziehen |

## Was das Selbstspiel geprüft hat

Zwölf Partien je Tischgröße, alle Plätze vom Computer gespielt - und alle
kommen zu Ende:

| Tisch | Ring | Figuren je Farbe | auf dem Brett zu Beginn | Ø Runden | Tausch / Aussetzen |
| ----- | ---- | ---------------- | ----------------------- | -------- | ------------------ |
| 2     | 32   | 5                | 2                       | 12,8     | 306 / 0            |
| 3     | 48   | 5                | 3                       | 14,2     | 425 / 0            |
| 4     | 64   | 4                | 0                       | 20,3     | 0 / 243            |
| 5     | 80   | 5                | 5                       | 20,8     | 1187 / 0           |
| 6     | 96   | 4                | 0                       | 22,3     | 0 / 456            |

Die letzte Spalte ist die Probe auf die Sonderregel: Getauscht wird nur, wo
jeder für sich spielt, ausgesetzt nur im Teamspiel. Dazu einzeln geprüft: Der
erste Tausch eines Zuges lässt die Handgröße gleich und der Spieler bleibt am
Zug, der zweite macht die Hand um eine Karte kleiner und gibt den Zug weiter.

Und in der Vierer-Partie die Kartenarten: 1031-mal eine Figur aus dem Zwinger,
694 Tauschkarten, 374 Siebenen, 202-mal ein Bube ohne Wirkung.

Dazu die Regeln einzeln, gegen die Anleitung geprüft: über eine geschützte Figur
kommt niemand hinweg, auf sie auch nicht drauf; vom eigenen Startfeld geht es
nicht direkt ins Ziel, zwei Felder davor mit einer Drei aber schon; eine Sieben
quer über zwei fremde Figuren schickt beide zurück; der Bube tauscht weder mit
eigenen noch mit geschützten Figuren und wird ohne Ziel wirkungslos abgelegt.
