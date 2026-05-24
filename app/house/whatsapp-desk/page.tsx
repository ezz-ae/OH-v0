'use client';

import type React from 'react';
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { 
  ArrowLeft, Send, Mic, Phone, Video, Search, User, 
  Image as ImageIcon, Check, CheckCheck, Paperclip, Smile, X, Play, Pause,
  ShoppingCart, Sparkles, AlertTriangle, TrendingUp,
  CheckCircle, XCircle, Gift, History, Target, Megaphone, ClipboardList,
  ShieldCheck, UserCheck, Tags, Route, FileCheck, WalletCards,
  RefreshCw, Languages, Settings2, MessageSquare
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { getSession } from '@/lib/session';
import { createClient } from '@/lib/supabase/client';
import {
  WHATSAPP_AUTOMATIONS,
  WHATSAPP_BROADCASTS,
  WHATSAPP_CATALOG_ACTIONS,
  WHATSAPP_COMMAND_CENTER,
  WHATSAPP_LABELS,
  WHATSAPP_OPTIONS,
  WHATSAPP_QUALITY_CHECKS,
  WHATSAPP_TEAM_LOAD,
  getMockTableData,
} from '@/lib/operations-intelligence';

type WhatsAppTool = 'inbox' | 'sales' | 'catalog' | 'labels' | 'templates' | 'broadcasts' | 'automation' | 'quality' | 'team' | 'finance';

interface Customer {
  id: string;
  first_name: string;
  last_name: string;
  phone: string;
  city: string;
  total_orders: number;
  total_spent: number;
}

interface Conversation {
  id: string;
  customer_id: string;
  channel_id: string;
  status: 'open' | 'pending' | 'resolved' | 'closed';
  last_message_at: string;
  last_message_preview: string;
  unread_count: number;
  tags: string[];
  customer?: Customer;
}

interface Message {
  id: string;
  conversation_id: string;
  sender_type: 'customer' | 'agent' | 'system' | 'bot';
  content: string | null;
  content_type: 'text' | 'image' | 'audio' | 'video' | 'document';
  media_url: string | null;
  metadata: { duration_seconds?: number } | null;
  status: 'pending' | 'sent' | 'delivered' | 'read' | 'failed';
  created_at: string;
}

interface OrderIntent {
  id: string;
  conversation_id: string;
  confidence: number;
  status: 'pending' | 'confirmed' | 'converted' | 'rejected';
  extracted_items: { sku: string; title: string; price: number; quantity: number }[];
  extracted_total: number;
  ai_summary: string;
  created_at: string;
}

interface GhostCart {
  id: string;
  customer_id: string;
  status: 'active' | 'abandoned' | 'recovered' | 'converted';
  items: { sku: string; title: string; price: number; quantity: number }[];
  subtotal: number;
  source: string;
  abandonment_reason: string;
  created_at: string;
}

interface CrossSellOpportunity {
  id: string;
  recommendation_type: 'cross_sell' | 'upsell' | 'bundle' | 'recovery';
  reason: string;
  confidence: number;
  potential_value: number;
  status: string;
}

export default function WhatsAppDeskPage() {
  const router = useRouter();
  const session = getSession();
  const supabase = createClient();
  
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [filter, setFilter] = useState<'all' | 'unread' | 'pending'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTool, setActiveTool] = useState<WhatsAppTool>('inbox');
  
  const [orderIntent, setOrderIntent] = useState<OrderIntent | null>(null);
  const [ghostCarts, setGhostCarts] = useState<GhostCart[]>([]);
  const [crossSellOpps, setCrossSellOpps] = useState<CrossSellOpportunity[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [showOrderPanel, setShowOrderPanel] = useState(true);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const recordingInterval = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    async function fetchConversations() {
      setIsLoading(true);
      const { data } = await supabase
        .from('conversations')
        .select('*, customer:customers(id, first_name, last_name, phone, city, total_orders, total_spent)')
        .eq('channel', 'whatsapp')
        .eq('org_id', '00000000-0000-0000-0000-000000000001')
        .order('last_message_at', { ascending: false });
      
      if (data) {
        setConversations(data as Conversation[]);
        if (data.length > 0 && !selectedConversation) {
          setSelectedConversation(data[0] as Conversation);
        }
      }
      setIsLoading(false);
    }
    fetchConversations();
  }, []);

  useEffect(() => {
    if (!selectedConversation) return;
    
    async function fetchData() {
      const { data: msgs } = await supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', selectedConversation.id)
        .order('created_at', { ascending: true });
      if (msgs) setMessages(msgs as Message[]);

      const { data: intentData } = await supabase
        .from('conversation_order_intents')
        .select('*')
        .eq('conversation_id', selectedConversation.id)
        .eq('status', 'pending')
        .order('created_at', { ascending: false })
        .limit(1);
      setOrderIntent(intentData?.[0] as OrderIntent || null);

      if (selectedConversation.customer_id) {
        const { data: cartsData } = await supabase
          .from('ghost_carts')
          .select('*')
          .eq('customer_id', selectedConversation.customer_id)
          .in('status', ['abandoned', 'active'])
          .order('created_at', { ascending: false })
          .limit(3);
        setGhostCarts(cartsData as GhostCart[] || []);

        const { data: crossSellData } = await supabase
          .from('cross_sell_opportunities')
          .select('*')
          .eq('customer_id', selectedConversation.customer_id)
          .eq('status', 'pending')
          .order('confidence', { ascending: false })
          .limit(3);
        setCrossSellOpps(crossSellData as CrossSellOpportunity[] || []);
      }
    }
    fetchData();
  }, [selectedConversation]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const filteredConversations = conversations.filter(conv => {
    if (filter === 'unread' && conv.unread_count === 0) return false;
    if (filter === 'pending' && conv.status !== 'pending') return false;
    if (searchQuery) {
      const customer = conv.customer;
      if (!customer) return false;
      const fullName = `${customer.first_name} ${customer.last_name}`.toLowerCase();
      return fullName.includes(searchQuery.toLowerCase()) || customer.phone.includes(searchQuery);
    }
    return true;
  });

  async function analyzeConversation() {
    if (!selectedConversation) return;
    setIsAnalyzing(true);
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    const { data } = await supabase
      .from('conversation_order_intents')
      .insert({
        org_id: '00000000-0000-0000-0000-000000000001',
        conversation_id: selectedConversation.id,
        customer_id: selectedConversation.customer_id,
        confidence: 0.85,
        status: 'pending',
        extracted_items: [{ sku: 'OMN-PF-001', title: 'Oud Royal Perfume 100ml', price: 450, quantity: 1 }],
        extracted_total: 450,
        ai_summary: 'Customer interested in Oud Royal Perfume. Mentioned delivery timing as primary concern.',
      })
      .select()
      .single();
    
    if (data) setOrderIntent(data as OrderIntent);
    setIsAnalyzing(false);
  }

  async function convertToOrder() {
    if (!orderIntent || !selectedConversation?.customer) return;
    
    const { data: orderData, error } = await supabase
      .from('orders')
      .insert({
        org_id: '00000000-0000-0000-0000-000000000001',
        customer_id: selectedConversation.customer_id,
        order_number: `OMN-${Date.now().toString(36).toUpperCase()}`,
        status: 'pending',
        payment_status: 'pending',
        subtotal: orderIntent.extracted_total,
        total: orderIntent.extracted_total,
        currency: 'AED',
        notes: `WhatsApp order. ${orderIntent.ai_summary}`,
        placed_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error || !orderData) return;

    for (const item of orderIntent.extracted_items) {
      await supabase.from('order_items').insert({
        order_id: orderData.id,
        sku: item.sku,
        title: item.title,
        quantity: item.quantity,
        unit_price: item.price,
        total: item.price * item.quantity,
      });
    }

    await supabase.from('finance_verifications').insert({
      org_id: '00000000-0000-0000-0000-000000000001',
      order_id: orderData.id,
      conversation_id: selectedConversation.id,
      verification_type: 'payment',
      status: 'pending',
      priority: orderIntent.extracted_total > 500 ? 'high' : 'normal',
      amount: orderIntent.extracted_total,
      currency: 'AED',
      notes: 'WhatsApp order - awaiting payment confirmation',
    });

    await supabase
      .from('conversation_order_intents')
      .update({ status: 'converted', converted_order_id: orderData.id })
      .eq('id', orderIntent.id);

    const confirmMsg = `Order #${orderData.order_number} created!\n\nItems:\n${orderIntent.extracted_items.map(i => `- ${i.title} x${i.quantity}: AED ${i.price}`).join('\n')}\n\nTotal: AED ${orderIntent.extracted_total}\n\nSent to finance for verification.`;
    
    await supabase.from('messages').insert({
      conversation_id: selectedConversation.id,
      sender_type: 'agent',
      content: confirmMsg,
      content_type: 'text',
      status: 'sent',
    });

    setOrderIntent(null);
    const { data: msgs } = await supabase.from('messages').select('*').eq('conversation_id', selectedConversation.id).order('created_at', { ascending: true });
    if (msgs) setMessages(msgs as Message[]);
  }

  async function recoverGhostCart(cart: GhostCart) {
    await supabase.from('ghost_carts').update({ status: 'recovered', recovery_attempts: 1 }).eq('id', cart.id);
    const items = cart.items.map(i => `- ${i.title} (AED ${i.price})`).join('\n');
    await supabase.from('messages').insert({
      conversation_id: selectedConversation?.id,
      sender_type: 'agent',
      content: `Hi! I noticed you were interested in:\n\n${items}\n\nTotal: AED ${cart.subtotal}\n\nWould you like me to complete this order? Free delivery today!`,
      content_type: 'text',
      status: 'sent',
    });
    setGhostCarts(prev => prev.filter(c => c.id !== cart.id));
    const { data: msgs } = await supabase.from('messages').select('*').eq('conversation_id', selectedConversation?.id).order('created_at', { ascending: true });
    if (msgs) setMessages(msgs as Message[]);
  }

  async function sendMessage() {
    if (!newMessage.trim() || !selectedConversation) return;
    const { data } = await supabase.from('messages').insert({
      conversation_id: selectedConversation.id,
      sender_type: 'agent',
      content: newMessage,
      content_type: 'text',
      status: 'sent',
    }).select().single();
    if (data) {
      setMessages([...messages, data as Message]);
      setNewMessage('');
    }
  }

  function startRecording() {
    setIsRecording(true);
    setRecordingTime(0);
    recordingInterval.current = setInterval(() => setRecordingTime(t => t + 1), 1000);
  }

  async function stopRecording() {
    setIsRecording(false);
    if (recordingInterval.current) clearInterval(recordingInterval.current);
    if (!selectedConversation) return;
    const { data } = await supabase.from('messages').insert({
      conversation_id: selectedConversation.id,
      sender_type: 'agent',
      content: null,
      content_type: 'audio',
      media_url: 'https://example.com/voice/reply.ogg',
      metadata: { duration_seconds: recordingTime },
      status: 'sent',
    }).select().single();
    if (data) { setMessages([...messages, data as Message]); setRecordingTime(0); }
  }

  const formatTime = (s: number) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}`;
  const formatRelativeTime = (d: string) => {
    const diff = Date.now() - new Date(d).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `${mins}m`;
    if (mins < 1440) return `${Math.floor(mins / 60)}h`;
    return `${Math.floor(mins / 1440)}d`;
  };

  const stats = {
    unclaimed: conversations.filter(c => c.status === 'pending').length,
    open: conversations.filter(c => c.status === 'open').length,
    resolved: conversations.filter(c => c.status === 'resolved').length,
  };
  const whatsappTemplates = getMockTableData('whatsapp_templates');
  const financeQueue = getMockTableData('finance_verifications');
  const globalGhostCarts = getMockTableData('ghost_carts');
  const globalCrossSell = getMockTableData('cross_sell_opportunities');

  return (
    <div className="h-screen bg-background text-foreground flex flex-col">
      <header className="border-b border-border bg-card/50 backdrop-blur-sm shrink-0">
        <div className="px-4 py-3 flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.push('/house')}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex-1">
            <h1 className="text-lg font-serif font-medium">WhatsApp Desk</h1>
            <p className="text-xs text-muted-foreground">{stats.unclaimed} unclaimed · {stats.open} open · {stats.resolved} resolved</p>
          </div>
          <Badge variant="secondary" className="text-xs">{session.user.name}</Badge>
        </div>
      </header>

      <WhatsAppCommandBar
        activeTool={activeTool}
        setActiveTool={setActiveTool}
        conversations={conversations}
      />

      {activeTool === 'inbox' ? (
      <div className="flex-1 flex overflow-hidden">
        <div className="w-80 border-r border-border flex flex-col bg-card/30">
          <div className="p-3 border-b border-border space-y-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input placeholder="Search..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-9 h-9 text-sm" />
            </div>
            <div className="flex gap-1">
              {(['all', 'unread', 'pending'] as const).map((f) => (
                <Button key={f} variant={filter === f ? 'default' : 'ghost'} size="sm" className="text-xs h-7 flex-1" onClick={() => setFilter(f)}>
                  {f === 'all' ? 'All' : f === 'unread' ? 'Unread' : 'Pending'}
                </Button>
              ))}
            </div>
          </div>
          <div className="flex-1 overflow-y-auto">
            {isLoading ? <div className="p-4 text-center text-muted-foreground text-sm">Loading...</div> : 
             filteredConversations.length === 0 ? <div className="p-4 text-center text-muted-foreground text-sm">No conversations</div> : 
             filteredConversations.map((conv) => (
              <button key={conv.id} onClick={() => setSelectedConversation(conv)} className={cn('w-full p-3 text-left border-b border-border/50 hover:bg-muted/50 transition-colors', selectedConversation?.id === conv.id && 'bg-muted')}>
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center shrink-0"><User className="w-5 h-5 text-primary" /></div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-medium text-sm truncate">{conv.customer?.first_name} {conv.customer?.last_name}</span>
                      <span className="text-xs text-muted-foreground shrink-0">{formatRelativeTime(conv.last_message_at)}</span>
                    </div>
                    <p className="text-xs text-muted-foreground truncate mt-0.5">{conv.last_message_preview}</p>
                    <div className="flex items-center gap-1.5 mt-1.5">
                      {conv.unread_count > 0 && <Badge className="h-4 px-1.5 text-[10px]">{conv.unread_count}</Badge>}
                      {conv.tags?.slice(0, 2).map((tag) => <Badge key={tag} variant="outline" className="h-4 px-1.5 text-[10px]">{tag}</Badge>)}
                    </div>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {selectedConversation ? (
          <div className="flex-1 flex flex-col">
            <div className="px-4 py-3 border-b border-border flex items-center gap-3 bg-card/30">
              <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center"><User className="w-5 h-5 text-primary" /></div>
              <div className="flex-1">
                <h2 className="font-medium">{selectedConversation.customer?.first_name} {selectedConversation.customer?.last_name}</h2>
                <p className="text-xs text-muted-foreground">{selectedConversation.channel_id} · {selectedConversation.customer?.city}</p>
              </div>
              <Button variant="outline" size="sm" className="h-8 gap-1.5" onClick={analyzeConversation} disabled={isAnalyzing}>
                <Sparkles className="w-3.5 h-3.5" />{isAnalyzing ? 'Analyzing...' : 'Detect Order'}
              </Button>
              <Button variant="ghost" size="icon" className="h-8 w-8"><Phone className="w-4 h-4" /></Button>
              <Button variant="ghost" size="icon" className="h-8 w-8"><Video className="w-4 h-4" /></Button>
            </div>

            {(orderIntent || ghostCarts.length > 0 || crossSellOpps.length > 0) && showOrderPanel && (
              <div className="border-b border-border bg-gradient-to-r from-primary/5 to-amber-500/5 p-3">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2"><Sparkles className="w-4 h-4 text-primary" /><span className="text-sm font-medium">Sales Intelligence</span></div>
                  <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setShowOrderPanel(false)}><X className="w-3 h-3" /></Button>
                </div>
                <div className="space-y-2">
                  {orderIntent && (
                    <Card className="p-3 bg-card/80 border-primary/20">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <ShoppingCart className="w-4 h-4 text-primary" /><span className="text-sm font-medium">Order Detected</span>
                          <Badge variant="secondary" className="text-[10px]">{Math.round(orderIntent.confidence * 100)}%</Badge>
                        </div>
                        <span className="text-lg font-bold text-primary">AED {orderIntent.extracted_total}</span>
                      </div>
                      <p className="text-xs text-muted-foreground mb-2">{orderIntent.ai_summary}</p>
                      <div className="space-y-1 mb-3">
                        {orderIntent.extracted_items.map((item, i) => (
                          <div key={i} className="flex items-center justify-between text-xs">
                            <span>{item.title} x{item.quantity}</span><span className="font-medium">AED {item.price}</span>
                          </div>
                        ))}
                      </div>
                      <div className="flex gap-2">
                        <Button size="sm" className="flex-1 h-8" onClick={convertToOrder}><CheckCircle className="w-3.5 h-3.5 mr-1.5" />Create Order</Button>
                        <Button size="sm" variant="outline" className="h-8" onClick={() => { supabase.from('conversation_order_intents').update({ status: 'rejected' }).eq('id', orderIntent.id); setOrderIntent(null); }}><XCircle className="w-3.5 h-3.5" /></Button>
                      </div>
                    </Card>
                  )}
                  {ghostCarts.length > 0 && (
                    <Card className="p-3 bg-card/80 border-amber-500/20">
                      <div className="flex items-center gap-2 mb-2"><AlertTriangle className="w-4 h-4 text-amber-500" /><span className="text-sm font-medium">Abandoned Carts ({ghostCarts.length})</span></div>
                      {ghostCarts.slice(0, 2).map((cart) => (
                        <div key={cart.id} className="flex items-center justify-between py-1.5 border-t border-border/50">
                          <div className="flex-1 min-w-0">
                            <p className="text-xs truncate">{cart.items[0]?.title}</p>
                            <p className="text-[10px] text-muted-foreground">AED {cart.subtotal} · {formatRelativeTime(cart.created_at)}</p>
                          </div>
                          <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => recoverGhostCart(cart)}><Gift className="w-3 h-3 mr-1" />Recover</Button>
                        </div>
                      ))}
                    </Card>
                  )}
                  {crossSellOpps.length > 0 && (
                    <Card className="p-3 bg-card/80 border-green-500/20">
                      <div className="flex items-center gap-2 mb-2"><TrendingUp className="w-4 h-4 text-green-500" /><span className="text-sm font-medium">Cross-Sell</span></div>
                      {crossSellOpps.slice(0, 2).map((opp) => (
                        <div key={opp.id} className="flex items-center justify-between py-1.5 border-t border-border/50">
                          <div className="flex-1 min-w-0">
                            <p className="text-xs">{opp.reason}</p>
                            <p className="text-[10px] text-muted-foreground">+AED {opp.potential_value}</p>
                          </div>
                          <Badge variant="outline" className="text-[10px]">{opp.recommendation_type}</Badge>
                        </div>
                      ))}
                    </Card>
                  )}
                </div>
              </div>
            )}

            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {messages.map((msg) => <MessageBubble key={msg.id} message={msg} />)}
              <div ref={messagesEndRef} />
            </div>

            <div className="p-3 border-t border-border bg-card/50">
              {isRecording ? (
                <div className="flex items-center gap-3 bg-destructive/10 rounded-lg px-4 py-3">
                  <div className="w-3 h-3 rounded-full bg-destructive animate-pulse" />
                  <span className="text-sm font-mono flex-1">{formatTime(recordingTime)}</span>
                  <Button variant="ghost" size="icon" onClick={() => { setIsRecording(false); setRecordingTime(0); }}><X className="w-4 h-4" /></Button>
                  <Button variant="default" size="icon" onClick={stopRecording}><Send className="w-4 h-4" /></Button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="icon" className="shrink-0"><Smile className="w-5 h-5" /></Button>
                  <Button variant="ghost" size="icon" className="shrink-0"><Paperclip className="w-5 h-5" /></Button>
                  <Input placeholder="Type a message..." value={newMessage} onChange={(e) => setNewMessage(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && sendMessage()} className="flex-1" />
                  {newMessage.trim() ? <Button size="icon" onClick={sendMessage}><Send className="w-4 h-4" /></Button> : <Button size="icon" variant="secondary" onClick={startRecording}><Mic className="w-4 h-4" /></Button>}
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center text-muted-foreground">Select a conversation</div>
        )}

        {selectedConversation?.customer && (
          <div className="w-80 border-l border-border bg-card/30 flex flex-col overflow-hidden hidden lg:flex">
            <div className="p-4 text-center border-b border-border">
              <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center mx-auto mb-3"><User className="w-8 h-8 text-primary" /></div>
              <h3 className="font-medium">{selectedConversation.customer.first_name} {selectedConversation.customer.last_name}</h3>
              <p className="text-sm text-muted-foreground">{selectedConversation.customer.phone}</p>
              {selectedConversation.customer.total_spent > 2000 && <Badge className="mt-2 bg-amber-500/20 text-amber-600 border-amber-500/30">VIP Customer</Badge>}
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <Card className="p-3 bg-muted/30"><p className="text-[10px] text-muted-foreground uppercase">Orders</p><p className="text-xl font-bold">{selectedConversation.customer.total_orders}</p></Card>
                <Card className="p-3 bg-muted/30"><p className="text-[10px] text-muted-foreground uppercase">LTV</p><p className="text-xl font-bold"><span className="text-sm font-normal">AED</span> {selectedConversation.customer.total_spent?.toLocaleString()}</p></Card>
              </div>
              <Card className="p-3 bg-muted/30"><p className="text-[10px] text-muted-foreground uppercase mb-1">Location</p><p className="text-sm font-medium">{selectedConversation.customer.city}, UAE</p></Card>
              {ghostCarts.length > 0 && (
                <Card className="p-3 bg-amber-500/5 border-amber-500/20">
                  <div className="flex items-center gap-2 mb-2"><History className="w-4 h-4 text-amber-500" /><p className="text-xs font-medium">Cart History</p></div>
                  {ghostCarts.map((cart) => (
                    <div key={cart.id} className="text-xs py-1">
                      <div className="flex justify-between"><span className="text-muted-foreground">{formatRelativeTime(cart.created_at)}</span><span className="font-medium">AED {cart.subtotal}</span></div>
                      <p className="text-muted-foreground truncate">{cart.items[0]?.title}</p>
                    </div>
                  ))}
                </Card>
              )}
              <Card className="p-3 bg-muted/30">
                <p className="text-[10px] text-muted-foreground uppercase mb-2">Tags</p>
                <div className="flex flex-wrap gap-1">{selectedConversation.tags?.map((tag) => <Badge key={tag} variant="outline" className="text-xs">{tag}</Badge>)}</div>
              </Card>
            </div>
            <div className="p-4 border-t border-border space-y-2">
              <Button variant="outline" className="w-full text-sm" size="sm"><Target className="w-4 h-4 mr-2" />View Full Profile</Button>
              <Button variant="outline" className="w-full text-sm" size="sm" onClick={() => router.push('/house/sales-intelligence')}><TrendingUp className="w-4 h-4 mr-2" />Sales Intelligence</Button>
            </div>
          </div>
        )}
      </div>
      ) : (
        <WhatsAppOperationsPanel
          activeTool={activeTool}
          templates={whatsappTemplates}
          financeQueue={financeQueue}
          ghostCarts={globalGhostCarts}
          crossSell={globalCrossSell}
          selectedConversation={selectedConversation}
          setActiveTool={setActiveTool}
        />
      )}
    </div>
  );
}

function WhatsAppCommandBar({
  activeTool,
  setActiveTool,
  conversations,
}: {
  activeTool: WhatsAppTool;
  setActiveTool: (tool: WhatsAppTool) => void;
  conversations: Conversation[];
}) {
  const unread = conversations.reduce((sum, conversation) => sum + conversation.unread_count, 0);
  const pending = conversations.filter((conversation) => conversation.status === 'pending').length;
  const open = conversations.filter((conversation) => conversation.status === 'open').length;

  return (
    <div className="shrink-0 border-b border-border bg-background">
      <div className="grid gap-2 border-b border-border px-4 py-2 md:grid-cols-4">
        <div className="rounded-md border border-border bg-card/60 px-3 py-2">
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground">WhatsApp number</p>
          <p className="text-sm font-medium">{WHATSAPP_COMMAND_CENTER.number}</p>
        </div>
        <div className="rounded-md border border-emerald-500/30 bg-emerald-500/10 px-3 py-2">
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Health</p>
          <p className="text-sm font-medium text-emerald-300">{WHATSAPP_COMMAND_CENTER.health}% online</p>
        </div>
        <div className="rounded-md border border-border bg-card/60 px-3 py-2">
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground">SLA</p>
          <p className="text-sm font-medium">{WHATSAPP_COMMAND_CENTER.sla} avg reply</p>
        </div>
        <div className="rounded-md border border-amber-500/30 bg-amber-500/10 px-3 py-2">
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Queue</p>
          <p className="text-sm font-medium text-amber-300">{open} open · {pending} pending · {unread} unread</p>
        </div>
      </div>

      <div className="flex gap-2 overflow-x-auto px-4 py-2">
        {WHATSAPP_OPTIONS.map((option) => {
          const tool = option.id as WhatsAppTool;
          const Icon = getWhatsAppToolIcon(tool);
          return (
            <button
              key={option.id}
              onClick={() => setActiveTool(tool)}
              className={cn(
                'flex min-w-[170px] items-center gap-3 rounded-md border px-3 py-2 text-left transition-colors',
                activeTool === tool
                  ? 'border-primary/60 bg-primary/10 text-foreground'
                  : 'border-border bg-card/50 text-muted-foreground hover:bg-muted/40 hover:text-foreground',
              )}
            >
              <Icon className={cn('h-4 w-4 shrink-0', activeTool === tool ? 'text-primary' : 'text-muted-foreground')} />
              <span className="min-w-0">
                <span className="block text-sm font-medium">{option.label}</span>
                <span className="block truncate text-[11px] text-muted-foreground">{option.metric}</span>
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function WhatsAppOperationsPanel({
  activeTool,
  templates,
  financeQueue,
  ghostCarts,
  crossSell,
  selectedConversation,
  setActiveTool,
}: {
  activeTool: WhatsAppTool;
  templates: any[];
  financeQueue: any[];
  ghostCarts: any[];
  crossSell: any[];
  selectedConversation: Conversation | null;
  setActiveTool: (tool: WhatsAppTool) => void;
}) {
  const activeOption = WHATSAPP_OPTIONS.find((option) => option.id === activeTool);

  return (
    <div className="flex-1 overflow-y-auto bg-background">
      <div className="mx-auto max-w-[1600px] space-y-6 px-6 py-6">
        <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
          <div>
            <div className="flex items-center gap-2">
              {(() => {
                const Icon = getWhatsAppToolIcon(activeTool);
                return <Icon className="h-5 w-5 text-primary" />;
              })()}
              <h2 className="text-xl font-serif font-medium">{activeOption?.label}</h2>
            </div>
            <p className="mt-1 text-sm text-muted-foreground">{activeOption?.detail}</p>
            <p className="mt-2 text-xs text-muted-foreground">{WHATSAPP_COMMAND_CENTER.policy}</p>
          </div>
          <Button variant="outline" size="sm" onClick={() => setActiveTool('inbox')}>
            <MessageSquare className="h-4 w-4 mr-2" />
            Back to inbox
          </Button>
        </div>

        {activeTool === 'sales' && (
          <div className="grid gap-6 xl:grid-cols-[1.2fr_.8fr]">
            <Card className="bg-card/70">
              <div className="border-b border-border p-4">
                <h3 className="flex items-center gap-2 font-medium">
                  <ShoppingCart className="h-4 w-4 text-primary" />
                  WhatsApp Sales Control
                </h3>
              </div>
              <div className="grid gap-4 p-4 md:grid-cols-2">
                <SalesOption title="Detect order intent" value="89%" detail="Extract SKU, quantity, delivery deadline, and payment readiness." icon={<Sparkles className="h-5 w-5 text-primary" />} />
                <SalesOption title="Create order" value="1 click" detail="Create order, items, finance verification, and confirmation message." icon={<ShoppingCart className="h-5 w-5 text-emerald-300" />} />
                <SalesOption title="Reserve item" value="VIP" detail="Hold bridal and private drop stock for female VIP buyers." icon={<Gift className="h-5 w-5 text-amber-300" />} />
                <SalesOption title="Finance handoff" value={String(financeQueue.length)} detail="Send payment screenshots and COD risk to finance." icon={<WalletCards className="h-5 w-5 text-blue-300" />} />
                <SalesOption title="Delivery promise" value="KSA/UAE" detail="Confirm urgent bridal delivery before accepting payment." icon={<Route className="h-5 w-5 text-purple-300" />} />
                <SalesOption title="Cross-sell" value={`AED ${crossSell.reduce((sum, item) => sum + (item.potential_value || 0), 0).toLocaleString()}`} detail="Bundle perfume, pendants, and private drops based on conversation context." icon={<TrendingUp className="h-5 w-5 text-emerald-300" />} />
              </div>
            </Card>

            <div className="space-y-4">
              <Card className="bg-card/70 p-4">
                <h3 className="mb-3 text-sm font-medium">Selected conversation</h3>
                {selectedConversation?.customer ? (
                  <div className="space-y-3 text-sm">
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Customer</span>
                      <span>{selectedConversation.customer.first_name} {selectedConversation.customer.last_name}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">LTV</span>
                      <span>AED {selectedConversation.customer.total_spent.toLocaleString()}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Unread</span>
                      <span>{selectedConversation.unread_count}</span>
                    </div>
                    <Button className="w-full" size="sm" onClick={() => setActiveTool('inbox')}>
                      Continue in inbox
                    </Button>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">Select a ladies customer thread from the inbox.</p>
                )}
              </Card>

              <Card className="bg-card/70 p-4">
                <h3 className="mb-3 text-sm font-medium">Global recovery queue</h3>
                <div className="space-y-2">
                  {ghostCarts.map((cart) => (
                    <div key={cart.id} className="rounded-md border border-border bg-background/50 p-3">
                      <div className="flex items-center justify-between gap-3">
                        <span className="text-sm font-medium">{cart.customer?.first_name} {cart.customer?.last_name}</span>
                        <Badge variant="outline">AED {cart.subtotal}</Badge>
                      </div>
                      <p className="mt-1 text-xs text-muted-foreground">{cart.items?.[0]?.title} · {cart.abandonment_reason?.replace('_', ' ')}</p>
                    </div>
                  ))}
                </div>
              </Card>
            </div>
          </div>
        )}

        {activeTool === 'catalog' && (
          <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-4">
            {WHATSAPP_CATALOG_ACTIONS.map((item) => (
              <Card key={item.sku} className="bg-card/70 p-4">
                <div className="mb-4 flex items-start justify-between gap-3">
                  <div>
                    <h3 className="font-medium">{item.name}</h3>
                    <p className="text-xs text-muted-foreground">{item.sku}</p>
                  </div>
                  <Badge variant={item.stock <= 3 ? 'destructive' : 'secondary'}>
                    {item.stock} left
                  </Badge>
                </div>
                <p className="rounded-md border border-border bg-background/50 p-3 text-sm">{item.action}</p>
                <div className="mt-4 grid grid-cols-2 gap-2">
                  <Button size="sm"><ShoppingCart className="h-4 w-4 mr-2" />Send card</Button>
                  <Button size="sm" variant="outline"><Gift className="h-4 w-4 mr-2" />Reserve</Button>
                </div>
              </Card>
            ))}
          </div>
        )}

        {activeTool === 'labels' && (
          <div className="grid gap-4 lg:grid-cols-3">
            {WHATSAPP_LABELS.map((label) => (
              <Card key={label.name} className="bg-card/70 p-4">
                <div className="mb-4 flex items-start justify-between gap-3">
                  <div>
                    <h3 className="flex items-center gap-2 font-medium">
                      <Tags className="h-4 w-4 text-primary" />
                      {label.name}
                    </h3>
                    <p className="mt-1 text-sm text-muted-foreground">{label.action}</p>
                  </div>
                  <Badge variant="outline">{label.count}</Badge>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline">Apply</Button>
                  <Button size="sm" variant="ghost">Route</Button>
                </div>
              </Card>
            ))}
          </div>
        )}

        {activeTool === 'templates' && (
          <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-4">
            {templates.map((template) => (
              <Card key={template.id} className="bg-card/70 p-4">
                <div className="mb-3 flex items-start justify-between gap-3">
                  <div>
                    <h3 className="font-medium">{template.name}</h3>
                    <p className="text-xs text-muted-foreground">{template.use_case}</p>
                  </div>
                  <Badge variant="outline" className={template.status === 'approved' ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300' : 'border-amber-500/30 bg-amber-500/10 text-amber-300'}>
                    {template.status}
                  </Badge>
                </div>
                <div className="rounded-md border border-border bg-background/50 p-3 text-sm">{template.body}</div>
                <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                  <span>{template.language}</span>
                  <span className="text-right">Quality {template.quality}%</span>
                  <span>{template.category}</span>
                  <span className="text-right">{template.owner}</span>
                </div>
              </Card>
            ))}
          </div>
        )}

        {activeTool === 'broadcasts' && (
          <div className="grid gap-4 lg:grid-cols-3">
            {WHATSAPP_BROADCASTS.map((broadcast) => (
              <Card key={broadcast.id} className="bg-card/70 p-4">
                <div className="mb-4 flex items-start justify-between gap-3">
                  <div>
                    <h3 className="font-medium">{broadcast.name}</h3>
                    <p className="text-xs text-muted-foreground">{broadcast.audience}</p>
                  </div>
                  <Badge variant="outline">{broadcast.status}</Badge>
                </div>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="rounded-md border border-border bg-background/50 p-3">
                    <p className="text-xs text-muted-foreground">Expected revenue</p>
                    <p className="mt-1 font-semibold">{broadcast.expectedRevenue}</p>
                  </div>
                  <div className="rounded-md border border-border bg-background/50 p-3">
                    <p className="text-xs text-muted-foreground">Owner</p>
                    <p className="mt-1 font-semibold">{broadcast.owner}</p>
                  </div>
                </div>
                <p className="mt-4 rounded-md border border-primary/20 bg-primary/5 p-3 text-sm">{broadcast.guardrail}</p>
                <div className="mt-4 flex gap-2">
                  <Button size="sm" className="flex-1"><Megaphone className="h-4 w-4 mr-2" />Prepare</Button>
                  <Button size="sm" variant="outline">Preview</Button>
                </div>
              </Card>
            ))}
          </div>
        )}

        {activeTool === 'automation' && (
          <div className="grid gap-3 lg:grid-cols-2">
            {WHATSAPP_AUTOMATIONS.map((automation) => (
              <Card key={automation.name} className="bg-card/70 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="font-medium">{automation.name}</h3>
                    <p className="mt-1 text-sm text-muted-foreground">When: {automation.trigger}</p>
                    <p className="mt-1 text-sm">Then: {automation.action}</p>
                  </div>
                  <Badge variant={automation.enabled ? 'default' : 'secondary'}>
                    {automation.enabled ? 'on' : 'off'}
                  </Badge>
                </div>
              </Card>
            ))}
          </div>
        )}

        {activeTool === 'quality' && (
          <div className="grid gap-6 xl:grid-cols-[1fr_.8fr]">
            <Card className="bg-card/70">
              <div className="border-b border-border p-4">
                <h3 className="flex items-center gap-2 font-medium"><ShieldCheck className="h-4 w-4 text-primary" />Quality review</h3>
              </div>
              <div className="space-y-3 p-4">
                {WHATSAPP_QUALITY_CHECKS.map((check) => (
                  <div key={check.label} className="rounded-md border border-border bg-background/50 p-4">
                    <div className="mb-2 flex items-center justify-between gap-3">
                      <span className="font-medium">{check.label}</span>
                      <Badge variant="outline">{check.score}%</Badge>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-muted">
                      <div className="h-full rounded-full bg-primary" style={{ width: `${check.score}%` }} />
                    </div>
                    <p className="mt-3 text-sm text-muted-foreground">{check.issue}</p>
                  </div>
                ))}
              </div>
            </Card>

            <Card className="bg-card/70 p-4">
              <h3 className="mb-3 flex items-center gap-2 font-medium"><Languages className="h-4 w-4 text-blue-300" />Reply rules</h3>
              <div className="space-y-3">
                {[
                  'Use Arabic first when the customer writes in Arabic.',
                  'Mention delivery certainty before payment pressure.',
                  'Protect VIP female customer privacy in every internal note.',
                  'Do not lead bridal conversations with discounts.',
                  'Escalate payment screenshots to finance, not chat guesses.',
                ].map((rule) => (
                  <div key={rule} className="flex gap-2 rounded-md border border-border bg-background/50 p-3 text-sm">
                    <CheckCircle className="mt-0.5 h-4 w-4 shrink-0 text-emerald-300" />
                    <span>{rule}</span>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        )}

        {activeTool === 'team' && (
          <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-4">
            {WHATSAPP_TEAM_LOAD.map((member) => (
              <Card key={member.name} className="bg-card/70 p-4">
                <div className="mb-4 flex items-start justify-between">
                  <div>
                    <h3 className="font-medium">{member.name}</h3>
                    <p className="text-xs text-muted-foreground">{member.role}</p>
                  </div>
                  <Badge variant="outline">{member.score}%</Badge>
                </div>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="rounded-md border border-border bg-background/50 p-3">
                    <p className="text-xs text-muted-foreground">Open</p>
                    <p className="text-xl font-semibold">{member.open}</p>
                  </div>
                  <div className="rounded-md border border-border bg-background/50 p-3">
                    <p className="text-xs text-muted-foreground">VIP</p>
                    <p className="text-xl font-semibold">{member.vip}</p>
                  </div>
                </div>
                <p className="mt-4 rounded-md border border-primary/20 bg-primary/5 p-3 text-sm">{member.next}</p>
                <Button className="mt-4 w-full" size="sm" variant="outline"><UserCheck className="h-4 w-4 mr-2" />Reassign</Button>
              </Card>
            ))}
          </div>
        )}

        {activeTool === 'finance' && (
          <div className="grid gap-4 lg:grid-cols-2">
            {financeQueue.map((item) => (
              <Card key={item.id} className="bg-card/70 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="font-medium">{item.order?.order_number}</h3>
                    <p className="text-sm text-muted-foreground">{item.order?.customer?.first_name} {item.order?.customer?.last_name}</p>
                  </div>
                  <Badge variant={item.priority === 'high' ? 'destructive' : 'secondary'}>{item.priority}</Badge>
                </div>
                <div className="mt-4 grid grid-cols-3 gap-2 text-sm">
                  <div className="rounded-md border border-border bg-background/50 p-3">
                    <p className="text-xs text-muted-foreground">Amount</p>
                    <p className="font-semibold">AED {item.amount}</p>
                  </div>
                  <div className="rounded-md border border-border bg-background/50 p-3">
                    <p className="text-xs text-muted-foreground">Risk</p>
                    <p className="font-semibold">{Math.round(item.risk_score * 100)}%</p>
                  </div>
                  <div className="rounded-md border border-border bg-background/50 p-3">
                    <p className="text-xs text-muted-foreground">Method</p>
                    <p className="font-semibold">{item.payment_method?.replace('_', ' ')}</p>
                  </div>
                </div>
                <p className="mt-4 text-sm text-muted-foreground">{item.notes}</p>
                <div className="mt-4 flex gap-2">
                  <Button size="sm"><FileCheck className="h-4 w-4 mr-2" />Approve</Button>
                  <Button size="sm" variant="outline"><RefreshCw className="h-4 w-4 mr-2" />Ask again</Button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function SalesOption({ title, value, detail, icon }: { title: string; value: string; detail: string; icon: React.ReactNode }) {
  return (
    <div className="rounded-md border border-border bg-background/50 p-4">
      <div className="mb-3 flex items-center justify-between gap-3">
        {icon}
        <Badge variant="outline">{value}</Badge>
      </div>
      <p className="font-medium">{title}</p>
      <p className="mt-1 text-sm text-muted-foreground">{detail}</p>
    </div>
  );
}

function getWhatsAppToolIcon(tool: WhatsAppTool) {
  const icons = {
    inbox: MessageSquare,
    sales: ShoppingCart,
    catalog: Gift,
    labels: Tags,
    templates: ClipboardList,
    broadcasts: Megaphone,
    automation: Settings2,
    quality: ShieldCheck,
    team: UserCheck,
    finance: WalletCards,
  };
  return icons[tool] || MessageSquare;
}

function MessageBubble({ message }: { message: Message }) {
  const [isPlaying, setIsPlaying] = useState(false);
  const isAgent = message.sender_type === 'agent';
  const formatTime = (d: string) => new Date(d).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
  const StatusIcon = message.status === 'read' ? CheckCheck : message.status === 'delivered' ? CheckCheck : Check;

  return (
    <div className={cn('flex', isAgent ? 'justify-end' : 'justify-start')}>
      <div className={cn('max-w-[70%] rounded-lg px-3 py-2', isAgent ? 'bg-primary text-primary-foreground rounded-br-none' : 'bg-card border border-border rounded-bl-none')}>
        {message.content_type === 'text' && <p className="text-sm whitespace-pre-wrap">{message.content}</p>}
        {message.content_type === 'image' && (
          <div className="space-y-2">
            <div className="w-48 h-48 bg-muted rounded-lg flex items-center justify-center"><ImageIcon className="w-8 h-8 text-muted-foreground" /></div>
            {message.content && <p className="text-sm">{message.content}</p>}
          </div>
        )}
        {message.content_type === 'audio' && (
          <div className="flex items-center gap-3 min-w-[200px]">
            <Button variant="ghost" size="icon" className={cn('h-8 w-8 shrink-0', isAgent ? 'hover:bg-primary-foreground/20' : '')} onClick={() => setIsPlaying(!isPlaying)}>
              {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
            </Button>
            <div className="flex-1"><div className={cn('h-1 rounded-full', isAgent ? 'bg-primary-foreground/30' : 'bg-muted')}><div className={cn('h-full rounded-full w-1/3', isAgent ? 'bg-primary-foreground' : 'bg-primary')} /></div></div>
            <span className={cn('text-xs shrink-0', isAgent ? 'text-primary-foreground/70' : 'text-muted-foreground')}>{message.metadata?.duration_seconds ? `0:${message.metadata.duration_seconds.toString().padStart(2, '0')}` : '0:00'}</span>
          </div>
        )}
        <div className={cn('flex items-center gap-1 mt-1', isAgent ? 'justify-end' : 'justify-start')}>
          <span className={cn('text-[10px]', isAgent ? 'text-primary-foreground/70' : 'text-muted-foreground')}>{formatTime(message.created_at)}</span>
          {isAgent && <StatusIcon className={cn('w-3 h-3', message.status === 'read' ? 'text-blue-400' : 'text-primary-foreground/70')} />}
        </div>
      </div>
    </div>
  );
}
