// Database types for OmniaHouse

export interface Organization {
  id: string
  name: string
  slug: string
  owner_id: string | null
  settings: Record<string, unknown>
  created_at: string
}

export interface Customer {
  id: string
  org_id: string
  external_id: string | null
  email: string | null
  phone: string | null
  first_name: string | null
  last_name: string | null
  company: string | null
  address_line1: string | null
  address_line2: string | null
  city: string | null
  state: string | null
  postal_code: string | null
  country: string
  tags: string[] | null
  total_orders: number
  total_spent: number
  notes: string | null
  metadata: Record<string, unknown>
  created_at: string
  updated_at: string
}

export interface Conversation {
  id: string
  org_id: string
  customer_id: string | null
  channel: 'whatsapp' | 'email' | 'sms' | 'chat' | 'phone'
  channel_id: string | null
  status: 'open' | 'pending' | 'resolved' | 'closed'
  assigned_to: string | null
  subject: string | null
  last_message_at: string | null
  last_message_preview: string | null
  unread_count: number
  tags: string[] | null
  metadata: Record<string, unknown>
  created_at: string
  updated_at: string
  // Joined relations
  customer?: Customer
  messages?: Message[]
}

export interface Message {
  id: string
  conversation_id: string
  sender_type: 'customer' | 'agent' | 'system' | 'bot'
  sender_id: string | null
  content: string | null
  content_type: 'text' | 'image' | 'video' | 'audio' | 'document' | 'location' | 'template'
  media_url: string | null
  media_mime_type: string | null
  external_id: string | null
  status: 'pending' | 'sent' | 'delivered' | 'read' | 'failed'
  error_message: string | null
  metadata: Record<string, unknown>
  created_at: string
}

export interface WhatsAppTemplate {
  id: string
  org_id: string
  name: string
  language: string
  category: 'marketing' | 'utility' | 'authentication' | null
  status: 'pending' | 'approved' | 'rejected'
  header_type: 'text' | 'image' | 'video' | 'document' | null
  header_content: string | null
  body_text: string
  footer_text: string | null
  buttons: unknown[] | null
  external_id: string | null
  created_at: string
  updated_at: string
}

export interface Agent {
  id: string
  org_id: string
  agent_id: string
  name: string
  role: string | null
  avatar_url: string | null
  status: 'active' | 'idle' | 'offline' | 'busy'
  level: number
  xp: number
  skills: string[] | null
  performance_score: number
  tasks_completed: number
  settings: Record<string, unknown>
  last_active_at: string | null
  created_at: string
  updated_at: string
}

export interface Order {
  id: string
  org_id: string
  store_id: string | null
  customer_id: string | null
  external_id: string | null
  order_number: string | null
  status: 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled' | 'refunded'
  payment_status: 'pending' | 'paid' | 'partially_paid' | 'refunded' | 'failed'
  fulfillment_status: 'unfulfilled' | 'partial' | 'fulfilled'
  subtotal: number
  discount_total: number
  shipping_total: number
  tax_total: number
  total: number
  currency: string
  shipping_address: Record<string, unknown> | null
  billing_address: Record<string, unknown> | null
  notes: string | null
  internal_notes: string | null
  tags: string[] | null
  metadata: Record<string, unknown>
  placed_at: string | null
  shipped_at: string | null
  delivered_at: string | null
  created_at: string
  updated_at: string
  // Joined
  customer?: Customer
}
