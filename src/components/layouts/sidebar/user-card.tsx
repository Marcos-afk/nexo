import type { AuthUserProps } from "@/models/auth";
import { getUserAcronym } from "@/utils/get-user-acronym";

interface UserCardProps {
  readonly user: AuthUserProps;
}

export function UserCard({ user }: UserCardProps) {
  return (
    <div className="flex items-center gap-2.5 border-t border-rule px-2 pt-3.5 pb-1">
      <span
        aria-hidden="true"
        className="flex size-8.5 shrink-0 items-center justify-center rounded-full bg-primary-soft text-xs font-bold text-primary-text"
      >
        {getUserAcronym(user.name)}
      </span>
      <div className="flex min-w-0 flex-col gap-px">
        <span className="truncate text-sm font-semibold text-ink">{user.name}</span>
        <span className="truncate text-[11.5px] text-ink-3">{user.email}</span>
      </div>
    </div>
  );
}
