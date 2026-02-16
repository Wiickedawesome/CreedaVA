import type { Timestamp } from "firebase/firestore";

// ─── Shared ──────────────────────────────────────────
export type CRMStatus = "new" | "contacted" | "qualified" | "proposal" | "won" | "lost";
export type Priority = "low" | "medium" | "high" | "urgent";
export type TaskStatus = "todo" | "in-progress" | "done" | "blocked";
export type ProjectStatus = "planning" | "active" | "on-hold" | "completed" | "cancelled";
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

// ─── Tasks ───────────────────────────────────────────
export interface TaskReminder {
  date: string;            // ISO date
  time?: string;           // HH:mm
  sent?: boolean;
  emailId?: string;        // id of sent email in emails collection
}

export interface Task extends FirestoreDoc {
  title: string;
  description?: string;
  status: TaskStatus;
  priority: Priority;
  dueDate?: string;        // ISO date
  assignedTo?: string;     // user uid
  projectId?: string;
  projectName?: string;
  phaseId?: string;
  phaseName?: string;
  goalId?: string;
  goalName?: string;
  reminder?: TaskReminder;
  tags?: string[];
}

export type TaskFormData = Omit<Task, keyof FirestoreDoc>;

// ─── Projects ────────────────────────────────────────
export interface ProjectHistoryEntry {
  date: string;            // ISO datetime
  action: string;          // e.g. "Phase completed", "Note added"
  detail?: string;
  user?: string;
}

export type GoalStatus = "planning" | "active" | "on-hold" | "completed" | "cancelled";

export interface ProjectGoal {
  id: string;
  // SMART: Specific
  title: string;
  description?: string;
  // SMART: Measurable
  measurable?: string;     // how will success be measured?
  // SMART: Achievable
  achievable?: string;     // what resources/steps are needed?
  // SMART: Relevant
  relevant?: string;       // why does this matter to the project/business?
  // SMART: Time-bound
  targetDate?: string;     // ISO date deadline
  status: GoalStatus;
  priority?: Priority;
  value?: number;          // dollar value associated with goal
  notes?: string;
}

export interface Project extends FirestoreDoc {
  name: string;
  description?: string;
  status: ProjectStatus;
  clientId?: string;       // customer id
  clientName?: string;
  startDate?: string;
  endDate?: string;
  budget?: number;
  tags?: string[];
  goals?: ProjectGoal[];
  history?: ProjectHistoryEntry[];
  notes?: string;
  driveFolderId?: string;  // Google Drive folder for project files
}

export type ProjectFormData = Omit<Project, keyof FirestoreDoc>;

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
export const TASK_STATUSES: TaskStatus[] = ["todo", "in-progress", "done", "blocked"];
export const PRIORITIES: Priority[] = ["low", "medium", "high", "urgent"];
export const PROJECT_STATUSES: ProjectStatus[] = ["planning", "active", "on-hold", "completed", "cancelled"];
export const BOOKING_STATUSES: BookingStatus[] = ["pending", "confirmed", "completed", "cancelled"];
export const CUSTOMER_PLANS = ["Virtual Assistant", "Executive Assistant", "Business Support"] as const;
export const BILLING_CYCLES: BillingCycle[] = ["monthly", "quarterly", "annual"];
export const REFERRAL_SOURCES = ["Website", "Referral", "Social Media", "Google", "LinkedIn", "Cold Outreach", "Partner", "Other"] as const;
export const PHASE_STATUSES = ["not-started", "in-progress", "completed"] as const;
export const GOAL_STATUSES: GoalStatus[] = ["planning", "active", "on-hold", "completed", "cancelled"];
