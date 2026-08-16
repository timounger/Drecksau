# Kniffel

Der Würfelklassiker. Fünf Würfel, drei Würfe, dreizehn Felder - und die eine
Regel, die alles trägt:

> **Jedes Feld wird genau einmal gefüllt.** Ein Zug, der nichts hergibt, bringt
> nicht bloß wenig Punkte - er kostet ein Feld. Welches man opfert, ist die
> eigentliche Entscheidung.

## Spielen

`/kniffel` teilt sofort ein Spiel aus:

| Seite                    | Was dort passiert                     |
| ------------------------ | ------------------------------------- |
| `/kniffel`               | Spiel gegen den Computer              |
| `/kniffel/einstellungen` | Spielerzahl (1 bis 6)                 |
| `/kniffel/online`        | automatische Suche oder privater Raum |
| `/kniffel/statistik`     | gespielte Partien und Erfolge         |

**Eins ist eine gültige Spielerzahl.** Kniffel allein, gegen den eigenen
Rekord, ist keine Notlösung, sondern wie die meisten das Spiel kennen. Online
fängt die Auswahl trotzdem bei zwei an - ein Raum mit einer Person ist kein
Raum.

Die vollständigen Regeln stehen in
[docs/games/kniffel/game-rules.md](../../../../docs/games/kniffel/game-rules.md).

## Was der Block anzeigt

Neben jedem **freien** Feld steht, was der Wurf dort gerade brächte. Das nimmt
niemandem die Entscheidung ab - auf Papier rechnet man dasselbe im Kopf -, aber
es macht das Vergleichen zu dem, was es ist: einmal die Spalte runterschauen.

Eine **Null steht rot** da. Wer dort einträgt, streicht das Feld, und das soll
man sehen, bevor man klickt, nicht danach. Danach ist die Zeile
**durchgestrichen** - Name und Null, mit rotem Strich, so wie man auf Papier
einen Strich durch das Feld zieht. Eine nackte 0 würde nicht zeigen, dass hier
etwas geopfert wurde.

Die **Würfel liegen aufsteigend sortiert**, nach jedem Wurf neu. Das ist reine
Lesbarkeit: Fünf Würfel in Reihenfolge zählt man mit einem Blick, und eine
Straße sieht man, statt sie zusammenzusuchen. Sortiert wird dabei das **Paar**
aus Würfel und "behalten" - sonst zeigte das Behalten nach dem Sortieren auf
einen anderen Würfel, und die gehaltenen Sechsen kämen beim nächsten Wurf
wieder ins Rutschen.

## Der Computergegner

**Was er behält** ist eine lesbare Regel: eine Straße jagen, wenn vier in Folge
schon liegen, sonst die häufigste Zahl sammeln - bei Gleichstand die höhere,
weil der obere Teil nach Augenzahl bezahlt.

**Wo er einträgt** ist die Stelle, an der Kniffel gewonnen wird. Einfach die
größte Zahl zu nehmen ist oft falsch: 22 in die Chance zu schreiben bringt 22
und verbrennt das eine Feld, das später jeden Wurf annimmt. Also wird jedes
Feld danach bewertet, was es **jetzt** bringt, abzüglich dessen, was es
üblicherweise wert wäre, wenn man es aufhebt. Dass auf einem schlechten Wurf
irgendwo eine Null landen muss, fällt aus derselben Rechnung heraus - das
billigste Feld wird geopfert.

Dazu ein Schubs Richtung oberer Teil, solange der **Bonus** noch erreichbar
ist: Zwei Sechsen in die Sechser zu schreiben ist genau, wie die 35 Punkte
still verloren gehen.

Gemessen kommt er im Schnitt auf **rund 215 Punkte**, mit Kniffel in etwa jeder
zweiten Partie und Bonus in etwa jeder vierten.

## Online ist wenig zu tun

**Nichts in Kniffel ist geheim** - die Würfel liegen auf dem Tisch, jeder Block
wird beim Ausfüllen vorgelesen. Also keine Schwärzung, kein privater Kanal,
kein Host-Vault: Der geteilte Zustand _ist_ das Spiel
([multiplayer/adapter.ts](multiplayer/adapter.ts)).

## Aufbau des Spielmoduls

```text
games/kniffel/
  engine/       Wertung, Regeln, Computergegner - ohne DOM
  components/   Wuerfel und Block, Endtafel, Einstellungen, Online
  hooks/        das Spiel gegen den Computer (Spielstand, Statistik)
  multiplayer/  der Adapter fuer die geteilte Online-Schicht
  settings/     Spielerzahl im Browser
  i18n/         deutsche Texte
  assets/       das Cover-Logo
```

## Cover-Logo

Das Bild liegt in [assets/logo.webp](assets/logo.webp) - ein Platzhalter, den
man durch echte WebP-Grafik ersetzen kann.
