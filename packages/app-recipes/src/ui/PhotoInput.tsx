import { CameraIcon, SpinnerGapIcon, TrashIcon } from "@phosphor-icons/react";
import { type ReactElement, useRef, useState } from "react";

type PhotoInputProps = {
  value: string | null;
  onChange: (next: string | null) => void;
  onError?: (message: string) => void;
};

const MAX_DIM = 1280;
const QUALITY = 0.82;

const resizeToDataUrl = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      const longest = Math.max(img.width, img.height);
      const scale = longest > MAX_DIM ? MAX_DIM / longest : 1;
      const width = Math.round(img.width * scale);
      const height = Math.round(img.height * scale);
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      if (ctx === null) {
        reject(new Error("Couldn't process this image"));
        return;
      }
      ctx.drawImage(img, 0, 0, width, height);
      resolve(canvas.toDataURL("image/jpeg", QUALITY));
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Couldn't read this image"));
    };
    img.src = url;
  });

export const PhotoInput = ({ value, onChange, onError }: PhotoInputProps): ReactElement => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);

  const pick = (): void => inputRef.current?.click();

  const handleFile = async (file: File | undefined): Promise<void> => {
    if (file === undefined) return;
    setBusy(true);
    try {
      onChange(await resizeToDataUrl(file));
    } catch (e) {
      onError?.(e instanceof Error ? e.message : "Couldn't add this photo");
    } finally {
      setBusy(false);
      if (inputRef.current !== null) inputRef.current.value = "";
    }
  };

  return (
    <div>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => void handleFile(e.currentTarget.files?.[0])}
      />
      {value === null ? (
        <button
          type="button"
          onClick={pick}
          disabled={busy}
          aria-label="Add a photo"
          className="grid h-40 w-full place-items-center rounded-2xl border-2 border-slate-200 border-dashed text-slate-400 transition active:bg-slate-50 disabled:opacity-60"
        >
          <div className="flex flex-col items-center gap-1.5">
            {busy ? (
              <SpinnerGapIcon size={30} weight="bold" className="animate-spin" />
            ) : (
              <CameraIcon size={30} weight="duotone" />
            )}
            <span className="font-medium text-[13px]">{busy ? "Adding…" : "Add a photo"}</span>
          </div>
        </button>
      ) : (
        <div className="relative h-40 w-full overflow-hidden rounded-2xl bg-slate-100">
          <img src={value} alt="Recipe" className="h-full w-full object-cover" />
          <div className="absolute inset-x-0 bottom-0 flex items-center justify-end gap-2 bg-gradient-to-t from-black/45 to-transparent p-2.5">
            <button
              type="button"
              onClick={pick}
              disabled={busy}
              className="inline-flex min-h-9 items-center gap-1.5 rounded-full bg-white/90 px-3 font-medium text-[13px] text-slate-800 backdrop-blur transition active:scale-95"
            >
              <CameraIcon size={15} weight="bold" />
              Change
            </button>
            <button
              type="button"
              onClick={() => onChange(null)}
              aria-label="Remove photo"
              className="grid size-9 place-items-center rounded-full bg-white/90 text-slate-700 backdrop-blur transition active:scale-95"
            >
              <TrashIcon size={16} weight="bold" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
