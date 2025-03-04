import { Database } from './database.types'

export type Tables = Database['public']['Tables']

// Tipos para Usuários e Autenticação
export interface User {
  id: string
  email: string
  full_name: string
  avatar_url?: string
  role: 'admin' | 'agent' | 'customer'
  created_at: string
  updated_at: string
  last_sign_in_at?: string
  account_id: string
}

export interface UserSettings {
  id: string
  user_id: string
  notification_preferences: {
    email: boolean
    push: boolean
    desktop: boolean
  }
  theme: 'light' | 'dark' | 'system'
  language: string
  created_at: string
  updated_at: string
}

// Tipos para Contas e Organizações
export interface Account {
  id: string
  name: string
  domain?: string
  logo_url?: string
  settings: {
    features: {
      chat: boolean
      email: boolean
      whatsapp: boolean
      facebook: boolean
      twitter: boolean
      instagram: boolean
      telegram: boolean
      slack: boolean
      discord: boolean
    }
    branding: {
      primary_color: string
      secondary_color: string
    }
  }
  created_at: string
  updated_at: string
}

export interface Team {
  id: string
  name: string
  account_id: string
  created_at: string
  updated_at: string
}

export interface TeamMember {
  id: string
  team_id: string
  user_id: string
  role: 'admin' | 'member'
  created_at: string
  updated_at: string
}

// Tipos para Conversas e Mensagens
export interface Conversation {
  id: string
  account_id: string
  inbox_id: string
  contact_id: string
  status: 'open' | 'resolved' | 'pending'
  priority: 'low' | 'medium' | 'high'
  assigned_to?: string
  created_at: string
  updated_at: string
  last_activity_at: string
  source: 'chat' | 'email' | 'whatsapp' | 'facebook' | 'twitter' | 'instagram' | 'telegram' | 'slack' | 'discord'
  metadata: {
    browser?: string
    os?: string
    device?: string
    location?: string
  }
}

export interface Message {
  id: string
  conversation_id: string
  sender_type: 'user' | 'contact'
  sender_id: string
  content: string
  content_type: 'text' | 'image' | 'video' | 'audio' | 'file'
  metadata: {
    file_url?: string
    file_name?: string
    file_size?: number
    file_type?: string
    duration?: number
    width?: number
    height?: number
  }
  created_at: string
  updated_at: string
}

// Tipos para Contatos
export interface Contact {
  id: string
  account_id: string
  email?: string
  phone?: string
  name: string
  avatar_url?: string
  custom_attributes: Record<string, any>
  created_at: string
  updated_at: string
  last_activity_at: string
  metadata: {
    browser?: string
    os?: string
    device?: string
    location?: string
  }
}

// Tipos para Configurações
export interface Inbox {
  id: string
  account_id: string
  name: string
  channel_type: 'chat' | 'email' | 'whatsapp' | 'facebook' | 'twitter' | 'instagram' | 'telegram' | 'slack' | 'discord'
  channel_id?: string
  settings: {
    auto_reply: boolean
    auto_reply_message?: string
    working_hours: {
      enabled: boolean
      schedule: {
        [key: string]: {
          start: string
          end: string
        }
      }
    }
  }
  created_at: string
  updated_at: string
}

// Tipos para Integrações
export interface Integration {
  id: string
  account_id: string
  name: string
  provider: 'whatsapp' | 'facebook' | 'twitter' | 'instagram' | 'telegram' | 'slack' | 'discord'
  settings: Record<string, any>
  status: 'active' | 'inactive' | 'error'
  created_at: string
  updated_at: string
}

// Tipos para Relatórios
export interface Report {
  id: string
  account_id: string
  name: string
  type: 'conversation' | 'agent' | 'contact' | 'custom'
  parameters: Record<string, any>
  schedule?: {
    frequency: 'daily' | 'weekly' | 'monthly'
    day_of_week?: number
    day_of_month?: number
    time: string
  }
  created_at: string
  updated_at: string
}

export interface ReportExecution {
  id: string
  report_id: string
  status: 'pending' | 'running' | 'completed' | 'failed'
  data?: Record<string, any>
  error?: string
  started_at: string
  completed_at?: string
} 