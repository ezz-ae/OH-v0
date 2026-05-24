import Link from 'next/link';
import {
  ArrowLeft,
  Brain,
  Crown,
  Globe,
  MessageSquare,
  Search,
  ShieldAlert,
  Sparkles,
  Target,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import {
  BRAND_SIGNALS,
  CUSTOMER_SEGMENTS,
  OMNIA_DECISIONS,
  ORG_PROFILE,
  getMockTableData,
  type Tone,
} from '@/lib/operations-intelligence';

const toneClasses: Record<Tone, string> = {
  good: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300',
  warn: 'border-amber-500/30 bg-amber-500/10 text-amber-300',
  bad: 'border-red-500/30 bg-red-500/10 text-red-300',
  info: 'border-blue-500/30 bg-blue-500/10 text-blue-300',
  gold: 'border-primary/30 bg-primary/10 text-primary',
};

const voiceRules = [
  { rule: 'Concierge first', detail: 'Use delivery certainty, reservation, and care language before price incentives.' },
  { rule: 'Ladies-only framing', detail: 'Product copy should clearly speak to women shopping for themselves, bridal events, or gifts.' },
  { rule: 'Arabic reassurance', detail: 'For WhatsApp, Arabic payment and delivery confirmation increases trust with VIP women.' },
  { rule: 'No generic discounting', detail: 'Discount language is reserved for recovery flows and never leads bridal conversations.' },
];

const competitorWatch = [
  { name: 'Regional bridal boutiques', signal: 'Delivery guarantees in Arabic are increasing', threat: 'medium' },
  { name: 'Luxury perfume sellers', signal: 'Gift bundle copy is outperforming standalone SKU ads', threat: 'low' },
  { name: 'Marketplace jewellery listings', signal: 'Lower prices are visible, but trust is weaker', threat: 'medium' },
];

export default function BrandIntelligencePage() {
  const keywords = getMockTableData('keywords');
  const extractions = getMockTableData('keyword_extractions');
  const searchConsole = getMockTableData('search_console_data');
  const brandRisk = OMNIA_DECISIONS.filter((decision) => decision.title.toLowerCase().includes('bnpl'));

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-30 border-b border-border bg-card/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-[1600px] items-center gap-4 px-6 py-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/house">
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              <h1 className="text-xl font-serif font-medium">Brand Intelligence</h1>
            </div>
            <p className="text-sm text-muted-foreground">
              Luxury positioning, ladies customer signals, and content intelligence
            </p>
          </div>
          <Badge variant="outline" className="hidden border-primary/30 bg-primary/10 text-primary md:inline-flex">
            {ORG_PROFILE.market}
          </Badge>
        </div>
      </header>

      <main className="mx-auto max-w-[1600px] space-y-6 px-6 py-6">
        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {BRAND_SIGNALS.map((signal) => (
            <Card key={signal.label} className="border-border bg-card/70">
              <CardContent className="p-5">
                <div className="mb-4 flex items-center justify-between">
                  <p className="text-sm font-medium">{signal.label}</p>
                  <Badge variant="outline" className={signal.score >= 80 ? toneClasses.good : signal.score >= 65 ? toneClasses.warn : toneClasses.bad}>
                    {signal.score}
                  </Badge>
                </div>
                <Progress value={signal.score} className="h-1.5" />
                <p className="mt-4 text-sm text-muted-foreground">{signal.detail}</p>
              </CardContent>
            </Card>
          ))}
        </section>

        <section className="grid gap-6 xl:grid-cols-[1.2fr_.9fr]">
          <div className="space-y-6">
            <Card className="border-border bg-card/70">
              <CardHeader className="border-b border-border">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Crown className="h-4 w-4 text-primary" />
                  Positioning by Ladies Segment
                </CardTitle>
              </CardHeader>
              <CardContent className="grid gap-3 p-4 lg:grid-cols-2">
                {CUSTOMER_SEGMENTS.map((segment) => (
                  <div key={segment.name} className="rounded-md border border-border bg-background/50 p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-medium">{segment.name}</p>
                        <p className="mt-1 text-xs text-muted-foreground">{segment.signal}</p>
                      </div>
                      <Badge variant="outline" className={toneClasses[segment.tone]}>
                        {segment.revenue}
                      </Badge>
                    </div>
                    <p className="mt-4 text-sm">{segment.action}</p>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card className="border-border bg-card/70">
              <CardHeader className="border-b border-border">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Search className="h-4 w-4 text-blue-300" />
                  Search and Conversation Intelligence
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 p-4">
                {keywords.map((keyword: any) => (
                  <div key={keyword.id} className="rounded-md border border-border bg-background/50 p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="font-medium">{keyword.keyword}</p>
                        <p className="mt-1 text-xs text-muted-foreground">
                          {keyword.category} - {keyword.intent} intent - {keyword.source.replace('_', ' ')}
                        </p>
                      </div>
                      <Badge variant="outline" className={keyword.trend === 'rising' ? toneClasses.good : toneClasses.info}>
                        {keyword.trend}
                      </Badge>
                    </div>
                    <div className="mt-4 grid grid-cols-3 gap-3 text-sm">
                      <div>
                        <p className="text-xs text-muted-foreground">Impressions</p>
                        <p className="font-semibold">{keyword.impressions.toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Clicks</p>
                        <p className="font-semibold">{keyword.clicks.toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Conversions</p>
                        <p className="font-semibold">{keyword.conversions}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          <aside className="space-y-6">
            <Card className="border-primary/25 bg-primary/5">
              <CardContent className="p-5">
                <div className="flex items-start gap-3">
                  <Brain className="mt-1 h-5 w-5 text-primary" />
                  <div>
                    <h2 className="font-medium">Brand Read</h2>
                    <p className="mt-2 text-sm text-muted-foreground">
                      Omnia should sound like a private ladies concierge: precise, warm, and protective of timing.
                      The intelligence layer should reduce uncertainty for female buyers without lowering the brand.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-border bg-card/70">
              <CardHeader className="border-b border-border">
                <CardTitle className="flex items-center gap-2 text-base">
                  <MessageSquare className="h-4 w-4 text-emerald-300" />
                  Voice Rules
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 p-4">
                {voiceRules.map((item) => (
                  <div key={item.rule} className="rounded-md border border-border bg-background/50 p-3">
                    <p className="text-sm font-medium">{item.rule}</p>
                    <p className="mt-1 text-xs text-muted-foreground">{item.detail}</p>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card className="border-border bg-card/70">
              <CardHeader className="border-b border-border">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Target className="h-4 w-4 text-blue-300" />
                  Mining Queue
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 p-4">
                {extractions.map((item: any) => (
                  <div key={item.id} className="rounded-md border border-border bg-background/50 p-3">
                    <div className="flex items-start justify-between gap-3">
                      <p className="text-sm font-medium">{item.normalized_keyword}</p>
                      <Badge variant="outline" className={toneClasses.gold}>
                        {Math.round(item.confidence * 100)}%
                      </Badge>
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">{item.extracted_text}</p>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card className="border-border bg-card/70">
              <CardHeader className="border-b border-border">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Globe className="h-4 w-4 text-blue-300" />
                  Competitor Watch
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 p-4">
                {competitorWatch.map((item) => (
                  <div key={item.name} className="rounded-md border border-border bg-background/50 p-3">
                    <div className="flex items-start justify-between gap-3">
                      <p className="text-sm font-medium">{item.name}</p>
                      <Badge variant="outline" className={item.threat === 'medium' ? toneClasses.warn : toneClasses.good}>
                        {item.threat}
                      </Badge>
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">{item.signal}</p>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card className="border-border bg-card/70">
              <CardContent className="space-y-3 p-4">
                <div className="flex items-start gap-3">
                  <ShieldAlert className="mt-0.5 h-4 w-4 text-amber-300" />
                  <div>
                    <p className="text-sm font-medium">Brand Risk</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {brandRisk[0]?.nextStep || 'Monitor discount, BNPL, and price language before it reaches VIP female buyers.'}
                    </p>
                  </div>
                </div>
                <div className="rounded-md border border-border bg-background/50 p-3 text-xs text-muted-foreground">
                  Search Console has {searchConsole.length} active query clusters feeding the brand model.
                </div>
              </CardContent>
            </Card>
          </aside>
        </section>
      </main>
    </div>
  );
}
