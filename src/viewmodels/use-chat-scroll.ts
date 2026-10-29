import { useEffect, useRef } from "react";

const PIN_THRESHOLD_PX = 80;

export function useChatScroll(scrollKey: string) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const endRef = useRef<HTMLDivElement>(null);
  const isPinned = useRef(true);

  useEffect(() => {
    const scroller = scrollRef.current;
    const content = scroller?.firstElementChild;

    if (!scroller || !content) {
      return;
    }

    const onScroll = () => {
      const distance = scroller.scrollHeight - scroller.scrollTop - scroller.clientHeight;

      isPinned.current = distance < PIN_THRESHOLD_PX;
    };
    const observer = new ResizeObserver(() => {
      if (isPinned.current) {
        endRef.current?.scrollIntoView({ block: "end" });
      }
    });

    scroller.addEventListener("scroll", onScroll, { passive: true });
    observer.observe(content);

    return () => {
      scroller.removeEventListener("scroll", onScroll);
      observer.disconnect();
    };
  }, []);

  useEffect(() => {
    if (scrollKey) {
      isPinned.current = true;
      endRef.current?.scrollIntoView({ block: "end" });
    }
  }, [scrollKey]);

  return { scrollRef, endRef };
}
