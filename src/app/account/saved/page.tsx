import { PendingAccountPage } from "@/components/account/PendingAccountPage";

export const dynamic = "force-dynamic";

export default function SavedPage() {
  return (
    <PendingAccountPage
      eyebrow="Saved"
      title="Saved bills"
      description="Bills you save while exploring will be collected here so you can follow them over time."
      comingFrom="the legislation milestone (saved-bills persistence)"
    />
  );
}
