import { AuthSection } from "@/components/layouts/auth/auth-section";
import { LoginFormSkeleton } from "@/components/layouts/auth/login-form-skeleton";
import { ShowcaseView } from "@/components/layouts/auth/showcase-panel";
import { UNAVAILABLE_STATS_VIEW } from "@/utils/format-login-stats";

export default function LoginLoading() {
  return (
    <>
      <ShowcaseView stats={UNAVAILABLE_STATS_VIEW} />
      <AuthSection>
        <LoginFormSkeleton />
      </AuthSection>
    </>
  );
}
