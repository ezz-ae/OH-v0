export type AgentKind = 'omnia' | 'member';

export type Agent = {
  id: string;
  kind: AgentKind;
  name: string;
  short_name: string;
  for_user_id?: string;
  for_user_role?: 'owner' | 'admin' | 'whatsapp_manager' | 'whatsapp_agent' | 'marketing' | 'strategy' | 'finance';
  avatar_color: string;
  online: boolean;
  status?: string;
  skills: string[];
  languages: string[];
  performance_score: number;
  level: number;
  xp: number;
  help_given_count: number;
  help_received_count: number;
};

export type AgentMessage = {
  id: string;
  agent_id: string;
  from: 'user' | 'agent';
  body: string;
  at: string;
  artifact?:
    | { kind: 'task_routed'; task: AgentTask }
    | { kind: 'memory_saved'; memory: AgentMemory }
    | { kind: 'note_sent'; note: AgentNote }
    | { kind: 'file_shared'; file: AgentFile }
    | { kind: 'stalled_warning'; task_id: string; suggestion: string };
};

export type AgentTask = {
  id: string;
  title: string;
  description?: string;
  creator_agent_id: string;
  assignee_agent_id: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  status: 'pending' | 'accepted' | 'in_progress' | 'completed' | 'stalled';
  ai_reasoning: string;
  deadline?: string;
  reminder_count: number;
  created_at: string;
  updated_at: string;
};

export type AgentMemory = {
  id: string;
  agent_id: string;
  memory_key: string;
  content: string;
  importance_score: number;
  pinned: boolean;
  created_at: string;
};

export type AgentNote = {
  id: string;
  from_agent_id: string;
  to_agent_id: string;
  body: string;
  category: 'customer' | 'ops' | 'strategy' | 'personal' | 'shared';
  at: string;
  read: boolean;
};

export type AgentFile = {
  id: string;
  name: string;
  mime_type: string;
  size_bytes: number;
  shared_by_agent_id: string;
  shared_with_agent_id: string;
  visibility: 'all' | 'role' | 'private';
  drive_id?: string;
  created_at: string;
};
