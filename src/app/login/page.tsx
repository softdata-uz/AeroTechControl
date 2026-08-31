"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Icon, type IconName } from "@/components/icons";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Checkbox } from "@/components/ui/Checkbox";
import { LanguageMenu } from "@/components/layout/LanguageMenu";
import { useTheme } from "@/lib/theme-context";
import { useTranslations } from "@/lib/locale-context";
import type { TranslationKey } from "@/lib/i18n/translations";
import { login } from "@/services/auth/login.service";

const features: { icon: IconName; titleKey: TranslationKey; descKey: TranslationKey }[] = [
  { icon: "clipboard-check", titleKey: "login.feature.inspections", descKey: "login.feature.inspectionsDesc" },
  { icon: "wrench", titleKey: "login.feature.maintenance", descKey: "login.feature.maintenanceDesc" },
  { icon: "bar-chart", titleKey: "login.feature.analytics", descKey: "login.feature.analyticsDesc" },
  { icon: "check-circle", titleKey: "login.feature.control", descKey: "login.feature.controlDesc" },
];

export default function LoginPage() {
  const router = useRouter();
  const { theme, toggleTheme } = useTheme();
  const t = useTranslations();

  const [loginValue, setLoginValue] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!loginValue.trim() || !password) {
      setError(t("login.errorRequired"));
      return;
    }
    setError(null);
    setSubmitting(true);
    try {
      await login({ login: loginValue, password, rememberMe });
      router.push("/");
    } catch {
      setError(t("login.errorInvalid"));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="relative flex min-h-screen w-full flex-col bg-bg-primary lg:flex-row">
      {/* Left — brand panel. Always dark, matching the sidebar's fixed
          product identity (CLAUDE.md §9), regardless of the app theme. */}
      <div
        data-force-theme="dark"
        className="relative hidden w-1/2 shrink-0 flex-col justify-between overflow-hidden border-r border-border-primary bg-bg-primary p-10 lg:flex"
      >
        {/* Ambient tech backdrop — radial glow + faint dot grid, same dark
            operational language as the rest of the app (no photography
            asset in the repo to draw from). */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "radial-gradient(60% 50% at 15% 10%, var(--color-brand-950) 0%, transparent 60%), radial-gradient(50% 40% at 90% 90%, var(--color-brand-950) 0%, transparent 60%)",
          }}
        />
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-40"
          style={{
            backgroundImage:
              "radial-gradient(var(--color-gray-700) 1px, transparent 1px)",
            backgroundSize: "22px 22px",
          }}
        />

        <div className="relative z-10">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-brand-600 text-white">
              <Icon name="shield" size={22} />
            </div>
            <div>
              <p className="text-xl font-bold text-text-primary">
                Aerotech<span className="text-brand-400">Control</span>
              </p>
            </div>
          </div>
          <p className="mt-3 max-w-sm text-sm leading-relaxed text-text-tertiary">{t("login.tagline")}</p>

          <ul className="mt-12 flex flex-col gap-7">
            {features.map((f) => (
              <li key={f.titleKey} className="flex items-start gap-3.5">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-brand-800 bg-brand-950 text-brand-400">
                  <Icon name={f.icon} size={18} />
                </div>
                <div>
                  <p className="text-sm font-semibold text-text-primary">{t(f.titleKey)}</p>
                  <p className="text-xs text-text-tertiary">{t(f.descKey)}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>

        <div className="relative z-10 flex items-start gap-3 rounded-xl border border-border-primary bg-bg-secondary/80 p-4 backdrop-blur-sm">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-950 text-brand-400">
            <Icon name="shield" size={16} />
          </div>
          <div>
            <p className="text-sm font-semibold text-text-primary">{t("login.reliability")}</p>
            <p className="text-xs text-text-tertiary">
              {t("login.reliabilityDesc")} <span className="font-semibold text-success-400">24/7</span>
            </p>
          </div>
        </div>
      </div>

      {/* Right — sign-in panel, follows the app-wide theme toggle. */}
      <div className="flex flex-1 flex-col">
        <div className="flex items-center justify-end gap-2 px-6 py-4 lg:px-10">
          <button
            type="button"
            onClick={toggleTheme}
            aria-label={theme === "dark" ? t("topbar.enableLightTheme") : t("topbar.enableDarkTheme")}
            className="flex h-10 w-10 items-center justify-center rounded-lg border border-border-primary text-text-tertiary transition-colors hover:bg-bg-tertiary hover:text-text-primary"
          >
            <Icon name={theme === "dark" ? "sun" : "moon"} size={18} />
          </button>
          <LanguageMenu />
        </div>

        <div className="flex flex-1 items-center justify-center px-6 pb-16">
          <div className="w-full max-w-md">
            <h1 className="text-2xl font-bold text-text-primary lg:text-3xl">
              {t("login.headingPrefix")} <span className="text-brand-500">{t("login.headingHighlight")}</span>
            </h1>
            <p className="mt-2 text-sm text-text-secondary">
              {t("login.welcome")}
            </p>
            <p className="text-sm text-text-tertiary">{t("login.subheading")}</p>

            <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-4">
              <Input
                icon="user"
                type="text"
                autoComplete="username"
                placeholder={t("login.loginPlaceholder")}
                aria-label={t("login.loginLabel")}
                value={loginValue}
                onChange={(e) => setLoginValue(e.target.value)}
                disabled={submitting}
              />
              <Input
                icon="lock"
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                placeholder={t("login.passwordPlaceholder")}
                aria-label={t("login.passwordLabel")}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={submitting}
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

              {error && <p className="text-xs text-error-400">{error}</p>}

              <div className="flex items-center justify-between">
                <Checkbox checked={rememberMe} onChange={setRememberMe} label={t("login.rememberMe")} />
                <button type="button" className="text-sm font-medium text-brand-400 hover:text-brand-300">
                  {t("login.forgotPassword")}
                </button>
              </div>

              <Button
                type="submit"
                hierarchy="primary"
                size="lg"
                icon="lock"
                disabled={submitting}
                className="w-full"
              >
                {submitting ? t("login.submitting") : t("login.submit")}
              </Button>
            </form>

            <div className="my-5 flex items-center gap-3">
              <div className="h-px flex-1 bg-border-primary" />
              <span className="text-xs uppercase text-text-quaternary">{t("login.or")}</span>
              <div className="h-px flex-1 bg-border-primary" />
            </div>

            <Button hierarchy="secondary" size="lg" icon="shield" className="w-full">
              {t("login.ssoButton")}
            </Button>
          </div>
        </div>
      </div>

      <p className="absolute inset-x-0 bottom-3 text-center text-xs text-text-quaternary">
        {t("login.footer")}
      </p>
    </div>
  );
}
