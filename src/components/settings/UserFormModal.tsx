"use client";

import { useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Dropdown } from "@/components/ui/Dropdown";
import { Icon } from "@/components/icons";
import { AvatarUploadField } from "@/components/settings/AvatarUploadField";
import type { ImageUploadValue } from "@/components/equipment/ImageUploadField";
import { ApiException } from "@/services";
import { useTranslations } from "@/lib/locale-context";
import { useLocations } from "@/hooks/useLocations";
import { roleLabelKeys, roleDescriptionKeys, ALL_AIRPORT_ROLES } from "@/config/roleAccess.config";
import type { AppUser, UserRole } from "@/lib/types";
import type { UserInput } from "@/services/users.service";

const ASSIGNABLE_ROLES: UserRole[] = [
  "engineer",
  "lead_engineer",
  "spare_parts_manager",
  "central_office",
  "administrator",
  "auditor",
];

interface Props {
  onClose: () => void;
  onSaved: () => void;
  initial?: AppUser | null;
  create: (input: UserInput) => Promise<unknown>;
  update: (id: number, input: Partial<UserInput>) => Promise<unknown>;
}

const SECTION_LABEL_CLASS = "text-xs font-medium uppercase tracking-wide text-text-quaternary";

/** Mounted only while open — see call site. */
export function UserFormModal({ onClose, onSaved, initial, create, update }: Props) {
  const t = useTranslations();
  const { airports } = useLocations();
  const [fullName, setFullName] = useState(initial?.fullName ?? "");
  const [login, setLogin] = useState(initial?.login ?? "");
  const [email, setEmail] = useState(initial?.email ?? "");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [role, setRole] = useState<UserRole>(initial?.role ?? "engineer");
  const [airportId, setAirportId] = useState(initial?.airportId ? String(initial.airportId) : "");
  const [image, setImage] = useState<ImageUploadValue>({
    existingUrl: initial?.imageUrl ?? null,
    file: null,
    removed: false,
  });
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const needsAirport = !ALL_AIRPORT_ROLES.includes(role);

  async function handleSubmit() {
    if (!fullName.trim() || !login.trim() || (!initial && !password) || (needsAirport && !airportId)) {
      setError(t("settingsCrud.requiredError"));
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const input: Partial<UserInput> = {
        fullName,
        login,
        email: email.trim() || undefined,
        role,
        airportId: needsAirport && airportId ? Number(airportId) : undefined,
        image: image.file ?? undefined,
      };
      if (password) input.password = password;
      if (initial) {
        await update(initial.id, input);
      } else {
        await create(input as UserInput);
      }
      onSaved();
      onClose();
    } catch (err) {
      if (err instanceof ApiException && err.status === 409) {
        setError(t("users.form.loginTaken"));
      } else {
        setError(t("settingsCrud.genericError"));
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Modal
      open
      onClose={onClose}
      size="lg"
      title={t(initial ? "users.form.editTitle" : "users.form.newTitle")}
      footer={
        <>
          <Button hierarchy="secondary" size="sm" onClick={onClose}>
            {t("common.cancel")}
          </Button>
          <Button hierarchy="primary" size="sm" onClick={handleSubmit} disabled={submitting}>
            {t("common.save")}
          </Button>
        </>
      }
    >
      <div className="space-y-5">
        {error && (
          <p className="rounded-md border border-(--chip-error-border) bg-(--chip-error-bg) px-3 py-2 text-xs text-(--chip-error-text)">
            {error}
          </p>
        )}

        <div className="flex items-start gap-4">
          <AvatarUploadField value={image} onChange={setImage} fullName={fullName} disabled={submitting} />
          <div className="flex flex-1 flex-col gap-3 pt-1">
            <Input
              label={t("users.form.fullName")}
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
            />
            <Input
              label={t("users.form.login")}
              required
              value={login}
              onChange={(e) => setLogin(e.target.value)}
            />
          </div>
        </div>

        <Input
          label={t("users.form.email")}
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <div className="flex flex-col gap-3">
          <p className={SECTION_LABEL_CLASS}>{t("users.form.sectionAccess")}</p>
          <div className="grid grid-cols-2 gap-4">
            <Dropdown
              label={t("users.form.role")}
              required
              value={role}
              onChange={(value) => setRole(value as UserRole)}
              options={ASSIGNABLE_ROLES.map((r) => ({
                value: r,
                label: t(roleLabelKeys[r]),
                description: t(roleDescriptionKeys[r]),
              }))}
            />
            {needsAirport ? (
              <Dropdown
                label={t("users.form.airport")}
                required
                value={airportId}
                onChange={setAirportId}
                options={airports.map((a) => ({ value: String(a.id), label: a.name }))}
              />
            ) : (
              <div className="flex items-end pb-2.5">
                <p className="text-xs text-text-tertiary">{t("users.form.allAirportsHint")}</p>
              </div>
            )}
          </div>
          <p className="text-xs text-text-tertiary">{t(roleDescriptionKeys[role])}</p>
        </div>

        <div className="flex flex-col gap-3">
          <p className={SECTION_LABEL_CLASS}>{t("users.form.sectionSecurity")}</p>
          <Input
            label={t("users.form.password")}
            type={showPassword ? "text" : "password"}
            required={!initial}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            hint={initial ? t("users.form.passwordEditHint") : undefined}
            trailing={
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                aria-label={showPassword ? t("login.hidePassword") : t("login.showPassword")}
                className="pointer-events-auto flex h-5 w-5 items-center justify-center text-text-quaternary hover:text-text-secondary"
              >
                <Icon name={showPassword ? "eye-off" : "eye"} size={16} />
              </button>
            }
          />
        </div>
      </div>
    </Modal>
  );
}
