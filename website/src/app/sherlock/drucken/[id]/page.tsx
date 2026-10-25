/**
 * "Sherlock Holmes - Rätselsammlung" print page: one puzzle as a printed
 * sheet, its solution on a page of its own.
 *
 * @module
 */
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import type { ReactElement } from "react";
import { PuzzlePrintSheet } from "@/games/sherlock/components/puzzle-print";
import { PUZZLES, byId } from "@/games/sherlock/engine/puzzles";
import { SHERLOCK_TEXTS as T, titleOf } from "@/games/sherlock/i18n/texts";

/** The puzzle in the address. */
type PrintParams = { readonly params: Promise<{ id: string }> };

/** Only the puzzles there are - the site is exported, nothing is made on demand. */
export const dynamicParams = false;

/**
 * Every puzzle gets its page at build time.
 *
 * @returns the id of each puzzle
 */
export function generateStaticParams(): { id: string }[] {
  return PUZZLES.map((puzzle) => ({ id: puzzle.id }));
}

/**
 * The tab's title, which is also the name the browser gives the saved PDF:
 * "Sherlock Holmes - 12. Am Strand" - without the site's usual suffix.
 *
 * @param props - the puzzle in the address
 * @returns the page's metadata
 */
export async function generateMetadata({
  params,
}: PrintParams): Promise<Metadata> {
  const { id } = await params;
  const puzzle = byId(id) ?? notFound();
  return {
    title: { absolute: T.printMetaTitle(titleOf(puzzle)) },
    description: T.printMetaDescription,
  };
}

/**
 * Renders the printed sheet of one puzzle.
 *
 * @param props - the puzzle in the address
 * @returns the page element
 */
export default async function SherlockPrintPage({
  params,
}: PrintParams): Promise<ReactElement> {
  const { id } = await params;
  const puzzle = byId(id) ?? notFound();
  return <PuzzlePrintSheet id={puzzle.id} />;
}
