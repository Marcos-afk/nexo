import type { Metadata } from "next";
import { PasswordCard } from "@/components/features/profile/password-card";
import { ProfileDataCard } from "@/components/features/profile/profile-data-card";
import { getContainer } from "@/server/container";
import { findSession } from "@/server/session";
import type { Profile } from "@/services/auth/auth-service";
import { passwordAgeLabelOf } from "@/utils/password-age";

export const metadata: Metadata = { title: "Meu perfil · Nexo Assist" };

async function fetchProfile(): Promise<Profile | null> {
  const { auth } = await getContainer();
  const session = await findSession(auth);

  return session ? auth.profile(session.user.id) : null;
}

export default async function ProfilePage() {
  const profile = await fetchProfile();

  if (profile === null) {
    return (
      <p role="alert" className="mx-auto max-w-150 px-10 py-12 text-sm text-danger-text">
        Não foi possível carregar o seu perfil. Saia e entre novamente.
      </p>
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-150 flex-col gap-8 px-10 py-12">
      <header className="flex flex-col gap-1.5">
        <h1 className="text-2xl font-bold tracking-tight text-ink">Meu perfil</h1>
        <p className="text-sm text-ink-3">Seus dados de acesso ao service desk de TI.</p>
      </header>
      <ProfileDataCard profile={profile} />
      <PasswordCard
        ageLabel={passwordAgeLabelOf(profile.passwordChangedAt, new Date())}
        email={profile.email}
      />
    </div>
  );
}
