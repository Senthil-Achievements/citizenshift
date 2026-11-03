import Link from "next/link";

import { BillCreateForm } from "@/components/admin/BillCreateForm";

export const dynamic = "force-dynamic";

export default function AdminBillNewPage() {
  return (
    <div>
      <Link
        href="/admin/legislation"
        className="font-mono text-[10px] uppercase tracking-[0.16em] text-navy/50 hover:text-navy"
      >
        ← Legislation
      </Link>
      <h1 className="mt-2 font-display text-2xl font-semibold text-navy">New bill</h1>
      <p className="mt-1 text-sm text-navy/60">
        Creates a CMS record (marked admin_edit). Existing official content should be seeded
        from the protected original store instead of re-typed here.
      </p>
      <div className="mt-6">
        <BillCreateForm />
      </div>
    </div>
  );
}
