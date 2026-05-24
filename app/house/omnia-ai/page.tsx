import Link from 'next/link';
import {
  ArrowLeft,
  Bot,
  Brain,
  Clock3,
  GitBranch,
  LockKeyhole,
  Network,
  ShieldCheck,
  Sparkles,
  Users2,
  Zap,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { getAllTasks } from '@/lib/agents/mock';
import { getSession } from '@/lib/session';
import {
  AI_AUTOMATION_PIPELINE,
  AI_COMMAND_CENTER,
  AI_MEMORY_STACK,
  AI_ROOMS,
  OMNIA_DECISIONS,
  ORG_PROFILE,
  STAFF_ROSTER,
} from '@/lib/operations-intelligence';

const decisionStatusClasses = {
  approve: 'border-primary/30 bg-primary/10 text-primary',
  monitor: 'border-blue-500/30 bg-blue-500/10 text-blue-300',
  assign: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300',
  blocked: 'border-red-500/30 bg-red-500/10 text-red-300',
};

const pipelineClasses: Record<string, string> = {
  running: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300',
  guarded: 'border-amber-500/30 bg-amber-500/10 text-amber-300',
};

function healthClass(health: number) {
  if (health >= 90) return 'text-emerald-300';
  if (health >= 80) return 'text-blue-300';
  if (health >= 75) return 'text-amber-300';
  return 'text-red-300';
}

export default function OmniaAIPage() {
  const session = getSession();
  const tasks = getAllTasks();
  const stalledTasks = tasks.filter((task) => task.status === 'stalled');
  const approvalDecisions = OMNIA_DECISIONS.filter((decision) => decision.status === 'approve' || decision.status === 'blocked');

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
              <Bot className="h-5 w-5 text-primary" />
              <h1 className="text-xl font-serif font-medium">{AI_COMMAND_CENTER.name}</h1>
              <Badge variant="outline" className="border-emerald-500/30 bg-emerald-500/10 text-emerald-300">
                {AI_COMMAND_CENTER.status}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground">
              Intelligent operating layer for {ORG_PROFILE.market.toLowerCase()} across rooms, approvals, staff, and memory
            </p>
          </div>
          <Badge variant="outline" className="hidden border-primary/30 bg-primary/10 text-primary md:inline-flex">
            {session.user.name} - {session.user.role}
          </Badge>
        </div>
      </header>

      <main className="mx-auto max-w-[1600px] space-y-6 px-6 py-6">
        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <Card className="border-border bg-card/70">
            <CardContent className="p-5">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs uppercase tracking-wider text-muted-foreground">Autonomy</p>
                  <p className="mt-2 text-3xl font-semibold">{AI_COMMAND_CENTER.autonomy}%</p>
                </div>
                <Zap className="h-5 w-5 text-primary" />
              </div>
              <Progress value={AI_COMMAND_CENTER.autonomy} className="mt-4 h-1.5" />
            </CardContent>
          </Card>
          <Card className="border-border bg-card/70">
            <CardContent className="p-5">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs uppercase tracking-wider text-muted-foreground">Confidence</p>
                  <p className="mt-2 text-3xl font-semibold">{AI_COMMAND_CENTER.confidence}%</p>
                </div>
                <Brain className="h-5 w-5 text-blue-300" />
              </div>
              <Progress value={AI_COMMAND_CENTER.confidence} className="mt-4 h-1.5" />
            </CardContent>
          </Card>
          <Card className="border-border bg-card/70">
            <CardContent className="p-5">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs uppercase tracking-wider text-muted-foreground">Approvals</p>
                  <p className="mt-2 text-3xl font-semibold text-amber-300">{approvalDecisions.length}</p>
                </div>
                <LockKeyhole className="h-5 w-5 text-amber-300" />
              </div>
              <p className="mt-3 text-sm text-muted-foreground">Sensitive actions stop for owner approval</p>
            </CardContent>
          </Card>
          <Card className="border-border bg-card/70">
            <CardContent className="p-5">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs uppercase tracking-wider text-muted-foreground">Task risk</p>
                  <p className="mt-2 text-3xl font-semibold text-red-300">{stalledTasks.length}</p>
                </div>
                <ShieldCheck className="h-5 w-5 text-red-300" />
              </div>
              <p className="mt-3 text-sm text-muted-foreground">Stalled work from active operating rooms</p>
            </CardContent>
          </Card>
        </section>

        <section className="grid gap-6 xl:grid-cols-[1.35fr_.95fr]">
          <div className="space-y-6">
            <Card className="border-primary/25 bg-primary/5">
              <CardContent className="p-5">
                <div className="flex items-start gap-3">
                  <Sparkles className="mt-1 h-5 w-5 text-primary" />
                  <div>
                    <h2 className="font-medium">AI Guardrail</h2>
                    <p className="mt-2 text-sm text-muted-foreground">{AI_COMMAND_CENTER.guardrail}</p>
                    <p className="mt-2 text-sm text-muted-foreground">{AI_COMMAND_CENTER.coverage}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-border bg-card/70">
              <CardHeader className="border-b border-border">
                <div className="flex items-center justify-between gap-3">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Network className="h-4 w-4 text-primary" />
                    Room Intelligence
                  </CardTitle>
                  <Badge variant="secondary">{AI_ROOMS.length} monitored rooms</Badge>
                </div>
              </CardHeader>
              <CardContent className="grid gap-4 p-4 lg:grid-cols-2">
                {AI_ROOMS.map((room) => (
                  <div key={room.room} className="rounded-md border border-border bg-background/50 p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h2 className="text-sm font-medium">{room.room}</h2>
                        <p className="mt-1 text-xs text-muted-foreground">{room.signal}</p>
                      </div>
                      <span className={`text-sm font-semibold ${healthClass(room.health)}`}>{room.health}%</span>
                    </div>
                    <Progress value={room.health} className="mt-4 h-1.5" />
                    <div className="mt-4 rounded-md border border-primary/20 bg-primary/5 p-3 text-sm">
                      {room.action}
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card className="border-border bg-card/70">
              <CardHeader className="border-b border-border">
                <CardTitle className="flex items-center gap-2 text-base">
                  <GitBranch className="h-4 w-4 text-blue-300" />
                  Decision Engine
                </CardTitle>
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
                        <span className="text-muted-foreground">Confidence</span>
                        <span>{decision.confidence}%</span>
                      </div>
                      <Progress value={decision.confidence} className="h-1.5" />
                    </div>
                    <p className="mt-4 text-sm text-primary">{decision.impact}</p>
                    <p className="mt-3 rounded-md border border-primary/20 bg-primary/5 p-3 text-sm">{decision.nextStep}</p>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          <aside className="space-y-6">
            <Card className="border-border bg-card/70">
              <CardHeader className="border-b border-border">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Brain className="h-4 w-4 text-primary" />
                  Memory Stack
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 p-4">
                {AI_MEMORY_STACK.map((memory) => (
                  <div key={memory.key} className="rounded-md border border-border bg-background/50 p-3">
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-sm font-medium">{memory.key.replaceAll('_', ' ')}</p>
                      <Badge variant="outline">P{memory.priority}</Badge>
                    </div>
                    <p className="mt-2 text-xs text-muted-foreground">{memory.value}</p>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card className="border-border bg-card/70">
              <CardHeader className="border-b border-border">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Clock3 className="h-4 w-4 text-emerald-300" />
                  Automation Pipeline
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 p-4">
                {AI_AUTOMATION_PIPELINE.map((step, index) => (
                  <div key={step.name} className="rounded-md border border-border bg-background/50 p-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex gap-3">
                        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs text-primary">
                          {index + 1}
                        </span>
                        <div>
                          <p className="text-sm font-medium">{step.name}</p>
                          <p className="mt-1 text-xs text-muted-foreground">{step.detail}</p>
                        </div>
                      </div>
                      <Badge variant="outline" className={pipelineClasses[step.status] || pipelineClasses.running}>
                        {step.status}
                      </Badge>
                    </div>
                    <p className="mt-2 text-xs text-muted-foreground">Cadence: {step.cadence}</p>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card className="border-border bg-card/70">
              <CardHeader className="border-b border-border">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Users2 className="h-4 w-4 text-blue-300" />
                  Staff Routing
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 p-4">
                {STAFF_ROSTER.slice(0, 4).map((member) => (
                  <div key={member.id} className="rounded-md border border-border bg-background/50 p-3">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-medium">{member.name}</p>
                        <p className="text-xs text-muted-foreground capitalize">{member.role.replace('_', ' ')}</p>
                      </div>
                      <Badge variant="outline">{member.score}%</Badge>
                    </div>
                    <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
                      <span>{member.gender} operator</span>
                      <span>{member.workload} open tasks</span>
                    </div>
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
