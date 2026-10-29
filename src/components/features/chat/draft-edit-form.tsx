import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PRIORITY_LABELS } from "@/constants/ticket";
import { ticketPriorities } from "@/domain/sla";
import { ticketCategories } from "@/domain/ticket-category";
import type { CreateTicketInput } from "@/domain/ticket-input";
import type { DraftEditValues } from "@/models/draft";
import { useDraftEditForm } from "@/viewmodels/use-draft-edit-form";

const ICON_SIZE = 16;
const LABEL_CLASS = "text-xs font-medium text-ink-2";

interface DraftEditFormProps {
  readonly ticket: CreateTicketInput;
  readonly error: string | null;
  readonly onSave: (values: DraftEditValues) => Promise<void>;
  readonly onCancel: () => void;
}

export function DraftEditForm({ ticket, error, onSave, onCancel }: DraftEditFormProps) {
  const { form, errors, isSubmitting, onSubmit } = useDraftEditForm({ ticket, onSave });
  const { register } = form;

  return (
    <form onSubmit={onSubmit} noValidate className="flex flex-col gap-3 px-4.5 py-4">
      <div className="flex flex-col gap-1">
        <label htmlFor="draft-title" className={LABEL_CLASS}>
          Título
        </label>
        <Input.Root state={errors.title ? "invalid" : "default"}>
          <Input.Field id="draft-title" {...register("title")} />
        </Input.Root>
        {errors.title?.message && <Input.Error>{errors.title.message}</Input.Error>}
      </div>
      <div className="flex flex-col gap-1">
        <label htmlFor="draft-description" className={LABEL_CLASS}>
          Descrição
        </label>
        <Input.Root
          state={errors.description ? "invalid" : "default"}
          className="h-auto items-start py-2.5"
        >
          <Input.Area id="draft-description" {...register("description")} />
        </Input.Root>
        {errors.description?.message && <Input.Error>{errors.description.message}</Input.Error>}
      </div>
      <div className="grid grid-cols-3 gap-3">
        <div className="flex flex-col gap-1">
          <label htmlFor="draft-category" className={LABEL_CLASS}>
            Categoria
          </label>
          <Input.Root>
            <Input.Select id="draft-category" {...register("category")}>
              {ticketCategories.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </Input.Select>
          </Input.Root>
        </div>
        <div className="flex flex-col gap-1">
          <label htmlFor="draft-priority" className={LABEL_CLASS}>
            Prioridade
          </label>
          <Input.Root>
            <Input.Select id="draft-priority" {...register("priority")}>
              {ticketPriorities.map((priority) => (
                <option key={priority} value={priority}>
                  {PRIORITY_LABELS[priority]}
                </option>
              ))}
            </Input.Select>
          </Input.Root>
        </div>
        <div className="flex flex-col gap-1">
          <label htmlFor="draft-affected" className={LABEL_CLASS}>
            Afetados
          </label>
          <Input.Root>
            <Input.Field id="draft-affected" {...register("affected")} />
          </Input.Root>
        </div>
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
