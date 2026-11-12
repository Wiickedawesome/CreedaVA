import { describe, it, expect } from "vitest";
import {
  BUSINESS_ADDRESSES,
  DEFAULT_SENDER_ADDRESS,
  SENDABLE_ADDRESS_OPTIONS,
  isReceivedBy,
  mailboxDisplayName,
  senderForReply,
} from "@/lib/constants/business-emails";
import {
  BUSINESS_ADDRESSES as SERVER_ADDRESSES,
  resolveSenderAddress,
  senderDisplayName,
} from "../../../functions/src/business-emails";

const contact = BUSINESS_ADDRESSES.find((entry) => entry.label === "Contact")!;
const marketing = BUSINESS_ADDRESSES.find((entry) => entry.label === "CreedaVA Marketing")!;

describe("business mailboxes", () => {
  it("lists each mailbox once, in the owner's order", () => {
    expect(BUSINESS_ADDRESSES.map((entry) => entry.label)).toEqual([
      "Admins",
      "Billing",
      "Contact",
      "Legal",
      "CreedaVA Marketing",
      "Privacy",
      "Sales",
      "Feedback",
    ]);
  });

  it("gives CreedaVA Marketing the join@ mailbox", () => {
    expect(marketing.address).toBe("join@creedava.com");
    expect(SENDABLE_ADDRESS_OPTIONS.map((option) => option.value)).toContain("join@creedava.com");
  });

  it("has no duplicate addresses", () => {
    const addresses = BUSINESS_ADDRESSES.map((entry) => entry.address);
    expect(new Set(addresses).size).toBe(addresses.length);
  });

  it("defaults to contact@ and offers every group as a sender", () => {
    expect(DEFAULT_SENDER_ADDRESS).toBe("contact@creedava.com");
    expect(SENDABLE_ADDRESS_OPTIONS).toHaveLength(BUSINESS_ADDRESSES.length);
  });

  it("matches on the mailbox address, case-insensitively", () => {
    expect(isReceivedBy({ receivedBy: "Contact@CreedaVA.com" }, contact)).toBe(true);
    expect(isReceivedBy({ receivedBy: "sales@creedava.com" }, contact)).toBe(false);
  });

  it("matches either name for the shared marketing mailbox", () => {
    expect(isReceivedBy({ receivedBy: "join@creedava.com" }, marketing)).toBe(true);
    expect(isReceivedBy({ receivedByLabel: "Join" }, marketing)).toBe(true);
    expect(isReceivedBy({ receivedByLabel: "CreedaVA Marketing" }, marketing)).toBe(true);
  });

  it("never matches empty values against each other", () => {
    expect(isReceivedBy({}, contact)).toBe(false);
    expect(isReceivedBy({ receivedBy: "" }, marketing)).toBe(false);
  });

  it("labels the To column with the business name, else the local part", () => {
    expect(mailboxDisplayName({ receivedBy: "contact@creedava.com" })).toBe("Contact");
    expect(mailboxDisplayName({ receivedBy: "someone@elsewhere.com" })).toBe("someone");
    expect(mailboxDisplayName({})).toBe("—");
  });

  it("replies from the mailbox that received the message", () => {
    expect(senderForReply({ receivedBy: "sales@creedava.com" })).toBe("sales@creedava.com");
    expect(senderForReply({ receivedByLabel: "Join" })).toBe("join@creedava.com");
  });

  it("falls back to the default sender for an unknown mailbox", () => {
    expect(senderForReply({})).toBe(DEFAULT_SENDER_ADDRESS);
    expect(senderForReply({ receivedBy: "stranger@elsewhere.com" })).toBe(DEFAULT_SENDER_ADDRESS);
  });
});

describe("server allow-list", () => {
  it("is identical to the app list — a group added on one side must be added on the other", () => {
    const appAddresses = BUSINESS_ADDRESSES.map((entry) => entry.address).sort();
    const serverAddresses = SERVER_ADDRESSES.map((entry) => entry.address).sort();
    expect(serverAddresses).toEqual(appAddresses);
  });

  it("accepts any business group as the sender", () => {
    for (const entry of BUSINESS_ADDRESSES) {
      expect(resolveSenderAddress(entry.address, undefined)).toBe(entry.address);
    }
  });

  it("still accepts aliases and the account from Integrations → Email", () => {
    const config = { user: "john@creedava.com", aliases: "info@creedava.com" };
    expect(resolveSenderAddress("info@creedava.com", config)).toBe("info@creedava.com");
    expect(resolveSenderAddress("john@creedava.com", config)).toBe("john@creedava.com");
  });

  it("refuses an address the account does not own", () => {
    expect(resolveSenderAddress("ceo@example.com", { user: "john@creedava.com" })).toBe(
      "john@creedava.com",
    );
    expect(resolveSenderAddress("ceo@example.com", undefined)).toBe(DEFAULT_SENDER_ADDRESS);
  });

  it("normalises case and whitespace on the requested sender", () => {
    expect(resolveSenderAddress("  SALES@creedava.com  ", undefined)).toBe("sales@creedava.com");
  });

  it("uses the business name as the display name, else CreedaVA", () => {
    expect(senderDisplayName("join@creedava.com")).toBe("CreedaVA Marketing");
    expect(senderDisplayName("john@creedava.com")).toBe("CreedaVA");
  });
});
