/**
 * The half of the screen the player acts on: the board, the hand, the choices.
 *
 * @module
 * @remarks
 * Every move of Dog is the same three questions - which card, which piece, and
 * which of the things that card can do with it - and this asks them in that
 * order and no other. The card first, because that is what is in the hand; then
 * the piece, by clicking it on the board where it stands; and only then, and
 * only if there is more than one, where it goes - by clicking the field, which
 * lights up. With only one place to go, the move is played at once.
 *
 * Nothing is offered that the referee would refuse. The lists come out of
 * ./engine/moves, so a button that exists is a move that works - which is worth
 * more in this game than in most, because the rules about the start field, the
 * home and the seven are exactly the ones a player forgets.
 */
"use client";

import {
  useCallback,
  useState,
  type ReactElement,
  type ReactNode,
} from "react";
import {
  CARD_CUT,
  DogBoard,
  middleOf,
  type Target,
} from "@/games/dog/components/dog-board";
import { DogIntro } from "@/games/dog/components/dog-intro";
import { giftSeat, teamPlay } from "@/games/dog/engine/board";
import {
  CARD_FACES,
  CARD_NAMES,
  WILD_CHOICES,
  rankOrder,
  type Card,
  type Rank,
} from "@/games/dog/engine/cards";
import {
  actsFor,
  applyMove,
  piecesAfter,
  playableCards,
  sevenChoices,
} from "@/games/dog/engine/moves";
import type { Act, DogGame, DogMove, Step } from "@/games/dog/engine/state";
import { DOG_TEXTS as T, SEAT_COLOURS } from "@/games/dog/i18n/texts";

/** How many points a seven has to spend. */
const SEVEN = 7;

/** What the play area needs. */
export type PlayAreaProps = {
  readonly game: DogGame;
  /** The seat the player sits in. */
  readonly mySeat: number;
  /** Plays a move. */
  readonly onMove: (move: DogMove) => void;
};

/** What the player has picked so far. */
type Pick = {
  readonly card: number | null;
  readonly as: Rank | null;
  readonly piece: number | null;
  readonly parts: readonly Step[];
  /** Was ein Feld bedeutet, auf dem zwei verschiedene Züge enden - oder null. */
  readonly clash: readonly Option[] | null;
};

/** Nothing picked. */
const NOTHING: Pick = {
  card: null,
  as: null,
  piece: null,
  parts: [],
  clash: null,
};

/** A whole move with the card that lies, and the rank it counts as. */
type Play = { readonly as: Rank; readonly act: Act };

/** What a piece can do: a whole move, or one part of a seven. */
type Option = Play | Step;

/** Where an option leaves the piece, and the board as a whole. */
type Landing = { readonly piece: Target["piece"]; readonly board: string };

/** A field the picked piece can go to, and every different move ending there. */
type Field = {
  readonly key: string;
  readonly piece: Target["piece"];
  readonly options: Option[];
  readonly boards: string[];
};

/**
 * The board, the hand and whatever has to be chosen next.
 *
 * @param props - the game, the seat and the way to play a move
 * @returns the play area
 */
export function PlayArea({
  game,
  mySeat,
  onMove,
}: PlayAreaProps): ReactElement {
  const [pick, setPick] = useState<Pick>(NOTHING);
  /** Die wählbare Figur unter dem Zeiger, für die Vorschau ihres Zugs. */
  const [hovered, setHovered] = useState<number | null>(null);
  // **Ein neues Spiel beginnt mit dem Hund, der durch die Leinwand bricht.**
  // Neu ist es, solange in der ersten Runde die eigene Karte noch nicht
  // weitergeschoben ist; erkannt wird es an der frisch ausgeteilten Hand. So
  // zeigt es sich am Tisch allein wie online, genau einmal je Spiel - auch
  // wenn ein neues Spiel auf ein ebenso frisches folgt.
  const fresh =
    game.round === 1 && game.phase === "passing" && game.given[mySeat] === null
      ? `${String(game.dealer)}:${(game.players[mySeat]?.hand ?? []).map((card) => card.id).join(",")}`
      : null;
  const [lastFresh, setLastFresh] = useState<string | null>(null);
  const [intro, setIntro] = useState(false);
  if (fresh !== lastFresh) {
    setLastFresh(fresh);
    setIntro(fresh !== null);
  }
  const endIntro = useCallback(() => setIntro(false), []);
  const mine = game.players[mySeat];
  const hand = [...(mine?.hand ?? [])].sort(
    (a, b) => rankOrder(a.rank) - rankOrder(b.rank),
  );
  const passing = game.phase === "passing";
  const myTurn = passing
    ? game.given[mySeat] === null
    : game.phase === "playing" && game.turn === mySeat;
  const playable = new Set(
    passing ? hand.map((card) => card.id) : playableCards(game, mySeat),
  );
  // Nothing to play: at a table with partners that is the end of the round for
  // this seat, and where everybody plays alone it is a card swapped for a new
  // one - so there the whole hand stays clickable.
  const stuck = myTurn && !passing && playable.size === 0 && hand.length > 0;
  const swapping = stuck && !teamPlay(game.seats);
  /** Wer die Karte bekommt, die zu Beginn der Runde weitergeschoben wird. */
  const receiver = game.players[giftSeat(mySeat, game.seats)]?.name ?? "?";
  const seven = pick.as === "7";
  // **Der Joker gilt einfach als alles**: Wer ihn legt, wählt keinen Wert,
  // sondern gleich die Figur und dann das Feld - welche Karte er dafür ist,
  // ergibt sich aus dem Zug. Die Sieben gehört dazu, soweit eine Figur sie
  // ganz geht; sie auf mehrere Figuren aufzuteilen, gibt es eigens als Knopf.
  const wild = pick.card !== null && pick.as === null;
  const plays: readonly Play[] =
    pick.card === null || seven
      ? []
      : pick.as === null
        ? [
            ...WILD_CHOICES.filter((rank) => rank !== "7").flatMap((rank) =>
              actsFor(game, mySeat, rank).map((act) => ({ as: rank, act })),
            ),
            ...sevenChoices(game, mySeat, [])
              .filter((step) => step.steps === SEVEN)
              .map((step) => ({
                as: "7" as const,
                act: { kind: "seven" as const, parts: [step] },
              })),
          ]
        : actsFor(game, mySeat, pick.as).map((act) => ({
            as: pick.as ?? "joker",
            act,
          }));
  const wildSeven = wild && actsFor(game, mySeat, "7", 1).length > 0;
  const steps = seven ? sevenChoices(game, mySeat, pick.parts) : [];
  const pickable = myTurn
    ? seven
      ? [...new Set(steps.map((step) => step.piece))]
      : [
          ...new Set(
            plays.map((play) => pieceOf(play.act)).filter((id) => id >= 0),
          ),
        ]
    : [];
  // Beim Aufteilen der Sieben zeigt das Brett schon, was die gewählten Teile
  // getan haben - jeder weitere geht von dort aus.
  const shown: DogGame =
    seven && pick.parts.length > 0
      ? { ...game, pieces: piecesAfter(game, pick.parts) ?? game.pieces }
      : game;

  /** Where the piece stands after one of its options, and the whole board. */
  const landing = (option: Option): Landing | null => {
    let after: readonly Target["piece"][] | null = null;
    let id = -1;
    if ("act" in option) {
      const card = pick.card;
      id = pieceOf(option.act);
      after =
        card === null
          ? null
          : (applyMove(game, mySeat, {
              kind: "play",
              card,
              as: option.as,
              act: option.act,
            })?.pieces ?? null);
    } else {
      id = option.piece;
      after = piecesAfter(game, [...pick.parts, option]);
    }
    const piece = after?.find((one) => one.id === id);
    return after === null || piece === undefined
      ? null
      : { piece, board: JSON.stringify(after) };
  };

  /**
   * Was eine Figur mit der liegenden Karte tun kann, nach Zielfeld geordnet.
   *
   * @remarks
   * Führen zwei Züge zum selben Ergebnis - der Joker als Ass oder als König
   * aus dem Zwinger -, bleibt einer. Landen zwei auf demselben Feld und tun
   * doch Verschiedenes - der Joker schlägt dort oder tauscht -, teilen sie
   * sich das Feld, und ein Klick darauf fragt nach.
   */
  const fieldsOf = (piece: number): readonly Field[] => {
    const fields: Field[] = [];
    const options: readonly Option[] = seven
      ? steps.filter((step) => step.piece === piece)
      : plays.filter((play) => pieceOf(play.act) === piece);
    for (const option of options) {
      const land = landing(option);
      if (land !== null) {
        const key = JSON.stringify(land.piece.spot);
        const field = fields.find((one) => one.key === key);
        if (field === undefined) {
          fields.push({
            key,
            piece: land.piece,
            options: [option],
            boards: [land.board],
          });
        } else if (!field.boards.includes(land.board)) {
          field.options.push(option);
          field.boards.push(land.board);
        }
      }
    }
    return fields;
  };

  // **So stünde die Figur danach**: blass dort, wohin ihr Zug sie bringt -
  // solange eine Karte liegt und der Zeiger auf einer wählbaren Figur ist.
  const ghosts =
    hovered === null ||
    hovered === pick.piece ||
    !pickable.includes(hovered) ||
    pick.card === null
      ? []
      : fieldsOf(hovered).map((field) => field.piece);

  // **Wohin die gewählte Figur gehen kann**, als leuchtende Felder - nur wenn
  // es mehr als eines ist; sonst ist der Zug schon gespielt.
  const reachable: readonly Field[] =
    pick.piece === null || !myTurn ? [] : fieldsOf(pick.piece);

  /** Lays a card, or picks it up again. */
  const choose = (card: Card) => {
    const same = pick.card === card.id;
    if (swapping) {
      onMove({ kind: "redraw", card: card.id });
      setPick(NOTHING);
      return;
    }
    setPick(
      same
        ? NOTHING
        : {
            card: card.id,
            as: card.rank === "joker" ? null : card.rank,
            piece: null,
            parts: [],
            clash: null,
          },
    );
    if (passing && !same) {
      onMove({ kind: "give", card: card.id });
      setPick(NOTHING);
    }
  };

  /** Plays a whole move with the card that lies. */
  const finish = (play: Play) => {
    const card = pick.card;
    if (card !== null) {
      onMove({ kind: "play", card, as: play.as, act: play.act });
    }
    setPick(NOTHING);
  };

  /** Plays an option of the picked piece: a whole move, or a part of a seven. */
  const take = (option: Option) => {
    if ("act" in option) {
      finish(option);
    } else {
      addPart(option);
    }
  };

  /** Plays what a field stands for - or asks, when it stands for two things. */
  const takeField = (field: Field) => {
    const only = field.options.length === 1 ? field.options[0] : undefined;
    if (only !== undefined) {
      take(only);
    } else {
      setPick({ ...pick, clash: field.options });
    }
  };

  /** Picks a piece - and plays its move at once when it has only one. */
  const pickPiece = (piece: number) => {
    const fields = fieldsOf(piece);
    const only = fields.length === 1 ? fields[0] : undefined;
    if (only !== undefined) {
      takeField(only);
    } else {
      setPick({
        ...pick,
        piece: pick.piece === piece ? null : piece,
        clash: null,
      });
    }
  };

  /** Adds one part to a seven, and plays it once all seven are spent. */
  const addPart = (step: Step) => {
    const parts = [...pick.parts, step];
    const spent = parts.reduce((sum, part) => sum + part.steps, 0);
    if (spent >= SEVEN) {
      const card = pick.card;
      if (card !== null) {
        onMove({ kind: "play", card, as: "7", act: { kind: "seven", parts } });
      }
      setPick(NOTHING);
    } else {
      setPick({ ...pick, piece: null, parts, clash: null });
    }
  };

  /** Was gerade zu wählen ist, nachdem eine Karte liegt - oder null. */
  const choices = (compact: boolean): ReactElement | null =>
    myTurn && pick.card !== null ? (
      <div
        data-testid="dog-choices"
        className={
          compact
            ? "flex w-full flex-wrap items-center justify-center gap-[3cqw] text-center text-[6.5cqw]"
            : "flex flex-wrap items-center gap-2 rounded-2xl border border-amber-300 bg-amber-50 p-3 text-sm dark:border-amber-700 dark:bg-amber-950/40"
        }
      >
        {pick.clash !== null ? (
          <>
            <Prompt compact={compact}>{T.whichMove}</Prompt>
            {pick.clash.map((option) => (
              <Choice
                key={JSON.stringify(option)}
                compact={compact}
                label={optionLabel(game, option)}
                onClick={() => take(option)}
              />
            ))}
          </>
        ) : seven ? (
          <>
            <Prompt compact={compact}>
              {T.sevenLeft(
                SEVEN - pick.parts.reduce((sum, part) => sum + part.steps, 0),
              )}
            </Prompt>
            <Prompt compact={compact}>
              {pick.piece === null ? T.pickPiece : T.pickField}
            </Prompt>
          </>
        ) : (
          <>
            <Prompt compact={compact}>
              {pick.piece === null
                ? T.pickPiece
                : pick.as === "swap"
                  ? T.pickOther
                  : T.pickField}
            </Prompt>
            {(pick.piece === null
              ? plays.filter(
                  (play, at) =>
                    pieceOf(play.act) < 0 &&
                    plays.findIndex((one) => one.act.kind === play.act.kind) ===
                      at &&
                    // Den Joker wirkungslos abzulegen, wird nur angeboten,
                    // wenn er sonst nichts kann.
                    (!wild || (pickable.length === 0 && !wildSeven)),
                )
              : []
            ).map((play) => (
              <Choice
                key={JSON.stringify(play)}
                compact={compact}
                label={actLabel(game, play.act)}
                onClick={() => finish(play)}
              />
            ))}
            {wildSeven && pick.piece === null && (
              <Choice
                compact={compact}
                label={T.jokerSeven}
                onClick={() => setPick({ ...pick, as: "7" })}
              />
            )}
          </>
        )}
        <button
          type="button"
          onClick={() => setPick(NOTHING)}
          className={
            compact
              ? "cursor-pointer rounded-[3cqw] border border-zinc-400 px-[4cqw] py-[1.5cqw] text-[6cqw] hover:bg-zinc-100"
              : "ml-auto cursor-pointer rounded-lg border border-zinc-300 px-3 py-1 text-xs hover:bg-white dark:border-zinc-600 dark:hover:bg-zinc-800"
          }
        >
          {T.cancel}
        </button>
      </div>
    ) : null;

  /** Was zu tun ist, solange keine Karte liegt: die Frage und, wenn nichts geht, der Ausweg. */
  const todo = (compact: boolean): ReactElement => (
    <>
      <h2
        className={
          compact
            ? "text-[7cqw] leading-tight font-semibold"
            : "mb-2 text-sm font-semibold"
        }
      >
        {myTurn
          ? passing
            ? T.passYours(receiver, teamPlay(game.seats))
            : T.pickCard
          : passing
            ? T.passed(receiver)
            : T.yourCards}
      </h2>
      {stuck && swapping && (
        <p
          className={
            compact
              ? "text-[5.5cqw] leading-tight text-zinc-600"
              : "mt-3 text-xs text-zinc-500 dark:text-zinc-400"
          }
        >
          {T.redrawHint}
        </p>
      )}
      {stuck && !swapping && (
        <div
          className={
            compact
              ? "flex flex-col items-center gap-[2cqw]"
              : "mt-3 flex flex-wrap items-center gap-2"
          }
        >
          <span
            className={
              compact
                ? "text-[5.5cqw] leading-tight text-zinc-600"
                : "text-xs text-zinc-500 dark:text-zinc-400"
            }
          >
            {T.foldHint}
          </span>
          <button
            type="button"
            data-testid="dog-fold"
            onClick={() => onMove({ kind: "fold" })}
            className={
              compact
                ? "cursor-pointer rounded-[3cqw] bg-zinc-900 px-[5cqw] py-[2cqw] text-[6.5cqw] font-semibold text-white hover:bg-zinc-700"
                : "cursor-pointer rounded-lg bg-zinc-900 px-3 py-1.5 text-sm font-semibold text-white hover:bg-zinc-700 dark:bg-zinc-100 dark:text-zinc-900"
            }
          >
            {T.fold}
          </button>
        </div>
      )}
    </>
  );

  /**
   * Die eigenen Karten.
   *
   * @param size - in der Reihe auf dem Brett: wie breit eine Karte ist, in
   *   Hundertsteln der Reihe (cqw); unter dem Brett null
   */
  const cardsOf = (size: number): ReactElement => (
    <ul
      data-testid="dog-hand"
      style={
        size > 0 ? { gap: `${String(size * CARD_CUT.gap)}cqw` } : undefined
      }
      className={
        size > 0
          ? "flex h-full flex-nowrap items-center justify-center"
          : "flex flex-wrap gap-2"
      }
    >
      {hand.map((card) => (
        <li key={card.id}>
          <CardButton
            card={card}
            size={size}
            held={pick.card === card.id}
            enabled={myTurn && (playable.has(card.id) || swapping)}
            onClick={() => choose(card)}
          />
        </li>
      ))}
      {hand.length === 0 && (
        <li
          className={
            size > 0
              ? "rounded-[3cqw] bg-white/90 px-[3cqw] py-[1cqw] text-[4cqw] text-zinc-600"
              : "text-sm text-zinc-500 dark:text-zinc-400"
          }
        >
          {T.waiting}
        </li>
      )}
    </ul>
  );

  // **Was zu tun ist, steht in der Mitte des Bretts, die Karten liegen gleich
  // darunter in einer Reihe** - dort, wo ohnehin hingeschaut wird. Nur am
  // Tisch zu zweit reicht der Platz nicht; dann liegt alles wie früher unter
  // dem Brett.
  const middle = middleOf(game.seats, hand.length);
  const size = middle === null ? 0 : cardWidth(hand.length);

  return (
    <div className="flex flex-col gap-3">
      <DogBoard
        game={shown}
        mySeat={mySeat}
        pickable={pickable}
        picked={pick.piece}
        onPick={(piece) => {
          setHovered(null);
          pickPiece(piece);
        }}
        onHover={setHovered}
        ghosts={ghosts}
        targets={reachable.map((field) => ({
          piece: field.piece,
          label: field.options
            .map((option) => optionLabel(game, option))
            .join(" / "),
        }))}
        onTarget={(index) => {
          const field = reachable[index];
          if (field !== undefined) {
            takeField(field);
          }
        }}
        actions={
          middle === null ? undefined : (
            <div className="flex max-h-full w-full flex-col items-center gap-[3cqw] p-[4cqw] text-center">
              {choices(true) ?? todo(true)}
            </div>
          )
        }
        hand={middle === null ? undefined : cardsOf(size)}
        overlay={intro ? <DogIntro onDone={endIntro} /> : undefined}
      />

      {middle === null && choices(false)}

      {middle === null && (
        <section className="rounded-2xl border border-zinc-200 bg-white p-3 dark:border-zinc-800 dark:bg-zinc-900">
          {todo(false)}
          {cardsOf(0)}
        </section>
      )}
    </div>
  );
}

/** Die ganze Reihe, in Hundertsteln ihrer selbst (cqw). */
const WHOLE = 100;

/** Und wie eine Karte geschnitten ist: so breit wie drei Viertel ihrer Höhe. */
const CARD_SHAPE = CARD_CUT.shape;

/**
 * Wie breit eine Karte in der Reihe auf dem Brett ist.
 *
 * @param count - wie viele Karten nebeneinander liegen
 * @returns die Breite einer Karte in Hundertsteln der Reihe (cqw)
 * @remarks
 * Die Reihe ist schon genau auf die Karten zugeschnitten ({@link middleOf}):
 * so viele Karten, wie es sind, und dazwischen je ein kleiner Abstand. Damit
 * füllen sie sie ganz - so groß, wie es zwischen den Feldern gerade passt.
 */
function cardWidth(count: number): number {
  const many = Math.max(1, count);
  return WHOLE / (many + (many - 1) * CARD_CUT.gap);
}

/**
 * Wie groß Zeichen, Name, Rand und Ecken einer Karte in der Reihe sind, als
 * Teil ihrer Breite.
 */
const CARD_FACE = 0.75;
const CARD_EDGE = 0.04;
const CARD_ROUND = 0.16;

/**
 * Welche Karten rot sind - alle anderen sind blau. Die Schrift ist auf
 * beiden schwarz.
 *
 * @remarks
 * Rot sind alle Karten mit einer besonderen Fähigkeit, so wie auf den Karten
 * des Spiels: die 1/11 und die 13 (aus dem Zwinger), die 4 (auch rückwärts),
 * die 7 (aufteilen), die Tauschkarte und der Joker.
 */
const RED_CARDS: readonly Rank[] = ["A", "4", "7", "K", "swap", "joker"];

/** One card of the hand. */
function CardButton({
  card,
  size,
  held,
  enabled,
  onClick,
}: {
  readonly card: Card;
  /**
   * Wie breit sie in der Reihe auf dem Brett ist, in Hundertsteln der Reihe
   * (cqw) - oder null für die feste Größe unter dem Brett.
   */
  readonly size: number;
  readonly held: boolean;
  readonly enabled: boolean;
  readonly onClick: () => void;
}): ReactElement {
  const red = RED_CARDS.includes(card.rank);
  return (
    <button
      type="button"
      disabled={!enabled}
      onClick={onClick}
      data-testid={`dog-card-${String(card.id)}`}
      title={CARD_NAMES[card.rank]}
      style={
        size > 0
          ? {
              width: `${String(size)}cqw`,
              height: `${String(size / CARD_SHAPE)}cqw`,
              fontSize: `${String(size * CARD_FACE)}cqw`,
              borderWidth: `${String(size * CARD_EDGE)}cqw`,
              borderRadius: `${String(size * CARD_ROUND)}cqw`,
            }
          : undefined
      }
      className={`flex cursor-pointer flex-col items-center justify-center font-bold text-zinc-950 shadow-md transition disabled:cursor-not-allowed disabled:opacity-60 ${
        size > 0 ? "" : "h-16 w-12 rounded-lg border-2 text-lg"
      } ${
        // **Wie die echten Karten**: rot oder blau, die Schrift immer
        // schwarz. Die gewählte bekommt einen goldenen Rand.
        red ? "bg-red-500 hover:bg-red-400" : "bg-blue-400 hover:bg-blue-300"
      } ${
        held
          ? "-translate-y-1 border-amber-300 ring-2 ring-amber-400"
          : "border-white/70"
      }`}
    >
      <CardFace rank={card.rank} />
    </button>
  );
}

/**
 * Was auf einer Karte steht, so wie auf den echten Karten.
 *
 * @remarks
 * Gemessen in `em`, also an der Schriftgröße der Karte - so passt es auf die
 * große Karte unter dem Brett genauso wie auf die kleine in seiner Mitte. Die
 * 1 und die 11 stehen untereinander, hinter der 4 steht ein Plus-Minus,
 * rechts neben der 7 ein Feuer, unter dem Doppelpfeil "Tauschen". Die Zahlen
 * stehen in Hemi Head ({@link CARD_FONT}).
 */
function CardFace({ rank }: { readonly rank: Rank }): ReactElement {
  let face: ReactElement;
  switch (rank) {
    case "A":
      face = (
        <StartMark>
          <span className="flex flex-col items-center leading-[0.95]">
            <span style={{ fontSize: `${String(FACE.ace)}em` }}>1</span>
            <span style={{ fontSize: `${String(FACE.ace)}em` }}>11</span>
          </span>
        </StartMark>
      );
      break;
    case "K":
      face = (
        <StartMark>
          <span className="leading-none">{CARD_FACES[rank]}</span>
        </StartMark>
      );
      break;
    case "4":
      face = (
        <span className="flex items-start leading-none">
          4<span style={{ fontSize: `${String(FACE.mark)}em` }}>±</span>
        </span>
      );
      break;
    case "7":
      face = (
        // Die 7 steht in der Mitte, das Feuer lodert groß um sie herum -
        // beide in derselben Zelle, die 7 obenauf.
        <span className="grid place-items-center leading-none">
          <span
            aria-hidden="true"
            className="col-start-1 row-start-1 not-italic"
            style={{ fontSize: `${String(FACE.fire)}em` }}
          >
            {"\u{1F525}"}
          </span>
          <span className="relative col-start-1 row-start-1">7</span>
        </span>
      );
      break;
    case "swap":
      face = (
        <span className="flex flex-col items-center leading-none">
          {CARD_FACES[rank]}
          <span
            className="font-semibold"
            style={{ fontSize: `${String(FACE.label)}em` }}
          >
            {T.swapCard}
          </span>
        </span>
      );
      break;
    default:
      face = <span className="leading-none">{CARD_FACES[rank]}</span>;
  }
  return (
    <span
      style={{ fontFamily: CARD_FONT, fontStyle: "italic", fontWeight: 700 }}
    >
      {face}
    </span>
  );
}

/**
 * Das Startzeichen hinter der Zahl: ein Dreieck wie auf einem Play-Knopf.
 *
 * @remarks
 * Auf den Karten, mit denen eine Figur aus dem Zwinger kommt - der 1/11 und
 * der 13. Hell und groß hinter der Zahl, beide in derselben Zelle, die Zahl
 * obenauf.
 */
function StartMark({
  children,
}: {
  readonly children: ReactNode;
}): ReactElement {
  return (
    <span className="grid place-items-center">
      <svg
        aria-hidden="true"
        viewBox="0 0 10 10"
        className="col-start-1 row-start-1 max-w-none"
        style={{
          width: `${String(FACE.start)}em`,
          height: `${String(FACE.start)}em`,
        }}
      >
        <path
          d="M2.6 1.1 Q1.7 0.6 1.7 1.7 V8.3 Q1.7 9.4 2.6 8.9 L8.7 5.6 Q9.5 5 8.7 4.4 Z"
          fill="#ffffff"
          fillOpacity={0.7}
        />
      </svg>
      <span className="relative col-start-1 row-start-1">{children}</span>
    </span>
  );
}

/** Wie groß die Beigaben auf einer Karte sind, als Teil ihrer Schrift. */
const FACE = {
  ace: 0.8,
  mark: 0.5,
  fire: 1.2,
  label: 0.2,
  start: 1.5,
} as const;

/**
 * Die Schrift der Zahlen: Hemi Head, wie auf den echten Karten.
 *
 * @remarks
 * Hemi Head ist keine freie Webschrift und wird deshalb nicht mitgeliefert -
 * wer sie installiert hat, sieht sie, alle anderen eine ähnlich fette,
 * breite Schrift. Kursiv und fett, weil es der Schnitt ist, in dem sie auf
 * den Karten steht.
 */
const CARD_FONT = '"Hemi Head Rg", "Hemi Head", "Arial Black", sans-serif';

/** One thing that can be chosen. */
function Choice({
  label,
  compact,
  onClick,
}: {
  readonly label: string;
  /** Klein, für die Mitte des Bretts. */
  readonly compact: boolean;
  readonly onClick: () => void;
}): ReactElement {
  return (
    <button
      type="button"
      onClick={onClick}
      className={
        compact
          ? "cursor-pointer rounded-[3cqw] bg-zinc-900 px-[4cqw] py-[1.5cqw] text-[6cqw] font-semibold text-white hover:bg-zinc-700"
          : "cursor-pointer rounded-lg bg-zinc-900 px-3 py-1.5 text-xs font-semibold text-white hover:bg-zinc-700 dark:bg-zinc-100 dark:text-zinc-900"
      }
    >
      {label}
    </button>
  );
}

/** Die Frage über einer Auswahl. */
function Prompt({
  compact,
  children,
}: {
  readonly compact: boolean;
  readonly children: ReactNode;
}): ReactElement {
  return (
    <span
      className={
        compact
          ? "w-full text-[6.5cqw] leading-tight font-semibold"
          : "font-semibold"
      }
    >
      {children}
    </span>
  );
}

/** Which piece an act moves, or below zero when it moves none. */
function pieceOf(act: Act): number {
  let id = -1;
  if (act.kind === "start" || act.kind === "walk" || act.kind === "swap") {
    id = act.piece;
  } else if (act.kind === "seven" && act.parts.length === 1) {
    // Eine Sieben, die eine einzige Figur ganz geht.
    id = act.parts[0]?.piece ?? -1;
  }
  return id;
}

/** What an act is called on its button. */
function actLabel(game: DogGame, act: Act): string {
  let said: string = T.nothing;
  switch (act.kind) {
    case "start":
      said = T.outOfKennel;
      break;
    case "walk":
      said = act.home
        ? T.intoHome(act.steps)
        : act.backwards
          ? T.stepsBack(act.steps)
          : T.steps(act.steps);
      break;
    case "swap": {
      const other = game.pieces.find((piece) => piece.id === act.other);
      said = T.swapWith(
        other === undefined
          ? "?"
          : (game.players[other.seat]?.name ?? SEAT_COLOURS[other.seat].name),
      );
      break;
    }
    case "seven":
      said =
        act.parts.length === 1 && act.parts[0]?.home === true
          ? T.intoHome(SEVEN)
          : T.steps(SEVEN);
      break;
    default:
      said = T.nothing;
  }
  return said;
}

/** What an option is called: a whole move, or a part of a seven. */
function optionLabel(game: DogGame, option: Option): string {
  return "act" in option ? actLabel(game, option.act) : stepLabel(option);
}

/** What one part of a seven is called on its button. */
function stepLabel(step: Step): string {
  return step.home ? T.intoHome(step.steps) : T.steps(step.steps);
}
