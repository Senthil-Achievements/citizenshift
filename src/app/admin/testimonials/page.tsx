import { getAdminClient, isAdminClientAvailable } from "@/lib/supabase/admin";
import { getCmsPrincipal } from "@/lib/cms/guard";
import { listAdminTestimonials, listCampaigns } from "@/lib/cms/testimonials";
import { TestimonialManager } from "@/components/admin/TestimonialManager";

export const dynamic = "force-dynamic";

interface SearchParams {
  status?: "pending" | "approved" | "rejected" | "all";
  campaignId?: string;
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
  const [res, campRes] = await Promise.all([
    listAdminTestimonials(db, {
      status: params.status,
      campaignId: params.campaignId,
      q: params.q,
      perPage: 100,
    }),
    listCampaigns(db),
  ]);

  const isAdmin = principal.role === "admin";

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-semibold text-navy">Testimonials & Campaigns</h1>
          <p className="mt-1 text-sm text-navy/60">
            Moderate civic feedback, review video submissions, create campaign sharing links, and track community advocacy
          </p>
        </div>
      </div>

      <TestimonialManager
        testimonials={res.rows}
        campaigns={campRes.rows}
        isAdmin={isAdmin}
      />
    </div>
  );
}

