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
          first_name: string | null
          last_name: string | null
          phone: string | null
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
        Insert: {
          id: string
          full_name?: string | null
          first_name?: string | null
          last_name?: string | null
          phone?: string | null
          avatar_url?: string | null
          username?: string | null
          plan?: 'free' | 'creator' | 'pro' | 'brand'
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          uploads_this_month?: number
          ai_credits_used?: number
          onboarding_complete?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          full_name?: string | null
          first_name?: string | null
          last_name?: string | null
          phone?: string | null
          avatar_url?: string | null
          username?: string | null
          plan?: 'free' | 'creator' | 'pro' | 'brand'
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          uploads_this_month?: number
          ai_credits_used?: number
          onboarding_complete?: boolean
          updated_at?: string
        }
        Relationships: []
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
        Insert: {
          id?: string
          user_id: string
          platform: string
          platform_user_id: string
          platform_username?: string | null
          access_token: string
          refresh_token?: string | null
          expires_at?: string | null
          scopes?: string[]
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          platform?: string
          platform_user_id?: string
          platform_username?: string | null
          access_token?: string
          refresh_token?: string | null
          expires_at?: string | null
          scopes?: string[]
          is_active?: boolean
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'connected_accounts_user_id_fkey'
            columns: ['user_id']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          }
        ]
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
        Insert: {
          id?: string
          user_id: string
          type: 'image' | 'video'
          title?: string | null
          original_url: string
          file_size: number
          duration_seconds?: number | null
          width?: number | null
          height?: number | null
          storage_path: string
          status?: 'processing' | 'ready' | 'error'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          type?: 'image' | 'video'
          title?: string | null
          original_url?: string
          file_size?: number
          duration_seconds?: number | null
          width?: number | null
          height?: number | null
          storage_path?: string
          status?: 'processing' | 'ready' | 'error'
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'content_items_user_id_fkey'
            columns: ['user_id']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          }
        ]
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
        Insert: {
          id?: string
          content_item_id: string
          platform: string
          variant_url: string
          storage_path: string
          width: number
          height: number
          file_size: number
          caption?: string | null
          hashtags?: string[]
          subtitle_url?: string | null
          subtitle_storage_path?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          content_item_id?: string
          platform?: string
          variant_url?: string
          storage_path?: string
          width?: number
          height?: number
          file_size?: number
          caption?: string | null
          hashtags?: string[]
          subtitle_url?: string | null
          subtitle_storage_path?: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'content_variants_content_item_id_fkey'
            columns: ['content_item_id']
            isOneToOne: false
            referencedRelation: 'content_items'
            referencedColumns: ['id']
          }
        ]
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
        Insert: {
          id?: string
          user_id: string
          content_variant_id: string
          platform: string
          connected_account_id: string
          scheduled_at?: string | null
          published_at?: string | null
          status?: 'draft' | 'scheduled' | 'publishing' | 'published' | 'failed'
          platform_post_id?: string | null
          platform_post_url?: string | null
          error_message?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          content_variant_id?: string
          platform?: string
          connected_account_id?: string
          scheduled_at?: string | null
          published_at?: string | null
          status?: 'draft' | 'scheduled' | 'publishing' | 'published' | 'failed'
          platform_post_id?: string | null
          platform_post_url?: string | null
          error_message?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'posts_user_id_fkey'
            columns: ['user_id']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'posts_content_variant_id_fkey'
            columns: ['content_variant_id']
            isOneToOne: false
            referencedRelation: 'content_variants'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'posts_connected_account_id_fkey'
            columns: ['connected_account_id']
            isOneToOne: false
            referencedRelation: 'connected_accounts'
            referencedColumns: ['id']
          }
        ]
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
        Insert: {
          id?: string
          post_id: string
          captured_at?: string
          views?: number
          likes?: number
          comments?: number
          shares?: number
          saves?: number
          reach?: number
          impressions?: number
          engagement_rate?: number
        }
        Update: {
          id?: string
          post_id?: string
          captured_at?: string
          views?: number
          likes?: number
          comments?: number
          shares?: number
          saves?: number
          reach?: number
          impressions?: number
          engagement_rate?: number
        }
        Relationships: [
          {
            foreignKeyName: 'analytics_snapshots_post_id_fkey'
            columns: ['post_id']
            isOneToOne: false
            referencedRelation: 'posts'
            referencedColumns: ['id']
          }
        ]
      }
    }
    Views: { [_ in never]: never }
    Functions: {
      increment_uploads: {
        Args: { user_id: string }
        Returns: undefined
      }
    }
    Enums: { [_ in never]: never }
    CompositeTypes: { [_ in never]: never }
  }
}
