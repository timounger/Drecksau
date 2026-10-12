# Scotland Yard - Spezifikation

Brettspiel von Ravensburger, Neuauflage 2024 ("Auf der Jagd nach Mister X",
Autor: Projekt Team III). 2 bis 6 Personen: eine Person ist Mister X, die
anderen jagen ihn als Detektive.

Quelle: die deutschen Anleitungen der Ausgabe 2024 (Standardspiel 240658 und
Einsteigerspiel 240662) in `game_instructions/ScotlandYard/`. Der Spielplan
(Stationen und Linien) stammt aus dem offenen Datensatz
[AlexElvers/scotland-yard-data](https://github.com/AlexElvers/scotland-yard-data)
und stimmt mit den Beispielen der Anleitung überein (Station 165 und 100, die
Fähre 108-115-157-194). Wo etwas gelesen statt gefunden werden musste, steht
es unter [Was die Anleitung offen lässt](#was-die-anleitung-offen-lässt).

## Der Kern

Mister X flieht durch London. Er zieht **verdeckt**: Er notiert seine neue
Station und deckt sie mit dem Ticket ab, das er benutzt hat. Die Detektive
wissen also, **womit** er gefahren ist, aber nicht **wohin**. Nur nach
bestimmten Zügen zeigt er sich.

Eine Runde: erst zieht Mister X, dann ziehen die Detektive und Bobbys.

## Der Spielplan

199 nummerierte Stationen, verbunden durch vier Arten von Linien:

| Linie       | Farbe   | Verbindungen | Wer                     |
| ----------- | ------- | ------------ | ----------------------- |
| Taxi        | gelb    | 346          | alle                    |
| Bus         | türkis  | 99           | alle                    |
| Underground | rot     | 20           | alle                    |
| Fähre       | schwarz | 3            | nur Mister X, mit Black |

Jede Station zeigt mit ihren Farben, welche Verkehrsmittel dort halten - Taxi
hält überall. Mit einem Ticket fährt man entlang der Linie bis zur **nächsten
Haltestelle** desselben Verkehrsmittels, nicht weiter.

## Material

| Was                 | Anzahl                              |
| ------------------- | ----------------------------------- |
| Taxi-Tickets        | 57                                  |
| Bus-Tickets         | 45                                  |
| Underground-Tickets | 23                                  |
| Black-Tickets       | 5 (Mister X)                        |
| Doppelzug-Tickets   | 2 für Mister X (3 in der Schachtel) |
| Startkarten         | 16 für Detektive, 13 für Mister X   |
| Detektive           | William, Shin, Oscar, James, Noah   |

Startkarten der Detektive: 13, 26, 29, 34, 50, 53, 91, 94, 103, 112, 117,
123, 138, 141, 155, 174. Startkarten von Mister X: 35, 45, 51, 71, 78, 104,
106, 127, 132, 146, 166, 170, 172.

## Vorbereitung

- Jeder Detektiv bekommt **11 Taxi-, 8 Bus- und 4 Underground-Tickets**, offen
  vor sich. Der Rest ist der **allgemeine Vorrat**.
- Mister X bekommt **5 Black-Tickets und 2 Doppelzüge**.
- Bis 4 Spielern helfen **Bobbys** (übrige Figuren mit Ring):

| Spieler | Detektive                | Bobbys |
| ------- | ------------------------ | ------ |
| 2       | 2 (ein Spieler spielt 2) | 2      |
| 3       | 2                        | 2      |
| 4       | 3                        | 1      |
| 5       | 4                        | 0      |
| 6       | 5                        | 0      |

- Jeder Detektiv und Bobby zieht eine zufällige D-Startkarte und stellt sich
  dorthin. Mister X zieht eine X-Startkarte und schaut sie geheim an - er
  stellt seine Figur **nicht** auf.

## Die Züge von Mister X

- **Normaler Zug:** zu einer Station, die direkt über eine Linie verbunden ist.
  Das Ticket nimmt er aus dem allgemeinen Vorrat.
- **Black-Ticket:** statt eines normalen Tickets - jedes Verkehrsmittel, auch
  die Fähre. Die Detektive sehen nicht, womit er gefahren ist.
- **Doppelzug:** zwei Züge direkt nacheinander, auch mit Black-Tickets.
  Höchstens einer pro Runde; das Ticket ist danach aus dem Spiel.
- **Auftauchen:** nach seinem **3., 8., 13., 18. und 24. Zug** stellt er seine
  Figur auf seine Station. Beim nächsten Zug nimmt er sie wieder weg. Bei
  einem Doppelzug kann er nach dem ersten Zug auftauchen und gleich wieder
  verschwinden.
- Er darf nie auf eine Station mit einem Detektiv oder Bobby ziehen, auch nicht
  im Doppelzug.

## Die Züge der Detektive und Bobbys

- Sie stimmen sich ab und ziehen nacheinander.
- Ein Detektiv gibt das Ticket in den **allgemeinen Vorrat** - aus dem Mister X
  fährt. Bobbys brauchen keine Tickets.
- Nur Verkehrsmittel, von denen noch Tickets da sind; Tauschen ist verboten.
- Wer ziehen kann, muss ziehen. Wer nicht kann, setzt aus.
- Auf jeder Station steht höchstens eine Figur.

## Ende

- **Die Detektive gewinnen**, sobald ein Detektiv oder Bobby auf der Station von
  Mister X steht.
- **Mister X gewinnt**, wenn er am Ende der **22. Runde** noch frei ist - die
  Runde endet erst nach den Detektiven.
- Das Spiel endet auch, wenn **kein Detektiv** mehr ziehen kann.

## Einsteigerspiel

Die vereinfachte Fassung für 4 bis 5 Personen (Mister X und 3 bis 4
Detektive):

- **13 Runden**, **ohne Underground**, ohne Tickets und ohne Bobbys.
- Mister X startet sichtbar auf **82**, die Detektive auf **41, 46, 124** und
  mit einem vierten Detektiv auch auf **142**.
- Mister X ist **sichtbar** und taucht nur beim **3., 8. und 13. Zug** ab.
- Er hat **1 Black-Ticket** (ein weiterer verdeckter Zug) und **1 Doppelzug**.
- Die Detektive gewinnen auch, wenn Mister X keine freie Station mehr hat.

## Was die Anleitung offen lässt

- **22 Runden, 24 Felder.** Die Anleitung spricht von 22 Runden, die
  Fahrtentafel hat 24 Felder mit eingekreisten Zahlen bei 3, 8, 13, 18 und 24.
  Das passt: Mit zwei Doppelzügen macht Mister X in 22 Runden bis zu 24 Züge.
  Das Auftauchen hängt an der **Nummer des Zuges**, nicht der Runde.
- **Mister X ohne freie Station.** Das Standardspiel sagt es nicht, das
  Einsteigerspiel schon: Dann gewinnen die Detektive. Das gilt hier für beide.
- **Vorrat leer.** Mister X nimmt seine Tickets aus dem Vorrat. Ist eine Sorte
  gerade leer, kann er dieses Verkehrsmittel nicht nehmen - außer mit Black.
  In der Praxis kommt das kaum vor, weil die Detektive laufend nachfüllen.
- **Black im Einsteigerspiel.** Ohne Tickets im Einsteigerspiel heißt "Black"
  dort nur: Dieser Zug ist verdeckt, und das Verkehrsmittel bleibt unbekannt.
  Gefahren wird weiter nur mit Taxi und Bus.
- **Kein Detektiv kann ziehen.** Bobbys zählen mit: Solange ein Bobby ziehen
  kann, geht die Jagd weiter.

## Unterschiede zum Brettspiel

- **Feste Reihenfolge der Detektive.** Am Tisch ziehen sie in beliebiger
  Reihenfolge. Hier ziehen sie der Reihe nach - so ist online immer eindeutig,
  wer am Zug ist.
- **Gegen den Computer** spielt man eine Seite ganz: Mister X gegen die
  Computer-Detektive, oder alle Detektive gegen einen Computer-Mister X. Die
  Spielerzahl legt trotzdem fest, wie viele Figuren mitspielen.
- **Online** kann der Computer Mister X spielen; dann reicht schon ein Mensch.
- **Hilfe "Mögliche Verstecke"** (abschaltbar): markiert jede Station, auf der
  Mister X nach seinen Tickets stehen kann - die Rechnung, die man am Tisch im
  Kopf macht.
