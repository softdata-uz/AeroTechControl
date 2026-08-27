"use client";

import { useEffect, type ReactNode } from "react";
import { Icon } from "@/components/icons";
import { cn } from "@/lib/cn";

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: ReactNode;
  footer?: ReactNode;
  size?: "md" | "lg";
}

/** Centered dialog — Esc-to-close, backdrop-click-to-close, scroll-locked
 * body while open. Reused by every "Add …" flow (AddEquipmentModal,
 * AddFaultModal, …) so the chrome stays identical across the app. */
export function Modal({ open, onClose, title, description, children, footer, size = "md" }: ModalProps) {
  useEffect(() => {
    if (!open) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = prevOverflow;
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-bg-overlay/70 px-4 py-8 backdrop-blur-[2px]">
      <button
        aria-label="Закрыть"
        onClick={onClose}
        className="fixed inset-0 -z-10 cursor-default"
        tabIndex={-1}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        className={cn(
          "w-full rounded-xl border border-border-primary bg-bg-secondary shadow-lg",
          size === "lg" ? "max-w-2xl" : "max-w-md"
        )}
      >
        <div className="flex items-start justify-between gap-4 border-b border-border-secondary px-5 py-4">
          <div className="min-w-0">
            <h2 id="modal-title" className="text-base font-semibold text-text-primary">
              {title}
            </h2>
            {description && <p className="mt-0.5 text-xs text-text-tertiary">{description}</p>}
          </div>
          <button
            onClick={onClose}
            aria-label="Закрыть"
            className="shrink-0 rounded-md p-1.5 text-text-quaternary transition-colors hover:bg-bg-tertiary hover:text-text-primary"
          >
            <Icon name="x" size={18} />
          </button>
        </div>

        <div className="max-h-[70vh] overflow-y-auto px-5 py-4">{children}</div>

        {footer && <div className="flex items-center justify-end gap-2 border-t border-border-secondary px-5 py-4">{footer}</div>}
      </div>
    </div>
  );
}
