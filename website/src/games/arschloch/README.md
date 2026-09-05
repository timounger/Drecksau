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

## Die übrigen Karten gehen in die Mitte

Verteilt wird das ganze Blatt. Nur zu viert geht es auf; sonst bleiben Karten
übrig, und die bekommt **der mittlere Spieler** - der Bürger der Runde davor -
auf die Hand. Vor dem ersten Stich legt er genauso viele wieder verdeckt ab.

Das ist ein kleiner Trost für den Platz, der weder gewonnen noch verloren hat:
zwei Karten mehr gesehen, die zwei schlechtesten los. In der ersten Runde gibt
es noch keine Titel, dann bekommt sie der mittlere Stuhl (`middleSeat`) - ein
Platz, auf den jeder zeigen kann, solange es keine Rangfolge gibt.

Die abgelegten Karten sind aus der Runde raus und bleiben verdeckt. Für
`beatable` heißt das: Sie zählen als ungesehen, und die Rechnung bleibt damit
vorsichtig - sie sagt eher „könnte noch überboten werden" als umgekehrt.

## Der Kartentausch: wünschen statt abliefern

Der Präsident **wünscht sich** zwei Karten aus der Hand des Arschlochs, der Vize
eine aus der des Vizearschlochs - und bekommt diese Hand dafür gezeigt. Beide
geben danach genauso viele Karten zurück, ihrer Wahl.

Geschützt ist, was **dreimal oder öfter** da ist (`PROTECTED_COUNT`,
`wishableIds`). Ein Drilling ist in diesem Spiel keine Sammlung gleicher Karten,
sondern eine Waffe: Er zwingt den ganzen Tisch, zu dritt zu antworten. Eine
davon herauszunehmen würde nicht eine Karte kosten, sondern den Drilling.

Hat der Verlierer nichts Ungeschütztes, fällt der Tausch ganz aus - und mit ihm
die Rückgabe: Was zurückgeht, ist der Preis für das Gewünschte, und es kam
nichts.

Im Code sind das drei Schritte einer Liste (`owed`), die der Reihe nach
abgearbeitet wird: `drop`, dann je `wish` und `give`. Wer dran ist, steht in
`from` - beim Wunsch ist das der Gewinner, und `to` ist die Hand, aus der
gewählt wird.

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

## Gefragt wird nur, wer antworten könnte

Zwei Fälle, in denen die Frage „legen oder passen?" keine Frage ist - und beide
lassen sich **allein aus den gespielten Karten** ableiten:

1. **Zu wenige Karten.** Auf ein Paar kann niemand antworten, der eine einzelne
   Karte hält. Wie viele Karten jemand hält, steht ohnehin an seinem Platz.
2. **Unschlagbarer Stapel.** Vier Damen gibt es im Blatt; sind drei gespielt,
   existiert kein Damenpaar mehr. `beatable` zählt dafür die gesehenen Karten
   gegen das Blatt dieser Tischgröße - und schließt den Stich sofort.

Was der Schiedsrichter dabei **nicht** tut, ist in die Hände zu sehen. Er würde
sonst jemanden aus einem Grund überspringen, den die anderen nicht nachprüfen
können, und das Passen ist eine Information, die dem Tisch zusteht: Ob jemand
nicht kann oder nicht will, unterscheidet ein Pass gerade nicht.

Deshalb liegen die gespielten Karten als `seen` im Zustand - öffentlich, wie sie
in der Mitte lagen, als sie gespielt wurden. In 60 Selbstspiel-Partien sparte
das 329 Übersprungene und 601 vorzeitig geschlossene Stiche, bei 5945 echten
Fragen.

## Die Hand ist die Bedienung

Zwei Regeln stecken darin, und beide zeigt die Hand, statt sie zu erklären:

**Ausgegraut ist, was nicht geht** - und zwar aus beiden Gründen. Nicht nur die
zu niedrigen Karten, sondern auch die zu hohen, von denen zu wenige da sind:
Gegen ein Paar ist ein einzelner König so unspielbar wie eine Sieben. Das macht
`playableIds`, und es prüft beides, weil ein Bildschirm, der nur die niedrigen
Karten grau macht, die halbe Regel erzählt.

**Angetippt wird die Gruppe, nicht die Karte.** Liegt ein Paar, wählt ein Tipp
auf eine Dame beide Damen; ein zweiter Tipp legt sie wieder zurück. Einzeln
wählen ginge sowieso nicht - die Anzahl gibt der Tisch vor. Welche zwei von drei
Assen mitkommen, ist keine Entscheidung (die Farbe schlägt nie etwas), also
nimmt das Spiel ein Fenster benachbarter Karten: Was sich hebt, liegt
nebeneinander.

Wer **ausspielt**, tippt wieder einzeln - dort ist die Anzahl ja gerade die
Entscheidung. Und beim Zurückgeben nach dem Kartentausch wird gar nichts
ausgegraut: Da darf alles zurück, und es muss nicht zusammenpassen.

## Eine Auswahl gehört zu einer Lage

Der Bildschirm hielt fest, was man angeklickt hatte - auch dann noch, wenn die
Lage längst eine andere war. Wer eine Karte gewählt hatte und sie danach
verlor, weil der Präsident sie sich wünschte oder weil sie schon gespielt war,
klickte ins Leere: Der Legen-Knopf blieb grau, gleich was man noch anfasste,
und das Spiel sah kaputt aus.

Zwei Sicherungen, nicht eine:

1. **Die Auswahl fällt mit der Lage.** `situation` fasst zusammen, was eine
   Wahl bedeutet - Stapel, Phase, wer dran ist, welcher Schritt offen ist, wie
   viele Karten man hält. Ändert sich davon etwas, ist die Auswahl leer.
2. **Gewählt ist nur, was man hält.** Was auf eine Karte zeigt, die nicht mehr
   da ist, zählt gar nicht erst mit.

Gefunden hat das nicht der Motor, sondern eine Partie, die vollständig über den
Bildschirm gespielt wurde - Klick für Klick, bis der Sieger feststand. Der
Schiedsrichter war die ganze Zeit in Ordnung: Er lässt einen Ausspieler nie
ohne spielbare Karte dastehen, und das ist in 40 Partien nachgezählt.

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

Eine Ausnahme gibt es doch: **Beim Wünschen sieht der Gewinner die Hand des
Verlierers** - und nur er. Diese Karten reisen auf seinem privaten Kanal mit
(`shown`), solange der Schritt offen ist, und werden danach nicht mehr
geschickt. Nachgemessen: Der Wünschende sieht zwei Hände offen, alle anderen nur
ihre eigene, und im öffentlichen Schnappschuss steht auch beim Verlierer nur
`verdeckt`.

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

Nach dem Umbau auf Ablegen und Wünschen noch einmal 48 Partien: alle beendet,
kein abgelehnter Zug, und **kein einziger Wunsch auf eine geschützte Karte**.
Zu viert gab es keine Ablage (das Blatt geht auf), an allen anderen Tischen eine
pro Runde.
