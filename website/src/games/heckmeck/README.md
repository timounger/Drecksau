# Heckmeck am Bratwurmeck

Das Würfelspiel von Reiner Knizia. Acht Würfel, sechzehn Chips auf dem Grill -
und eine Seite, die alles entscheidet:

> **Ohne Wurm zählt nichts.** Der Wurm zählt beim Addieren fünf, aber wer keinen
> beiseitegelegt hat, kann mit der schönsten Summe nichts anfangen.

Dazu der Haken, an dem sich das Spiel aufhängt: **Jeder Würfelwert darf pro Zug
nur einmal beiseitegelegt werden.** Der Wurf, der großzügig aussieht, ist oft
der, nach dem nichts mehr übrig ist.

## Spielen

`/heckmeck` teilt sofort ein Spiel gegen den Computer aus:

| Seite                     | Was dort passiert                     |
| ------------------------- | ------------------------------------- |
| `/heckmeck`               | Spiel gegen den Computer              |
| `/heckmeck/einstellungen` | Spielerzahl (2 bis 7)                 |
| `/heckmeck/online`        | automatische Suche oder privater Raum |
| `/heckmeck/statistik`     | gespielte Partien und Erfolge         |

Gewertet werden **Würmer**, nicht Chips: drei fette schlagen sechs dünne.

Die vollständigen Regeln stehen in
[docs/games/heckmeck/game-rules.md](../../../../docs/games/heckmeck/game-rules.md).

## Was der Bildschirm sagt

Drei Dinge, weil an dreien die Entscheidung hängt: was die Würfel zeigen, was
schon beiseiteliegt (und damit **verbraucht** ist), und ob ein Wurm dabei ist.
Das Letzte steht in Worten da und nicht als Symbol zum Suchen - ohne Wurm ist
der ganze Zug wertlos, und das darf einem nicht entgehen.

Verbrauchte Werte werden unter den Würfeln auf dem Tisch ausgegraut. Man sieht
also sofort, was ein Wurf noch hergibt.

## Der Computergegner

Zwei Entscheidungen, dieselben zwei wie beim Menschen.

**Welchen Wert beiseitelegen** ist Rechnen - der Wert mal seine Anzahl - mit
einer Ausnahme, die keines ist: Der erste Wurm ist nicht fünf Punkte wert,
sondern der Unterschied zwischen einem Zug und einem verlorenen. Dazu kommt
eine Prüfung, die der eigentliche Gewinn ist: Ein Zug, nach dem der niedrigste
Chip mit den verbleibenden Würfeln **rechnerisch nicht mehr erreichbar** ist,
ist schon tot - er sieht nur noch ein, zwei Würfe lang lebendig aus.

**Wann aufhören** ist Urteil: Weiterwürfeln lohnt nur, wenn ein wirklich
fetterer Chip in Reichweite ist - und die Reichweite wird mit vier je Würfel
gerechnet, nicht mit fünf. Fünf wäre die Zahl, mit der man sich einen Wurf zu
viel schönredet.

**Wie oft sich die Computergegner verspekulieren:** gemessen rund **7,5-mal je
Partie** zu dritt, und ähnlich viele Chips fliegen dabei aus dem Spiel. Das
sieht viel aus, ist aber das Spiel und nicht der Bot: Der niedrigste Chip ist
die 21, und die will erst einmal gewürfelt sein. Drei verschiedene Ansätze
(vorsichtiger legen, vorsichtiger aufhören, tote Züge vermeiden) landeten alle
bei derselben Zahl.

## Online ist hier wenig zu tun

**Nichts in Heckmeck ist geheim** - die Würfel liegen auf dem Tisch, der Grill
in der Mitte, jeder Stapel offen. Also keine Schwärzung, kein privater Kanal,
kein Host-Vault: Der geteilte Zustand _ist_ das Spiel. Es handelt immer genau
eine Person, und alle wissen wer, also darf die Schicht das auch melden und für
einen verlassenen Platz weiterspielen
([multiplayer/adapter.ts](multiplayer/adapter.ts)).

## Aufbau des Spielmoduls

```text
games/heckmeck/
  engine/       Chips, Wuerfel, Regeln, Computergegner - ohne DOM
  components/   Grill und Wuerfel, Endtafel, Einstellungen, Online
  hooks/        das Spiel gegen den Computer (Spielstand, Statistik)
  multiplayer/  der Adapter fuer die geteilte Online-Schicht
  settings/     Spielerzahl im Browser
  i18n/         deutsche Texte
  assets/       das Cover-Logo
```

## Cover-Logo

Das Bild liegt in [assets/logo.webp](assets/logo.webp) - ein Platzhalter, den
man durch echte WebP-Grafik ersetzen kann.
