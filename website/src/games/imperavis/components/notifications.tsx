/**
 * The notifications under the resource bar: small framed notes that fade
 * on their own, while alerts (war, conquest, debt, an attack on a kontor, a
 * sunk ship) stay until they are confirmed. Where the news happened, a
 * button takes the camera there.
 *
 * @module
 */
"use client";

import type { ReactElement } from "react";
import type {
  Message,
  MessageLevel,
} from "@/games/imperavis/hooks/use-imperavis";
import { HUD } from "@/games/imperavis/i18n/hud-texts";
import { Icon, type IconName } from "./icons";
import { IconBtn } from "./ui";

/** Symbol of each weight. */
const SYMBOLS: Readonly<Record<MessageLevel, IconName>> = {
  info: "info",
  warning: "warning",
  alert: "warning",
};

/** Colour of the symbol of each weight. */
const TONES: Readonly<Record<MessageLevel, string>> = {
  info: "imp-gold",
  warning: "text-[var(--imp-warn)]",
  alert: "text-[var(--imp-bad)]",
};

/** Props of {@link Notifications}. */
type NotificationsProps = {
  readonly messages: readonly Message[];
  readonly onDismiss: (id: number) => void;
  readonly onFocus: (x: number, y: number) => void;
  /** How many show at most (fewer on a phone). */
  readonly most: number;
  /** Only the alerts, when a window needs the room (on a phone). */
  readonly alertsOnly?: boolean;
};

/**
 * Renders the notifications, alerts first.
 *
 * @param props - the messages and what to do with them
 * @returns the column
 */
export function Notifications({
  messages,
  onDismiss,
  onFocus,
  most,
  alertsOnly = false,
}: NotificationsProps): ReactElement {
  const ordered = [
    ...messages.filter((message) => message.level === "alert"),
    ...(alertsOnly
      ? []
      : messages.filter((message) => message.level !== "alert").reverse()),
  ].slice(0, most);
  return (
    <div
      className="pointer-events-none flex w-full flex-col items-end gap-1.5"
      data-testid="imp-messages"
      aria-live="polite"
    >
      {ordered.map((message) => (
        <div
          key={message.id}
          className="imp-panel imp-note flex w-full items-center gap-2 px-2.5 py-1.5 text-xs md:w-[21rem]"
          data-level={message.level}
          data-testid={`imp-note-${message.level}`}
        >
          <Icon
            name={SYMBOLS[message.level]}
            size={16}
            className={TONES[message.level]}
          />
          <span className="min-w-0 flex-1 leading-snug">{message.text}</span>
          {message.where !== null && (
            <IconBtn
              icon="eye"
              tip={HUD.look}
              size={22}
              onClick={() =>
                onFocus(message.where?.x ?? 0, message.where?.y ?? 0)
              }
            />
          )}
          <IconBtn
            icon={message.level === "alert" ? "check" : "close"}
            tip={message.level === "alert" ? HUD.confirm : HUD.close}
            size={22}
            onClick={() => onDismiss(message.id)}
            testId={message.level === "alert" ? "imp-note-confirm" : undefined}
          />
        </div>
      ))}
    </div>
  );
}
