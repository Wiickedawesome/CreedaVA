import { describe, it, expect } from "vitest";
import {
  BUSINESS_ADDRESSES,
  isReceivedBy,
} from "@/lib/constants/business-emails";

/**
 * The Emails inbox shows business mail only, so these two rules decide what an
 * operator can see at all. Pinned because a regression here silently hides real
 * customer mail — the worst possible failure for an inbox.
 */

const businessMail = (to: string) => ({
  receivedBy: to,
  receivedByLabel: "",
});

describe("inbox visibility", () => {
  it("shows mail addressed to any business group", () => {
    for (const entry of BUSINESS_ADDRESSES) {
      const message = businessMail(entry.address);
      expect(isReceivedBy(message, entry)).toBe(true);
    }
  });

  it("hides mail addressed to the personal sign-in mailbox", () => {
    const message = businessMail("john@creedava.com");
    const matched = BUSINESS_ADDRESSES.filter((entry) => isReceivedBy(message, entry));
    expect(matched).toEqual([]);
  });

  it("hides third-party mail that reached the account directly", () => {
    const message = businessMail("someone@elsewhere.com");
    const matched = BUSINESS_ADDRESSES.filter((entry) => isReceivedBy(message, entry));
    expect(matched).toEqual([]);
  });

  it("still shows mail when Google put the group label in the To header", () => {
    const message = { receivedBy: "", receivedByLabel: "CreedaVA Marketing" };
    expect(isReceivedBy(message, BUSINESS_ADDRESSES.find((e) => e.label === "CreedaVA Marketing")!)).toBe(true);
  });
});
