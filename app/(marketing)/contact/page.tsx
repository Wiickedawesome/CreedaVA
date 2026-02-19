"use client";

import { useState, type FormEvent } from "react";
import { Container, Input, Textarea, Button } from "@/components/ui";
import { useTranslation } from "@/lib/i18n";

const stepIcons = [
  <svg key="chat" className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>,
  <svg key="doc" className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>,
  <svg key="cal" className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>,
];

export default function ContactPage() {
  const { t } = useTranslation();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsSubmitting(true);
    setError("");

    const fd = new FormData(e.currentTarget);

    try {
      const res = await fetch(
        "https://us-east4-creeda-va.cloudfunctions.net/handleFormWebhook",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            formType: "contact",
            name: `${fd.get("firstName")} ${fd.get("lastName")}`.trim(),
            email: fd.get("email"),
            phone: fd.get("phone") || "",
            company: fd.get("company") || "",
            message: fd.get("message"),
            notifyEmail: "contact@creedava.com",
            source: "contact-page",
          }),
        },
      );
      if (!res.ok) throw new Error("Failed to send");
      setSubmitted(true);
    } catch {
      setError("Something went wrong. Please try again or email us directly.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <>
      {/* Hero */}
      <section className="py-20 lg:py-28 bg-linear-to-b from-gray-10 to-white">
        <Container>
          <div className="text-center max-w-3xl mx-auto">
            <h1 className="text-4xl lg:text-5xl font-bold text-gray-100 mb-6">
              {t.contact.heroTitle}
            </h1>
            <p className="text-lg text-gray-60 leading-relaxed">
              {t.contact.heroDesc}
            </p>
          </div>
        </Container>
      </section>

      {/* Contact Form & Info */}
      <section className="py-20 lg:py-28">
        <Container>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 max-w-5xl mx-auto">
            {/* Form */}
            <div>
              {submitted ? (
                <div className="bg-success/10 border border-success/20 rounded-2xl p-8 text-center">
                  <div className="w-16 h-16 mx-auto mb-4 bg-success/20 rounded-full flex items-center justify-center">
                    <svg className="w-8 h-8 text-success" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-bold text-gray-100 mb-2">
                    {t.contact.successTitle}
                  </h3>
                  <p className="text-gray-60">
                    {t.contact.successDesc}
                  </p>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <Input
                      label={t.contact.firstName}
                      name="firstName"
                      placeholder={t.contact.firstNamePlaceholder}
                      required
                    />
                    <Input
                      label={t.contact.lastName}
                      name="lastName"
                      placeholder={t.contact.lastNamePlaceholder}
                      required
                    />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <Input
                      label={t.contact.email}
                      name="email"
                      type="email"
                      placeholder={t.contact.emailPlaceholder}
                      required
                    />
                    <Input
                      label="Phone"
                      name="phone"
                      type="tel"
                      placeholder="+1 (555) 123-4567"
                    />
                  </div>
                  <Input
                    label={t.contact.company}
                    name="company"
                    placeholder={t.contact.companyPlaceholder}
                  />
                  <Textarea
                    label={t.contact.message}
                    name="message"
                    placeholder={t.contact.messagePlaceholder}
                    required
                  />
                  <Button
                    type="submit"
                    size="lg"
                    fullWidth
                    isLoading={isSubmitting}
                  >
                    {t.contact.sendMessage}
                  </Button>
                  {error && (
                    <p className="text-sm text-red-500 text-center">{error}</p>
                  )}
                </form>
              )}
            </div>

            {/* Contact Info */}
            <div className="space-y-8">
              <div>
                <h2 className="text-2xl font-bold text-gray-100 mb-6">
                  {t.contact.contactInfoTitle}
                </h2>
                <p className="text-gray-60 leading-relaxed">
                  {t.contact.contactInfoDesc}
                </p>
              </div>

              <div className="space-y-6">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center shrink-0">
                    <svg className="w-5 h-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-100">{t.contact.emailLabel}</h4>
                    <a
                      href={`mailto:${t.contact.emailValue}`}
                      className="text-primary hover:underline"
                    >
                      {t.contact.emailValue}
                    </a>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center shrink-0">
                    <svg className="w-5 h-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                    </svg>
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-100">{t.contact.phoneLabel}</h4>
                    <a
                      href={`tel:${t.contact.phoneValue}`}
                      className="text-primary hover:underline"
                    >
                      {t.contact.phoneValue}
                    </a>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center shrink-0">
                    <svg className="w-5 h-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-100">{t.contact.hoursLabel}</h4>
                    <p className="text-gray-60 text-sm">{t.contact.hoursValue}</p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center shrink-0">
                    <svg className="w-5 h-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z" />
                    </svg>
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-100">{t.contact.responseLabel}</h4>
                    <p className="text-gray-60 text-sm">{t.contact.responseValue}</p>
                  </div>
                </div>
              </div>

              {/* Quick Booking CTA */}
              <div className="bg-primary/5 border border-primary/10 rounded-2xl p-6">
                <h4 className="font-bold text-gray-100 mb-2">
                  {t.contact.bookTitle}
                </h4>
                <p className="text-sm text-gray-60 mb-4">
                  {t.contact.bookDesc}
                </p>
                <a
                  href="/join"
                  className="inline-flex items-center text-primary font-medium text-sm hover:underline"
                >
                  {t.contact.bookLink}
                  <svg className="ml-1 w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </a>
              </div>
            </div>
          </div>
        </Container>
      </section>

      {/* How We Work Together */}
      <section className="py-20 lg:py-28 bg-gray-10">
        <Container>
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-100 mb-4">
              {t.contact.howWeWorkTitle}
            </h2>
            <p className="text-lg text-gray-60">
              {t.contact.howWeWorkDesc}
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-10 max-w-4xl mx-auto">
            {t.contact.howWeWorkSteps.map((step, i) => (
              <div key={i} className="text-center">
                <div className="w-16 h-16 mx-auto mb-5 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
                  {stepIcons[i]}
                </div>
                <div className="text-sm font-bold text-primary mb-2">
                  {String(i + 1).padStart(2, "0")}
                </div>
                <h3 className="text-xl font-bold text-gray-100 mb-3">
                  {step.title}
                </h3>
                <p className="text-gray-60 leading-relaxed text-sm">
                  {step.desc}
                </p>
              </div>
            ))}
          </div>
        </Container>
      </section>
    </>
  );
}
