import { type FormEvent, type ReactElement, useEffect, useRef, useState } from "react";
import { match } from "ts-pattern";
import * as v from "valibot";
import {
  DescriptionSchema,
  NameSchema,
  type UpdateItemInput,
  UpdateItemInputSchema,
} from "../shared/index.ts";

type EditItemFormProps = {
  initialName: string;
  initialDescription: string;
  pending?: boolean;
  onSubmit: (input: UpdateItemInput) => void;
  onCancel: () => void;
};

type ValidationResult =
  | { kind: "ok"; value: UpdateItemInput }
  | { kind: "error"; message: string }
  | { kind: "noChange" };

const validate = (
  initialName: string,
  initialDescription: string,
  name: string,
  description: string,
): ValidationResult => {
  const trimmedName = name.trim();
  const nameResult = v.safeParse(NameSchema, trimmedName);
  if (!nameResult.success) {
    return { kind: "error", message: nameResult.issues[0]?.message ?? "" };
  }

  const trimmedDesc = description.trim();
  if (trimmedDesc.length > 0) {
    const descResult = v.safeParse(DescriptionSchema, trimmedDesc);
    if (!descResult.success) {
      return { kind: "error", message: descResult.issues[0]?.message ?? "" };
    }
  }

  const nameChanged = nameResult.output !== initialName;
  const descChanged = trimmedDesc !== initialDescription;
  if (!nameChanged && !descChanged) return { kind: "noChange" };

  const patch: { name?: string; description?: string | null } = {};
  if (nameChanged) patch.name = nameResult.output;
  if (descChanged) patch.description = trimmedDesc.length === 0 ? null : trimmedDesc;

  const full = v.safeParse(UpdateItemInputSchema, patch);
  if (!full.success) return { kind: "error", message: full.issues[0]?.message ?? "" };
  return { kind: "ok", value: full.output };
};

export const EditItemForm = ({
  initialName,
  initialDescription,
  pending = false,
  onSubmit,
  onCancel,
}: EditItemFormProps): ReactElement => {
  const [name, setName] = useState(initialName);
  const [description, setDescription] = useState(initialDescription);
  const [error, setError] = useState<string | null>(null);
  const nameRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    nameRef.current?.focus();
    nameRef.current?.select();
  }, []);

  const handleSubmit = (e: FormEvent<HTMLFormElement>): void => {
    e.preventDefault();
    if (pending) return;
    const result = validate(initialName, initialDescription, name, description);
    match(result)
      .with({ kind: "noChange" }, () => onCancel())
      .with({ kind: "error" }, (r) => setError(r.message))
      .with({ kind: "ok" }, (r) => {
        setError(null);
        onSubmit(r.value);
      })
      .exhaustive();
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-1 flex-col px-5 pb-[max(env(safe-area-inset-bottom),1rem)]"
    >
      <div>
        <div className="font-semibold text-lg text-slate-900">Edit item</div>
        <p className="mt-0.5 text-slate-500 text-sm">Update the name or description.</p>
      </div>

      <div className="mt-5 space-y-3">
        <label className="block">
          <span className="font-medium text-slate-500 text-xs uppercase tracking-wider">Item</span>
          <input
            type="text"
            inputMode="text"
            autoComplete="off"
            autoCapitalize="words"
            value={name}
            onChange={(e) => setName(e.currentTarget.value)}
            ref={nameRef}
            className="mt-1.5 flex min-h-12 w-full items-center rounded-xl border-[1.5px] border-slate-200 bg-white px-4 text-base text-slate-900 outline-none transition-colors placeholder:text-slate-400 focus:border-slate-900"
          />
        </label>

        <label className="block">
          <span className="font-medium text-slate-500 text-xs uppercase tracking-wider">
            Description{" "}
            <span className="font-normal text-slate-500 normal-case tracking-normal">
              — optional
            </span>
          </span>
          <textarea
            inputMode="text"
            autoComplete="off"
            autoCapitalize="sentences"
            rows={2}
            value={description}
            onChange={(e) => setDescription(e.currentTarget.value)}
            className="mt-1.5 flex min-h-12 w-full resize-none rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-base text-slate-700 outline-none transition-colors placeholder:text-slate-400 focus:border-slate-900"
          />
        </label>

        {error !== null && (
          <div className="rounded-lg border border-rose-100 bg-rose-50 px-3 py-2 text-[13px] text-rose-700">
            {error}
          </div>
        )}
      </div>

      <div className="flex-1" />

      <div className="space-y-2.5 pt-4">
        <button
          type="submit"
          disabled={pending}
          className="flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl bg-slate-900 font-medium text-base text-white transition active:scale-[0.98] disabled:opacity-60 disabled:active:scale-100"
        >
          {pending ? "Saving…" : "Save changes"}
        </button>
        <button
          type="button"
          onClick={onCancel}
          disabled={pending}
          className="flex min-h-12 w-full items-center justify-center rounded-2xl text-base text-slate-600 disabled:opacity-60"
        >
          Cancel
        </button>
      </div>
    </form>
  );
};
