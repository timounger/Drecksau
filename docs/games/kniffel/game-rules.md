# Kniffel - Spielregeln

Umsetzung des Würfelklassikers (Schmidt Spiele), der deutschen Fassung von
Yahtzee.

1 bis 6 Spieler - **allein zu spielen ist hier ausdrücklich vorgesehen**, denn
so hat Kniffel die meisten Abende verbracht.

## Ein Zug

Fünf Würfel, **drei Würfe**. Nach dem ersten und zweiten Wurf darf man beliebig
viele Würfel liegen lassen und den Rest erneut werfen. Danach **muss** das
Ergebnis in ein noch freies Feld eingetragen werden - notfalls als Null.

Jedes der dreizehn Felder wird genau einmal gefüllt. Nach dreizehn Runden ist
der Block voll.

## Die Felder

**Oberer Teil** - gezählt wird jeweils die Summe der Würfel dieser Zahl:

| Feld    | Ergibt              |
| ------- | ------------------- |
| Einser  | Summe aller Einsen  |
| Zweier  | Summe aller Zweien  |
| Dreier  | Summe aller Dreien  |
| Vierer  | Summe aller Vieren  |
| Fünfer  | Summe aller Fünfen  |
| Sechser | Summe aller Sechsen |

**Bonus:** Wer im oberen Teil **63 Punkte oder mehr** hat, bekommt **35 Punkte**
dazu. Dreiundsechzig ist genau dreimal jede Zahl - das ist der Maßstab, an dem
man während des Spiels misst.

**Unterer Teil:**

| Feld          | Bedingung                   | Ergibt        |
| ------------- | --------------------------- | ------------- |
| Dreierpasch   | drei gleiche                | Summe aller 5 |
| Viererpasch   | vier gleiche                | Summe aller 5 |
| Full House    | drei gleiche + zwei gleiche | 25            |
| Kleine Straße | vier in Folge               | 30            |
| Große Straße  | fünf in Folge               | 40            |
| Kniffel       | fünf gleiche                | 50            |
| Chance        | beliebig                    | Summe aller 5 |

Ein **Kniffel zählt nicht als Full House** - fünf gleiche sind nicht "drei und
zwei". Der deutsche Block ist da streng.

## Spielende

Sind alle Blöcke voll, zählt jede:r zusammen: oberer Teil + Bonus + unterer
Teil. Die höchste Summe gewinnt.

## Bewusste Abweichungen

1. **Kein Kniffel-Bonus und keine Joker-Regel.** Die amerikanische
   Yahtzee-Fassung gibt für jeden weiteren Kniffel 100 Punkte extra und erlaubt
   ihn als Joker in anderen Feldern. Der klassische deutsche Kniffel-Block hat
   das nicht, und hier ist es entsprechend weggelassen.
2. **Der erste Wurf passiert automatisch.** Er ist keine Entscheidung - ein Zug
   _beginnt_ damit -, also gibt es keinen Knopf dafür. Gefragt wird erst nach
   dem zweiten und dritten Wurf.
3. **Der Block zeigt, was ein Feld gerade brächte.** Auf Papier rechnet man das
   im Kopf; hier steht es daneben. Eine Null wird rot angezeigt, damit klar
   ist, dass Eintragen das Feld streicht.

## Umsetzung

- Wertung und Zustand:
  [engine/state.ts](../../../website/src/games/kniffel/engine/state.ts)
- Regeln: [engine/moves.ts](../../../website/src/games/kniffel/engine/moves.ts)
- Computergegner: [engine/ai.ts](../../../website/src/games/kniffel/engine/ai.ts)
- Online: [multiplayer/adapter.ts](../../../website/src/games/kniffel/multiplayer/adapter.ts)
