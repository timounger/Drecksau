# Kuhle Kühe

Das Kartenspiel von David Yakos (Game Factory, deutsche Ausgabe 2019). Aus
Köpfen, Mittelteilen und Hinterteilen baut ihr Kühe - je länger und je
reinrassiger, desto mehr Punkte.

2 bis 5 Spieler.

## Spielen

| Seite                        | Was dort passiert                     |
| ---------------------------- | ------------------------------------- |
| `/kuhle-kuehe`               | Spiel mit Computergegnern             |
| `/kuhle-kuehe/einstellungen` | Spielerzahl (2 bis 5)                 |
| `/kuhle-kuehe/online`        | automatische Suche oder privater Raum |
| `/kuhle-kuehe/statistik`     | gespielte Partien und Erfolge         |

Die vollständigen Regeln stehen im Spiel selbst hinter dem Knopf **„? Regeln"**
und als Spezifikation in
[docs/games/kuhle-kuehe/game-rules.md](../../../../docs/games/kuhle-kuehe/game-rules.md).

## Eine Kuh sind drei Felder, keine Liste

Eine ausliegende Kuh ist `head`, `middles[]` und `rear`
([engine/state.ts](engine/state.ts)) - und das ist kein Zufall, sondern folgt
den Regeln: Eine Kuh **existiert** nur mit Kopf und Hinterteil, Futter hängt ein
Mittelteil an, und der Kuhschubser reißt alle Mittelteile heraus und lässt das
Tier stehen. In einer flachen Liste wäre jede dieser Regeln eine Suche.

## Die Karten sind Karten, und die Kuh setzt sich zusammen

Hochformat, etwa zwei zu drei - das Maß aus der Schachtel und dasselbe, das die
Bohnanza-Karten haben ([components/kuh-card.tsx](components/kuh-card.tsx)). Eine
Sammlung, in der eine Karte überall eine Karte ist, spart pro Spiel eine Sache
zum Lernen.

Das Bild ist hier nicht Schmuck, sondern die Spielidee: Eine Kuh wird aus
**Kopf, Mittelteilen und Hinterteil von links nach rechts** gebaut, also sind
die drei Bilder drei Scheiben **eines** Tieres - und sie sind so gezeichnet,
dass sie **zusammenpassen**. Der Rumpf läuft auf jeder Karte auf derselben Höhe
und stößt dort flach an den Rand, wo die nächste Karte weitermacht. Drei Karten
nebeneinander lesen sich als Kuh, und genau darum geht es in den Regeln.

Deshalb steht die Rumpfhöhe an genau einer Stelle im Code (`BODY_TOP`,
`BODY_BOTTOM`): Ändert man sie an einer Karte, hört die Herde auf, sich zu
fügen.

Die Rassen unterscheiden sich zuerst an **Zeichnung und Hörnern**, nicht an der
Farbe: die Holstein weiß mit schwarzen Flecken und Stummelhörnern, das Longhorn
sandfarben mit dem langen geraden Paar, das Hochlandrind zottelig mit dem Pony
über den Augen. Drei Felle, die sich nur im Farbton unterscheiden, sind für
manche keine drei Rassen. Der **Joker** ist violett und trägt drei Punkte -
einen pro Rasse, weil er jede davon sein wird.

Bei den **Aktionskarten** gibt es ein Bild pro **Gruppe** statt pro Karte, und
das ist eine Entscheidung und keine Abkürzung: Zwölf Sinnbilder will sich
niemand merken, und was die Karte ist, sagt ihr Name darunter. Wofür Bild und
Farbe da sind, ist die Frage, die man quer über den Tisch stellt - _kommt die
gerade zu mir?_ -, und darauf gibt es vier Antworten: gebaut, genommen,
geschützt, oder eine der beiden Sonderbaren.

Gezeichnet ist alles selbst; die Bilder auf der Schachtel gehören jemandem.
Karten behalten ihre Druckfarben in beiden Themes - eine echte Karte wird abends
nicht dunkler, und das Thema trägt die Seite ringsherum.

## Zwei Unterbrechungen, zwei eigene Phasen

Ein Zug hat zwei Hälften - Karten holen und Karten ausspielen. Zweimal kann
etwas dazwischenkommen, und beides ist eine **eigene Phase** statt eines Flags:

- **Kuhhandel** (`trade`): Alle geben zwei Karten nach links. Die Karten
  wechseln erst den Besitzer, wenn **alle** ihre zwei benannt haben - sonst
  könnte der Letzte sehen, was er gleich bekommt.
- **Angriff** (`defend`): Die Angriffskarte liegt schon auf dem Tisch und das
  Ziel darf den Herdenhund werfen. Sie muss vorher aus der Hand, weil ein
  erfolgreicher Hund **beide** Karten auf den Ablagestapel schickt.

Dadurch ist nie unklar, auf wen der Tisch wartet. `seatOnTurn`
([engine/moves.ts](engine/moves.ts)) beantwortet genau das - und liefert oft
**nicht** den Spieler, der am Zug ist. Die gemeinsame Online-Schicht fragt das,
um jemanden zu drängen oder für ihn zu spielen, und wer gerade gar nicht
handeln darf, lässt sich nicht drängen.

## Was online geheim bleibt

Die Hände und der Nachziehstapel. Der Host schickt einen geschwärzten Tisch, in
dem jede fremde Hand aus Kartenrücken besteht, und jedem Sitz seine echten
Karten über einen privaten Kanal
([multiplayer/adapter.ts](multiplayer/adapter.ts)). Herden, Ablagestapel und
Auszeichnungen bleiben offen - die liegen am echten Tisch auch offen, und sie zu
verstecken würde das Spiel nur schwerer verfolgbar machen, nicht fairer.

Kurz nach einem Zug kann eine eigene Karte als Rücken dastehen: Der geschwärzte
Tisch und die private Hand kommen über getrennte Wege an, und solange ihre
Anzahl nicht zusammenpasst, zeigt der Bildschirm lieber nichts als eine falsche
Karte.

## Der Computergegner baut

Seine ganze Linie ist die, die das Spiel belohnt: reinrassig und lang. Er kreuzt
nie - eine Kreuzung kostet eine Karte und halbiert den Wert der Kuh - und greift
erst an, wenn er selbst nichts mehr zu bauen hat
([engine/ai.ts](engine/ai.ts)).

Eine Sache daran ist keine Geschmacksfrage: Er **zieht lieber, als vom
Ablagestapel zu nehmen**, außer die Karte vollendet sofort eine Kuh. Der Stapel
wird von jedem Angriff und jeder Handkartengrenze gefüttert, und ein Spieler,
der dort immer etwas Brauchbares findet, zieht nie - dann leert sich der
Nachziehstapel nicht, und das Spiel hat keine Möglichkeit zu enden.

## Aufbau des Spielmoduls

```
kuhle-kuehe/
  engine/       Karten, Zustand, Schiedsrichter, Computergegner
  components/   Tisch, Endstand, Offline- und Online-Bildschirm
  hooks/        das Spiel gegen den Computer
  multiplayer/  Adapter für die gemeinsame Online-Schicht
  settings/     Spielerzahl, im Browser gemerkt
  i18n/         deutsche Texte und die Anleitung im Spiel
```

## Erfundene Zahlen

Die Anleitung verweist für die genaue Kartenaufteilung auf den Schachtelboden,
der nicht vorlag. Belegt sind die Summen: 17 Köpfe, 22 Mittelteile, 17
Hinterteile, 7 Kälber, 27 Aktionskarten, zusammen 90. Wie sich Rassen, Joker und
Aktionssorten darauf verteilen, steht an **einer** Stelle in
[engine/cards.ts](engine/cards.ts) (`BREED_SPLIT`, `ACTION_SPLIT`) und ist je
eine Zeile zu ändern.
