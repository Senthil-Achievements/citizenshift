import { PendingAccountPage } from "@/components/account/PendingAccountPage";

export const dynamic = "force-dynamic";

export default function MessagesPage() {
  return (
    <PendingAccountPage
      eyebrow="Messages"
      title="Messages"
      description="Direct messages between CitizenShift members."
      comingFrom="the messaging milestone"
    />
  );
}
