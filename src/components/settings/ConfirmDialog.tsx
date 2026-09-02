"use client";

import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { useTranslations } from "@/lib/locale-context";

interface Props {
  open: boolean;
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
  confirming?: boolean;
}

/** Small confirm-before-destroy dialog used by every CrudListPanel's delete action. */
export function ConfirmDialog({ open, title, message, onConfirm, onCancel, confirming }: Props) {
  const t = useTranslations();
  return (
    <Modal
      open={open}
      onClose={onCancel}
      title={title}
      footer={
        <>
          <Button hierarchy="secondary" size="sm" onClick={onCancel}>
            {t("common.cancel")}
          </Button>
          <Button hierarchy="destructive" size="sm" onClick={onConfirm} disabled={confirming}>
            {t("common.delete")}
          </Button>
        </>
      }
    >
      <p className="text-sm text-text-secondary">{message}</p>
    </Modal>
  );
}
