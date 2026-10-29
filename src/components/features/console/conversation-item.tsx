import { Badge } from "@/components/ui/badge";
import { NO_MESSAGES_LABEL } from "@/constants/console";
import type { ConsoleItemProps } from "@/models/console";
import { avatarToneOf, labelViewOf, timeLabelOf } from "@/utils/console-format";
import { getUserAcronym } from "@/utils/get-user-acronym";

interface ConversationItemProps {
  readonly item: ConsoleItemProps;
  readonly now: Date | null;
}

export function ConversationItem({ item, now }: ConversationItemProps) {
  const tone = avatarToneOf(item.employee.id);
  const label = labelViewOf(item.label, now);
  const lastAt = item.preview?.at ?? item.updatedAt;

  return (
    <li className="flex gap-3 rounded-xl p-2.5 hover:bg-desk">
      <span
        aria-hidden="true"
        className={`flex size-11.5 shrink-0 items-center justify-center rounded-full text-base font-semibold ${tone.background} ${tone.text}`}
      >
        {getUserAcronym(item.employee.name)}
      </span>
      <div className="flex min-w-0 flex-1 flex-col gap-0.75">
        <div className="flex items-center gap-2">
          <span className="min-w-0 flex-1 truncate text-base font-semibold text-ink">
            {item.employee.name}
          </span>
          {now && <time className="text-xs text-ink-3">{timeLabelOf(lastAt, now)}</time>}
        </div>
        <div className="flex items-center gap-1.5">
          <span className="min-w-0 flex-1 truncate text-sm text-ink-3">
            {item.preview?.text ?? NO_MESSAGES_LABEL}
          </span>
          {item.unread > 0 && (
            <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-cta px-1.5 text-xs font-bold text-white">
              <span className="sr-only">Não lidas: </span>
              {item.unread}
            </span>
          )}
        </div>
        <Badge.Root tone={label.tone} className="w-fit">
          {label.text}
        </Badge.Root>
      </div>
    </li>
  );
}
