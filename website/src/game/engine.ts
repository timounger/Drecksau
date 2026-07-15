/**
 * Applies moves to a game state: card effects, drawing, and the win check.
 *
 * @module
 */
import { isAttachedCard, type ActionCardType, type Card } from "./cards";
import { isLegalMove } from "./moves";
import { shuffle, type RandomState } from "./random";
import {
  attachedCards,
  currentPlayer,
  handCardById,
  hasBarn,
  hasWon,
  ownerOfPig,
  HAND_SIZE,
  type GameState,
  type Move,
  type Pig,
  type PigId,
  type Player,
} from "./state";
import { CARD_NAMES, LOG_TEXTS, logLine } from "@/i18n/translations";

/** Result of a card effect: the new table plus cards freed for the discard. */
type EffectResult = {
  readonly players: readonly Player[];
  /** Cards that leave the table, e.g. a stall burnt down by lightning. */
  readonly releasedCards: readonly Card[];
  /** Log text describing what happened, without the player name. */
  readonly logText: string;
};

/**
 * Applies a move and hands the turn to the next player.
 *
 * @param state - the current state
 * @param move - the move of the active player
 * @returns the state after effect, draw and turn change
 * @throws if the move breaks the rules
 * @example
 * ```ts
 * const next = applyMove(state, { kind: "playCard", cardId: "mud-0", targetPigId: "p0-pig1" });
 * ```
 */
export function applyMove(state: GameState, move: Move): GameState {
  if (!isLegalMove(state, move)) {
    throw new Error(`illegal move: ${JSON.stringify(move)}`);
  }

  const afterMove = runMove(state, move);
  const refilled = refillHand(afterMove);
  return finishTurn(refilled);
}

/** Runs the move itself, without drawing or passing the turn. */
function runMove(state: GameState, move: Move): GameState {
  let next: GameState;

  switch (move.kind) {
    case "playCard":
      next = playCard(state, move.cardId, move.targetPigId);
      break;
    case "discardCard":
      next = discardCard(state, move.cardId);
      break;
    case "redrawHand":
      next = redrawHand(state);
      break;
  }

  return next;
}

/** Plays a card, resolves its effect and moves it to hand, pig or discard. */
function playCard(
  state: GameState,
  cardId: string,
  targetPigId: PigId | undefined,
): GameState {
  const actor = currentPlayer(state);
  const card = handCardById(actor, cardId);
  const effect = applyEffect(state, actor, card, targetPigId);

  // Attached cards stay on the pig, everything else goes to the discard pile.
  const discarded = isAttachedCard(card.type) ? [] : [card];

  return appendLog(
    {
      ...state,
      players: withoutHandCard(effect.players, actor.id, cardId),
      discardPile: [
        ...state.discardPile,
        ...discarded,
        ...effect.releasedCards,
      ],
    },
    logLine(actor.name, effect.logText),
  );
}

/** Puts a card on the discard pile without using it. */
function discardCard(state: GameState, cardId: string): GameState {
  const actor = currentPlayer(state);
  const card = handCardById(actor, cardId);

  return appendLog(
    {
      ...state,
      players: withoutHandCard(state.players, actor.id, cardId),
      discardPile: [...state.discardPile, card],
    },
    logLine(actor.name, LOG_TEXTS.discard(cardTypeName(card.type))),
  );
}

/** Blockade rule: discard the whole hand, the refill draws three new cards. */
function redrawHand(state: GameState): GameState {
  const actor = currentPlayer(state);

  return appendLog(
    {
      ...state,
      players: state.players.map((player) =>
        player.id === actor.id ? { ...player, hand: [] } : player,
      ),
      discardPile: [...state.discardPile, ...actor.hand],
    },
    logLine(actor.name, LOG_TEXTS.redraw),
  );
}

/**
 * Per card type: how it changes the table.
 *
 * @remarks
 * A lookup instead of an if-else chain. Legality has already been checked by
 * {@link isLegalMove}, so each effect may assume a valid target.
 */
const EFFECTS: Readonly<
  Record<
    ActionCardType,
    (
      state: GameState,
      actor: Player,
      card: Card,
      targetPigId: PigId | undefined,
    ) => EffectResult
  >
> = {
  mud: (state, actor, card, targetPigId) => ({
    players: updatePig(state.players, targetPigId!, (pig) => ({
      ...pig,
      isDirty: true,
    })),
    releasedCards: [],
    logText: LOG_TEXTS.mud,
  }),

  rain: (state) => {
    // Every dirty pig without a stall gets washed clean - the own ones too.
    const isWashed = (pig: Pig) => pig.isDirty && !hasBarn(pig);
    const cleaned = state.players
      .flatMap((player) => player.pigs)
      .filter(isWashed).length;
    const players = state.players.map((player) => ({
      ...player,
      pigs: player.pigs.map((pig) =>
        isWashed(pig) ? { ...pig, isDirty: false } : pig,
      ),
    }));
    return { players, releasedCards: [], logText: LOG_TEXTS.rain(cleaned) };
  },

  barn: (state, actor, card, targetPigId) => ({
    players: updatePig(state.players, targetPigId!, (pig) => ({
      ...pig,
      barn: card,
    })),
    releasedCards: [],
    logText: LOG_TEXTS.barn,
  }),

  lightning: (state, actor, card, targetPigId) => {
    // The stall burns down and takes the nailed door with it. Everything that
    // was attached goes to the discard pile.
    const victim = ownerOfPig(state, targetPigId!);
    const pig = victim.pigs.find((candidate) => candidate.id === targetPigId)!;
    return {
      players: updatePig(state.players, targetPigId!, (target) => ({
        ...target,
        barn: null,
        lightningRod: null,
        barnDoor: null,
      })),
      releasedCards: attachedCards(pig),
      logText: LOG_TEXTS.lightning(victim.name),
    };
  },

  lightningRod: (state, actor, card, targetPigId) => ({
    players: updatePig(state.players, targetPigId!, (pig) => ({
      ...pig,
      lightningRod: card,
    })),
    releasedCards: [],
    logText: LOG_TEXTS.lightningRod,
  }),

  farmerScrubs: (state, actor, card, targetPigId) => ({
    players: updatePig(state.players, targetPigId!, (pig) => ({
      ...pig,
      isDirty: false,
    })),
    releasedCards: [],
    logText: LOG_TEXTS.farmerScrubs(ownerOfPig(state, targetPigId!).name),
  }),

  barnDoor: (state, actor, card, targetPigId) => ({
    players: updatePig(state.players, targetPigId!, (pig) => ({
      ...pig,
      barnDoor: card,
    })),
    releasedCards: [],
    logText: LOG_TEXTS.barnDoor,
  }),
};

/** Dispatches to the effect of the played card. */
function applyEffect(
  state: GameState,
  actor: Player,
  card: Card,
  targetPigId: PigId | undefined,
): EffectResult {
  return EFFECTS[card.type](state, actor, card, targetPigId);
}

/** Draws until the active player holds a full hand again. */
function refillHand(state: GameState): GameState {
  let current = state;
  const actorId = currentPlayer(state).id;

  while (
    current.players.find((player) => player.id === actorId)!.hand.length <
    HAND_SIZE
  ) {
    const drawn = drawCard(current);
    if (drawn === null) {
      // Neither pile holds a card - nothing left to draw.
      break;
    }
    current = {
      ...drawn.state,
      players: drawn.state.players.map((player) =>
        player.id === actorId
          ? { ...player, hand: [...player.hand, drawn.card] }
          : player,
      ),
    };
  }

  return current;
}

/** Takes the top card, reshuffling the discard pile when the deck runs out. */
function drawCard(state: GameState): { card: Card; state: GameState } | null {
  const ready = state.drawPile.length > 0 ? state : reshuffleDiscard(state);
  let result: { card: Card; state: GameState } | null;

  if (ready.drawPile.length === 0) {
    result = null;
  } else {
    const [card, ...rest] = ready.drawPile;
    result = { card, state: { ...ready, drawPile: rest } };
  }

  return result;
}

/** Shuffles the discard pile into a new draw pile. */
function reshuffleDiscard(state: GameState): GameState {
  let next = state;

  if (state.discardPile.length > 0) {
    const shuffled: { items: Card[]; state: RandomState } = shuffle(
      state.discardPile,
      state.random,
    );
    next = appendLog(
      {
        ...state,
        drawPile: shuffled.items,
        discardPile: [],
        random: shuffled.state,
      },
      LOG_TEXTS.reshuffle,
    );
  }

  return next;
}

/** Checks for a winner and otherwise passes the turn on. */
function finishTurn(state: GameState): GameState {
  const actor = currentPlayer(state);
  let next: GameState;

  if (hasWon(actor)) {
    next = appendLog(
      { ...state, winnerId: actor.id },
      LOG_TEXTS.win(actor.name),
    );
  } else {
    next = {
      ...state,
      currentPlayerIndex: (state.currentPlayerIndex + 1) % state.players.length,
    };
  }

  return next;
}

/** Replaces one pig, leaving every other player and pig untouched. */
function updatePig(
  players: readonly Player[],
  pigId: PigId,
  update: (pig: Pig) => Pig,
): Player[] {
  return players.map((player) => ({
    ...player,
    pigs: player.pigs.map((pig) => (pig.id === pigId ? update(pig) : pig)),
  }));
}

/** Removes a card from a player's hand. */
function withoutHandCard(
  players: readonly Player[],
  playerId: string,
  cardId: string,
): Player[] {
  return players.map((player) =>
    player.id === playerId
      ? { ...player, hand: player.hand.filter((card) => card.id !== cardId) }
      : player,
  );
}

/** Appends a log line with a stable id. */
function appendLog(state: GameState, text: string): GameState {
  return {
    ...state,
    log: [...state.log, { id: state.nextLogId, text }],
    nextLogId: state.nextLogId + 1,
  };
}

/** German name of a card type, for the log. */
function cardTypeName(type: ActionCardType): string {
  return CARD_NAMES[type];
}
