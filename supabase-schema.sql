-- CreedaVA CRM Database Schema 
-- Run this in your Supabase SQL Editor for comprehensive data tracking

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- CORE USER MANAGEMENT
-- ============================================================================

-- Users table (extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS public.users (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  role TEXT CHECK (role IN ('admin', 'manager', 'sales', 'support', 'user')) DEFAULT 'user',
  avatar_url TEXT,
  phone TEXT,
  department TEXT,
  timezone TEXT DEFAULT 'UTC',
  language TEXT DEFAULT 'en',
  -- Activity tracking
  last_login TIMESTAMPTZ,
  login_count INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  -- Performance metrics
  deals_closed INTEGER DEFAULT 0,
  total_revenue DECIMAL(12,2) DEFAULT 0
);

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own data" ON public.users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own data" ON public.users
  FOR UPDATE USING (auth.uid() = id);

-- ============================================================================
-- LEADS & PIPELINE MANAGEMENT
-- ============================================================================

-- Leads table (comprehensive tracking)
CREATE TABLE IF NOT EXISTS public.leads (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Basic Information
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  mobile TEXT,
  company TEXT,
  website TEXT,
  industry TEXT,
  company_size TEXT CHECK (company_size IN ('1-10', '11-50', '51-200', '201-500', '501-1000', '1000+')),
  
  -- Lead Status & Qualification
  status TEXT CHECK (status IN ('new', 'contacted', 'qualified', 'proposal', 'negotiation', 'won', 'lost', 'on_hold')) DEFAULT 'new',
  lead_score INTEGER DEFAULT 0 CHECK (lead_score BETWEEN 0 AND 100),
  temperature TEXT CHECK (temperature IN ('cold', 'warm', 'hot')) DEFAULT 'cold',
  
  -- Source & Attribution
  source TEXT CHECK (source IN ('website', 'referral', 'social_media', 'cold_call', 'email_campaign', 'event', 'partner', 'advertising', 'other')) DEFAULT 'website',
  source_details TEXT, -- E.g., "LinkedIn ad campaign Q4", "John Doe referral"
  campaign_id TEXT,
  utm_source TEXT,
  utm_medium TEXT,
  utm_campaign TEXT,
  
  -- Financial
  estimated_value DECIMAL(12,2),
  actual_value DECIMAL(12,2),
  currency TEXT DEFAULT 'USD',
  expected_close_date DATE,
  
  -- Assignment & Ownership
  assigned_to UUID REFERENCES public.users(id),
  created_by UUID REFERENCES public.users(id),
  
  -- Follow-up & Engagement
  next_follow_up TIMESTAMPTZ,
  last_contacted TIMESTAMPTZ,
  contact_count INTEGER DEFAULT 0,
  email_opens INTEGER DEFAULT 0,
  email_clicks INTEGER DEFAULT 0,
  
  -- Location
  country TEXT,
  state TEXT,
  city TEXT,
  zip_code TEXT,
  address TEXT,
  
  -- Additional Data
  notes TEXT,
  tags TEXT[] DEFAULT '{}',
  custom_fields JSONB DEFAULT '{}'::jsonb,
  
  -- Conversion tracking
  converted_to_contact BOOLEAN DEFAULT false,
  conversion_date TIMESTAMPTZ,
  days_to_convert INTEGER,
  
  -- Loss reason (if status = 'lost')
  loss_reason TEXT,
  competitor TEXT
);

ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage leads" ON public.leads FOR ALL USING (true);

-- Lead Activity Log
CREATE TABLE IF NOT EXISTS public.lead_activities (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  lead_id UUID REFERENCES public.leads(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES public.users(id),
  activity_type TEXT CHECK (activity_type IN ('call', 'email', 'meeting', 'note', 'status_change', 'task_completed', 'proposal_sent', 'document_sent')) NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  duration_minutes INTEGER,
  metadata JSONB DEFAULT '{}'::jsonb
);

ALTER TABLE public.lead_activities ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage lead activities" ON public.lead_activities FOR ALL USING (true);

-- ============================================================================
-- CONTACTS & RELATIONSHIPS
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.contacts (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Personal Information
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  mobile TEXT,
  birthday DATE,
  
  -- Professional Information
  company TEXT,
  position TEXT,
  department TEXT,
  seniority TEXT CHECK (seniority IN ('c_level', 'vp', 'director', 'manager', 'individual_contributor', 'other')),
  linkedin_url TEXT,
  
  -- Location
  country TEXT,
  state TEXT,
  city TEXT,
  zip_code TEXT,
  address TEXT,
  timezone TEXT,
  
  -- Relationship
  lead_id UUID REFERENCES public.leads(id) ON DELETE SET NULL,
  account_manager UUID REFERENCES public.users(id),
  relationship_strength TEXT CHECK (relationship_strength IN ('weak', 'moderate', 'strong', 'champion')) DEFAULT 'weak',
  
  -- Communication Preferences
  preferred_contact_method TEXT CHECK (preferred_contact_method IN ('email', 'phone', 'sms', 'linkedin')),
  email_opt_in BOOLEAN DEFAULT true,
  sms_opt_in BOOLEAN DEFAULT false,
  
  -- Engagement
  last_contacted TIMESTAMPTZ,
  last_meeting TIMESTAMPTZ,
  total_meetings INTEGER DEFAULT 0,
  email_engagement_score INTEGER DEFAULT 0,
  
  -- Additional
  tags TEXT[] DEFAULT '{}',
  notes TEXT,
  custom_fields JSONB DEFAULT '{}'::jsonb,
  is_active BOOLEAN DEFAULT true
);

ALTER TABLE public.contacts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage contacts" ON public.contacts FOR ALL USING (true);

-- Contact Activity Log
CREATE TABLE IF NOT EXISTS public.contact_activities (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  contact_id UUID REFERENCES public.contacts(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES public.users(id),
  activity_type TEXT CHECK (activity_type IN ('call', 'email', 'meeting', 'note', 'linkedin_message', 'purchase', 'support_ticket')) NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  sentiment TEXT CHECK (sentiment IN ('positive', 'neutral', 'negative')),
  metadata JSONB DEFAULT '{}'::jsonb
);

ALTER TABLE public.contact_activities ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage contact activities" ON public.contact_activities FOR ALL USING (true);

-- ============================================================================
-- PROJECTS & DELIVERABLES
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.projects (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  name TEXT NOT NULL,
  description TEXT,
  
  -- Status & Timeline
  status TEXT CHECK (status IN ('planning', 'active', 'on_hold', 'completed', 'cancelled', 'archived')) DEFAULT 'planning',
  start_date DATE,
  end_date DATE,
  actual_end_date DATE,
  
  -- Financial
  budget DECIMAL(12,2),
  actual_cost DECIMAL(12,2),
  revenue DECIMAL(12,2),
  currency TEXT DEFAULT 'USD',
  
  -- Assignment
  project_manager UUID REFERENCES public.users(id),
  client_id UUID REFERENCES public.contacts(id) ON DELETE SET NULL,
  
  -- Progress tracking
  progress_percentage INTEGER DEFAULT 0 CHECK (progress_percentage BETWEEN 0 AND 100),
  completed_tasks INTEGER DEFAULT 0,
  total_tasks INTEGER DEFAULT 0,
  
  -- Additional
  priority TEXT CHECK (priority IN ('low', 'medium', 'high', 'critical')) DEFAULT 'medium',
  tags TEXT[] DEFAULT '{}',
  custom_fields JSONB DEFAULT '{}'::jsonb,
  health_status TEXT CHECK (health_status IN ('on_track', 'at_risk', 'off_track')) DEFAULT 'on_track'
);

ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage projects" ON public.projects FOR ALL USING (true);

-- ============================================================================
-- TASKS & PRODUCTIVITY
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.tasks (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  title TEXT NOT NULL,
  description TEXT,
  
  -- Status & Priority
  status TEXT CHECK (status IN ('todo', 'in_progress', 'blocked', 'review', 'completed', 'cancelled')) DEFAULT 'todo',
  priority TEXT CHECK (priority IN ('low', 'medium', 'high', 'urgent')) DEFAULT 'medium',
  
  -- Timing
  due_date TIMESTAMPTZ,
  start_date TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  estimated_hours DECIMAL(5,2),
  actual_hours DECIMAL(5,2),
  
  -- Assignment
  assigned_to UUID REFERENCES public.users(id),
  created_by UUID REFERENCES public.users(id),
  
  -- Relationships
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
  lead_id UUID REFERENCES public.leads(id) ON DELETE CASCADE,
  contact_id UUID REFERENCES public.contacts(id) ON DELETE CASCADE,
  parent_task_id UUID REFERENCES public.tasks(id) ON DELETE CASCADE,
  
  -- Additional
  tags TEXT[] DEFAULT '{}',
  attachments JSONB DEFAULT '[]'::jsonb,
  checklist JSONB DEFAULT '[]'::jsonb,
  is_recurring BOOLEAN DEFAULT false,
  recurrence_pattern TEXT,
  reminder_date TIMESTAMPTZ
);

ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage tasks" ON public.tasks FOR ALL USING (true);

-- Project Milestones
CREATE TABLE IF NOT EXISTS public.project_milestones (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  due_date DATE,
  completed_date DATE,
  is_completed BOOLEAN DEFAULT false,
  sort_order INTEGER DEFAULT 0
);

ALTER TABLE public.project_milestones ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage milestones" ON public.project_milestones FOR ALL USING (true);

-- ============================================================================
-- EMAIL CAMPAIGNS & TRACKING
-- ============================================================================

-- Email Templates (must be created first)
CREATE TABLE IF NOT EXISTS public.email_templates (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  name TEXT NOT NULL,
  subject TEXT NOT NULL,
  body TEXT NOT NULL,
  category TEXT,
  is_active BOOLEAN DEFAULT true,
  usage_count INTEGER DEFAULT 0,
  created_by UUID REFERENCES public.users(id)
);

ALTER TABLE public.email_templates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage templates" ON public.email_templates FOR ALL USING (true);

-- Email Campaigns
CREATE TABLE IF NOT EXISTS public.email_campaigns (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  name TEXT NOT NULL,
  description TEXT,
  status TEXT CHECK (status IN ('draft', 'scheduled', 'sending', 'sent', 'paused', 'completed')) DEFAULT 'draft',
  
  -- Schedule
  send_date TIMESTAMPTZ,
  completed_date TIMESTAMPTZ,
  
  -- Performance
  total_sent INTEGER DEFAULT 0,
  total_delivered INTEGER DEFAULT 0,
  total_opened INTEGER DEFAULT 0,
  total_clicked INTEGER DEFAULT 0,
  total_bounced INTEGER DEFAULT 0,
  open_rate DECIMAL(5,2),
  click_rate DECIMAL(5,2),
  
  created_by UUID REFERENCES public.users(id)
);

ALTER TABLE public.email_campaigns ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage campaigns" ON public.email_campaigns FOR ALL USING (true);

-- Emails table (references templates and campaigns)
CREATE TABLE IF NOT EXISTS public.emails (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Content
  subject TEXT NOT NULL,
  body TEXT NOT NULL,
  plain_text_body TEXT,
  
  -- Sender & Recipient
  from_email TEXT NOT NULL,
  from_name TEXT,
  to_email TEXT NOT NULL,
  to_name TEXT,
  cc TEXT[] DEFAULT '{}',
  bcc TEXT[] DEFAULT '{}',
  reply_to TEXT,
  
  -- Status
  status TEXT CHECK (status IN ('draft', 'scheduled', 'sent', 'delivered', 'opened', 'clicked', 'replied', 'bounced', 'failed')) DEFAULT 'draft',
  
  -- Timing
  scheduled_at TIMESTAMPTZ,
  sent_at TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ,
  opened_at TIMESTAMPTZ,
  clicked_at TIMESTAMPTZ,
  
  -- Tracking
  opens_count INTEGER DEFAULT 0,
  clicks_count INTEGER DEFAULT 0,
  unique_clicks INTEGER DEFAULT 0,
  click_rate DECIMAL(5,2),
  
  -- Relationships
  lead_id UUID REFERENCES public.leads(id) ON DELETE SET NULL,
  contact_id UUID REFERENCES public.contacts(id) ON DELETE SET NULL,
  template_id UUID REFERENCES public.email_templates(id) ON DELETE SET NULL,
  campaign_id UUID REFERENCES public.email_campaigns(id) ON DELETE SET NULL,
  user_id UUID REFERENCES public.users(id),
  
  -- Additional
  attachments JSONB DEFAULT '[]'::jsonb,
  metadata JSONB DEFAULT '{}'::jsonb,
  thread_id TEXT
);

ALTER TABLE public.emails ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage emails" ON public.emails FOR ALL USING (true);

-- ============================================================================
-- SEO & CONTENT MANAGEMENT
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.seo_pages (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Page Identification
  page_path TEXT UNIQUE NOT NULL,
  page_title TEXT NOT NULL,
  
  -- Meta Tags
  meta_title TEXT NOT NULL,
  meta_description TEXT NOT NULL,
  meta_keywords TEXT[] DEFAULT '{}',
  
  -- Open Graph
  og_title TEXT,
  og_description TEXT,
  og_image TEXT,
  og_type TEXT DEFAULT 'website',
  
  -- Twitter Card
  twitter_card TEXT DEFAULT 'summary_large_image',
  twitter_title TEXT,
  twitter_description TEXT,
  twitter_image TEXT,
  
  -- Technical SEO
  canonical_url TEXT,
  robots TEXT DEFAULT 'index, follow',
  structured_data JSONB DEFAULT '{}'::jsonb,
  hreflang JSONB DEFAULT '{}'::jsonb,
  
  -- Performance
  page_views INTEGER DEFAULT 0,
  avg_time_on_page INTEGER DEFAULT 0,
  bounce_rate DECIMAL(5,2),
  
  -- Status
  is_published BOOLEAN DEFAULT true,
  last_published TIMESTAMPTZ,
  
  -- Tracking
  last_indexed TIMESTAMPTZ,
  index_status TEXT CHECK (index_status IN ('indexed', 'not_indexed', 'pending', 'blocked'))
);

ALTER TABLE public.seo_pages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage SEO pages" ON public.seo_pages FOR ALL USING (true);

-- ============================================================================
-- KEYWORD RESEARCH & RANKING
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.keyword_tracking (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Keyword Info
  keyword TEXT NOT NULL,
  target_url TEXT NOT NULL,
  
  -- Ranking Data
  current_position INTEGER,
  previous_position INTEGER,
  best_position INTEGER,
  position_change INTEGER,
  
  -- Search Data
  search_volume INTEGER,
  difficulty INTEGER CHECK (difficulty BETWEEN 0 AND 100),
  cpc DECIMAL(8,2),
  competition TEXT CHECK (competition IN ('low', 'medium', 'high')),
  
  -- Performance
  impressions INTEGER DEFAULT 0,
  clicks INTEGER DEFAULT 0,
  ctr DECIMAL(5,2),
  
  -- Tracking
  last_checked TIMESTAMPTZ DEFAULT NOW(),
  check_frequency TEXT CHECK (check_frequency IN ('daily', 'weekly', 'monthly')) DEFAULT 'weekly',
  
  -- Additional
  tags TEXT[] DEFAULT '{}',
  notes TEXT,
  is_active BOOLEAN DEFAULT true,
  
  UNIQUE(keyword, target_url)
);

ALTER TABLE public.keyword_tracking ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage keywords" ON public.keyword_tracking FOR ALL USING (true);

-- Keyword Ranking History
CREATE TABLE IF NOT EXISTS public.keyword_history (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  keyword_id UUID REFERENCES public.keyword_tracking(id) ON DELETE CASCADE NOT NULL,
  date DATE NOT NULL,
  position INTEGER,
  impressions INTEGER DEFAULT 0,
  clicks INTEGER DEFAULT 0,
  ctr DECIMAL(5,2),
  UNIQUE(keyword_id, date)
);

ALTER TABLE public.keyword_history ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage keyword history" ON public.keyword_history FOR ALL USING (true);

-- ============================================================================
-- ANALYTICS & REPORTING
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.analytics_data (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Page & Date
  page_path TEXT NOT NULL,
  date DATE NOT NULL,
  
  -- Traffic Metrics
  page_views INTEGER DEFAULT 0,
  unique_visitors INTEGER DEFAULT 0,
  sessions INTEGER DEFAULT 0,
  avg_session_duration INTEGER DEFAULT 0,
  bounce_rate DECIMAL(5,2),
  
  -- Search Console Metrics
  impressions INTEGER DEFAULT 0,
  clicks INTEGER DEFAULT 0,
  ctr DECIMAL(5,2) DEFAULT 0,
  avg_position DECIMAL(5,2) DEFAULT 0,
  
  -- Engagement
  conversions INTEGER DEFAULT 0,
  conversion_rate DECIMAL(5,2),
  goal_completions INTEGER DEFAULT 0,
  
  -- Traffic Sources
  organic_traffic INTEGER DEFAULT 0,
  direct_traffic INTEGER DEFAULT 0,
  referral_traffic INTEGER DEFAULT 0,
  social_traffic INTEGER DEFAULT 0,
  paid_traffic INTEGER DEFAULT 0,
  
  -- Device & Location
  mobile_percentage DECIMAL(5,2),
  desktop_percentage DECIMAL(5,2),
  tablet_percentage DECIMAL(5,2),
  top_country TEXT,
  
  -- Data Source
  source TEXT CHECK (source IN ('google_search_console', 'google_analytics', 'manual', 'automated')) DEFAULT 'manual',
  
  UNIQUE(page_path, date, source)
);

ALTER TABLE public.analytics_data ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage analytics" ON public.analytics_data FOR ALL USING (true);

-- Conversion Events
CREATE TABLE IF NOT EXISTS public.conversion_events (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  event_name TEXT NOT NULL,
  event_type TEXT CHECK (event_type IN ('form_submission', 'button_click', 'page_view', 'purchase', 'signup', 'download', 'custom')) NOT NULL,
  page_path TEXT,
  
  -- Event Details
  value DECIMAL(10,2),
  currency TEXT DEFAULT 'USD',
  
  -- Attribution
  utm_source TEXT,
  utm_medium TEXT,
  utm_campaign TEXT,
  referrer TEXT,
  
  -- User Data (anonymized)
  session_id TEXT,
  user_country TEXT,
  user_device TEXT,
  
  -- Metadata
  metadata JSONB DEFAULT '{}'::jsonb
);

ALTER TABLE public.conversion_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage conversion events" ON public.conversion_events FOR ALL USING (true);

-- ============================================================================
-- NOTES & DOCUMENTS
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.notes (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  
  -- Relationships (nullable - note can be standalone)
  lead_id UUID REFERENCES public.leads(id) ON DELETE CASCADE,
  contact_id UUID REFERENCES public.contacts(id) ON DELETE CASCADE,
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
  
  -- Metadata
  created_by UUID REFERENCES public.users(id),
  is_pinned BOOLEAN DEFAULT false,
  tags TEXT[] DEFAULT '{}'
);

ALTER TABLE public.notes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage notes" ON public.notes FOR ALL USING (true);

-- ============================================================================
-- INDEXES FOR PERFORMANCE
-- ============================================================================

-- Leads indexes
CREATE INDEX IF NOT EXISTS idx_leads_status ON public.leads(status);
CREATE INDEX IF NOT EXISTS idx_leads_assigned_to ON public.leads(assigned_to);
CREATE INDEX IF NOT EXISTS idx_leads_created_at ON public.leads(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_leads_source ON public.leads(source);
CREATE INDEX IF NOT EXISTS idx_leads_temperature ON public.leads(temperature);
CREATE INDEX IF NOT EXISTS idx_leads_email ON public.leads(email);

-- Contacts indexes
CREATE INDEX IF NOT EXISTS idx_contacts_email ON public.contacts(email);
CREATE INDEX IF NOT EXISTS idx_contacts_company ON public.contacts(company);
CREATE INDEX IF NOT EXISTS idx_contacts_created_at ON public.contacts(created_at DESC);

-- Tasks indexes
CREATE INDEX IF NOT EXISTS idx_tasks_status ON public.tasks(status);
CREATE INDEX IF NOT EXISTS idx_tasks_due_date ON public.tasks(due_date);
CREATE INDEX IF NOT EXISTS idx_tasks_assigned_to ON public.tasks(assigned_to);
CREATE INDEX IF NOT EXISTS idx_tasks_project_id ON public.tasks(project_id);

-- Projects indexes
CREATE INDEX IF NOT EXISTS idx_projects_status ON public.projects(status);
CREATE INDEX IF NOT EXISTS idx_projects_start_date ON public.projects(start_date);

-- Emails indexes
CREATE INDEX IF NOT EXISTS idx_emails_status ON public.emails(status);
CREATE INDEX IF NOT EXISTS idx_emails_sent_at ON public.emails(sent_at DESC);
CREATE INDEX IF NOT EXISTS idx_emails_lead_id ON public.emails(lead_id);
CREATE INDEX IF NOT EXISTS idx_emails_contact_id ON public.emails(contact_id);

-- SEO indexes
CREATE INDEX IF NOT EXISTS idx_seo_pages_path ON public.seo_pages(page_path);
CREATE INDEX IF NOT EXISTS idx_seo_pages_published ON public.seo_pages(is_published);

-- Analytics indexes
CREATE INDEX IF NOT EXISTS idx_analytics_date ON public.analytics_data(date DESC);
CREATE INDEX IF NOT EXISTS idx_analytics_page_path ON public.analytics_data(page_path);
CREATE INDEX IF NOT EXISTS idx_analytics_source ON public.analytics_data(source);

-- Keyword indexes
CREATE INDEX IF NOT EXISTS idx_keywords_keyword ON public.keyword_tracking(keyword);
CREATE INDEX IF NOT EXISTS idx_keywords_position ON public.keyword_tracking(current_position);

-- ============================================================================
-- TRIGGERS FOR AUTOMATIC UPDATES
-- ============================================================================

-- Updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply updated_at triggers
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON public.users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_leads_updated_at BEFORE UPDATE ON public.leads
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_contacts_updated_at BEFORE UPDATE ON public.contacts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tasks_updated_at BEFORE UPDATE ON public.tasks
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_projects_updated_at BEFORE UPDATE ON public.projects
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_emails_updated_at BEFORE UPDATE ON public.emails
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_seo_pages_updated_at BEFORE UPDATE ON public.seo_pages
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_keyword_tracking_updated_at BEFORE UPDATE ON public.keyword_tracking
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Auto-calculate lead conversion time
CREATE OR REPLACE FUNCTION calculate_lead_conversion_days()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.converted_to_contact = true AND OLD.converted_to_contact = false THEN
        NEW.conversion_date = NOW();
        NEW.days_to_convert = EXTRACT(DAY FROM (NOW() - NEW.created_at));
    END IF;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER lead_conversion_trigger BEFORE UPDATE ON public.leads
  FOR EACH ROW EXECUTE FUNCTION calculate_lead_conversion_days();

-- ============================================================================
-- SEED DATA
-- ============================================================================

-- Insert default SEO pages
INSERT INTO public.seo_pages (page_path, page_title, meta_title, meta_description, meta_keywords) VALUES
  ('/', 'Home', 'CreedaVA - Bilingual Virtual Assistants from Belize', 'Professional bilingual virtual assistant services. Expert support in English & Spanish for businesses worldwide.', ARRAY['virtual assistant', 'bilingual', 'remote support', 'belize', 'VA services']),
  ('/services', 'Services', 'Our Services - CreedaVA', 'Comprehensive virtual assistant services including administrative support, customer service, and project management.', ARRAY['VA services', 'administrative support', 'business services', 'customer service']),
  ('/about', 'About', 'About Us - CreedaVA', 'Learn about CreedaVA, your trusted partner for professional virtual assistant services.', ARRAY['about', 'company', 'team', 'virtual assistant company']),
  ('/pricing', 'Pricing', 'Pricing - CreedaVA', 'Flexible and affordable virtual assistant pricing plans to suit your business needs.', ARRAY['pricing', 'plans', 'rates', 'affordable VA']),
  ('/contact', 'Contact', 'Contact Us - CreedaVA', 'Get in touch with CreedaVA for professional virtual assistant services.', ARRAY['contact', 'support', 'inquiry', 'get started'])
ON CONFLICT (page_path) DO NOTHING;

-- Insert sample email templates
INSERT INTO public.email_templates (name, subject, body, category) VALUES
  ('Welcome Email', 'Welcome to CreedaVA!', 'Hi {{name}},\n\nWelcome to CreedaVA! We''re excited to have you...\n\nBest regards,\nThe CreedaVA Team', 'onboarding'),
  ('Follow-up Email', 'Following up on our conversation', 'Hi {{name}},\n\nI wanted to follow up on our recent conversation about...\n\nLooking forward to hearing from you.\n\nBest regards,\n{{sender_name}}', 'sales'),
  ('Proposal Email', 'Your Custom Proposal from CreedaVA', 'Hi {{name}},\n\nThank you for your interest in CreedaVA services. Please find attached your custom proposal...\n\nBest regards,\n{{sender_name}}', 'sales')
ON CONFLICT DO NOTHING;
