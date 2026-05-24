'use client';

import { useState, useRef, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { ROOMS, ROOM_GROUPS, type Room } from '@/lib/rooms';
import { mockAgentReply, getAgent } from '@/lib/agents/mock';
import type { AgentMessage } from '@/lib/agents/types';
import { Sparkles, Send, Loader2, ArrowRight, LogOut } from 'lucide-react';

const OMNIA_AGENT_ID = 'agent_omnia';

/**
 * Lobby — the entry into the platform after auth.
 *
 * Conversation with Omnia AI is the primary surface. The cool menu —
 * a horizontal pill rail of rooms with live status — sits below the
 * input, scrollable, not a wall of boxes.
 *
 * This is not a dashboard. There are no KPI tiles. There is a person
 * (Omnia) and there are doors (rooms). The middle of the page is the
 * conversation; the bottom is the menu.
 */
export default function LobbyPage() {
  const router = useRouter();
  const omnia = useMemo(() => getAgent(OMNIA_AGENT_ID)!, []);
  const [messages, setMessages] = useState<AgentMessage[]>([]);
  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-grow textarea
  useEffect(() => {
    const el = inputRef.current;
    if (el) {
      el.style.height = '0px';
      el.style.height = Math.min(el.scrollHeight, 120) + 'px';
    }
  }, [draft]);

  // Stay scrolled to latest
  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages.length]);

  async function send() {
    if (!draft.trim() || sending) return;
    const at = new Date().toLocaleTimeString('en-AE', { hour: '2-digit', minute: '2-digit', hour12: false });
    const userMsg: AgentMessage = { id: `u_${Date.now()}`, agent_id: OMNIA_AGENT_ID, from: 'user', body: draft, at };
    setMessages((arr) => [...arr, userMsg]);
    const text = draft;
    setDraft('');
    setSending(true);
    await new Promise((r) => setTimeout(r, 500));
    const reply = mockAgentReply(omnia, text);
    setMessages((arr) => [...arr, reply]);
    setSending(false);
  }

  function onKey(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  }

  function handleLogout() {
    if (typeof window !== 'undefined') {
      window.sessionStorage.removeItem('oh:door');
      window.location.href = '/';
    }
  }

  const greet = greetByHour();

  return (
    <div className="h-screen w-full overflow-hidden bg-background text-foreground flex flex-col font-sans">
      {/* Top Bar */}
      <header className="shrink-0 border-b border-border bg-card/50 backdrop-blur-sm">
        <div className="max-w-[1400px] mx-auto px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-lg font-serif font-medium text-foreground">House of Omnia</span>
            <span className="h-4 w-px bg-border" />
            <span className="text-xs text-muted-foreground uppercase tracking-wider">Command Center</span>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 px-3 h-8 rounded-md text-sm text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          >
            <LogOut className="w-4 h-4" />
            <span className="hidden sm:inline">Exit</span>
          </button>
        </div>
      </header>

      <main className="flex-1 min-h-0 flex flex-col">
        {/* Conversation area */}
        <div ref={scrollRef} className="flex-1 min-h-0 overflow-y-auto">
          <div className="max-w-2xl mx-auto px-6 py-12">
            {/* Greeting + Omnia status */}
            <div className="mb-8">
              <div className="text-xs uppercase tracking-wider text-muted-foreground mb-2">{greet}</div>
              <h1 className="text-3xl font-serif font-medium text-foreground mb-4 leading-tight tracking-tight">
                House of Omnia
              </h1>
              <div className="flex items-center gap-3 text-sm text-muted-foreground leading-relaxed flex-wrap">
                <span className="inline-flex items-center gap-2 px-2 h-6 rounded-full border border-primary/30 bg-primary/[0.06]">
                  <span className="relative flex w-1.5 h-1.5">
                    <span className="absolute inset-0 rounded-full bg-primary animate-ping opacity-60" />
                    <span className="relative w-1.5 h-1.5 rounded-full bg-primary" />
                  </span>
                  <span className="text-xs uppercase tracking-wider text-primary">Omnia AI · Online</span>
                </span>
                <span className="text-muted-foreground">Pick a room, or ask a question.</span>
              </div>
            </div>

            {/* Messages */}
            {messages.length > 0 && (
              <div className="space-y-3 mb-6">
                {messages.map((m) => (
                  <Message key={m.id} m={m} />
                ))}
                {sending && (
                  <div className="flex items-center gap-2 text-xs text-muted-foreground px-1">
                    <Loader2 className="w-3 h-3 animate-spin text-primary" />
                    Omnia is thinking...
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Compose */}
        <div className="shrink-0 px-6 pb-3 pt-2 bg-background">
          <div className="max-w-2xl mx-auto flex items-end gap-2">
            <textarea
              ref={inputRef}
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={onKey}
              placeholder="Ask Omnia AI"
              rows={1}
              className="flex-1 resize-none min-h-[44px] max-h-[120px] px-4 py-2.5 bg-card border border-border rounded-md text-sm leading-snug text-foreground placeholder:text-muted-foreground focus:border-primary/50 outline-none"
            />
            <button
              onClick={send}
              disabled={!draft.trim() || sending}
              className={`h-11 px-4 shrink-0 rounded-md text-sm font-medium flex items-center gap-2 transition-colors ${
                draft.trim() && !sending ? 'bg-primary text-primary-foreground hover:bg-primary/90' : 'bg-muted text-muted-foreground cursor-not-allowed'
              }`}
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Cool menu — horizontal rail of rooms with live status */}
        <RoomsRail onPick={(slug) => router.push(`/house/${slug}`)} />
      </main>
    </div>
  );
}

function Message({ m }: { m: AgentMessage }) {
  const isUser = m.from === 'user';
  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div className={`max-w-[80%] px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed whitespace-pre-line ${
        isUser
          ? 'bg-primary/10 text-foreground border border-primary/20 rounded-br-md'
          : 'bg-card text-foreground border border-border rounded-bl-md'
      }`}>
        {!isUser && (
          <div className="flex items-center gap-1.5 mb-1 text-xs uppercase tracking-wider text-primary">
            <Sparkles className="w-3 h-3" /> Omnia AI
          </div>
        )}
        {m.body}
      </div>
    </div>
  );
}

// ─── Cool menu — rooms rail ────────────────────────────────────────────────

function RoomsRail({ onPick }: { onPick: (slug: string) => void }) {
  // Group order matters: most-used first
  const groupOrder: Array<keyof typeof ROOM_GROUPS> = ['home', 'desk', 'commerce', 'intelligence', 'people', 'admin'];
  const grouped = groupOrder.flatMap((groupId) => {
    const groupInfo = ROOM_GROUPS[groupId];
    return ROOMS.filter((r) => r.group === groupId && r.slug !== 'house').map((r) => ({ ...r, groupLabel: groupInfo.name }));
  });

  return (
    <div className="shrink-0 border-t border-border bg-card/60 backdrop-blur-md">
      <div className="max-w-[1400px] mx-auto px-6 py-3">
        <div className="text-xs uppercase tracking-wider text-muted-foreground mb-2 flex items-center gap-2">
          <span>Rooms</span>
          <span className="text-border">·</span>
          <span className="text-muted-foreground/60">{grouped.length} doors</span>
        </div>
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          {grouped.map((r) => (
            <RoomPill key={r.slug} room={r} onClick={() => onPick(r.slug)} />
          ))}
        </div>
      </div>
    </div>
  );
}

function RoomPill({ room, onClick }: { room: Room & { groupLabel: string }; onClick: () => void }) {
  const Icon = room.icon;
  const badge = room.badge?.count && room.badge.count > 0 ? room.badge : null;
  const tone = badge ? (badge.tone || 'neutral') : 'neutral';
  const badgeClass =
    tone === 'bad' ? 'bg-destructive/20 text-destructive border-destructive/30' :
    tone === 'warn' ? 'bg-accent/20 text-accent border-accent/30' :
    tone === 'good' ? 'bg-primary/20 text-primary border-primary/30' :
    tone === 'gold' ? 'bg-accent/20 text-accent border-accent/30' :
    'bg-muted text-muted-foreground border-border';

  return (
    <button
      onClick={onClick}
      className="group flex items-center gap-2 px-3 h-9 rounded-md border border-border bg-card hover:border-primary/50 hover:bg-card/80 transition-all shrink-0"
    >
      <Icon className="w-3.5 h-3.5 text-muted-foreground group-hover:text-primary transition-colors" />
      <span className="text-sm text-muted-foreground group-hover:text-foreground whitespace-nowrap">
        {room.name}
      </span>
      {badge && (
        <span className={`text-xs font-mono px-1.5 h-4 rounded border flex items-center ${badgeClass}`}>
          {badge.count}
        </span>
      )}
      <ArrowRight className="w-3 h-3 text-border group-hover:text-primary opacity-0 group-hover:opacity-100 transition-opacity" />
    </button>
  );
}

function greetByHour(): string {
  const h = new Date().getHours();
  if (h < 5) return 'Late night';
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  if (h < 22) return 'Good evening';
  return 'Late night';
}
