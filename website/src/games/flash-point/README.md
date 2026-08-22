# Flash Point: Fire Rescue

Das kooperative Brettspiel von Kevin Lanzing. Ihr seid die Feuerwehr: Holt
sieben Menschen aus einem brennenden Haus, bevor drei von ihnen sterben oder
das Gebäude einstürzt.

1 bis 6 Spieler. Umgesetzt sind die **Regeln für Anfänger**.

## Spielen

| Seite                        | Was dort passiert                     |
| ---------------------------- | ------------------------------------- |
| `/flash-point`               | Einsatz mit Computer-Kollegen         |
| `/flash-point/einstellungen` | Größe der Mannschaft (1 bis 6)        |
| `/flash-point/online`        | automatische Suche oder privater Raum |
| `/flash-point/statistik`     | gespielte Einsätze und Erfolge        |

Die vollständigen Regeln stehen im Spiel hinter **„? Regeln"** und als
Spezifikation in
[docs/games/flash-point/game-rules.md](../../../../docs/games/flash-point/game-rules.md).

## Der Grundriss: Räume echt, Türen gelesen

Aus dem Scan des Spielplans (`fire.png`) sind die **Raumformen übernommen** -
sie lassen sich an den Bodenfarben eindeutig ablesen und es gibt nichts daran zu
raten: der L-förmige braune Wohnbereich links, das grüne Bad, das dunkelrote
Schlafzimmer, die blaue Küche über vier Spalten, das Spielzimmer, Esszimmer,
Kinderzimmer und das rosa Gäste-WC.

Die **Wände werden daraus abgeleitet**, nicht aufgelistet: Zwei Felder, die zu
verschiedenen Räumen gehören, haben eine Wand dazwischen; zwei aus demselben
Raum nicht ([engine/board.ts](engine/board.ts)). Genau das _ist_ ein Raum - und
abgeleitet kann dem L-förmigen Wohnbereich keine Wand quer durch die eigene Ecke
wachsen, was einer handgeschriebenen Liste von 110 Kanten sicher passiert wäre.

**Bei den Türen musste ich lesen statt abschreiben.** Auf dem Scan sind **elf**
Stellen zu sehen, die wie Türen aussehen - die Anleitung spricht aber von
**acht** Türsymbolen, eines für jeden Eingang. Beides kann nicht stimmen. Drei
davon sind hier deshalb offene Durchgänge, ausgewählt so, dass das Haus fließt
wie auf dem Bild. Welche drei, ist die einzige Stelle auf diesem Brett, die eine
Lesart ist und keine Tatsache.

Die Startpositionen von Feuer und Einsatzsymbolen sind dagegen die echten: Sie
stehen als Koordinatenliste in der Anleitung und ließen sich am Aufbaubild
gegenprüfen.

### Was das Prüfen gefunden hat

Eine Tür zwischen Esszimmer und Kinderzimmer hatte ich auf (6,5)|(6,6) gesetzt -
das liegt aber schon **innerhalb** des Kinderzimmers, die Raumgrenze verläuft
zwischen Spalte 4 und 5. Die Tür verband nichts, und zwei Räume des Hauses waren
abgeschnitten, mit Opfern darin.

Gefunden hat das die Prüfung „mit allen Türen zu ist jedes Zimmer erreichbar".
Die ist bei diesem Spiel keine Formalität: Ein Raum, den man nur durch eine Tür
betreten kann, die jemand geschlossen hat, ist ein Raum mit einem Opfer und ohne
Weg dorthin.

## So sieht es aus

Jeder Raum in seiner Bodenfarbe, Rasen ringsum, die vier Rettungswagen- und die
zwei Löschfahrzeug-Felder darauf, und in jeder Ecke die Koordinate. Das ist
keine Dekoration: Am Tisch denkt niemand „Zeile vier, Spalte sechs", sondern
„die blaue Küche". Ein Gitter gleicher Kästchen zwingt zum Zählen, und dafür
lässt ein Feuer keine Zeit.

Neben dem Brett liegen die zwei Ablagen, die der Spielplan druckt: **Platz für
Gerettete** und **Friedhof**, je ein Punkt pro Mensch. Sieben auf der einen ist
der Sieg, drei auf der anderen die Niederlage - als zwei sich füllende Reihen
spürt man das anders als als zwei Zahlen in einer Statuszeile.

## Bedient wird das Bild

Kein Werkzeugkasten und kein Moduswechsel: **auf ein Feld tippen, und das, was
dieses Feld hergibt, passiert.** Eine intakte Wand kann man nur einschlagen,
eine zu Tür nur aufmachen, ein brennendes Feld unter den eigenen Füßen nur
löschen - da gibt es nichts zu wählen und deshalb auch nichts zu fragen.

Genau **zwei** Fälle sind wirklich zweierlei, und nur die fragen nach:

| Feld                   | Zweierlei                                  |
| ---------------------- | ------------------------------------------ |
| brennendes Nachbarfeld | hingehen (2 AP) **oder** löschen (1 AP)    |
| offene Tür nebenan     | durchgehen (1 AP) **oder** zumachen (1 AP) |

Dann erscheint eine kurze Reihe, die beides **mit seinem Preis** benennt. Raten
wäre hier keine Kleinigkeit: Es ginge irgendwann mit dem letzten Aktionspunkt
schief, und das ist in diesem Spiel die Stelle, an der ein Fehler einen
Menschen kostet.

Die Zahl in der Ecke eines hellen Feldes ist der Preis. Steht dort **…**, ist es
eines der zwei Felder, die fragen - einen der beiden Preise dort hinzuschreiben
würde diesen einen empfehlen.

Was angeboten wird, kommt aus `legalMoves` und wird nicht ein zweites Mal aus
Wänden und Feuer hergeleitet ([components/flash-point-board.tsx](components/flash-point-board.tsx)).
Bild und Regeln können damit nicht auseinanderlaufen - genau so blieb früher
eine zerstörte Tür anklickbar.

## Ein Zug, in dem nichts mehr geht, beendet sich selbst

Wenn **Aufhören der einzige legale Zug ist**, endet der Zug von allein
([engine/moves.ts](engine/moves.ts)). Das ist die ganze Bedingung, und sie ist
das, was daran sicher ist: Wer noch etwas tun könnte, wird nicht gedrängt -
niemand verliert die Möglichkeit, früher aufzuhören und den Rest aufzusparen.
Wer aber einen Punkt übrig hat und nichts, was einen Punkt kostet, ist fertig,
und ihn das noch bestätigen zu lassen ist ein Klick ohne Entscheidung.

## Wände gehören der Kante, nicht dem Feld

Jede Wand liegt zwischen zwei Feldern und wird unter einem **normalisierten
Schlüssel** gespeichert, der von beiden Seiten derselbe ist. Eine Wand, die es
von Norden aus gibt und von Süden aus nicht, wäre ein Fehler, der einen
Nachmittag kostet - eine der Prüfungen im Selbstspiel war genau das: Für jedes
Feldpaar muss `passable(a,b)` dasselbe sagen wie `passable(b,a)`.

Gezeichnet wird jede Kante nur **einmal**, von oben und von links. Zweimal
gezeichnet sähe eine Wand mal dicker und mal dünner aus, je nachdem, was daneben
liegt.

## Löschen ist eine Aktion, nicht drei

Die Anleitung nennt drei Preise: 1 AP Rauch entfernen, 1 AP Feuer zu Rauch,
2 AP Feuer entfernen. Das ist dieselbe Sache zweimal gesagt. Hier ist es **eine**
Aktion für 1 AP, die ein Feld eine Stufe herunterschaltet - zweimal angewandt
kostet ein gelöschtes Feuer genau die 2 AP des Buches.

## Der Computer-Kollege

Er sucht sich per **Breitensuche durchs Haus** die nächste Person, die getragen
werden muss, und löscht, was ihm im Weg steht. Breitensuche und nicht Luftlinie,
weil das in einem Gebäude mit Wänden zwei verschiedene Dinge sind - das
Nachbarzimmer kann vier Züge entfernt sein.

Wände schlägt er **nicht** ein. Jeder Schadenszähler in einer Wand fehlt dem
Haus, und es sind dieselben 24, die die Explosionen aufbrauchen.

Im Selbstspiel drei Computer gegen das Feuer gewinnt er etwa jede
dreißigste Partie. Das ist wenig - aber er ist ein Kollege, kein Gegner: Ihr
spielt zusammen, und der Mensch am Steuer trägt die Mannschaft.

## Online ist nichts geheim

Der einfachste Adapter der Sammlung
([multiplayer/adapter.ts](multiplayer/adapter.ts)), und das aus einem Grund, den
man benennen sollte: **Hier verbirgt niemand etwas vor jemand anderem.** Die
Einsatzsymbole liegen für _alle_ verdeckt - das ist die eine Unbekannte des
Spiels, und sie gehört dem Tisch, nicht einem Platz. `redact` reicht den Zustand
also unverändert weiter, und `privateHands` hat nichts zu verteilen.

Das Gegenstück ist Sky Team, wo der ganze Adapter nur dafür da ist, dass die
Würfel des anderen den Host nie verlassen. Hier ist es umgekehrt: Alle sollen
alles sehen und darüber reden, denn genau das ist ein kooperativer Einsatz.

Online sind es 2 bis 6 Leute - für eine Person allein gibt es den Bildschirm
nebenan.

## Aufbau des Spielmoduls

```
flash-point/
  engine/       Grundriss, Zustand, Schiedsrichter, das Feuer, der Kollege
  components/   Spielfeld, Endstand, Einstellungen
  hooks/        der Einsatz gegen den Computer
  multiplayer/  Adapter für die gemeinsame Online-Schicht
  settings/     Größe der Mannschaft
  i18n/         deutsche Texte und die Anleitung im Spiel
```

## Cover-Logo

Das Bild liegt in [assets/logo.webp](assets/logo.webp) - ein Platzhalter, den
man durch echte WebP-Grafik ersetzen kann.
