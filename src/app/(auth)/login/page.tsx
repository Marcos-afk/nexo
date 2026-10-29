import { AuthSection } from "@/components/layouts/auth/auth-section";
import { LoginForm } from "@/components/layouts/auth/login-form";
import { ShowcasePanel } from "@/components/layouts/auth/showcase-panel";
export default function Login() {
  return (
    <>
      <ShowcasePanel />
      <AuthSection>
        <LoginForm />
      </AuthSection>
    </>
  );
}
