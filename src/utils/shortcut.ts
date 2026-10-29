const APPLE_PLATFORM_PATTERN = /Mac|iPhone|iPad|iPod/;

export const MAC_SHORTCUT_LABEL = "⌘↵";
export const DEFAULT_SHORTCUT_LABEL = "Ctrl+↵";

export const shortcutLabelOf = (userAgent: string): string =>
  APPLE_PLATFORM_PATTERN.test(userAgent) ? MAC_SHORTCUT_LABEL : DEFAULT_SHORTCUT_LABEL;
