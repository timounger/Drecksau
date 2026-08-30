# Arschloch

Ein Skatblatt, alle Karten verteilt, und alle wollen sie als Erste loswerden.
Wer zuerst leer ist, ist Präsident; wer als Letzter noch Karten hält, ist das
Arschloch und muss in der nächsten Runde seine besten Karten abgeben.

## Spielen

- Gegen den Computer: `/arschloch`
- Online: `/arschloch/online`
- Einstellungen: Spielerzahl (3 bis 6) und Rundenzahl (3, 5, 7 oder 10)

## Warum 7-8-9-Bube-Dame-König-10-Ass

Die Vorlage nennt für ein Skatblatt zwei Reihenfolgen. Genommen ist die erste,
die auch das Skatspiel selbst benutzt: **Die Zehn steht zwischen König und
Ass.** Das ist die Stelle, an der jeder Tisch einmal stutzt, und genau deshalb
ist die Stärke im Code eine eigene Skala (`RANKS`, `strengthOf`) und nicht
etwas, was man einer Karte ansieht.

Die Farbe entscheidet nie etwas. Sie steht auf der Karte, damit man zwei Damen
auseinanderhalten kann - mehr nicht.

## Zwei Siebenen bleiben im Karton

„Die Kartenanzahl muss ein Vielfaches der Spieleranzahl sein." 32 geht durch 4,
sonst durch keine Tischgröße dieses Spiels. Zu dritt, zu fünft und zu sechst
bleiben deshalb **Karo 7 und Herz 7** liegen, und 30 Karten gehen durch 3, 5 und
6 auf.

Welche zwei, ist aufgeschrieben (`SET_ASIDE`) und nicht ausgewürfelt: Wer die
Siebenen zählt, soll jedes Mal dieselben zwei vermissen.

## Der Kartentausch ist zwei Sachen, nicht eine

Das Abgeben ist keine Entscheidung: Das Arschloch gibt seine **zwei besten**
Karten ab, das Vizearschloch seine beste. Das erledigt der Schiedsrichter selbst,
sobald ausgeteilt ist.

Das Zurückgeben ist eine Entscheidung, also ein Zug: Präsident und Vize suchen
aus, was zurückwandert - und suchen sich naturgemäß den Müll aus. Genau darin
liegt die Härte des Spiels, und genau deshalb sind es im Code zwei getrennte
Schritte (`takeTribute` und der Zug `give`).

## Der Stich, der niemandem gehörte

Ein Fehler aus dem Selbstspiel, und ein lehrreicher: Wer seine letzte Karte legt
und damit den Stich gewinnt, ist raus - der Stich gehört ihm trotzdem. Wer
spielt dann aus?

Die erste Fassung suchte den nächsten Mitspieler, während noch alle Pässe des
alten Stichs eingetragen waren. Damit galt jeder als „nicht mehr im Stich", die
Suche fand niemanden und fiel auf den Ausgangswert zurück - ausgerechnet auf den
gerade fertig gewordenen Spieler. Der war am Zug, hatte keine Karten, und die
Partie stand.

Jetzt werden erst die Pässe gelöscht und dann der Ausspieler gesucht: Wer noch
mitspielt, ist eine Frage an den **neuen** Stich, nicht an den alten.

## Punkte statt Titel-Tabelle

Pro Runde gibt es einen Punkt für jede Person, die man hinter sich lässt. Das
skaliert von selbst auf jede Tischgröße - eine gedruckte Tabelle „Präsident 3,
Vize 2, ..." müsste für drei, fünf und sechs je eine eigene Zeile haben und wäre
eine zweite Skala neben den Titeln, die dasselbe sagt.

## Online

Alles liegt offen außer den Händen: Der öffentliche Schnappschuss ersetzt jede
fremde Karte durch eine Platzhalterkarte (`FACE_DOWN`), deren Id `"verdeckt"`
heißt - so bleibt die **Anzahl** sichtbar, und das ist die eine Zahl, auf die
am Tisch alle schauen. Einen Nachziehstapel gibt es nicht, also bleibt der
Wirts-Tresor leer.

Der Zug „Nächste Runde" ist der einzige, der keinem Sitz gehört: Die Runde ist
vorbei, niemand ist im Wortsinn am Zug, und wer zuerst nach den Karten greift,
darf geben.

## Aufbau

| Datei                     | Verantwortung                              |
| ------------------------- | ------------------------------------------ |
| `engine/cards.ts`         | Das Skatblatt und was was schlägt          |
| `engine/state.ts`         | Zustand, Züge, Titel, Punkte               |
| `engine/setup.ts`         | Mischen, Geben, Blattgröße je Tisch        |
| `engine/moves.ts`         | Der Schiedsrichter                         |
| `engine/ai.ts`            | Die Computergegner                         |
| `engine/serialization.ts` | Prüfung für Spielstände und Züge           |
| `components/`             | Tisch, Hand, Spielbildschirm, Online       |
| `multiplayer/adapter.ts`  | Anschluss an die gemeinsame Online-Schicht |

## Was das Selbstspiel geprüft hat

80 Partien, von drei bis sechs Spielern, alle beendet: 151 bis 267 Züge je
Partie. Keine Karte doppelt, keine Karte verschwunden, kein Stapel mit
gemischten Werten, jede Runde mit vollständigen Titeln - und danach ein Sieger.
