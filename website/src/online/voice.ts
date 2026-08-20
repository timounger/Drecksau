/**
 * Voice chat for an online room: microphones straight from player to player.
 *
 * @module
 * @remarks
 * The sound never touches a server of ours. Two browsers agree on a route over
 * the room they are already sharing and then talk directly - which is the only
 * way this works at all on a site that has no server behind it.
 *
 * Layout under `rooms/{gameId}-{code}/voice`:
 * - `present/{seatId}` - who has voice open, and whether their microphone is
 *   live; removed automatically on disconnect, so a closed tab does not leave a
 *   ghost to call. The two facts share one flag because they are one fact: the
 *   node says "I am here", and the boolean says whether I can be heard.
 * - `mail/{seatId}/{pushId}` - one signalling message **for** that seat: an
 *   offer, an answer or a network candidate. The reader deletes what it has
 *   handled, so the mailbox stays short.
 *
 * The decisions worth arguing about - who calls whom, what a connection state
 * means to a player - are plain functions at the top of this file and are
 * tested without a browser. Everything below them is the wiring that WebRTC
 * demands, and that only a real browser can exercise.
 */
import {
  onChildAdded,
  onDisconnect,
  onValue,
  push,
  ref,
  remove,
  set,
  type Database,
} from "firebase/database";
import type { SeatId } from "./adapter";

/** How a peer's connection looks to the player. */
export type VoiceLink = "connecting" | "live" | "lost";

/** One other player in the voice room. */
export type VoicePeer = {
  readonly seatId: SeatId;
  readonly link: VoiceLink;
  /**
   * Whether that player's microphone is open.
   *
   * @remarks
   * Read from what they publish about themselves, not from the sound arriving:
   * silence is not the same as muted, and a player who has simply stopped
   * talking must not look switched off.
   */
  readonly mic: boolean;
};

/** What a signalling message carries. */
type SignalKind = "offer" | "answer" | "candidate";

/** One message in a seat's mailbox. */
type Signal = {
  readonly from: SeatId;
  readonly kind: SignalKind;
  /** The description or candidate, as JSON - see the module note on strings. */
  readonly data: string;
};

/**
 * Whether this seat is the one that opens the call to that peer.
 *
 * @param selfId - own seat id
 * @param peerId - the other seat id
 * @returns true if this side sends the offer
 * @remarks
 * Both sides run the same code, so exactly one of them has to make the first
 * move or they would talk over each other. Comparing the ids settles it
 * without an extra round trip: the lower one calls, the higher one picks up.
 */
export function callsFirst(selfId: SeatId, peerId: SeatId): boolean {
  return selfId < peerId;
}

/**
 * What a raw connection state means for the player.
 *
 * @param state - the browser's connection state
 * @returns the state to show
 * @remarks
 * "failed" is not folded into "connecting": a call that cannot be routed never
 * recovers on its own, and pretending it is still trying would leave someone
 * waiting for a voice that is never coming.
 */
export function linkOf(state: RTCPeerConnectionState): VoiceLink {
  switch (state) {
    case "connected":
      return "live";
    case "failed":
    case "closed":
    case "disconnected":
      return "lost";
    default:
      return "connecting";
  }
}

/**
 * Which calls to open and which to hang up.
 *
 * @param open - the peers currently connected
 * @param present - the peers in the voice room now, own seat included
 * @param selfId - own seat id
 * @returns who to call and who to drop
 */
export function peerChanges(
  open: Iterable<SeatId>,
  present: Iterable<SeatId>,
  selfId: SeatId,
): { readonly call: SeatId[]; readonly drop: SeatId[] } {
  const here = new Set(present);
  here.delete(selfId);
  const have = new Set(open);
  return {
    call: [...here].filter((id) => !have.has(id)),
    drop: [...have].filter((id) => !here.has(id)),
  };
}

/** Public relays that help two browsers find each other behind a router. */
const STUN_SERVERS: readonly string[] = [
  "stun:stun.l.google.com:19302",
  "stun:stun1.l.google.com:19302",
];

/**
 * The ice servers to try, the optional relay included.
 *
 * @returns the server list for a peer connection
 * @remarks
 * A relay (TURN) is the one part of this that cannot live on a static site: it
 * needs a machine that forwards the sound for the minority of networks that
 * refuse a direct connection. Without one they simply will not hear each
 * other, which is why the connection state is shown rather than assumed.
 */
function iceServers(): RTCIceServer[] {
  const servers: RTCIceServer[] = [{ urls: [...STUN_SERVERS] }];
  const url = process.env.NEXT_PUBLIC_TURN_URL;
  if (url !== undefined && url !== "") {
    servers.push({
      urls: url,
      username: process.env.NEXT_PUBLIC_TURN_USER,
      credential: process.env.NEXT_PUBLIC_TURN_PASSWORD,
    });
  }
  return servers;
}

/**
 * What the microphone is asked for.
 *
 * @remarks
 * All three helpers on: without echo cancellation a pair on speakers howls, and
 * with a game running under it the noise gate matters more than fidelity.
 */
const MIC_WANTED: MediaStreamConstraints = {
  audio: {
    echoCancellation: true,
    noiseSuppression: true,
    autoGainControl: true,
  },
  video: false,
};

/** A live voice room. */
export type VoiceRoom = {
  /**
   * Turns the microphone on or off.
   *
   * @remarks
   * Off really means off: the track is stopped, so the browser's recording
   * light goes out. The permission itself is remembered, so switching back on
   * does not ask again.
   */
  readonly setMicOn: (on: boolean) => Promise<void>;
  /**
   * Sets how loud the other players are, from 0 to 1.
   *
   * @remarks
   * Only what arrives is turned down, never what is sent: the others keep
   * hearing you at full strength however quiet you have made them. It applies
   * to every call at once, since it is one knob for the room.
   */
  readonly setVolume: (volume: number) => void;
  /** Leaves the voice room and hangs up every call. */
  readonly close: () => void;
};

/** What {@link createVoiceRoom} needs to know. */
export type VoiceOptions = {
  readonly database: Database;
  /** Namespaces the room, exactly as the game transport does. */
  readonly gameId: string;
  readonly code: string;
  readonly selfId: SeatId;
  /** Called whenever the list of peers or their connection states change. */
  readonly onPeers: (peers: readonly VoicePeer[]) => void;
  /** How loud the others start out, 0 to 1; full when left out. */
  readonly volume?: number;
};

/**
 * Joins the voice room of a game room.
 *
 * @param options - room, own seat and where to report peers
 * @returns the handle to mute and to leave
 * @remarks
 * Joining is listening: the connections are opened straight away so the others
 * can be heard, but nothing is sent until {@link VoiceRoom.setMicOn}. The
 * microphone is not even asked for before then, so a player who never speaks is
 * never prompted.
 */
export function createVoiceRoom(options: VoiceOptions): VoiceRoom {
  const { database, gameId, code, selfId, onPeers } = options;
  const voicePath = `rooms/${gameId}-${code}/voice`;
  const presentPath = `${voicePath}/present`;
  const mailPath = `${voicePath}/mail`;

  /** One open call. */
  type Call = {
    readonly pc: RTCPeerConnection;
    /**
     * Where our microphone goes, once the audio line exists.
     *
     * @remarks
     * Null until then. The caller sets its line up itself; the side that picks
     * up only gets one when the offer arrives - see {@link receive}.
     */
    sender: RTCRtpSender | null;
    readonly audio: HTMLAudioElement;
    link: VoiceLink;
  };

  const calls = new Map<SeatId, Call>();
  // What everybody last said about their own microphone, own seat included.
  let mics: Readonly<Record<string, boolean>> = {};
  const unsubscribes: Array<() => void> = [];
  let mic: MediaStream | null = null;
  let closed = false;
  // Held here rather than read per call: a peer joining later has to arrive at
  // the volume already set, not at full blast.
  let level = clampVolume(options.volume ?? 1);

  const report = () => {
    onPeers(
      [...calls.entries()].map(([seatId, call]) => ({
        seatId,
        link: call.link,
        mic: mics[seatId] === true,
      })),
    );
  };

  const post = async (to: SeatId, signal: Signal): Promise<void> => {
    await push(ref(database, `${mailPath}/${to}`), JSON.stringify(signal));
  };

  /** Hands the microphone to a call, if there is one and it has a line yet. */
  const attachMic = (call: Call): void => {
    if (call.sender !== null) {
      void call.sender.replaceTrack(mic?.getAudioTracks()[0] ?? null);
    }
  };

  /** Opens a call to a peer, offering first if this side is the caller. */
  const open = (peerId: SeatId): Call => {
    const pc = new RTCPeerConnection({ iceServers: iceServers() });

    const audio = document.createElement("audio");
    audio.autoplay = true;
    audio.volume = level;
    audio.style.display = "none";
    document.body.append(audio);

    const call: Call = { pc, sender: null, audio, link: "connecting" };
    calls.set(peerId, call);

    pc.addEventListener("icecandidate", (event) => {
      if (event.candidate !== null) {
        void post(peerId, {
          from: selfId,
          kind: "candidate",
          data: JSON.stringify(event.candidate.toJSON()),
        });
      }
    });
    pc.addEventListener("track", (event) => {
      audio.srcObject = event.streams[0] ?? new MediaStream([event.track]);
      // A browser may refuse to play before the page has been clicked. The
      // player has clicked their way into a room by now, so this rarely bites -
      // and if it does, silence is better than a crash.
      void audio.play().catch(() => undefined);
    });
    pc.addEventListener("connectionstatechange", () => {
      call.link = linkOf(pc.connectionState);
      report();
    });

    if (callsFirst(selfId, peerId)) {
      // Only the caller opens the audio line. Set up as send-and-receive from
      // the start with nothing to send yet: handing the microphone to this
      // sender later needs no new negotiation, which is what keeps unmuting
      // from renegotiating the whole call.
      call.sender = pc.addTransceiver("audio", {
        direction: "sendrecv",
      }).sender;
      attachMic(call);
      void (async () => {
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);
        await post(peerId, {
          from: selfId,
          kind: "offer",
          data: JSON.stringify(pc.localDescription),
        });
      })();
    }
    return call;
  };

  const hangUp = (peerId: SeatId) => {
    const call = calls.get(peerId);
    if (call === undefined) {
      return;
    }
    call.pc.close();
    call.audio.srcObject = null;
    call.audio.remove();
    calls.delete(peerId);
  };

  /** Handles one message out of our own mailbox. */
  const receive = async (raw: unknown): Promise<void> => {
    if (typeof raw !== "string") {
      return;
    }
    const signal = JSON.parse(raw) as Signal;
    const call = calls.get(signal.from) ?? open(signal.from);
    if (signal.kind === "offer") {
      await call.pc.setRemoteDescription(
        JSON.parse(signal.data) as RTCSessionDescriptionInit,
      );
      // The offer brought the audio line with it. Two things matter here, and
      // getting either wrong leaves half the room mute:
      //
      // - The line must **not** be added before this point. A transceiver of
      //   our own would negotiate a second, one-way line beside the offered
      //   one.
      // - It arrives as receive-only, because at that moment we have nothing
      //   to send. Left that way, this side can hear but is never heard.
      const line = call.pc
        .getTransceivers()
        .find((each) => each.receiver.track.kind === "audio");
      if (line !== undefined) {
        line.direction = "sendrecv";
        call.sender = line.sender;
        attachMic(call);
      }
      const answer = await call.pc.createAnswer();
      await call.pc.setLocalDescription(answer);
      await post(signal.from, {
        from: selfId,
        kind: "answer",
        data: JSON.stringify(call.pc.localDescription),
      });
    } else if (signal.kind === "answer") {
      await call.pc.setRemoteDescription(
        JSON.parse(signal.data) as RTCSessionDescriptionInit,
      );
    } else {
      await call.pc.addIceCandidate(
        JSON.parse(signal.data) as RTCIceCandidateInit,
      );
    }
  };

  // Announce that this seat is listening - muted, until it says otherwise -
  // and take the whole thing back on disconnect.
  const ownPresence = ref(database, `${presentPath}/${selfId}`);
  void (async () => {
    await onDisconnect(ownPresence).remove();
    await set(ownPresence, false);
  })();

  // Everyone present, minus ourselves, is somebody to call.
  unsubscribes.push(
    onValue(ref(database, presentPath), (snapshot) => {
      if (closed) {
        return;
      }
      mics = (snapshot.val() as Record<string, boolean> | null) ?? {};
      const present = Object.keys(mics);
      const changes = peerChanges(calls.keys(), present, selfId);
      for (const peerId of changes.drop) {
        hangUp(peerId);
      }
      for (const peerId of changes.call) {
        open(peerId);
      }
      report();
    }),
  );

  // Our own mailbox: handle each message once, then throw it away.
  unsubscribes.push(
    onChildAdded(ref(database, `${mailPath}/${selfId}`), (snapshot) => {
      if (closed) {
        return;
      }
      const value = snapshot.val() as unknown;
      void receive(value)
        .catch(() => undefined)
        .finally(() => void remove(snapshot.ref));
    }),
  );

  const setMicOn = async (on: boolean): Promise<void> => {
    if (on) {
      mic ??= await navigator.mediaDevices.getUserMedia(MIC_WANTED);
    } else {
      for (const track of mic?.getTracks() ?? []) {
        track.stop();
      }
      mic = null;
    }
    for (const call of calls.values()) {
      attachMic(call);
    }
    // Written only once the microphone really is open or really is stopped, so
    // a refused permission never lights somebody else's screen up.
    await set(ownPresence, on);
  };

  const setVolume = (volume: number): void => {
    level = clampVolume(volume);
    for (const call of calls.values()) {
      call.audio.volume = level;
    }
  };

  const close = () => {
    closed = true;
    for (const off of unsubscribes) {
      off();
    }
    for (const peerId of [...calls.keys()]) {
      hangUp(peerId);
    }
    for (const track of mic?.getTracks() ?? []) {
      track.stop();
    }
    mic = null;
    void remove(ownPresence);
    void remove(ref(database, `${mailPath}/${selfId}`));
  };

  return { setMicOn, setVolume, close };
}

/**
 * Holds a volume inside what an audio element accepts.
 *
 * @param volume - the wanted volume
 * @returns a number between 0 and 1; full for anything unusable
 * @remarks
 * A pure function, and exported, because "a broken value must not silence the
 * room" is a rule worth a test rather than a comment.
 */
export function clampVolume(volume: number): number {
  return Number.isFinite(volume) ? Math.min(1, Math.max(0, volume)) : 1;
}
