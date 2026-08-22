/**
 * A script that runs while the browser parses the HTML.
 *
 * @module
 * @remarks
 * The shape the framework's own guide prescribes - see
 * `node_modules/next/dist/docs/01-app/02-guides/preventing-flash-before-hydration.md`.
 *
 * The type is the whole trick. On the server it is a real script, so the
 * browser runs it before the first paint; on the client it is inert text, so
 * React does not warn about rendering a script that could never execute
 * anyway. `suppressHydrationWarning` is what lets the two disagree.
 */
import type { ReactElement } from "react";

/**
 * Renders the script.
 *
 * @param props - the JavaScript to run, as source text
 * @returns the script element
 */
export function InlineScript({
  html,
}: {
  readonly html: string;
}): ReactElement {
  return (
    <script
      type={typeof window === "undefined" ? "text/javascript" : "text/plain"}
      suppressHydrationWarning
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
