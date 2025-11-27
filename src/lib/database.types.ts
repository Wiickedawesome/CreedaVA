// TypeScript types for Supabase database
// This file will be auto-generated once you set up your Supabase project

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
      leads: {
        Row: {
          id: string
          created_at: string
          updated_at: string
          name: string
          email: string
          phone: string | null
          company: string | null
          status: 'new' | 'contacted' | 'qualified' | 'proposal' | 'negotiation' | 'won' | 'lost'
          source: string | null
          value: number | null
          notes: string | null
          assigned_to: string | null
          next_follow_up: string | null
        }
        Insert: Omit<Database['public']['Tables']['leads']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['leads']['Insert']>
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
          company: string | null
          position: string | null
          tags: string[]
          notes: string | null
          lead_id: string | null
        }
        Insert: Omit<Database['public']['Tables']['contacts']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['contacts']['Insert']>
      }
      tasks: {
        Row: {
          id: string
          created_at: string
          updated_at: string
          title: string
          description: string | null
          status: 'todo' | 'in_progress' | 'completed' | 'cancelled'
          priority: 'low' | 'medium' | 'high' | 'urgent'
          due_date: string | null
          assigned_to: string | null
          project_id: string | null
          lead_id: string | null
          contact_id: string | null
        }
        Insert: Omit<Database['public']['Tables']['tasks']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['tasks']['Insert']>
      }
      projects: {
        Row: {
          id: string
          created_at: string
          updated_at: string
          name: string
          description: string | null
          status: 'planning' | 'active' | 'on_hold' | 'completed' | 'cancelled'
          start_date: string | null
          end_date: string | null
          budget: number | null
          client_id: string | null
        }
        Insert: Omit<Database['public']['Tables']['projects']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['projects']['Insert']>
      }
      emails: {
        Row: {
          id: string
          created_at: string
          subject: string
          body: string
          to_email: string
          from_email: string
          status: 'draft' | 'sent' | 'failed'
          sent_at: string | null
          lead_id: string | null
          contact_id: string | null
          template_id: string | null
        }
        Insert: Omit<Database['public']['Tables']['emails']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['emails']['Insert']>
      }
      seo_pages: {
        Row: {
          id: string
          created_at: string
          updated_at: string
          page_path: string
          title: string
          description: string
          keywords: string[]
          og_title: string | null
          og_description: string | null
          og_image: string | null
          canonical_url: string | null
          robots: string | null
        }
        Insert: Omit<Database['public']['Tables']['seo_pages']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['seo_pages']['Insert']>
      }
      keyword_tracking: {
        Row: {
          id: string
          created_at: string
          keyword: string
          target_url: string
          position: number | null
          search_volume: number | null
          competition: string | null
          last_checked: string
        }
        Insert: Omit<Database['public']['Tables']['keyword_tracking']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['keyword_tracking']['Insert']>
      }
      analytics_data: {
        Row: {
          id: string
          created_at: string
          page_path: string
          date: string
          impressions: number
          clicks: number
          ctr: number
          position: number
          source: 'google_search_console' | 'manual'
        }
        Insert: Omit<Database['public']['Tables']['analytics_data']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['analytics_data']['Insert']>
      }
      users: {
        Row: {
          id: string
          created_at: string
          email: string
          full_name: string | null
          role: 'admin' | 'manager' | 'user'
          avatar_url: string | null
        }
        Insert: Omit<Database['public']['Tables']['users']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['users']['Insert']>
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
}
