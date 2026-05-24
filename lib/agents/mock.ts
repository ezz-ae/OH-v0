import type { Agent, AgentMessage, AgentTask, AgentMemory
} from './types';

export const AGENTS: Agent[] = [
  {
    id: 'agent_omnia',
    kind: 'omnia',
    name: 'Omnia AI',
    short_name: 'Omnia AI',
    avatar_color: '#10b981',
    online: true,
    status: 'reading across the rooms',
    skills: ['Reads every room', 'Routes work to the right person', 'Remembers what was decided'],
    languages: ['English', 'Arabic'],
    performance_score: 1.0,
    level: 99,
    xp: 0,
    help_given_count: 142,
    help_received_count: 0,
  },
  {
    id: 'agent_mahmoud',
    kind: 'member',
    name: 'Mahmoud · personal assistant',
    short_name: 'Mahmoud',
    for_user_id: 'u_mahmoud',
    avatar_color: '#C68A4E',
    online: true,
    status: 'signed in · House of Omnia',
    skills: ['Direction', 'Decisions', 'Brand voice'],
    languages: ['English', 'Arabic'],
    performance_score: 0.98,
    level: 15,
    xp: 1480,
    help_given_count: 36,
    help_received_count: 6,
  },
  {
    id: 'agent_ez',
    kind: 'member',
    name: 'Ez · personal assistant',
    short_name: 'Ez',
    for_user_id: 'u_ez',
    for_user_role: 'admin',
    avatar_color: '#D4A574',
    online: true,
    status: 'across the rooms',
    skills: ['Operations', 'Setup', 'Vendor coordination'],
    languages: ['English', 'Arabic'],
    performance_score: 0.93,
    level: 11,
    xp: 1020,
    help_given_count: 24,
    help_received_count: 18,
  },
  {
    id: 'agent_abdelrahman',
    kind: 'member',
    name: "Abdelrahman's Agent",
    short_name: 'Abdelrahman',
    for_user_id: 'u_abdelrahman',
    for_user_role: 'whatsapp_manager',
    avatar_color: '#7AA7D9',
    online: true,
    status: 'WhatsApp Desk · 9 closed today',
    skills: ['WhatsApp sales', 'customer recovery', 'Arabic', 'bridal flow', 'objection handling'],
    languages: ['Arabic', 'English'],
    performance_score: 0.92,
    level: 8,
    xp: 720,
    help_given_count: 41,
    help_received_count: 12,
  },
  {
    id: 'agent_arslan',
    kind: 'member',
    name: "Arslan's Agent",
    short_name: 'Arslan',
    for_user_id: 'u_arslan',
    for_user_role: 'whatsapp_agent',
    avatar_color: '#7CB87C',
    online: true,
    status: 'awaiting Noura A.',
    skills: ['WhatsApp sales', 'payment verification', 'COD ops'],
    languages: ['Arabic', 'English', 'Urdu'],
    performance_score: 0.86,
    level: 6,
    xp: 540,
    help_given_count: 18,
    help_received_count: 22,
  },
  {
    id: 'agent_abdallah',
    kind: 'member',
    name: "Abdallah's Agent",
    short_name: 'Abdallah',
    for_user_id: 'u_abdallah',
    for_user_role: 'whatsapp_agent',
    avatar_color: '#D9A75B',
    online: false,
    status: 'away · returns 16:00',
    skills: ['WhatsApp sales', 'product knowledge', 'KSA market'],
    languages: ['Arabic', 'English'],
    performance_score: 0.81,
    level: 5,
    xp: 410,
    help_given_count: 9,
    help_received_count: 15,
  },
  {
    id: 'agent_ahmed',
    kind: 'member',
    name: "Ahmed's Agent",
    short_name: 'Ahmed',
    for_user_id: 'u_ahmed',
    for_user_role: 'marketing',
    avatar_color: '#9E7BD9',
    online: false,
    status: 'offline',
    skills: ['content', 'Meta ads', 'SEO', 'campaign planning', 'Veo prompts'],
    languages: ['English', 'Arabic'],
    performance_score: 0.88,
    level: 7,
    xp: 640,
    help_given_count: 16,
    help_received_count: 8,
  },
  {
    id: 'agent_mohamed',
    kind: 'member',
    name: "Mohamed's Agent",
    short_name: 'Mohamed',
    for_user_id: 'u_mohamed',
    for_user_role: 'whatsapp_agent',
    avatar_color: '#5FB4A2',
    online: true,
    status: 'onboarding · WhatsApp Desk shadowing',
    skills: ['WhatsApp sales', 'customer service', 'Arabic'],
    languages: ['Arabic', 'English'],
    performance_score: 0.74,
    level: 3,
    xp: 180,
    help_given_count: 3,
    help_received_count: 9,
  },
];

export function getAgents(): Agent[] {
  return AGENTS;
}

export function getAgent(id: string): Agent | undefined {
  return AGENTS.find((a) => a.id === id);
}

const TASKS: AgentTask[] = [
  {
    id: 't1',
    title: 'Investigate ruby bangle price drift (-13.6%)',
    description: 'omniastores.ae shows AED 950, omniastores.com shows AED 1,100. Decide which is correct, update the other.',
    creator_agent_id: 'agent_omnia',
    assignee_agent_id: 'agent_abdelrahman',
    priority: 'high',
    status: 'in_progress',
    ai_reasoning: 'Abdelrahman has the highest WhatsApp Manager performance score (0.92) and direct visibility into customer price feedback.',
    deadline: 'today 18:00',
    reminder_count: 0,
    created_at: '2026-05-24 09:12',
    updated_at: '2026-05-24 14:21',
  },
  {
    id: 't2',
    title: 'Follow up Noura A. on bank transfer',
    description: 'Payment screenshot received. Verify and confirm.',
    creator_agent_id: 'agent_omnia',
    assignee_agent_id: 'agent_arslan',
    priority: 'medium',
    status: 'in_progress',
    ai_reasoning: 'Arslan already in the conversation. Assignment continuity preferred.',
    deadline: 'today 17:00',
    reminder_count: 0,
    created_at: '2026-05-24 13:48',
    updated_at: '2026-05-24 14:11',
  },
  {
    id: 't3',
    title: 'Resupply Moonstone Pendant (.ae)',
    description: 'Only 3 left, sold 24 in 7d.',
    creator_agent_id: 'agent_omnia',
    assignee_agent_id: 'agent_ez',
    priority: 'high',
    status: 'pending',
    ai_reasoning: 'Restock is a capex decision. Routing for review.',
    deadline: 'this week',
    reminder_count: 0,
    created_at: '2026-05-24 09:30',
    updated_at: '2026-05-24 09:30',
  },
  {
    id: 't8',
    title: 'KSA Riyadh wedding piece — Mariam K.',
    description: 'Bridal set, deadline Thursday. Push to Shopify .ae.',
    creator_agent_id: 'agent_omnia',
    assignee_agent_id: 'agent_abdallah',
    priority: 'critical',
    status: 'stalled',
    ai_reasoning: 'Abdallah has the KSA market skill + Arabic primary. Went offline before accepting — stalled.',
    deadline: 'Thursday',
    reminder_count: 2,
    created_at: '2026-05-24 10:20',
    updated_at: '2026-05-24 14:00',
  },
];

export function getTasksForAgent(agentId: string): AgentTask[] {
  return TASKS.filter((t) => t.assignee_agent_id === agentId || t.creator_agent_id === agentId);
}

export function getAllTasks(): AgentTask[] {
  return TASKS;
}

export function getStalledTasks(): AgentTask[] {
  return TASKS.filter((t) => t.status === 'stalled' || (t.reminder_count > 0 && t.status === 'pending'));
}

const MEMORIES: AgentMemory[] = [
  { id: 'm1', agent_id: 'agent_omnia', memory_key: 'eid_2026_strategy', content: 'Eid 2026 campaign launches 2026-05-30. Prep 2 weeks ahead (last year was late by 11 days for LE Celestial). Ahmed leads content, Abdelrahman seeds WhatsApp.', importance_score: 9, pinned: true, created_at: '2026-05-22 11:30' },
  { id: 'm2', agent_id: 'agent_omnia', memory_key: 'bnpl_decision', content: 'Tamara takes 15% + 30 days. Tabby 12% + 14 days. Decision still open — does BNPL fit a luxury brand?', importance_score: 7, pinned: true, created_at: '2026-05-20 16:05' },
  { id: 'm3', agent_id: 'agent_omnia', memory_key: 'ruby_bangle_drift', content: 'Ruby Bangle has persistent -13.6% drift between stores. Manual decision needed — likely a deliberate KSA price difference that was never documented.', importance_score: 8, pinned: true, created_at: '2026-05-24 09:12' },
];

export function getMemoryForAgent(agentId: string): AgentMemory[] {
  return MEMORIES.filter((m) => m.agent_id === agentId).sort((a, b) => b.importance_score - a.importance_score);
}

const REPLIES_BY_AGENT: Record<string, string[]> = {
  agent_omnia: [
    'Looking across rooms now. WhatsApp queue, parity drift, low-stock — anything specific you want me to dig into?',
    'I can route that to the right person. Want me to suggest the assignee?',
    "Saved that to memory. I'll surface it next time it's relevant.",
    "Watching. I'll raise it if anything changes.",
  ],
};

export function mockAgentReply(agent: Agent, _text: string): AgentMessage {
  const pool = REPLIES_BY_AGENT[agent.id] || REPLIES_BY_AGENT.agent_omnia;
  const body = pool[Math.floor(Math.random() * pool.length)];
  const at = new Date().toLocaleTimeString('en-AE', { hour: '2-digit', minute: '2-digit', hour12: false });
  return { id: `a_${Date.now()}`, agent_id: agent.id, from: 'agent', body, at };
}
