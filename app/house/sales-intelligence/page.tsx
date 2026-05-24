'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft, ShoppingCart, Ghost, TrendingUp, Target, Users,
  DollarSign, Clock, MapPin, Smartphone, Monitor, Globe, Wifi,
  Eye, MessageSquare, Gift, AlertTriangle, CheckCircle, XCircle,
  BarChart3, PieChart, ArrowUpRight, ArrowDownRight, RefreshCw,
  Filter, ChevronRight, Zap, Brain, Activity
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { getSession } from '@/lib/session';
import { createClient } from '@/lib/supabase/client';

interface GhostCart {
  id: string;
  customer_id: string | null;
  customer?: { first_name: string; last_name: string; phone: string; city: string };
  status: string;
  items: { sku: string; title: string; price: number; quantity: number }[];
  subtotal: number;
  source: string;
  abandonment_reason: string;
  device_type: string;
  city: string;
  country: string;
  created_at: string;
}

interface CrossSellOpp {
  id: string;
  customer_id: string;
  customer?: { first_name: string; last_name: string };
  recommendation_type: string;
  reason: string;
  confidence: number;
  potential_value: number;
  status: string;
  created_at: string;
}

interface CustomerSession {
  id: string;
  customer_id: string | null;
  source: string;
  device_type: string;
  city: string;
  country: string;
  pages_viewed: string[];
  products_viewed: string[];
  time_on_site: number;
  is_returning: boolean;
  created_at: string;
}

interface FinanceVerification {
  id: string;
  order_id: string;
  order?: { order_number: string; total: number; customer?: { first_name: string; last_name: string } };
  status: string;
  priority: string;
  amount: number;
  risk_score: number;
  created_at: string;
}

export default function SalesIntelligencePage() {
  const router = useRouter();
  const session = getSession();
  const supabase = createClient();

  const [activeTab, setActiveTab] = useState<'overview' | 'ghost-carts' | 'cross-sell' | 'sessions'>('overview');
  const [ghostCarts, setGhostCarts] = useState<GhostCart[]>([]);
  const [crossSellOpps, setCrossSellOpps] = useState<CrossSellOpp[]>([]);
  const [sessions, setSessions] = useState<CustomerSession[]>([]);
  const [pendingVerifications, setPendingVerifications] = useState<FinanceVerification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'whatsapp' | 'website'>('all');

  useEffect(() => {
    async function loadData() {
      setIsLoading(true);
      
      // Load ghost carts
      const { data: cartsData } = await supabase
        .from('ghost_carts')
        .select('*, customer:customers(first_name, last_name, phone, city)')
        .eq('org_id', '00000000-0000-0000-0000-000000000001')
        .order('created_at', { ascending: false });
      setGhostCarts(cartsData as GhostCart[] || []);

      // Load cross-sell opportunities
      const { data: crossSellData } = await supabase
        .from('cross_sell_opportunities')
        .select('*, customer:customers(first_name, last_name)')
        .eq('org_id', '00000000-0000-0000-0000-000000000001')
        .order('confidence', { ascending: false });
      setCrossSellOpps(crossSellData as CrossSellOpp[] || []);

      // Load sessions
      const { data: sessionsData } = await supabase
        .from('customer_sessions')
        .select('*')
        .eq('org_id', '00000000-0000-0000-0000-000000000001')
        .order('created_at', { ascending: false })
        .limit(50);
      setSessions(sessionsData as CustomerSession[] || []);

      // Load pending finance verifications
      const { data: verData } = await supabase
        .from('finance_verifications')
        .select('*, order:orders(order_number, total, customer:customers(first_name, last_name))')
        .eq('org_id', '00000000-0000-0000-0000-000000000001')
        .eq('status', 'pending')
        .order('created_at', { ascending: false });
      setPendingVerifications(verData as FinanceVerification[] || []);

      setIsLoading(false);
    }
    loadData();
  }, []);

  // Stats calculations
  const stats = {
    totalGhostValue: ghostCarts.filter(c => c.status === 'abandoned').reduce((sum, c) => sum + c.subtotal, 0),
    ghostCartCount: ghostCarts.filter(c => c.status === 'abandoned').length,
    recoveredValue: ghostCarts.filter(c => c.status === 'recovered').reduce((sum, c) => sum + c.subtotal, 0),
    crossSellPipeline: crossSellOpps.filter(c => c.status === 'pending').reduce((sum, c) => sum + c.potential_value, 0),
    crossSellCount: crossSellOpps.filter(c => c.status === 'pending').length,
    pendingFinance: pendingVerifications.length,
    pendingFinanceValue: pendingVerifications.reduce((sum, v) => sum + v.amount, 0),
    avgSessionTime: sessions.length > 0 ? Math.round(sessions.reduce((sum, s) => sum + s.time_on_site, 0) / sessions.length / 60) : 0,
    returningVisitors: sessions.filter(s => s.is_returning).length,
  };

  const filteredGhostCarts = ghostCarts.filter(c => {
    if (filter === 'all') return true;
    return c.source === filter;
  });

  function formatRelativeTime(d: string) {
    const diff = Date.now() - new Date(d).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    return `${Math.floor(hrs / 24)}d ago`;
  }

  async function recoverCart(cart: GhostCart) {
    await supabase.from('ghost_carts').update({ status: 'recovered', recovery_attempts: 1 }).eq('id', cart.id);
    setGhostCarts(prev => prev.map(c => c.id === cart.id ? { ...c, status: 'recovered' } : c));
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="px-6 py-4 flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.push('/house')}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex-1">
            <h1 className="text-xl font-serif font-medium flex items-center gap-2">
              <Brain className="w-5 h-5 text-primary" />
              Sales Intelligence
            </h1>
            <p className="text-sm text-muted-foreground">Ghost carts, cross-sell pipeline, and customer behavior</p>
          </div>
          <Badge variant="secondary" className="text-xs">{session.user.name}</Badge>
        </div>

        {/* Tabs */}
        <div className="px-6 flex gap-1 -mb-px">
          {[
            { id: 'overview', label: 'Overview', icon: BarChart3 },
            { id: 'ghost-carts', label: `Ghost Carts (${stats.ghostCartCount})`, icon: Ghost },
            { id: 'cross-sell', label: `Cross-Sell (${stats.crossSellCount})`, icon: TrendingUp },
            { id: 'sessions', label: 'Sessions', icon: Activity },
          ].map((tab) => (
            <Button
              key={tab.id}
              variant="ghost"
              className={cn(
                'rounded-b-none border-b-2 border-transparent h-10',
                activeTab === tab.id && 'border-primary bg-muted/50'
              )}
              onClick={() => setActiveTab(tab.id as typeof activeTab)}
            >
              <tab.icon className="w-4 h-4 mr-2" />
              {tab.label}
            </Button>
          ))}
        </div>
      </header>

      <main className="p-6">
        {isLoading ? (
          <div className="flex items-center justify-center h-64 text-muted-foreground">
            <RefreshCw className="w-5 h-5 animate-spin mr-2" /> Loading intelligence...
          </div>
        ) : activeTab === 'overview' ? (
          <div className="space-y-6">
            {/* Hero Stats */}
            <div className="grid grid-cols-4 gap-4">
              <Card className="p-4 bg-gradient-to-br from-amber-500/10 to-amber-500/5 border-amber-500/20">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wider">Ghost Cart Value</p>
                    <p className="text-3xl font-bold mt-1">AED {stats.totalGhostValue.toLocaleString()}</p>
                    <p className="text-sm text-amber-600 mt-1">{stats.ghostCartCount} abandoned carts</p>
                  </div>
                  <div className="w-10 h-10 rounded-full bg-amber-500/20 flex items-center justify-center">
                    <Ghost className="w-5 h-5 text-amber-500" />
                  </div>
                </div>
              </Card>

              <Card className="p-4 bg-gradient-to-br from-green-500/10 to-green-500/5 border-green-500/20">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wider">Cross-Sell Pipeline</p>
                    <p className="text-3xl font-bold mt-1">AED {stats.crossSellPipeline.toLocaleString()}</p>
                    <p className="text-sm text-green-600 mt-1">{stats.crossSellCount} opportunities</p>
                  </div>
                  <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center">
                    <TrendingUp className="w-5 h-5 text-green-500" />
                  </div>
                </div>
              </Card>

              <Card className="p-4 bg-gradient-to-br from-blue-500/10 to-blue-500/5 border-blue-500/20">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wider">Pending Finance</p>
                    <p className="text-3xl font-bold mt-1">AED {stats.pendingFinanceValue.toLocaleString()}</p>
                    <p className="text-sm text-blue-600 mt-1">{stats.pendingFinance} orders awaiting</p>
                  </div>
                  <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center">
                    <DollarSign className="w-5 h-5 text-blue-500" />
                  </div>
                </div>
              </Card>

              <Card className="p-4 bg-gradient-to-br from-purple-500/10 to-purple-500/5 border-purple-500/20">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wider">Recovered Today</p>
                    <p className="text-3xl font-bold mt-1">AED {stats.recoveredValue.toLocaleString()}</p>
                    <p className="text-sm text-purple-600 mt-1">{ghostCarts.filter(c => c.status === 'recovered').length} carts saved</p>
                  </div>
                  <div className="w-10 h-10 rounded-full bg-purple-500/20 flex items-center justify-center">
                    <CheckCircle className="w-5 h-5 text-purple-500" />
                  </div>
                </div>
              </Card>
            </div>

            {/* Two Column Layout */}
            <div className="grid grid-cols-2 gap-6">
              {/* Recent Ghost Carts */}
              <Card className="p-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-medium flex items-center gap-2">
                    <Ghost className="w-4 h-4 text-amber-500" />
                    Recent Ghost Carts
                  </h3>
                  <Button variant="ghost" size="sm" onClick={() => setActiveTab('ghost-carts')}>
                    View All <ChevronRight className="w-4 h-4 ml-1" />
                  </Button>
                </div>
                <div className="space-y-3">
                  {ghostCarts.filter(c => c.status === 'abandoned').slice(0, 4).map((cart) => (
                    <div key={cart.id} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-sm">
                            {cart.customer ? `${cart.customer.first_name} ${cart.customer.last_name}` : 'Anonymous'}
                          </span>
                          <Badge variant="outline" className="text-[10px]">{cart.source}</Badge>
                        </div>
                        <p className="text-xs text-muted-foreground truncate">{cart.items[0]?.title}</p>
                        <div className="flex items-center gap-2 mt-1 text-[10px] text-muted-foreground">
                          {cart.device_type === 'mobile' ? <Smartphone className="w-3 h-3" /> : <Monitor className="w-3 h-3" />}
                          <span>{cart.city}</span>
                          <span>·</span>
                          <span>{formatRelativeTime(cart.created_at)}</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-amber-600">AED {cart.subtotal}</p>
                        <Button size="sm" variant="ghost" className="h-6 text-xs mt-1" onClick={() => recoverCart(cart)}>
                          <Gift className="w-3 h-3 mr-1" /> Recover
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>

              {/* Cross-Sell Pipeline */}
              <Card className="p-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-medium flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-green-500" />
                    Cross-Sell Pipeline
                  </h3>
                  <Button variant="ghost" size="sm" onClick={() => setActiveTab('cross-sell')}>
                    View All <ChevronRight className="w-4 h-4 ml-1" />
                  </Button>
                </div>
                <div className="space-y-3">
                  {crossSellOpps.filter(o => o.status === 'pending').slice(0, 4).map((opp) => (
                    <div key={opp.id} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-sm">
                            {opp.customer ? `${opp.customer.first_name} ${opp.customer.last_name}` : 'Customer'}
                          </span>
                          <Badge 
                            variant="outline" 
                            className={cn(
                              "text-[10px]",
                              opp.recommendation_type === 'cross_sell' && 'border-green-500/50 text-green-600',
                              opp.recommendation_type === 'upsell' && 'border-blue-500/50 text-blue-600',
                              opp.recommendation_type === 'bundle' && 'border-purple-500/50 text-purple-600',
                              opp.recommendation_type === 'recovery' && 'border-amber-500/50 text-amber-600',
                            )}
                          >
                            {opp.recommendation_type}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground truncate">{opp.reason}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <div className="h-1.5 w-16 bg-muted rounded-full overflow-hidden">
                            <div className="h-full bg-green-500" style={{ width: `${opp.confidence * 100}%` }} />
                          </div>
                          <span className="text-[10px] text-muted-foreground">{Math.round(opp.confidence * 100)}% confidence</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-green-600">+AED {opp.potential_value}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            </div>

            {/* Pending Finance Approvals */}
            {pendingVerifications.length > 0 && (
              <Card className="p-4 border-blue-500/20 bg-blue-500/5">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-medium flex items-center gap-2">
                    <DollarSign className="w-4 h-4 text-blue-500" />
                    Pending Finance Verification
                  </h3>
                  <Badge variant="secondary">{pendingVerifications.length} pending</Badge>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  {pendingVerifications.slice(0, 3).map((ver) => (
                    <div key={ver.id} className="p-3 bg-card rounded-lg border">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-mono text-sm">{ver.order?.order_number}</span>
                        <Badge variant={ver.priority === 'high' ? 'destructive' : ver.priority === 'urgent' ? 'destructive' : 'secondary'} className="text-[10px]">
                          {ver.priority}
                        </Badge>
                      </div>
                      <p className="text-lg font-bold">AED {ver.amount.toLocaleString()}</p>
                      <p className="text-xs text-muted-foreground">
                        {ver.order?.customer?.first_name} {ver.order?.customer?.last_name}
                      </p>
                      <div className="flex gap-2 mt-3">
                        <Button size="sm" className="flex-1 h-7 text-xs">
                          <CheckCircle className="w-3 h-3 mr-1" /> Approve
                        </Button>
                        <Button size="sm" variant="outline" className="h-7">
                          <XCircle className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            )}

            {/* Behavior Insights */}
            <div className="grid grid-cols-3 gap-4">
              <Card className="p-4">
                <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-muted-foreground" />
                  Top Locations
                </h4>
                <div className="space-y-2">
                  {['Dubai', 'Abu Dhabi', 'Sharjah', 'Ajman'].map((city, i) => (
                    <div key={city} className="flex items-center justify-between">
                      <span className="text-sm">{city}</span>
                      <div className="flex items-center gap-2">
                        <div className="h-2 bg-primary/20 rounded-full w-20">
                          <div className="h-full bg-primary rounded-full" style={{ width: `${100 - i * 20}%` }} />
                        </div>
                        <span className="text-xs text-muted-foreground w-8">{45 - i * 10}%</span>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>

              <Card className="p-4">
                <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
                  <Smartphone className="w-4 h-4 text-muted-foreground" />
                  Device Split
                </h4>
                <div className="flex items-center justify-around py-4">
                  <div className="text-center">
                    <Smartphone className="w-8 h-8 mx-auto mb-2 text-primary" />
                    <p className="text-2xl font-bold">78%</p>
                    <p className="text-xs text-muted-foreground">Mobile</p>
                  </div>
                  <div className="h-12 w-px bg-border" />
                  <div className="text-center">
                    <Monitor className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
                    <p className="text-2xl font-bold">22%</p>
                    <p className="text-xs text-muted-foreground">Desktop</p>
                  </div>
                </div>
              </Card>

              <Card className="p-4">
                <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
                  <Clock className="w-4 h-4 text-muted-foreground" />
                  Session Metrics
                </h4>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Avg. Session</span>
                    <span className="font-medium">{stats.avgSessionTime || 4} min</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Returning</span>
                    <span className="font-medium">{stats.returningVisitors} visitors</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Bounce Rate</span>
                    <span className="font-medium">32%</span>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        ) : activeTab === 'ghost-carts' ? (
          <div className="space-y-4">
            {/* Filters */}
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Source:</span>
              {(['all', 'whatsapp', 'website'] as const).map((f) => (
                <Button
                  key={f}
                  variant={filter === f ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setFilter(f)}
                >
                  {f === 'all' ? 'All Sources' : f === 'whatsapp' ? 'WhatsApp' : 'Website'}
                </Button>
              ))}
            </div>

            {/* Ghost Cart List */}
            <div className="space-y-3">
              {filteredGhostCarts.map((cart) => (
                <Card key={cart.id} className={cn(
                  "p-4",
                  cart.status === 'recovered' && 'opacity-60 border-green-500/20',
                  cart.status === 'converted' && 'opacity-60 border-primary/20'
                )}>
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center shrink-0">
                      {cart.customer ? (
                        <span className="text-lg font-medium">{cart.customer.first_name[0]}</span>
                      ) : (
                        <Ghost className="w-6 h-6 text-muted-foreground" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium">
                          {cart.customer ? `${cart.customer.first_name} ${cart.customer.last_name}` : 'Anonymous Visitor'}
                        </span>
                        <Badge variant={cart.status === 'abandoned' ? 'destructive' : cart.status === 'recovered' ? 'default' : 'secondary'} className="text-[10px]">
                          {cart.status}
                        </Badge>
                        <Badge variant="outline" className="text-[10px]">{cart.source}</Badge>
                      </div>
                      <div className="text-sm text-muted-foreground mb-2">
                        {cart.items.map((item, i) => (
                          <span key={i}>{item.title} x{item.quantity}{i < cart.items.length - 1 ? ', ' : ''}</span>
                        ))}
                      </div>
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          {cart.device_type === 'mobile' ? <Smartphone className="w-3 h-3" /> : <Monitor className="w-3 h-3" />}
                          {cart.device_type}
                        </span>
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3 h-3" />
                          {cart.city}, {cart.country}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {formatRelativeTime(cart.created_at)}
                        </span>
                        {cart.abandonment_reason && (
                          <span className="flex items-center gap-1">
                            <AlertTriangle className="w-3 h-3" />
                            {cart.abandonment_reason.replace('_', ' ')}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-xl font-bold">AED {cart.subtotal}</p>
                      {cart.status === 'abandoned' && (
                        <div className="flex gap-2 mt-2">
                          <Button size="sm" variant="outline" onClick={() => recoverCart(cart)}>
                            <Gift className="w-4 h-4 mr-1" /> Recover
                          </Button>
                          <Button size="sm" variant="ghost">
                            <MessageSquare className="w-4 h-4" />
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        ) : activeTab === 'cross-sell' ? (
          <div className="space-y-3">
            {crossSellOpps.map((opp) => (
              <Card key={opp.id} className="p-4">
                <div className="flex items-start gap-4">
                  <div className={cn(
                    "w-10 h-10 rounded-full flex items-center justify-center shrink-0",
                    opp.recommendation_type === 'cross_sell' && 'bg-green-500/20',
                    opp.recommendation_type === 'upsell' && 'bg-blue-500/20',
                    opp.recommendation_type === 'bundle' && 'bg-purple-500/20',
                    opp.recommendation_type === 'recovery' && 'bg-amber-500/20',
                  )}>
                    {opp.recommendation_type === 'cross_sell' && <TrendingUp className="w-5 h-5 text-green-500" />}
                    {opp.recommendation_type === 'upsell' && <ArrowUpRight className="w-5 h-5 text-blue-500" />}
                    {opp.recommendation_type === 'bundle' && <Gift className="w-5 h-5 text-purple-500" />}
                    {opp.recommendation_type === 'recovery' && <RefreshCw className="w-5 h-5 text-amber-500" />}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium">
                        {opp.customer ? `${opp.customer.first_name} ${opp.customer.last_name}` : 'Customer'}
                      </span>
                      <Badge variant="outline" className="text-[10px]">{opp.recommendation_type}</Badge>
                      <Badge variant={opp.status === 'pending' ? 'secondary' : 'default'} className="text-[10px]">{opp.status}</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mb-2">{opp.reason}</p>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">Confidence:</span>
                      <div className="h-2 w-24 bg-muted rounded-full overflow-hidden">
                        <div className="h-full bg-green-500" style={{ width: `${opp.confidence * 100}%` }} />
                      </div>
                      <span className="text-xs font-medium">{Math.round(opp.confidence * 100)}%</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xl font-bold text-green-600">+AED {opp.potential_value}</p>
                    {opp.status === 'pending' && (
                      <div className="flex gap-2 mt-2">
                        <Button size="sm">Execute</Button>
                        <Button size="sm" variant="outline">Dismiss</Button>
                      </div>
                    )}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <div className="space-y-3">
            {sessions.map((sess) => (
              <Card key={sess.id} className="p-4">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                    {sess.device_type === 'mobile' ? <Smartphone className="w-5 h-5" /> : <Monitor className="w-5 h-5" />}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{sess.customer_id ? 'Known Customer' : 'Anonymous'}</span>
                      {sess.is_returning && <Badge variant="secondary" className="text-[10px]">Returning</Badge>}
                      <Badge variant="outline" className="text-[10px]">{sess.source}</Badge>
                    </div>
                    <div className="flex items-center gap-4 text-xs text-muted-foreground mt-1">
                      <span>{sess.city}, {sess.country}</span>
                      <span>{Math.round(sess.time_on_site / 60)}m on site</span>
                      <span>{sess.pages_viewed?.length || 0} pages</span>
                      <span>{sess.products_viewed?.length || 0} products viewed</span>
                    </div>
                  </div>
                  <span className="text-xs text-muted-foreground">{formatRelativeTime(sess.created_at)}</span>
                </div>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
