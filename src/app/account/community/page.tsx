import { PendingAccountPage } from "@/components/account/PendingAccountPage";

export const dynamic = "force-dynamic";

export default function CommunityPage() {
  return (
    <PendingAccountPage
      eyebrow="Community"
      title="Community"
      description="Discussion with other CitizenShift members. Community views never expose anyone's private profile details such as date of birth, phone number or address."
      comingFrom="the community milestone (moderated discussions)"
    />
  );
}
