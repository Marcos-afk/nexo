import { useState } from "react";
import type { DraftEditValues, DraftNoteValues } from "@/models/draft";
import { useConfirmShortcut } from "./use-confirm-shortcut";
import { useDraftCommands } from "./use-draft-commands";
import { useDraftResource } from "./use-draft-resource";

export function useDraftCard(draftId: string) {
  const resource = useDraftResource(draftId);
  const commands = useDraftCommands({ draftId, resource });
  const [isEditing, setIsEditing] = useState(false);

  const isPending = resource.draft?.status === "pending";
  const { shortcutLabel } = useConfirmShortcut({
    isEnabled: isPending && !isEditing && !commands.isWorking,
    onConfirm: () => void commands.confirm(),
  });

  const finishEditing = async (saved: Promise<boolean>) => {
    if (await saved) {
      setIsEditing(false);
    }
  };

  return {
    draft: resource.draft,
    loadError: resource.loadError,
    actionError: commands.actionError,
    isWorking: commands.isWorking,
    isEditing,
    isPending,
    shortcutLabel,
    onConfirm: () => void commands.confirm(),
    onCancel: () => void commands.cancel(),
    onSaveTicket: (values: DraftEditValues) => finishEditing(commands.saveTicket(values)),
    onSaveNote: (values: DraftNoteValues) => finishEditing(commands.saveNote(values)),
    onStartEdit: () => setIsEditing(true),
    onStopEdit: () => setIsEditing(false),
  };
}
