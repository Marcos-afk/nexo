import { Lock } from "lucide-react";
import type { ReactNode } from "react";
import { CARD_CLASS } from "@/constants/chat";
import type { Profile } from "@/services/auth/auth-service";

const NOTE_ICON_SIZE = 13;
const ROW_CLASS =
  "flex flex-wrap items-center gap-x-4 gap-y-1 border-b border-rule px-6 py-5 last:border-b-0";

interface RowProps {
  readonly label: string;
  readonly children: ReactNode;
  readonly note?: ReactNode;
}

function Row({ label, children, note }: RowProps) {
  return (
    <div className={ROW_CLASS}>
      <dt className="w-40 shrink-0 text-sm text-ink-3">{label}</dt>
      <dd className="min-w-0 flex-1 truncate text-[14.5px] font-medium text-ink">{children}</dd>
      {note}
    </div>
  );
}

interface ProfileDataCardProps {
  readonly profile: Pick<Profile, "name" | "email">;
}

export function ProfileDataCard({ profile }: ProfileDataCardProps) {
  return (
    <section aria-label="Dados de acesso" className={CARD_CLASS}>
      <dl>
        <Row label="Nome">{profile.name}</Row>
        <Row
          label="E-mail corporativo"
          note={
            <span className="flex items-center gap-1.25 text-xs text-ink-3">
              <Lock size={NOTE_ICON_SIZE} aria-hidden="true" />
              Gerenciado pela TI
            </span>
          }
        >
          {profile.email}
        </Row>
      </dl>
    </section>
  );
}
