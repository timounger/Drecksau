# Codenames

Das Partyspiel von Vlaada Chvátil (Czech Games Edition, 2015). 25 Wörter liegen
auf dem Tisch, jedes Team hat Agenten darunter - aber nur die
Geheimdienstchefs wissen, welche. Sie geben Hinweise aus **einem Wort und einer
Zahl**, ihre Teams raten. Wer zuerst alle eigenen Agenten hat, gewinnt; wer den
Attentäter erwischt, verliert sofort.

Online ab 4 Spielern, allein gegen den Computer.

## Spielen

| Seite                  | Was dort passiert                      |
| ---------------------- | -------------------------------------- |
| `/codenames`           | Spiel gegen Computergegner - du ratest |
| `/codenames/online`    | automatische Suche oder privater Raum  |
| `/codenames/statistik` | gespielte Partien und Erfolge          |

Keine Einstellungsseite: Gegen den Computer ist der Tisch fest (du und drei
Maschinen), und die einzige Wahl - wie groß der Tisch online sein soll - steht
auf dem Online-Bildschirm selbst.

Die vollständigen Regeln stehen im Spiel hinter dem Knopf **„? Regeln"** und als
Spezifikation in
[docs/games/codenames/game-rules.md](../../../../docs/games/codenames/game-rules.md).

## Ein Feld entscheidet alles: `owner`

Codenames hat genau ein Geheimnis, und es ist keine Handkarte, sondern eine
**Tatsache über den Tisch**: wem welches Wort gehört
([engine/state.ts](engine/state.ts)). Die Geheimdienstchefs kennen sie ab der
ersten Sekunde, ihre Ermittler erarbeiten sie sich Wort für Wort. Jeder
Bildschirm, jeder Schnappschuss im Netz und jeder Computerspieler ist darum
herum gebaut, diese beiden Sichten auseinanderzuhalten.

Online schwärzt der Host den `owner` jedes noch verdeckten Wortes und schickt
dieselbe Tafel **vollständig** über den privaten Kanal - aber nur an die beiden
Chefs ([multiplayer/adapter.ts](multiplayer/adapter.ts)). Der Tresor (`vault`)
hält den Schlüssel zusätzlich für einen Host, der übernimmt: Ginge er verloren,
könnte niemand mehr einen Hinweis geben.

Und offline? Da liegt im Browser die ganze Wahrheit. Deshalb fragt der Tisch
**die Rolle**, nicht die Daten
([components/codenames-table.tsx](components/codenames-table.tsx)). Ein
Bildschirm, der einfach zeigt, was man ihm gibt, wäre online richtig und offline
ein Verrat.

## Der Computer-Chef nennt Oberbegriffe

Ein Hinweis ist ein Einfall, und den hat eine Maschine ohne Sprachgefühl nicht.
Deshalb trägt jedes Wort der Liste ein bis drei **Kategorien**, und der Computer
sagt eine davon: _„Tier: 3"_ ([engine/words.ts](engine/words.ts)). Er bewertet
jede Kategorie nach dem, worauf sie zeigen würde, und rührt keine an, die den
Attentäter treffen könnte - die einzige harte Regel, die er sich selbst auferlegt.

Das ist ein engerer Hinweisraum als am Tisch, aber dieselbe Aufgabe: Auf dem
Raster liegen fünf Tiere, drei davon sind deine, und eines könnte der Attentäter
sein.

### Eine Regel, die die Wortliste zusammenhält

**Kein Codewort darf so heißen wie eine Kategorie.** Ein Hinweis darf kein Wort
sein, das noch offen auf dem Tisch liegt - ein Wort, das seine eigene Kategorie
ist, hätte also genau einen möglichen Hinweis, und der wäre verboten. Genau das
ist im Selbstspiel passiert: Der Chef hatte nur noch FEUER übrig, dessen einzige
Kategorie „Feuer" heißt, und stand ohne einen einzigen legalen Hinweis da.
Deshalb hat die Liste FLAMME und kein FEUER, deshalb prüft der Chef seine
Kategorien gegen dieselbe Regel wie jeder Mensch, und deshalb kann sein letzter
Ausweg nie leer ausgehen: Es gibt mehr Kategorien als Wörter auf dem Tisch.

## Der Computer-Ermittler schummelt nicht

Er kennt den Schlüssel nicht. Das ist keine Vereinfachung, sondern die Regel,
und sie wird ehrlich eingehalten: Nichts in [engine/ai.ts](engine/ai.ts) lässt
einen Ratenden auf `owner` schauen. Er weiß nur, welche **Kategorie** sein Chef
gemeint hat - er versteht den Hinweis also perfekt - und rät unter den Wörtern
dieser Kategorie. Genau die Lage, in der ein Mensch ist, der „Tier: 3" hört und
fünf Tiere sieht.

Einmal von sieben greift er absichtlich daneben, so wie Menschen ein Wort aus
der letzten Runde nachholen. Und den einen Extra-Tipp, den die Regeln erlauben,
nimmt er nur, wenn er zurückliegt.

Übernimmt der Computer online einen verlassenen Sitz, versteht er den Hinweis
eines Menschen nicht - der ist ein Wort, keine Kategorie. Dann tut er das
Wenigste, was die Regeln zulassen: **einmal raten, weil er muss, und aufhören.**

## Wer allein spielt, ist Ermittler

Beide Chefs und das gegnerische Team sind Computer. Die Hinweis-Hälfte des
Spiels braucht Sprachgefühl auf der Gegenseite - eine Maschine, die einen
getippten Hinweis „verstehen" müsste, würde es nur vortäuschen. Raten braucht
nichts dergleichen, und das ist die Rolle, die der Mensch bekommt.

## Aufbau des Spielmoduls

```
codenames/
  engine/       Wörter mit Kategorien, Zustand, Schiedsrichter, Computerspieler
  components/   Tisch, Endstand, Offline- und Online-Bildschirm
  hooks/        das Spiel gegen den Computer
  multiplayer/  Adapter für die gemeinsame Online-Schicht
  settings/     nur die gewünschte Tischgröße online
  i18n/         deutsche Texte und die Anleitung im Spiel
```

## Die Wortliste

Die 400 Wörter der Originalausgabe sind geschützt und englisch. Hier steht eine
eigene deutsche Liste aus rund 270 Substantiven in
[engine/words.ts](engine/words.ts) - erweiterbar, solange drei Dinge stimmen:
genug Wörter je Kategorie, viele Wörter in **mehreren** Kategorien (die
Überschneidung ist das Spiel), und kein Wort, das heißt wie eine Kategorie.
