/**
 * "Murdle" print page: one case as a printed sheet, one page per case.
 *
 * @module
 */
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import type { ReactElement } from "react";
import { CasePrintSheet } from "@/games/murdle/components/case-print";
import { CASES, caseById } from "@/games/murdle/engine/cases";
import { MURDLE_TEXTS as T, titleOf } from "@/games/murdle/i18n/texts";

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
  return CASES.map((kase) => ({ id: kase.id }));
}

/**
 * The tab's title, which is also the name the browser gives the saved PDF:
 * "Murdle - 3. Die Kunst des Tötens" - without the site's usual suffix.
 *
 * @param props - the case in the address
 * @returns the page's metadata
 */
export async function generateMetadata({
  params,
}: PrintParams): Promise<Metadata> {
  const { id } = await params;
  const kase = caseById(id) ?? notFound();
  return {
    title: { absolute: T.printMetaTitle(titleOf(kase)) },
    description: T.printMetaDescription,
  };
}

/**
 * Renders the printed sheet of one case.
 *
 * @param props - the case in the address
 * @returns the page element
 */
export default async function MurdlePrintPage({
  params,
}: PrintParams): Promise<ReactElement> {
  const { id } = await params;
  const kase = caseById(id) ?? notFound();
  // Only the id crosses to the browser: a case carries its clues and statements as functions.
  return <CasePrintSheet id={kase.id} />;
}
