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
    if (open) setMode(defaultMode);
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
    "w-full px-3 py-2.5 border border-gray-20 rounded text-sm focus:outline-none focus:border-primary placeholder:text-gray-40";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />

      {/* Modal */}
      <div className="relative bg-white rounded-lg shadow-xl w-full max-w-md p-6 max-h-[90vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-gray-50 hover:text-gray-80 text-xl leading-none"
        >
          &times;
        </button>

        <h2 className="text-xl font-bold text-gray-100 mb-1">
          {mode === "signIn" ? t.forum.signIn : t.forum.signUp}
        </h2>
        {mode === "signUp" && (
          <p className="text-xs text-gray-40 mb-4">
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
                  className={`${inputClass} ${!country ? "text-gray-40" : ""}`}
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
            className="w-full py-2.5 bg-primary text-white text-sm font-medium rounded hover:bg-primary-light transition-colors disabled:opacity-50"
          >
            {loading
              ? "..."
              : mode === "signIn"
                ? t.forum.signIn
                : t.forum.signUp}
          </button>
        </form>

        <div className="mt-4 text-center text-xs text-gray-50">
          {mode === "signIn" ? (
            <>
              {t.forum.noAccount}{" "}
              <button
                onClick={() => {
                  setMode("signUp");
                  setError("");
                }}
                className="text-primary font-medium hover:underline"
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
                className="text-primary font-medium hover:underline"
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
