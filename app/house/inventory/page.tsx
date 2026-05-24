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
  Filter,
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
  ChevronDown,
  ExternalLink,
  Clock,
  AlertCircle,
} from 'lucide-react';
import Link from 'next/link';

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

type TabType = 'catalogue' | 'parity' | 'stats';

export default function InventoryPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [stores, setStores] = useState<StoreConnection[]>([]);
  const [drifts, setDrifts] = useState<ParityDrift[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabType>('catalogue');
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
        return <Badge className="bg-red-500/20 text-red-400 border-red-500/30">Critical</Badge>;
      case 'high':
        return <Badge className="bg-orange-500/20 text-orange-400 border-orange-500/30">High</Badge>;
      case 'medium':
        return <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30">Medium</Badge>;
      default:
        return <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30">Low</Badge>;
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

          {/* Tabs */}
          <div className="flex items-center gap-1 mt-4">
            {(['catalogue', 'parity', 'stats'] as TabType[]).map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  activeTab === tab
                    ? 'bg-primary/20 text-primary'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                }`}
              >
                {tab === 'catalogue' && 'Catalogue'}
                {tab === 'parity' && `Parity (${stats.drifts})`}
                {tab === 'stats' && 'Stats'}
              </button>
            ))}
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-[1600px] mx-auto px-6 py-6">
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
