import type { Metadata } from "next";
import { AuthSection } from "@/components/layouts/auth/auth-section";
import { ForgotPasswordForm } from "@/components/layouts/auth/forgot-password-form";
import { ShowcasePanel } from "@/components/layouts/auth/showcase-panel";

export const metadata: Metadata = { title: "Esqueci minha senha · Nexo Assist" };

export default function ForgotPassword() {
  return (
    <>
      <ShowcasePanel />
      <AuthSection>
        <ForgotPasswordForm />
      </AuthSection>
    </>
  );
}
