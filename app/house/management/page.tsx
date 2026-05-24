import Link from 'next/link';
import {
  ArrowLeft,
  Bot,
  CheckCircle2,
  CircleAlert,
  Clock3,
  KeyRound,
  Network,
  ShieldCheck,
  Sparkles,
  Users2,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import {
  ACCESS_REQUESTS,
  EXECUTIVE_METRICS,
  INTEGRATIONS,
  MANAGEMENT_QUEUE,
  OMNIA_DECISIONS,
  ORG_PROFILE,
  STAFF_ROSTER,
  type Tone,
} from '@/lib/operations-intelligence';
import { getAllTasks } from '@/lib/agents/mock';
import { getSession } from '@/lib/session';

const toneClasses: Record<Tone, string> = {
  good: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300',
  warn: 'border-amber-500/30 bg-amber-500/10 text-amber-300',
  bad: 'border-red-500/30 bg-red-500/10 text-red-300',
  info: 'border-blue-500/30 bg-blue-500/10 text-blue-300',
  gold: 'border-primary/30 bg-primary/10 text-primary',
};

const decisionStatusClasses = {
  approve: 'border-primary/30 bg-primary/10 text-primary',
  monitor: 'border-blue-500/30 bg-blue-500/10 text-blue-300',
  assign: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300',
  blocked: 'border-red-500/30 bg-red-500/10 text-red-300',
};

export default function ManagementPage() {
  const session = getSession();
  const tasks = getAllTasks();
  const stalled = tasks.filter((task) => task.status === 'stalled');
  const active = tasks.filter((task) => task.status === 'in_progress' || task.status === 'pending');

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
              <ShieldCheck className="h-5 w-5 text-primary" />
              <h1 className="text-xl font-serif font-medium">Management</h1>
            </div>
            <p className="text-sm text-muted-foreground">
              {ORG_PROFILE.market} command layer for owner decisions, access, staff, and room health
            </p>
          </div>
          <Badge variant="outline" className="hidden border-primary/30 bg-primary/10 text-primary md:inline-flex">
            {session.user.name} - {session.user.role}
          </Badge>
        </div>
      </header>

      <main className="mx-auto max-w-[1600px] space-y-6 px-6 py-6">
        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {EXECUTIVE_METRICS.map((metric) => (
            <Card key={metric.label} className="border-border bg-card/70">
              <CardContent className="p-5">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-xs uppercase tracking-wider text-muted-foreground">{metric.label}</p>
                    <p className="mt-2 text-3xl font-semibold tracking-normal">{metric.value}</p>
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

        <section className="grid gap-6 xl:grid-cols-[1.55fr_.95fr]">
          <div className="space-y-6">
            <Card className="border-border bg-card/70">
              <CardHeader className="border-b border-border">
                <div className="flex items-center justify-between gap-3">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Bot className="h-4 w-4 text-primary" />
                    Omnia Decision Center
                  </CardTitle>
                  <Badge variant="secondary">{OMNIA_DECISIONS.length} live recommendations</Badge>
                </div>
              </CardHeader>
              <CardContent className="grid gap-4 p-4 lg:grid-cols-2">
                {OMNIA_DECISIONS.map((decision) => (
                  <div key={decision.id} className="rounded-md border border-border bg-background/50 p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h2 className="text-sm font-medium leading-snug">{decision.title}</h2>
                        <p className="mt-1 text-xs text-muted-foreground">Owner: {decision.owner}</p>
                      </div>
                      <Badge variant="outline" className={decisionStatusClasses[decision.status]}>
                        {decision.status}
                      </Badge>
                    </div>
                    <div className="mt-4">
                      <div className="mb-2 flex items-center justify-between text-xs">
                        <span className="text-muted-foreground">AI confidence</span>
                        <span className="font-medium">{decision.confidence}%</span>
                      </div>
                      <Progress value={decision.confidence} className="h-1.5" />
                    </div>
                    <p className="mt-4 text-sm text-primary">{decision.impact}</p>
                    <div className="mt-3 space-y-2">
                      {decision.evidence.map((item) => (
                        <div key={item} className="flex gap-2 text-xs text-muted-foreground">
                          <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-400" />
                          <span>{item}</span>
                        </div>
                      ))}
                    </div>
                    <div className="mt-4 rounded-md border border-primary/20 bg-primary/5 p-3 text-sm">
                      {decision.nextStep}
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            <div className="grid gap-6 lg:grid-cols-2">
              <Card className="border-border bg-card/70">
                <CardHeader className="border-b border-border">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Network className="h-4 w-4 text-blue-300" />
                    Operating Lanes
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 p-4">
                  {MANAGEMENT_QUEUE.map((lane) => (
                    <div key={lane.lane} className="rounded-md border border-border bg-background/50 p-3">
                      <div className="mb-3 flex items-center justify-between gap-3">
                        <div>
                          <p className="text-sm font-medium">{lane.lane}</p>
                          <p className="text-xs text-muted-foreground">Owner: {lane.owner}</p>
                        </div>
                        <Badge variant="outline">{lane.items.length}</Badge>
                      </div>
                      <div className="space-y-2">
                        {lane.items.map((item) => (
                          <div key={item} className="flex gap-2 text-xs text-muted-foreground">
                            <Clock3 className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                            <span>{item}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>

              <Card className="border-border bg-card/70">
                <CardHeader className="border-b border-border">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Users2 className="h-4 w-4 text-emerald-300" />
                    Staff Command
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 p-4">
                  {STAFF_ROSTER.map((member) => (
                    <div key={member.id} className="rounded-md border border-border bg-background/50 p-3">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{member.name}</span>
                            <span className={`h-2 w-2 rounded-full ${member.online ? 'bg-emerald-400' : 'bg-muted'}`} />
                          </div>
                          <p className="text-xs text-muted-foreground capitalize">{member.role.replace('_', ' ')}</p>
                        </div>
                        <Badge variant="outline">{member.score}%</Badge>
                      </div>
                      <p className="mt-2 text-xs text-muted-foreground">{member.status}</p>
                      <div className="mt-3 flex flex-wrap gap-1">
                        {member.skills.map((skill) => (
                          <Badge key={skill} variant="secondary" className="text-[10px]">
                            {skill}
                          </Badge>
                        ))}
                      </div>
                      <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
                        <span>Open workload</span>
                        <span>{member.workload} tasks</span>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>
          </div>

          <aside className="space-y-6">
            <Card className="border-primary/25 bg-primary/5">
              <CardContent className="p-5">
                <div className="flex items-start gap-3">
                  <Sparkles className="mt-1 h-5 w-5 text-primary" />
                  <div>
                    <h2 className="font-medium">Operating Rules</h2>
                    <p className="mt-2 text-sm text-muted-foreground">{ORG_PROFILE.customerRule}</p>
                    <p className="mt-2 text-sm text-muted-foreground">{ORG_PROFILE.staffingRule}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-border bg-card/70">
              <CardHeader className="border-b border-border">
                <CardTitle className="flex items-center gap-2 text-base">
                  <CircleAlert className="h-4 w-4 text-amber-300" />
                  Live Task Risk
                </CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-3 gap-3 p-4 text-center">
                <div className="rounded-md border border-border bg-background/50 p-3">
                  <p className="text-2xl font-semibold">{tasks.length}</p>
                  <p className="text-xs text-muted-foreground">Total</p>
                </div>
                <div className="rounded-md border border-amber-500/30 bg-amber-500/10 p-3">
                  <p className="text-2xl font-semibold">{active.length}</p>
                  <p className="text-xs text-muted-foreground">Active</p>
                </div>
                <div className="rounded-md border border-red-500/30 bg-red-500/10 p-3">
                  <p className="text-2xl font-semibold">{stalled.length}</p>
                  <p className="text-xs text-muted-foreground">Stalled</p>
                </div>
              </CardContent>
            </Card>

            <Card className="border-border bg-card/70">
              <CardHeader className="border-b border-border">
                <CardTitle className="text-base">Integrations</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 p-4">
                {INTEGRATIONS.map((integration) => (
                  <div key={integration.name} className="rounded-md border border-border bg-background/50 p-3">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="text-sm font-medium">{integration.name}</p>
                        <p className="text-xs text-muted-foreground">Owner: {integration.owner}</p>
                      </div>
                      <Badge
                        variant="outline"
                        className={
                          integration.risk === 'high'
                            ? toneClasses.bad
                            : integration.risk === 'medium'
                              ? toneClasses.warn
                              : toneClasses.good
                        }
                      >
                        {integration.status}
                      </Badge>
                    </div>
                    <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
                      <span>Latency</span>
                      <span>{integration.latency}</span>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card className="border-border bg-card/70">
              <CardHeader className="border-b border-border">
                <CardTitle className="flex items-center gap-2 text-base">
                  <KeyRound className="h-4 w-4 text-primary" />
                  Access Requests
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 p-4">
                {ACCESS_REQUESTS.map((request) => (
                  <div key={`${request.name}-${request.role}`} className="rounded-md border border-border bg-background/50 p-3">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-medium">{request.name}</p>
                        <p className="text-xs text-muted-foreground">{request.role}</p>
                      </div>
                      <Badge variant="outline" className={request.risk === 'medium' ? toneClasses.warn : toneClasses.good}>
                        {request.risk}
                      </Badge>
                    </div>
                    <p className="mt-2 text-xs text-muted-foreground">{request.reason}</p>
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
