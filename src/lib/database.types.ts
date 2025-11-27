// TypeScript types for Supabase database - Enhanced Schema
// Auto-generated types matching supabase-schema.sql

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          created_at: string
          updated_at: string
          email: string
          full_name: string | null
          role: 'admin' | 'manager' | 'sales' | 'support' | 'user'
          avatar_url: string | null
          phone: string | null
          department: string | null
          timezone: string
          language: string
          last_login: string | null
          login_count: number
          is_active: boolean
          deals_closed: number
          total_revenue: number
        }
        Insert: Omit<Database['public']['Tables']['users']['Row'], 'created_at' | 'updated_at' | 'login_count' | 'is_active' | 'deals_closed' | 'total_revenue'>
        Update: Partial<Database['public']['Tables']['users']['Insert']>
      }
      leads: {
        Row: {
          id: string
          created_at: string
          updated_at: string
          name: string
          email: string
          phone: string | null
          mobile: string | null
          company: string | null
          website: string | null
          industry: string | null
          company_size: '1-10' | '11-50' | '51-200' | '201-500' | '501-1000' | '1000+' | null
          status: 'new' | 'contacted' | 'qualified' | 'proposal' | 'negotiation' | 'won' | 'lost' | 'on_hold'
          lead_score: number
          temperature: 'cold' | 'warm' | 'hot'
          source: 'website' | 'referral' | 'social_media' | 'cold_call' | 'email_campaign' | 'event' | 'partner' | 'advertising' | 'other'
          source_details: string | null
          campaign_id: string | null
          utm_source: string | null
          utm_medium: string | null
          utm_campaign: string | null
          estimated_value: number | null
          actual_value: number | null
          currency: string
          expected_close_date: string | null
          assigned_to: string | null
          created_by: string | null
          next_follow_up: string | null
          last_contacted: string | null
          contact_count: number
          email_opens: number
          email_clicks: number
          country: string | null
          state: string | null
          city: string | null
          zip_code: string | null
          address: string | null
          notes: string | null
          tags: string[]
          custom_fields: Json
          converted_to_contact: boolean
          conversion_date: string | null
          days_to_convert: number | null
          loss_reason: string | null
          competitor: string | null
        }
        Insert: Omit<Database['public']['Tables']['leads']['Row'], 'id' | 'created_at' | 'updated_at' | 'lead_score' | 'temperature' | 'currency' | 'contact_count' | 'email_opens' | 'email_clicks' | 'tags' | 'custom_fields' | 'converted_to_contact'>
        Update: Partial<Database['public']['Tables']['leads']['Insert']>
      }
      lead_activities: {
        Row: {
          id: string
          created_at: string
          lead_id: string
          user_id: string | null
          activity_type: 'call' | 'email' | 'meeting' | 'note' | 'status_change' | 'task_completed' | 'proposal_sent' | 'document_sent'
          title: string
          description: string | null
          duration_minutes: number | null
          metadata: Json
        }
        Insert: Omit<Database['public']['Tables']['lead_activities']['Row'], 'id' | 'created_at' | 'metadata'>
        Update: Partial<Database['public']['Tables']['lead_activities']['Insert']>
      }
      contacts: {
        Row: {
          id: string
          created_at: string
          updated_at: string
          first_name: string
          last_name: string
          email: string
          phone: string | null
          mobile: string | null
          birthday: string | null
          company: string | null
          position: string | null
          department: string | null
          seniority: 'c_level' | 'vp' | 'director' | 'manager' | 'individual_contributor' | 'other' | null
          linkedin_url: string | null
          country: string | null
          state: string | null
          city: string | null
          zip_code: string | null
          address: string | null
          timezone: string | null
          lead_id: string | null
          account_manager: string | null
          relationship_strength: 'weak' | 'moderate' | 'strong' | 'champion'
          preferred_contact_method: 'email' | 'phone' | 'sms' | 'linkedin' | null
          email_opt_in: boolean
          sms_opt_in: boolean
          last_contacted: string | null
          last_meeting: string | null
          total_meetings: number
          email_engagement_score: number
          tags: string[]
          notes: string | null
          custom_fields: Json
          is_active: boolean
        }
        Insert: Omit<Database['public']['Tables']['contacts']['Row'], 'id' | 'created_at' | 'updated_at' | 'relationship_strength' | 'email_opt_in' | 'sms_opt_in' | 'total_meetings' | 'email_engagement_score' | 'tags' | 'custom_fields' | 'is_active'>
        Update: Partial<Database['public']['Tables']['contacts']['Insert']>
      }
      contact_activities: {
        Row: {
          id: string
          created_at: string
          contact_id: string
          user_id: string | null
          activity_type: 'call' | 'email' | 'meeting' | 'note' | 'linkedin_message' | 'purchase' | 'support_ticket'
          title: string
          description: string | null
          sentiment: 'positive' | 'neutral' | 'negative' | null
          metadata: Json
        }
        Insert: Omit<Database['public']['Tables']['contact_activities']['Row'], 'id' | 'created_at' | 'metadata'>
        Update: Partial<Database['public']['Tables']['contact_activities']['Insert']>
      }
      tasks: {
        Row: {
          id: string
          created_at: string
          updated_at: string
          title: string
          description: string | null
          status: 'todo' | 'in_progress' | 'blocked' | 'review' | 'completed' | 'cancelled'
          priority: 'low' | 'medium' | 'high' | 'urgent'
          due_date: string | null
          start_date: string | null
          completed_at: string | null
          estimated_hours: number | null
          actual_hours: number | null
          assigned_to: string | null
          created_by: string | null
          project_id: string | null
          lead_id: string | null
          contact_id: string | null
          parent_task_id: string | null
          tags: string[]
          attachments: Json
          checklist: Json
          is_recurring: boolean
          recurrence_pattern: string | null
          reminder_date: string | null
        }
        Insert: Omit<Database['public']['Tables']['tasks']['Row'], 'id' | 'created_at' | 'updated_at' | 'tags' | 'attachments' | 'checklist' | 'is_recurring'>
        Update: Partial<Database['public']['Tables']['tasks']['Insert']>
      }
      projects: {
        Row: {
          id: string
          created_at: string
          updated_at: string
          name: string
          description: string | null
          status: 'planning' | 'active' | 'on_hold' | 'completed' | 'cancelled' | 'archived'
          start_date: string | null
          end_date: string | null
          actual_end_date: string | null
          budget: number | null
          actual_cost: number | null
          revenue: number | null
          currency: string
          project_manager: string | null
          client_id: string | null
          progress_percentage: number
          completed_tasks: number
          total_tasks: number
          priority: 'low' | 'medium' | 'high' | 'critical'
          tags: string[]
          custom_fields: Json
          health_status: 'on_track' | 'at_risk' | 'off_track'
        }
        Insert: Omit<Database['public']['Tables']['projects']['Row'], 'id' | 'created_at' | 'updated_at' | 'currency' | 'progress_percentage' | 'completed_tasks' | 'total_tasks' | 'priority' | 'tags' | 'custom_fields' | 'health_status'>
        Update: Partial<Database['public']['Tables']['projects']['Insert']>
      }
      project_milestones: {
        Row: {
          id: string
          created_at: string
          project_id: string
          name: string
          description: string | null
          due_date: string | null
          completed_date: string | null
          is_completed: boolean
          sort_order: number
        }
        Insert: Omit<Database['public']['Tables']['project_milestones']['Row'], 'id' | 'created_at' | 'is_completed' | 'sort_order'>
        Update: Partial<Database['public']['Tables']['project_milestones']['Insert']>
      }
      emails: {
        Row: {
          id: string
          created_at: string
          updated_at: string
          subject: string
          body: string
          plain_text_body: string | null
          from_email: string
          from_name: string | null
          to_email: string
          to_name: string | null
          cc: string[]
          bcc: string[]
          reply_to: string | null
          status: 'draft' | 'scheduled' | 'sent' | 'delivered' | 'opened' | 'clicked' | 'replied' | 'bounced' | 'failed'
          scheduled_at: string | null
          sent_at: string | null
          delivered_at: string | null
          opened_at: string | null
          clicked_at: string | null
          opens_count: number
          clicks_count: number
          unique_clicks: number
          click_rate: number | null
          lead_id: string | null
          contact_id: string | null
          template_id: string | null
          campaign_id: string | null
          user_id: string | null
          attachments: Json
          metadata: Json
          thread_id: string | null
        }
        Insert: Omit<Database['public']['Tables']['emails']['Row'], 'id' | 'created_at' | 'updated_at' | 'cc' | 'bcc' | 'opens_count' | 'clicks_count' | 'unique_clicks' | 'attachments' | 'metadata'>
        Update: Partial<Database['public']['Tables']['emails']['Insert']>
      }
      email_templates: {
        Row: {
          id: string
          created_at: string
          updated_at: string
          name: string
          subject: string
          body: string
          category: string | null
          is_active: boolean
          usage_count: number
          created_by: string | null
        }
        Insert: Omit<Database['public']['Tables']['email_templates']['Row'], 'id' | 'created_at' | 'updated_at' | 'is_active' | 'usage_count'>
        Update: Partial<Database['public']['Tables']['email_templates']['Insert']>
      }
      email_campaigns: {
        Row: {
          id: string
          created_at: string
          updated_at: string
          name: string
          description: string | null
          status: 'draft' | 'scheduled' | 'sending' | 'sent' | 'paused' | 'completed'
          send_date: string | null
          completed_date: string | null
          total_sent: number
          total_delivered: number
          total_opened: number
          total_clicked: number
          total_bounced: number
          open_rate: number | null
          click_rate: number | null
          created_by: string | null
        }
        Insert: Omit<Database['public']['Tables']['email_campaigns']['Row'], 'id' | 'created_at' | 'updated_at' | 'total_sent' | 'total_delivered' | 'total_opened' | 'total_clicked' | 'total_bounced'>
        Update: Partial<Database['public']['Tables']['email_campaigns']['Insert']>
      }
      seo_pages: {
        Row: {
          id: string
          created_at: string
          updated_at: string
          page_path: string
          page_title: string
          meta_title: string
          meta_description: string
          meta_keywords: string[]
          og_title: string | null
          og_description: string | null
          og_image: string | null
          og_type: string
          twitter_card: string
          twitter_title: string | null
          twitter_description: string | null
          twitter_image: string | null
          canonical_url: string | null
          robots: string
          structured_data: Json
          hreflang: Json
          page_views: number
          avg_time_on_page: number
          bounce_rate: number | null
          is_published: boolean
          last_published: string | null
          last_indexed: string | null
          index_status: 'indexed' | 'not_indexed' | 'pending' | 'blocked' | null
        }
        Insert: Omit<Database['public']['Tables']['seo_pages']['Row'], 'id' | 'created_at' | 'updated_at' | 'meta_keywords' | 'og_type' | 'twitter_card' | 'robots' | 'structured_data' | 'hreflang' | 'page_views' | 'avg_time_on_page' | 'is_published'>
        Update: Partial<Database['public']['Tables']['seo_pages']['Insert']>
      }
      keyword_tracking: {
        Row: {
          id: string
          created_at: string
          updated_at: string
          keyword: string
          target_url: string
          current_position: number | null
          previous_position: number | null
          best_position: number | null
          position_change: number | null
          search_volume: number | null
          difficulty: number | null
          cpc: number | null
          competition: 'low' | 'medium' | 'high' | null
          impressions: number
          clicks: number
          ctr: number | null
          last_checked: string
          check_frequency: 'daily' | 'weekly' | 'monthly'
          tags: string[]
          notes: string | null
          is_active: boolean
        }
        Insert: Omit<Database['public']['Tables']['keyword_tracking']['Row'], 'id' | 'created_at' | 'updated_at' | 'impressions' | 'clicks' | 'last_checked' | 'check_frequency' | 'tags' | 'is_active'>
        Update: Partial<Database['public']['Tables']['keyword_tracking']['Insert']>
      }
      keyword_history: {
        Row: {
          id: string
          keyword_id: string
          date: string
          position: number | null
          impressions: number
          clicks: number
          ctr: number | null
        }
        Insert: Omit<Database['public']['Tables']['keyword_history']['Row'], 'id' | 'impressions' | 'clicks'>
        Update: Partial<Database['public']['Tables']['keyword_history']['Insert']>
      }
      analytics_data: {
        Row: {
          id: string
          created_at: string
          page_path: string
          date: string
          page_views: number
          unique_visitors: number
          sessions: number
          avg_session_duration: number
          bounce_rate: number | null
          impressions: number
          clicks: number
          ctr: number
          avg_position: number
          conversions: number
          conversion_rate: number | null
          goal_completions: number
          organic_traffic: number
          direct_traffic: number
          referral_traffic: number
          social_traffic: number
          paid_traffic: number
          mobile_percentage: number | null
          desktop_percentage: number | null
          tablet_percentage: number | null
          top_country: string | null
          source: 'google_search_console' | 'google_analytics' | 'manual' | 'automated'
        }
        Insert: Omit<Database['public']['Tables']['analytics_data']['Row'], 'id' | 'created_at' | 'page_views' | 'unique_visitors' | 'sessions' | 'avg_session_duration' | 'impressions' | 'clicks' | 'ctr' | 'avg_position' | 'conversions' | 'goal_completions' | 'organic_traffic' | 'direct_traffic' | 'referral_traffic' | 'social_traffic' | 'paid_traffic'>
        Update: Partial<Database['public']['Tables']['analytics_data']['Insert']>
      }
      conversion_events: {
        Row: {
          id: string
          created_at: string
          event_name: string
          event_type: 'form_submission' | 'button_click' | 'page_view' | 'purchase' | 'signup' | 'download' | 'custom'
          page_path: string | null
          value: number | null
          currency: string
          utm_source: string | null
          utm_medium: string | null
          utm_campaign: string | null
          referrer: string | null
          session_id: string | null
          user_country: string | null
          user_device: string | null
          metadata: Json
        }
        Insert: Omit<Database['public']['Tables']['conversion_events']['Row'], 'id' | 'created_at' | 'currency' | 'metadata'>
        Update: Partial<Database['public']['Tables']['conversion_events']['Insert']>
      }
      notes: {
        Row: {
          id: string
          created_at: string
          updated_at: string
          title: string
          content: string
          lead_id: string | null
          contact_id: string | null
          project_id: string | null
          created_by: string | null
          is_pinned: boolean
          tags: string[]
        }
        Insert: Omit<Database['public']['Tables']['notes']['Row'], 'id' | 'created_at' | 'updated_at' | 'is_pinned' | 'tags'>
        Update: Partial<Database['public']['Tables']['notes']['Insert']>
      }
      ad_campaigns: {
        Row: {
          id: string
          created_at: string
          updated_at: string
          name: string
          platform: string
          budget: number
          spend: number
          status: string
          start_date: string | null
          end_date: string | null
          impressions: number
          clicks: number
          conversions: number
          conversion_value: number | null
          created_by: string | null
        }
        Insert: Omit<Database['public']['Tables']['ad_campaigns']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['ad_campaigns']['Insert']>
      }
      blog_posts: {
        Row: {
          id: string
          created_at: string
          updated_at: string
          title: string
          slug: string
          excerpt: string | null
          content: string
          category: string | null
          status: string
          is_featured: boolean
          published_at: string | null
          views: number
          created_by: string | null
        }
        Insert: Omit<Database['public']['Tables']['blog_posts']['Row'], 'id' | 'created_at' | 'updated_at' | 'views'>
        Update: Partial<Database['public']['Tables']['blog_posts']['Insert']>
      }
      social_posts: {
        Row: {
          id: string
          created_at: string
          updated_at: string
          content: string
          platform: string
          status: string
          scheduled_for: string | null
          hashtags: string[] | null
          likes: number | null
          comments: number | null
          shares: number | null
          created_by: string | null
        }
        Insert: Omit<Database['public']['Tables']['social_posts']['Row'], 'id' | 'created_at' | 'updated_at' | 'likes' | 'comments' | 'shares'>
        Update: Partial<Database['public']['Tables']['social_posts']['Insert']>
      }
      landing_pages: {
        Row: {
          id: string
          created_at: string
          updated_at: string
          name: string
          url_path: string
          headline: string | null
          cta_text: string | null
          variant: string
          status: string
          total_visits: number | null
          conversions: number | null
          conversion_rate: number | null
          created_by: string | null
        }
        Insert: Omit<Database['public']['Tables']['landing_pages']['Row'], 'id' | 'created_at' | 'updated_at' | 'total_visits' | 'conversions' | 'conversion_rate'>
        Update: Partial<Database['public']['Tables']['landing_pages']['Insert']>
      }
      customer_journeys: {
        Row: {
          id: string
          created_at: string
          updated_at: string
          lead_id: string | null
          contact_id: string | null
          stage: string
          touchpoints: number | null
          utm_source: string | null
          utm_medium: string | null
          utm_campaign: string | null
          conversion_value: number | null
          leads: any | null
          contacts: any | null
        }
        Insert: Omit<Database['public']['Tables']['customer_journeys']['Row'], 'id' | 'created_at' | 'updated_at' | 'leads' | 'contacts'>
        Update: Partial<Database['public']['Tables']['customer_journeys']['Insert']>
      }
      marketing_reports: {
        Row: {
          id: string
          created_at: string
          updated_at: string
          name: string
          report_type: string
          date_range_start: string | null
          date_range_end: string | null
          schedule_frequency: string | null
          status: string
          report_data: Json
          created_by: string | null
        }
        Insert: Omit<Database['public']['Tables']['marketing_reports']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['marketing_reports']['Insert']>
      }
    }
  }
}
