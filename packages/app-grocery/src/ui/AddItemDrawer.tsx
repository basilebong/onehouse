import { type FormEvent, type ReactElement, useEffect, useRef, useState } from "react";
import * as v from "valibot";
import {
  type CreateItemInput,
  CreateItemInputSchema,
  DescriptionSchema,
  NameSchema,
} from "../shared/index.ts";

type AddItemFormProps = {
  onSubmit: (input: CreateItemInput) => void;
  onCancel: () => void;
};

const validate = (
  name: string,
  description: string,
): { ok: true; value: CreateItemInput } | { ok: false; error: string } => {
  const trimmedName = name.trim();
  const nameResult = v.safeParse(NameSchema, trimmedName);
  if (!nameResult.success) return { ok: false, error: nameResult.issues[0]?.message ?? "" };
  const trimmedDesc = description.trim();
  if (trimmedDesc.length === 0) {
    return { ok: true, value: { name: nameResult.output } };
  }
  const descResult = v.safeParse(DescriptionSchema, trimmedDesc);
  if (!descResult.success) return { ok: false, error: descResult.issues[0]?.message ?? "" };
  const full = v.safeParse(CreateItemInputSchema, {
    name: nameResult.output,
    description: descResult.output,
  });
  if (!full.success) return { ok: false, error: full.issues[0]?.message ?? "" };
  return { ok: true, value: full.output };
};

export const AddItemForm = ({ onSubmit, onCancel }: AddItemFormProps): ReactElement => {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [error, setError] = useState<string | null>(null);
  const nameRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    nameRef.current?.focus();
  }, []);

  const handleSubmit = (e: FormEvent<HTMLFormElement>): void => {
    e.preventDefault();
    const result = validate(name, description);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setError(null);
    onSubmit(result.value);
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-1 flex-col px-5 pb-[max(env(safe-area-inset-bottom),1rem)]"
    >
      <div>
        <div className="font-semibold text-lg text-slate-900">Add item</div>
        <p className="mt-0.5 text-slate-500 text-sm">A description is optional.</p>
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
            placeholder="Sparkling water"
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
            placeholder="the small bottles, six pack"
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
          className="flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl bg-slate-900 font-medium text-base text-white transition active:scale-[0.98]"
        >
          Add to list
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="flex min-h-12 w-full items-center justify-center rounded-2xl text-base text-slate-600"
        >
          Cancel
        </button>
      </div>
    </form>
  );
};
