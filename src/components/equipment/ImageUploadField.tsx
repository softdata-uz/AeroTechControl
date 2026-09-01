"use client";

import { useEffect, useRef, useState, type DragEvent } from "react";
import { Icon } from "@/components/icons";
import { cn } from "@/lib/cn";
import { useTranslations } from "@/lib/locale-context";

const ACCEPTED_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
const MAX_BYTES = 5 * 1024 * 1024;

export interface ImageUploadValue {
  /** Existing image URL (edit mode, untouched). */
  existingUrl: string | null;
  /** A newly picked local file, pending upload on submit. */
  file: File | null;
  /** True once the user has explicitly removed the image. */
  removed: boolean;
}

interface Props {
  value: ImageUploadValue;
  onChange: (value: ImageUploadValue) => void;
  label?: string;
  disabled?: boolean;
}

/**
 * Drag-and-drop / click-to-browse equipment photo field with preview,
 * replace and remove — the first real image upload UI in this codebase
 * (elsewhere, e.g. UploadDocumentModal, still uses a bare
 * `<input type="file">`). Hands the raw File up to the parent form, which
 * decides whether to submit multipart (new/changed image) or plain JSON
 * (unchanged) — this component never uploads on its own.
 */
export function ImageUploadField({ value, onChange, label, disabled }: Props) {
  const t = useTranslations();
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragActive, setDragActive] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [objectUrl, setObjectUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!value.file) {
      setObjectUrl(null);
      return;
    }
    const url = URL.createObjectURL(value.file);
    setObjectUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [value.file]);

  const previewUrl = value.file ? objectUrl : !value.removed ? value.existingUrl : null;

  function validate(file: File): string | null {
    if (!ACCEPTED_TYPES.includes(file.type)) {
      return t("equipment.form.imageInvalidType");
    }
    if (file.size > MAX_BYTES) {
      return t("equipment.form.imageTooLarge");
    }
    return null;
  }

  function pick(file: File) {
    const validationError = validate(file);
    if (validationError) {
      setError(validationError);
      return;
    }
    setError(null);
    onChange({ existingUrl: value.existingUrl, file, removed: false });
  }

  function handleDrop(e: DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setDragActive(false);
    if (disabled) return;
    const file = e.dataTransfer.files?.[0];
    if (file) pick(file);
  }

  function handleRemove(e: React.MouseEvent) {
    e.stopPropagation();
    setError(null);
    onChange({ existingUrl: value.existingUrl, file: null, removed: true });
  }

  return (
    <div className="flex flex-col gap-1.5">
      {label && <label className="text-sm font-medium text-text-secondary">{label}</label>}

      <div
        role="button"
        tabIndex={disabled ? -1 : 0}
        onClick={() => !disabled && inputRef.current?.click()}
        onKeyDown={(e) => {
          if (!disabled && (e.key === "Enter" || e.key === " ")) inputRef.current?.click();
        }}
        onDragOver={(e) => {
          e.preventDefault();
          if (!disabled) setDragActive(true);
        }}
        onDragLeave={() => setDragActive(false)}
        onDrop={handleDrop}
        className={cn(
          "relative flex aspect-video w-full cursor-pointer flex-col items-center justify-center gap-2 overflow-hidden rounded-lg border border-dashed bg-bg-primary transition-colors",
          dragActive ? "border-brand-500 bg-bg-tertiary" : "border-border-secondary hover:border-border-primary",
          disabled && "pointer-events-none opacity-50"
        )}
      >
        <input
          ref={inputRef}
          type="file"
          accept={ACCEPTED_TYPES.join(",")}
          disabled={disabled}
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) pick(file);
            e.target.value = "";
          }}
        />

        {previewUrl ? (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element -- previews a locally-picked File via a blob: URL, which next/image cannot optimize */}
            <img src={previewUrl} alt="" className="h-full w-full object-cover" />
            <div className="absolute inset-x-0 bottom-0 flex items-center justify-end gap-1.5 bg-gradient-to-t from-black/60 to-transparent p-2">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  inputRef.current?.click();
                }}
                className="flex items-center gap-1 rounded-md bg-black/50 px-2 py-1 text-xs font-medium text-white backdrop-blur-sm transition-colors hover:bg-black/70"
              >
                <Icon name="upload" size={13} /> {t("equipment.form.imageReplace")}
              </button>
              <button
                type="button"
                onClick={handleRemove}
                className="flex items-center gap-1 rounded-md bg-black/50 px-2 py-1 text-xs font-medium text-white backdrop-blur-sm transition-colors hover:bg-error-600"
              >
                <Icon name="x" size={13} /> {t("equipment.form.imageRemove")}
              </button>
            </div>
          </>
        ) : (
          <>
            <Icon name="upload" size={22} className="text-text-quaternary" />
            <p className="px-4 text-center text-xs text-text-tertiary">
              {t("equipment.form.imageDropHint")}
            </p>
          </>
        )}
      </div>

      {error && <p className="text-xs text-error-400">{error}</p>}
    </div>
  );
}
