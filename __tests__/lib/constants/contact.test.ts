import { describe, expect, it } from "vitest";
import {
  BUSINESS_PHONE_DISPLAY,
  BUSINESS_PHONE_E164,
} from "@/lib/constants/contact";
import en from "@/lib/i18n/en";
import es from "@/lib/i18n/es";
import { websiteJsonLd, contactPageJsonLd } from "@/lib/utils/structured-data";
import { CREEDA_IDENTITY, TECHNICAL_SEO_EXPERTISE } from "@/lib/utils/ai-system-prompt";

/**
 * The phone number used to be written out in five files. Updating it meant
 * finding all five, and a missed one shipped a dead number to customers. This
 * locks every consumer to the single constant so that can't happen again.
 */
describe("business phone number", () => {
  it("is the one the business actually uses", () => {
    expect(BUSINESS_PHONE_DISPLAY).toBe("+1 908-248-2875");
    expect(BUSINESS_PHONE_E164).toBe("+19082482875");
  });

  it("is digit-for-digit identical in both forms", () => {
    expect(BUSINESS_PHONE_DISPLAY.replace(/\D/g, "")).toBe(
      BUSINESS_PHONE_E164.replace(/\D/g, ""),
    );
  });

  it("is machine-readable where machines read it", () => {
    // A `tel:` href or a schema.org value with spaces or hyphens is not a
    // phone number to a phone or a crawler.
    expect(BUSINESS_PHONE_E164).toMatch(/^\+\d{11}$/);
    // The Organization publishes through the WebSite builder's `publisher`.
    expect(websiteJsonLd().publisher.contactPoint.telephone).toBe(
      BUSINESS_PHONE_E164,
    );
    expect(contactPageJsonLd().mainEntity.contactPoint.telephone).toBe(
      BUSINESS_PHONE_E164,
    );
  });

  it("is the value the contact page renders in both locales", () => {
    expect(en.contact.phoneValue).toBe(BUSINESS_PHONE_DISPLAY);
    expect(es.contact.phoneValue).toBe(BUSINESS_PHONE_DISPLAY);
  });

  it("is what the AI is told to quote", () => {
    // The assistant quotes this number in generated copy; a stale value here
    // publishes the wrong number on pages nobody proof-reads.
    expect(CREEDA_IDENTITY).toContain(BUSINESS_PHONE_DISPLAY);
    // The schema example teaches the model the machine-readable form.
    expect(TECHNICAL_SEO_EXPERTISE).toContain(BUSINESS_PHONE_E164);
  });
});
