'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  ArrowLeft, Search, TrendingUp, TrendingDown, Minus, RefreshCw, Plus,
  Globe, Zap, Eye, MousePointer, Target, AlertTriangle, CheckCircle,
  MessageSquare, ShoppingCart, Sparkles, Filter, ArrowUpRight, ExternalLink,
  BarChart3, PieChart, Activity, Layers, Tag, Link2, FileWarning, Smartphone
} from 'lucide-react';
import Link from 'next/link';

const supabase = createClient();

type Keyword = {
  id: string;
  keyword: string;
  match_type: string;
  category: string;
  intent: string;
  source: string;
  status: string;
  priority: number;
  monthly_volume: number | null;
  competition: number | null;
  cpc: number | null;
  trend: string | null;
  performance_score: number;
  impressions: number;
  clicks: number;
  conversions: number;
};

type SEOReport = {
  id: string;
  report_date: string;
  overall_score: number;
  performance_score: number;
  accessibility_score: number;
  best_practices_score: number;
  seo_score: number;
  total_pages: number;
  indexed_pages: number;
  crawl_errors: number;
  broken_links: number;
  missing_meta: number;
  slow_pages: number;
  mobile_issues: number;
  top_issues: any[];
  recommendations: any[];
};

type KeywordExtraction = {
  id: string;
  source_type: string;
  extracted_text: string;
  normalized_keyword: string;
  confidence: number;
  intent: string;
  suggested_match_type: string;
  suggested_products: any[];
  is_processed: boolean;
  created_at: string;
};

type SearchConsoleData = {
  id: string;
  query: string;
  page: string;
  device: string;
  impressions: number;
  clicks: number;
  ctr: number;
  position: number;
};

export default function GoogleDashboardPage() {
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'keywords' | 'extractions' | 'search-console'>('overview');
  const [keywords, setKeywords] = useState<Keyword[]>([]);
  const [seoReport, setSeoReport] = useState<SEOReport | null>(null);
  const [extractions, setExtractions] = useState<KeywordExtraction[]>([]);
  const [searchConsoleData, setSearchConsoleData] = useState<SearchConsoleData[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [sourceFilter, setSourceFilter] = useState<string>('all');
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    try {
      const [keywordsRes, seoRes, extractionsRes, searchConsoleRes] = await Promise.all([
        supabase.from('keywords').select('*').eq('org_id', '00000000-0000-0000-0000-000000000001').order('priority', { ascending: false }),
        supabase.from('seo_reports').select('*').eq('org_id', '00000000-0000-0000-0000-000000000001').order('report_date', { ascending: false }).limit(1),
        supabase.from('keyword_extractions').select('*').eq('org_id', '00000000-0000-0000-0000-000000000001').order('created_at', { ascending: false }),
        supabase.from('search_console_data').select('*').eq('org_id', '00000000-0000-0000-0000-000000000001').order('impressions', { ascending: false })
      ]);

      setKeywords(keywordsRes.data || []);
      setSeoReport(seoRes.data?.[0] || null);
      setExtractions(extractionsRes.data || []);
      setSearchConsoleData(searchConsoleRes.data || []);
    } catch (err) {
      console.error('[v0] Error loading data:', err);
    } finally {
      setLoading(false);
    }
  }

  async function runSEOScan() {
    setIsRefreshing(true);
    // Simulate SEO scan - in production would call real API
    await new Promise(r => setTimeout(r, 2000));
    await loadData();
    setIsRefreshing(false);
  }

  async function promoteExtraction(extraction: KeywordExtraction) {
    // Create keyword from extraction
    const { error } = await supabase.from('keywords').insert({
      org_id: '00000000-0000-0000-0000-000000000001',
      keyword: extraction.normalized_keyword,
      match_type: extraction.suggested_match_type,
      intent: extraction.intent,
      source: extraction.source_type === 'message' ? 'whatsapp' : 'search_console',
      status: 'active',
      priority: Math.round(extraction.confidence * 100)
    });

    if (!error) {
      await supabase.from('keyword_extractions').update({ is_processed: true }).eq('id', extraction.id);
      await loadData();
    }
  }

  const filteredKeywords = keywords.filter(k => {
    const matchesSearch = k.keyword.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesSource = sourceFilter === 'all' || k.source === sourceFilter;
    return matchesSearch && matchesSource;
  });

  const activeKeywords = keywords.filter(k => k.status === 'active');
  const pendingExtractions = extractions.filter(e => !e.is_processed);
  const totalImpressions = keywords.reduce((sum, k) => sum + k.impressions, 0);
  const totalClicks = keywords.reduce((sum, k) => sum + k.clicks, 0);

  const sourceColors: Record<string, string> = {
    whatsapp: 'bg-green-500/10 text-green-600 border-green-500/20',
    search_console: 'bg-blue-500/10 text-blue-600 border-blue-500/20',
    ai_suggested: 'bg-purple-500/10 text-purple-600 border-purple-500/20',
    manual: 'bg-zinc-500/10 text-zinc-600 border-zinc-500/20',
    competitor: 'bg-orange-500/10 text-orange-600 border-orange-500/20'
  };

  const matchTypeColors: Record<string, string> = {
    broad: 'bg-amber-500/10 text-amber-600',
    phrase: 'bg-blue-500/10 text-blue-600',
    exact: 'bg-green-500/10 text-green-600',
    negative: 'bg-red-500/10 text-red-600'
  };

  const intentIcons: Record<string, any> = {
    informational: Eye,
    navigational: Globe,
    commercial: ShoppingCart,
    transactional: Target
  };

  function getScoreColor(score: number) {
    if (score >= 90) return 'text-green-600';
    if (score >= 70) return 'text-amber-600';
    return 'text-red-600';
  }

  function getScoreBg(score: number) {
    if (score >= 90) return 'bg-green-500';
    if (score >= 70) return 'bg-amber-500';
    return 'bg-red-500';
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex items-center gap-3">
          <RefreshCw className="h-5 w-5 animate-spin text-muted-foreground" />
          <span className="text-muted-foreground">Loading Google Dashboard...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card sticky top-0 z-10">
        <div className="flex items-center justify-between px-6 py-4">
          <div className="flex items-center gap-4">
            <Link href="/house" className="text-muted-foreground hover:text-foreground transition-colors">
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <div>
              <h1 className="text-xl font-semibold text-foreground">Google Dashboard</h1>
              <p className="text-sm text-muted-foreground">SEO health, keywords, and search intelligence</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" size="sm" onClick={runSEOScan} disabled={isRefreshing}>
              <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
              {isRefreshing ? 'Scanning...' : 'Run SEO Scan'}
            </Button>
            <Button size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Add Keyword
            </Button>
          </div>
        </div>

        {/* Stats Bar */}
        <div className="grid grid-cols-5 gap-4 px-6 py-3 border-t border-border bg-muted/30">
          <div className="flex items-center gap-2">
            <div className={`p-1.5 rounded ${seoReport ? getScoreBg(seoReport.overall_score) : 'bg-muted'}`}>
              <Activity className="h-4 w-4 text-white" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">SEO Score</p>
              <p className={`text-sm font-semibold ${seoReport ? getScoreColor(seoReport.overall_score) : ''}`}>
                {seoReport?.overall_score || 0}/100
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded bg-blue-500">
              <Tag className="h-4 w-4 text-white" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Active Keywords</p>
              <p className="text-sm font-semibold">{activeKeywords.length}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded bg-purple-500">
              <Sparkles className="h-4 w-4 text-white" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Pending Mining</p>
              <p className="text-sm font-semibold">{pendingExtractions.length}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded bg-green-500">
              <Eye className="h-4 w-4 text-white" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Impressions</p>
              <p className="text-sm font-semibold">{(totalImpressions / 1000).toFixed(1)}K</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded bg-amber-500">
              <MousePointer className="h-4 w-4 text-white" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Clicks</p>
              <p className="text-sm font-semibold">{(totalClicks / 1000).toFixed(1)}K</p>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 px-6 py-2 border-t border-border">
          {[
            { id: 'overview', label: 'Overview' },
            { id: 'keywords', label: 'Keywords', count: activeKeywords.length },
            { id: 'extractions', label: 'Mining Queue', count: pendingExtractions.length },
            { id: 'search-console', label: 'Search Console' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                activeTab === tab.id 
                  ? 'bg-primary text-primary-foreground' 
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted'
              }`}
            >
              {tab.label}
              {tab.count !== undefined && (
                <span className={`ml-2 px-1.5 py-0.5 text-xs rounded ${
                  activeTab === tab.id ? 'bg-primary-foreground/20' : 'bg-muted'
                }`}>
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>
      </header>

      <main className="p-6">
        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* SEO Health Cards */}
            <div className="grid grid-cols-4 gap-4">
              {seoReport && (
                <>
                  <Card>
                    <CardContent className="pt-6">
                      <div className="flex items-center justify-between mb-4">
                        <span className="text-sm text-muted-foreground">Performance</span>
                        <Zap className="h-4 w-4 text-amber-500" />
                      </div>
                      <div className="flex items-end gap-2">
                        <span className={`text-3xl font-bold ${getScoreColor(seoReport.performance_score)}`}>
                          {seoReport.performance_score}
                        </span>
                        <span className="text-muted-foreground mb-1">/100</span>
                      </div>
                      <div className="mt-3 h-2 bg-muted rounded-full overflow-hidden">
                        <div className={`h-full ${getScoreBg(seoReport.performance_score)} transition-all`} style={{ width: `${seoReport.performance_score}%` }} />
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="pt-6">
                      <div className="flex items-center justify-between mb-4">
                        <span className="text-sm text-muted-foreground">Accessibility</span>
                        <Eye className="h-4 w-4 text-blue-500" />
                      </div>
                      <div className="flex items-end gap-2">
                        <span className={`text-3xl font-bold ${getScoreColor(seoReport.accessibility_score)}`}>
                          {seoReport.accessibility_score}
                        </span>
                        <span className="text-muted-foreground mb-1">/100</span>
                      </div>
                      <div className="mt-3 h-2 bg-muted rounded-full overflow-hidden">
                        <div className={`h-full ${getScoreBg(seoReport.accessibility_score)} transition-all`} style={{ width: `${seoReport.accessibility_score}%` }} />
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="pt-6">
                      <div className="flex items-center justify-between mb-4">
                        <span className="text-sm text-muted-foreground">Best Practices</span>
                        <CheckCircle className="h-4 w-4 text-green-500" />
                      </div>
                      <div className="flex items-end gap-2">
                        <span className={`text-3xl font-bold ${getScoreColor(seoReport.best_practices_score)}`}>
                          {seoReport.best_practices_score}
                        </span>
                        <span className="text-muted-foreground mb-1">/100</span>
                      </div>
                      <div className="mt-3 h-2 bg-muted rounded-full overflow-hidden">
                        <div className={`h-full ${getScoreBg(seoReport.best_practices_score)} transition-all`} style={{ width: `${seoReport.best_practices_score}%` }} />
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="pt-6">
                      <div className="flex items-center justify-between mb-4">
                        <span className="text-sm text-muted-foreground">SEO</span>
                        <Globe className="h-4 w-4 text-purple-500" />
                      </div>
                      <div className="flex items-end gap-2">
                        <span className={`text-3xl font-bold ${getScoreColor(seoReport.seo_score)}`}>
                          {seoReport.seo_score}
                        </span>
                        <span className="text-muted-foreground mb-1">/100</span>
                      </div>
                      <div className="mt-3 h-2 bg-muted rounded-full overflow-hidden">
                        <div className={`h-full ${getScoreBg(seoReport.seo_score)} transition-all`} style={{ width: `${seoReport.seo_score}%` }} />
                      </div>
                    </CardContent>
                  </Card>
                </>
              )}
            </div>

            {/* Issues & Recommendations */}
            <div className="grid grid-cols-2 gap-6">
              {/* Issues */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-amber-500" />
                    Site Issues
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {seoReport && (
                    <>
                      <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                        <div className="flex items-center gap-3">
                          <FileWarning className="h-4 w-4 text-amber-500" />
                          <span className="text-sm">Missing Meta Descriptions</span>
                        </div>
                        <Badge variant="outline" className="bg-amber-500/10 text-amber-600 border-amber-500/20">
                          {seoReport.missing_meta}
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                        <div className="flex items-center gap-3">
                          <Zap className="h-4 w-4 text-red-500" />
                          <span className="text-sm">Slow Pages</span>
                        </div>
                        <Badge variant="outline" className="bg-red-500/10 text-red-600 border-red-500/20">
                          {seoReport.slow_pages}
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                        <div className="flex items-center gap-3">
                          <Link2 className="h-4 w-4 text-orange-500" />
                          <span className="text-sm">Broken Links</span>
                        </div>
                        <Badge variant="outline" className="bg-orange-500/10 text-orange-600 border-orange-500/20">
                          {seoReport.broken_links}
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                        <div className="flex items-center gap-3">
                          <Smartphone className="h-4 w-4 text-blue-500" />
                          <span className="text-sm">Mobile Issues</span>
                        </div>
                        <Badge variant="outline" className="bg-blue-500/10 text-blue-600 border-blue-500/20">
                          {seoReport.mobile_issues}
                        </Badge>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>

              {/* Recommendations */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-purple-500" />
                    Recommendations
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {seoReport?.recommendations?.map((rec: any, i: number) => (
                    <div key={i} className="p-3 bg-muted/50 rounded-lg">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1">
                          <p className="text-sm font-medium">{rec.action}</p>
                          <p className="text-xs text-green-600 mt-1">{rec.impact}</p>
                        </div>
                        <Badge variant="outline" className={rec.priority === 'high' ? 'bg-red-500/10 text-red-600' : 'bg-amber-500/10 text-amber-600'}>
                          {rec.priority}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>

            {/* Top Keywords by Source */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <BarChart3 className="h-4 w-4 text-blue-500" />
                  Keywords by Source
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-4 gap-4">
                  {['whatsapp', 'search_console', 'ai_suggested', 'manual'].map(source => {
                    const sourceKeywords = keywords.filter(k => k.source === source && k.status === 'active');
                    const sourceClicks = sourceKeywords.reduce((sum, k) => sum + k.clicks, 0);
                    return (
                      <div key={source} className="p-4 border border-border rounded-lg">
                        <div className="flex items-center gap-2 mb-3">
                          {source === 'whatsapp' && <MessageSquare className="h-4 w-4 text-green-500" />}
                          {source === 'search_console' && <Globe className="h-4 w-4 text-blue-500" />}
                          {source === 'ai_suggested' && <Sparkles className="h-4 w-4 text-purple-500" />}
                          {source === 'manual' && <Tag className="h-4 w-4 text-zinc-500" />}
                          <span className="text-sm font-medium capitalize">{source.replace('_', ' ')}</span>
                        </div>
                        <p className="text-2xl font-bold">{sourceKeywords.length}</p>
                        <p className="text-xs text-muted-foreground">{(sourceClicks / 1000).toFixed(1)}K clicks</p>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Keywords Tab */}
        {activeTab === 'keywords' && (
          <div className="space-y-4">
            {/* Filters */}
            <div className="flex items-center gap-4">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input 
                  placeholder="Search keywords..." 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <select 
                value={sourceFilter}
                onChange={(e) => setSourceFilter(e.target.value)}
                className="px-3 py-2 border border-border rounded-lg bg-background text-sm"
              >
                <option value="all">All Sources</option>
                <option value="whatsapp">WhatsApp</option>
                <option value="search_console">Search Console</option>
                <option value="ai_suggested">AI Suggested</option>
                <option value="manual">Manual</option>
              </select>
            </div>

            {/* Keywords Table */}
            <div className="border border-border rounded-lg overflow-hidden">
              <table className="w-full">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="text-left text-xs font-medium text-muted-foreground px-4 py-3">Keyword</th>
                    <th className="text-left text-xs font-medium text-muted-foreground px-4 py-3">Match Type</th>
                    <th className="text-left text-xs font-medium text-muted-foreground px-4 py-3">Source</th>
                    <th className="text-left text-xs font-medium text-muted-foreground px-4 py-3">Intent</th>
                    <th className="text-right text-xs font-medium text-muted-foreground px-4 py-3">Volume</th>
                    <th className="text-right text-xs font-medium text-muted-foreground px-4 py-3">Impressions</th>
                    <th className="text-right text-xs font-medium text-muted-foreground px-4 py-3">Clicks</th>
                    <th className="text-right text-xs font-medium text-muted-foreground px-4 py-3">Conv.</th>
                    <th className="text-center text-xs font-medium text-muted-foreground px-4 py-3">Trend</th>
                    <th className="text-right text-xs font-medium text-muted-foreground px-4 py-3">Score</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filteredKeywords.map(keyword => {
                    const IntentIcon = intentIcons[keyword.intent] || Tag;
                    return (
                      <tr key={keyword.id} className="hover:bg-muted/30 transition-colors">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-sm">{keyword.keyword}</span>
                            {keyword.priority >= 85 && (
                              <Badge variant="outline" className="bg-amber-500/10 text-amber-600 border-amber-500/20 text-xs">
                                Priority
                              </Badge>
                            )}
                          </div>
                          {keyword.category && (
                            <span className="text-xs text-muted-foreground">{keyword.category}</span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <Badge variant="outline" className={matchTypeColors[keyword.match_type]}>
                            {keyword.match_type}
                          </Badge>
                        </td>
                        <td className="px-4 py-3">
                          <Badge variant="outline" className={sourceColors[keyword.source]}>
                            {keyword.source.replace('_', ' ')}
                          </Badge>
                        </td>
                        <td className="px-4 py-3">
                          {keyword.intent && (
                            <div className="flex items-center gap-1.5">
                              <IntentIcon className="h-3.5 w-3.5 text-muted-foreground" />
                              <span className="text-xs text-muted-foreground capitalize">{keyword.intent}</span>
                            </div>
                          )}
                        </td>
                        <td className="px-4 py-3 text-right text-sm">
                          {keyword.monthly_volume ? `${(keyword.monthly_volume / 1000).toFixed(1)}K` : '-'}
                        </td>
                        <td className="px-4 py-3 text-right text-sm">
                          {(keyword.impressions / 1000).toFixed(1)}K
                        </td>
                        <td className="px-4 py-3 text-right text-sm">
                          {(keyword.clicks / 1000).toFixed(1)}K
                        </td>
                        <td className="px-4 py-3 text-right text-sm">
                          {keyword.conversions}
                        </td>
                        <td className="px-4 py-3 text-center">
                          {keyword.trend === 'rising' && <TrendingUp className="h-4 w-4 text-green-500 mx-auto" />}
                          {keyword.trend === 'declining' && <TrendingDown className="h-4 w-4 text-red-500 mx-auto" />}
                          {keyword.trend === 'stable' && <Minus className="h-4 w-4 text-muted-foreground mx-auto" />}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <span className={`text-sm font-medium ${getScoreColor(keyword.performance_score * 100)}`}>
                            {Math.round(keyword.performance_score * 100)}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Mining Queue Tab */}
        {activeTab === 'extractions' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                Keywords mined from WhatsApp conversations and customer sessions
              </p>
              <Button variant="outline" size="sm">
                <Sparkles className="h-4 w-4 mr-2" />
                Run AI Analysis
              </Button>
            </div>

            <div className="grid gap-4">
              {extractions.filter(e => !e.is_processed).map(extraction => (
                <Card key={extraction.id} className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        {extraction.source_type === 'message' && <MessageSquare className="h-4 w-4 text-green-500" />}
                        {extraction.source_type === 'session_search' && <Search className="h-4 w-4 text-blue-500" />}
                        {extraction.source_type === 'ghost_cart' && <ShoppingCart className="h-4 w-4 text-amber-500" />}
                        <Badge variant="outline" className="text-xs capitalize">
                          {extraction.source_type.replace('_', ' ')}
                        </Badge>
                        <Badge variant="outline" className={matchTypeColors[extraction.suggested_match_type]}>
                          {extraction.suggested_match_type}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mb-1">Original: &quot;{extraction.extracted_text}&quot;</p>
                      <p className="font-medium">{extraction.normalized_keyword}</p>
                      {extraction.intent && (
                        <p className="text-xs text-muted-foreground mt-1 capitalize">Intent: {extraction.intent}</p>
                      )}
                      {extraction.suggested_products?.length > 0 && (
                        <div className="mt-2 flex items-center gap-2">
                          <span className="text-xs text-muted-foreground">Suggested products:</span>
                          {extraction.suggested_products.map((p: any, i: number) => (
                            <Badge key={i} variant="outline" className="text-xs">{p.title || p.sku}</Badge>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <p className="text-sm font-medium">{Math.round(extraction.confidence * 100)}%</p>
                        <p className="text-xs text-muted-foreground">confidence</p>
                      </div>
                      <Button size="sm" onClick={() => promoteExtraction(extraction)}>
                        <Plus className="h-4 w-4 mr-1" />
                        Add
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
              {extractions.filter(e => !e.is_processed).length === 0 && (
                <div className="text-center py-12 text-muted-foreground">
                  <Sparkles className="h-12 w-12 mx-auto mb-4 opacity-20" />
                  <p>No pending keyword extractions</p>
                  <p className="text-sm">Keywords are automatically mined from conversations</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Search Console Tab */}
        {activeTab === 'search-console' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                Search performance data from Google Search Console
              </p>
              <Button variant="outline" size="sm">
                <RefreshCw className="h-4 w-4 mr-2" />
                Sync Data
              </Button>
            </div>

            <div className="border border-border rounded-lg overflow-hidden">
              <table className="w-full">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="text-left text-xs font-medium text-muted-foreground px-4 py-3">Query</th>
                    <th className="text-left text-xs font-medium text-muted-foreground px-4 py-3">Page</th>
                    <th className="text-center text-xs font-medium text-muted-foreground px-4 py-3">Device</th>
                    <th className="text-right text-xs font-medium text-muted-foreground px-4 py-3">Impressions</th>
                    <th className="text-right text-xs font-medium text-muted-foreground px-4 py-3">Clicks</th>
                    <th className="text-right text-xs font-medium text-muted-foreground px-4 py-3">CTR</th>
                    <th className="text-right text-xs font-medium text-muted-foreground px-4 py-3">Position</th>
                    <th className="text-center text-xs font-medium text-muted-foreground px-4 py-3">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {searchConsoleData.map(row => (
                    <tr key={row.id} className="hover:bg-muted/30 transition-colors">
                      <td className="px-4 py-3">
                        <span className="font-medium text-sm">{row.query}</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-sm text-muted-foreground">{row.page}</span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <Badge variant="outline" className="text-xs capitalize">{row.device}</Badge>
                      </td>
                      <td className="px-4 py-3 text-right text-sm">{row.impressions.toLocaleString()}</td>
                      <td className="px-4 py-3 text-right text-sm">{row.clicks}</td>
                      <td className="px-4 py-3 text-right text-sm">{(row.ctr * 100).toFixed(1)}%</td>
                      <td className="px-4 py-3 text-right">
                        <span className={`text-sm font-medium ${row.position <= 3 ? 'text-green-600' : row.position <= 10 ? 'text-amber-600' : 'text-muted-foreground'}`}>
                          {row.position.toFixed(1)}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <Button variant="ghost" size="sm">
                          <Plus className="h-3.5 w-3.5" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
