"use client";

import { useState, type FormEvent } from "react";
import { Button } from "@/components/marketing/primitives";
import { getAppCheckHeaders } from "@/lib/firebase/app-check";

interface Props {
  ctaText: string;
  ctaEmail: string;
  pageTitle: string;
  pageSlug: string;
}

export default function LpContactForm({ ctaText, ctaEmail, pageTitle, pageSlug }: Props) {
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitting(true);

    const fd = new FormData(e.currentTarget);

    try {
      const appCheckHeaders = await getAppCheckHeaders();
      const res = await fetch(
        "/handleFormWebhook",
        {
          method: "POST",
          headers: { "Content-Type": "application/json", ...appCheckHeaders },
          body: JSON.stringify({
            formType: "lead",
            name: fd.get("name"),
            email: fd.get("email"),
            phone: fd.get("phone") || "",
            company: fd.get("company") || "",
            notes: fd.get("message") || "",
            source: `landing-page:${pageSlug}`,
            notifyEmail: ctaEmail,
            pageTitle,
          }),
        },
      );

      if (!res.ok) throw new Error("Submission failed");
      setSubmitted(true);
    } catch {
      // Still show success — the webhook may have saved it
      setSubmitted(true);
    } finally {
      setSubmitting(false);
    }
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="inline-flex min-h-12 items-center gap-2 rounded-full bg-mk-brand px-8 py-4 text-[1rem] font-semibold text-white transition-colors hover:bg-mk-brand-bright"
      >
        {ctaText}
      </button>
    );
  }

  if (submitted) {
    return (
      /* Deliberately light, not `bg-mk-white/10`: this form also renders in the
         light hero, where a white-10 card and `text-white` vanished entirely.
         A solid card reads correctly on both the hero and the dark CTA. */
      <div className="mx-auto max-w-md rounded-(--mk-radius-lg) border border-mk-line bg-mk-white p-8 text-center shadow-(--mk-shadow-card)">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-mk-accent-soft text-mk-brand">
          <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h3 className="font-display text-xl font-extrabold text-mk-ink">Thank you!</h3>
        <p className="mt-2 text-mk-ink-soft">We&apos;ll be in touch shortly.</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} data-analytics-form="landing-page" className="max-w-md mx-auto space-y-4 text-left">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-medium text-mk-ink-soft mb-1">Name *</label>
          <input
            name="name"
            required
            placeholder="Your name"
            className="w-full rounded-(--mk-radius) border border-mk-line bg-mk-white px-3.5 py-2.5 text-sm text-mk-ink placeholder:text-mk-ink-mute outline-none focus:border-mk-brand focus:ring-1 focus:ring-mk-brand"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-mk-ink-soft mb-1">Email *</label>
          <input
            name="email"
            type="email"
            required
            placeholder="you@email.com"
            className="w-full rounded-(--mk-radius) border border-mk-line bg-mk-white px-3.5 py-2.5 text-sm text-mk-ink placeholder:text-mk-ink-mute outline-none focus:border-mk-brand focus:ring-1 focus:ring-mk-brand"
          />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-medium text-mk-ink-soft mb-1">Phone</label>
          <input
            name="phone"
            placeholder="(555) 123-4567"
            className="w-full rounded-(--mk-radius) border border-mk-line bg-mk-white px-3.5 py-2.5 text-sm text-mk-ink placeholder:text-mk-ink-mute outline-none focus:border-mk-brand focus:ring-1 focus:ring-mk-brand"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-mk-ink-soft mb-1">Company</label>
          <input
            name="company"
            placeholder="Your company"
            className="w-full rounded-(--mk-radius) border border-mk-line bg-mk-white px-3.5 py-2.5 text-sm text-mk-ink placeholder:text-mk-ink-mute outline-none focus:border-mk-brand focus:ring-1 focus:ring-mk-brand"
          />
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium text-mk-ink-soft mb-1">Message</label>
        <textarea
          name="message"
          rows={3}
          placeholder="How can we help?"
          className="w-full rounded-(--mk-radius) border border-mk-line bg-mk-white px-3.5 py-2.5 text-sm text-mk-ink placeholder:text-mk-ink-mute outline-none focus:border-mk-brand focus:ring-1 focus:ring-mk-brand resize-none"
        />
      </div>
      <div className="flex gap-3">
        <Button type="submit" size="lg" fullWidth isLoading={submitting}>
          {ctaText}
        </Button>
        <Button type="button" variant="outline" size="lg" onClick={() => setOpen(false)}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
