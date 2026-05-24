export type Session = {
  user: {
    id: string;
    name: string;
    role: 'owner' | 'admin' | 'whatsapp_manager' | 'whatsapp_agent' | 'marketing' | 'strategy' | 'finance';
    avatarColor: string;
  };
  org: {
    id: string;
    name: string;
    handle: string;
  };
};

export const MOCK_SESSION: Session = {
  user: {
    id: 'u_mahmoud',
    name: 'Mahmoud',
    role: 'owner',
    avatarColor: '#D4A574',
  },
  org: {
    id: 'o_omnia',
    name: 'House of Omnia',
    handle: 'omnia',
  },
};

export function getSession(): Session {
  return MOCK_SESSION;
}
