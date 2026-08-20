# Exploding Kittens - Spielregeln

Umsetzung des Kartenspiels (Original Edition, Exploding Kittens Inc.). Die
Regeln stammen vollständig aus der beigelegten Anleitung
(`ekoe-instructions-english.pdf`, 2 Seiten, englisch). Die Umsetzung ist
deutsch - die Anleitung ist die Quelle, nicht die Sprache.

**56 Karten für 2 bis 5 Spieler.**

## Ziel

Nicht explodieren. Es gewinnt, wer als Einziger übrig bleibt.

## Das Deck

| Karte                          | Anzahl |
| ------------------------------ | -----: |
| Explodierendes Kätzchen        |      4 |
| Entschärfung                   |      6 |
| Nö!                            |      5 |
| Angriff                        |      4 |
| Aussetzen                      |      4 |
| Gefallen                       |      4 |
| Mischen                        |      4 |
| Blick in die Zukunft           |      5 |
| Katzenkarten, 5 Sorten zu je 4 |     20 |
| **Summe**                      | **56** |

## Spielaufbau

1. Alle **4 Explodierenden Kätzchen** aus dem Deck nehmen und beiseitelegen.
2. Alle **6 Entschärfungen** herausnehmen und jedem Spieler **eine** geben. Von
   den übrigen **2 zurück ins Deck** mischen, den Rest aus dem Spiel nehmen.
   (Bei 5 Spielern bleibt nur 1 übrig, die dann zurückgemischt wird.)
3. Deck mischen und jedem **7 Karten** verdeckt geben - zusammen mit der
   Entschärfung hat jeder **8 Karten**.
4. So viele Explodierende Kätzchen zurückmischen, dass **eines weniger als
   Spieler** im Deck ist. Der Rest kommt aus dem Spiel.
5. Deck mischen - das ist der **Nachziehstapel**. Daneben liegt der Ablagestapel.
6. Einen Startspieler bestimmen.

## Ein Zug

1. **Spielen** oder **Passen**. Beim Spielen kommt eine Karte offen auf den
   Ablagestapel und ihre Anweisung wird ausgeführt. Danach darf man **noch eine**
   spielen - so viele, wie man möchte.
2. **Zug beenden, indem man eine Karte vom Nachziehstapel zieht** - und hofft,
   dass es kein Explodierendes Kätzchen ist.

Weiter im Uhrzeigersinn. **Erst spielen oder passen, dann ziehen.**

## Die Karten

| Karte                       | Wirkung                                                                                                                                                                                                         |
| --------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Explodierendes Kätzchen** | Sofort zeigen. Ohne Entschärfung bist du raus.                                                                                                                                                                  |
| **Entschärfung**            | Rettet dich vor einem gezogenen Kätzchen. Das Kätzchen steckst du danach **heimlich an eine beliebige Stelle** des Nachziehstapels zurück. Dein Zug ist damit vorbei.                                           |
| **Nö!**                     | Stoppt jede Aktion **außer** Explodierendes Kätzchen und Entschärfung. Auch gegen ein anderes Nö! (und so weiter). Darf jederzeit gespielt werden, auch wenn man nicht dran ist. Genöppte Karten sind verloren. |
| **Angriff**                 | Beende deinen Zug, ohne zu ziehen, und zwing den Nächsten zu **2 Zügen**. Angriffe stapeln sich - siehe unten.                                                                                                  |
| **Aussetzen**               | Beende deinen Zug sofort, ohne zu ziehen. Gegen einen Angriff beendet er nur **einen** der Züge.                                                                                                                |
| **Gefallen**                | Ein Mitspieler deiner Wahl gibt dir **eine Karte** - **er** sucht sie aus.                                                                                                                                      |
| **Mischen**                 | Mische den Nachziehstapel.                                                                                                                                                                                      |
| **Blick in die Zukunft**    | Sieh dir heimlich die obersten **3 Karten** an und leg sie in derselben Reihenfolge zurück.                                                                                                                     |
| **Katzenkarten**            | Allein wertlos. Zwei gleiche stehlen - siehe Kombis.                                                                                                                                                            |

## Kombis

- **Zwei gleiche:** Zwei Karten mit demselben Namen ablegen und einem Mitspieler
  eine **zufällige** Karte aus der Hand ziehen.
- **Drei gleiche:** Dasselbe, aber du **nennst** die Karte, die du willst. Hat er
  sie, bekommst du sie; hat er sie nicht, bekommst du nichts.

Die Anweisungen der abgelegten Karten werden dabei **ignoriert**. Die Anleitung
stellt ausdrücklich klar, dass Kombis nicht nur mit Katzenkarten gehen, sondern
mit **jedem** Paar bzw. Drilling gleichnamiger Karten.

## Angriffe stapeln sich

> "If the victim of an Attack plays this card on any of their turns, the attacks
> stack and their turns are immediately transferred to the card's victim, who
> must take the Attacker's current and remaining untaken turn(s) PLUS 2
> additional turns."

Die Beispiele der Anleitung:

- Opfer eines Angriffs (2 Züge) spielt sofort selbst Angriff → der Nächste macht
  **4** Züge.
- Opfer macht erst einen Zug fertig und spielt dann im zweiten Zug Angriff → der
  Nächste macht **3** Züge.

## Spielende

Alle explodieren bis auf einen - der gewinnt.

## Was die Anleitung offen lässt oder sich widerspricht

1. **Der Grundfall des Angriffs.** Kartentext und Stapelregel widersprechen
   sich. Nach dem Kartentext bekommt der Nächste **2** Züge; nach der Stapelregel
   („aktueller plus verbleibender Zug plus 2") wären es beim nicht angegriffenen
   Angreifer **3**. Beide Beispiele der Anleitung passen nur zur Stapelregel,
   der Kartentext nur zum Grundfall. Umgesetzt ist deshalb:

   > Ein **nicht** angegriffener Angreifer verschenkt 2 Züge. Ein angegriffener
   > Angreifer verschenkt seine noch offenen Züge (den laufenden eingerechnet)
   > **plus 2**.

   Das erfüllt den Kartentext **und** beide Beispiele.

2. **Wie die Katzenkarten heißen.** Die Anleitung zeigt sie nur als Bilder und
   nennt bloß „5 Sorten zu je 4". Festgelegt sind die Namen der Original
   Edition: **Tacocat, Regenbogen-Kotz-Katze, Katzemelone, Haarige
   Kartoffelkatze, Bartkatze**. Eine Zeile im Kartenmodul.

3. **Ob man eine Entschärfung ablehnen darf.** „Unless you can play a Defuse,
   you're dead" lässt offen, ob man sie auch liegen lassen könnte. Festgelegt:
   **wer eine hat, entschärft**. Niemand würde freiwillig explodieren, und die
   Wahl anzubieten würde online verraten, dass jemand eine Entschärfung hält -
   ohne dass daraus je etwas anderes folgte.

4. **Ob eine einzelne Katzenkarte gespielt werden darf.** „These cards are
   powerless on their own" - man dürfte sie also ablegen, ohne dass etwas
   passiert. Festgelegt: **nein**, sie lässt sich nur als Kombi ausspielen. Ein
   Knopf, der nichts tut, ist keine Regel, sondern eine Falle.

5. **Was mit den Karten eines Explodierten passiert.** Sie kommen „verdeckt vor
   ihn" - also aus dem Spiel. Umgesetzt: sie bleiben bei ihm liegen und sind für
   niemanden mehr erreichbar; das Kätzchen kommt auf den Ablagestapel statt
   offen vor ihn. Rein kosmetisch.

## Das Nö!-Fenster - eine bewusste Abweichung

Am Tisch ist Nö! ein Wettrennen: Wer schnell genug ruft, stoppt die Aktion. Am
Bildschirm wird daraus ein **Fenster**, das sich öffnet, sobald jemand etwas
Nöppbares spielt, und das erst zumacht, wenn alle Angesprochenen durchgewinkt
haben.

Das Fenster wird **nur denen geöffnet, die auch wirklich ein Nö! auf der Hand
halten**. Das verrät ein klein wenig - nämlich dass überhaupt jemand nöppen
könnte -, und dafür wartet der Tisch nicht bei jeder Karte auf vier Leute, die
nichts tun können. Die Alternative (immer alle fragen) wäre bei 5 Karten Nö! im
ganzen Deck fast immer ein Klick ins Leere.

Wer die oberste Karte des Stapels gerade selbst gespielt hat, wird nicht
gefragt - man nöppt sich nicht selbst. Beim Gegen-Nö! („doch!") ist es dann
umgekehrt der Nöpper, der aussetzt.

## Schnelleres Spiel (Variante)

Empfohlen für 2 und 3 Spieler: Vor dem Einmischen der Kätzchen etwa **ein
Drittel des Decks** zufällig aus dem Spiel nehmen - man weiß dann nicht, welche
Karten fehlen. Danach die Kätzchen einmischen und loslegen. Ist als Einstellung
umgesetzt.

## Warum der Nachziehstapel nie leer wird

Die Anleitung behauptet das, und es stimmt: Jeder Zug nimmt höchstens eine Karte
vom Stapel, und die Kätzchen bleiben darin, bis sie jemanden umbringen. Es sind
eines weniger als Spieler - der Stapel kann also im schlimmsten Fall auf die
verbliebenen Kätzchen zusammenschrumpfen, und dann zieht der Nächste eben eines.
Der Schiedsrichter fängt den leeren Stapel trotzdem ab (der Zug endet dann ohne
Karte), damit ein von Hand verbogener Spielstand nicht abstürzt.
