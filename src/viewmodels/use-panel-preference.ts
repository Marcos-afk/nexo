import { useState } from "react";
import { WIDE_LAYOUT_QUERY } from "@/constants/console";
import { useMediaQuery } from "./use-media-query";

export function usePanelPreference() {
  const isWide = useMediaQuery(WIDE_LAYOUT_QUERY, true);
  const [preference, setPreference] = useState<boolean | null>(null);
  const isOpen = preference ?? isWide;

  return {
    isOpen,
    onToggle: () => setPreference(!isOpen),
    onClose: () => setPreference(false),
  };
}
