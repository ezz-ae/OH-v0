'use client';

import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  BadgeCheck,
  Bot,
  CalendarDays,
  CheckCircle2,
  CheckSquare,
  Clock3,
  CreditCard,
  FileText,
  Gift,
  Globe2,
  HardDrive,
  KeyRound,
  LockKeyhole,
  Map,
  Mic,
  PackageCheck,
  Route,
  Settings,
  ShieldCheck,
  Sparkles,
  Truck,
  Users,
  WalletCards,
  type LucideIcon,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { AGENTS, getAllTasks } from '@/lib/agents';
import { getRoomBySlug, type Room } from '@/lib/rooms';
import { getSession } from '@/lib/session';
import {
  ACCESS_REQUESTS,
  AI_MEMORY_STACK,
  INVENTORY_REORDER_QUEUE,
  OMNIA_DECISIONS,
  ORG_PROFILE,
  STAFF_ROSTER,
} from '@/lib/operations-intelligence';

interface PageProps {
  params: {
    slug: string;
  };
}

type Tone = 'good' | 'warn' | 'bad' | 'info' | 'gold';

type Metric = {
  label: string;
  value: string;
  detail: string;
  icon: LucideIcon;
  tone?: Tone;
};

const toneClasses: Record<Tone, string> = {
  good: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300',
  warn: 'border-amber-500/30 bg-amber-500/10 text-amber-300',
  bad: 'border-red-500/30 bg-red-500/10 text-red-300',
  info: 'border-blue-500/30 bg-blue-500/10 text-blue-300',
  gold: 'border-primary/30 bg-primary/10 text-primary',
};

const statusClasses: Record<string, string> = {
  ready: toneClasses.good,
  online: toneClasses.good,
  active: toneClasses.good,
  approved: toneClasses.good,
  paid: toneClasses.good,
  running: toneClasses.good,
  pending: toneClasses.warn,
  review: toneClasses.warn,
  queued: toneClasses.warn,
  dispatch: toneClasses.warn,
  guarded: toneClasses.warn,
  blocked: toneClasses.bad,
  urgent: toneClasses.bad,
  critical: toneClasses.bad,
  private: toneClasses.info,
  planned: toneClasses.info,
  owner: toneClasses.gold,
};

const milestonePlan = [
  {
    title: 'Phase 1 - Operating Rooms',
    status: 'ready',
    owner: 'Ez',
    progress: 100,
    detail: 'Core rooms, route stability, mock Supabase fallback, and dedicated dashboards are now live.',
  },
  {
    title: 'Phase 2 - Commerce Intelligence',
    status: 'active',
    owner: 'Mahmoud',
    progress: 86,
    detail: 'WhatsApp, inventory, finance, sales intelligence, Google, customers, and reports are connected by Omnia AI.',
  },
  {
    title: 'Phase 3 - Automation Guardrails',
    status: 'guarded',
    owner: 'Mahmoud',
    progress: 74,
    detail: 'Owner approval remains required for discounts, access, refunds, BNPL, price changes, and broadcasts.',
  },
  {
    title: 'Phase 4 - Real Integrations',
    status: 'planned',
    owner: 'Ez',
    progress: 62,
    detail: 'Move from safe mock fallbacks to production API credentials for WhatsApp, stores, Google, and finance systems.',
  },
];

const orders = [
  {
    id: '#1284',
    customer: 'Mariam Al Harbi',
    product: 'LE Celestial Bridal Set',
    total: 'AED 4,200',
    source: 'WhatsApp',
    status: 'urgent',
    payment: 'finance pre-check',
    owner: 'Abdelrahman',
    next: 'Confirm Riyadh delivery before Thursday and protect one reserved set.',
  },
  {
    id: '#1283',
    customer: 'Noura Al Mansoori',
    product: 'Ruby Bangle for Ladies',
    total: 'AED 1,100',
    source: 'WhatsApp',
    status: 'pending',
    payment: 'bank transfer review',
    owner: 'Arslan',
    next: 'Verify screenshot, then confirm paid order and remove price objection notes.',
  },
  {
    id: '#1282',
    customer: 'Aisha Al Suwaidi',
    product: 'Moonstone Pendant for Ladies',
    total: 'AED 1,500',
    source: 'Shopify .ae',
    status: 'dispatch',
    payment: 'paid',
    owner: 'Ez',
    next: 'Route to courier after gift packaging confirmation.',
  },
  {
    id: '#1281',
    customer: 'Latifa Al Qasimi',
    product: 'VIP Eid private drop',
    total: 'AED 6,800',
    source: 'Private concierge',
    status: 'review',
    payment: 'owner approval',
    owner: 'Mahmoud',
    next: 'Confirm private drop allocation and keep discount language out of the flow.',
  },
];

const shipments = [
  {
    id: 'SHP-2418',
    customer: 'Mariam Al Harbi',
    destination: 'Riyadh, KSA',
    promise: 'Thursday before 18:00',
    courier: 'KSA Courier Partner',
    status: 'urgent',
    owner: 'Abdelrahman',
    next: 'Manual courier confirmation before payment promise.',
  },
  {
    id: 'SHP-2417',
    customer: 'Aisha Al Suwaidi',
    destination: 'Abu Dhabi, UAE',
    promise: 'Today 20:00',
    courier: 'Dubai same-day',
    status: 'dispatch',
    owner: 'Arslan',
    next: 'Attach gift-card note and proof-of-delivery request.',
  },
  {
    id: 'SHP-2416',
    customer: 'Noura Al Mansoori',
    destination: 'Dubai, UAE',
    promise: 'Tomorrow 12:00',
    courier: 'In-house driver',
    status: 'pending',
    owner: 'Ez',
    next: 'Release after finance verification.',
  },
];

const cashbackWallets = [
  {
    customer: 'Latifa Al Qasimi',
    tier: 'VIP Private Drop',
    balance: 'AED 1,240',
    status: 'owner',
    rule: 'Use cashback as concierge credit, not as public discount.',
  },
  {
    customer: 'Noura Al Mansoori',
    tier: 'Gold',
    balance: 'AED 640',
    status: 'active',
    rule: 'Eligible for gift wrap credit after bank transfer confirmation.',
  },
  {
    customer: 'Aisha Al Suwaidi',
    tier: 'Silver',
    balance: 'AED 220',
    status: 'active',
    rule: 'Offer after delivery certainty if she asks about price.',
  },
];

const geminiActions = [
  {
    title: 'Mine WhatsApp language into Google keyword clusters',
    status: 'running',
    owner: 'Ahmed',
    detail: 'Convert ladies bridal, Eid gift, and VIP privacy phrases into Search Console tasks.',
  },
  {
    title: 'Generate product FAQ copy for Google Merchant',
    status: 'queued',
    owner: 'Omnia AI',
    detail: 'Draft Arabic and English FAQ snippets for Moonstone, Ruby Bangle, Oud Royal, and Bridal Set.',
  },
  {
    title: 'Compare Google demand with inventory exposure',
    status: 'guarded',
    owner: 'Ez',
    detail: 'Stop campaigns when stock is low unless preorder wording is approved.',
  },
];

const meetings = [
  {
    title: 'Daily Owner Command Brief',
    time: 'Today 18:00',
    status: 'queued',
    attendees: 'Mahmoud, Ez, Omnia AI',
    output: 'Decisions on Ruby price, Moonstone reorder, and KSA bridal delivery.',
  },
  {
    title: 'WhatsApp Quality Review',
    time: 'Tomorrow 11:30',
    status: 'planned',
    attendees: 'Abdelrahman, Arslan, Mohamed',
    output: 'Arabic reply quality, female VIP handling, and stalled thread policy.',
  },
  {
    title: 'Google Growth Standup',
    time: 'Wednesday 15:00',
    status: 'planned',
    attendees: 'Ahmed, Ez, Omnia AI',
    output: 'Keyword mining, Merchant feed fixes, and product SEO queue.',
  },
];

const driveFiles = [
  {
    name: 'Ladies-only customer policy',
    room: 'Management',
    visibility: 'owner',
    updated: 'Today 10:12',
    status: 'approved',
  },
  {
    name: 'Ruby Bangle pricing evidence',
    room: 'Inventory',
    visibility: 'private',
    updated: 'Today 14:20',
    status: 'review',
  },
  {
    name: 'KSA courier SLA sheet',
    room: 'Shipping',
    visibility: 'team',
    updated: 'Yesterday 17:45',
    status: 'active',
  },
  {
    name: 'Eid private drop creative brief',
    room: 'Brand Intelligence',
    visibility: 'team',
    updated: 'Yesterday 12:10',
    status: 'active',
  },
];

const backyardItems = [
  {
    title: 'Eid readiness milestone',
    status: 'active',
    owner: 'Ahmed',
    detail: 'Campaign room, WhatsApp broadcast, private drop, and packaging tasks move together.',
  },
  {
    title: 'Operator recognition',
    status: 'planned',
    owner: 'Mahmoud',
    detail: 'Weekly shoutout for fastest verified recovery and best Arabic concierge response.',
  },
  {
    title: 'Training lane',
    status: 'active',
    owner: 'Abdelrahman',
    detail: 'Mohamed shadows live WhatsApp threads before receiving customer profile access.',
  },
];

export default function RoomPage({ params }: PageProps) {
  const router = useRouter();
  const room = getRoomBySlug(params.slug);
  const session = getSession();

  if (!room) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background text-foreground">
        <Card className="max-w-md p-8 text-center">
          <h1 className="mb-4 text-2xl font-serif font-medium">Room Not Found</h1>
          <p className="mb-6 text-muted-foreground">The room &quot;{params.slug}&quot; does not exist.</p>
          <Button onClick={() => router.back()}>Go Back</Button>
        </Card>
      </div>
    );
  }

  const Icon = room.icon;

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-20 border-b border-border bg-card/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-[1600px] items-center gap-4 px-6 py-4">
          <Button variant="ghost" size="icon" onClick={() => router.push('/house')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex-1">
            <div className="flex items-center gap-3">
              <Icon className="h-5 w-5 text-primary" />
              <h1 className="text-xl font-serif font-medium">{room.name}</h1>
              {room.badge?.count ? (
                <Badge variant="outline" className={room.badge.tone ? toneClasses[room.badge.tone] : undefined}>
                  {room.badge.count}
                </Badge>
              ) : null}
            </div>
            <p className="mt-1 text-sm text-muted-foreground">{room.description}</p>
          </div>
          <Badge variant="outline" className="hidden border-primary/30 bg-primary/10 text-primary md:inline-flex">
            {session.user.name} - {session.user.role}
          </Badge>
        </div>
      </header>

      <main className="mx-auto max-w-[1600px] px-6 py-6">
        <RoomContent room={room} />
      </main>
    </div>
  );
}

function RoomContent({ room }: { room: Room }) {
  switch (room.slug) {
    case 'milestone':
      return <MilestoneRoom />;
    case 'orders':
      return <OrdersRoom />;
    case 'shipping':
      return <ShippingRoom />;
    case 'cashback':
      return <CashbackRoom />;
    case 'gemini-room':
      return <GeminiRoom />;
    case 'meeting-room':
      return <MeetingRoom />;
    case 'drive-room':
      return <DriveRoom />;
    case 'team':
      return <TeamRoom />;
    case 'backyard':
      return <BackyardRoom />;
    case 'co-tasking':
      return <CoTaskingRoom />;
    case 'access-requests':
      return <AccessRequestsRoom />;
    case 'settings':
      return <SettingsRoom />;
    default:
      return <OperationalFallback room={room} />;
  }
}

function SummaryGrid({ metrics }: { metrics: Metric[] }) {
  return (
    <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      {metrics.map((metric) => {
        const Icon = metric.icon;
        return (
          <Card key={metric.label} className="border-border bg-card/70">
            <CardContent className="p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs uppercase tracking-wider text-muted-foreground">{metric.label}</p>
                  <p className="mt-2 text-3xl font-semibold">{metric.value}</p>
                </div>
                <Icon className={`h-5 w-5 ${metric.tone === 'bad' ? 'text-red-300' : metric.tone === 'warn' ? 'text-amber-300' : 'text-primary'}`} />
              </div>
              <p className="mt-3 text-sm text-muted-foreground">{metric.detail}</p>
            </CardContent>
          </Card>
        );
      })}
    </section>
  );
}

function StatusBadge({ status }: { status: string }) {
  return (
    <Badge variant="outline" className={statusClasses[status] || statusClasses.active}>
      {status}
    </Badge>
  );
}

function ActionCard({
  title,
  status,
  owner,
  detail,
  footer,
}: {
  title: string;
  status: string;
  owner: string;
  detail: string;
  footer?: string;
}) {
  return (
    <div className="rounded-md border border-border bg-background/50 p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-sm font-medium leading-snug">{title}</h3>
          <p className="mt-1 text-xs text-muted-foreground">Owner: {owner}</p>
        </div>
        <StatusBadge status={status} />
      </div>
      <p className="mt-4 text-sm text-muted-foreground">{detail}</p>
      {footer ? <p className="mt-4 rounded-md border border-primary/20 bg-primary/5 p-3 text-sm">{footer}</p> : null}
    </div>
  );
}

function MilestoneRoom() {
  return (
    <div className="space-y-6">
      <SummaryGrid
        metrics={[
          { label: 'System scope', value: '24 rooms', detail: 'Every rail option has an operating surface', icon: Map, tone: 'good' },
          { label: 'Customer rule', value: 'Ladies only', detail: ORG_PROFILE.customerRule, icon: ShieldCheck, tone: 'gold' },
          { label: 'Staff model', value: 'Male-led', detail: ORG_PROFILE.staffingRule, icon: Users, tone: 'info' },
          { label: 'Approval gates', value: '5 guarded', detail: 'Refunds, access, BNPL, price, and broadcasts', icon: LockKeyhole, tone: 'warn' },
        ]}
      />

      <section className="grid gap-6 xl:grid-cols-[1.25fr_.9fr]">
        <Card className="border-border bg-card/70">
          <CardHeader className="border-b border-border">
            <CardTitle className="flex items-center gap-2 text-base">
              <Map className="h-4 w-4 text-primary" />
              Build Milestones
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 p-4">
            {milestonePlan.map((phase) => (
              <div key={phase.title} className="rounded-md border border-border bg-background/50 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h2 className="text-sm font-medium">{phase.title}</h2>
                    <p className="mt-1 text-xs text-muted-foreground">Owner: {phase.owner}</p>
                  </div>
                  <StatusBadge status={phase.status} />
                </div>
                <Progress value={phase.progress} className="mt-4 h-1.5" />
                <p className="mt-3 text-sm text-muted-foreground">{phase.detail}</p>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="border-primary/25 bg-primary/5">
          <CardContent className="p-5">
            <div className="flex items-start gap-3">
              <Sparkles className="mt-1 h-5 w-5 text-primary" />
              <div>
                <h2 className="font-medium">What This House Does</h2>
                <p className="mt-2 text-sm text-muted-foreground">
                  Omnia AI watches the rooms, remembers policies, routes work to the right male operator, and stops at owner gates for sensitive decisions.
                </p>
                <p className="mt-2 text-sm text-muted-foreground">
                  Mock data is deliberately aligned to women customers because House of Omnia sells only to ladies.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}

function OrdersRoom() {
  const urgent = orders.filter((order) => order.status === 'urgent').length;
  const total = orders.reduce((sum, order) => sum + Number(order.total.replace(/[^\d]/g, '')), 0);

  return (
    <div className="space-y-6">
      <SummaryGrid
        metrics={[
          { label: 'Open orders', value: String(orders.length), detail: 'Cross-channel orders needing action', icon: CheckSquare, tone: 'info' },
          { label: 'Order value', value: `AED ${total.toLocaleString()}`, detail: 'Visible open order exposure', icon: CreditCard, tone: 'gold' },
          { label: 'Urgent bridal', value: String(urgent), detail: 'Riyadh delivery deadline before Thursday', icon: Clock3, tone: 'bad' },
          { label: 'Owner approvals', value: '1', detail: 'Private drop allocation and pricing guardrail', icon: LockKeyhole, tone: 'warn' },
        ]}
      />

      <Card className="border-border bg-card/70">
        <CardHeader className="border-b border-border">
          <CardTitle className="flex items-center gap-2 text-base">
            <PackageCheck className="h-4 w-4 text-primary" />
            Orders Command Queue
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 p-4">
          {orders.map((order) => (
            <div key={order.id} className="rounded-md border border-border bg-background/50 p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono text-xs text-muted-foreground">{order.id}</span>
                    <h2 className="font-medium">{order.customer}</h2>
                    <Badge variant="secondary">{order.source}</Badge>
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">{order.product}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-medium">{order.total}</span>
                  <StatusBadge status={order.status} />
                </div>
              </div>
              <div className="mt-4 grid gap-3 md:grid-cols-3">
                <div className="rounded-md border border-border bg-card/40 p-3 text-sm">
                  <p className="text-xs text-muted-foreground">Payment</p>
                  <p className="mt-1 font-medium">{order.payment}</p>
                </div>
                <div className="rounded-md border border-border bg-card/40 p-3 text-sm">
                  <p className="text-xs text-muted-foreground">Owner</p>
                  <p className="mt-1 font-medium">{order.owner}</p>
                </div>
                <div className="rounded-md border border-primary/20 bg-primary/5 p-3 text-sm">
                  <p className="text-xs text-muted-foreground">Next action</p>
                  <p className="mt-1">{order.next}</p>
                </div>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

function ShippingRoom() {
  return (
    <div className="space-y-6">
      <SummaryGrid
        metrics={[
          { label: 'Dispatch queue', value: String(shipments.length), detail: 'Shipments with active promises', icon: Truck, tone: 'info' },
          { label: 'KSA risk', value: '1 urgent', detail: 'Bridal deadline requires manual confirmation', icon: Clock3, tone: 'bad' },
          { label: 'Courier health', value: '73%', detail: 'KSA partner needs follow-up before promise', icon: Route, tone: 'warn' },
          { label: 'POD needed', value: '3', detail: 'Proof of delivery required on luxury orders', icon: BadgeCheck, tone: 'good' },
        ]}
      />
      <Card className="border-border bg-card/70">
        <CardHeader className="border-b border-border">
          <CardTitle className="flex items-center gap-2 text-base">
            <Truck className="h-4 w-4 text-primary" />
            Dispatch Board
          </CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 p-4 lg:grid-cols-3">
          {shipments.map((shipment) => (
            <ActionCard
              key={shipment.id}
              title={`${shipment.id} - ${shipment.customer}`}
              status={shipment.status}
              owner={shipment.owner}
              detail={`${shipment.destination} via ${shipment.courier}. Promise: ${shipment.promise}.`}
              footer={shipment.next}
            />
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

function CashbackRoom() {
  return (
    <div className="space-y-6">
      <SummaryGrid
        metrics={[
          { label: 'Active wallets', value: String(cashbackWallets.length), detail: 'Customer wallet records visible to concierge', icon: WalletCards, tone: 'good' },
          { label: 'VIP credit', value: 'AED 1,240', detail: 'Requires owner-approved private-drop use', icon: Gift, tone: 'gold' },
          { label: 'Guardrail', value: 'No public discount', detail: 'Cashback is positioned as service credit', icon: ShieldCheck, tone: 'warn' },
          { label: 'Ladies customers', value: '3', detail: 'All examples are women customers', icon: Users, tone: 'info' },
        ]}
      />
      <Card className="border-border bg-card/70">
        <CardHeader className="border-b border-border">
          <CardTitle className="flex items-center gap-2 text-base">
            <WalletCards className="h-4 w-4 text-primary" />
            Wallets And Cashback Rules
          </CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 p-4 lg:grid-cols-3">
          {cashbackWallets.map((wallet) => (
            <ActionCard
              key={wallet.customer}
              title={`${wallet.customer} - ${wallet.tier}`}
              status={wallet.status}
              owner="Mahmoud"
              detail={`Wallet balance: ${wallet.balance}`}
              footer={wallet.rule}
            />
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

function GeminiRoom() {
  return (
    <div className="space-y-6">
      <SummaryGrid
        metrics={[
          { label: 'Google AI actions', value: String(geminiActions.length), detail: 'Search, Merchant, and copy intelligence', icon: Bot, tone: 'info' },
          { label: 'Copy queue', value: '4 products', detail: 'Ladies product FAQ and product feed copy', icon: FileText, tone: 'good' },
          { label: 'Guarded campaigns', value: '1', detail: 'Low-stock campaigns need preorder approval', icon: ShieldCheck, tone: 'warn' },
          { label: 'Keyword source', value: 'WhatsApp', detail: 'Customer phrases mined from women buyers', icon: Globe2, tone: 'gold' },
        ]}
      />
      <section className="grid gap-6 xl:grid-cols-[1fr_.8fr]">
        <Card className="border-border bg-card/70">
          <CardHeader className="border-b border-border">
            <CardTitle className="flex items-center gap-2 text-base">
              <Bot className="h-4 w-4 text-primary" />
              Gemini Workspace
            </CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 p-4 lg:grid-cols-2">
            {geminiActions.map((action) => (
              <ActionCard key={action.title} {...action} />
            ))}
          </CardContent>
        </Card>
        <Card className="border-primary/25 bg-primary/5">
          <CardContent className="p-5">
            <h2 className="font-medium">Connected Google Jobs</h2>
            <div className="mt-4 space-y-3">
              {['Search Console keyword mining', 'Merchant feed copy', 'YouTube/Veo product prompt drafting', 'Inventory-aware campaign checks'].map((job) => (
                <div key={job} className="flex gap-2 text-sm text-muted-foreground">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-300" />
                  <span>{job}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}

function MeetingRoom() {
  return (
    <div className="space-y-6">
      <SummaryGrid
        metrics={[
          { label: 'Upcoming meetings', value: String(meetings.length), detail: 'Briefs and review rooms scheduled', icon: CalendarDays, tone: 'info' },
          { label: 'Decision topics', value: '6', detail: 'Price drift, reorder, finance, shipping, access, broadcast', icon: Mic, tone: 'gold' },
          { label: 'Follow-ups', value: '9', detail: 'Created for male operators by room', icon: CheckSquare, tone: 'good' },
          { label: 'Owner gates', value: '4', detail: 'Sensitive decisions are recorded and guarded', icon: LockKeyhole, tone: 'warn' },
        ]}
      />
      <Card className="border-border bg-card/70">
        <CardHeader className="border-b border-border">
          <CardTitle className="flex items-center gap-2 text-base">
            <Mic className="h-4 w-4 text-primary" />
            Meetings, Decisions, Follow-Ups
          </CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 p-4 lg:grid-cols-3">
          {meetings.map((meeting) => (
            <ActionCard
              key={meeting.title}
              title={`${meeting.title} - ${meeting.time}`}
              status={meeting.status}
              owner={meeting.attendees}
              detail={meeting.output}
            />
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

function DriveRoom() {
  return (
    <div className="space-y-6">
      <SummaryGrid
        metrics={[
          { label: 'Safe files', value: String(driveFiles.length), detail: 'Documents mapped to operating rooms', icon: HardDrive, tone: 'info' },
          { label: 'Owner-only', value: '2', detail: 'Private policy and pricing evidence', icon: LockKeyhole, tone: 'warn' },
          { label: 'Room corridors', value: '4', detail: 'Management, Inventory, Shipping, Brand', icon: Route, tone: 'good' },
          { label: 'Policy memory', value: '5', detail: 'Pinned AI rules backed by file context', icon: ShieldCheck, tone: 'gold' },
        ]}
      />
      <section className="grid gap-6 xl:grid-cols-[1.2fr_.8fr]">
        <Card className="border-border bg-card/70">
          <CardHeader className="border-b border-border">
            <CardTitle className="flex items-center gap-2 text-base">
              <HardDrive className="h-4 w-4 text-primary" />
              Safe Files
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 p-4">
            {driveFiles.map((file) => (
              <div key={file.name} className="rounded-md border border-border bg-background/50 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h2 className="text-sm font-medium">{file.name}</h2>
                    <p className="mt-1 text-xs text-muted-foreground">{file.room} - updated {file.updated}</p>
                  </div>
                  <StatusBadge status={file.status} />
                </div>
                <p className="mt-3 text-sm text-muted-foreground">Visibility: {file.visibility}</p>
              </div>
            ))}
          </CardContent>
        </Card>
        <Card className="border-border bg-card/70">
          <CardHeader className="border-b border-border">
            <CardTitle className="flex items-center gap-2 text-base">
              <Sparkles className="h-4 w-4 text-primary" />
              AI Memory Backing
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
      </section>
    </div>
  );
}

function TeamRoom() {
  const online = STAFF_ROSTER.filter((member) => member.online).length;
  const avgScore = Math.round(STAFF_ROSTER.reduce((sum, member) => sum + member.score, 0) / STAFF_ROSTER.length);

  return (
    <div className="space-y-6">
      <SummaryGrid
        metrics={[
          { label: 'Team members', value: String(STAFF_ROSTER.length), detail: 'Mostly male operating team', icon: Users, tone: 'info' },
          { label: 'Online now', value: String(online), detail: 'Available for routing', icon: CheckCircle2, tone: 'good' },
          { label: 'Average score', value: `${avgScore}%`, detail: 'Performance score used by Omnia AI routing', icon: BadgeCheck, tone: 'gold' },
          { label: 'Open workload', value: String(STAFF_ROSTER.reduce((sum, member) => sum + member.workload, 0)), detail: 'Active non-completed tasks', icon: CheckSquare, tone: 'warn' },
        ]}
      />
      <Card className="border-border bg-card/70">
        <CardHeader className="border-b border-border">
          <CardTitle className="flex items-center gap-2 text-base">
            <Users className="h-4 w-4 text-primary" />
            Team Command
          </CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 p-4 md:grid-cols-2 xl:grid-cols-3">
          {STAFF_ROSTER.map((member) => (
            <div key={member.id} className="rounded-md border border-border bg-background/50 p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{member.name}</span>
                    <span className={`h-2 w-2 rounded-full ${member.online ? 'bg-emerald-400' : 'bg-muted'}`} />
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground capitalize">{member.role.replace('_', ' ')} - {member.gender}</p>
                </div>
                <Badge variant="outline">{member.score}%</Badge>
              </div>
              <p className="mt-3 text-sm text-muted-foreground">{member.status}</p>
              <div className="mt-4 flex flex-wrap gap-1">
                {member.skills.map((skill) => (
                  <Badge key={skill} variant="secondary" className="text-[10px]">
                    {skill}
                  </Badge>
                ))}
              </div>
              <div className="mt-4 flex items-center justify-between text-xs text-muted-foreground">
                <span>Open workload</span>
                <span>{member.workload} tasks</span>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

function BackyardRoom() {
  return (
    <div className="space-y-6">
      <SummaryGrid
        metrics={[
          { label: 'Active culture lanes', value: String(backyardItems.length), detail: 'Events, recognition, and training', icon: Gift, tone: 'info' },
          { label: 'Training focus', value: 'Mohamed', detail: 'Onboarding through WhatsApp shadowing', icon: Users, tone: 'good' },
          { label: 'Next milestone', value: 'Eid', detail: 'Campaign and packaging readiness', icon: CalendarDays, tone: 'gold' },
          { label: 'Wellbeing guardrail', value: 'Visible', detail: 'Workload and recognition tracked together', icon: ShieldCheck, tone: 'warn' },
        ]}
      />
      <Card className="border-border bg-card/70">
        <CardHeader className="border-b border-border">
          <CardTitle className="flex items-center gap-2 text-base">
            <Gift className="h-4 w-4 text-primary" />
            Backyard Board
          </CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 p-4 lg:grid-cols-3">
          {backyardItems.map((item) => (
            <ActionCard key={item.title} {...item} />
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

function CoTaskingRoom() {
  const tasks = getAllTasks();
  const stalledTasks = tasks.filter((task) => task.status === 'stalled');
  const activeTasks = tasks.filter((task) => task.status === 'in_progress' || task.status === 'pending');

  return (
    <div className="space-y-6">
      <SummaryGrid
        metrics={[
          { label: 'Total tasks', value: String(tasks.length), detail: 'AI-created and human-owned work', icon: CheckSquare, tone: 'info' },
          { label: 'Active', value: String(activeTasks.length), detail: 'Pending or in progress', icon: Clock3, tone: 'warn' },
          { label: 'Stalled', value: String(stalledTasks.length), detail: 'Needs reroute or owner decision', icon: ShieldCheck, tone: stalledTasks.length ? 'bad' : 'good' },
          { label: 'AI routing', value: 'Live', detail: 'Assignee chosen by skill, workload, market, and urgency', icon: Bot, tone: 'gold' },
        ]}
      />
      <Card className="border-border bg-card/70">
        <CardHeader className="border-b border-border">
          <CardTitle className="flex items-center gap-2 text-base">
            <CheckSquare className="h-4 w-4 text-primary" />
            Co-Tasking Queue
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 p-4">
          {tasks.map((task) => {
            const assignee = AGENTS.find((agent) => agent.id === task.assignee_agent_id);
            return (
              <div key={task.id} className="rounded-md border border-border bg-background/50 p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h2 className="font-medium">{task.title}</h2>
                    <p className="mt-1 text-sm text-muted-foreground">{task.description}</p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <StatusBadge status={task.status === 'in_progress' ? 'active' : task.status} />
                    <StatusBadge status={task.priority} />
                  </div>
                </div>
                <div className="mt-4 grid gap-3 md:grid-cols-3">
                  <div className="rounded-md border border-border bg-card/40 p-3 text-sm">
                    <p className="text-xs text-muted-foreground">Assignee</p>
                    <p className="mt-1 font-medium">{assignee?.short_name || 'Unassigned'}</p>
                  </div>
                  <div className="rounded-md border border-border bg-card/40 p-3 text-sm">
                    <p className="text-xs text-muted-foreground">Deadline</p>
                    <p className="mt-1 font-medium">{task.deadline || 'No deadline'}</p>
                  </div>
                  <div className="rounded-md border border-primary/20 bg-primary/5 p-3 text-sm">
                    <p className="text-xs text-muted-foreground">AI reason</p>
                    <p className="mt-1">{task.ai_reasoning}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>
    </div>
  );
}

function AccessRequestsRoom() {
  return (
    <div className="space-y-6">
      <SummaryGrid
        metrics={[
          { label: 'Pending requests', value: String(ACCESS_REQUESTS.length), detail: 'Owner-reviewed permission changes', icon: KeyRound, tone: 'warn' },
          { label: 'Medium risk', value: String(ACCESS_REQUESTS.filter((request) => request.risk === 'medium').length), detail: 'Requires additional owner attention', icon: LockKeyhole, tone: 'bad' },
          { label: 'Low risk', value: String(ACCESS_REQUESTS.filter((request) => request.risk === 'low').length), detail: 'Read-only or narrow publish permissions', icon: ShieldCheck, tone: 'good' },
          { label: 'Guardrail', value: 'Manual', detail: 'No access is auto-approved by AI', icon: BadgeCheck, tone: 'gold' },
        ]}
      />
      <Card className="border-border bg-card/70">
        <CardHeader className="border-b border-border">
          <CardTitle className="flex items-center gap-2 text-base">
            <KeyRound className="h-4 w-4 text-primary" />
            Access Approval Queue
          </CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 p-4 lg:grid-cols-3">
          {ACCESS_REQUESTS.map((request) => (
            <ActionCard
              key={`${request.name}-${request.role}`}
              title={`${request.name} - ${request.role}`}
              status={request.risk === 'medium' ? 'review' : 'pending'}
              owner="Mahmoud"
              detail={request.reason}
              footer={`${request.risk.toUpperCase()} risk. AI can explain; owner must approve.`}
            />
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

function SettingsRoom() {
  const session = getSession();
  const rules = [
    ORG_PROFILE.customerRule,
    ORG_PROFILE.staffingRule,
    'Omnia AI can recommend, draft, route, and prepare actions, but sensitive decisions remain owner-approved.',
    'Use AED as the operating currency across commerce, finance, and reporting rooms.',
  ];

  return (
    <div className="space-y-6">
      <SummaryGrid
        metrics={[
          { label: 'Profile', value: session.user.name, detail: `${session.user.role} access`, icon: Settings, tone: 'gold' },
          { label: 'Organization', value: session.org.name, detail: `@${session.org.handle}`, icon: ShieldCheck, tone: 'info' },
          { label: 'Currency', value: ORG_PROFILE.currency, detail: 'Used across dashboards', icon: CreditCard, tone: 'good' },
          { label: 'Pinned rules', value: String(rules.length), detail: 'System behavior and mock-data rules', icon: LockKeyhole, tone: 'warn' },
        ]}
      />
      <section className="grid gap-6 xl:grid-cols-[.8fr_1.2fr]">
        <Card className="border-border bg-card/70">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div
                className="flex h-16 w-16 items-center justify-center rounded-full text-2xl font-medium text-white"
                style={{ backgroundColor: session.user.avatarColor }}
              >
                {session.user.name.charAt(0)}
              </div>
              <div>
                <h2 className="text-lg font-medium">{session.user.name}</h2>
                <p className="text-sm text-muted-foreground capitalize">{session.user.role}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border bg-card/70">
          <CardHeader className="border-b border-border">
            <CardTitle className="flex items-center gap-2 text-base">
              <ShieldCheck className="h-4 w-4 text-primary" />
              Operating Rules
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 p-4">
            {rules.map((rule) => (
              <div key={rule} className="flex gap-2 rounded-md border border-border bg-background/50 p-3 text-sm text-muted-foreground">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-300" />
                <span>{rule}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      </section>
    </div>
  );
}

function OperationalFallback({ room }: { room: Room }) {
  const relatedDecision = OMNIA_DECISIONS[0];
  const reorder = INVENTORY_REORDER_QUEUE[0];

  return (
    <div className="space-y-6">
      <SummaryGrid
        metrics={[
          { label: 'Room status', value: 'Active', detail: `${room.name} is connected to the command layer`, icon: room.icon, tone: 'good' },
          { label: 'AI decision', value: '1 linked', detail: relatedDecision.title, icon: Bot, tone: 'gold' },
          { label: 'Inventory signal', value: reorder.product, detail: reorder.forecast, icon: PackageCheck, tone: 'warn' },
          { label: 'Owner gate', value: 'Enabled', detail: 'Sensitive actions require approval', icon: LockKeyhole, tone: 'info' },
        ]}
      />
      <Card className="border-border bg-card/70">
        <CardContent className="p-6">
          <h2 className="font-medium">{room.name} Operating Surface</h2>
          <p className="mt-2 text-sm text-muted-foreground">{room.description}</p>
          <p className="mt-4 rounded-md border border-primary/20 bg-primary/5 p-3 text-sm">{relatedDecision.nextStep}</p>
        </CardContent>
      </Card>
    </div>
  );
}
