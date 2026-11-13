/**
 * The building blocks of the IMPERAVIS screens, all in one style: buttons
 * and symbol buttons, framed panels and windows, tabs, tiles, bars, amounts
 * of goods, the tooltip layer and number formats.
 *
 * @module
 * @remarks
 * Tooltips are one layer for the whole screen: anything with a `data-tip`
 * shows its text after a short pause, the first line as the heading when
 * there are several. That keeps them alike everywhere and lets them leave
 * scrolling panels, which a tooltip drawn inside the panel could not. The
 * map's things (buildings, ships, soldiers) use the same layer through its
 * `world` tip, placed at the mouse.
 */
"use client";

import {
  useEffect,
  useRef,
  useState,
  type ReactElement,
  type ReactNode,
  type RefObject,
} from "react";
import type { Amounts, GoodId } from "@/games/imperavis/engine/types";
import { GOOD_NAMES } from "@/games/imperavis/i18n/texts";
import { GoodIcon, Icon, type IconName } from "./icons";

/** Percent of a share. */
const PERCENT = 100;

/** Symbol sizes in a small and a normal button, px. */
const SMALL_ICON = 14;
const BUTTON_ICON = 16;

/** Edge of a symbol button, px, and the share its symbol fills. */
const ICON_BUTTON = 30;
const ICON_SHARE = 0.58;

/** Rates below this are shown with one decimal. */
const ONE_DECIMAL_BELOW = 10;

/** Milliseconds the pointer rests before a tooltip shows. */
const TIP_DELAY = 350;

/** Gap between a tooltip and what it explains, px. */
const TIP_GAP = 8;

/** A tooltip keeps this far from the edges of the screen, px. */
const TIP_MARGIN = 6;

/** Props of {@link Btn}. */
type BtnProps = {
  readonly children?: ReactNode;
  readonly onClick: () => void;
  readonly active?: boolean;
  readonly disabled?: boolean;
  /** The tooltip; also the name for screen readers when there is no text. */
  readonly tip?: string;
  readonly testId?: string;
  readonly small?: boolean;
  /** A symbol before the text. */
  readonly icon?: IconName;
  /** Red on hover, for tearing down and the like. */
  readonly danger?: boolean;
  readonly className?: string;
};

/**
 * A button in the game's style.
 *
 * @param props - label, action, state and tooltip
 * @returns the button
 */
export function Btn({
  children,
  onClick,
  active = false,
  disabled = false,
  tip,
  testId,
  small = false,
  icon,
  danger = false,
  className = "",
}: BtnProps): ReactElement {
  return (
    <button
      type="button"
      data-tip={tip}
      aria-label={children === undefined ? tip : undefined}
      data-testid={testId}
      disabled={disabled}
      aria-pressed={active}
      onClick={(event) => {
        onClick();
        // Off the button again, or Space would press it instead of pausing.
        event.currentTarget.blur();
      }}
      className={`imp-btn ${danger ? "imp-btn-danger" : ""} ${
        small ? "min-h-6 px-2 py-0.5 text-xs" : "min-h-8 px-3 py-1 text-sm"
      } ${className}`}
    >
      {icon !== undefined && (
        <Icon name={icon} size={small ? SMALL_ICON : BUTTON_ICON} />
      )}
      {children}
    </button>
  );
}

/**
 * A square button with only a symbol; the tooltip names it.
 *
 * @param props - symbol, action, state, tooltip and size in px
 * @returns the button
 */
export function IconBtn({
  icon,
  onClick,
  tip,
  active = false,
  disabled = false,
  testId,
  size = ICON_BUTTON,
  danger = false,
}: {
  readonly icon: IconName;
  readonly onClick: () => void;
  readonly tip: string;
  readonly active?: boolean;
  readonly disabled?: boolean;
  readonly testId?: string;
  readonly size?: number;
  readonly danger?: boolean;
}): ReactElement {
  return (
    <button
      type="button"
      data-tip={tip}
      aria-label={tip}
      aria-pressed={active}
      data-testid={testId}
      disabled={disabled}
      onClick={(event) => {
        onClick();
        event.currentTarget.blur();
      }}
      className={`imp-btn ${danger ? "imp-btn-danger" : ""}`}
      style={{ width: size, height: size }}
    >
      <Icon name={icon} size={Math.round(size * ICON_SHARE)} />
    </button>
  );
}

/**
 * A framed panel over the map.
 *
 * @param props - content, extra classes and test id
 * @returns the panel
 */
export function Panel({
  children,
  className = "",
  testId,
}: {
  readonly children: ReactNode;
  readonly className?: string;
  readonly testId?: string;
}): ReactElement {
  return (
    <div data-testid={testId} className={`imp-panel text-sm ${className}`}>
      {children}
    </div>
  );
}

/**
 * A window: a framed panel with a heading, a symbol, an optional line
 * below, a close button and a scrolling body.
 *
 * @param props - heading, content and actions
 * @returns the window
 */
export function Window({
  title,
  icon,
  subtitle,
  onClose,
  children,
  tools,
  className = "",
  testId,
  closeTestId,
}: {
  readonly title: string;
  readonly icon?: IconName;
  readonly subtitle?: ReactNode;
  readonly onClose: () => void;
  readonly children: ReactNode;
  /** More controls in the heading, left of the close button. */
  readonly tools?: ReactNode;
  readonly className?: string;
  readonly testId?: string;
  readonly closeTestId?: string;
}): ReactElement {
  return (
    <section
      data-testid={testId}
      className={`imp-panel imp-open flex min-h-0 flex-col text-sm ${className}`}
    >
      <header className="flex items-center gap-2 px-3 pt-2.5">
        {icon !== undefined && (
          <span className="imp-medal h-8 w-8">
            <Icon name={icon} size={18} className="imp-gold" />
          </span>
        )}
        <div className="min-w-0 flex-1">
          <h2 className="imp-title truncate text-base">{title}</h2>
          {subtitle !== undefined && (
            <div className="imp-muted truncate text-xs">{subtitle}</div>
          )}
        </div>
        {tools}
        <IconBtn
          icon="close"
          tip="Schließen (Esc)"
          onClick={onClose}
          testId={closeTestId}
          size={26}
        />
      </header>
      <div className="imp-rule mx-3 my-1.5" />
      <div className="imp-scroll min-h-0 flex-1 overflow-y-auto px-3 pb-3">
        {children}
      </div>
    </section>
  );
}

/** One tab of {@link Tabs}. */
export type TabDef<T extends string> = {
  readonly id: T;
  readonly label: string;
  readonly icon?: IconName;
  readonly badge?: number;
};

/**
 * A row of tabs.
 *
 * @param props - the tabs, the chosen one and how to choose
 * @returns the row
 */
export function Tabs<T extends string>({
  tabs,
  value,
  onChange,
  testPrefix,
}: {
  readonly tabs: readonly TabDef<T>[];
  readonly value: T;
  readonly onChange: (id: T) => void;
  readonly testPrefix?: string;
}): ReactElement {
  return (
    <div className="imp-tabs" role="tablist">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          type="button"
          role="tab"
          aria-selected={tab.id === value}
          data-testid={
            testPrefix === undefined ? undefined : `${testPrefix}-${tab.id}`
          }
          className="imp-tab"
          onClick={(event) => {
            onChange(tab.id);
            event.currentTarget.blur();
          }}
        >
          {tab.icon !== undefined && <Icon name={tab.icon} size={14} />}
          {tab.label}
          {(tab.badge ?? 0) > 0 && (
            <span className="rounded-full bg-[#a8332a] px-1.5 text-[10px] font-bold text-white">
              {tab.badge}
            </span>
          )}
        </button>
      ))}
    </div>
  );
}

/**
 * A label and a value on one line, for the facts of a window.
 *
 * @param props - label, value, tooltip and a tone for the value
 * @returns the row
 */
export function Fact({
  label,
  children,
  tip,
  tone,
  testId,
}: {
  readonly label: string;
  readonly children: ReactNode;
  readonly tip?: string;
  readonly tone?: "good" | "bad" | "warn";
  readonly testId?: string;
}): ReactElement {
  const color =
    tone === "good"
      ? "text-[var(--imp-good)]"
      : tone === "bad"
        ? "text-[var(--imp-bad)]"
        : tone === "warn"
          ? "text-[var(--imp-warn)]"
          : "";
  return (
    <div
      className="flex items-baseline justify-between gap-3 border-b border-[rgb(176_141_87/0.14)] py-1 last:border-b-0"
      data-tip={tip}
    >
      <span className="imp-muted text-xs">{label}</span>
      <span className={`text-right tabular-nums ${color}`} data-testid={testId}>
        {children}
      </span>
    </div>
  );
}

/**
 * A small heading inside a window.
 *
 * @param props - the text
 * @returns the heading
 */
export function Section({
  children,
}: {
  readonly children: ReactNode;
}): ReactElement {
  return (
    <h3 className="imp-title mt-2 mb-1 text-[0.8rem] first:mt-0">{children}</h3>
  );
}

/**
 * A thin bar for a share from 0 to 1.
 *
 * @param props - the share and an optional colour class
 * @returns the bar
 */
export function Bar({
  value,
  color = "bg-[var(--imp-good)]",
}: {
  readonly value: number;
  readonly color?: string;
}): ReactElement {
  const width = Math.max(0, Math.min(1, value)) * PERCENT;
  return (
    <div className="imp-bar">
      <div className={color} style={{ width: `${width}%` }} />
    </div>
  );
}

/**
 * Amounts of goods (and gold) in one line, red where the stock is short.
 *
 * @param props - the amounts, and the stock to compare against
 * @returns the line
 */
export function CostLine({
  cost,
  stock,
  gold,
}: {
  readonly cost: Amounts & { gold?: number };
  readonly stock?: Amounts;
  readonly gold?: number;
}): ReactElement {
  return (
    <span className="inline-flex flex-wrap items-center gap-x-2 gap-y-0.5">
      {Object.entries(cost).map(([good, amount]) => {
        const isGold = good === "gold";
        const have = isGold ? gold : stock?.[good as GoodId];
        const short = have !== undefined && have < (amount as number);
        return (amount as number) > 0 ? (
          <span
            key={good}
            className={`inline-flex items-center gap-0.5 tabular-nums ${short ? "text-[var(--imp-bad)]" : ""}`}
            data-tip={`${isGold ? "Gold" : GOOD_NAMES[good as GoodId]}: ${amount as number}${
              have !== undefined ? ` (vorhanden ${Math.floor(have)})` : ""
            }`}
          >
            {isGold ? (
              <Icon name="coin" size={14} className="imp-gold" />
            ) : (
              <GoodIcon good={good as GoodId} size={14} />
            )}
            {amount as number}
          </span>
        ) : null;
      })}
    </span>
  );
}

/** A tooltip for a thing on the map, at a point in client pixels. */
export type WorldTip = {
  readonly text: string;
  readonly x: number;
  readonly y: number;
};

/**
 * Shows the tooltip of whatever the pointer rests on inside a root - an
 * element with `data-tip`, or else a thing on the map.
 *
 * @param props - the element whose children carry `data-tip`, and the tip
 * of the map
 * @returns the tooltip, or null while none shows
 */
export function TipLayer({
  root,
  world = null,
}: {
  readonly root: RefObject<HTMLElement | null>;
  readonly world?: WorldTip | null;
}): ReactElement | null {
  const [tip, setTip] = useState<{
    text: string;
    x: number;
    y: number;
    below: boolean;
  } | null>(null);
  const boxRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(0);

  useEffect(() => {
    const element = root.current;
    let timer = 0;
    let current: HTMLElement | null = null;
    const hide = () => {
      window.clearTimeout(timer);
      current = null;
      setTip(null);
    };
    const show = (target: HTMLElement) => {
      const text = target.dataset.tip ?? "";
      const base = element?.getBoundingClientRect();
      const rect = target.getBoundingClientRect();
      if (text !== "" && base !== undefined) {
        const below = rect.top - base.top < base.height / 2;
        setTip({
          text,
          x: rect.left + rect.width / 2 - base.left,
          y: below
            ? rect.bottom - base.top + TIP_GAP
            : rect.top - base.top - TIP_GAP,
          below,
        });
      }
    };
    const over = (event: Event) => {
      const target = (event.target as HTMLElement | null)?.closest<HTMLElement>(
        "[data-tip]",
      );
      if (target !== current) {
        window.clearTimeout(timer);
        setTip(null);
        current = target ?? null;
        if (target !== null && target !== undefined) {
          timer = window.setTimeout(() => show(target), TIP_DELAY);
        }
      }
    };
    element?.addEventListener("pointerover", over);
    element?.addEventListener("focusin", over);
    element?.addEventListener("pointerleave", hide);
    element?.addEventListener("pointerdown", hide);
    element?.addEventListener("focusout", hide);
    return () => {
      window.clearTimeout(timer);
      element?.removeEventListener("pointerover", over);
      element?.removeEventListener("focusin", over);
      element?.removeEventListener("pointerleave", hide);
      element?.removeEventListener("pointerdown", hide);
      element?.removeEventListener("focusout", hide);
    };
  }, [root]);

  const worldText = world?.text ?? "";
  useEffect(() => {
    // The box is measured once shown, to keep it on the screen.
    setWidth(boxRef.current?.getBoundingClientRect().width ?? 0);
  }, [tip, worldText]);

  const base = root.current?.getBoundingClientRect();
  const shown =
    tip ??
    (world === null || base === undefined
      ? null
      : {
          text: world.text,
          x: world.x - base.left,
          y: world.y - base.top - TIP_GAP * 2,
          below: false,
        });
  let content: ReactElement | null = null;
  if (shown !== null) {
    const lines = shown.text.split("\n");
    const span = root.current?.getBoundingClientRect().width ?? 0;
    const left = Math.max(
      TIP_MARGIN,
      Math.min(shown.x - width / 2, span - width - TIP_MARGIN),
    );
    content = (
      <div
        className="pointer-events-none absolute z-50"
        style={{
          left,
          top: shown.y,
          transform: shown.below ? undefined : "translateY(-100%)",
        }}
        data-testid="imp-tooltip"
      >
        <div ref={boxRef} className="imp-tip imp-hud">
          {lines.length > 1 ? (
            <>
              <strong>{lines[0]}</strong>
              {lines.slice(1).join("\n")}
            </>
          ) : (
            lines[0]
          )}
        </div>
      </div>
    );
  }
  return content;
}

/**
 * Formats gold.
 *
 * @param value - gold
 * @returns the text
 */
export function goldText(value: number): string {
  return Math.round(value).toLocaleString("de-DE");
}

/**
 * Formats an amount per minute with one decimal when it is small.
 *
 * @param value - units per minute
 * @returns the text
 */
export function rateText(value: number): string {
  const digits = Math.abs(value) < ONE_DECIMAL_BELOW ? 1 : 0;
  return value.toLocaleString("de-DE", {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  });
}

/**
 * Formats a share as percent.
 *
 * @param value - 0 to 1
 * @returns the text
 */
export function percent(value: number): string {
  return `${Math.round(value * PERCENT)} %`;
}
