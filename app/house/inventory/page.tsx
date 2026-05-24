'use client';

import { useState, useEffect, useMemo } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Package,
  Search,
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  XCircle,
  ArrowLeft,
  TrendingUp,
  TrendingDown,
  ShoppingBag,
  Store,
  BarChart3,
  ExternalLink,
  Clock,
  AlertCircle,
  Activity,
  Bot,
  Brain,
  ClipboardList,
  Gem,
  Globe2,
  Route,
  Send,
  ShieldCheck,
  Sparkles,
  Tags,
  Truck,
  Users2,
  Zap,
  type LucideIcon,
} from 'lucide-react';
import Link from 'next/link';
import {
  INVENTORY_AI_ACTIONS,
  INVENTORY_CHANNELS,
  INVENTORY_OPTIONS,
  INVENTORY_REORDER_QUEUE,
  INVENTORY_RESERVATIONS,
  INVENTORY_SEO_TASKS,
  INVENTORY_SUPPLIERS,
} from '@/lib/operations-intelligence';

type Product = {
  id: string;
  store_id: string;
  external_id: string;
  sku: string;
  title: string;
  category: string;
  price: number;
  compare_at_price: number | null;
  stock_quantity: number;
  stock_status: 'in_stock' | 'out_of_stock' | 'low_stock' | 'preorder';
  is_on_sale: boolean;
  vendor: string;
  tags: string[];
  store_name?: string;
  platform?: string;
};

type StoreConnection = {
  id: string;
  name: string;
  platform: 'shopify' | 'woocommerce' | 'custom';
  is_active: boolean;
  last_sync_at: string | null;
};

type ParityDrift = {
  id: string;
  product_a_id: string;
  product_b_id: string;
  drift_type: 'price' | 'stock' | 'availability' | 'title' | 'other';
  field_name: string;
  value_a: string;
  value_b: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  is_resolved: boolean;
  detected_at: string;
  product_a?: Product;
  product_b?: Product;
};

type TabType =
  | 'command'
  | 'catalogue'
  | 'parity'
  | 'reservations'
  | 'reorder'
  | 'pricing'
  | 'channels'
  | 'seo'
  | 'suppliers'
  | 'stats';

const inventoryOptions = INVENTORY_OPTIONS as Array<{
  id: TabType;
  label: string;
  metric: string;
  detail: string;
}>;

const tabIcons: Record<TabType, LucideIcon> = {
  command: Bot,
  catalogue: Package,
  parity: ShieldCheck,
  reservations: ClipboardList,
  reorder: Truck,
  pricing: Tags,
  channels: Globe2,
  seo: Sparkles,
  suppliers: Users2,
  stats: BarChart3,
};

export default function InventoryPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [stores, setStores] = useState<StoreConnection[]>([]);
  const [drifts, setDrifts] = useState<ParityDrift[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabType>('command');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStore, setSelectedStore] = useState<string>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [stockFilter, setStockFilter] = useState<string>('all');
  const [syncing, setSyncing] = useState(false);

  const supabase = createClient();

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    try {
      // Load stores
      const { data: storesData } = await supabase
        .from('store_connections')
        .select('*')
        .eq('org_id', '00000000-0000-0000-0000-000000000001');
      
      setStores(storesData || []);

      // Load products with store info
      const { data: productsData } = await supabase
        .from('product_catalog')
        .select('*, store_connections(name, platform)')
        .eq('org_id', '00000000-0000-0000-0000-000000000001')
        .order('title');

      const productsWithStore = (productsData || []).map((p: any) => ({
        ...p,
        store_name: p.store_connections?.name,
        platform: p.store_connections?.platform,
      }));
      setProducts(productsWithStore);

      // Load parity drifts with product info
      const { data: driftsData } = await supabase
        .from('parity_drifts')
        .select('*')
        .eq('org_id', '00000000-0000-0000-0000-000000000001')
        .eq('is_resolved', false)
        .order('detected_at', { ascending: false });

      // Enrich drifts with product data
      const enrichedDrifts = (driftsData || []).map((drift: ParityDrift) => {
        const productA = productsWithStore.find((p: Product) => p.id === drift.product_a_id);
        const productB = productsWithStore.find((p: Product) => p.id === drift.product_b_id);
        return { ...drift, product_a: productA, product_b: productB };
      });
      setDrifts(enrichedDrifts);
    } catch (error) {
      console.error('Error loading data:', error);
    }
    setLoading(false);
  }

  async function resolveDrift(driftId: string) {
    await supabase
      .from('parity_drifts')
      .update({ is_resolved: true, resolved_at: new Date().toISOString() })
      .eq('id', driftId);
    
    setDrifts(drifts.filter(d => d.id !== driftId));
  }

  async function syncStore(storeId: string) {
    setSyncing(true);
    // Simulate sync delay
    await new Promise(resolve => setTimeout(resolve, 2000));
    await supabase
      .from('store_connections')
      .update({ last_sync_at: new Date().toISOString() })
      .eq('id', storeId);
    await loadData();
    setSyncing(false);
  }

  // Compute stats
  const stats = useMemo(() => {
    const shopifyProducts = products.filter(p => p.platform === 'shopify');
    const wooProducts = products.filter(p => p.platform === 'woocommerce');
    const outOfStock = products.filter(p => p.stock_status === 'out_of_stock');
    const lowStock = products.filter(p => p.stock_status === 'low_stock');
    const onSale = products.filter(p => p.is_on_sale);
    const categories = [...new Set(products.map(p => p.category))];

    return {
      total: products.length,
      shopify: shopifyProducts.length,
      woo: wooProducts.length,
      outOfStock: outOfStock.length,
      lowStock: lowStock.length,
      onSale: onSale.length,
      drifts: drifts.length,
      categories,
    };
  }, [products, drifts]);

  // Filter products
  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      const matchesSearch = !searchQuery || 
        p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.sku?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.vendor?.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesStore = selectedStore === 'all' || p.store_id === selectedStore;
      const matchesCategory = selectedCategory === 'all' || p.category === selectedCategory;
      const matchesStock = stockFilter === 'all' || 
        (stockFilter === 'in_stock' && p.stock_status === 'in_stock') ||
        (stockFilter === 'out_of_stock' && p.stock_status === 'out_of_stock') ||
        (stockFilter === 'low_stock' && p.stock_status === 'low_stock') ||
        (stockFilter === 'on_sale' && p.is_on_sale);

      return matchesSearch && matchesStore && matchesCategory && matchesStock;
    });
  }, [products, searchQuery, selectedStore, selectedCategory, stockFilter]);

  const getStockBadge = (status: string) => {
    switch (status) {
      case 'in_stock':
        return <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30">In Stock</Badge>;
      case 'out_of_stock':
        return <Badge className="bg-red-500/20 text-red-400 border-red-500/30">Out of Stock</Badge>;
      case 'low_stock':
        return <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30">Low Stock</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getSeverityBadge = (severity: string) => {
    switch (severity) {
      case 'critical':
      case 'urgent':
        return <Badge className="bg-red-500/20 text-red-400 border-red-500/30">Critical</Badge>;
      case 'high':
        return <Badge className="bg-orange-500/20 text-orange-400 border-orange-500/30">High</Badge>;
      case 'medium':
        return <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30">Medium</Badge>;
      default:
        return <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30">Low</Badge>;
    }
  };

  const getActionBadge = (urgency: string) => {
    switch (urgency) {
      case 'critical':
        return <Badge className="bg-red-500/20 text-red-400 border-red-500/30">Critical</Badge>;
      case 'high':
        return <Badge className="bg-orange-500/20 text-orange-400 border-orange-500/30">High</Badge>;
      case 'medium':
        return <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30">Medium</Badge>;
      case 'approve':
        return <Badge className="bg-primary/20 text-primary border-primary/30">Approve</Badge>;
      case 'held':
        return <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30">Held</Badge>;
      case 'review':
        return <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30">Review</Badge>;
      case 'drift':
      case 'warning':
        return <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30">{urgency}</Badge>;
      case 'online':
      case 'monitor':
      case 'bundle':
      case 'reserve':
        return <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30">{urgency}</Badge>;
      default:
        return <Badge variant="outline">{urgency}</Badge>;
    }
  };

  const formatTimeAgo = (date: string) => {
    const diff = Date.now() - new Date(date).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    return `${Math.floor(hours / 24)}d ago`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <RefreshCw className="w-8 h-8 text-primary animate-spin" />
          <p className="text-muted-foreground">Loading inventory...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border bg-card/80 backdrop-blur-md">
        <div className="max-w-[1600px] mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/house" className="text-muted-foreground hover:text-foreground transition-colors">
                <ArrowLeft className="w-5 h-5" />
              </Link>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
                  <Package className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h1 className="text-xl font-semibold">Inventory</h1>
                  <p className="text-sm text-muted-foreground">Product catalog &amp; parity management</p>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {stores.map(store => (
                <Button
                  key={store.id}
                  variant="outline"
                  size="sm"
                  onClick={() => syncStore(store.id)}
                  disabled={syncing}
                  className="gap-2"
                >
                  <RefreshCw className={`w-4 h-4 ${syncing ? 'animate-spin' : ''}`} />
                  Sync {store.platform === 'shopify' ? 'Shopify' : 'WooCommerce'}
                </Button>
              ))}
            </div>
          </div>

          {/* Stats Row */}
          <div className="flex items-center gap-6 mt-4 text-sm">
            <div className="flex items-center gap-2">
              <Store className="w-4 h-4 text-[#96bf48]" />
              <span className="text-muted-foreground">Shopify:</span>
              <span className="font-medium">{stats.shopify}</span>
            </div>
            <div className="flex items-center gap-2">
              <Store className="w-4 h-4 text-[#7f54b3]" />
              <span className="text-muted-foreground">WooCommerce:</span>
              <span className="font-medium">{stats.woo}</span>
            </div>
            <div className="h-4 w-px bg-border" />
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-500" />
              <span className="text-muted-foreground">Drifts:</span>
              <span className="font-medium text-amber-500">{stats.drifts}</span>
            </div>
            <div className="flex items-center gap-2">
              <XCircle className="w-4 h-4 text-red-500" />
              <span className="text-muted-foreground">Out of Stock:</span>
              <span className="font-medium text-red-500">{stats.outOfStock}</span>
            </div>
          </div>

          {/* Command Options */}
          <div className="mt-4 flex gap-2 overflow-x-auto pb-1">
            {inventoryOptions.map(option => {
              const OptionIcon = tabIcons[option.id];
              const metric = option.id === 'parity' ? `${stats.drifts} drifts` : option.metric;
              return (
              <button
                key={option.id}
                type="button"
                aria-pressed={activeTab === option.id}
                onClick={() => setActiveTab(option.id)}
                className={`min-w-[170px] rounded-lg border px-3 py-2 text-left transition-colors ${
                  activeTab === option.id
                    ? 'border-primary/40 bg-primary/15 text-primary'
                    : 'border-border bg-background/50 text-muted-foreground hover:bg-muted/50 hover:text-foreground'
                }`}
              >
                <span className="flex items-center justify-between gap-3">
                  <span className="flex items-center gap-2 text-sm font-medium">
                    <OptionIcon className="h-4 w-4" />
                    {option.label}
                  </span>
                  <Badge variant="outline" className="text-[10px]">
                    {metric}
                  </Badge>
                </span>
                <span className="mt-1 block truncate text-xs text-muted-foreground">{option.detail}</span>
              </button>
              );
            })}
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-[1600px] mx-auto px-6 py-6">
        {activeTab === 'command' && (
          <div className="space-y-6">
            <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              <Card className="border-border bg-card/70">
                <CardContent className="p-5">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-xs uppercase tracking-wider text-muted-foreground">AI priorities</p>
                      <p className="mt-2 text-3xl font-semibold">{INVENTORY_AI_ACTIONS.length}</p>
                    </div>
                    <Brain className="h-5 w-5 text-primary" />
                  </div>
                  <p className="mt-3 text-sm text-muted-foreground">Inventory decisions queued for owner and operators</p>
                </CardContent>
              </Card>
              <Card className="border-border bg-card/70">
                <CardContent className="p-5">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-xs uppercase tracking-wider text-muted-foreground">Low stock</p>
                      <p className="mt-2 text-3xl font-semibold text-amber-400">{stats.lowStock}</p>
                    </div>
                    <AlertTriangle className="h-5 w-5 text-amber-400" />
                  </div>
                  <p className="mt-3 text-sm text-muted-foreground">Moonstone demand and bridal holds need stock protection</p>
                </CardContent>
              </Card>
              <Card className="border-border bg-card/70">
                <CardContent className="p-5">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-xs uppercase tracking-wider text-muted-foreground">Reservations</p>
                      <p className="mt-2 text-3xl font-semibold text-primary">{INVENTORY_RESERVATIONS.length}</p>
                    </div>
                    <ClipboardList className="h-5 w-5 text-primary" />
                  </div>
                  <p className="mt-3 text-sm text-muted-foreground">VIP women, bridal deadlines, and private drop stock holds</p>
                </CardContent>
              </Card>
              <Card className="border-border bg-card/70">
                <CardContent className="p-5">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-xs uppercase tracking-wider text-muted-foreground">Channel risk</p>
                      <p className="mt-2 text-3xl font-semibold text-red-400">{stats.drifts}</p>
                    </div>
                    <ShieldCheck className="h-5 w-5 text-red-400" />
                  </div>
                  <p className="mt-3 text-sm text-muted-foreground">Price, stock, copy, and catalog sync issues across channels</p>
                </CardContent>
              </Card>
            </section>

            <section className="grid gap-6 xl:grid-cols-[1.4fr_.9fr]">
              <Card className="border-border bg-card/70">
                <CardHeader className="border-b border-border">
                  <div className="flex items-center justify-between gap-3">
                    <CardTitle className="flex items-center gap-2 text-base">
                      <Bot className="h-4 w-4 text-primary" />
                      Inventory AI Action Queue
                    </CardTitle>
                    <Badge variant="secondary">Ladies commerce guardrails active</Badge>
                  </div>
                </CardHeader>
                <CardContent className="grid gap-4 p-4 lg:grid-cols-2">
                  {INVENTORY_AI_ACTIONS.map(action => (
                    <div key={action.title} className="rounded-md border border-border bg-background/50 p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <h2 className="text-sm font-medium leading-snug">{action.title}</h2>
                          <p className="mt-1 text-xs text-muted-foreground">Owner: {action.owner}</p>
                        </div>
                        {getActionBadge(action.urgency)}
                      </div>
                      <p className="mt-4 text-sm text-primary">{action.impact}</p>
                      <p className="mt-2 text-sm text-muted-foreground">{action.reason}</p>
                      <div className="mt-4 rounded-md border border-primary/20 bg-primary/5 p-3 text-sm">
                        {action.action}
                      </div>
                      <div className="mt-4 flex flex-wrap gap-2">
                        <Button size="sm" variant="outline" className="gap-2">
                          <Route className="h-4 w-4" />
                          Route
                        </Button>
                        <Button size="sm" className="gap-2">
                          <Zap className="h-4 w-4" />
                          Prepare
                        </Button>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>

              <aside className="space-y-6">
                <Card className="border-primary/25 bg-primary/5">
                  <CardContent className="p-5">
                    <div className="flex items-start gap-3">
                      <Gem className="mt-1 h-5 w-5 text-primary" />
                      <div>
                        <h2 className="font-medium">Inventory Rules</h2>
                        <p className="mt-2 text-sm text-muted-foreground">
                          Products, holds, bundles, and SEO copy are for women customers only. Do not create male customer examples.
                        </p>
                        <p className="mt-2 text-sm text-muted-foreground">
                          Price changes, BNPL exceptions, refunds, and public stock promises stay owner-approved.
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-border bg-card/70">
                  <CardHeader className="border-b border-border">
                    <CardTitle className="flex items-center gap-2 text-base">
                      <Activity className="h-4 w-4 text-emerald-300" />
                      Fast Signals
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3 p-4">
                    {[
                      ['Reorder exposure', 'AED 18,000 Moonstone weekend demand'],
                      ['Margin risk', 'AED 14,600 from Ruby Bangle price drift'],
                      ['VIP holds', `${INVENTORY_RESERVATIONS.length} customer reservations`],
                      ['SEO gap', `${INVENTORY_SEO_TASKS.length} product copy tasks`],
                    ].map(([label, value]) => (
                      <div key={label} className="flex items-center justify-between rounded-md border border-border bg-background/50 p-3 text-sm">
                        <span className="text-muted-foreground">{label}</span>
                        <span className="font-medium">{value}</span>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </aside>
            </section>
          </div>
        )}

        {activeTab === 'catalogue' && (
          <div className="space-y-4">
            {/* Filters */}
            <div className="flex items-center gap-4 flex-wrap">
              <div className="relative flex-1 min-w-[300px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search products by name, SKU, or vendor..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <select
                value={selectedStore}
                onChange={(e) => setSelectedStore(e.target.value)}
                className="h-10 px-3 rounded-md border border-input bg-background text-sm"
              >
                <option value="all">All Stores</option>
                {stores.map(store => (
                  <option key={store.id} value={store.id}>{store.name}</option>
                ))}
              </select>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="h-10 px-3 rounded-md border border-input bg-background text-sm"
              >
                <option value="all">All Categories</option>
                {stats.categories.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
              <select
                value={stockFilter}
                onChange={(e) => setStockFilter(e.target.value)}
                className="h-10 px-3 rounded-md border border-input bg-background text-sm"
              >
                <option value="all">All Stock</option>
                <option value="in_stock">In Stock</option>
                <option value="low_stock">Low Stock</option>
                <option value="out_of_stock">Out of Stock</option>
                <option value="on_sale">On Sale</option>
              </select>
            </div>

            {/* Product Table */}
            <div className="border border-border rounded-xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-muted/50">
                    <tr className="text-left text-sm text-muted-foreground">
                      <th className="px-4 py-3 font-medium">Product</th>
                      <th className="px-4 py-3 font-medium">Store</th>
                      <th className="px-4 py-3 font-medium">SKU</th>
                      <th className="px-4 py-3 font-medium">Category</th>
                      <th className="px-4 py-3 font-medium text-right">Price</th>
                      <th className="px-4 py-3 font-medium text-center">Stock</th>
                      <th className="px-4 py-3 font-medium text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {filteredProducts.map(product => (
                      <tr key={product.id} className="hover:bg-muted/30 transition-colors">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center">
                              <ShoppingBag className="w-5 h-5 text-muted-foreground" />
                            </div>
                            <div>
                              <p className="font-medium text-sm">{product.title}</p>
                              <p className="text-xs text-muted-foreground">{product.vendor}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <div className={`w-2 h-2 rounded-full ${
                              product.platform === 'shopify' ? 'bg-[#96bf48]' : 'bg-[#7f54b3]'
                            }`} />
                            <span className="text-sm">{product.platform === 'shopify' ? 'Shopify' : 'WooCommerce'}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <code className="text-xs bg-muted px-2 py-1 rounded">{product.sku}</code>
                        </td>
                        <td className="px-4 py-3 text-sm">{product.category}</td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex flex-col items-end">
                            <span className="font-medium">AED {product.price.toFixed(2)}</span>
                            {product.compare_at_price && (
                              <span className="text-xs text-muted-foreground line-through">
                                AED {product.compare_at_price.toFixed(2)}
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className={`font-medium ${
                            product.stock_quantity === 0 ? 'text-red-500' :
                            product.stock_quantity <= 5 ? 'text-amber-500' : ''
                          }`}>
                            {product.stock_quantity}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <div className="flex items-center justify-center gap-2">
                            {getStockBadge(product.stock_status)}
                            {product.is_on_sale && (
                              <Badge className="bg-primary/20 text-primary border-primary/30">Sale</Badge>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="px-4 py-3 bg-muted/30 border-t border-border">
                <p className="text-sm text-muted-foreground">
                  Showing {filteredProducts.length} of {products.length} products
                </p>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'parity' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold">Parity Drifts</h2>
                <p className="text-sm text-muted-foreground">
                  Price and stock discrepancies between stores
                </p>
              </div>
              <Button variant="outline" size="sm" onClick={loadData}>
                <RefreshCw className="w-4 h-4 mr-2" />
                Refresh
              </Button>
            </div>

            {drifts.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <CheckCircle className="w-12 h-12 text-emerald-500 mx-auto mb-4" />
                  <h3 className="text-lg font-medium">All in sync!</h3>
                  <p className="text-muted-foreground">No parity drifts detected between your stores.</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4">
                {drifts.map(drift => (
                  <Card key={drift.id} className="border-l-4 border-l-amber-500">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-4">
                          <div className="w-10 h-10 rounded-lg bg-amber-500/20 flex items-center justify-center shrink-0">
                            <AlertTriangle className="w-5 h-5 text-amber-500" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <h3 className="font-medium">{drift.product_a?.title || 'Unknown Product'}</h3>
                              {getSeverityBadge(drift.severity)}
                            </div>
                            <p className="text-sm text-muted-foreground mb-3">
                              {drift.drift_type === 'price' && 'Price mismatch between stores'}
                              {drift.drift_type === 'stock' && 'Stock quantity mismatch'}
                              {drift.drift_type === 'availability' && 'Availability status mismatch'}
                            </p>
                            <div className="flex items-center gap-6 text-sm">
                              <div className="flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full bg-[#96bf48]" />
                                <span className="text-muted-foreground">Shopify:</span>
                                <span className="font-medium">
                                  {drift.drift_type === 'price' ? `AED ${drift.value_a}` : drift.value_a}
                                </span>
                              </div>
                              <div className="flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full bg-[#7f54b3]" />
                                <span className="text-muted-foreground">WooCommerce:</span>
                                <span className="font-medium">
                                  {drift.drift_type === 'price' ? `AED ${drift.value_b}` : drift.value_b}
                                </span>
                              </div>
                              {drift.drift_type === 'price' && (
                                <div className="flex items-center gap-1 text-amber-500">
                                  {parseFloat(drift.value_a) > parseFloat(drift.value_b) ? (
                                    <TrendingDown className="w-4 h-4" />
                                  ) : (
                                    <TrendingUp className="w-4 h-4" />
                                  )}
                                  <span>
                                    AED {Math.abs(parseFloat(drift.value_a) - parseFloat(drift.value_b)).toFixed(2)} diff
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Clock className="w-3 h-3" />
                            {formatTimeAgo(drift.detected_at)}
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => resolveDrift(drift.id)}
                          >
                            <CheckCircle className="w-4 h-4 mr-1" />
                            Resolve
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'reservations' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h2 className="text-lg font-semibold">Reservations</h2>
                <p className="text-sm text-muted-foreground">Stock holds for VIP women, bridal deadlines, and private drops</p>
              </div>
              <Button className="gap-2">
                <ClipboardList className="h-4 w-4" />
                New Hold
              </Button>
            </div>
            <div className="grid gap-4 lg:grid-cols-3">
              {INVENTORY_RESERVATIONS.map(reservation => (
                <Card key={`${reservation.customer}-${reservation.product}`} className="border-border bg-card/70">
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-medium">{reservation.customer}</p>
                        <p className="mt-1 text-xs text-muted-foreground">{reservation.product}</p>
                      </div>
                      {getActionBadge(reservation.status)}
                    </div>
                    <div className="mt-5 grid grid-cols-2 gap-3 text-sm">
                      <div className="rounded-md border border-border bg-background/50 p-3">
                        <p className="text-xs text-muted-foreground">Quantity</p>
                        <p className="mt-1 text-xl font-semibold">{reservation.qty}</p>
                      </div>
                      <div className="rounded-md border border-border bg-background/50 p-3">
                        <p className="text-xs text-muted-foreground">Expires</p>
                        <p className="mt-1 font-medium">{reservation.expires}</p>
                      </div>
                    </div>
                    <p className="mt-4 text-sm text-muted-foreground">{reservation.reason}</p>
                    <div className="mt-4 flex items-center justify-between text-xs text-muted-foreground">
                      <span>Owner</span>
                      <span className="font-medium text-foreground">{reservation.owner}</span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'reorder' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h2 className="text-lg font-semibold">Reorder Queue</h2>
                <p className="text-sm text-muted-foreground">Supplier decisions, demand forecasts, and stockout prevention</p>
              </div>
              <Button variant="outline" className="gap-2">
                <Truck className="h-4 w-4" />
                Supplier Plan
              </Button>
            </div>
            <div className="grid gap-4 xl:grid-cols-2">
              {INVENTORY_REORDER_QUEUE.map(item => {
                const stockRatio = Math.min(100, Math.round((item.current / item.threshold) * 100));
                return (
                  <Card key={item.product} className="border-border bg-card/70">
                    <CardContent className="p-5">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <h3 className="font-medium">{item.product}</h3>
                          <p className="mt-1 text-xs text-muted-foreground">{item.supplier} - lead time {item.leadTime}</p>
                        </div>
                        {getActionBadge(item.status)}
                      </div>
                      <div className="mt-5 grid grid-cols-3 gap-3 text-center text-sm">
                        <div className="rounded-md border border-border bg-background/50 p-3">
                          <p className="text-2xl font-semibold">{item.current}</p>
                          <p className="text-xs text-muted-foreground">Current</p>
                        </div>
                        <div className="rounded-md border border-border bg-background/50 p-3">
                          <p className="text-2xl font-semibold">{item.threshold}</p>
                          <p className="text-xs text-muted-foreground">Threshold</p>
                        </div>
                        <div className="rounded-md border border-primary/25 bg-primary/5 p-3">
                          <p className="text-2xl font-semibold text-primary">{item.reorder}</p>
                          <p className="text-xs text-muted-foreground">Reorder</p>
                        </div>
                      </div>
                      <div className="mt-4">
                        <div className="mb-2 flex items-center justify-between text-xs">
                          <span className="text-muted-foreground">Threshold coverage</span>
                          <span>{stockRatio}%</span>
                        </div>
                        <div className="h-2 overflow-hidden rounded-full bg-muted">
                          <div
                            className={`h-full rounded-full ${stockRatio < 60 ? 'bg-amber-400' : 'bg-emerald-400'}`}
                            style={{ width: `${stockRatio}%` }}
                          />
                        </div>
                      </div>
                      <p className="mt-4 text-sm text-muted-foreground">{item.forecast}</p>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        )}

        {activeTab === 'pricing' && (
          <div className="space-y-6">
            <section className="grid gap-4 lg:grid-cols-3">
              <Card className="border-border bg-card/70">
                <CardContent className="p-5">
                  <div className="flex items-center gap-3">
                    <AlertCircle className="h-5 w-5 text-amber-400" />
                    <div>
                      <p className="text-2xl font-semibold">13.6%</p>
                      <p className="text-xs text-muted-foreground">Ruby Bangle channel drift</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card className="border-border bg-card/70">
                <CardContent className="p-5">
                  <div className="flex items-center gap-3">
                    <Gem className="h-5 w-5 text-primary" />
                    <div>
                      <p className="text-2xl font-semibold">Luxury first</p>
                      <p className="text-xs text-muted-foreground">Concierge value before discounts</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card className="border-border bg-card/70">
                <CardContent className="p-5">
                  <div className="flex items-center gap-3">
                    <ShieldCheck className="h-5 w-5 text-emerald-400" />
                    <div>
                      <p className="text-2xl font-semibold">Owner gate</p>
                      <p className="text-xs text-muted-foreground">Price changes, BNPL, and exceptions require approval</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </section>

            <Card className="border-border bg-card/70">
              <CardHeader className="border-b border-border">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Tags className="h-4 w-4 text-primary" />
                  Pricing Guardrails
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 p-4">
                {INVENTORY_AI_ACTIONS.filter(action => action.title.includes('price') || action.title.includes('Ruby')).map(action => (
                  <div key={action.title} className="rounded-md border border-border bg-background/50 p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h3 className="text-sm font-medium">{action.title}</h3>
                        <p className="mt-1 text-xs text-muted-foreground">Owner: {action.owner}</p>
                      </div>
                      {getActionBadge(action.urgency)}
                    </div>
                    <p className="mt-3 text-sm text-muted-foreground">{action.reason}</p>
                    <p className="mt-3 rounded-md border border-primary/20 bg-primary/5 p-3 text-sm">{action.action}</p>
                  </div>
                ))}
                <div className="rounded-md border border-border bg-background/50 p-4">
                  <h3 className="text-sm font-medium">Live parity evidence</h3>
                  <div className="mt-3 space-y-2">
                    {drifts.length === 0 ? (
                      <p className="text-sm text-muted-foreground">No unresolved pricing drift from connected stores.</p>
                    ) : (
                      drifts.map(drift => (
                        <div key={drift.id} className="flex items-center justify-between gap-3 text-sm">
                          <span className="text-muted-foreground">{drift.product_a?.title || drift.field_name}</span>
                          <span className="font-medium">{drift.value_a} / {drift.value_b}</span>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {activeTab === 'channels' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h2 className="text-lg font-semibold">Channel Sync</h2>
                <p className="text-sm text-muted-foreground">Shopify, WooCommerce, WhatsApp Catalog, and Google Merchant coverage</p>
              </div>
              <Button variant="outline" className="gap-2" onClick={loadData}>
                <RefreshCw className="h-4 w-4" />
                Recheck
              </Button>
            </div>
            <div className="grid gap-4 lg:grid-cols-2">
              {INVENTORY_CHANNELS.map(channel => (
                <Card key={channel.name} className="border-border bg-card/70">
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h3 className="font-medium">{channel.name}</h3>
                        <p className="mt-1 text-xs text-muted-foreground">{channel.products} products - synced {channel.sync}</p>
                      </div>
                      {getActionBadge(channel.status)}
                    </div>
                    <p className="mt-4 text-sm text-muted-foreground">{channel.issue}</p>
                    <div className="mt-4 flex flex-wrap gap-2">
                      <Button size="sm" variant="outline" className="gap-2">
                        <RefreshCw className="h-4 w-4" />
                        Sync
                      </Button>
                      <Button size="sm" variant="ghost" className="gap-2">
                        <ExternalLink className="h-4 w-4" />
                        Open
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'seo' && (
          <div className="space-y-6">
            <Card className="border-border bg-card/70">
              <CardHeader className="border-b border-border">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Sparkles className="h-4 w-4 text-primary" />
                  Product SEO Copy Queue
                </CardTitle>
              </CardHeader>
              <CardContent className="grid gap-4 p-4 lg:grid-cols-2">
                {INVENTORY_SEO_TASKS.map(task => (
                  <div key={`${task.product}-${task.keyword}`} className="rounded-md border border-border bg-background/50 p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h3 className="text-sm font-medium">{task.product}</h3>
                        <p className="mt-1 text-xs text-primary">{task.keyword}</p>
                      </div>
                      <Badge variant="outline">{task.impact}</Badge>
                    </div>
                    <p className="mt-4 text-sm text-muted-foreground">{task.issue}</p>
                    <Button size="sm" className="mt-4 gap-2">
                      <Send className="h-4 w-4" />
                      Draft Copy
                    </Button>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        )}

        {activeTab === 'suppliers' && (
          <div className="space-y-6">
            <div className="grid gap-4 xl:grid-cols-2">
              {INVENTORY_SUPPLIERS.map(supplier => (
                <Card key={supplier.name} className="border-border bg-card/70">
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h3 className="font-medium">{supplier.name}</h3>
                        <p className="mt-1 text-xs text-muted-foreground">{supplier.category} - lead time {supplier.leadTime}</p>
                      </div>
                      <Badge variant="outline">{supplier.health}% health</Badge>
                    </div>
                    <div className="mt-5">
                      <div className="mb-2 flex items-center justify-between text-xs">
                        <span className="text-muted-foreground">Reliability</span>
                        <span>{supplier.health}%</span>
                      </div>
                      <div className="h-2 overflow-hidden rounded-full bg-muted">
                        <div
                          className={`h-full rounded-full ${supplier.health < 80 ? 'bg-amber-400' : 'bg-emerald-400'}`}
                          style={{ width: `${supplier.health}%` }}
                        />
                      </div>
                    </div>
                    <p className="mt-4 rounded-md border border-border bg-background/50 p-3 text-sm text-muted-foreground">
                      {supplier.risk}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'stats' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Total Products</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{stats.total}</div>
                <p className="text-sm text-muted-foreground mt-1">
                  Across {stores.length} stores
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Shopify Products</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-[#96bf48]">{stats.shopify}</div>
                <p className="text-sm text-muted-foreground mt-1">
                  {stores.find(s => s.platform === 'shopify')?.name}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">WooCommerce Products</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-[#7f54b3]">{stats.woo}</div>
                <p className="text-sm text-muted-foreground mt-1">
                  {stores.find(s => s.platform === 'woocommerce')?.name}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Parity Drifts</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-amber-500">{stats.drifts}</div>
                <p className="text-sm text-muted-foreground mt-1">
                  Unresolved discrepancies
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Out of Stock</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-red-500">{stats.outOfStock}</div>
                <p className="text-sm text-muted-foreground mt-1">
                  Products unavailable
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Low Stock</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-amber-500">{stats.lowStock}</div>
                <p className="text-sm text-muted-foreground mt-1">
                  Need restocking soon
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">On Sale</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-primary">{stats.onSale}</div>
                <p className="text-sm text-muted-foreground mt-1">
                  Active promotions
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Categories</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{stats.categories.length}</div>
                <p className="text-sm text-muted-foreground mt-1">
                  Product categories
                </p>
              </CardContent>
            </Card>

            {/* Category Breakdown */}
            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle className="text-sm font-medium">Products by Category</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {stats.categories.map(cat => {
                    const count = products.filter(p => p.category === cat).length;
                    const percentage = (count / products.length) * 100;
                    return (
                      <div key={cat} className="flex items-center gap-3">
                        <span className="text-sm w-32 truncate">{cat}</span>
                        <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-primary rounded-full"
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                        <span className="text-sm text-muted-foreground w-12 text-right">{count}</span>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Store Sync Status */}
            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle className="text-sm font-medium">Store Sync Status</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {stores.map(store => (
                    <div key={store.id} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`w-3 h-3 rounded-full ${
                          store.platform === 'shopify' ? 'bg-[#96bf48]' : 'bg-[#7f54b3]'
                        }`} />
                        <div>
                          <p className="font-medium text-sm">{store.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {store.last_sync_at 
                              ? `Last synced: ${formatTimeAgo(store.last_sync_at)}`
                              : 'Never synced'
                            }
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {store.is_active ? (
                          <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30">
                            Active
                          </Badge>
                        ) : (
                          <Badge variant="outline">Inactive</Badge>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => syncStore(store.id)}
                          disabled={syncing}
                        >
                          <RefreshCw className={`w-4 h-4 ${syncing ? 'animate-spin' : ''}`} />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </main>
    </div>
  );
}
