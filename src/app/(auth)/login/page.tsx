import { AuthSection } from "@/components/layouts/auth/auth-section";
import { LoginForm } from "@/components/layouts/auth/login-form";
import { ShowcasePanel } from "@/components/layouts/auth/showcase-panel";
import type { LoginStatsProps } from "@/models/stats";
import { getContainer } from "@/server/container";
import { formatLoginStats } from "@/utils/format-login-stats";

async function fetchLoginStats(): Promise<LoginStatsProps | null> {
  const { stats } = await getContainer();

  return stats.loginStats().catch(() => null);
}

export default async function Login() {
  return (
    <>
      <ShowcasePanel stats={formatLoginStats(await fetchLoginStats())} />
      <AuthSection>
        <LoginForm />
      </AuthSection>
    </>
  );
}
