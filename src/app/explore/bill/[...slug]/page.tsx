import type { Metadata } from "next";
import BillDetail from "@/components/site/legislation/BillDetail";
import { slugToMetaTitle } from "@/lib/legislation";

type Props = { params: Promise<{ slug: string[] }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const segments = slug ?? [];
  const isText = segments[segments.length - 1] === "text";
  const title = slugToMetaTitle(isText ? segments.slice(0, -1) : segments);
  return {
    title: isText ? `Original Text — ${title}` : title,
  };
}

export default async function BillRoute({ params }: Props) {
  const { slug } = await params;
  const segments = slug ?? [];

  // /explore/bill/<congress|id>/<type|>/.../text — the original-text viewer
  const isTextViewer = segments[segments.length - 1]?.toLowerCase() === "text";
  const detailPath = isTextViewer ? segments.slice(0, -1) : segments;

  return <BillDetail slug={detailPath} textViewer={isTextViewer} />;
}
