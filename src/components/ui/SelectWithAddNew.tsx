"use client";

import { useState } from "react";
import { Dropdown, type DropdownOption } from "@/components/ui/Dropdown";
import { AddLookupModal } from "@/components/ui/AddLookupModal";
import { Icon } from "@/components/icons";
import { useTranslations } from "@/lib/locale-context";

interface NameForm {
  name: string;
}

interface Props<T> {
  label: string;
  entityLabel: string;
  required?: boolean;
  disabled?: boolean;
  error?: string;
  options: DropdownOption[];
  value: string;
  onChange: (value: string) => void;
  /** Called with the created record's id (as a string, matching Dropdown's value type) after a successful create. */
  onCreated: (record: T, id: string) => void;
  create: (form: NameForm) => Promise<T>;
  toOption: (record: T) => DropdownOption;
}

/**
 * Searchable Dropdown + "Add new <entity>" modal, in one reusable unit.
 * This is the single component behind every lookup picker in the Equipment
 * form (Equipment Type, Equipment Model, Manufacturer Company/Country,
 * Operated By) — new-record creation is non-navigating, auto-selects the
 * result, and refreshes the option list without a page reload.
 */
export function SelectWithAddNew<T>({
  label,
  entityLabel,
  required,
  disabled,
  error,
  options,
  value,
  onChange,
  onCreated,
  create,
  toOption,
}: Props<T>) {
  const t = useTranslations();
  const [modalOpen, setModalOpen] = useState(false);

  return (
    <>
      <Dropdown
        label={label}
        required={required}
        disabled={disabled}
        error={error}
        options={options}
        value={value}
        onChange={onChange}
        searchable
        footer={(close) => (
          <button
            type="button"
            disabled={disabled}
            onClick={() => {
              close();
              setModalOpen(true);
            }}
            className="flex w-full items-center gap-2 rounded-md px-2.5 py-2 text-left text-sm font-medium text-brand-400 transition-colors hover:bg-bg-tertiary disabled:pointer-events-none disabled:opacity-50"
          >
            <Icon name="plus" size={16} className="shrink-0" />
            {t("equipment.lookupModal.addPrefix")}
          </button>
        )}
      />

      <AddLookupModal<T>
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        entityLabel={entityLabel}
        create={create}
        onCreated={(record) => {
          const option = toOption(record);
          onCreated(record, option.value);
          onChange(option.value);
        }}
      />
    </>
  );
}
