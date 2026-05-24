import Link from 'next/link';
import type React from 'react';
import {
  ArrowLeft,
  BarChart3,
  Bot,
  CalendarClock,
  FileText,
  LineChart,
  MessageSquare,
  ShieldCheck,
  Sparkles,
  Users,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  CUSTOMER_SEGMENTS,
  DAILY_REPORTS,
  EXECUTIVE_METRICS,
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

const channelReports = [
  { channel: 'WhatsApp', revenue: 68200, conversion: '21.6%', owner: 'Abdelrahman', signal: 'Fast replies close high-intent ladies bridal chats.' },
  { channel: 'Website', revenue: 31400, conversion: '6.8%', owner: 'Ahmed', signal: 'Mobile landing pages need stronger delivery reassurance.' },
  { channel: 'Private VIP', revenue: 51200, conversion: '29.4%', owner: 'Mahmoud', signal: 'Private drops work best for repeat female buyers.' },
  { channel: 'Google', revenue: 18800, conversion: '4.9%', owner: 'Ahmed', signal: 'Ladies bridal and Eid gift intent is rising.' },
];

export default function ReportsPage() {
  const keywords = getMockTableData('keywords');
  const financeQueue = getMockTableData('finance_verifications');
  const ghostCarts = getMockTableData('ghost_carts');
  const openDecisions = OMNIA_DECISIONS.filter((decision) => decision.status !== 'monitor');

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
              <FileText className="h-5 w-5 text-primary" />
              <h1 className="text-xl font-serif font-medium">Reports</h1>
            </div>
            <p className="text-sm text-muted-foreground">
              Daily intelligence briefs for {ORG_PROFILE.market.toLowerCase()} operations
            </p>
          </div>
          <Badge variant="outline" className="hidden border-primary/30 bg-primary/10 text-primary md:inline-flex">
            {ORG_PROFILE.date}
          </Badge>
        </div>
      </header>

      <main className="mx-auto max-w-[1600px] space-y-6 px-6 py-6">
        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {EXECUTIVE_METRICS.map((metric) => (
            <Card key={metric.label} className="border-border bg-card/70">
              <CardContent className="p-5">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-xs uppercase tracking-wider text-muted-foreground">{metric.label}</p>
                    <p className="mt-2 text-3xl font-semibold">{metric.value}</p>
                  </div>
                  <Badge variant="outline" className={toneClasses[metric.tone]}>
                    {metric.delta}
                  </Badge>
                </div>
                <p className="mt-3 text-sm text-muted-foreground">{metric.detail}</p>
              </CardContent>
            </Card>
          ))}
        </section>

        <section className="grid gap-6 xl:grid-cols-[1.3fr_.9fr]">
          <div className="space-y-6">
            <Card className="border-border bg-card/70">
              <CardHeader className="border-b border-border">
                <CardTitle className="flex items-center gap-2 text-base">
                  <CalendarClock className="h-4 w-4 text-primary" />
                  Report Schedule
                </CardTitle>
              </CardHeader>
              <CardContent className="overflow-x-auto p-0">
                <table className="w-full text-sm">
                  <thead className="border-b border-border bg-muted/30 text-xs uppercase tracking-wider text-muted-foreground">
                    <tr>
                      <th className="px-4 py-3 text-left font-medium">Report</th>
                      <th className="px-4 py-3 text-left font-medium">Owner</th>
                      <th className="px-4 py-3 text-left font-medium">Audience</th>
                      <th className="px-4 py-3 text-left font-medium">Time</th>
                      <th className="px-4 py-3 text-left font-medium">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {DAILY_REPORTS.map((report) => (
                      <tr key={report.title} className="hover:bg-muted/20">
                        <td className="px-4 py-4 font-medium">{report.title}</td>
                        <td className="px-4 py-4 text-muted-foreground">{report.owner}</td>
                        <td className="px-4 py-4 text-muted-foreground">{report.audience}</td>
                        <td className="px-4 py-4">{report.time}</td>
                        <td className="px-4 py-4">
                          <Badge variant="outline" className={report.status === 'ready' ? toneClasses.good : toneClasses.warn}>
                            {report.status}
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </CardContent>
            </Card>

            <Card className="border-border bg-card/70">
              <CardHeader className="border-b border-border">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Users className="h-4 w-4 text-blue-300" />
                  Ladies Customer Segments
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
                        {segment.conversion}
                      </Badge>
                    </div>
                    <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                      <div>
                        <p className="text-xs text-muted-foreground">Customers</p>
                        <p className="text-lg font-semibold">{segment.count}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Revenue</p>
                        <p className="text-lg font-semibold">{segment.revenue}</p>
                      </div>
                    </div>
                    <p className="mt-4 rounded-md border border-primary/20 bg-primary/5 p-3 text-sm">{segment.action}</p>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card className="border-border bg-card/70">
              <CardHeader className="border-b border-border">
                <CardTitle className="flex items-center gap-2 text-base">
                  <BarChart3 className="h-4 w-4 text-emerald-300" />
                  Channel Performance
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 p-4">
                {channelReports.map((channel) => {
                  const width = Math.min(100, Math.round((channel.revenue / 70000) * 100));
                  return (
                    <div key={channel.channel} className="rounded-md border border-border bg-background/50 p-4">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <p className="font-medium">{channel.channel}</p>
                          <p className="mt-1 text-xs text-muted-foreground">Owner: {channel.owner}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold">AED {channel.revenue.toLocaleString()}</p>
                          <p className="text-xs text-emerald-300">{channel.conversion} conversion</p>
                        </div>
                      </div>
                      <div className="mt-3 h-2 overflow-hidden rounded-full bg-muted">
                        <div className="h-full rounded-full bg-primary" style={{ width: `${width}%` }} />
                      </div>
                      <p className="mt-3 text-xs text-muted-foreground">{channel.signal}</p>
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          </div>

          <aside className="space-y-6">
            <Card className="border-primary/25 bg-primary/5">
              <CardContent className="p-5">
                <div className="flex items-start gap-3">
                  <Bot className="mt-1 h-5 w-5 text-primary" />
                  <div>
                    <h2 className="font-medium">Omnia Brief</h2>
                    <p className="mt-2 text-sm text-muted-foreground">
                      The strongest opportunity is still high-intent women asking about bridal delivery and payment certainty.
                      Keep senior male operators on concierge replies and avoid generic discount language.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-border bg-card/70">
              <CardHeader className="border-b border-border">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Sparkles className="h-4 w-4 text-primary" />
                  Intelligence Load
                </CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-2 gap-3 p-4">
                <Metric label="Keywords" value={keywords.length} icon={<LineChart className="h-4 w-4 text-blue-300" />} />
                <Metric label="Finance checks" value={financeQueue.length} icon={<ShieldCheck className="h-4 w-4 text-amber-300" />} />
                <Metric label="Ghost carts" value={ghostCarts.length} icon={<MessageSquare className="h-4 w-4 text-emerald-300" />} />
                <Metric label="Decisions" value={openDecisions.length} icon={<Bot className="h-4 w-4 text-primary" />} />
              </CardContent>
            </Card>

            <Card className="border-border bg-card/70">
              <CardHeader className="border-b border-border">
                <CardTitle className="text-base">Owner Decisions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 p-4">
                {openDecisions.map((decision) => (
                  <div key={decision.id} className="rounded-md border border-border bg-background/50 p-3">
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-sm font-medium">{decision.title}</p>
                      <Badge variant="outline" className={decision.status === 'blocked' ? toneClasses.bad : toneClasses.gold}>
                        {decision.confidence}%
                      </Badge>
                    </div>
                    <p className="mt-2 text-xs text-muted-foreground">{decision.impact}</p>
                  </div>
                ))}
              </CardContent>
            </Card>
          </aside>
        </section>
      </main>
    </div>
  );
}

function Metric({ label, value, icon }: { label: string; value: number; icon: React.ReactNode }) {
  return (
    <div className="rounded-md border border-border bg-background/50 p-3">
      <div className="mb-3 flex items-center justify-between">
        <span className="text-xs text-muted-foreground">{label}</span>
        {icon}
      </div>
      <p className="text-2xl font-semibold">{value}</p>
    </div>
  );
}
