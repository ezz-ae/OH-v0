'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  ArrowLeft, Search, Users, Crown, TrendingUp, ShoppingCart,
  MessageSquare, Globe, Smartphone, Monitor, Wifi, MapPin,
  Clock, Eye, MousePointer, ChevronRight, Phone, Mail,
  Package, DollarSign, Ghost, Fingerprint, Activity, X,
  RefreshCw, ExternalLink
} from 'lucide-react';
import Link from 'next/link';

const supabase = createClient();

type Customer = {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  city: string;
  country: string;
  total_orders: number;
  total_spent: number;
  created_at: string;
};

type Fingerprint = {
  id: string;
  fingerprint_hash: string;
  confidence_score: number;
  device_signals: Record<string, string>;
  network_signals: Record<string, string>;
  behavior_signals: Record<string, number>;
  total_sessions: number;
  total_orders: number;
  total_spent: number;
  first_seen_at: string;
  last_seen_at: string;
};

type Session = {
  id: string;
  source: string;
  landing_page: string;
  referrer: string;
  device_type: string;
  browser: string;
  os: string;
  city: string;
  country: string;
  products_viewed: Array<{ sku: string; title?: string }>;
  time_on_site: number;
  is_returning: boolean;
  created_at: string;
};

type GhostCart = {
  id: string;
  status: string;
  items: Array<{ sku: string; title: string; price: number; quantity: number }>;
  subtotal: number;
  source: string;
  abandonment_reason: string;
  device_type: string;
  city: string;
  created_at: string;
};

type Conversation = {
  id: string;
  channel: string;
  status: string;
  last_message_preview: string;
  last_message_at: string;
  unread_count: number;
};

type Order = {
  id: string;
  order_number: string;
  status: string;
  total: number;
  item_count: number;
  created_at: string;
};

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [fingerprints, setFingerprints] = useState<Fingerprint[]>([]);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [ghostCarts, setGhostCarts] = useState<GhostCart[]>([]);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [profileTab, setProfileTab] = useState('identity');

  useEffect(() => {
    loadCustomers();
  }, []);

  useEffect(() => {
    if (selectedCustomer) {
      loadCustomerProfile(selectedCustomer.id);
    }
  }, [selectedCustomer]);

  async function loadCustomers() {
    setLoading(true);
    const { data } = await supabase
      .from('customers')
      .select('*')
      .eq('org_id', '00000000-0000-0000-0000-000000000001')
      .order('total_spent', { ascending: false });
    setCustomers(data || []);
    if (data && data.length > 0) {
      setSelectedCustomer((current) => current || data[0]);
    }
    setLoading(false);
  }

  async function loadCustomerProfile(customerId: string) {
    // Load fingerprints
    const { data: fpData } = await supabase
      .from('customer_fingerprints')
      .select('*')
      .eq('customer_id', customerId)
      .order('last_seen_at', { ascending: false });
    setFingerprints(fpData || []);

    // Load sessions
    const { data: sessData } = await supabase
      .from('customer_sessions')
      .select('*')
      .eq('customer_id', customerId)
      .order('created_at', { ascending: false })
      .limit(20);
    setSessions(sessData || []);

    // Load ghost carts
    const { data: gcData } = await supabase
      .from('ghost_carts')
      .select('*')
      .eq('customer_id', customerId)
      .order('created_at', { ascending: false });
    setGhostCarts(gcData || []);

    // Load conversations
    const { data: convData } = await supabase
      .from('conversations')
      .select('*')
      .eq('customer_id', customerId)
      .order('last_message_at', { ascending: false });
    setConversations(convData || []);

    // Load orders
    const { data: ordData } = await supabase
      .from('orders')
      .select('*')
      .eq('customer_id', customerId)
      .order('created_at', { ascending: false });
    setOrders(ordData || []);
  }

  const filteredCustomers = customers.filter(c =>
    `${c.first_name} ${c.last_name} ${c.email} ${c.phone}`.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getSourceIcon = (source: string) => {
    switch (source) {
      case 'whatsapp': return <MessageSquare className="h-3.5 w-3.5 text-green-500" />;
      case 'website': return <Globe className="h-3.5 w-3.5 text-blue-500" />;
      case 'app': return <Smartphone className="h-3.5 w-3.5 text-purple-500" />;
      default: return <Globe className="h-3.5 w-3.5 text-muted-foreground" />;
    }
  };

  const getDeviceIcon = (device: string) => {
    switch (device?.toLowerCase()) {
      case 'mobile': return <Smartphone className="h-3.5 w-3.5" />;
      case 'desktop': return <Monitor className="h-3.5 w-3.5" />;
      default: return <Monitor className="h-3.5 w-3.5" />;
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
  };

  const formatDate = (date: string) => {
    const d = new Date(date);
    const now = new Date();
    const diff = now.getTime() - d.getTime();
    const mins = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    
    if (mins < 60) return `${mins}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return d.toLocaleDateString();
  };

  const getCustomerTier = (spent: number) => {
    if (spent >= 5000) return { name: 'Platinum', color: 'bg-gradient-to-r from-slate-400 to-slate-600 text-white' };
    if (spent >= 2000) return { name: 'Gold', color: 'bg-gradient-to-r from-amber-400 to-amber-600 text-white' };
    if (spent >= 500) return { name: 'Silver', color: 'bg-gradient-to-r from-zinc-300 to-zinc-500 text-white' };
    return { name: 'Bronze', color: 'bg-gradient-to-r from-orange-300 to-orange-500 text-white' };
  };

  // Calculate cross-channel stats
  const channelStats = {
    whatsapp: sessions.filter(s => s.source === 'whatsapp').length,
    website: sessions.filter(s => s.source === 'website').length,
    app: sessions.filter(s => s.source === 'app').length,
  };

  const totalDevices = fingerprints.length;
  const totalSessions = sessions.length;
  const avgSessionTime = sessions.length > 0 
    ? Math.round(sessions.reduce((acc, s) => acc + s.time_on_site, 0) / sessions.length)
    : 0;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex h-14 items-center gap-4 px-6">
          <Link href="/house" className="flex items-center gap-2 text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" />
            <h1 className="text-lg font-semibold">Customers</h1>
          </div>
          <span className="text-sm text-muted-foreground">Cross-Channel Identity CRM</span>
          
          <div className="ml-auto flex items-center gap-3">
            <Badge variant="outline" className="gap-1.5">
              <Users className="h-3 w-3" />
              {customers.length} customers
            </Badge>
          </div>
        </div>
      </header>

      <div className="flex h-[calc(100vh-3.5rem)]">
        {/* Customer List */}
        <div className="w-80 border-r flex flex-col">
          <div className="p-3 border-b">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search customers..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="pl-9 h-9"
              />
            </div>
          </div>
          
          <ScrollArea className="flex-1">
            {loading ? (
              <div className="p-4 text-center text-muted-foreground">Loading...</div>
            ) : (
              <div className="divide-y">
                {filteredCustomers.map(customer => {
                  const tier = getCustomerTier(customer.total_spent);
                  return (
                    <button
                      key={customer.id}
                      onClick={() => setSelectedCustomer(customer)}
                      className={`w-full p-3 text-left hover:bg-muted/50 transition-colors ${
                        selectedCustomer?.id === customer.id ? 'bg-muted' : ''
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-medium">
                          {customer.first_name[0]}{customer.last_name[0]}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-medium truncate">
                              {customer.first_name} {customer.last_name}
                            </span>
                            {customer.total_spent >= 2000 && (
                              <Crown className="h-3.5 w-3.5 text-amber-500" />
                            )}
                          </div>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                            <MapPin className="h-3 w-3" />
                            {customer.city}, {customer.country}
                          </div>
                          <div className="flex items-center gap-3 mt-1.5">
                            <Badge variant="secondary" className="text-xs px-1.5 py-0">
                              {customer.total_orders} orders
                            </Badge>
                            <span className="text-xs font-medium text-primary">
                              AED {customer.total_spent.toLocaleString()}
                            </span>
                          </div>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </ScrollArea>
        </div>

        {/* Customer Profile */}
        {selectedCustomer ? (
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Profile Header */}
            <div className="p-6 border-b bg-gradient-to-r from-primary/5 to-transparent">
              <div className="flex items-start gap-4">
                <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center text-primary text-xl font-semibold">
                  {selectedCustomer.first_name[0]}{selectedCustomer.last_name[0]}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <h2 className="text-2xl font-semibold">
                      {selectedCustomer.first_name} {selectedCustomer.last_name}
                    </h2>
                    <Badge className={getCustomerTier(selectedCustomer.total_spent).color}>
                      <Crown className="h-3 w-3 mr-1" />
                      {getCustomerTier(selectedCustomer.total_spent).name}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1.5">
                      <Mail className="h-3.5 w-3.5" />
                      {selectedCustomer.email}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <Phone className="h-3.5 w-3.5" />
                      {selectedCustomer.phone}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <MapPin className="h-3.5 w-3.5" />
                      {selectedCustomer.city}, {selectedCustomer.country}
                    </span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm">
                    <MessageSquare className="h-4 w-4 mr-1.5" />
                    Message
                  </Button>
                  <Button size="sm">
                    <Package className="h-4 w-4 mr-1.5" />
                    New Order
                  </Button>
                </div>
              </div>

              {/* Quick Stats */}
              <div className="grid grid-cols-6 gap-4 mt-6">
                <div className="text-center p-3 rounded-lg bg-background border">
                  <div className="text-2xl font-semibold text-primary">
                    AED {selectedCustomer.total_spent.toLocaleString()}
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">Lifetime Value</div>
                </div>
                <div className="text-center p-3 rounded-lg bg-background border">
                  <div className="text-2xl font-semibold">{selectedCustomer.total_orders}</div>
                  <div className="text-xs text-muted-foreground mt-1">Orders</div>
                </div>
                <div className="text-center p-3 rounded-lg bg-background border">
                  <div className="text-2xl font-semibold">{totalDevices}</div>
                  <div className="text-xs text-muted-foreground mt-1">Devices</div>
                </div>
                <div className="text-center p-3 rounded-lg bg-background border">
                  <div className="text-2xl font-semibold">{totalSessions}</div>
                  <div className="text-xs text-muted-foreground mt-1">Sessions</div>
                </div>
                <div className="text-center p-3 rounded-lg bg-background border">
                  <div className="text-2xl font-semibold">{ghostCarts.length}</div>
                  <div className="text-xs text-muted-foreground mt-1">Ghost Carts</div>
                </div>
                <div className="text-center p-3 rounded-lg bg-background border">
                  <div className="text-2xl font-semibold">{formatTime(avgSessionTime)}</div>
                  <div className="text-xs text-muted-foreground mt-1">Avg. Session</div>
                </div>
              </div>
            </div>

            {/* Profile Tabs */}
            <Tabs value={profileTab} onValueChange={setProfileTab} className="flex-1 flex flex-col overflow-hidden">
              <TabsList className="mx-6 mt-4 justify-start w-auto">
                <TabsTrigger value="identity" className="gap-1.5">
                  <Fingerprint className="h-3.5 w-3.5" />
                  Identity ({fingerprints.length})
                </TabsTrigger>
                <TabsTrigger value="sessions" className="gap-1.5">
                  <Activity className="h-3.5 w-3.5" />
                  Sessions ({sessions.length})
                </TabsTrigger>
                <TabsTrigger value="carts" className="gap-1.5">
                  <Ghost className="h-3.5 w-3.5" />
                  Ghost Carts ({ghostCarts.length})
                </TabsTrigger>
                <TabsTrigger value="conversations" className="gap-1.5">
                  <MessageSquare className="h-3.5 w-3.5" />
                  Conversations ({conversations.length})
                </TabsTrigger>
                <TabsTrigger value="orders" className="gap-1.5">
                  <Package className="h-3.5 w-3.5" />
                  Orders ({orders.length})
                </TabsTrigger>
              </TabsList>

              <ScrollArea className="flex-1 px-6 pb-6">
                {/* Identity Tab - Cross-Channel Fingerprints */}
                <TabsContent value="identity" className="mt-4 space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold">Cross-Channel Identity</h3>
                      <p className="text-sm text-muted-foreground">Device fingerprints and identity resolution</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-2 text-sm">
                        <span className="flex items-center gap-1"><MessageSquare className="h-3.5 w-3.5 text-green-500" /> {channelStats.whatsapp}</span>
                        <span className="flex items-center gap-1"><Globe className="h-3.5 w-3.5 text-blue-500" /> {channelStats.website}</span>
                        <span className="flex items-center gap-1"><Smartphone className="h-3.5 w-3.5 text-purple-500" /> {channelStats.app}</span>
                      </div>
                    </div>
                  </div>

                  {fingerprints.length === 0 ? (
                    <Card>
                      <CardContent className="py-8 text-center text-muted-foreground">
                        <Fingerprint className="h-8 w-8 mx-auto mb-2 opacity-50" />
                        No device fingerprints recorded yet
                      </CardContent>
                    </Card>
                  ) : (
                    <div className="grid gap-4">
                      {fingerprints.map(fp => {
                        const device = fp.device_signals as Record<string, string>;
                        const network = fp.network_signals as Record<string, string>;
                        const behavior = fp.behavior_signals as Record<string, number>;
                        return (
                          <Card key={fp.id}>
                            <CardContent className="p-4">
                              <div className="flex items-start justify-between">
                                <div className="flex items-start gap-4">
                                  <div className={`p-3 rounded-lg ${device.device_type === 'mobile' ? 'bg-green-500/10' : 'bg-blue-500/10'}`}>
                                    {device.device_type === 'mobile' ? (
                                      <Smartphone className="h-6 w-6 text-green-500" />
                                    ) : (
                                      <Monitor className="h-6 w-6 text-blue-500" />
                                    )}
                                  </div>
                                  <div>
                                    <div className="flex items-center gap-2">
                                      <span className="font-medium">{device.os}</span>
                                      <Badge variant="outline" className="text-xs">
                                        {device.browser}
                                      </Badge>
                                      <Badge 
                                        variant={fp.confidence_score >= 0.9 ? 'default' : 'secondary'}
                                        className="text-xs"
                                      >
                                        {Math.round(fp.confidence_score * 100)}% match
                                      </Badge>
                                    </div>
                                    <div className="text-sm text-muted-foreground mt-1">
                                      Screen: {device.screen} | {network.isp} ({network.connection})
                                    </div>
                                    <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                                      <span>{fp.total_sessions} sessions</span>
                                      <span>{fp.total_orders} orders</span>
                                      <span>AED {fp.total_spent?.toLocaleString()}</span>
                                    </div>
                                  </div>
                                </div>
                                <div className="text-right text-sm">
                                  <div className="text-muted-foreground">Last seen</div>
                                  <div className="font-medium">{formatDate(fp.last_seen_at)}</div>
                                </div>
                              </div>
                              
                              {/* Behavior Signals */}
                              {behavior && (
                                <div className="mt-4 pt-4 border-t grid grid-cols-3 gap-4">
                                  <div>
                                    <div className="text-xs text-muted-foreground">Avg. Session</div>
                                    <div className="font-medium">{formatTime(behavior.avg_session || 0)}</div>
                                  </div>
                                  <div>
                                    <div className="text-xs text-muted-foreground">Scroll Depth</div>
                                    <div className="font-medium">{Math.round((behavior.scroll_depth || 0) * 100)}%</div>
                                  </div>
                                  <div>
                                    <div className="text-xs text-muted-foreground">Click Rate</div>
                                    <div className="font-medium">{Math.round((behavior.click_rate || 0) * 100)}%</div>
                                  </div>
                                </div>
                              )}
                            </CardContent>
                          </Card>
                        );
                      })}
                    </div>
                  )}
                </TabsContent>

                {/* Sessions Tab */}
                <TabsContent value="sessions" className="mt-4 space-y-4">
                  <div>
                    <h3 className="font-semibold">Session History</h3>
                    <p className="text-sm text-muted-foreground">Cross-channel visits and browsing activity</p>
                  </div>

                  {sessions.length === 0 ? (
                    <Card>
                      <CardContent className="py-8 text-center text-muted-foreground">
                        <Activity className="h-8 w-8 mx-auto mb-2 opacity-50" />
                        No sessions recorded yet
                      </CardContent>
                    </Card>
                  ) : (
                    <div className="space-y-3">
                      {sessions.map(session => (
                        <Card key={session.id}>
                          <CardContent className="p-4">
                            <div className="flex items-start justify-between">
                              <div className="flex items-start gap-3">
                                <div className="p-2 rounded-lg bg-muted">
                                  {getSourceIcon(session.source)}
                                </div>
                                <div>
                                  <div className="flex items-center gap-2">
                                    <Badge variant="outline" className="text-xs capitalize">
                                      {session.source}
                                    </Badge>
                                    <span className="text-sm text-muted-foreground flex items-center gap-1">
                                      {getDeviceIcon(session.device_type)}
                                      {session.browser} / {session.os}
                                    </span>
                                  </div>
                                  <div className="text-sm mt-1">
                                    <span className="text-muted-foreground">Landing: </span>
                                    {session.landing_page}
                                  </div>
                                  {session.referrer && (
                                    <div className="text-xs text-muted-foreground mt-0.5">
                                      from {session.referrer}
                                    </div>
                                  )}
                                  {session.products_viewed?.length > 0 && (
                                    <div className="flex items-center gap-1 mt-2">
                                      <Eye className="h-3 w-3 text-muted-foreground" />
                                      <span className="text-xs text-muted-foreground">
                                        Viewed {session.products_viewed.length} products
                                      </span>
                                    </div>
                                  )}
                                </div>
                              </div>
                              <div className="text-right">
                                <div className="flex items-center gap-1 text-sm">
                                  <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                                  {formatTime(session.time_on_site)}
                                </div>
                                <div className="text-xs text-muted-foreground mt-1">
                                  {formatDate(session.created_at)}
                                </div>
                                {session.is_returning && (
                                  <Badge variant="secondary" className="text-xs mt-1">
                                    <RefreshCw className="h-3 w-3 mr-1" />
                                    Returning
                                  </Badge>
                                )}
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </TabsContent>

                {/* Ghost Carts Tab */}
                <TabsContent value="carts" className="mt-4 space-y-4">
                  <div>
                    <h3 className="font-semibold">Ghost Carts</h3>
                    <p className="text-sm text-muted-foreground">Abandoned and recovered shopping carts</p>
                  </div>

                  {ghostCarts.length === 0 ? (
                    <Card>
                      <CardContent className="py-8 text-center text-muted-foreground">
                        <Ghost className="h-8 w-8 mx-auto mb-2 opacity-50" />
                        No ghost carts for this customer
                      </CardContent>
                    </Card>
                  ) : (
                    <div className="space-y-3">
                      {ghostCarts.map(cart => (
                        <Card key={cart.id}>
                          <CardContent className="p-4">
                            <div className="flex items-start justify-between">
                              <div>
                                <div className="flex items-center gap-2">
                                  {getSourceIcon(cart.source)}
                                  <Badge 
                                    variant={cart.status === 'recovered' ? 'default' : cart.status === 'active' ? 'secondary' : 'outline'}
                                    className="capitalize"
                                  >
                                    {cart.status}
                                  </Badge>
                                  {cart.abandonment_reason && (
                                    <span className="text-xs text-muted-foreground">
                                      ({cart.abandonment_reason.replace('_', ' ')})
                                    </span>
                                  )}
                                </div>
                                <div className="mt-2 space-y-1">
                                  {cart.items?.map((item, i) => (
                                    <div key={i} className="text-sm flex items-center gap-2">
                                      <ShoppingCart className="h-3 w-3 text-muted-foreground" />
                                      {item.title} x{item.quantity}
                                      <span className="text-muted-foreground">AED {item.price}</span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                              <div className="text-right">
                                <div className="text-lg font-semibold">AED {cart.subtotal}</div>
                                <div className="text-xs text-muted-foreground mt-1">
                                  {formatDate(cart.created_at)}
                                </div>
                                {cart.status === 'abandoned' && (
                                  <Button size="sm" variant="outline" className="mt-2">
                                    Recover
                                  </Button>
                                )}
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </TabsContent>

                {/* Conversations Tab */}
                <TabsContent value="conversations" className="mt-4 space-y-4">
                  <div>
                    <h3 className="font-semibold">Conversation History</h3>
                    <p className="text-sm text-muted-foreground">WhatsApp and support conversations</p>
                  </div>

                  {conversations.length === 0 ? (
                    <Card>
                      <CardContent className="py-8 text-center text-muted-foreground">
                        <MessageSquare className="h-8 w-8 mx-auto mb-2 opacity-50" />
                        No conversations yet
                      </CardContent>
                    </Card>
                  ) : (
                    <div className="space-y-3">
                      {conversations.map(conv => (
                        <Card key={conv.id} className="hover:bg-muted/50 transition-colors cursor-pointer">
                          <CardContent className="p-4">
                            <div className="flex items-start justify-between">
                              <div className="flex items-start gap-3">
                                <div className="p-2 rounded-lg bg-green-500/10">
                                  <MessageSquare className="h-5 w-5 text-green-500" />
                                </div>
                                <div>
                                  <div className="flex items-center gap-2">
                                    <Badge variant="outline" className="capitalize text-xs">
                                      {conv.channel}
                                    </Badge>
                                    <Badge 
                                      variant={conv.status === 'open' ? 'default' : conv.status === 'resolved' ? 'secondary' : 'outline'}
                                      className="capitalize text-xs"
                                    >
                                      {conv.status}
                                    </Badge>
                                  </div>
                                  <p className="text-sm mt-1 line-clamp-1">
                                    {conv.last_message_preview}
                                  </p>
                                </div>
                              </div>
                              <div className="text-right flex items-center gap-2">
                                {conv.unread_count > 0 && (
                                  <Badge variant="destructive" className="rounded-full h-5 w-5 p-0 flex items-center justify-center text-xs">
                                    {conv.unread_count}
                                  </Badge>
                                )}
                                <div className="text-xs text-muted-foreground">
                                  {formatDate(conv.last_message_at)}
                                </div>
                                <ChevronRight className="h-4 w-4 text-muted-foreground" />
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </TabsContent>

                {/* Orders Tab */}
                <TabsContent value="orders" className="mt-4 space-y-4">
                  <div>
                    <h3 className="font-semibold">Order History</h3>
                    <p className="text-sm text-muted-foreground">All orders from this customer</p>
                  </div>

                  {orders.length === 0 ? (
                    <Card>
                      <CardContent className="py-8 text-center text-muted-foreground">
                        <Package className="h-8 w-8 mx-auto mb-2 opacity-50" />
                        No orders yet
                      </CardContent>
                    </Card>
                  ) : (
                    <div className="space-y-3">
                      {orders.map(order => (
                        <Card key={order.id} className="hover:bg-muted/50 transition-colors cursor-pointer">
                          <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <div className="p-2 rounded-lg bg-primary/10">
                                  <Package className="h-5 w-5 text-primary" />
                                </div>
                                <div>
                                  <div className="flex items-center gap-2">
                                    <span className="font-medium">{order.order_number}</span>
                                    <Badge 
                                      variant={order.status === 'delivered' ? 'default' : order.status === 'processing' ? 'secondary' : 'outline'}
                                      className="capitalize text-xs"
                                    >
                                      {order.status}
                                    </Badge>
                                  </div>
                                  <div className="text-sm text-muted-foreground mt-0.5">
                                    {order.item_count} items
                                  </div>
                                </div>
                              </div>
                              <div className="text-right">
                                <div className="font-semibold">AED {order.total?.toLocaleString()}</div>
                                <div className="text-xs text-muted-foreground">
                                  {formatDate(order.created_at)}
                                </div>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </TabsContent>
              </ScrollArea>
            </Tabs>
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center text-muted-foreground">
            <div className="text-center">
              <Users className="h-12 w-12 mx-auto mb-3 opacity-30" />
              <p>Select a customer to view their profile</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
