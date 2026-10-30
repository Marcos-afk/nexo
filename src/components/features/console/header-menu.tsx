"use client";

import { Copy, EllipsisVertical, PanelRight, Search } from "lucide-react";
import { type ReactNode, useState } from "react";
import {
  CLOSE_PANEL_LABEL,
  COPY_SUMMARY_LABEL,
  MORE_ACTIONS_LABEL,
  OPEN_PANEL_LABEL,
  SEARCH_CONVERSATION_LABEL,
} from "@/constants/console";

const ICON_SIZE = 18;
const MENU_ICON_SIZE = 15;
const MENU_ITEM_CLASSES =
  "flex w-full cursor-pointer items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-ink hover:bg-desk";
const ICON_BUTTON_CLASSES =
  "flex size-9 cursor-pointer items-center justify-center rounded-full text-ink-2 hover:bg-card hover:text-ink";

interface MenuItemProps {
  readonly label: string;
  readonly icon: ReactNode;
  readonly onSelect: () => void;
}

function MenuItem({ label, icon, onSelect }: MenuItemProps) {
  return (
    <button type="button" role="menuitem" onClick={onSelect} className={MENU_ITEM_CLASSES}>
      {icon}
      {label}
    </button>
  );
}

interface MenuPopoverProps {
  readonly onSearch: () => void;
  readonly onCopy: () => void;
}

function MenuPopover({ onSearch, onCopy }: MenuPopoverProps) {
  return (
    <div
      role="menu"
      className="absolute top-full right-0 z-10 mt-1 w-56 rounded-xl border border-rule bg-paper p-1 shadow-md"
    >
      <MenuItem
        label={SEARCH_CONVERSATION_LABEL}
        icon={<Search size={MENU_ICON_SIZE} aria-hidden="true" />}
        onSelect={onSearch}
      />
      <MenuItem
        label={COPY_SUMMARY_LABEL}
        icon={<Copy size={MENU_ICON_SIZE} aria-hidden="true" />}
        onSelect={onCopy}
      />
    </div>
  );
}

interface ActionsMenuProps {
  readonly onCopySummary: () => void;
  readonly onSearch: () => void;
}

function ActionsMenu({ onCopySummary, onSearch }: ActionsMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const select = (action: () => void) => {
    action();
    setIsOpen(false);
  };

  return (
    <fieldset
      className="relative m-0 border-0 p-0"
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) {
          setIsOpen(false);
        }
      }}
    >
      <button
        type="button"
        onClick={() => setIsOpen((current) => !current)}
        aria-expanded={isOpen}
        aria-haspopup="menu"
        aria-label={MORE_ACTIONS_LABEL}
        className={ICON_BUTTON_CLASSES}
      >
        <EllipsisVertical size={ICON_SIZE} aria-hidden="true" />
      </button>
      {isOpen && (
        <MenuPopover onSearch={() => select(onSearch)} onCopy={() => select(onCopySummary)} />
      )}
    </fieldset>
  );
}

interface HeaderMenuProps {
  readonly isPanelOpen: boolean;
  readonly onTogglePanel: () => void;
  readonly onCopySummary: () => void;
  readonly onSearch: () => void;
}

export function HeaderMenu({
  isPanelOpen,
  onTogglePanel,
  onCopySummary,
  onSearch,
}: HeaderMenuProps) {
  const panelLabel = isPanelOpen ? CLOSE_PANEL_LABEL : OPEN_PANEL_LABEL;

  return (
    <div className="flex items-center gap-1">
      <button
        type="button"
        onClick={onTogglePanel}
        aria-pressed={isPanelOpen}
        aria-label={panelLabel}
        title={panelLabel}
        className={`${ICON_BUTTON_CLASSES} aria-pressed:bg-card aria-pressed:text-ink`}
      >
        <PanelRight size={ICON_SIZE} aria-hidden="true" />
      </button>
      <ActionsMenu onCopySummary={onCopySummary} onSearch={onSearch} />
    </div>
  );
}
