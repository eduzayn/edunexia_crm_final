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
          email: string
          full_name: string
          avatar_url: string | null
          role: 'admin' | 'agent' | 'customer'
          created_at: string
          updated_at: string
          last_sign_in_at: string | null
          account_id: string
        }
        Insert: {
          id?: string
          email: string
          full_name: string
          avatar_url?: string | null
          role?: 'admin' | 'agent' | 'customer'
          created_at?: string
          updated_at?: string
          last_sign_in_at?: string | null
          account_id: string
        }
        Update: {
          id?: string
          email?: string
          full_name?: string
          avatar_url?: string | null
          role?: 'admin' | 'agent' | 'customer'
          created_at?: string
          updated_at?: string
          last_sign_in_at?: string | null
          account_id?: string
        }
      }
      user_settings: {
        Row: {
          id: string
          user_id: string
          notification_preferences: Json
          theme: 'light' | 'dark' | 'system'
          language: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          notification_preferences?: Json
          theme?: 'light' | 'dark' | 'system'
          language?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          notification_preferences?: Json
          theme?: 'light' | 'dark' | 'system'
          language?: string
          created_at?: string
          updated_at?: string
        }
      }
      accounts: {
        Row: {
          id: string
          name: string
          domain: string | null
          logo_url: string | null
          settings: Json
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          domain?: string | null
          logo_url?: string | null
          settings?: Json
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          domain?: string | null
          logo_url?: string | null
          settings?: Json
          created_at?: string
          updated_at?: string
        }
      }
      teams: {
        Row: {
          id: string
          name: string
          account_id: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          account_id: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          account_id?: string
          created_at?: string
          updated_at?: string
        }
      }
      team_members: {
        Row: {
          id: string
          team_id: string
          user_id: string
          role: 'admin' | 'member'
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          team_id: string
          user_id: string
          role?: 'admin' | 'member'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          team_id?: string
          user_id?: string
          role?: 'admin' | 'member'
          created_at?: string
          updated_at?: string
        }
      }
      conversations: {
        Row: {
          id: string
          account_id: string
          inbox_id: string
          contact_id: string
          status: 'open' | 'resolved' | 'pending'
          priority: 'low' | 'medium' | 'high'
          assigned_to: string | null
          created_at: string
          updated_at: string
          last_activity_at: string
          source: 'chat' | 'email' | 'whatsapp' | 'facebook' | 'twitter' | 'instagram' | 'telegram' | 'slack' | 'discord'
          metadata: Json
        }
        Insert: {
          id?: string
          account_id: string
          inbox_id: string
          contact_id: string
          status?: 'open' | 'resolved' | 'pending'
          priority?: 'low' | 'medium' | 'high'
          assigned_to?: string | null
          created_at?: string
          updated_at?: string
          last_activity_at?: string
          source?: 'chat' | 'email' | 'whatsapp' | 'facebook' | 'twitter' | 'instagram' | 'telegram' | 'slack' | 'discord'
          metadata?: Json
        }
        Update: {
          id?: string
          account_id?: string
          inbox_id?: string
          contact_id?: string
          status?: 'open' | 'resolved' | 'pending'
          priority?: 'low' | 'medium' | 'high'
          assigned_to?: string | null
          created_at?: string
          updated_at?: string
          last_activity_at?: string
          source?: 'chat' | 'email' | 'whatsapp' | 'facebook' | 'twitter' | 'instagram' | 'telegram' | 'slack' | 'discord'
          metadata?: Json
        }
      }
      messages: {
        Row: {
          id: string
          conversation_id: string
          sender_type: 'user' | 'contact'
          sender_id: string
          content: string
          content_type: 'text' | 'image' | 'video' | 'audio' | 'file'
          metadata: Json
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          conversation_id: string
          sender_type: 'user' | 'contact'
          sender_id: string
          content: string
          content_type: 'text' | 'image' | 'video' | 'audio' | 'file'
          metadata?: Json
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          conversation_id?: string
          sender_type?: 'user' | 'contact'
          sender_id?: string
          content?: string
          content_type?: 'text' | 'image' | 'video' | 'audio' | 'file'
          metadata?: Json
          created_at?: string
          updated_at?: string
        }
      }
      contacts: {
        Row: {
          id: string
          account_id: string
          email: string | null
          phone: string | null
          name: string
          avatar_url: string | null
          custom_attributes: Json
          created_at: string
          updated_at: string
          last_activity_at: string
          metadata: Json
        }
        Insert: {
          id?: string
          account_id: string
          email?: string | null
          phone?: string | null
          name: string
          avatar_url?: string | null
          custom_attributes?: Json
          created_at?: string
          updated_at?: string
          last_activity_at?: string
          metadata?: Json
        }
        Update: {
          id?: string
          account_id?: string
          email?: string | null
          phone?: string | null
          name?: string
          avatar_url?: string | null
          custom_attributes?: Json
          created_at?: string
          updated_at?: string
          last_activity_at?: string
          metadata?: Json
        }
      }
      inboxes: {
        Row: {
          id: string
          account_id: string
          name: string
          channel_type: 'chat' | 'email' | 'whatsapp' | 'facebook' | 'twitter' | 'instagram' | 'telegram' | 'slack' | 'discord'
          channel_id: string | null
          settings: Json
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          account_id: string
          name: string
          channel_type: 'chat' | 'email' | 'whatsapp' | 'facebook' | 'twitter' | 'instagram' | 'telegram' | 'slack' | 'discord'
          channel_id?: string | null
          settings?: Json
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          account_id?: string
          name?: string
          channel_type?: 'chat' | 'email' | 'whatsapp' | 'facebook' | 'twitter' | 'instagram' | 'telegram' | 'slack' | 'discord'
          channel_id?: string | null
          settings?: Json
          created_at?: string
          updated_at?: string
        }
      }
      integrations: {
        Row: {
          id: string
          account_id: string
          name: string
          provider: 'whatsapp' | 'facebook' | 'twitter' | 'instagram' | 'telegram' | 'slack' | 'discord'
          settings: Json
          status: 'active' | 'inactive' | 'error'
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          account_id: string
          name: string
          provider: 'whatsapp' | 'facebook' | 'twitter' | 'instagram' | 'telegram' | 'slack' | 'discord'
          settings?: Json
          status?: 'active' | 'inactive' | 'error'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          account_id?: string
          name?: string
          provider?: 'whatsapp' | 'facebook' | 'twitter' | 'instagram' | 'telegram' | 'slack' | 'discord'
          settings?: Json
          status?: 'active' | 'inactive' | 'error'
          created_at?: string
          updated_at?: string
        }
      }
      reports: {
        Row: {
          id: string
          account_id: string
          name: string
          type: 'conversation' | 'agent' | 'contact' | 'custom'
          parameters: Json
          schedule: Json | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          account_id: string
          name: string
          type: 'conversation' | 'agent' | 'contact' | 'custom'
          parameters?: Json
          schedule?: Json | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          account_id?: string
          name?: string
          type?: 'conversation' | 'agent' | 'contact' | 'custom'
          parameters?: Json
          schedule?: Json | null
          created_at?: string
          updated_at?: string
        }
      }
      report_executions: {
        Row: {
          id: string
          report_id: string
          status: 'pending' | 'running' | 'completed' | 'failed'
          data: Json | null
          error: string | null
          started_at: string
          completed_at: string | null
        }
        Insert: {
          id?: string
          report_id: string
          status?: 'pending' | 'running' | 'completed' | 'failed'
          data?: Json | null
          error?: string | null
          started_at?: string
          completed_at?: string | null
        }
        Update: {
          id?: string
          report_id?: string
          status?: 'pending' | 'running' | 'completed' | 'failed'
          data?: Json | null
          error?: string | null
          started_at?: string
          completed_at?: string | null
        }
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