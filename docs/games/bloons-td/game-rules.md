# Bloons TD: Was nachgebaut ist

Nachbau von _Bloons Tower Defense_. Diese Seite hält fest, **was von der
Vorlage umgesetzt ist und was nicht** - damit beim nächsten Ausbau niemand
raten muss, ob etwas fehlt oder absichtlich anders ist.

## Umgesetzt

- **Eine Karte**, zehn mal zehn Felder, als Text in
  `website/src/games/bloons-td/engine/map.ts`.
- **Die sechs Primär-Türme**: Wurfpfeilaffe, Bumerangaffe, Reißnagelwerfer,
  Bombenwerfer, Eisaffe, Klebstoffschütze. Zwei davon sind im Vorbild keine
  Affen und werden hier auch keine: der Reißnagelwerfer ist eine Scheibe mit
  acht Nägeln, der Bombenwerfer eine Kanone auf Messingfuß. Preise wie in der Vorlage, bis auf
  den Bombenwerfer: Für den stand in der Aufgabe kein Preis, er kostet hier
  $525 wie im Vorbild.
- **Die zwölf Standardballons** von Rot bis Keramik, mit ihren RBE-Zahlen,
  ihrem Inhalt und ihren Immunitäten.
- Geld je zerstochener Schicht, Prämie je überstandener Runde, Verkauf eines
  Turms zu vier Fünfteln.
- Zwanzig von Hand geschriebene Runden, danach wachsende Wiederholungen ohne
  Ende.
- **Zwei Verbesserungssäulen je Turm** mit je zwei Stufen, kaufbar auch
  mitten in der Welle. Namen, Preise und Wirkungen sind die der Vorlage (die
  mittlere der vier Preisspalten), bis auf drei Stufen, die hier etwas anderes
  tun müssen - siehe unten.

## Bewusst anders

| Punkt           | Vorlage               | Hier                                      |
| --------------- | --------------------- | ----------------------------------------- |
| Zielvorgabe     | je Turm einstellbar   | der vorderste Ballon, fest                |
| Aufwertungen    | drei Pfade je Turm    | zwei Säulen je Turm, je zwei Stufen       |
| Schwierigkeiten | leicht/mittel/schwer  | eine Einstellung                          |
| Leben           | je nach Schwierigkeit | 150, ein Leben je durchgekommener Schicht |
| Startgeld       | je nach Schwierigkeit | $650, plus Schummelknopf (+$10.000)       |
| Tempo           | eins, zwei, drei      | Normal, Schnell (3x), Turbo (8x)          |
| Rundenstart     | von Hand              | von Hand oder Auto-Start                  |

Ausgenommen davon ist der Klebstoffschütze: Er nimmt den vordersten Ballon,
an dem noch nichts klebt, und schießt nicht, wenn alle in Reichweite kleben -
ein zweiter Klecks verlängert nichts. Der Eisaffe schießt überhaupt nicht: Er lässt
regelmäßig - alle 2,2 Sekunden, auch ohne Ziel in Reichweite - eine
Frostwelle los, die die vordersten acht in seinem Kreis eine Sekunde lang
ganz festfriert (die Anzahl steht in seiner `pierce`-Spalte und
wächst mit seiner zweiten Säule), statt alles unterschiedlich lange zu
verlangsamen; der Klebstoff bremst drei Sekunden lang auf die Hälfte.

Der Klebstoffschütze kann hier kein Blei beschädigen - in der Vorlage ebenso.
Lila ist gegen Energie, Feuer und Plasma immun; davon hat unter den
Primär-Affen niemand etwas, also ist Lila hier ein schneller Ballon ohne
Sonderrolle. Das ändert sich, sobald es Magie-Affen gibt.

### Drei Stufen, die hier anders wirken

| Stufe            | Vorlage                          | Hier                                            |
| ---------------- | -------------------------------- | ----------------------------------------------- |
| Cold Snap        | friert Blei und Getarnte         | friert, was gegen Eis immun ist: Weiß und Zebra |
| Permafrost       | Dauer über Schichten geregelt    | hält so lange an, wie der Frost gedauert hat    |
| Missile Launcher | +4 Reichweite (von 40 Einheiten) | zehn Prozent mehr Reichweite                    |

Getarnte Ballons gibt es hier nicht, und Blei ist in unserer Tabelle gegen
Spitzes und Klebstoff immun, nicht gegen Eis. Von den oberen Stufen (Tier 3
bis 5) ist nichts umgesetzt: Das sind im Vorbild eigene Fähigkeiten und keine
größeren Zahlen.

## Noch nicht umgesetzt

- **MOAB-Klasse**: M.O.A.B., D.D.T., B.F.B., Z.O.M.G., B.A.D.
- **Modifikatoren**: getarnt, nachwachsend, verstärkt, mit Schild.
- **Boss-Ballons**: Vortex, Bloonarius, Dreadbloon, Lych, Phayze,
  Blastapopoulos.
- **Militär-, Magie- und Unterstützungs-Affen.**
- **Der goldene Ballon.** Er steht in der Vorlage unter den Standardsorten,
  aber wann er auftaucht und wie lange er bleibt, ist dort eine eigene Regel.
  Erfundene Regeln in einem Nachbau merkt man sofort - also wartet er.

## Wenn eine zweite Karte dazukommt

1. Zehn Zeilen in `MAP` ersetzen oder eine zweite Liste danebenstellen.
2. Jedes Straßenfeld braucht **genau zwei** Straßennachbarn, Anfang und Ende
   genau einen. Sonst läuft `trackOf` in eine Abzweigung und nimmt die erste,
   die es findet.
3. Das `S` markiert den Anfang; das Ende ergibt sich daraus, wo der Weg aufhört.
