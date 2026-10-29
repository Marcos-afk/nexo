import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { DraftNoteValues } from "@/models/draft";
import { useDraftNoteForm } from "@/viewmodels/use-draft-note-form";

const ICON_SIZE = 16;

interface DraftNoteFormProps {
  readonly note: string;
  readonly error: string | null;
  readonly onSave: (values: DraftNoteValues) => Promise<void>;
  readonly onCancel: () => void;
}

export function DraftNoteForm({ note, error, onSave, onCancel }: DraftNoteFormProps) {
  const { form, errors, isSubmitting, onSubmit } = useDraftNoteForm({ note, onSave });

  return (
    <form onSubmit={onSubmit} noValidate className="flex flex-col gap-3 px-4.5 py-4">
      <div className="flex flex-col gap-1">
        <label htmlFor="draft-note" className="text-xs font-medium text-ink-2">
          Informação a acrescentar ao chamado
        </label>
        <Input.Root
          state={errors.note ? "invalid" : "default"}
          className="h-auto items-start py-2.5"
        >
          <Input.Area id="draft-note" {...form.register("note")} />
        </Input.Root>
        {errors.note?.message && <Input.Error>{errors.note.message}</Input.Error>}
      </div>
      {error && (
        <p role="alert" className="text-sm text-danger-text">
          {error}
        </p>
      )}
      <div className="flex items-center gap-2">
        <Button.Root type="submit" disabled={isSubmitting} className="h-9 rounded-lg px-3.5">
          {isSubmitting && <Loader2 size={ICON_SIZE} aria-hidden="true" className="animate-spin" />}
          Salvar
        </Button.Root>
        <Button.Root
          variant="ghost"
          onClick={onCancel}
          disabled={isSubmitting}
          className="h-9 rounded-lg px-3.5"
        >
          Voltar
        </Button.Root>
      </div>
    </form>
  );
}
