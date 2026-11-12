import type { Timestamp } from "firebase/firestore";

// ─── Shared ──────────────────────────────────────────
export type CRMStatus = "new" | "contacted" | "qualified" | "proposal" | "won" | "lost";
export type Priority = "low" | "medium" | "high" | "urgent";
export type BookingStatus = "pending" | "confirmed" | "completed" | "cancelled";

export interface FirestoreDoc {
  id: string;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}

// ─── Leads ───────────────────────────────────────────
export interface Lead extends FirestoreDoc {
  name: string;
  email: string;
  phone?: string;
  company?: string;
  source: string;          // e.g. "website", "referral", "social", "ad"
  status: CRMStatus;
  value?: number;          // estimated deal value
  notes?: string;
  assignedTo?: string;     // user uid
}

export type LeadFormData = Omit<Lead, keyof FirestoreDoc>;

// ─── Contacts ────────────────────────────────────────
export interface Contact extends FirestoreDoc {
  name: string;
  email: string;
  phone?: string;
  company?: string;
  role?: string;           // job title
  tags?: string[];
  notes?: string;
}

export type ContactFormData = Omit<Contact, keyof FirestoreDoc>;

// ─── Customers ───────────────────────────────────────
export type BillingCycle = "monthly" | "quarterly" | "annual";

export interface Customer extends FirestoreDoc {
  name: string;
  email: string;
  phone?: string;
  company?: string;
  plan?: string;           // service plan
  monthlyValue?: number;
  billingCycle?: BillingCycle;
  hoursPerMonth?: number;  // allocated service hours
  startDate?: string;      // ISO date
  contractEndDate?: string; // ISO date — renewal tracking
  lifetimeValue?: number;  // total revenue collected to date
  lastContactDate?: string; // ISO date — last engagement
  satisfaction?: number;   // 1–5 rating
  referralSource?: string; // who referred them
  assignedTo?: string;     // team member handling this client
  status: "active" | "inactive" | "churned";
  notes?: string;
}

export type CustomerFormData = Omit<Customer, keyof FirestoreDoc>;

// ─── Bookings ────────────────────────────────────────
export interface Booking extends FirestoreDoc {
  name: string;
  email: string;
  phone?: string;
  service: string;
  date: string;            // ISO date
  time?: string;
  status: BookingStatus;
  notes?: string;
  source?: string;         // "website", "phone", etc.
  syncedToCalendar?: boolean;
  googleCalendarLink?: string;
}

export type BookingFormData = Omit<Booking, keyof FirestoreDoc>;

// ─── Status → Badge variant mapping ──────────────────
export const statusVariant: Record<string, "default" | "success" | "warning" | "error" | "info"> = {
  // CRM / Lead
  new: "info",
  contacted: "default",
  qualified: "warning",
  proposal: "warning",
  won: "success",
  lost: "error",
  // Task
  todo: "default",
  "in-progress": "info",
  done: "success",
  blocked: "error",
  // Project
  planning: "default",
  active: "info",
  "on-hold": "warning",
  completed: "success",
  cancelled: "error",
  // Customer
  inactive: "warning",
  churned: "error",
  // Booking
  pending: "warning",
  confirmed: "info",
};

// ─── Option lists for selects ────────────────────────
export const LEAD_SOURCES = ["website", "referral", "social", "ad", "email", "cold-call", "other"] as const;
export const CRM_STATUSES: CRMStatus[] = ["new", "contacted", "qualified", "proposal", "won", "lost"];
export const PRIORITIES: Priority[] = ["low", "medium", "high", "urgent"];
export const BOOKING_STATUSES: BookingStatus[] = ["pending", "confirmed", "completed", "cancelled"];
export const CUSTOMER_PLANS = ["Virtual Assistant", "Executive Assistant", "Business Support"] as const;
export const BILLING_CYCLES: BillingCycle[] = ["monthly", "quarterly", "annual"];
export const REFERRAL_SOURCES = ["Website", "Referral", "Social Media", "Google", "LinkedIn", "Cold Outreach", "Partner", "Other"] as const;
export const PHASE_STATUSES = ["not-started", "in-progress", "completed"] as const;
