import { type RefObject, useEffect, useRef } from "react";
import { messageElementIdOf } from "@/components/features/console/message-bubble";

interface UseMessageScrollProps {
  readonly containerRef: RefObject<HTMLElement | null>;
  readonly endRef: RefObject<HTMLElement | null>;
  readonly lastId: string | undefined;
  readonly activeMessageId: string | null;
  readonly focusMessageId: string | null;
}

export function useMessageScroll({
  containerRef,
  endRef,
  lastId,
  activeMessageId,
  focusMessageId,
}: UseMessageScrollProps) {
  const isFirstRun = useRef(true);

  useEffect(() => {
    const targetId = activeMessageId ?? (isFirstRun.current ? focusMessageId : null);
    const target = targetId
      ? containerRef.current?.querySelector(`#${CSS.escape(messageElementIdOf(targetId))}`)
      : null;

    isFirstRun.current = false;

    if (target) {
      target.scrollIntoView({ block: "center" });

      return;
    }

    if (lastId !== undefined) {
      endRef.current?.scrollIntoView({ block: "end" });
    }
  }, [containerRef, endRef, lastId, activeMessageId, focusMessageId]);
}
