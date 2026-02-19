// Auto-generated types — run `npm run db:generate` after Supabase setup
// For now this is a manual scaffold

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          full_name: string | null
          avatar_url: string | null
          username: string | null
          plan: 'free' | 'creator' | 'pro' | 'brand'
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
          uploads_this_month: number
          ai_credits_used: number
          onboarding_complete: boolean
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['profiles']['Row'], 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['profiles']['Insert']>
      }
      connected_accounts: {
        Row: {
          id: string
          user_id: string
          platform: string
          platform_user_id: string
          platform_username: string | null
          access_token: string
          refresh_token: string | null
          expires_at: string | null
          scopes: string[]
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['connected_accounts']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['connected_accounts']['Insert']>
      }
      content_items: {
        Row: {
          id: string
          user_id: string
          type: 'image' | 'video'
          title: string | null
          original_url: string
          file_size: number
          duration_seconds: number | null
          width: number | null
          height: number | null
          storage_path: string
          status: 'processing' | 'ready' | 'error'
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['content_items']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['content_items']['Insert']>
      }
      content_variants: {
        Row: {
          id: string
          content_item_id: string
          platform: string
          variant_url: string
          storage_path: string
          width: number
          height: number
          file_size: number
          caption: string | null
          hashtags: string[]
          subtitle_url: string | null
          subtitle_storage_path: string | null
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['content_variants']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['content_variants']['Insert']>
      }
      posts: {
        Row: {
          id: string
          user_id: string
          content_variant_id: string
          platform: string
          connected_account_id: string
          scheduled_at: string | null
          published_at: string | null
          status: 'draft' | 'scheduled' | 'publishing' | 'published' | 'failed'
          platform_post_id: string | null
          platform_post_url: string | null
          error_message: string | null
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['posts']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['posts']['Insert']>
      }
      analytics_snapshots: {
        Row: {
          id: string
          post_id: string
          captured_at: string
          views: number
          likes: number
          comments: number
          shares: number
          saves: number
          reach: number
          impressions: number
          engagement_rate: number
        }
        Insert: Omit<Database['public']['Tables']['analytics_snapshots']['Row'], 'id'>
        Update: Partial<Database['public']['Tables']['analytics_snapshots']['Insert']>
      }
    }
    Views: {}
    Functions: {}
    Enums: {}
  }
}
