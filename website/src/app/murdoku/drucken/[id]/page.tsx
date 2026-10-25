/**
 * "Murdoku" print page: one case as a printed sheet, one page per case.
 *
 * @module
 */
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import type { ReactElement } from "react";
import { CasePrintSheet } from "@/games/murdoku/components/case-print";
import { LEVELS } from "@/games/murdoku/engine/levels";
import { MURDOKU_TEXTS as T, titleOf } from "@/games/murdoku/i18n/texts";

/** The case in the address. */
type PrintParams = { readonly params: Promise<{ id: string }> };

/** Only the cases there are - the site is exported, nothing is made on demand. */
export const dynamicParams = false;

/**
 * Every case gets its page at build time.
 *
 * @returns the id of each case
 */
export function generateStaticParams(): { id: string }[] {
  return LEVELS.map((level) => ({ id: level.id }));
}

/**
 * The tab's title, which is also the name the browser gives the saved PDF:
 * "Murdoku - 1. Dein erster Fall" - without the site's usual suffix.
 *
 * @param props - the case in the address
 * @returns the page's metadata
 */
export async function generateMetadata({
  params,
}: PrintParams): Promise<Metadata> {
  const { id } = await params;
  const level = LEVELS.find((one) => one.id === id) ?? notFound();
  return {
    title: { absolute: T.printMetaTitle(titleOf(level)) },
    description: T.printMetaDescription,
  };
}

/**
 * Renders the printed sheet of one case.
 *
 * @param props - the case in the address
 * @returns the page element
 */
export default async function MurdokuPrintPage({
  params,
}: PrintParams): Promise<ReactElement> {
  const { id } = await params;
  const level = LEVELS.find((one) => one.id === id) ?? notFound();
  // Only the id crosses to the browser: a case carries its clues as functions.
  return <CasePrintSheet id={level.id} />;
}
