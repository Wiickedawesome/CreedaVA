"use client";

import { useState, useEffect } from "react";
import { useTranslation } from "@/lib/i18n";
import { useForumAuth } from "./forum-auth-context";

interface ForumAuthModalProps {
  open: boolean;
  onClose: () => void;
  defaultMode?: "signIn" | "signUp";
}

const COUNTRIES = [
  "United States", "Canada", "United Kingdom", "Australia", "Germany", "France",
  "Spain", "Mexico", "Brazil", "Colombia", "Argentina", "India", "Japan",
  "South Korea", "Philippines", "Nigeria", "South Africa", "Kenya", "UAE",
  "Saudi Arabia", "Singapore", "Netherlands", "Italy", "Portugal", "Ireland",
  "New Zealand", "Sweden", "Norway", "Denmark", "Switzerland", "Belgium",
  "Austria", "Poland", "Czech Republic", "Chile", "Peru", "Ecuador",
  "Costa Rica", "Panama", "Dominican Republic", "Puerto Rico", "Jamaica",
  "Trinidad and Tobago", "Honduras", "Guatemala", "El Salvador", "Other",
];

export function ForumAuthModal({
  open,
  onClose,
  defaultMode = "signIn",
}: ForumAuthModalProps) {
  const { t } = useTranslation();
  const { signIn, signUp } = useForumAuth();
  const [mode, setMode] = useState<"signIn" | "signUp">(defaultMode);

  // Sync mode when defaultMode prop changes (e.g. New Post vs Like)
  useEffect(() => {
    if (!open) return;
    const timeoutId = setTimeout(() => setMode(defaultMode), 0);
    return () => clearTimeout(timeoutId);
  }, [open, defaultMode]);

  // Sign in fields
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // Sign up fields
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [company, setCompany] = useState("");
  const [country, setCountry] = useState("");
  const [phone, setPhone] = useState("");
  const [confirmPw, setConfirmPw] = useState("");

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  if (!open) return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (mode === "signUp") {
      if (password.length < 6) {
        setError(t.forum.passwordTooShort);
        return;
      }
      if (password !== confirmPw) {
        setError(t.forum.passwordMismatch);
        return;
      }
    }

    setLoading(true);
    try {
      if (mode === "signUp") {
        await signUp({
          email,
          password,
          firstName,
          lastName,
          company,
          country,
          phone,
        });
      } else {
        await signIn(email, password);
      }
      onClose();
    } catch {
      setError(t.forum.authError);
    } finally {
      setLoading(false);
    }
  }

  const inputClass =
    "w-full rounded-(--mk-radius) px-3.5 py-2.5 border border-mk-line bg-mk-white text-sm text-mk-ink placeholder:text-mk-ink-mute focus:outline-none focus:border-mk-brand focus:ring-1 focus:ring-mk-brand";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-mk-ink/50" onClick={onClose} aria-hidden="true" />

      {/* Modal */}
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="forum-auth-title"
        className="relative max-h-[90vh] w-full max-w-md overflow-y-auto rounded-(--mk-radius-lg) border border-mk-line bg-mk-white p-6 shadow-(--mk-shadow-float)"
      >
        <button
          onClick={onClose}
          aria-label="Close"
          className="absolute right-3 top-3 text-xl leading-none text-mk-ink-mute transition-colors hover:text-mk-ink"
        >
          &times;
        </button>

        <h2 id="forum-auth-title" className="mb-1 font-display text-xl font-extrabold text-mk-ink">
          {mode === "signIn" ? t.forum.signIn : t.forum.signUp}
        </h2>
        {mode === "signUp" && (
          <p className="text-xs text-mk-ink-mute mb-4">
            {t.forum.signUpSubtitle}
          </p>
        )}
        {mode === "signIn" && <div className="mb-4" />}

        <form onSubmit={handleSubmit} className="space-y-3">
          {mode === "signUp" && (
            <>
              {/* Name row */}
              <div className="grid grid-cols-2 gap-3">
                <input
                  type="text"
                  placeholder={t.forum.firstName}
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  required
                  className={inputClass}
                />
                <input
                  type="text"
                  placeholder={t.forum.lastName}
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  required
                  className={inputClass}
                />
              </div>

              {/* Company */}
              <input
                type="text"
                placeholder={t.forum.company}
                value={company}
                onChange={(e) => setCompany(e.target.value)}
                className={inputClass}
              />

              {/* Country + Phone row */}
              <div className="grid grid-cols-2 gap-3">
                <select
                  value={country}
                  onChange={(e) => setCountry(e.target.value)}
                  aria-label={t.forum.country}
                  className={`${inputClass} ${!country ? "text-mk-ink-mute" : ""}`}
                >
                  <option value="" disabled>
                    {t.forum.country}
                  </option>
                  {COUNTRIES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
                <input
                  type="tel"
                  placeholder={t.forum.phone}
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className={inputClass}
                />
              </div>
            </>
          )}

          {/* Email + Password (both modes) */}
          <input
            type="email"
            placeholder={t.forum.email}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className={inputClass}
          />
          <input
            type="password"
            placeholder={t.forum.password}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className={inputClass}
          />

          {mode === "signUp" && (
            <input
              type="password"
              placeholder={t.forum.confirmPassword}
              value={confirmPw}
              onChange={(e) => setConfirmPw(e.target.value)}
              required
              className={inputClass}
            />
          )}

          {error && <p className="text-xs text-red-600">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 bg-mk-brand text-white text-sm font-medium rounded hover:bg-mk-brand-bright transition-colors disabled:opacity-50"
          >
            {loading
              ? "..."
              : mode === "signIn"
                ? t.forum.signIn
                : t.forum.signUp}
          </button>
        </form>

        <div className="mt-4 text-center text-xs text-mk-ink-mute">
          {mode === "signIn" ? (
            <>
              {t.forum.noAccount}{" "}
              <button
                onClick={() => {
                  setMode("signUp");
                  setError("");
                }}
                className="text-mk-brand font-medium hover:underline"
              >
                {t.forum.createAccount}
              </button>
            </>
          ) : (
            <>
              {t.forum.hasAccount}{" "}
              <button
                onClick={() => {
                  setMode("signIn");
                  setError("");
                }}
                className="text-mk-brand font-medium hover:underline"
              >
                {t.forum.signInHere}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
