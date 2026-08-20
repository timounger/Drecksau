# Jammerlappen

Das Kartenspiel um 56 Karten - 44 Zahlen- und 12 Aktionskarten. Werde alle
deine Karten los: erst die Hand, dann die offenen, zuletzt die verdeckten.
**Es gibt keinen Gewinner, sondern nur einen Jammerlappen** - wer als Letzter
noch auf seinen Karten sitzt.

2 bis 6 Spieler.

## Spielen

| Seite                         | Was dort passiert                     |
| ----------------------------- | ------------------------------------- |
| `/jammerlappen`               | Spiel mit Computergegnern             |
| `/jammerlappen/einstellungen` | Spielerzahl (2 bis 6)                 |
| `/jammerlappen/online`        | automatische Suche oder privater Raum |
| `/jammerlappen/statistik`     | gespielte Partien und Erfolge         |

Die vollständigen Regeln stehen im Spiel selbst hinter dem Knopf **„? Regeln"**
und als Spezifikation in
[docs/games/jammerlappen/game-rules.md](../../../../docs/games/jammerlappen/game-rules.md).

## Drei Reihen mit Löchern, keine Listen

Ein Spieler hat `hand`, `up[3]` und `down[3]`
([engine/state.ts](engine/state.ts)). Die beiden Tischreihen sind **feste
Arrays mit Löchern**, keine schrumpfenden Listen - denn eine offene Karte und
die verdeckte darunter sind ein Paar: Genau das Ausspielen der offenen Karte in
Slot 1 gibt die verdeckte in Slot 1 frei. Zwei schrumpfende Listen könnten nicht
mehr sagen, welche das war.

## Was zu schlagen ist, steht nicht oben auf dem Pot

Aktionskarten liegen obenauf, ohne etwas über die Höhe zu sagen. Maßgeblich ist
die **letzte Zahlenkarte** darunter - und genau das ist der ganze Inhalt von
„Dein Problem!": eine Karte, die nichts tut, außer diese Zahl an den nächsten
weiterzureichen. `topValue` ([engine/moves.ts](engine/moves.ts)) ist diese
Regel, und alles fragt sie, statt auf den Pot zu schauen.

Dass die Anleitung „Dein Problem!" überhaupt erklären muss, ist übrigens der
Beleg dafür: Ginge die Forderung ohnehin verloren, wäre stattdessen
„Neustart!" die überflüssige Karte. Und die Liste, was den Abwärtslauf der 5
beendet, nennt nur „Weg damit!" und „Neustart!" - nicht Richtungswechsel oder
Aussetzen.

## Ein Zug kann von jemandem kommen, der nicht dran ist

Zwischenschmeißen ist keine eigene Phase und kein Zeitfenster, sondern schlicht
ein `play` von einem Sitz, der nicht am Zug ist - `applyMove` prüft deshalb
nicht als Erstes, wer dran ist, sondern was auf dem Pot liegt. Wer schneller
klickt, gewinnt das Rennen; online entscheidet der Host, bei dem der Zug zuerst
ankommt. Genau so steht es in der Anleitung: „du musst jedoch schnell sein".

Der Computergegner bekommt dafür eine eigene, absichtlich **längere und
gestreutere** Reaktionszeit ([engine/ai.ts](engine/ai.ts)). Eine Maschine, die
das Rennen immer gewinnt, macht aus einer Reflexregel eine Regel darüber, wer
ein Computer ist.

## Was online geheim bleibt - und vor wem

Zwei Sorten Geheimnis, zwei Wege:

- Die **Handkarten** sind vor den anderen geheim, nicht vor ihrem Besitzer. Sie
  gehen über den privaten Kanal des Sitzes und werden beim Empfang wieder
  eingesetzt - der übliche Weg.
- Die **verdeckten Tischkarten** sind vor allen geheim, ihren Besitzer
  eingeschlossen. Sie gehen an keinen Client, sondern in den Host-Tresor
  (`vault`, [multiplayer/adapter.ts](multiplayer/adapter.ts)). Ein Client, der
  sie bekäme - auch nur, um Rückseiten zu zeichnen -, hätte die Antwort im
  Speicher, und die Browser-Konsole ist kein schwer erreichbarer Ort.

## Der Computergegner würfelt ein bisschen

Er spielt die billigste Karte, die reicht - aufwärts die niedrigste, nach einer
5 die höchste - und greift erst zur Aktionskarte, wenn keine Zahl passt.

Eine Sache daran ist kein Geschmack, sondern Notwendigkeit: Jeder sechste Zug
ist bewusst die **zweitbeste** Karte. Sobald der Aufnahmestapel leer ist, hat
das Spiel keinen Zug mehr, der Fortschritt erzwingt - zwei Maschinen, die jede
Stellung immer gleich beantworten, schieben dieselben vier Karten bis zum
Schließen des Browsers hin und her. Das ist im Selbstspiel reproduzierbar
passiert; mit der Streuung enden 600 Runden zu zweit bis zu sechst alle nach
höchstens 228 Zügen.

## Was die Oberfläche nicht selbst entscheidet

Der Tisch baut den Zug und fragt `applyMove`, ob er durchginge - ein Knopf
leuchtet genau dann, wenn der Schiedsrichter ja sagen würde
([components/jammerlappen-table.tsx](components/jammerlappen-table.tsx)). Kostet
einen weggeworfenen Spielzustand pro Render und kauft dafür, dass der Bildschirm
den Regeln nicht widersprechen kann.

## Aufbau des Spielmoduls

```
jammerlappen/
  engine/       Karten, Zustand, Schiedsrichter, Computergegner
  components/   Tisch, Rundenende, Offline- und Online-Bildschirm
  hooks/        das Spiel gegen den Computer
  multiplayer/  Adapter für die gemeinsame Online-Schicht
  settings/     Spielerzahl, im Browser gemerkt
  i18n/         deutsche Texte und die Anleitung im Spiel
```

## Erfundene Zahlen

Die Anleitung nennt 44 Zahlen- und 12 Aktionskarten, sagt aber nicht, **welche
Zahlen** es gibt und **wie sich die zwölf Aktionskarten** auf die fünf Sorten
verteilen. 44 = 11 Sorten x 4 Karten, und die höchste abgebildete Karte ist die
11 - also 1 bis 11. Beides steht an **einer** Stelle in
[engine/cards.ts](engine/cards.ts) (`HIGHEST_VALUE`, `ACTION_SPLIT`) und ist je
eine Zeile zu ändern.

Offen lässt die Anleitung auch, ob die Regel „4 Aktionskarten in Folge" zu zweit
auf drei schrumpft. Hier bleibt sie bei vier: Das kleine Deck nimmt von jeder
**Zahlen**karte eine heraus - das macht aus dem Quartett einen Drilling - und
sagt über Aktionskarten nichts.
