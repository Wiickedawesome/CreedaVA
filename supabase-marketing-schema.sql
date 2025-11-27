-- CreedaVA Marketing Extensions 
-- This version drops existing tables first, then recreates them with correct structure
-- 
-- LINKEDIN INTEGRATION NOTES:
-- The social_posts table includes linkedin_post_id and linkedin_author_urn fields
-- These are prepared for LinkedIn Lead Sync API integration
-- Reference: https://learn.microsoft.com/en-us/linkedin/marketing/lead-sync/leadsync

-- ============================================================================
-- DROP EXISTING TABLES (if they exist)
-- ============================================================================

DROP TABLE IF EXISTS public.marketing_reports CASCADE;
DROP TABLE IF EXISTS public.customer_journeys CASCADE;
DROP TABLE IF EXISTS public.ad_campaigns CASCADE;
DROP TABLE IF EXISTS public.blog_posts CASCADE;
DROP TABLE IF EXISTS public.social_posts CASCADE;
DROP TABLE IF EXISTS public.landing_pages CASCADE;

-- ============================================================================
-- LANDING PAGES
-- ============================================================================

CREATE TABLE public.landing_pages (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),
  
  -- Page details
  name TEXT NOT NULL,
  url_path TEXT UNIQUE NOT NULL,
  headline TEXT,
  subheadline TEXT,
  cta_text TEXT DEFAULT 'Get Started',
  cta_url TEXT,
  status TEXT CHECK (status IN ('draft', 'active', 'paused')) DEFAULT 'draft',
  
  -- SEO
  meta_title TEXT,
  meta_description TEXT,
  keywords TEXT[],
  
  -- Tracking
  total_visits INTEGER DEFAULT 0,
  conversions INTEGER DEFAULT 0,
  conversion_rate DECIMAL(5,2) DEFAULT 0,
  
  -- Settings
  published_at TIMESTAMPTZ,
  
  -- A/B Testing
  variant TEXT DEFAULT 'A',
  test_group TEXT
);

ALTER TABLE public.landing_pages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view all landing pages" ON public.landing_pages
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can manage landing pages" ON public.landing_pages
  FOR ALL USING (auth.role() = 'authenticated');

-- ============================================================================
-- SOCIAL MEDIA POSTS
-- ============================================================================

CREATE TABLE public.social_posts (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),
  
  -- Post details
  content TEXT NOT NULL,
  platform TEXT CHECK (platform IN ('linkedin', 'twitter', 'facebook', 'instagram')) NOT NULL,
  status TEXT CHECK (status IN ('draft', 'scheduled', 'published', 'failed')) DEFAULT 'draft',
  
  -- Media
  media_urls TEXT[],
  media_type TEXT CHECK (media_type IN ('image', 'video', 'carousel', 'none')) DEFAULT 'none',
  
  -- Scheduling
  scheduled_for TIMESTAMPTZ,
  published_at TIMESTAMPTZ,
  
  -- Engagement metrics
  likes INTEGER DEFAULT 0,
  comments INTEGER DEFAULT 0,
  shares INTEGER DEFAULT 0,
  impressions INTEGER DEFAULT 0,
  clicks INTEGER DEFAULT 0,
  engagement_rate DECIMAL(5,2) DEFAULT 0,
  
  -- LinkedIn specific
  linkedin_post_id TEXT,
  linkedin_author_urn TEXT,
  
  -- Campaign association
  campaign_id UUID,
  
  -- Hashtags and mentions
  hashtags TEXT[],
  mentions TEXT[]
);

ALTER TABLE public.social_posts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can manage social posts" ON public.social_posts
  FOR ALL USING (auth.role() = 'authenticated');

-- ============================================================================
-- BLOG POSTS (News/Articles)
-- ============================================================================

CREATE TABLE public.blog_posts (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),
  
  -- Post details
  title TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  excerpt TEXT,
  content TEXT NOT NULL,
  featured_image TEXT,
  
  -- Status
  status TEXT CHECK (status IN ('draft', 'published', 'archived')) DEFAULT 'draft',
  published_at TIMESTAMPTZ,
  
  -- SEO
  meta_title TEXT,
  meta_description TEXT,
  keywords TEXT[],
  
  -- Organization
  category TEXT,
  tags TEXT[],
  author_name TEXT,
  
  -- Engagement
  views INTEGER DEFAULT 0,
  read_time_minutes INTEGER,
  
  -- Settings
  is_featured BOOLEAN DEFAULT false,
  allow_comments BOOLEAN DEFAULT true,
  is_published BOOLEAN DEFAULT false
);

ALTER TABLE public.blog_posts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view all blog posts" ON public.blog_posts
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can manage blog posts" ON public.blog_posts
  FOR ALL USING (auth.role() = 'authenticated');

-- ============================================================================
-- AD CAMPAIGNS
-- ============================================================================

CREATE TABLE public.ad_campaigns (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),
  
  -- Campaign details
  name TEXT NOT NULL,
  platform TEXT CHECK (platform IN ('google_ads', 'facebook', 'linkedin', 'instagram', 'twitter')) NOT NULL,
  status TEXT CHECK (status IN ('draft', 'active', 'paused', 'completed')) DEFAULT 'draft',
  
  -- Budget
  budget DECIMAL(10,2) DEFAULT 0,
  spend DECIMAL(10,2) DEFAULT 0,
  
  -- Dates
  start_date DATE,
  end_date DATE,
  
  -- Performance metrics
  impressions INTEGER DEFAULT 0,
  clicks INTEGER DEFAULT 0,
  conversions INTEGER DEFAULT 0,
  conversion_value DECIMAL(10,2) DEFAULT 0,
  
  -- Platform specific IDs
  platform_campaign_id TEXT
);

ALTER TABLE public.ad_campaigns ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can manage ad campaigns" ON public.ad_campaigns
  FOR ALL USING (auth.role() = 'authenticated');

-- ============================================================================
-- CUSTOMER JOURNEY TRACKING
-- ============================================================================

CREATE TABLE public.customer_journeys (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),
  
  -- Customer reference
  lead_id UUID REFERENCES public.leads(id),
  contact_id UUID REFERENCES public.contacts(id),
  
  -- Journey stage
  stage TEXT CHECK (stage IN ('awareness', 'consideration', 'decision', 'retention', 'advocacy')) NOT NULL,
  
  -- UTM Tracking
  utm_source TEXT,
  utm_medium TEXT,
  utm_campaign TEXT,
  
  -- Engagement
  touchpoints INTEGER DEFAULT 0,
  
  -- Conversion tracking
  converted_at TIMESTAMPTZ,
  conversion_value DECIMAL(10,2)
);

ALTER TABLE public.customer_journeys ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can manage customer journeys" ON public.customer_journeys
  FOR ALL USING (auth.role() = 'authenticated');

-- ============================================================================
-- MARKETING REPORTS
-- ============================================================================

CREATE TABLE public.marketing_reports (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),
  
  -- Report details
  name TEXT NOT NULL,
  report_type TEXT CHECK (report_type IN ('campaign', 'attribution', 'content', 'social', 'custom')) NOT NULL,
  status TEXT CHECK (status IN ('scheduled', 'completed', 'failed')) DEFAULT 'completed',
  
  -- Date range
  date_range_start DATE,
  date_range_end DATE,
  
  -- Scheduling
  schedule_frequency TEXT CHECK (schedule_frequency IN ('daily', 'weekly', 'monthly')),
  
  -- Data
  report_data JSONB
);

ALTER TABLE public.marketing_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can manage reports" ON public.marketing_reports
  FOR ALL USING (auth.role() = 'authenticated');

-- ============================================================================
-- INDEXES FOR PERFORMANCE
-- ============================================================================

CREATE INDEX idx_landing_pages_url_path ON public.landing_pages(url_path);
CREATE INDEX idx_landing_pages_status ON public.landing_pages(status);
CREATE INDEX idx_social_posts_platform ON public.social_posts(platform);
CREATE INDEX idx_social_posts_status ON public.social_posts(status);
CREATE INDEX idx_social_posts_scheduled ON public.social_posts(scheduled_for);
CREATE INDEX idx_blog_posts_slug ON public.blog_posts(slug);
CREATE INDEX idx_blog_posts_status ON public.blog_posts(status);
CREATE INDEX idx_blog_posts_published ON public.blog_posts(published_at);
CREATE INDEX idx_ad_campaigns_platform ON public.ad_campaigns(platform);
CREATE INDEX idx_ad_campaigns_status ON public.ad_campaigns(status);
CREATE INDEX idx_customer_journeys_lead ON public.customer_journeys(lead_id);
CREATE INDEX idx_customer_journeys_contact ON public.customer_journeys(contact_id);
CREATE INDEX idx_customer_journeys_stage ON public.customer_journeys(stage);

-- ============================================================================
-- UPDATED_AT TRIGGERS
-- ============================================================================

CREATE TRIGGER update_landing_pages_updated_at BEFORE UPDATE ON public.landing_pages
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_social_posts_updated_at BEFORE UPDATE ON public.social_posts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_blog_posts_updated_at BEFORE UPDATE ON public.blog_posts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_ad_campaigns_updated_at BEFORE UPDATE ON public.ad_campaigns
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- SAMPLE DATA
-- ============================================================================

-- Sample blog post
INSERT INTO public.blog_posts (title, slug, excerpt, content, category, status, is_published) VALUES
  ('Welcome to CreedaVA Blog', 'welcome-to-creedava-blog', 'Discover how virtual assistants can transform your business', 'Full blog content here...', 'Company News', 'published', true)
ON CONFLICT (slug) DO NOTHING;

-- ============================================================================
-- COMPLETION MESSAGE
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE '✅ Marketing schema installed successfully!';
  RAISE NOTICE '✅ Created 6 tables: landing_pages, social_posts, blog_posts, ad_campaigns, customer_journeys, marketing_reports';
  RAISE NOTICE '✅ Created 13 indexes for performance';
  RAISE NOTICE '✅ Created 4 updated_at triggers';
  RAISE NOTICE '✅ Enabled RLS policies for authenticated users';
  RAISE NOTICE '';
  RAISE NOTICE '🚀 Next: Visit https://creedava.com/admin/social to start using marketing features!';
END $$;
