'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { getRoomBySlug, ROOM_GROUPS, type Room } from '@/lib/rooms';
import { getAgent, getAllTasks, getMemoryForAgent, AGENTS } from '@/lib/agents';
import { getSession } from '@/lib/session';
import { ArrowLeft, Users, CheckSquare, Brain, AlertTriangle, TrendingUp, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface PageProps {
  params: {
    slug: string;
  };
}

export default function RoomPage({ params }: PageProps) {
  const router = useRouter();
  const room = getRoomBySlug(params.slug);
  const session = getSession();

  if (!room) {
    return (
      <div className="min-h-screen bg-background text-foreground flex items-center justify-center">
        <Card className="p-8 max-w-md text-center">
          <h1 className="text-2xl font-serif font-medium mb-4">Room Not Found</h1>
          <p className="text-muted-foreground mb-6">
            The room &quot;{params.slug}&quot; does not exist.
          </p>
          <Button onClick={() => router.back()}>Go Back</Button>
        </Card>
      </div>
    );
  }

  const Icon = room.icon;

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => router.push('/house')}
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div className="flex-1">
              <div className="flex items-center gap-3">
                <Icon className="w-5 h-5 text-primary" />
                <h1 className="text-xl font-serif font-medium">{room.name}</h1>
                {room.badge && (
                  <Badge
                    variant={room.badge.tone === 'bad' ? 'destructive' : room.badge.tone === 'warn' ? 'secondary' : 'default'}
                  >
                    {room.badge.count}
                  </Badge>
                )}
              </div>
              <p className="text-sm text-muted-foreground mt-1">{room.description}</p>
            </div>
            <div className="hidden md:flex items-center gap-2 text-sm text-muted-foreground">
              <span>{session.user.name}</span>
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: session.user.avatarColor }} />
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <RoomContent room={room} />
      </main>
    </div>
  );
}

function RoomContent({ room }: { room: Room }) {
  const tasks = getAllTasks();
  const memories = getMemoryForAgent('agent_omnia');
  const onlineAgents = AGENTS.filter(a => a.online);

  // Room-specific content based on slug
  switch (room.slug) {
    case 'team':
      return <TeamRoom agents={AGENTS} />;
    case 'co-tasking':
      return <CoTaskingRoom tasks={tasks} />;
    case 'omnia-ai':
      return <OmniaAIRoom memories={memories} />;
    case 'inventory':
      return <InventoryRoom />;
    case 'orders':
      return <OrdersRoom />;
    case 'whatsapp-desk':
      return <WhatsAppDeskRoom onlineAgents={onlineAgents} />;
    case 'brand-intelligence':
      return <BrandIntelligenceRoom />;
    case 'settings':
      return <SettingsRoom />;
    default:
      return <DefaultRoom room={room} />;
  }
}

// ─── Team Room ─────────────────────────────────────────────────────────────

function TeamRoom({ agents }: { agents: typeof AGENTS }) {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {agents.filter(a => a.kind === 'member').map((agent) => (
          <Card key={agent.id} className="p-6">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div 
                  className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium text-white"
                  style={{ backgroundColor: agent.avatar_color }}
                >
                  {agent.short_name.charAt(0)}
                </div>
                <div>
                  <h3 className="font-medium">{agent.short_name}</h3>
                  <p className="text-xs text-muted-foreground">{agent.for_user_role || 'Team Member'}</p>
                </div>
              </div>
              <span className={`w-2 h-2 rounded-full ${agent.online ? 'bg-primary' : 'bg-muted'}`} />
            </div>
            <p className="text-sm text-muted-foreground mb-3">{agent.status}</p>
            <div className="flex flex-wrap gap-1">
              {agent.skills.slice(0, 3).map((skill) => (
                <Badge key={skill} variant="secondary" className="text-xs">{skill}</Badge>
              ))}
            </div>
            <div className="mt-4 pt-4 border-t border-border flex items-center justify-between text-xs text-muted-foreground">
              <span>Level {agent.level}</span>
              <span>{agent.xp} XP</span>
              <span>Score: {Math.round(agent.performance_score * 100)}%</span>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

// ─── Co-Tasking Room ───────────────────────────────────────────────────────

function CoTaskingRoom({ tasks }: { tasks: ReturnType<typeof getAllTasks> }) {
  const stalledTasks = tasks.filter(t => t.status === 'stalled');
  const pendingTasks = tasks.filter(t => t.status === 'pending');
  const inProgressTasks = tasks.filter(t => t.status === 'in_progress');

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <CheckSquare className="w-5 h-5 text-primary" />
            <div>
              <p className="text-2xl font-bold">{tasks.length}</p>
              <p className="text-xs text-muted-foreground">Total Tasks</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <Clock className="w-5 h-5 text-muted-foreground" />
            <div>
              <p className="text-2xl font-bold">{pendingTasks.length}</p>
              <p className="text-xs text-muted-foreground">Pending</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <TrendingUp className="w-5 h-5 text-primary" />
            <div>
              <p className="text-2xl font-bold">{inProgressTasks.length}</p>
              <p className="text-xs text-muted-foreground">In Progress</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-destructive" />
            <div>
              <p className="text-2xl font-bold">{stalledTasks.length}</p>
              <p className="text-xs text-muted-foreground">Stalled</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Task List */}
      <Card>
        <div className="p-4 border-b border-border">
          <h2 className="font-semibold">Active Tasks</h2>
        </div>
        <div className="divide-y divide-border">
          {tasks.map((task) => (
            <div key={task.id} className="p-4 flex items-start gap-4">
              <div className={`w-2 h-2 mt-2 rounded-full ${
                task.status === 'stalled' ? 'bg-destructive' :
                task.status === 'in_progress' ? 'bg-primary' :
                task.priority === 'critical' ? 'bg-destructive' :
                task.priority === 'high' ? 'bg-accent' :
                'bg-muted'
              }`} />
              <div className="flex-1 min-w-0">
                <h3 className="font-medium">{task.title}</h3>
                {task.description && (
                  <p className="text-sm text-muted-foreground mt-1">{task.description}</p>
                )}
                <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                  <Badge variant="outline">{task.priority}</Badge>
                  <Badge variant="secondary">{task.status.replace('_', ' ')}</Badge>
                  {task.deadline && <span>Due: {task.deadline}</span>}
                </div>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

// ─── Omnia AI Room ─────────────────────────────────────────────────────────

function OmniaAIRoom({ memories }: { memories: ReturnType<typeof getMemoryForAgent> }) {
  return (
    <div className="space-y-6">
      <Card className="p-6">
        <div className="flex items-center gap-3 mb-4">
          <Brain className="w-6 h-6 text-primary" />
          <h2 className="text-lg font-semibold">Omnia AI Memory</h2>
        </div>
        <p className="text-sm text-muted-foreground mb-6">
          What Omnia AI remembers and uses to make decisions.
        </p>
        <div className="space-y-4">
          {memories.map((memory) => (
            <div key={memory.id} className="p-4 bg-muted/50 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <code className="text-xs text-primary">{memory.memory_key}</code>
                <div className="flex items-center gap-2">
                  {memory.pinned && <Badge variant="default">Pinned</Badge>}
                  <Badge variant="outline">Score: {memory.importance_score}</Badge>
                </div>
              </div>
              <p className="text-sm">{memory.content}</p>
              <p className="text-xs text-muted-foreground mt-2">{memory.created_at}</p>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

// ─── Inventory Room ────────────────────────────────────────────────────────

function InventoryRoom() {
  const mockProducts = [
    { sku: 'RB-001', title: 'Ruby Bangle', parity: 'drift', shopifyPrice: 950, wooPrice: 1100, delta: -13.6 },
    { sku: 'MP-002', title: 'Moonstone Pendant', parity: 'low_stock', shopifyPrice: 750, wooPrice: 750, qty: 3 },
    { sku: 'LC-003', title: 'LE Celestial Set', parity: 'ok', shopifyPrice: 2400, wooPrice: 2400, delta: 0 },
  ];

  return (
    <div className="space-y-6">
      <Card>
        <div className="p-4 border-b border-border flex items-center justify-between">
          <h2 className="font-semibold">Product Catalogue</h2>
          <Badge variant="destructive">3 Issues</Badge>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border text-left text-xs text-muted-foreground">
                <th className="p-4">SKU</th>
                <th className="p-4">Product</th>
                <th className="p-4">Shopify (.ae)</th>
                <th className="p-4">WooCommerce (.com)</th>
                <th className="p-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {mockProducts.map((product) => (
                <tr key={product.sku} className="text-sm">
                  <td className="p-4 font-mono text-xs">{product.sku}</td>
                  <td className="p-4 font-medium">{product.title}</td>
                  <td className="p-4">AED {product.shopifyPrice}</td>
                  <td className="p-4">AED {product.wooPrice}</td>
                  <td className="p-4">
                    <Badge variant={
                      product.parity === 'drift' ? 'destructive' :
                      product.parity === 'low_stock' ? 'secondary' : 'default'
                    }>
                      {product.parity === 'drift' ? `${product.delta}%` : 
                       product.parity === 'low_stock' ? `${product.qty} left` : 'OK'}
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

// ─── Orders Room ───────────────────────────────────────────────────────────

function OrdersRoom() {
  const mockOrders = [
    { id: '#1280', customer: 'Aisha M.', status: 'pending_refund', total: 1300, source: 'WhatsApp' },
    { id: '#1279', customer: 'Noura A.', status: 'awaiting_payment', total: 2150, source: 'WhatsApp' },
    { id: '#1278', customer: 'Mariam K.', status: 'processing', total: 4200, source: 'Shopify' },
  ];

  return (
    <div className="space-y-6">
      <Card>
        <div className="p-4 border-b border-border">
          <h2 className="font-semibold">Orders Queue</h2>
        </div>
        <div className="divide-y divide-border">
          {mockOrders.map((order) => (
            <div key={order.id} className="p-4 flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-sm">{order.id}</span>
                  <span className="font-medium">{order.customer}</span>
                </div>
                <p className="text-xs text-muted-foreground mt-1">via {order.source}</p>
              </div>
              <div className="flex items-center gap-4">
                <span className="font-medium">AED {order.total}</span>
                <Badge variant={
                  order.status === 'pending_refund' ? 'destructive' :
                  order.status === 'awaiting_payment' ? 'secondary' : 'default'
                }>
                  {order.status.replace('_', ' ')}
                </Badge>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

// ─── WhatsApp Desk Room ────────────────────────────────────────────────────

function WhatsAppDeskRoom({ onlineAgents }: { onlineAgents: typeof AGENTS }) {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="p-4">
          <p className="text-3xl font-bold">7</p>
          <p className="text-sm text-muted-foreground">Unclaimed chats</p>
        </Card>
        <Card className="p-4">
          <p className="text-3xl font-bold">23</p>
          <p className="text-sm text-muted-foreground">Closed today</p>
        </Card>
        <Card className="p-4">
          <p className="text-3xl font-bold">{onlineAgents.length}</p>
          <p className="text-sm text-muted-foreground">Agents online</p>
        </Card>
      </div>
      <Card className="p-6 text-center">
        <Users className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
        <h3 className="font-semibold mb-2">WhatsApp Integration</h3>
        <p className="text-sm text-muted-foreground">
          Connect to the WhatsApp Business API to manage conversations.
        </p>
      </Card>
    </div>
  );
}

// ─── Brand Intelligence Room ───────────────────────────────────────────────

function BrandIntelligenceRoom() {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="p-4">
          <p className="text-2xl font-bold">AED 87,420</p>
          <p className="text-sm text-muted-foreground">Revenue today</p>
          <p className="text-xs text-primary">+12.4% vs yesterday</p>
        </Card>
        <Card className="p-4">
          <p className="text-2xl font-bold">342</p>
          <p className="text-sm text-muted-foreground">Site visitors</p>
          <p className="text-xs text-primary">+8.2% vs yesterday</p>
        </Card>
        <Card className="p-4">
          <p className="text-2xl font-bold">3.2%</p>
          <p className="text-sm text-muted-foreground">Conversion rate</p>
          <p className="text-xs text-destructive">-0.4% vs yesterday</p>
        </Card>
        <Card className="p-4">
          <p className="text-2xl font-bold">AED 1,840</p>
          <p className="text-sm text-muted-foreground">Avg order value</p>
          <p className="text-xs text-primary">+5.1% vs yesterday</p>
        </Card>
      </div>
    </div>
  );
}

// ─── Settings Room ─────────────────────────────────────────────────────────

function SettingsRoom() {
  const session = getSession();

  return (
    <div className="max-w-2xl space-y-6">
      <Card className="p-6">
        <h2 className="font-semibold mb-4">Profile</h2>
        <div className="flex items-center gap-4 mb-6">
          <div 
            className="w-16 h-16 rounded-full flex items-center justify-center text-2xl font-medium text-white"
            style={{ backgroundColor: session.user.avatarColor }}
          >
            {session.user.name.charAt(0)}
          </div>
          <div>
            <p className="font-medium text-lg">{session.user.name}</p>
            <p className="text-sm text-muted-foreground capitalize">{session.user.role}</p>
          </div>
        </div>
        <div className="space-y-4">
          <div>
            <label className="text-sm text-muted-foreground">Organization</label>
            <p className="font-medium">{session.org.name}</p>
          </div>
          <div>
            <label className="text-sm text-muted-foreground">Handle</label>
            <p className="font-medium">@{session.org.handle}</p>
          </div>
        </div>
      </Card>
    </div>
  );
}

// ─── Default Room ──────────────────────────────────────────────────────────

function DefaultRoom({ room }: { room: Room }) {
  const Icon = room.icon;
  const router = useRouter();
  
  return (
    <Card className="p-12 text-center">
      <div className="inline-flex items-center justify-center w-16 h-16 rounded-lg bg-primary/10 mb-4">
        <Icon className="w-8 h-8 text-primary" />
      </div>
      <h2 className="text-xl font-semibold mb-2">{room.name}</h2>
      <p className="text-muted-foreground mb-8 max-w-md mx-auto">
        {room.description}
      </p>
      <Button onClick={() => router.push('/house')}>Return to House</Button>
    </Card>
  );
}
