-- CreedaVA CRM Database Schema
-- Run this in your Supabase SQL Editor to set up all tables

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table (extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS public.users (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  role TEXT CHECK (role IN ('admin', 'manager', 'user')) DEFAULT 'user',
  avatar_url TEXT
);

-- Enable RLS
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Users policies
CREATE POLICY "Users can view their own data" ON public.users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own data" ON public.users
  FOR UPDATE USING (auth.uid() = id);

-- Leads table
CREATE TABLE IF NOT EXISTS public.leads (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  company TEXT,
  status TEXT CHECK (status IN ('new', 'contacted', 'qualified', 'proposal', 'negotiation', 'won', 'lost')) DEFAULT 'new',
  source TEXT,
  value DECIMAL(10,2),
  notes TEXT,
  assigned_to UUID REFERENCES public.users(id),
  next_follow_up TIMESTAMPTZ
);

ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view all leads" ON public.leads
  FOR SELECT USING (true);

CREATE POLICY "Users can create leads" ON public.leads
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can update leads" ON public.leads
  FOR UPDATE USING (true);

CREATE POLICY "Users can delete leads" ON public.leads
  FOR DELETE USING (true);

-- Contacts table
CREATE TABLE IF NOT EXISTS public.contacts (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  company TEXT,
  position TEXT,
  tags TEXT[] DEFAULT '{}',
  notes TEXT,
  lead_id UUID REFERENCES public.leads(id) ON DELETE SET NULL
);

ALTER TABLE public.contacts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage contacts" ON public.contacts
  FOR ALL USING (true);

-- Tasks table
CREATE TABLE IF NOT EXISTS public.tasks (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  title TEXT NOT NULL,
  description TEXT,
  status TEXT CHECK (status IN ('todo', 'in_progress', 'completed', 'cancelled')) DEFAULT 'todo',
  priority TEXT CHECK (priority IN ('low', 'medium', 'high', 'urgent')) DEFAULT 'medium',
  due_date TIMESTAMPTZ,
  assigned_to UUID REFERENCES public.users(id),
  project_id UUID,
  lead_id UUID REFERENCES public.leads(id) ON DELETE CASCADE,
  contact_id UUID REFERENCES public.contacts(id) ON DELETE CASCADE
);

ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage tasks" ON public.tasks
  FOR ALL USING (true);

-- Projects table
CREATE TABLE IF NOT EXISTS public.projects (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  name TEXT NOT NULL,
  description TEXT,
  status TEXT CHECK (status IN ('planning', 'active', 'on_hold', 'completed', 'cancelled')) DEFAULT 'planning',
  start_date DATE,
  end_date DATE,
  budget DECIMAL(10,2),
  client_id UUID REFERENCES public.contacts(id) ON DELETE SET NULL
);

ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage projects" ON public.projects
  FOR ALL USING (true);

-- Add project_id foreign key to tasks
ALTER TABLE public.tasks ADD CONSTRAINT tasks_project_id_fkey 
  FOREIGN KEY (project_id) REFERENCES public.projects(id) ON DELETE CASCADE;

-- Emails table
CREATE TABLE IF NOT EXISTS public.emails (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  subject TEXT NOT NULL,
  body TEXT NOT NULL,
  to_email TEXT NOT NULL,
  from_email TEXT NOT NULL,
  status TEXT CHECK (status IN ('draft', 'sent', 'failed')) DEFAULT 'draft',
  sent_at TIMESTAMPTZ,
  lead_id UUID REFERENCES public.leads(id) ON DELETE SET NULL,
  contact_id UUID REFERENCES public.contacts(id) ON DELETE SET NULL,
  template_id UUID
);

ALTER TABLE public.emails ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage emails" ON public.emails
  FOR ALL USING (true);

-- SEO Pages table
CREATE TABLE IF NOT EXISTS public.seo_pages (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  page_path TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  keywords TEXT[] DEFAULT '{}',
  og_title TEXT,
  og_description TEXT,
  og_image TEXT,
  canonical_url TEXT,
  robots TEXT DEFAULT 'index, follow'
);

ALTER TABLE public.seo_pages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage SEO pages" ON public.seo_pages
  FOR ALL USING (true);

-- Keyword Tracking table
CREATE TABLE IF NOT EXISTS public.keyword_tracking (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  keyword TEXT NOT NULL,
  target_url TEXT NOT NULL,
  position INTEGER,
  search_volume INTEGER,
  competition TEXT,
  last_checked TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.keyword_tracking ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage keywords" ON public.keyword_tracking
  FOR ALL USING (true);

-- Analytics Data table
CREATE TABLE IF NOT EXISTS public.analytics_data (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  page_path TEXT NOT NULL,
  date DATE NOT NULL,
  impressions INTEGER DEFAULT 0,
  clicks INTEGER DEFAULT 0,
  ctr DECIMAL(5,2) DEFAULT 0,
  position DECIMAL(5,2) DEFAULT 0,
  source TEXT CHECK (source IN ('google_search_console', 'manual')) DEFAULT 'manual',
  UNIQUE(page_path, date, source)
);

ALTER TABLE public.analytics_data ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage analytics" ON public.analytics_data
  FOR ALL USING (true);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_leads_status ON public.leads(status);
CREATE INDEX IF NOT EXISTS idx_leads_assigned_to ON public.leads(assigned_to);
CREATE INDEX IF NOT EXISTS idx_contacts_email ON public.contacts(email);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON public.tasks(status);
CREATE INDEX IF NOT EXISTS idx_tasks_due_date ON public.tasks(due_date);
CREATE INDEX IF NOT EXISTS idx_projects_status ON public.projects(status);
CREATE INDEX IF NOT EXISTS idx_emails_status ON public.emails(status);
CREATE INDEX IF NOT EXISTS idx_seo_pages_path ON public.seo_pages(page_path);
CREATE INDEX IF NOT EXISTS idx_analytics_date ON public.analytics_data(date);
CREATE INDEX IF NOT EXISTS idx_analytics_page_path ON public.analytics_data(page_path);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Add updated_at triggers
CREATE TRIGGER update_leads_updated_at BEFORE UPDATE ON public.leads
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_contacts_updated_at BEFORE UPDATE ON public.contacts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tasks_updated_at BEFORE UPDATE ON public.tasks
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_projects_updated_at BEFORE UPDATE ON public.projects
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_seo_pages_updated_at BEFORE UPDATE ON public.seo_pages
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert some default SEO pages for existing pages
INSERT INTO public.seo_pages (page_path, title, description, keywords) VALUES
  ('/', 'CreedaVA - Bilingual Virtual Assistants from Belize', 'Professional bilingual virtual assistant services. Expert support in English & Spanish for businesses worldwide.', ARRAY['virtual assistant', 'bilingual', 'remote support']),
  ('/services', 'Our Services - CreedaVA', 'Comprehensive virtual assistant services including administrative support, customer service, and project management.', ARRAY['VA services', 'administrative support', 'business services']),
  ('/about', 'About Us - CreedaVA', 'Learn about CreedaVA, your trusted partner for professional virtual assistant services.', ARRAY['about', 'company', 'team']),
  ('/pricing', 'Pricing - CreedaVA', 'Flexible and affordable virtual assistant pricing plans to suit your business needs.', ARRAY['pricing', 'plans', 'rates']),
  ('/contact', 'Contact Us - CreedaVA', 'Get in touch with CreedaVA for professional virtual assistant services.', ARRAY['contact', 'support', 'inquiry'])
ON CONFLICT (page_path) DO NOTHING;
