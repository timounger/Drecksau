# Risiko

**RISIKO** von Hasbro/Parker, Ausgabe „Risk Reinvention" (2010). 42 Gebiete auf
sechs Kontinenten, drei schwarze und zwei rote Würfel, und alle drei Spiele aus
der Schachtel: Grundspiel, Klassisches Risiko und die Variante zu zweit.

## Spielen

| Seite                   | Was dort passiert                     |
| ----------------------- | ------------------------------------- |
| `/risiko`               | gegen Computergegner                  |
| `/risiko/einstellungen` | welche Variante, wie viele Spieler    |
| `/risiko/online`        | automatische Suche oder privater Raum |
| `/risiko/statistik`     | gespielte Partien und Erfolge         |

Die vollständigen Regeln stehen im Spiel hinter **„? Regeln"** und als
Spezifikation in
[docs/games/risiko/game-rules.md](../../../../docs/games/risiko/game-rules.md).

## Diese Ausgabe ist nicht das Risiko von früher

Drei Regeln weichen ab, und wer das alte Risiko kennt, stolpert über alle drei:

|             | Diese Ausgabe                                      | Früher                |
| ----------- | -------------------------------------------------- | --------------------- |
| Verstärkung | 3 + Tabelle ab 12 Gebieten                         | Gebiete durch 3       |
| Karten      | Sterne, Tabelle von 2 bis 10                       | Dreiersätze, 4/6/8/10 |
| Angriff     | Die Einheiten ziehen mit; ein Wurf ist eine Aktion | Kampf aus der Distanz |

Die erste davon verändert das Spiel am meisten. **Elf Gebiete sind keine
Verstärkung wert, zwölf sind eine** - und das bleibt so bis 14. Es gibt also
Schwellen, keine Steigung, und das zwölfte Gebiet ist ein anderes Ziel als das
elfte.

Die dritte ist die, die man beim Programmieren falsch macht. Die Anleitung sagt:
„Nehmen Sie die Einheiten, mit denen Sie angreifen möchten, und ziehen Sie sie
über die Grenze." Sie **verlassen** das Ausgangsgebiet und stehen danach
entweder im eroberten Gebiet oder gehen zurück. Der Schiedsrichter tut genau das
([engine/moves.ts](engine/moves.ts)) statt Verluste an Ort und Stelle
abzuziehen - dieselbe Arithmetik, aber die Variante, die auch dann noch stimmt,
wenn im Ausgangsgebiet genau eine Einheit übrig bleibt.

## Die Karte, und woher sie kommt

Die Anleitung hat alle Regeln und **keine Karte**: Ihr Bild vom Spielplan ist ein
Foto, auf dem die Gebietsnamen bei keiner Vergrößerung lesbar sind. Lesbar sind
die gezeichneten Beispielkarten auf zwei Seiten, und die bestätigen die deutschen
Namen und ein Dutzend Grenzen - Russland liegt in Europa und grenzt an Ural und
Afghanistan, Südeuropa an den Mittleren Osten.

Der Rest ist die Standard-Risikokarte, die seit 1959 unverändert ist. Sie steht
in [engine/map.ts](engine/map.ts) ausgeschrieben, weil **keine** dieser Grenzen
aus Geografie folgt: Grönland grenzt an Island, Brasilien an Nordafrika, und
Alaska an Kamtschatka quer über die Datumsgrenze.

Nachgeprüft wird sie: Grenzen stehen nur **einmal** da, und der Graph wird daraus
in beide Richtungen gebaut. Zweimal geschrieben wären es 42 Listen, die
zueinander passen müssen, und die erste, die nicht mehr passt, macht ein Gebiet
angreifbar aus einer Richtung, in die es nicht zurückschlagen kann - ein Fehler,
der sehr lange wie Pech aussieht.

Die Prüfung fand: 42 Gebiete, 83 Grenzen, Australien mit genau **einem** Zugang,
Südamerika mit zwei - alles wie auf dem echten Brett.

## Das Spielbrett ist ein Graph, und das mit Absicht

[components/risiko-map.tsx](components/risiko-map.tsx) zeichnet **keine
Landkarte** und tut auch nicht so. Zweiundvierzig Küstenlinien nachzuzeichnen
wäre viel Arbeit für ein hübscheres Weltbild - und für eine hübschere Art, eine
Grenze falsch zu haben.

Was ein Risiko-Spieler von der Karte braucht, ist **eine** Auskunft: wer grenzt
an wen. Umrisse sind dafür schlecht; am echten Tisch wird genau deshalb
gestritten, ob Ostafrika den Mittleren Osten berührt. Also ist jedes Gebiet ein
Spielstein an ungefähr seinem Platz auf dem Globus, jede Grenze eine Linie, der
man mit dem Finger folgen kann, und die sechs Kontinente liegen in ihren
gedruckten Farben darunter. Über keine Grenze kann man mehr anderer Meinung sein.

Die eine Grenze, die keine Linie sein kann, ist Alaska - Kamtschatka: Sie läuft
aus der Welt hinaus und auf der anderen Seite wieder hinein. Sie bekommt zwei
Stummel, so wie das gedruckte Brett auch.

Zwei Sachen daran waren erst falsch:

- Die Kontinente lagen als **Rechtecke** unter den Gebieten. Afrikas Rechteck und
  Asiens Rechteck überlappen sich über dem Mittelmeer, und die Karte wurde
  matschig genau dort, wo am meisten los ist. Jetzt ist ein Kontinent die Summe
  je eines abgerundeten Flecks pro Gebiet und hat damit seine eigene Form.
- Die **Kontinentnamen** wurden berechnet - erst „über dem obersten Gebiet",
  dann „darüber, außer da steht schon was, dann darunter". Beide Regeln setzten
  „Afrika +3" mitten nach Asien oder auf Südafrika. Sechs Namen auf einer Karte,
  die nie einen siebten Kontinent bekommt, sind Kartografie und kein Fall für
  einen Algorithmus: Sie stehen jetzt als Koordinaten in
  [engine/map.ts](engine/map.ts).

Die Karte behält in beiden Themes ihre eigenen Farben. Sie ist bedrucktes
Brett; ein echtes wird abends nicht dunkler, und die Seite ringsum trägt das
Theme.

## Bedient wird mit zwei Taps: von wo, dann wohin

Risiko dreht sich um Grenzen, und eine Grenze braucht beide Enden. Zwischen den
beiden Taps zeigt die Karte, welche Gebiete am anderen Ende in Frage kommen -
genau die Frage, die man sich stellt, während der Finger über Kamtschatka
schwebt.

**Was leuchtet, kommt aus dem Schiedsrichter**, nicht aus einer zweiten Meinung
über die Regeln: die anklickbaren Gebiete stammen aus `legalAttacks` und
`fortifyTargets`. Ein Gebiet, das man nicht angreifen darf, wird deshalb nicht
bloß abgelehnt - es leuchtet gar nicht erst.

Für „wie viele Einheiten" gibt es zwei Formen. Beim Angreifen sind es höchstens
drei, also drei Knöpfe. Beim Nachziehen und beim Bewegen kann es alles zwischen
null und dreißig sein, also ein Schieber: dreißig Knöpfe sind keine Auswahl,
sondern eine Wand.

## Der Computergegner

Er sieht nur das Brett, das ohnehin offen liegt - nie eine fremde Hand
([engine/ai.ts](engine/ai.ts)). Vier Ideen tragen ihn:

1. **Kontinente sind das Einkommen.** Drei Einheiten pro Zug sind nichts, Asien
   sind sieben und Australien zwei für vier Gebiete hinter einer einzigen Tür.
2. **Nur die Grenze zählt.** Einheiten im Landesinneren tun nichts.
3. **Angreifen aus Stärke.** Lohnt sich, wenn das Ausgangsgebiet mehr entbehren
   kann, als gegenüber steht. Darunter verliert man eine Armee einzeln - so
   verlieren Menschen dieses Spiel auch.
4. **Ein Gebiet nehmen, koste es was es wolle.** Ein Zug ohne Eroberung zieht
   keine Karte, und Karten sind die einzige Verstärkung, die mit dem Spiel
   wächst.

## Was das Selbstspiel geprüft hat

Nach jedem einzelnen Zug: kein Gebiet ohne Einheit, keine Einheit auf einem
herrenlosen Gebiet, die 42 Karten weder vermehrt noch verloren, kein besiegter
Spieler mit Land oder Karten, und jede Partie endet mit einem Sieger. Über alle
drei Varianten und alle Spielerzahlen.

Daraus kam auch die Tiefe der Waffenstillstandskarte - siehe die
[Spezifikation](../../../../docs/games/risiko/game-rules.md). Der erste Wert war
geraten und viel zu flach: **zwölf von zwölf** Dreierpartien endeten per
Waffenstillstand, das Ziel wurde nie erreicht.

## Aufbau des Spielmoduls

```
risiko/
  engine/       Karte, Armeen, Karten, Zustand, Schiedsrichter, Computergegner
  components/   Weltkarte, Aktionsleiste, Stand und Hand, Endstand, Bildschirme
  hooks/        die Partie gegen den Computer
  multiplayer/  Adapter für die gemeinsame Online-Schicht
  settings/     Variante und Spielerzahl
  i18n/         deutsche Texte und die Anleitung im Spiel
```

## Cover-Logo

Das Bild liegt in [assets/logo.webp](assets/logo.webp) - ein Platzhalter, den
man durch echte WebP-Grafik ersetzen kann.
