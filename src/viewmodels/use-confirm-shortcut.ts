import { useEffect, useState } from "react";
import { DEFAULT_SHORTCUT_LABEL, shortcutLabelOf } from "@/utils/shortcut";

interface UseConfirmShortcutProps {
  readonly isEnabled: boolean;
  readonly onConfirm: () => void;
}

export function useConfirmShortcut({ isEnabled, onConfirm }: UseConfirmShortcutProps) {
  const [shortcutLabel, setShortcutLabel] = useState(DEFAULT_SHORTCUT_LABEL);

  useEffect(() => {
    setShortcutLabel(shortcutLabelOf(navigator.userAgent));
  }, []);

  useEffect(() => {
    if (!isEnabled) {
      return;
    }

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Enter" && (event.metaKey || event.ctrlKey)) {
        event.preventDefault();
        onConfirm();
      }
    };

    window.addEventListener("keydown", onKeyDown);

    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isEnabled, onConfirm]);

  return { shortcutLabel };
}
