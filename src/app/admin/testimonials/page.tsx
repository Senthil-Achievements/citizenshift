import { getAdminClient, isAdminClientAvailable } from "@/lib/supabase/admin";
import { getCmsPrincipal } from "@/lib/cms/guard";
import { listAdminTestimonials } from "@/lib/cms/testimonials";
import { TestimonialManager } from "@/components/admin/TestimonialManager";

export const dynamic = "force-dynamic";

interface SearchParams {
  status?: "pending" | "approved" | "rejected" | "all";
  q?: string;
}

export default async function AdminTestimonialsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;
  const principal = await getCmsPrincipal();
  if (!principal) return <p className="text-sm text-navy/70">Session expired.</p>;

  const db = isAdminClientAvailable() ? getAdminClient() : null;
  const res = await listAdminTestimonials(db, {
    status: params.status,
    q: params.q,
    perPage: 100,
  });

  const isAdmin = principal.role === "admin";

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-semibold text-navy">Testimonials Management</h1>
          <p className="mt-1 text-sm text-navy/60">
            Moderate civic feedback, review video submissions, feature highlights, and distribute the submission form
          </p>
        </div>
      </div>

      <TestimonialManager testimonials={res.rows} isAdmin={isAdmin} />
    </div>
  );
}

