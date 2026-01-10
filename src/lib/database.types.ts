// Cosmos-backed entity shapes used by the admin API and public functions.
// Partition key for all containers is the `type` field.

export type PartitionKey =
  | 'leads'
  | 'contacts'
  | 'tasks'
  | 'projects'
  | 'emails'
  | 'seo'
  | 'keywords'
  | 'social'
  | 'blog'
  | 'campaigns'
  | 'landingPages'
  | 'customerJourneys'
  | 'reports'
  | 'analytics';

export interface BaseItem {
  id: string;
  type: PartitionKey | string;
  createdAt?: string;
  updatedAt?: string;
  userId?: string;
  [key: string]: unknown;
}

export interface Lead extends BaseItem {
  type: 'leads';
  name: string;
  email: string;
  status?: string;
  company?: string;
  phone?: string;
}

export interface Contact extends BaseItem {
  type: 'contacts';
  firstName: string;
  lastName: string;
  email: string;
  company?: string;
  phone?: string;
}

export interface Task extends BaseItem {
  type: 'tasks';
  title: string;
  status?: string;
  priority?: string;
  dueDate?: string;
}

export interface Project extends BaseItem {
  type: 'projects';
  name: string;
  status?: string;
  startDate?: string;
  endDate?: string;
}

export interface Email extends BaseItem {
  type: 'emails';
  subject: string;
  to: string;
  status?: string;
}

export interface SeoContent extends BaseItem {
  type: 'seo';
  title: string;
  description?: string;
  keywords?: string[];
}

export interface Keyword extends BaseItem {
  type: 'keywords';
  term: string;
  volume?: number;
}

export interface SocialPost extends BaseItem {
  type: 'social';
  platform: string;
  content: string;
  scheduledAt?: string;
}

export interface BlogPost extends BaseItem {
  type: 'blog';
  title: string;
  body: string;
  publishedAt?: string;
}

export interface Campaign extends BaseItem {
  type: 'campaigns';
  name: string;
  channel?: string;
  budget?: number;
}

export interface LandingPage extends BaseItem {
  type: 'landingPages';
  title: string;
  url: string;
}

export interface CustomerJourney extends BaseItem {
  type: 'customerJourneys';
  name: string;
  stage?: string;
}

export interface Report extends BaseItem {
  type: 'reports';
  name: string;
  period?: string;
}

export interface AnalyticsEvent extends BaseItem {
  type: 'event' | 'analytics';
  eventType: string;
  eventData?: unknown;
  page?: string;
  userAgent?: string;
  referrer?: string;
  timestamp: string;
}

export interface ContactFormSubmission extends BaseItem {
  type: 'contact-form';
  name: string;
  email: string;
  message: string;
  company?: string;
  phone?: string;
  service?: string;
  submittedAt: string;
  source: string;
}

export type Entity =
  | Lead
  | Contact
  | Task
  | Project
  | Email
  | SeoContent
  | Keyword
  | SocialPost
  | BlogPost
  | Campaign
  | LandingPage
  | CustomerJourney
  | Report
  | AnalyticsEvent
  | ContactFormSubmission;
