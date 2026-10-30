import { useSyncExternalStore } from "react";

export function useMediaQuery(query: string, serverValue: boolean): boolean {
  const subscribe = (notify: () => void) => {
    const list = window.matchMedia(query);

    list.addEventListener("change", notify);

    return () => list.removeEventListener("change", notify);
  };

  return useSyncExternalStore(
    subscribe,
    () => window.matchMedia(query).matches,
    () => serverValue,
  );
}
