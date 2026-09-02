"use client";

import { useEffect, useRef, useState, type DragEvent } from "react";
import { Icon } from "@/components/icons";
import { cn } from "@/lib/cn";
import { useTranslations } from "@/lib/locale-context";
import type { ImageUploadValue } from "@/components/equipment/ImageUploadField";

const DEFAULT_ACCEPTED_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
const DEFAULT_MAX_BYTES = 5 * 1024 * 1024;

interface Props {
  value: ImageUploadValue;
  onChange: (value: ImageUploadValue) => void;
  /** Used to render initials as the empty-state fallback, same look as the app's static avatar circles. */
  fullName: string;
  disabled?: boolean;
  acceptedTypes?: string[];
  maxBytes?: number;
}

/**
 * Circular avatar picker for a person's photo — a purpose-built sibling to
 * `ImageUploadField` (which stays a rectangular dropzone for equipment/floor
 * photos). Shares the same `ImageUploadValue` contract and validation rules,
 * but renders as a small round preview with an initials fallback and a
 * pinned edit badge, matching the static avatar circles used elsewhere
 * (account menu, users table).
 */
export function AvatarUploadField({
  value,
  onChange,
  fullName,
  disabled,
  acceptedTypes = DEFAULT_ACCEPTED_TYPES,
  maxBytes = DEFAULT_MAX_BYTES,
}: Props) {
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
  const initials = fullName
    .split(" ")
    .map((p) => p[0])
    .join("")
    .slice(0, 2);

  function validate(file: File): string | null {
    if (!acceptedTypes.includes(file.type)) return t("equipment.form.imageInvalidType");
    if (file.size > maxBytes) return t("equipment.form.imageTooLarge");
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
    e.preventDefault();
    setError(null);
    onChange({ existingUrl: value.existingUrl, file: null, removed: true });
  }

  return (
    <div className="flex flex-col items-center gap-1.5">
      <div className={cn("relative h-20 w-20 shrink-0", disabled && "pointer-events-none opacity-50")}>
        <div
          role="button"
          tabIndex={0}
          onClick={() => inputRef.current?.click()}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") inputRef.current?.click();
          }}
          onDragOver={(e) => {
            e.preventDefault();
            setDragActive(true);
          }}
          onDragLeave={() => setDragActive(false)}
          onDrop={handleDrop}
          className={cn(
            "group relative h-20 w-20 cursor-pointer overflow-hidden rounded-full border-2 transition-colors",
            dragActive ? "border-brand-500" : "border-border-secondary hover:border-border-primary"
          )}
        >
          {previewUrl ? (
            // eslint-disable-next-line @next/next/no-img-element -- previews a locally-picked File via a blob: URL
            <img src={previewUrl} alt="" className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-brand-600 text-xl font-semibold text-white">
              {initials || <Icon name="user" size={26} />}
            </div>
          )}
          <div className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 transition-opacity group-hover:opacity-100">
            <Icon name="camera" size={20} className="text-white" />
          </div>
        </div>

        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={disabled}
          aria-label={t("equipment.form.imageReplace")}
          className="absolute -bottom-0.5 -right-0.5 flex h-7 w-7 items-center justify-center rounded-full border-2 border-bg-secondary bg-brand-600 text-white shadow-xs transition-colors hover:bg-brand-700"
        >
          <Icon name="camera" size={13} />
        </button>

        {previewUrl && (
          <button
            type="button"
            onClick={handleRemove}
            disabled={disabled}
            aria-label={t("equipment.form.imageRemove")}
            className="absolute -top-0.5 -right-0.5 flex h-6 w-6 items-center justify-center rounded-full border-2 border-bg-secondary bg-bg-tertiary text-text-tertiary shadow-xs transition-colors hover:bg-error-600 hover:text-white"
          >
            <Icon name="x" size={11} />
          </button>
        )}

        <input
          ref={inputRef}
          type="file"
          accept={acceptedTypes.join(",")}
          disabled={disabled}
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) pick(file);
            e.target.value = "";
          }}
        />
      </div>

      {error && <p className="max-w-32 text-center text-xs text-error-400">{error}</p>}
    </div>
  );
}
