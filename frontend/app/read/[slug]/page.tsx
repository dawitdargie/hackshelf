import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import ReaderClient from "./ReaderClient";
import { LoadingState } from "@/components/ui/LoadingState";
import { fetchBookBySlug } from "@/lib/queries";

// HackShelf — online reader (Phase 20). Server shell with metadata; the
// interactive reader renders client-side inside Suspense.

interface Props {
  params: { slug: string };
}

async function getBook(slug: string) {
  try {
    return await fetchBookBySlug(slug);
  } catch {
    return null;
  }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const book = await getBook(params.slug);
  if (!book) return { title: "Reader" };
  return {
    title: `Read ${book.title}`,
    description: `Read ${book.title} in your browser — free and legally hosted on HackShelf.`,
    robots: { index: false }, // reading UI, not a landing page
  };
}

export default async function ReadPage({ params }: Props) {
  const book = await getBook(params.slug);
  if (!book) notFound();

  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-[1440px] px-5 py-10 md:px-10">
          <LoadingState rows={3} />
        </div>
      }
    >
      <ReaderClient slug={params.slug} />
    </Suspense>
  );
}