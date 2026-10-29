import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

const ICON_SIZE = 16;

interface DraftActionsProps {
  readonly canEdit: boolean;
  readonly isWorking: boolean;
  readonly shortcutLabel: string;
  readonly error: string | null;
  readonly onConfirm: () => void;
  readonly onEdit: () => void;
  readonly onCancel: () => void;
}

export function DraftActions({
  canEdit,
  isWorking,
  shortcutLabel,
  error,
  onConfirm,
  onEdit,
  onCancel,
}: DraftActionsProps) {
  return (
    <div className="flex flex-col gap-2 rounded-b-2xl bg-desk px-3.5 py-2 pl-2">
      {error && (
        <p role="alert" className="px-1.5 text-sm text-danger-text">
          {error}
        </p>
      )}
      <div className="flex items-center gap-1.5">
        <Button.Root
          onClick={onConfirm}
          disabled={isWorking}
          className="h-9 rounded-lg pr-2.5 pl-3.5"
        >
          {isWorking && <Loader2 size={ICON_SIZE} aria-hidden="true" className="animate-spin" />}
          Confirmar
          <kbd className="rounded-sm bg-white/20 px-1.5 text-xs font-medium">{shortcutLabel}</kbd>
        </Button.Root>
        {canEdit && (
          <Button.Root
            variant="outline"
            onClick={onEdit}
            disabled={isWorking}
            className="h-9 rounded-lg px-3.5 font-medium"
          >
            Editar
          </Button.Root>
        )}
        <Button.Root
          variant="ghost"
          onClick={onCancel}
          disabled={isWorking}
          className="h-9 rounded-lg px-3.5 font-medium"
        >
          Cancelar
        </Button.Root>
      </div>
    </div>
  );
}
