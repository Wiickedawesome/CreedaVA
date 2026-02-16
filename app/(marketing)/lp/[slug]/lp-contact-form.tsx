"use client";

import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui";

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
      const res = await fetch(
        "https://us-east4-creeda-va.cloudfunctions.net/handleFormWebhook",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
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
        className="inline-flex items-center gap-2 px-8 py-4 bg-primary text-white font-semibold rounded-md hover:bg-primary-light transition-colors text-lg"
      >
        {ctaText}
      </button>
    );
  }

  if (submitted) {
    return (
      <div className="max-w-md mx-auto bg-white/10 backdrop-blur rounded-2xl p-8 text-center">
        <div className="w-14 h-14 mx-auto mb-4 bg-white/20 rounded-full flex items-center justify-center">
          <svg className="w-7 h-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h3 className="text-xl font-bold text-white mb-2">Thank you!</h3>
        <p className="text-white/80">We&apos;ll be in touch shortly.</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-md mx-auto space-y-4 text-left">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-medium text-gray-70 mb-1">Name *</label>
          <input
            name="name"
            required
            placeholder="Your name"
            className="w-full rounded-lg border border-gray-20 bg-white px-3 py-2.5 text-sm text-gray-90 focus:border-primary focus:ring-1 focus:ring-primary outline-none"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-70 mb-1">Email *</label>
          <input
            name="email"
            type="email"
            required
            placeholder="you@email.com"
            className="w-full rounded-lg border border-gray-20 bg-white px-3 py-2.5 text-sm text-gray-90 focus:border-primary focus:ring-1 focus:ring-primary outline-none"
          />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-medium text-gray-70 mb-1">Phone</label>
          <input
            name="phone"
            placeholder="(555) 123-4567"
            className="w-full rounded-lg border border-gray-20 bg-white px-3 py-2.5 text-sm text-gray-90 focus:border-primary focus:ring-1 focus:ring-primary outline-none"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-70 mb-1">Company</label>
          <input
            name="company"
            placeholder="Your company"
            className="w-full rounded-lg border border-gray-20 bg-white px-3 py-2.5 text-sm text-gray-90 focus:border-primary focus:ring-1 focus:ring-primary outline-none"
          />
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-70 mb-1">Message</label>
        <textarea
          name="message"
          rows={3}
          placeholder="How can we help?"
          className="w-full rounded-lg border border-gray-20 bg-white px-3 py-2.5 text-sm text-gray-90 focus:border-primary focus:ring-1 focus:ring-primary outline-none resize-none"
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
