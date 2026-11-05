import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { getOriginalBill } from "@/lib/original-bills-store";
import BillDetailView from "@/components/site/legislation/BillDetailView";

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const bill = getOriginalBill(id);
  if (!bill) return { title: "Bill Not Found — CitizenShift" };
  return {
    title: `${bill.title} (${bill.billNumber}) — CitizenShift`,
    description: bill.summary,
  };
}

export const dynamic = "force-dynamic";

export default async function OriginalBillRoute({ params }: Props) {
  const { id } = await params;
  const bill = getOriginalBill(id);

  if (!bill) {
    notFound();
  }

  return <BillDetailView bill={bill} />;
}
