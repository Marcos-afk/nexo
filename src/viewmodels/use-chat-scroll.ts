import { useEffect, useRef } from "react";

export function useChatScroll(scrollKey: string) {
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollKey) {
      endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
    }
  }, [scrollKey]);

  return endRef;
}
