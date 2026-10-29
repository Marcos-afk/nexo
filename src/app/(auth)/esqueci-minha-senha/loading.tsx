import { AuthSection } from "@/components/layouts/auth/auth-section";
import { ForgotPasswordSkeleton } from "@/components/layouts/auth/forgot-password-skeleton";
import { ShowcaseView } from "@/components/layouts/auth/showcase-panel";
import { UNAVAILABLE_STATS_VIEW } from "@/utils/format-login-stats";

export default function ForgotPasswordLoading() {
  return (
    <>
      <ShowcaseView stats={UNAVAILABLE_STATS_VIEW} />
      <AuthSection>
        <ForgotPasswordSkeleton />
      </AuthSection>
    </>
  );
}
