import type { Metadata } from "next";
import { redirect, notFound } from "next/navigation";
import BillDetailView from "@/components/site/legislation/BillDetailView";
import { getOriginalBill } from "@/lib/original-bills-store";
import { slugToMetaTitle } from "@/lib/legislation";

type Props = { params: Promise<{ slug: string[] }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const segments = slug ?? [];
  const isText = segments[segments.length - 1] === "text";
  const title = slugToMetaTitle(isText ? segments.slice(0, -1) : segments);
  return {
    title: isText ? `Original Text — ${title}` : `${title} — CitizenShift`,
  };
}

export default async function BillRoute({ params }: Props) {
  const { slug } = await params;
  const segments = slug ?? [];

  // Try to find candidate ID from segments:
  // e.g. /explore/bill/id/2161502 => "2161502"
  // e.g. /explore/bill/119/hr/10951 => "10951"
  let candidateId: string | null = null;
  if (segments[0] === "id" && segments[1]) {
    candidateId = segments[1];
  } else if (segments.length >= 3) {
    candidateId = segments[2];
  } else if (segments.length === 1) {
    candidateId = segments[0];
  }

  if (candidateId) {
    const bill = getOriginalBill(candidateId);
    if (bill) {
      // Redirect to the canonical /bills/[id] route
      redirect(`/bills/${bill.id}`);
    }
  }

  // Fallback to checking each segment
  for (const seg of segments) {
    const bill = getOriginalBill(seg);
    if (bill) {
      redirect(`/bills/${bill.id}`);
    }
  }

  // Fallback to explore feed if not found
  redirect("/explore");
}
