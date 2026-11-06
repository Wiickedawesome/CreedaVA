"use client";

import { useState, type FormEvent, type ReactNode } from "react";
import { trackEvent } from "@/lib/firebase/analytics";
import type { Dictionary } from "@/lib/i18n";

/**
 * Contact intake form.
 *
 * Client Component: this is the only interactive part of `/contact`, so keeping
 * it separate lets the rest of the page render as static HTML.
 *
 * The submission contract is deliberately unchanged from the previous
 * implementation — same endpoint, same JSON field names, same `source` value,
 * same analytics event. The e2e suite in `e2e/contact-form.spec.ts` asserts on
 * accessible roles and names, so every field keeps a real `<label for>`.
 *
 * The fields are local rather than the shared `Input`/`Textarea`: those are
 * styled for the admin surface and are used there, and this design needs an
 * underline field with no box or fill. Overriding their classes from outside
 * would depend on Tailwind's utility ordering, which is not a contract worth
 * relying on.
 */

type ContactCopy = Dictionary["contact"];

const ARROW = (
  <svg
    aria-hidden="true"
    className="h-4 w-4"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M5 12h14M13 6l6 6-6 6"
    />
  </svg>
);

const FIELD_CLASSES =
  "mt-2 w-full border-b border-mk-line-strong bg-transparent px-0 py-2 text-[0.98rem] text-mk-ink transition-colors duration-150 placeholder:text-mk-ink-mute/70 focus:border-mk-brand focus:outline-none focus:ring-0";

const LABEL_CLASSES =
  "block text-[0.7rem] font-semibold uppercase tracking-[0.16em] text-mk-ink-mute";

function Field({
  id,
  name,
  label,
  type = "text",
  placeholder,
  required = false,
  autoComplete,
}: {
  id: string;
  name: string;
  label: string;
  type?: string;
  placeholder?: string;
  required?: boolean;
  autoComplete?: string;
}): ReactNode {
  return (
    <div>
      <label htmlFor={id} className={LABEL_CLASSES}>
        {label}
      </label>
      <input
        id={id}
        name={name}
        type={type}
        placeholder={placeholder}
        required={required}
        autoComplete={autoComplete}
        className={FIELD_CLASSES}
      />
    </div>
  );
}

function FieldArea({
  id,
  name,
  label,
  placeholder,
}: {
  id: string;
  name: string;
  label: string;
  placeholder?: string;
}): ReactNode {
  return (
    <div>
      <label htmlFor={id} className={LABEL_CLASSES}>
        {label}
      </label>
      <textarea
        id={id}
        name={name}
        placeholder={placeholder}
        required
        rows={5}
        className={`${FIELD_CLASSES} min-h-32 resize-y`}
      />
    </div>
  );
}

function SentPanel({ copy }: { copy: ContactCopy }): ReactNode {
  return (
    <div
      role="status"
      className="border-l-2 border-mk-brand bg-mk-accent-soft/60 px-6 py-8"
    >
      <h3 className="font-display text-[1.35rem] font-extrabold leading-tight tracking-[-0.025em] text-mk-ink">
        {copy.successTitle}
      </h3>
      <p className="mt-3 max-w-[42ch] text-[0.95rem] leading-[1.7] text-mk-ink-soft">
        {copy.successDesc}
      </p>
    </div>
  );
}

export function ContactForm({ copy }: { copy: ContactCopy }): ReactNode {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsSubmitting(true);
    setError("");

    const fd = new FormData(e.currentTarget);

    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName: fd.get("firstName"),
          lastName: fd.get("lastName"),
          email: fd.get("email"),
          phone: fd.get("phone") || "",
          company: fd.get("company") || "",
          message: fd.get("message"),
          source: "contact-page",
        }),
      });
      if (!res.ok) throw new Error("Failed to send");
      void trackEvent("form_submission", "/contact", {
        formName: "contact",
        source: "contact-page",
      });
      setSubmitted(true);
    } catch {
      setError("Something went wrong. Please try again or email us directly.");
    } finally {
      setIsSubmitting(false);
    }
  }

  if (submitted) {
    return <SentPanel copy={copy} />;
  }

  return (
    <form
      onSubmit={handleSubmit}
      data-analytics-form="contact"
      className="space-y-8"
    >
      <div className="grid grid-cols-1 gap-8 sm:grid-cols-2">
        <Field
          id="contact-first-name"
          name="firstName"
          label={copy.firstName}
          placeholder={copy.firstNamePlaceholder}
          autoComplete="given-name"
          required
        />
        <Field
          id="contact-last-name"
          name="lastName"
          label={copy.lastName}
          placeholder={copy.lastNamePlaceholder}
          autoComplete="family-name"
          required
        />
      </div>

      <div className="grid grid-cols-1 gap-8 sm:grid-cols-2">
        <Field
          id="contact-email"
          name="email"
          type="email"
          label={copy.email}
          placeholder={copy.emailPlaceholder}
          autoComplete="email"
          required
        />
        <Field
          id="contact-phone"
          name="phone"
          type="tel"
          label={copy.phoneLabel}
          placeholder="+1 (555) 123-4567"
          autoComplete="tel"
        />
      </div>

      <Field
        id="contact-company"
        name="company"
        label={copy.company}
        placeholder={copy.companyPlaceholder}
        autoComplete="organization"
      />

      <FieldArea
        id="contact-message"
        name="message"
        label={copy.message}
        placeholder={copy.messagePlaceholder}
      />

      {error && (
        <p role="alert" className="text-[0.9rem] text-red-600">
          {error}
        </p>
      )}

      <div className="pt-1">
        <button
          type="submit"
          disabled={isSubmitting}
          className="group inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-mk-brand px-7 text-[0.95rem] font-semibold text-white transition-colors duration-200 hover:bg-mk-brand-bright disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSubmitting ? copy.sending : copy.sendMessage}
          {ARROW}
        </button>
      </div>
    </form>
  );
}
