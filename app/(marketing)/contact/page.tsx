"use client";

import { useState, type FormEvent } from "react";
import type { Metadata } from "next";
import { Container, Input, Textarea, Button } from "@/components/ui";

export default function ContactPage() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsSubmitting(true);

    // TODO: Wire up to Firebase / form handler
    await new Promise((resolve) => setTimeout(resolve, 1000));

    setSubmitted(true);
    setIsSubmitting(false);
  }

  return (
    <>
      {/* Hero */}
      <section className="py-20 lg:py-28 bg-gradient-to-b from-gray-10 to-white">
        <Container>
          <div className="text-center max-w-3xl mx-auto">
            <h1 className="text-4xl lg:text-5xl font-bold text-gray-100 mb-6">
              Get in Touch
            </h1>
            <p className="text-lg text-gray-60 leading-relaxed">
              Have a question or ready to get started? We&apos;d love to hear
              from you. Fill out the form below and we&apos;ll get back to you
              within 24 hours.
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
                    Message Sent!
                  </h3>
                  <p className="text-gray-60">
                    Thank you for reaching out. We&apos;ll get back to you within
                    24 hours.
                  </p>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <Input
                      label="First Name"
                      name="firstName"
                      placeholder="John"
                      required
                    />
                    <Input
                      label="Last Name"
                      name="lastName"
                      placeholder="Doe"
                      required
                    />
                  </div>
                  <Input
                    label="Email"
                    name="email"
                    type="email"
                    placeholder="john@company.com"
                    required
                  />
                  <Input
                    label="Company"
                    name="company"
                    placeholder="Company Name"
                  />
                  <Textarea
                    label="Message"
                    name="message"
                    placeholder="Tell us about your needs..."
                    required
                  />
                  <Button
                    type="submit"
                    size="lg"
                    fullWidth
                    isLoading={isSubmitting}
                  >
                    Send Message
                  </Button>
                </form>
              )}
            </div>

            {/* Contact Info */}
            <div className="space-y-8">
              <div>
                <h2 className="text-2xl font-bold text-gray-100 mb-6">
                  Contact Information
                </h2>
                <p className="text-gray-60 leading-relaxed">
                  Prefer to reach us directly? Contact us through any of the
                  channels below. Our team is available Monday through Friday,
                  9am to 6pm EST.
                </p>
              </div>

              <div className="space-y-6">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-primary/10 rounded-[var(--radius-lg)] flex items-center justify-center flex-shrink-0">
                    <svg className="w-5 h-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-100">Email</h4>
                    <a
                      href="mailto:hello@creedava.com"
                      className="text-primary hover:underline"
                    >
                      hello@creedava.com
                    </a>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-primary/10 rounded-[var(--radius-lg)] flex items-center justify-center flex-shrink-0">
                    <svg className="w-5 h-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-100">Business Hours</h4>
                    <p className="text-gray-60 text-sm">
                      Monday - Friday, 9:00 AM - 6:00 PM EST
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-primary/10 rounded-[var(--radius-lg)] flex items-center justify-center flex-shrink-0">
                    <svg className="w-5 h-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z" />
                    </svg>
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-100">Response Time</h4>
                    <p className="text-gray-60 text-sm">
                      We respond to all inquiries within 24 hours
                    </p>
                  </div>
                </div>
              </div>

              {/* Quick Booking CTA */}
              <div className="bg-primary/5 border border-primary/10 rounded-2xl p-6">
                <h4 className="font-bold text-gray-100 mb-2">
                  Want to schedule a call?
                </h4>
                <p className="text-sm text-gray-60 mb-4">
                  Book a free 30-minute consultation to discuss your needs.
                </p>
                <a
                  href="#"
                  className="inline-flex items-center text-primary font-medium text-sm hover:underline"
                >
                  Book a Consultation
                  <svg className="ml-1 w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </a>
              </div>
            </div>
          </div>
        </Container>
      </section>
    </>
  );
}
