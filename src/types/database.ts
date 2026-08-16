export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          email: string;
          full_name: string | null;
          avatar_url: string | null;
          role: 'user' | 'admin';
          subscription_status: 'free' | 'active' | 'cancelled' | 'expired';
          subscription_plan: string | null;
          subscription_end: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email: string;
          full_name?: string | null;
          avatar_url?: string | null;
          role?: 'user' | 'admin';
          subscription_status?: 'free' | 'active' | 'cancelled' | 'expired';
          subscription_plan?: string | null;
          subscription_end?: string | null;
        };
        Update: Partial<Database['public']['Tables']['profiles']['Insert']>;
        Relationships: [];
      };
      content: {
        Row: {
          id: string;
          title: string;
          slug: string;
          description: string;
          type: 'movie' | 'series';
          genre_ids: string[];
          release_year: number;
          rating: string | null;
          duration: number | null;
          thumbnail_url: string | null;
          poster_url: string | null;
          backdrop_url: string | null;
          trailer_url: string | null;
          cloudflare_video_id: string | null;
          subtitle_url: string | null;
          completion_count: number;
          is_featured: boolean;
          is_published: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          title: string;
          slug: string;
          description: string;
          type: 'movie' | 'series';
          genre_ids?: string[];
          release_year: number;
          rating?: string | null;
          duration?: number | null;
          thumbnail_url?: string | null;
          poster_url?: string | null;
          backdrop_url?: string | null;
          trailer_url?: string | null;
          cloudflare_video_id?: string | null;
          subtitle_url?: string | null;
          is_featured?: boolean;
          is_published?: boolean;
        };
        Update: Partial<Database['public']['Tables']['content']['Insert']>;
        Relationships: [];
      };
      seasons: {
        Row: {
          id: string;
          content_id: string;
          season_number: number;
          title: string;
          description: string | null;
          poster_url: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          content_id: string;
          season_number: number;
          title: string;
          description?: string | null;
          poster_url?: string | null;
        };
        Update: Partial<Database['public']['Tables']['seasons']['Insert']>;
        Relationships: [];
      };
      episodes: {
        Row: {
          id: string;
          season_id: string;
          content_id: string;
          episode_number: number;
          title: string;
          description: string | null;
          duration: number;
          thumbnail_url: string | null;
          cloudflare_video_id: string;
          subtitle_url: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          season_id: string;
          content_id: string;
          episode_number: number;
          title: string;
          description?: string | null;
          duration: number;
          thumbnail_url?: string | null;
          cloudflare_video_id: string;
          subtitle_url?: string | null;
        };
        Update: Partial<Database['public']['Tables']['episodes']['Insert']>;
        Relationships: [];
      };
      genres: {
        Row: {
          id: string;
          name: string;
          slug: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          slug: string;
        };
        Update: Partial<Database['public']['Tables']['genres']['Insert']>;
        Relationships: [];
      };
      watch_history: {
        Row: {
          id: string;
          user_id: string;
          content_id: string;
          episode_id: string | null;
          progress: number;
          duration: number;
          completed: boolean;
          watched_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          content_id: string;
          episode_id?: string | null;
          progress: number;
          duration: number;
          completed?: boolean;
        };
        Update: Partial<Database['public']['Tables']['watch_history']['Insert']>;
        Relationships: [];
      };
      my_list: {
        Row: {
          id: string;
          user_id: string;
          content_id: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          content_id: string;
        };
        Update: Partial<Database['public']['Tables']['my_list']['Insert']>;
        Relationships: [];
      };
      subscription_plans: {
        Row: {
          id: string;
          name: string;
          slug: string;
          price: number;
          currency: string;
          interval: 'month' | 'year';
          features: string[];
          max_screens: number;
          max_quality: string;
          download_allowed: boolean;
          is_active: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          slug: string;
          price: number;
          currency?: string;
          interval: 'month' | 'year';
          features?: string[];
          max_screens?: number;
          max_quality?: string;
          download_allowed?: boolean;
          is_active?: boolean;
        };
        Update: Partial<Database['public']['Tables']['subscription_plans']['Insert']>;
        Relationships: [];
      };
      push_subscriptions: {
        Row: {
          id: string;
          user_id: string;
          endpoint: string;
          keys: Json;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          endpoint: string;
          keys: Json;
        };
        Update: Partial<Database['public']['Tables']['push_subscriptions']['Insert']>;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
  };
}

export type Profile = Database['public']['Tables']['profiles']['Row'];
export type Content = Database['public']['Tables']['content']['Row'];
export type Season = Database['public']['Tables']['seasons']['Row'];
export type Episode = Database['public']['Tables']['episodes']['Row'];
export type Genre = Database['public']['Tables']['genres']['Row'];
export type WatchHistory = Database['public']['Tables']['watch_history']['Row'];
export type MyListItem = Database['public']['Tables']['my_list']['Row'];
export type SubscriptionPlan = Database['public']['Tables']['subscription_plans']['Row'];
