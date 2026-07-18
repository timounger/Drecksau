/**
 * The game-agnostic online core's types, and the seam a game plugs in through.
 *
 * @module
 * @remarks
 * The online layer (room reducer, transport, hook) knows nothing about any
 * particular game. Everything game-specific is reached through an
 * {@link OnlineAdapter}: how to deal a game, who is on turn, whether a move is
 * legal, how to hide hidden information from the other players, and how to
 * validate anything read off the wire. Each game provides one adapter; Drecksau
 * and Binokel share the whole layer this way.
 *
 * The type parameters are: `G` the game state, `M` a move, `H` one seat's
 * private data (its hand), `O` the options chosen when starting.
 */

/** Identifies a player across a whole room; stable per browser/session. */
export type SeatId = string;

/** Where a room is in its life. */
export type RoomPhase = "lobby" | "playing" | "finished";

/** One player at the table. */
export type Seat = {
  readonly id: SeatId;
  /** Shown to the others - the player's name. */
  readonly name: string;
  /** True for the one player who runs the authoritative game. */
  readonly isHost: boolean;
};

/**
 * A public event a client can animate, stamped by the host.
 *
 * @remarks
 * The `type` is a game-defined string (Drecksau: the played card's type); the
 * `id` is unique per event (the room version), so each event animates once.
 */
export type RoomEffect = {
  readonly type: string;
  readonly id: number;
};

/** The shared state every player sees, published by the host, generic in `G`. */
export type RoomState<G> = {
  /** Short code others type to join. */
  readonly code: string;
  /** Which seat is the host. */
  readonly hostId: SeatId;
  /** Players in turn order - seat i plays as the game's player i. */
  readonly seats: readonly Seat[];
  readonly phase: RoomPhase;
  /** The authoritative game once it has started. */
  readonly game: G | null;
  /** Bumped on every change so clients can ignore stale snapshots. */
  readonly version: number;
  /** The last public event, for the animation; absent outside a fresh one. */
  readonly lastEffect?: RoomEffect;
  /**
   * If set, how long a player may take before the computer plays their turn.
   *
   * @remarks
   * In milliseconds, chosen by the host. Null or absent means no auto-play.
   */
  readonly autoPlayMs?: number | null;
  /**
   * Seats now played by the computer because the player left mid-game.
   *
   * @remarks
   * The host plays these seats' turns itself. Kept in the shared state so every
   * client can show that the computer took over.
   */
  readonly botSeatIds?: readonly SeatId[];
};

/** What a game needs to know about one seat to deal it in. */
export type SeatSetup = {
  /** The player's display name. */
  readonly name: string;
};

/**
 * Everything the online layer needs from one game to run it host-authoritative.
 *
 * @remarks
 * An adapter is pure and stateless: every method is a plain function of its
 * arguments. The layer never touches the game state except through these.
 */
export type OnlineAdapter<G, M, H, O> = {
  /** Namespaces this game's rooms in the shared database. */
  readonly gameId: string;
  /** Fewest seats that may start a game. */
  readonly minPlayers: number;
  /** Most seats a room holds. */
  readonly maxPlayers: number;

  /**
   * Deals a fresh game for these seats.
   *
   * @param seats - the players, in turn order
   * @param options - the game options the host chose
   * @param seed - the deal's random seed
   * @returns the initial game state
   */
  createGame(seats: readonly SeatSetup[], options: O, seed: number): G;

  /**
   * The seat index whose turn it is, or null if no one is on turn.
   *
   * @param game - the game state
   * @returns the player index on turn
   */
  seatIndexOnTurn(game: G): number | null;

  /**
   * Applies a seat's move as the referee.
   *
   * @param game - the game state
   * @param seatIndex - the seat asking to move
   * @param move - the move they want to make
   * @returns the new game, or null if the move is not allowed now
   */
  applyMove(game: G, seatIndex: number, move: M): G | null;

  /**
   * Whether the game has ended, so the room moves to "finished".
   *
   * @param game - the game state
   * @returns true once the game is over
   */
  isFinished(game: G): boolean;

  /**
   * The computer's move for the seat on turn, for auto-play and takeover.
   *
   * @param game - the game state, on some seat's turn
   * @returns the move to play, or null if none is available
   */
  aiMove(game: G): M | null;

  /**
   * Hides every seat's private data for the shared snapshot.
   *
   * @param game - the authoritative game state
   * @returns a copy revealing no hand, only its size
   */
  redact(game: G): G;

  /**
   * Each seat's private data, in seat order, to deliver on the private channel.
   *
   * @param game - the authoritative game state
   * @returns one entry per seat, in turn order
   */
  privateHands(game: G): readonly H[];

  /**
   * Puts one seat's own private data back into a redacted snapshot.
   *
   * @param game - the shared, redacted game
   * @param seatIndex - the seat whose data to restore
   * @param hand - that seat's real private data
   * @returns the game as that seat should see it
   */
  withOwnHand(game: G, seatIndex: number, hand: H): G;

  /**
   * Puts every seat's private data back, to rebuild the game on failover.
   *
   * @param game - the shared, redacted game
   * @param hands - each seat's private data, in seat order (may be missing)
   * @returns the full authoritative game
   */
  withAllHands(game: G, hands: readonly (H | undefined)[]): G;

  /**
   * The public event a move produces, for the animation, or null for none.
   *
   * @param pre - the game before the move, where the mover still holds the card
   * @param seatIndex - the seat that moved
   * @param move - the move applied
   * @returns the event's type, or null if the move shows nothing
   */
  effectFor(
    pre: G,
    seatIndex: number,
    move: M,
  ): { readonly type: string } | null;

  /**
   * Secret state owned by no seat, stashed for a host that takes over.
   *
   * @param game - the authoritative game state
   * @returns the secret to keep, or null if there is none right now
   * @remarks
   * Optional. Some games hide state that belongs to the table rather than a
   * player - Binokel's face-down Dabb during bidding. Redacted from the shared
   * snapshot, it would be lost on host failover; the host stashes it here on a
   * private channel so a new host can restore it with {@link applyVault}.
   */
  vault?(game: G): H | null;

  /**
   * Restores stashed secret state onto a rebuilt game.
   *
   * @param game - the shared, redacted game
   * @param vault - the secret from {@link vault}
   * @returns the game with its secret state restored
   */
  applyVault?(game: G, vault: H): G;

  /**
   * Checks an untrusted value is a game state (read off the wire).
   *
   * @param value - the value read from the transport
   * @returns true if it is a well-formed game state
   */
  isGameState(value: unknown): value is G;

  /**
   * Checks an untrusted value is a move.
   *
   * @param value - the value read from the transport
   * @returns true if it is a well-formed move
   */
  isMove(value: unknown): value is M;

  /**
   * Checks an untrusted value is one seat's private data.
   *
   * @param value - the value read from the transport
   * @returns true if it is a well-formed hand
   */
  isHand(value: unknown): value is H;
};
